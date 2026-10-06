import BroadcastProgress from '../components/BroadcastProgress';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { formatMoney } from '../lib/format';

export default function BotDetail() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [newToken, setNewToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [cred, setCred] = useState(null);
  const [bcText, setBcText] = useState('');
  const [batchId, setBatchId] = useState(null);

  useEffect(() => {
    setError('');
    api
      .get(`/mybots/detail.php?useri=${encodeURIComponent(username)}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [username]);

  async function handleTokenChange(event) {
    event.preventDefault();
    if (!confirm('Token almashtirilsinmi?')) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const result = await api.post('/mybots/actions.php', {
        amal: 'token_almashtir',
        eski_user: username,
        yangi_token: newToken,
      });
      setMessage(result.message);
      setNewToken('');
      if (result.botUser && result.botUser !== username) {
        navigate(`/bots/${result.botUser}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  async function resetAdmin() {
    if (!confirm('Yangi admin paroli yaratilsinmi? Eskisi ishlamay qoladi.')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await api.post('/mybots/actions.php', { amal: 'admin_parol_tiklash', bot_user: username });
      setCred(r.credentials); setMessage(r.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally { setBusy(false); }
  }

  async function sendBroadcast(event) {
    event.preventDefault();
    if (!bcText.trim() || !confirm('Barcha foydalanuvchilarga xabar yuborilsinmi?')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await api.post('/bots/broadcast.php', { useri: username, matn: bcText.trim() });
      setMessage(r.message); setBcText(''); setBatchId(r.batchId || null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Yuborib bo‘lmadi.');
    } finally { setBusy(false); }
  }

  const stats = useMemo(() => getStats(data), [data]);

  if (error && !data) {
    return (
      <div className="mf-page--error">
        <div className="mf-error-card">
          <span><i className="fa-solid fa-wifi" /></span>
          <h1>Botni yuklab bo‘lmadi</h1>
          <p>{error}</p>
          <Link to="/bots" className="mf-button mf-button--primary">← Botlarimga qaytish</Link>
        </div>
      </div>
    );
  }
  if (!data) return <DetailSkeleton />;

  const isActive = data.faol ?? data.active ?? data.status === 'active';
  const botUrl = `https://t.me/${String(data.botUser || username).replace(/^@/, '')}`;

  return (
    <div className="mf-page mf-page--bot-detail">
      <header className="mf-detail-head">
        <div className="mf-detail-head__identity">
          <Link to="/bots" className="mf-icon-button" aria-label="Botlarga qaytish">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="mf-bot-avatar"><i className="fa-solid fa-robot" /></div>
          <div>
            <span className="mf-kicker">BOT CONTROL CENTER</span>
            <h1>@{data.botUser || username}</h1>
            <p>{data.turi || 'Bot'} · {data.kun ?? '—'} kunlik muddat</p>
          </div>
        </div>
        {(data.can || []).includes('members.view') && (
          <Link to={`/bots/${encodeURIComponent(data.botUser || username)}/team`} className="mf-button mf-button--ghost">
            <i className="fa-solid fa-user-group" /> Jamoa
          </Link>
        )}
        <Link to={`/analytics?bot=${encodeURIComponent(data.botUser || username)}`} className="mf-button mf-button--ghost">
          <i className="fa-solid fa-chart-line" /> Tahlil
        </Link>
        <a href={botUrl} target="_blank" rel="noopener noreferrer" className="mf-button mf-button--ghost">
          <i className="fa-brands fa-telegram" /> Telegram
        </a>
      </header>

      {message && <Banner type="ok">{message}</Banner>}
      {error && <Banner type="err">{error}</Banner>}

      <section className="mf-detail-hero">
        <div>
          <span className={`mf-status-badge ${isActive ? 'is-online' : ''}`}>
            <i className="fa-solid fa-circle" /> {isActive ? 'Faol ishlayapti' : 'Holat mavjud emas'}
          </span>
          <h2>Botingiz ustidan to‘liq nazorat</h2>
          <p>Sozlamalar, kontent va botga tegishli barcha amallar shu markazda.</p>
        </div>
        <div className="mf-detail-hero__accent"><i className="fa-solid fa-sliders" /></div>
      </section>

      <StatsPanel stats={stats} />

      {data.isTemplate && data.kind === 'anime' && (
        <div className="mf-notice mf-notice--warn">
          <i className="fa-solid fa-circle-info" /> Siz botning egasisiz: botga /start yuboring — pastdagi menyuda <b>Admin panel</b> tugmasi chiqadi. Oddiy foydalanuvchilar <b>Web ilova</b> tugmasini ko‘radi.
        </div>
      )}
      {cred && (
        <section className="mf-detail-card">
          <div className="mf-detail-card__heading">
            <span className="mf-detail-card__icon"><i className="fa-solid fa-key" /></span>
            <div><h2>Yangi admin ma’lumotlari</h2><p>Parol faqat hozir ko‘rsatiladi — saqlab qo‘ying.</p></div>
          </div>
          <div className="mf-cred-grid">
            <div><small>Login</small><code>{cred.login}</code></div>
            <div><small>Parol</small><code>{cred.password}</code></div>
          </div>
        </section>
      )}

      <section className="mf-detail-actions">
        <div className="mf-section-heading">
          <div><span className="mf-kicker">QUICK CONTROL</span><h2>Boshqaruv</h2></div>
          <span className="mf-panel__muted">{data.turiNomi || 'Asosiy amallar'}</span>
        </div>
        <div className="mf-detail-action-grid">
          {data.isTemplate && data.panels?.admin && (
            <a href={data.panels.admin} target="_blank" rel="noopener noreferrer" className="mf-detail-action mf-detail-action--primary">
              <span><i className="fa-solid fa-user-shield" /></span>
              <b>Admin panel</b>
              <small>{data.kind === 'anime' ? 'Telegram ichida ochiladi' : 'Kontent, narx va buyurtmalar'}</small>
              <i className="fa-solid fa-arrow-up-right-from-square mf-detail-action__arrow" />
            </a>
          )}
          {data.isTemplate && data.panels?.app && (
            <a href={data.panels.app} target="_blank" rel="noopener noreferrer" className="mf-detail-action">
              <span><i className="fa-solid fa-window-restore" /></span>
              <b>Mini App</b>
              <small>Foydalanuvchilar ko‘radigan ilova</small>
              <i className="fa-solid fa-arrow-up-right-from-square mf-detail-action__arrow" />
            </a>
          )}
          {data.canResetAdmin && (
            <button type="button" onClick={resetAdmin} disabled={busy} className="mf-detail-action">
              <span><i className="fa-solid fa-key" /></span>
              <b>Admin parolini tiklash</b>
              <small>Yangi login/parol yaratadi</small>
            </button>
          )}
          <Link to={`/bots/${username}/kunlik`} className="mf-detail-action">
            <span><i className="fa-solid fa-calendar-check" /></span>
            <b>Kunlik to‘lov</b>
            <small>Muddatni uzaytirish</small>
            <i className="fa-solid fa-arrow-right mf-detail-action__arrow" />
          </Link>
          <a href={botUrl} target="_blank" rel="noopener noreferrer" className="mf-detail-action">
            <span><i className="fa-brands fa-telegram" /></span>
            <b>Botni ochish</b>
            <small>Telegram’da ko‘rish</small>
            <i className="fa-solid fa-arrow-up-right-from-square mf-detail-action__arrow" />
          </a>
        </div>
      </section>

      {data.isTemplate && (data.can || []).includes('broadcast.send') && (
        <section className="mf-detail-card">
          <div className="mf-detail-card__heading">
            <span className="mf-detail-card__icon"><i className="fa-solid fa-bullhorn" /></span>
            <div><h2>Xabar yuborish</h2><p>Botning barcha foydalanuvchilariga matnli xabar.</p></div>
          </div>
          <form onSubmit={sendBroadcast} className="mf-token-form" style={{ flexDirection: 'column' }}>
            <textarea value={bcText} onChange={(e) => setBcText(e.target.value)} rows={3} maxLength={4000} placeholder="Xabar matni..." style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', font: 'inherit' }} />
            <button disabled={busy || !bcText.trim()} className="mf-button mf-button--primary"><i className="fa-solid fa-paper-plane" /> Yuborish</button>
          </form>
            <BroadcastProgress batchId={batchId} />
        </section>
      )}

      {data.canChangeToken ? (
        <section className="mf-detail-card">
          <div className="mf-detail-card__heading">
            <span className="mf-detail-card__icon"><i className="fa-solid fa-key" /></span>
            <div><h2>Tokenni yangilash</h2><p>Yangi token tekshiriladi va bot ma’lumotlari ko‘chiriladi.</p></div>
          </div>
          <form onSubmit={handleTokenChange} className="mf-token-form">
            <input
              type="text"
              value={newToken}
              onChange={(event) => setNewToken(event.target.value)}
              placeholder="Yangi Bot Token"
              required
            />
            <button disabled={busy} className="mf-button mf-button--primary">
              <i className="fa-solid fa-arrows-rotate" /> {busy ? 'Tekshirilmoqda...' : 'Almashtirish'}
            </button>
          </form>
        </section>
      ) : (
        <div className="mf-notice mf-notice--warn">
          <i className="fa-solid fa-lock" /> Token yangilash joriy tarifingizda yoqilmagan.
        </div>
      )}
    </div>
  );
}

function getStats(data) {
  const s = data?.stats || {};
  if (data?.kind === 'starska') {
    return [
      { icon: 'fa-users', label: 'Foydalanuvchilar', value: s.users ?? 0 },
      { icon: 'fa-cart-shopping', label: 'Buyurtmalar', value: s.orders ?? 0 },
      { icon: 'fa-coins', label: 'Daromad', value: formatMoney(s.revenue || 0) },
      { icon: 'fa-receipt', label: 'Kutilayotgan to‘lov', value: s.pending ?? 0 },
    ];
  }
  if (data?.kind === 'anime') {
    return [
      { icon: 'fa-users', label: 'Foydalanuvchilar', value: s.users ?? 0 },
      { icon: 'fa-clapperboard', label: 'Animelar', value: s.items ?? 0 },
      { icon: 'fa-film', label: 'Qismlar', value: s.orders ?? 0 },
      { icon: 'fa-bullhorn', label: 'Kanallar', value: s.extra?.channels ?? 0 },
    ];
  }
  return [{ icon: 'fa-users', label: 'Foydalanuvchilar', value: readValue(s, ['users']) }];
}

function readValue(source, keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source[key] !== null && source[key] !== '') return source[key];
  }
  return '—';
}

function StatsPanel({ stats }) {
  return (
    <section className="mf-detail-stats">
      {stats.map((stat) => (
        <div key={stat.label} className="mf-detail-stat">
          <span><i className={`fa-solid ${stat.icon}`} /></span>
          <div><strong>{stat.value}</strong><small>{stat.label}</small></div>
        </div>
      ))}
    </section>
  );
}

function DetailSkeleton() {
  return <div className="mf-detail-skeleton"><div /><div /><div /><div /></div>;
}

function Banner({ type, children }) {
  return <div className={`mf-notice ${type === 'ok' ? 'mf-notice--ok' : 'mf-notice--err'}`}>{children}</div>;
}