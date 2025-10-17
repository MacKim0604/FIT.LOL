import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { analysisApi } from '../lib/api.js';

function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

export default function GlobalWeekly() {
  const { token, analysisApiBase } = useConfig();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const load = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await analysisApi.globalWeekly(analysisApiBase, token, { start, end });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const lastWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const daysSinceMonday = (day + 6) % 7;
    const endD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
    const startD = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate() - 7);
    setStart(toYmd(startD));
    setEnd(toYmd(endD));
  };

  return (
    <section>
      <h2>Global Weekly</h2>
      <div className="row">
        <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} />
        <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} />
        <button onClick={load} disabled={loading || !token}>{loading ? 'Loading...' : 'Load'}</button>
        <button onClick={lastWeek}>Last Week</button>
        {!token && <span className="warn">Leader token required.</span>}
      </div>
      {error && <pre className="error">{error}</pre>}
      {result && <pre className="code">{JSON.stringify(result, null, 2)}</pre>}
    </section>
  );
}
