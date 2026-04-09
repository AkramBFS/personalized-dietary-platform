from django.urls import path
from .views import CountryListView, GoalListView, SpecializationListView, LanguageListView 

from nutritionist.views_admin import (
    PendingNutritionistListView,
    NutritionistDetailAdminView,
    ApproveNutritionistView,
    RejectNutritionistView,
    ReReviewNutritionistView,
)
urlpatterns = [
    path('countries/',       CountryListView.as_view(),       name='countries'),
    path('goals/',           GoalListView.as_view(),          name='goals'),
    path('specializations/', SpecializationListView.as_view(),name='specializations'),
    path('languages/',       LanguageListView.as_view(),      name='languages'),
    path('nutritionists/pending/',          PendingNutritionistListView.as_view()),
    path('nutritionists/<int:pk>/',         NutritionistDetailAdminView.as_view()),
    path('nutritionists/<int:pk>/approve/', ApproveNutritionistView.as_view()),
    path('nutritionists/<int:pk>/reject/',  RejectNutritionistView.as_view()),
    path('nutritionists/<int:pk>/re-review/', ReReviewNutritionistView.as_view()),
]


