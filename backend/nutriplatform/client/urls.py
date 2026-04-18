from django.urls import path
from .views import (
    ClientProfileView,
    ProgressView,
    MacroTargetView,
    ManualCalorieLogView,
    CalorieLogListView,
    ClientConsultationListView,   
    ConsultationBookView,   
    UserPlanListView,
    UserPlanContentView,
    UserPlanAdvanceView,
)

urlpatterns = [
    path('profile/',           ClientProfileView.as_view()),
    path('progress/',          ProgressView.as_view()),
    path('progress/targets/',  MacroTargetView.as_view()),
    path('calorie-tracker/manual/',     ManualCalorieLogView.as_view(), name='manual-log'),
    path('calorie-tracker/logs/',       CalorieLogListView.as_view(),   name='calorie-logs'),
    path('consultations/',              ClientConsultationListView.as_view(), name='client-consultations'),      
    path('consultations/book/',         ConsultationBookView.as_view(),       name='consultation-book'), 
    path('user-plans/',                      UserPlanListView.as_view(),           name='user-plans'),
    path('user-plans/<int:pk>/content/',     UserPlanContentView.as_view(),        name='user-plan-content'),
    path('user-plans/<int:pk>/advance/',     UserPlanAdvanceView.as_view(),        name='user-plan-advance'),  

]