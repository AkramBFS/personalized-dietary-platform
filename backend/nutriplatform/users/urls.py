from django.urls import path
from .views import (
    RegisterClientView,
    RegisterNutritionistView,
    LoginView,
    LogoutView,
)

from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/client/',       RegisterClientView.as_view(),       name='register-client'),
    path('register/nutritionist/', RegisterNutritionistView.as_view(), name='register-nutritionist'),
    path('login/',                 LoginView.as_view(),                 name='login'),
    path('logout/',                LogoutView.as_view(),                name='logout'),
    path('token/refresh/',         TokenRefreshView.as_view(),          name='token-refresh'),
]