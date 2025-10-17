const { prisma } = require('../db/client');

async function upsertSummonerByPuuid(puuid, fields = {}) {
  return prisma.summoner.upsert({
    where: { puuid },
    update: { ...fields },
    create: { puuid, ...fields },
  });
}

async function upsertMatch(detail) {
  const matchId = detail?.metadata?.matchId;
  const info = detail?.info || {};
  if (!matchId) throw new Error('matchId missing in detail');

  // Upsert match header
  const match = await prisma.match.upsert({
    where: { matchId },
    update: {
      gameStartTimestamp: info.gameStartTimestamp ? BigInt(info.gameStartTimestamp) : null,
      gameDuration: info.gameDuration ?? null,
      queueId: info.queueId ?? null,
      payload: detail,
    },
    create: {
      matchId,
      gameStartTimestamp: info.gameStartTimestamp ? BigInt(info.gameStartTimestamp) : null,
      gameDuration: info.gameDuration ?? null,
      queueId: info.queueId ?? null,
      payload: detail,
    },
  });

  // Participants
  const parts = Array.isArray(info.participants) ? info.participants : [];
  for (const p of parts) {
    const kda = `${p.kills ?? 0}/${p.deaths ?? 0}/${p.assists ?? 0}`;
    await prisma.matchParticipant.upsert({
      where: { matchId_puuid: { matchId, puuid: p.puuid || `${p.riotIdName}#${p.riotIdTagline}` } },
      update: {
        riotIdName: p.riotIdName || null,
        riotIdTagline: p.riotIdTagline || null,
        kills: p.kills ?? null,
        deaths: p.deaths ?? null,
        assists: p.assists ?? null,
        kda,
        championName: p.championName || null,
        win: p.win ?? null,
        totalDamageDealtToChampions: p.totalDamageDealtToChampions ?? null,
        goldEarned: p.goldEarned ?? null,
        totalMinionsKilled: p.totalMinionsKilled ?? null,
        visionScore: p.visionScore ?? null,
        teamPosition: p.teamPosition || null,
        lane: p.lane || null,
      },
      create: {
        matchId,
        puuid: p.puuid || `${p.riotIdName}#${p.riotIdTagline}`,
        riotIdName: p.riotIdName || null,
        riotIdTagline: p.riotIdTagline || null,
        kills: p.kills ?? null,
        deaths: p.deaths ?? null,
        assists: p.assists ?? null,
        kda,
        championName: p.championName || null,
        win: p.win ?? null,
        totalDamageDealtToChampions: p.totalDamageDealtToChampions ?? null,
        goldEarned: p.goldEarned ?? null,
        totalMinionsKilled: p.totalMinionsKilled ?? null,
        visionScore: p.visionScore ?? null,
        teamPosition: p.teamPosition || null,
        lane: p.lane || null,
      },
    });
  }

  return match;
}

async function updateCursor(puuid, { lastMatchId, lastMatchTimestamp, fetchedCount }) {
  return prisma.ingestionCursor.upsert({
    where: { puuid },
    update: {
      lastMatchId: lastMatchId ?? null,
      lastMatchTimestamp: lastMatchTimestamp ? BigInt(lastMatchTimestamp) : null,
      lastFetchedCount: typeof fetchedCount === 'number' ? fetchedCount : undefined,
    },
    create: {
      puuid,
      lastMatchId: lastMatchId ?? null,
      lastMatchTimestamp: lastMatchTimestamp ? BigInt(lastMatchTimestamp) : null,
      lastFetchedCount: typeof fetchedCount === 'number' ? fetchedCount : 0,
    },
  });
}

module.exports = { upsertSummonerByPuuid, upsertMatch, updateCursor };
