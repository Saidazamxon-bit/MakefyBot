import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="min-h-[70vh] grid place-items-center px-4">
      <EmptyState icon="fa-compass" title={t('nf.title')} body={t('nf.body')}
        action={<Link to="/" className="inline-flex items-center min-h-[44px] px-5 rounded-[12px] font-bold text-sm bg-gradient-to-r from-accent to-accent-dim text-accent-text">{t('nf.cta')}</Link>} />
    </main>
  );
}
