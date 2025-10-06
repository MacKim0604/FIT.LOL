# Riot 데이터 수집 설계 (v1.0.3)

## 목표
- 사용자 요청 없이도 최신 Riot 데이터를 지속 수집하여 DB에 적재
- 빠른 조회(캐시/사전 집계), 안정성(재시도/백오프), 레이트리밋 준수

---

## 수집 플로우
1. 식별자 확인: `gameName + tagLine` → PUUID 조회(캐시 선호)
2. 매치 ID 목록: PUUID → Match IDs(batch, 최대 N) (중복 제거)
3. 매치 상세: Match ID → Detail (참가자/메타데이터)
4. 적재: `matches`, `match_participants` 등 테이블 upsert
5. 커서 갱신: `ingestion_cursors`에 마지막 처리 위치 저장(시간/인덱스)

---

## 큐/작업 정의 (BullMQ)
- Queue Prefix: `fitlol` (ENV: `QUEUE_PREFIX`)
- Queues:
  - `ingest.summoner.latest`: 활성 멤버 최신 N경기 수집(반복)
  - `ingest.summoner.full`: 과거 D일 백필(full backfill)
  - `ingest.rank.daily`: 랭크/리그 정보 일별 수집
  - `report.weekly`: 주간 리포트 생성(분석 서비스 트리거)
- 공통 Job 옵션
  - `attempts`: 3~5, `backoff`: exp 5s→60s, `removeOnComplete`: true, `removeOnFail`: 100
  - `jobId`: idempotent 키(예: `latest:{puuid}`, `match:{matchId}`)
  - `limiter`: 초당/분당 제한(ENV)

### 페이로드 예시
```json
{
  "puuid": "...",
  "count": 20,
  "lookbackDays": 30,
  "force": false,
  "requestedBy": "userId or system"
}
```

---

## 레이트리밋/동시성
- Riot API rate limit 고려: 글로벌 limiter + per-route limiter
- 동시성: PUUID 단위 락(같은 유저 동시 실행 방지), 매치 상세는 배치/파이프라인 처리
- 에러 처리: 429/503 → 백오프 + 재시도, 치명적 오류는 Job Fail 기록

---

## 캐시 전략 (Redis)
- Keys
  - `riotid:{name}:{tag}:puuid` (TTL 1d)
  - `matchids:{puuid}` (TTL 5–10m, 슬라이스 제공)
  - `match:{matchId}` (TTL 1d)
- 캐시 미스 시 Riot 호출, 히트 시 즉시 반환

---

## 적재/중복 방지
- DB 제약: `matches.matchId` UNIQUE, `match_participants (matchId, summonerId)` UNIQUE
- upsert로 재실행 안전성 확보
- `ingestion_cursors`로 이미 처리한 범위를 건너뛰기

---

## 모니터링/로깅
- JobLog: `jobId`, `type`, `status`, `retryCount`, `errorMsg`, `timestamps`
- 메트릭: 처리 속도, 실패율, 재시도율, 큐 길이

---

## 환경 변수 (예시)
```env
# Riot
RIOT_API_KEY=...
RIOT_MAX_RETRIES=3
RIOT_HTTP_TIMEOUT_MS=10000

# Redis / Queue
REDIS_URL=redis://:pass@localhost:6379
QUEUE_PREFIX=fitlol
BULLMQ_CONCURRENCY=5
BULLMQ_GLOBAL_RATE=18   # per second (예시)

# Ingestion
INGESTION_MAX_MATCHES_PER_RUN=20
INGESTION_LOOKBACK_DAYS=30
SCHEDULE_ENABLE=true

# Scheduler (CRON)
CRON_LATEST_EVERY=0 */1 * * *      # 매시간
CRON_RANK_DAILY=0 3 * * *          # 매일 03:00
CRON_WEEKLY_REPORT=0 4 * * 1       # 매주 월요일 04:00
```
