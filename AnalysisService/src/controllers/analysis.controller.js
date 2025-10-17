const { query } = require('../db/pg');

function toMsString(d) {
  return String(d instanceof Date ? d.getTime() : d);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoToDateOrNull(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function lastCompletedWeekRange(now = new Date()) {
  // Return last Monday 00:00:00 to this Monday 00:00:00
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (day + 6) % 7;
  const end = startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceMonday)); // this Monday 00:00
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 7);
  return { start, end };
}

class AnalysisController {
  async summonerSummary(req, res) {
    try {
      const { puuid } = req.params;
      const lookbackDays = Math.max(1, parseInt(req.query.lookbackDays || '30', 10));
      const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

      const baseParams = [puuid, toMsString(since)];

      // Aggregate stats
      const aggSql = `
        SELECT 
          COUNT(*)::int                       AS games,
          COALESCE(SUM(CASE WHEN mp.win THEN 1 ELSE 0 END),0)::int AS wins,
          COALESCE(SUM(mp.kills),0)::int      AS kills,
          COALESCE(SUM(mp.deaths),0)::int     AS deaths,
          COALESCE(SUM(mp.assists),0)::int    AS assists,
          COALESCE(AVG(mp.totalDamageDealtToChampions),0)::float AS avg_damage,
          COALESCE(AVG(mp.goldEarned),0)::float AS avg_gold,
          COALESCE(AVG(mp.totalMinionsKilled),0)::float AS avg_cs,
          COALESCE(AVG(mp.visionScore),0)::float AS avg_vision
        FROM "MatchParticipant" mp
        JOIN "Match" m ON m."matchId" = mp."matchId"
        WHERE mp.puuid = $1 AND (m."gameStartTimestamp" IS NULL OR m."gameStartTimestamp" >= $2::bigint)
      `;
      const agg = (await query(aggSql, baseParams)).rows[0] || {};

      const games = agg.games || 0;
      const wins = agg.wins || 0;
      const losses = Math.max(0, games - wins);
      const kda = (agg.kills + agg.assists) / Math.max(1, agg.deaths);

      // Top champions
      const champsSql = `
        SELECT 
          COALESCE(mp."championName", 'Unknown') AS champion,
          COUNT(*)::int AS games,
          COALESCE(SUM(CASE WHEN mp.win THEN 1 ELSE 0 END),0)::int AS wins
        FROM "MatchParticipant" mp
        JOIN "Match" m ON m."matchId" = mp."matchId"
        WHERE mp.puuid = $1 AND (m."gameStartTimestamp" IS NULL OR m."gameStartTimestamp" >= $2::bigint)
        GROUP BY champion
        ORDER BY games DESC
        LIMIT 5
      `;
      const champions = (await query(champsSql, baseParams)).rows.map(r => ({
        champion: r.champion,
        games: r.games,
        wins: r.wins,
        winRate: games > 0 ? Math.round((r.wins / r.games) * 1000) / 10 : 0,
      }));

      return res.status(200).json({
        success: true,
        data: {
          puuid,
          lookbackDays,
          games,
          wins,
          losses,
          winRate: games > 0 ? Math.round((wins / games) * 1000) / 10 : 0,
          kda: Math.round(kda * 100) / 100,
          averages: {
            damage: Math.round((agg.avg_damage || 0) * 10) / 10,
            gold: Math.round((agg.avg_gold || 0) * 10) / 10,
            cs: Math.round((agg.avg_cs || 0) * 10) / 10,
            vision: Math.round((agg.avg_vision || 0) * 10) / 10,
          },
          topChampions: champions,
        }
      });
    } catch (e) {
      console.error('[AnalysisService] summonerSummary error:', e);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to compute summary', details: e.message } });
    }
  }

  async globalWeekly(req, res) {
    try {
      const start = isoToDateOrNull(req.query.start);
      const end = isoToDateOrNull(req.query.end);
      const range = start && end ? { start, end } : lastCompletedWeekRange();

      const params = [toMsString(range.start), toMsString(range.end)];

      const aggSql = `
        SELECT 
          COUNT(DISTINCT m."matchId")::int                               AS matches,
          COUNT(*)::int                                                    AS participants,
          COALESCE(AVG(m."gameDuration"),0)::float                        AS avg_game_duration,
          COALESCE(SUM(CASE WHEN mp.win THEN 1 ELSE 0 END),0)::int         AS wins,
          COALESCE(SUM(mp.kills),0)::int                                   AS kills,
          COALESCE(SUM(mp.deaths),0)::int                                  AS deaths,
          COALESCE(SUM(mp.assists),0)::int                                 AS assists
        FROM "MatchParticipant" mp
        JOIN "Match" m ON m."matchId" = mp."matchId"
        WHERE (m."gameStartTimestamp" IS NULL OR (m."gameStartTimestamp" >= $1::bigint AND m."gameStartTimestamp" < $2::bigint))
      `;
      const agg = (await query(aggSql, params)).rows[0] || {};
      const kda = (agg.kills + agg.assists) / Math.max(1, agg.deaths);

      const topSql = `
        SELECT COALESCE(mp."championName", 'Unknown') AS champion,
               COUNT(*)::int AS picks,
               COALESCE(SUM(CASE WHEN mp.win THEN 1 ELSE 0 END),0)::int AS wins
        FROM "MatchParticipant" mp
        JOIN "Match" m ON m."matchId" = mp."matchId"
        WHERE (m."gameStartTimestamp" IS NULL OR (m."gameStartTimestamp" >= $1::bigint AND m."gameStartTimestamp" < $2::bigint))
        GROUP BY champion
        ORDER BY picks DESC
        LIMIT 10
      `;
      const topChampions = (await query(topSql, params)).rows.map(r => ({
        champion: r.champion,
        picks: r.picks,
        winRate: r.picks > 0 ? Math.round((r.wins / r.picks) * 1000) / 10 : 0,
      }));

      return res.status(200).json({
        success: true,
        data: {
          range: { start: range.start.toISOString(), end: range.end.toISOString() },
          matches: agg.matches || 0,
          participants: agg.participants || 0,
          avgGameDuration: Math.round((agg.avg_game_duration || 0) * 10) / 10,
          kda: Math.round(kda * 100) / 100,
          topChampions,
        }
      });
    } catch (e) {
      console.error('[AnalysisService] globalWeekly error:', e);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to compute weekly', details: e.message } });
    }
  }

  async reportWeekly(req, res) {
    try {
      const { start, end } = lastCompletedWeekRange();
      // For now, reuse globalWeekly logic
      req.query.start = start.toISOString().slice(0, 10);
      req.query.end = end.toISOString().slice(0, 10);
      return this.globalWeekly(req, res);
    } catch (e) {
      console.error('[AnalysisService] reportWeekly error:', e);
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate weekly report', details: e.message } });
    }
  }
}

module.exports = { AnalysisController };
