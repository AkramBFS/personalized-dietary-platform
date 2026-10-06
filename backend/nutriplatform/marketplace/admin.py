from django.contrib import admin
from .models import (
    Plan, UserPlan, Invoice, Consultation, ServiceReview, PlanRating, PlanModerationLog, CheckoutSession
)


@admin.register(CheckoutSession)
class CheckoutSessionAdmin(admin.ModelAdmin):
    list_display = ['checkout_id', 'user', 'item_type', 'item_id', 'resolved_price', 'currency', 'status', 'payment_intent_id', 'created_at', 'expires_at']
    list_filter = ['status', 'item_type', 'created_at']
    search_fields = ['checkout_id', 'user__username', 'user__email', 'payment_intent_id']
    readonly_fields = ['checkout_id', 'created_at', 'expires_at']


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
