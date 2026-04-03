# EarthTeam Stars Backend

Python backend for the EarthTeam Stars verification dashboard. Built with Django and Django REST Framework.

## What this does

Handles all the server side logic for submitting and verifying action and impact report cards. Reporters submit cards with evidence. Verifiers review and score them. Once enough verifications come in the system computes a star award and marks the card approved.

## Stack

- Python 3.9
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT authentication via simplejwt

## Getting started

Clone the repo and go into the backend folder.

Install dependencies:
```
pip install -r requirements.txt
```

Copy the env file and fill in your values:
```
cp .env.example .env
```

Run migrations:
```
python manage.py migrate
```

Start the server:
```
python manage.py runserver
```

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
| POST | /api/verifications/:id/ | Submit a verification |
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

Action cards need 5 approvals and award between 5 and 100 stars.
Impact cards need 25 approvals and award between 101 and 500 stars.
These numbers live in the database so an admin can change them without touching code.
