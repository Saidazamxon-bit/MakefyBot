import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';

export default function BotDetail() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [newToken, setNewToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setError('');
    api
      .get(`/mybots/detail.php?useri=${encodeURIComponent(username)}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [username]);

  async function handleTokenChange(e) {
    e.preventDefault();
    if (!confirm('Token almashtirilsinmi?')) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/mybots/actions.php', {
        amal: 'token_almashtir',
        eski_user: username,
        yangi_token: newToken,
      });
      setMessage(res.message);
      setNewToken('');
      if (res.botUser && res.botUser !== username) {
        navigate(`/bots/${res.botUser}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <div className="text-center py-10">
        <p className="text-danger font-semibold text-sm mb-3">{error}</p>
        <Link to="/bots" className="text-accent font-bold text-sm">
          ← Botlarimga qaytish
        </Link>
      </div>
    );
  }
  if (!data) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-accent-soft text-accent flex items-center justify-center text-lg">
          <i className="fa-solid fa-gear" />
        </div>
        <h2 className="font-extrabold text-lg">Botingizni sozlang</h2>
      </div>

      {message && (
        <div className="text-[13px] font-semibold text-accent bg-accent-soft rounded-[var(--radius-sm)] px-3 py-2 mb-4">
          {message}
        </div>
      )}
      {error && (
        <div className="text-[13px] font-semibold text-danger bg-danger-soft rounded-[var(--radius-sm)] px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="rounded-[var(--radius-md)] bg-surface border border-border p-4 divide-y divide-border mb-4">
        <InfoRow icon="fa-satellite-dish" label="Bot turi" value={data.turi} />
        <InfoRow icon="fa-at" label="Bot useri" value={`@${data.botUser}`} />
        <InfoRow icon="fa-hourglass-half" label="To'langan sana" value={`${data.kun} kun`} />
      </div>

      {data.isV2 && (
        <Link
          to={`/bots/${username}/manage`}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-extrabold text-sm mb-4"
        >
          <i className="fa-solid fa-sliders" /> Botni sozlash
        </Link>
      )}

      <Link
        to={`/bots/${username}/kunlik`}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm mb-4"
      >
        <i className="fa-solid fa-hourglass-half" /> Kunlik to'lov
      </Link>

      {data.canChangeToken ? (
        <div className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
          <div className="font-bold text-sm flex items-center gap-1.5 mb-1">
            <i className="fa-solid fa-key text-accent" /> Token yangilash
          </div>
          <p className="text-[12px] text-text-muted mb-3">
            Tarifingizda ruxsat etilgan. Komissiya olinmaydi. Yangi token tekshiriladi va ma'lumotlar ko'chiriladi.
          </p>
          <form onSubmit={handleTokenChange} className="space-y-2">
            <input
              type="text"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="Yangi Bot Token"
              required
              className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent"
            />
            <button
              disabled={busy}
              className="w-full py-2.5 rounded-[var(--radius-sm)] bg-surface-3 border border-border font-bold text-sm disabled:opacity-50"
            >
              <i className="fa-solid fa-arrows-rotate mr-1.5" /> Tokenni almashtirish
            </button>
          </form>
        </div>
      ) : (
        <div className="text-[12.5px] text-warn bg-warn-soft rounded-[var(--radius-sm)] px-3 py-2.5">
          <i className="fa-solid fa-lock mr-1.5" />
          Token yangilash joriy tarifingizda yoqilmagan. Admin belgilagan tarifni tanlang.
        </div>
      )}

      <Link to="/bots" className="block text-center mt-5 text-sm font-bold text-text-muted">
        ← Orqaga
      </Link>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="flex items-center gap-2 text-text-muted font-semibold">
        <i className={`fa-solid ${icon} w-4`} /> {label}
      </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
