## Before running
Run npm ci → docker compose up -d → cp .env.example .env (then fill in values) → db:migrate → db:seed
JWT_SECRET should be generated with `openssl rand -base64 32`

## SLA

Resolution SLA — until ticket resolution, NOT first response.
`dueAt` is calculated based on ticket priority:

| prio | deadline |
|---|---|
| urgent | 4h |
| high | 8h |
| medium | 24h |
| low | 72h |

`resolvedAt` is set upon setting ticket state to 'resolved' and is nulled upon ticket re-opening
`GET /api/tickets?overdue=true` returns unresolved tickets with overdue deadlines.
