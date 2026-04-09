from django.contrib import admin
from .models import Client, DailyProgressMetric, AICalorieLog, PremiumSubscription
admin.site.register(Client)
admin.site.register(DailyProgressMetric)
admin.site.register(AICalorieLog)
admin.site.register(PremiumSubscription)