import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { userApi } from '../lib/api.js';

export default function Ingestion() {
  const { token, userApiBase } = useConfig();
  const [summonerName, setSummonerName] = useState('김동건');
  const [tag, setTag] = useState('DGKIM');
  const [count, setCount] = useState(5);
  const [jobId, setJobId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const triggerLatest = async (e) => {
    e.preventDefault(); setError(''); setResult(null);
    setLoading(true);
    try {
      const data = await userApi.ingestion.latest(userApiBase, token, { summonerName, tag, count });
      setResult(data);
      setJobId(data?.data?.jobId || '');
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  const checkJob = async () => {
    if (!jobId) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const data = await userApi.ingestion.job(userApiBase, token, jobId);
      setResult(data);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  const summary = async () => {
    setError(''); setResult(null); setLoading(true);
    try {
      const data = await userApi.ingestion.summary(userApiBase, token);
      setResult(data);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Ingestion (Admin)</h2>
      <form onSubmit={triggerLatest} className="form">
        <div className="row">
          <input placeholder="summonerName" value={summonerName} onChange={(e)=>setSummonerName(e.target.value)} required />
          <input placeholder="tag" value={tag} onChange={(e)=>setTag(e.target.value)} required />
          <input type="number" placeholder="count" value={count} min={1} max={50} onChange={(e)=>setCount(Number(e.target.value))} />
          <button type="submit" disabled={loading || !token}>Trigger Latest</button>
        </div>
      </form>
      <div className="row">
        <input placeholder="jobId" value={jobId} onChange={(e)=>setJobId(e.target.value)} />
        <button onClick={checkJob} disabled={!jobId || loading || !token}>Check Job</button>
        <button onClick={summary} disabled={loading || !token}>Queue Summary</button>
        {!token && <span className="warn">Leader token required.</span>}
      </div>
      {error && <pre className="error">{error}</pre>}
      {result && <pre className="code">{JSON.stringify(result, null, 2)}</pre>}
    </section>
  );
}
