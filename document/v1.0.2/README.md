# FIT.LOL v1.0.2 Documentation

## 프로젝트 개요
**FIT.LOL**은 리그 오브 레전드 클랜 내부 전력 분석 도구입니다. Riot Games API를 활용하여 클랜원들의 게임 데이터를 수집·분석하고, 개인 전력 평가, 팀 시너지 분석, 밴픽 추천 등의 인사이트를 제공합니다.

---

## v1.0.2 주요 변경사항 (IAM = Keycloak)
- **인증/권한을 Keycloak(OpenID Connect) 기반으로 전환**
  - 이메일/비밀번호 + 커스텀 JWT 제거 → Keycloak 발급 토큰(Bearer) 검증
  - 프론트: Authorization Code Flow(PKCE) 사용
  - 백엔드: Resource Server 패턴(JWKS로 토큰 검증)
- **API 명세 변경**
  - `/auth/register`, `/auth/login`, `/auth/refresh` 제거 (Keycloak 사용)
  - 사용자 정보 조회 엔드포인트 `GET /auth/me` 추가
- **DB 스키마 변경**
  - `User.password` 제거
  - `User.oidcSub`(Keycloak `sub`) 및 `provider` 필드 추가
- **개발환경/배포 변경**
  - Docker Compose에 `keycloak` 서비스 추가
  - Backend/Frontend `.env`에 OIDC 설정 추가 (ISSUER_URL, CLIENT_ID 등)
- **신규 문서 추가**
  - `iam-keycloak.md`: Keycloak 설치, Realm/Client/Role 설정, 토큰 클레임, 연동 가이드

---

## 문서 구조
1. [`architecture.md`](./architecture.md) — 시스템 아키텍처(보안: Keycloak OIDC 반영)
2. [`database-schema.md`](./database-schema.md) — Prisma 스키마(비밀번호 제거, OIDC 필드 추가)
3. [`api-specification.md`](./api-specification.md) — API 명세(Keycloak 기반 인증으로 수정)
4. [`riot-api-integration.md`](./riot-api-integration.md) — Riot API 통합 가이드
5. [`development-setup.md`](./development-setup.md) — 로컬 개발 환경(Compose에 Keycloak 추가)
6. [`iam-keycloak.md`](./iam-keycloak.md) — Keycloak 설정 및 연동 가이드

---

## 빠른 시작 (요약)
1. 저장소 클론 및 의존성 설치
2. Docker로 PostgreSQL, Redis, Keycloak 실행
3. Keycloak에서 Realm/Client/Role/User 초기 설정 → `iam-keycloak.md` 참고
4. Backend/Frontend `.env`에 OIDC 설정 작성
5. 마이그레이션 실행 후 앱 구동

자세한 단계는 `development-setup.md`를 확인하세요.

---

## 변경 이력
- **v1.0.2 (2025-10-01)**
  - IAM을 Keycloak OIDC로 전환
  - API/Auth 섹션 수정 및 `/auth/me` 추가
  - DB 스키마에서 비밀번호 제거, OIDC 식별자 추가
  - 개발 환경(Docker Compose) Keycloak 포함
  - `iam-keycloak.md` 신규 추가
- v1.0.1 (2025-10-01)
  - 초기 문서 세트 완성, JWT 기반 인증 명세 등

---

## 다음 단계
1. ✅ 문서 업데이트(v1.0.2)
2. ⬜ Backend에 OIDC 토큰 검증 미들웨어 추가(JWKS)
3. ⬜ Role 기반 권한 미들웨어(`LEADER`, `MEMBER`) 구현
4. ⬜ Frontend OIDC 로그인/로그아웃 플로우 연결
5. ⬜ e2e 테스트로 IAM 통합 검증

---

## 문의
- GitHub Issues / Discussions
- 팀 Slack 채널
