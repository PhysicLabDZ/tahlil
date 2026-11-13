/* PhysicLabDZ – tahlil: offline-first service worker (v16) */
const CACHE = 'tahlil-v16';
const REQUIRED = ['./', 'index.html'];
const OPTIONAL = [
  'manifest.webmanifest',
  'icon.svg',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // الأساسيان إلزاميان: إن فشلا يفشل التنصيب ويُعاد عند الزيارة التالية
    await c.addAll(REQUIRED.map(u => new Request(u, { cache: 'reload' })));
    // الباقي اختياري: فشل أي ملف منه لا يمنع التنصيب
    await Promise.all(OPTIONAL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => {
      if (res && res.ok) c.put(r, res.clone());
      return res;
    }).catch(() => null);
    if (hit) return hit;
    const res = await net;
    if (res) return res;
    if (r.mode === 'navigate') {
      const page = await c.match('index.html');
      if (page) return page;
    }
    return new Response('offline', { status: 503 });
  })());
});
