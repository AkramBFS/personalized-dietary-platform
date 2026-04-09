from django.db import models
from users.models import User
from client.models import Client
from nutritionist.models import Nutritionist


class Plan(models.Model):
    PLAN_TYPE_CHOICES = [
        ('private-custom',    'Private Custom'),
        ('public-predefined', 'Public Predefined'),
    ]
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('deleted',  'Deleted'),
    ]

    creator          = models.ForeignKey(Nutritionist, on_delete=models.CASCADE, db_column='creator_id')
    target_client    = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, db_column='target_client_id')
    cover_image_url  = models.CharField(max_length=255, default='default_plan_cover.jpg')
    title            = models.CharField(max_length=255, null=True, blank=True)
    description      = models.TextField(null=True, blank=True)
    plan_type        = models.CharField(max_length=30, choices=PLAN_TYPE_CHOICES, null=True, blank=True)
    content_json     = models.JSONField(null=True, blank=True)
    price            = models.FloatField(null=True, blank=True)
    duration_days    = models.IntegerField(null=True, blank=True)
    free_consultations_per_week = models.IntegerField(default=0)
    rating_avg       = models.FloatField(default=0)
    created_at       = models.DateTimeField(auto_now_add=True)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    class Meta:
        db_table = 'plans'

    def __str__(self):
        return f"Plan: {self.title} ({self.status})"


class PlanModerationLog(models.Model):
    plan             = models.ForeignKey(Plan, on_delete=models.CASCADE, db_column='plan_id')
    admin            = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='admin_id')
    action           = models.CharField(max_length=50, null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'plan_moderation_logs'


class UserPlan(models.Model):
    STATUS_CHOICES = [
        ('active',    'Active'),
        ('completed', 'Completed'),
    ]

    client                  = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    plan                    = models.ForeignKey(Plan, on_delete=models.CASCADE, db_column='plan_id')
    current_day_index       = models.IntegerField(default=0)
    status                  = models.CharField(max_length=20, choices=STATUS_CHOICES, null=True, blank=True)
    free_consultations_used = models.IntegerField(default=0)
    purchased_at            = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_plans'


class PlanRating(models.Model):
    plan       = models.ForeignKey(Plan, on_delete=models.CASCADE, db_column='plan_id')
    client     = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    rating     = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'plan_ratings'
        unique_together = ('plan', 'client')


class Consultation(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('notified',  'Notified'),
        ('finished',  'Finished'),
        ('cancelled', 'Cancelled'),
    ]
    TYPE_CHOICES = [
        ('advice_only',         'Advice Only'),
        ('plan_included',       'Plan Included'),
        ('custom_plan_session', 'Custom Plan Session'),
    ]

    client                  = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    nutritionist            = models.ForeignKey(Nutritionist, on_delete=models.CASCADE, db_column='nutritionist_id')
    appointment_date        = models.DateField()
    start_time              = models.TimeField()
    end_time                = models.TimeField()
    zoom_link               = models.CharField(max_length=255, null=True, blank=True)
    status                  = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    consultation_type       = models.CharField(max_length=30, choices=TYPE_CHOICES, default='advice_only')
    price_paid              = models.FloatField(default=0)
    nutritionist_commission = models.FloatField(null=True, blank=True)
    is_free_from_plan       = models.BooleanField(default=False)
    user_plan               = models.ForeignKey(UserPlan, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_plan_id')
    created_at              = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'consultations'


class Invoice(models.Model):
    ITEM_TYPE_CHOICES = [
        ('plan',                 'Plan'),
        ('consultation_advice',  'Consultation Advice'),
        ('consultation_custom',  'Consultation Custom'),
    ]

    client             = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    nutritionist       = models.ForeignKey(Nutritionist, on_delete=models.CASCADE, db_column='nutritionist_id')
    transaction_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    total_paid         = models.FloatField(null=True, blank=True)
    commission_rate    = models.FloatField(null=True, blank=True)
    net_earnings       = models.FloatField(null=True, blank=True)
    item_type          = models.CharField(max_length=30, choices=ITEM_TYPE_CHOICES, null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invoices'


class ServiceReview(models.Model):
    ITEM_TYPE_CHOICES = [
        ('plan',         'Plan'),
        ('consultation', 'Consultation'),
    ]

    client     = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    item_type  = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES, null=True, blank=True)
    item_id    = models.IntegerField(null=True, blank=True)
    rating     = models.IntegerField(null=True, blank=True)
    comment    = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'service_reviews'