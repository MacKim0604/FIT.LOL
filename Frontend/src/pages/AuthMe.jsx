import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { userApi } from '../lib/api.js';

export default function AuthMe() {
  const { token, userApiBase } = useConfig();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchMe = async () => {
    setLoading(true); setError('');
    try {
      const res = await userApi.authMe(userApiBase, token);
      setData(res);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Auth - Me</h2>
      <p>Uses `GET /api/v1/auth/me` from UserService. Set token in Settings.</p>
      <div className="row">
        <button onClick={fetchMe} disabled={loading || !token}>{loading ? 'Loading...' : 'Fetch Me'}</button>
        {!token && <span className="warn">Token not set. Go to Settings.</span>}
      </div>
      {error && <pre className="error">{error}</pre>}
      {data && <pre className="code">{JSON.stringify(data, null, 2)}</pre>}
    </section>
  );
}
