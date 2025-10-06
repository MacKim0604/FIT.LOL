# FIT.LOL API Specification v1.0.3 (Ingestion Controls)

## 개요
v1.0.3는 Riot 데이터 수집을 제어/모니터링하는 관리자 엔드포인트를 추가합니다. 모든 엔드포인트는 `LEADER` 역할이 필요합니다.

---

## Base URL
```
Development: http://localhost:3000/api/v1
Production:  https://api.fitlol.com/api/v1
```

---

## 인증/권한
- Header: `Authorization: Bearer <access_token>`
- Role: `LEADER`

---

## 1. 수집 트리거

### 1.1 소환사 최신 수집(온디맨드)
```http
POST /ingestion/summoner/latest
```
**Body:**
```json
{
  "summonerName": "김동건",
  "tag": "DGKIM",
  "count": 20,
  "force": false
}
```
**Response:**
```json
{ "success": true, "data": { "jobId": "job_123", "type": "ingest.summoner.latest" } }
```

### 1.2 소환사 전체 백필
```http
POST /ingestion/summoner/full
```
**Body:**
```json
{ "summonerName": "김동건", "tag": "DGKIM", "lookbackDays": 30 }
```

### 1.3 랭크 정보 일별 수집
```http
POST /ingestion/rank/daily
```

### 1.4 주간 리포트 생성 트리거
```http
POST /ingestion/report/weekly
```

---

## 2. 상태/설정

### 2.1 Job 상태 조회
```http
GET /ingestion/jobs/{jobId}
```
**Response:**
```json
{ "success": true, "data": { "status": "PROCESSING", "progress": 40 } }
```

### 2.2 수집 요약
```http
GET /ingestion/summary
```
- 큐 길이, 처리율, 실패율, 최근 실패 등 제공

### 2.3 수집 설정 확인
```http
GET /ingestion/config
```
- 서버에 적용된 CRON, 동시성, 레이트리밋 등 노출(민감 정보 제외)

---

## 3. 에러 코드 (추가)
```tsnenum ErrorCode {
  QUEUE_UNAVAILABLE = 'QUEUE_UNAVAILABLE',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
}
```

---

## 4. 보안
- 모든 엔드포인트 `LEADER` 필요
- 요청 유효성 검증 및 레이트리밋 별도 적용 권장

---

## 5. 마이그레이션 노트
- v1.0.2 엔드포인트는 유지
- 본 문서 엔드포인트는 별도 서비스(RiotDataService) 혹은 Admin 라우트에 배치
