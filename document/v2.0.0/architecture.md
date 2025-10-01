# FIT.LOL v2.0.0 Architecture Document

## 개요
SaaS 운영을 가정한 신뢰성·보안·가시성 중심의 아키텍처입니다. v1.0.1의 모놀리식 MVP를 운영 안전망과 표준 컴포넌트로 보강합니다.

## 하이라이트
- **인증**: Keycloak(OIDC), RBAC, 감사로그
- **트래픽 제어**: API Gateway/LB, 전역 레이트리미트, WAF
- **데이터 파이프라인**: BullMQ on Redis Cluster, 멱등/중복 방지, DLQ
- **스토리지**: Postgres HA + 월 파티셔닝, 원본 JSONB/S3 보관, Outbox 패턴
- **관측성**: OpenTelemetry, Prometheus/Grafana, ELK, Sentry
- **레질리언스**: 타임아웃/서킷브레이커/폴백, Degraded Read-Only
- **보안/비밀**: Secret Manager, 최소권한(Least Privilege), CSP/Helmet

## 아키텍처 개요
```
[Client]
   |
[CDN] --(static)
   |
[API Gateway/LB + WAF + RateLimit]
   |
[Backend API (Express, OTel, CircuitBreaker)]
   | \-- Redis Cluster (cache)
   | \-- BullMQ Workers (dedup, DLQ)
   | \-- Keycloak (OIDC)
   | \-- Object Storage (raw match/timeline)
   | \-- Secret Manager
   v
[Postgres (HA, Multi-AZ, Partitioned)]
```

## 핵심 컴포넌트
- **API Gateway/LB**
  - TLS 종료, 라우팅, IP/토큰별 레이트리미트, 429 + Retry-After, Canary/Blue-Green.
- **인증/인가 (Keycloak)**
  - Authorization Code Flow + PKCE, `httpOnly` 쿠키 또는 Bearer, Role 기반(LEADER/MEMBER), 그룹/테넌트 매핑.
  - 토큰 검증(JWKS 캐싱), 토큰 무효화, 감사 로그.
- **Backend**
  - OpenTelemetry 자동 계측(HTTP/DB/Redis), 코릴레이션 ID 전파.
  - 서킷 브레이커(opossum 등): 실패율≥50%, 최소 샘플 20, 오픈 30s, 반개방 5 탐침.
  - 타임아웃: Riot 2s, DB 1–2s, Redis 0.5–1s. 재시도는 네트워크 오류에 한정, 지터 포함.
- **Queue(BullMQ + Redis Cluster)**
  - `jobId` 기반 멱등, 재시도≤5, 지터 백오프, DLQ(보관 7일) + 재처리 UI.
  - 워커 동시성/스루풋 가드레일, 큐 백프레셔 임계치 기반 API 거절.
- **Database(Postgres)**
  - HA(Multi-AZ), PITR, 자동 백업 + 정기 복구 리허설.
  - 월 파티셔닝: `matches`, `match_participants` (파티션 프루닝용 인덱스).
  - Outbox 패턴: 트랜잭션 커밋 후 이벤트 발행(집계/캐시 무효화 트리거).
  - Materialized Views/사전 계산 캐시(`analysis_results`).
- **원본 데이터 보관**
  - 매치/타임라인 원본 JSONB 또는 Object Storage(S3) 보관, TTL/아카이빙 정책.
- **캐시(계층형)**
  - Redis 태그/버전키 기반 무효화, CDN 캐시(정적·이미지·스냅샷) 병행.
- **Observability**
  - 메트릭: API P50/P95/P99, 에러율, 큐 심도/처리시간, DB 커넥션/슬로우쿼리, 캐시 히트율.
  - 로그: 중앙 집계(ELK/CloudWatch), 구조화 JSON, PII 마스킹.
  - 트레이싱: 샘플링(예: 10%), 스팬 태그 표준화.
- **보안/비밀**
  - Secret Manager(Vault/AWS SM), 키 회전, 최소권한 IAM.
  - 보안 헤더(Helmet), CSP 엄격 모드, WAF 규칙.

## 데이터 플로우
- **소환사 연동**: API→Job(`riot:summoner:{id}`)→Riot 호출→DB upsert→Outbox 이벤트→분석 계산→캐시 갱신.
- **정기 갱신**: 크론→신규 매치 탐지→세부 수집→집계/캐시 업데이트.
- **갱신 정책**: TTL 기반, 강제 갱신은 Idempotency-Key 요구.

## SLO/알람(예시)
- 가용성 99.9%, API P95≤300ms, Riot 오류율≤2%.
- 알람: 에러율↑, P95↑, 큐 pending 임계치↑, DB 연결풀 고갈, Redis 메모리/eviction, 서킷 오픈 비율↑.

## 데이터 수명주기
- 원본 타임라인: 90일 후 아카이브(S3), 집계는 유지.
- 분석 캐시: TTL 24–72h + 태그 무효화.

## 마이그레이션 계획 (v1.0.1 → v2.0.0)
1) Keycloak 도입 및 /auth 단계적 폐기(게이트 전환, Dual Run). 
2) API Gateway 배치(레이트리미트/WAF). 
3) Redis HA/Cluster 및 BullMQ DLQ/Dedup 적용. 
4) Postgres HA + 파티셔닝, 백업/복구 리허설. 
5) Outbox/사전 계산/캐시 무효화 도입. 
6) Observability 스택 배포 및 대시보드/알람 정식화.
