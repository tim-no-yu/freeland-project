
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('report_cards', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Verification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.IntegerField()),
                ('comment', models.TextField(blank=True)),
                ('decision', models.CharField(choices=[('approve', 'Approve'), ('reject', 'Reject')], max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('report_card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='verifications', to='report_cards.reportcard')),
                ('verifier', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='verifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('report_card', 'verifier')},
            },
        ),
    ]
