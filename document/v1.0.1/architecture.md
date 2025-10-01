# FIT.LOL v1.0.1 Architecture Document

## 개요
FIT.LOL은 **리그 오브 레전드 클랜 내부 전력 분석 도구**입니다. Riot Games API를 활용하여 클랜원들의 게임 데이터를 수집·분석하고, 개인 전력 평가, 팀 시너지 분석, 밴픽 추천 등의 인사이트를 제공합니다.

### 프로젝트 목표
- 클랜원 개개인의 강점/약점 파악
- 듀오/팀 조합 최적화
- 데이터 기반 밴픽 전략 수립
- 클랜 전체의 성장 추이 모니터링

### 타겟 사용자
- 클랜 리더 및 매니저
- 클랜원 (개인 통계 확인)
- 내부 사용 목적 (비상업적)

---

## 아키텍처 원칙

### 1. 단계적 확장 (Progressive Enhancement)
- Phase 1: 모놀리식 구조로 빠른 MVP 개발
- Phase 2+: 필요에 따라 마이크로서비스로 분리

### 2. API First
- 명확한 API 계약 (OpenAPI 3.0)
- Frontend와 Backend 독립 개발 가능

### 3. 데이터 중심 설계
- Riot API Rate Limiting 최우선 고려
- 효율적인 캐싱 및 배치 처리
- 데이터 정합성 보장

---

## Phase 1 아키텍처 (MVP)

```
┌─────────────────────────────────────────────────────────┐
│                       Frontend (React)                   │
│  - 클랜원 관리  - 개인 전력 카드  - 기본 통계 대시보드    │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────┴────────────────────────────────┐
│                   Backend API (Express.js)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ UserService  │  │ RiotAPIService│  │AnalysisService│ │
│  │ (클랜원관리)  │  │ (데이터수집)  │  │  (통계분석)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Queue System (Bull + Redis)              │  │
│  │  - Riot API 호출 큐                               │  │
│  │  - 배치 데이터 수집                               │  │
│  │  - 분석 작업 큐                                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                  Data Layer                              │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │   PostgreSQL     │         │      Redis       │     │
│  │  - 사용자 데이터  │         │  - API 캐시      │     │
│  │  - 매치 데이터    │         │  - 세션 저장     │     │
│  │  - 분석 결과      │         │  - 작업 큐       │     │
│  └──────────────────┘         └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Riot API   │
                  └─────────────┘
```

---

## 핵심 컴포넌트

### 1. Frontend (UI)

**기술 스택:**
- React 18+ with TypeScript
- Tailwind CSS + shadcn/ui
- React Query (서버 상태 관리)
- Zustand (클라이언트 상태 관리)
- Recharts (데이터 시각화)

**주요 화면:**
1. **대시보드**
   - 클랜 전체 통계 (티어 분포, 역할 밸런스)
   - 최근 폼 상위/하위 5명
   - 듀오 시너지 상위 조합
   
2. **클랜원 관리**
   - 클랜원 추가/삭제
   - 소환사 계정 연동
   - 데이터 수집 상태 표시

3. **개인 전력 카드**
   - 주 포지션/챔피언
   - 핵심 지표 (레인전, 전투, 운영)
   - 강점/약점 레이더 차트
   - 최근 폼 추이 그래프

4. **팀 빌더** (Phase 2)
   - 5명 선택 → 자동 라인 배치
   - 팀 시너지 점수
   - 추천 밴픽 리스트

---

### 2. Backend API

**기술 스택:**
- Node.js 20+ with TypeScript
- Express.js
- Prisma ORM
- Bull (작업 큐)
- Zod (유효성 검증)

**API 구조:**
```
/api/v1
  /auth
    POST   /login              # 로그인
    POST   /logout             # 로그아웃
  
  /clan
    GET    /members            # 클랜원 목록
    POST   /members            # 클랜원 추가
    DELETE /members/:id        # 클랜원 삭제
    GET    /members/:id/stats  # 개인 통계
  
  /summoner
    POST   /link               # 소환사 연동
    GET    /:puuid             # 소환사 정보
    POST   /:puuid/refresh     # 데이터 갱신
  
  /analysis
    GET    /player/:id         # 개인 분석 결과
    GET    /synergy            # 듀오/팀 시너지
    GET    /weekly-report      # 주간 리포트
  
  /admin
    GET    /jobs               # 작업 큐 상태
    POST   /jobs/retry         # 실패 작업 재시도
```

---

### 3. UserService (클랜원 관리)

**책임:**
- 클랜원 CRUD
- 소환사 계정 연동
- 권한 관리 (클랜 리더 vs 일반 멤버)

**주요 기능:**
- 클랜원 등록 시 자동으로 Riot API 데이터 수집 작업 큐에 추가
- 소환사 PUUID 기반 중복 체크
- 클랜원 활성/비활성 상태 관리

---

### 4. RiotAPIService (데이터 수집)

**책임:**
- Riot Games API 호출
- Rate Limiting 관리
- 데이터 캐싱
- 에러 처리 및 재시도

**Rate Limit 전략:**
```typescript
// Riot API Rate Limits (KR 서버 기준)
// Application: 20 requests/sec, 100 requests/2min
// Method: 각 엔드포인트별 제한

Priority Queue:
  1. 실시간 요청 (사용자 트리거)
  2. 최근 5경기 수집 (높은 우선순위)
  3. 6-20경기 수집 (중간 우선순위)
  4. 과거 데이터 백필 (낮은 우선순위)
```

**캐싱 전략:**
```typescript
Cache TTL:
  - 소환사 기본 정보: 24시간
  - 랭크 정보: 1시간
  - 챔피언 마스터리: 6시간
  - 매치 데이터: 영구 (immutable)
  - 매치 타임라인: 영구 (immutable)
```

**주요 API 호출:**
1. **Summoner-v4**: PUUID, 소환사 레벨
2. **League-v4**: 랭크, 티어, LP
3. **Match-v5**: 매치 ID 리스트, 매치 상세, 타임라인
4. **Champion-Mastery-v4**: 챔피언 숙련도

**에러 처리:**
```typescript
- 429 (Rate Limit): Retry-After 헤더 확인 후 대기
- 503 (Service Unavailable): Exponential backoff (1s, 2s, 4s, 8s)
- 404 (Not Found): 로그 기록 후 스킵
- 403 (Forbidden): API 키 확인 알림
```

---

### 5. AnalysisService (통계 분석)

**책임:**
- 원시 데이터에서 지표 계산
- 개인/팀 분석 결과 생성
- 주간 리포트 생성

**핵심 지표:**

#### 레인전 지표
- **CS@10**: 10분 CS
- **GD@10**: 10분 골드 차이
- **XPD@10**: 10분 경험치 차이
- **솔로킬율**: 라인전 솔로킬 비율
- **첫 데스율**: 라인전 첫 데스 비율

#### 전투 지표
- **KDA**: (킬 + 어시스트) / 데스
- **DPM**: 분당 챔피언 딜량
- **KP**: 킬 관여율 (킬+어시/팀 전체 킬)
- **DTPM**: 분당 받은 피해량
- **생존률**: 데스 0인 경기 비율

#### 운영 지표
- **VSPM**: 분당 시야 점수
- **WPM**: 분당 와드 설치
- **WCPM**: 분당 와드 제거
- **오브젝트 관여**: 드래곤/전령/바론 참여율

#### 종합 지표
```typescript
// Z-score 정규화 (클랜 내 상대 평가)
function zScore(value: number, mean: number, stdDev: number): number {
  return (value - mean) / stdDev;
}

// 레인전 점수
Lane = z(CS@10) + z(GD@10) + 0.5*z(XPD@10) + 0.5*z(SoloKill%)

// 전투 점수
Fight = z(DPM) + z(KP) + 0.5*z(Survival)

// 운영 점수
Macro = z(VSPM) + 0.5*z(WPM) + 0.5*z(WCPM) + z(ObjPart)

// 최근 폼 (가중 평균)
Form = 0.6*WR_5 + 0.3*WR_10 + 0.1*WR_20

// 종합 전력 점수
Power = 0.35*Lane + 0.35*Fight + 0.2*Macro + 0.1*Form
```

#### 팀 시너지 (Phase 2)
```typescript
Synergy = 
  0.4 * 공동경기승률 +
  0.3 * 역할보완지수 +
  0.2 * 챔피언시너지 +
  0.1 * 라인전상성

역할보완지수:
  - 탱커 비중 (0.2)
  - 이니시에이터 비중 (0.2)
  - AP 딜러 비중 (0.2)
  - AD 딜러 비중 (0.2)
  - 서포터 비중 (0.2)
  → 팀 템플릿과의 유사도
```

---

### 6. Queue System (작업 큐)

**기술:** Bull + Redis

**큐 종류:**
1. **riot-api-queue**: Riot API 호출
2. **analysis-queue**: 데이터 분석
3. **report-queue**: 주간 리포트 생성

**작업 우선순위:**
```typescript
Priority Levels:
  1 (Highest): 사용자 실시간 요청
  2 (High):    최근 5경기 수집
  3 (Normal):  6-20경기 수집
  4 (Low):     과거 데이터 백필
  5 (Lowest):  주간 리포트 생성
```

**스케줄링:**
```typescript
// 클랜원 데이터 자동 갱신
Cron Jobs:
  - 매 1시간: 활성 클랜원 최근 경기 체크
  - 매일 03:00: 전체 클랜원 랭크 정보 갱신
  - 매주 월요일 04:00: 주간 리포트 생성
```

---

### 7. Database (PostgreSQL)

**ERD 주요 테이블:**

```sql
-- 사용자 (클랜원)
users
  - id (PK)
  - username
  - email
  - role (LEADER, MEMBER)
  - created_at
  - updated_at

-- 소환사 계정
summoners
  - id (PK)
  - user_id (FK)
  - puuid (Unique)
  - summoner_name
  - summoner_level
  - profile_icon_id
  - region
  - last_synced_at
  - created_at

-- 랭크 정보
ranked_stats
  - id (PK)
  - summoner_id (FK)
  - queue_type (RANKED_SOLO_5x5, RANKED_FLEX_SR)
  - tier
  - rank
  - lp
  - wins
  - losses
  - updated_at

-- 매치 기본 정보
matches
  - id (PK)
  - match_id (Unique, Riot API match ID)
  - game_creation
  - game_duration
  - game_version
  - queue_id
  - created_at

-- 매치 참가자 (클랜원 경기만)
match_participants
  - id (PK)
  - match_id (FK)
  - summoner_id (FK)
  - champion_id
  - position (TOP, JUNGLE, MID, ADC, SUPPORT)
  - team_id (100, 200)
  - win
  - kills
  - deaths
  - assists
  - total_damage_dealt_to_champions
  - total_damage_taken
  - gold_earned
  - cs_total
  - vision_score
  - wards_placed
  - wards_killed
  - -- 라인전 지표
  - cs_at_10
  - gold_at_10
  - xp_at_10
  - cs_diff_at_10
  - gold_diff_at_10
  - xp_diff_at_10
  - solo_kills
  - first_blood
  - first_death

-- 챔피언 통계 (집계 테이블)
champion_stats
  - id (PK)
  - summoner_id (FK)
  - champion_id
  - position
  - games_played
  - wins
  - losses
  - avg_kda
  - avg_cs_at_10
  - avg_gold_diff_at_10
  - updated_at

-- 분석 결과 (캐시)
analysis_results
  - id (PK)
  - summoner_id (FK)
  - analysis_type (PLAYER_CARD, WEEKLY_REPORT)
  - result_data (JSONB)
  - created_at
  - expires_at

-- 팀 시너지 (Phase 2)
team_synergies
  - id (PK)
  - summoner_ids (Array)
  - games_together
  - wins_together
  - synergy_score
  - updated_at
```

**인덱스 전략:**
```sql
-- 자주 조회되는 컬럼
CREATE INDEX idx_summoners_puuid ON summoners(puuid);
CREATE INDEX idx_matches_match_id ON matches(match_id);
CREATE INDEX idx_match_participants_summoner ON match_participants(summoner_id);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_champion_stats_summoner ON champion_stats(summoner_id);

-- 복합 인덱스
CREATE INDEX idx_match_participants_summoner_date 
  ON match_participants(summoner_id, match_id DESC);
```

---

## 데이터 수집 플로우

### 신규 클랜원 추가 시
```
1. 사용자가 소환사명 입력
2. Riot API로 PUUID 조회
3. DB에 summoner 레코드 생성
4. 작업 큐에 추가:
   - 랭크 정보 수집 (Priority 1)
   - 최근 20경기 ID 수집 (Priority 1)
   - 각 경기 상세 정보 수집 (Priority 2)
   - 챔피언 마스터리 수집 (Priority 3)
5. 데이터 수집 완료 후 분석 작업 큐에 추가
6. 분석 완료 후 프론트엔드에 알림
```

### 정기 데이터 갱신
```
매 1시간마다:
1. 활성 클랜원 목록 조회
2. 각 클랜원의 최근 매치 ID 조회
3. 새로운 경기가 있으면:
   - 매치 상세 정보 수집
   - DB 저장
   - 분석 결과 갱신
```

---

## 보안 및 정책

### 1. 인증/권한
```typescript
Roles:
  - LEADER: 모든 권한 (클랜원 추가/삭제, 설정 변경)
  - MEMBER: 읽기 권한 (자신의 상세 통계 + 클랜 전체 통계)

Authentication:
  - JWT 토큰 기반
  - Access Token: 1시간
  - Refresh Token: 7일
```

### 2. Riot API 정책 준수
- ✅ 개발자 API 키 사용 (Production Key 신청 시 용도 명시)
- ✅ API 호출 시 User-Agent 헤더 포함
- ✅ Rate Limiting 엄격히 준수
- ✅ 데이터 출처 명시 (Powered by Riot Games API)
- ✅ 비상업적 사용 (클랜 내부 도구)

### 3. 개인정보 보호
```
- 클랜원만 접근 가능 (공개 서비스 아님)
- 소환사명 외 개인정보 수집 안 함
- 데이터 삭제 요청 처리 (Soft Delete)
- 비활성 클랜원 데이터 90일 후 자동 삭제
```

---

## 개발 우선순위

### Phase 1: MVP (4-6주)
**목표:** 기본적인 데이터 수집 및 개인 통계 제공

- [ ] 프로젝트 초기 설정
  - [ ] Monorepo 구조 (Turborepo 또는 Nx)
  - [ ] TypeScript 설정
  - [ ] ESLint, Prettier
  - [ ] Git hooks (Husky)

- [ ] Backend 기본 구조
  - [ ] Express.js + TypeScript 설정
  - [ ] Prisma ORM 설정
  - [ ] PostgreSQL 연결
  - [ ] Redis 연결
  - [ ] 환경 변수 관리 (.env)

- [ ] 인증 시스템
  - [ ] 회원가입/로그인 (간단한 이메일/비밀번호)
  - [ ] JWT 토큰 발급
  - [ ] 권한 미들웨어

- [ ] 클랜원 관리
  - [ ] 클랜원 CRUD API
  - [ ] 소환사 계정 연동 API
  - [ ] 클랜원 목록 조회

- [ ] Riot API 연동
  - [ ] API 클라이언트 구현
  - [ ] Rate Limiter 구현
  - [ ] 캐싱 레이어 (Redis)
  - [ ] 에러 처리 및 재시도 로직

- [ ] 데이터 수집
  - [ ] Bull Queue 설정
  - [ ] 소환사 정보 수집 Job
  - [ ] 매치 ID 수집 Job
  - [ ] 매치 상세 정보 수집 Job
  - [ ] 진행률 추적

- [ ] 기본 분석
  - [ ] 매치 데이터 파싱
  - [ ] 라인전 지표 계산
  - [ ] 전투 지표 계산
  - [ ] 운영 지표 계산
  - [ ] 개인 전력 카드 생성

- [ ] Frontend 기본 구조
  - [ ] React + TypeScript 설정
  - [ ] Tailwind CSS + shadcn/ui
  - [ ] React Query 설정
  - [ ] 라우팅 (React Router)

- [ ] Frontend 화면
  - [ ] 로그인/회원가입
  - [ ] 클랜원 관리 페이지
  - [ ] 대시보드 (기본 통계)
  - [ ] 개인 전력 카드

- [ ] 배포
  - [ ] Docker 설정
  - [ ] Railway 또는 Render 배포
  - [ ] 환경 변수 설정
  - [ ] 모니터링 (Sentry)

### Phase 2: 고급 분석 (4-6주)
**목표:** 팀 시너지, 밴픽 추천, 주간 리포트

- [ ] 챔피언 풀 분석
  - [ ] 챔피언별 통계 집계
  - [ ] 포지션별 챔피언 풀
  - [ ] 챔피언 다양도 계산

- [ ] 팀 시너지 분석
  - [ ] 듀오 조합 분석
  - [ ] 역할 보완 지수 계산
  - [ ] 팀 빌더 UI

- [ ] 밴픽 추천 (간단 버전)
  - [ ] 클랜원 주력 챔피언 분석
  - [ ] 상대 챔피언 통계 (자체 데이터 기반)
  - [ ] 밴 추천 알고리즘

- [ ] 주간 리포트
  - [ ] 주간 통계 집계
  - [ ] MMR 추정 (간단한 Elo 계산)
  - [ ] 성장 추이 그래프
  - [ ] 이메일 발송 (선택)

- [ ] UI/UX 개선
  - [ ] 반응형 디자인
  - [ ] 다크 모드
  - [ ] 애니메이션 효과
  - [ ] 로딩 상태 개선

### Phase 3: 최적화 및 확장 (추후)
**목표:** 성능 최적화, 실시간 기능, 모바일 지원

- [ ] 성능 최적화
  - [ ] 쿼리 최적화
  - [ ] 데이터베이스 인덱싱
  - [ ] API 응답 캐싱
  - [ ] 이미지 최적화

- [ ] 실시간 기능
  - [ ] WebSocket 연결
  - [ ] 실시간 데이터 업데이트
  - [ ] 실시간 알림

- [ ] 고급 분석
  - [ ] 매치 프리뷰
  - [ ] 라인전 예측
  - [ ] 오브젝트 타이밍 분석

- [ ] 마이크로서비스 분리 (필요시)
  - [ ] API Gateway 추가
  - [ ] 서비스별 독립 배포
  - [ ] 서비스 간 통신 (gRPC 또는 Message Queue)

- [ ] 모바일 앱
  - [ ] React Native
  - [ ] 또는 PWA

---

## 기술 스택 최종 결정

### Backend
```json
{
  "runtime": "Node.js 20+",
  "framework": "Express.js",
  "language": "TypeScript",
  "orm": "Prisma",
  "database": "PostgreSQL 14+",
  "cache": "Redis 7+",
  "queue": "Bull",
  "validation": "Zod",
  "testing": "Jest + Supertest"
}
```

### Frontend
```json
{
  "framework": "React 18+",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "components": "shadcn/ui",
  "state": {
    "server": "React Query (TanStack Query)",
    "client": "Zustand"
  },
  "charts": "Recharts",
  "routing": "React Router v6",
  "testing": "Vitest + React Testing Library"
}
```

### DevOps
```json
{
  "containerization": "Docker",
  "hosting": "Railway / Render",
  "ci_cd": "GitHub Actions",
  "monitoring": "Sentry",
  "logging": "Winston",
  "environment": "dotenv"
}
```

---

## 예상 비용 (Phase 1 기준)

### 인프라
- **Railway/Render**: $5-20/월 (Hobby → Pro)
- **PostgreSQL**: 포함 (Railway) 또는 $5/월 (Supabase Free)
- **Redis**: 포함 (Railway) 또는 $0 (Upstash Free)
- **도메인**: $10-15/년 (선택)

### API
- **Riot API**: 무료 (개인 개발자 키)
- **Production Key**: 무료 (승인 필요)

### 총 예상 비용
- **개발 단계**: $0-10/월
- **운영 단계**: $10-30/월 (클랜원 50명 기준)

---

## 리스크 관리

### 1. Riot API Rate Limiting
**리스크:** API 제한 초과 시 서비스 중단
**대응:**
- 엄격한 Rate Limiter 구현
- 우선순위 큐 시스템
- 충분한 캐싱
- 에러 모니터링 및 알림

### 2. 데이터 볼륨
**리스크:** 매치 타임라인 데이터가 매우 큼
**대응:**
- 필요한 지표만 추출 후 원본 삭제
- 오래된 데이터 아카이빙 (90일 이상)
- 페이지네이션 적용

### 3. Riot API 정책 변경
**리스크:** API 정책 또는 데이터 구조 변경
**대응:**
- API 버전 명시적 사용
- 변경 사항 모니터링
- 유연한 데이터 파싱 로직

### 4. 개발 리소스 부족
**리스크:** 기능 과다로 개발 지연
**대응:**
- MVP 범위 엄격히 제한
- Phase별 명확한 목표 설정
- 불필요한 기능 과감히 제거

---

## 다음 단계

1. **데이터베이스 스키마 상세 설계** → `database-schema.md`
2. **API 명세서 작성** → `api-specification.md`
3. **Riot API 호출 플로우 상세 설계** → `riot-api-flow.md`
4. **개발 환경 설정 가이드** → `development-setup.md`
5. **프로젝트 초기 설정** → 코드 작성 시작

---

## 변경 이력

### v1.0.1 (2025-10-01)
- 프로젝트 범위 명확화 (피트니스 관련 내용 제거)
- Phase 1 아키텍처 간소화 (모놀리식 구조)
- 데이터베이스 스키마 추가
- Riot API Rate Limiting 전략 상세화
- 캐싱 전략 구체화
- 개발 우선순위 체크리스트 추가
- 리스크 관리 섹션 추가

### v1.0.0 (2025-09-30)
- 초기 아키텍처 문서 작성
