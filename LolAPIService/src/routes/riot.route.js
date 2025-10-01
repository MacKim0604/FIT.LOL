const { Router } = require('express');
const { RiotController } = require('../controllers/riot.controller');

const riotRouter = Router();
const controller = new RiotController();

// 소환사 이름으로 최신 매치 조회
riotRouter.get('/latest-match/:summonerName/:tag', (req, res) => {
  /* #swagger.tags = ['Riot'] */
  /* #swagger.summary = '소환사의 최신 매치 조회' */
  /* #swagger.security = [{ "BearerAuth": [] }] */
  /* #swagger.parameters['summonerName'] = { in: 'path', required: true, schema: { type: 'string' }, description: 'Riot ID Name' } */
  /* #swagger.parameters['tag'] = { in: 'path', required: true, schema: { type: 'string' }, description: 'Riot Tagline' } */
  /* #swagger.responses[200] = { description: 'OK' } */
  controller.getLatestMatch(req, res);
});

// 소환사의 매치 히스토리 조회
riotRouter.get('/match-history/:summonerName/:tag', (req, res) => {
  /* #swagger.tags = ['Riot'] */
  /* #swagger.summary = '소환사의 매치 히스토리 조회' */
  /* #swagger.security = [{ "BearerAuth": [] }] */
  /* #swagger.parameters['summonerName'] = { in: 'path', required: true, schema: { type: 'string' } } */
  /* #swagger.parameters['tag'] = { in: 'path', required: true, schema: { type: 'string' } } */
  /* #swagger.parameters['count'] = { in: 'query', required: false, schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 } } */
  /* #swagger.responses[200] = { description: 'OK' } */
  controller.getPlayerMatchHistory(req, res);
});

// 매치 상세 정보 조회
riotRouter.get('/match/:matchId', (req, res) => {
  /* #swagger.tags = ['Riot'] */
  /* #swagger.summary = '매치 상세 정보 조회' */
  /* #swagger.security = [{ "BearerAuth": [] }] */
  /* #swagger.parameters['matchId'] = { in: 'path', required: true, schema: { type: 'string' } } */
  /* #swagger.responses[200] = { description: 'OK' } */
  controller.getMatchDetail(req, res);
});

// 소환사의 PUUID 조회
riotRouter.get('/summoner/:summonerName/:tag/puuid', (req, res) => {
  /* #swagger.tags = ['Riot'] */
  /* #swagger.summary = '소환사의 PUUID 조회' */
  /* #swagger.security = [{ "BearerAuth": [] }] */
  /* #swagger.parameters['summonerName'] = { in: 'path', required: true, schema: { type: 'string' } } */
  /* #swagger.parameters['tag'] = { in: 'path', required: true, schema: { type: 'string' } } */
  /* #swagger.responses[200] = { description: 'OK' } */
  controller.getSummonerPuuid(req, res);
});

// PUUID로 매치 ID 목록 조회
riotRouter.get('/matches/:puuid', (req, res) => {
  /* #swagger.tags = ['Riot'] */
  /* #swagger.summary = 'PUUID로 매치 ID 목록 조회' */
  /* #swagger.security = [{ "BearerAuth": [] }] */
  /* #swagger.parameters['puuid'] = { in: 'path', required: true, schema: { type: 'string' } } */
  /* #swagger.parameters['count'] = { in: 'query', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } } */
  /* #swagger.responses[200] = { description: 'OK' } */
  controller.getMatchIdsByPuuid(req, res);
});

module.exports = { riotRouter };