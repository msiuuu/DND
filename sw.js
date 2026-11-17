// Emberglade service worker: lets the game install as an app and open without a connection.
// The page itself is always fetched fresh when online, so updates still arrive; the dice files and icons are kept once used.
const SHELL = 'emberglade-shell-v1', ASSETS = 'emberglade-assets-v1', ROOT = self.registration.scope;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll([ROOT, ROOT + 'manifest.webmanifest', ROOT + 'icon.svg', ROOT + 'icon-192.png', ROOT + 'icon-512.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== ASSETS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin || u.pathname.endsWith('/version.txt')) return;
  if (r.mode === 'navigate' || u.href.split('?')[0] === ROOT || u.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(ROOT, copy)); } return res; })
      .catch(() => caches.match(ROOT).then(hit => hit || Response.error())));
    return;
  }
  if (u.pathname.includes('/lib/') || /\.(png|svg|webmanifest)$/.test(u.pathname)) {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(ASSETS).then(c => c.put(r, copy)); } return res; })));
  }
});
