# Testing Corgi App

## Environment Setup

1. Start all services:
   ```bash
   cd /home/ubuntu/repos/corgi
   docker compose up --build -d
   ```
2. Wait ~5 seconds for the backend to initialize, then verify:
   - Frontend: http://localhost:5173 (should return HTTP 200)
   - Backend: http://localhost:8000/api/users/ (should return JSON array of seed users)

## Seed Data

The database is seeded on first startup with:
- **3 users:** Alice Admin (admin), Bob Instructor (instructor), Charlie Student (student)
- **3 root categories:** Architecture (2 subcategories), Panoramas (1 image)
- **4 images:** DZI tile sources from OpenSeaDragon examples and Library of Congress

Note: The DB volume persists across `docker compose up/down`. To reset to seed data, run:
```bash
docker compose down -v && docker compose up --build -d
```

## Login

No passwords — the login screen shows a user picker with "SIGN IN" buttons. Click any user to authenticate client-side. There is no backend auth; all API endpoints are publicly accessible.

## Testing RBAC

| Role | Tabs Visible | Can Create Categories | Can Manage Users |
|------|-------------|----------------------|------------------|
| student | Browse | No | No |
| instructor | Browse, Manage | Yes | No |
| admin | Browse, Manage, Admin | Yes | Yes |

To test: Sign in as each role and verify tab visibility in the AppBar. Logout button is in the top-right corner.

## Testing Admin Page (DB Import/Export)

1. Sign in as Alice Admin
2. Click the "Admin" tab
3. **Export:** Click "Export" — downloads `corgi-export.json` via browser blob URL
4. **Import round-trip:**
   - Save a clean export via curl: `curl -s http://localhost:8000/api/admin/export > /tmp/clean-export.json`
   - Create a new category in Browse tab to dirty the state
   - Go to Admin tab, click Import, select the saved export file
   - Verify success alert shows correct counts
   - Refresh page, sign in again, verify the dirty category is gone
5. **Sequence integrity:** After import, create a new category — should succeed without duplicate key errors

Note: The import endpoint is destructive — it deletes all existing data before inserting. The export file downloaded via browser uses a blob URL, so for testing import, it's easier to save via curl first.

## Testing Manage Page (Image Metadata Table)

1. Sign in as Alice Admin or Bob Instructor
2. Click the "Manage" tab
3. Verify table has 9 columns: ID, Label, Category, Copyright, Origin, Program, Status, Created, Actions
4. Verify 4 rows of seed images with populated metadata
5. Ellipsis icon in Actions column is a placeholder — clicking it does nothing

## Common Issues

- **Frontend shows stale data after import:** The import replaces DB data but doesn't refresh the frontend's React state. A page refresh (F5) is needed to see updated data.
- **`python-multipart` missing error:** If the backend fails to start with a RuntimeError about multipart, ensure `python-multipart` is in `pyproject.toml` and rebuild: `docker compose up --build -d`
- **Browser file chooser for import:** Use the `browser_select_file` tool to select a file when the file chooser dialog opens.

## Devin Secrets Needed

None — the app uses passwordless login with seed users and has no external service dependencies.
