import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '', ...props }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Kun rejimiga o‘tish' : 'Tun rejimiga o‘tish'}
      title={isDark ? 'Kun rejimiga o‘tish' : 'Tun rejimiga o‘tish'}
      onClick={toggleTheme}
      className={['mf-global-theme-toggle', className].filter(Boolean).join(' ')}
      {...props}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
