from django.urls import path
from .views import LanguageListView
from .views import (
    NutritionistProfileView,
    ScheduleView,
    AvailabilityView,
    HolidayView,
    HolidayDeleteView,
    NutritionistConsultationListView,
    ConsultationZoomView,
    ConsultationStatusView,
    NutritionistPlanListView,     
    NutritionistPlanDetailView,   
)
urlpatterns = [
    path('languages/', LanguageListView.as_view()),
    path('profile/',                                NutritionistProfileView.as_view(),          name='nutritionist-profile'),
    path('schedule/',                               ScheduleView.as_view(),                     name='nutritionist-schedule'),
    path('schedule/availability/',                  AvailabilityView.as_view(),                 name='nutritionist-availability'),
    path('schedule/holidays/',                      HolidayView.as_view(),                      name='nutritionist-holidays'),
    path('schedule/holidays/<int:pk>/',             HolidayDeleteView.as_view(),                name='nutritionist-holiday-delete'),
    path('consultations/',                          NutritionistConsultationListView.as_view(), name='nutritionist-consultations'),
    path('consultations/<int:pk>/zoom-link/',       ConsultationZoomView.as_view(),             name='nutritionist-zoom'),
    path('consultations/<int:pk>/status/',          ConsultationStatusView.as_view(),           name='nutritionist-status'),
    path('plans/',                                  NutritionistPlanListView.as_view(),         name='nutritionist-plans'),        
    path('plans/<int:pk>/',                         NutritionistPlanDetailView.as_view(),       name='nutritionist-plan-detail'), 
]
