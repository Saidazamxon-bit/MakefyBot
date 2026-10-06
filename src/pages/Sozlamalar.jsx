import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, ApiError } from '../lib/api';
import { applyReducedMotion, readReducedMotion } from '../lib/theme';
import { useI18n } from '../i18n';

const THEME_OPTIONS = [
  { value: 'system', icon: 'fa-circle-half-stroke', label: 'Tizim' },
  { value: 'light', icon: 'fa-sun', label: 'Kun' },
  { value: 'dark', icon: 'fa-moon', label: 'Tun' },
];

export default function Sozlamalar() {
  const { user, logout } = useAuth();
  const { preference, setPreference, resolvedTheme, themeSourceLabel } = useTheme();
  const navigate = useNavigate();
  const { t, pref: langPref, setPref: setLangPref } = useI18n();
  const [notif, setNotif] = useState(readLocal('mf_bildirishnoma', '1') !== '0');
  const [reducedMotion, setReducedMotion] = useState(() => readReducedMotion());

  useEffect(() => {
    applyReducedMotion(reducedMotion);
    try { localStorage.setItem('mf_bildirishnoma', notif ? '1' : '0'); localStorage.setItem('mf_reduced_motion', reducedMotion ? '1' : '0'); } catch { /* sessiya ichida ishlaydi */ }
  }, [notif, reducedMotion]);

  async function handleLogout() { await logout(); navigate('/login'); }

  // Telegram <-> Google ulanish holati
  const [link, setLink] = useState(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMsg, setLinkMsg] = useState('');
  const loadLink = () => api.get('/auth/link_status.php').then(setLink).catch(() => setLink(null));
  useEffect(() => { loadLink(); }, []);

  function openExternal(url) {
    const tg = window.Telegram?.WebApp;
    if (tg?.openLink) tg.openLink(url); else window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function startLink() {
    setLinkBusy(true); setLinkMsg('');
    try {
      const data = await api.post(link?.mode === 'telegram' ? '/auth/link_google_start.php' : '/auth/link_start.php', {});
      const url = data?.url || data?.botLink;
      if (url) openExternal(url); else setLinkMsg('Havola olinmadi.');
    } catch (err) {
      setLinkMsg(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally { setLinkBusy(false); }
  }

  async function unlink() {
    if (!window.confirm('Ulanishni uzasizmi?')) return;
    setLinkBusy(true); setLinkMsg('');
    try { await api.post('/auth/link_unlink.php', {}); await loadLink(); }
    catch (err) { setLinkMsg(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.'); }
    finally { setLinkBusy(false); }
  }

  return <div className="mf-page mf-settings-page">
    <header className="mf-settings-head"><div><span className="mf-kicker">WORKSPACE PREFERENCES</span><h1>Sozlamalar</h1><p>Makefy ko‘rinishi va ishlashini o‘zingizga moslang.</p></div><div className="mf-settings-head__icon"><i className="fa-solid fa-sliders" /></div></header>
    <section className="mf-settings-profile"><div className="mf-settings-avatar">{(user?.login || 'M').slice(0, 1).toUpperCase()}</div><div><strong>{user?.login || 'Makefy foydalanuvchisi'}</strong><span>ID: {user?.user_id || '—'}</span></div><span className="mf-status-badge is-online"><i className="fa-solid fa-circle" /> Hisob faol</span></section>
    <section className="mf-settings-section"><div className="mf-section-heading"><div><span className="mf-kicker">APPEARANCE</span><h2>Ko‘rinish</h2></div></div><div className="mf-settings-card"><div className="mf-theme-picker" role="radiogroup" aria-label="Ko‘rinish rejimi">{THEME_OPTIONS.map((option) => <button key={option.value} type="button" role="radio" aria-checked={preference === option.value} onClick={() => setPreference(option.value)} className={'mf-theme-choice ' + (preference === option.value ? 'is-active' : '')}><i className={'fa-solid ' + option.icon} /><span>{option.label}</span>{preference === option.value && <i className="fa-solid fa-check" />}</button>)}</div>{<p className="mf-theme-hint"><i className={'fa-solid ' + (resolvedTheme === 'dark' ? 'fa-moon' : 'fa-sun')} />{preference === 'system' ? ('Hozir: ' + (resolvedTheme === 'dark' ? 'Tun' : 'Kun') + ' rejimi · ' + themeSourceLabel) : ('Doimiy ' + (preference === 'dark' ? 'Tun' : 'Kun') + ' rejimi tanlangan')}</p>}<SettingRow icon="fa-wand-magic-sparkles" title="Harakatlarni kamaytirish" subtitle="Animatsiyalarni yengil rejimga o‘tkazish" checked={reducedMotion} onChange={setReducedMotion} /></div></section>
    <section className="mf-settings-section"><div className="mf-section-heading"><div><span className="mf-kicker">NOTIFICATIONS</span><h2>Bildirishnomalar</h2></div></div><div className="mf-settings-card"><SettingRow icon="fa-bell" title="Bot va tizim xabarlari" subtitle="Muhim yangiliklar va holat o‘zgarishlari" checked={notif} onChange={setNotif} /></div></section>
    <section className="mf-settings-section"><div className="mf-section-heading"><div><span className="mf-kicker">LANGUAGE</span><h2>{t('settings.language')}</h2><p>{t('settings.languageHint')}</p></div></div>
      <div role="radiogroup" aria-label={t('lang.label')} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['auto', 'uz', 'ru', 'en'].map((l) => (
          <button key={l} type="button" role="radio" aria-checked={langPref === l} onClick={() => setLangPref(l)} className={'mf-button ' + (langPref === l ? 'mf-button--primary' : 'mf-button--ghost')}>{l === 'auto' ? t('lang.auto') : { uz: 'O‘zbekcha', ru: 'Русский', en: 'English' }[l]}</button>
        ))}
      </div>
    </section>
    {link && <section className="mf-settings-section"><div className="mf-section-heading"><div><span className="mf-kicker">CONNECTIONS</span><h2>{link.mode === 'telegram' ? 'Google hisob' : 'Telegram akkaunt'}</h2></div></div><div className="mf-settings-links">{link.linked ? <button type="button" disabled={linkBusy} onClick={unlink} className="mf-settings-link mf-settings-link--danger"><span><i className="fa-solid fa-link-slash" /></span><b>{link.label || 'Ulangan'} — uzish</b><i className="fa-solid fa-arrow-right" /></button> : <button type="button" disabled={linkBusy} onClick={startLink} className="mf-settings-link"><span><i className={'fa-brands ' + (link.mode === 'telegram' ? 'fa-google' : 'fa-telegram')} /></span><b>{link.mode === 'telegram' ? 'Google bilan ulash' : 'Telegram ulash'}</b><i className="fa-solid fa-arrow-up-right-from-square" /></button>}</div>{linkMsg && <p className="mf-kicker" role="alert">{linkMsg}</p>}</section>}
    <section className="mf-settings-section"><div className="mf-section-heading"><div><span className="mf-kicker">HELP & ACCOUNT</span><h2>Hisob</h2></div></div><div className="mf-settings-links"><a href="/Manual/" className="mf-settings-link"><span><i className="fa-solid fa-book-open" /></span><b>Qo‘llanma</b><i className="fa-solid fa-arrow-up-right-from-square" /></a><button type="button" onClick={handleLogout} className="mf-settings-link mf-settings-link--danger"><span><i className="fa-solid fa-right-from-bracket" /></span><b>Hisobdan chiqish</b><i className="fa-solid fa-arrow-right" /></button></div></section>
  </div>;
}
function readLocal(key, fallback) { try { const value = localStorage.getItem(key); return value === null ? fallback : value; } catch { return fallback; } }
function SettingRow({ icon, title, subtitle, checked, onChange }) { return <div className="mf-setting-row"><span className="mf-setting-row__icon"><i className={'fa-solid '+icon} /></span><div><b>{title}</b><small>{subtitle}</small></div><button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={'mf-switch '+(checked ? 'is-on' : '')}><span /></button></div>; }
