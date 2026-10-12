from rest_framework import serializers
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.db import transaction
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.files.storage import default_storage
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from client.models import Client
from nutritionist.models import Nutritionist, NutritionistLanguage, Language
from admin_panel.models import Country, Goal, Specialization
from nutriplatform.middleware.rls import set_rls_context
from utils.upload_security import (
    sanitize_certification_upload,
    sanitize_image_upload,
    store_bytes,
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
    }


def _upload_error_message(exc: DRFValidationError) -> str:
    """Flatten the sanitizer's {field: message} error into a plain message for a serializer field."""
    detail = exc.detail
    if isinstance(detail, dict):
        detail = next(iter(detail.values()))
    if isinstance(detail, (list, tuple)):
        detail = detail[0]
    return str(detail)


def _delete_stored(paths):
    """Best-effort removal of files written during a registration that then failed."""
    for path in paths:
        try:
            default_storage.delete(path)
        except Exception:
            pass


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
    profile_photo  = serializers.FileField(required=False)
    activity_level = serializers.ChoiceField(
        choices=['sedentary', 'moderate', 'very_active'],
        required=False,
        allow_null=True
    )
    diet = serializers.ChoiceField(
        choices=['none', 'omnivore', 'vegetarian', 'vegan', 'keto', 'paleo'],
        required=False,
        allow_null=True
    )

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

    def validate_profile_photo(self, value):
        try:
            return sanitize_image_upload(value, field='profile_photo')   # SanitizedImage; nothing written yet
        except DRFValidationError as exc:
            raise serializers.ValidationError(_upload_error_message(exc))

    def create(self, validated_data):
        # Already sanitized in validate_profile_photo
        profile_photo = validated_data.pop('profile_photo', None)

        stored_paths = []
        try:
            with transaction.atomic():
                # Create User
                user = User.objects.create_user(
                    username = validated_data['username'],
                    email    = validated_data['email'],
                    password = validated_data['password'],
                    role     = 'client',
                )
                set_rls_context(user)

                # Persist the sanitized avatar under a server-chosen random name
                photo_url = 'default_avatar.png'
                if profile_photo:
                    photo_url = store_bytes(profile_photo.data, 'profiles/clients', profile_photo.ext)
                    stored_paths.append(photo_url)

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
                    activity_level    = validated_data.get('activity_level', None),
                    diet              = validated_data.get('diet', None),
                    # BMI and BMR are auto-calculated in Client.save()
                )

                return user, client
        except Exception:
            _delete_stored(stored_paths)
            raise


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
    cert_image         = serializers.FileField()
    language_ids       = serializers.ListField(
                            child=serializers.IntegerField(),
                            min_length=1
                         )
    profile_photo      = serializers.FileField(required=False)

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

    def validate_cert_image(self, value):
        try:
            return sanitize_certification_upload(value)          # -> (bytes, ext); nothing written yet
        except DRFValidationError as exc:
            raise serializers.ValidationError(_upload_error_message(exc))

    def validate_profile_photo(self, value):
        try:
            return sanitize_image_upload(value, field='profile_photo')
        except DRFValidationError as exc:
            raise serializers.ValidationError(_upload_error_message(exc))

    def create(self, validated_data):
        cert_data, cert_ext = validated_data.pop('cert_image')
        profile_photo = validated_data.pop('profile_photo', None)
        language_ids  = validated_data.pop('language_ids')

        stored_paths = []
        try:
            with transaction.atomic():
                # Create User
                user = User.objects.create_user(
                    username = validated_data['username'],
                    email    = validated_data['email'],
                    password = validated_data['password'],
                    role     = 'nutritionist',
                )
                set_rls_context(user)

                # Persist already-sanitized files under server-chosen random names
                cert_path = store_bytes(cert_data, 'certifications', cert_ext)
                stored_paths.append(cert_path)
                photo_url = 'default_nutri.png'
                if profile_photo:
                    photo_url = store_bytes(profile_photo.data, 'profiles/nutritionists', profile_photo.ext)
                    stored_paths.append(photo_url)

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
                    approval_status    = 'pending',
                    profile_photo_url  = photo_url,
                )

                # Add languages (ManyToMany via junction table)
                for lang_id in language_ids:
                    NutritionistLanguage.objects.create(
                        nutritionist=nutritionist,
                        language_id=lang_id
                    )

                return user, nutritionist
        except Exception:
            _delete_stored(stored_paths)
            raise


# ── Login ──────────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        request = self.context.get('request')
        user = authenticate(request=request, email=data['email'], password=data['password'])

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError(
                "Your account has been banned. Contact support.",
                code='ACCOUNT_BANNED'
            )

        if user.role == 'nutritionist':
            try:
                profile = user.nutritionist
                if profile.approval_status != 'approved':
                    raise serializers.ValidationError({
                        "detail": f"Account approval {profile.approval_status}.",
                        "code": f"ACCOUNT_{profile.approval_status.upper()}",
                        "rejection_reason": profile.rejection_reason if profile.approval_status == 'rejected' else None
                    })
            except Nutritionist.DoesNotExist:
                raise serializers.ValidationError("Nutritionist profile missing.")

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