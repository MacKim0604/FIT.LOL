import React from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { ConfigProvider } from './context/ConfigContext.jsx';
import Settings from './pages/Settings.jsx';
import AuthMe from './pages/AuthMe.jsx';
import Clan from './pages/Clan.jsx';
import Ingestion from './pages/Ingestion.jsx';
import SummonerSummary from './pages/SummonerSummary.jsx';
import GlobalWeekly from './pages/GlobalWeekly.jsx';

function Nav() {
  const active = ({ isActive }) => ({ color: isActive ? '#fff' : '#cbd5e1', background: isActive ? '#0ea5e9' : 'transparent', padding: '6px 10px', borderRadius: 6, textDecoration: 'none' });
  return (
    <header className="topbar">
      <div className="logo"><Link to="/">FIT.LOL</Link></div>
      <nav className="nav">
        <NavLink to="/auth" style={active}>Auth</NavLink>
        <NavLink to="/clan" style={active}>Clan</NavLink>
        <NavLink to="/ingestion" style={active}>Ingestion</NavLink>
        <NavLink to="/analysis/summoner" style={active}>Summoner</NavLink>
        <NavLink to="/analysis/weekly" style={active}>Weekly</NavLink>
        <NavLink to="/settings" style={active}>Settings</NavLink>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <div className="layout">
        <Nav />
        <main className="content">
          <Routes>
            <Route path="/" element={<AuthMe />} />
            <Route path="/auth" element={<AuthMe />} />
            <Route path="/clan" element={<Clan />} />
            <Route path="/ingestion" element={<Ingestion />} />
            <Route path="/analysis/summoner" element={<SummonerSummary />} />
            <Route path="/analysis/weekly" element={<GlobalWeekly />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </ConfigProvider>
  );
}
