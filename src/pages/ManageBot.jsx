import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { formatMoney } from '../lib/format';

export default function ManageBot() {
  const { username } = useParams();
  const [turi, setTuri] = useState(null);
  const [tab, setTab] = useState('sozlama');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/mybots/detail.php?useri=${encodeURIComponent(username)}`)
      .then((d) => {
        if (!d.isV2) {
          setError("Bu bot eski arxitekturada yaratilgan — bu yerdan boshqarib bo'lmaydi.");
          return;
        }
        setTuri(d.turi);
      })
      .catch((err) => setError(err.message));
  }, [username]);

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-danger font-semibold text-sm mb-3">{error}</p>
        <Link to={`/bots/${username}`} className="text-accent font-bold text-sm">
          ← Orqaga
        </Link>
      </div>
    );
  }
  if (!turi) return <div className="h-64 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;

  const contentTuri = turi === 'obuna' ? 'kanal' : turi === 'dokon' ? 'mahsulot' : turi === 'anketa' ? 'savol' : turi === 'test' ? 'testsavol' : turi === 'hikmat' ? 'iqtibos' : null;
  const tabs = {
    obuna: [['sozlama', 'Sozlamalar'], ['kontent', 'Kanallar']],
    dokon: [['sozlama', 'Sozlamalar'], ['kontent', 'Mahsulotlar'], ['buyurtma', 'Buyurtmalar']],
    xabarnoma: [['sozlama', 'Sozlamalar'], ['xabar', 'Xabar yuborish']],
    konkurs: [['sozlama', 'Sozlamalar'], ['ishtirokchi', 'Ishtirokchilar']],
    namoz: [['sozlama', 'Sozlamalar']],
    parol: [['sozlama', 'Sozlamalar']],
    anketa: [['sozlama', 'Sozlamalar'], ['kontent', 'Savollar'], ['javob', 'Javoblar']],
    anonim: [['sozlama', 'Sozlamalar'], ['fikr', 'Fikrlar']],
    suhbat: [['sozlama', 'Sozlamalar']],
    xarajat: [['sozlama', 'Sozlamalar']],
    test: [['sozlama', 'Sozlamalar'], ['kontent', 'Savollar'], ['natija', 'Natijalar']],
    hikmat: [['sozlama', 'Sozlamalar'], ['kontent', 'Iqtiboslar']],
  }[turi];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/bots/${username}`} className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text-muted">
          <i className="fa-solid fa-arrow-left" />
        </Link>
        <div>
          <h2 className="font-extrabold text-lg leading-tight">Botni sozlash</h2>
          <p className="text-[12.5px] text-text-muted">@{username}</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 bg-surface-2 rounded-full p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-full text-[12.5px] font-bold transition-colors ${
              tab === key ? 'bg-accent text-accent-text' : 'text-text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'sozlama' && <SettingsPanel username={username} turi={turi} />}
      {tab === 'kontent' && <ContentPanel username={username} turi={turi} contentTuri={contentTuri} />}
      {tab === 'buyurtma' && <OrdersPanel username={username} />}
      {tab === 'xabar' && <BroadcastPanel username={username} />}
      {tab === 'ishtirokchi' && <KonkursPanel username={username} />}
      {tab === 'javob' && <SurveyAnswersPanel username={username} />}
      {tab === 'fikr' && <FeedbackPanel username={username} />}
      {tab === 'natija' && <QuizResultsPanel username={username} />}
    </div>
  );
}

// ============================================================
// Sozlamalar
// ============================================================
function SettingsPanel({ username, turi }) {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/bots/settings.php?useri=${encodeURIComponent(username)}`).then((d) => setForm(d.settings || {}));
  }, [username]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/bots/settings.php', { useri: username, settings: form });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  if (!form) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={save} className="space-y-3">
      {message && <Banner type="ok">{message}</Banner>}
      {error && <Banner type="err">{error}</Banner>}

      {turi === 'dokon' && (
        <Field label="Do'kon nomi">
          <input value={form.shop_name || ''} onChange={set('shop_name')} className={inputCls} placeholder="Masalan: Zamira Shop" />
        </Field>
      )}

      {turi === 'konkurs' && (
        <Field label="G'oliblar soni">
          <input type="number" min={1} value={form.golib_soni || '1'} onChange={set('golib_soni')} className={inputCls} />
        </Field>
      )}

      <Field label={turi === 'konkurs' ? "Konkurs e'loni (/start xabari)" : 'Salomlashish xabari (/start)'}>
        <textarea value={form.welcome || ''} onChange={set('welcome')} rows={3} className={inputCls} />
      </Field>

      {turi === 'anketa' && (
        <Field label="Yakuniy xabar (barcha savollar tugagach)">
          <textarea value={form.yakun || ''} onChange={set('yakun')} rows={2} className={inputCls} />
        </Field>
      )}

      {turi === 'obuna' && (
        <>
          <Field label="A'zo bo'lgandan keyin yuboriladigan kontent matni">
            <textarea value={form.content_text || ''} onChange={set('content_text')} rows={4} className={inputCls} />
          </Field>
          <Field label="Qo'shimcha tugma matni (ixtiyoriy)">
            <input value={form.content_button_text || ''} onChange={set('content_button_text')} className={inputCls} placeholder="Masalan: Yuklab olish" />
          </Field>
          <Field label="Qo'shimcha tugma havolasi (ixtiyoriy)">
            <input value={form.content_button_url || ''} onChange={set('content_button_url')} className={inputCls} placeholder="https://..." />
          </Field>
        </>
      )}

      <button disabled={busy} className="w-full py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-extrabold text-sm disabled:opacity-60">
        {busy ? 'Saqlanmoqda...' : 'Saqlash'}
      </button>
    </form>
  );
}

// ============================================================
// Kontent (kanallar / mahsulotlar) — CRUD
// ============================================================
function ContentPanel({ username, turi, contentTuri }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (yangi) | item (tahrirlash)

  function load() {
    api
      .get(`/bots/content.php?useri=${encodeURIComponent(username)}&turi=${contentTuri}`)
      .then((d) => setItems(d.items))
      .catch((err) => setError(err.message));
  }
  useEffect(load, [username, contentTuri]);

  async function remove(id) {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      await api.post('/bots/content.php', { amal: 'ochirish', useri: username, id });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    }
  }

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (!items) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;

  if (editing !== null) {
    return (
      <ContentForm
        username={username}
        contentTuri={contentTuri}
        item={editing}
        onDone={() => {
          setEditing(null);
          load();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => setEditing({})}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-md)] bg-surface-2 border border-dashed border-border-light font-bold text-sm mb-3"
      >
        <i className="fa-solid fa-plus" /> {contentTuri === 'kanal' ? "Kanal qo'shish" : contentTuri === 'mahsulot' ? "Mahsulot qo'shish" : contentTuri === 'testsavol' ? "Savol qo'shish" : contentTuri === 'iqtibos' ? "Iqtibos qo'shish" : "Savol qo'shish"}
      </button>

      {items.length === 0 ? (
        <p className="text-center text-sm text-text-muted py-6">Hozircha bo'sh</p>
      ) : (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={it.id} className="flex items-center gap-3 bg-surface border border-border rounded-[var(--radius-md)] px-3.5 py-3">
              <div className="min-w-0 flex-1">
                {contentTuri === 'kanal' ? (
                  <>
                    <div className="font-bold text-sm truncate">{it.data.nomi}</div>
                    <div className="text-[12px] text-text-muted truncate">{it.data.username}</div>
                  </>
                ) : contentTuri === 'mahsulot' ? (
                  <>
                    <div className="font-bold text-sm truncate">{it.data.nomi}</div>
                    <div className="text-[12px] text-accent font-bold">{formatMoney(it.data.narxi)}</div>
                  </>
                ) : contentTuri === 'testsavol' ? (
                  <>
                    <div className="text-sm truncate"><span className="text-text-muted font-bold">{idx + 1}.</span> {it.data.matn}</div>
                    <div className="text-[12px] text-accent truncate">
                      To'g'ri: {(it.data.variantlar || [])[it.data.togri] || '—'}
                    </div>
                  </>
                ) : contentTuri === 'iqtibos' ? (
                  <div className="text-sm truncate">{it.data.matn}</div>
                ) : (
                  <div className="text-sm truncate"><span className="text-text-muted font-bold">{idx + 1}.</span> {it.data.matn}</div>
                )}
              </div>
              <button onClick={() => setEditing(it)} className="w-8 h-8 flex items-center justify-center text-text-muted">
                <i className="fa-solid fa-pen text-sm" />
              </button>
              <button onClick={() => remove(it.id)} className="w-8 h-8 flex items-center justify-center text-danger">
                <i className="fa-solid fa-trash text-sm" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentForm({ username, contentTuri, item, onDone, onCancel }) {
  const isNew = !item.id;
  const initial = item.data || {};
  const [data, setData] = useState(
    contentTuri === 'testsavol'
      ? { matn: initial.matn || '', variantlar: initial.variantlar?.length ? initial.variantlar : ['', '', '', ''], togri: initial.togri ?? 0 }
      : initial
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));
  const setVariant = (i) => (e) => {
    const v = [...data.variantlar];
    v[i] = e.target.value;
    setData((d) => ({ ...d, variantlar: v }));
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = contentTuri === 'testsavol'
        ? { ...data, variantlar: data.variantlar.filter((v) => v.trim() !== '') }
        : data;
      await api.post('/bots/content.php', { useri: username, turi: contentTuri, id: item.id || 0, data: payload });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  const titleMap = { kanal: 'Kanal', mahsulot: 'Mahsulot', savol: 'Savol', testsavol: 'Savol', iqtibos: 'Iqtibos' };

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="font-bold text-sm">
        {isNew ? "Qo'shish" : 'Tahrirlash'} — {titleMap[contentTuri] || 'Element'}
      </h3>
      {error && <Banner type="err">{error}</Banner>}

      {contentTuri === 'kanal' ? (
        <>
          <Field label="Kanal username (masalan @kanalim)">
            <input value={data.username || ''} onChange={set('username')} required className={inputCls} placeholder="@kanalim" />
          </Field>
          <Field label="Kanal nomi (ko'rinadigan)">
            <input value={data.nomi || ''} onChange={set('nomi')} required className={inputCls} />
          </Field>
        </>
      ) : contentTuri === 'mahsulot' ? (
        <>
          <Field label="Mahsulot nomi">
            <input value={data.nomi || ''} onChange={set('nomi')} required className={inputCls} />
          </Field>
          <Field label="Narxi (so'm)">
            <input type="number" value={data.narxi || ''} onChange={set('narxi')} required min={0} className={inputCls} />
          </Field>
          <Field label="Tavsif">
            <textarea value={data.tavsif || ''} onChange={set('tavsif')} rows={3} className={inputCls} />
          </Field>
          <Field label="Rasm havolasi (ixtiyoriy)">
            <input value={data.rasm_url || ''} onChange={set('rasm_url')} className={inputCls} placeholder="https://..." />
          </Field>
        </>
      ) : contentTuri === 'testsavol' ? (
        <>
          <Field label="Savol matni">
            <textarea value={data.matn || ''} onChange={set('matn')} required rows={2} className={inputCls} />
          </Field>
          <Field label="Variantlar (to'g'risini belgilang)">
            <div className="space-y-2">
              {data.variantlar.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="togri"
                    checked={Number(data.togri) === i}
                    onChange={() => setData((d) => ({ ...d, togri: i }))}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  <input
                    value={v}
                    onChange={setVariant(i)}
                    placeholder={`Variant ${i + 1}`}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </Field>
        </>
      ) : contentTuri === 'iqtibos' ? (
        <>
          <Field label="Matn">
            <textarea value={data.matn || ''} onChange={set('matn')} required rows={3} className={inputCls} />
          </Field>
          <Field label="Manba (ixtiyoriy)">
            <input value={data.manba || ''} onChange={set('manba')} className={inputCls} placeholder="Masalan: Imom Buxoriy" />
          </Field>
        </>
      ) : (
        <Field label="Savol matni">
          <textarea value={data.matn || ''} onChange={set('matn')} required rows={2} className={inputCls} placeholder="Masalan: Xizmatimizdan mamnunmisiz?" />
        </Field>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border font-bold text-sm">
          Bekor qilish
        </button>
        <button disabled={busy} className="flex-1 py-2.5 rounded-[var(--radius-sm)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-bold text-sm disabled:opacity-60">
          {busy ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// Buyurtmalar (faqat Dokon Bot)
// ============================================================
function OrdersPanel({ username }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/bots/orders.php?useri=${encodeURIComponent(username)}`)
      .then((d) => setOrders(d.orders))
      .catch((err) => setError(err.message));
  }, [username]);

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (!orders) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;
  if (orders.length === 0) return <p className="text-center text-sm text-text-muted py-6">Hali buyurtma yo'q</p>;

  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="bg-surface border border-border rounded-[var(--radius-md)] px-3.5 py-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">{o.mahsulot_nomi}</span>
            <span className="text-accent font-bold text-sm">{formatMoney(o.narxi)}</span>
          </div>
          <div className="text-[12px] text-text-muted mt-1">
            Mijoz ID: {o.tg_user_id} · {o.sana}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Xabar yuborish (faqat Xabarnoma Bot)
// ============================================================
function BroadcastPanel({ username }) {
  const [matn, setMatn] = useState('');
  const [rasmUrl, setRasmUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);

  function loadHistory() {
    api
      .get(`/bots/content.php?useri=${encodeURIComponent(username)}&turi=xabar_tarix`)
      .then((d) => setHistory([...d.items].reverse()))
      .catch(() => setHistory([]));
  }
  useEffect(loadHistory, [username]);

  async function send(e) {
    e.preventDefault();
    if (!matn.trim() && !rasmUrl.trim()) return;
    if (!confirm("Xabar BARCHA obunachilarga yuborilsinmi? Bu amalni qaytarib bo'lmaydi.")) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/bots/broadcast.php', { useri: username, matn: matn.trim(), rasm_url: rasmUrl.trim() });
      setResult(res.message);
      setMatn('');
      setRasmUrl('');
      loadHistory();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={send} className="space-y-3">
        {result && <Banner type="ok">{result}</Banner>}
        {error && <Banner type="err">{error}</Banner>}

        <Field label="Xabar matni">
          <textarea value={matn} onChange={(e) => setMatn(e.target.value)} rows={4} className={inputCls} placeholder="Obunachilaringizga yubormoqchi bo'lgan xabar..." />
        </Field>
        <Field label="Rasm havolasi (ixtiyoriy)">
          <input value={rasmUrl} onChange={(e) => setRasmUrl(e.target.value)} className={inputCls} placeholder="https://..." />
        </Field>

        <button disabled={busy} className="w-full py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-extrabold text-sm disabled:opacity-60">
          {busy ? 'Yuborilmoqda...' : <><i className="fa-solid fa-paper-plane mr-1.5" /> Barchaga yuborish</>}
        </button>
        <p className="text-[11.5px] text-text-dim">
          <i className="fa-solid fa-circle-info mr-1" /> Obunachilar ko'p bo'lsa yuborish bir necha soniya davom etishi mumkin — sahifani yopmang.
        </p>
      </form>

      <div>
        <div className="font-bold text-sm mb-2">Yuborilgan xabarlar tarixi</div>
        {!history ? (
          <div className="h-16 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />
        ) : history.length === 0 ? (
          <p className="text-center text-sm text-text-muted py-4">Hali xabar yuborilmagan</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="bg-surface border border-border rounded-[var(--radius-md)] px-3.5 py-2.5">
                <p className="text-sm truncate">{h.data.matn || '📷 Rasm'}</p>
                <p className="text-[11.5px] text-text-muted mt-0.5">
                  {h.data.sana} · ✅ {h.data.yuborildi} · ❌ {h.data.xato}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Ishtirokchilar va g'olib aniqlash (faqat Konkurs Bot)
// ============================================================
function KonkursPanel({ username }) {
  const [items, setItems] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [winners, setWinners] = useState(null);

  function load() {
    Promise.all([
      api.get(`/bots/content.php?useri=${encodeURIComponent(username)}&turi=ishtirokchi`),
      api.get(`/bots/settings.php?useri=${encodeURIComponent(username)}`),
    ])
      .then(([c, s]) => {
        setItems(c.items);
        setSettings(s.settings || {});
      })
      .catch((err) => setError(err.message));
  }
  useEffect(load, [username]);

  async function draw() {
    if (!confirm("G'olib(lar) aniqlansinmi? Bu amalni qaytarib bo'lmaydi va konkurs yakunlanadi.")) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/bots/konkurs_draw.php', { useri: username, golib_soni: settings?.golib_soni || 1 });
      setWinners(res.winners);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (!items || !settings) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;

  const tugagan = settings.holat === 'tugagan';

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] bg-surface border border-border p-4 text-center">
        <div className="text-2xl font-extrabold text-accent">{items.length}</div>
        <div className="text-[12.5px] text-text-muted font-semibold">Ishtirokchilar soni</div>
      </div>

      {tugagan ? (
        <Banner type="ok">🏆 Konkurs yakunlangan. G'oliblar: {settings.golib_ismlar}</Banner>
      ) : (
        <button
          onClick={draw}
          disabled={busy || items.length === 0}
          className="w-full py-3 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-extrabold text-sm disabled:opacity-50"
        >
          {busy ? 'Aniqlanmoqda...' : <><i className="fa-solid fa-dice mr-1.5" /> G'olib(lar)ni aniqlash</>}
        </button>
      )}

      {winners && (
        <Banner type="ok">
          🎉 G'olib(lar): {winners.map((w) => w.data.ism).join(', ')}
        </Banner>
      )}

      <div>
        <div className="font-bold text-sm mb-2">Ishtirokchilar ro'yxati</div>
        {items.length === 0 ? (
          <p className="text-center text-sm text-text-muted py-4">Hali hech kim ishtirok etmagan</p>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between bg-surface border border-border rounded-[var(--radius-sm)] px-3 py-2 text-sm">
                <span className="truncate">{it.data.ism}</span>
                {it.data.username && <span className="text-text-muted text-[12px]">@{it.data.username}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Javoblar (faqat Anketa Bot)
// ============================================================
function SurveyAnswersPanel({ username }) {
  const [answers, setAnswers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/bots/anketa_javoblar.php?useri=${encodeURIComponent(username)}`)
      .then((d) => setAnswers(d.answers))
      .catch((err) => setError(err.message));
  }, [username]);

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (!answers) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;
  if (answers.length === 0) return <p className="text-center text-sm text-text-muted py-6">Hali javob kelmagan</p>;

  const grouped = {};
  for (const a of answers) {
    grouped[a.tg_user_id] = grouped[a.tg_user_id] || { ism: a.ism, items: [] };
    grouped[a.tg_user_id].items.push(a);
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([uid, g]) => (
        <div key={uid} className="bg-surface border border-border rounded-[var(--radius-md)] px-3.5 py-3">
          <div className="font-bold text-sm mb-2">{g.ism || 'Foydalanuvchi'}</div>
          <div className="space-y-1.5">
            {g.items.map((a) => (
              <div key={a.id} className="text-[12.5px]">
                <span className="text-text-muted">{a.savol_matni}</span>
                <div className="font-semibold">{a.javob}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Fikrlar (faqat Anonim Fikr Bot) — o'qish uchun, muallifsiz
// ============================================================
function FeedbackPanel({ username }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/bots/content.php?useri=${encodeURIComponent(username)}&turi=fikr`)
      .then((d) => setItems([...d.items].reverse()))
      .catch((err) => setError(err.message));
  }, [username]);

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (!items) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;
  if (items.length === 0) return <p className="text-center text-sm text-text-muted py-6">Hali fikr kelmagan</p>;

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.id} className="bg-surface border border-border rounded-[var(--radius-md)] px-3.5 py-3">
          <p className="text-sm whitespace-pre-wrap">{it.data.matn}</p>
          <p className="text-[11.5px] text-text-muted mt-1.5">{it.data.sana}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Natijalar (faqat Test Bot)
// ============================================================
function QuizResultsPanel({ username }) {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/bots/test_natijalar.php?useri=${encodeURIComponent(username)}`)
      .then((d) => setResults(d.results))
      .catch((err) => setError(err.message));
  }, [username]);

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (!results) return <div className="h-40 rounded-[var(--radius-md)] bg-surface-2 animate-pulse" />;
  if (results.length === 0) return <p className="text-center text-sm text-text-muted py-6">Hali hech kim testni yakunlamagan</p>;

  return (
    <div className="space-y-2">
      {results.map((r, i) => (
        <div key={r.id} className="flex items-center gap-3 bg-surface border border-border rounded-[var(--radius-md)] px-3.5 py-2.5">
          <span className="w-6 text-center font-bold text-text-muted">{i + 1}</span>
          <span className="flex-1 text-sm truncate">{r.ism || 'Foydalanuvchi'}</span>
          <span className="font-bold text-accent text-sm">{r.togri_soni}/{r.jami_soni}</span>
        </div>
      ))}
    </div>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface-2 border border-border text-sm outline-none focus:border-accent';

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[12px] font-bold text-text-muted mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Banner({ type, children }) {
  return (
    <div className={`text-[13px] font-semibold rounded-[var(--radius-sm)] px-3 py-2 ${type === 'ok' ? 'text-accent bg-accent-soft' : 'text-danger bg-danger-soft'}`}>
      {children}
    </div>
  );
}
