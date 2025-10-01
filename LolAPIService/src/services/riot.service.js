'use strict';

const axios = require('axios');

class RiotAPIService {
  constructor() {
    this.apiKey = process.env.RIOT_API_KEY || '';
    this.matchRegion = 'asia';
    this.baseHeaders = {
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Charset': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': 'https://developer.riotgames.com',
      'X-Riot-Token': this.apiKey,
      'User-Agent': 'FIT.LOL/LolAPIService v1.0.2',
    };
  }

  async requestGet(url) {
    try {
      return await axios.get(url, { headers: this.baseHeaders, timeout: 10000 });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 429) throw new Error('Riot API rate limit (429)');
      if (status === 503) throw new Error('Riot API unavailable (503)');
      throw error;
    }
  }

  async getPuuidBySummonerName(summonerName, tag) {
    try {
      const url = `https://${this.matchRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${tag}`;
      const response = await this.requestGet(url);
      if (!response.data || !response.data.puuid) {
        throw new Error('PUUID를 찾을 수 없습니다');
      }
      return response.data.puuid;
    } catch (error) {
      console.error(`PUUID 조회 실패 - ${summonerName}#${tag}:`, error.message);
      throw new Error(`소환사 정보를 조회할 수 없습니다: ${error.message}`);
    }
  }

  async getMatchIdsByPuuid(puuid, count = 20) {
    try {
      const url = `https://${this.matchRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${Math.min(count, 100)}`;
      const response = await this.requestGet(url);
      return response.data || [];
    } catch (error) {
      console.error(`매치 ID 조회 실패 - ${puuid}:`, error.message);
      throw new Error(`매치 기록을 조회할 수 없습니다: ${error.message}`);
    }
  }

  async getMatchDetail(matchId) {
    try {
      const url = `https://${this.matchRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
      const response = await this.requestGet(url);
      return response.data;
    } catch (error) {
      console.error(`매치 상세 조회 실패 - ${matchId}:`, error.message);
      throw new Error(`매치 상세 정보를 조회할 수 없습니다: ${error.message}`);
    }
  }

  async getLatestMatchBySummonerName(summonerName, tag) {
    try {
      const puuid = await this.getPuuidBySummonerName(summonerName, tag);
      const matchIds = await this.getMatchIdsByPuuid(puuid, 1);
      if (!matchIds || matchIds.length === 0) {
        throw new Error('매치 기록이 없습니다');
      }
      return await this.getMatchDetail(matchIds[0]);
    } catch (error) {
      console.error(`최신 매치 조회 실패 - ${summonerName}#${tag}:`, error.message);
      throw error;
    }
  }

  getPlayerStats(matchDetail, summonerName, tag) {
    if (!matchDetail?.info?.participants) {
      throw new Error('매치 참가자 정보를 찾을 수 없습니다');
    }
    const participant = matchDetail.info.participants.find(
      (p) => p.riotIdName === summonerName && p.riotIdTagline === tag
    );
    if (!participant) {
      throw new Error('해당 소환사의 참가자 정보를 찾을 수 없습니다');
    }
    return {
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      kda: `${participant.kills}/${participant.deaths}/${participant.assists}`,
      championName: participant.championName,
      win: participant.win,
      totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
      goldEarned: participant.goldEarned,
      totalMinionsKilled: participant.totalMinionsKilled,
      visionScore: participant.visionScore,
    };
  }

  async getPlayerMatchHistory(dto) {
    try {
      const { summonerName, tag, count = 10 } = dto;
      const puuid = await this.getPuuidBySummonerName(summonerName, tag);
      const matchIds = await this.getMatchIdsByPuuid(puuid, count);

      const results = [];
      for (const matchId of matchIds) {
        try {
          const matchDetail = await this.getMatchDetail(matchId);
          const stats = this.getPlayerStats(matchDetail, summonerName, tag);
          results.push({
            matchId,
            gameStartTimestamp: matchDetail.info.gameStartTimestamp,
            gameDuration: matchDetail.info.gameDuration,
            queueId: matchDetail.info.queueId,
            ...stats,
          });
        } catch (error) {
          console.warn(`매치 ${matchId} 처리 중 오류:`, error.message);
          results.push({ matchId, error: error.message });
        }
      }
      return results;
    } catch (error) {
      console.error(`매치 히스토리 조회 실패 - ${dto?.summonerName}#${dto?.tag}:`, error.message);
      throw error;
    }
  }

  async getSummonerSeasonInfo(_summonerName, _tag) {
    throw new Error('시즌 정보 조회는 아직 구현되지 않았습니다');
  }
}

module.exports = { RiotAPIService };
