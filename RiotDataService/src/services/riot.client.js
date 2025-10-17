const axios = require('axios');

class RiotClient {
  constructor() {
    this.apiKey = process.env.RIOT_API_KEY || '';
    this.matchRegion = 'asia';
    this.headers = {
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Charset': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': 'https://developer.riotgames.com',
      'X-Riot-Token': this.apiKey,
      'User-Agent': 'FIT.LOL/RiotDataService v1.0.3',
    };
    this.timeout = Number(process.env.RIOT_HTTP_TIMEOUT_MS || 10000);
  }

  async get(url) {
    try {
      return await axios.get(url, { headers: this.headers, timeout: this.timeout });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 429) throw new Error('Riot API rate limit (429)');
      if (status === 503) throw new Error('Riot API unavailable (503)');
      throw error;
    }
  }

  async getPuuidByRiotId(name, tag) {
    const url = `https://${this.matchRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${tag}`;
    const res = await this.get(url);
    return res.data?.puuid;
  }

  async getMatchIdsByPuuid(puuid, count = 20) {
    const url = `https://${this.matchRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${Math.min(count, 100)}`;
    const res = await this.get(url);
    return res.data || [];
  }

  async getMatchDetail(matchId) {
    const url = `https://${this.matchRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const res = await this.get(url);
    return res.data;
  }
}

module.exports = { RiotClient };
