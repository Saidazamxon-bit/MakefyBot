import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setCsrfToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | guest | user | admin
  const [user, setUser] = useState(null);

  const refresh = useCallback(async () => {
    const data = await api.get('/auth/me.php');
    setCsrfToken(data.csrfToken);
    if (!data.authenticated) {
      setStatus('guest');
      setUser(null);
    } else if (data.role === 'admin') {
      setStatus('admin');
      setUser(null);
    } else {
      setStatus('user');
      setUser(data.user);
    }
    return data;
  }, []);

  useEffect(() => {
    refresh().catch(() => setStatus('guest'));
  }, [refresh]);

  const login = useCallback(async (loginName, pass) => {
    const data = await api.post('/auth/login.php', { login: loginName, pass });
    await refresh();
    return data;
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.post('/auth/logout.php');
    setStatus('guest');
    setUser(null);
  }, []);

  const updateBalance = useCallback((newBalance) => {
    setUser((u) => (u ? { ...u, pul: newBalance } : u));
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, logout, refresh, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
