from django.contrib import admin
from .models import ScoringParameter, ScoringRule

admin.site.register(ScoringRule)
admin.site.register(ScoringParameter)
