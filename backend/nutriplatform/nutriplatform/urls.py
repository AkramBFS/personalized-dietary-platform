from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from client.views import ServiceReviewView

urlpatterns = [
    path('admin/',                admin.site.urls),
    path('api/v1/auth/',          include('users.urls')),
    path('api/v1/lookup/',        include('admin_panel.urls')),
    path('api/v1/client/',        include('client.urls')),
    path('api/v1/nutritionist/',  include('nutritionist.urls')),
    path('api/v1/marketplace/',   include('marketplace.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/reviews/',       ServiceReviewView.as_view(), name='reviews'),
    path('api/v1/',               include('community.urls')), 
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)