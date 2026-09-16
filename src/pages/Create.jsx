import { useEffect, useMemo, useState } from 'react';
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

export default function Create() {
  const [tab, setTab] = useState('shablon'); // shablon | maxsus
  const [selected, setSelected] = useState(null); // tanlangan shablon slug

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-accent-soft text-accent flex items-center justify-center text-lg">
          <i className="fa-solid fa-plus" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg leading-tight">Bot yaratish</h2>
          <p className="text-[12.5px] text-text-muted">Usulni tanlang</p>
        </div>
      </div>

      {!selected && (
        <div className="flex gap-1.5 mb-4 bg-surface-2 rounded-full p-1">
          <button
            onClick={() => setTab('shablon')}
            className={`flex-1 py-2 rounded-full text-[13px] font-bold transition-colors ${
              tab === 'shablon' ? 'bg-accent text-accent-text' : 'text-text-muted'
            }`}
          >
            <i className="fa-solid fa-clone mr-1.5" /> Shablon bo'yicha
          </button>
          <button
            onClick={() => setTab('maxsus')}
            className={`flex-1 py-2 rounded-full text-[13px] font-bold transition-colors ${
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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('__hammasi__');

  useEffect(() => {
    api.get('/create/templates.php').then(setData).catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.templates.filter((t) => {
      const matchQuery = t.title.toLowerCase().includes(q);
      const matchCat = category === '__hammasi__' || t.category === category;
      return matchQuery && matchCat;
    });
  }, [data, query, category]);

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (!data) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;

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
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((t) => (
            <button
              key={t.slug}
              onClick={() => onSelect(t.slug)}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-[var(--radius-md)] bg-surface border border-border text-center hover:border-accent transition-colors"
            >
              <i className="fa-solid fa-robot text-accent text-lg" />
              <span className="text-[12.5px] font-bold leading-tight">{t.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

  useEffect(() => {
    api
      .get(`/create/template_detail.php?nomi=${encodeURIComponent(slug)}`)
      .then(setDetail)
      .catch((err) => setError(err.message));
  }, [slug]);

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
          setResult({ ok: true, botUsername: data.botUsername });
          setStep('result');
        }, 350);
      })
      .catch((err) => {
        done = true;
        setProgress({ pct: 100, label: 'Xatolik yuz berdi' });
        setTimeout(() => {
          setResult({ ok: false, error: err instanceof ApiError ? err.message : 'Xatolik yuz berdi.' });
          setStep('result');
        }, 350);
      });
  }

  if (error) return <p className="text-danger text-sm">{error}</p>;

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
        <p className="font-bold mb-1">Token qabul qilindi!</p>
        <p className="text-sm text-text-muted mb-5">Botingiz muvaffaqiyatli ishga tushdi!</p>
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
          <Link to="/" className="py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm">
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
          <Link to="/" className="py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-border font-bold text-sm">
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
              placeholder="Botingizga beriladigan maxfiy tokenni kiriting. Tokenni qayerdan olishni bilmasangiz @BotFather'ga kirib avval bot yaratib oling!"
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
              {detail.price} so'm
              {detail.discountPercent > 0 && (
                <span className="text-accent text-xs ml-1.5">(-{detail.discountPercent}%)</span>
              )}
            </>
          }
        />
        <InfoRow icon="fa-hourglass-half" label="Kunlik to'lov" value={`${detail.dailyFee} so'm`} />
        <InfoRow icon="fa-language" label="Interfeys tili" value={detail.language} />
        <InfoRow icon="fa-code-branch" label="Versiyasi" value={detail.version} />
        <InfoRow icon="fa-gift" label="Bonus" value="3 kunlik tekin trial" />
      </div>

      {detail.description && (
        <p className="text-[12.5px] text-text-muted mb-4">
          <i className="fa-solid fa-circle-info mr-1.5" /> {detail.description}
        </p>
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
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
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
