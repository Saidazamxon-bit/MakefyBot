import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginName, setLoginName] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!loginName.trim() || !pass) {
      setError('Login va parolni kiriting.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(loginName.trim(), pass);
      navigate(result.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kirishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-bg">
      <div className="w-full max-w-sm bg-surface border border-border rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)]">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-accent-soft text-accent flex items-center justify-center text-2xl">
            <i className="fa-solid fa-robot" />
          </div>
          <h2 className="text-lg font-extrabold">MakerBot kabinetiga kirish</h2>
          <p className="text-sm text-text-muted mt-1">Login va parolingizni kiriting</p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div className="relative">
            <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              placeholder="Login"
              autoFocus
              className="w-full pl-11 pr-4 py-3 rounded-[var(--radius-md)] bg-surface-2 border border-border text-[15px] outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="relative">
            <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type={showPass ? 'text' : 'password'}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Parol"
              className="w-full pl-11 pr-11 py-3 rounded-[var(--radius-md)] bg-surface-2 border border-border text-[15px] outline-none focus:border-accent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim"
              tabIndex={-1}
            >
              <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
            </button>
          </div>

          {error && (
            <div className="text-[13px] font-semibold text-danger bg-danger-soft rounded-[var(--radius-sm)] px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-extrabold text-[15px] disabled:opacity-60"
          >
            {loading ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>

          <div className="text-center">
            <Link to="/forgot-password" className="text-[12.5px] font-bold text-accent-dim">
              <i className="fa-solid fa-circle-question mr-1" />
              Parolni unutdingizmi?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
