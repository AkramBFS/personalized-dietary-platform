from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.files.storage import default_storage
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from client.models import Client
from nutritionist.models import Nutritionist, NutritionistLanguage, Language
from admin_panel.models import Country, Goal, Specialization


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
    }


# ── Client Registration ────────────────────────────────────────────────────────

class RegisterClientSerializer(serializers.Serializer):
    # User fields
    username  = serializers.CharField(max_length=150)
    email     = serializers.EmailField()
    password  = serializers.CharField(write_only=True, min_length=8)

    # Client fields
    age            = serializers.IntegerField(min_value=1, max_value=120)
    weight         = serializers.FloatField(min_value=1)   # kg
    height         = serializers.FloatField(min_value=1)   # cm
    gender         = serializers.ChoiceField(choices=['male', 'female'])
    country_id     = serializers.IntegerField()
    goal_id        = serializers.IntegerField()
    health_history = serializers.CharField(required=False, allow_blank=True)
    profile_photo  = serializers.ImageField(required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_country_id(self, value):
        if not Country.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid country.")
        return value

    def validate_goal_id(self, value):
        if not Goal.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid goal.")
        return value

    def create(self, validated_data):
        # Extract file separately
        profile_photo = validated_data.pop('profile_photo', None)

        # Create User
        user = User.objects.create_user(
            username = validated_data['username'],
            email    = validated_data['email'],
            password = validated_data['password'],
            role     = 'client',
        )

        # Handle profile photo upload
        photo_url = 'default_avatar.png'
        if profile_photo:
            path = default_storage.save(
                f'profiles/clients/{user.id}_{profile_photo.name}',
                profile_photo
            )
            photo_url = path

        # Create Client profile
        client = Client.objects.create(
            user              = user,
            age               = validated_data['age'],
            weight            = validated_data['weight'],
            height            = validated_data['height'],
            gender            = validated_data['gender'],
            country_id        = validated_data['country_id'],
            goal_id           = validated_data['goal_id'],
            health_history    = validated_data.get('health_history', ''),
            profile_photo_url = photo_url,
            # BMI and BMR are auto-calculated in Client.save()
        )

        return user, client


# ── Nutritionist Registration ──────────────────────────────────────────────────

class RegisterNutritionistSerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField(max_length=150)
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    # Nutritionist fields
    country_id         = serializers.IntegerField()
    specialization_id  = serializers.IntegerField()
    years_experience   = serializers.IntegerField(min_value=0)
    consultation_price = serializers.FloatField(min_value=0)
    bio                = serializers.CharField(required=False, allow_blank=True)
    certification_ref  = serializers.CharField()
    cert_image         = serializers.ImageField()
    language_ids       = serializers.ListField(
                            child=serializers.IntegerField(),
                            min_length=1
                         )
    profile_photo      = serializers.ImageField(required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_country_id(self, value):
        if not Country.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid country.")
        return value

    def validate_specialization_id(self, value):
        if not Specialization.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid specialization.")
        return value

    def validate_language_ids(self, value):
        existing = Language.objects.filter(id__in=value).count()
        if existing != len(value):
            raise serializers.ValidationError("One or more language IDs are invalid.")
        return value

    def create(self, validated_data):
        cert_image    = validated_data.pop('cert_image')
        profile_photo = validated_data.pop('profile_photo', None)
        language_ids  = validated_data.pop('language_ids')

        # Create User
        user = User.objects.create_user(
            username = validated_data['username'],
            email    = validated_data['email'],
            password = validated_data['password'],
            role     = 'nutritionist',
        )

        # Handle file uploads
        cert_path = default_storage.save(
            f'certifications/{user.id}_{cert_image.name}',
            cert_image
        )
        photo_url = 'default_nutri.png'
        if profile_photo:
            path = default_storage.save(
                f'profiles/nutritionists/{user.id}_{profile_photo.name}',
                profile_photo
            )
            photo_url = path

        # Create Nutritionist profile
        nutritionist = Nutritionist.objects.create(
            user               = user,
            country_id         = validated_data['country_id'],
            specialization_id  = validated_data['specialization_id'],
            years_experience   = validated_data['years_experience'],
            consultation_price = validated_data['consultation_price'],
            bio                = validated_data.get('bio', ''),
            certification_ref  = validated_data['certification_ref'],
            cert_image_url     = cert_path,
            approval_status='pending',
            profile_photo_url  = photo_url,
        )

        # Add languages (ManyToMany via junction table)
        for lang_id in language_ids:
            NutritionistLanguage.objects.create(
                nutritionist=nutritionist,
                language_id=lang_id
            )

        return user, nutritionist


# ── Login ──────────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError(
                "Your account has been banned. Contact support.",
                code='ACCOUNT_BANNED'
            )

        data['user'] = user
        return data


# ── Logout ─────────────────────────────────────────────────────────────────────

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, data):
        self.token = data['refresh']
        return data

    def save(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except TokenError:
            raise serializers.ValidationError("Token is invalid or already expired.")