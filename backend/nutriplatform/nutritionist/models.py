from django.db import models
from users.models import User
from admin_panel.models import Country, Specialization


class Language(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'languages'

    def __str__(self):
        return self.name


class Nutritionist(models.Model):
    nutritionist_id    = models.AutoField(primary_key=True)
    user               = models.OneToOneField(User, on_delete=models.CASCADE, db_column='user_id')
    country            = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, db_column='country_id')
    profile_photo_url  = models.CharField(max_length=255, default='default_nutri.png')
    certification_ref  = models.CharField(max_length=255, null=True, blank=True)
    cert_image_url     = models.CharField(max_length=255, null=True, blank=True)
    specialization     = models.ForeignKey(Specialization, on_delete=models.SET_NULL, null=True, blank=True, db_column='specialization_id')
    years_experience   = models.IntegerField(null=True, blank=True)
    consultation_price = models.FloatField(null=True, blank=True)
    bio                = models.TextField(null=True, blank=True)
    rating             = models.FloatField(default=0)
    is_approved = models.BooleanField(default=False)
    approval_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected')
        ],
        default='pending'
    )
    rejection_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'nutritionists'

    def __str__(self):
        return f"Nutritionist #{self.nutritionist_id} - {self.user.username}"


class NutritionistLanguage(models.Model):
    id = models.AutoField(primary_key=True)
    nutritionist = models.ForeignKey(Nutritionist, on_delete=models.CASCADE, db_column='nutritionist_id')
    language     = models.ForeignKey(Language, on_delete=models.CASCADE, db_column='language_id')

    class Meta:
        db_table        = 'nutritionist_languages'
        unique_together = ('nutritionist', 'language')


class NutritionistAvailability(models.Model):
    DAY_CHOICES = [
        (0, 'Sunday'),    (1, 'Monday'),
        (2, 'Tuesday'),   (3, 'Wednesday'),
        (4, 'Thursday'),  (5, 'Friday'),
        (6, 'Saturday'),
    ]

    nutritionist = models.ForeignKey(Nutritionist, on_delete=models.CASCADE, db_column='nutritionist_id')
    day_of_week  = models.IntegerField(choices=DAY_CHOICES)
    start_time   = models.TimeField()
    end_time     = models.TimeField()

    class Meta:
        db_table = 'nutritionist_availability'


class NutritionistHoliday(models.Model):
    nutritionist = models.ForeignKey(Nutritionist, on_delete=models.CASCADE, db_column='nutritionist_id')
    holiday_date = models.DateField()

    class Meta:
        db_table = 'nutritionist_holidays'


class NutritionistPatient(models.Model):
    PATIENT_TYPE_CHOICES = [
        ('from_custom_plan',  'From Custom Plan'),
        ('free_consultation', 'Free Consultation'),
    ]

    nutritionist            = models.ForeignKey(Nutritionist, on_delete=models.CASCADE, db_column='nutritionist_id')
    client                  = models.ForeignKey('client.Client', on_delete=models.CASCADE, db_column='client_id')
    patient_type            = models.CharField(max_length=50, choices=PATIENT_TYPE_CHOICES, null=True, blank=True)
    first_consultation_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'nutritionist_patients'
        unique_together = ('nutritionist', 'client')


class PatientNote(models.Model):
    nutritionist = models.ForeignKey(Nutritionist, on_delete=models.CASCADE, db_column='nutritionist_id')
    client       = models.ForeignKey('client.Client', on_delete=models.CASCADE, db_column='client_id')
    note_content = models.TextField()
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'patient_notes'