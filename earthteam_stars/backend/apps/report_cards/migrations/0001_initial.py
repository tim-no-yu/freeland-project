
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Evidence',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='evidence/')),
                ('caption', models.CharField(blank=True, max_length=255)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='ReportCard',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('card_type', models.CharField(choices=[('action', 'Action (Silver)'), ('impact', 'Impact (Gold)')], max_length=10)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('outputs', models.TextField(blank=True)),
                ('outcomes', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('pending', 'Pending Review'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='draft', max_length=10)),
                ('stars_awarded', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Witness',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('contact', models.CharField(blank=True, max_length=255)),
                ('report_card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='witnesses', to='report_cards.reportcard')),
            ],
        ),
    ]
