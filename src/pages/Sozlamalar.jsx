import { useEffect, useState } from 'react';

function getTheme() {
  try {
    return localStorage.getItem('mf_tema') || 'dark';
  } catch {
    return 'dark';
  }
}
function getNotif() {
  try {
    return localStorage.getItem('mf_bildirishnoma') !== '0';
  } catch {
    return true;
  }
}

export default function Sozlamalar() {
  const [theme, setTheme] = useState(getTheme());
  const [notif, setNotif] = useState(getNotif());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('mf_tema', theme);
    } catch {
      /* localStorage mavjud emas — sozlama shu sessiyada saqlanmaydi */
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('mf_bildirishnoma', notif ? '1' : '0');
    } catch {
      /* localStorage mavjud emas — sozlama shu sessiyada saqlanmaydi */
    }
  }, [notif]);

  return (
    <div className="space-y-1">
      <h2 className="font-extrabold text-lg mb-3">Sozlamalar</h2>

      <div className="bg-surface border border-border rounded-[var(--radius-md)] px-4 divide-y divide-border">
        <Row
          icon="fa-moon"
          title="Tungi rejim"
          subtitle="Ekran mavzusini almashtirish"
          checked={theme === 'dark'}
          onChange={(v) => setTheme(v ? 'dark' : 'light')}
        />
        <Row
          icon="fa-bell"
          title="Bildirishnomalar"
          subtitle="Bot va tizim xabarlari"
          checked={notif}
          onChange={setNotif}
        />
        <div className="flex items-center justify-between py-3.5">
          <div className="flex items-center gap-3">
            <IconBox icon="fa-language" />
            <div>
              <div className="font-bold text-sm">Til</div>
            </div>
          </div>
          <span className="text-sm text-text-muted font-semibold">O'zbekcha</span>
        </div>
      </div>

      <a
        href="/Manual/"
        className="mt-4 flex items-center justify-center gap-2 py-3 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm"
      >
        <i className="fa-solid fa-book-open" /> Qo'llanma
      </a>
    </div>
  );
}

function IconBox({ icon }) {
  return (
    <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-surface-3 flex items-center justify-center text-accent">
      <i className={`fa-solid ${icon}`} />
    </div>
  );
}

function Row({ icon, title, subtitle, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3.5 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <IconBox icon={icon} />
        <div className="min-w-0">
          <div className="font-bold text-sm">{title}</div>
          <div className="text-[12px] text-text-muted truncate">{subtitle}</div>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors ${
          checked ? 'bg-accent' : 'bg-surface-4'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
