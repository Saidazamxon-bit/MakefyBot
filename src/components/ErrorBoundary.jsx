import { Component } from 'react';
import { translate, detectLang } from '../i18n';

// Bo'sh oq ekran o'rniga tushunarli xabar + xatoni serverga yuborish (qayta yuklash tugmasi bilan)
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) {
    try {
      fetch('/api/client_error.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ message: String(error?.message || error), stack: String(error?.stack || '').slice(0, 800), page: window.location.pathname }),
      }).catch(() => {});
    } catch { /* hisobot yuborilmasa ham ilova ishlashda davom etadi */ }
  }
  render() {
    if (!this.state.failed) return this.props.children;
    let pref = 'auto';
    try { pref = localStorage.getItem('mf_lang') || 'auto'; } catch { /* ignore */ }
    const lang = detectLang(pref);
    return (
      <div role="alert" style={{ minHeight: 'var(--app-vh, 100dvh)', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{translate(lang, 'common.error.title')}</h1>
          <p style={{ opacity: 0.7, marginBottom: 16 }}>{translate(lang, 'common.error.body')}</p>
          <button onClick={() => window.location.reload()} style={{ minHeight: 44, padding: '0 20px', borderRadius: 12, fontWeight: 700, background: '#20E992', color: '#04130C' }}>{translate(lang, 'common.reload')}</button>
        </div>
      </div>
    );
  }
}
