
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ChainTx',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tx_signature', models.CharField(max_length=255)),
                ('memo_hash', models.CharField(max_length=255)),
                ('explorer_url', models.URLField()),
                ('issued_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
