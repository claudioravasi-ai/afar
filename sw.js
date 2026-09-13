/* Service worker de AFAAR
   Estrategia: red primero para el HTML y los recursos propios (para que las
   actualizaciones lleguen siempre), cache como respaldo sin conexion. */

const CACHE = 'afar-v21';
const ESENCIALES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* Las capturas del manual. Van aparte de ESENCIALES a proposito: son
   alrededor de un mega y no valen la pena para arrancar, pero SI hacen falta
   guardadas. El manual es lo que alguien abre justo cuando no sabe que hacer,
   y eso pasa tanto sin señal como con ella. Sin esto, la primera vez que se
   abre el manual sin conexion las once capturas no aparecen. */
const CAPTURAS = [
  './manual/m1.jpg','./manual/m2.jpg','./manual/m3.jpg','./manual/m4.jpg',
  './manual/m5.jpg','./manual/m6.jpg','./manual/m7.jpg','./manual/m8.jpg',
  './manual/m9.jpg','./manual/m10.jpg','./manual/m11.jpg'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  /* Primero lo esencial y despues las capturas, de a una y perdonando los
     fallos: addAll() es todo o nada, y una captura que no baja no puede
     impedir que la aplicacion se instale. Las dos etapas van dentro del
     waitUntil -aunque la instalacion tarde un poco mas- porque el navegador
     puede apagar el service worker apenas termina de instalar, y lo que
     quedara corriendo por fuera se cortaria por la mitad. */
  e.waitUntil(caches.open(CACHE).then(c =>
    c.addAll(ESENCIALES)
     .catch(() => {})
     .then(() => Promise.all(CAPTURAS.map(u => c.add(u).catch(() => {}))))
  ));
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
      /* ------------------------------------------------------------------
         SIN RED: lo guardado, y si no hay nada guardado, un error honesto.

         Antes, cualquier pedido que fallara y no estuviera en la cache
         devolvia el index.html. Para una navegacion esta bien -es la pantalla
         de la aplicacion-, pero para una IMAGEN es un desastre silencioso: al
         <img> le llega HTML haciendose pasar por JPEG, el navegador no puede
         decodificarlo y la captura queda en blanco para siempre, sin un solo
         error en la consola. Es por esto que las capturas del manual «no se
         lograban ver» sin conexion.

         Ahora el index.html se devuelve SOLO cuando lo que se pidio es una
         pantalla. Todo lo demas, si no esta guardado, falla como corresponde.
         ------------------------------------------------------------------ */
      .catch(() => caches.match(req).then(r => {
        if(r) return r;
        if(esHTML) return caches.match('./index.html');
        return new Response('', { status:504, statusText:'Sin conexión' });
      }))
  );
});
