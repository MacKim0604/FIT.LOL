# RiotDataService

Background ingestion service for Riot data with BullMQ + Redis and PostgreSQL (Prisma). Admin API protected by OIDC (Keycloak).

## Prerequisites
- Node.js >= 20
- PostgreSQL running; set `DATABASE_URL`
- Redis running; set `REDIS_URL`
- Keycloak OIDC issuer (or `OIDC_JWKS_URI`)
- Valid `RIOT_API_KEY`

## Setup
```bash
cp .env.example .env
# edit DATABASE_URL, REDIS_URL, OIDC_ISSUER_URL / OIDC_JWKS_URI, RIOT_API_KEY
npm i
npm run prisma:generate
npm run prisma:migrate   # creates tables
```

## Run
```bash
npm run dev
# or
npm start
```
- Server: `http://localhost:${PORT||3003}`
- Health: `GET /api/v1/health`

## Admin API (LEADER only)
- `POST /api/v1/ingestion/summoner/latest` body: `{ summonerName, tag, count?, force? }`
- `GET  /api/v1/ingestion/jobs/:id`
- `GET  /api/v1/ingestion/summary`
- `GET  /api/v1/ingestion/config`

Example:
```bash
curl -X POST http://localhost:3003/api/v1/ingestion/summoner/latest \
  -H "Authorization: Bearer YOUR_LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"summonerName":"김동건","tag":"DGKIM","count":5}'
```

## How it works
- Queue: `ingest.summoner.latest`
- Worker: fetch PUUID → match IDs → match details
- Persist: `Match`, `MatchParticipant`, `Summoner`, and update `IngestionCursor`

## Notes
- JWKS auto-discovery if `OIDC_JWKS_URI` is not set (uses `OIDC_ISSUER_URL/.well-known/*`).
- Add more processors for backfill/rank/report as per `document/v1.0.3/*`.
