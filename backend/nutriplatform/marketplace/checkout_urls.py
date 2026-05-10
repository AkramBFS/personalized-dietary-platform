from django.urls import path
from .checkout_views import (
    CheckoutCreateView,
    CheckoutDetailView,
    CheckoutConfirmView,
)

urlpatterns = [
    path('create/',                  CheckoutCreateView.as_view(),  name='checkout-create'),
    path('<uuid:checkout_id>/',      CheckoutDetailView.as_view(),  name='checkout-detail'),
    path('<uuid:checkout_id>/confirm/', CheckoutConfirmView.as_view(), name='checkout-confirm'),
]