# FIT.LOL API Specification v1.0.2 (Keycloak OIDC)

## 개요
v1.0.2에서는 인증 방식을 Keycloak OIDC로 전환했습니다. 모든 보호된 엔드포인트는 Keycloak이 발급한 Access Token(JWT)을 사용합니다.

---

## Base URL
```
Development: http://localhost:3000/api/v1
Production:  https://api.fitlol.com/api/v1
```

---

## 인증 (Authentication)

### OpenID Connect (Keycloak)
- Discovery: `${ISSUER}/.well-known/openid-configuration`
- Issuer 예시: `http://localhost:8080/realms/fitlol`
- Scopes: `openid profile email` (기본)
- 토큰 서명: RS256 (JWKS로 검증)

### 요청 헤더
```http
Authorization: Bearer <access_token>
```

### 권한 (RBAC)
- Realm Roles: `LEADER`, `MEMBER`
- 기본 판별 경로: `realm_access.roles`
- 일부 엔드포인트는 `LEADER` 필요

### 변경 사항 요약
- 제거됨: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` (Keycloak 사용)
- 추가: `GET /auth/me` (토큰 기반 사용자 정보 조회)

---

## 공통 응답 형식
성공/에러 응답 구조는 v1.0.1과 동일합니다.

---

## 1. 인증 (Auth)

### 1.1 내 정보 조회
```http
GET /auth/me
```
**Headers:**
```
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",        
    "email": "user@example.com",
    "username": "username",
    "roles": ["MEMBER"],      
    "oidcSub": "<keycloak-sub>"
  }
}
```
설명:
- 서버는 액세스 토큰의 `sub`(= `oidcSub`)로 사용자 레코드를 조회/자동 생성(최초 로그인 시) 후 반환합니다.

---

## 2. 클랜 관리 (Clan)

### 권한 요건
- `GET /clan/members`: `MEMBER` 이상
- `POST /clan/members`: `LEADER`
- `DELETE /clan/members/:userId`: `LEADER`

나머지 요청/응답 형식은 v1.0.1과 동일합니다.

---

## 3. 소환사 (Summoner)
- 모든 엔드포인트: `MEMBER` 이상
- 요청/응답 형식은 v1.0.1과 동일합니다.

---

## 4. 분석 (Analysis)
- 모든 엔드포인트: `MEMBER` 이상
- 요청/응답 형식은 v1.0.1과 동일합니다.

---

## 5. 대시보드 (Dashboard)
- 모든 엔드포인트: `MEMBER` 이상
- 요청/응답 형식은 v1.0.1과 동일합니다.

---

## 6. 관리자 (Admin)
- 모든 엔드포인트: `LEADER` 필요
- 요청/응답 형식은 v1.0.1과 동일합니다.

---

## 에러 코드 (추가/변경)
```ts
enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED', // 액세스 토큰 누락/검증 실패
  FORBIDDEN = 'FORBIDDEN',       // 역할 부족
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  RIOT_API_ERROR = 'RIOT_API_ERROR',
  RIOT_RATE_LIMIT = 'RIOT_RATE_LIMIT',

  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

---

## 보안 모범 사례
- `iss` 일치 및 RS256 서명 검증 필수
- (선택) `aud` 검증: `fitlol-backend`
- 최소 권한 원칙: 엔드포인트별 `LEADER`/`MEMBER` 가드 적용
- 토큰 만료/갱신은 프론트의 OIDC 클라이언트가 처리(새 토큰 갱신)

---

## Rate Limiting / Pagination / Filtering / WebSocket
- 해당 섹션은 v1.0.1과 동일하며, 인증 방식만 Keycloak 토큰으로 변경되었습니다.

---

## 다음 단계
1. ✅ v1.0.2 API 인증/권한 명세 확정
2. ⬜ Backend 미들웨어 구현(`authenticate`, `requireRole`)
3. ⬜ Swagger UI에서 OpenID Connect 보안 스키마 선언
