import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';

const PROGRESS_STAGES = [
  { p: 8, t: 'Token tekshirilmoqda...' },
  { p: 24, t: 'Bot Telegram serverida aniqlanmoqda...' },
  { p: 42, t: 'Bot shabloni tayyorlanmoqda...' },
  { p: 58, t: 'Ichki fayllar yaratilmoqda...' },
  { p: 76, t: "Bog'lanish (webhook) o'rnatilmoqda..." },
  { p: 90, t: 'Bazaga yozilmoqda...' },
];

function readableError(error, fallback = 'Xatolik yuz berdi. Qayta urinib ko‘ring.') {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === 'UNAUTHENTICATED') return 'Sessiya tugagan. Mini-ilovani qayta oching.';
  if (error.code === 'FETCH_FAILED' || error.status >= 500) {
    return 'Serverda vaqtinchalik muammo yuz berdi. Bir ozdan keyin qayta urinib ko‘ring.';
  }
  if (error.code === 'BAD_RESPONSE') {
    return 'Server noto‘g‘ri javob qaytardi. Qayta urinib ko‘ring.';
  }
  return error.message || fallback;
}

export default function Create() {
  const [tab, setTab] = useState('shablon'); // shablon | maxsus
  const [selected, setSelected] = useState(null); // tanlangan shablon slug

  return (
    <div className="mf-page mf-page--create mf-create-layout">
      <header className="mf-create-hero">
        <div className="mf-create-hero__mark"><i className="fa-solid fa-wand-magic-sparkles" /></div>
        <div>
          <span className="mf-kicker">BUILD STUDIO</span>
          <h1>Bot yaratish</h1>
          <p>G‘oyangizga mos shablonni tanlang yoki o‘zingizga xos so‘rov yuboring.</p>
        </div>
      </header>

      {!selected && (
        <div className="mf-create-tabs">
          <button
            onClick={() => setTab('shablon')}
            className={`mf-create-tab ${
              tab === 'shablon' ? 'bg-accent text-accent-text' : 'text-text-muted'
            }`}
          >
            <i className="fa-solid fa-clone mr-1.5" /> Shablon bo'yicha
          </button>
          <button
            onClick={() => setTab('maxsus')}
            className={`mf-create-tab ${
              tab === 'maxsus' ? 'bg-accent text-accent-text' : 'text-text-muted'
            }`}
          >
            <i className="fa-solid fa-paper-plane mr-1.5" /> Maxsus so'rov
          </button>
        </div>
      )}

      {tab === 'shablon' ? (
        selected ? (
          <TemplateFlow slug={selected} onBack={() => setSelected(null)} />
        ) : (
          <TemplatePicker onSelect={setSelected} />
        )
      ) : (
        <CustomRequestForm />
      )}
    </div>
  );
}

// ============================================================
// 1) Shablonlar ro'yxati — qidiruv + kategoriya filtri
// ============================================================
function TemplatePicker({ onSelect }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('__hammasi__');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/create/templates.php');
      setData({
        categories: Array.isArray(result.categories) ? result.categories : [],
        templates: Array.isArray(result.templates) ? result.templates : [],
      });
    } catch (err) {
      setError(readableError(err, 'Shablonlarni yuklab bo‘lmadi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.templates.filter((t) => {
      const matchQuery = t.title.toLowerCase().includes(q);
      const matchCat = category === '__hammasi__' || t.category === category;
      return matchQuery && matchCat;
    });
  }, [data, query, category]);

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Shablonlar yuklanmoqda">
        <div className="h-11 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />
        <div className="h-8 w-2/3 rounded-full bg-surface-2 animate-pulse" />
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 rounded-[var(--radius-md)] bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft px-5 py-6 text-center">
        <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-danger/15 text-danger flex items-center justify-center">
          <i className="fa-solid fa-cloud-arrow-down" />
        </div>
        <p className="text-sm font-bold text-danger mb-1">Shablonlarni yuklab bo‘lmadi</p>
        <p className="text-xs text-text-muted mb-4">{error}</p>
        <button
          type="button"
          onClick={loadTemplates}
          className="px-4 py-2.5 rounded-[var(--radius-md)] bg-surface border border-border font-bold text-sm"
        >
          <i className="fa-solid fa-rotate-right mr-1.5" /> Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-3">
        <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim text-sm" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bot nomini qidirish..."
          className="w-full pl-10 pr-3 py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        <CategoryChip active={category === '__hammasi__'} onClick={() => setCategory('__hammasi__')} label="Hammasi" />
        {data.categories.map((c) => (
          <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)} label={c} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-text-muted py-8">
          <i className="fa-solid fa-circle-info mr-1.5" /> Hech narsa topilmadi
        </p>
      ) : (
        <div className="mf-tpl-grid">
          {filtered.map((t) => (
            <button key={t.slug} type="button" onClick={() => onSelect(t.slug)} className={`mf-tpl-card mf-tpl-card--${t.kind || 'default'}`}>
              <span className="mf-tpl-card__icon">{t.icon || '🤖'}</span>
              <span className="mf-tpl-card__body">
                <b>{t.title}</b>
                <small>{shortText(t.description)}</small>
                <span className="mf-tpl-card__meta">
                  <em>{t.category}</em>
                  <em>{Number(t.price) > 0 ? `${formatPrice(t.price)} so'm` : 'Bepul'}</em>
                  <em>3 kun sinov</em>
                </span>
              </span>
              <i className="fa-solid fa-arrow-right mf-tpl-card__arrow" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatPrice(v) {
  return Number(v || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
}

// Tavsifning birinchi jumlasidan ("emoji Nomi — qisqa izoh") qisqa matn olamiz
function shortText(desc = '') {
  const lines = String(desc).split('\n').map((l) => l.trim()).filter(Boolean);
  const head = lines.find((l, i) => i > 0 && l.length > 20) || lines[0] || '';
  return head.length > 130 ? `${head.slice(0, 127)}…` : head;
}

function CategoryChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${
        active ? 'bg-accent text-accent-text' : 'bg-surface-2 text-text-muted border border-border'
      }`}
    >
      {label}
    </button>
  );
}

// ============================================================
// 2) Tanlangan shablon: narx/tavsif -> token kiritish -> natija
// ============================================================
function TemplateFlow({ slug, onBack }) {
  const [step, setStep] = useState('detail'); // detail | token | progress | result
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [progress, setProgress] = useState({ pct: 0, label: 'Boshlanmoqda...' });
  const [result, setResult] = useState(null);

  const loadDetail = useCallback(async () => {
    setDetail(null);
    setError('');
    try {
      setDetail(await api.get(`/create/template_detail.php?nomi=${encodeURIComponent(slug)}`));
    } catch (err) {
      setError(readableError(err, 'Shablon ma’lumotlarini yuklab bo‘lmadi.'));
    }
  }, [slug]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  function startCreation() {
    if (!token.trim()) {
      alert('Token kiritishni unutmang!');
      return;
    }
    setStep('progress');
    setProgress({ pct: 0, label: 'Boshlanmoqda...' });

    let i = 0;
    let done = false;
    const tick = () => {
      if (done || i >= PROGRESS_STAGES.length) return;
      const s = PROGRESS_STAGES[i++];
      setProgress({ pct: s.p, label: s.t });
      setTimeout(tick, 420 + Math.random() * 220);
    };
    tick();

    api
      .post('/create/bot_create.php', { nomi: slug, token: token.trim() })
      .then((data) => {
        done = true;
        setProgress({ pct: 100, label: 'Tayyor!' });
        setTimeout(() => {
          setResult({ ok: true, botUsername: data.botUsername, panels: data.panels, adminLogin: data.adminLogin, adminPassword: data.adminPassword });
          setStep('result');
        }, 350);
      })
      .catch((err) => {
        done = true;
        setProgress({ pct: 100, label: 'Xatolik yuz berdi' });
        setTimeout(() => {
          setResult({ ok: false, error: readableError(err) });
          setStep('result');
        }, 350);
      });
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft px-5 py-6 text-center">
        <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-danger/15 text-danger flex items-center justify-center">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>
        <p className="text-sm font-bold text-danger mb-1">Shablon ochilmadi</p>
        <p className="text-xs text-text-muted mb-4">{error}</p>
        <div className="flex flex-col gap-2 max-w-[220px] mx-auto">
          <button
            type="button"
            onClick={loadDetail}
            className="py-2.5 rounded-[var(--radius-md)] bg-surface border border-border font-bold text-sm"
          >
            <i className="fa-solid fa-rotate-right mr-1.5" /> Qayta urinish
          </button>
          <button
            type="button"
            onClick={onBack}
            className="py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm"
          >
            <i className="fa-solid fa-arrow-left mr-1.5" /> Shablonlarga qaytish
          </button>
        </div>
      </div>
    );
  }

  if (step === 'progress') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <span className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <div className="text-2xl font-extrabold">{progress.pct}%</div>
        <div className="text-sm text-text-muted min-h-[18px]">{progress.label}</div>
        <div className="w-48 h-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-dim transition-all duration-300"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <p className="text-[12px] text-text-dim max-w-[240px] mt-2">
          <i className="fa-solid fa-circle-info mr-1" /> Sahifani yopmang — bot o'zi tayyor bo'ladi.
        </p>
      </div>
    );
  }

  if (step === 'result' && result) {
    return result.ok ? (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto rounded-full bg-accent-soft text-accent flex items-center justify-center text-2xl mb-3">
          <i className="fa-solid fa-circle-check" />
        </div>
        <p className="font-bold mb-1">Botingiz ishga tushdi!</p>
        <p className="text-sm text-text-muted mb-5">@{result.botUsername} tayyor. Quyidagi ma’lumotlarni saqlab qo‘ying.</p>
        {result.adminPassword && (
          <div className="mf-cred-card">
            <div className="mf-cred-grid">
              <div><small>Admin login</small><code>{result.adminLogin}</code></div>
              <div><small>Admin parol</small><code>{result.adminPassword}</code></div>
            </div>
            <p>Bu parol faqat shu yerda va Botlarim → bot sahifasida ko‘rinadi. Kirgach o‘zgartiring.</p>
          </div>
        )}
        <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
          {result.botUsername && (
            <a
              href={`https://t.me/${result.botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-bold text-sm"
            >
              <i className="fa-brands fa-telegram mr-1.5" /> Botga o'tish
            </a>
          )}
          {result.botUsername && (
            <Link to={`/bots/${result.botUsername}`} className="py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm">
              <i className="fa-solid fa-sliders mr-1.5" /> Botni boshqarish
            </Link>
          )}
          <Link to="/dashboard" className="py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm">
            <i className="fa-solid fa-house mr-1.5" /> Asosiy menyu
          </Link>
        </div>
      </div>
    ) : (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto rounded-full bg-danger-soft text-danger flex items-center justify-center text-2xl mb-3">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>
        <p className="text-sm text-text-muted mb-5 px-4">{result.error}</p>
        <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
          <button
            onClick={() => setStep('token')}
            className="py-2.5 rounded-[var(--radius-md)] bg-surface-3 border border-border font-bold text-sm"
          >
            <i className="fa-solid fa-rotate-right mr-1.5" /> Qayta urinish
          </button>
          <Link to="/dashboard" className="py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm">
            <i className="fa-solid fa-house mr-1.5" /> Asosiy menyu
          </Link>
        </div>
      </div>
    );
  }

  if (!detail) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;

  if (step === 'token') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-warn-soft text-warn flex items-center justify-center">
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <h3 className="font-extrabold">Diqqat o'qing</h3>
        </div>
        {!detail.canAfford ? (
          <div className="text-[13px] font-semibold text-danger bg-danger-soft rounded-[var(--radius-sm)] px-3 py-3 mb-4">
            <i className="fa-solid fa-ban mr-1.5" /> Hisobingizda yetarli mablag' mavjud emas!
          </div>
        ) : (
          <>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={4}
              placeholder="@BotFather bergan tokenni shu yerga qo'ying (masalan 123456:ABC-DEF...)"
              className="w-full px-3.5 py-3 rounded-[var(--radius-md)] bg-surface-2 border border-border text-sm outline-none focus:border-accent mb-3"
            />
            <button
              onClick={startCreation}
              className="w-full py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-extrabold text-sm mb-2"
            >
              <i className="fa-solid fa-paper-plane mr-1.5" /> Yuborish
            </button>
          </>
        )}
        <button
          onClick={() => setStep('detail')}
          className="w-full py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm"
        >
          <i className="fa-solid fa-rotate-left mr-1.5" /> Orqaga
        </button>
      </div>
    );
  }

  // step === 'detail'
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
          <i className="fa-solid fa-clipboard-check" />
        </div>
        <h3 className="font-extrabold">Bot tanlandi!</h3>
      </div>

      <div className="rounded-[var(--radius-md)] bg-surface border border-border p-4 divide-y divide-border mb-3">
        <InfoRow icon="fa-signature" label="Bot nomi" value={detail.title} />
        <InfoRow
          icon="fa-tag"
          label="Narxi"
          value={
            <>
              {detail.discountPercent > 0 && (
                <s className="text-text-muted mr-1.5">{detail.priceOriginal}</s>
              )}
              {formatPrice(detail.price)} so'm
              {detail.discountPercent > 0 && (
                <span className="text-accent text-xs ml-1.5">(-{detail.discountPercent}%)</span>
              )}
            </>
          }
        />
        <InfoRow icon="fa-hourglass-half" label="Kunlik to'lov" value={`${formatPrice(detail.dailyFee)} so'm`} />
        <InfoRow icon="fa-language" label="Interfeys tili" value={detail.language} />
        <InfoRow icon="fa-code-branch" label="Versiyasi" value={detail.version} />
        <InfoRow icon="fa-gift" label="Bonus" value="3 kunlik tekin trial" />
      </div>

      {detail.description && (
        <div className="mf-tpl-desc">{detail.description}</div>
      )}

      <button
        onClick={() => setStep('token')}
        className="w-full py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-extrabold text-sm mb-2"
      >
        <i className="fa-solid fa-check mr-1.5" /> Yaratish
      </button>
      <button onClick={onBack} className="w-full py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm">
        <i className="fa-solid fa-rotate-left mr-1.5" /> Orqaga
      </button>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm gap-3">
      <span className="flex items-center gap-2 text-text-muted font-semibold flex-shrink-0">
        <i className={`fa-solid ${icon} w-4`} /> {label}
      </span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}

// ============================================================
// 3) Maxsus so'rov
// ============================================================
function CustomRequestForm() {
  const [nomi, setNomi] = useState('');
  const [tavsif, setTavsif] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nomi.trim() || !tavsif.trim()) {
      setError("Bot nomi va tavsifni to'liq kiriting. Bo'sh so'rov yuborilmaydi.");
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api.post('/create/custom_request.php', { nomi: nomi.trim(), tavsif: tavsif.trim() });
      setMessage(data.message);
      setNomi('');
      setTavsif('');
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 className="font-extrabold text-[15px] mb-1">
        <i className="fa-solid fa-paper-plane mr-1.5 text-accent" /> Adminga maxsus so'rov
      </h3>
      <p className="text-[12.5px] text-text-muted mb-4">
        Bot qanday ishlashi kerakligini yozing. Admin ko'rib chiqadi va siz bilan bog'lanadi.
      </p>

      {message && (
        <div className="text-[13px] font-semibold text-accent bg-accent-soft rounded-[var(--radius-sm)] px-3 py-2 mb-3">
          {message}
        </div>
      )}
      {error && (
        <div className="text-[13px] font-semibold text-danger bg-danger-soft rounded-[var(--radius-sm)] px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={nomi}
          onChange={(e) => setNomi(e.target.value)}
          placeholder="Bot nomi (masalan: Mening botim)"
          minLength={2}
          className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border text-sm outline-none focus:border-accent"
        />
        <textarea
          value={tavsif}
          onChange={(e) => setTavsif(e.target.value)}
          rows={4}
          placeholder="Bot funksiyalari haqida batafsil yozing..."
          minLength={5}
          className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border text-sm outline-none focus:border-accent"
        />
        <button
          disabled={busy}
          className="w-full py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-extrabold text-sm disabled:opacity-60"
        >
          {busy ? 'Yuborilmoqda...' : (<><i className="fa-solid fa-paper-plane mr-1.5" /> Yuborish</>)}
        </button>
      </form>
    </div>
  );
}
