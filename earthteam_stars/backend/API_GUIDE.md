# EarthTeam Stars API Guide

Base URL: `https://earthteam-stars-backend-production-2a56.up.railway.app`

All endpoints except register and login require a JWT token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

---

## Authentication

### Register

```
POST /api/auth/register/
```

Body:

```json
{
  "username": "jane",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "reporter"
}
```

Role must be one of: `reporter`, `verifier`, `admin`.

Response `201`:

```json
{
  "username": "jane",
  "email": "jane@example.com",
  "role": "reporter"
}
```

---

### Login

```
POST /api/auth/token/
```

Body:

```json
{
  "username": "jane",
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

The access token expires after a short time. Use the refresh token to get a new one.

---

### Refresh token

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

---

### Get current user

```
GET /api/auth/me/
```

Response `200`:

```json
{
  "id": 1,
  "username": "jane",
  "email": "jane@example.com",
  "role": "reporter",
  "wallet_address": ""
}
```

---

### Update profile

```
PATCH /api/auth/me/
```

Body (all fields optional):

```json
{
  "wallet_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

---

### Dashboard stats

Returns different data depending on your role.

```
GET /api/auth/stats/
```

Response for reporter:

```json
{
  "total_submitted": 4,
  "pending": 1,
  "approved": 2,
  "rejected": 1,
  "total_stars": 47
}
```

Response for verifier:

```json
{
  "queue_size": 12,
  "total_verified": 30,
  "approved": 25,
  "rejected": 5,
  "approval_rate": 83.3
}
```

Response for admin:

```json
{
  "total_cards": 20,
  "pending": 8,
  "approved": 10,
  "rejected": 2,
  "total_verifications": 95
}
```

---

### List verifiers

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

---

### Verifier reputation

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

---

## Report Cards

### List report cards

```
GET /api/report-cards/
```

Optional query params:

| Param | Values | Description |
|---|---|---|
| status | draft, pending, approved, rejected | Filter by status |
| card_type | collaboration, action, impact | Filter by tier |
| mine | true | Only return cards you submitted |

Example: `GET /api/report-cards/?status=pending&card_type=action`

---

### Create a report card

Creates a new card in `draft` status. The reporter must call the submit endpoint separately to put it in the verification queue.

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
  "problem_statement": "Poaching was going undetected due to no monitoring coverage",
  "outputs": "",
  "outcomes": "",
  "results": "",
  "tags": "cameras,wildlife,monitoring",
  "baseline_data": "",
  "measured_data": "",
  "dataset_url": ""
}
```

Field reference:

| Field | Required | Description |
|---|---|---|
| title | yes | Short title for the card |
| description | yes | What the organization did |
| card_type | yes | collaboration, action, or impact |
| intervention_type | no | general, market_demand, poaching, trafficking, regenerative_agriculture, habitat_protection |
| problem_statement | no | What problem was being addressed |
| outputs | no | What was produced (Tier 2) |
| outcomes | no | Early signs of progress (Tier 2.2) |
| results | no | Measured on-ground results (Tier 3) |
| tags | no | Comma-separated tags |
| baseline_data | no | Measurements before the project started (Tier 3) |
| measured_data | no | Measurements after the project (Tier 3) |
| dataset_url | no | Link to an external dataset or report |
| submission_values | no | JSON object mapping ETS indicator IDs to values for precise scoring |

Response `201`: Full report card object.

---

### Get a report card

```
GET /api/report-cards/:id/
```

Response `200`:

```json
{
  "id": 1,
  "submitter": {
    "id": 3,
    "username": "jane",
    "email": "jane@example.com",
    "role": "reporter",
    "wallet_address": ""
  },
  "card_type": "collaboration",
  "intervention_type": "poaching",
  "title": "Wildlife Camera Project",
  "description": "Deployed 12 cameras across 40km of reserve",
  "problem_statement": "Poaching was going undetected",
  "results": "",
  "tags": "cameras,wildlife,monitoring",
  "outputs": "",
  "outcomes": "",
  "baseline_data": "",
  "measured_data": "",
  "dataset_url": "",
  "submission_values": null,
  "status": "draft",
  "stars_awarded": null,
  "evidence": [],
  "witnesses": [],
  "created_at": "2026-04-20T10:00:00Z",
  "updated_at": "2026-04-20T10:00:00Z"
}
```

---

### Edit a draft card

Only works when the card is in `draft` status. Only the submitter can edit.

```
PATCH /api/report-cards/:id/
```

Body: any fields you want to update.

```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

---

### Submit a draft for review

Moves the card from `draft` to `pending`. Only the submitter can do this.

```
POST /api/report-cards/:id/submit/
```

No body required.

Response `200`: Updated card object with `status: "pending"`.

---

### Upgrade tier

Moves a card to the next tier. Cards go collaboration to action to impact. One step at a time. Only the submitter can upgrade. Upgrading resets status to `pending` for re-verification at the new tier.

```
POST /api/report-cards/:id/upgrade/
```

Body:

```json
{
  "card_type": "action"
}
```

---

### Export approved cards

```
GET /api/report-cards/export/
GET /api/report-cards/export/?type=csv
```

Without `?type=csv` returns JSON. With `?type=csv` returns a CSV file download.

---

## Evidence

### Upload evidence

```
POST /api/report-cards/:id/evidence/
```

Send as multipart form data:

```
file: <binary file>
caption: "Camera trap at sector 4"
```

Response `201`:

```json
{
  "id": 1,
  "file": "https://storage.example.com/evidence/photo.jpg",
  "caption": "Camera trap at sector 4",
  "uploaded_at": "2026-04-20T10:05:00Z"
}
```

---

### Delete evidence

```
DELETE /api/report-cards/evidence/:id/
```

Response `204`: No content.

---

## Witnesses

### Add a witness

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

---

### Remove a witness

```
DELETE /api/report-cards/witnesses/:id/
```

Response `204`: No content.

---

## Verifications

### Verifier queue

Returns pending cards that you have not yet verified. This is the main list verifiers work from.

```
GET /api/verifications/queue/
GET /api/verifications/queue/?card_type=collaboration
```

Response `200`: Array of report card objects.

---

### List verifications for a card

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
    "created_at": "2026-04-20T11:00:00Z"
  }
]
```

---

### Submit a verification

Only verifiers can do this. You can only verify each card once.

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
|---|---|---|
| score | yes | Integer from 0 to 100 |
| decision | yes | approve or reject |
| comment | no | Free text feedback |

Response `201`: Verification object.

When enough approvals come in the system automatically computes the star award and marks the card as `approved`. The threshold depends on the tier (1 for collaboration, 5 for action, 25 for impact).

---

## Scoring Rules

### Get scoring rules

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

---

### Update a scoring rule (admin only)

```
PATCH /api/scoring-rules/:id/
```

Body: any fields you want to update.

```json
{
  "min_verifications": 3
}
```

---

## Chain Transactions

### List approved cards without a transaction

Used by the blockchain team to know which approved cards still need a Solana token issued.

```
GET /api/chain/pending/
```

Response `200`: Array of report card objects with `status: "approved"` and no transaction recorded.

---

### Record a Solana transaction (admin only)

Called by the blockchain team after minting the token on Solana devnet.

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

All three fields are required. Returns `400` if the card already has a transaction.

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

---

### Get transaction for a card

```
GET /api/chain/tx/:card_id/
```

Response `200`: Transaction object as above. Returns `404` if no transaction exists.

---

## Error responses

All errors return JSON with an `error` key.

```json
{
  "error": "Only the submitter can edit this card"
}
```

Validation errors return the field name as the key:

```json
{
  "title": ["This field is required."]
}
```

Common status codes:

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | Deleted |
| 400 | Bad request or validation error |
| 401 | Not authenticated |
| 403 | Authenticated but not allowed |
| 404 | Not found |

---

## Test accounts

These accounts exist on the live API for testing:

| Username | Password | Role |
|---|---|---|
| reporter_test | Test2024! | reporter |
| verifier_test | Test2024! | verifier |
| earthteam | EarthTeam2024! | admin |

---

## Typical flows

### Reporter submitting a card

1. `POST /api/auth/token/` to get a token
2. `POST /api/report-cards/` to create a draft
3. `POST /api/report-cards/:id/evidence/` to upload photos
4. `POST /api/report-cards/:id/witnesses/` to add witnesses
5. `POST /api/report-cards/:id/submit/` to send for review
6. `GET /api/report-cards/:id/` to check status later

### Verifier reviewing cards

1. `POST /api/auth/token/` to get a token
2. `GET /api/verifications/queue/` to see pending cards
3. `GET /api/report-cards/:id/` to read a card in detail
4. `POST /api/verifications/:id/submit/` to submit decision

### Blockchain team issuing tokens

1. `GET /api/chain/pending/` to find approved cards needing a token
2. Mint the SPL token on Solana devnet
3. `POST /api/chain/issue/:id/` to record the transaction
