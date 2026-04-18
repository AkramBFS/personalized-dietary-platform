from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from users.permissions import IsAdmin
from .models import Nutritionist
from .serializers import PendingNutritionistSerializer, NutritionistDetailSerializer
from rest_framework.permissions import IsAuthenticated


    

class PendingNutritionistListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = Nutritionist.objects.filter(
            approval_status='pending'
        ).select_related('user', 'specialization')

        serializer = PendingNutritionistSerializer(qs, many=True)
        return Response({'status': 'success', 'data': serializer.data})


class NutritionistDetailAdminView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        nutritionist = get_object_or_404(
            Nutritionist.objects.select_related('user', 'specialization', 'country'),
            pk=pk
        )
        serializer = NutritionistDetailSerializer(nutritionist)
        return Response({'status': 'success', 'data': serializer.data})


class ApproveNutritionistView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        nutritionist = get_object_or_404(Nutritionist, pk=pk)

        nutritionist.approval_status = 'approved'
        nutritionist.is_approved     = True
        nutritionist.save()

        user           = nutritionist.user
        user.is_active = True
        user.save()

        # TODO Day 10: replace with your notify() utility
        # notify(
        #     recipient=user,
        #     sender=request.user,
        #     title="Account Approved",
        #     message="Your nutritionist account has been approved. You can now log in.",
        #     target_type="nutritionist",
        #     target_id=nutritionist.nutritionist_id,
        # )

        return Response({
            'status': 'success',
            'data': {
                'user': {'id': user.id},
                'nutritionist': {'approval_status': 'approved'},
                'message': 'Nutritionist account approved successfully.',
            }
        }, status=status.HTTP_200_OK)


class RejectNutritionistView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        nutritionist = get_object_or_404(Nutritionist, pk=pk)
        reason       = request.data.get('rejection_reason', '').strip()

        if not reason:
            return Response(
                {'status': 'error', 'message': 'rejection_reason is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nutritionist.approval_status  = 'rejected'
        nutritionist.is_approved      = False
        nutritionist.rejection_reason = reason
        nutritionist.save()

        user           = nutritionist.user
        user.is_active = False
        user.save()

        # TODO Day 10: notify()

        return Response({
            'status': 'success',
            'data': {
                'user': {'id': user.id},
                'nutritionist': {
                    'approval_status':  'rejected',
                    'rejection_reason': reason,
                },
                'message': 'Nutritionist account rejected.',
            }
        }, status=status.HTTP_200_OK)


class ReReviewNutritionistView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        nutritionist = get_object_or_404(Nutritionist, pk=pk)

        nutritionist.approval_status  = 'pending'
        nutritionist.rejection_reason = None
        nutritionist.save()

        return Response({
            'status': 'success',
            'data': {
                'nutritionist': {'approval_status': 'pending'},
                'message': 'Nutritionist moved back to pending review.',
            }
        }, status=status.HTTP_200_OK)