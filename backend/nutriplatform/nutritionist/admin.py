from django.contrib import admin
from .models import Nutritionist, Language, NutritionistAvailability, NutritionistHoliday, NutritionistPatient, PatientNote
admin.site.register(Nutritionist)
admin.site.register(Language)
admin.site.register(NutritionistAvailability)
admin.site.register(NutritionistHoliday)
admin.site.register(NutritionistPatient)
admin.site.register(PatientNote)