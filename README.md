# HoloApp API

Backend for HoloApp: authentication (password and fingerprint), the Holobot AI assistant, help articles, VR device/scene management, and admin operations. Built with Express and MongoDB (Mongoose).

## Getting started

Requires Node.js 20+ and a MongoDB instance.

```bash
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, REFRESH_TOKEN_SECRET
npm run dev            # restarts on file changes
```

The server refuses to start if `MONGO_URI`, `JWT_SECRET` or `REFRESH_TOKEN_SECRET` is missing, or if the two JWT secrets are identical. See `.env.example` for every option.

Interactive API docs are served at `http://localhost:<PORT>/api-docs`, and `GET /health` returns `{ "status": "ok" }`.

## Scripts

| Command        | Description                                   |
| -------------- | --------------------------------------------- |
| `npm start`    | Start the server                              |
| `npm run dev`  | Start with `node --watch`                     |
| `npm test`     | Run the Jest suite against in-memory MongoDB  |
| `npm run lint` | Run ESLint                                    |

The first `npm test` downloads a MongoDB binary (~120 MB) for `mongodb-memory-server`.

## Project layout

```
config/        env loading/validation and DB connection
routes/        URL → middleware → controller wiring
controllers/   HTTP layer (req/res)
services/      business logic
model/         Mongoose schemas
validations/   Joi request schemas (applied by middleware/validate.js)
middleware/    auth, admin, validation, rate limiting, logging, errors
utils/         AppError, pagination, shared constants
tests/         Jest + Supertest integration tests
```

## Auth notes

- Access tokens carry a `tokenVersion`; logging out or resetting a password increments it, which revokes every outstanding access and refresh token for that user.
- New users always get the `user` role. Promote an admin directly in the database: `db.users.updateOne({ email: "..." }, { $set: { role: "admin" } })`.
- Password reset tokens and fingerprint IDs are stored as SHA-256 hashes. Reset emails are not sent yet: in development the reset link is printed to the console.
- Fingerprint login matches a client-supplied ID plus email. That is not a substitute for real biometric authentication; consider WebAuthn/passkeys before production.

## List endpoints

`GET /help/articles`, `GET /holobot/history` and `GET /operations/logs` are paginated with `?page=` and `?limit=` (max 100) and return `{ items, page, limit, total, pages }`.
