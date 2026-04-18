# EarthTeam Stars Backend

Python backend for the EarthTeam Stars verification dashboard. Built with Django and Django REST Framework.

## What this does

Handles all the server side logic for submitting and verifying report cards. There are three tiers: collaboration, action and impact. Reporters submit cards with evidence and witnesses. Verifiers review and score them. Once enough verifications come in the system computes a star award using weighted parameters pulled from the database and marks the card approved.

## Stack

- Python 3.9
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT authentication via simplejwt

## Getting started

You need Python 3.9+ and Docker installed before starting.

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
docker run --name earthteam_db -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=earthteam_stars -p 5432:5432 -d postgres:15
```

Make sure the DB_PASSWORD in your .env matches what you set above.

Run migrations:
```
python manage.py migrate
```

Start the server:
```
python manage.py runserver
```

The API will be running at http://localhost:8000

## Folder structure

```
apps/
    users/          user accounts and auth
    report_cards/   report card submission and evidence uploads
    verifications/  verifier queue and decisions
    scoring/        scoring rules and star calculation
    chain/          Solana transaction records
earthteam_stars/    project settings and main urls
```

## API overview

| Method | URL | What it does |
|---|---|---|
| POST | /api/auth/register/ | Create an account |
| POST | /api/auth/token/ | Log in and get a token |
| POST | /api/auth/token/refresh/ | Refresh your token |
| GET | /api/report-cards/ | List all report cards |
| POST | /api/report-cards/ | Submit a new report card |
| GET | /api/report-cards/:id/ | Get one report card |
| PATCH | /api/report-cards/:id/ | Edit a draft |
| POST | /api/report-cards/:id/evidence/ | Upload evidence |
| GET | /api/verifications/:id/ | List verifications for a card |
| POST | /api/verifications/:id/submit/ | Submit a verification |
| POST | /api/report-cards/:id/witnesses/ | Add a witness |
| DELETE | /api/report-cards/witnesses/:id/ | Remove a witness |
| GET | /api/scoring-rules/ | Get current scoring rules |
| PATCH | /api/scoring-rules/:id/ | Update a rule (admin only) |
| GET | /api/report-cards/export/?format=csv | Export verified cards |
| POST | /api/chain/issue/:id/ | Record a chain transaction |
| GET | /api/chain/tx/:id/ | Get transaction for a card |

## Roles

- **reporter** can submit report cards and upload evidence
- **verifier** can review and score report cards
- **admin** can update scoring rules and see everything

## Scoring rules

There are three tiers with different requirements:

- Collaboration: 1 verification needed, awards 1 to 21 stars
- Action: 5 verifications needed, awards 5 to 100 stars
- Impact: 25 verifications needed, awards 101 to 500 stars

Stars are calculated using weighted parameters from the EarthTeam Score Calculator. There are 83 parameters across 5 intervention types (market demand, poaching, trafficking, regenerative agriculture, habitat protection). All weights live in the database and admins can edit them through the Django admin panel at /admin/ without touching code.
