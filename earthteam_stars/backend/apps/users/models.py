from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=[
        ('reporter', 'Reporter'),
        ('verifier', 'Verifier'),
        ('admin', 'Admin'),
    ], default='reporter')
    wallet_address = models.CharField(max_length=255, blank=True)
