// Riot API 연동 함수 (백엔드용)
const axios = require('axios');
require('dotenv').config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const RIOT_REGION = 'kr';
const RIOT_MATCH_REGION = 'asia';

async function getPuuidBySummonerName(summonerName) {
  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
  const res = await axios.get(url, {
    headers: { 'X-Riot-Token': RIOT_API_KEY }
  });
  return res.data.puuid;
}

async function getMatchIdsByPuuid(puuid, count = 1) {
  const url = `https://${RIOT_MATCH_REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
  const res = await axios.get(url, {
    headers: { 'X-Riot-Token': RIOT_API_KEY }
  });
  return res.data; // [matchId1, ...]
}

async function getMatchDetail(matchId) {
  const url = `https://${RIOT_MATCH_REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  const res = await axios.get(url, {
    headers: { 'X-Riot-Token': RIOT_API_KEY }
  });
  return res.data;
}

async function getLatestMatchBySummonerName(summonerName) {
  const puuid = await getPuuidBySummonerName(summonerName);
  const matchIds = await getMatchIdsByPuuid(puuid, 1);
  if (!matchIds.length) throw new Error('No matches found');
  const matchDetail = await getMatchDetail(matchIds[0]);
  return matchDetail;
}

module.exports = {
  getLatestMatchBySummonerName,
};
