# OrbitJobs API contract

The browser application contains no job, user, or interest data. Configure the API base URL with the `orbitjobs-api-base` meta tag in `index.html` (defaults to `/api`). The API must be served over HTTPS and use secure, `HttpOnly`, `SameSite=Lax` session cookies.

| Endpoint | Response / request |
| --- | --- |
| `GET /auth/session` | `{ "user": { "id", "name", "email" } }` or `401` |
| `POST /auth/login` | request `{ "email", "password" }`; returns session user |
| `POST /auth/register` | request `{ "name", "email", "password" }`; returns session user |
| `POST /auth/logout` | `204` or JSON success response |
| `GET /interests` | `{ "categories": [{ "id", "label", "icon", "color" }], "selectedIds": ["id"] }` |
| `PUT /interests` | request `{ "interestIds": ["id"] }` |
| `GET /jobs` | `{ "jobs": [{ "id", "title", "company", "location", "salary", "type", "posted", "description", "requirements", "applicationUrl", "trustScore": { "score", "breakdown" } }] }` |

Validate all input and authorization server-side. The job endpoint must source and score listings in the backend; never expose third-party credentials or scoring rules in the client. Return only text/URL values that have been sanitized and validated.
