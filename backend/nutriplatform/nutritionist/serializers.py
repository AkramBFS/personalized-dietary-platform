from rest_framework import serializers
from .models import Nutritionist
from .models import (
    Nutritionist, Language,
    NutritionistAvailability,
    NutritionistHoliday,
)


class PendingNutritionistSerializer(serializers.ModelSerializer):
    id           = serializers.IntegerField(source='user.id')
    username     = serializers.CharField(source='user.username')
    email        = serializers.CharField(source='user.email')
    created_at = serializers.DateTimeField(source='user.created_at')
    specialization_name = serializers.CharField(source='specialization.name', default=None)

    class Meta:
        model  = Nutritionist
        fields = [
            'id', 'username', 'email',
            'nutritionist_id', 'specialization_name',
            'years_experience', 'certification_ref',
            'cert_image_url', 'approval_status', 'created_at',
        ]

class NutritionistDetailSerializer(serializers.ModelSerializer):
    id           = serializers.IntegerField(source='user.id')
    username     = serializers.CharField(source='user.username')
    email        = serializers.CharField(source='user.email')
    created_at = serializers.DateTimeField(source='user.created_at')
    specialization_name = serializers.CharField(source='specialization.name', default=None)
    country_name = serializers.CharField(source='country.name', default=None)
    languages    = serializers.SerializerMethodField()

    class Meta:
        model  = Nutritionist
        fields = [
            'id', 'username', 'email',
            'nutritionist_id', 'specialization_name', 'country_name',
            'years_experience', 'consultation_price', 'bio',
            'certification_ref', 'cert_image_url',
            'approval_status', 'rejection_reason',
            'languages', 'created_at',
        ]

    def get_languages(self, obj):
        return list(
            obj.nutritionistlanguage_set.values_list('language__name', flat=True)
        )
# nutritionist/serializers.py
from .models import Language

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ['id', 'name']    


# ── Profile ────────────────────────────────────────────────────────────────────

class NutritionistProfileSerializer(serializers.ModelSerializer):
    username           = serializers.CharField(source='user.username', read_only=True)
    email              = serializers.CharField(source='user.email', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)
    country_name       = serializers.CharField(source='country.name', read_only=True)
    languages          = serializers.SerializerMethodField()

    class Meta:
        model  = Nutritionist
        fields = [
            'nutritionist_id', 'username', 'email',
            'profile_photo_url', 'bio',
            'years_experience', 'consultation_price',
            'certification_ref', 'cert_image_url',
            'specialization', 'specialization_name',
            'country', 'country_name',
            'languages', 'rating',
            'approval_status',
        ]
        read_only_fields = [
            'nutritionist_id', 'rating',
            'approval_status', 'cert_image_url',
        ]

    def get_languages(self, obj):
        return list(
            obj.nutritionistlanguage_set.values('language__id', 'language__name')
        )


# ── Availability ───────────────────────────────────────────────────────────────

class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model  = NutritionistAvailability
        fields = ['id', 'day_of_week', 'start_time', 'end_time']


class AvailabilityInputSerializer(serializers.Serializer):
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    start_time  = serializers.TimeField()
    end_time    = serializers.TimeField()

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError(
                "end_time must be after start_time."
            )
        return data


# ── Holiday ────────────────────────────────────────────────────────────────────

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model  = NutritionistHoliday
        fields = ['id', 'holiday_date']


# ── Consultation ───────────────────────────────────────────────────────────────

class ConsultationSerializer(serializers.ModelSerializer):
    client_username      = serializers.CharField(source='client.user.username', read_only=True)
    nutritionist_username = serializers.CharField(source='nutritionist.user.username', read_only=True)

    class Meta:
        from marketplace.models import Consultation
        model  = Consultation
        fields = [
            'id', 'client_username', 'nutritionist_username',
            'appointment_date', 'start_time', 'end_time',
            'status', 'consultation_type',
            'zoom_link', 'price_paid',
            'nutritionist_commission',
            'is_free_from_plan', 'created_at',
        ]
        read_only_fields = [
            'id', 'price_paid', 'nutritionist_commission',
            'created_at',
        ]



# ── Plan Management ────────────────────────────────────────────────────────────

from marketplace.models import Plan as PlanModel

class NutritionistPlanSerializer(serializers.ModelSerializer):
    

    class Meta:
        model  = PlanModel
        fields = [
            'id', 'title', 'description',
            'plan_type', 'status',
            'price', 'duration_days',
            'free_consultations_per_week',
            'content_json', 'cover_image_url',
            'rating_avg', 'created_at',
            'target_client',
        ]
        read_only_fields = ['id', 'status', 'rating_avg', 'created_at']



class CreatePlanSerializer(serializers.Serializer):
    PLAN_TYPES = ['private-custom', 'public-predefined']

    title                       = serializers.CharField(max_length=255)
    description                 = serializers.CharField()
    plan_type                   = serializers.ChoiceField(choices=PLAN_TYPES)
    target_client_id            = serializers.IntegerField(required=False, allow_null=True)
    price                       = serializers.FloatField(min_value=0)
    duration_days               = serializers.IntegerField(min_value=1)
    free_consultations_per_week = serializers.IntegerField(min_value=0, default=0)
    content_json                = serializers.JSONField()
    cover_image                 = serializers.ImageField(required=False)

    def validate(self, data):
        # private-custom plans must have a target_client_id
        if data['plan_type'] == 'private-custom' and not data.get('target_client_id'):
            raise serializers.ValidationError(
                "target_client_id is required for private-custom plans."
            )
        return data