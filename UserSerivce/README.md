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
# set RiotDataService base URL for admin ingestion proxy
# e.g. RIOT_DATA_SERVICE_BASE_URL=http://localhost:3003/api/v1
```

## Run
```bash
npm run dev
# or
npm start
```
Server listens on `http://localhost:${PORT || 3002}`.

## Endpoints

### Health Check
- GET `/api/v1/health` — health check

### User Management
- GET `/api/v1/auth/me` — requires Bearer token; auto-provisions a user by OIDC `sub`
- GET `/api/v1/clan/members` — MEMBER+
- POST `/api/v1/clan/members` — LEADER
- GET `/api/v1/clan/members/:userId` — MEMBER+
- DELETE `/api/v1/clan/members/:userId` — LEADER

### Admin Ingestion (Proxy to RiotDataService)
- All endpoints require role `LEADER` and forward to `RIOT_DATA_SERVICE_BASE_URL`.
- Base path: `/api/v1/ingestion`
  - POST `/summoner/latest` — body: `{ summonerName, tag, count?, force? }`
  - POST `/summoner/full`
  - POST `/rank/daily`
  - POST `/report/weekly`
  - GET  `/jobs/:id`
  - GET  `/summary`
  - GET  `/config`

Example:
```bash
curl -X POST http://localhost:3002/api/v1/ingestion/summoner/latest \
  -H "Authorization: Bearer YOUR_LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"summonerName":"김동건","tag":"DGKIM","count":5}'
```
