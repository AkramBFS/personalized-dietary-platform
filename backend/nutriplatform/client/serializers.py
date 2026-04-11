# client/serializers.py
from rest_framework import serializers
from .models import Client, DailyProgressMetric, AICalorieLog


class ClientProfileSerializer(serializers.ModelSerializer):
    username     = serializers.CharField(source='user.username', read_only=True)
    email        = serializers.CharField(source='user.email', read_only=True)
    goal_id      = serializers.PrimaryKeyRelatedField(
                    source='goal',
                    queryset=__import__('admin_panel.models', fromlist=['Goal']).Goal.objects.all(),
                    required=False
                )
    country_id   = serializers.PrimaryKeyRelatedField(
                    source='country',
                    queryset=__import__('admin_panel.models', fromlist=['Country']).Country.objects.all(),
                    required=False
                )
    goal_name    = serializers.CharField(source='goal.name', read_only=True)
    country_name = serializers.CharField(source='country.name', read_only=True)

    class Meta:
        model  = Client
        fields = [
            'client_id', 'username', 'email',
            'age', 'weight', 'height', 'gender',
            'bmi', 'bmr',
            'health_history', 'profile_photo_url',
            'goal_id', 'goal_name',
            'country_id', 'country_name',
            'target_calories', 'target_protein',
            'target_carbs', 'target_fats',
        ]
        read_only_fields = ['client_id', 'bmi', 'bmr', 'gender']


class MacroTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Client
        fields = ['target_calories', 'target_protein', 'target_carbs', 'target_fats']

    def validate(self, data):
        for field in ['target_calories', 'target_protein', 'target_carbs', 'target_fats']:
            if data.get(field) is None:
                raise serializers.ValidationError({field: 'This field is required.'})
        return data


class DailyProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DailyProgressMetric
        fields = [
            'id', 'log_date',
            'total_calories_consumed', 'total_protein_consumed',
            'total_carbs_consumed',    'total_fats_consumed',
            'target_calories', 'target_protein',
            'target_carbs',    'target_fats',
            'is_goal_achieved', 'notes',
        ]

# ── Manual Calorie Tracker ─────────────────────────────────────────────────────

class IngredientSerializer(serializers.Serializer):
    name       = serializers.CharField()
    mass_grams = serializers.FloatField(min_value=0.1)


class ManualCalorieLogSerializer(serializers.Serializer):
    MEAL_CHOICES = ['breakfast', 'lunch', 'dinner', 'snack']

    meal_type   = serializers.ChoiceField(choices=MEAL_CHOICES)
    ingredients = IngredientSerializer(many=True, min_length=1)


class CalorieLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = __import__('client.models', fromlist=['AICalorieLog']).AICalorieLog
        fields = [
            'id', 'meal_type', 'entry_type',
            'user_final_log',
            'total_calories', 'total_protein',
            'total_carbs', 'total_fats',
            'status', 'logged_at',
        ]