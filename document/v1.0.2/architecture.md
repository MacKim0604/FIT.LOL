# FIT.LOL v1.0.2 Architecture Document (with Keycloak)

## 개요
FIT.LOL은 리그 오브 레전드 클랜 내부 전력 분석 도구입니다. v1.0.2부터 인증/권한이 Keycloak 기반 OpenID Connect(OIDC)로 전환되었습니다.

---

## Phase 1 아키텍처 (업데이트)
```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React, TS)                         │
│  - OIDC 로그인 (Keycloak JS)                                         │
│  - Bearer 토큰으로 API 호출                                          │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ REST API (Authorization: Bearer)
┌───────────────────────────────┴──────────────────────────────────────┐
│                       Backend API (Express.js, TS)                   │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ Auth & RBAC         │  │ RiotAPIService   │  │ AnalysisService  │ │
│  │ - OIDC 토큰 검증     │  │ - 데이터 수집     │  │ - 통계/지표 계산  │ │
│  │ - 역할 가드(LEADER)  │  │ - Rate Limiting  │  │                  │ │
│  └─────────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                     │
│  Queue (Bull + Redis)                                               │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
┌───────────────────────────────┴──────────────────────────────────────┐
│                           Data Layer                                 │
│  PostgreSQL (Prisma)  |  Redis (Cache/Queue)                         │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                 ┌──────────────┴───────────────┐
                 │            IAM               │
                 │        Keycloak (OIDC)       │
                 │  - Realm/Client/Roles        │
                 │  - JWKS (RS256)              │
                 └───────────────────────────────┘
```

---

## 핵심 컴포넌트 변경

- **Auth & RBAC (`apps/backend`)**
  - `authenticate` 미들웨어: `Authorization: Bearer` 토큰을 JWKS로 검증, `iss`/`exp`/(선택 `aud`) 확인
  - `requireRole('LEADER' | 'MEMBER')`: 토큰의 `realm_access.roles` 기준으로 접근 제어
  - `GET /auth/me`: 토큰의 `sub`로 사용자 조회/자동 생성(최초 로그인 시)

- **UserService**
  - 비밀번호 폐지. DB에는 `oidcSub`(Keycloak `sub`)로 사용자 식별
  - `User.role`은 Keycloak Realm Role을 미러링(소스 오브 트루스는 Keycloak)
  - 최초 로그인 시 자동 프로비저닝: `oidcSub`, `email`, `preferred_username` 저장

- **Frontend**
  - `keycloak-js`로 Authorization Code Flow(PKCE) 수행
  - API 호출 시 `Authorization: Bearer <token>` 헤더 부착

- **DevOps**
  - `docker-compose.yml`에 `keycloak` 서비스 추가
  - Backend/Frontend 컨테이너에 OIDC 환경 변수 주입 (`OIDC_ISSUER_URL`, `OIDC_JWKS_URI`, 등)

---

## 보안
- RS256 서명 + JWKS 키 회전 대응
- `iss` 필수 일치, (옵션) `aud` 검증으로 수신 대상 제한
- 최소 권한 원칙: 관리자 엔드포인트는 `LEADER`만 허용
- 로컬 비밀번호 저장 금지 (Keycloak 단일 신뢰 소스)

---

## API 개요 (발췌)
```
/api/v1
  /auth
    GET    /me                  # 토큰 기반 사용자 정보
  /clan
    GET    /members             # MEMBER 이상
    POST   /members             # LEADER
    DELETE /members/:id         # LEADER
  /summoner ...                 # MEMBER 이상
  /analysis ...                 # MEMBER 이상
  /admin ...                    # LEADER
```

---

## 데이터 흐름 (로그인)
1) Frontend에서 Keycloak 로그인(PKCE) → Access Token 획득
2) Frontend가 토큰을 첨부해 Backend API 호출
3) Backend `authenticate`가 토큰 검증 → `req.user` 설정
4) `requireRole` 미들웨어로 역할 체크
5) 필요 시 `oidcSub`로 사용자 자동 생성/동기화

---

## 다음 단계
- Backend: JWT 검증 미들웨어 및 역할 가드 구현/연결
- Swagger: OpenID Connect 보안 스키마 선언
- e2e: 로그인 → 보호 엔드포인트 접근 테스트
