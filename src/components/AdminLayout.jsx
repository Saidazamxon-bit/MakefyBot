import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: 'fa-gauge-high', label: 'Panel' },
  { to: '/admin/sorovlar', icon: 'fa-paper-plane', label: "So'rovlar" },
  { to: '/admin/chat', icon: 'fa-message', label: 'Chat' },
  { to: '/admin/bot-tariflar', icon: 'fa-layer-group', label: 'Bot tariflari' },
  { to: '/admin/tariflar', icon: 'fa-crown', label: 'Umumiy tarif (chegirma)' },
  { to: '/admin/promokodlar', icon: 'fa-ticket', label: 'Promo' },
  { to: '/admin/kanallar', icon: 'fa-money-bill-trend-up', label: 'Kanallar' },
  { to: '/admin/turlar', icon: 'fa-layer-group', label: 'Turlar' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="mf-topbar">
        <div className="mf-topbar__inner">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent-soft text-accent text-[10px] font-extrabold uppercase tracking-wide"><i className="fa-solid fa-shield-halved" /> Admin</span>
          </div>
          <button type="button" onClick={handleLogout} className="text-danger text-sm font-bold">
            <i className="fa-solid fa-right-from-bracket mr-1.5" /> Chiqish
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row max-w-5xl w-full mx-auto">
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible px-3 py-3 md:w-52 md:flex-shrink-0 md:border-r border-border [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => 'flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-sm)] text-[13px] font-bold whitespace-nowrap flex-shrink-0 ' + (isActive ? 'bg-accent-soft text-accent' : 'text-text-muted hover:bg-surface-2')}>
              <i className={'fa-solid ' + item.icon + ' w-4'} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 px-4 py-4 min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}
