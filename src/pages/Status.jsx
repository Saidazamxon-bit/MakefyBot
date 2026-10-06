import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useI18n } from '../i18n';
import { Badge, Card, EmptyState, Skeleton, Button } from '../components/ui';

const TONE = { operational: 'success', degraded: 'danger', unknown: 'neutral' };

// 30 kunlik "uptime" chiziqlari: rang + belgi (rang-ko'rlar uchun), ma'lumot yo'q kun alohida
function Bars({ days, t }) {
  return (
    <div className="flex gap-[2px] h-8 items-end" role="img" aria-label={t('status.uptime30', { pct: '' })}>
      {days.map((d) => {
        const v = d.uptime;
        const bg = v === null ? 'var(--surface-3)' : v >= 99.5 ? 'var(--success)' : v >= 95 ? '#F2B84B' : 'var(--danger)';
        return <span key={d.day} title={`${d.day}: ${v === null ? t('status.noData') : v + '%'}`} className="flex-1 rounded-[2px] min-w-[3px]" style={{ background: bg, height: v === null ? '30%' : '100%' }} />;
      })}
    </div>
  );
}

export default function Status() {
  const { t } = useI18n();
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  const load = () => { setErr(false); api.get('/status.php').then(setD).catch(() => setErr(true)); };
  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold">{t('status.title')}</h1>
        <Link to="/" className="text-sm underline text-text-muted">makefy</Link>
      </div>
      {err && <Card role="alert"><p className="text-danger text-sm font-semibold">{t('status.error')}</p><Button className="mt-3" onClick={load}>{t('common.retry')}</Button></Card>}
      {!d && !err && <div className="space-y-3" aria-busy="true"><Skeleton className="h-16" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>}
      {d && (
        <>
          <Card className={d.overall === 'operational' ? 'border-accent' : d.overall === 'degraded' ? 'border-danger' : ''} role="status">
            <div className="flex items-center gap-3">
              <i className={'fa-solid text-xl ' + (d.overall === 'operational' ? 'fa-circle-check text-success' : d.overall === 'degraded' ? 'fa-triangle-exclamation text-danger' : 'fa-circle-question text-text-muted')} aria-hidden="true" />
              <b>{t('status.overall.' + d.overall)}</b>
            </div>
            <p className="text-[12px] text-text-dim mt-1 tabular-nums">{t('status.updated', { time: new Date(d.updated).toLocaleTimeString() })}</p>
          </Card>
          {d.components.map((c) => (
            <Card key={c.key}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-sm">{t('status.component.' + c.key)}</h2>
                <Badge tone={TONE[c.state]}>{t('status.state.' + c.state)}</Badge>
              </div>
              <Bars days={c.days} t={t} />
              <p className="text-[12px] text-text-muted mt-2 tabular-nums">{t('status.uptime30', { pct: c.uptime30 === null ? t('status.noData') : c.uptime30 + '%' })}</p>
            </Card>
          ))}
          <Card>
            <h2 className="font-bold text-sm mb-2">{t('status.incidents')}</h2>
            {d.incidents.length === 0 ? <EmptyState icon="fa-shield-heart" title={t('status.noIncidents')} /> : (
              <ul className="divide-y divide-border">
                {d.incidents.map((i) => (
                  <li key={i.id} className="py-3">
                    <div className="flex items-center justify-between gap-2"><b className="text-[14px]">{i.title}</b><Badge tone={i.resolved ? 'success' : 'warning'}>{i.resolved ? t('status.resolved') : t('status.ongoing')}</Badge></div>
                    {i.body && <p className="text-[13px] text-text-muted mt-1">{i.body}</p>}
                    <p className="text-[11px] text-text-dim tabular-nums mt-1">{i.created_at}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
