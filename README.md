# Elevate Digital — Client Management System

An internal business management platform covering the full client lifecycle:

```
Client → Projects → Tasks → Team → Progress → Invoice → Payment → Reports
```

Django REST Framework API with a React single-page front end.

---

## Stack

**Backend** — Django 5.0, Django REST Framework, SimpleJWT, django-filter, SQLite in
development and PostgreSQL in production via `DATABASE_URL`.

**Frontend** — React 18, Vite, React Router, Axios, Tailwind CSS, React Hook Form, Recharts.

Money is handled in TZS and the server runs on `Africa/Dar_es_Salaam`.

---

## Setup

Two terminals, one per service.

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # optional; sensible defaults apply without it

python manage.py makemigrations accounts clients projects tasks invoices payments activity
python manage.py migrate
python manage.py runserver
```

The API is then on `http://localhost:8000/api/` and the Django admin on
`http://localhost:8000/admin/`.

**First sign-in.** Open the React app with an empty database and you will be
prompted to create the first administrator account (`POST /api/auth/setup/`).
After that, all business data is created through the app or the API — clients,
projects, tasks, invoices, payments and team members — each module saves with
`POST` and loads lists with `GET`.

To wipe sample records but keep login accounts:

```bash
python manage.py clear_business_data
```

Alternatively, create an admin from the shell:

```bash
cd backend
source .venv/bin/activate          # Linux / macOS
# Windows: .venv\Scripts\activate

python3 manage.py create_admin \
  --email you@yourcompany.co.tz \
  --password 'YourSecurePassword'
```

On Ubuntu, `python` may not exist — use **`python3`** or **`.venv/bin/python`** after activating the venv.

Interactive option (prompts for email and password):

```bash
python3 manage.py createsuperuser
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server expects the API on port 8000; override
with `VITE_API_URL` in `frontend/.env` if it lives elsewhere.

### Switching to PostgreSQL

Set one variable — no code changes:

```bash
DATABASE_URL=postgres://elevate:elevate@localhost:5432/elevate_cms
```

Then `python manage.py migrate`.

---

## Project layout

```
backend/
├── config/          settings, root URLs, WSGI/ASGI
├── core/            shared abstract model, pagination, permissions, data helpers
├── accounts/        custom User (email login) + TeamMember + JWT auth
├── clients/         clients and their relationship rollups
├── projects/        projects, progress derived from tasks
├── tasks/           tasks, assignment, status transitions
├── invoices/        invoices and line items, totals and status
├── payments/        payments, kept in step with invoices by signals
├── activity/        activity log written across the apps
└── reports/         dashboard KPIs and management reports

frontend/src/
├── components/      Sidebar, Header, DataTable, Modal, StatusBadge, ProgressBar, ...
├── pages/           login, dashboard, and one folder per module
├── context/         AuthContext
├── hooks/           useList (search/filter/pagination), useOptions (dropdowns)
├── services/        Axios client with JWT refresh
└── utils/           currency, date and label formatting
```

---

## API

```
POST   /api/auth/login/              email + password → access, refresh, user
POST   /api/auth/logout/             blacklists a refresh token
POST   /api/auth/refresh/            new access token
GET    /api/auth/setup/              { needs_setup } — true when no users exist
POST   /api/auth/setup/              create first administrator (once only)
GET    /api/auth/me/                 signed-in user (PATCH to update)
POST   /api/auth/change-password/

/api/clients/                        CRUD
/api/clients/{id}/overview/          headline numbers for the detail page
/api/clients/{id}/projects/          per-client tabs
/api/clients/{id}/tasks/
/api/clients/{id}/invoices/
/api/clients/{id}/payments/
/api/clients/{id}/activity/

/api/projects/                       CRUD
/api/projects/{id}/tasks/
/api/projects/{id}/progress/         task breakdown behind the progress bar

/api/tasks/                          CRUD
/api/tasks/{id}/set_status/          quick status change
/api/tasks/board/                    grouped by status

/api/team-members/                   CRUD
/api/team-members/workload/
/api/users/                          admin only

/api/invoices/                       CRUD, line items written inline
/api/invoices/{id}/send/             draft → sent
/api/invoices/{id}/cancel/
/api/invoices/refresh_overdue/       flag past-due invoices

/api/payments/                       CRUD
/api/activity/                       read-only feed

/api/reports/dashboard/
/api/reports/revenue/
/api/reports/projects/
/api/reports/clients/
/api/reports/financial/
/api/reports/tasks/
```

List endpoints support `?search=`, `?page=`, `?page_size=`, `?ordering=` and
per-module filters such as `?status=`, `?client=`, `?assigned_to=`, `?overdue=true`,
`?unpaid=true`.

---

## Design decisions worth knowing

**Project progress is derived, never typed in.** `Project.progress` is
`completed tasks / total tasks × 100`, so it cannot drift from reality. A project with
no tasks reports 0%, and one marked Completed reports 100%.

**Invoice totals are stored, not computed on read.** `subtotal_amount`, `tax_amount` and
`total_amount` are rebuilt from the line items whenever those change. Storing them lets
the reports aggregate in SQL rather than in Python.

**Invoice status follows the money.** Recording a payment moves an invoice to Partially
Paid or Paid automatically, through signals on `Payment`, so status stays correct whether
the payment came from the API, the admin or a management command. Draft and Cancelled are
deliberate human choices and are never overwritten. Overpayments are rejected as
data-entry errors.

**Team members are separate from login accounts.** A `TeamMember` can be assigned tasks
without having a `User`, which suits contractors and staff who never sign in. Link the two
when someone needs access.

**The activity log is denormalised on purpose.** Entries record an entity type, id and
name rather than a foreign key, so a log line still reads correctly after the thing it
describes is deleted.

**Roles.** Admins and managers can write; staff have read access plus full control of
tasks, since assignees need to move their own work forward. User administration is
admin-only.

---

## Deploy to Railway

One Docker service serves the React UI and `/api/` (see [`docs/RAILWAY.md`](docs/RAILWAY.md)).

1. Connect this repo to Railway and add a **PostgreSQL** plugin.
2. Set `SECRET_KEY` only (see [`docs/RAILWAY.md`](docs/RAILWAY.md)). Railway’s generated `*.up.railway.app` domain is picked up automatically.
3. Deploy using the root [`Dockerfile`](Dockerfile) and [`railway.toml`](railway.toml).

Helper scripts live in [`scripts/`](scripts/) (`railway-build.sh`, `railway-start.sh`, `railway-release.sh`).

---

## Notes

- `refresh_overdue` is called by the dashboard on load. In production, also run it on a
  daily schedule.
- Access tokens last 60 minutes and refresh tokens 7 days; the Axios client refreshes
  transparently and shares a single in-flight refresh between parallel requests.
- Turn off `DEBUG` in production, which switches on HSTS, secure cookies and SSL redirect.
