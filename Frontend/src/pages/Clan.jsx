import React, { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { userApi } from '../lib/api.js';

export default function Clan() {
  const { token, userApiBase } = useConfig();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('MEMBER');

  const load = async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const res = await userApi.clan.list(userApiBase, token);
      setMembers(res?.data?.members || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token, userApiBase]);

  const add = async (e) => {
    e.preventDefault(); setError('');
    try {
      await userApi.clan.add(userApiBase, token, { email, username, role });
      setEmail(''); setUsername(''); setRole('MEMBER');
      await load();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete member?')) return;
    try {
      await userApi.clan.remove(userApiBase, token, id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section>
      <h2>Clan Members</h2>
      <div className="row">
        <button onClick={load} disabled={loading || !token}>{loading ? 'Loading...' : 'Refresh'}</button>
        {!token && <span className="warn">Token not set. Go to Settings.</span>}
      </div>
      {error && <pre className="error">{error}</pre>}

      <form onSubmit={add} className="form">
        <div className="row">
          <input type="text" placeholder="username" value={username} onChange={(e)=>setUsername(e.target.value)} required />
          <input type="email" placeholder="email (optional)" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <select value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="MEMBER">MEMBER</option>
            <option value="LEADER">LEADER</option>
          </select>
          <button type="submit" disabled={!token || !username}>Add</button>
        </div>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Username</th><th>Email</th><th>Role</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map(m => (
            <tr key={m.id}>
              <td>{m.username}</td>
              <td>{m.email || '-'}</td>
              <td>{m.role}</td>
              <td>
                <button onClick={() => remove(m.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr><td colSpan={4} style={{textAlign:'center', color:'#64748b'}}>No members</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
