from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chain', '0002_initial'),
    ]

    operations = [
        # Pre-existing fields need to become optional so a freshly-created
        # pending ChainTx (no tx yet) can be saved without dummy values.
        migrations.AlterField(
            model_name='chaintx',
            name='tx_signature',
            field=models.CharField(blank=True, default='', max_length=255),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='chaintx',
            name='memo_hash',
            field=models.CharField(blank=True, default='', max_length=255),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='chaintx',
            name='explorer_url',
            field=models.URLField(blank=True, default=''),
            preserve_default=False,
        ),

        # New state-machine + payload fields.
        migrations.AddField(
            model_name='chaintx',
            name='wallet_address',
            field=models.CharField(blank=True, default='', max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='chaintx',
            name='token_amount',
            field=models.BigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='chaintx',
            name='network',
            field=models.CharField(default='devnet', max_length=20),
        ),
        migrations.AddField(
            model_name='chaintx',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('submitting', 'Submitting'),
                    ('confirmed', 'Confirmed'),
                    ('failed', 'Failed'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='chaintx',
            name='attempts',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='chaintx',
            name='last_error',
            field=models.TextField(blank=True, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='chaintx',
            name='next_attempt_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='chaintx',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),

        # Worker hot path.
        migrations.AddIndex(
            model_name='chaintx',
            index=models.Index(
                fields=['status', 'next_attempt_at'],
                name='chain_chaintx_status_a3b1c2_idx',
            ),
        ),
    ]
