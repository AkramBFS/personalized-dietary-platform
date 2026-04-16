from django.db import models
from users.models import User
from admin_panel.models import Country, Goal


class Client(models.Model):
    GENDER_CHOICES = [
        ('male',   'Male'),
        ('female', 'Female'),
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
    health_history    = models.TextField(null=True, blank=True)
    goal              = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True, db_column='goal_id')
    country           = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, db_column='country_id')

    class Meta:
        db_table = 'clients'

    def __str__(self):
        return f"Client #{self.client_id} - {self.user.username}"
    def save(self, *args, **kwargs):
        # BMI
        height_m = self.height / 100
        self.bmi = round(self.weight / (height_m ** 2), 2)

        # BMR
        if self.gender == 'male':
            self.bmr = round(10 * self.weight + 6.25 * self.height - 5 * self.age + 5, 2)
        else:
            self.bmr = round(10 * self.weight + 6.25 * self.height - 5 * self.age - 161, 2)

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
    notes                   = models.TextField(null=True, blank=True)

    class Meta:
        db_table        = 'daily_progress_metrics'
        unique_together = ('client', 'log_date')

    def __str__(self):
        return f"Progress - Client #{self.client_id} - {self.log_date}"


class AICalorieLog(models.Model):
    MEAL_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch',     'Lunch'),
        ('dinner',    'Dinner'),
        ('snack',     'Snack'),
    ]
    STATUS_CHOICES = [
        ('processing',          'Processing'),
        ('pending_user_review', 'Pending User Review'),
        ('saved',               'Saved'),
        ('discarded',           'Discarded'),
        ('failed',              'Failed'),
    ]
    ENTRY_CHOICES = [
        ('ai_vision',    'AI Vision'),
        ('manual_input', 'Manual Input'),
    ]
    GI_CHOICES = [
        ('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')
    ]

    client                = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
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
    status                = models.CharField(max_length=30, choices=STATUS_CHOICES, default='processing')
    entry_type            = models.CharField(max_length=20, choices=ENTRY_CHOICES, null=True, blank=True)
    logged_at             = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_calorie_logs'

    def __str__(self):
        return f"AI Log #{self.id} - {self.meal_type} - Client #{self.client_id}"


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