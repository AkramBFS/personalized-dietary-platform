from rest_framework import serializers
from .models import Plan, UserPlan, Invoice, Consultation
from nutritionist.models import Nutritionist, NutritionistAvailability, NutritionistHoliday
from nutritionist.serializers import AvailabilitySerializer


# ── Plan ───────────────────────────────────────────────────────────────────────

class PlanListSerializer(serializers.ModelSerializer):
    nutritionist_username    = serializers.CharField(source='creator.user.username', read_only=True)
    nutritionist_id          = serializers.IntegerField(source='creator.nutritionist_id', read_only=True)
    specialization_name      = serializers.CharField(source='creator.specialization.name', read_only=True)

    class Meta:
        model  = Plan
        fields = [
            'id', 'title', 'description',
            'plan_type', 'status',
            'price', 'duration_days',
            'free_consultations_per_week',
            'rating_avg', 'cover_image_url',
            'nutritionist_id', 'nutritionist_username',
            'specialization_name',
            'created_at',
        ]


class PlanDetailSerializer(serializers.ModelSerializer):
    nutritionist_username = serializers.CharField(source='creator.user.username', read_only=True)
    nutritionist_id       = serializers.IntegerField(source='creator.nutritionist_id', read_only=True)
    specialization_name   = serializers.CharField(source='creator.specialization.name', read_only=True)
    country_name          = serializers.CharField(source='creator.country.name', read_only=True)
    content_json          = serializers.SerializerMethodField()   

    class Meta:
        model  = Plan
        fields = [
            'id', 'title', 'description',
            'plan_type', 'status',
            'price', 'duration_days',
            'free_consultations_per_week',
            'rating_avg', 'cover_image_url',
            'content_json',
            'nutritionist_id', 'nutritionist_username',
            'specialization_name', 'country_name',
            'created_at',
        ]

    def get_content_json(self, obj):       
        if isinstance(obj.content_json, (list, dict)):
            return obj.content_json
        if isinstance(obj.content_json, str):
            import json
            try:
                return json.loads(obj.content_json)
            except (json.JSONDecodeError, TypeError):
                return obj.content_json
        return obj.content_json


# ── Nutritionist Directory ─────────────────────────────────────────────────────

class NutritionistDirectorySerializer(serializers.ModelSerializer):
    username            = serializers.CharField(source='user.username', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)
    country_name        = serializers.CharField(source='country.name', read_only=True)
    languages           = serializers.SerializerMethodField()

    class Meta:
        model  = Nutritionist
        fields = [
            'nutritionist_id', 'username',
            'profile_photo_url', 'bio',
            'years_experience', 'consultation_price',
            'specialization_name', 'country_name',
            'languages', 'rating',
        ]

    def get_languages(self, obj):
        return list(
            obj.nutritionistlanguage_set.values_list('language__name', flat=True)
        )


# ── Purchase ───────────────────────────────────────────────────────────────────

class PurchasePlanSerializer(serializers.Serializer):
    transaction_number = serializers.CharField()
    amount_paid        = serializers.FloatField(min_value=0)


# ── UserPlan ───────────────────────────────────────────────────────────────────

class UserPlanSerializer(serializers.ModelSerializer):
    plan_title       = serializers.CharField(source='plan.title', read_only=True)
    plan_cover       = serializers.CharField(source='plan.cover_image_url', read_only=True)
    plan_duration    = serializers.IntegerField(source='plan.duration_days', read_only=True)
    progress_percent = serializers.FloatField(read_only=True)

    class Meta:
        model  = UserPlan
        fields = [
            'id', 'plan', 'plan_title',
            'plan_cover', 'plan_duration',
            'current_day_index', 'progress_percent',
            'status', 'free_consultations_used',
            'purchased_at',
        ]


# ── Availability Slot ──────────────────────────────────────────────────────────

class AvailabilitySlotSerializer(serializers.Serializer):
    start_time = serializers.TimeField()
    end_time   = serializers.TimeField()