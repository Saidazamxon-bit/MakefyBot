import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/format';
import BrandLogo from './BrandLogo';
import NotificationBell from './NotificationBell';
import { useI18n } from '../i18n';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const tarif = user?.tarif && user.tarif !== 'oddiy' ? user.tarif : null;

  useEffect(() => {
    function onClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="mf-topbar">
      <div className="mf-topbar__inner">
        <Link to="/dashboard" className="mf-topbar__brand" aria-label="Makefy bosh sahifa">
          <BrandLogo />
        </Link>

        <div className="mf-topbar__right">
          <button type="button" onClick={() => window.dispatchEvent(new Event('mf:palette'))} aria-label={t('palette.open')} title={t('palette.open')}
            className="w-11 h-11 md:w-10 md:h-10 grid place-items-center rounded-full text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-accent">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </button>
          <NotificationBell />
          {tarif && (
            <Link to="/tariflar" className="mf-plan-pill">
              <i className="fa-solid fa-crown" /> {tarif}
            </Link>
          )}

          <Link to="/deposit" className="mf-balance-pill" aria-label="Balansni to‘ldirish">
            <span className="mf-balance-pill__icon"><i className="fa-solid fa-wallet" /></span>
            <span>{formatMoney(user?.pul ?? 0)}</span>
            <i className="fa-solid fa-plus mf-balance-pill__plus" />
          </Link>

          <div className="mf-profile" ref={ref}>
            <button type="button" className="mf-profile__button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Profil menyusi">
              {(user?.login || 'F').slice(0, 1).toUpperCase()}
              <span className="mf-profile__status" />
            </button>

            {open && (
              <div className="mf-profile__menu">
                <div className="mf-profile__head">
                  <BrandLogo compact />
                  <div>
                    <div className="mf-profile__name">{user?.login}</div>
                    <div className="mf-profile__id">ID: {user?.foydalanuvchi_id || '—'}</div>
                  </div>
                </div>

                <MenuItem to="/profil" icon="fa-user" label="Hisobim" onClick={() => setOpen(false)} />
                <MenuItem to="/tariflar" icon="fa-crown" label="Tariflar" onClick={() => setOpen(false)} />
                <MenuItem to="/chat" icon="fa-comments" label="Chat" onClick={() => setOpen(false)} />
                <MenuItem to="/sozlamalar" icon="fa-gear" label={t('nav.settings')} onClick={() => setOpen(false)} />
                <MenuItem to="/docs" icon="fa-book" label={t('nav.docs')} onClick={() => setOpen(false)} />
                <MenuItem to="/status" icon="fa-heart-pulse" label={t('nav.status')} onClick={() => setOpen(false)} />
                <button type="button" onClick={handleLogout} className="mf-profile__logout">
                  <i className="fa-solid fa-right-from-bracket" /> {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ to, icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="mf-profile__item">
      <i className={'fa-solid ' + icon} /> {label}
      <i className="fa-solid fa-chevron-right mf-profile__chevron" />
    </Link>
  );
}
