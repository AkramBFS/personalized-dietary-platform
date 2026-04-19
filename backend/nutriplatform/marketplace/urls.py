from django.urls import path
from .views import (
    MarketplacePlanListView,
    MarketplacePlanDetailView,
    PlanPurchaseView,
    NutritionistDirectoryView,
    NutritionistPublicProfileView,
    NutritionistAvailabilityCheckView,
)
from client.views import PlanRatingView

urlpatterns = [
    path('plans/',                                  MarketplacePlanListView.as_view(),            name='marketplace-plans'),
    path('plans/<int:pk>/',                         MarketplacePlanDetailView.as_view(),          name='marketplace-plan-detail'),
    path('plans/<int:pk>/purchase/',                PlanPurchaseView.as_view(),                   name='marketplace-plan-purchase'),
    path('plans/<int:pk>/rate/',                    PlanRatingView.as_view(),                     name='plan-rate'),
    path('nutritionists/',                          NutritionistDirectoryView.as_view(),          name='nutritionist-directory'),
    path('nutritionists/<int:pk>/',                 NutritionistPublicProfileView.as_view(),      name='nutritionist-public-profile'),
    path('nutritionists/<int:pk>/availability/',    NutritionistAvailabilityCheckView.as_view(),  name='nutritionist-availability-check'),
]