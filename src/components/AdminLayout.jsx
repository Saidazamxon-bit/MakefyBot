import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: 'fa-gauge-high', label: 'Panel' },
  { to: '/admin/sorovlar', icon: 'fa-paper-plane', label: "So'rovlar" },
  { to: '/admin/chat', icon: 'fa-message', label: 'Chat' },
  { to: '/admin/tariflar', icon: 'fa-crown', label: 'Tariflar' },
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
      <div className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3 bg-bg/90 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 font-extrabold text-sm">
          <i className="fa-solid fa-shield-halved text-accent" /> Admin Panel
        </div>
        <button onClick={handleLogout} className="text-danger text-sm font-bold">
          <i className="fa-solid fa-right-from-bracket mr-1.5" /> Chiqish
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-5xl w-full mx-auto">
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible px-3 py-3 md:w-52 md:flex-shrink-0 md:border-r border-border [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-sm)] text-[13px] font-bold whitespace-nowrap flex-shrink-0 ${
                  isActive ? 'bg-accent-soft text-accent' : 'text-text-muted hover:bg-surface-2'
                }`
              }
            >
              <i className={`fa-solid ${item.icon} w-4`} /> {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 py-4 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
