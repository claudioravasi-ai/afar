/* =========================================================================
   NUCLEO - AFAAR
   Estado, persistencia local, sincronizacion Firebase, utilidades de UI,
   iconografia y motor de scores anestesiologicos.
   ========================================================================= */
'use strict';

const CLAVE_COORDINADOR = '0112';
const CLAVE_CONTABLE    = '2358';
const LS_DB   = 'afar_db_v1';
const LS_SES  = 'afar_sesion_v1';
const LS_FB   = 'afar_firebase_v1';
const LS_TEMA = 'afar_tema_v1';
const LS_NUBE_LOG = 'afar_nube_log_v1';

/* ---------------------------------------------------------------- Estado */
const DB = {
  usuarios:{}, pacientes:{}, fichas:{}, instituciones:{}, obrasSociales:{},
  catalogoExtra:{}, config:{}, auditoria:{}, mensajes:{}, fiscal:{}, envios:{}
};
const COLECCIONES = Object.keys(DB);

let SESION = null;      // { uid, rol }
let USUARIO = null;     // objeto usuario activo
let fbApp = null, fbDb = null, nubeOK = false, aplicandoRemoto = false;

/* ------------------------------------------------------------- Utilidades */
const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

function uid(p){
  return (p||'id') + '_' + Date.now().toString(36) + '_' +
         Math.random().toString(36).slice(2,9);
}
function esc(s){
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function hoyISO(){ const d = new Date(); return d.toISOString().slice(0,10); }
function ahoraHora(){ return new Date().toTimeString().slice(0,5); }

function fFecha(iso){
  if(!iso) return '—';
  const p = String(iso).slice(0,10).split('-');
  if(p.length !== 3) return iso;
  return p[2] + '/' + p[1] + '/' + p[0];
}
function fFechaLarga(iso){
  if(!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  if(isNaN(d)) return fFecha(iso);
  return d.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});
}
function fMoneda(n){
  const v = Number(n) || 0;
  return '$ ' + v.toLocaleString('es-AR',{minimumFractionDigits:2, maximumFractionDigits:2});
}
function fNum(n, d){
  const v = Number(n); if(!isFinite(v)) return '—';
  return v.toLocaleString('es-AR',{minimumFractionDigits:d||0, maximumFractionDigits:d||0});
}
function edadDe(fechaNac, ref){
  if(!fechaNac) return null;
  const n = new Date(fechaNac + 'T12:00:00');
  const r = ref ? new Date(ref + 'T12:00:00') : new Date();
  if(isNaN(n)) return null;
  let e = r.getFullYear() - n.getFullYear();
  const m = r.getMonth() - n.getMonth();
  if(m < 0 || (m === 0 && r.getDate() < n.getDate())) e--;
  return e >= 0 ? e : null;
}
/* El socio a veces escribe "M.P. 1842" en el campo de la matricula y la app
   ya antepone el rotulo. Se muestra una sola vez. */
function matriculaTxt(v, pref){
  const t = String(v || '').trim();
  if(!t || t === '—') return '—';
  return t.replace(new RegExp('^' + pref.replace(/\./g, '\\.') + '\\s*', 'i'), '');
}

function iniciales(nombre, apellido){
  return ((apellido||'').trim().charAt(0) + (nombre||'').trim().charAt(0)).toUpperCase() || '?';
}
function semanaISO(iso){
  const d = new Date(iso + 'T12:00:00');
  const j = new Date(d.getFullYear(),0,1);
  const dias = Math.floor((d - j) / 86400000);
  return d.getFullYear() + '-S' + String(Math.ceil((dias + j.getDay() + 1) / 7)).padStart(2,'0');
}
function mesDe(iso){ return String(iso||'').slice(0,7); }
const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto',
                       'Septiembre','Octubre','Noviembre','Diciembre'];
function nombreMes(ym){
  if(!ym) return '—';
  const [a,m] = ym.split('-');
  return (MESES_NOMBRES[Number(m)-1] || m) + ' ' + a;
}
/* Años que tiene sentido ofrecer en un selector: los que abarcan las fichas
   cargadas, más un año de margen a cada lado. */
function aniosDisponibles(){
  const hoy = Number(hoyISO().slice(0,4));
  let min = hoy, max = hoy;
  lista('fichas').forEach(f => {
    const a = Number(String(f.fecha || '').slice(0,4));
    if(a >= 1990 && a <= 2200){ if(a < min) min = a; if(a > max) max = a; }
  });
  const out = [];
  for(let a = min - 1; a <= max + 1; a++) out.push(a);
  return out;
}
function norm(s){
  return String(s||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function debounce(fn, ms){
  let t; return function(){ const a = arguments, c = this;
    clearTimeout(t); t = setTimeout(()=>fn.apply(c,a), ms||220); };
}

/* ------------------------------------------------- SHA-256 (JS puro) ---- */
function sha256(msg){
  function rr(n,x){ return (x>>>n)|(x<<(32-n)); }
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const u = unescape(encodeURIComponent(msg));
  const l = u.length; const wa=[];
  for(let i=0;i<l;i++) wa[i>>2] |= (u.charCodeAt(i)&0xff) << (24-(i%4)*8);
  wa[l>>2] |= 0x80 << (24-(l%4)*8);
  wa[((l+8>>6)+1)*16-1] = l*8;
  const W=new Array(64);
  for(let i=0;i<wa.length;i+=16){
    let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(let j=0;j<64;j++){
      if(j<16) W[j]=wa[i+j]|0;
      else{
        const s0=rr(7,W[j-15])^rr(18,W[j-15])^(W[j-15]>>>3);
        const s1=rr(17,W[j-2])^rr(19,W[j-2])^(W[j-2]>>>10);
        W[j]=(W[j-16]+s0+W[j-7]+s1)|0;
      }
      const S1=rr(6,e)^rr(11,e)^rr(25,e);
      const ch=(e&f)^((~e)&g);
      const t1=(h+S1+ch+K[j]+W[j])|0;
      const S0=rr(2,a)^rr(13,a)^rr(22,a);
      const mj=(a&b)^(a&c)^(b&c);
      const t2=(S0+mj)|0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    H=[(H[0]+a)|0,(H[1]+b)|0,(H[2]+c)|0,(H[3]+d)|0,
       (H[4]+e)|0,(H[5]+f)|0,(H[6]+g)|0,(H[7]+h)|0];
  }
  return H.map(x=>('00000000'+(x>>>0).toString(16)).slice(-8)).join('');
}
function hashClave(clave, salt){ return sha256('afar$' + salt + '$' + clave + '$v1'); }

/* --------------------------------------------------------- Iconografia -- */
const ICONOS = {
  panel:'<path d="M3 12h7V3H3zM14 21h7v-9h-7zM14 8h7V3h-7zM3 21h7v-5H3z"/>',
  paciente:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  pacientes:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  ficha:'<path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
  valoracion:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  stats:'<path d="M18 20V10M12 20V4M6 20v-6"/>',
  dinero:'<circle cx="12" cy="12" r="9"/><path d="M14.8 9.3a2.6 2.6 0 0 0-2.4-1.3c-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.6.8 2.6 2-1.1 2-2.6 2a2.7 2.7 0 0 1-2.5-1.4M12 6.5v11"/>',
  guias:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  escudo:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  ajustes:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  salir:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  sol:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  luna:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  nube:'<path d="M18 10h-1.3A7 7 0 1 0 4 15.9"/><path d="M13 19l-2 3h4l-2 3M8 17h9a4 4 0 0 0 0-8h-.3"/>',
  mas:'<path d="M12 5v14M5 12h14"/>',
  buscar:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  editar:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  borrar:'<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  descargar:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  imprimir:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  check:'<path d="M20 6L9 17l-5-5"/>',
  equis:'<path d="M18 6L6 18M6 6l12 12"/>',
  flecha:'<path d="M6 9l6 6 6-6"/>',
  atras:'<path d="M19 12H5M12 19l-7-7 7-7"/>',
  alerta:'<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  corazon:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  pulmon:'<path d="M12 3v10M8.5 13c0-3-1.2-5-2.5-5S3 9.5 3 13c0 4 1 7 3.5 7S9 18 9 15"/><path d="M15.5 13c0-3 1.2-5 2.5-5s3 1.5 3 5c0 4-1 7-3.5 7S15 18 15 15"/>',
  cerebro:'<path d="M9.5 3A2.5 2.5 0 0 0 7 5.5c-1.4.3-2.5 1.6-2.5 3.1 0 .7.2 1.3.6 1.8-.6.5-1 1.3-1 2.1 0 1.1.6 2 1.6 2.5 0 1.7 1.4 3 3.1 3 .8 0 1.5-.3 2-.8V3.8a2.5 2.5 0 0 0-1.3-.8z"/><path d="M14.5 3A2.5 2.5 0 0 1 17 5.5c1.4.3 2.5 1.6 2.5 3.1 0 .7-.2 1.3-.6 1.8.6.5 1 1.3 1 2.1 0 1.1-.6 2-1.6 2.5 0 1.7-1.4 3-3.1 3-.8 0-1.5-.3-2-.8V3.8c.4-.5.9-.8 1.3-.8z"/><path d="M12 18v3"/>',
  jeringa:'<path d="M18 2l4 4M17 7l-1.5-1.5M13.5 3.5L20.5 10.5M11 6l7 7-8 8H4v-6z"/><path d="M9 11l2 2M7 13l2 2"/>',
  gota:'<path d="M12 2.7l5 5.3a7 7 0 1 1-10 0z"/>',
  sangre:'<path d="M12 2.7l5 5.3a7 7 0 1 1-10 0z"/><path d="M9 14a3 3 0 0 0 6 0"/>',
  fuego:'<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-2 2-3 3-4 6-1-1-1-2-1-3-2 2-5 4-5 6a7 7 0 0 0 7 7z"/>',
  aire:'<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h9a2.5 2.5 0 1 1-2.5 2.5"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  aguja:'<path d="M21 3l-8 8M14 4l6 6M11 13l-8 8M6 14l4 4"/>',
  vena:'<path d="M6 2v8a6 6 0 0 0 12 0V2"/><path d="M12 16v6M9 20h6"/>',
  estomago:'<path d="M8 3v5a5 5 0 0 0 5 5 6 6 0 0 1 0 12H9"/><path d="M8 8H5"/>',
  monitor:'<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M6 11h3l1.5-3 2 6 1.5-3h4M8 22h8M12 18v4"/>',
  nino:'<circle cx="12" cy="6" r="3"/><path d="M9 22v-5l-2-3 2-4h6l2 4-2 3v5"/>',
  hoja:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8a7 7 0 0 1-7 7z"/><path d="M2 21c0-3 1.8-5.7 4.5-7"/>',
  calculadora:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h4"/>',
  hospital:'<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M12 9v6M9 12h6"/>',
  archivo:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  word:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13l1.5 5L11 14l1.5 4L14 13"/>',
  excel:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13l6 6M15 13l-6 6"/>',
  reloj2:'<path d="M12 2v4M12 18v4M4.9 4.9l2.9 2.9M16.2 16.2l2.9 2.9M2 12h4M18 12h4M4.9 19.1l2.9-2.9M16.2 7.8l2.9-2.9"/>',
  campana:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  filtro:'<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  calendario:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  usuario:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  firma:'<path d="M3 17c3 0 3-10 6-10s3 10 6 10 3-6 6-6"/><path d="M2 21h20"/>',
  adjunto:'<path d="M21.4 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  ojo:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  bisturi:'<path d="M20 4L8.5 15.5 4 20l1-5L16.5 3.5a2 2 0 0 1 2.8 0L20 4z"/><path d="M13 7l4 4"/>',
  copiar:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  lista:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  candado:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  correo:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
  refrescar:'<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
  camara:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  enviar:'<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  carpeta:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  bandeja:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.4 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z"/>'
};
function ico(n, cls){
  const p = ICONOS[n] || ICONOS.info;
  return '<svg class="'+(cls||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
         'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
}

/* ------------------------------------------------------- Toast y modales */
let toastT;
function toast(msg, tipo){
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'on ' + (tipo || '');
  clearTimeout(toastT);
  toastT = setTimeout(()=>{ t.className = ''; }, tipo === 'err' ? 4200 : 2600);
}
/* La app tiene un solo contenedor #modal, asi que abrir un modal encima de
   otro —el visor de una foto del parte quirurgico sobre el detalle del
   envio— pisaba al de abajo: al cerrar el visor el contador volvia al
   listado y perdia la ficha que estaba mirando.
   Se guarda la funcion que vuelve a pintar el modal de abajo (no su HTML:
   los botones se cablean por JS DESPUES de abrirModal, restaurar el HTML
   los dejaria muertos) y cerrarModal la ejecuta al salir del de arriba. */
let PILA_MODAL = [];
let apilandoModal = false;

function abrirModalEncima(volver, abrir){
  if(volver) PILA_MODAL.push(volver);
  apilandoModal = true;
  try{ abrir(); }
  finally{ apilandoModal = false; }
}

function abrirModal(titulo, cuerpoHTML, botones, ancho){
  const m = $('#modal');
  /* Un modal que se abre por su cuenta empieza una pila nueva */
  if(!apilandoModal) PILA_MODAL = [];
  m.innerHTML =
    '<div class="modal-card" style="'+(ancho?('max-width:'+ancho):'')+'">'+
      '<div class="modal-head"><h3>'+esc(titulo)+'</h3>'+
        '<button class="cerrar" data-cerrar>&times;</button></div>'+
      '<div class="modal-body">'+cuerpoHTML+'</div>'+
      (botones ? '<div class="modal-foot">'+botones+'</div>' : '')+
    '</div>';
  m.classList.add('on');
  m.onclick = e => { if(e.target === m || e.target.closest('[data-cerrar]')) cerrarModal(); };
  return m;
}
function cerrarModal(){
  const m = $('#modal'); m.classList.remove('on'); m.innerHTML = '';
  const volver = PILA_MODAL.pop();
  if(volver) volver();
}

function confirmar(titulo, texto, onOK, textoOK, peligro){
  abrirModal(titulo,
    '<p style="margin:0;line-height:1.6">'+texto+'</p>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn '+(peligro?'danger':'pri')+'" id="mdOK">'+esc(textoOK||'Confirmar')+'</button>');
  $('#mdOK').onclick = () => { cerrarModal(); onOK(); };
}

/* --------------------------------------------------------- Persistencia */
function guardarLocal(){
  try{ localStorage.setItem(LS_DB, JSON.stringify(DB)); }
  catch(e){ console.warn('No se pudo guardar en localStorage', e);
    toast('Almacenamiento local lleno. Descargá un respaldo.', 'err'); }
}
function cargarLocal(){
  try{
    const raw = localStorage.getItem(LS_DB);
    if(!raw) return false;
    const d = JSON.parse(raw);
    COLECCIONES.forEach(c => { DB[c] = d[c] || {}; });
    return true;
  }catch(e){ console.warn(e); return false; }
}

/* Escribe un registro en una coleccion (local + nube).
   Los registros de demostracion se quedan SIEMPRE en el dispositivo: son
   pacientes y fichas inventados, y si llegaran a la base compartida los
   verian todos los socios mezclados con los datos reales. */
/* Firebase rechaza el objeto entero si encuentra un undefined en cualquier
   rama. Se limpia antes de subir: un campo sin valor no debe cortar la
   sincronizacion de toda la ficha. */
function sinUndefined(v){
  if(Array.isArray(v)) return v.map(sinUndefined);
  if(v && typeof v === 'object'){
    const o = {};
    Object.keys(v).forEach(k => { if(v[k] !== undefined) o[k] = sinUndefined(v[k]); });
    return o;
  }
  return v;
}

function escribir(col, id, obj){
  DB[col][id] = obj;
  guardarLocal();
  if(obj && obj.demo) return;
  if(nubeOK && fbDb && !aplicandoRemoto){
    try{ fbDb.ref('afar/'+col+'/'+id).set(sinUndefined(obj)); }
    catch(e){ console.warn('sync', e); }
  }
}
function eliminar(col, id){
  delete DB[col][id];
  guardarLocal();
  if(nubeOK && fbDb && !aplicandoRemoto){
    try{ fbDb.ref('afar/'+col+'/'+id).remove(); }catch(e){}
  }
}
function lista(col){ return Object.values(DB[col] || {}); }

/* =========================================================================
   ARCHIVOS PESADOS - documentos enviados a contaduria y partes quirurgicos
   -------------------------------------------------------------------------
   Las fotos del parte quirurgico y los documentos que se le mandan al
   contador NO pueden viajar por las colecciones normales. Cada dispositivo
   se suscribe a todas las colecciones con un .on('value') y las guarda
   enteras en localStorage, que tiene 5 MB: un solo parte quirurgico
   fotografiado lo llenaria y la app dejaria de guardar.

   Por eso los binarios van a una rama aparte, afar/archivos, que NADIE
   escucha en vivo: se leen de a uno, recien cuando alguien abre el envio.
   En el dispositivo queda una cache chica con lo ultimo usado, para que el
   telefono que subio la foto la siga viendo aunque se quede sin senal.
   ========================================================================= */
const LS_ARCH   = 'afar_archivos_v1';
const ARCH_TOPE = 2600000;      /* ~2,6 MB de cache local; lo viejo se descarta */
let ARCHIVOS = null;

function archivosCache(){
  if(ARCHIVOS) return ARCHIVOS;
  try{ ARCHIVOS = JSON.parse(localStorage.getItem(LS_ARCH) || '{}'); }
  catch(e){ ARCHIVOS = {}; }
  return ARCHIVOS;
}
/* Poda por antiguedad de uso: el archivo que se abrio hace mas tiempo es el
   primero en salir. Nunca se borra de la nube, solo de la cache. */
function guardarArchivosCache(){
  const c = archivosCache();
  let ids = Object.keys(c).sort((a,b) => (c[a].usado||'') < (c[b].usado||'') ? -1 : 1);
  const pesa = () => ids.reduce((a,k) => a + ((c[k].datos||'').length), 0);
  while(ids.length > 1 && pesa() > ARCH_TOPE){ delete c[ids[0]]; ids = ids.slice(1); }
  try{ localStorage.setItem(LS_ARCH, JSON.stringify(c)); }
  catch(e){
    /* Si aun asi no entra, se conserva unicamente el ultimo usado */
    const ultimo = ids[ids.length-1];
    const solo = {}; if(ultimo) solo[ultimo] = c[ultimo];
    ARCHIVOS = solo;
    try{ localStorage.setItem(LS_ARCH, JSON.stringify(solo)); }catch(e2){}
  }
}

/* Guarda un archivo. Devuelve una promesa que dice si llego a la nube:
   sin nube el archivo queda solo en este dispositivo y el contador no lo ve,
   asi que quien envia tiene que enterarse. */
function archivoGuardar(reg){
  const c = archivosCache();
  c[reg.id] = Object.assign({}, reg, { usado: new Date().toISOString() });
  guardarArchivosCache();
  /* Misma regla que escribir(): lo de la demostracion nunca sale del equipo */
  if(reg.demo) return Promise.resolve(false);
  if(!(nubeOK && fbDb)) return Promise.resolve(false);
  return fbDb.ref('afar/archivos/'+reg.id).set(sinUndefined(reg))
    .then(() => true).catch(e => { console.warn('archivo', e); return false; });
}

/* Lee un archivo: primero la cache del dispositivo, si no la nube. */
function archivoLeer(id){
  const c = archivosCache();
  if(c[id] && c[id].datos){
    c[id].usado = new Date().toISOString();
    guardarArchivosCache();
    return Promise.resolve(c[id]);
  }
  if(!(nubeOK && fbDb)) return Promise.resolve(null);
  return fbDb.ref('afar/archivos/'+id).once('value').then(sn => {
    const v = sn.val();
    if(v && v.datos){ c[id] = Object.assign({}, v, { usado:new Date().toISOString() });
                      guardarArchivosCache(); }
    return v || null;
  }).catch(e => { console.warn('archivo', e); return null; });
}

function archivoEliminar(id){
  const c = archivosCache();
  delete c[id]; guardarArchivosCache();
  if(nubeOK && fbDb){ try{ fbDb.ref('afar/archivos/'+id).remove(); }catch(e){} }
}

/* Achica una foto antes de guardarla. Una camara de telefono saca 3-5 MB;
   un parte quirurgico se lee perfecto con el lado mayor en 1800 px y pesa
   unos 300 KB. Los PDF y los Word no se tocan: se suben tal cual. */
function comprimirImagen(file, maxLado, calidad){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || 1, h = img.naturalHeight || 1;
        const k = Math.min(1, (maxLado || 1800) / Math.max(w, h));
        w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const cx = cv.getContext('2d');
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);   /* PNG con transparencia */
        cx.drawImage(img, 0, 0, w, h);
        try{ res(cv.toDataURL('image/jpeg', calidad || 0.74)); }
        catch(e){ rej(new Error('No se pudo procesar la imagen.')); }
      };
      img.onerror = () => rej(new Error('El archivo no es una imagen que el navegador pueda abrir.'));
      img.src = fr.result;
    };
    fr.onerror = () => rej(new Error('No se pudo leer el archivo.'));
    fr.readAsDataURL(file);
  });
}

function fTam(bytes){
  const b = Number(bytes) || 0;
  if(b < 1024) return b + ' B';
  if(b < 1048576) return Math.round(b/1024) + ' KB';
  return (b/1048576).toFixed(1).replace('.', ',') + ' MB';
}
function esImagen(mime){ return /^image\//.test(mime || ''); }
function esPDF(mime, nombre){
  return /pdf/i.test(mime || '') || /\.pdf$/i.test(nombre || '');
}
function iconoArchivo(mime, nombre){
  if(esImagen(mime)) return 'camara';
  if(esPDF(mime, nombre)) return 'archivo';
  if(/word|document/i.test(mime||'') || /\.docx?$/i.test(nombre||'')) return 'word';
  return 'archivo';
}

/* ------------------------------------------------------------ Auditoria */
function auditar(accion, detalle){
  const id = uid('log');
  escribir('auditoria', id, {
    id, accion, detalle: detalle || '',
    uid: SESION ? SESION.uid : '-',
    quien: USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : 'sistema',
    cuando: new Date().toISOString()
  });
  // Poda: conserva los ultimos 800 registros
  const todos = lista('auditoria').sort((a,b)=> a.cuando < b.cuando ? 1 : -1);
  if(todos.length > 800) todos.slice(800).forEach(l => eliminar('auditoria', l.id));
}

/* ------------------------------------------------------ Firebase (nube) */
/* ¿Trae la app una configuración incluida en el código? */
function hayConfigEmbebida(){
  return typeof FIREBASE_EMBEBIDA !== 'undefined' &&
         FIREBASE_EMBEBIDA && !!FIREBASE_EMBEBIDA.databaseURL;
}
/* Configuración vigente. Prioridad:
     1. la que se cargó a mano en este dispositivo,
     2. la incluida en el código (todos los dispositivos, sin configurar nada),
     3. ninguna: la app trabaja en local.
   El valor 'off' marca una desconexión deliberada en este dispositivo, para
   que la configuración embebida no vuelva a conectarse sola. */
function configNube(){
  let guardada = null;
  try{ guardada = localStorage.getItem(LS_FB); }catch(e){}
  if(guardada === 'off') return null;
  if(guardada){
    try{
      const l = JSON.parse(guardada);
      if(l && l.databaseURL) return l;
    }catch(e){}
  }
  return hayConfigEmbebida() ? FIREBASE_EMBEBIDA : null;
}
/* ¿La conexión vigente viene del código y no de una carga manual? */
function usandoConfigEmbebida(){
  let g = null;
  try{ g = localStorage.getItem(LS_FB); }catch(e){}
  if(g === 'off') return false;
  if(g){ try{ const l = JSON.parse(g); if(l && l.databaseURL) return false; }catch(e){} }
  return hayConfigEmbebida();
}
function guardarConfigNube(cfg){
  if(cfg) localStorage.setItem(LS_FB, JSON.stringify(cfg));
  else if(hayConfigEmbebida()) localStorage.setItem(LS_FB, 'off');
  else localStorage.removeItem(LS_FB);
}
function iniciarNube(){
  const cfg = configNube();
  const chip = $('#chipNube');
  if(!cfg || !cfg.databaseURL || typeof firebase === 'undefined'){
    if(chip){ chip.classList.remove('on'); $('#chipNubeTxt').textContent = 'Local'; }
    return;
  }
  try{
    fbApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
    fbDb  = firebase.database();
    fbDb.ref('.info/connected').on('value', s => {
      nubeOK = !!s.val();
      if(chip){
        chip.classList.toggle('on', nubeOK);
        $('#chipNubeTxt').textContent = nubeOK ? 'En línea' : 'Reconectando';
      }
      if(nubeOK){ subirTodoLocal(); volcarCambiosNube(); }
    });
    COLECCIONES.forEach(col => {
      fbDb.ref('afar/'+col).on('value', snap => {
        const v = snap.val() || {};
        /* Los registros de demostracion viven solo en el equipo y nunca suben.
           El volcado remoto los pisaria: si alguien prueba el circuito con la
           demo, sus envios y sus adjuntos desaparecerian en la primera
           sincronizacion. Se conservan. */
        Object.keys(DB[col] || {}).forEach(k => {
          const r = DB[col][k];
          if(r && r.demo && !v[k]) v[k] = r;
        });
        aplicandoRemoto = true;
        DB[col] = v;
        aplicandoRemoto = false;
        guardarLocal();
        if(typeof refrescarVistaActual === 'function') refrescarVistaActual();
      });
    });
  }catch(e){
    console.warn('Firebase', e);
    toast('No se pudo conectar con la nube. Trabajando en local.', 'warn');
  }
}
/* ---- Registro de los cambios de base de datos ----
   Se encola en el dispositivo y se escribe apenas hay conexion, para que el
   asiento quede guardado en la base NUEVA (no en la que se acaba de dejar). */
function registrarCambioNube(accion, cfg){
  const reg = {
    id: 'nube_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7),
    tipo: 'cambio-de-base',
    accion: accion,                                  // conectar | cambiar | desconectar
    projectId: cfg ? (cfg.projectId || '') : '',
    databaseURL: cfg ? (cfg.databaseURL || '') : '',
    quien: USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : 'Coordinación',
    uid: SESION ? SESION.uid : 'coordinador',
    cuando: new Date().toISOString(),
    dispositivo: (typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '').slice(0, 140)
  };
  try{
    const cola = JSON.parse(localStorage.getItem(LS_NUBE_LOG) || '[]');
    cola.push(reg);
    localStorage.setItem(LS_NUBE_LOG, JSON.stringify(cola));
  }catch(e){}
  /* Si sigue habiendo conexion con la base actual, se asienta tambien alli */
  if(nubeOK) volcarCambiosNube();
  return reg;
}

function volcarCambiosNube(){
  let cola;
  try{ cola = JSON.parse(localStorage.getItem(LS_NUBE_LOG) || '[]'); }catch(e){ return; }
  if(!cola || !cola.length) return;
  cola.forEach(r => {
    escribir('auditoria', r.id, {
      id: r.id, accion: 'base-de-datos-' + r.accion,
      detalle: (r.projectId ? 'Proyecto ' + r.projectId + '. ' : '') + 'Desde ' + r.dispositivo,
      uid: r.uid, quien: r.quien, cuando: r.cuando
    });
  });
  /* Estado vigente de la conexion, visible para toda la asociacion */
  const ultimo = cola[cola.length - 1];
  escribir('config', 'nube', {
    id:'nube', projectId: ultimo.projectId, databaseURL: ultimo.databaseURL,
    accion: ultimo.accion, quien: ultimo.quien, uid: ultimo.uid, cuando: ultimo.cuando
  });
  try{ localStorage.removeItem(LS_NUBE_LOG); }catch(e){}
}

/* Primera conexion: empuja lo que exista solo en local */
let yaSubido = false;
function subirTodoLocal(){
  if(yaSubido || !fbDb) return;
  yaSubido = true;
  COLECCIONES.forEach(col => {
    Object.keys(DB[col] || {}).forEach(id => {
      const reg = DB[col][id];
      if(!reg || reg.demo) return;        /* la demostracion nunca viaja a la nube */
      fbDb.ref('afar/'+col+'/'+id).once('value', s => {
        if(!s.exists()) fbDb.ref('afar/'+col+'/'+id).set(reg);
      });
    });
  });
}

/* ------------------------------------------------------- Catalogos base
   El CIE-10 se retiro de la app: en el consultorio de preanestesia no se
   codifica, se describe. Los antecedentes salen de PATOLOGIAS
   (data-antecedentes.js) y el unico nomenclador vigente es el anestesico. */
let CIRUGIAS = [];
function parsearCatalogos(){
  let esp = '';
  CIRUGIAS = [];
  (CIRUGIAS_TXT + (typeof CIRUGIAS_TXT_EXTRA !== 'undefined' ? CIRUGIAS_TXT_EXTRA : '')).split('\n').forEach(l => {
    l = l.trim(); if(!l) return;
    if(l[0] === '#'){ esp = l.slice(1).trim(); return; }
    const p = l.split('|'); if(p.length < 2) return;
    CIRUGIAS.push({ n: p[0].trim(), ua: Number(p[1]) || 10, esp });
  });
}
/* ------------------------------- Nomenclador anestesiologico AFAAR 2021 */
let NOMENCLADOR = [];
function parsearNomenclador(){
  NOMENCLADOR = [];
  if(typeof NOMENCLADOR_TXT === 'undefined') return;
  let grupo = '', gcod = '', sub = '';
  const cargar = (txt, anexo) => {
    txt.split('\n').forEach(l => {
      l = l.trim(); if(!l) return;
      if(l.slice(0,2) === '##'){ sub = (l.slice(2).split('|')[1] || '').trim(); return; }
      if(l[0] === '#'){
        const p = l.slice(1).split('|');
        gcod = p[0].trim(); grupo = (p[1] || '').trim(); sub = ''; return;
      }
      const p = l.split('|');
      if(p.length < 3) return;
      NOMENCLADOR.push({
        cod: p[0].trim(), n: p[1].trim(), comp: p[2].trim(),
        grillaB: !anexo && p[3] === 'B',
        nota: anexo ? (p[3] || '').trim() : '',
        grupo, gcod, sub, anexo: !!anexo
      });
    });
  };
  cargar(NOMENCLADOR_TXT, false);
  if(typeof NOMENCLADOR_DOLOR_TXT !== 'undefined') cargar(NOMENCLADOR_DOLOR_TXT, true);
}

/* Diagnosticos y cirugias agregados manualmente por los usuarios */
function extras(tipo){
  return lista('catalogoExtra').filter(x => x.tipo === tipo);
}
function agregarExtra(tipo, datos){
  const id = uid('ext');
  escribir('catalogoExtra', id, Object.assign({id, tipo, creado:new Date().toISOString(),
    porUid: SESION ? SESION.uid : ''}, datos));
  return id;
}
/* Catalogo de antecedentes patologicos: el curado mas lo que sumo la
   asociacion desde el propio buscador. Reemplaza al viejo todosCIE(). */
function todasPatologias(){
  return PATOLOGIAS.concat(extras('pat').map(e => ({
    n:e.n, sis:e.sis || 'Agregado manualmente', meds:[], flags:[], extra:true })));
}
function todasCirugias(){
  return CIRUGIAS.concat(extras('cx').map(e => ({ n:e.n, ua:e.ua || 10, esp:e.esp || 'Agregado manualmente', extra:true })));
}
/* ======================= PRESTADORES ============================
   Instituciones y financiadores. Los nombres se comparan por una clave
   normalizada (sin mayusculas, sin acentos, sin puntuacion), de modo que
   "OSDE", "osde" y "O.S.D.E." son el mismo prestador.
   ================================================================ */
/* Clave por palabras: "O.S.D.E." -> "o s d e" */
function claveTexto(s){
  return norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
}
/* Clave de identidad: ignora ademas los separadores internos, de modo que
   "OSDE", "osde", "O.S.D.E." y "O S D E" son exactamente el mismo prestador. */
function clavePrestador(s){
  return claveTexto(s).replace(/ /g, '');
}

/* Distancia de Levenshtein, para detectar errores de tipeo */
function distancia(a, b){
  a = String(a); b = String(b);
  if(a === b) return 0;
  if(!a.length || !b.length) return Math.max(a.length, b.length);
  let prev = [], fila = [];
  for(let j = 0; j <= b.length; j++) prev[j] = j;
  for(let i = 1; i <= a.length; i++){
    fila = [i];
    for(let j = 1; j <= b.length; j++){
      fila[j] = Math.min(prev[j] + 1, fila[j-1] + 1,
                         prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    }
    prev = fila;
  }
  return prev[b.length];
}

/* ¿Son el mismo prestador escrito distinto?
   Devuelve null, o el motivo por el que se parecen. */
function parecidoPrestador(a, b){
  const ka = clavePrestador(a), kb = clavePrestador(b);
  if(!ka || !kb) return null;
  if(ka === kb) return 'idéntico';
  const pa = claveTexto(a).split(' '), pb = claveTexto(b).split(' ');
  /* uno empieza igual que el otro: "sancor" / "sancor salud" */
  const corto = pa.length < pb.length ? pa : pb;
  const largo = pa.length < pb.length ? pb : pa;
  if(corto.length && corto.every((w, i) => largo[i] === w)) return 'uno contiene al otro';
  /* una palabra fuerte en comun y poca diferencia: "osde" / "osde binario" */
  if(pa.length !== pb.length && pa[0] === pb[0] && pa[0].length >= 4) return 'misma raíz';
  /* error de tipeo */
  const d = distancia(ka, kb);
  if(ka.length >= 5 && d <= 2) return 'difieren en ' + d + ' letra' + (d === 1 ? '' : 's');
  if(ka.length >= 12 && d <= 3) return 'difieren en ' + d + ' letras';
  return null;
}

/* Prestadores ocultos (fusionados o dados de baja) y pares que el coordinador
   marco como distintos para que dejen de proponerse como duplicados. */
function prestadoresOcultos(){
  const p = DB.config.prestadores || {};
  return { instOcultas: p.instOcultas || [], finOcultos: p.finOcultos || [],
           paresIgnorados: p.paresIgnorados || [] };
}
function guardarOcultos(o){
  escribir('config', 'prestadores', { id:'prestadores',
    instOcultas:o.instOcultas || [], finOcultos:o.finOcultos || [],
    paresIgnorados:o.paresIgnorados || [],
    modificado:new Date().toISOString(),
    modificadoPor: USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '' });
}
/* Identificador de un par, independiente del orden */
function clavePar(a, b){
  return [String(a), String(b)].sort().join('||');
}
function parIgnorado(a, b){
  const k = clavePar(a, b);
  return prestadoresOcultos().paresIgnorados.some(p => (p.k || p) === k);
}
function ignorarPar(tipo, a, b, etiquetaA, etiquetaB){
  const oc = prestadoresOcultos();
  const k = clavePar(a, b);
  if(!oc.paresIgnorados.some(p => (p.k || p) === k)){
    oc.paresIgnorados.push({ k, tipo, a:etiquetaA, b:etiquetaB,
      cuando:new Date().toISOString(),
      quien: USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '' });
    guardarOcultos(oc);
  }
  auditar('prestador-no-fusionar', '«' + etiquetaA + '» y «' + etiquetaB + '» son prestadores distintos');
}
function revisarParDeNuevo(k){
  const oc = prestadoresOcultos();
  const p = oc.paresIgnorados.find(x => (x.k || x) === k);
  oc.paresIgnorados = oc.paresIgnorados.filter(x => (x.k || x) !== k);
  guardarOcultos(oc);
  if(p) auditar('prestador-revisar', '«' + (p.a||'') + '» y «' + (p.b||'') + '» vuelven a revisarse');
}

/* Todas las instituciones, incluidas las ocultas: para resolver el nombre
   de fichas viejas que todavia apuntan a una institucion dada de baja. */
function todasInstituciones(){
  return INSTITUCIONES_BASE.map(i => Object.assign({ base:true }, i))
    .concat(lista('instituciones'));
}
/* Las que se ofrecen en los desplegables */
function instituciones(){
  const oc = prestadoresOcultos().instOcultas;
  return todasInstituciones().filter(i => oc.indexOf(i.id) < 0);
}
function nombreInstitucion(id){
  const i = todasInstituciones().find(x => x.id === id);
  return i ? i.nombre : (id || '—');
}
function institucionPorId(id){
  return todasInstituciones().find(x => x.id === id) || null;
}

/* Financiadores: los de base mas los agregados, sin repetir por clave */
function todosFinanciadores(){
  const nombres = [];
  const agregar = n => {
    if(!n) return;
    const k = clavePrestador(n);
    if(!k || nombres.some(x => clavePrestador(x) === k)) return;
    nombres.push(n);
  };
  /* los registros propios mandan sobre la lista de base: si el coordinador
     renombro uno, se muestra como el lo dejo */
  lista('obrasSociales').forEach(r => agregar(r.nombre));
  OBRAS_SOCIALES_BASE.forEach(agregar);
  return nombres;
}
function obrasSociales(){
  const oc = prestadoresOcultos().finOcultos;
  return todosFinanciadores().filter(n => oc.indexOf(clavePrestador(n)) < 0);
}
/* Ficha de datos de un financiador (CUIT, contacto, condiciones) */
function datosFinanciador(nombre){
  const k = clavePrestador(nombre);
  return lista('obrasSociales').find(r => clavePrestador(r.nombre) === k) || null;
}
function guardarDatosFinanciador(nombre, datos){
  const r = datosFinanciador(nombre);
  const id = r ? r.id : uid('os');
  escribir('obrasSociales', id, Object.assign({ id, nombre }, r || {}, datos, { nombre }));
  return id;
}
/* Cuantas fichas usan cada prestador */
function usoInstitucion(id){
  return lista('fichas').filter(f => f.institucion === id).length;
}
function usoFinanciador(nombre){
  const k = clavePrestador(nombre);
  return lista('fichas').filter(f => clavePrestador(f.obraSocial) === k).length;
}

/* ---------------------------------------------------------- Buscador UI */
/* Componente de busqueda incremental con alta manual.
   fuente: () => [{clave, etiqueta, sub, dato}] */
function montarBuscador(opts){
  const inp = opts.input, caja = opts.caja;
  let items = [];
  const pintar = () => {
    const q = norm(inp.value.trim());
    caja.innerHTML = '';
    if(q.length < 2){ caja.classList.remove('on'); return; }
    /* Coincidencia por palabras: "cesarea acreta" encuentra
       "Cesárea por placenta ácreta e histerectomía". Primero lo que arranca
       con lo tipeado, despues el resto. */
    const term = q.split(/\s+/).filter(Boolean);
    items = opts.fuente()
      .filter(x => term.every(w => x.busca.indexOf(w) >= 0))
      .map(x => [x.busca.indexOf(q) === 0 ? 0 : (x.busca.indexOf(term[0]) === 0 ? 1 : 2), x])
      /* A igual coincidencia manda el "peso": el nomenclador oficial va
         antes que el catalogo propio. */
      .sort((a,b) => a[0] - b[0] || (a[1].peso||0) - (b[1].peso||0))
      .slice(0, 60).map(r => r[1]);
    let html = items.map((x,i) =>
      '<div data-i="'+i+'">'+
        (x.cod ? '<span class="cod">'+esc(x.cod)+'</span>' : '')+
        esc(x.etiqueta)+
        (x.sub ? '<span class="cap">'+esc(x.sub)+'</span>' : '')+
      '</div>').join('');
    if(opts.manual){
      html += '<div data-manual="1"><span class="nuevo">'+ico('mas')
        .replace('<svg','<svg style="width:13px;height:13px;display:inline-block;vertical-align:-2px"')+
        ' Agregar manualmente: "'+esc(inp.value.trim())+'"</span></div>';
    }
    if(!html) html = '<div style="color:var(--texto-3)">Sin resultados</div>';
    caja.innerHTML = html;
    caja.classList.add('on');
  };
  inp.addEventListener('input', debounce(pintar, 160));
  inp.addEventListener('focus', pintar);
  caja.addEventListener('mousedown', e => {
    const d = e.target.closest('div[data-i],div[data-manual]');
    if(!d) return;
    e.preventDefault();
    if(d.dataset.manual){ opts.onManual(inp.value.trim()); }
    else { opts.onElegir(items[Number(d.dataset.i)]); }
    inp.value = ''; caja.classList.remove('on');
  });
  document.addEventListener('click', e => {
    if(!caja.contains(e.target) && e.target !== inp) caja.classList.remove('on');
  });
}

/* ============================ MOTOR DE SCORES ============================ */
function calcIMC(pesoKg, tallaCm){
  const p = Number(pesoKg), t = Number(tallaCm) / 100;
  if(!p || !t) return null;
  return p / (t * t);
}
function clasificaIMC(imc){
  if(imc === null) return '';
  if(imc < 18.5) return 'Bajo peso';
  if(imc < 25) return 'Normal';
  if(imc < 30) return 'Sobrepeso';
  if(imc < 35) return 'Obesidad grado I';
  if(imc < 40) return 'Obesidad grado II';
  if(imc < 50) return 'Obesidad grado III (mórbida)';
  return 'Superobesidad';
}
function superficieCorporal(pesoKg, tallaCm){
  const p = Number(pesoKg), t = Number(tallaCm);
  if(!p || !t) return null;
  return Math.sqrt((p * t) / 3600);          // Mosteller
}
function pesoIdeal(tallaCm, sexo){
  const t = Number(tallaCm); if(!t) return null;
  const base = sexo === 'F' ? 45.5 : 50;
  return base + 2.3 * ((t / 2.54) - 60);      // Devine
}
function eGFR(creatinina, edad, sexo){
  const cr = Number(creatinina), e = Number(edad);
  if(!cr || !e) return null;
  const f = sexo === 'F';
  const k = f ? 0.7 : 0.9, a = f ? -0.241 : -0.302;
  const min = Math.min(cr / k, 1), max = Math.max(cr / k, 1);
  let g = 142 * Math.pow(min, a) * Math.pow(max, -1.2) * Math.pow(0.9938, e);
  if(f) g *= 1.012;
  return g;                                    // CKD-EPI 2021
}
function estadioERC(g){
  if(g === null) return '';
  if(g >= 90) return 'G1 — normal';
  if(g >= 60) return 'G2 — leve';
  if(g >= 45) return 'G3a — leve a moderada';
  if(g >= 30) return 'G3b — moderada a severa';
  if(g >= 15) return 'G4 — severa';
  return 'G5 — falla renal';
}

/* --- STOP-BANG (apnea obstructiva del sueño) --- */
const STOPBANG_ITEMS = [
  { k:'ronquido', t:'Ronquido fuerte (se oye a través de una puerta cerrada)' },
  { k:'cansancio',t:'Cansancio o somnolencia diurna frecuente' },
  { k:'apneas',   t:'Alguien observó apneas durante el sueño' },
  { k:'presion',  t:'Hipertensión arterial (o en tratamiento)' },
  { k:'imc',      t:'IMC mayor a 35 kg/m²' },
  { k:'edad',     t:'Edad mayor de 50 años' },
  { k:'cuello',   t:'Circunferencia del cuello > 43 cm (hombre) o > 41 cm (mujer)' },
  { k:'sexo',     t:'Sexo masculino' }
];
function calcSTOPBANG(v){
  const n = STOPBANG_ITEMS.reduce((a,i) => a + (v[i.k] ? 1 : 0), 0);
  let r, nivel;
  if(n <= 2){ r = 'Riesgo bajo de apnea obstructiva del sueño.'; nivel='bajo'; }
  else if(n <= 4){ r = 'Riesgo intermedio. Considerar oximetría nocturna y precauciones en la vía aérea.'; nivel='moderado'; }
  else { r = 'Riesgo ALTO de SAHOS. Preparar vía aérea difícil, minimizar opioides, analgesia multimodal, monitoreo prolongado en URPA y CPAP postoperatoria.'; nivel='alto'; }
  return { n, max:8, nivel, texto:r };
}

/* --- Apfel (náuseas y vómitos postoperatorios) --- */
const APFEL_ITEMS = [
  { k:'mujer',   t:'Sexo femenino' },
  { k:'nofuma',  t:'No fumador' },
  { k:'antNVPO', t:'Antecedente de NVPO o cinetosis' },
  { k:'opioides',t:'Uso previsto de opioides postoperatorios' }
];
function calcApfel(v){
  const n = APFEL_ITEMS.reduce((a,i) => a + (v[i.k] ? 1 : 0), 0);
  const riesgo = [10, 21, 39, 61, 79][n];
  let plan;
  if(n <= 1) plan = 'Profilaxis opcional con 1 fármaco (dexametasona u ondansetrón).';
  else if(n === 2) plan = 'Profilaxis doble: dexametasona 4-8 mg al inicio + ondansetrón 4 mg al final.';
  else plan = 'Profilaxis triple o cuádruple + anestesia total endovenosa con propofol, evitar óxido nitroso y minimizar opioides.';
  return { n, max:4, nivel: n<=1?'bajo':(n===2?'moderado':'alto'),
           texto:'Riesgo estimado de NVPO: ' + riesgo + ' %. ' + plan, riesgo };
}

/* --- RCRI / índice de Lee (riesgo cardíaco) --- */
const RCRI_ITEMS = [
  { k:'altoRiesgo', t:'Cirugía de alto riesgo (intraperitoneal, intratorácica o vascular suprainguinal)' },
  { k:'cardiopatia',t:'Cardiopatía isquémica (IAM previo, angina, test positivo, uso de nitratos u onda Q)' },
  { k:'icc',        t:'Insuficiencia cardíaca congestiva' },
  { k:'acv',        t:'Enfermedad cerebrovascular (ACV o AIT)' },
  { k:'dbtInsulina',t:'Diabetes en tratamiento con insulina' },
  { k:'creatinina', t:'Creatinina preoperatoria > 2 mg/dl' }
];
function calcRCRI(v){
  const n = RCRI_ITEMS.reduce((a,i) => a + (v[i.k] ? 1 : 0), 0);
  const tasa = [3.9, 6.0, 10.1, 15.0][Math.min(n,3)];
  let nivel = n === 0 ? 'bajo' : (n === 1 ? 'bajo' : (n === 2 ? 'moderado' : 'alto'));
  let txt = 'Riesgo de evento cardiovascular mayor a 30 días ≈ ' + tasa + ' %. ';
  if(n >= 2) txt += 'Considerar dosaje de troponina y BNP perioperatorio, monitoreo continuo y evaluación cardiológica si la capacidad funcional es menor de 4 MET.';
  else txt += 'Bajo riesgo: no se requieren estudios cardiológicos adicionales de rutina.';
  return { n, max:6, nivel, texto:txt, tasa };
}

/* --- ARISCAT (riesgo de complicaciones pulmonares) --- */
function calcARISCAT(v){
  let n = 0;
  const e = Number(v.edad) || 0;
  if(e > 80) n += 16; else if(e > 50) n += 3;
  const sp = Number(v.spo2);
  if(sp && sp <= 90) n += 24; else if(sp && sp <= 95) n += 8;
  if(v.infeccionRespiratoria) n += 17;
  const hb = Number(v.hb);
  if(hb && hb <= 10) n += 11;
  if(v.incision === 'alta') n += 15;
  else if(v.incision === 'toracica') n += 24;
  const dur = Number(v.duracion) || 0;
  if(dur > 180) n += 23; else if(dur > 120) n += 16;
  if(v.urgencia) n += 8;
  let nivel, txt;
  if(n < 26){ nivel = 'bajo'; txt = 'Riesgo bajo (1,6 %) de complicaciones pulmonares postoperatorias.'; }
  else if(n < 45){ nivel = 'moderado'; txt = 'Riesgo intermedio (13,3 %). Ventilación protectora, fisioterapia respiratoria, analgesia que permita toser, movilización precoz.'; }
  else { nivel = 'alto'; txt = 'Riesgo ALTO (42,1 %). Optimizar antes de la cirugía, considerar técnica regional, ventilación protectora estricta, extubación con criterios firmes y kinesiología intensiva.'; }
  return { n, max:123, nivel, texto:txt };
}

/* --- Caprini (tromboembolismo venoso) --- */
const CAPRINI_ITEMS = [
  { p:1, t:'Edad 41-60 años' }, { p:2, t:'Edad 61-74 años' }, { p:3, t:'Edad ≥ 75 años' },
  { p:1, t:'Cirugía menor programada' }, { p:2, t:'Cirugía mayor (> 45 min) o laparoscópica > 45 min' },
  { p:1, t:'IMC > 25' }, { p:1, t:'Edema de miembros inferiores' }, { p:1, t:'Várices' },
  { p:1, t:'Embarazo o puerperio' }, { p:1, t:'Anticonceptivos orales o terapia hormonal' },
  { p:1, t:'Sepsis o infección grave (< 1 mes)' }, { p:1, t:'Enfermedad pulmonar grave o neumonía' },
  { p:1, t:'EPOC' }, { p:1, t:'Infarto agudo de miocardio' }, { p:1, t:'Insuficiencia cardíaca (< 1 mes)' },
  { p:1, t:'Reposo en cama del paciente médico' }, { p:1, t:'Enfermedad inflamatoria intestinal' },
  { p:2, t:'Neoplasia maligna previa o actual' }, { p:2, t:'Reposo en cama > 72 h' },
  { p:2, t:'Yeso inmovilizador' }, { p:2, t:'Acceso venoso central' },
  { p:3, t:'Antecedente de TVP o TEP' }, { p:3, t:'Antecedente familiar de trombosis' },
  { p:3, t:'Factor V Leiden / mutación de protrombina' }, { p:3, t:'Anticoagulante lúpico o anticardiolipina' },
  { p:3, t:'Hiperhomocisteinemia o trombocitopenia inducida por heparina' },
  { p:5, t:'Artroplastia mayor programada' }, { p:5, t:'Fractura de cadera, pelvis o pierna' },
  { p:5, t:'Accidente cerebrovascular (< 1 mes)' }, { p:5, t:'Politraumatismo' },
  { p:5, t:'Lesión medular aguda (< 1 mes)' }
];
function calcCaprini(sel){
  const n = sel.reduce((a,i) => a + CAPRINI_ITEMS[i].p, 0);
  let nivel, txt;
  if(n <= 1){ nivel='bajo'; txt='Riesgo muy bajo (< 0,5 %). Deambulación precoz.'; }
  else if(n === 2){ nivel='bajo'; txt='Riesgo bajo (1,5 %). Compresión neumática intermitente.'; }
  else if(n <= 4){ nivel='moderado'; txt='Riesgo moderado (3 %). HBPM profiláctica o medidas mecánicas si hay riesgo hemorrágico alto.'; }
  else if(n <= 8){ nivel='alto'; txt='Riesgo alto (6 %). HBPM + compresión mecánica. Considerar profilaxis extendida.'; }
  else { nivel='alto'; txt='Riesgo muy alto (> 10 %). HBPM + medidas mecánicas y profilaxis extendida 28-35 días.'; }
  return { n, max:'—', nivel, texto:txt };
}

/* --- El-Ganzouri (índice de riesgo de vía aérea difícil) --- */
function calcElGanzouri(v){
  let n = 0;
  const ab = Number(v.aperturaBucal);
  if(ab && ab < 4) n += 1;
  const dtm = Number(v.tiromentoniana);
  if(dtm){ if(dtm < 6) n += 2; else if(dtm <= 6.5) n += 1; }
  const mp = Number(v.mallampati);
  if(mp === 2) n += 1; else if(mp >= 3) n += 2;
  if(v.cuelloMov === 'limitada') n += 1; else if(v.cuelloMov === 'muy_limitada') n += 2;
  if(v.protrusion === 'clase2') n += 1; else if(v.protrusion === 'clase3') n += 2;
  const p = Number(v.peso);
  if(p){ if(p > 110) n += 2; else if(p >= 90) n += 1; }
  if(v.intubacionPrevia === 'dificil') n += 2;
  let nivel, txt;
  if(n <= 3){ nivel='bajo'; txt='Baja probabilidad de laringoscopía difícil. Aun así, verificar el plan A-B-C-D y disponer del carro de vía aérea.'; }
  else if(n <= 6){ nivel='moderado'; txt='Probabilidad intermedia. Preparar videolaringoscopio, bougie y un segundo operador. Preoxigenación optimizada.'; }
  else { nivel='alto'; txt='ALTA probabilidad de vía aérea difícil. Considerar intubación con el paciente despierto o fibroscopía. Personal experimentado presente, kit de acceso cervical frontal disponible y plan CICO explicitado.'; }
  return { n, max:12, nivel, texto:txt };
}

/* --- Capacidad funcional en MET --- */
const MET_OPCIONES = [
  { v:1,  t:'Dependiente para el autocuidado — no puede realizar actividad' },
  { v:2,  t:'Come, se viste y usa el baño solo; camina dentro de la casa' },
  { v:3,  t:'Camina 1-2 cuadras en llano a 3-5 km/h' },
  { v:4,  t:'Tareas domésticas livianas (barrer, lavar los platos)' },
  { v:5,  t:'Sube un piso por escalera o una cuesta' },
  { v:6,  t:'Camina rápido (6 km/h), tareas domésticas pesadas' },
  { v:8,  t:'Corre distancias cortas; sube dos pisos sin detenerse' },
  { v:10, t:'Deportes intensos: natación, fútbol, tenis singles, esquí' }
];
function interpMET(m){
  const v = Number(m) || 0;
  if(v >= 10) return { nivel:'bajo', texto:'Capacidad funcional excelente (≥ 10 MET). Muy bajo riesgo perioperatorio.' };
  if(v >= 4)  return { nivel:'bajo', texto:'Capacidad funcional adecuada (≥ 4 MET). Puede procederse sin estudios cardiológicos adicionales.' };
  if(v >= 3)  return { nivel:'moderado', texto:'Capacidad funcional limitada (< 4 MET). Valorar si un estudio no invasivo modificaría el manejo.' };
  return { nivel:'alto', texto:'Capacidad funcional pobre o desconocida (< 3 MET). Evaluación cardiológica y estratificación adicional según ACC/AHA.' };
}

/* --- Clinical Frailty Scale --- */
const FRAGILIDAD = [
  [1,'Muy en forma — activo, enérgico, entrena con regularidad'],
  [2,'En forma — sin síntomas de enfermedad activa, activo ocasionalmente'],
  [3,'Bien controlado — problemas médicos controlados, no activo más allá de caminar'],
  [4,'Vulnerable — no dependiente, pero los síntomas limitan la actividad'],
  [5,'Levemente frágil — requiere ayuda en actividades instrumentales'],
  [6,'Moderadamente frágil — necesita ayuda para todas las actividades externas y para bañarse'],
  [7,'Severamente frágil — dependiente para el cuidado personal, estable'],
  [8,'Muy severamente frágil — dependiente y próximo al final de la vida'],
  [9,'Enfermedad terminal — expectativa de vida menor a 6 meses']
];

/* --- Interpretación global de laboratorio --- */
function alertasLaboratorio(l){
  const a = [];
  const num = k => (l[k] === '' || l[k] === undefined || l[k] === null) ? null : Number(l[k]);
  const hb = num('hb');
  if(hb !== null){
    if(hb < 7) a.push(['danger','Anemia severa (Hb ' + hb + ' g/dl): considerar transfusión y postergar la cirugía electiva.']);
    else if(hb < 10) a.push(['warn','Anemia (Hb ' + hb + ' g/dl): optimizar con hierro antes de la cirugía electiva; prever pérdidas.']);
  }
  const plaq = num('plaquetas');
  if(plaq !== null){
    if(plaq < 50) a.push(['danger','Plaquetopenia severa (' + plaq + ' mil/µl): contraindicación relativa de bloqueo neuroaxial; prever transfusión.']);
    else if(plaq < 100) a.push(['warn','Plaquetopenia (' + plaq + ' mil/µl): evaluar riesgo/beneficio del bloqueo neuroaxial.']);
  }
  const rin = num('rin');
  if(rin !== null && rin > 1.5) a.push(['danger','RIN ' + rin + ': corregir antes de la cirugía. Contraindicado el bloqueo neuroaxial (límite 1,4-1,5).']);
  const k = num('potasio');
  if(k !== null){
    if(k > 5.5) a.push(['danger','Hiperkalemia (' + k + ' mEq/l): corregir antes de la inducción. Evitar succinilcolina.']);
    else if(k < 3.0) a.push(['warn','Hipokalemia (' + k + ' mEq/l): riesgo de arritmias; corregir.']);
  }
  const na = num('sodio');
  if(na !== null && (na < 125 || na > 150)) a.push(['danger','Disnatremia significativa (' + na + ' mEq/l): corregir y buscar la causa.']);
  const gl = num('glucemia');
  if(gl !== null){
    if(gl > 250) a.push(['warn','Hiperglucemia (' + gl + ' mg/dl): descartar cetosis; corregir antes del ingreso a quirófano.']);
    if(gl < 70) a.push(['danger','Hipoglucemia (' + gl + ' mg/dl): corregir de inmediato.']);
  }
  const hba1c = num('hba1c');
  if(hba1c !== null && hba1c > 8) a.push(['warn','HbA1c ' + hba1c + ' %: control metabólico deficiente, mayor riesgo de infección del sitio quirúrgico.']);
  const cr = num('creatinina');
  if(cr !== null && cr > 2) a.push(['warn','Creatinina ' + cr + ' mg/dl: ajustar fármacos de eliminación renal y evitar nefrotóxicos.']);
  return a;
}

/* --- Estudios preoperatorios sugeridos --- */
function estudiosSugeridos(edad, asa, riesgoCx, cond){
  const s = [];
  const e = Number(edad) || 0;
  const a = ['I','II','III','IV','V','VI'].indexOf(asa) + 1;
  if(a >= 3 || e >= 65 || riesgoCx !== 'bajo') s.push('Hemograma completo');
  if(a >= 3 || e >= 65 || cond.anticoagulado) s.push('Coagulograma (TP, RIN, KPTT)');
  if(a >= 2 || e >= 50) s.push('Glucemia');
  if(a >= 3 || e >= 65 || cond.renal || cond.hta || cond.diabetes) s.push('Urea, creatinina e ionograma');
  if(e >= 65 || cond.cardiopatia || cond.hta || cond.diabetes || cond.arritmia || a >= 3) s.push('Electrocardiograma de 12 derivaciones');
  if(cond.respiratorio || cond.tabaquismo || e >= 70 || riesgoCx === 'alto') s.push('Radiografía de tórax');
  if(cond.cardiopatia || cond.soplo || cond.disnea) s.push('Ecocardiograma Doppler');
  if(cond.respiratorio && riesgoCx !== 'bajo') s.push('Espirometría / gases en sangre');
  if(cond.diabetes) s.push('Hemoglobina glicosilada');
  if(cond.hepatopatia) s.push('Hepatograma y albúmina');
  if(riesgoCx === 'alto' || cond.sangrado) s.push('Grupo y factor, prueba cruzada');
  if(cond.embarazoPosible) s.push('Test de embarazo');
  if(!s.length) s.push('Paciente sano para cirugía de bajo riesgo: no se requieren estudios de rutina (recomendación de no hacer, ASA/NICE).');
  return s.filter((x,i,arr) => arr.indexOf(x) === i);
}

/* ------------------------------------------------- Componentes visuales */
function tarjetaScore(titulo, r, sufijo){
  return '<div class="score riesgo-'+r.nivel+'">'+
    '<div class="top"><b>'+esc(titulo)+'</b>'+
    '<span class="valor">'+r.n+(r.max && r.max !== '—' ? ' <span style="font-size:12px;opacity:.6">/ '+r.max+'</span>' : '')+(sufijo||'')+'</span></div>'+
    '<div class="interp">'+r.texto+'</div>'+
    (r.max && r.max !== '—' ? '<div class="barra"><i style="width:'+
      Math.min(100, (r.n / r.max) * 100)+'%;background:currentColor"></i></div>' : '')+
  '</div>';
}
function svgBarras(datos, alto, color){
  const w = Math.max(320, datos.length * 62), h = alto || 170, pad = 26;
  const max = Math.max(1, ...datos.map(d => d.v));
  const bw = (w - pad*2) / Math.max(1, datos.length);
  let s = '<svg viewBox="0 0 '+w+' '+(h+34)+'" style="width:100%;height:'+(h+34)+'px">';
  [0,.25,.5,.75,1].forEach(f => {
    const y = pad + (h - pad*1.4) * (1-f);
    s += '<line x1="'+pad+'" y1="'+y+'" x2="'+(w-6)+'" y2="'+y+'" stroke="currentColor" stroke-opacity=".12"/>';
    s += '<text x="2" y="'+(y+3)+'" font-size="9" fill="currentColor" opacity=".5">'+Math.round(max*f)+'</text>';
  });
  datos.forEach((d,i) => {
    const bh = ((h - pad*1.4) * d.v) / max;
    const x = pad + i*bw + bw*0.16, y = pad + (h - pad*1.4) - bh;
    s += '<rect x="'+x+'" y="'+y+'" width="'+(bw*0.68)+'" height="'+Math.max(1,bh)+'" rx="4" fill="'+(d.color||color||'var(--azul-500)')+'"/>';
    if(d.v) s += '<text x="'+(x+bw*0.34)+'" y="'+(y-4)+'" font-size="10" text-anchor="middle" fill="currentColor" font-weight="700">'+d.v+'</text>';
    s += '<text x="'+(x+bw*0.34)+'" y="'+(h+12)+'" font-size="9" text-anchor="middle" fill="currentColor" opacity=".65">'+
         esc(String(d.t).slice(0,12))+'</text>';
    if(String(d.t).length > 12)
      s += '<text x="'+(x+bw*0.34)+'" y="'+(h+23)+'" font-size="9" text-anchor="middle" fill="currentColor" opacity=".65">'+
           esc(String(d.t).slice(12,24))+'</text>';
  });
  return s + '</svg>';
}
const PALETA = ['#1b4e85','#14b8a6','#7c3aed','#d97706','#dc2626','#16a34a','#2563eb','#db2777',
                '#0e8f95','#65a30d','#9333ea','#ea580c'];
function svgDona(datos, titulo){
  const total = datos.reduce((a,d) => a + d.v, 0) || 1;
  const R = 62, r = 38, cx = 78, cy = 78;
  let ang = -Math.PI/2, s = '<svg viewBox="0 0 156 156" style="width:156px;height:156px;flex:none">';
  datos.forEach((d,i) => {
    const frac = d.v / total;
    if(frac >= 0.9999){          // un solo segmento: anillo completo
      s += '<circle cx="'+cx+'" cy="'+cy+'" r="'+((R+r)/2)+'" fill="none" stroke="'+
           PALETA[i%PALETA.length]+'" stroke-width="'+(R-r)+'"/>';
      return;
    }
    const a2 = ang + frac * Math.PI*2;
    const grande = (a2-ang) > Math.PI ? 1 : 0;
    const p = (rad,a) => [cx + rad*Math.cos(a), cy + rad*Math.sin(a)];
    const [x1,y1] = p(R,ang), [x2,y2] = p(R,a2), [x3,y3] = p(r,a2), [x4,y4] = p(r,ang);
    s += '<path d="M'+x1+' '+y1+' A'+R+' '+R+' 0 '+grande+' 1 '+x2+' '+y2+
         ' L'+x3+' '+y3+' A'+r+' '+r+' 0 '+grande+' 0 '+x4+' '+y4+' Z" fill="'+PALETA[i%PALETA.length]+'"/>';
    ang = a2;
  });
  s += '<text x="78" y="74" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor">'+total+'</text>';
  s += '<text x="78" y="90" text-anchor="middle" font-size="9" fill="currentColor" opacity=".6">'+esc(titulo||'total')+'</text>';
  return s + '</svg>';
}
function leyenda(datos){
  return '<div class="leyenda">'+ datos.map((d,i) =>
    '<span><i style="background:'+PALETA[i%PALETA.length]+'"></i>'+esc(d.t)+' ('+d.v+')</span>').join('') +'</div>';
}

/* ------------------------------------------------------------ Archivos */
function leerArchivo(file, max){
  return new Promise((res, rej) => {
    if(file.size > (max || 1600000))
      return rej(new Error('El archivo supera el tamaño máximo de ' + Math.round((max||1600000)/1024) + ' KB.'));
    const fr = new FileReader();
    fr.onload = () => res({ nombre:file.name, tipo:file.type, tam:file.size, dataUrl:fr.result });
    fr.onerror = () => rej(new Error('No se pudo leer el archivo.'));
    fr.readAsDataURL(file);
  });
}
function descargar(nombre, contenido, mime){
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
}

/* ------------------------------------------------------------ Firma ---- */
function montarFirma(canvas, onCambio){
  const ctx = canvas.getContext('2d');
  const rect = () => canvas.getBoundingClientRect();
  function resize(){
    const r = rect(), dpr = window.devicePixelRatio || 1;
    const datos = canvas.toDataURL();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0b2545';
    if(canvas.dataset.tieneTrazo){
      const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, r.width, r.height); img.src = datos;
    }
  }
  setTimeout(resize, 60);
  let dib = false;
  const pos = e => {
    const r = rect();
    const t = e.touches ? e.touches[0] : e;
    return [t.clientX - r.left, t.clientY - r.top];
  };
  const empezar = e => { e.preventDefault(); dib = true; const [x,y] = pos(e); ctx.beginPath(); ctx.moveTo(x,y); };
  const mover = e => { if(!dib) return; e.preventDefault(); const [x,y] = pos(e); ctx.lineTo(x,y); ctx.stroke();
    canvas.dataset.tieneTrazo = '1'; const h = canvas.parentElement.querySelector('.hint'); if(h) h.style.display='none'; };
  const soltar = () => { if(dib && onCambio) onCambio(canvas.toDataURL('image/png')); dib = false; };
  canvas.addEventListener('mousedown', empezar); canvas.addEventListener('mousemove', mover);
  window.addEventListener('mouseup', soltar);
  canvas.addEventListener('touchstart', empezar, {passive:false});
  canvas.addEventListener('touchmove', mover, {passive:false});
  canvas.addEventListener('touchend', soltar);
  return {
    limpiar(){ const r = rect(); ctx.clearRect(0,0,r.width,r.height); delete canvas.dataset.tieneTrazo;
      const h = canvas.parentElement.querySelector('.hint'); if(h) h.style.display=''; if(onCambio) onCambio(''); },
    cargar(dataUrl){ if(!dataUrl) return; const img = new Image();
      img.onload = () => { const r = rect(); ctx.drawImage(img, 0, 0, r.width, r.height);
        canvas.dataset.tieneTrazo='1'; const h = canvas.parentElement.querySelector('.hint'); if(h) h.style.display='none'; };
      img.src = dataUrl; }
  };
}

/* ------------------------------------------------------------ Permisos */
function esCoordinador(){ return SESION && SESION.rol === 'coordinador'; }
function esContable(){ return SESION && SESION.rol === 'contable'; }
/* El contable NO es personal de salud: no accede a datos clinicos (Ley 25.326) */
function verDatosClinicos(){ return !!SESION && !esContable(); }

/* En una ficha intervienen dos actos medicos que se facturan por separado:
     - la VALORACION prequirurgica, que es una consulta y corresponde a quien
       la hizo (ownerUid);
     - el ACTO ANESTESICO, que corresponde a quien opera (asignado o quien
       efectivamente lo registro).
   Pueden ser la misma persona o dos distintas. */
function actorFicha(f){
  if(!f) return '';
  if(f.actoPorUid) return f.actoPorUid;          /* quien realmente lo registro */
  if(f.actorExterno) return '';                  /* profesional ajeno a la app */
  if(f.asignadoUid && f.asignadoUid !== 'sinasignar') return f.asignadoUid;
  if(f.asignadoUid === 'sinasignar') return '';  /* todavia sin definir */
  return f.ownerUid || '';
}
function esActorFicha(f){ return !!SESION && actorFicha(f) === SESION.uid; }
function nombreActor(f){
  if(f && f.actorExterno && !f.actoPorUid) return f.actorExterno + ' (externo)';
  if(f && f.asignadoUid === 'sinasignar' && !f.actoPorUid) return 'sin asignar';
  const u = actorFicha(f);
  return u ? nombreUsuario(u) : '—';
}

/* Fichas en las que intervengo, por cualquiera de los dos conceptos.
   Son la base de las estadisticas, la facturacion y los avisos. */
function misFichas(){
  const t = lista('fichas');
  return esCoordinador() ? t
    : t.filter(f => f.ownerUid === SESION.uid || actorFicha(f) === SESION.uid);
}
/* Fichas que se pueden abrir: todas. Un colega puede necesitar completar el
   acto anestesico de una valoracion que hizo otro. */
function fichasVisibles(){ return lista('fichas'); }

/* El padron de pacientes es de la asociacion: lo ven y lo editan todos. */
function misPacientes(){ return lista('pacientes'); }

/* Permisos sobre una ficha ajena */
function esAutorFicha(f){ return !!f && !!SESION && f.ownerUid === SESION.uid; }
function puedeEditarFicha(f){ return esCoordinador() || esAutorFicha(f); }
/* Cualquier anestesiologo habilitado puede registrar el acto que realizo */
function puedeEditarActo(f){ return !!SESION; }
function autorFicha(f){
  return f && f.ownerUid ? nombreUsuario(f.ownerUid) : '—';
}

/* ---------------- Prestaciones facturables ----------------
   Cada ficha genera hasta dos renglones, con distinto titular. */
function prestacionesDeFicha(f){
  const l = [];
  const hc = f.honConsulta || {};
  if(hc.modalidad && hc.modalidad !== 'incluida')
    l.push({ ficha:f, tipo:'consulta', uid:f.ownerUid,
      concepto:'Consulta prequirúrgica (valoración)',
      monto:Number(hc.total || 0), estado:hc.estado || 'Pendiente',
      comprobante:hc.comprobante || '', cobrado:Number(hc.cobrado || 0),
      fechaPresentacion:hc.fechaPresentacion || '', fecha:f.fecha });
  const ha = f.hon || {};
  if(ha.modalidad)
    l.push({ ficha:f, tipo:'acto', uid:actorFicha(f),
      concepto:'Acto anestésico',
      monto:Number(ha.total || 0), estado:ha.estado || 'Pendiente',
      comprobante:ha.comprobante || '', cobrado:Number(ha.cobrado || 0),
      fechaPresentacion:ha.fechaPresentacion || '', fecha:f.fecha });
  return l;
}
/* Todas las prestaciones que me corresponden a mi (o todas, si coordino) */
function misPrestaciones(){
  const todas = [];
  lista('fichas').forEach(f => prestacionesDeFicha(f).forEach(p => todas.push(p)));
  return esCoordinador() ? todas : todas.filter(p => p.uid === SESION.uid);
}
/* Lo que me corresponde cobrar de una ficha concreta */
function montoQueMeCorresponde(f){
  return prestacionesDeFicha(f)
    .filter(p => esCoordinador() || p.uid === SESION.uid)
    .reduce((a,p) => a + p.monto, 0);
}
/* ================= PRESTACIONES PARA EL CONTADOR =================
   Proyeccion ANONIMIZADA de las prestaciones. El contador de la asociacion
   no es personal de salud: la Ley 25.326 no lo habilita a acceder a datos
   sensibles. Esta funcion construye registros NUEVOS con una lista blanca
   de campos economicos, de modo que ningun dato clinico pueda llegar a su
   portal aunque se agreguen campos a la ficha mas adelante.

   Deliberadamente NO viajan: paciente, DNI, cirugia, diagnostico,
   valoracion, plan, acto, eventos adversos ni consentimiento.
   De los adicionales del nomenclador se pasa SOLO el porcentaje total
   (pctAdicional): permite auditar la aritmetica de la factura sin revelar
   que el recargo vino de un ASA V, de una obesidad morbida o de la edad.
   ================================================================= */
function prestacionesContables(){
  const out = [];
  lista('fichas').forEach(f => {
    const inst = nombreInstitucion(f.institucion).split('"')[0].trim();
    const h = f.hon || {}, hc = f.honConsulta || {};
    const agregar = (tipo, uidTit, datos) => {
      const monto   = Number(datos.total || 0);
      const cobrado = Number(datos.cobrado || 0);
      out.push({
        ref: f.id + ':' + tipo,
        fecha: f.fecha || '', mes: mesDe(f.fecha || ''),
        tipo: tipo, uid: uidTit || '',
        institucionId: f.institucion || '', institucion: inst || 'Sin institución',
        financiador: f.obraSocial || 'Sin cobertura',
        modalidad: datos.modalidad || '',
        ua: Number(datos.ua || 0), valorUnidad: Number(datos.valorUnidad || 0),
        pctAdicional: Number(datos.pctAdicional || 0),
        monto: monto, cobrado: cobrado,
        saldo: Math.max(0, monto - cobrado),
        estado: datos.estado || 'Pendiente',
        comprobante: datos.comprobante || '',
        fechaPresentacion: datos.fechaPresentacion || ''
      });
    };
    if(hc.modalidad && hc.modalidad !== 'incluida' && hc.modalidad !== 'sincargo')
      agregar('consulta', f.ownerUid, hc);
    if(h.modalidad && h.modalidad !== 'sincargo' && h.modalidad !== 'salario')
      agregar('acto', actorFicha(f), h);
  });
  return out;
}

/* =========================================================================
   ENVIOS A CONTADURIA
   -------------------------------------------------------------------------
   El anestesiologo decide, acto por acto, mandarle al contador la valoracion
   preanestesica o la ficha anestesica con el parte quirurgico. Es una cesion
   deliberada y trazable: la hace el profesional tratante, bajo su firma, con
   una finalidad concreta (facturacion y auditoria medica del financiador), y
   queda asentada en la auditoria de la app con quien, que y cuando.

   Ojo con la regla general del portal contable: el tablero economico sigue
   trabajando con prestaciones anonimizadas (prestacionesContables()). Estas
   dos bandejas son la excepcion, y por eso estan separadas del tablero, con
   su propio aviso legal y su propio registro.
   ========================================================================= */
const TIPOS_ENVIO = {
  valoracion: { t:'Valoración pre-anestésica', ico:'valoracion',
                concepto:'Consulta prequirúrgica (valoración preanestésica)' },
  acto:       { t:'Ficha anestésica y parte quirúrgico', ico:'jeringa',
                concepto:'Acto anestésico' }
};

/* Las dos bandejas las ven el contador y la coordinacion. Un socio ve
   unicamente lo que el mismo envio, desde su propia ficha. */
function puedeVerEnvios(){ return esContable() || esCoordinador(); }

function enviosDe(tipo){
  return lista('envios').filter(e => e.tipo === tipo)
    .sort((a,b) => (a.enviado || '') < (b.enviado || '') ? 1 : -1);
}
/* Envios agrupados por el profesional titular del honorario */
function enviosPorProfesional(tipo){
  const g = {};
  enviosDe(tipo).forEach(e => {
    const k = e.uid || 'sin';
    if(!g[k]) g[k] = { uid:e.uid, nombre:e.profesional || nombreUsuario(e.uid),
                       matricula:e.matricula || '', envios:[] };
    g[k].envios.push(e);
  });
  return Object.values(g).sort((a,b) => (a.nombre||'').localeCompare(b.nombre||'', 'es'));
}
function enviosDeFicha(fichaId, tipo){
  return lista('envios').filter(e => e.fichaId === fichaId && (!tipo || e.tipo === tipo))
    .sort((a,b) => (a.enviado || '') < (b.enviado || '') ? 1 : -1);
}

/* Honorario discriminado del acto que se esta enviando. El contador tiene
   que poder rehacer la cuenta renglon por renglon: base, adicionales y
   total, con el titular y el estado administrativo. */
function honorarioDeEnvio(f, tipo){
  if(tipo === 'valoracion'){
    const hc = f.honConsulta || {};
    const m = MODALIDADES_CONSULTA.find(x => x.id === hc.modalidad);
    return {
      concepto: TIPOS_ENVIO.valoracion.concepto,
      modalidad: hc.modalidad || '', modalidadNombre: m ? m.n : '— sin definir —',
      factura: !!hc.modalidad && hc.modalidad !== 'incluida' && hc.modalidad !== 'sincargo',
      ua:0, valorUnidad:0, adicionales:[], pctAdicional:0, base:Number(hc.total || 0),
      total: Number(hc.total || 0), cobrado: Number(hc.cobrado || 0),
      estado: hc.estado || 'Pendiente', comprobante: hc.comprobante || '',
      fechaPresentacion: hc.fechaPresentacion || '', observaciones:''
    };
  }
  const h = f.hon || {};
  const m = MODALIDADES_HONORARIOS.find(x => x.id === h.modalidad);
  const ua = Number(h.ua || 0), vu = Number(h.valorUnidad || 0);
  const base = h.modalidad === 'abierto' ? ua * vu : Number(h.montoFijo || h.total || 0);
  const ad = (h.adicionales || []).map(id => ADICIONALES_HONORARIOS.find(x => x.id === id))
    .filter(Boolean).map(a => ({ n:a.n, pct:a.pct, monto: base * a.pct / 100 }));
  return {
    concepto: TIPOS_ENVIO.acto.concepto,
    modalidad: h.modalidad || '', modalidadNombre: m ? m.n : '— sin definir —',
    factura: !!h.modalidad && h.modalidad !== 'sincargo' && h.modalidad !== 'salario',
    ua, valorUnidad: vu, adicionales: ad, pctAdicional: Number(h.pctAdicional || 0),
    base, total: Number(h.total || 0), cobrado: Number(h.cobrado || 0),
    estado: h.estado || 'Pendiente', comprobante: h.comprobante || '',
    fechaPresentacion: h.fechaPresentacion || '', observaciones: h.observaciones || ''
  };
}

/* Titular del honorario de cada tipo de envio: la consulta es de quien hizo
   la valoracion, el acto de quien opero. */
function titularDeEnvio(f, tipo){
  return tipo === 'valoracion' ? (f.ownerUid || '') : (actorFicha(f) || f.ownerUid || '');
}

/* Adjuntos del parte quirurgico cargados en la ficha.
   Viven DENTRO de f.acto, no en la raiz: cuando un colega registra el acto de
   una ficha ajena, guardarFicha() solo escribe acto y recup sobre la version
   de la base. Si el parte colgara de la raiz, el que lo sube —que es
   justamente el que operó— lo perderia al guardar. */
function partesQuirurgicos(f){ return (f && f.acto && f.acto.parteQuirurgico) || []; }

/* ---------------- Los dos actos medicos de una ficha ----------------
   Una ficha puede contener uno de los dos, o los dos, y no siempre del mismo
   profesional. Para contar actividad —estadisticas, facturacion, envios a
   contaduria— no alcanza con contar fichas: hay que contar ACTOS.

   No se pregunta «existe f.v», porque toda ficha nace con esos objetos
   vacios. Se pregunta si hay algo cargado que solo puede venir de haber
   hecho el trabajo. */
function hayValoracion(f){
  if(!f) return false;
  const v = f.v || {}, pl = f.plan || {}, sc = v.scores || {};
  return !!(sc.asa || (v.antecedentes2 || []).length || (v.medicacion || []).length ||
            (v.riesgo || {}).aptitud || (v.riesgo || {}).fundamento ||
            (pl.tecnica || []).length || (pl.destino) ||
            (f.honConsulta || {}).modalidad);
}
function hayActo(f){
  if(!f) return false;
  const a = f.acto || {};
  return !!(a.inicioCirugia || a.inicioAnestesia || a.finCirugia ||
            (a.drogas || []).length || (a.controles || []).length ||
            (a.tecnicas || []).length || (f.hon || {}).modalidad ||
            (f.firma || {}).firmado);
}
/* Valoraciones y actos que me corresponden a MI dentro de un conjunto de
   fichas. El coordinador ve los de toda la asociacion. */
function misValoraciones(fichas){
  return (fichas || lista('fichas')).filter(f =>
    hayValoracion(f) && (esCoordinador() || (SESION && f.ownerUid === SESION.uid)));
}
function misActos(fichas){
  return (fichas || lista('fichas')).filter(f =>
    hayActo(f) && (esCoordinador() || (SESION && actorFicha(f) === SESION.uid)));
}

/* Anestesiologos habilitados, para asignar el acto */
function socios(){
  return lista('usuarios')
    .filter(u => u.rol === 'socio' && u.estado === 'aprobado')
    .sort((a,b) => (a.apellido||'').localeCompare(b.apellido||'', 'es'));
}
function usuarioPorUid(u){ return DB.usuarios[u] || null; }
function nombreUsuario(u){
  const x = usuarioPorUid(u);
  return x ? (x.apellido + ', ' + x.nombre) : '—';
}

/* =========================================================================
   MOTOR DE DOSIS - VADEMECUM ANESTESICO AFAAR
   Traduce los rangos del vademecum a numeros concretos para el peso del
   paciente. Calcula y muestra; nunca registra solo. La confirmacion del
   anestesiologo es siempre un acto explicito (regla 4 del capitulo 14).
   ========================================================================= */

/* mg y mcg tienen que distinguirse a simple vista: el mcg va con su propia
   clase para que la hoja de estilo lo pinte distinto. */
function unidadHTML(u){
  const clase = /mcg/.test(u) ? 'u-mcg' : (/^mg/.test(u) ? 'u-mg' : 'u-otra');
  return '<span class="' + clase + '">' + esc(u) + '</span>';
}

/* Formato de dosis: los decimales que hacen falta y ninguno mas.
   188 mg se escribe "188", no "188,000"; 0,625 mg se escribe entero. */
function fDosis(n){
  const v = redondearDosis(n);
  const a = Math.abs(v);
  const dec = a >= 100 ? 0 : (a >= 10 ? 1 : (a >= 1 ? 2 : 3));
  return fNum(v, dec).replace(/,(\d*?)0+$/, (m, g) => g ? ','+g : '');
}

/* Redondeo util en la jeringa: nada de 2,4999999 mg */
function redondearDosis(n){
  if(!isFinite(n)) return 0;
  const a = Math.abs(n);
  if(a >= 100) return Math.round(n);
  if(a >= 10)  return Math.round(n * 10) / 10;
  if(a >= 1)   return Math.round(n * 100) / 100;
  return Math.round(n * 1000) / 1000;
}

function farmacoPorNombre(n){
  return VADEMECUM.find(x => x.n === n) || null;
}
function grupoVademecum(k){
  return VADEMECUM_GRUPOS.find(g => g.k === k) || { k:k, t:k, ico:'lista' };
}

/* Un paciente es "pediatrico" a los efectos del vademecum por debajo de los
   16 anios. Si no hay fecha de nacimiento cargada no se adivina: se pide. */
function esPediatrico(edad){
  return edad !== null && edad !== undefined && edad !== '' && Number(edad) < 16;
}

/* Reglas de calculo aplicables a este paciente */
function reglasAplicables(farmaco, edad){
  if(!farmaco || !farmaco.calc) return [];
  const p = esPediatrico(edad);
  return farmaco.calc.filter(r => r.pob === 'ap' || r.pob === (p ? 'p' : 'a'));
}

/* Resuelve una regla para un peso dado.
   Devuelve { texto, min, max, unidad, porPeso, tope, aplicado }
   Si la regla es por peso y no hay peso, devuelve pesoFalta:true. */
function calcularDosis(regla, pesoKg){
  const peso = Number(pesoKg) || 0;
  const porPeso = /\/kg/.test(regla.u);
  if(porPeso && !peso) return { pesoFalta:true, unidad:regla.u, t:regla.t };

  /* unidad de destino: mg/kg -> mg, mcg/kg/min -> mcg/min, mg -> mg */
  const unidad = porPeso ? regla.u.replace('/kg', '') : regla.u;
  let min = porPeso ? regla.min * peso : regla.min;
  let max = porPeso ? regla.max * peso : regla.max;

  let tope = false;
  if(regla.tope){
    if(max > regla.tope){ max = regla.tope; tope = true; }
    if(min > regla.tope){ min = regla.tope; }
  }
  min = redondearDosis(min); max = redondearDosis(max);
  return {
    t: regla.t, min, max, unidad, porPeso, tope,
    rango: regla.min === regla.max ? fDosis(regla.min) : fDosis(regla.min) + '–' + fDosis(regla.max),
    rangoUnidad: regla.u,
    texto: (min === max ? fDosis(min) : fDosis(min) + '–' + fDosis(max)) + ' ' + unidad
  };
}

/* % de un anestesico local -> mg/mL. 0,5 % = 5 mg/mL */
function pctAmgml(pct){ return (Number(pct) || 0) * 10; }

/* mg administrados de un anestesico local a partir de concentracion y volumen */
function mgAnestesicoLocal(pct, mL){
  return redondearDosis(pctAmgml(pct) * (Number(mL) || 0));
}

/* Acumulado de anestesicos locales de una ficha.
   Devuelve por farmaco y el total, con el aviso de toxicidad aditiva cuando
   se mezclan dos o mas. Nunca presenta el maximo como una garantia. */
function acumuladoAnestesicosLocales(drogas, pesoKg){
  const peso = Number(pesoKg) || 0;
  const porFarmaco = {};
  (drogas || []).forEach(d => {
    const f = farmacoPorNombre(d.n);
    if(!f || !f.local) return;
    const mg = Number(d.mg || d.dosis) || 0;
    if(!mg) return;
    const e = porFarmaco[d.n] || (porFarmaco[d.n] = { n:d.n, mg:0, conAdrenalina:false, f:f });
    e.mg += mg;
    if(d.adrenalina) e.conAdrenalina = true;
  });
  const items = Object.values(porFarmaco).map(e => {
    const maxKg = e.conAdrenalina ? e.f.maxMgKgAdr : e.f.maxMgKg;
    const maxAbs = e.conAdrenalina ? e.f.maxAbsAdr : e.f.maxAbs;
    const mgKg = peso ? redondearDosis(e.mg / peso) : null;
    const refKg = maxKg ? redondearDosis(maxKg * peso) : 0;
    const ref = maxAbs && refKg ? Math.min(refKg, maxAbs) : (refKg || maxAbs || 0);
    return {
      n: e.n, mg: redondearDosis(e.mg), mgKg: mgKg, conAdrenalina: e.conAdrenalina,
      referencia: ref || 0, maxMgKg: maxKg || 0,
      pct: ref ? Math.round(e.mg / ref * 100) : null,
      sinTope: !maxKg && !maxAbs
    };
  });
  return { items, mezcla: items.length > 1, peso: peso };
}

/* Concentracion de una infusion: mg totales en el volumen final -> mcg/mL,
   y los mL/h que hacen falta para la dosis objetivo en mcg/kg/min. */
function calcularInfusion(mgTotales, mLFinal, pesoKg, objetivoMcgKgMin){
  const mg = Number(mgTotales) || 0, mL = Number(mLFinal) || 0;
  const peso = Number(pesoKg) || 0, obj = Number(objetivoMcgKgMin) || 0;
  if(!mg || !mL) return null;
  const mcgPorML = (mg * 1000) / mL;
  const r = { mcgPorML: redondearDosis(mcgPorML), mgPorML: redondearDosis(mg / mL) };
  if(peso && obj) r.mLh = redondearDosis((obj * peso * 60) / mcgPorML);
  return r;
}

/* mL a cargar en la jeringa a partir de la presentacion "10 mg/mL" */
function mLDePresentacion(pres, dosis, unidad){
  const m = String(pres || '').match(/([\d.,]+)\s*(mg|mcg|g)\s*\/\s*m[lL]/);
  if(!m) return null;
  let conc = Number(String(m[1]).replace(',', '.'));
  let u = m[2];
  if(!conc) return null;
  /* llevar todo a la unidad de la dosis */
  if(u === 'g' && unidad === 'mg') conc = conc * 1000;
  else if(u === 'mg' && unidad === 'mcg') conc = conc * 1000;
  else if(u === 'mcg' && unidad === 'mg') conc = conc / 1000;
  else if(u !== unidad) return null;
  return redondearDosis((Number(dosis) || 0) / conc);
}

/* -------------------------------------------------- Favoritos personales */
function favoritosDrogas(){
  const u = USUARIO || {};
  return (u.favoritosDrogas && u.favoritosDrogas.length) ? u.favoritosDrogas.slice() : FAVORITOS_BASE.slice();
}
function alternarFavorito(nombre){
  if(!USUARIO) return;
  const f = favoritosDrogas();
  const i = f.indexOf(nombre);
  if(i >= 0) f.splice(i, 1); else f.push(nombre);
  USUARIO.favoritosDrogas = f;
  escribir('usuarios', USUARIO.uid, USUARIO);
  return f;
}

/* =========================================================================
   BALANCE HIDRICO
   ========================================================================= */
function calcularBalance(b){
  b = b || {};
  const suma = arr => arr.reduce((a, x) => a + (Number(b[x.k]) || 0), 0);
  const ingresos = suma(BALANCE_INGRESOS);
  const egresos  = suma(BALANCE_EGRESOS);
  return { ingresos, egresos, balance: ingresos - egresos };
}

/* =========================================================================
   SIGNOS VITALES - controles seriados
   ========================================================================= */
function ultimoControl(controles){
  const c = (controles || []).slice().sort((a, b) => (a.hora || '') < (b.hora || '') ? 1 : -1);
  return c[0] || null;
}

/* Duracion en minutos entre dos horas HH:MM, cruzando la medianoche */
function minutosEntre(desde, hasta){
  if(!desde || !hasta) return null;
  const [h1, m1] = desde.split(':').map(Number);
  const [h2, m2] = hasta.split(':').map(Number);
  let min = (h2 * 60 + m2) - (h1 * 60 + m1);
  if(min < 0) min += 1440;
  return min;
}
function duracionTexto(min){
  if(min === null || min === undefined) return '—';
  return Math.floor(min / 60) + ' h ' + (min % 60) + ' min';
}
