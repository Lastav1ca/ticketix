# ticketix

Help-desk REST API — tickets, roles, SLA deadlines, comments and assignment to agents.
A learning project built to practice a full backend stack.

![CI](https://github.com/Lastav1ca/ticketix/actions/workflows/ci.yml/badge.svg)

**Live:** https://ticketix.onrender.com — try `GET /healthz`, then log in.

Demo accounts (password `tajnalozinka`): `admin@test.rs`, `agent@test.rs`, `marko@test.rs`.
The first request after a while takes ~50s — Render spins free instances down when idle.

```bash
curl -X POST https://ticketix.onrender.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"agent@test.rs","password":"tajnalozinka"}'
```

## Stack

Node.js + TypeScript, Express, PostgreSQL with Drizzle, Zod for validation,
JWT + argon2 for auth, Vitest for tests, Docker Compose for the local database,
GitHub Actions for CI, Docker + Render for deployment.

## Structure

```
routes/      HTTP layer: validate with Zod, call a service, return a status code
services/    business logic and permission checks (no req/res used)
db/queries/  database queries
middleware/  auth check and error handler
```

Services throw error classes (`NotFoundError`, `ForbiddenError`, `ConflictError`...) and one
error middleware turns them into status codes, so routes have no try/catch.

## Running locally

```bash
npm ci
docker compose up -d          # Postgres on port 5433
cp .env.example .env          # fill in empty values
npm run db:migrate
npm run db:seed
npm run dev
```

`JWT_SECRET` is generated with `openssl rand -base64 32`.

Seeded users (password `tajnalozinka`): `admin@test.rs`, `agent@test.rs`, `agent2@test.rs`,
`marko@test.rs`, `jovana@test.rs`.

## Endpoints

| Method | Path | Access |
|---|---|---|
| GET | `/healthz` | anyone |
| POST | `/api/auth/register` | anyone |
| POST | `/api/auth/login` | anyone |
| GET | `/api/auth/me` | logged in |
| GET | `/api/tickets` | logged in (clients see only their own) |
| POST | `/api/tickets` | logged in |
| GET | `/api/tickets/:id` | logged in (404 for someone else's ticket) |
| PATCH | `/api/tickets/:id/status` | agent, admin |
| PATCH | `/api/tickets/:id/assign` | agent, admin |
| POST | `/api/tickets/:id/comments` | logged in (only agents can post internal ones) |
| GET | `/api/tickets/:id/comments` | logged in (clients don't see internal ones) |
| GET | `/api/users` | admin |
| PATCH | `/api/users/:id/role` | admin |

Filters on `GET /api/tickets`: `status`, `priority`, `assignedTo`, `createdBy`, `overdue`,
plus `page` (default 1) and `limit` (default 20, max 100). Response is
`{ data, page, limit, total }`. Clients can't use `createdBy` to read other people's tickets —
the service overrides it with their own id.

## Database

Three tables: `users`, `tickets`, `comments`.
`tickets.created_by` and `tickets.assigned_to` reference `users`, `comments.ticket_id`
references `tickets` (cascade on delete).

## Status workflow

| From | Can become |
|---|---|
| `open` | `in_progress`, `closed` |
| `in_progress` | `resolved`, `closed` |
| `resolved` | `closed`, `in_progress` |
| `closed` | nothing |

Anything else returns 409.

## SLA

`dueAt` is set when a ticket is created, based on its priority:

| Priority | Deadline |
|---|---|
| urgent | 4h |
| high | 8h |
| medium | 24h |
| low | 72h |

This is a resolution SLA (time until the ticket is resolved, not until the first reply).
`resolvedAt` is set when the status becomes `resolved` and cleared if the ticket is re-opened.
Closing an already resolved ticket keeps the original `resolvedAt`.

`GET /api/tickets?overdue=true` returns tickets past their deadline that aren't resolved.

## Notes

- Wrong email and wrong password both return 401, so you can't tell which emails are registered.
- A client asking for someone else's ticket gets 404 instead of 403 — 403 would confirm it exists.
- `role`, `status`, `createdBy`, `dueAt` and `resolvedAt` are never taken from the request body.
- The JWT holds the user's role, so a role change only applies after the next login.

## Tests

The tests delete rows, so they use a separate database:

```bash
docker compose exec db createdb -U ticketix_app ticketix_test
cp .env.test.example .env.test     # DATABASE_URL points at ticketix_test
npm test
```

52 integration tests over real HTTP requests and a real database. Migrations run automatically
before the suite. GitHub Actions runs them, plus `tsc --noEmit`, on every pull request.

## Deployment

The `Dockerfile` is multi-stage: the first stage installs everything and runs `tsc`, the second
installs only production dependencies and copies `dist/` plus the `drizzle/` migration files.
On startup the container runs the migrations and then the server:

```dockerfile
CMD ["sh", "-c", "node dist/db/migrate.js && exec node dist/index.js"]
```

Migrations use `drizzle-orm`'s migrator (`src/db/migrate.ts`) rather than `drizzle-kit`, which is
a dev dependency and isn't installed in the production image.

Render builds this image from `main` and injects `DATABASE_URL`, `JWT_SECRET`,
`JWT_SECRET_EXPIRES_IN` and `PORT`. Nothing is read from a `.env` file in production.
