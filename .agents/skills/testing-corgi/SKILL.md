# Testing the Corgi Image Library

## Environment Setup

### Docker Compose (Dev)
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
- docker-compose.yml targets the `dev` stage in each Dockerfile.

### Important: Schema Changes
When adding new database tables or modifying schema, you MUST run `docker compose down -v` to destroy the PostgreSQL volume before rebuilding. The `db/init.sql` and `db/seed.sql` only run on first initialization.

### Production Frontend (nginx)
The frontend Dockerfile has a `prod` target that builds a Vite production bundle and serves it with nginx on port 8080.

```bash
# Build the prod frontend image
docker build --target prod -t corgi-fe ./frontend

# Run a full prod-like stack manually:
docker network create corgi-test
docker run -d --name corgi-db --network corgi-test \
  -e POSTGRES_DB=corgi -e POSTGRES_USER=corgi -e POSTGRES_PASSWORD=corgi \
  -v $(pwd)/db/init.sql:/docker-entrypoint-initdb.d/01-init.sql \
  -v $(pwd)/db/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql \
  postgres:16-alpine

# Wait for DB, then:
docker build --target prod -t corgi-be ./backend
docker run -d --name corgi-backend --network corgi-test --network-alias backend \
  -e DATABASE_URL=postgresql+asyncpg://corgi:corgi@corgi-db:5432/corgi \
  -p 8000:8000 corgi-be

docker run -d --name corgi-frontend --network corgi-test \
  -e BACKEND_URL=http://backend:8000 \
  -p 8080:8080 corgi-fe
```

Prod frontend is then at http://localhost:8080.

### Verifying nginx Config
The nginx config is generated at container startup via envsubst. To inspect the rendered config:
```bash
docker exec <frontend-container> cat /etc/nginx/conf.d/default.conf
```

Key things to verify with curl:
```bash
# API proxy
curl -s http://localhost:8080/api/health  # Should return {"status":"ok"}

# SPA fallback
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/some/deep/path  # Should return 200

# Cache headers on /assets/
curl -sI http://localhost:8080/assets/<hashed-file>.js
# Should include: Cache-Control: public, immutable; X-Frame-Options: SAMEORIGIN; X-Content-Type-Options: nosniff

# Gzip
curl -sI -H "Accept-Encoding: gzip" http://localhost:8080/assets/<hashed-file>.js
# Should include: Content-Encoding: gzip
```

Note: The hashed asset filename changes with each build. Check `frontend/dist/assets/` after building to find the exact filename.

### Production Backend
The backend Dockerfile has a `prod` target that runs uvicorn with 2 workers (no --reload).

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

### Cleanup After Testing
Always clean up Docker resources after testing:
```bash
# Dev compose
docker compose down -v

# Manual prod containers
docker stop corgi-frontend corgi-backend corgi-db
docker rm corgi-frontend corgi-backend corgi-db
docker network rm corgi-test
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
