const { Router } = require('express');
const { ingestLatestQueue } = require('../queue/queues');

const ingestionRouter = Router();

// POST /ingestion/summoner/latest
// body: { summonerName, tag, count?, force? }
ingestionRouter.post('/summoner/latest', async (req, res, next) => {
  try {
    const { summonerName, tag, count = Number(process.env.INGESTION_MAX_MATCHES_PER_RUN || 10), force = false } = req.body || {};
    if (!summonerName || !tag) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'summonerName and tag are required' } });
    }

    const job = await ingestLatestQueue.add(
      'ingest.summoner.latest',
      { summonerName, tag, count, force, requestedBy: req.user?.sub || 'system' },
      {
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: 100,
      }
    );

    return res.status(202).json({ success: true, data: { jobId: job.id, type: 'ingest.summoner.latest' } });
  } catch (e) {
    next(e);
  }
});

// GET /ingestion/jobs/:id
ingestionRouter.get('/jobs/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const job = await ingestLatestQueue.getJob(id);
    if (!job) return res.status(404).json({ success: false, error: { code: 'JOB_NOT_FOUND', message: 'Job not found' } });

    const state = await job.getState();
    const progress = job.progress || 0;
    return res.status(200).json({ success: true, data: { id, state, progress, name: job.name, attemptsMade: job.attemptsMade, failedReason: job.failedReason || null } });
  } catch (e) {
    next(e);
  }
});

// GET /ingestion/summary
ingestionRouter.get('/summary', async (_req, res, next) => {
  try {
    const counts = await ingestLatestQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');
    return res.status(200).json({ success: true, data: { counts } });
  } catch (e) {
    next(e);
  }
});

// GET /ingestion/config
ingestionRouter.get('/config', async (_req, res) => {
  const safe = {
    QUEUE_PREFIX: process.env.QUEUE_PREFIX || 'fitlol',
    BULLMQ_CONCURRENCY: Number(process.env.BULLMQ_CONCURRENCY || 5),
    INGESTION_MAX_MATCHES_PER_RUN: Number(process.env.INGESTION_MAX_MATCHES_PER_RUN || 10),
    SCHEDULE_ENABLE: String(process.env.SCHEDULE_ENABLE || false),
  };
  return res.status(200).json({ success: true, data: safe });
});

module.exports = { ingestionRouter };
