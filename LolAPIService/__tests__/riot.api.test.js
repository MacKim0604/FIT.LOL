const request = require('supertest');

// Mock JWT verification to always allow access with MEMBER role
jest.mock('jsonwebtoken', () => {
  const actual = jest.requireActual('jsonwebtoken');
  return {
    ...actual,
    verify: jest.fn((token, getKey, options, callback) => {
      // Simulate a decoded payload that contains the MEMBER role at ROLE_PATH (default: realm_access.roles)
      const payload = { realm_access: { roles: ['MEMBER'] } };
      callback(null, payload);
    }),
  };
});

// Mock RiotAPIService to avoid real HTTP calls to Riot API
const MOCK_PUUID = 'mock-puuid-123';
const MOCK_MATCH_IDS = ['KR_123', 'KR_456'];
const MOCK_SUMMONER_NAME = '김동건';
const MOCK_TAG = 'DGKIM';
const MOCK_MATCH_DETAIL = {
  metadata: { matchId: MOCK_MATCH_IDS[0] },
  info: {
    gameStartTimestamp: 1728200000000,
    gameDuration: 1800,
    queueId: 420,
    participants: [
      {
        riotIdName: MOCK_SUMMONER_NAME,
        riotIdTagline: MOCK_TAG,
        kills: 10,
        deaths: 2,
        assists: 8,
        championName: 'Ahri',
        win: true,
        totalDamageDealtToChampions: 20000,
        goldEarned: 12000,
        totalMinionsKilled: 200,
        visionScore: 20,
      },
    ],
  },
};

const MOCK_MATCH_HISTORY = [
  {
    matchId: MOCK_MATCH_IDS[0],
    gameStartTimestamp: 1728200000000,
    gameDuration: 1800,
    queueId: 420,
    kills: 10,
    deaths: 2,
    assists: 8,
    kda: '10/2/8',
    championName: 'Ahri',
    win: true,
    totalDamageDealtToChampions: 20000,
    goldEarned: 12000,
    totalMinionsKilled: 200,
    visionScore: 20,
  },
  {
    matchId: MOCK_MATCH_IDS[1],
    gameStartTimestamp: 1728100000000,
    gameDuration: 1900,
    queueId: 420,
    kills: 5,
    deaths: 5,
    assists: 10,
    kda: '5/5/10',
    championName: 'Lux',
    win: false,
    totalDamageDealtToChampions: 15000,
    goldEarned: 9000,
    totalMinionsKilled: 150,
    visionScore: 30,
  },
];

jest.mock('../src/services/riot-simple.service', () => {
  const mockService = {
    getPuuidBySummonerName: jest.fn(async () => MOCK_PUUID),
    getMatchIdsByPuuid: jest.fn(async (puuid, count = 20) => MOCK_MATCH_IDS.slice(0, count)),
    getMatchDetail: jest.fn(async (matchId) => ({ ...MOCK_MATCH_DETAIL, metadata: { matchId } })),
    getLatestMatchBySummonerName: jest.fn(async () => MOCK_MATCH_DETAIL),
    getPlayerMatchHistory: jest.fn(async (dto) => {
      const c = dto?.count ?? 10;
      return MOCK_MATCH_HISTORY.slice(0, c);
    }),
  };
  return { RiotAPIService: jest.fn().mockImplementation(() => mockService) };
});

// Import the app AFTER mocks are set up
const { createServer } = require('../src/server');

let app;

beforeAll(() => {
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.OIDC_ISSUER_URL = 'http://test-issuer';
  process.env.OIDC_JWKS_URI = 'http://test-jwks';
  app = createServer();
});

describe('Riot API (with auth mocked)', () => {
  const AUTH = { Authorization: 'Bearer test' };
  const NAME = MOCK_SUMMONER_NAME;
  const TAG = MOCK_TAG;
  const NAME_ENC = encodeURIComponent(NAME);

  test('should return 401 when Authorization header is missing', async () => {
    const res = await request(app).get(`/api/v1/riot/summoner/${NAME_ENC}/${TAG}/puuid`);
    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toBe('UNAUTHORIZED');
  });

  test('GET /summoner/:name/:tag/puuid returns puuid for 김동건#DGKIM', async () => {
    const res = await request(app)
      .get(`/api/v1/riot/summoner/${NAME_ENC}/${TAG}/puuid`)
      .set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ summonerName: NAME, tag: TAG, puuid: MOCK_PUUID });
  });

  test('GET /latest-match/:name/:tag returns latest match detail', async () => {
    const res = await request(app)
      .get(`/api/v1/riot/latest-match/${NAME_ENC}/${TAG}`)
      .set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.metadata?.matchId).toBe(MOCK_MATCH_IDS[0]);
  });

  test('GET /match-history/:name/:tag?count=2 returns match history list', async () => {
    const res = await request(app)
      .get(`/api/v1/riot/match-history/${NAME_ENC}/${TAG}?count=2`)
      .set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.summonerName).toBe(NAME);
    expect(res.body.data?.tag).toBe(TAG);
    expect(Array.isArray(res.body.data?.matches)).toBe(true);
    expect(res.body.data?.matches).toHaveLength(2);
  });

  test('GET /matches/:puuid?count=1 returns match id list', async () => {
    const res = await request(app)
      .get(`/api/v1/riot/matches/${MOCK_PUUID}?count=1`)
      .set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.puuid).toBe(MOCK_PUUID);
    expect(res.body.data?.matchIds).toEqual([MOCK_MATCH_IDS[0]]);
  });
});
