/* =========================================================================
   SIGNOS VITALES DIBUJADOS A MANO
   -------------------------------------------------------------------------
   Pedido de los anestesiologos al ver el Modo Camilla: dejar todo como esta,
   pero que la curva de TAS, TAD, FC, SpO2 y EtCO2 se pueda TRAZAR con el
   dedo, el lapiz o el mouse, como en la hoja de papel. La ventaja es la de
   siempre: no estar pendiente cada diez minutos y volcar la curva cuando
   haya un momento, incluso al terminar.

   Como funciona, en tres toques:
     1. se elige el parametro (un boton grande por cada uno);
     2. se dibuja de izquierda a derecha sobre la grilla horaria del acto;
     3. se guarda: la app LEE la curva cada 5, 10 o 15 minutos y carga esos
        numeros como controles comunes.

   Reglas que no conviene cambiar:
     - Lo que se cargo a mano (tipeado o con el control normal) NO se pisa.
       Se ve en la grilla como simbolo y el trazo lo respeta.
     - Cada valor leido de la curva queda marcado (`trazo:['tas',...]` en el
       control) y sale como TRAZO en la tabla y en el documento: una historia
       clinica tiene que distinguir lo medido de lo dibujado.
     - Lo ya trazado se puede corregir despues: al reabrir, las curvas
       vuelven y se puede pasar por encima o borrar un parametro.
   ========================================================================= */

const TRAZO_PARAMS = [
  { k:'tas',   t:'TAS',   sim:'v', color:'#dc2626', min:20, max:220, nl:90, nh:140 },
  { k:'tad',   t:'TAD',   sim:'^', color:'#ea580c', min:20, max:220, nl:50, nh:90 },
  { k:'fc',    t:'FC',    sim:'•', color:'#2563eb', min:20, max:220, nl:50, nh:100 },
  { k:'spo2',  t:'SpO₂',  sim:'○', color:'#0e8f95', min:80, max:100, nl:94, nh:100 },
  { k:'etco2', t:'EtCO₂', sim:'◇', color:'#7c3aed', min:10, max:60,  nl:30, nh:45 }
];
const TRAZO_PASOS = [5, 10, 15];
const TZM = { L:44, R:14, T:14, B:26 };      /* margenes del lienzo, en px */
let TZS = null;                               /* estado de la ventana abierta */

function tzMin(h){
  const m = String(h || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
function tzHora(abs){
  const m = ((Math.round(abs) % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
/* Minuto "absoluto" de una hora dentro del rango: si el acto cruza la
   medianoche, las horas de la madrugada van despues de las de la noche. */
function tzAbsEn(h){
  let m = tzMin(h);
  if(m === null) return null;
  if(m < TZS.desde && m + 1440 <= TZS.hasta) m += 1440;
  return m;
}
function tzParam(k){ return TRAZO_PARAMS.find(p => p.k === k); }
function tzPrimero(){ for(let i = 0; i < arguments.length; i++) if(arguments[i] !== null) return arguments[i]; return null; }

function tzX(abs){ return TZM.L + (abs - TZS.desde) * (TZS.W - TZM.L - TZM.R) / (TZS.hasta - TZS.desde); }
function tzAbsDeX(x){ return TZS.desde + (x - TZM.L) * (TZS.hasta - TZS.desde) / (TZS.W - TZM.L - TZM.R); }
function tzY(p, v){ return TZM.T + (1 - (v - p.min) / (p.max - p.min)) * (TZS.H - TZM.T - TZM.B); }
function tzVDeY(p, y){ return p.min + (1 - (y - TZM.T) / (TZS.H - TZM.T - TZM.B)) * (p.max - p.min); }

/* Las horas en que se lee la curva, alineadas al reloj (10:00, 10:10...) */
function tzMuestras(){
  const out = [], s = TZS.paso;
  const tope = tzTope();
  for(let m = Math.ceil(TZS.desde / s) * s; m <= Math.min(TZS.hasta, tope); m += s) out.push(m);
  return out;
}
/* Minuto absoluto de la hora actual dentro del rango, o el fin del rango si
   el acto ya tiene fin cargado. */
function tzTope(){
  if(!TZS || !TZS.sinFin) return TZS ? TZS.hasta : 0;
  let m = tzMin(ahoraHora());
  if(m < TZS.desde && m + 1440 <= TZS.hasta) m += 1440;
  return m;
}
function tzValorEn(k, m){
  const v = TZS.pts[k][m];
  return (v === undefined || v === null) ? null : v;
}
/* Lo DIBUJADO en esta pasada para la hora m. Un trazo corto que no cruza
   justo la marca (10:10) igual cuenta si pasó a menos de medio paso. */
function tzLeido(k, m){
  const toc = TZS.toc[k];
  if(toc[m]) return tzValorEn(k, m);
  for(let d = 1; d <= Math.floor(TZS.paso / 2); d++){
    if(toc[m - d]) return tzValorEn(k, m - d);
    if(toc[m + d]) return tzValorEn(k, m + d);
  }
  return null;
}

/* opc.en: selector de un contenedor para dibujar AHÍ MISMO (el gráfico del
   Modo Camilla) en vez de abrir una ventana. */
function abrirTrazoVitales(opc){
  const f = fichaActual;
  if(!f) return;
  const g = DB.fichas[f.id] || f;
  if((g.firma || {}).firmado || !puedeEditarSeccion(g, 'acto'))
    return toast('Este acto no se puede editar.', 'warn');

  fichaActual.acto = leerPasoAnestesia();
  const a = fichaActual.acto;
  const ctrls = (a.controles || []).slice().sort((x, y) => (x.hora || '') < (y.hora || '') ? -1 : 1);
  const ahora = tzMin(ahoraHora());

  /* El rango sale del propio acto; si todavia no esta cargado, las ultimas
     dos horas. Se puede cambiar arriba de la grilla. */
  let desde = tzPrimero(tzMin(a.inicioAnestesia), tzMin(a.ingreso),
                        ctrls.length ? tzMin(ctrls[0].hora) : null);
  if(desde === null) desde = Math.max(0, Math.floor((ahora - 120) / 5) * 5);
  let hasta = tzPrimero(tzMin(a.finAnestesia), tzMin(a.finCirugia), tzMin(a.salida));
  if(hasta === null){
    const ult = ctrls.length ? tzMin(ctrls[ctrls.length - 1].hora) : null;
    hasta = Math.max(ahora, ult === null ? 0 : ult);
    if(hasta <= desde && desde - hasta < 720) hasta = desde + 120;
  }
  if(hasta <= desde) hasta += 1440;
  if(hasta - desde < 30) hasta = desde + 30;
  if(hasta - desde > 1440) hasta = desde + 1440;

  /* Mientras el acto sigue abierto no se puede guardar nada del futuro: la
     grilla se ve entera, pero la lectura corta en la hora actual. */
  const sinFin = tzPrimero(tzMin(a.finAnestesia), tzMin(a.finCirugia), tzMin(a.salida)) === null;
  /* En el Modo Camilla, con el acto en curso, la grilla termina AHORA: todo
     el ancho es dibujable y sigue desde lo que se registró con «Registrar».
     (Antes arrancaba en el inicio y se estiraba dos horas al futuro: casi
     todo lo dibujado caía en «todavía no» y no se guardaba.) */
  if(opc && opc.en && sinFin){
    const ult = ctrls.length ? tzMin(ctrls[ctrls.length - 1].hora) : null;
    hasta = Math.ceil((Math.max(ahora, ult === null ? 0 : ult) + 1) / 5) * 5;
    desde = Math.floor(tzPrimero(tzMin(a.ingreso), tzMin(a.inicioAnestesia),
                                 ctrls.length ? tzMin(ctrls[0].hora) : null, hasta - 60) / 5) * 5;
    if(desde > hasta) desde -= 1440;
    if(desde < 0){ desde += 1440; hasta += 1440; }
    if(hasta - desde < 30) desde = hasta - 30;
    if(hasta - desde > 720) desde = hasta - 720;
  }
  TZS = { desde, hasta, paso:10, sinFin, activo:'tas', pts:{}, toc:{}, borrado:{}, undo:[],
          dibujando:false, ultimo:null, ctrls, W:600, H:300, dpr:1, raf:0, cv:null };
  TRAZO_PARAMS.forEach(p => { TZS.pts[p.k] = {}; TZS.toc[p.k] = {}; });
  /* Lo que ya se habia trazado vuelve, para poder corregirlo */
  ctrls.forEach(c => (c.trazo || []).forEach(k => {
    const m = tzAbsEn(c.hora), v = Number(c[k]);
    if(m !== null && TZS.pts[k] && isFinite(v) && v) TZS.pts[k][m] = v;
  }));

  const enLinea = opc && opc.en ? $(opc.en) : null;
  const cuerpoTz =
    '<div class="tz-barra">'+
      '<div class="tz-rango">'+
        '<label>Desde <input type="time" id="tzDesde" value="'+tzHora(desde)+'"></label>'+
        '<label>Hasta <input type="time" id="tzHasta" value="'+tzHora(hasta)+'"></label>'+
      '</div>'+
      '<div class="seg chico tz-paso" id="tzPaso">'+ TRAZO_PASOS.map(s =>
        '<button type="button" data-v="'+s+'"'+(s === TZS.paso ? ' class="on"' : '')+'>cada '+s+' min</button>')
        .join('') +'</div>'+
    '</div>'+
    '<div class="tz-params" id="tzParams">'+ TRAZO_PARAMS.map(p =>
      '<button type="button" data-k="'+p.k+'" style="--c:'+p.color+'"'+(p.k === TZS.activo ? ' class="on"' : '')+'>'+
        '<span class="sim">'+p.sim+'</span>'+p.t+'</button>').join('') +'</div>'+
    '<div class="tz-lienzo" id="tzLienzo"><canvas id="tzCanvas"></canvas></div>'+
    '<div class="tz-pie"><span class="mini" id="tzInfo"></span>'+
      '<span class="tz-acc">'+
        '<button type="button" class="btn ghost chico" id="tzDeshacer">'+ico('atras')+' Deshacer</button>'+
        '<button type="button" class="btn ghost chico" id="tzBorrar">'+ico('borrar')+' Borrar <span id="tzBorrarN">TAS</span></button>'+
      '</span></div>'+
    '<div class="ayuda">Elegí el parámetro y dibujá su curva de izquierda a derecha. Para corregir, '+
      'volvé a pasar por encima. Los puntos son los valores que se guardan. Lo cargado a mano se ve '+
      'como símbolo y <b>no se pisa</b>.</div>';

  if(enLinea){
    TZS.inline = true;
    enLinea.classList.add('tz-en-linea');
    /* Mientras se traza no se muestra el bloque de «Registrar»: una cosa por
       vez. Vuelve solo al guardar o cancelar, porque se repinta la pantalla. */
    const cam = enLinea.closest('.camilla');
    if(cam) cam.classList.add('trazando');
    enLinea.innerHTML = cuerpoTz +
      '<div class="btn-row tz-botones">'+
        '<button type="button" class="btn ghost" id="tzCancelar">Cancelar</button>'+
        '<button type="button" class="btn pri" id="tzGuardar">'+ico('check')+' Guardar las curvas</button>'+
      '</div>';
    $('#tzCancelar').onclick = () => { TZS = null; pintarPasoAnestesia(fichaActual); };
  } else {
    abrirModal('Dibujar las curvas de signos vitales', cuerpoTz,
      '<button class="btn ghost" data-cerrar>Cancelar</button>'+
      '<button class="btn pri" id="tzGuardar">'+ico('check')+' Guardar las curvas</button>', '980px');
    /* Un clic que se escapa del lienzo mientras se dibuja no tiene que cerrar
       la ventana: el fondo deja de cerrar. Cancelar y la cruz siguen andando. */
    $('#modal').onclick = e => { if(e.target.closest('[data-cerrar]')) cerrarModalPorUsuario(); };
  }

  const cv = $('#tzCanvas'), caja = $('#tzLienzo');
  TZS.cv = cv;
  const medir = () => {
    if(!TZS || !document.body.contains(cv)) return;
    const w = Math.max(280, caja.clientWidth);
    const h = Math.max(230, Math.min(430, Math.round(w * 0.48)));
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    TZS.W = w; TZS.H = h; TZS.dpr = dpr;
    dibujarTrazo();
  };
  const alRedimensionar = () => {
    if(!TZS || !document.body.contains(cv)) return window.removeEventListener('resize', alRedimensionar);
    medir();
  };
  window.addEventListener('resize', alRedimensionar);
  medir();

  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    const k = TZS.activo;
    TZS.undo.push({ k, pts: Object.assign({}, TZS.pts[k]), toc: Object.assign({}, TZS.toc[k]),
                    borrado: !!TZS.borrado[k] });
    if(TZS.undo.length > 50) TZS.undo.shift();
    TZS.dibujando = true; TZS.ultimo = null;
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    tzPunto(e);
  });
  cv.addEventListener('pointermove', e => {
    if(!TZS || !TZS.dibujando) return;
    e.preventDefault();
    const l = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    (l.length ? l : [e]).forEach(tzPunto);
  });
  const soltar = () => { if(!TZS) return; TZS.dibujando = false; TZS.ultimo = null; tzInfo(); };
  cv.addEventListener('pointerup', soltar);
  cv.addEventListener('pointercancel', soltar);

  $$('#tzParams button').forEach(b => b.onclick = () => {
    TZS.activo = b.dataset.k;
    $$('#tzParams button').forEach(x => x.classList.toggle('on', x === b));
    $('#tzBorrarN').textContent = tzParam(TZS.activo).t;
    dibujarTrazo(); tzInfo();
  });
  $$('#tzPaso button').forEach(b => b.onclick = () => {
    TZS.paso = Number(b.dataset.v);
    $$('#tzPaso button').forEach(x => x.classList.toggle('on', x === b));
    dibujarTrazo(); tzInfo();
  });
  const cambiarRango = () => {
    const d = tzMin($('#tzDesde').value), h = tzMin($('#tzHasta').value);
    if(d === null || h === null) return;
    let hh = h <= d ? h + 1440 : h;
    if(hh - d < 30) hh = d + 30;
    TZS.desde = d; TZS.hasta = hh;
    dibujarTrazo(); tzInfo();
  };
  $('#tzDesde').onchange = cambiarRango;
  $('#tzHasta').onchange = cambiarRango;
  $('#tzDeshacer').onclick = () => {
    const u = TZS.undo.pop();
    if(!u) return toast('No hay nada para deshacer.', 'warn');
    TZS.pts[u.k] = u.pts; TZS.toc[u.k] = u.toc; TZS.borrado[u.k] = u.borrado;
    dibujarTrazo(); tzInfo();
  };
  $('#tzBorrar').onclick = () => {
    const k = TZS.activo;
    TZS.undo.push({ k, pts: TZS.pts[k], toc: TZS.toc[k], borrado: !!TZS.borrado[k] });
    TZS.pts[k] = {}; TZS.toc[k] = {}; TZS.borrado[k] = true;
    dibujarTrazo(); tzInfo();
  };
  $('#tzGuardar').onclick = tzGuardar;
  tzInfo();
}

/* Un punto del trazo. Entre el punto anterior y este se completan todos los
   minutos intermedios: un movimiento rapido no deja huecos, y volver a pasar
   por encima reemplaza lo que habia. */
function tzPunto(e){
  if(!TZS || !TZS.cv) return;
  const r = TZS.cv.getBoundingClientRect();
  const p = tzParam(TZS.activo);
  const m = Math.max(TZS.desde, Math.min(TZS.hasta, tzAbsDeX(e.clientX - r.left)));
  const v = Math.max(p.min, Math.min(p.max, tzVDeY(p, e.clientY - r.top)));
  const pts = TZS.pts[p.k], toc = TZS.toc[p.k];
  const u = TZS.ultimo;
  if(u){
    const a = Math.round(u.m), b = Math.round(m), dir = a <= b ? 1 : -1;
    for(let i = a; dir > 0 ? i <= b : i >= b; i += dir){
      const t = b === a ? 1 : (i - a) / (b - a);
      pts[i] = u.v + (v - u.v) * t; toc[i] = true;
    }
  } else {
    const i = Math.round(m);
    pts[i] = v; toc[i] = true;
  }
  TZS.ultimo = { m, v };
  if(!TZS.raf) TZS.raf = requestAnimationFrame(() => { if(TZS){ TZS.raf = 0; dibujarTrazo(); } });
}

function dibujarTrazo(){
  if(!TZS || !TZS.cv) return;
  const g = TZS.cv.getContext('2d');
  /* Los colores del lugar donde se dibuja: claro en la ventana, oscuro en el Modo Camilla */
  const cs = getComputedStyle(TZS.cv);
  const cTxt = cs.getPropertyValue('--texto-2').trim() || '#4a6076';
  const cFuerte = cs.getPropertyValue('--texto').trim() || '#0f2033';
  const cBorde = cs.getPropertyValue('--borde').trim() || '#dbe4ee';
  const cFondo = cs.getPropertyValue('--panel').trim() || '#ffffff';
  const W = TZS.W, H = TZS.H, x0 = TZM.L, x1 = W - TZM.R, y0 = TZM.T, y1 = H - TZM.B;
  const act = tzParam(TZS.activo);
  const fuente = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif';

  g.setTransform(TZS.dpr, 0, 0, TZS.dpr, 0, 0);
  g.fillStyle = cFondo; g.fillRect(0, 0, W, H);

  /* banda normal del parametro elegido */
  g.fillStyle = act.color; g.globalAlpha = .08;
  g.fillRect(x0, tzY(act, act.nh), x1 - x0, tzY(act, act.nl) - tzY(act, act.nh));
  g.globalAlpha = 1;

  /* escala horizontal del parametro elegido */
  const rango = act.max - act.min;
  const dy = rango > 100 ? 20 : (rango > 30 ? 10 : 5);
  g.font = '11px ' + fuente; g.textAlign = 'right'; g.textBaseline = 'middle'; g.lineWidth = 1;
  for(let v = Math.ceil(act.min / dy) * dy; v <= act.max; v += dy){
    const y = Math.round(tzY(act, v)) + .5;
    g.strokeStyle = cBorde; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    g.fillStyle = cTxt; g.fillText(String(v), x0 - 6, y);
  }

  /* grilla de tiempo: una linea por lectura, la hora cada 15/30/60 min */
  const pxMin = (x1 - x0) / (TZS.hasta - TZS.desde);
  g.globalAlpha = .5;
  tzMuestras().forEach(m => {
    const x = Math.round(tzX(m)) + .5;
    g.strokeStyle = cBorde; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke();
  });
  g.globalAlpha = 1;
  const cada = [15, 30, 60, 120].find(c => c * pxMin >= 52) || 240;
  g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = cTxt;
  for(let m = Math.ceil(TZS.desde / cada) * cada; m <= TZS.hasta; m += cada){
    const x = Math.round(tzX(m)) + .5;
    g.strokeStyle = cBorde; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke();
    g.fillText(tzHora(m), x, y1 + 6);
  }
  g.strokeStyle = cBorde; g.strokeRect(x0 + .5, y0 + .5, x1 - x0, y1 - y0);
  /* lo que todavía no pasó, sombreado */
  const tope = tzTope();
  if(tope < TZS.hasta){
    const xt = Math.max(x0, tzX(tope));
    g.fillStyle = cTxt; g.globalAlpha = .1; g.fillRect(xt, y0, x1 - xt, y1 - y0); g.globalAlpha = 1;
    g.font = '11px ' + fuente; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = cTxt;
    if(x1 - xt > 60) g.fillText('todavía no', (xt + x1) / 2, y0 + 12);
  }

  /* curvas: las otras tenues, la elegida arriba de todo */
  TRAZO_PARAMS.forEach(p => { if(p.k !== act.k) tzCurva(g, p, false); });
  tzCurva(g, act, true);

  /* lo cargado a mano, con el simbolo de la hoja de papel */
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 15px ' + fuente;
  TZS.ctrls.forEach(c => TRAZO_PARAMS.forEach(p => {
    if((c.trazo || []).indexOf(p.k) >= 0) return;
    const v = Number(c[p.k]);
    const m = tzAbsEn(c.hora);
    if(!v || m === null || m < TZS.desde || m > TZS.hasta) return;
    g.globalAlpha = p.k === act.k ? 1 : .4;
    g.fillStyle = p.color;
    g.fillText(p.sim, tzX(m), tzY(p, Math.max(p.min, Math.min(p.max, v))));
  }));
  g.globalAlpha = 1;

  /* los valores que se van a guardar del parametro elegido */
  const esp = TZS.paso * pxMin;
  g.font = '650 10.5px ' + fuente; g.textBaseline = 'bottom';
  tzMuestras().forEach(m => {
    const v = tzLeido(act.k, m) !== null ? tzLeido(act.k, m) : tzValorEn(act.k, m);
    if(v === null) return;
    const x = tzX(m), y = tzY(act, v);
    g.fillStyle = act.color; g.beginPath(); g.arc(x, y, 3.8, 0, Math.PI * 2); g.fill();
    if(esp >= 24){ g.fillStyle = cFuerte; g.fillText(String(Math.round(v)), x, y - 6); }
  });
}

function tzCurva(g, p, activo){
  /* La curva pasa también por lo registrado con «Registrar» o tipeado: el
     trazo es la continuación de esos puntos, no una línea aparte. */
  const val = {};
  TZS.ctrls.forEach(c => {
    if((c.trazo || []).indexOf(p.k) >= 0) return;
    const v = Number(c[p.k]), m = tzAbsEn(c.hora);
    if(v && m !== null) val[m] = Math.max(p.min, Math.min(p.max, v));
  });
  Object.keys(TZS.pts[p.k]).forEach(m => { if(!(m in val)) val[m] = TZS.pts[p.k][m]; });
  const ks = Object.keys(val).map(Number)
    .filter(m => m >= TZS.desde && m <= TZS.hasta).sort((a, b) => a - b);
  if(!ks.length) return;
  g.strokeStyle = p.color; g.lineWidth = activo ? 3 : 2; g.globalAlpha = activo ? 1 : .32;
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.setLineDash(p.k === 'tad' ? [8, 5] : []);
  g.beginPath();
  ks.forEach((m, i) => {
    const x = tzX(m), y = tzY(p, val[m]);
    if(i === 0 || m - ks[i - 1] > 20) g.moveTo(x, y); else g.lineTo(x, y);
  });
  g.stroke();
  g.setLineDash([]); g.globalAlpha = 1;
}

function tzInfo(){
  const e = $('#tzInfo');
  if(!e || !TZS) return;
  const ms = tzMuestras();
  const l = TRAZO_PARAMS.map(p => {
    const n = ms.filter(m => tzLeido(p.k, m) !== null).length;
    return n ? p.t + ' ' + n : '';
  }).filter(Boolean);
  e.textContent = l.length ? 'Se van a guardar: ' + l.join(' · ') + ' valores'
                           : 'Todavía no dibujaste nada.';
}

function tzGuardar(){
  if(!TZS) return;
  const ms = tzMuestras();
  const hayTrazo = TRAZO_PARAMS.some(p => ms.some(m => tzLeido(p.k, m) !== null));
  const hayBorrado = TRAZO_PARAMS.some(p => TZS.borrado[p.k]);
  if(!hayTrazo && !hayBorrado){
    const alFuturo = TRAZO_PARAMS.some(p => Object.keys(TZS.toc[p.k]).length);
    return toast(alFuturo
      ? 'Lo dibujado quedó después de las ' + tzHora(tzTope()) + ' (la zona «todavía no»): eso no se guarda.'
      : 'Todavía no dibujaste ninguna curva.', 'warn');
  }

  fichaActual.acto = leerPasoAnestesia();
  const ctrls = (fichaActual.acto.controles || []).map(c => Object.assign({}, c));
  let respetados = 0;
  const vacio = () => ({ tas:'', tad:'', fc:'', fr:'', spo2:'', etco2:'', temp:'',
                         tof:'', tofC:'', tofR:'', obs:'' });

  /* 1. Lo trazado antes: se conserva, se corrige o, si se borro, se quita */
  ctrls.forEach(c => {
    if(!(c.trazo || []).length) return;
    const m = tzAbsEn(c.hora);
    if(m === null) return;
    c.trazo = c.trazo.filter(k => {
      if(!TZS.pts[k]) return true;
      if(tzValorEn(k, m) === null){ c[k] = ''; return false; }
      return true;
    });
  });

  /* 2. Lo dibujado ahora, leido en cada hora de la grilla */
  ms.forEach(m => {
    const hora = tzHora(m);
    TRAZO_PARAMS.forEach(p => {
      const v = tzLeido(p.k, m);
      if(v === null) return;
      let c = ctrls.find(x => x.hora === hora);
      if(!c){ c = Object.assign({ id: uid('ctl'), hora, origen:'trazo', trazo:[] }, vacio()); ctrls.push(c); }
      c.trazo = c.trazo || [];
      const cargado = c[p.k] !== '' && c[p.k] !== undefined && c[p.k] !== null;
      if(cargado && c.trazo.indexOf(p.k) < 0){ respetados++; return; }   /* lo tipeado manda */
      c[p.k] = String(Math.round(v));
      if(c.trazo.indexOf(p.k) < 0) c.trazo.push(p.k);
    });
  });

  /* 3. Controles nacidos del trazo que quedaron vacios, afuera */
  const campos = ['tas','tad','fc','fr','spo2','etco2','temp','tof','tofC','tofR','obs'];
  fichaActual.acto.controles = ctrls.filter(c => {
    if(c.trazo && !c.trazo.length) delete c.trazo;
    if(c.origen !== 'trazo') return true;
    return campos.some(k => c[k] !== '' && c[k] !== undefined && c[k] !== null);
  }).sort((a, b) => (a.hora || '') < (b.hora || '') ? -1 : 1);

  const n = fichaActual.acto.controles.filter(c => (c.trazo || []).length).length;
  const enLinea = TZS.inline;
  TZS = null;
  if(!enLinea) cerrarModal();
  pintarPasoAnestesia(fichaActual);
  autoguardarActo(true);
  toast('Curvas guardadas: ' + n + ' control' + (n === 1 ? '' : 'es') + ' con valores del trazo.' +
    (respetados ? ' Se respetaron ' + respetados + ' valores cargados a mano.' : ''), 'ok');
}
