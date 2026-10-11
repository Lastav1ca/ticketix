## Before running
Run npm ci → docker compose up -d → cp .env.example .env (then fill in values) → db:migrate → db:seed
JWT_SECRET should be generated with `openssl rand -base64 32`

