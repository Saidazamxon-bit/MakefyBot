import { Link, NavLink, Outlet, useMatch, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import BrandLogo from './BrandLogo';
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import CommandPalette from './CommandPalette';

const NAV_ITEMS = [
  { to: '/dashboard', end: true, icon: 'fa-house', labelKey: 'nav.home' },
  { to: '/bots', icon: 'fa-robot', labelKey: 'nav.bots' },
  { to: '/analytics', icon: 'fa-chart-line', labelKey: 'nav.analytics' },
  { to: '/hamyon', icon: 'fa-wallet', labelKey: 'nav.wallet', also: ['/deposit', '/vazifalar', '/referal', '/tariflar'] },
  { to: '/market', icon: 'fa-store', labelKey: 'nav.market' },
  { to: '/developer', icon: 'fa-code', labelKey: 'nav.developer' },
  { to: '/chat', icon: 'fa-comments', labelKey: 'nav.help' },
];

// Bitta bot uchun ish maydoni tablari (har bir /bots/:username/... sahifasi tepasida)
function BotTabs() {
  const m = useMatch('/bots/:username/*');
  const u = m?.params?.username;
  if (!u) return null;
  const tabs = [['', 'Umumiy', 'fa-gauge'], ['/kunlik', 'Muddat va to‘lov', 'fa-hourglass-half'], ['/team', 'Jamoa', 'fa-user-group']];
  return (
    <nav className="bt" aria-label={'@' + u}>
      <Link to="/bots" className="bt__back" aria-label="Botlar ro‘yxati"><i className="fa-solid fa-chevron-left" /></Link>
      <b className="bt__name">@{u}</b>
      <div className="bt__tabs">
        {tabs.map(([p, l, i]) => (
          <NavLink key={p} to={`/bots/${u}${p}`} end className={({ isActive }) => 'bt__tab' + (isActive ? ' is-on' : '')}><i className={'fa-solid ' + i} /> {l}</NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function Layout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [palette, setPalette] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v); } };
    const onOpen = () => setPalette(true);
    window.addEventListener('keydown', onKey); window.addEventListener('mf:palette', onOpen);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mf:palette', onOpen); };
  }, []);
  return (
    <div className="app-shell">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-40 focus:px-4 focus:py-2 focus:rounded-[12px] focus:bg-accent focus:text-accent-text">{t('common.skipToContent')}</a>
      <aside className="mf-sidebar" aria-label={t('nav.menu')}>
        <Link to="/dashboard" className="mf-sidebar__brand" aria-label="Makefy bosh sahifa">
          <BrandLogo />
        </Link>

        <div className="mf-sidebar__caption">ISH STOLI</div>

        <nav className="mf-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'mf-sidebar__item ' + (isActive || (item.also || []).some((x) => pathname.startsWith(x)) ? 'is-active' : '')}
            >
              <i className={'fa-solid ' + item.icon} />
              <span>{t(item.labelKey)}</span>
              {item.to === '/chat' && <i className="fa-solid fa-arrow-up-right-from-square mf-sidebar__external" />}
            </NavLink>
          ))}
        </nav>

        <div className="mf-sidebar__promo">
          <span className="mf-sidebar__promo-icon"><i className="fa-solid fa-wand-magic-sparkles" /></span>
          <b>Yangi bot yarating</b>
          <small>G‘oyadan ishlaydigan botgacha — bir nechta qadam.</small>
          <Link to="/create" className="mf-sidebar__promo-link">Boshlash <i className="fa-solid fa-arrow-right" /></Link>
        </div>

        <div className="mf-sidebar__footer">
          <Link to="/sozlamalar" className="mf-sidebar__settings"><i className="fa-solid fa-gear" /> {t('nav.settings')}</Link>
          <span className="mf-sidebar__version">Makefy workspace</span>
        </div>
      </aside>

      <div className="mf-app-column">
        <TopBar />
        <main className="app-main" id="main" tabIndex={-1}>
          <BotTabs />
          <Outlet />
        </main>
      </div>

      <BottomNav />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
