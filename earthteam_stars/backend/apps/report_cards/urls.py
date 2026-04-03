from django.urls import path
from . import views

urlpatterns = [
    path('', views.report_cards),
    path('<int:card_id>/', views.report_card_detail),
    path('<int:card_id>/evidence/', views.upload_evidence),
    path('evidence/<int:evidence_id>/', views.delete_evidence),
    path('export/', views.export_verified),
]
