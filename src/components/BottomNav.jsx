import { NavLink } from 'react-router-dom';

const itemClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-1 text-[11px] font-semibold flex-1 py-2 transition-colors ${
    isActive ? 'text-accent' : 'text-text-muted'
  }`;

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-surface border-t border-border px-1 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Asosiy navigatsiya"
    >
      <NavLink to="/" end className={itemClass}>
        <i className="fa-solid fa-house text-[17px]" />
        <span>Bosh</span>
      </NavLink>
      <NavLink to="/bots" className={itemClass}>
        <i className="fa-solid fa-robot text-[17px]" />
        <span>Botlarim</span>
      </NavLink>
      <NavLink to="/vazifalar" className={itemClass}>
        <span className="w-11 h-11 -mt-5 rounded-2xl bg-gradient-to-br from-accent to-accent-dim text-accent-text flex items-center justify-center shadow-[0_4px_20px_rgba(0,245,160,0.3)]">
          <i className="fa-solid fa-coins text-[17px]" />
        </span>
        <span>Vazifalar</span>
      </NavLink>
      <NavLink to="/referal" className={itemClass}>
        <i className="fa-solid fa-users text-[17px]" />
        <span>Referal</span>
      </NavLink>
      <NavLink to="/profil" className={itemClass}>
        <i className="fa-solid fa-user text-[17px]" />
        <span>Profil</span>
      </NavLink>
    </nav>
  );
}
