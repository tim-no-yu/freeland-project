from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login),
    path('auth/me/', views.me),
    path('report-cards/', views.report_cards),
    path('report-cards/<int:card_id>/', views.report_card_detail),
    path('report-cards/<int:card_id>/submit/', views.submit_card),
    path('report-cards/<int:card_id>/evidence/', views.upload_evidence),
    path('verifier/queue/', views.verifier_queue),
    path('verifier/reviews/', views.submit_review),
    path('exports/verified-actions/', views.export_verified),
]
