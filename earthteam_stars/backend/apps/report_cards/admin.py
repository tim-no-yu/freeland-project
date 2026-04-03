from django.contrib import admin
from .models import Evidence, ReportCard, Witness

admin.site.register(ReportCard)
admin.site.register(Evidence)
admin.site.register(Witness)
