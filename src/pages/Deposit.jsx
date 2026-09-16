import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/format';

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
    <div className="space-y-4">
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
