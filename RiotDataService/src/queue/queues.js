const { createQueue, createQueueScheduler } = require('./connection');

const INGEST_LATEST = 'ingest.summoner.latest';

const ingestLatestQueue = createQueue(INGEST_LATEST);
createQueueScheduler(INGEST_LATEST);

module.exports = { ingestLatestQueue, INGEST_LATEST };
