from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register),
    path('token/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('me/', views.me),
    path('stats/', views.dashboard_stats),
    path('verifiers/', views.list_verifiers),
    path('verifiers/<int:verifier_id>/', views.verifier_reputation),
]
