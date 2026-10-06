import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { formatMoney } from '../lib/format';
import ErrorNotice from '../components/ErrorNotice';

function Stars({ value, count }) {
  const full = Math.round(value);
  return (
    <span className="text-[12px] text-text-muted" aria-label={count ? `Reyting ${value} / 5, ${count} ta baho` : 'Hali baholanmagan'}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={(i <= full ? 'fa-solid' : 'fa-regular') + ' fa-star'} style={{ color: i <= full ? '#F2B84B' : undefined }} aria-hidden="true" />)}
      <span className="ml-1 tabular-nums">{count ? `${value} (${count})` : 'baho yo‘q'}</span>
    </span>
  );
}

export default function Market() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('name');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState(null);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ q, category: cat, sort });
      api.get(`/market/list.php?${p}`).then((r) => { setData(r); setErr(null); }).catch(setErr);
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat, sort]);

  async function install(t) {
    setBusy(true); setErr(null);
    try {
      const r = await api.post('/create/bot_create.php', { nomi: t.slug, token: token.trim() });
      nav(`/bots/${r.botUsername}`);
    } catch (e) { setErr(e instanceof ApiError ? e : new Error('Xatolik yuz berdi.')); } finally { setBusy(false); }
  }
  async function review(t) {
    setBusy(true); setErr(null); setNote('');
    try { await api.post('/market/review.php', { template: t.slug, rating }); setNote('Rahmat! Bahoyingiz saqlandi.'); } catch (e) { setErr(e); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-[20px] font-bold">Shablonlar bozori</h1>
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish…" aria-label="Qidirish" className="flex-1 min-w-[160px] px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Tartib" className="px-3 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm">
          <option value="name">Nomi</option><option value="rating">Reyting</option><option value="price">Narx</option>
        </select>
      </div>
      {data && (
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Kategoriya">
          {['', ...data.categories].map((c) => (
            <button key={c || 'all'} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
              className={'px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap ' + (cat === c ? 'bg-accent text-accent-text' : 'bg-surface-2 text-text-muted')}>{c || 'Hammasi'}</button>
          ))}
        </div>
      )}
      <ErrorNotice error={err} />
      {!data && !err && <div className="h-32 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" aria-busy="true" />}
      {data && data.templates.length === 0 && <p className="text-center text-[13px] text-text-muted py-10">Hech narsa topilmadi. Boshqa so‘z bilan qidirib ko‘ring.</p>}
      <div className="grid md:grid-cols-2 gap-3">
        {data?.templates.map((t) => (
          <article key={t.slug} className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl" aria-hidden="true">{t.icon}</div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold">{t.title} <span className="text-[11px] font-normal text-text-muted">v{t.version}</span></h2>
                <div className="text-[12px] text-text-muted">{t.category}</div>
                <Stars value={t.rating} count={t.ratingCount} />
              </div>
              <div className="font-bold text-sm tabular-nums">{t.price > 0 ? formatMoney(t.price) : 'Bepul'}</div>
            </div>
            <p className="text-[13px] text-text-muted mt-2">{t.description}</p>
            {t.buttons.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{t.buttons.map((b) => <span key={b} className="px-2 py-0.5 rounded-full bg-surface-2 text-[12px]">{b}</span>)}</div>}
            {open === t.slug ? (
              <div className="mt-3 space-y-2">
                <label className="text-[12px] text-text-muted" htmlFor={`tk-${t.slug}`}>BotFather tokeni</label>
                <input id={`tk-${t.slug}`} value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456:ABC…" autoComplete="off" className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm font-mono outline-none focus:border-accent" />
                <div className="flex gap-2">
                  <button onClick={() => install(t)} disabled={busy || !token.trim()} className="flex-1 py-2.5 rounded-[var(--radius-sm)] bg-accent text-accent-text font-bold text-sm disabled:opacity-50">{busy ? 'O‘rnatilmoqda…' : 'O‘rnatish'}</button>
                  <button onClick={() => setOpen(null)} className="px-4 rounded-[var(--radius-sm)] border border-border text-sm">Yopish</button>
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <label htmlFor={`rt-${t.slug}`}>Baho:</label>
                  <select id={`rt-${t.slug}`} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="px-2 py-1 rounded-[8px] bg-surface-2 border border-border">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}</select>
                  <button onClick={() => review(t)} disabled={busy} className="underline">Yuborish</button>{note && <span className="text-accent">{note}</span>}
                </div>
              </div>
            ) : (
              <button onClick={() => { setOpen(t.slug); setErr(null); }} className="mt-3 w-full py-2.5 rounded-[var(--radius-sm)] bg-accent text-accent-text font-bold text-sm">O‘rnatish</button>
            )}
          </article>
        ))}
      </div>
      <p className="text-[12px] text-text-muted"><Link to="/create" className="underline">Eski yaratish sahifasi</Link></p>
    </div>
  );
}
