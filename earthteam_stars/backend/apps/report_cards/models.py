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
    outputs = models.TextField(blank=True)
    outcomes = models.TextField(blank=True)
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
