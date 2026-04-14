from django.contrib import admin
from .models import Plan, UserPlan, Invoice, Consultation, ServiceReview, PlanRating, PlanModerationLog


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'plan_type', 'status', 'price', 'rating_avg', 'created_at']
    list_filter   = ['status', 'plan_type']
    search_fields = ['title']
    # ← This prevents Django admin from trying to parse content_json
    readonly_fields = ['content_json', 'rating_avg', 'created_at']


@admin.register(UserPlan)
class UserPlanAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'plan', 'status', 'purchased_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'nutritionist', 'total_paid', 'item_type', 'created_at']


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'nutritionist', 'appointment_date', 'status']


@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'item_type', 'rating', 'created_at']


@admin.register(PlanRating)
class PlanRatingAdmin(admin.ModelAdmin):
    list_display = ['id', 'plan', 'client', 'rating', 'created_at']


@admin.register(PlanModerationLog)
class PlanModerationLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'plan', 'admin', 'action', 'created_at']