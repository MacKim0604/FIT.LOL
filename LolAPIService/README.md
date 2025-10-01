## 실행 방법
{{ ... }}
서버는 http://localhost:3001 에서 실행됩니다.

## API 엔드포인트

- **[인증]** Riot 관련 엔드포인트는 Keycloak 토큰 필요
  - 헤더: `Authorization: Bearer <access_token>`

### 기본 엔드포인트
- GET `/api/v1/health` -> `{ success: true, data: { status: "ok" } }`
- GET `/api/v1/hello` -> `{ success: true, data: { message: "Hello World from LolAPIService" } }`

### Riot API 엔드포인트 (인증 필요)
- GET `/api/v1/riot/latest-match/:summonerName/:tag`
- GET `/api/v1/riot/match-history/:summonerName/:tag?count=10`
- GET `/api/v1/riot/match/:matchId`
- GET `/api/v1/riot/summoner/:summonerName/:tag/puuid`
- GET `/api/v1/riot/matches/:puuid?count=20`
