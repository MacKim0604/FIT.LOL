export async function http(base, token, path, options = {}) {
  const url = `${base.replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  let data = null;
  try {
    data = ct.includes('application/json') ? await res.json() : await res.text();
  } catch (_) {}
  if (!res.ok) {
    const msg = data && data.error && data.error.message ? data.error.message : res.statusText;
    const code = data && data.error && data.error.code ? data.error.code : 'HTTP_ERROR';
    throw new Error(`${res.status} ${code}: ${msg}`);
  }
  return data;
}

// User API
export const userApi = {
  authMe: (base, token) => http(base, token, '/auth/me'),
  clan: {
    list: (base, token) => http(base, token, '/clan/members'),
    add: (base, token, payload) => http(base, token, '/clan/members', { method: 'POST', body: JSON.stringify(payload) }),
    get: (base, token, userId) => http(base, token, `/clan/members/${encodeURIComponent(userId)}`),
    remove: (base, token, userId) => http(base, token, `/clan/members/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  },
  ingestion: {
    latest: (base, token, body) => http(base, token, '/ingestion/summoner/latest', { method: 'POST', body: JSON.stringify(body) }),
    full: (base, token, body) => http(base, token, '/ingestion/summoner/full', { method: 'POST', body: JSON.stringify(body) }),
    rankDaily: (base, token) => http(base, token, '/ingestion/rank/daily', { method: 'POST' }),
    reportWeekly: (base, token) => http(base, token, '/ingestion/report/weekly', { method: 'POST' }),
    job: (base, token, id) => http(base, token, `/ingestion/jobs/${encodeURIComponent(id)}`),
    summary: (base, token) => http(base, token, '/ingestion/summary'),
    config: (base, token) => http(base, token, '/ingestion/config'),
  }
};

// Analysis API
export const analysisApi = {
  summonerSummary: (base, token, puuid, lookbackDays = 30) =>
    http(base, token, `/analysis/summoner/${encodeURIComponent(puuid)}/summary?lookbackDays=${encodeURIComponent(lookbackDays)}`),
  globalWeekly: (base, token, { start, end } = {}) => {
    const qs = new URLSearchParams();
    if (start) qs.set('start', start);
    if (end) qs.set('end', end);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return http(base, token, `/analysis/global/weekly${suffix}`);
  },
  reportWeekly: (base, token) => http(base, token, '/analysis/report/weekly', { method: 'POST' }),
};
