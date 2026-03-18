# Testing Corgi Image Library

## Environment Setup

```bash
cd /home/ubuntu/repos/corgi
docker compose down -v   # Reset volumes for clean state
docker compose up --build -d
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

Wait ~6 seconds after `docker compose up` for the backend to initialize (DB health check + seed data).

Verify backend is ready: `curl -s http://localhost:8000/api/health` should return `{"status":"ok"}`

## Seed Users

| User | Email | Password | Role |
|------|-------|----------|------|
| Alice Admin | alice@example.com | password | admin |
| Bob Instructor | bob@example.com | password | instructor |
| Charlie Student | charlie@example.com | password | student |

## Auth Testing

### Login via UI
1. Open http://localhost:5173
2. Enter email + password in the login form
3. On success: AppBar appears with user chip, role-based tabs
4. On failure: Red error alert with "401" / "Invalid email or password"

### Login via curl (CLI access)
```bash
# Get a JWT token
TOKEN=$(curl -s http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Use token on protected routes
curl -s http://localhost:8000/api/categories/ -H "Authorization: Bearer $TOKEN"
```

### Token Persistence
- JWT token is stored in `localStorage` as `corgi_token`
- User object cached in `localStorage` as `corgi_user`
- Hard-refresh should maintain session
- Logout clears both localStorage entries

## RBAC Tab Visibility

| Role | Browse | Manage | Admin | PeopleIcon | New Category |
|------|--------|--------|-------|------------|-------------|
| admin | Yes | Yes | Yes | Yes | Yes |
| instructor | Yes | Yes | No | No | Yes |
| student | Yes | No | No | No | No |

## RBAC API Enforcement

| Endpoint | Public | Student | Instructor | Admin |
|----------|--------|---------|------------|-------|
| POST /api/auth/login | Yes | Yes | Yes | Yes |
| GET /api/health | Yes | Yes | Yes | Yes |
| GET /api/categories/ | No (401) | 200 | 200 | 200 |
| POST /api/categories/ | No (401) | 403 | 200 | 200 |
| DELETE /api/categories/{id} | No (401) | 403 | 403 | 200 |
| GET /api/admin/export | No (401) | 403 | 403 | 200 |
| POST /api/admin/import | No (401) | 403 | 403 | 200 |
| GET/POST /api/users/ | No (401) | 403 | 403 | 200 |

## Common Issues

- **Backend SyntaxError on startup**: Check parameter ordering in route functions. Parameters with `Annotated[User, Depends(...)]` (no default) must come before parameters with defaults like `file: UploadFile = File(...)`.
- **passlib/bcrypt compatibility**: The project uses `bcrypt` directly (not `passlib`) due to compatibility issues with newer bcrypt versions. Use `bcrypt.hashpw()` and `bcrypt.checkpw()` directly.
- **Browser password manager dialogs**: Chrome may show "Change your password" warnings for the seed password. Dismiss with OK — this is not an app issue.
- **DB volume state**: If seed data seems wrong, run `docker compose down -v` to reset PostgreSQL volumes before rebuilding.

## Devin Secrets Needed

No secrets are needed for local testing. All seed credentials are hardcoded for development.
