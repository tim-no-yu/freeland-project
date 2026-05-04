# EarthTeam Stars Backend



## Table of Contents

1. [Purpose and Overview](#purpose-and-overview)
2. [Live API](#live-api)
3. [Admin Panel](#admin-panel)
4. [Tech Stack](#tech-stack)
5. [User Roles](#user-roles)
6. [Folder Structure](#folder-structure)
7. [Local Setup](#local-setup)
8. [Environment Variables](#environment-variables)
9. [Test Suite](#test-suite)
10. [Full System Logic](#full-system-logic)
11. [Scoring Engine](#scoring-engine)
12. [Staged Verification System](#staged-verification-system)
13. [Deployment](#deployment)
13. [API Reference](#api-reference)
    - [Authentication](#authentication)
    - [Report Cards](#report-cards)
    - [Evidence](#evidence)
    - [Witnesses](#witnesses)
    - [Verifications](#verifications)
    - [Scoring Rules](#scoring-rules)
    - [Chain Transactions](#chain-transactions)
    - [Frontend Adapter (v1)](#frontend-adapter-v1)
14. [Blockchain Team Integration](#blockchain-team-integration)
15. [Error Reference](#error-reference)
16. [Test Accounts](#test-accounts)
17. [Common Flows](#common-flows)


## Purpose and Overview

EarthTeam Stars is a conservation impact verification platform. Its goal is to give conservation organizations a credible, structured way to report their work and receive an independently verified star rating. Those stars represent the depth, evidence quality, and real-world impact of the work submitted.

The platform operates in three layers:

1. **Organizations (reporters)** submit report cards that describe conservation work. Each card documents what was done, what problem it addressed, what evidence exists, and who witnessed it.

2. **Verifiers** review those cards and score them based on evidence quality and impact. Their decisions are recorded with scores and comments. A card must collect enough approvals from different verifiers before it advances.

3. **The blockchain team** mints a Solana token for each approved card. The token is a tamper-proof on-chain record of the star award. The backend stores the transaction details so the token can be traced.

### Participation Tiers

There are three tiers of participation. Each tier requires a higher standard of documentation and more verifier scrutiny.

| Tier | Type | Verifications Required | Star Range | Purpose |
||||||
| 1 | Collaboration | 1 | 1 to 21 | Low barrier to entry. For organizations new to formal impact documentation. |
| 2 | Action | 5 | 5 to 100 | For organizations with structured projects, evidence uploads, and measurable outputs. |
| 3 | Impact | 25 | 101 to 500 | For organizations with on-ground measured results and full data sets. |

Organizations can start at Tier 1 and advance upward as they build more documentation. Advancing a tier resets the card to the verification queue so it can be evaluated at the higher standard.



## Live API

```
https://earthteam-stars-backend-production-2a56.up.railway.app
```

This is the deployed production server on Railway. The database is a PostgreSQL instance also hosted on Railway. All data submitted through the frontend or through direct API calls lands here.

Use the `/api/` prefix for the standard API. Use the `/api/v1/` prefix for the frontend adapter layer, which translates field names and formats to match what the Next.js frontend expects.



## Admin Panel

```
URL:      https://earthteam-stars-backend-production-2a56.up.railway.app/admin/
Username: earthteam
Password: EarthTeam2024!
```

The Django admin panel gives direct access to all database records. Use it for tasks that do not have a dedicated API endpoint, such as:

- Promote a user to admin or verifier role
- View every report card, verification record, and blockchain transaction
- Change scoring rules (star ranges, verification thresholds) without a code change
- Adjust ETS parameter weights for the full scoring calculation

Do not share the admin credentials. Create separate admin accounts for each team member who needs access.



## Tech Stack

Each component was selected to match the constraints and timeline of an 8-week student project with production deployment requirements.

| Component | Technology | Reason |
||||
| Language | Python 3.9 | Team familiarity, strong ecosystem for web APIs |
| Web Framework | Django 4.2 | Batteries-included: admin panel, ORM, auth, migrations |
| API Layer | Django REST Framework | Serializers, viewsets, permissions, and response handling |
| Database | PostgreSQL (Railway) | Relational data with foreign keys and integrity constraints |
| Auth | JWT via djangorestframework-simplejwt | Stateless tokens, easy frontend integration |
| File Storage | Supabase Storage (S3-compatible) | External file storage to keep media off the app server |
| Static Files | Whitenoise | Serve static files from the app itself without a CDN |
| WSGI Server | Gunicorn | Production-grade server suitable for Railway deployment |
| CORS | django-cors-headers | Allow the frontend on a separate domain to make API requests |



## User Roles

The platform has three roles. Each role defines what actions a user can take. Roles are set at registration and can be changed through the admin panel.

| Role | What They Can Do |
|||
| reporter | Create report cards in draft status, attach evidence files and witnesses, submit cards for review, and upgrade cards to higher tiers. |
| verifier | See the verification queue filtered to their stage, submit approve or reject decisions with scores and comments. Each verifier can only submit one decision per stage per card. |
| admin | Everything a verifier can do, plus: edit scoring rules, record Solana blockchain transactions, and access the full admin panel. |

A reporter cannot see the verification queue. A verifier cannot submit or edit report cards. These restrictions are enforced at the API level, not just in the frontend.



## Folder Structure

The project is organized as a set of Django apps. Each app owns one domain of the system. This separation makes it easier to locate logic and avoids one large file that handles everything.

```
backend/
  apps/
    users/            User accounts, JWT auth, profile updates, dashboard statistics,
                      and verifier reputation data.

    report_cards/     The core submission model. Handles create, edit, submit,
                      upgrade, evidence upload, witness records, and CSV export.

    verifications/    The review system. Stores verifier decisions per stage,
                      advances cards through the stage sequence, and triggers
                      the scoring calculation when a card completes all stages.

    scoring/          Stores scoring rules (star ranges and thresholds) and the
                      83 ETS parameter weights. Contains the engine that computes
                      the star award for approved cards.

    chain/            Records Solana transaction data after the blockchain team
                      mints a token. Links each approved card to its on-chain proof.

    v1/               A translation adapter for the Next.js frontend. Maps the
                      frontend's field names and formats to the backend's models
                      so neither side needs to change to work with the other.

  earthteam_stars/    Django project settings and the root URL configuration.
  Procfile            Tells Railway how to start the server in production.
  requirements.txt    All Python package dependencies with pinned versions.
  .env.example        Template for environment variables. Copy to .env to start.
```



## Local Setup

Follow these steps in order. Each step depends on the previous one.

**Requirements**

- Python 3.9
- Docker (for the local PostgreSQL database)



**Step 1: Get the code**

```bash
git clone <repo-url>
cd backend
```



**Step 2: Create an isolated Python environment**

A virtual environment keeps the project's packages separate from your system Python. This prevents version conflicts with other projects.

```bash
python3 -m venv venv
source venv/bin/activate       # Mac and Linux
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```



**Step 3: Set up environment variables**

The application reads secrets and configuration from a `.env` file. This file is never committed to git. The `.env.example` file shows every variable the app needs, with placeholder values.

```bash
cp .env.example .env
```

Open `.env` and fill in each value. See the [Environment Variables](#environment-variables) section for a full description of each one.



**Step 4: Start a local PostgreSQL database**

The app requires PostgreSQL. The fastest way to get one locally is with Docker. This command creates a container with the right database name and password to match the defaults in `.env.example`.

```bash
docker run --name earthteam_db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=earthteam_stars \
  -p 5432:5432 -d postgres:15
```



**Step 5: Apply all database migrations**

Django migrations create the tables and seed the initial data. The scoring migrations automatically load the 83 ETS parameter weights and all three scoring rules so the database is ready to use without manual data entry.

```bash
python manage.py migrate
```



**Step 6: Create a local admin user**

This account lets you access the local admin panel at `http://localhost:8000/admin/`.

```bash
python manage.py createsuperuser
```



**Step 7: Start the development server**

```bash
python manage.py runserver
```

The API is now available at `http://localhost:8000`. The admin panel is at `http://localhost:8000/admin/`.



## Environment Variables

These variables control the application's behavior. Never commit a `.env` file with real values to git. The `.gitignore` already excludes `.env` from version control.

| Variable | Required | Description |
||||
| SECRET_KEY | Yes | Django uses this to sign sessions and tokens. Use a long, unpredictable string in production. Never reuse this value across environments. |
| DEBUG | Yes | Set to `True` locally for detailed error pages. Set to `False` in production or the app will leak internal details to the public. |
| ALLOWED_HOSTS | Yes | Comma-separated list of hostnames the server will respond to. Use `.railway.app` in production. |
| DB_NAME | Yes (without DATABASE_URL) | The PostgreSQL database name. |
| DB_USER | Yes (without DATABASE_URL) | The PostgreSQL login username. |
| DB_PASSWORD | Yes (without DATABASE_URL) | The PostgreSQL password. |
| DB_HOST | No | The database host. Defaults to `localhost`. |
| DB_PORT | No | The database port. Defaults to `5432`. |
| DATABASE_URL | No | A full connection URL such as `postgresql://user:pass@host:5432/dbname`. Railway injects this automatically. When present, it overrides the individual DB vars above. |
| SUPABASE_URL | No | The URL of your Supabase project. Required only if you want evidence file uploads to work. |
| SUPABASE_KEY | No | The Supabase service role key. This key has full storage access, so treat it as a secret. |
| SUPABASE_BUCKET | No | The name of the Supabase storage bucket where evidence files land. |



## Test Suite

The test suite covers authentication, report card submission, verification logic, scoring calculations, and blockchain transaction records. Tests are written with Django's built-in test framework and Django REST Framework's `APIClient`. Each test class focuses on one feature area and uses `force_authenticate` to simulate authenticated requests without needing real tokens.

Tests must connect to a real PostgreSQL database because the application uses PostgreSQL-specific behavior. SQLite does not work as a substitute.

### Run all tests

```bash
DATABASE_URL=postgresql://postgres:secret@localhost:5432/earthteam_stars \
  python manage.py test apps --noinput
```

### Run tests for one app only

```bash
DATABASE_URL=postgresql://... python manage.py test apps.verifications --noinput
DATABASE_URL=postgresql://... python manage.py test apps.report_cards --noinput
DATABASE_URL=postgresql://... python manage.py test apps.scoring --noinput
DATABASE_URL=postgresql://... python manage.py test apps.users --noinput
DATABASE_URL=postgresql://... python manage.py test apps.chain --noinput
```

### What is tested

| App | Test Classes | What They Cover |
||||
| users | AuthTests, StatsTests, VerifierReputationTests | Register, login, token refresh, dashboard stats per role, verifier reputation |
| report_cards | ReportCardCreateTests, ReportCardEditTests, SubmitCardTests, WitnessTests, TierUpgradeTests, ListFilterTests, ExportTests | Card creation, editing, collaboration auto-approval, action/impact submit to pending, witness add/delete, tier upgrade rules, list filters, CSV export |
| verifications | VerifierQueueTests, SubmitVerificationTests, StagedVerificationTests, ListVerificationsTests | Queue filters, staged advancement, duplicate prevention, auto-approve on stage completion |
| scoring | ScoringRuleTests, ETSParameterTests | Star range calculation, ETS parameter scoring, simple average fallback |
| chain | ChainPendingTests, ChainIssueTests, ChainGetTests | Pending card list, transaction record, duplicate prevention |

### Key behaviors covered by tests

**Collaboration auto-approval**
- Submitting a collaboration card immediately sets `status = approved`, `stars_awarded = 1`, and `verification_stage = complete`
- Submitting an action or impact card sets `status = pending` and leaves it in the verifier queue

**Staged verification**
- Action cards go through Collaboration stage then Action stage
- A verifier cannot submit two decisions for the same stage of the same card
- Rejecting a card does not block other verifiers from approving at the same stage
- A card advances to the next stage only when at least one verifier approves the current stage

**Permissions**
- Only the card submitter can edit, submit, or upgrade their card
- Only verifiers and admins can access the verification queue
- Only admins can record blockchain transactions

### Writing a new test

All test files follow the same pattern. Create helper functions at the top of the file to avoid repeating setup code, then group related tests into a `TestCase` class.

```python
from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User
from .models import ReportCard


def make_reporter(username='reporter1'):
    return User.objects.create_user(username=username, password='pass', role='reporter')


def make_card(user, card_type='action', status='draft'):
    return ReportCard.objects.create(
        submitter=user, title='Test', description='Test', card_type=card_type, status=status,
    )


class MyNewFeatureTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_reporter()
        self.client.force_authenticate(user=self.reporter)

    def test_something_specific(self):
        card = make_card(self.reporter)
        resp = self.client.post(f'/api/report-cards/{card.id}/submit/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'pending')
```



## Full System Logic

This section explains every rule the backend enforces and why each rule exists. It is written so that any developer, verifier, or team member can understand exactly how the system works without reading code.



### The Three Tiers

Every report card belongs to one of three tiers. The tier determines what information the reporter must provide, how many verifiers must approve it, and how many stars it can earn.

#### Tier 1 — Collaboration (Copper)

**What it is:** The entry point for any individual or organization that wants to participate in the EarthTeam ecosystem. A reporter simply describes who they are and what action they are taking or plan to take to protect a part of the planet.

**What happens when submitted:** The card is approved automatically. No verifier is involved. The system awards exactly 1 star the moment the reporter hits submit. This is intentional — the purpose of the Collaboration tier is to lower the barrier to entry and reward participation itself.

**Stars awarded:** Always 1. No more, no less.

**Verifications required:** Zero. Automatic.

**Why automatic:** The EarthTeam Verifier Guideline states explicitly that Bronze (Collaboration) is automatic upon registration. Verifier time is reserved for Action and Impact cards where evidence must be scrutinized.



#### Tier 2 — Action (Silver)

**What it is:** For reporters who took a concrete, documented action. They must describe what they did, provide evidence (photos, surveys, documents), name witnesses, and report measurable outputs.

**What happens when submitted:** The card enters the verifier queue at the Collaboration stage first. Once a verifier approves the Collaboration stage, the card advances to the Action stage. Once a verifier approves the Action stage, the scoring engine runs and the card is approved.

**Stars awarded:** 2 to 100, calculated by the scoring engine based on verifier scores or ETS parameter values.

**Verifications required:** A minimum of 5 total approvals across both stages before the scoring engine fires.

**Stage sequence:** Collaboration stage first, then Action stage.



#### Tier 3 — Impact (Gold and Platinum)

**What it is:** For reporters with on-ground measured results, typically from projects that ran for 3 or more years. They must provide before-and-after data across at least 1 square kilometer of land.

**What happens when submitted:** The card enters the verifier queue and must pass three sequential stages: Collaboration, then Action, then Impact. Only after all three stages collect enough approvals does the scoring engine fire.

**Stars awarded:** 101 to 500, calculated by the scoring engine.

**Verifications required:** A minimum of 25 total approvals across all three stages.

**Stage sequence:** Collaboration stage, then Action stage, then Impact stage.



### The Staged Verification Sequence

Each card tracks its current position in the verification sequence via the `verification_stage` field. This field starts at `collaboration` for all Action and Impact cards, and advances automatically as stages are approved.

#### How a stage advances

1. A verifier submits an approval decision for the card's current stage.
2. The system checks whether that stage now has at least one approval.
3. If yes, the system calls `next_stage()` to determine what comes next.
4. If there is a next stage, `verification_stage` is updated and the card stays in `pending` status so other verifiers can review the next stage.
5. If there is no next stage (the card has completed all required stages), the scoring engine runs, `stars_awarded` is set, `status` changes to `approved`, and `verification_stage` is set to `complete`.

#### Stage sequences by card type

```
collaboration card:  (auto-approved on submit, no stages needed)

action card:         collaboration  -->  action  -->  complete (approved)

impact card:         collaboration  -->  action  -->  impact  -->  complete (approved)
```

#### Why sequential stages exist

Each tier of evidence (basic participation, documented action, measured impact) requires a different level of scrutiny. A verifier checking a collaboration claim cannot be expected to also evaluate on-ground impact data. The staged system ensures each layer is evaluated independently before the card advances to the next level of scrutiny.



### The Verifier Queue

The verifier queue shows only cards that:

1. Have `status = pending`
2. Are currently at a `verification_stage` the requesting verifier has not yet reviewed

This means a verifier who already submitted a decision for the Collaboration stage of a card will not see that same card again until it advances to the Action stage. The queue is always filtered to show only cards where the verifier can still contribute a new decision.



### One Decision Per Stage Per Verifier

The database enforces a unique constraint on `(report_card, verifier, stage)`. A verifier cannot submit two decisions for the same stage of the same card. If they try, the API returns a `400` error.

A verifier can, however, review the same card at multiple different stages. For example, a verifier who approves the Collaboration stage of an Impact card can also review the Action stage and the Impact stage of that same card later.



### Reject Does Not Block

If a verifier rejects a card at a given stage, the card does not get locked or removed from the queue. Other verifiers can still submit approvals at that same stage. A stage only advances when at least one verifier submits an approval. Rejection alone does not advance or block the card.

This design reflects that a single verifier's negative opinion should not prevent other verifiers from evaluating the same evidence independently.



### The Scoring Engine

When a card completes all its required stages, the scoring engine runs. It decides how many stars to award based on two possible calculation modes.

#### Mode 1 — ETS Parameter Mode

If the reporter submitted `submission_values` (a JSON object that maps ETS indicator IDs to numeric values), the engine uses the full ETS parameter calculation.

The engine:
1. Loads all ETS parameters for the card's intervention type from the database
2. For each parameter, multiplies the submitted value by the stored ETS weight
3. For yes/no parameters, awards the full weight if the value is truthy, zero otherwise
4. Sums all the results
5. Clamps the total to the tier's star range (min to max)

This is the most accurate and preferred path. It reflects exactly how much real-world impact the reporter documented across the Gold Standard indicators.

#### Mode 2 — Simple Average Mode

If no `submission_values` are present, the engine:
1. Takes all verifier scores for the card (0-100 each)
2. Computes the average
3. Maps that average proportionally onto the tier's star range

For example: an Action card with an average verifier score of 80 out of 100 maps onto the range 2-100. That is `2 + (80/100) × (100-2) = 80.4`, rounded to 80 stars.

This mode is the fallback for reporters who did not fill in ETS indicator values.



### ETS Parameters

There are 83 ETS indicator parameters stored in the database across five intervention types:

| Intervention Type | Parameters |
|||
| market_demand | 12 |
| poaching | 16 |
| trafficking | 15 |
| regenerative_agriculture | 19 |
| habitat_protection | 14 |
| collaboration / integrity (general) | 7 |

Each parameter has:
- A unique `indicator_id`
- A human-readable `description`
- A `tier` (output, outcome, or impact)
- A `units` type (number, percent, or yes_no)
- An `ets_weight` that determines how many stars that indicator can contribute

All weights are stored in the database and editable through the Django admin panel without code changes. EarthTeam administrators can adjust weights, add new parameters, or remove obsolete ones at any time.



### Star Ranges

The current star ranges, stored as scoring rules in the database, are:

| Tier | Min Stars | Max Stars | Auto-approved |
|||||
| Collaboration | 1 | 1 | Yes (on submit) |
| Action | 2 | 100 | No (requires verification) |
| Impact | 101 | 500 | No (requires verification) |

These values are editable through the Django admin panel. Changes take effect immediately for all future approvals.



### Chain Transactions (Blockchain Integration)

Approval does not automatically mint a token. The blockchain team handles minting separately. The backend's role in blockchain integration is:

1. Flag approved cards that have not yet received a token (via `GET /api/chain/pending/`)
2. Accept a callback from the blockchain team after minting (via `POST /api/chain/issue/:id/`)
3. Store the transaction signature, memo hash, and Solana explorer URL against the card

This keeps the blockchain integration loosely coupled. If the blockchain team's process changes, the backend does not need to change — only the callback endpoint needs to be called.



### Geographic Area Field

The `geographic_area_sqkm` field on a report card records the size of the land area the project covered, in square kilometers. This is particularly relevant for Impact tier cards, where the EarthTeam specification requires a minimum of 1 square kilometer of coverage.

The field is optional and not enforced at the API level. Verifiers are responsible for checking whether the stated area meets the threshold when reviewing Impact cards. The field is exposed in the admin panel and in all API responses so verifiers have full visibility.



## Scoring Engine

The scoring engine lives in `apps/scoring/engine.py`. It is called automatically when a card completes all required verification stages. The engine determines how many stars to award based on the verifier scores and any ETS parameter data the reporter submitted.

### Two Calculation Modes

**ETS Parameter Mode**

If the reporter submitted a `submission_values` field (a JSON object that maps ETS indicator IDs to numeric values), the engine uses the full ETS parameter calculation. It multiplies each submitted value against the stored weight for that indicator, sums the results, and maps the total onto the card's star range. This mode produces the most accurate star count and is the preferred path for Tier 3 impact cards.

There are 83 ETS indicators stored in the database, organized across six intervention types. Admins can adjust any weight through the admin panel without touching code.

**Simple Mode**

If no `submission_values` are present, the engine averages the scores submitted by all verifiers for that card and maps the resulting average onto the tier's star range. For example, if a collaboration card receives one verification with a score of 80, and the collaboration star range is 1 to 21, the engine awards approximately 17 stars.

### Scoring Rules

Scoring rules define the star ranges and verification thresholds for each tier. They are stored in the database and editable through the admin panel.

| Tier | Min Stars | Max Stars | Min Verifications |
|||||
| collaboration | 1 | 21 | 1 |
| action | 5 | 100 | 5 |
| impact | 101 | 500 | 25 |



## Staged Verification System

Standard verification systems require a fixed number of approvals before a card advances. The EarthTeam Stars platform uses a sequential staged system instead, based on requirements from the verification team.

### How Stages Work

Each card type has a defined sequence of stages. A card must receive at least one approval at the current stage before it can advance to the next. The card tracks its current position in the sequence via the `verification_stage` field.

| Card Type | Stage Sequence |
|||
| Collaboration | Collaboration only |
| Action | Collaboration, then Action |
| Impact | Collaboration, then Action, then Impact |

When a card completes its final stage, the scoring engine computes the star award and the card status changes to `approved`.

### Rules for Verifiers

- A verifier can only submit one decision per stage per card. The database enforces this with a unique constraint on `(report_card, verifier, stage)`.
- A rejection at a stage does not block other verifiers from submitting approvals at that same stage. The card only advances when at least one verifier approves.
- The verifier queue only shows cards that are at a stage the current verifier has not yet reviewed. This prevents duplicate reviews.

### Why This Design

The staged approach ensures that each layer of evidence (collaboration evidence, action outputs, impact data) receives independent scrutiny before the next layer is evaluated. A Tier 2 action card cannot be approved on impact-level criteria without first passing the collaboration standard.



## Deployment

The application is configured for zero-downtime deployment to Railway. Railway detects the `Procfile` and executes it to start the server.

**Procfile contents:**

```
web: python manage.py migrate && python manage.py collectstatic --noinput && gunicorn earthteam_stars.wsgi
```

This ensures migrations are always applied and static files are always collected before the server accepts traffic.

### Deploy from Scratch on Railway

1. Create a new Railway project and connect it to the GitHub repository.
2. Add a PostgreSQL database from the Railway dashboard. Railway will automatically inject the `DATABASE_URL` environment variable into your app.
3. In the Railway Variables tab, set the following:

```
SECRET_KEY=<long random string, at least 50 characters>
DEBUG=False
ALLOWED_HOSTS=.railway.app
```

4. Push a commit to the main branch. Railway will build and deploy automatically.
5. Create the first admin user. Use the Railway public database URL to connect from your local machine:

```bash
DATABASE_URL=<public url from Railway dashboard> python manage.py createsuperuser
```

### Subsequent Deployments

Push to main. Railway handles the rest. The Procfile guarantees migrations apply on every deploy, so new schema changes take effect without manual intervention.



## API Reference

### Base URL

```
https://earthteam-stars-backend-production-2a56.up.railway.app
```

### Authentication Header

All endpoints except register and login require a valid JWT access token. Pass it in the `Authorization` header on every request:

```
Authorization: Bearer <your_access_token>
```

If the token is missing or expired, the server returns `401`.



### Authentication

This section covers how users log in, refresh their tokens, and view or update their profile.



#### Register

Creates a new user account. The role must be set at registration. Use the admin panel to change a role after creation.

```
POST /api/auth/register/
```

Body:

```json
{
  "username": "caesar",
  "email": "caesar@example.com",
  "password": "securepassword",
  "role": "reporter"
}
```

Valid roles: `reporter`, `verifier`, `admin`.

Response `201`:

```json
{
  "username": "caesar",
  "email": "caesar@example.com",
  "role": "reporter"
}
```



#### Login

Returns a JWT access token and a refresh token. The access token must be sent with every subsequent request. The refresh token is used to obtain a new access token when the current one expires.

```
POST /api/auth/token/
```

Body:

```json
{
  "username": "caesar",
  "password": "securepassword"
}
```

Response `200`:

```json
{
  "access": "<jwt access token>",
  "refresh": "<jwt refresh token>"
}
```



#### Refresh Token

The access token expires after a short period. Use the refresh token to obtain a new access token without asking the user to log in again.

```
POST /api/auth/token/refresh/
```

Body:

```json
{
  "refresh": "<jwt refresh token>"
}
```

Response `200`:

```json
{
  "access": "<new jwt access token>"
}
```



#### Get Current User

Returns the profile of the user who owns the token in the request header.

```
GET /api/auth/me/
```

Response `200`:

```json
{
  "id": 1,
  "username": "caesar",
  "email": "caesarluotingjun@gmail.com",
  "role": "reporter",
  "wallet_address": ""
}
```

The `wallet_address` field is used by the blockchain team to associate a Solana wallet with the account.



#### Update Profile

Updates the current user's profile. Only the `wallet_address` field can be changed through this endpoint. To change the role or email, use the admin panel.

```
PATCH /api/auth/me/
```

Body:

```json
{
  "wallet_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```



#### Dashboard Stats

Returns summary statistics for the dashboard. The data differs based on the caller's role so each type of user sees metrics relevant to their own work.

```
GET /api/auth/stats/
```

Response for reporter (shows the status of cards they submitted):

```json
{
  "total_submitted": 4,
  "pending": 1,
  "approved": 2,
  "rejected": 1,
  "total_stars": 47
}
```

Response for verifier (shows their review activity):

```json
{
  "queue_size": 12,
  "total_verified": 30,
  "approved": 25,
  "rejected": 5,
  "approval_rate": 83.3
}
```

Response for admin (shows platform-wide counts):

```json
{
  "total_cards": 20,
  "pending": 8,
  "approved": 10,
  "rejected": 2,
  "total_verifications": 95
}
```



#### List Verifiers

Returns a list of all verifier accounts with their activity summary. Useful for the admin dashboard to monitor verifier engagement.

```
GET /api/auth/verifiers/
```

Response `200`:

```json
[
  {
    "id": 2,
    "username": "verifier1",
    "total_verified": 30,
    "approval_rate": 83.3
  }
]
```



#### Verifier Reputation

Returns detailed statistics for a single verifier. This data forms the basis of the verifier reputation system, which helps admins identify verifiers who may be too lenient or too strict.

```
GET /api/auth/verifiers/:id/
```

Response `200`:

```json
{
  "id": 2,
  "username": "verifier1",
  "total_verified": 30,
  "approved": 25,
  "rejected": 5,
  "approval_rate": 83.3,
  "average_score_given": 78.4
}
```



### Report Cards

Report cards are the central object of the platform. A card starts in `draft` status, advances to `pending` when submitted for review, and ends in `approved` or `rejected` after verification.



#### List Report Cards

Returns all report cards. Supports filters to narrow results.

```
GET /api/report-cards/
```

Optional query parameters:

| Param | Accepted Values | Description |
||||
| status | draft, pending, approved, rejected | Only return cards with this status |
| card_type | collaboration, action, impact | Only return cards of this tier |
| mine | true | Only return cards submitted by the current user |

Example: `GET /api/report-cards/?status=pending&card_type=action`



#### Create a Report Card

Creates a new card in `draft` status. The card is not sent to verifiers yet. The reporter reviews it first and then calls the submit endpoint when ready.

```
POST /api/report-cards/
```

Body:

```json
{
  "title": "Wildlife Camera Project",
  "description": "Deployed 12 cameras across 40km of reserve",
  "card_type": "collaboration",
  "intervention_type": "poaching",
  "problem_statement": "Poaching went undetected due to lack of surveillance",
  "outputs": "",
  "outcomes": "",
  "results": "",
  "tags": "cameras,wildlife,surveillance",
  "baseline_data": "",
  "measured_data": "",
  "dataset_url": ""
}
```

Field reference:

| Field | Required | Description |
||||
| title | Yes | Short title that identifies the project |
| description | Yes | Clear account of what the organization did |
| card_type | Yes | collaboration, action, or impact |
| intervention_type | No | general, market_demand, poaching, trafficking, regenerative_agriculture, habitat_protection |
| problem_statement | No | The problem the project was designed to address |
| outputs | No | Concrete deliverables produced (Tier 2 and above) |
| outcomes | No | Early measurable changes observed (Tier 2 and above) |
| results | No | Final on-ground results with measurements (Tier 3 only) |
| tags | No | Comma-separated keyword tags for search and filter |
| baseline_data | No | Conditions measured before the project started (Tier 3) |
| measured_data | No | Conditions measured after the project ended (Tier 3) |
| dataset_url | No | Link to an external data set, report, or publication |
| submission_values | No | JSON object that maps ETS indicator IDs to numeric values. Enables the full ETS scoring calculation instead of the simplified average. |

Response `201`: The full report card object.



#### Get a Report Card

Returns the full detail for one card, with all evidence files, witnesses, and the current verification stage.

```
GET /api/report-cards/:id/
```

Response `200`:

```json
{
  "id": 1,
  "submitter": {
    "id": 3,
    "username": "caesar",
    "email": "caesarluotingjun@gmail.com",
    "role": "reporter",
    "wallet_address": ""
  },
  "card_type": "collaboration",
  "intervention_type": "poaching",
  "title": "Wildlife Camera Project",
  "description": "Deployed 12 cameras across 40km of reserve",
  "problem_statement": "Poaching went undetected",
  "results": "",
  "tags": "cameras,wildlife,surveillance",
  "outputs": "",
  "outcomes": "",
  "baseline_data": "",
  "measured_data": "",
  "dataset_url": "",
  "submission_values": null,
  "status": "draft",
  "verification_stage": "collaboration",
  "stars_awarded": null,
  "evidence": [],
  "witnesses": [],
  "created_at": "2026-04-20T10:00:00Z",
  "updated_at": "2026-04-20T10:00:00Z"
}
```

The `verification_stage` field shows which stage the card is currently at. The `stars_awarded` field is null until the card is fully approved.



#### Edit a Draft Card

Allows the submitter to revise a card before it enters the verification queue. Only cards with `draft` status can be edited. Only the user who created the card can edit it.

```
PATCH /api/report-cards/:id/
```

Body: send only the fields to update.

```json
{
  "title": "Updated Title",
  "description": "Revised description with more detail"
}
```



#### Submit a Draft for Review

Moves the card from `draft` to `pending` and places it in the verifier queue. This action cannot be undone without admin intervention. Only the submitter can call this endpoint.

```
POST /api/report-cards/:id/submit/
```

No body required.

Response `200`: Updated card object with `status: "pending"`.



#### Upgrade Tier

Moves a card from its current tier to the next tier. Cards can only advance one tier at a time, and only in the direction collaboration to action to impact. Upgrade resets the card to `pending` so verifiers evaluate it at the new standard. Only the submitter can upgrade.

```
POST /api/report-cards/:id/upgrade/
```

Body:

```json
{
  "card_type": "action"
}
```



#### Export Approved Cards

Returns all approved cards as JSON or CSV. This endpoint is used to extract verified impact data for external analysis or reporting.

```
GET /api/report-cards/export/
GET /api/report-cards/export/?type=csv
```

Without `?type=csv`, returns a JSON array. With `?type=csv`, returns a downloadable CSV file with one row per card.



### Evidence

Evidence files are attached to a specific report card. They can be photos, PDFs, spreadsheets, or any file format that documents the work. Files are stored in Supabase Storage and the URL is saved in the database.



#### Upload Evidence

```
POST /api/report-cards/:id/evidence/
```

Send as `multipart/form-data`, not JSON, because the body contains a binary file.

```
file:    <binary file>
caption: "Camera trap photo at sector 4 boundary"
```

Response `201`:

```json
{
  "id": 1,
  "file": "https://storage.example.com/evidence/photo.jpg",
  "caption": "Camera trap photo at sector 4 boundary",
  "uploaded_at": "2026-04-20T10:05:00Z"
}
```



#### Delete Evidence

Removes a single evidence record and its associated file.

```
DELETE /api/report-cards/evidence/:id/
```

Response `204`: No content.



### Witnesses

Witnesses are people who can vouch for the work described in a report card. They are stored as contact records attached to the card. The verification team may contact them during review.



#### Add a Witness

```
POST /api/report-cards/:id/witnesses/
```

Body:

```json
{
  "name": "John Kamau",
  "email": "john@example.com",
  "contact": "+254700000000"
}
```

Response `201`:

```json
{
  "id": 1,
  "name": "John Kamau",
  "email": "john@example.com",
  "contact": "+254700000000"
}
```



#### Remove a Witness

```
DELETE /api/report-cards/witnesses/:id/
```

Response `204`: No content.



### Verifications

This section covers the verifier workflow. Verifiers use the queue to find cards, read the full card detail, and then submit a scored decision.



#### Verifier Queue

Returns all cards that are currently pending and that the current verifier has not yet reviewed at their active stage. A card disappears from this list for a specific verifier once they submit a decision for the current stage, even if the card has not advanced yet.

```
GET /api/verifications/queue/
GET /api/verifications/queue/?card_type=collaboration
```

Response `200`: Array of report card objects.



#### List Verifications for a Card

Returns every verification decision that has been submitted for a given card, across all stages. This gives a full audit trail of who reviewed the card, when, and what they decided.

```
GET /api/verifications/:card_id/
```

Response `200`:

```json
[
  {
    "id": 1,
    "verifier": {
      "id": 2,
      "username": "verifier1",
      "role": "verifier"
    },
    "score": 85,
    "comment": "Strong evidence and clear documentation",
    "decision": "approve",
    "stage": "collaboration",
    "created_at": "2026-04-20T11:00:00Z"
  }
]
```



#### Submit a Verification

Records one verifier's decision for the card's current stage. A verifier can only submit once per stage per card. The server enforces this at the database level with a unique constraint.

```
POST /api/verifications/:card_id/submit/
```

Body:

```json
{
  "score": 85,
  "decision": "approve",
  "comment": "Strong evidence and clear documentation"
}
```

Field reference:

| Field | Required | Description |
||||
| score | Yes | An integer from 0 to 100 that represents the verifier's overall quality assessment |
| decision | Yes | `approve` or `reject` |
| comment | No | Free text feedback for the reporter or for the record |

Response `201`: The verification object.

After each submission, the server checks whether the current stage has enough approvals to advance. If it does, the card moves to the next stage automatically. If the card has completed all required stages, the scoring engine computes the star award and marks the card as `approved`.



### Scoring Rules

Scoring rules define the acceptable range of stars and the minimum number of verifications for each tier. These rules are stored in the database so an admin can adjust them without a code deployment.



#### Get Scoring Rules

```
GET /api/scoring-rules/
```

Response `200`:

```json
[
  {
    "id": 3,
    "card_type": "collaboration",
    "min_stars": 1,
    "max_stars": 21,
    "min_verifications": 1,
    "updated_at": "2026-04-13T17:07:26Z"
  },
  {
    "id": 1,
    "card_type": "action",
    "min_stars": 5,
    "max_stars": 100,
    "min_verifications": 5,
    "updated_at": "2026-04-13T17:07:26Z"
  },
  {
    "id": 2,
    "card_type": "impact",
    "min_stars": 101,
    "max_stars": 500,
    "min_verifications": 25,
    "updated_at": "2026-04-13T17:07:26Z"
  }
]
```



#### Update a Scoring Rule (Admin Only)

Allows an admin to adjust the star range or verification threshold for any tier. The change takes effect immediately for all future approvals.

```
PATCH /api/scoring-rules/:id/
```

Body: send only the fields to change.

```json
{
  "min_verifications": 3
}
```



### Chain Transactions

When a report card is approved, the backend flags it as ready for a Solana token. The blockchain team polls for these cards, mints the token, and then calls back to record the transaction. This section covers those endpoints.



#### List Approved Cards Without a Transaction

Returns all cards with `status: "approved"` that do not yet have a recorded Solana transaction. This is the polling endpoint for the blockchain team.

```
GET /api/chain/pending/
```

Response `200`: Array of report card objects.



#### Record a Solana Transaction (Admin Only)

Called by the blockchain team after the token is minted. Stores the transaction signature, memo hash, and explorer URL so the on-chain record can be traced back to the report card.

```
POST /api/chain/issue/:card_id/
```

Body:

```json
{
  "tx_signature": "5KtPn1...abc",
  "memo_hash": "sha256:abcdef...",
  "explorer_url": "https://explorer.solana.com/tx/5KtPn1?cluster=devnet"
}
```

All three fields are required. Returns `400` if a transaction has already been recorded for this card.

Response `201`:

```json
{
  "id": 1,
  "tx_signature": "5KtPn1...abc",
  "memo_hash": "sha256:abcdef...",
  "explorer_url": "https://explorer.solana.com/tx/5KtPn1?cluster=devnet",
  "issued_at": "2026-04-20T12:00:00Z"
}
```



#### Get Transaction for a Card

Retrieves the transaction record for a specific card. Returns `404` if no transaction has been recorded yet.

```
GET /api/chain/tx/:card_id/
```

Response `200`: Transaction object as shown above.



### Frontend Adapter (v1)

The frontend team built their Next.js application before the backend API was finalized. Their code expects specific field names, status values, and formats that differ from the standard backend API. Rather than change the frontend or the core backend, an adapter layer was created at the `/api/v1/` prefix.

The adapter translates all requests and responses between the two formats transparently. The frontend never needs to know about the internal model structure.

**Field name differences:**

| Concept | Standard API field | v1 Adapter field | Reason for difference |
|||||
| Card type | `card_type` | `type` | Frontend uses a shorter key |
| Category | `intervention_type` (internal code) | `category` (human name) | Frontend displays category labels, not codes |
| Card creator | `submitter` (user object) | `reporter` (user object) | Frontend uses the term "reporter" |
| In-review status | `pending` | `submitted` | Frontend shows "submitted" to users |
| Tags | Comma-separated string | Array of strings | Frontend sends and receives JSON arrays |

**v1 Endpoints:**

| Method | Path | Description |
||||
| POST | /api/v1/auth/login/ | Login with username or email |
| GET / PATCH | /api/v1/auth/me/ | Get or update current user |
| GET / POST | /api/v1/report-cards/ | List all cards or create a new one |
| GET / PATCH | /api/v1/report-cards/:id/ | Get full card detail or edit a draft |
| POST | /api/v1/report-cards/:id/submit/ | Submit a draft card for review |
| POST | /api/v1/report-cards/:id/evidence/ | Upload an evidence file |
| GET | /api/v1/verifier/queue/ | Get the verification queue |
| POST | /api/v1/verifier/reviews/ | Submit a verification decision |
| GET | /api/v1/exports/verified-actions/ | Export approved cards as JSON or CSV |



## Blockchain Team Integration

The backend does not mint tokens or interact with Solana directly. That responsibility belongs to the blockchain team. The backend's role is to flag approved cards and to record the result after a token is minted.

**Integration flow, step by step:**

1. Poll `GET /api/chain/pending/` to find all approved cards that have not yet received a token. This endpoint returns an array. If empty, there is nothing to do.
2. For each card in the array, mint an SPL token on Solana devnet. The `stars_awarded` field on the card object is the authoritative star count to encode in the token.
3. After a successful mint, call `POST /api/chain/issue/:card_id/` with the transaction signature, memo hash, and explorer URL. This call requires an admin JWT token.
4. The backend stores the record. The card will no longer appear in the pending list. The transaction is now visible via `GET /api/chain/tx/:card_id/`.

**Admin account requirement**

The `/api/chain/issue/` endpoint requires the `admin` role. The blockchain team must have an admin account. Ask the project lead to create one through the Django admin panel.



## Error Reference

All errors follow a consistent JSON structure. A field named `error` carries the human-readable message.

```json
{
  "error": "Only the submitter can edit this card"
}
```

Validation errors use the field name as the key and return an array of messages:

```json
{
  "title": ["This field is required."]
}
```

Common HTTP status codes and their meaning in this API:

| Code | Meaning |
|||
| 200 | Request succeeded. |
| 201 | A new record was created successfully. |
| 204 | The record was deleted. No content is returned. |
| 400 | The request body was invalid or a business rule was violated. Check the `error` field for details. |
| 401 | No valid token was provided. Log in and include the access token in the Authorization header. |
| 403 | A valid token was provided but the user's role does not permit this action. |
| 404 | The requested record does not exist. |



## Test Accounts

These accounts are seeded on the live production API for manual test and demonstration purposes. Do not use these accounts to submit real data.

| Username | Password | Role | Use Case |
|||||
| reporter_test | Test2024! | reporter | Test card submission, evidence upload, witness management |
| verifier_test | Test2024! | verifier | Test the verification queue and decision submission |
| earthteam | EarthTeam2024! | admin | Full access, admin panel, scoring rule edits, token records |



## Common Flows

These are the step-by-step sequences for the three main user journeys. Each step is a single API call.

### Reporter: Submit a Card for Review

1. `POST /api/auth/token/` to obtain an access token
2. `POST /api/report-cards/` to create a new draft card
3. `POST /api/report-cards/:id/evidence/` to attach one or more files
4. `POST /api/report-cards/:id/witnesses/` to add a witness
5. `POST /api/report-cards/:id/submit/` to send the card to the verifier queue
6. `GET /api/report-cards/:id/` to check status and `verification_stage` over time

### Verifier: Review a Card

1. `POST /api/auth/token/` to obtain an access token
2. `GET /api/verifications/queue/` to see cards at the current stage awaiting review
3. `GET /api/report-cards/:id/` to read the full card detail before deciding
4. `POST /api/verifications/:card_id/submit/` to submit a scored decision

### Blockchain Team: Record a Token Issuance

1. `GET /api/chain/pending/` to find approved cards without a token
2. Mint the SPL token on Solana devnet for each card
3. `POST /api/chain/issue/:card_id/` to record the transaction data in the backend
4. `GET /api/chain/tx/:card_id/` to confirm the record was saved
