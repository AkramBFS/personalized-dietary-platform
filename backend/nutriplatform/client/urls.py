from django.urls import path
from .views import (
    ClientProfileView,
    ProgressView,
    MacroTargetView,
    ManualCalorieLogView,
    CalorieLogListView,
)

urlpatterns = [
    path('profile/',           ClientProfileView.as_view()),
    path('progress/',          ProgressView.as_view()),
    path('progress/targets/',  MacroTargetView.as_view()),
    path('calorie-tracker/manual/',     ManualCalorieLogView.as_view(), name='manual-log'),
    path('calorie-tracker/logs/',       CalorieLogListView.as_view(),   name='calorie-logs'),
]