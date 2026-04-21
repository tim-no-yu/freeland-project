from django.conf import settings
from django.db import models


class ReportCard(models.Model):
    submitter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='report_cards')
    card_type = models.CharField(max_length=15, choices=[
        ('collaboration', 'Collaboration (Tier 1)'),
        ('action', 'Action (Tier 2)'),
        ('impact', 'Impact (Tier 3)'),
    ])
    title = models.CharField(max_length=255)
    description = models.TextField()
    intervention_type = models.CharField(max_length=30, choices=[
        ('general', 'General'),
        ('market_demand', 'Reduce Market Demand for Wildlife'),
        ('poaching', 'Reduce Poaching of Wildlife'),
        ('trafficking', 'Reduce Trafficking of Wildlife'),
        ('regenerative_agriculture', 'Regenerative Agriculture'),
        ('habitat_protection', 'Habitat Protection'),
    ], default='general')
    outputs = models.TextField(blank=True)
    outcomes = models.TextField(blank=True)
    problem_statement = models.TextField(blank=True)
    results = models.TextField(blank=True)
    tags = models.CharField(max_length=500, blank=True)
    baseline_data = models.TextField(blank=True)
    measured_data = models.TextField(blank=True)
    dataset_url = models.URLField(blank=True)
    submission_values = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=[
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ], default='draft')
    stars_awarded = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Evidence(models.Model):
    report_card = models.ForeignKey(ReportCard, on_delete=models.CASCADE, related_name='evidence')
    file = models.FileField(upload_to='evidence/')
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Witness(models.Model):
    report_card = models.ForeignKey(ReportCard, on_delete=models.CASCADE, related_name='witnesses')
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    contact = models.CharField(max_length=255, blank=True)
