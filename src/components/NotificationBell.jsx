import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useI18n } from '../i18n';
import { EmptyState, Skeleton } from './ui';

const TONE = { info: 'text-info', success: 'text-success', warning: 'text-warn', error: 'text-danger' };
const ICON = { info: 'fa-circle-info', success: 'fa-circle-check', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark' };

export default function NotificationBell() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const wrap = useRef(null);

  const load = () => api.get('/notifications/list.php').then((d) => { setData(d); setErr(false); }).catch(() => setErr(true));
  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  async function markAll() { try { await api.post('/notifications/read.php', { id: 0 }); load(); } catch { /* keyingi yangilanishda */ } }
  async function openItem(n) {
    if (!n.is_read) { try { await api.post('/notifications/read.php', { id: n.id }); load(); } catch { /* ignore */ } }
    if (n.link) { setOpen(false); nav(n.link); }
  }
  const unread = data?.unread || 0;

  return (
    <div className="relative" ref={wrap}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}
        aria-label={`${t('notif.title')}${unread ? ', ' + t('notif.unread', { n: unread }) : ''}`}
        className="relative w-11 h-11 md:w-10 md:h-10 grid place-items-center rounded-full text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-accent">
        <i className="fa-regular fa-bell" aria-hidden="true" />
        {unread > 0 && <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-bold grid place-items-center tabular-nums">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div role="region" aria-label={t('notif.title')} className="mf-notif-panel absolute right-0 mt-2 w-[min(360px,calc(100vw-24px))] z-20 rounded-[16px] bg-surface border border-border p-3 shadow-lg">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="font-bold text-sm">{t('notif.title')}</h2>
            {unread > 0 && <button onClick={markAll} className="text-[12px] underline text-accent">{t('notif.markAll')}</button>}
          </div>
          {!data && !err && <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
          {err && <p className="text-[13px] text-danger px-1 py-3">{t('notif.error')}</p>}
          {data && data.items.length === 0 && <EmptyState icon="fa-bell-slash" title={t('notif.empty')} body={t('notif.emptyHint')} />}
          {data && data.items.length > 0 && (
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
              {data.items.map((n) => (
                <li key={n.id}>
                  <button onClick={() => openItem(n)} className={'w-full text-left flex gap-3 px-2 py-3 min-h-[44px] ' + (n.is_read ? 'opacity-70' : '')}>
                    <i className={'fa-solid mt-0.5 ' + ICON[n.kind] + ' ' + TONE[n.kind]} aria-hidden="true" />
                    <span className="flex-1 min-w-0"><b className="block text-[13px]">{n.title}</b>{n.body && <span className="block text-[12px] text-text-muted">{n.body}</span>}<span className="block text-[11px] text-text-dim tabular-nums">{n.created_at}</span></span>
                    {!n.is_read && <span className="w-2 h-2 mt-1.5 rounded-full bg-accent" aria-label="•" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
