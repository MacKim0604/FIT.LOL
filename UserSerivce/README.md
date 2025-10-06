# UserSerivce

Express-based microservice for user and clan management aligned with FIT.LOL v1.0.2 (Keycloak OIDC).

## Requirements
- Node.js >= 20
- Keycloak running locally (see `document/v1.0.2/iam-keycloak.md`)

## Setup
```bash
yarn || npm i
cp .env.example .env
# adjust OIDC_ISSUER_URL / OIDC_JWKS_URI / CORS_ORIGIN
```

## Run
```bash
npm run dev
# or
npm start
```
Server listens on `http://localhost:${PORT || 3002}`.

## Endpoints
- GET `/api/v1/health` — health check
- GET `/api/v1/auth/me` — requires Bearer token; auto-provisions a user by OIDC `sub`
- GET `/api/v1/clan/members` — MEMBER+
- POST `/api/v1/clan/members` — LEADER
- GET `/api/v1/clan/members/:userId` — MEMBER+
- DELETE `/api/v1/clan/members/:userId` — LEADER

## Notes
- In-memory store only (no DB). Intended as a scaffold.
- RBAC reads roles from claim path `OIDC_ROLE_PATH` (default `realm_access.roles`).
