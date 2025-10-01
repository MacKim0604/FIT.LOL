# FIT.LOL Development Setup Guide v1.0.2 (Keycloak)

## 개요
로컬 개발 환경 설정 가이드입니다. v1.0.2에서는 IAM을 Keycloak(OIDC)으로 전환했습니다.

---

## 시스템 요구사항

### 필수 소프트웨어
- Node.js: 20.x 이상
- pnpm: 8.x 이상 (권장) 또는 npm
- PostgreSQL: 14.x 이상
- Redis: 7.x 이상
- Docker & Docker Compose
- Git: 최신 버전
- Keycloak: Docker로 실행 (아래 Compose 포함)

### 권장 개발 도구
- VS Code
- Postman/Insomnia
- TablePlus/DBeaver
- RedisInsight

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
(내용은 v1.0.1과 동일) — PostgreSQL 설치/실행, DB 생성 등.

---

## 3. Redis 설정
(내용은 v1.0.1과 동일)

---

## 4. Keycloak (IAM) 설정

### 4.1 Docker Compose로 실행
`docker-compose.yml`에 Keycloak 서비스를 추가합니다.
```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0.5
    container_name: fitlol-keycloak
    command: ["start-dev"]
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    volumes:
      - keycloak_data:/opt/keycloak/data

volumes:
  keycloak_data:
```

### 4.2 Realm/Client/Role 설정
- 콘솔: `http://localhost:8080` → Admin 로그인 (`admin` / `admin`)
- Realm: `fitlol`
- Roles: `LEADER`, `MEMBER`
- Client (Frontend): `fitlol-frontend` (Public, Auth Code + PKCE, Redirect `http://localhost:5173/*`)
- Client (Backend, 선택): `fitlol-backend` (Bearer-only 또는 Confidential)
- Audience(선택): `fitlol-frontend`에 Audience Mapper로 `fitlol-backend` 포함

자세한 절차는 `document/v1.0.2/iam-keycloak.md` 참조.

---

## 5. 환경 변수 설정

### Backend 환경 변수
```bash
# apps/backend/.env 파일 생성
cp apps/backend/.env.example apps/backend/.env
```

**apps/backend/.env (예시):**
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

# OIDC / Keycloak
OIDC_ISSUER_URL=http://localhost:8080/realms/fitlol
OIDC_JWKS_URI=http://localhost:8080/realms/fitlol/protocol/openid-connect/certs
# aud를 검증하지 않을 경우 주석 처리
# OIDC_AUDIENCE=fitlol-backend
OIDC_ROLE_PATH=realm_access.roles

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

> v1.0.1에서 사용하던 `JWT_SECRET`, `JWT_*`는 제거되었습니다.

### Frontend 환경 변수
```bash
# apps/frontend/.env 파일 생성
cp apps/frontend/.env.example apps/frontend/.env
```

**apps/frontend/.env (예시):**
```env
# API
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000

# OIDC / Keycloak
VITE_OIDC_ISSUER_URL=http://localhost:8080/realms/fitlol
VITE_OIDC_CLIENT_ID=fitlol-frontend
VITE_OIDC_REDIRECT_URI=http://localhost:5173/callback
VITE_OIDC_LOGOUT_REDIRECT_URI=http://localhost:5173
VITE_OIDC_SCOPES=openid profile email

# Environment
VITE_ENV=development
```

---

## 6. Riot API 키 발급
(내용은 v1.0.1과 동일)

---

## 7. 데이터베이스 마이그레이션
(Prisma 설정 및 마이그레이션은 동일) — 변경점은 `User` 스키마(비밀번호 제거, `oidcSub` 추가) 관련. 자세한 스키마는 `document/v1.0.2/database-schema.md` 참고.

---

## 8. 프로젝트 실행
- 루트에서 `pnpm dev` (또는 `pnpm dev:backend`, `pnpm dev:frontend`)
- Backend Health Check: `GET /api/v1/health`

---

## 9. 테스트 실행
(내용은 v1.0.1과 동일)

---

## 10. Docker로 전체 환경 실행 (선택)

### docker-compose.yml 예시 (발췌)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
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
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  keycloak:
    image: quay.io/keycloak/keycloak:24.0.5
    command: ["start-dev"]
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - '8080:8080'
    volumes:
      - keycloak_data:/opt/keycloak/data

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://fitlol:fitlol123@postgres:5432/fitlol
      REDIS_HOST: redis
      REDIS_PORT: 6379
      OIDC_ISSUER_URL: http://keycloak:8080/realms/fitlol
      OIDC_JWKS_URI: http://keycloak:8080/realms/fitlol/protocol/openid-connect/certs
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - redis
      - keycloak

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    environment:
      VITE_API_BASE_URL: http://localhost:3000/api/v1
      VITE_OIDC_ISSUER_URL: http://localhost:8080/realms/fitlol
      VITE_OIDC_CLIENT_ID: fitlol-frontend
      VITE_OIDC_REDIRECT_URI: http://localhost:5173/callback
      VITE_OIDC_LOGOUT_REDIRECT_URI: http://localhost:5173
    ports:
      - '5173:5173'

volumes:
  postgres_data:
  redis_data:
  keycloak_data:
```

---

## 11. 문제 해결 (IAM 관련)
- 401 Unauthorized: 토큰 만료/서명 검증 실패/iss 불일치
- 403 Forbidden: 역할 부족(LEADER 필요)
- 로그인 루프: Redirect URI/PKCE/Session 설정 확인
- CORS 오류: Keycloak Client의 Web Origins/Redirect URIs 확인

---

## 12. 다음 단계
1. ✅ 개발 환경(Keycloak 포함) 설정
2. ⬜ Backend 토큰 검증 미들웨어 연결
3. ⬜ 엔드포인트별 역할 가드(requireRole) 적용
4. ⬜ Frontend OIDC 로그인/로그아웃 버튼 연결
