from django.contrib import admin
from .models import Client, DailyProgressMetric, AICalorieLog, PremiumSubscription

admin.site.register(Client)
admin.site.register(DailyProgressMetric)
admin.site.register(PremiumSubscription)


@admin.register(AICalorieLog)
class AICalorieLogAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'client',
        'meal_type',
        'status',
        'error_code',
        'claimed_by',
        'total_calories',
        'logged_at',
        'completed_at',
    )
    list_filter = ('status', 'meal_type', 'error_code', 'logged_at')
    search_fields = (
        'id',
        'client__user__email',
        'client__user__username',
        'claimed_by',
        'error_message',
    )
    readonly_fields = (
        'id',
        'logged_at',
        'updated_at',
        'claimed_at',
        'completed_at',
        'lease_token',
    )
    ordering = ('-logged_at',)