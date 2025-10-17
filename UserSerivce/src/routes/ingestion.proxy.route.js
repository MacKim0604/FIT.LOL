const { Router } = require('express');

// Proxy Admin ingestion endpoints to RiotDataService
// Requires server-level authenticate + requireRole('LEADER') when mounted
const ingestionProxyRouter = Router();

const BASE = (process.env.RIOT_DATA_SERVICE_BASE_URL || 'http://localhost:3003/api/v1').replace(/\/+$/, '');

function buildUrl(path) {
  return `${BASE}/${String(path).replace(/^\/+/, '')}`;
}

async function relay(req, res, targetPath, init = {}) {
  try {
    const url = buildUrl(targetPath);
    const headers = {
      'Authorization': req.headers.authorization || '',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    };

    const r = await fetch(url, { method: init.method || 'GET', headers, body: init.body ? JSON.stringify(init.body) : undefined });
    const ct = (r.headers.get('content-type') || '').toLowerCase();

    if (ct.includes('application/json')) {
      const data = await r.json();
      return res.status(r.status).json(data);
    } else {
      const text = await r.text();
      return res.status(r.status).send(text);
    }
  } catch (e) {
    console.error('[UserService] Proxy error to RiotDataService:', e.message);
    return res.status(503).json({ success: false, error: { code: 'QUEUE_UNAVAILABLE', message: 'RiotDataService unavailable', details: e.message } });
  }
}

// POST /ingestion/summoner/latest
ingestionProxyRouter.post('/summoner/latest', async (req, res) => {
  return relay(req, res, '/ingestion/summoner/latest', { method: 'POST', body: req.body || {} });
});

// POST /ingestion/summoner/full
ingestionProxyRouter.post('/summoner/full', async (req, res) => {
  return relay(req, res, '/ingestion/summoner/full', { method: 'POST', body: req.body || {} });
});

// POST /ingestion/rank/daily
ingestionProxyRouter.post('/rank/daily', async (req, res) => {
  return relay(req, res, '/ingestion/rank/daily', { method: 'POST', body: req.body || {} });
});

// POST /ingestion/report/weekly
ingestionProxyRouter.post('/report/weekly', async (req, res) => {
  return relay(req, res, '/ingestion/report/weekly', { method: 'POST', body: req.body || {} });
});

// GET /ingestion/jobs/:id
ingestionProxyRouter.get('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  return relay(req, res, `/ingestion/jobs/${encodeURIComponent(id)}`);
});

// GET /ingestion/summary
ingestionProxyRouter.get('/summary', async (req, res) => {
  return relay(req, res, '/ingestion/summary');
});

// GET /ingestion/config
ingestionProxyRouter.get('/config', async (req, res) => {
  return relay(req, res, '/ingestion/config');
});

module.exports = { ingestionProxyRouter };
