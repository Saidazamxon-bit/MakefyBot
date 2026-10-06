import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import ErrorNotice from '../components/ErrorNotice';

const ROLE_LABEL = { owner: 'Egasi', admin: 'Admin', moderator: 'Moderator', viewer: 'Kuzatuvchi' };
const ROLE_HELP = {
  admin: 'Sozlamalar, xabar yuborish, jamoani boshqarish (admin/moderator qo‘sha oladi)',
  moderator: 'Xabar yuborish va statistika',
  viewer: 'Faqat ko‘rish (statistika)',
};
const ACTION_LABEL = {
  'member.add': 'A‘zo qo‘shildi', 'member.role': 'Rol o‘zgardi', 'member.remove': 'A‘zo olib tashlandi', 'member.leave': 'A‘zo chiqib ketdi',
  'invite.create': 'Taklif havolasi yaratildi', 'invite.accept': 'Taklif qabul qilindi', 'broadcast.send': 'Ommaviy xabar yuborildi', 'bot.create': 'Bot yaratildi',
};

export default function Team() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [audit, setAudit] = useState(null);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState('');
  const [role, setRole] = useState('moderator');
  const [uid, setUid] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const q = `bot=${encodeURIComponent(username)}`;

  function load() {
    api.get(`/team/list.php?${q}`).then(setData).catch((e) => setErr(e));
    api.get(`/team/audit.php?${q}`).then((r) => setAudit(r.items)).catch(() => setAudit([]));
  }
  useEffect(load, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(fn, okText) {
    setBusy(true); setErr(null); setMsg('');
    try { await fn(); setMsg(okText); load(); } catch (e) { setErr(e instanceof ApiError ? e : new Error('Xatolik yuz berdi.')); } finally { setBusy(false); }
  }
  const add = (e) => { e.preventDefault(); run(() => api.post(`/team/set_role.php?${q}`, { user_id: uid.trim(), role }), 'A‘zo saqlandi.').then(() => setUid('')); };
  const remove = (m) => { if (confirm(`${m.user_id} jamoadan olib tashlansinmi?`)) run(() => api.post(`/team/remove.php?${q}`, { user_id: m.user_id }), 'A‘zo olib tashlandi.'); };
  const changeRole = (m, r) => run(() => api.post(`/team/set_role.php?${q}`, { user_id: m.user_id, role: r }), 'Rol o‘zgartirildi.');
  async function invite() {
    setBusy(true); setErr(null); setLink('');
    try {
      const r = await api.post(`/team/invite.php?${q}`, { role });
      setLink(`${window.location.origin}/join?token=${r.token}`);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  }

  if (err && !data) return <div className="space-y-3"><ErrorNotice error={err} /><Link to="/bots" className="underline text-sm">← Botlarim</Link></div>;
  if (!data) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" aria-busy="true" />;
  const assignable = data.myRole === 'owner' ? ['admin', 'moderator', 'viewer'] : ['moderator', 'viewer'];
  const nonOwner = data.members.length - 1;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <Link to={`/bots/${username}`} aria-label="Orqaga" className="mf-icon-button"><i className="fa-solid fa-arrow-left" /></Link>
        <h1 className="text-[20px] font-bold">Jamoa · @{username}</h1>
      </div>
      <ErrorNotice error={err} />
      {msg && <div className="text-[13px] font-semibold text-accent bg-accent-soft rounded-[var(--radius-sm)] px-3 py-2" role="status">{msg}</div>}

      <section className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
        <h2 className="font-bold text-sm mb-1">A‘zo qo‘shish</h2>
        <p className="text-[12px] text-text-muted mb-3">Jamoa: {nonOwner}{data.limit > 0 ? ` / ${data.limit}` : ''} a‘zo (egasidan tashqari)</p>
        <form onSubmit={add} className="space-y-2">
          <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="Telegram ID yoki foydalanuvchi ID" aria-label="Foydalanuvchi ID" autoComplete="off"
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent" />
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Rol" className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm">
            {assignable.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <p className="text-[12px] text-text-muted">{ROLE_HELP[role]}</p>
          <div className="flex gap-2">
            <button disabled={busy || !uid.trim()} className="flex-1 py-2.5 rounded-[var(--radius-sm)] bg-accent text-accent-text font-bold text-sm disabled:opacity-50">Qo‘shish</button>
            <button type="button" onClick={invite} disabled={busy} className="flex-1 py-2.5 rounded-[var(--radius-sm)] border border-border font-bold text-sm disabled:opacity-50">Havola yaratish</button>
          </div>
        </form>
        {link && (
          <div className="mt-3 text-[12.5px] bg-surface-2 rounded-[var(--radius-sm)] p-3 break-all">
            <b>Taklif havolasi</b> (7 kun, bir marta ishlaydi):<br /><code>{link}</code>
            <button onClick={() => navigator.clipboard?.writeText(link)} className="block mt-2 underline">Nusxa olish</button>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
        <h2 className="font-bold text-sm mb-2">A‘zolar</h2>
        <ul className="divide-y divide-border">
          {data.members.map((m) => (
            <li key={m.user_id} className="py-2.5 flex items-center justify-between gap-2 text-[13px]">
              <span className="font-mono truncate">{m.user_id}</span>
              <span className="flex items-center gap-2">
                {m.role === 'owner' || (m.role === 'admin' && data.myRole !== 'owner') ? (
                  <span className="px-2 py-1 rounded-full bg-surface-2 text-[12px] font-bold">{ROLE_LABEL[m.role]}</span>
                ) : (
                  <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} aria-label={`${m.user_id} roli`} className="px-2 py-1 rounded-[8px] bg-surface-2 border border-border text-[12px]">
                    {assignable.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                )}
                {m.role !== 'owner' && (m.role !== 'admin' || data.myRole === 'owner') && (
                  <button onClick={() => remove(m)} aria-label="Olib tashlash" className="text-danger"><i className="fa-solid fa-user-minus" /></button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {audit && (
        <section className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
          <h2 className="font-bold text-sm mb-2">Harakatlar jurnali</h2>
          {audit.length === 0 ? <p className="text-[13px] text-text-muted">Hozircha yozuv yo‘q.</p> : (
            <ul className="divide-y divide-border">
              {audit.map((a) => (
                <li key={a.id} className="py-2 text-[12.5px]">
                  <div className="flex justify-between gap-2"><b>{ACTION_LABEL[a.action] || a.action}</b><span className="text-text-muted tabular-nums">{a.created_at}</span></div>
                  <div className="text-text-muted">Kim: <span className="font-mono">{a.actor_id}</span></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
