# AnalysisService

Express-based analysis microservice for FIT.LOL v1.0.3.

## Requirements
- Node.js >= 20
- PostgreSQL (same DB used by RiotDataService)
- Keycloak OIDC issuer (or JWKS URI)

## Setup
```bash
yarn || npm i
cp .env.example .env
# set DATABASE_URL / OIDC_ISSUER_URL / OIDC_JWKS_URI / CORS_ORIGIN
```

## Run
```bash
npm run dev
# or
npm start
```
Server listens on `http://localhost:${PORT || 3004}`.

## Endpoints
- GET `/api/v1/health` — health check

### Analysis
- GET  `/api/v1/analysis/summoner/:puuid/summary?lookbackDays=30` — MEMBER+
- GET  `/api/v1/analysis/global/weekly?start=YYYY-MM-DD&end=YYYY-MM-DD` — LEADER
- POST `/api/v1/analysis/report/weekly` — LEADER (generate weekly report summary now)

Example:
```bash
curl -X GET "http://localhost:3004/api/v1/analysis/summoner/<PUUID>/summary?lookbackDays=30" \
  -H "Authorization: Bearer YOUR_MEMBER_OR_LEADER_TOKEN"
```

## Notes
- Uses node-postgres (`pg`) directly, no Prisma generation required.
- RBAC uses claim path `OIDC_ROLE_PATH` (default `realm_access.roles`).
