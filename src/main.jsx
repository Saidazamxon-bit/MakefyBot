import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

// Telegram Web App SDK'ni ilova ochilishi bilanoq ishga tushiramiz —
// initData shu bosqichda tayyor bo'ladi (AuthContext keyin uni o'qiydi).
try {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
} catch (e) {
  // Telegram tashqarisida (oddiy brauzer) ochilsa — bu normal, e'tiborsiz qoldiramiz
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
