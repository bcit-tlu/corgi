<personality_and_writing_controls>
- Use concise, clear, and directive language.
- Structure by sections: route mapping, requirements, patterns, examples, constraints.
- Focus on essential, actionable info.
- Format for easy parsing.
</personality_and_writing_controls>

<desired_functionality>
Create a CLI-first, REST API with clear, consistent semantics. Support idempotency, bulk workflows, pagination, filtering, sorting. Responses are JSON with proper HTTP status.
</desired_functionality>

<api_route_mapping>
- Public:
  - GET /api/v1/detail/{slug}/preview
  - GET /api/v1/detail/{slug}
  - GET /api/v1/categories/{categorySlug?}
  - GET /api/v1/home
  - GET /api/v1/contact
- Authenticated/User:
  - Same as public, with auth.
- Admin Management:
  - Images CRUD & upload, categories CRUD & hide/show/search, FAQ, copyright.
</api_route_mapping>

<api_requirements>
- All endpoints return JSON.
- Proper status codes.
- Idempotent PUT/DELETE.
- Support `Idempotency-Key` for POST.
- Pagination: ?page, ?limit, meta info.
- Filtering, sorting via query params.
- Bulk via POST /manage/images/bulk.
</api_requirements>

<upload_pattern>
- Request URL: POST /manage/images/{id}/upload-url
- Response: {"upload_url": "...", "expires_in": 3600}