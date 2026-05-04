from django.urls import path
from . import views

urlpatterns = [
    path('', views.scoring_rules),
    path('<int:rule_id>/', views.update_scoring_rule),
]
