// public/sw.js
const CACHE_VERSION = 'ag-empleo-v2';
const CACHE = CACHE_VERSION;

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── INSTALL ──────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Install failed:', err))
  );
});

// ── ACTIVATE ─────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE)
            .map((k) => {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
        )
      )
      .then(() => self.clients.claim())
      .catch((err) => console.error('[SW] Activate failed:', err))
  );
});

// ── FETCH ─────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  // Ignorar métodos no-GET
  if (e.request.method !== 'GET') return;

  // Ignorar Firebase / Firestore / APIs externas
  const url = e.request.url;
  if (
    url.includes('firestore') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('cloudinary.com') ||
    url.includes('generativelanguage.googleapis.com')
  ) return;

  // Ignorar extensiones de Chrome
  if (url.startsWith('chrome-extension://')) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Solo cachear respuestas válidas
        if (!res || res.status !== 200 || res.type === 'opaque') {
          return res;
        }
        const clone = res.clone();
        caches.open(CACHE)
          .then((c) => c.put(e.request, clone))
          .catch((err) => console.warn('[SW] Cache put failed:', err));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
