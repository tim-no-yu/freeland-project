from django.urls import path
from . import views

urlpatterns = [
    path('', views.report_cards),
    path('export/', views.export_verified),
    path('evidence/<int:evidence_id>/', views.delete_evidence),
    path('witnesses/<int:witness_id>/', views.delete_witness),
    path('<int:card_id>/', views.report_card_detail),
    path('<int:card_id>/submit/', views.submit_card),
    path('<int:card_id>/upgrade/', views.upgrade_tier),
    path('<int:card_id>/evidence/', views.upload_evidence),
    path('<int:card_id>/witnesses/', views.add_witness),
]
