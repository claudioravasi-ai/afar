/* Service worker de AFAR by Yanina Andino
   Estrategia: red primero para el HTML y los recursos propios (para que las
   actualizaciones lleguen siempre), cache como respaldo sin conexion. */

const CACHE = 'afar-v1';
const ESENCIALES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESENCIALES).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Firebase y CDN: siempre a la red, nunca cacheadas */
  if(url.hostname.indexOf('firebaseio') >= 0 ||
     url.hostname.indexOf('googleapis') >= 0 ||
     url.hostname.indexOf('gstatic') >= 0){
    return;
  }

  e.respondWith(
    fetch(req)
      .then(r => {
        if(r && r.status === 200 && url.origin === location.origin){
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return r;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
