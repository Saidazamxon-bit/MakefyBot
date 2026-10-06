import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import ErrorNotice from '../components/ErrorNotice';

export default function JoinTeam() {
  const [sp] = useSearchParams();
  const token = sp.get('token') || '';
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  async function accept() {
    setBusy(true); setErr(null);
    try { setRes(await api.post('/team/accept.php', { token })); } catch (e) { setErr(e instanceof ApiError ? e : new Error('Xatolik yuz berdi.')); } finally { setBusy(false); }
  }
  return (
    <div className="max-w-md mx-auto space-y-3 pt-8">
      <h1 className="text-[20px] font-bold">Jamoaga taklif</h1>
      {!/^[a-f0-9]{40}$/.test(token) && <ErrorNotice error="Taklif havolasi noto‘g‘ri." />}
      <ErrorNotice error={err} />
      {res ? (
        <div className="rounded-[var(--radius-md)] bg-accent-soft p-4 text-sm" role="status">
          <b>@{res.bot}</b> jamoasiga qo‘shildingiz. Rolingiz: <b>{res.role}</b>.
          <Link to={`/bots/${res.bot}`} className="block mt-3 underline">Botni ochish</Link>
        </div>
      ) : (
        <button onClick={accept} disabled={busy || !/^[a-f0-9]{40}$/.test(token)} className="w-full py-3 rounded-[var(--radius-sm)] bg-accent text-accent-text font-bold disabled:opacity-50">
          {busy ? 'Qabul qilinmoqda…' : 'Taklifni qabul qilish'}
        </button>
      )}
    </div>
  );
}
