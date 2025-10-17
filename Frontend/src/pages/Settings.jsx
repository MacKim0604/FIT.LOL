import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

export default function Settings() {
  const { token, userApiBase, analysisApiBase, setToken, setUserApiBase, setAnalysisApiBase } = useConfig();
  const [t, setT] = useState(token);
  const [uBase, setUBase] = useState(userApiBase);
  const [aBase, setABase] = useState(analysisApiBase);

  const save = (e) => {
    e.preventDefault();
    setToken(t);
    setUserApiBase(uBase);
    setAnalysisApiBase(aBase);
    alert('Saved');
  };

  const clear = () => {
    setToken('');
    setT('');
  };

  return (
    <section>
      <h2>Settings</h2>
      <form onSubmit={save} className="form">
        <label>
          Bearer Token
          <input type="text" value={t} onChange={(e) => setT(e.target.value)} placeholder="Paste access token" />
        </label>
        <div className="row">
          <button type="button" onClick={clear}>Clear Token</button>
        </div>
        <label>
          User API Base
          <input type="text" value={uBase} onChange={(e) => setUBase(e.target.value)} />
        </label>
        <label>
          Analysis API Base
          <input type="text" value={aBase} onChange={(e) => setABase(e.target.value)} />
        </label>
        <div className="row">
          <button type="submit">Save</button>
        </div>
      </form>
      <p className="hint">Tip: Set CORS_ORIGIN to http://localhost:5173 in backend envs.</p>
    </section>
  );
}
