import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';

const BOT_LINK = 'https://t.me/Makefybot';

export default function Login() {
  const { status, authError } = useAuth();
  const navigate = useNavigate();

  // Admin uchun yashirin kirish — oddiy foydalanuvchilar buni ko'rmaydi/ishlatmaydi
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminLogin, setAdminLogin] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (status === 'user') navigate('/', { replace: true });
    if (status === 'admin') navigate('/admin', { replace: true });
  }, [status, navigate]);

  async function handleAdminSubmit(e) {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);
    try {
      const data = await api.post('/auth/login.php', { login: adminLogin.trim(), pass: adminPass });
      navigate(data.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Kirishda xatolik yuz berdi.');
    } finally {
      setAdminLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-bg text-text-muted">
        <span className="w-9 h-9 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Telegram orqali tekshirilmoqda...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-bg">
      <div className="w-full max-w-sm bg-surface border border-border rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)] text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-accent-soft text-accent flex items-center justify-center text-2xl">
          <i className="fa-brands fa-telegram" />
        </div>
        <h2 className="text-lg font-extrabold">Faqat Telegram orqali</h2>

        {status === 'not_registered' ? (
          <p className="text-sm text-text-muted mt-2">
            Hisobingiz topilmadi. Avval botga <b>/start</b> bosing, keyin ilovani qayta oching.
          </p>
        ) : status === 'web_client' ? (
          <p className="text-sm text-text-muted mt-2">
            Telegram veb-versiyasida (web.telegram.org) ishlamaydi. Telefoningizdagi yoki
            kompyuteringizdagi <b>Telegram ilovasi</b>da oching.
          </p>
        ) : (
          <p className="text-sm text-text-muted mt-2">
            Bu ilova brauzerda emas, faqat Telegram bot ichida ishlaydi. Pastdagi tugma orqali
            botni oching va u yerdan &quot;Web ilova&quot; tugmasini bosing.
          </p>
        )}

        {authError && (
          <div className="text-[13px] font-semibold text-danger bg-danger-soft rounded-[var(--radius-sm)] px-3 py-2 mt-3">
            {authError}
          </div>
        )}

        <a
          href={BOT_LINK}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-extrabold text-[15px]"
        >
          <i className="fa-brands fa-telegram" />
          Botni ochish
        </a>

        <button
          type="button"
          onClick={() => setShowAdmin((v) => !v)}
          className="mt-6 text-[11px] text-text-dim underline underline-offset-2"
        >
          Admin kirish
        </button>

        {showAdmin && (
          <form onSubmit={handleAdminSubmit} autoComplete="off" className="space-y-3 mt-3 text-left">
            <input
              type="text"
              value={adminLogin}
              onChange={(e) => setAdminLogin(e.target.value)}
              placeholder="Admin login"
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border text-[14px] outline-none focus:border-accent transition-colors"
            />
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Parol"
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border text-[14px] outline-none focus:border-accent transition-colors"
            />
            {adminError && (
              <div className="text-[12px] font-semibold text-danger">{adminError}</div>
            )}
            <button
              type="submit"
              disabled={adminLoading}
              className="w-full py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-[13px] disabled:opacity-60"
            >
              {adminLoading ? 'Tekshirilmoqda...' : 'Kirish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
