# HoloApp API

Backend for HoloApp: authentication (password and passkeys), the Holobot AI assistant, help articles, VR device/scene management with live config delivery, and admin operations. Built with Express and MongoDB (Mongoose).

## Getting started

Requires Node.js 20+ and MongoDB (Redis is optional).

```bash
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, REFRESH_TOKEN_SECRET
npm run seed           # default VR scenes; add ADMIN_EMAIL/ADMIN_PASSWORD to create an admin
npm run dev            # restarts on file changes
```

Or run the whole stack (API, MongoDB, Redis) with Docker:

```bash
cp .env.example .env   # fill in the JWT secrets
docker compose up --build
docker compose exec api node scripts/seed.js
```

The server refuses to start if `MONGO_URI`, `JWT_SECRET` or `REFRESH_TOKEN_SECRET` is missing, or if the two JWT secrets are identical. See `.env.example` for every option.

Interactive API docs are served at `/api-docs`. `GET /health` returns 200 when the API and database are up and 503 otherwise.

## Scripts

| Command                 | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `npm start`             | Start the server                                  |
| `npm run dev`           | Start with `node --watch`                         |
| `npm run seed`          | Seed default scenes and optionally the first admin |
| `npm test`              | Run the Jest suite against in-memory MongoDB      |
| `npm run test:coverage` | Tests with a coverage report in `coverage/`       |
| `npm run lint`          | Run ESLint                                        |

The first `npm test` downloads a MongoDB binary (~120 MB) for `mongodb-memory-server`.

## Project layout

```
config/        env loading/validation and DB connection
routes/        URL → middleware → controller wiring
controllers/   HTTP layer (req/res)
services/      business logic, email, audit log, VR WebSocket
model/         Mongoose schemas
validations/   Joi request schemas (applied by middleware/validate.js)
middleware/    auth, admin, validation, maintenance, rate limiting, logging, errors
utils/         AppError, logger, pagination, shared constants
scripts/       one-off tasks (seeding)
tests/         Jest + Supertest integration tests
```

## Authentication

- **Passwords**: `POST /auth/register`, `/auth/login`. Access tokens carry a `tokenVersion`; logging out or resetting a password increments it, revoking every outstanding token for that user.
- **Passkeys (WebAuthn)**: a signed-in user calls `POST /auth/passkeys/register/options`, passes `options` to `startRegistration()` from [`@simplewebauthn/browser`](https://simplewebauthn.dev), then sends `{ challengeId, response }` to `/auth/passkeys/register/verify`. Sign-in works the same way with `/auth/passkeys/login/options` and `/login/verify`. Set `WEBAUTHN_RP_ID` to your frontend's domain and `WEBAUTHN_ORIGINS` to its exact origin(s).
- **Password reset**: emails are sent through SMTP (`SMTP_*` variables). Without SMTP they are logged in development and dropped elsewhere.
- **Roles**: new users always get `user`. Create or promote an admin with `ADMIN_EMAIL=... npm run seed`.

## Holobot

- `POST /holobot/chat` returns the full reply; `POST /holobot/chat/stream` streams it as Server-Sent Events (`delta` chunks, then `done` or `error`).
- Relevant help articles are found with a MongoDB text search and included in the prompt; their titles come back as `sources`.
- Each user may send `HOLOBOT_DAILY_LIMIT` messages per UTC day (`GET /holobot/usage`).

## VR devices

Admins register a device with `POST /vr/devices`. The response includes a `deviceKey` that is shown **once**. The headset connects to `ws(s)://<host>/vr/ws` and, within 5 seconds, sends:

```json
{ "type": "auth", "deviceId": "<id>", "key": "<deviceKey>" }
```

The server replies `{ "type": "ready", "config": {...} }` and pushes `{ "type": "config", "settings": {...} }` whenever `POST /vr/config` targets that device. Offline devices receive the latest config when they reconnect.

## Operations

- **Maintenance mode** (`PUT /settings/system { "maintenanceMode": true }`) returns 503 to non-admins; `/auth`, `/settings`, `/operations` and admins stay available.
- **Audit log**: logins, failed logins, password resets, passkey changes and admin actions are written to `SystemLog` (`GET /operations/logs`).
- **Logging**: structured JSON logs on stdout via pino (pretty-printed in development). `Authorization` headers are redacted.
- **Rate limiting**: in memory by default; set `REDIS_URL` when running more than one instance.
- **Error tracking**: set `SENTRY_DSN` to report 5xx errors to Sentry.
- The server shuts down gracefully on `SIGTERM`/`SIGINT`.

## List endpoints

`GET /help/articles`, `GET /holobot/history` and `GET /operations/logs` are paginated with `?page=` and `?limit=` (max 100) and return `{ items, page, limit, total, pages }`.
