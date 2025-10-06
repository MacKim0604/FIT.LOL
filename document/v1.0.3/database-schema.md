# Database Schema Changes v1.0.3 (Ingestion)

## 개요
수집 진행 상태 관리와 관측성을 위해 보조 테이블을 추가합니다. 본 문서는 v1.0.1의 상세 스키마를 기반으로 v1.0.3 보강점을 요약합니다.

---

## 신규/보강 테이블

### 1) ingestion_cursors
- 목적: 소환사별 수집 진행 위치(커서) 저장 → 재시작/재수집 시 중복 최소화
```prisma
model IngestionCursor {
  id        String   @id @default(cuid())
  puuid     String   @unique
  lastMatchTimestamp BigInt?
  lastFetchedCount   Int    @default(0)
  updatedAt DateTime @updatedAt
  @@map("ingestion_cursors")
}
```

### 2) job_logs (보강)
- 목적: Job 실행 이력/실패 원인/재시도 횟수 저장
```prisma
model JobLog {
  id          String   @id @default(cuid())
  jobType     String
  jobId       String?
  status      String    // PENDING/PROCESSING/COMPLETED/FAILED
  puuid       String?
  matchId     String?
  errorMsg    String?
  retryCount  Int       @default(0)
  createdAt   DateTime  @default(now())
  completedAt DateTime?
  @@index([jobType, status])
  @@index([puuid])
  @@map("job_logs")
}
```

---

## 인덱스/제약 재확인
- `matches.matchId` UNIQUE
- `match_participants (matchId, summonerId)` UNIQUE
- `ingestion_cursors.puuid` UNIQUE

---

## 마이그레이션
- Prisma 사용 시: `npx prisma migrate dev --name v1_0_3_ingestion`

---

## 참고
- v1.0.1 문서의 테이블(Users, Summoners, Matches, MatchParticipants, ChampionStat, AnalysisResult) 그대로 유지
- v1.0.2의 사용자 OIDC 변경 사항(Password 제거, `oidcSub`) 유지
