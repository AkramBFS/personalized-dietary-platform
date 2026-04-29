from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from .models import Country, Goal, Specialization
from .serializers import CountrySerializer , GoalSerializer , SpecializationSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from django.utils import timezone
from django.db.models import Q
import datetime

from users.models import User
from users.permissions import IsAdmin, IsClient
from nutritionist.models import Nutritionist
from marketplace.models import Plan, PlanModerationLog
from community.models import Post, Blog
from client.models import Client, PremiumSubscription
from notifications.utils import notify

from .serializers import (
    AdminUserSerializer,
    AdminUserDetailSerializer,
    AdminPlanSerializer,
    RejectPlanSerializer,
    AdminPostSerializer,
    AdminBlogSerializer,
    PurchaseSubscriptionSerializer,
    SubscriptionSerializer,
)


class CountryListView(ListAPIView):
    permission_classes = [AllowAny]
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    


class GoalListView(ListAPIView):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer
    permission_classes = [AllowAny]


class SpecializationListView(ListAPIView):
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = [AllowAny]

class ActivityLevelListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = [
            {"value": "sedentary",   "label": "Sedentary",   "description": "Little to no exercise"},
            {"value": "moderate",    "label": "Moderate",    "description": "3-4 days a week"},
            {"value": "very_active", "label": "Very Active", "description": "Daily intense training"},
        ]
        return Response({"status": "success", "data": data})


class DietListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = [
            {"value": "none",       "label": "None"},
            {"value": "omnivore",   "label": "Omnivore"},
            {"value": "vegetarian", "label": "Vegetarian"},
            {"value": "vegan",      "label": "Vegan"},
            {"value": "keto",       "label": "Keto"},
            {"value": "paleo",      "label": "Paleo"},
        ]
        return Response({"status": "success", "data": data})





# ── User Management ────────────────────────────────────────────────────────────

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by('-created_at')

        # Filters
        role      = request.query_params.get('role')
        is_active = request.query_params.get('is_active')
        search    = request.query_params.get('search')

        if role:
            users = users.filter(role=role)
        if is_active is not None:
            users = users.filter(is_active=is_active.lower() == 'true')
        if search:
            users = users.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search)
            )

        serializer = AdminUserSerializer(users, many=True)
        return Response({"status": "success", "data": serializer.data})


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"status": "error", "message": "User not found."}, status=404)

        serializer = AdminUserDetailSerializer(user)
        return Response({"status": "success", "data": serializer.data})


class AdminUserBanView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"status": "error", "message": "User not found."}, status=404)

        # Prevent admin from banning themselves
        if user == request.user:
            return Response({
                "status":  "error",
                "message": "You cannot ban your own account."
            }, status=400)

        is_banned       = request.data.get('is_banned', True)
        user.is_active  = not is_banned
        user.save()

        action  = "banned" if is_banned else "unbanned"
        notify(
            recipient   = user,
            sender      = request.user,
            title       = f'Account {action.capitalize()}',
            message     = f'Your account has been {action} by an administrator.',
            target_type = 'user',
            target_id   = user.id,
        )

        return Response({
            "status":  "success",
            "message": f"User {action} successfully.",
            "data":    AdminUserSerializer(user).data
        })


class AdminUserDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"status": "error", "message": "User not found."}, status=404)

        if user == request.user:
            return Response({
                "status":  "error",
                "message": "You cannot delete your own account."
            }, status=400)

        # Soft delete — preserve all data
        user.is_active = False
        user.save()

        # Also update client/nutritionist is_banned if exists
        if user.role == 'client':
            from client.models import Client
            Client.objects.filter(user=user).update(is_banned=False)
        elif user.role == 'nutritionist':
            from nutritionist.models import Nutritionist
            Nutritionist.objects.filter(user=user).update(is_approved=False)

        notify(
            recipient   = user,
            sender      = request.user,
            title       = 'Account Deactivated',
            message     = 'Your account has been deactivated by an administrator.',
            target_type = 'user',
            target_id   = user.id,
        )

        return Response({
            "status":  "success",
            "message": "User deactivated successfully. Data preserved."
        }, status=200)


# ── Plan Moderation ────────────────────────────────────────────────────────────

class AdminPlanListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        plans = Plan.objects.select_related(
            'creator__user', 'creator__specialization'
        ).order_by('-created_at')

        status_filter = request.query_params.get('status', 'pending')
        if status_filter:
            plans = plans.filter(status=status_filter)

        serializer = AdminPlanSerializer(plans, many=True)
        return Response({"status": "success", "data": serializer.data})


class AdminPlanDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            plan = Plan.objects.select_related(
                'creator__user', 'creator__specialization'
            ).get(id=pk)
        except Plan.DoesNotExist:
            return Response({"status": "error", "message": "Plan not found."}, status=404)

        serializer = AdminPlanSerializer(plan)
        return Response({"status": "success", "data": serializer.data})


class AdminPlanApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            plan = Plan.objects.get(id=pk)
        except Plan.DoesNotExist:
            return Response({"status": "error", "message": "Plan not found."}, status=404)

        plan.status = 'approved'
        plan.save()

        # Log moderation action
        PlanModerationLog.objects.create(
            plan   = plan,
            admin  = request.user,
            action = 'approved',
        )

        # Notify nutritionist
        notify(
            recipient   = plan.creator.user,
            sender      = request.user,
            title       = 'Plan Approved',
            message     = f'Your plan "{plan.title}" has been approved and is now live on the marketplace.',
            target_type = 'plan',
            target_id   = plan.id,
        )

        return Response({
            "status":  "success",
            "message": f'Plan "{plan.title}" approved successfully.',
            "data":    AdminPlanSerializer(plan).data
        })


class AdminPlanRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            plan = Plan.objects.get(id=pk)
        except Plan.DoesNotExist:
            return Response({"status": "error", "message": "Plan not found."}, status=404)

        serializer = RejectPlanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=400)

        plan.status = 'rejected'
        plan.save()

        # Log moderation action
        PlanModerationLog.objects.create(
            plan             = plan,
            admin            = request.user,
            action           = 'rejected',
            rejection_reason = serializer.validated_data['rejection_reason'],
        )

        # Notify nutritionist
        notify(
            recipient   = plan.creator.user,
            sender      = request.user,
            title       = 'Plan Rejected',
            message     = f'Your plan "{plan.title}" was rejected. Reason: {serializer.validated_data["rejection_reason"]}',
            target_type = 'plan',
            target_id   = plan.id,
        )

        return Response({
            "status":  "success",
            "message": f'Plan "{plan.title}" rejected.',
            "data":    AdminPlanSerializer(plan).data
        })


class AdminPlanArchiveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            plan = Plan.objects.get(id=pk)
        except Plan.DoesNotExist:
            return Response({"status": "error", "message": "Plan not found."}, status=404)

        plan.status = 'deleted'
        plan.save()

        PlanModerationLog.objects.create(
            plan   = plan,
            admin  = request.user,
            action = 'archived',
        )

        return Response({
            "status":  "success",
            "message": "Plan archived successfully."
        })


# ── Post Moderation ────────────────────────────────────────────────────────────

class AdminPostListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        posts = Post.objects.select_related('author').filter(
            status='draft'
        ).order_by('-created_at')

        serializer = AdminPostSerializer(posts, many=True)
        return Response({"status": "success", "data": serializer.data})


class AdminPostApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            post = Post.objects.get(id=pk)
        except Post.DoesNotExist:
            return Response({"status": "error", "message": "Post not found."}, status=404)

        post.is_approved = True
        post.status      = 'published'
        post.save()

        notify(
            recipient   = post.author,
            sender      = request.user,
            title       = 'Post Approved',
            message     = 'Your post has been approved and is now visible to the community.',
            target_type = 'post',
            target_id   = post.id,
        )

        return Response({
            "status": "success",
            "data":   AdminPostSerializer(post).data
        })


class AdminPostRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            post = Post.objects.get(id=pk)
        except Post.DoesNotExist:
            return Response({"status": "error", "message": "Post not found."}, status=404)

        post.is_approved = False
        post.status      = 'removed'
        post.save()

        notify(
            recipient   = post.author,
            sender      = request.user,
            title       = 'Post Rejected',
            message     = 'Your post did not meet community guidelines and was rejected.',
            target_type = 'post',
            target_id   = post.id,
        )

        return Response({
            "status": "success",
            "data":   AdminPostSerializer(post).data
        })


class AdminPostDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            post = Post.objects.get(id=pk)
        except Post.DoesNotExist:
            return Response({"status": "error", "message": "Post not found."}, status=404)

        post.delete()
        return Response({
            "status":  "success",
            "message": "Post deleted permanently."
        }, status=204)


# ── Blog Management ────────────────────────────────────────────────────────────

class AdminBlogCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = AdminBlogSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=400)

        blog = Blog.objects.create(
            admin   = request.user,
            title   = serializer.validated_data['title'],
            content = serializer.validated_data['content'],
        )

        return Response({
            "status": "success",
            "data":   AdminBlogSerializer(blog).data
        }, status=201)


class AdminBlogUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            blog = Blog.objects.get(id=pk)
        except Blog.DoesNotExist:
            return Response({"status": "error", "message": "Blog not found."}, status=404)

        if 'title' in request.data:
            blog.title = request.data['title']
        if 'content' in request.data:
            blog.content = request.data['content']
        blog.save()

        return Response({
            "status": "success",
            "data":   AdminBlogSerializer(blog).data
        })


class AdminBlogDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            blog = Blog.objects.get(id=pk)
        except Blog.DoesNotExist:
            return Response({"status": "error", "message": "Blog not found."}, status=404)

        blog.delete()
        return Response({
            "status":  "success",
            "message": "Blog deleted."
        }, status=204)


# ── Premium Subscriptions ──────────────────────────────────────────────────────

class SubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        subscription = PremiumSubscription.objects.filter(
            client = client,
            status = 'active',
        ).order_by('-start_date').first()

        if not subscription:
            return Response({
                "status": "success",
                "data": {
                    "is_premium": False,
                    "subscription": None,
                }
            })

        return Response({
            "status": "success",
            "data": {
                "is_premium":   True,
                "subscription": SubscriptionSerializer(subscription).data,
            }
        })


class SubscriptionPurchaseView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        serializer = PurchaseSubscriptionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=400)

        plan_type          = serializer.validated_data['plan_type']
        amount_paid        = serializer.validated_data['amount_paid']
        transaction_number = serializer.validated_data['transaction_number']

        # Check duplicate transaction
        if PremiumSubscription.objects.filter(
            transaction_number=transaction_number
        ).exists():
            return Response({
                "status":  "error",
                "message": "Transaction number already used.",
            }, status=409)

        # Calculate end date
        
        from django.utils import timezone
        start_date = timezone.now()
        if plan_type == 'monthly':
            end_date = timezone.now() + datetime.timedelta(days=30)
        else:
            end_date = timezone.now() + datetime.timedelta(days=365)

        # Expire any existing active subscriptions
        PremiumSubscription.objects.filter(
            client=client, status='active'
        ).update(status='expired')

        # Create new subscription
        subscription = PremiumSubscription.objects.create(
            client             = client,
            plan_type          = plan_type,
            amount_paid        = amount_paid,
            transaction_number = transaction_number,
            start_date         = start_date,
            end_date           = end_date,
            status             = 'active',
        )

        # Update client is_premium flag
        client.is_premium = True
        client.save()

        return Response({
            "status": "success",
            "data":   SubscriptionSerializer(subscription).data
        }, status=201)

# In admin_panel/views.py — ADD this import at the top:
from nutritionist.models import Language


class LanguageListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = list(Language.objects.values('id', 'name').order_by('name'))
        return Response({"status": "success", "data": data})
    


# ── Admin Inquiries ────────────────────────────────────────────────────────────

class AdminInquiryListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from community.models import FeedbackToAdmin

        inquiries = FeedbackToAdmin.objects.select_related(
            'user'
        ).order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter in ['open', 'resolved']:
            inquiries = inquiries.filter(status=status_filter)

        data = [
            {
                "id":             i.id,
                "user_id":        i.user.id,
                "username":       i.user.username,
                "subject":        i.subject,
                "message":        i.message,
                "admin_response": i.admin_response,
                "status":         i.status,
                "created_at":     i.created_at,
            }
            for i in inquiries
        ]

        return Response({"status": "success", "data": data})


class AdminInquiryDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        from community.models import FeedbackToAdmin

        try:
            inquiry = FeedbackToAdmin.objects.select_related('user').get(id=pk)
        except FeedbackToAdmin.DoesNotExist:
            return Response({"status": "error", "message": "Inquiry not found."}, status=404)

        return Response({
            "status": "success",
            "data": {
                "id":             inquiry.id,
                "username":       inquiry.user.username,
                "subject":        inquiry.subject,
                "message":        inquiry.message,
                "admin_response": inquiry.admin_response,
                "status":         inquiry.status,
                "created_at":     inquiry.created_at,
            }
        })


class AdminInquiryRespondView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from community.models import FeedbackToAdmin
        from notifications.utils import notify

        try:
            inquiry = FeedbackToAdmin.objects.select_related('user').get(id=pk)
        except FeedbackToAdmin.DoesNotExist:
            return Response({"status": "error", "message": "Inquiry not found."}, status=404)

        admin_response = request.data.get('admin_response')
        if not admin_response:
            return Response({
                "status":  "error",
                "message": "admin_response is required."
            }, status=400)

        inquiry.admin_response = admin_response
        inquiry.status         = request.data.get('status', 'resolved')
        inquiry.save()

        # Notify the client
        notify(
            recipient   = inquiry.user,
            sender      = request.user,
            title       = 'Support Ticket Resolved',
            message     = f'Your inquiry "{inquiry.subject}" has been responded to.',
            target_type = 'inquiry',
            target_id   = inquiry.id,
        )

        return Response({
            "status": "success",
            "data": {
                "id":             inquiry.id,
                "admin_response": inquiry.admin_response,
                "status":         inquiry.status,
            }
        })