// Backend JSON API bilan ishlash uchun yagona nuqta.
// Sessiya PHP cookie orqali ishlaydi (credentials: 'include').
//
// MUHIM: so'rovlar ENDI to'g'ridan-to'g'ri boshqa domendagi (hosting)
// backendga emas, balki shu Vercel loyihasining o'z /api/... yo'liga
// (serverless proxy funksiyasiga, qarang: /api/[...path].js) yuboriladi.
// O'sha funksiya orqa fonda (server-to-server) haqiqiy PHP backendga
// ulanadi — shu sababli bu yerda API_BASE har doim bo'sh ('') qoldiriladi,
// brauzer nuqtai nazaridan hammasi "bitta domen" ichida bo'ladi va CORS
// yoki hosting xavfsizlik devori bilan bog'liq muammolar butunlay
// aylanib o'tiladi.
const API_BASE = '';

let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = token;
}

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = {};

  let finalBody;
  if (body === undefined) {
    finalBody = undefined;
  } else if (isFormData) {
    finalBody = body; // brauzer Content-Type'ni o'zi qo'yadi (multipart) — bu ham CORS-safe
  } else {
    const bodyWithCsrf =
      method !== 'GET' && csrfToken ? { ...body, _csrf_token: csrfToken } : body;
    headers['Content-Type'] = 'text/plain;charset=UTF-8'; // ataylab — preflightni oldini olish uchun
    finalBody = JSON.stringify(bodyWithCsrf);
  }

  const url = `${API_BASE}/api${path}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: finalBody,
    });
  } catch (networkErr) {
    // fetch() o'zi tashlagan xato (masalan CORS bloklagan yoki server umuman
    // javob bermagan) — bu holatda res hech qachon kelmaydi. Xato matnini
    // to'g'ridan-to'g'ri ko'rsatamiz, shunda muammo aniq ko'rinadi.
    throw new ApiError(`Ulanish xatosi (${url}): ${networkErr.message}`, 'FETCH_FAILED', 0);
  }

  const raw = await res.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    // Server javob berdi, lekin JSON emas (masalan PHP xato sahifasi, 404,
    // yoki redirect natijasida boshqa HTML qaytdi). Diagnostika uchun
    // status kodi va javobning boshlanishini xabarga qo'shamiz.
    const preview = raw.slice(0, 160).replace(/\s+/g, ' ').trim();
    throw new ApiError(
      `Server JSON qaytarmadi (HTTP ${res.status}, ${url}): ${preview || '(bo\'sh javob)'}`,
      'BAD_RESPONSE',
      res.status
    );
  }

  if (!json.ok) {
    throw new ApiError(json.error || 'Xatolik yuz berdi.', json.error_code || 'ERROR', res.status);
  }
  return json.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body ?? {} }),
};
