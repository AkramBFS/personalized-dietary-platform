import mimetypes
import os
from pathlib import Path
from urllib.parse import unquote

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from client.models import Client
from nutritionist.models import Nutritionist, NutritionistPatient
from marketplace.models import Plan

DEFAULT_PUBLIC_ASSETS = {
    'default_avatar.png',
    'default_nutri.png',
    'default_plan_cover.jpg',
}

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.pdf'}
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

CONTENT_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
}


def _is_staff_user(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    return bool(user.is_staff or getattr(user, 'role', '') in ('admin', 'high_admin'))


class AuthoritativeMediaServeView(APIView):
    """
    Authoritative, proxy-aware media serving endpoint enforcing access tiers,
    strict path canonicalization, traversal rejection, and defensive security headers.
    """
    permission_classes = [AllowAny]  # Tier checks handle authentication per resource

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.user and request.user.is_authenticated:
            from nutriplatform.middleware.rls import set_rls_context
            set_rls_context(request.user)

    def get(self, request, file_path: str):
        # 1. Traversal & null-byte rejection
        raw_path = file_path
        if '\x00' in raw_path or '%00' in raw_path:
            return Response({'error': 'Invalid path.'}, status=status.HTTP_400_BAD_REQUEST)

        decoded = unquote(raw_path)
        if '\\' in decoded or '..' in decoded or decoded.startswith('/') or decoded.startswith('\\'):
            return Response({'error': 'Invalid path traversal detected.'}, status=status.HTTP_400_BAD_REQUEST)

        clean_path = decoded.strip().lstrip('/')
        media_root = Path(settings.MEDIA_ROOT).resolve()

        try:
            target_file = (media_root / clean_path).resolve()
        except Exception:
            return Response({'error': 'Invalid path.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce sandbox within MEDIA_ROOT
        if not str(target_file).startswith(str(media_root)):
            return Response({'error': 'Path outside media root.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Hard block private prefixes
        if clean_path.startswith('ai_logs/') or clean_path == 'ai_logs':
            raise Http404("Not found")

        # 3. Extension check
        ext = target_file.suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise Http404("Unsupported file extension.")

        # 4. Check file existence on disk
        if not target_file.is_file():
            raise Http404("File not found.")

        # 5. Access Tiers
        content_type = CONTENT_TYPES.get(ext, 'application/octet-stream')
        cache_control = 'private, no-cache'
        content_disposition = 'inline'

        # Tier 1: Default public placeholder assets
        if clean_path in DEFAULT_PUBLIC_ASSETS:
            cache_control = 'public, max-age=86400'

        # Tier 2: Public nutritionist profile photos
        elif clean_path.startswith('profiles/nutritionists/'):
            if ext not in IMAGE_EXTENSIONS:
                raise Http404("Invalid format for profile photo.")
            cache_control = 'public, max-age=86400'

        # Tier 3: Client Avatars (Authenticated: Owner, Assigned Nutritionist, Staff)
        elif clean_path.startswith('profiles/clients/'):
            if ext not in IMAGE_EXTENSIONS:
                raise Http404("Invalid format for avatar.")
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

            if not _is_staff_user(request.user):
                # Explicit check 1: Owner
                is_owner = Client.objects.filter(user=request.user, profile_photo_url=clean_path).exists()
                # Explicit check 2: Assigned Nutritionist
                is_assigned = NutritionistPatient.objects.filter(
                    nutritionist__user=request.user,
                    client__profile_photo_url=clean_path,
                ).exists()

                if not (is_owner or is_assigned):
                    return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

            cache_control = 'private, no-cache'

        # Tier 4: Plan Covers (Public for public-predefined; Authenticated for private-custom)
        elif clean_path.startswith('plans/covers/'):
            if ext not in IMAGE_EXTENSIONS:
                raise Http404("Invalid format for plan cover.")

            plan = Plan.objects.filter(cover_image_url=clean_path).first()
            if not plan:
                # File exists on disk but no active plan references it
                if not _is_staff_user(request.user):
                    raise Http404("Plan not found.")
                cache_control = 'private, no-cache'
            else:
                if plan.plan_type == 'public-predefined' and plan.status == 'approved':
                    cache_control = 'public, max-age=86400'
                else:
                    if not request.user.is_authenticated:
                        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
                    if not _is_staff_user(request.user):
                        is_target_client = bool(plan.target_client and plan.target_client.user == request.user)
                        is_creator_nutri = bool(plan.creator and plan.creator.user == request.user)
                        is_assigned_nutri = bool(
                            plan.target_client and NutritionistPatient.objects.filter(
                                nutritionist__user=request.user,
                                client=plan.target_client,
                            ).exists()
                        )
                        if not (is_target_client or is_creator_nutri or is_assigned_nutri):
                            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
                    cache_control = 'private, no-cache'

        # Tier 5: Community Posts (Requires Login)
        elif clean_path.startswith('posts/'):
            if ext not in IMAGE_EXTENSIONS:
                raise Http404("Invalid format for post image.")
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            cache_control = 'private, no-cache'

        # Tier 6: Certifications (Authenticated: Owning Nutritionist or Staff ONLY; Attachment)
        elif clean_path.startswith('certifications/'):
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

            if not _is_staff_user(request.user):
                is_owner = Nutritionist.objects.filter(user=request.user, cert_image_url=clean_path).exists()
                if not is_owner:
                    return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

            cache_control = 'private, no-cache'
            content_disposition = f'attachment; filename="certification{ext}"'

        else:
            raise Http404("Prefix not allowed.")

        # 6. Stream file response with security headers
        response = FileResponse(open(target_file, 'rb'), content_type=content_type)
        response['X-Content-Type-Options'] = 'nosniff'
        response['Content-Security-Policy'] = "default-src 'none'; sandbox"
        response['Cache-Control'] = cache_control
        response['Content-Disposition'] = content_disposition
        return response
