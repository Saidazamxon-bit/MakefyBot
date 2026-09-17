// Backend JSON API bilan ishlash uchun yagona nuqta.
// Sessiya PHP cookie orqali ishlaydi (credentials: 'include').
//
// Productionda PHP backend boshqa domenda joylashgan. Backend CORS va
// SameSite=None cookie'larni qo'llab-quvvatlashi kerak; so'rovlar Vercel
// serverless proxy'sidan o'tmaydi.
const BACKEND_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || 'https://6a4cc7f182c08.xvest2.ru'
).replace(/\/+$/, '');
// API brauzerda same-origin Vercel proxy orqali ishlaydi.
const API_BASE = '';
const API_PREFIX = '/api';

// Backend "/uploads/..." kabi nisbiy (relative) yo'l qaytaradigan joylar bor
// (masalan chatdagi rasmlar) — bular hostingning o'zida joylashgan, Vercel'da
// emas, shuning uchun to'liq manzilga aylantirib ko'rsatish kerak.
export function mediaUrl(path) {
  if (!path) return path;
  return /^https?:\/\//i.test(path)
    ? path
    : `${BACKEND_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

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

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const publicPath = normalizedPath.replace(/\.php(?=($|\?))/, '');
  const url = `${API_BASE}${API_PREFIX}${publicPath}`;
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
