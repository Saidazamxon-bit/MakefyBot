import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/format';

export default function Balance() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [eski, setEski] = useState('');
  const [yangi, setYangi] = useState('');
  const [yangi2, setYangi2] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/balance.php').then(setData).catch((err) => setError(err.message));
  }, []);

  function copyId() {
    if (!data) return;
    navigator.clipboard?.writeText(String(data.user.user_id)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');
    if (yangi !== yangi2) {
      setPwErr('Yangi parollar bir-biriga mos kelmaydi!');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post('/balance.php', {
        amal: 'parol_ozgartir',
        eski_parol: eski,
        yangi_parol: yangi,
        yangi_parol2: yangi2,
      });
      setPwMsg(res.message);
      setEski('');
      setYangi('');
      setYangi2('');
    } catch (err) {
      setPwErr(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (error && !data) return <p className="text-danger text-sm">{error}</p>;
  if (!data) return <div className="h-64 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent-soft text-accent flex items-center justify-center text-2xl mb-2">
          <i className="fa-solid fa-user" />
        </div>
        <h2 className="font-extrabold text-lg">Hisobim</h2>
        <p className="text-[12.5px] text-text-muted">Profil sozlamalari va ma'lumotlaringiz</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <InfoCard icon="fa-user" label="Login" value={data.user.login} />
        <InfoCard
          icon="fa-fingerprint"
          label="Telegram ID"
          value={data.user.user_id}
          action={
            <button onClick={copyId} className="text-text-muted hover:text-accent">
              <i className={`fa-${copied ? 'solid fa-check' : 'regular fa-copy'}`} />
            </button>
          }
        />
        <InfoCard icon="fa-wallet" label="Balans" value={formatMoney(data.user.balance)} accent />
        <InfoCard icon="fa-robot" label="Botlar soni" value={`${data.botsCount} ta`} />
        <InfoCard icon="fa-crown" label="Tarif" value={data.plan?.nomi || 'Oddiy'} />
        <InfoCard
          icon="fa-users"
          label="Referal daraja"
          value={`${data.referralLevel?.name || 'Oddiy'} (${data.referralLevel?.count || 0} ta)`}
        />
      </div>

      <div className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
        <div className="font-bold text-sm mb-3">
          <i className="fa-solid fa-bolt mr-1.5 text-accent" /> Tezkor havolalar
        </div>
        <div className="grid grid-cols-2 gap-2">
          <QuickLink to="/deposit" icon="fa-plus" label="To'ldirish" primary />
          <QuickLink to="/referal" icon="fa-users" label="Referal" />
          <QuickLink to="/tariflar" icon="fa-crown" label="Tariflar" />
          <QuickLink to="/sozlamalar" icon="fa-gear" label="Sozlamalar" />
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
        <div className="font-bold text-sm mb-3">
          <i className="fa-solid fa-lock mr-1.5 text-accent" /> Parol o'zgartirish
        </div>
        {pwMsg && (
          <div className="text-[13px] font-semibold text-accent bg-accent-soft rounded-[var(--radius-sm)] px-3 py-2 mb-2">
            {pwMsg}
          </div>
        )}
        {pwErr && (
          <div className="text-[13px] font-semibold text-danger bg-danger-soft rounded-[var(--radius-sm)] px-3 py-2 mb-2">
            {pwErr}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-2.5">
          <input
            type="password"
            value={eski}
            onChange={(e) => setEski(e.target.value)}
            placeholder="Joriy parol"
            required
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            value={yangi}
            onChange={(e) => setYangi(e.target.value)}
            placeholder="Yangi parol (kamida 8 belgi, harf+raqam)"
            required
            minLength={8}
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            value={yangi2}
            onChange={(e) => setYangi2(e.target.value)}
            placeholder="Yangi parolni qaytadan kiriting"
            required
            minLength={8}
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent"
          />
          <button
            disabled={busy}
            className="w-full py-2.5 rounded-[var(--radius-sm)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-bold text-sm disabled:opacity-60"
          >
            <i className="fa-solid fa-save mr-1.5" /> {busy ? 'Saqlanmoqda...' : 'Parolni o\'zgartirish'}
          </button>
        </form>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-[var(--radius-md)] bg-danger-soft text-danger font-bold text-sm"
      >
        <i className="fa-solid fa-right-from-bracket mr-1.5" /> Hisobdan chiqish
      </button>
    </div>
  );
}

function InfoCard({ icon, label, value, action, accent }) {
  return (
    <div className="p-3 rounded-[var(--radius-sm)] bg-surface-3 border border-border">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">
        <i className={`fa-solid ${icon}`} /> {label}
      </div>
      <div className={`flex items-center justify-between gap-2 font-bold text-sm break-all ${accent ? 'text-accent' : ''}`}>
        <span>{value}</span>
        {action}
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label, primary }) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-[var(--radius-sm)] text-[13px] font-bold ${
        primary ? 'bg-gradient-to-r from-accent to-accent-dim text-accent-text' : 'bg-surface-2 border border-border'
      }`}
    >
      <i className={`fa-solid ${icon}`} /> {label}
    </Link>
  );
}
