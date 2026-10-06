import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ===== Yagona UI kutubxonasi (5-bosqich): yangi sahifalar shu komponentlardan foydalanadi =====
const cx = (...a) => a.filter(Boolean).join(' ');

const BTN = {
  primary: 'bg-gradient-to-r from-accent to-accent-dim text-accent-text',
  secondary: 'bg-surface-2 border border-border text-text',
  ghost: 'text-text-muted hover:text-text',
  danger: 'bg-danger text-white',
};

export function Button({ variant = 'secondary', loading = false, disabled, className, children, ...rest }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx('inline-flex items-center justify-center gap-2 min-h-[44px] md:min-h-[40px] px-4 rounded-[12px] font-bold text-sm transition-opacity',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed', BTN[variant], className)}
    >
      {loading && <span className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }) {
  return <section {...rest} className={cx('rounded-[12px] bg-surface border border-border p-4', className)}>{children}</section>;
}

const BADGE = { neutral: 'bg-surface-2 text-text-muted', success: 'bg-accent-soft text-success', warning: 'bg-warn-soft text-warn', danger: 'bg-danger-soft text-danger' };
export function Badge({ tone = 'neutral', children }) {
  return <span className={cx('inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-bold', BADGE[tone])}>{children}</span>;
}

export function Skeleton({ className = 'h-16' }) {
  return <div className={cx('rounded-[12px] bg-surface-2 animate-pulse', className)} aria-hidden="true" />;
}

export function EmptyState({ icon = 'fa-inbox', title, body, action }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto mb-3 w-[72px] h-[72px] rounded-full bg-surface-2 grid place-items-center text-2xl text-text-muted"><i className={'fa-solid ' + icon} aria-hidden="true" /></div>
      <h3 className="font-bold">{title}</h3>
      {body && <p className="text-[13px] text-text-muted mt-1 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---- Modal / bottom-sheet: Esc, fokus tuzog'i, fon qotadi, mobilda pastdan ----
export function Modal({ open, onClose, title, children, labelledBy = 'modal-title' }) {
  const ref = useRef(null);
  const prev = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    prev.current = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = () => ref.current?.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])') || [];
    (focusables()[0] || ref.current)?.focus();
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const f = [...focusables()];
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); document.body.style.overflow = overflow; prev.current?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-black/50" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}
        className="w-full md:max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-t-[24px] md:rounded-[24px] p-5 outline-none">
        {title && <h2 id={labelledBy} className="font-bold text-[18px] mb-3">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ---- Toast ----
const ToastCtx = createContext({ toast: () => {} });
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((text, { tone = 'success', action, onAction } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, text, tone, action, onAction }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed z-40 top-3 md:top-auto md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:w-[360px] space-y-2 pointer-events-none" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} role="status" className={cx('pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-[12px] border border-border bg-surface text-sm font-semibold shadow-lg', i.tone === 'danger' ? 'text-danger' : 'text-text')}>
            <span>{i.text}</span>
            {i.action && <button className="underline text-accent" onClick={() => { i.onAction?.(); setItems((s) => s.filter((x) => x.id !== i.id)); }}>{i.action}</button>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
