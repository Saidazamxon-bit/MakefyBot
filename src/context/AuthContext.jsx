import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setCsrfToken, ApiError } from '../lib/api';

const AuthContext = createContext(null);

// Telegram Web (brauzer versiyasi: web.telegram.org) shu platform
// qiymatlarini beradi — bularga ruxsat berilmaydi, faqat native
// ilova (Android/iOS/macOS/Desktop) orqali ochilganda ishlaydi.
const WEB_PLATFORMS = ['web', 'weba', 'webk'];

function getTelegramWebApp() {
  return window.Telegram?.WebApp || null;
}

export function AuthProvider({ children }) {
  // loading | guest | user | admin | no_telegram | web_client | not_registered
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');

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

  // Ilova faqat Telegram'ning NATIVE ilovasi ichida ishlaydi — login/parol
  // o'rniga Telegram.WebApp.initData avtomatik yuboriladi va serverda
  // tekshiriladi. Telegram Web (brauzer versiyasi) ataylab bloklanadi.
  const loginWithTelegram = useCallback(async () => {
    const tg = getTelegramWebApp();
    const initData = tg?.initData || '';
    const platform = tg?.platform || '';

    if (WEB_PLATFORMS.includes(platform)) {
      setStatus('web_client');
      return;
    }
    if (!initData) {
      setStatus('no_telegram');
      return;
    }
    try {
      await api.post('/auth/telegram.php', { initData });
      await refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NOT_REGISTERED') {
        setStatus('not_registered');
      } else {
        setAuthError(err instanceof ApiError ? err.message : 'Kirishda xatolik yuz berdi.');
        setStatus('no_telegram');
      }
    }
  }, [refresh]);

  useEffect(() => {
    (async () => {
      try {
        const data = await refresh();
        if (!data.authenticated) {
          await loginWithTelegram();
        }
      } catch {
        await loginWithTelegram();
      }
    })();
    // Faqat ilk yuklanishda ishga tushadi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout.php');
    setStatus('guest');
    setUser(null);
  }, []);

  const updateBalance = useCallback((newBalance) => {
    setUser((u) => (u ? { ...u, pul: newBalance } : u));
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, user, authError, logout, refresh, updateBalance, loginWithTelegram }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
