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


# ── Consultation Booking ───────────────────────────────────────────────────────

class ConsultationBookSerializer(serializers.Serializer):
    CONSULTATION_TYPES = ['advice_only', 'plan_included', 'custom_plan_session']

    nutritionist_id   = serializers.IntegerField()
    appointment_date  = serializers.DateField()
    start_time        = serializers.TimeField()
    end_time          = serializers.TimeField()
    consultation_type = serializers.ChoiceField(choices=CONSULTATION_TYPES)
    user_plan_id      = serializers.IntegerField(required=False, allow_null=True)
    is_free_from_plan = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        # end_time must be after start_time
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError(
                "end_time must be after start_time."
            )

        # appointment_date must be in the future
        if data['appointment_date'] < __import__('datetime').date.today():
            raise serializers.ValidationError(
                "appointment_date must be today or in the future."
            )

        # if free from plan, user_plan_id is required
        if data.get('is_free_from_plan') and not data.get('user_plan_id'):
            raise serializers.ValidationError(
                "user_plan_id is required when is_free_from_plan is True."
            )

        return data


class ClientConsultationSerializer(serializers.ModelSerializer):
    nutritionist_username = serializers.CharField(
        source='nutritionist.user.username', read_only=True
    )
    nutritionist_id = serializers.IntegerField(
        source='nutritionist.nutritionist_id', read_only=True
    )

    class Meta:
        from marketplace.models import Consultation
        model  = Consultation
        fields = [
            'id', 'nutritionist_id', 'nutritionist_username',
            'appointment_date', 'start_time', 'end_time',
            'status', 'consultation_type',
            'zoom_link', 'price_paid',
            'is_free_from_plan', 'created_at',
        ]