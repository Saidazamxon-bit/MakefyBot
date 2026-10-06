import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';

const FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'active', label: 'Faol' },
  { key: 'inactive', label: 'Nofaol' },
];

function isTruthyStatus(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'active' || value === 'on';
}

function isBotActive(bot) {
  return isTruthyStatus(bot?.faol ?? bot?.active ?? bot?.status);
}

function isWebappActive(bot) {
  return isTruthyStatus(bot?.webapp?.faol ?? bot?.webapp?.active ?? bot?.webapp?.status);
}

export default function MyBots() {
  const [filtr, setFiltr] = useState('all');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [openMenu, setOpenMenu] = useState(null); // username menyusi ochiq
  const [openPanel, setOpenPanel] = useState(null); // `${username}:transfer|webapp`
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async (filter = 'all') => {
    setError('');
    setLoading(true);
    try {
      setData(await api.get(`/mybots/list.php?filtr=${encodeURIComponent(filter)}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Botlarni yuklab bo‘lmadi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filtr);
  }, [filtr, load]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const bots = Array.isArray(data?.bots) ? data.bots : [];
  const filteredBots = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return bots;
    return bots.filter((bot) => String(bot.username || '').toLowerCase().includes(normalized));
  }, [bots, query]);

  async function doAction(payload, successMsg) {
    setBusy(true);
    setError('');
    try {
      await api.post('/mybots/actions.php', payload);
      setToast(successMsg);
      setOpenPanel(null);
      setDeleteTarget(null);
      await load(filtr);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <div className="mf-page--error"><div className="mf-error-card"><span><i className="fa-solid fa-wifi" /></span><h1>Botlar yuklanmadi</h1><p>{error}</p><button type="button" onClick={() => load(filtr)} className="mf-button mf-button--primary"><i className="fa-solid fa-rotate-right" /> Qayta urinish</button></div></div>;
  if (!data) return <MyBotsSkeleton />;

  const totalBots = Number(data.total ?? bots.length) || bots.length;
  const activeCount = bots.filter(isBotActive).length;
  const webappCount = bots.filter(isWebappActive).length;

  return (
    <div className="mf-page mf-page--bots">
      <header className="mf-bots-head">
        <div>
          <span className="mf-kicker"><span className="mf-live-dot" /> BOT WORKSPACE</span>
          <h1>Botlarim</h1>
          <p>Barcha botlaringizni bitta tezkor markazdan boshqaring.</p>
        </div>
        <Link to="/create" className="mf-button mf-button--primary">
          <i className="fa-solid fa-plus" /> Yangi bot
        </Link>
      </header>

      {toast && (
        <div className="mf-toast mf-toast--success">
          <i className="fa-solid fa-circle-check" />
          {toast}
        </div>
      )}
      {error && (
        <div className="mf-toast mf-toast--error">
          <i className="fa-solid fa-triangle-exclamation" />
          {error}
        </div>
      )}

      {totalBots > 0 && (
        <>
          <div className="mf-bots-summary">
            <SummaryCard icon="fa-robot" value={totalBots} label="Jami botlar" tone="green" />
            <SummaryCard icon="fa-circle-check" value={activeCount} label="Faol" tone="blue" />
            <SummaryCard icon="fa-pause" value={Math.max(totalBots - activeCount, 0)} label="Pauzada" tone="amber" />
            <SummaryCard icon="fa-window-restore" value={webappCount} label="WebApp" tone="violet" />
          </div>
          <div className="mf-bots-toolbar">
            <label className="mf-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Botni qidirish..." />
            </label>
            <span className={`mf-bots-count ${loading ? 'is-loading' : ''}`}>
              {loading && <i className="fa-solid fa-circle-notch fa-spin" />} {filteredBots.length} ta ko‘rsatilmoqda
            </span>
          </div>
          <div className="mf-filter-pills">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFiltr(f.key)}
                className={`mf-filter-pill ${filtr === f.key ? 'is-active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}

      {totalBots === 0 ? (
        <div className="mf-empty-state">
          <span><i className="fa-solid fa-robot" /></span>
          <strong>Hozircha botingiz yo‘q</strong>
          <p>Birinchi botingizni yaratib, Makefy imkoniyatlaridan foydalaning.</p>
          <Link to="/create" className="mf-button mf-button--primary">
            <i className="fa-solid fa-plus" />
            Birinchi botingizni yarating →
          </Link>
        </div>
      ) : (
        <div className="mf-bot-grid">
          {filteredBots.map((bot) => (
            <BotCard
              key={bot.username}
              bot={bot}
              menuOpen={openMenu === bot.username}
              panelOpen={openPanel === bot.username ? 'transfer' : null}
              onToggleMenu={() => setOpenMenu((m) => (m === bot.username ? null : bot.username))}
              onCloseMenu={() => setOpenMenu(null)}
              onTogglePanel={() => setOpenPanel((p) => (p === bot.username ? null : bot.username))}
              onDelete={() => setDeleteTarget(bot.username)}
              onTransfer={(id) =>
                doAction(
                  { amal: 'otkazish', bot_user: bot.username, yangi_egasi_id: id },
                  "Egalik o'tkazish so'rovi yuborildi."
                )
              }
              busy={busy}
            />
          ))}
          {filteredBots.length === 0 && (
            <div className="mf-panel mf-inline-empty">
              <i className="fa-solid fa-magnifying-glass" /> Bu qidiruv bo‘yicha bot topilmadi.
            </div>
          )}
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

function SummaryCard({ icon, value, label, tone }) {
  return (
    <div className={`mf-bots-summary-card mf-bots-summary-card--${tone}`}>
      <span><i className={`fa-solid ${icon}`} /></span>
      <div><strong>{value}</strong><small>{label}</small></div>
    </div>
  );
}

function BotCard({ bot, menuOpen, panelOpen, onToggleMenu, onCloseMenu, onTogglePanel, onDelete, onTransfer, busy }) {
  const [transferId, setTransferId] = useState('');
  const botActive = isBotActive(bot);
  const waFaol = isWebappActive(bot);

  return (
    <div className="mf-bot-card">
      <div className="mf-bot-card__head">
        <Link to={`/bots/${bot.username}`} onClick={onCloseMenu} className="mf-bot-card__main">
          <div className={`mf-bot-card__mark ${botActive ? 'is-online' : ''}`}>
            <i className="fa-solid fa-robot" />
          </div>
          <div className="mf-bot-card__copy">
            <div className="flex items-center gap-1.5 font-bold text-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${botActive ? 'bg-accent' : 'bg-text-dim'}`} />
              {bot.username ? '@' + bot.username : 'Token kiritilmagan'}
            </div>
            <div className="text-[12px] text-text-muted truncate">
              {bot.info ? `${bot.info.turi || 'Bot'}${bot.kun != null ? ` · ${bot.kun} kun` : ''}` : "Ma'lumot yo'q"}
              {waFaol && <span className="text-accent"> · WebApp</span>}
            </div>
          </div>
          <i className="fa-solid fa-arrow-up-right-from-square mf-bot-card__open" />
        </Link>
        <div className="relative">
          <button type="button" onClick={onToggleMenu} className="w-8 h-8 flex items-center justify-center text-text-muted" aria-label={`@${bot.username} menyusi`} aria-expanded={menuOpen}>
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
              {bot.webapp?.webapp_url && (
                <a
                  href={bot.webapp.webapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onCloseMenu}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-surface-3"
                >
                  <i className="fa-solid fa-window-restore w-4" /> WebAppni ochish
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  onTogglePanel();
                  onCloseMenu();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-surface-3"
              >
                <i className="fa-solid fa-right-left w-4" /> Egalik o'tkazish
              </button>
              <button
                type="button"
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
      <div className="mf-bot-card__footer">
        <Link to={`/bots/${bot.username}`} onClick={onCloseMenu} className="mf-bot-card__manage">
          <i className="fa-solid fa-sliders" /> To‘liq boshqaruv
        </Link>
          <span className={`mf-bot-card__status ${botActive ? 'is-online' : ''}`}>
            <i className="fa-solid fa-circle" /> {botActive ? 'Faol' : 'Pauzada'}
        </span>
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
              type="button"
              disabled={busy || !transferId}
              onClick={() => onTransfer(transferId)}
              className="w-10 rounded-[var(--radius-sm)] bg-accent text-accent-text disabled:opacity-50"
            >
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
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
