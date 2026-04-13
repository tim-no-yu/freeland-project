from django.urls import path
from . import views

urlpatterns = [
    path('<int:card_id>/', views.list_verifications),
    path('<int:card_id>/submit/', views.submit_verification),
]
