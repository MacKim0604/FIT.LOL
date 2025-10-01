# FIT.LOL Keycloak IAM Guide v1.0.2

## 개요
v1.0.2부터 FIT.LOL은 자체 JWT 발급을 중단하고, Keycloak 기반 OpenID Connect(OIDC)로 인증/권한을 처리합니다. 이 문서는 로컬 개발 환경에서 Keycloak을 설치하고, Realm/Client/Role을 설정한 뒤, Backend/Frontend 연동 방법을 설명합니다.

---

## 1. Keycloak 실행 (Docker)

### Docker Compose 예시
`docker-compose.yml`에 다음 서비스를 추가합니다.
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

### 콘솔 접속
- URL: `http://localhost:8080`
- Admin Console 로그인: `admin` / `admin`

---

## 2. Realm/Client/Role 설정

### 2.1 Realm 생성
- 이름: `fitlol`

### 2.2 Realm Roles 생성
- `LEADER`
- `MEMBER`

역할 의미:
- `LEADER`: 클랜원 추가/삭제, 관리자 API 접근
- `MEMBER`: 읽기 권한 중심(자신의 데이터 + 클랜 통계)

### 2.3 Client 생성

1) Frontend Client
- Client ID: `fitlol-frontend`
- Type: Public
- Standard Flow(Authorization Code) 활성화
- PKCE 사용: S256 요구
- Redirect URIs: `http://localhost:5173/*`
- Web Origins: `http://localhost:5173`
- Direct Access Grants: 비활성화

2) Backend Client (선택)
- Client ID: `fitlol-backend`
- Type: Bearer-only (or Confidential)
- Redirect URI 불필요
- 목적: 토큰 `aud`에 `fitlol-backend`를 포함시키고자 할 때 사용

3) Audience/Scope 설정 (선택)
- `fitlol-frontend` → Client Scopes에 Audience Mapper 추가
- 포함 대상: `fitlol-backend`
- 효과: 발급된 토큰의 `aud`에 `fitlol-backend` 포함

### 2.4 사용자 생성/할당
- 예) 사용자: `admin@fitlol.com`
- 임시 비밀번호 설정, 이메일(선택)
- Realm Role로 `LEADER` 할당

---

## 3. 토큰 클레임 및 역할 매핑

### 3.1 대표 클레임
- `sub`: 사용자 고유 식별자 (DB의 `User.oidcSub`와 매핑)
- `preferred_username`, `email`
- `realm_access.roles`: Realm 역할 배열 (예: `["LEADER", "MEMBER"]`)
- `resource_access[clientId].roles`: 클라이언트 역할 배열
- `iss`: Issuer (예: `http://localhost:8080/realms/fitlol`)
- `aud`: Audience (옵션, 위 2.3 참고)

### 3.2 권한 판별 규칙
- 기본: `realm_access.roles`에 `LEADER` 또는 `MEMBER` 포함 여부로 판별
- 대체: `resource_access[fitlol-backend].roles` 활용 가능

---

## 4. Backend 연동 가이드 (개요)

### 4.1 환경 변수 (.env)
```env
# OIDC / Keycloak
OIDC_ISSUER_URL=http://localhost:8080/realms/fitlol
# OIDC_JWKS_URI를 생략하면 .well-known으로 자동 추적하는 구현을 권장
OIDC_JWKS_URI=http://localhost:8080/realms/fitlol/protocol/openid-connect/certs
# 선택: aud 검증이 필요한 경우에만 설정
OIDC_AUDIENCE=fitlol-backend
# 역할 클레임 경로 (기본 제안)
OIDC_ROLE_PATH=realm_access.roles
```

### 4.2 토큰 검증 개요
- `Authorization: Bearer <access_token>` 헤더 수신
- `iss`가 `OIDC_ISSUER_URL`과 일치
- JWKS로 서명 키 확인(JWK kid 매칭 → RS256 검증)
- `exp`/`nbf` 체크
- (선택) `aud`가 `OIDC_AUDIENCE`와 일치
- 역할 클레임에서 `LEADER`/`MEMBER` 여부 확인

### 4.3 Express 미들웨어 예시 (의사코드)
```ts
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const client = jwksClient({ jwksUri: process.env.OIDC_JWKS_URI! });

function getKey(header, cb) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return cb(err);
    const signingKey = key.getPublicKey();
    cb(null, signingKey);
  });
}

export function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' }});

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ['RS256'],
      issuer: process.env.OIDC_ISSUER_URL,
      audience: process.env.OIDC_AUDIENCE, // 옵션
    },
    (err, payload) => {
      if (err) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' }});
      (req as any).user = payload; // sub, email, roles 등 접근
      next();
    }
  );
}

export function requireRole(role: 'LEADER' | 'MEMBER') {
  return (req, res, next) => {
    const user = (req as any).user;
    const roles = user?.realm_access?.roles || [];
    if (!roles.includes(role)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN' }});
    next();
  }
}
```

---

## 5. Frontend 연동 가이드 (개요)

### 5.1 환경 변수 (.env)
```env
VITE_OIDC_ISSUER_URL=http://localhost:8080/realms/fitlol
VITE_OIDC_CLIENT_ID=fitlol-frontend
VITE_OIDC_REDIRECT_URI=http://localhost:5173/callback
VITE_OIDC_LOGOUT_REDIRECT_URI=http://localhost:5173
VITE_OIDC_SCOPES=openid profile email
```

### 5.2 라이브러리 선택지
- `keycloak-js` (공식 어댑터) — 가장 단순
- `oidc-client-ts` — 범용 OIDC 클라이언트

### 5.3 keycloak-js 초기화 예시
```ts
import Keycloak from 'keycloak-js';

const kc = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'fitlol',
  clientId: 'fitlol-frontend',
});

await kc.init({ onLoad: 'login-required', pkceMethod: 'S256' });

// API 호출 시
fetch(`${import.meta.env.VITE_API_BASE_URL}/clan/members`, {
  headers: { Authorization: `Bearer ${kc.token}` },
});
```

### 5.4 로그아웃
- 프런트에서 `kc.logout({ redirectUri: VITE_OIDC_LOGOUT_REDIRECT_URI })` 호출

---

## 6. 엔드포인트 권한 기준 (요약)
- `POST /clan/members`, `DELETE /clan/members/:id`, `GET /admin/*` → `LEADER` 필요
- `GET /clan/members`, `GET /summoner/*`, `GET /analysis/*`, `GET /dashboard/*` → `MEMBER` 이상
- `GET /auth/me` → 로그인 필요(역할 무관)

---

## 7. 마이그레이션/데이터 정책
- 기존 `User.password` 필드 제거 (Keycloak로 일원화)
- 사용자 식별은 `oidcSub`(Keycloak `sub`) 기준
- 최초 로그인 시 `sub`가 존재하지 않으면 사용자 레코드 자동 생성(프로비저닝)

---

## 8. 트러블슈팅
- 401: `iss` 불일치, 만료, 서명 검증 실패
- 403: 역할 부족(`LEADER` 필요 엔드포인트)
- `aud` 검증 실패: Audience Mapper 설정 또는 `OIDC_AUDIENCE` 미사용
- CORS: Keycloak Client의 Web Origins/Redirect URIs 확인

---

## 9. 참고
- OpenID Connect Discovery: `${ISSUER}/.well-known/openid-configuration`
- JWKS: `${ISSUER}/protocol/openid-connect/certs`
- Keycloak Docs: https://www.keycloak.org/documentation
