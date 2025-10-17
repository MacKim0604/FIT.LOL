import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { analysisApi } from '../lib/api.js';

export default function SummonerSummary() {
  const { token, analysisApiBase } = useConfig();
  const [puuid, setPuuid] = useState('');
  const [lookbackDays, setLookbackDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const fetchSummary = async (e) => {
    e && e.preventDefault();
    if (!puuid) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await analysisApi.summonerSummary(analysisApiBase, token, puuid, lookbackDays);
      setResult(data);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Summoner Summary</h2>
      <form onSubmit={fetchSummary} className="form">
        <div className="row">
          <input placeholder="PUUID" value={puuid} onChange={(e)=>setPuuid(e.target.value)} required />
          <input type="number" placeholder="lookbackDays" value={lookbackDays} min={1} max={180} onChange={(e)=>setLookbackDays(Number(e.target.value))} />
          <button type="submit" disabled={!token || !puuid || loading}>{loading ? 'Loading...' : 'Load'}</button>
          {!token && <span className="warn">Token not set. Go to Settings.</span>}
        </div>
      </form>
      {error && <pre className="error">{error}</pre>}
      {result && <pre className="code">{JSON.stringify(result, null, 2)}</pre>}
    </section>
  );
}
