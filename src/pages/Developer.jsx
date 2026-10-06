import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import ErrorNotice from '../components/ErrorNotice';

export default function Developer() {
  const [keys, setKeys] = useState(null);
  const [hooks, setHooks] = useState(null);
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [evSel, setEvSel] = useState([]);
  const [secret, setSecret] = useState(null); // {title, value}
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.get('/developer/keys.php').then((r) => setKeys(r.keys)).catch(setErr);
    api.get('/developer/webhooks.php').then((r) => { setHooks(r.endpoints); setEvents(r.events); }).catch(setErr);
  }
  useEffect(load, []);

  async function act(fn) {
    setBusy(true); setErr(null);
    try { await fn(); load(); } catch (e) { setErr(e instanceof ApiError ? e : new Error('Xatolik yuz berdi.')); } finally { setBusy(false); }
  }
  const createKey = (e) => { e.preventDefault(); act(async () => { const r = await api.post('/developer/keys.php', { name }); setSecret({ title: 'API kalit', value: r.key }); setName(''); }); };
  const revoke = (k) => { if (confirm(`"${k.name}" kaliti o‘chirilsinmi? Uni ishlatayotgan ilovalar to‘xtaydi.`)) act(() => api.post('/developer/keys.php', { amal: 'revoke', id: k.id })); };
  const addHook = (e) => { e.preventDefault(); act(async () => { const r = await api.post('/developer/webhooks.php', { url, events: evSel }); setSecret({ title: 'Webhook imzo kaliti', value: r.secret }); setUrl(''); setEvSel([]); }); };
  const delHook = (h) => { if (confirm('Webhook manzili o‘chirilsinmi?')) act(() => api.post('/developer/webhooks.php', { amal: 'delete', id: h.id })); };

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-[20px] font-bold">Dasturchi</h1>
      <ErrorNotice error={err} />
      {secret && (
        <div className="rounded-[var(--radius-md)] bg-accent-soft p-4 text-[13px]" role="status">
          <b>{secret.title}</b> — faqat hozir ko‘rsatiladi, nusxa oling:
          <code className="block mt-2 p-2 bg-surface rounded-[var(--radius-sm)] break-all">{secret.value}</code>
          <div className="flex gap-3 mt-2"><button onClick={() => navigator.clipboard?.writeText(secret.value)} className="underline">Nusxa olish</button><button onClick={() => setSecret(null)} className="underline">Yopish</button></div>
        </div>
      )}

      <section className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
        <h2 className="font-bold text-sm mb-1">API kalitlar</h2>
        <p className="text-[12px] text-text-muted mb-3">Bearer auth, limit: kalit bo‘yicha 120 so‘rov/daq. Hujjat: <a className="underline" href="/v1/docs" target="_blank" rel="noopener noreferrer">/v1/docs</a></p>
        <form onSubmit={createKey} className="flex gap-2 mb-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kalit nomi (masalan: CRM)" aria-label="Kalit nomi" maxLength={60} className="flex-1 px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent" />
          <button disabled={busy || !name.trim()} className="px-4 rounded-[var(--radius-sm)] bg-accent text-accent-text font-bold text-sm disabled:opacity-50">Yaratish</button>
        </form>
        {keys === null ? <div className="h-10 bg-surface-2 rounded animate-pulse" /> : keys.length === 0 ? <p className="text-[13px] text-text-muted">Hali kalit yo‘q.</p> : (
          <ul className="divide-y divide-border">
            {keys.map((k) => (
              <li key={k.id} className="py-2 flex items-center justify-between gap-2 text-[13px]">
                <div className="min-w-0"><b>{k.name}</b> <code className="text-text-muted">{k.prefix}…</code><div className="text-[12px] text-text-muted">Oxirgi ishlatilgan: {k.last_used_at || 'hech qachon'}</div></div>
                <button onClick={() => revoke(k)} aria-label={`${k.name} kalitini o‘chirish`} className="text-danger"><i className="fa-solid fa-trash" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--radius-md)] bg-surface border border-border p-4">
        <h2 className="font-bold text-sm mb-1">Chiquvchi webhooklar</h2>
        <p className="text-[12px] text-text-muted mb-3">Har so‘rov <code>X-Makefy-Signature: t=…,v1=…</code> (HMAC-SHA256) bilan imzolanadi.</p>
        <form onSubmit={addHook} className="space-y-2 mb-3">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://sizning-sayt.uz/webhook" aria-label="Webhook URL" className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent" />
          <div className="flex flex-wrap gap-3 text-[13px]">
            {events.map((ev) => (
              <label key={ev} className="flex items-center gap-1.5"><input type="checkbox" checked={evSel.includes(ev)} onChange={(e) => setEvSel((s) => (e.target.checked ? [...s, ev] : s.filter((x) => x !== ev)))} />{ev}</label>
            ))}
          </div>
          <p className="text-[12px] text-text-muted">Hech narsa tanlanmasa — barcha hodisalar.</p>
          <button disabled={busy || !url.trim()} className="w-full py-2.5 rounded-[var(--radius-sm)] bg-accent text-accent-text font-bold text-sm disabled:opacity-50">Qo‘shish</button>
        </form>
        {hooks === null ? <div className="h-10 bg-surface-2 rounded animate-pulse" /> : hooks.length === 0 ? <p className="text-[13px] text-text-muted">Hali webhook yo‘q.</p> : (
          <ul className="divide-y divide-border">
            {hooks.map((h) => (
              <li key={h.id} className="py-2 flex items-center justify-between gap-2 text-[13px]">
                <div className="min-w-0"><div className="truncate">{h.url}</div><div className="text-[12px] text-text-muted">{h.events}</div></div>
                <button onClick={() => delHook(h)} aria-label="Webhookni o‘chirish" className="text-danger"><i className="fa-solid fa-trash" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
