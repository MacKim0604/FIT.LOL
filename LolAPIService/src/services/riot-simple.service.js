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
    const url = `https://${this.matchRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${tag}`;
    const res = await this.requestGet(url);
    if (!res.data?.puuid) throw new Error('PUUID를 찾을 수 없습니다');
    return res.data.puuid;
  }

  async getMatchIdsByPuuid(puuid, count = 20) {
    const url = `https://${this.matchRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${Math.min(count, 100)}`;
    const res = await this.requestGet(url);
    return res.data || [];
  }

  async getMatchDetail(matchId) {
    const url = `https://${this.matchRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const res = await this.requestGet(url);
    return res.data;
  }

  async getLatestMatchBySummonerName(summonerName, tag) {
    const puuid = await this.getPuuidBySummonerName(summonerName, tag);
    const matchIds = await this.getMatchIdsByPuuid(puuid, 1);
    if (!matchIds.length) throw new Error('매치 기록이 없습니다');
    return await this.getMatchDetail(matchIds[0]);
  }

  getPlayerStats(matchDetail, summonerName, tag) {
    const p = matchDetail?.info?.participants?.find(
      (x) => x.riotIdName === summonerName && x.riotIdTagline === tag
    );
    if (!p) throw new Error('해당 소환사의 참가자 정보를 찾을 수 없습니다');
    return {
      kills: p.kills, deaths: p.deaths, assists: p.assists,
      kda: `${p.kills}/${p.deaths}/${p.assists}`,
      championName: p.championName, win: p.win,
      totalDamageDealtToChampions: p.totalDamageDealtToChampions,
      goldEarned: p.goldEarned, totalMinionsKilled: p.totalMinionsKilled,
      visionScore: p.visionScore,
    };
  }

  async getPlayerMatchHistory({ summonerName, tag, count = 10 }) {
    const puuid = await this.getPuuidBySummonerName(summonerName, tag);
    const matchIds = await this.getMatchIdsByPuuid(puuid, count);
    const items = [];
    for (const id of matchIds) {
      try {
        const detail = await this.getMatchDetail(id);
        const stats = this.getPlayerStats(detail, summonerName, tag);
        items.push({
          matchId: id,
          gameStartTimestamp: detail.info.gameStartTimestamp,
          gameDuration: detail.info.gameDuration,
          queueId: detail.info.queueId,
          ...stats,
        });
      } catch (e) {
        items.push({ matchId: id, error: e.message });
      }
    }
    return items;
  }
}

module.exports = { RiotAPIService };