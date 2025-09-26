// Riot API 연동 함수 (백엔드용)
const axios = require('axios');
require('dotenv').config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const RIOT_REGION = 'kr';
const RIOT_MATCH_REGION = 'asia';
const REQUEST_HEADERS = {
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
  "Origin": "https://developer.riotgames.com",
  'X-Riot-Token': RIOT_API_KEY
}

async function getPuuidBySummonerName(name, tag) {
  const url = `https://${RIOT_MATCH_REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${tag}`;
  const res = await axios.get(url, {
    headers: REQUEST_HEADERS
  });
  return res.data.puuid;
}

async function getMatchIdsByPuuid(puuid, count = 1) {
  const url = `https://${RIOT_MATCH_REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
  const res = await axios.get(url, {
    headers: REQUEST_HEADERS
  });
  return res.data; // [matchId1, ...]
}

async function getMatchDetail(matchId) {
  const url = `https://${RIOT_MATCH_REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  const res = await axios.get(url, {
    headers: REQUEST_HEADERS
  });
  return res.data;
}

async function getLatestMatchBySummonerName(summonerName, tag) {
  const puuid = await getPuuidBySummonerName(summonerName, tag);
  const matchIds = await getMatchIdsByPuuid(puuid, 1);
  if (!matchIds.length) throw new Error('No matches found');
  const matchDetail = await getMatchDetail(matchIds[0]);
  return matchDetail;
}

function getKDA(matchDetail, summonerName, tag) {
  const participant = matchDetail.info.participants.find(p => (p.riotIdGameName === summonerName) && (p.riotIdTagline === tag));
  if (!participant) throw new Error('No participant found');
  const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
  return kda;
}

module.exports = {
  getLatestMatchBySummonerName,
  getPuuidBySummonerName,
  getMatchIdsByPuuid,
  getMatchDetail,
  getKDA,
};
