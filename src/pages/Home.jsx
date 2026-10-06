import Onboarding from '../components/Onboarding';
import BroadcastProgress from '../components/BroadcastProgress';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/format';
import '../styles/home.css';

const num = (v) => new Intl.NumberFormat('uz-UZ').format(Number(v || 0));
const FILTERS = [['all', 'Barchasi'], ['anime', 'Anime'], ['starska', 'Starska'], ['on', 'Faol'], ['off', 'Nofaol']];
const QUICK = [
  ['/create', 'fa-plus', 'Yangi bot', 'Shablondan yaratish'], ['/deposit', 'fa-wallet', 'Balans', 'Hisobni to‘ldirish'],
  ['/vazifalar', 'fa-bolt', 'Vazifalar', 'Bonus olish'], ['/chat', 'fa-headset', 'Yordam', 'Admin bilan chat'],
];
const kindIcon = (k) => (k === 'starska' ? 'fa-star' : k === 'anime' ? 'fa-clapperboard' : 'fa-robot');

export default function Home() {
  const { user, updateBalance } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const value = await api.get('/home.php');
      setData(value); setError(''); updateBalance(value?.balance ?? 0);
    } catch (err) { setError(err.message); } finally { setRefreshing(false); }
  }, [updateBalance]);
  useEffect(() => { load(); }, [load]);

  const bots = data?.botsPreview || [];
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bots.filter((b) => (filter === 'all' || b.kind === filter || (filter === 'on' && b.faol) || (filter === 'off' && !b.faol))
      && (!q || String(b.username || '').toLowerCase().includes(q)));
  }, [bots, query, filter]);

  if (error && !data) {
    return (
      <div className="mf-page"><div className="mf-error-card">
        <span><i className="fa-solid fa-wifi" /></span><h1>Ulanib bo‘lmadi</h1><p>{error}</p>
        <button type="button" onClick={load} className="mf-button mf-button--primary"><i className="fa-solid fa-rotate-right" /> Qayta urinish</button>
      </div></div>
    );
  }
  if (!data) return <div className="mf-page mf-skeleton"><div className="mf-skeleton__head" /><div className="mf-skeleton__metrics" /><div className="mf-skeleton__columns" /></div>;

  const t = data.totals || {};
  const board = data.leaderboard?.top || [];
  const expiring = data.expiring || [];
  const name = user?.login || 'do‘st';

  return (
    <div className="mf-page hm">
      <header className="hm-head">
        <div>
          <h1>Salom, {name}</h1>
          <p>{data.botsCount ? `${data.botsCount} ta botingiz bor. Hammasi shu yerdan boshqariladi.` : 'Birinchi botingizni yarating — bir necha daqiqa.'}</p>
        </div>
        <div className="hm-head__act">
          <button type="button" onClick={load} className="mf-button mf-button--ghost" disabled={refreshing} aria-label="Yangilash">
            <i className={'fa-solid fa-rotate-right' + (refreshing ? ' fa-spin' : '')} />
          </button>
          <Link to="/create" className="mf-button mf-button--primary"><i className="fa-solid fa-plus" /> Yangi bot</Link>
        </div>
      </header>

      {(expiring.length > 0 || t.pending > 0) && (
        <div className="hm-alerts">
          {expiring.map((b) => (
            <Link key={b.username} to={`/bots/${b.username}/kunlik`} className="hm-alert">
              <i className="fa-solid fa-hourglass-half" />
              <span><b>@{b.username}</b> {b.kun <= 0 ? 'muddati tugagan' : `muddati ${b.kun} kunda tugaydi`} — uzaytiring</span>
              <i className="fa-solid fa-chevron-right" />
            </Link>
          ))}
          {t.pending > 0 && (
            <Link to="/bots" className="hm-alert hm-alert--info">
              <i className="fa-solid fa-receipt" /><span><b>{t.pending} ta</b> to‘lov tasdiqlanishini kutmoqda</span><i className="fa-solid fa-chevron-right" />
            </Link>
          )}
        </div>
      )}

      <section className="hm-kpi" aria-label="Umumiy ko‘rsatkichlar">
        <div><small>Botlar</small><strong>{data.botsCount ?? 0}</strong><em>{data.byType?.anime || 0} anime · {data.byType?.starska || 0} starska</em></div>
        <div><small>Foydalanuvchilar</small><strong>{num(t.users)}</strong><em>barcha botlarda</em></div>
        <div><small>Buyurtmalar</small><strong>{num(t.orders)}</strong><em>muvaffaqiyatli</em></div>
        <div><small>Daromad</small><strong>{formatMoney(t.revenue || 0)}</strong><em>Starska botlardan</em></div>
        <div><small>Balans</small><strong>{formatMoney(data.balance ?? 0)}</strong><em><Link to="/deposit" className="text-accent">To‘ldirish →</Link></em></div>
      </section>

      {(bots.length === 0 || !(t.users > 0)) && <Onboarding botCount={bots.length} hasUsers={Number(t.users || 0) > 0} />}

      <section className="hm-sec" aria-label="Botlarni boshqarish">
        <div className="hm-sec__head">
          <div><h2>Botlarim</h2><p>Holat, muddat va statistika — bitta jadvalda.</p></div>
          <Link to="/bots" className="mf-panel__link">Batafsil boshqaruv <i className="fa-solid fa-arrow-right" /></Link>
        </div>
        {bots.length > 0 && (
          <div className="hm-tools">
            <label className="hm-search"><i className="fa-solid fa-magnifying-glass" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Botni qidirish…" aria-label="Botni qidirish" /></label>
            <div className="hm-pills" role="tablist">
              {FILTERS.map(([k, l]) => <button key={k} type="button" className={'hm-pill' + (filter === k ? ' is-on' : '')} onClick={() => setFilter(k)}>{l}</button>)}
            </div>
          </div>
        )}
        <div className="hm-table">
          {bots.length === 0 ? (
            <div className="hm-empty">Hali botingiz yo‘q. <Link to="/create" className="text-accent font-bold">Birinchi botni yarating →</Link></div>
          ) : (
            <>
              <div className="hm-row hm-row--head"><span>Bot</span><span>Holat</span><span>Muddat</span><span>Foydalanuvchi</span><span>Daromad</span><span /></div>
              {shown.length === 0 && <div className="hm-empty">Hech narsa topilmadi.</div>}
              {shown.map((b) => <BotRow key={b.username || b.id} bot={b} />)}
            </>
          )}
        </div>
      </section>

      <div className="hm-two">
        {bots.length > 0 && <Broadcast bots={bots} />}
        <section className="hm-sec">
          <div className="hm-sec__head"><h2>Balans reytingi</h2></div>
          <div className="hm-list">
            {board.length === 0 && <div className="hm-empty">Reyting hozircha bo‘sh.</div>}
            {board.map((r) => {
              const me = String(r.user_id) === String(user?.user_id);
              return <div key={r.user_id} className={'hm-li' + (me ? ' is-me' : '')}><span>{r.rank}</span><b>{r.login}{me && ' (siz)'}</b><span className="hm-num">{formatMoney(r.value)}</span></div>;
            })}
          </div>
        </section>
      </div>

      <nav className="hm-quick" aria-label="Tezkor havolalar">
        {QUICK.map(([to, icon, label, note]) => (
          <Link key={to} to={to}><i className={'fa-solid ' + icon} /><span>{label}<small>{note}</small></span></Link>
        ))}
      </nav>
    </div>
  );
}

function BotRow({ bot }) {
  const s = bot.stats || {};
  const star = bot.kind === 'starska';
  const days = Number(bot.kun ?? 0);
  const link = '/bots/' + bot.username;
  return (
    <div className="hm-row">
      <Link to={link} className={'hm-bot' + (bot.faol ? ' is-on' : '')}>
        <span className="hm-bot__ico"><i className={'fa-solid ' + kindIcon(bot.kind)} /></span>
        <span style={{ minWidth: 0 }}><b>{bot.username ? '@' + bot.username : 'Token kiritilmagan'}</b><small>{bot.turiNomi || 'Bot'}</small></span>
      </Link>
      <span data-l="Holat"><span className={'hm-badge' + (bot.faol ? ' is-on' : '')}>{bot.faol ? 'Faol' : 'Nofaol'}</span></span>
      <span data-l="Muddat" className={'hm-days' + (days <= 0 ? ' is-bad' : days <= 3 ? ' is-warn' : '')}>{days > 0 ? `${days} kun` : 'Tugagan'}</span>
      <span data-l="Foydalanuvchi" className={'hm-num' + (bot.stats ? '' : ' is-empty')}>{bot.stats ? num(s.users) : '—'}</span>
      <span data-l="Daromad" className={'hm-num' + (star && bot.stats ? '' : ' is-empty')}>{star && bot.stats ? formatMoney(s.revenue || 0) : '—'}</span>
      <div className="hm-acts">
        {bot.panels?.app && <a className="hm-act" href={bot.panels.app} target="_blank" rel="noopener noreferrer"><i className="fa-solid fa-window-restore" /> App</a>}
        {bot.panels?.admin && <a className="hm-act" href={bot.panels.admin} target="_blank" rel="noopener noreferrer"><i className="fa-solid fa-user-shield" /> Admin</a>}
        {bot.username && <a className="hm-act" href={'https://t.me/' + bot.username} target="_blank" rel="noopener noreferrer" aria-label="Telegramda ochish"><i className="fa-brands fa-telegram" /></a>}
        <Link className="hm-act hm-act--main" to={link}><i className="fa-solid fa-sliders" /> Boshqarish</Link>
      </div>
    </div>
  );
}

function Broadcast({ bots }) {
  const [bot, setBot] = useState(bots[0]?.username || '');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [batchId, setBatchId] = useState(null);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !bot) return;
    if (!window.confirm(`@${bot} foydalanuvchilariga xabar yuborilsinmi?`)) return;
    setBusy(true); setMsg(null);
    try {
      const r = await api.post('/bots/broadcast.php', { useri: bot, matn: text.trim() });
      setMsg({ ok: true, text: r.message }); setBatchId(r.batchId || null); setText('');
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Yuborib bo‘lmadi.' });
    } finally { setBusy(false); }
  }

  return (
    <section className="hm-sec">
      <div className="hm-sec__head"><div><h2>Xabar yuborish</h2><p>Botingiz foydalanuvchilariga ommaviy xabar.</p></div></div>
      <form onSubmit={send} className="hm-form">
        <select value={bot} onChange={(e) => setBot(e.target.value)} aria-label="Bot">
          {bots.map((b) => <option key={b.username} value={b.username}>@{b.username}</option>)}
        </select>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} rows={3} placeholder="Aksiya, yangilik, e’lon…" />
        <div className="hm-form__foot">
          <span>{text.length}/4000</span>
          <button disabled={busy || !text.trim()} className="mf-button mf-button--primary"><i className="fa-solid fa-paper-plane" /> {busy ? 'Yuborilmoqda…' : 'Yuborish'}</button>
        </div>
        {msg && <div className={'mf-notice ' + (msg.ok ? 'mf-notice--ok' : 'mf-notice--err')}>{msg.text}</div>}
      </form>
      <BroadcastProgress batchId={batchId} />
    </section>
  );
}
