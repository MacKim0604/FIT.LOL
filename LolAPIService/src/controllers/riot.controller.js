'use strict';

const { RiotAPIService } = require('../services/riot-simple.service');
const { SummonerPuuidResponse, MatchHistoryResponse, MatchIdsResponse } = require('../dto/riot.dto');

class RiotController {
  constructor() { this.service = new RiotAPIService(); }

  async getLatestMatch(req, res) {
    try {
      const { summonerName, tag } = req.params;
      if (!summonerName || !tag)
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'summonerName과 tag 파라미터가 필요합니다' } });
      const match = await this.service.getLatestMatchBySummonerName(summonerName, tag);
      return res.status(200).json({ success: true, data: match });
    } catch (error) {
      console.error('최신 매치 조회 오류:', error.message);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '매치 정보를 조회할 수 없습니다', details: error.message } });
    }
  }

  async getPlayerMatchHistory(req, res) {
    try {
      const { summonerName, tag } = req.params;
      const count = parseInt(req.query.count) || 10;
      if (!summonerName || !tag)
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'summonerName과 tag 파라미터가 필요합니다' } });
      const dto = { summonerName, tag, count };
      const matchHistory = await this.service.getPlayerMatchHistory(dto);
      const response = new MatchHistoryResponse(summonerName, tag, matchHistory, matchHistory.length);
      return res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error('매치 히스토리 조회 오류:', error.message);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '매치 히스토리를 조회할 수 없습니다', details: error.message } });
    }
  }

  async getMatchDetail(req, res) {
    try {
      const { matchId } = req.params;
      if (!matchId)
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'matchId 파라미터가 필요합니다' } });
      const matchDetail = await this.service.getMatchDetail(matchId);
      return res.status(200).json({ success: true, data: matchDetail });
    } catch (error) {
      console.error('매치 상세 조회 오류:', error.message);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '매치 상세 정보를 조회할 수 없습니다', details: error.message } });
    }
  }

  async getSummonerPuuid(req, res) {
    try {
      const { summonerName, tag } = req.params;
      if (!summonerName || !tag)
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'summonerName과 tag 파라미터가 필요합니다' } });
      const puuid = await this.service.getPuuidBySummonerName(summonerName, tag);
      const response = new SummonerPuuidResponse(summonerName, tag, puuid);
      return res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error('PUUID 조회 오류:', error.message);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '소환사 정보를 조회할 수 없습니다', details: error.message } });
    }
  }

  async getMatchIdsByPuuid(req, res) {
    try {
      const { puuid } = req.params;
      const count = parseInt(req.query.count) || 20;
      if (!puuid)
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'puuid 파라미터가 필요합니다' } });
      const matchIds = await this.service.getMatchIdsByPuuid(puuid, count);
      const response = new MatchIdsResponse(puuid, count, matchIds);
      return res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error('매치 ID 목록 조회 오류:', error.message);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '매치 ID 목록을 조회할 수 없습니다', details: error.message } });
    }
  }
}

module.exports = { RiotController };