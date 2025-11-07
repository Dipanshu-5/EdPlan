# EduPlan FastAPI Backend

This service replaces the legacy ASP.NET Core API. It exposes the same routes the React
frontend expects via FastAPI and persists data in Microsoft SQL Server using SQLAlchemy.

## Features

- JWT authentication with password hashing via `passlib`.
- Education plan CRUD, course scheduling, reschedule workflows.
- Customer, dashboard, and global lookup APIs.
- Email and SMS notifications powered by SMTP and Twilio.
- Alembic migrations for schema management.

## Getting Started

```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\\Scripts\\activate on Windows
pip install -e .[dev]
cp .env.example .env
uvicorn app.main:app --reload
```

Set `DATABASE_URL` to an aioodbc SQL Server connection string (URL-encoded), e.g.
```
DATABASE_URL="mssql+aioodbc:///?odbc_connect=DRIVER%3DODBC+Driver+18+for+SQL+Server%3BSERVER%3Dlocalhost%2C1433%3BDATABASE%3DEduPlan%3BUID%3Dsa%3BPWD%3DStrongPass123%3BEncrypt%3Dno"
```

Provide your College Scorecard API key via `COLLEGE_SCORECARD_API_KEY` (see
https://collegescorecard.ed.gov/data/documentation/) so the backend can proxy
all university lookups.

Run migrations after configuring the DB:

```bash
alembic upgrade head
```

See `.env.example` for the full list of required settings.
