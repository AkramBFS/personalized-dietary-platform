import uuid
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from users.models import User
from admin_panel.models import Country, Goal
from utils.fields import EncryptedTextField


class Client(models.Model):
    GENDER_CHOICES = [
        ('male',   'Male'),
        ('female', 'Female'),
    ]
    ACTIVITY_LEVEL_CHOICES = [
        ('sedentary',   'Sedentary'),
        ('moderate',    'Moderate'),
        ('very_active', 'Very Active'),
    ]

    DIET_CHOICES = [
        ('none',        'None'),
        ('omnivore',    'Omnivore'),
        ('vegetarian',  'Vegetarian'),
        ('vegan',       'Vegan'),
        ('keto',        'Keto'),
        ('paleo',       'Paleo'),
    ]

    client_id         = models.AutoField(primary_key=True)
    user              = models.OneToOneField(User, on_delete=models.CASCADE, db_column='user_id')
    is_premium        = models.BooleanField(default=False)
    profile_photo_url = models.CharField(max_length=255, default='default_avatar.png')
    age               = models.IntegerField(null=True, blank=True)
    weight            = models.FloatField(null=True, blank=True)
    height            = models.FloatField(null=True, blank=True)
    gender            = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    bmi               = models.FloatField(null=True, blank=True)
    bmr               = models.FloatField(null=True, blank=True)
    is_banned         = models.BooleanField(default=False)
    health_history    = EncryptedTextField(null=True, blank=True)
    target_calories   = models.FloatField(null=True, blank=True)
    target_protein    = models.FloatField(null=True, blank=True)
    target_carbs      = models.FloatField(null=True, blank=True)
    target_fats       = models.FloatField(null=True, blank=True)
    activity_level    = models.CharField(max_length=20, choices=ACTIVITY_LEVEL_CHOICES, null=True, blank=True)
    diet              = models.CharField(max_length=20, choices=DIET_CHOICES, null=True, blank=True)
    goal              = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True, db_column='goal_id')
    country           = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, db_column='country_id')

    class Meta:
        db_table = 'clients'

    def __str__(self):
        return f"Client #{self.client_id} - {self.user.username}"

    def save(self, *args, **kwargs):
        if self.weight and self.height:
            height_m = self.height / 100
            self.bmi = round(self.weight / (height_m ** 2), 2)

            if self.age and self.gender:
                base = 10 * self.weight + 6.25 * self.height - 5 * self.age
                self.bmr = round(base + 5 if self.gender == 'male' else base - 161, 2)

        super().save(*args, **kwargs)


class DailyProgressMetric(models.Model):
    client                  = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    total_calories_consumed = models.FloatField(default=0)
    total_fats_consumed     = models.FloatField(default=0)
    total_carbs_consumed    = models.FloatField(default=0)
    total_protein_consumed  = models.FloatField(default=0)
    target_calories         = models.FloatField(null=True, blank=True)
    target_fats             = models.FloatField(null=True, blank=True)
    target_carbs            = models.FloatField(null=True, blank=True)
    target_protein          = models.FloatField(null=True, blank=True)
    is_goal_achieved        = models.BooleanField(default=False)
    log_date                = models.DateField(auto_now_add=True)
    notes                   = EncryptedTextField(null=True, blank=True)

    class Meta:
        db_table        = 'daily_progress_metrics'
        unique_together = ('client', 'log_date')

    def check_goal_achieved(self):
        if all([self.target_calories, self.target_protein,
                self.target_carbs, self.target_fats]):
            self.is_goal_achieved = (
                self.total_calories_consumed >= self.target_calories and
                self.total_protein_consumed  >= self.target_protein  and
                self.total_carbs_consumed    >= self.target_carbs    and
                self.total_fats_consumed     >= self.target_fats
            )
        else:
            self.is_goal_achieved = False

    def __str__(self):
        return f"Progress - Client #{self.client_id} - {self.log_date}"


class AICalorieLog(models.Model):
    class Status(models.TextChoices):
        QUEUED = 'queued', 'Queued'
        PROCESSING = 'processing', 'Processing'
        PENDING_USER_REVIEW = 'pending_user_review', 'Pending User Review'
        SAVED = 'saved', 'Saved'
        DISCARDED = 'discarded', 'Discarded'
        FAILED = 'failed', 'Failed'
        CANCELLED = 'cancelled', 'Cancelled'

    class ErrorCode(models.TextChoices):
        NONE = '', 'None'
        IMAGE_INVALID = 'IMAGE_INVALID', 'Image Invalid / Corrupt'
        IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE', 'Image Too Large'
        AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE', 'AI Service Unavailable'
        AI_INFERENCE_TIMEOUT = 'AI_INFERENCE_TIMEOUT', 'AI Inference Timeout'
        AI_INFERENCE_ERROR = 'AI_INFERENCE_ERROR', 'AI Inference Error'
        NUTRITION_API_ERROR = 'NUTRITION_API_ERROR', 'Nutrition API Error'
        WORKER_CRASHED = 'WORKER_CRASHED', 'Worker Crashed / Lease Expired'
        LEGACY_ABANDONED = 'LEGACY_ABANDONED', 'Legacy In-Flight Log Abandoned'
        CANCELLED = 'CANCELLED', 'Cancelled by User'

    MEAL_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch',     'Lunch'),
        ('dinner',    'Dinner'),
        ('snack',     'Snack'),
    ]
    ENTRY_CHOICES = [
        ('ai_vision',    'AI Vision'),
        ('manual_input', 'Manual Input'),
    ]
    GI_CHOICES = [
        ('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')
    ]

    client                = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id', related_name='ai_calorie_logs')
    image_url             = models.CharField(max_length=255, null=True, blank=True)
    segmented_image_url   = models.CharField(max_length=255, null=True, blank=True)
    meal_type             = models.CharField(max_length=20, choices=MEAL_CHOICES, null=True, blank=True)
    ai_raw_prediction     = models.JSONField(null=True, blank=True)
    user_final_log        = models.JSONField(null=True, blank=True)
    total_calories        = models.FloatField(null=True, blank=True)
    total_protein         = models.FloatField(null=True, blank=True)
    total_carbs           = models.FloatField(null=True, blank=True)
    total_fats            = models.FloatField(null=True, blank=True)
    glycemic_index_rating = models.CharField(max_length=10, choices=GI_CHOICES, null=True, blank=True)
    is_validated_by_user  = models.BooleanField(default=False)
    status                = models.CharField(max_length=30, choices=Status.choices, default=Status.QUEUED, db_index=True)
    entry_type            = models.CharField(max_length=20, choices=ENTRY_CHOICES, null=True, blank=True)

    # Job / queue execution tracking
    claimed_by            = models.CharField(max_length=128, blank=True, default='')
    claimed_at            = models.DateTimeField(null=True, blank=True)
    lease_token           = models.UUIDField(null=True, blank=True)
    retry_count           = models.IntegerField(default=0)
    available_at          = models.DateTimeField(null=True, blank=True, db_index=True)
    error_code            = models.CharField(max_length=50, choices=ErrorCode.choices, default=ErrorCode.NONE, blank=True)
    error_message         = models.TextField(blank=True, default='')
    completed_at          = models.DateTimeField(null=True, blank=True)

    logged_at             = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at            = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ai_calorie_logs'
        ordering = ['-logged_at']
        indexes = [
            models.Index(fields=['status', 'logged_at'], name='idx_ailog_status_logged'),
            models.Index(fields=['status', 'available_at', 'logged_at'], name='idx_ailog_status_avail_logged'),
            models.Index(fields=['client', 'status'], name='idx_ailog_client_status'),
            models.Index(fields=['client', 'logged_at'], name='idx_ailog_client_logged'),
        ]

    def __str__(self):
        return f"AI Log #{self.id} [{self.status}] - {self.meal_type} - Client #{self.client_id}"

    def can_transition_to(self, target_status: str) -> bool:
        valid_transitions = {
            self.Status.QUEUED: [self.Status.PROCESSING, self.Status.CANCELLED, self.Status.FAILED],
            self.Status.PROCESSING: [self.Status.PENDING_USER_REVIEW, self.Status.FAILED, self.Status.CANCELLED],
            self.Status.PENDING_USER_REVIEW: [self.Status.SAVED, self.Status.DISCARDED, self.Status.CANCELLED],
            self.Status.SAVED: [],
            self.Status.DISCARDED: [],
            self.Status.FAILED: [],
            self.Status.CANCELLED: [],
        }
        return target_status in valid_transitions.get(self.status, [])

    def mark_processing(self, worker_id: str, lease_token: uuid.UUID):
        if not self.can_transition_to(self.Status.PROCESSING):
            raise ValidationError(f"Cannot transition AICalorieLog #{self.id} from {self.status} to processing.")
        now = timezone.now()
        self.status = self.Status.PROCESSING
        self.claimed_by = worker_id
        self.claimed_at = now
        self.lease_token = lease_token
        self.save(update_fields=['status', 'claimed_by', 'claimed_at', 'lease_token', 'updated_at'])

    def mark_completed(
        self,
        raw_prediction: dict,
        segmented_image_url: str = None,
        total_calories: float = None,
        total_protein: float = None,
        total_carbs: float = None,
        total_fats: float = None
    ):
        if not self.can_transition_to(self.Status.PENDING_USER_REVIEW):
            raise ValidationError(f"Cannot transition AICalorieLog #{self.id} from {self.status} to pending_user_review.")
        now = timezone.now()
        self.status = self.Status.PENDING_USER_REVIEW
        self.ai_raw_prediction = raw_prediction
        if segmented_image_url:
            self.segmented_image_url = segmented_image_url
        if total_calories is not None:
            self.total_calories = total_calories
        if total_protein is not None:
            self.total_protein = total_protein
        if total_carbs is not None:
            self.total_carbs = total_carbs
        if total_fats is not None:
            self.total_fats = total_fats
        self.completed_at = now

        update_fields = [
            'status', 'ai_raw_prediction', 'total_calories',
            'total_protein', 'total_carbs', 'total_fats', 'completed_at', 'updated_at'
        ]
        if segmented_image_url:
            update_fields.append('segmented_image_url')
        self.save(update_fields=update_fields)

    def mark_failed(self, error_code: str, error_message: str):
        if not self.can_transition_to(self.Status.FAILED):
            raise ValidationError(f"Cannot transition AICalorieLog #{self.id} from {self.status} to failed.")
        now = timezone.now()
        self.status = self.Status.FAILED
        self.error_code = error_code
        self.error_message = error_message
        self.completed_at = now
        self.save(update_fields=['status', 'error_code', 'error_message', 'completed_at', 'updated_at'])

    def mark_cancelled(self):
        if not self.can_transition_to(self.Status.CANCELLED):
            raise ValidationError(f"Cannot transition AICalorieLog #{self.id} from {self.status} to cancelled.")
        now = timezone.now()
        self.status = self.Status.CANCELLED
        self.error_code = self.ErrorCode.CANCELLED
        self.error_message = "Cancelled by user"
        self.completed_at = now
        self.save(update_fields=['status', 'error_code', 'error_message', 'completed_at', 'updated_at'])


class PremiumSubscription(models.Model):
    STATUS_CHOICES = [
        ('active',    'Active'),
        ('expired',   'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    client             = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    plan_type          = models.CharField(max_length=50, null=True, blank=True)
    amount_paid        = models.FloatField(null=True, blank=True)
    transaction_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    start_date         = models.DateTimeField(auto_now_add=True)
    end_date           = models.DateTimeField(null=True, blank=True)
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        db_table = 'premium_subscriptions'

    def __str__(self):
        return f"Subscription #{self.id} - Client #{self.client_id} - {self.status}"