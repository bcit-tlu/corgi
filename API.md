# TASKS.md — API Design (CLI-First)

## Objective
Implement a clean, CLI-first REST API that maps to the following route structure while modernizing semantics, ensuring idempotency, and supporting bulk ingestion workflows.

---

## 1. Route Mapping (Normalized REST API)

### Public

#### Preview
```
GET /api/v1/detail/{slug}/preview
```

#### Image Detail
```
GET /api/v1/detail/{slug}
```

#### Category Browse
```
GET /api/v1/categories/{categorySlug?}
```

#### Home
```
GET /api/v1/home
```

#### Contact
```
GET /api/v1/contact
```

---

### Authenticated (User)

(Same as public but requires auth where applicable)

---

### Admin (Manage)

#### Images
```
GET    /api/v1/manage/images
POST   /api/v1/manage/images
GET    /api/v1/manage/images/{id}
PUT    /api/v1/manage/images/{id}
DELETE /api/v1/manage/images/{id}

POST   /api/v1/manage/images/{id}/upload
GET    /api/v1/manage/images/sources
POST   /api/v1/manage/images/sort
```

---

#### Categories
```
GET    /api/v1/manage/categories
POST   /api/v1/manage/categories
PUT    /api/v1/manage/categories/{id}
DELETE /api/v1/manage/categories/{id}

POST   /api/v1/manage/categories/{id}/hide
POST   /api/v1/manage/categories/{id}/show
POST   /api/v1/manage/categories/search
```

---

#### FAQ
```
GET /api/v1/manage/faq
```

---

#### Copyright
```
GET    /api/v1/manage/copyright
POST   /api/v1/manage/copyright
DELETE /api/v1/manage/copyright/{id}
POST   /api/v1/manage/copyright/search
```

---

## 2. CLI-First API Requirements

### General
- All endpoints MUST return JSON
- No HTML responses
- No redirects
- Use HTTP status codes correctly

### Idempotency
- PUT/DELETE must be idempotent
- Support `Idempotency-Key` header for POST

### Pagination
```
GET /resources?page=1&limit=50
```

Response:
```
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 123
  }
}
```

### Filtering
```
GET /images?category=histology&stain=H&E
```

### Sorting
```
GET /images?sort=created_at:desc
```

### Bulk Operations
```
POST /api/v1/manage/images/bulk
```

---

## 3. Upload Pattern (Required)

### Step 1: Request Upload URL
```
POST /api/v1/manage/images/{id}/upload-url
```

Response:
```
{
  "upload_url": "https://...",
  "expires_in": 3600
}
```

### Step 2: Direct Upload (CLI)
```
curl -T file.svs "<upload_url>"
```

### Step 3: Finalize
```
POST /api/v1/manage/images/{id}/upload/complete
```

---

## 4. Bulk Ingest (Required)

### Create Job
```
POST /api/v1/manage/bulk
```

Request:
```
{
  "dataset": "histology-101",
  "items": [
    {
      "filename": "slide1.svs",
      "metadata": {"stain": "H&E"}
    }
  ]
}
```

Response:
```
{
  "job_id": "uuid",
  "status": "queued"
}
```

---

### Check Job
```
GET /api/v1/manage/bulk/{job_id}
```

Response:
```
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 0.4,
  "results": []
}
```

---

## 5. Standard Response Format

### Success
```
{
  "data": {...},
  "meta": {},
  "error": null
}
```

### Error
```
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Image not found"
  }
}
```

---

## 6. Example Calls

### List Images
```
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/v1/manage/images
```

Response:
```
{
  "data": [
    {
      "id": "img_123",
      "title": "Liver Tissue",
      "status": "ready"
    }
  ],
  "meta": {"page": 1, "limit": 50, "total": 1}
}
```

---

### Create Image
```
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Kidney Slide"}' \
  https://api.example.com/api/v1/manage/images
```

Response:
```
{
  "data": {
    "id": "img_456",
    "status": "created"
  }
}
```

---

### Upload File
```
curl -X POST \
  -H "Authorization: Bearer <token>" \
  https://api.example.com/api/v1/manage/images/img_456/upload-url
```

Response:
```
{
  "upload_url": "https://storage/...",
  "expires_in": 3600
}
```

---

### Delete Image
```
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  https://api.example.com/api/v1/manage/images/img_456
```

Response:
```
{
  "data": {
    "deleted": true
  }
}
```

---

## 7. Non-Negotiable Constraints

- No server-side rendering
- No session-based auth (token only)
- No file uploads through API server (always presigned)
- All long-running tasks must be async
- All endpoints must be scriptable via curl

---

## End
