# `apps.chain` — Solana mint pipeline

This app owns the EarthTeam Stars on-chain side of the MVP.

It is **devnet-only**. The proposal scopes mainnet, audits, and custody hardening out for the 8-week MVP. The code is structured so a future mainnet flip is a config change (`SOLANA_CLUSTER`, `SOLANA_RPC_URL`, plus moving `STARS_MINT_AUTHORITY_SECRET` out of env into a vault) rather than a rewrite. See the **Mainnet flip checklist** at the bottom.

---

## How it works (end-to-end)

```
Verifier approval                        Reporter sets wallet
        │                                         │
        ▼                                         ▼
ReportCard.save() ──signal──► ChainTx(pending)    │
                                  ▲               │
                                  └──signal─── User.save()
                                  
                       (cron / scheduled)
                       │
                       ▼
              manage.py mint_pending
                       │
                       ▼
        services.solana.send_mint_tx ──► Solana devnet
                       │
                       ▼
        services.solana.check_confirmation
                       │
                       ▼
                ChainTx(confirmed)
```

1. Teammate's verifier flow flips `ReportCard.status='approved'` with `stars_awarded > 0`.
2. `apps/chain/signals.py` creates a `ChainTx(status='pending')` row. If the reporter has a `wallet_address` on file it's copied in; otherwise the row sits empty.
3. When the reporter sets a wallet (`PATCH /api/v1/auth/me/ { wallet_address }`), a second signal backfills any of their empty pending rows.
4. `manage.py mint_pending` runs on a schedule. It picks up pending rows with a wallet, signs `MintTo(wallet, amount)` + Memo with the mint authority keypair, submits to Solana, and confirms.
5. The signature is persisted **before** confirmation finishes so a confirm-timeout never causes a double-mint on retry.

---

## Devnet bootstrap (one-time)

You need the Solana CLI installed. (Quick install: `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`.)

```bash
# 1. Generate a mint-authority keypair (this also becomes the fee payer)
solana-keygen new --no-bip39-passphrase -o mint-authority.json

# 2. Fund it with devnet SOL (free)
solana airdrop 2 $(solana-keygen pubkey mint-authority.json) --url devnet

# 3. Create the Stars SPL mint, 0 decimals (1 token = 1 Star)
spl-token create-token --decimals 0 \
    --mint-authority $(solana-keygen pubkey mint-authority.json) \
    --fee-payer mint-authority.json \
    --url devnet
# -> prints the new mint pubkey; save it
```

Then encode the keypair as base58 for `STARS_MINT_AUTHORITY_SECRET`:

```bash
python -c "import json, base58; \
  print(base58.b58encode(bytes(json.load(open('mint-authority.json')))).decode())"
```

Set the env vars (see `.env.example`):

```
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
STARS_MINT_ADDRESS=<mint pubkey from step 3>
STARS_MINT_AUTHORITY_SECRET=<base58 string from above>
STARS_MINT_DECIMALS=0
STARS_MINT_MAX_ATTEMPTS=5
STARS_MINT_BACKOFF_SECONDS=30
```

> **Never commit `mint-authority.json` or the base58 string.** `.env` files are git-ignored. On Railway, paste the base58 secret into Variables.

Run the migration to add the new `ChainTx` fields:

```bash
python manage.py migrate
```

---

## Running the worker

```bash
# One pass and exit (useful in cron, CI smoke checks, or after manual approval)
python manage.py mint_pending --once

# Continuous loop (use for local dev; production should prefer scheduled --once)
python manage.py mint_pending --loop --interval 30
```

The worker is safe to run from multiple processes — each row is taken under `select_for_update` inside a DB transaction, and `ChainTx.report_card` is `OneToOne` so duplicates can't be created.

**Recommended Railway setup:** add a cron service that runs `python manage.py mint_pending --once` every 30s. That keeps the web dyno's memory free and avoids long-lived workers.

---

## End-to-end smoke (devnet)

After bootstrap:

```bash
# 1. Create a test reporter with a wallet
python manage.py shell <<'PY'
from apps.users.models import User
u = User.objects.create_user(
    username='smoke_reporter', password='x',
    role='reporter', wallet_address='<your devnet wallet pubkey>',
)
PY

# 2. Create + approve a card (skipping the normal verifier flow for the smoke)
python manage.py shell <<'PY'
from apps.users.models import User
from apps.report_cards.models import ReportCard
u = User.objects.get(username='smoke_reporter')
c = ReportCard.objects.create(
    submitter=u, title='smoke', description='smoke',
    card_type='collaboration', status='approved', stars_awarded=3,
)
print('card id', c.id)
PY

# 3. Run the worker
python manage.py mint_pending --once

# 4. Inspect
python manage.py shell <<'PY'
from apps.chain.models import ChainTx
print(ChainTx.objects.latest('issued_at').__dict__)
PY
```

Open the printed `explorer_url` — you should see the tx on Solana Explorer with the Memo program output containing `earthteam-stars://report-card/<id>`.

---

## Mint authority rotation

If `STARS_MINT_AUTHORITY_SECRET` ever leaks:

```bash
# 1. Generate a new authority keypair
solana-keygen new --no-bip39-passphrase -o new-authority.json
solana airdrop 1 $(solana-keygen pubkey new-authority.json) --url devnet

# 2. Reassign mint authority on-chain (signed by the old authority)
spl-token authorize <STARS_MINT_ADDRESS> mint $(solana-keygen pubkey new-authority.json) \
    --fee-payer mint-authority.json \
    --owner mint-authority.json \
    --url devnet

# 3. Update STARS_MINT_AUTHORITY_SECRET to the base58 of new-authority.json
# 4. Redeploy / restart the worker
# 5. Destroy mint-authority.json
```

---

## Operational debugging

```bash
# Inspect the queue
python manage.py shell <<'PY'
from apps.chain.models import ChainTx
for t in ChainTx.objects.order_by('-issued_at')[:10]:
    print(t.id, t.status, t.report_card_id, t.attempts, t.wallet_address[:6], t.last_error[:60])
PY

# Force-retry a stuck row (treat the prior signature as dead)
python manage.py shell <<'PY'
from apps.chain.models import ChainTx
t = ChainTx.objects.get(pk=<id>)
t.status = 'pending'
t.tx_signature = ''
t.attempts = 0
t.next_attempt_at = None
t.save()
PY
```

A `failed` row needs manual triage. Once you understand why (look at `last_error`), reset as above.

---

## Mainnet flip checklist

When this graduates beyond MVP:

- [ ] Change `SOLANA_CLUSTER=mainnet-beta` and `SOLANA_RPC_URL` to a paid RPC (Helius / Triton / etc.).
- [ ] Move `STARS_MINT_AUTHORITY_SECRET` out of env into a vault / KMS / signing service. Update `services/solana.py::_load_authority` to fetch from the new source.
- [ ] Tighten `STARS_MINT_MAX_ATTEMPTS` and `STARS_MINT_BACKOFF_SECONDS` to your reliability budget.
- [ ] Add monitoring: alert on any `ChainTx(status='failed')` and on worker pass duration.
- [ ] Add observability: surface ChainTx metrics (queue depth, p95 confirm time, failure rate) in a dashboard.
- [ ] Switch the wallet-adapter network on the frontend (`src/lib/providers/wallet-provider.tsx`).
- [ ] Document who can trigger the admin `POST /api/chain/issue/` fallback path; consider locking it down or removing it.
- [ ] Legal / compliance review of token framing before any mainnet mint.

Until those land, **do not** point this service at mainnet.

---

## API surface (existing, kept for back-compat)

These admin REST endpoints predate the worker and are still useful as a manual fallback when the worker is offline:

- `GET /api/chain/pending/` — approved cards with no `ChainTx` yet (admin / auth)
- `POST /api/chain/issue/<card_id>/` — manually record a signature (admin only)
- `GET /api/chain/tx/<card_id>/` — fetch the recorded tx for a card

The frontend reads `chain_record` directly off `GET /api/v1/report-cards/<id>/` so it gets the live status from the worker without polling these endpoints.
