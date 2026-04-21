# EarthTeam Stars Backend

Python backend for the EarthTeam Stars verification dashboard. Built with Django and Django REST Framework.

## What this does

This is the server side of the EarthTeam Stars platform. Organizations submit report cards describing their conservation work. Verifiers review and score those cards. Once enough verifications come in the system computes a star award and marks the card approved. Stars can then be issued as Solana tokens by the blockchain team.

There are three tiers of participation:

- Collaboration (Tier 1): low barrier to entry. One verification needed. Awards 1 to 21 stars.
- Action (Tier 2): requires detailed project info and evidence. Five verifications needed. Awards 5 to 100 stars.
- Impact (Tier 3): for projects with measured on-ground results. Twenty-five verifications needed. Awards 101 to 500 stars.

Organizations can start at collaboration and upgrade to action or impact as they submit more evidence.

## Live API

```
https://earthteam-stars-backend-production-2a56.up.railway.app
```

## Admin panel

```
https://earthteam-stars-backend-production-2a56.up.railway.app/admin/
Username: earthteam
Password: EarthTeam2024!
```

## Stack

- Python 3.9
- Django 4.2
- Django REST Framework
- PostgreSQL (hosted on Railway)
- JWT authentication via djangorestframework-simplejwt
- Whitenoise for static files
- django-cors-headers for frontend requests
- Supabase Storage for evidence file uploads (S3-compatible)
- Gunicorn as the production WSGI server

## Roles

There are three roles. Each role has different permissions.

- **reporter** can create report cards, upload evidence, add witnesses, submit cards for review, and upgrade tiers
- **verifier** can browse the verification queue and submit decisions with scores and comments
- **admin** can update scoring rules, record blockchain transactions, and access everything

## Running locally

You need Python 3.9 and Docker installed.

Clone the repo and go into the backend folder:

```
git clone <repo-url>
cd backend
```

Create a virtual environment and install dependencies:

```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy the env file and fill in your values:

```
cp .env.example .env
```

Start the database with Docker:

```
docker run --name earthteam_db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=earthteam_stars \
  -p 5432:5432 -d postgres:15
```

Run migrations and seed data:

```
python manage.py migrate
```

Create a local admin account:

```
python manage.py createsuperuser
```

Start the server:

```
python manage.py runserver
```

The API runs at http://localhost:8000

## Folder structure

```
backend/
  apps/
    users/          accounts, auth, profile, dashboard stats, verifier reputation
    report_cards/   report card submission, evidence uploads, witnesses
    verifications/  verifier queue and scoring decisions
    scoring/        scoring rules and ETS star calculation engine
    chain/          Solana transaction records
  earthteam_stars/  Django settings and root URL config
  Procfile          Railway deploy command
  requirements.txt  Python dependencies
  .env.example      Environment variable template
```

## Environment variables

Copy `.env.example` to `.env` and fill in each value.

| Variable | Required | Description |
|---|---|---|
| SECRET_KEY | yes | Django secret key. Use a long random string. |
| DEBUG | yes | Set to False in production. |
| ALLOWED_HOSTS | yes | Comma-separated list of allowed hostnames. |
| DB_NAME | yes (if no DATABASE_URL) | PostgreSQL database name. |
| DB_USER | yes (if no DATABASE_URL) | PostgreSQL username. |
| DB_PASSWORD | yes (if no DATABASE_URL) | PostgreSQL password. |
| DB_HOST | no | Database host. Defaults to localhost. |
| DB_PORT | no | Database port. Defaults to 5432. |
| DATABASE_URL | no | Full database URL. Used by Railway. Overrides individual DB vars. |
| SUPABASE_URL | no | Supabase project URL for file storage. |
| SUPABASE_KEY | no | Supabase service role key. |
| SUPABASE_BUCKET | no | Supabase storage bucket name. |

## Running tests

Tests run against a real PostgreSQL database. Pass a `DATABASE_URL` pointing to your database.

```
DATABASE_URL=postgresql://postgres:secret@localhost:5432/earthteam_stars \
  python manage.py test apps --noinput
```

There are 61 tests covering auth, report cards, verifications, scoring, and chain transactions. All pass.

## Scoring engine

Stars are calculated in two ways depending on the data available.

If the reporter submitted `submission_values` (a JSON object mapping ETS indicator IDs to values), the engine runs the full ETS parameter calculation using the 83 weighted indicators stored in the database. This produces the most accurate star count.

If no submission values are present, the engine averages the verifier scores and maps that average onto the tier star range.

Admins can edit all 83 parameter weights through the Django admin panel without touching code. Scoring rules (star ranges and verification thresholds) are also editable through the admin panel.

## Deployment

The app deploys to Railway automatically when code is pushed to the main branch. The Procfile runs migrations and collects static files before starting gunicorn.

To deploy from scratch on Railway:

1. Create a new Railway project and connect the GitHub repo.
2. Add a PostgreSQL database. Railway injects DATABASE_URL automatically.
3. Add these environment variables in the Railway Variables tab:

```
SECRET_KEY=<long random string>
DEBUG=False
ALLOWED_HOSTS=.railway.app
```

4. Push to main. Railway will build and deploy.
5. Create an admin user by running locally with the Railway public database URL:

```
DATABASE_URL=<public url from Railway> python manage.py createsuperuser
```

## Connecting the blockchain team

When a report card is approved the backend does not automatically trigger a Solana transaction. That is the blockchain team's responsibility. Here is the integration flow:

1. The blockchain team polls `GET /api/chain/pending/` to find approved cards that have not been issued a token yet.
2. After minting the token on Solana devnet they call `POST /api/chain/issue/:id/` with the transaction signature, memo hash, and explorer URL.
3. The backend stores the transaction and it becomes visible via `GET /api/chain/tx/:id/`.

The blockchain team needs an admin account to call the issue endpoint. Ask your project lead to create one through the admin panel.
