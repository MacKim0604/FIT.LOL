import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY_TOKEN = 'fitlol.token';
const KEY_USER_BASE = 'fitlol.userApiBase';
const KEY_ANALYSIS_BASE = 'fitlol.analysisApiBase';

const defaultUserBase = import.meta.env.VITE_USER_API_BASE || 'http://localhost:3002/api/v1';
const defaultAnalysisBase = import.meta.env.VITE_ANALYSIS_API_BASE || 'http://localhost:3004/api/v1';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(KEY_TOKEN) || '');
  const [userApiBase, setUserApiBaseState] = useState(() => localStorage.getItem(KEY_USER_BASE) || defaultUserBase);
  const [analysisApiBase, setAnalysisApiBaseState] = useState(() => localStorage.getItem(KEY_ANALYSIS_BASE) || defaultAnalysisBase);

  const setToken = (t) => {
    setTokenState(t || '');
    if (t) localStorage.setItem(KEY_TOKEN, t); else localStorage.removeItem(KEY_TOKEN);
  };
  const setUserApiBase = (u) => {
    setUserApiBaseState(u);
    if (u) localStorage.setItem(KEY_USER_BASE, u);
  };
  const setAnalysisApiBase = (u) => {
    setAnalysisApiBaseState(u);
    if (u) localStorage.setItem(KEY_ANALYSIS_BASE, u);
  };

  const value = useMemo(() => ({ token, userApiBase, analysisApiBase, setToken, setUserApiBase, setAnalysisApiBase }), [token, userApiBase, analysisApiBase]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
