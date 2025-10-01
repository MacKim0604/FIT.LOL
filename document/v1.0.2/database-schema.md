# FIT.LOL Database Schema v1.0.2 (OIDC)

## 개요
v1.0.2에서는 사용자 인증을 Keycloak로 이관하여 비밀번호 컬럼을 제거하고 OIDC 식별자 필드를 추가했습니다.

---

## ERD (변경점 반영)
```
┌─────────────┐        ┌───────────────────┐
│    users    │ 1    N │     summoners     │
└──────┬──────┘        └─────────┬─────────┘
       │                          │
   + oidc_sub (unique)            │
   + provider ('keycloak')        │
   - password (removed)           │
```

나머지 테이블 구조는 v1.0.1과 동일합니다.

---

## Prisma Schema (발췌)
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  username  String    @unique
  // password 제거
  role      UserRole  @default(MEMBER) // Keycloak Realm Role을 미러링 (소스: 토큰)

  // OIDC 식별자
  oidcSub   String    @unique          // Keycloak `sub`
  provider  String    @default("keycloak")

  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  summoners Summoner[]

  @@map("users")
}

enum UserRole {
  LEADER
  MEMBER
}

// 이하 Summoner, RankedStat, Match, MatchParticipant, ChampionStat, AnalysisResult, TeamSynergy, JobLog 등은 v1.0.1과 동일
```

---

## 마이그레이션 가이드

### SQL (예시)
```sql
-- 비밀번호 제거, OIDC 컬럼 추가
ALTER TABLE users DROP COLUMN IF EXISTS password;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oidc_sub TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'keycloak';

-- 빈 값 방지: 이미 Keycloak로만 로그인하는 환경이라면 NOT NULL 제약 적용
UPDATE users SET oidc_sub = COALESCE(oidc_sub, CONCAT('legacy-', id)) WHERE oidc_sub IS NULL;
ALTER TABLE users ALTER COLUMN oidc_sub SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_oidc_sub_key ON users(oidc_sub);
```

### Prisma (예시)
```bash
pnpm prisma migrate dev --name keycloak_oidc_migration
pnpm prisma generate
```

---

## 사용자 자동 프로비저닝 (개요 코드)
```ts
// 토큰 검증 후 (req.user.sub, email, preferred_username)
const sub = token.sub as string;
let user = await prisma.user.findUnique({ where: { oidcSub: sub } });
if (!user) {
  user = await prisma.user.create({
    data: {
      oidcSub: sub,
      provider: 'keycloak',
      email: token.email ?? `${sub}@placeholder.local`,
      username: token.preferred_username ?? `user_${sub.slice(0,8)}`,
      role: (token.realm_access?.roles?.includes('LEADER') ? 'LEADER' : 'MEMBER'),
    },
  });
} else {
  // 역할 미러링 (선택)
  const newRole = token.realm_access?.roles?.includes('LEADER') ? 'LEADER' : 'MEMBER';
  if (user.role !== newRole) {
    await prisma.user.update({ where: { id: user.id }, data: { role: newRole } });
  }
}
```

---

## Seed 데이터
- v1.0.1의 관리자 계정 비밀번호 시드는 제거합니다.
- 관리자는 Keycloak에서 생성하고 `LEADER` 역할을 부여하세요.
- DB의 사용자 레코드는 최초 로그인 시 자동 생성됩니다.

---

## 인덱스/성능/백업
- v1.0.1 문서를 그대로 따릅니다(핵심 변경은 `users` 테이블의 컬럼만).
