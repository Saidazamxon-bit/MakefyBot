import { NavLink, useLocation } from 'react-router-dom';
const itemClass = ({ isActive }) => 'mf-nav-item ' + (isActive ? 'is-active' : '');
const WALLET = ['/hamyon', '/deposit', '/vazifalar', '/referal', '/tariflar'];

export default function BottomNav() {
  const { pathname } = useLocation();
  const wallet = WALLET.some((p) => pathname.startsWith(p));
  return (
    <nav className="mf-bottom-nav" role="navigation" aria-label="Asosiy navigatsiya">
      <NavLink to="/dashboard" end className={itemClass}><i className="fa-solid fa-house" /><span>Asosiy</span></NavLink>
      <NavLink to="/bots" className={itemClass}><i className="fa-solid fa-robot" /><span>Botlar</span></NavLink>
      <NavLink to="/create" className="mf-nav-create" aria-label="Yangi bot yaratish"><span><i className="fa-solid fa-plus" /></span><small>Yangi bot</small></NavLink>
      <NavLink to="/hamyon" className={'mf-nav-item ' + (wallet ? 'is-active' : '')}><i className="fa-solid fa-wallet" /><span>Hamyon</span></NavLink>
      <NavLink to="/profil" className={itemClass}><i className="fa-solid fa-user" /><span>Profil</span></NavLink>
    </nav>
  );
}
