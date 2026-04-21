# admin_panel/serializers.py
from rest_framework import serializers
from .models import Country, Goal, Specialization
from rest_framework import serializers
from users.models import User
from nutritionist.models import Nutritionist
from marketplace.models import Plan
from community.models import Post
from client.models import PremiumSubscription, Client

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name']

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ['id', 'name']

class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'name']





# ── User Management ────────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email',
            'role', 'is_active', 'created_at',
        ]


class AdminUserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email',
            'role', 'is_active',
            'is_staff', 'created_at',
        ]


# ── Plan Moderation ────────────────────────────────────────────────────────────

class AdminPlanSerializer(serializers.ModelSerializer):
    creator_username    = serializers.CharField(source='creator.user.username', read_only=True)
    specialization_name = serializers.CharField(source='creator.specialization.name', read_only=True)

    class Meta:
        model  = Plan
        fields = [
            'id', 'title', 'description',
            'plan_type', 'status', 'price',
            'duration_days', 'rating_avg',
            'creator_username', 'specialization_name',
            'created_at',
        ]


class RejectPlanSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField()


# ── Post Moderation ────────────────────────────────────────────────────────────

class AdminPostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model  = Post
        fields = [
            'id', 'author_username',
            'content', 'image_url',
            'status', 'is_approved',
            'created_at',
        ]


# ── Blog ───────────────────────────────────────────────────────────────────────

class AdminBlogSerializer(serializers.ModelSerializer):
    class Meta:
        from community.models import Blog
        model  = Blog
        fields = ['id', 'title', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']


# ── Subscription ───────────────────────────────────────────────────────────────

class PurchaseSubscriptionSerializer(serializers.Serializer):
    PLAN_TYPES = ['monthly', 'yearly']

    plan_type          = serializers.ChoiceField(choices=PLAN_TYPES)
    amount_paid        = serializers.FloatField(min_value=0)
    transaction_number = serializers.CharField()


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PremiumSubscription
        fields = [
            'id', 'plan_type', 'amount_paid',
            'transaction_number',
            'start_date', 'end_date', 'status',
        ]