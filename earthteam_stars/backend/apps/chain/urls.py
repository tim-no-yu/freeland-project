from django.urls import path
from . import views

urlpatterns = [
    path('issue/<int:card_id>/', views.issue_chain_tx),
    path('tx/<int:card_id>/', views.get_chain_tx),
]
