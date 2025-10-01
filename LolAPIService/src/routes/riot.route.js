const { Router } = require('express');
const { RiotController } = require('../controllers/riot.controller');

const riotRouter = Router();
const controller = new RiotController();

// 소환사 이름으로 최신 매치 조회
riotRouter.get('/latest-match/:summonerName/:tag', (req, res) => controller.getLatestMatch(req, res));

// 소환사의 매치 히스토리 조회
riotRouter.get('/match-history/:summonerName/:tag', (req, res) => controller.getPlayerMatchHistory(req, res));

// 매치 상세 정보 조회
riotRouter.get('/match/:matchId', (req, res) => controller.getMatchDetail(req, res));

// 소환사의 PUUID 조회
riotRouter.get('/summoner/:summonerName/:tag/puuid', (req, res) => controller.getSummonerPuuid(req, res));

// PUUID로 매치 ID 목록 조회
riotRouter.get('/matches/:puuid', (req, res) => controller.getMatchIdsByPuuid(req, res));

module.exports = { riotRouter };
