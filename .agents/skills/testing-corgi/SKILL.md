# Testing the Corgi Image Library

## Environment Setup

### Docker Compose
The app runs via Docker Compose with three services: `frontend` (Vite), `backend` (FastAPI), `db` (PostgreSQL 16).

```bash
# Fresh start (required when DB schema changes)
docker compose down -v && docker compose up --build

# Regular restart (preserves data)
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- The frontend proxies `/api` requests to the backend via Vite config.

### Important: Schema Changes
When adding new database tables or modifying schema, you MUST run `docker compose down -v` to destroy the PostgreSQL volume before rebuilding. The `db/init.sql` and `db/seed.sql` only run on first initialization.

## Seed Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Alice Admin | alice@example.com | password | admin |
| Bob Instructor | bob@example.com | password | instructor |
| Charlie Student | charlie@example.com | password | student |

## RBAC Tab Visibility
- **Admin**: Browse, Manage, People, Admin
- **Instructor**: Browse, Manage
- **Student**: Browse only

## Testing Patterns

### Chrome Password Dialog
When logging in, Chrome may show a "Change your password" dialog (because the seed password "password" is in breach databases). Click "OK" to dismiss it before continuing tests.

### Announcement Feature
- Admin page has an "Announcement" card with a "Manage" button
- The modal has a multiline text field and an enable/disable switch
- When enabled, a blue filled Alert banner appears below the AppBar on all authenticated pages
- On the login page, the announcement appears as a standard (unfilled) Alert above the BCIT logo
- GET /api/announcement is public (no auth required) so the login page can fetch it
- PUT /api/announcement requires admin role

### Admin Export/Import
- Export downloads a JSON file with all database records
- Import uploads a JSON file and replaces all data
- After import, test that sequences are correctly reset by creating a new record
- Export/import includes announcement data

### CLI Testing via curl
```bash
# Get a JWT token
TOKEN=$(curl -s http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Use it
curl -s http://localhost:8000/api/categories/ -H "Authorization: Bearer $TOKEN"
```

## Lint & Build
```bash
# Frontend
cd frontend && npm run lint && npx tsc --noEmit

# Backend
cd backend && ruff check .
```

## Devin Secrets Needed
No secrets required - all credentials are seeded in the database.
