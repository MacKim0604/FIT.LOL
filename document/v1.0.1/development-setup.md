# FIT.LOL Development Setup Guide v1.0.1

## 개요
로컬 개발 환경 설정 가이드입니다. 프로젝트를 클론하고 실행하는 모든 단계를 포함합니다.

---

## 시스템 요구사항

### 필수 소프트웨어
- **Node.js**: 20.x 이상
- **pnpm**: 8.x 이상 (권장) 또는 npm
- **PostgreSQL**: 14.x 이상
- **Redis**: 7.x 이상
- **Git**: 최신 버전

### 권장 개발 도구
- **VS Code**: 코드 에디터
- **Postman** 또는 **Insomnia**: API 테스트
- **TablePlus** 또는 **DBeaver**: 데이터베이스 GUI
- **RedisInsight**: Redis GUI

---

## 1. 프로젝트 클론

```bash
# 저장소 클론
git clone https://github.com/your-org/FIT.LOL.git
cd FIT.LOL

# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install
```

---

## 2. 데이터베이스 설정

### PostgreSQL 설치 및 실행

#### macOS (Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Docker (권장)
```bash
docker run --name fitlol-postgres \
  -e POSTGRES_USER=fitlol \
  -e POSTGRES_PASSWORD=fitlol123 \
  -e POSTGRES_DB=fitlol \
  -p 5432:5432 \
  -d postgres:14-alpine
```

### 데이터베이스 생성
```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE fitlol;
CREATE USER fitlol WITH PASSWORD 'fitlol123';
GRANT ALL PRIVILEGES ON DATABASE fitlol TO fitlol;

# 종료
\q
```

---

## 3. Redis 설정

### Redis 설치 및 실행

#### macOS (Homebrew)
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Docker (권장)
```bash
docker run --name fitlol-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### Redis 연결 테스트
```bash
redis-cli ping
# 응답: PONG
```

---

## 4. 환경 변수 설정

### Backend 환경 변수
```bash
# apps/backend/.env 파일 생성
cp apps/backend/.env.example apps/backend/.env
```

**apps/backend/.env:**
```env
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://fitlol:fitlol123@localhost:5432/fitlol?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Riot API
RIOT_API_KEY=RGAPI-your-api-key-here
RIOT_API_REGION=kr

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend 환경 변수
```bash
# apps/frontend/.env 파일 생성
cp apps/frontend/.env.example apps/frontend/.env
```

**apps/frontend/.env:**
```env
# API
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000

# Environment
VITE_ENV=development
```

---

## 5. Riot API 키 발급

### Development API Key 발급
1. [Riot Developer Portal](https://developer.riotgames.com/) 접속
2. Riot 계정으로 로그인
3. "DEVELOPMENT API KEY" 섹션에서 키 발급
4. 발급된 키를 `apps/backend/.env`의 `RIOT_API_KEY`에 입력

**주의:**
- Development Key는 24시간 유효
- 매일 갱신 필요
- Rate Limit: 20 requests/sec, 100 requests/2min

### Production API Key 신청 (선택)
1. Developer Portal에서 "REGISTER PRODUCT" 클릭
2. 프로젝트 정보 입력
3. 승인 대기 (보통 1-2주 소요)

---

## 6. 데이터베이스 마이그레이션

### Prisma 설정
```bash
cd apps/backend

# Prisma Client 생성
pnpm prisma generate

# 마이그레이션 실행
pnpm prisma migrate dev --name init

# Prisma Studio 실행 (데이터베이스 GUI)
pnpm prisma studio
# http://localhost:5555 에서 접속 가능
```

### 시드 데이터 삽입
```bash
# 기본 관리자 계정 생성
pnpm prisma db seed
```

**기본 관리자 계정:**
- Email: `admin@fitlol.com`
- Password: `admin123`
- Role: `LEADER`

---

## 7. 프로젝트 실행

### Monorepo 구조
```
FIT.LOL/
├── apps/
│   ├── backend/          # Express.js API
│   └── frontend/         # React App
├── packages/
│   ├── shared/           # 공통 타입 및 유틸
│   └── config/           # 공통 설정
├── document/             # 문서
└── package.json
```

### 전체 프로젝트 실행 (권장)
```bash
# 루트 디렉토리에서
pnpm dev

# 또는 개별 실행
pnpm dev:backend   # Backend만 실행
pnpm dev:frontend  # Frontend만 실행
```

### Backend 개별 실행
```bash
cd apps/backend
pnpm dev

# 실행 확인
curl http://localhost:3000/api/v1/health
```

### Frontend 개별 실행
```bash
cd apps/frontend
pnpm dev

# 브라우저에서 http://localhost:5173 접속
```

---

## 8. 개발 도구 설정

### VS Code 확장 프로그램
```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### VS Code 설정
```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

### ESLint 설정
```json
// .eslintrc.json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### Prettier 설정
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## 9. 테스트 실행

### Backend 테스트
```bash
cd apps/backend

# 단위 테스트
pnpm test

# 통합 테스트
pnpm test:e2e

# 테스트 커버리지
pnpm test:cov
```

### Frontend 테스트
```bash
cd apps/frontend

# 단위 테스트
pnpm test

# UI 테스트 (Vitest UI)
pnpm test:ui
```

---

## 10. Docker로 전체 환경 실행 (선택)

### Docker Compose 설정
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: fitlol-postgres
    environment:
      POSTGRES_USER: fitlol
      POSTGRES_PASSWORD: fitlol123
      POSTGRES_DB: fitlol
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: fitlol-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    container_name: fitlol-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://fitlol:fitlol123@postgres:5432/fitlol
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/backend:/app/apps/backend
      - /app/node_modules

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    container_name: fitlol-frontend
    environment:
      VITE_API_BASE_URL: http://localhost:3000/api/v1
    ports:
      - '5173:5173'
    volumes:
      - ./apps/frontend:/app/apps/frontend
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

### Docker 실행
```bash
# 전체 서비스 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down

# 볼륨 포함 완전 삭제
docker-compose down -v
```

---

## 11. 일반적인 문제 해결

### PostgreSQL 연결 실패
```bash
# PostgreSQL 실행 확인
pg_isready -h localhost -p 5432

# 연결 테스트
psql -h localhost -U fitlol -d fitlol

# Docker 컨테이너 로그 확인
docker logs fitlol-postgres
```

### Redis 연결 실패
```bash
# Redis 실행 확인
redis-cli ping

# Docker 컨테이너 로그 확인
docker logs fitlol-redis
```

### Prisma 마이그레이션 오류
```bash
# 마이그레이션 리셋 (주의: 데이터 삭제)
pnpm prisma migrate reset

# Prisma Client 재생성
pnpm prisma generate

# 데이터베이스 스키마 확인
pnpm prisma db pull
```

### Port 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# 프로세스 종료
kill -9 <PID>
```

### Riot API 429 에러 (Rate Limit)
- Development Key의 Rate Limit 확인
- 너무 많은 요청을 빠르게 보내지 않도록 주의
- Rate Limiter가 제대로 작동하는지 확인

### 의존성 설치 오류
```bash
# 캐시 삭제 후 재설치
pnpm store prune
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## 12. 유용한 명령어

### 데이터베이스
```bash
# Prisma Studio 실행
pnpm prisma studio

# 마이그레이션 생성
pnpm prisma migrate dev --name <migration_name>

# 마이그레이션 배포
pnpm prisma migrate deploy

# 데이터베이스 리셋
pnpm prisma migrate reset

# 스키마 포맷팅
pnpm prisma format
```

### 코드 품질
```bash
# Lint 검사
pnpm lint

# Lint 자동 수정
pnpm lint:fix

# 타입 체크
pnpm type-check

# 포맷팅
pnpm format
```

### 빌드
```bash
# Backend 빌드
cd apps/backend
pnpm build

# Frontend 빌드
cd apps/frontend
pnpm build

# 전체 빌드
pnpm build
```

---

## 13. Git Workflow

### 브랜치 전략
```
main          # 프로덕션 브랜치
├── develop   # 개발 브랜치
    ├── feature/xxx  # 기능 개발
    ├── fix/xxx      # 버그 수정
    └── refactor/xxx # 리팩토링
```

### Commit Convention
```bash
# 타입
feat: 새로운 기능
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드/설정 변경

# 예시
git commit -m "feat: Add summoner sync service"
git commit -m "fix: Fix rate limiter bug"
git commit -m "docs: Update API documentation"
```

### Pre-commit Hook (Husky)
```bash
# Husky 설치
pnpm add -D husky lint-staged

# Husky 초기화
pnpm husky install

# Pre-commit hook 추가
pnpm husky add .husky/pre-commit "pnpm lint-staged"
```

**package.json:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

## 14. 다음 단계

1. ✅ 개발 환경 설정 완료
2. ⬜ 첫 번째 API 엔드포인트 구현
3. ⬜ Riot API 연동 테스트
4. ⬜ Frontend 기본 레이아웃 구현
5. ⬜ 인증 시스템 구현

---

## 15. 참고 자료

### 공식 문서
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)

### 튜토리얼
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Redis Tutorial](https://redis.io/docs/getting-started/)

### 커뮤니티
- [Riot API Discord](https://discord.gg/riotgamesdevrel)
- [Stack Overflow](https://stackoverflow.com/)

---

## 문의 및 지원

문제가 발생하거나 질문이 있으면:
1. GitHub Issues에 등록
2. 팀 Slack 채널에 문의
3. 문서를 먼저 확인

**Happy Coding! 🚀**
