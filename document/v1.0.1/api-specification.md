# FIT.LOL API Specification v1.0.1

## 개요
RESTful API 설계 문서입니다. OpenAPI 3.0 스펙을 따르며, 모든 엔드포인트는 JSON 형식으로 통신합니다.

---

## Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.fitlol.com/api/v1
```

---

## 인증

### JWT Bearer Token
```http
Authorization: Bearer <access_token>
```

### 토큰 발급
- **Access Token**: 1시간 유효
- **Refresh Token**: 7일 유효

---

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "Success"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

### 에러 코드
```typescript
enum ErrorCode {
  // 인증/권한
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 유효성 검증
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // 리소스
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Riot API
  RIOT_API_ERROR = 'RIOT_API_ERROR',
  RIOT_RATE_LIMIT = 'RIOT_RATE_LIMIT',
  SUMMONER_NOT_FOUND = 'SUMMONER_NOT_FOUND',
  
  // 서버
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

---

## API Endpoints

## 1. 인증 (Auth)

### 1.1 회원가입
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "username",
      "role": "MEMBER"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 1.2 로그인
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "username",
      "role": "MEMBER"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 1.3 토큰 갱신
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 1.4 로그아웃
```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. 클랜 관리 (Clan)

### 2.1 클랜원 목록 조회
```http
GET /clan/members
```

**Query Parameters:**
```
?page=1&limit=20&sort=username&order=asc&isActive=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "user_123",
        "username": "username",
        "role": "MEMBER",
        "summoners": [
          {
            "id": "summoner_123",
            "summonerName": "Hide on bush",
            "summonerLevel": 500,
            "region": "kr",
            "isActive": true,
            "lastSyncedAt": "2025-10-01T10:00:00Z"
          }
        ],
        "createdAt": "2025-09-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 2.2 클랜원 추가
```http
POST /clan/members
```

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "username": "newmember",
  "password": "password123",
  "role": "MEMBER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_124",
    "username": "newmember",
    "email": "newmember@example.com",
    "role": "MEMBER",
    "createdAt": "2025-10-01T10:00:00Z"
  }
}
```

### 2.3 클랜원 삭제
```http
DELETE /clan/members/:userId
```

**Response:**
```json
{
  "success": true,
  "message": "Member deleted successfully"
}
```

### 2.4 클랜원 상세 조회
```http
GET /clan/members/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "username",
    "email": "user@example.com",
    "role": "MEMBER",
    "summoners": [
      {
        "id": "summoner_123",
        "puuid": "...",
        "summonerName": "Hide on bush",
        "summonerLevel": 500,
        "profileIconId": 29,
        "region": "kr",
        "isActive": true,
        "lastSyncedAt": "2025-10-01T10:00:00Z",
        "rankedStats": [
          {
            "queueType": "RANKED_SOLO_5x5",
            "tier": "DIAMOND",
            "rank": "II",
            "lp": 75,
            "wins": 120,
            "losses": 100
          }
        ]
      }
    ],
    "createdAt": "2025-09-01T00:00:00Z"
  }
}
```

---

## 3. 소환사 (Summoner)

### 3.1 소환사 연동
```http
POST /summoner/link
```

**Request Body:**
```json
{
  "summonerName": "Hide on bush",
  "region": "kr"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "summoner_123",
    "puuid": "...",
    "summonerName": "Hide on bush",
    "summonerLevel": 500,
    "profileIconId": 29,
    "region": "kr",
    "syncStatus": "PENDING",
    "message": "Data collection started. This may take a few minutes."
  }
}
```

### 3.2 소환사 정보 조회
```http
GET /summoner/:summonerId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "summoner_123",
    "puuid": "...",
    "summonerName": "Hide on bush",
    "summonerLevel": 500,
    "profileIconId": 29,
    "region": "kr",
    "isActive": true,
    "lastSyncedAt": "2025-10-01T10:00:00Z",
    "rankedStats": [
      {
        "queueType": "RANKED_SOLO_5x5",
        "tier": "DIAMOND",
        "rank": "II",
        "lp": 75,
        "wins": 120,
        "losses": 100,
        "winRate": 54.5
      }
    ],
    "recentMatches": {
      "total": 20,
      "wins": 12,
      "losses": 8,
      "winRate": 60
    }
  }
}
```

### 3.3 소환사 데이터 갱신
```http
POST /summoner/:summonerId/refresh
```

**Query Parameters:**
```
?force=false  // true: 캐시 무시하고 강제 갱신
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123",
    "status": "PENDING",
    "message": "Refresh started. Check /summoner/:id/sync-status for progress."
  }
}
```

### 3.4 동기화 상태 조회
```http
GET /summoner/:summonerId/sync-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "IN_PROGRESS",
    "progress": {
      "current": 5,
      "total": 20,
      "percentage": 25
    },
    "lastSyncedAt": "2025-10-01T10:00:00Z",
    "estimatedCompletion": "2025-10-01T10:05:00Z"
  }
}
```

### 3.5 소환사 매치 목록
```http
GET /summoner/:summonerId/matches
```

**Query Parameters:**
```
?page=1&limit=20&position=MID&championId=157&win=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match_123",
        "matchId": "KR_1234567890",
        "gameCreation": "2025-10-01T09:00:00Z",
        "gameDuration": 1800,
        "queueId": 420,
        "participant": {
          "championId": 157,
          "championName": "Yasuo",
          "position": "MID",
          "win": true,
          "kills": 10,
          "deaths": 3,
          "assists": 8,
          "kda": 6.0,
          "cs": 180,
          "visionScore": 25
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 4. 분석 (Analysis)

### 4.1 개인 전력 카드
```http
GET /analysis/player/:summonerId
```

**Query Parameters:**
```
?games=20  // 최근 N경기 기준 (기본: 20)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summonerId": "summoner_123",
    "summonerName": "Hide on bush",
    "generatedAt": "2025-10-01T10:00:00Z",
    
    "overview": {
      "totalGames": 20,
      "wins": 12,
      "losses": 8,
      "winRate": 60,
      "avgKda": 3.5
    },
    
    "mainPosition": {
      "position": "MID",
      "games": 15,
      "winRate": 66.7
    },
    
    "mainChampions": [
      {
        "championId": 157,
        "championName": "Yasuo",
        "games": 8,
        "wins": 6,
        "losses": 2,
        "winRate": 75,
        "avgKda": 4.2
      }
    ],
    
    "metrics": {
      "lane": {
        "score": 1.2,
        "percentile": 75,
        "csAt10": 85,
        "goldDiffAt10": 250,
        "xpDiffAt10": 150,
        "soloKillRate": 0.15
      },
      "fight": {
        "score": 0.8,
        "percentile": 60,
        "dpm": 650,
        "kp": 68,
        "survivalRate": 0.4
      },
      "macro": {
        "score": -0.3,
        "percentile": 40,
        "vspm": 1.2,
        "wpm": 0.8,
        "wcpm": 0.3,
        "objectiveParticipation": 0.65
      },
      "form": {
        "score": 0.5,
        "recent5WinRate": 60,
        "recent10WinRate": 55,
        "recent20WinRate": 60
      }
    },
    
    "powerScore": 85,
    
    "strengths": [
      "Strong laning phase (Top 25%)",
      "High champion mastery on Yasuo",
      "Good recent form"
    ],
    
    "weaknesses": [
      "Low vision control",
      "Below average objective participation"
    ],
    
    "recommendations": [
      "Focus on warding and vision control",
      "Improve objective timing awareness"
    ]
  }
}
```

### 4.2 챔피언 풀 분석
```http
GET /analysis/champion-pool/:summonerId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summonerId": "summoner_123",
    "totalChampions": 15,
    "diversity": 0.65,
    
    "byPosition": {
      "MID": {
        "champions": [
          {
            "championId": 157,
            "championName": "Yasuo",
            "games": 8,
            "winRate": 75,
            "avgKda": 4.2,
            "isSignature": true
          }
        ],
        "poolSize": 5,
        "diversity": 0.7
      }
    },
    
    "signatureChampions": [
      {
        "championId": 157,
        "championName": "Yasuo",
        "position": "MID",
        "games": 8,
        "winRate": 75,
        "masteryLevel": 7,
        "masteryPoints": 250000
      }
    ],
    
    "recommendations": {
      "expand": ["Consider learning more AP champions"],
      "practice": ["Improve win rate on Zed"]
    }
  }
}
```

### 4.3 포지션별 통계
```http
GET /analysis/position-stats/:summonerId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summonerId": "summoner_123",
    "positions": [
      {
        "position": "MID",
        "games": 15,
        "wins": 10,
        "losses": 5,
        "winRate": 66.7,
        "avgKda": 3.8,
        "avgCsAt10": 85,
        "avgGoldDiffAt10": 250,
        "avgVisionScore": 25,
        "strengths": ["Laning", "Damage"],
        "weaknesses": ["Vision"]
      },
      {
        "position": "TOP",
        "games": 5,
        "wins": 2,
        "losses": 3,
        "winRate": 40,
        "avgKda": 2.5,
        "avgCsAt10": 75,
        "avgGoldDiffAt10": -100,
        "avgVisionScore": 18,
        "strengths": [],
        "weaknesses": ["Laning", "Vision"]
      }
    ],
    "recommendation": "Focus on MID position"
  }
}
```

### 4.4 팀 시너지 분석 (Phase 2)
```http
GET /analysis/synergy
```

**Query Parameters:**
```
?summonerIds=summoner_1,summoner_2,summoner_3
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summonerIds": ["summoner_1", "summoner_2", "summoner_3"],
    "gamesTogether": 15,
    "winsTogether": 10,
    "winRate": 66.7,
    
    "synergyScore": 0.75,
    
    "breakdown": {
      "winRate": 0.667,
      "roleBalance": 0.85,
      "championSynergy": 0.72,
      "laneMatchup": 0.68
    },
    
    "recommendedPositions": {
      "summoner_1": "TOP",
      "summoner_2": "JUNGLE",
      "summoner_3": "MID"
    },
    
    "teamComposition": {
      "tanks": 1,
      "fighters": 1,
      "mages": 1,
      "marksmen": 1,
      "supports": 1,
      "balance": "GOOD"
    }
  }
}
```

### 4.5 주간 리포트
```http
GET /analysis/weekly-report
```

**Query Parameters:**
```
?week=2025-W40  // ISO week format (기본: 현재 주)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "week": "2025-W40",
    "startDate": "2025-09-25",
    "endDate": "2025-10-01",
    
    "clanOverview": {
      "totalMembers": 50,
      "activeMembers": 45,
      "totalGames": 450,
      "avgWinRate": 52.5
    },
    
    "tierDistribution": {
      "IRON": 2,
      "BRONZE": 5,
      "SILVER": 10,
      "GOLD": 15,
      "PLATINUM": 10,
      "EMERALD": 5,
      "DIAMOND": 3
    },
    
    "positionBalance": {
      "TOP": 12,
      "JUNGLE": 10,
      "MID": 15,
      "ADC": 8,
      "SUPPORT": 5
    },
    
    "topPerformers": [
      {
        "summonerId": "summoner_123",
        "summonerName": "Hide on bush",
        "games": 25,
        "winRate": 68,
        "avgKda": 4.2,
        "powerScore": 92
      }
    ],
    
    "mostImproved": [
      {
        "summonerId": "summoner_456",
        "summonerName": "Faker",
        "winRateChange": 15,
        "tierChange": "PLATINUM -> DIAMOND"
      }
    ],
    
    "needsAttention": [
      {
        "summonerId": "summoner_789",
        "summonerName": "Player",
        "winRate": 35,
        "recentForm": "5 losses in a row"
      }
    ]
  }
}
```

---

## 5. 대시보드 (Dashboard)

### 5.1 클랜 대시보드
```http
GET /dashboard/clan
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMembers": 50,
      "activeMembers": 45,
      "avgTier": "GOLD",
      "avgWinRate": 52.5
    },
    
    "recentActivity": {
      "last24h": {
        "games": 120,
        "wins": 65,
        "losses": 55
      },
      "last7d": {
        "games": 450,
        "wins": 240,
        "losses": 210
      }
    },
    
    "topPerformers": [
      {
        "summonerId": "summoner_123",
        "summonerName": "Hide on bush",
        "winRate": 68,
        "games": 25,
        "powerScore": 92
      }
    ],
    
    "topSynergies": [
      {
        "summonerIds": ["summoner_1", "summoner_2"],
        "summonerNames": ["Player1", "Player2"],
        "gamesTogether": 15,
        "winRate": 73.3,
        "synergyScore": 0.85
      }
    ],
    
    "positionDistribution": {
      "TOP": 12,
      "JUNGLE": 10,
      "MID": 15,
      "ADC": 8,
      "SUPPORT": 5
    },
    
    "tierDistribution": {
      "IRON": 2,
      "BRONZE": 5,
      "SILVER": 10,
      "GOLD": 15,
      "PLATINUM": 10,
      "EMERALD": 5,
      "DIAMOND": 3
    }
  }
}
```

---

## 6. 관리자 (Admin)

### 6.1 작업 큐 상태
```http
GET /admin/jobs
```

**Query Parameters:**
```
?status=PENDING&type=riot-api&page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_123",
        "type": "riot-api",
        "status": "PROCESSING",
        "summonerId": "summoner_123",
        "progress": 50,
        "createdAt": "2025-10-01T10:00:00Z",
        "startedAt": "2025-10-01T10:01:00Z"
      }
    ],
    "summary": {
      "pending": 10,
      "processing": 5,
      "completed": 1000,
      "failed": 2
    },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1017,
      "totalPages": 21
    }
  }
}
```

### 6.2 실패한 작업 재시도
```http
POST /admin/jobs/retry
```

**Request Body:**
```json
{
  "jobIds": ["job_123", "job_456"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "retriedCount": 2,
    "jobs": [
      {
        "id": "job_123",
        "status": "PENDING",
        "retryCount": 1
      }
    ]
  }
}
```

### 6.3 시스템 통계
```http
GET /admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "database": {
      "users": 50,
      "summoners": 50,
      "matches": 1000,
      "matchParticipants": 1000,
      "totalSize": "5.2 MB"
    },
    "riotApi": {
      "todayCalls": 5000,
      "todayLimit": 100000,
      "currentRateLimit": "18/20 per second",
      "failedCalls": 5
    },
    "cache": {
      "hitRate": 85.5,
      "totalKeys": 1500,
      "memoryUsage": "128 MB"
    },
    "queue": {
      "pending": 10,
      "processing": 5,
      "avgProcessingTime": "2.5s"
    }
  }
}
```

---

## Rate Limiting

### API Rate Limits
```
일반 사용자: 100 requests/minute
관리자: 1000 requests/minute
```

### Rate Limit 헤더
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696147200
```

### Rate Limit 초과 시
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## Pagination

### 요청
```http
GET /api/v1/resource?page=1&limit=20
```

### 응답
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Filtering & Sorting

### 필터링
```http
GET /api/v1/summoner/:id/matches?position=MID&win=true&championId=157
```

### 정렬
```http
GET /api/v1/clan/members?sort=username&order=asc
```

---

## WebSocket (Phase 2+)

### 연결
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'access_token'
  }));
});
```

### 이벤트
```javascript
// 데이터 수집 진행률
{
  "type": "sync_progress",
  "data": {
    "summonerId": "summoner_123",
    "progress": 50,
    "current": 10,
    "total": 20
  }
}

// 분석 완료
{
  "type": "analysis_complete",
  "data": {
    "summonerId": "summoner_123",
    "analysisType": "PLAYER_CARD"
  }
}

// 새 경기 감지
{
  "type": "new_match",
  "data": {
    "summonerId": "summoner_123",
    "matchId": "KR_1234567890"
  }
}
```

---

## 다음 단계

1. ✅ API 명세서 작성 완료
2. ⬜ OpenAPI 3.0 YAML 파일 생성
3. ⬜ Swagger UI 설정
4. ⬜ API 클라이언트 코드 생성 (TypeScript)
5. ⬜ API 테스트 작성 (Jest + Supertest)

---

## 참고 자료

- [OpenAPI Specification](https://swagger.io/specification/)
- [REST API Best Practices](https://restfulapi.net/)
- [JWT Authentication](https://jwt.io/)
