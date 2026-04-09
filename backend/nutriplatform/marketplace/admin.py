from django.contrib import admin
from .models import Plan, PlanModerationLog, UserPlan, PlanRating, Consultation, Invoice, ServiceReview
admin.site.register(Plan)
admin.site.register(PlanModerationLog)
admin.site.register(UserPlan)
admin.site.register(PlanRating)
admin.site.register(Consultation)
admin.site.register(Invoice)
admin.site.register(ServiceReview)