from rest_framework import serializers
from .models import Nutritionist

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