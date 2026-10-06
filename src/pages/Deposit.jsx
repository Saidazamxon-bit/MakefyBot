import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/format';


function pad(n) { return String(n).padStart(2, '0'); }

// Humo avto-to'lov: summa -> karta + summa -> avtomatik tasdiqlash (har 5 soniyada tekshiriladi)
function HumoPanel({ onPaid }) {
  const [summa, setSumma] = useState('');
  const [order, setOrder] = useState(null);
  const [left, setLeft] = useState(0);
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const expiresAt = order ? new Date(order.expires_at.replace(' ', 'T')).getTime() : 0;

  useEffect(() => {
    if (!order || status === 'paid') return undefined;
    const tick = setInterval(() => setLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))), 1000);
    return () => clearInterval(tick);
  }, [order, status, expiresAt]);

  useEffect(() => {
    if (!order || status === 'paid' || status === 'expired' || status === 'cancelled') return undefined;
    const poll = setInterval(() => { check(true); }, 5000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, status]);

  async function create(e) {
    e.preventDefault();
    const n = parseInt(String(summa).replace(/\D/g, ''), 10);
    if (!n) return;
    setBusy(true); setErr('');
    try {
      const res = await api.post('/deposit.php', { amal: 'humo_create', summa: n });
      setOrder(res.order); setStatus('pending');
      setLeft(Math.max(0, Math.floor((new Date(res.order.expires_at.replace(' ', 'T')).getTime() - Date.now()) / 1000)));
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : 'Xatolik yuz berdi.');
    } finally { setBusy(false); }
  }

  async function check(silent) {
    if (!order) return;
    if (!silent) setBusy(true);
    try {
      const res = await api.post('/deposit.php', { amal: 'humo_status', order_id: order.order_id });
      setStatus(res.status);
      if (res.credited) onPaid(res.newBalance);
    } catch (ex) {
      if (!silent) setErr(ex instanceof ApiError ? ex.message : 'Tekshirib bo\'lmadi.');
    } finally { if (!silent) setBusy(false); }
  }

  async function cancel() {
    try { await api.post('/deposit.php', { amal: 'humo_cancel', order_id: order.order_id }); } catch { /* e'tiborsiz */ }
    setOrder(null); setStatus(''); setSumma('');
  }

  function copy(key, val) {
    navigator.clipboard?.writeText(val).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1500); });
  }

  const card = order ? order.card.replace(/(\d{4})(?=\d)/g, '$1 ') : '';

  return (
    <div className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
      <div className="font-bold text-sm mb-2">
        <i className="fa-solid fa-bolt mr-1.5 text-accent" /> Humo avto-to'lov
      </div>
      {err && <div className="text-[13px] font-semibold text-danger bg-danger-soft rounded-[var(--radius-sm)] px-3 py-2 mb-2" role="alert">{err}</div>}

      {!order && (
        <form onSubmit={create} className="space-y-2">
          <p className="text-[12.5px] text-text-muted">Summani kiriting — karta ma'lumotlari beriladi, to'lov tushishi bilan balans o'zi to'ldiriladi.</p>
          <input
            inputMode="numeric" autoComplete="off" value={summa}
            onChange={(e) => setSumma(e.target.value.replace(/[^\d ]/g, ''))}
            placeholder="Masalan: 50 000" aria-label="Summa (so'm)"
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent"
          />
          <p className="text-[12px] text-text-dim">Eng kam 1 000, eng ko'p 10 000 000 so'm.</p>
          <button disabled={busy || !summa} className="w-full py-2.5 rounded-[var(--radius-sm)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-bold text-sm disabled:opacity-50">
            {busy ? 'Yaratilmoqda…' : 'To\'lov yaratish'}
          </button>
        </form>
      )}

      {order && status === 'paid' && (
        <div className="text-[14px] font-bold text-accent bg-accent-soft rounded-[var(--radius-sm)] px-3 py-3" role="status">
          <i className="fa-solid fa-circle-check mr-1.5" /> To'lov qabul qilindi. Balans yangilandi.
          <button onClick={() => { setOrder(null); setStatus(''); setSumma(''); }} className="block mt-2 text-[12.5px] underline">Yangi to'lov</button>
        </div>
      )}

      {order && (status === 'expired' || status === 'cancelled') && (
        <div className="text-[13px]" role="status">
          <p className="text-danger font-semibold mb-2">To'lov muddati tugadi. Iltimos, qaytadan yarating.</p>
          <button onClick={() => { setOrder(null); setStatus(''); }} className="px-4 py-2 rounded-[var(--radius-sm)] bg-accent text-accent-text font-bold text-sm">Qayta urinish</button>
        </div>
      )}

      {order && status === 'review' && (
        <p className="text-[13px] text-warn font-semibold" role="status">To'lov qo'lda tekshirilmoqda. Iltimos, admin bilan bog'laning (buyurtma #{order.order_id}).</p>
      )}

      {order && status === 'pending' && (
        <div className="space-y-2">
          <button onClick={() => copy('card', order.card)} className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-[var(--radius-sm)] bg-surface-2 border border-border font-mono text-sm">
            <span className="text-left">{card}{order.card_owner && (<><br /><span className="text-text-muted font-sans text-[12px]">{order.card_owner}</span></>)}</span>
            <i className={`fa-solid ${copied === 'card' ? 'fa-check text-accent' : 'fa-copy text-text-muted'}`} />
          </button>
          <button onClick={() => copy('sum', String(Math.round(order.amount)))} className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm font-bold">
            <span>{formatMoney(order.amount)} so'm</span>
            <i className={`fa-solid ${copied === 'sum' ? 'fa-check text-accent' : 'fa-copy text-text-muted'}`} />
          </button>
          {order.extra > 0 && <p className="text-[12px] text-text-muted">Summaga +{order.extra} so'm qo'shildi (boshqa to'lovdan farqlash uchun) — u ham balansingizga o'tadi.</p>}
          <p className="text-[12.5px] text-text-muted" aria-live="polite">
            Aynan shu summani o'tkazing. Qolgan vaqt: <b className="tabular-nums">{pad(Math.floor(left / 60))}:{pad(left % 60)}</b>
          </p>
          <div className="flex gap-2">
            <button onClick={() => check(false)} disabled={busy} className="flex-1 py-2.5 rounded-[var(--radius-sm)] bg-accent text-accent-text font-bold text-sm disabled:opacity-50">{busy ? 'Tekshirilmoqda…' : 'To\'lov qildim'}</button>
            <button onClick={cancel} className="px-4 py-2.5 rounded-[var(--radius-sm)] border border-border text-sm">Bekor</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Deposit() {
  const { updateBalance } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [kod, setKod] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [promoErr, setPromoErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/deposit.php').then(setData).catch((err) => setError(err.message));
  }, []);

  function copyCard() {
    if (!data) return;
    navigator.clipboard?.writeText(data.cardNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function submitPromo(e) {
    e.preventDefault();
    if (!kod.trim()) return;
    setBusy(true);
    setPromoErr('');
    setPromoMsg('');
    try {
      const res = await api.post('/deposit.php', { amal: 'promokod', kod: kod.trim() });
      setPromoMsg(res.message);
      updateBalance(res.newBalance);
      setData((d) => (d ? { ...d, balance: res.newBalance } : d));
      setKod('');
    } catch (err) {
      setPromoErr(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <p className="text-danger text-sm">{error}</p>;
  if (!data) return <div className="h-64 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;

  return (
    <div className="mf-page mf-page--deposit mf-page--standard">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-accent-soft text-accent flex items-center justify-center text-lg">
          <i className="fa-solid fa-credit-card" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg leading-tight">Hisobni to'ldirish</h2>
          <p className="text-[12.5px] text-text-muted">To'lovni tez va xavfsiz tarzda yakunlang</p>
        </div>
      </div>

      <div className="rounded-[var(--radius-xl)] bg-gradient-to-br from-surface-2 to-surface border border-border p-5 text-center">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wide">
          <i className="fa-solid fa-wallet mr-1" /> Joriy balans
        </div>
        <div className="text-3xl font-extrabold mt-1">{formatMoney(data.balance)}</div>
      </div>

      {data.humoEnabled && (
        <HumoPanel onPaid={(nb) => { updateBalance(nb); setData((d) => (d ? { ...d, balance: nb } : d)); }} />
      )}

      {!data.humoEnabled && (
      <div className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
        <div className="font-bold text-sm mb-2">
          <i className="fa-solid fa-circle-info mr-1.5 text-accent" /> To'lov ma'lumotlari
        </div>
        <p className="text-[12.5px] text-text-muted mb-3">
          Hisobni to'ldirish uchun pastdagi karta raqamini nusxalang, bank ilovangiz orqali kerakli summani
          shu kartaga o'tkazing, so'ng chekni skrinshot qilib admin bilan bog'lanish orqali yuboring.
        </p>
        <button
          onClick={copyCard}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-[var(--radius-sm)] bg-surface-2 border border-border font-mono text-sm mb-3"
        >
          <span className="text-left">
            {data.cardNumber}
            <br />
            <span className="text-text-muted font-sans text-[12px]">{data.cardOwner}</span>
          </span>
          <i className={`fa-solid ${copied ? 'fa-check text-accent' : 'fa-copy text-text-muted'}`} />
        </button>
        <a
          href={`https://t.me/${data.supportUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-bold text-sm"
        >
          <i className="fa-solid fa-headset" /> Admin bilan bog'lanish
        </a>
      </div>
      )}

      <div className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
        <div className="font-bold text-sm mb-2">
          <i className="fa-solid fa-ticket mr-1.5 text-accent" /> Promokod
        </div>
        {promoMsg && (
          <div className="text-[13px] font-semibold text-accent bg-accent-soft rounded-[var(--radius-sm)] px-3 py-2 mb-2">
            {promoMsg}
          </div>
        )}
        {promoErr && (
          <div className="text-[13px] font-semibold text-danger bg-danger-soft rounded-[var(--radius-sm)] px-3 py-2 mb-2">
            {promoErr}
          </div>
        )}
        <form onSubmit={submitPromo} className="flex gap-2">
          <input
            type="text"
            value={kod}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            placeholder="Promokodni kiriting"
            required
            className="flex-1 px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm uppercase outline-none focus:border-accent"
          />
          <button
            disabled={busy}
            className="w-11 rounded-[var(--radius-sm)] bg-accent text-accent-text disabled:opacity-50"
          >
            <i className="fa-solid fa-paper-plane" />
          </button>
        </form>
      </div>
    </div>
  );
}
