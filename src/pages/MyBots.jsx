import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';

const FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'active', label: 'Faol' },
  { key: 'inactive', label: 'Nofaol' },
];

export default function MyBots() {
  const [filtr, setFiltr] = useState('all');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [openMenu, setOpenMenu] = useState(null); // username menyusi ochiq
  const [openPanel, setOpenPanel] = useState(null); // `${username}:transfer|webapp`
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback((f) => {
    setError('');
    api
      .get(`/mybots/list.php?filtr=${f}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => load(filtr), [filtr, load]);

  async function doAction(payload, successMsg) {
    setBusy(true);
    setError('');
    try {
      await api.post('/mybots/actions.php', payload);
      setToast(successMsg);
      setOpenPanel(null);
      setDeleteTarget(null);
      load(filtr);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <p className="text-danger text-sm">{error}</p>;
  if (!data) return <MyBotsSkeleton />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-extrabold text-lg">Mening botlarim</h2>
        <Link
          to="/create"
          className="flex items-center gap-1.5 text-[13px] font-bold text-accent-text bg-gradient-to-r from-accent to-accent-dim px-3 py-2 rounded-full"
        >
          <i className="fa-solid fa-plus" /> Yangi bot
        </Link>
      </div>

      {toast && (
        <div className="text-[13px] font-semibold text-accent bg-accent-soft rounded-[var(--radius-sm)] px-3 py-2 mb-3">
          {toast}
        </div>
      )}
      {error && (
        <div className="text-[13px] font-semibold text-danger bg-danger-soft rounded-[var(--radius-sm)] px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {data.total > 0 && (
        <>
          <div className="flex gap-1.5 mb-3 bg-surface-2 rounded-full p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFiltr(f.key)}
                className={`flex-1 py-1.5 rounded-full text-[12.5px] font-bold transition-colors ${
                  filtr === f.key ? 'bg-accent text-accent-text' : 'text-text-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] text-text-muted font-semibold mb-3">
            Jami: <span className="text-accent font-bold">{data.total}</span> ta bot
          </p>
        </>
      )}

      {data.total === 0 ? (
        <div className="rounded-[var(--radius-md)] bg-surface border border-dashed border-border-light p-8 text-center">
          <i className="fa-solid fa-robot text-2xl text-text-dim" />
          <p className="text-sm text-text-muted mt-2 mb-2">Hozircha botingiz yo'q</p>
          <Link to="/create" className="text-accent font-bold text-sm">
            Birinchi botingizni yarating →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.bots.map((bot) => (
            <BotCard
              key={bot.username}
              bot={bot}
              webappPrice={data.webappPrice}
              menuOpen={openMenu === bot.username}
              panelOpen={openPanel === bot.username ? 'transfer' : openPanel === `${bot.username}:webapp` ? 'webapp' : null}
              onToggleMenu={() => setOpenMenu((m) => (m === bot.username ? null : bot.username))}
              onCloseMenu={() => setOpenMenu(null)}
              onTogglePanel={(panel) => {
                const key = panel === 'webapp' ? `${bot.username}:webapp` : bot.username;
                setOpenPanel((p) => (p === key ? null : key));
              }}
              onDelete={() => setDeleteTarget(bot.username)}
              onTransfer={(id) =>
                doAction(
                  { amal: 'otkazish', bot_user: bot.username, yangi_egasi_id: id },
                  "Egalik o'tkazish so'rovi yuborildi."
                )
              }
              onWebappToggle={() =>
                doAction(
                  { amal: bot.webapp?.faol ? 'webapp_ochirish' : 'webapp_qoshish', bot_user: bot.username },
                  bot.webapp?.faol ? "WebApp o'chirildi." : 'WebApp yoqildi.'
                )
              }
              busy={busy}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          botName={deleteTarget}
          busy={busy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() =>
            doAction({ amal: 'ochirish', bot_user: deleteTarget }, "Bot o'chirildi.")
          }
        />
      )}
    </div>
  );
}

function BotCard({ bot, webappPrice, menuOpen, panelOpen, onToggleMenu, onCloseMenu, onTogglePanel, onDelete, onTransfer, onWebappToggle, busy }) {
  const [transferId, setTransferId] = useState('');
  const waFaol = !!bot.webapp?.faol;

  return (
    <div className="rounded-[var(--radius-md)] bg-surface border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-surface-3 flex items-center justify-center text-accent flex-shrink-0">
          <i className="fa-solid fa-robot" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${bot.faol ? 'bg-accent' : 'bg-text-dim'}`} />
            @{bot.username}
          </div>
          <div className="text-[12px] text-text-muted truncate">
            {bot.info ? `${bot.info.turi || 'Bot'} · ${bot.info.vaqti || ''}` : "Ma'lumot yo'q"}
            {waFaol && <span className="text-accent"> · WebApp</span>}
          </div>
        </div>
        <div className="relative">
          <button onClick={onToggleMenu} className="w-8 h-8 flex items-center justify-center text-text-muted">
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-surface-2 border border-border shadow-[var(--shadow-card)] overflow-hidden z-20">
              <Link
                to={`/bots/${bot.username}`}
                onClick={onCloseMenu}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-surface-3"
              >
                <i className="fa-solid fa-pen w-4" /> Sozlash
              </Link>
              <button
                onClick={() => {
                  onTogglePanel('webapp');
                  onCloseMenu();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-surface-3"
              >
                <i className="fa-solid fa-window-restore w-4" /> {waFaol ? 'WebApp' : "WebApp qo'shish"}
              </button>
              <button
                onClick={() => {
                  onTogglePanel('transfer');
                  onCloseMenu();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-surface-3"
              >
                <i className="fa-solid fa-right-left w-4" /> Egalik o'tkazish
              </button>
              <button
                onClick={() => {
                  onDelete();
                  onCloseMenu();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft"
              >
                <i className="fa-solid fa-trash w-4" /> O'chirish
              </button>
            </div>
          )}
        </div>
      </div>

      {panelOpen === 'transfer' && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-border">
          <p className="text-[12px] text-text-muted mb-2">
            Yangi egasining Telegram ID raqamini kiriting. Tarifingizga qarab komissiya olinadi.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={transferId}
              onChange={(e) => setTransferId(e.target.value)}
              placeholder="Telegram ID"
              className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent"
            />
            <button
              disabled={busy || !transferId}
              onClick={() => onTransfer(transferId)}
              className="w-10 rounded-[var(--radius-sm)] bg-accent text-accent-text disabled:opacity-50"
            >
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </div>
      )}

      {panelOpen === 'webapp' && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-border">
          <p className="text-[12px] text-text-muted mb-2">
            {waFaol
              ? 'Botingizda tayyor mini-ilova ishlayapti — Telegramning "Menyu" tugmasi orqali ochiladi.'
              : webappPrice > 0
              ? `Botingizga tayyor mini-ilova ulanadi. Narxi: ${webappPrice.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm (bir martalik).`
              : "Botingizga tayyor mini-ilova ulanadi — tarifingizga kiritilgan, bepul! 🎁"}
          </p>
          {waFaol ? (
            <div className="flex gap-2">
              {bot.webapp?.webapp_url && (
                <a
                  href={bot.webapp.webapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 rounded-[var(--radius-sm)] bg-surface-3 border border-border text-sm font-bold"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square mr-1.5" /> Ko'rish
                </a>
              )}
              <button
                disabled={busy}
                onClick={() => {
                  if (confirm("WebApp o'chirilsinmi? Xohlagan payt qayta yoqishingiz mumkin, qayta to'lov olinmaydi.")) onWebappToggle();
                }}
                className="w-10 rounded-[var(--radius-sm)] bg-danger-soft text-danger disabled:opacity-50"
              >
                <i className="fa-solid fa-power-off" />
              </button>
            </div>
          ) : (
            <button
              disabled={busy}
              onClick={() => {
                const msg = webappPrice > 0
                  ? `WebApp yoqish uchun hisobingizdan ${webappPrice.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm yechiladi. Davom etilsinmi?`
                  : 'WebApp yoqilsinmi? Tarifingizga kiritilgan, bepul.';
                if (confirm(msg)) onWebappToggle();
              }}
              className="w-full py-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-accent to-accent-dim text-accent-text text-sm font-bold disabled:opacity-50"
            >
              <i className="fa-solid fa-bolt mr-1.5" />
              {webappPrice > 0 ? `Yoqish — ${webappPrice.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm` : 'Yoqish (bepul 🎁)'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DeleteModal({ botName, busy, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-xs bg-surface border border-border rounded-[var(--radius-lg)] p-5 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-danger-soft text-danger flex items-center justify-center text-xl mb-3">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>
        <div className="font-extrabold mb-1">Botni o'chirish</div>
        <p className="text-sm text-text-muted mb-4">
          <strong>@{botName}</strong> botini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border font-bold text-sm"
          >
            Bekor qilish
          </button>
          <button
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-[var(--radius-sm)] bg-danger text-white font-bold text-sm disabled:opacity-50"
          >
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

function MyBotsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-9 rounded-full bg-surface-2" />
      <div className="h-16 rounded-[var(--radius-md)] bg-surface-2" />
      <div className="h-16 rounded-[var(--radius-md)] bg-surface-2" />
      <div className="h-16 rounded-[var(--radius-md)] bg-surface-2" />
    </div>
  );
}
