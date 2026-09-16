// Vercel serverless funksiyasi: brauzerdan kelgan /api/... so'rovlarini
// serverning o'zida (server-to-server) PHP backendga uzatadi.
//
// NEGA KERAK: brauzer to'g'ridan-to'g'ri boshqa domendagi (hosting) backendga
// so'rov yuborsa, bu "cross-origin" so'rov hisoblanadi va ba'zi hostinglar
// xavfsizlik sozlamalari bunday so'rovlarni butunlay bloklaydi (Origin
// header boshqa domendan ekanini ko'rib). Server-to-server so'rovda esa
// brauzer CORS qoidalari umuman ishlamaydi (ular faqat brauzer ichida
// ishlaydi), shuning uchun bu usul bilan CORS/Origin bilan bog'liq har
// qanday bloklashni butunlay aylanib o'tamiz.
//
// Brauzer endi FAQAT o'z domeniga (Vercel) so'rov yuboradi -> bu funksiya
// orqa fonda backendga so'rov qiladi -> javobni (shu jumladan Set-Cookie
// sarlavhasini) brauzerga qaytaradi. Brauzer uchun bu xuddi "bitta domen"
// ichida ishlayotgandek ko'rinadi.

export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND_ORIGIN = 'https://6a4cc7f182c08.xvest2.ru';

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  const targetUrl = BACKEND_ORIGIN + req.url;

  const headers = {};
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  if (req.headers['cookie']) headers['Cookie'] = req.headers['cookie'];

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await readRawBody(req);
  }

  let backendRes;
  try {
    backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      error: `Backendga ulanib bo'lmadi: ${err.message}`,
      error_code: 'PROXY_UNREACHABLE',
    });
    return;
  }

  // Backend qaytargan Set-Cookie sarlavha(lar)ini brauzerga shundayligicha uzatamiz
  let setCookies = [];
  if (typeof backendRes.headers.getSetCookie === 'function') {
    setCookies = backendRes.headers.getSetCookie();
  } else {
    const sc = backendRes.headers.get('set-cookie');
    if (sc) setCookies = [sc];
  }
  if (setCookies.length) res.setHeader('Set-Cookie', setCookies);

  const contentType = backendRes.headers.get('content-type') || 'application/json; charset=utf-8';
  res.setHeader('Content-Type', contentType);
  res.status(backendRes.status);

  const buf = Buffer.from(await backendRes.arrayBuffer());
  res.send(buf);
}
