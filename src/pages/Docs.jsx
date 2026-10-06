import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Card } from '../components/ui';

const SECTIONS = ['start', 'templates', 'api'];
const FAQ = [1, 2, 3, 4];

export default function Docs() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(0);
  const needle = q.trim().toLowerCase();
  const sections = useMemo(() => SECTIONS.filter((s) => !needle || (t(`docs.${s}.title`) + ' ' + t(`docs.${s}.body`)).toLowerCase().includes(needle)), [needle, t]);
  const faq = useMemo(() => FAQ.filter((n) => !needle || (t(`docs.faq.q${n}`) + ' ' + t(`docs.faq.a${n}`)).toLowerCase().includes(needle)), [needle, t]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-[200px_1fr] gap-6">
      <nav aria-label={t('docs.toc')} className="md:sticky md:top-4 self-start">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-text-dim mb-2">{t('docs.toc')}</h2>
        <ul className="space-y-1 text-sm">
          {SECTIONS.map((s) => <li key={s}><a className="block py-2 min-h-[44px] md:min-h-0 text-text-muted hover:text-text" href={`#${s}`}>{t(`docs.${s}.title`)}</a></li>)}
          <li><a className="block py-2 min-h-[44px] md:min-h-0 text-text-muted hover:text-text" href="#faq">{t('docs.faq.title')}</a></li>
          <li><a className="block py-2 min-h-[44px] md:min-h-0 text-accent" href="/v1/docs" target="_blank" rel="noopener noreferrer">OpenAPI ↗</a></li>
        </ul>
      </nav>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[24px] font-bold">{t('docs.title')}</h1>
          <Link to="/" className="text-sm underline text-text-muted">makefy</Link>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('docs.search')} aria-label={t('docs.search')}
          className="w-full min-h-[44px] px-3.5 rounded-[12px] bg-surface-2 border border-border text-sm outline-none focus:border-accent" />
        {sections.map((s) => (
          <Card key={s} id={s} aria-labelledby={`h-${s}`}>
            <h2 id={`h-${s}`} className="font-bold mb-1">{t(`docs.${s}.title`)}</h2>
            <p className="text-[14px] text-text-muted leading-relaxed">{t(`docs.${s}.body`)}</p>
          </Card>
        ))}
        <Card id="faq">
          <h2 className="font-bold mb-2">{t('docs.faq.title')}</h2>
          {faq.map((n) => (
            <div key={n} className="border-t border-border first:border-0">
              <h3>
                <button onClick={() => setOpen(open === n ? 0 : n)} aria-expanded={open === n} aria-controls={`faq-${n}`}
                  className="w-full flex items-center justify-between gap-3 text-left py-3 min-h-[44px] font-semibold text-[14px]">
                  {t(`docs.faq.q${n}`)}<i className={'fa-solid text-text-muted ' + (open === n ? 'fa-chevron-up' : 'fa-chevron-down')} aria-hidden="true" />
                </button>
              </h3>
              {open === n && <p id={`faq-${n}`} className="pb-3 text-[13.5px] text-text-muted">{t(`docs.faq.a${n}`)}</p>}
            </div>
          ))}
        </Card>
      </div>
    </main>
  );
}
