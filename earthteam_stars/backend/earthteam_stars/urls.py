from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/report-cards/', include('apps.report_cards.urls')),
    path('api/verifications/', include('apps.verifications.urls')),
    path('api/scoring-rules/', include('apps.scoring.urls')),
    path('api/chain/', include('apps.chain.urls')),
]
