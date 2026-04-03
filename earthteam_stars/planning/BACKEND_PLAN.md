# EarthTeam Stars Backend Plan

This is the planning doc for the backend team. We are building the server side of the EarthTeam Stars verification dashboard. Two people own this. The goal is an MVP in 8 weeks.

We are using Python with Django and Django REST Framework. Database is PostgreSQL.

The source for this plan is the 8-week project proposal and the internal EarthTeam scoring docs. The proposal defines the MVP scope and milestones. The scoring docs define the data fields and verification rules. Everything in this plan traces back to those two sources.


## What the backend is responsible for

- The API that the frontend talks to
- User accounts and login (three roles: reporter / verifier / admin)
- Storing report cards and all their data
- Handling file uploads for evidence (photos and documents)
- Running the scoring logic that figures out how many stars to award
- Keeping an audit trail of every verification decision
- Triggering the blockchain transaction after a report card gets approved
- Exporting verified records as CSV or JSON

The proposal lists these as the core backend duties under section 5 (team structure) and section 2 (MVP scope). Auth and roles are needed because reporters and verifiers have different permissions. File uploads are needed because the report card format requires "show and tell" evidence like photos. The audit trail and exports are explicitly listed as MVP requirements in the proposal under section 2.


## The main things we are storing in the database

**User**
Each person has a role. Reporter submits report cards. Verifier reviews them. Admin can change scoring rules and see everything. The proposal defines these three roles in section 5.

**ReportCard**
This is the core object. It has a type (action or impact) and a status that moves through draft > pending > approved or rejected. It belongs to a reporter. The two types come from the scoring doc which defines Action (Silver) and Impact (Gold) as separate tiers with different rules and star ranges.

**Evidence**
Files attached to a report card. Each file has a URL pointing to wherever we store it (S3 or similar) and an optional caption. The report card format doc says submissions must include "show and tell" evidence like photos so we need somewhere to store these files.

**Witness**
People listed on a report card who can vouch for the action. Just name and contact info. The report card format doc lists witnesses as a required field on every submission.

**Verification**
One record per verifier who reviewed a report card. Has a score a comment and a decision (approve or reject). The verifier dashboard section in the proposal describes rubric-based scoring with approve/reject and comments so each of those maps to a field here.

**ScoringRule**
This is what makes the scoring configurable. Instead of hardcoding star ranges we store the rules in the database. Admin can update them without touching code. The proposal explicitly says "configurable Star ranges and thresholds so leadership can adjust rules without code changes" in section 2. This is the table that makes that possible.

**ChainTx**
After a report card is approved and the blockchain person mints the token we store the transaction info here so we can show the explorer link. The proposal says the system should display an explorer link and store a memo/hash that links back to the report card. That is what this table holds.


## Scoring rules we know so far

Action (Silver) report cards need 5 verifications and award between 5 and 100 stars.

Impact (Gold) report cards need 25 verifications and award between 101 and 500 stars.

These numbers come directly from the "How to Score Stars" document in the internal EarthTeam scoring folder. That doc also mentions a Supreme Court confirmation step for Impact cards but the proposal lists that as out of scope for the MVP so we are not building it yet. We are storing all these numbers in the ScoringRule table so admin can change them later without a code deploy. The proposal calls this out specifically in section 2 under "Scoring Engine".


## API endpoints we need to build

These are grouped by feature area.

Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

Report Cards
- GET /api/report-cards (list filtered by status and type)
- POST /api/report-cards (submit a new one)
- GET /api/report-cards/:id (detail view)
- PATCH /api/report-cards/:id (edit a draft)

Evidence
- POST /api/report-cards/:id/evidence (upload a file)
- DELETE /api/evidence/:id

Verifications
- GET /api/report-cards/:id/verifications (list verifications for a card)
- POST /api/report-cards/:id/verifications (verifier submits their decision)

Scoring
- GET /api/scoring-rules (get current rules)
- PATCH /api/scoring-rules/:id (admin updates a rule)

Exports
- GET /api/exports/verified?format=csv
- GET /api/exports/verified?format=json

Chain
- POST /api/chain/issue/:report_card_id (called after approval to trigger token issuance)
- GET /api/chain/tx/:report_card_id (get transaction info for a card)


## Week by week plan for the backend

**Week 1**
Set up the repo. Get Django running with PostgreSQL. Write all the models. Run the first migrations. Agree with the frontend person on how the API responses should look.

**Week 2**
Build auth (register / login / logout). Add role-based permissions so only verifiers can verify and only admins can touch scoring rules. Set up file upload to Supabase Storage.

**Week 3**
Build the report card submission endpoints. Evidence upload. Witness fields. Basic validation. Write unit tests for the model logic.

**Week 4**
Build the verifier queue endpoints. Implement the scoring engine. When enough verifications come in the system should compute the star award and update the report card status. Add the audit log.

**Week 5**
Work with the blockchain person to agree on how we trigger token issuance after approval. Build the endpoint that calls their service and stores the transaction result.

**Week 6**
Add support for Impact report card fields (before/after data and datasets). Make sure the scoring engine handles both action and impact types correctly.

**Week 7**
Build CSV and JSON exports. Fix bugs found during user testing. Review permissions and make sure nothing is exposed that should not be.

**Week 8**
Final cleanup. Write setup docs. Hand off to EarthTeam.


## Things to agree on with the rest of the team

With frontend: what the API responses look like (field names and shapes) and what errors look like.

With the blockchain person: exactly how we call their code after approval. Do we call a function directly or do we hit their endpoint? What do they return back to us?

With the PM: confirm the default scoring rules before we seed the database.


## Stack summary

- Python 3.11+
- Django 5
- Django REST Framework
- PostgreSQL
- Pillow (for image handling)
- django-storages (for file uploads)
- Supabase Storage (for file storage, see note below)
- pytest-django (for tests)

We picked Django over Node.js for a few reasons. Django has a built-in admin panel which is useful for managing scoring rules without building a custom UI. DRF makes it fast to write serializers and REST endpoints. The team knows Python. The only tradeoff is that the Solana JS library has better docs than the Python equivalent but the blockchain person is handling that side anyway so it does not affect us.

We picked PostgreSQL because the data is relational. Report cards reference users. Verifications reference both report cards and verifiers. Scoring rules apply across many cards. That kind of connected data is what relational databases are built for. MongoDB would make these relationships harder to manage not easier. SQLite does not handle multiple users writing at the same time which matters when several verifiers are reviewing the queue simultaneously. MySQL would also work but PostgreSQL is the Django community default and has better JSON support which helps with the export feature.

For file storage we are using Supabase instead of S3. Nothing in the project documents specifies S3. The proposal just says "decide evidence storage" as a Week 2 task. Supabase is free tier and gives us PostgreSQL plus file storage in one place with less setup overhead. It also uses an S3-compatible API under the hood so if we need to switch to actual S3 later the migration is just swapping environment variables. No code changes are needed. The only extra task would be copying the existing files over which for an MVP takes maybe 10 minutes.
