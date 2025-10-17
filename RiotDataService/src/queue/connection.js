const { Worker, Queue, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

function createQueue(name) {
  const prefix = process.env.QUEUE_PREFIX || 'fitlol';
  return new Queue(name, { connection, prefix });
}

function createQueueScheduler(name) {
  const prefix = process.env.QUEUE_PREFIX || 'fitlol';
  return new QueueScheduler(name, { connection, prefix });
}

function createWorker(name, processor, opts = {}) {
  const prefix = process.env.QUEUE_PREFIX || 'fitlol';
  const concurrency = Number(process.env.BULLMQ_CONCURRENCY || 5);
  return new Worker(name, processor, { connection, prefix, concurrency, ...opts });
}

module.exports = { connection, createQueue, createQueueScheduler, createWorker };
