const { createWorker } = require('../queue/connection');
const { INGEST_LATEST } = require('../queue/queues');
const { ingestSummonerLatest } = require('./processors/ingestLatest');

async function startWorkers() {
  createWorker(INGEST_LATEST, ingestSummonerLatest, {
    // per-queue limiter can be configured via Redis scripts or at queue add time
  }).on('failed', (job, err) => {
    console.error(`[Worker] Job ${job.id} failed:`, err.message);
  }).on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed:`, JSON.stringify(result));
  });
}

module.exports = { startWorkers };
