from django.apps import AppConfig


class ChainConfig(AppConfig):
    name = 'apps.chain'

    def ready(self):
        # Wire up signals that turn report-card approvals + wallet updates
        # into ChainTx rows the mint worker can pick up.
        from . import signals  # noqa: F401
