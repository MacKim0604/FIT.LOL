# FIT.LOL Riot API Integration Guide v1.0.1

## 개요
Riot Games API와의 통합 전략, Rate Limiting 관리, 데이터 수집 플로우를 상세히 설명합니다.

---

## Riot API 기본 정보

### API 키 발급
1. [Riot Developer Portal](https://developer.riotgames.com/) 접속
2. 개발자 계정 생성
3. Development API Key 발급 (24시간 유효)
4. Production Key 신청 (승인 필요)

### API 키 타입
```typescript
enum ApiKeyType {
  DEVELOPMENT = 'DEVELOPMENT',  // 24시간 유효, 제한적
  PERSONAL = 'PERSONAL',        // 영구 유효, 제한적
  PRODUCTION = 'PRODUCTION',    // 영구 유효, 높은 한도
}
```

### Base URLs (Region별)
```typescript
const PLATFORM_URLS = {
  kr: 'https://kr.api.riotgames.com',
  na1: 'https://na1.api.riotgames.com',
  euw1: 'https://euw1.api.riotgames.com',
  eun1: 'https://eun1.api.riotgames.com',
  jp1: 'https://jp1.api.riotgames.com',
};

const REGIONAL_URLS = {
  asia: 'https://asia.api.riotgames.com',
  americas: 'https://americas.api.riotgames.com',
  europe: 'https://europe.api.riotgames.com',
  sea: 'https://sea.api.riotgames.com',
};

// Region Mapping
const REGION_TO_REGIONAL = {
  kr: 'asia',
  jp1: 'asia',
  na1: 'americas',
  euw1: 'europe',
  eun1: 'europe',
};
```

---

## Rate Limiting

### Rate Limit 구조
```typescript
interface RateLimit {
  application: {
    perSecond: 20,
    per2Minutes: 100,
  };
  method: {
    // 각 엔드포인트별 제한
    'summoner-v4': {
      perSecond: 2000,
      per2Minutes: 30000,
    },
    'match-v5': {
      perSecond: 2000,
      per2Minutes: 30000,
    },
  };
}
```

### Rate Limiter 구현
```typescript
// src/services/riot-api/rate-limiter.ts

import Redis from 'ioredis';

export class RateLimiter {
  private redis: Redis;
  private readonly APP_LIMIT_PER_SECOND = 20;
  private readonly APP_LIMIT_PER_2MIN = 100;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Rate limit 체크 및 토큰 소비
   */
  async checkAndConsume(region: string): Promise<boolean> {
    const now = Date.now();
    const secondKey = `rate:${region}:second:${Math.floor(now / 1000)}`;
    const twoMinKey = `rate:${region}:2min:${Math.floor(now / 120000)}`;

    const pipeline = this.redis.pipeline();
    
    // 1초 단위 카운터
    pipeline.incr(secondKey);
    pipeline.expire(secondKey, 2);
    
    // 2분 단위 카운터
    pipeline.incr(twoMinKey);
    pipeline.expire(twoMinKey, 120);

    const results = await pipeline.exec();
    
    const secondCount = results?.[0]?.[1] as number;
    const twoMinCount = results?.[2]?.[1] as number;

    // Rate limit 체크
    if (secondCount > this.APP_LIMIT_PER_SECOND) {
      return false;
    }
    if (twoMinCount > this.APP_LIMIT_PER_2MIN) {
      return false;
    }

    return true;
  }

  /**
   * Rate limit 초과 시 대기 시간 계산
   */
  async getWaitTime(region: string): Promise<number> {
    const now = Date.now();
    const secondKey = `rate:${region}:second:${Math.floor(now / 1000)}`;
    const twoMinKey = `rate:${region}:2min:${Math.floor(now / 120000)}`;

    const [secondCount, twoMinCount] = await Promise.all([
      this.redis.get(secondKey),
      this.redis.get(twoMinKey),
    ]);

    if (Number(secondCount) >= this.APP_LIMIT_PER_SECOND) {
      return 1000; // 1초 대기
    }
    if (Number(twoMinCount) >= this.APP_LIMIT_PER_2MIN) {
      return 120000; // 2분 대기
    }

    return 0;
  }

  /**
   * 429 응답 시 Retry-After 헤더 파싱
   */
  parseRetryAfter(headers: Record<string, string>): number {
    const retryAfter = headers['retry-after'] || headers['x-rate-limit-retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter, 10) * 1000;
    }
    return 1000; // 기본 1초
  }
}
```

---

## API 클라이언트 구현

### Base Client
```typescript
// src/services/riot-api/client.ts

import axios, { AxiosInstance, AxiosError } from 'axios';
import { RateLimiter } from './rate-limiter';
import { logger } from '@/utils/logger';

export class RiotApiClient {
  private axiosInstance: AxiosInstance;
  private rateLimiter: RateLimiter;
  private apiKey: string;

  constructor(apiKey: string, rateLimiter: RateLimiter) {
    this.apiKey = apiKey;
    this.rateLimiter = rateLimiter;
    
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'X-Riot-Token': apiKey,
        'User-Agent': 'FIT.LOL/1.0.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Rate limit 체크
        const region = this.extractRegion(config.url || '');
        const canProceed = await this.rateLimiter.checkAndConsume(region);
        
        if (!canProceed) {
          const waitTime = await this.rateLimiter.getWaitTime(region);
          logger.warn(`Rate limit reached. Waiting ${waitTime}ms`);
          await this.sleep(waitTime);
          return config;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  private async handleError(error: AxiosError): Promise<any> {
    const status = error.response?.status;
    const config = error.config;

    switch (status) {
      case 429: // Rate Limit
        const retryAfter = this.rateLimiter.parseRetryAfter(
          error.response?.headers as Record<string, string>
        );
        logger.warn(`429 Rate Limit. Retry after ${retryAfter}ms`);
        await this.sleep(retryAfter);
        return this.axiosInstance.request(config!);

      case 503: // Service Unavailable
        logger.warn('503 Service Unavailable. Retrying with exponential backoff');
        return this.retryWithBackoff(config!, 3);

      case 404: // Not Found
        logger.info('404 Not Found:', config?.url);
        throw new RiotApiError('NOT_FOUND', 'Resource not found', error);

      case 403: // Forbidden
        logger.error('403 Forbidden. Check API key');
        throw new RiotApiError('FORBIDDEN', 'Invalid API key', error);

      case 400: // Bad Request
        logger.error('400 Bad Request:', config?.url);
        throw new RiotApiError('BAD_REQUEST', 'Invalid request', error);

      default:
        logger.error('Riot API Error:', error.message);
        throw new RiotApiError('UNKNOWN', error.message, error);
    }
  }

  private async retryWithBackoff(
    config: any,
    maxRetries: number,
    currentRetry: number = 0
  ): Promise<any> {
    if (currentRetry >= maxRetries) {
      throw new RiotApiError('MAX_RETRIES', 'Max retries exceeded');
    }

    const delay = Math.pow(2, currentRetry) * 1000; // 1s, 2s, 4s, 8s
    logger.info(`Retry ${currentRetry + 1}/${maxRetries} after ${delay}ms`);
    await this.sleep(delay);

    try {
      return await this.axiosInstance.request(config);
    } catch (error) {
      return this.retryWithBackoff(config, maxRetries, currentRetry + 1);
    }
  }

  private extractRegion(url: string): string {
    const match = url.match(/https:\/\/(\w+)\.api\.riotgames\.com/);
    return match ? match[1] : 'kr';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(url);
    return response.data;
  }
}

export class RiotApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'RiotApiError';
  }
}
```

---

## API 엔드포인트별 구현

### 1. Summoner API
```typescript
// src/services/riot-api/summoner.service.ts

export class SummonerService {
  constructor(private client: RiotApiClient) {}

  /**
   * 소환사명으로 PUUID 조회
   */
  async getByName(region: string, summonerName: string) {
    const url = `${PLATFORM_URLS[region]}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
    return this.client.get<SummonerDTO>(url);
  }

  /**
   * PUUID로 소환사 정보 조회
   */
  async getByPuuid(region: string, puuid: string) {
    const url = `${PLATFORM_URLS[region]}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return this.client.get<SummonerDTO>(url);
  }
}

interface SummonerDTO {
  id: string;           // Encrypted summoner ID
  accountId: string;    // Encrypted account ID
  puuid: string;        // Player UUID
  name: string;         // Summoner name
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}
```

### 2. League API (랭크 정보)
```typescript
// src/services/riot-api/league.service.ts

export class LeagueService {
  constructor(private client: RiotApiClient) {}

  /**
   * 소환사 랭크 정보 조회
   */
  async getBySummonerId(region: string, summonerId: string) {
    const url = `${PLATFORM_URLS[region]}/lol/league/v4/entries/by-summoner/${summonerId}`;
    return this.client.get<LeagueEntryDTO[]>(url);
  }
}

interface LeagueEntryDTO {
  leagueId: string;
  queueType: string;    // RANKED_SOLO_5x5, RANKED_FLEX_SR
  tier: string;         // IRON, BRONZE, SILVER, GOLD, etc.
  rank: string;         // I, II, III, IV
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}
```

### 3. Match API
```typescript
// src/services/riot-api/match.service.ts

export class MatchService {
  constructor(private client: RiotApiClient) {}

  /**
   * 매치 ID 리스트 조회
   */
  async getMatchIdsByPuuid(
    puuid: string,
    options: {
      startTime?: number;
      endTime?: number;
      queue?: number;
      type?: string;
      start?: number;
      count?: number;
    } = {}
  ) {
    const regional = REGION_TO_REGIONAL['kr']; // TODO: 동적으로 결정
    const params = new URLSearchParams();
    
    if (options.startTime) params.append('startTime', options.startTime.toString());
    if (options.endTime) params.append('endTime', options.endTime.toString());
    if (options.queue) params.append('queue', options.queue.toString());
    if (options.type) params.append('type', options.type);
    params.append('start', (options.start || 0).toString());
    params.append('count', (options.count || 20).toString());

    const url = `${REGIONAL_URLS[regional]}/lol/match/v5/matches/by-puuid/${puuid}/ids?${params}`;
    return this.client.get<string[]>(url);
  }

  /**
   * 매치 상세 정보 조회
   */
  async getMatchById(matchId: string) {
    const regional = this.extractRegionalFromMatchId(matchId);
    const url = `${REGIONAL_URLS[regional]}/lol/match/v5/matches/${matchId}`;
    return this.client.get<MatchDTO>(url);
  }

  /**
   * 매치 타임라인 조회
   */
  async getTimelineById(matchId: string) {
    const regional = this.extractRegionalFromMatchId(matchId);
    const url = `${REGIONAL_URLS[regional]}/lol/match/v5/matches/${matchId}/timeline`;
    return this.client.get<MatchTimelineDTO>(url);
  }

  private extractRegionalFromMatchId(matchId: string): string {
    // KR_1234567890 -> asia
    const prefix = matchId.split('_')[0];
    const regionMap: Record<string, string> = {
      KR: 'asia',
      NA1: 'americas',
      EUW1: 'europe',
      // ... 추가
    };
    return regionMap[prefix] || 'asia';
  }
}

interface MatchDTO {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[]; // PUUIDs
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: ParticipantDTO[];
    platformId: string;
    queueId: number;
    teams: TeamDTO[];
    tournamentCode: string;
  };
}

interface ParticipantDTO {
  puuid: string;
  championId: number;
  championName: string;
  teamId: number;
  teamPosition: string;
  individualPosition: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  goldEarned: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  // ... 더 많은 필드
}

interface MatchTimelineDTO {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    frameInterval: number;
    frames: FrameDTO[];
  };
}

interface FrameDTO {
  timestamp: number;
  participantFrames: Record<string, ParticipantFrameDTO>;
  events: EventDTO[];
}
```

### 4. Champion Mastery API
```typescript
// src/services/riot-api/champion-mastery.service.ts

export class ChampionMasteryService {
  constructor(private client: RiotApiClient) {}

  /**
   * 소환사의 챔피언 숙련도 조회
   */
  async getByPuuid(region: string, puuid: string) {
    const url = `${PLATFORM_URLS[region]}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
    return this.client.get<ChampionMasteryDTO[]>(url);
  }

  /**
   * 특정 챔피언 숙련도 조회
   */
  async getByChampion(region: string, puuid: string, championId: number) {
    const url = `${PLATFORM_URLS[region]}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`;
    return this.client.get<ChampionMasteryDTO>(url);
  }
}

interface ChampionMasteryDTO {
  puuid: string;
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
}
```

---

## 데이터 수집 플로우

### 1. 신규 소환사 추가
```typescript
// src/services/data-collection/summoner-sync.service.ts

export class SummonerSyncService {
  async syncNewSummoner(summonerName: string, region: string) {
    // 1. 소환사 기본 정보 조회
    const summoner = await this.summonerService.getByName(region, summonerName);
    
    // 2. DB에 저장
    const dbSummoner = await this.prisma.summoner.create({
      data: {
        puuid: summoner.puuid,
        summonerId: summoner.id,
        accountId: summoner.accountId,
        summonerName: summoner.name,
        summonerLevel: summoner.summonerLevel,
        profileIconId: summoner.profileIconId,
        region,
        userId: this.currentUserId,
      },
    });

    // 3. 작업 큐에 추가
    await this.queueRankedStats(dbSummoner.id, summoner.id, region);
    await this.queueMatchHistory(dbSummoner.id, summoner.puuid, region);
    await this.queueChampionMastery(dbSummoner.id, summoner.puuid, region);

    return dbSummoner;
  }

  private async queueRankedStats(summonerId: string, riotSummonerId: string, region: string) {
    await this.riotApiQueue.add('fetch-ranked-stats', {
      summonerId,
      riotSummonerId,
      region,
    }, {
      priority: 1, // Highest
    });
  }

  private async queueMatchHistory(summonerId: string, puuid: string, region: string) {
    await this.riotApiQueue.add('fetch-match-history', {
      summonerId,
      puuid,
      region,
      count: 20,
    }, {
      priority: 1,
    });
  }

  private async queueChampionMastery(summonerId: string, puuid: string, region: string) {
    await this.riotApiQueue.add('fetch-champion-mastery', {
      summonerId,
      puuid,
      region,
    }, {
      priority: 3, // Lower priority
    });
  }
}
```

### 2. 매치 데이터 수집
```typescript
// src/workers/riot-api.worker.ts

export class RiotApiWorker {
  async processMatchHistory(job: Job) {
    const { summonerId, puuid, region, count } = job.data;

    try {
      // 1. 매치 ID 리스트 조회
      const matchIds = await this.matchService.getMatchIdsByPuuid(puuid, {
        queue: 420, // Ranked Solo
        count,
      });

      // 2. 이미 수집된 매치 필터링
      const existingMatches = await this.prisma.match.findMany({
        where: { matchId: { in: matchIds } },
        select: { matchId: true },
      });
      const existingMatchIds = new Set(existingMatches.map(m => m.matchId));
      const newMatchIds = matchIds.filter(id => !existingMatchIds.has(id));

      // 3. 각 매치 상세 정보 수집 작업 큐에 추가
      for (const matchId of newMatchIds) {
        await this.riotApiQueue.add('fetch-match-detail', {
          summonerId,
          matchId,
          puuid,
        }, {
          priority: 2,
        });
      }

      // 4. 진행률 업데이트
      await this.updateSyncProgress(summonerId, {
        total: matchIds.length,
        completed: existingMatchIds.size,
        pending: newMatchIds.length,
      });

    } catch (error) {
      logger.error('Failed to process match history:', error);
      throw error;
    }
  }

  async processMatchDetail(job: Job) {
    const { summonerId, matchId, puuid } = job.data;

    try {
      // 1. 매치 상세 정보 조회
      const match = await this.matchService.getMatchById(matchId);

      // 2. 타임라인 조회 (라인전 지표 추출용)
      const timeline = await this.matchService.getTimelineById(matchId);

      // 3. DB에 저장
      await this.saveMatchData(match, timeline, summonerId, puuid);

      // 4. 분석 작업 큐에 추가
      await this.analysisQueue.add('analyze-match', {
        summonerId,
        matchId,
      }, {
        priority: 3,
      });

    } catch (error) {
      if (error instanceof RiotApiError && error.code === 'NOT_FOUND') {
        logger.warn(`Match ${matchId} not found. Skipping.`);
        return;
      }
      throw error;
    }
  }

  private async saveMatchData(
    match: MatchDTO,
    timeline: MatchTimelineDTO,
    summonerId: string,
    puuid: string
  ) {
    // 1. Match 테이블에 저장
    const dbMatch = await this.prisma.match.upsert({
      where: { matchId: match.metadata.matchId },
      create: {
        matchId: match.metadata.matchId,
        gameCreation: new Date(match.info.gameCreation),
        gameDuration: match.info.gameDuration,
        gameEndTimestamp: match.info.gameEndTimestamp 
          ? new Date(match.info.gameEndTimestamp) 
          : null,
        gameMode: match.info.gameMode,
        gameType: match.info.gameType,
        gameVersion: match.info.gameVersion,
        mapId: match.info.mapId,
        platformId: match.info.platformId,
        queueId: match.info.queueId,
      },
      update: {},
    });

    // 2. 해당 소환사의 참가 정보만 저장
    const participant = match.info.participants.find(p => p.puuid === puuid);
    if (!participant) {
      logger.warn(`Participant not found for puuid ${puuid} in match ${match.metadata.matchId}`);
      return;
    }

    // 3. 타임라인에서 라인전 지표 추출
    const laneStats = this.extractLaneStats(timeline, participant);

    // 4. MatchParticipant 테이블에 저장
    await this.prisma.matchParticipant.upsert({
      where: {
        matchId_summonerId: {
          matchId: dbMatch.id,
          summonerId,
        },
      },
      create: {
        matchId: dbMatch.id,
        summonerId,
        championId: participant.championId,
        championName: participant.championName,
        position: this.normalizePosition(participant.individualPosition),
        teamId: participant.teamId,
        teamPosition: participant.teamPosition,
        individualPosition: participant.individualPosition,
        win: participant.win,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
        totalDamageTaken: participant.totalDamageTaken,
        goldEarned: participant.goldEarned,
        totalMinionsKilled: participant.totalMinionsKilled,
        neutralMinionsKilled: participant.neutralMinionsKilled,
        visionScore: participant.visionScore,
        wardsPlaced: participant.wardsPlaced,
        wardsKilled: participant.wardsKilled,
        // 라인전 지표
        ...laneStats,
        // ... 더 많은 필드
      },
      update: {},
    });
  }

  private extractLaneStats(timeline: MatchTimelineDTO, participant: ParticipantDTO) {
    // 타임라인에서 10분 시점 데이터 추출
    const participantId = timeline.metadata.participants.indexOf(participant.puuid) + 1;
    const frame10min = timeline.info.frames.find(f => f.timestamp >= 600000); // 10분 = 600,000ms

    if (!frame10min) {
      return {};
    }

    const participantFrame = frame10min.participantFrames[participantId];
    
    // 상대 라이너 찾기 (같은 포지션, 다른 팀)
    // TODO: 구현 필요

    return {
      csAt10: participantFrame.minionsKilled + participantFrame.jungleMinionsKilled,
      goldAt10: participantFrame.totalGold,
      xpAt10: participantFrame.xp,
      // csDiffAt10, goldDiffAt10, xpDiffAt10은 상대와 비교 필요
    };
  }

  private normalizePosition(position: string): string {
    const positionMap: Record<string, string> = {
      'TOP': 'TOP',
      'JUNGLE': 'JUNGLE',
      'MIDDLE': 'MID',
      'MID': 'MID',
      'BOTTOM': 'ADC',
      'BOT': 'ADC',
      'UTILITY': 'SUPPORT',
      'SUPPORT': 'SUPPORT',
    };
    return positionMap[position] || 'UNKNOWN';
  }
}
```

### 3. 정기 데이터 갱신
```typescript
// src/cron/summoner-refresh.cron.ts

export class SummonerRefreshCron {
  /**
   * 매 1시간마다 활성 클랜원 데이터 갱신
   */
  @Cron('0 * * * *') // Every hour
  async refreshActiveSummoners() {
    const activeSummoners = await this.prisma.summoner.findMany({
      where: { isActive: true },
      select: { id: true, puuid: true, region: true },
    });

    for (const summoner of activeSummoners) {
      await this.riotApiQueue.add('fetch-match-history', {
        summonerId: summoner.id,
        puuid: summoner.puuid,
        region: summoner.region,
        count: 5, // 최근 5경기만
      }, {
        priority: 2,
      });
    }

    logger.info(`Queued refresh for ${activeSummoners.length} summoners`);
  }

  /**
   * 매일 03:00 랭크 정보 갱신
   */
  @Cron('0 3 * * *') // Daily at 3 AM
  async refreshRankedStats() {
    const summoners = await this.prisma.summoner.findMany({
      where: { isActive: true },
      select: { id: true, summonerId: true, region: true },
    });

    for (const summoner of summoners) {
      await this.riotApiQueue.add('fetch-ranked-stats', {
        summonerId: summoner.id,
        riotSummonerId: summoner.summonerId,
        region: summoner.region,
      }, {
        priority: 3,
      });
    }

    logger.info(`Queued ranked stats refresh for ${summoners.length} summoners`);
  }
}
```

---

## 캐싱 전략

### Redis 캐싱
```typescript
// src/services/cache/riot-api-cache.service.ts

export class RiotApiCacheService {
  constructor(private redis: Redis) {}

  /**
   * 소환사 정보 캐싱 (24시간)
   */
  async cacheSummoner(puuid: string, data: SummonerDTO) {
    const key = `summoner:${puuid}`;
    await this.redis.setex(key, 86400, JSON.stringify(data)); // 24 hours
  }

  async getCachedSummoner(puuid: string): Promise<SummonerDTO | null> {
    const key = `summoner:${puuid}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * 랭크 정보 캐싱 (1시간)
   */
  async cacheRankedStats(summonerId: string, data: LeagueEntryDTO[]) {
    const key = `ranked:${summonerId}`;
    await this.redis.setex(key, 3600, JSON.stringify(data)); // 1 hour
  }

  /**
   * 매치 데이터 캐싱 (영구 - immutable)
   */
  async cacheMatch(matchId: string, data: MatchDTO) {
    const key = `match:${matchId}`;
    await this.redis.set(key, JSON.stringify(data)); // No expiry
  }
}
```

---

## 에러 처리 및 모니터링

### 에러 로깅
```typescript
// src/services/monitoring/riot-api-monitor.service.ts

export class RiotApiMonitorService {
  async logApiCall(
    endpoint: string,
    region: string,
    status: number,
    duration: number,
    error?: any
  ) {
    await this.prisma.jobLog.create({
      data: {
        jobType: 'riot-api',
        status: error ? 'FAILED' : 'COMPLETED',
        errorMsg: error?.message,
        // ... 추가 정보
      },
    });

    // Metrics 수집
    this.metricsService.recordApiCall(endpoint, region, status, duration);
  }

  async getApiStats(timeRange: string = '24h') {
    // 통계 조회
    const stats = await this.prisma.jobLog.groupBy({
      by: ['status'],
      where: {
        jobType: 'riot-api',
        createdAt: {
          gte: this.getTimeRangeStart(timeRange),
        },
      },
      _count: true,
    });

    return stats;
  }
}
```

---

## 다음 단계

1. ✅ Riot API 통합 가이드 작성 완료
2. ⬜ Rate Limiter 구현
3. ⬜ API 클라이언트 구현
4. ⬜ 데이터 수집 워커 구현
5. ⬜ 캐싱 레이어 구현
6. ⬜ 에러 처리 및 모니터링 구현

---

## 참고 자료

- [Riot Games API Documentation](https://developer.riotgames.com/apis)
- [Rate Limiting Best Practices](https://developer.riotgames.com/docs/lol#rate-limiting)
- [Match-v5 Migration Guide](https://developer.riotgames.com/apis#match-v5)
