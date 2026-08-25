/* Service worker de AFAAR
   Estrategia: red primero para el HTML y los recursos propios (para que las
   actualizaciones lleguen siempre), cache como respaldo sin conexion. */

const CACHE = 'afar-v6';
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

  /* Al abrir la app se pide el HTML salteando la cache del navegador. Sin
     esto, "red primero" igual puede devolver una copia vieja: el navegador
     guarda el index.html por su cuenta (GitHub Pages lo sirve con 10 minutos
     de validez) y se lo entrega al service worker sin consultar al servidor.
     El resultado es abrir una version anterior de la aplicacion. */
  const esHTML = req.mode === 'navigate' ||
                 (req.destination === 'document') ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/' || url.pathname.endsWith('/');

  e.respondWith(
    fetch(req, esHTML ? { cache:'no-store' } : undefined)
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
