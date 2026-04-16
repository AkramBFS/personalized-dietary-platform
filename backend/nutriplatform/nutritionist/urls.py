from django.urls import path
from .views import LanguageListView

urlpatterns = [
    path('languages/', LanguageListView.as_view()),
]