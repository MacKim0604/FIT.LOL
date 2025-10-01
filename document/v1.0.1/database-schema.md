# FIT.LOL Database Schema v1.0.1

## 개요
PostgreSQL 기반 관계형 데이터베이스 스키마 설계입니다. Prisma ORM을 사용하여 타입 안전성과 마이그레이션을 관리합니다.

---

## ERD (Entity Relationship Diagram)

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│   summoners     │
└──────┬──────────┘
       │ 1
       ├─────────────────┐
       │ N               │ N
┌──────┴──────────┐ ┌────┴────────────────┐
│ ranked_stats    │ │ match_participants  │
└─────────────────┘ └────┬────────────────┘
                         │ N
                         │
                         │ 1
                    ┌────┴──────┐
                    │  matches  │
                    └───────────┘

       ┌──────────────┐
       │  summoners   │
       └──────┬───────┘
              │ 1
              │
              │ N
       ┌──────┴────────────┐
       │  champion_stats   │
       └───────────────────┘

       ┌──────────────┐
       │  summoners   │
       └──────┬───────┘
              │ 1
              │
              │ N
       ┌──────┴────────────────┐
       │  analysis_results     │
       └───────────────────────┘
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 사용자 관리
// ============================================

model User {
  id        String      @id @default(cuid())
  email     String      @unique
  username  String      @unique
  password  String      // bcrypt hashed
  role      UserRole    @default(MEMBER)
  isActive  Boolean     @default(true)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  summoners Summoner[]
  
  @@map("users")
}

enum UserRole {
  LEADER  // 클랜 리더 (모든 권한)
  MEMBER  // 일반 멤버 (읽기 권한)
}

// ============================================
// 소환사 정보
// ============================================

model Summoner {
  id              String    @id @default(cuid())
  userId          String
  puuid           String    @unique  // Riot API PUUID
  summonerId      String    @unique  // Riot API Summoner ID
  accountId       String    @unique  // Riot API Account ID
  summonerName    String
  summonerLevel   Int
  profileIconId   Int
  region          String    @default("kr")  // kr, na1, euw1, etc.
  isActive        Boolean   @default(true)
  lastSyncedAt    DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  rankedStats       RankedStat[]
  matchParticipants MatchParticipant[]
  championStats     ChampionStat[]
  analysisResults   AnalysisResult[]
  
  @@index([userId])
  @@index([puuid])
  @@map("summoners")
}

// ============================================
// 랭크 정보
// ============================================

model RankedStat {
  id          String    @id @default(cuid())
  summonerId  String
  queueType   QueueType
  tier        Tier?
  rank        Rank?
  lp          Int       @default(0)
  wins        Int       @default(0)
  losses      Int       @default(0)
  hotStreak   Boolean   @default(false)
  veteran     Boolean   @default(false)
  freshBlood  Boolean   @default(false)
  inactive    Boolean   @default(false)
  updatedAt   DateTime  @updatedAt
  
  summoner Summoner @relation(fields: [summonerId], references: [id], onDelete: Cascade)
  
  @@unique([summonerId, queueType])
  @@index([summonerId])
  @@map("ranked_stats")
}

enum QueueType {
  RANKED_SOLO_5x5
  RANKED_FLEX_SR
}

enum Tier {
  IRON
  BRONZE
  SILVER
  GOLD
  PLATINUM
  EMERALD
  DIAMOND
  MASTER
  GRANDMASTER
  CHALLENGER
}

enum Rank {
  I
  II
  III
  IV
}

// ============================================
// 매치 정보
// ============================================

model Match {
  id                String    @id @default(cuid())
  matchId           String    @unique  // Riot API Match ID (KR_1234567890)
  gameCreation      DateTime
  gameDuration      Int       // seconds
  gameEndTimestamp  DateTime?
  gameMode          String
  gameType          String
  gameVersion       String
  mapId             Int
  platformId        String
  queueId           Int
  tournamentCode    String?
  createdAt         DateTime  @default(now())
  
  participants MatchParticipant[]
  
  @@index([matchId])
  @@index([gameCreation])
  @@map("matches")
}

// ============================================
// 매치 참가자 (클랜원 경기만 저장)
// ============================================

model MatchParticipant {
  id          String   @id @default(cuid())
  matchId     String
  summonerId  String
  
  // 기본 정보
  championId            Int
  championName          String
  position              Position
  teamId                Int       // 100 (Blue) or 200 (Red)
  teamPosition          String
  individualPosition    String
  win                   Boolean
  
  // 전투 지표
  kills                 Int
  deaths                Int
  assists               Int
  doubleKills           Int       @default(0)
  tripleKills           Int       @default(0)
  quadraKills           Int       @default(0)
  pentaKills            Int       @default(0)
  
  // 딜량/탱킹
  totalDamageDealt              Int
  totalDamageDealtToChampions   Int
  totalDamageTaken              Int
  physicalDamageDealt           Int
  magicDamageDealt              Int
  trueDamageDealt               Int
  largestCriticalStrike         Int       @default(0)
  damageDealtToObjectives       Int       @default(0)
  damageDealtToTurrets          Int       @default(0)
  
  // 골드/CS
  goldEarned            Int
  goldSpent             Int
  totalMinionsKilled    Int
  neutralMinionsKilled  Int
  
  // 시야
  visionScore           Int
  wardsPlaced           Int
  wardsKilled           Int
  detectorWardsPlaced   Int       @default(0)
  
  // 오브젝트
  turretKills           Int       @default(0)
  inhibitorKills        Int       @default(0)
  dragonKills           Int       @default(0)
  baronKills            Int       @default(0)
  
  // 라인전 지표 (타임라인 데이터에서 추출)
  csAt10                Int?
  goldAt10              Int?
  xpAt10                Int?
  csDiffAt10            Int?
  goldDiffAt10          Int?
  xpDiffAt10            Int?
  
  // 특수 지표
  soloKills             Int       @default(0)
  firstBloodKill        Boolean   @default(false)
  firstBloodAssist      Boolean   @default(false)
  firstTowerKill        Boolean   @default(false)
  firstTowerAssist      Boolean   @default(false)
  
  // 아이템
  item0                 Int       @default(0)
  item1                 Int       @default(0)
  item2                 Int       @default(0)
  item3                 Int       @default(0)
  item4                 Int       @default(0)
  item5                 Int       @default(0)
  item6                 Int       @default(0)
  
  // 스펠
  summoner1Id           Int
  summoner2Id           Int
  
  // 룬
  primaryStyle          Int
  subStyle              Int
  
  // 메타 정보
  champLevel            Int
  timePlayed            Int
  
  createdAt             DateTime  @default(now())
  
  match     Match     @relation(fields: [matchId], references: [id], onDelete: Cascade)
  summoner  Summoner  @relation(fields: [summonerId], references: [id], onDelete: Cascade)
  
  @@unique([matchId, summonerId])
  @@index([summonerId])
  @@index([matchId])
  @@index([summonerId, createdAt])
  @@map("match_participants")
}

enum Position {
  TOP
  JUNGLE
  MID
  ADC
  SUPPORT
  UNKNOWN
}

// ============================================
// 챔피언 통계 (집계 테이블)
// ============================================

model ChampionStat {
  id          String   @id @default(cuid())
  summonerId  String
  championId  Int
  position    Position
  
  // 기본 통계
  gamesPlayed Int      @default(0)
  wins        Int      @default(0)
  losses      Int      @default(0)
  
  // 평균 지표
  avgKills            Float    @default(0)
  avgDeaths           Float    @default(0)
  avgAssists          Float    @default(0)
  avgKda              Float    @default(0)
  
  avgCs               Float    @default(0)
  avgGold             Float    @default(0)
  avgDamage           Float    @default(0)
  avgDamageTaken      Float    @default(0)
  avgVisionScore      Float    @default(0)
  
  // 라인전 평균
  avgCsAt10           Float?
  avgGoldDiffAt10     Float?
  avgXpDiffAt10       Float?
  
  // 특수 지표
  totalSoloKills      Int      @default(0)
  firstBloodRate      Float    @default(0)
  
  // 최근 폼 (최근 5/10/20경기)
  recentGames5        Int      @default(0)
  recentWins5         Int      @default(0)
  recentGames10       Int      @default(0)
  recentWins10        Int      @default(0)
  recentGames20       Int      @default(0)
  recentWins20        Int      @default(0)
  
  updatedAt   DateTime @updatedAt
  
  summoner Summoner @relation(fields: [summonerId], references: [id], onDelete: Cascade)
  
  @@unique([summonerId, championId, position])
  @@index([summonerId])
  @@map("champion_stats")
}

// ============================================
// 분석 결과 (캐시)
// ============================================

model AnalysisResult {
  id           String       @id @default(cuid())
  summonerId   String
  analysisType AnalysisType
  resultData   Json         // 분석 결과 JSON
  createdAt    DateTime     @default(now())
  expiresAt    DateTime     // TTL
  
  summoner Summoner @relation(fields: [summonerId], references: [id], onDelete: Cascade)
  
  @@index([summonerId, analysisType])
  @@index([expiresAt])
  @@map("analysis_results")
}

enum AnalysisType {
  PLAYER_CARD      // 개인 전력 카드
  WEEKLY_REPORT    // 주간 리포트
  CHAMPION_POOL    // 챔피언 풀 분석
  POSITION_STATS   // 포지션별 통계
}

// ============================================
// 팀 시너지 (Phase 2)
// ============================================

model TeamSynergy {
  id              String   @id @default(cuid())
  summonerIds     String[] // Array of summoner IDs (sorted)
  
  gamesTogether   Int      @default(0)
  winsTogether    Int      @default(0)
  
  synergyScore    Float    @default(0)
  roleBalance     Float    @default(0)
  championSynergy Float    @default(0)
  
  updatedAt       DateTime @updatedAt
  
  @@unique([summonerIds])
  @@map("team_synergies")
}

// ============================================
// 작업 로그 (디버깅용)
// ============================================

model JobLog {
  id          String    @id @default(cuid())
  jobType     String    // riot-api, analysis, report
  jobId       String?   // Bull Job ID
  status      JobStatus
  summonerId  String?
  matchId     String?
  errorMsg    String?
  retryCount  Int       @default(0)
  createdAt   DateTime  @default(now())
  completedAt DateTime?
  
  @@index([jobType, status])
  @@index([summonerId])
  @@map("job_logs")
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  RETRYING
}
```

---

## 인덱스 전략

### 1. 기본 인덱스
- Primary Key: 모든 테이블의 `id`
- Unique 제약: `puuid`, `matchId`, 복합 키 등

### 2. 조회 성능 최적화
```sql
-- 소환사 조회
CREATE INDEX idx_summoners_puuid ON summoners(puuid);
CREATE INDEX idx_summoners_user_id ON summoners(user_id);

-- 매치 조회
CREATE INDEX idx_matches_match_id ON matches(match_id);
CREATE INDEX idx_matches_game_creation ON matches(game_creation);

-- 매치 참가자 조회 (가장 자주 사용)
CREATE INDEX idx_match_participants_summoner ON match_participants(summoner_id);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_match_participants_summoner_date 
  ON match_participants(summoner_id, created_at DESC);

-- 챔피언 통계 조회
CREATE INDEX idx_champion_stats_summoner ON champion_stats(summoner_id);

-- 분석 결과 조회
CREATE INDEX idx_analysis_results_summoner_type 
  ON analysis_results(summoner_id, analysis_type);
CREATE INDEX idx_analysis_results_expires ON analysis_results(expires_at);
```

### 3. 복합 인덱스
```sql
-- 최근 경기 조회 (자주 사용)
CREATE INDEX idx_match_participants_recent 
  ON match_participants(summoner_id, created_at DESC)
  INCLUDE (champion_id, position, win);

-- 챔피언별 통계 조회
CREATE INDEX idx_champion_stats_lookup 
  ON champion_stats(summoner_id, champion_id, position);
```

---

## 데이터 크기 예상

### 클랜원 50명, 각 20경기 기준

```
users: 50 rows × 0.5KB = 25KB
summoners: 50 rows × 1KB = 50KB
ranked_stats: 100 rows (50명 × 2큐) × 0.5KB = 50KB
matches: 1000 rows × 1KB = 1MB
match_participants: 1000 rows × 2KB = 2MB
champion_stats: 500 rows (50명 × 평균 10챔피언) × 1KB = 500KB
analysis_results: 200 rows × 5KB = 1MB

총 예상: ~5MB (초기)
```

### 1년 운영 시 (주 10경기 추가)

```
matches: 26,000 rows × 1KB = 26MB
match_participants: 26,000 rows × 2KB = 52MB
champion_stats: 500 rows (업데이트만) = 500KB

총 예상: ~80MB (1년 후)
```

### 스토리지 최적화
- 90일 이상 오래된 매치 데이터 아카이빙
- 분석 결과 캐시 자동 삭제 (TTL)
- 불필요한 컬럼 제거 (아이템, 룬 상세 등)

---

## 마이그레이션 전략

### 1. 초기 마이그레이션
```bash
# Prisma 초기화
npx prisma init

# 스키마 작성 후 마이그레이션 생성
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate
```

### 2. 스키마 변경 시
```bash
# 개발 환경
npx prisma migrate dev --name add_new_field

# 프로덕션 환경
npx prisma migrate deploy
```

### 3. 시드 데이터
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 기본 관리자 계정 생성
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitlol.com' },
    update: {},
    create: {
      email: 'admin@fitlol.com',
      username: 'admin',
      password: hashedPassword,
      role: 'LEADER',
    },
  });
  
  console.log('Admin user created:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 쿼리 예시

### 1. 클랜원의 최근 20경기 조회
```typescript
const recentMatches = await prisma.matchParticipant.findMany({
  where: { summonerId },
  include: {
    match: {
      select: {
        matchId: true,
        gameCreation: true,
        gameDuration: true,
      },
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

### 2. 챔피언별 승률 조회
```typescript
const championStats = await prisma.championStat.findMany({
  where: { 
    summonerId,
    gamesPlayed: { gte: 3 }, // 최소 3경기 이상
  },
  orderBy: [
    { gamesPlayed: 'desc' },
    { wins: 'desc' },
  ],
});
```

### 3. 포지션별 평균 지표 (클랜 전체)
```typescript
const positionStats = await prisma.$queryRaw`
  SELECT 
    position,
    COUNT(*) as games,
    AVG(kills) as avg_kills,
    AVG(deaths) as avg_deaths,
    AVG(assists) as avg_assists,
    AVG(cs_at_10) as avg_cs_at_10,
    AVG(vision_score) as avg_vision_score
  FROM match_participants
  WHERE summoner_id IN (${summonerIds})
    AND position != 'UNKNOWN'
  GROUP BY position
`;
```

### 4. 최근 폼 계산 (최근 5/10/20경기)
```typescript
const recentForm = await prisma.matchParticipant.groupBy({
  by: ['summonerId'],
  where: {
    summonerId,
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 최근 30일
    },
  },
  _count: { id: true },
  _sum: { win: true },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

### 5. 듀오 시너지 조회 (Phase 2)
```typescript
// 두 소환사가 함께한 경기 찾기
const duoMatches = await prisma.$queryRaw`
  SELECT 
    m.match_id,
    m.game_creation,
    mp1.win
  FROM matches m
  JOIN match_participants mp1 ON m.id = mp1.match_id
  JOIN match_participants mp2 ON m.id = mp2.match_id
  WHERE mp1.summoner_id = ${summonerId1}
    AND mp2.summoner_id = ${summonerId2}
    AND mp1.team_id = mp2.team_id
  ORDER BY m.game_creation DESC
`;
```

---

## 백업 및 복구

### 1. 정기 백업
```bash
# PostgreSQL 덤프
pg_dump -h localhost -U postgres -d fitlol > backup_$(date +%Y%m%d).sql

# 압축
gzip backup_$(date +%Y%m%d).sql
```

### 2. 복구
```bash
# 압축 해제
gunzip backup_20251001.sql.gz

# 복구
psql -h localhost -U postgres -d fitlol < backup_20251001.sql
```

### 3. 자동화 (Cron)
```bash
# 매일 03:00 백업
0 3 * * * /home/user/scripts/backup-db.sh
```

---

## 성능 모니터링

### 1. 느린 쿼리 로깅
```sql
-- PostgreSQL 설정
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1초 이상
ALTER SYSTEM SET log_statement = 'all';
```

### 2. 쿼리 분석
```sql
-- EXPLAIN ANALYZE 사용
EXPLAIN ANALYZE
SELECT * FROM match_participants
WHERE summoner_id = 'xxx'
ORDER BY created_at DESC
LIMIT 20;
```

### 3. 인덱스 사용률 확인
```sql
-- 사용되지 않는 인덱스 찾기
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

---

## 다음 단계

1. ✅ Prisma 스키마 작성 완료
2. ⬜ 초기 마이그레이션 실행
3. ⬜ 시드 데이터 작성
4. ⬜ 쿼리 헬퍼 함수 작성
5. ⬜ 데이터 접근 레이어 (Repository 패턴) 구현

---

## 참고 자료

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Riot API Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon)
