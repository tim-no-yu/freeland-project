from django.urls import path
from . import views

urlpatterns = [
    path('queue/', views.verifier_queue),
    path('<int:card_id>/', views.list_verifications),
    path('<int:card_id>/submit/', views.submit_verification),
]
