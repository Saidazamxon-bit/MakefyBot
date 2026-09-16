import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/format';

export default function TopBar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const tarif = user?.tarif && user.tarif !== 'oddiy' ? user.tarif : null;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3 bg-bg/90 backdrop-blur border-b border-border">
      {tarif ? (
        <Link
          to="/tariflar"
          className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-accent-soft text-accent"
        >
          <i className="fa-solid fa-crown" /> {tarif}
        </Link>
      ) : (
        <span />
      )}

      <Link
        to="/deposit"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-[13px] font-bold"
      >
        <i className="fa-solid fa-wallet text-accent" />
        <span>{formatMoney(user?.pul ?? 0)}</span>
        <i className="fa-solid fa-plus text-accent text-[10px]" />
      </Link>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-9 h-9 rounded-full bg-surface-3 border border-border flex items-center justify-center font-bold text-sm"
        >
          {(user?.login || 'F').slice(0, 1).toUpperCase()}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-2 border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <div className="font-bold text-sm truncate">{user?.login}</div>
              <div className="text-xs text-text-muted">ID: {user?.user_id}</div>
            </div>
            <MenuItem to="/profil" icon="fa-user" label="Hisobim" onClick={() => setOpen(false)} />
            <MenuItem to="/tariflar" icon="fa-crown" label="Tariflar" onClick={() => setOpen(false)} />
            <MenuItem to="/chat" icon="fa-comments" label="Chat" onClick={() => setOpen(false)} />
            <MenuItem to="/sozlamalar" icon="fa-gear" label="Sozlamalar" onClick={() => setOpen(false)} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft"
            >
              <i className="fa-solid fa-right-from-bracket w-4" /> Chiqish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-surface-3"
    >
      <i className={`fa-solid ${icon} w-4 text-text-muted`} /> {label}
    </Link>
  );
}
