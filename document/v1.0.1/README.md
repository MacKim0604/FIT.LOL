# FIT.LOL v1.0.1 Documentation

## 프로젝트 개요
**FIT.LOL**은 리그 오브 레전드 클랜 내부 전력 분석 도구입니다. Riot Games API를 활용하여 클랜원들의 게임 데이터를 수집·분석하고, 개인 전력 평가, 팀 시너지 분석, 밴픽 추천 등의 인사이트를 제공합니다.

---

## 주요 기능

### Phase 1 (MVP)
- ✅ 클랜원 관리 및 소환사 계정 연동
- ✅ Riot API를 통한 자동 데이터 수집
- ✅ 개인 전력 카드 (레인전, 전투, 운영 지표)
- ✅ 기본 대시보드 (클랜 전체 통계)
- ✅ 최근 경기 기록 조회

### Phase 2 (고급 분석)
- ⬜ 챔피언 풀 분석
- ⬜ 팀 시너지 분석 (듀오/트리오/5인)
- ⬜ 밴픽 추천 시스템
- ⬜ 주간 리포트

### Phase 3 (최적화 및 확장)
- ⬜ 실시간 데이터 업데이트 (WebSocket)
- ⬜ 매치 프리뷰
- ⬜ 모바일 앱 (PWA 또는 React Native)

---

## 기술 스택

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Queue**: Bull

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Zustand
- **Charts**: Recharts

### DevOps
- **Containerization**: Docker
- **Hosting**: Railway / Render
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry

---

## 문서 구조

### 1. [architecture.md](./architecture.md)
전체 시스템 아키텍처, 컴포넌트 설계, 개발 우선순위를 설명합니다.

**주요 내용:**
- Phase별 아키텍처 설계
- 각 서비스의 역할과 책임
- 기술 스택 선정 이유
- 개발 로드맵

### 2. [database-schema.md](./database-schema.md)
데이터베이스 스키마 설계 및 Prisma 모델 정의를 포함합니다.

**주요 내용:**
- ERD (Entity Relationship Diagram)
- Prisma Schema 전체 코드
- 인덱스 전략
- 쿼리 최적화 방법
- 마이그레이션 가이드

### 3. [api-specification.md](./api-specification.md)
RESTful API 명세서입니다. 모든 엔드포인트의 요청/응답 형식을 정의합니다.

**주요 내용:**
- 인증 API (회원가입, 로그인, 토큰 갱신)
- 클랜 관리 API
- 소환사 API
- 분석 API
- 관리자 API
- 에러 코드 정의

### 4. [riot-api-integration.md](./riot-api-integration.md)
Riot Games API 통합 전략 및 구현 가이드입니다.

**주요 내용:**
- Riot API 기본 정보
- Rate Limiting 전략
- API 클라이언트 구현
- 데이터 수집 플로우
- 캐싱 전략
- 에러 처리

### 5. [development-setup.md](./development-setup.md)
로컬 개발 환경 설정 가이드입니다.

**주요 내용:**
- 시스템 요구사항
- 데이터베이스 설정
- 환경 변수 설정
- Riot API 키 발급
- 프로젝트 실행 방법
- 문제 해결 가이드

---

## 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-org/FIT.LOL.git
cd FIT.LOL
```

### 2. 의존성 설치
```bash
pnpm install
```

### 3. 환경 변수 설정
```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Riot API 키 입력 필요

# Frontend
cp apps/frontend/.env.example apps/frontend/.env
```

### 4. 데이터베이스 설정
```bash
# Docker로 PostgreSQL & Redis 실행
docker-compose up -d postgres redis

# 마이그레이션 실행
cd apps/backend
pnpm prisma migrate dev
pnpm prisma db seed
```

### 5. 프로젝트 실행
```bash
# 루트 디렉토리에서
pnpm dev

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### 6. 기본 관리자 계정
- Email: `admin@fitlol.com`
- Password: `admin123`

---

## 프로젝트 구조

```
FIT.LOL/
├── apps/
│   ├── backend/                 # Express.js API
│   │   ├── src/
│   │   │   ├── controllers/     # API 컨트롤러
│   │   │   ├── services/        # 비즈니스 로직
│   │   │   ├── workers/         # Bull Queue 워커
│   │   │   ├── middlewares/     # Express 미들웨어
│   │   │   ├── routes/          # API 라우트
│   │   │   ├── utils/           # 유틸리티 함수
│   │   │   └── types/           # TypeScript 타입
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Prisma 스키마
│   │   │   ├── migrations/      # 마이그레이션 파일
│   │   │   └── seed.ts          # 시드 데이터
│   │   └── tests/               # 테스트 파일
│   │
│   └── frontend/                # React App
│       ├── src/
│       │   ├── components/      # React 컴포넌트
│       │   ├── pages/           # 페이지 컴포넌트
│       │   ├── hooks/           # Custom Hooks
│       │   ├── services/        # API 클라이언트
│       │   ├── stores/          # Zustand 스토어
│       │   ├── utils/           # 유틸리티 함수
│       │   └── types/           # TypeScript 타입
│       └── public/              # 정적 파일
│
├── packages/
│   ├── shared/                  # 공통 타입 및 유틸
│   └── config/                  # 공통 설정
│
├── document/                    # 문서
│   ├── v1.0.0/                  # 이전 버전
│   └── v1.0.1/                  # 현재 버전 (이 문서)
│
├── docker-compose.yml           # Docker Compose 설정
├── package.json                 # 루트 패키지 설정
├── pnpm-workspace.yaml          # pnpm 워크스페이스
└── README.md                    # 프로젝트 README
```

---

## 개발 워크플로우

### 1. 새 기능 개발
```bash
# 브랜치 생성
git checkout -b feature/new-feature

# 개발 진행
# ...

# 커밋
git commit -m "feat: Add new feature"

# Push
git push origin feature/new-feature

# Pull Request 생성
```

### 2. 코드 품질 체크
```bash
# Lint 검사
pnpm lint

# 타입 체크
pnpm type-check

# 테스트 실행
pnpm test

# 전체 빌드
pnpm build
```

### 3. 데이터베이스 변경
```bash
# Prisma 스키마 수정
# prisma/schema.prisma 편집

# 마이그레이션 생성
pnpm prisma migrate dev --name <migration_name>

# Prisma Client 재생성
pnpm prisma generate
```

---

## API 사용 예시

### 1. 로그인
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fitlol.com",
    "password": "admin123"
  }'
```

### 2. 소환사 연동
```bash
curl -X POST http://localhost:3000/api/v1/summoner/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "summonerName": "Hide on bush",
    "region": "kr"
  }'
```

### 3. 개인 전력 카드 조회
```bash
curl -X GET http://localhost:3000/api/v1/analysis/player/<summonerId> \
  -H "Authorization: Bearer <access_token>"
```

---

## 핵심 지표 설명

### 레인전 지표
- **CS@10**: 10분 시점 CS (미니언 처치 수)
- **GD@10**: 10분 시점 골드 차이 (상대 라이너 대비)
- **XPD@10**: 10분 시점 경험치 차이
- **솔로킬율**: 라인전에서 솔로킬을 따낸 비율

### 전투 지표
- **KDA**: (킬 + 어시스트) / 데스
- **DPM**: 분당 챔피언 딜량
- **KP**: 킬 관여율 (%)
- **생존률**: 데스 0인 경기 비율

### 운영 지표
- **VSPM**: 분당 시야 점수
- **WPM**: 분당 와드 설치
- **WCPM**: 분당 와드 제거
- **오브젝트 관여**: 드래곤/전령/바론 참여율

### 종합 점수
```
Power Score = 0.35 × Lane + 0.35 × Fight + 0.2 × Macro + 0.1 × Form
```

---

## 배포

### Railway 배포 (권장)
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화
railway init

# 배포
railway up
```

### Docker 배포
```bash
# 이미지 빌드
docker build -t fitlol-backend -f apps/backend/Dockerfile .
docker build -t fitlol-frontend -f apps/frontend/Dockerfile .

# 컨테이너 실행
docker-compose up -d
```

---

## 모니터링

### 로그 확인
```bash
# Backend 로그
docker logs -f fitlol-backend

# Frontend 로그
docker logs -f fitlol-frontend

# PostgreSQL 로그
docker logs -f fitlol-postgres

# Redis 로그
docker logs -f fitlol-redis
```

### 성능 메트릭
- **Sentry**: 에러 추적 및 성능 모니터링
- **Prisma Studio**: 데이터베이스 GUI
- **RedisInsight**: Redis 모니터링

---

## 라이선스 및 정책

### Riot API 이용약관
- ✅ 개발자 API 키 사용
- ✅ 비상업적 목적 (클랜 내부 사용)
- ✅ Rate Limiting 준수
- ✅ 데이터 출처 명시 필요

### 개인정보 보호
- 클랜원만 접근 가능 (비공개 서비스)
- 소환사명 외 개인정보 수집 안 함
- 데이터 삭제 요청 처리 가능
- 비활성 클랜원 데이터 90일 후 자동 삭제

---

## 기여 가이드

### 버그 리포트
GitHub Issues에 다음 정보를 포함하여 등록:
- 버그 설명
- 재현 단계
- 예상 동작 vs 실제 동작
- 환경 정보 (OS, Node.js 버전 등)

### 기능 제안
GitHub Discussions에 제안:
- 기능 설명
- 사용 사례
- 예상 효과

### Pull Request
1. Fork 후 브랜치 생성
2. 코드 작성 및 테스트
3. Commit Convention 준수
4. PR 생성 및 설명 작성

---

## 문의 및 지원

- **GitHub Issues**: 버그 리포트 및 기능 제안
- **GitHub Discussions**: 질문 및 토론
- **Email**: dev@fitlol.com (예시)

---

## 변경 이력

### v1.0.1 (2025-10-01)
- ✅ 프로젝트 범위 명확화 (피트니스 관련 내용 제거)
- ✅ Phase 1 아키텍처 간소화 (모놀리식 구조)
- ✅ 데이터베이스 스키마 상세 설계
- ✅ API 명세서 작성
- ✅ Riot API 통합 가이드 작성
- ✅ 개발 환경 설정 가이드 작성
- ✅ Rate Limiting 전략 구체화
- ✅ 캐싱 전략 명확화

### v1.0.0 (2025-09-30)
- 초기 아키텍처 문서 작성
- 기본 시나리오 정의

---

## 다음 단계

1. ✅ 문서 작성 완료
2. ⬜ 프로젝트 초기 설정 (Monorepo, TypeScript, ESLint)
3. ⬜ Backend 기본 구조 구현
4. ⬜ 데이터베이스 마이그레이션
5. ⬜ Riot API 클라이언트 구현
6. ⬜ 인증 시스템 구현
7. ⬜ Frontend 기본 레이아웃 구현

---

**FIT.LOL - 데이터 기반 클랜 전력 분석 도구 🎮📊**
