from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import CsrfView, LoginView, LogoutView, MeView, NotificationPrefsView
from notifications.views import PushNotifyPlantsView, PushSubscribeView, PushTestView, VapidPublicKeyView
from plants.views import (
    DashboardView,
    FeedWateringView,
    PlantSpeciesListView,
    UserPlantViewSet,
    WateringDestroyView,
    WidgetNextView,
)

router = DefaultRouter()
router.register('plants', UserPlantViewSet, basename='plants')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/csrf/', CsrfView.as_view()),
    path('api/auth/login', LoginView.as_view()),
    path('api/auth/logout', LogoutView.as_view()),
    path('api/me', MeView.as_view()),
    path('api/me/notification-prefs', NotificationPrefsView.as_view()),
    path('api/species', PlantSpeciesListView.as_view()),
    path('api/feed/watering', FeedWateringView.as_view()),
    path('api/widget/next', WidgetNextView.as_view()),
    path('api/dashboard', DashboardView.as_view()),
    path('api/waterings/<int:pk>', WateringDestroyView.as_view()),
    path('api/push/vapid-public-key', VapidPublicKeyView.as_view()),
    path('api/push/subscribe', PushSubscribeView.as_view()),
    path('api/push/test', PushTestView.as_view()),
    path('api/push/notify-urgent', PushNotifyPlantsView.as_view()),
    path('api/', include(router.urls)),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
