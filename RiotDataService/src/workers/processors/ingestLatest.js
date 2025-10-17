const { RiotClient } = require('../../services/riot.client');
const { upsertMatch, updateCursor, upsertSummonerByPuuid } = require('../../services/persist.service');

async function ingestSummonerLatest(job) {
  const { summonerName, tag, count = 10 } = job.data || {};
  if (!summonerName || !tag) throw new Error('summonerName and tag are required');

  const client = new RiotClient();

  job.updateProgress(1);
  const puuid = await client.getPuuidByRiotId(summonerName, tag);
  if (!puuid) throw new Error('PUUID not found');

  // ensure Summoner row exists
  await upsertSummonerByPuuid(puuid, { summonerName });

  job.updateProgress(5);
  const matchIds = await client.getMatchIdsByPuuid(puuid, count);

  let processed = 0;
  for (let i = 0; i < matchIds.length; i++) {
    const id = matchIds[i];
    try {
      const detail = await client.getMatchDetail(id);
      // persist detail into DB (matches, match_participants)
      await upsertMatch(detail);
      const duration = detail?.info?.gameDuration;
      const queueId = detail?.info?.queueId;
      job.log(`Fetched match ${id} (duration=${duration}, queueId=${queueId})`);
      processed++;
    } catch (e) {
      job.log(`Failed to fetch match ${id}: ${e.message}`);
    }
    const progress = 5 + Math.round(((i + 1) / Math.max(matchIds.length, 1)) * 95);
    await job.updateProgress(progress);
  }

  // update ingestion cursor
  const lastMatchId = matchIds[0] || null;
  let lastTs = null;
  try {
    if (lastMatchId) {
      const d = await client.getMatchDetail(lastMatchId);
      lastTs = d?.info?.gameStartTimestamp || null;
    }
  } catch {}
  await updateCursor(puuid, { lastMatchId, lastMatchTimestamp: lastTs, fetchedCount: processed });

  return { puuid, total: matchIds.length, processed, lastMatchId, lastMatchTimestamp: lastTs };
}

module.exports = { ingestSummonerLatest };
