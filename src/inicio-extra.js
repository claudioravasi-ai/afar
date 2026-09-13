/* =========================================================================
   INICIO: AVISOS EN UN RENGLÓN, ANESTESIAS DE LA SEMANA, INCOMPLETAS,
   INSTITUCIONES, WHATSAPP, SPOTIFY, RESUMEN AL SALIR Y AVISO DE 24 H
   -------------------------------------------------------------------------
   Pedidos de Claudio del 13-09-2026 para sacar ruido de la pantalla de
   inicio y dejar a la vista lo que importa.
   ========================================================================= */

/* ============================ AVISOS ============================
   Un solo renglón. El color dice cuánto hace que el aviso está esperando:
   verde hoy, amarillo más de 24 h, naranja más de 48 h y rojo más de 72 h.
   Si conviven avisos de distintas edades, el renglón va pasando por sus
   colores, del más nuevo al más viejo, mientras se mira la pantalla. */
const TONOS_AVISO = ['verde','amarillo','naranja','rojo'];

function desdeDeAviso(a){
  if(a.desde) return a.desde;
  const f = a.fichaId ? DB.fichas[a.fichaId] : null;
  if(f){
    if(a.solapa === 'hon' && f.honDiferido && f.honDiferido.desde) return f.honDiferido.desde;
    return f.modificado || f.creado || fechaDeFicha(f) || '';
  }
  return '';
}
function horasDeAviso(a){
  const d = new Date(desdeDeAviso(a));
  return isNaN(d) ? 0 : Math.max(0, (Date.now() - d.getTime()) / 3600000);
}
function tonoAviso(h){ return h >= 72 ? 'rojo' : h >= 48 ? 'naranja' : h >= 24 ? 'amarillo' : 'verde'; }

function htmlRenglonAvisos(){
  const av = calcularAvisos();
  if(!av.length) return '';
  const tonos = TONOS_AVISO.filter(t => av.some(a => tonoAviso(horasDeAviso(a)) === t));
  const viejo = Math.max.apply(null, av.map(horasDeAviso));
  const dias = Math.floor(viejo / 24);
  const cuanto = dias >= 1 ? 'el más antiguo espera hace ' + dias + ' día' + (dias === 1 ? '' : 's')
                           : 'todos de hoy';
  return '<button type="button" class="renglon-aviso tono-'+tonos[tonos.length - 1]+'" id="pnAvisos" '+
    'data-tonos="'+tonos.join(',')+'">'+ico('campana')+
    '<span class="tx"><b>'+av.length+' aviso'+(av.length === 1 ? '' : 's')+'</b> · '+esc(cuanto)+'</span>'+
    '<span class="ir">›</span></button>';
}
function cablearRenglonAvisos(){
  clearInterval(window.__tonoAvisos);
  const b = $('#pnAvisos');
  if(!b) return;
  b.onclick = abrirAvisos;
  const tonos = (b.dataset.tonos || '').split(',').filter(Boolean);
  if(tonos.length < 2) return;
  let i = tonos.length - 1;
  window.__tonoAvisos = setInterval(() => {
    if(!document.body.contains(b)) return clearInterval(window.__tonoAvisos);
    i = (i + 1) % tonos.length;
    TONOS_AVISO.forEach(t => b.classList.remove('tono-' + t));
    b.classList.add('tono-' + tonos[i]);
  }, 2600);
}

/* Avisos que se suman a los de siempre (ver el gancho al final de
   calcularAvisos en ui-avisos.js). */
const LS_BAJAS_HECHAS = 'afar_bajas_hechas_v1';
function bajasHechas(){
  try{ return JSON.parse(localStorage.getItem(LS_BAJAS_HECHAS) || '[]'); }catch(e){ return []; }
}
function anotarBajaHecha(texto){
  const l = bajasHechas().concat([{ texto, cuando:new Date().toISOString(), uid: SESION ? SESION.uid : '' }]);
  try{ localStorage.setItem(LS_BAJAS_HECHAS, JSON.stringify(l.slice(-20))); }catch(e){}
}
function avisosExtra(av, fichas){
  if(!SESION || !verDatosClinicos() || esInvitado()) return;
  /* Fichas mías sin institución: sin ella no se factura ni se informa */
  (fichas || misFichas()).filter(f => esAutorFicha(f) && !(f.firma || {}).firmado && !f.institucion &&
      (hayValoracion(f) || actoRegistrado(f)))
    .slice(0, 10).forEach(f => {
      const p = DB.pacientes[f.pacienteId] || {};
      av.push({ nivel:'warn', icono:'hospital', orden:20,
        titulo:'Falta la institución — ' + (p.apellido || '—') + ', ' + (p.nombre || ''),
        detalle:'Sin la institución la ficha no se puede facturar ni informar.',
        fichaId:f.id, solapa:'paciente' });
    });
  /* Fichas incompletas que se eliminaron: la marca queda hasta abrir los avisos */
  bajasHechas().filter(b => b.uid === SESION.uid && !b.leida).forEach(b => {
    av.push({ nivel:'info', icono:'borrar', orden:2, desde:b.cuando,
      titulo:'Se eliminó una ficha incompleta', detalle:b.texto });
  });
}
/* Abrir los avisos: se dan por leídas las bajas y se apaga la voz del relax */
function marcarAvisosLeidos(){
  const l = bajasHechas().map(b => (SESION && b.uid === SESION.uid) ? Object.assign(b, { leida:true }) : b);
  try{ localStorage.setItem(LS_BAJAS_HECHAS, JSON.stringify(l)); }catch(e){}
  const r = relaxActual();
  if(r){ r.avisosVistos = new Date().toISOString(); guardarRelax(r); }
}

/* ======================= ANESTESIAS DE LA SEMANA ======================= */
function actosDeLaSemana(){
  const s = semanaISO(hoyISO());
  return misActos(misFichas()).filter(f => { const cx = fechaCirugiaDe(f); return cx && semanaISO(cx) === s; });
}
function htmlRenglonAnestesias(){
  const n = actosDeLaSemana().length;
  return '<button type="button" class="renglon-anest" id="pnAnest">'+ico('jeringa')+
    '<span class="tx"><b>ANESTESIAS</b> · llevás realizadas <b>'+n+'</b> anestesia'+(n === 1 ? '' : 's')+
    ' esta semana</span><span class="ir">›</span></button>';
}
function etiquetaCierre(f){
  if(!(f.firma || {}).firmado) return '<span class="tag warn">Incompleta</span>';
  if(esActorFicha(f) && !(f.hon || {}).modalidad) return '<span class="tag danger">Honorarios pendientes</span>';
  return '<span class="tag ok">Finalizada</span>';
}
function abrirAnestesiasSemana(){
  const l = actosDeLaSemana().slice().sort((a, b) => {
    const pa = DB.pacientes[a.pacienteId] || {}, pb = DB.pacientes[b.pacienteId] || {};
    return ((pa.apellido || '') + (pa.nombre || '')).localeCompare((pb.apellido || '') + (pb.nombre || ''), 'es');
  });
  abrirModal('Anestesias de esta semana',
    (l.length
      ? '<div class="lista chica">'+ l.map(f => { const p = DB.pacientes[f.pacienteId] || {};
          return '<div class="item plano" data-anf="'+esc(f.id)+'"><div class="txt"><b>'+
            esc((p.apellido || '—')+', '+(p.nombre || ''))+'</b><span>'+
            esc(textoProcedimientos(f) || f.cirugia || 'sin cirugía')+' · '+esc(fFecha(fechaCirugiaDe(f)))+'</span></div>'+
            '<div class="der">'+etiquetaCierre(f)+'</div></div>'; }).join('') +'</div>'
      : '<div class="vacio chico">'+ico('jeringa')+'<b>Todavía no hay anestesias esta semana</b></div>'),
    '', '640px');
  $$('#modal [data-anf]').forEach(it => it.onclick = () => { cerrarModal(); abrirFicha(it.dataset.anf); });
}

/* ============================= INCOMPLETAS =============================
   «Borradores» no decía nada. Una ficha INCOMPLETA es la que quedó a medio
   cargar: la valoración empezada y sin cerrar, o el acto empezado y sin
   finalizar. Una valoración concluida que espera la cirugía no está
   incompleta: está lista. */
function fichaIncompleta(f){
  if(!f || (f.firma || {}).firmado || f.estado === 'cerrada') return false;
  if(actoRegistrado(f) || hayActo(f)) return true;
  if(hayValoracion(f)) return !(valoracionConcluida(f) && f.valoracionGuardada);
  return true;
}
function misIncompletas(){
  if(!SESION) return [];
  return misFichas().filter(f => fichaIncompleta(f) && (esAutorFicha(f) || esActorFicha(f)))
    .sort((a, b) => String(b.modificado || '').localeCompare(String(a.modificado || '')));
}
function queFaltaTexto(f){
  const l = pasosPreviosPendientes(f).map(t => t.t);
  return l.length ? 'Falta: ' + l.join(', ') : 'Falta finalizar y firmar';
}
function abrirIncompletas(){
  const l = misIncompletas();
  abrirModal('Fichas incompletas',
    '<p class="mini" style="margin:0 0 10px">Quedaron a medio cargar. Abrilas para completarlas o, si '+
      'ya no sirven, eliminalas: se borra la ficha, no el paciente.</p>'+
    (l.length
      ? '<div class="lista chica">'+ l.map(f => { const p = DB.pacientes[f.pacienteId] || {};
          const b = bajaProgramada(f);
          return '<div class="item plano"><div class="txt" data-inf="'+esc(f.id)+'" style="cursor:pointer"><b>'+
            esc((p.apellido || '—')+', '+(p.nombre || ''))+'</b><span>'+
            esc(textoProcedimientos(f) || f.cirugia || 'sin cirugía')+' · '+esc(fFecha(fechaDeFicha(f)))+'</span>'+
            '<span class="quien">'+esc(queFaltaTexto(f))+'</span></div><div class="der">'+
            (b ? '<span class="tag danger">Se borra en '+esc(textoCuentaBaja(minutosParaLaBaja(b)))+'</span>'
               : (alcanceDeBaja(f) ? '<button type="button" class="btn danger chico" data-inb="'+esc(f.id)+'">'+
                   ico('borrar')+'</button>' : ''))+
            '</div></div>'; }).join('') +'</div>'
      : '<div class="vacio chico">'+ico('check')+'<b>No tenés fichas incompletas</b></div>'),
    '', '680px');
  $$('#modal [data-inf]').forEach(it => it.onclick = () => { cerrarModal(); abrirFicha(it.dataset.inf); });
  $$('#modal [data-inb]').forEach(b => b.onclick = () => {
    const f = DB.fichas[b.dataset.inb];
    if(f) pedirBajaIncompleta(f, abrirIncompletas);
  });
}

/* Borrar una incompleta: la confirma quien la cargó, con su contraseña, y
   queda en cuenta regresiva de diez minutos. Al último minuto suena. */
const MINUTOS_BAJA_INCOMPLETA = 10;
function claveCorrecta(clave){
  if(!USUARIO || !SESION) return false;
  if(esCoordinador()) return clave === CLAVE_COORDINADOR;
  return !!USUARIO.passHash && hashClave(clave, USUARIO.salt) === USUARIO.passHash;
}
function pedirBajaIncompleta(f, volver){
  if(typeof soloLectura === 'function' && soloLectura('eliminar fichas')) return;
  const al = alcanceDeBaja(f);
  if(!al) return toast(motivoSinBaja(f), 'err');
  const p = DB.pacientes[f.pacienteId] || {};
  abrirModal('Eliminar la ficha incompleta',
    '<div class="aviso danger">'+ico('alerta')+'<div><b>Se elimina '+
      (al === 'acto' ? 'tu acto anestésico' : 'la ficha')+' de '+esc((p.apellido || '—')+', '+(p.nombre || ''))+
      '.</b><br>'+esc(queFaltaTexto(f))+'.<br><br>El <b>paciente no se borra</b>: sigue en el padrón con '+
      'sus otras intervenciones.</div></div>'+
    '<div class="aviso warn">'+ico('reloj')+'<div>Queda en cuenta regresiva de <b>'+MINUTOS_BAJA_INCOMPLETA+
      ' minutos</b>. Al último minuto suena un aviso y queda la marca en la campanita; hasta entonces '+
      'la podés detener.</div></div>'+
    '<div class="campo mt14"><label>Tu contraseña, para confirmar que sos quien la cargó</label>'+
      '<input type="password" id="bjClave" autocomplete="current-password"></div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn danger" id="bjOK">'+ico('reloj')+' Eliminar en '+MINUTOS_BAJA_INCOMPLETA+' min</button>', '600px');
  if(volver) alVolverModal(volver);
  setTimeout(() => { const i = $('#bjClave'); if(i) i.focus(); }, 120);
  $('#bjOK').onclick = () => {
    if(!claveCorrecta($('#bjClave').value)) return toast('La contraseña no coincide.', 'err');
    cerrarModal();
    programarBaja(f, al, 'Ficha incompleta', MINUTOS_BAJA_INCOMPLETA);
    if(vistaActual === 'panel') vistaPanel();
  };
}

/* ============================ INSTITUCIONES ============================
   Se escribe como salga —mayúsculas, sin acentos, a medias— y la app lo deja
   como se debe leer: mayúscula inicial, acentos y palabras corregidas contra
   un diccionario de nombres de instituciones y ciudades. Se muestra antes de
   guardar, así que siempre se puede corregir a mano. */
const DICC_INSTITUCION = ['Hospital','Regional','Sanatorio','Clínica','Centro','Médico','Médica','Privado',
  'Privada','Municipal','Provincial','Nacional','Fundación','Instituto','Policlínico','Materno','Infantil',
  'Sagrado','Corazón','San','Santa','Jorge','José','Juan','Nuestra','Señora','Cirugía','Salud','Integral',
  'Especialidades','Naval','Militar','Ushuaia','Grande','Tolhuin','Fueguino','Fueguina','Austral','Diagnóstico',
  'Oftalmológico','Odontológico','Traumatología','Ortopedia','Cardiovascular','Rehabilitación','Mutual',
  'Social','Policía','Italiano','Alemán','Británico','Español','Francés','Consultorio','Consultorios',
  'Ambulatorio','Quirúrgico','Quirófano','Asociación','Cooperativa','Obra','Río','Día'];
const CIUDADES = ['Ushuaia','Río Grande','Tolhuin','Puerto Almanza','Río Gallegos','El Calafate',
  'Buenos Aires','Córdoba','Rosario','Mendoza','Comodoro Rivadavia','Trelew','Neuquén','Bariloche'];
const MINUSCULAS = ['de','del','la','las','los','y','e','el','en','a','al'];

function distanciaTexto(a, b){
  if(typeof distancia === 'function') return distancia(a, b);
  const m = a.length, n = b.length, d = [];
  for(let i = 0; i <= m; i++){ d[i] = [i]; }
  for(let j = 0; j <= n; j++) d[0][j] = j;
  for(let i = 1; i <= m; i++) for(let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[m][n];
}
function palabraCorregida(w){
  const n = norm(w);
  if(n.length < 3) return null;
  let mejor = null, dmin = 99;
  DICC_INSTITUCION.forEach(x => { const d = distanciaTexto(n, norm(x)); if(d < dmin){ dmin = d; mejor = x; } });
  const tol = n.length >= 8 ? 2 : (n.length >= 5 ? 1 : 0);
  return dmin <= tol ? mejor : null;
}
function normalizarInstitucion(txt){
  return String(txt || '').replace(/[^\p{L}\p{N}\s."'°º\-]/gu, ' ').replace(/\s+/g, ' ').trim()
    .split(' ').filter(Boolean).map((w, i) => {
      const bajo = w.toLowerCase();
      if(i > 0 && MINUSCULAS.indexOf(norm(bajo)) >= 0) return bajo;
      if(/^[A-Z]{2,5}$/.test(w) && !palabraCorregida(w)) return w;       /* siglas: HRU, OSEF */
      const c = palabraCorregida(w);
      if(c) return c;
      return bajo.charAt(0).toUpperCase() + bajo.slice(1);
    }).join(' ');
}
function normalizarCiudad(txt){
  const t = String(txt || '').replace(/\s+/g, ' ').trim();
  if(!t) return '';
  let mejor = null, dmin = 99;
  CIUDADES.forEach(c => { const d = distanciaTexto(norm(t), norm(c)); if(d < dmin){ dmin = d; mejor = c; } });
  if(dmin <= (t.length >= 7 ? 2 : 1)) return mejor;
  return t.toLowerCase().split(' ').map((w, i) => (i > 0 && MINUSCULAS.indexOf(w) >= 0)
    ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function abrirAltaInstitucion(alGuardar){
  if(typeof soloLectura === 'function' && soloLectura('agregar instituciones')) return;
  abrirModal('Agregar institución',
    '<p class="mini" style="margin:0 0 10px">Escribila como te salga: la app la corrige y te muestra '+
      'cómo va a quedar antes de guardarla. Queda para toda la asociación.</p>'+
    campoTxt('niNombre', 'Nombre de la institución')+
    '<div class="grid c2">'+campoTxt('niCiudad', 'Ciudad')+
      campoSel('niTipo', 'Tipo', ['Privado','Público','Obra social','Fuerzas Armadas','Municipal','Otro'])+'</div>'+
    '<div id="niVista"></div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="niGuardar">'+ico('check')+' Guardar</button>', '560px');
  let existente = null;
  const vista = () => {
    const n = normalizarInstitucion(val('niNombre')), c = normalizarCiudad(val('niCiudad'));
    existente = n ? instituciones().find(o => parecidoPrestador(n, o.nombre)) : null;
    $('#niVista').innerHTML = (n
      ? '<div class="aviso ok">'+ico('check')+'<div>Se va a guardar como <b>'+esc(n)+'</b>'+
        (c ? ' · <b>'+esc(c)+'</b>' : '')+'</div></div>' : '')+
      (existente
        ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Ya existe algo muy parecido:</b> '+
          esc(existente.nombre)+(existente.ciudad ? ' · '+esc(existente.ciudad) : '')+
          '<br><button type="button" class="btn warn chico mt8" id="niUsar">Usar esa</button></div></div>' : '');
    if($('#niUsar')) $('#niUsar').onclick = () => { cerrarModal(); if(alGuardar) alGuardar(existente.id); };
  };
  $('#niNombre').oninput = debounce(vista, 250);
  $('#niCiudad').oninput = debounce(vista, 250);
  $('#niGuardar').onclick = () => {
    const n = normalizarInstitucion(val('niNombre')), c = normalizarCiudad(val('niCiudad'));
    if(!n) return toast('Escribí el nombre de la institución.', 'err');
    if(!c) return toast('Escribí la ciudad.', 'err');
    const igual = instituciones().find(o => parecidoPrestador(n, o.nombre) === 'idéntico');
    if(igual){ cerrarModal(); toast('Esa institución ya estaba.', 'warn'); if(alGuardar) alGuardar(igual.id); return; }
    const id = uid('ins');
    escribir('instituciones', id, { id, nombre:n, ciudad:c, tipo:$('#niTipo').value,
      creadaPor: SESION ? SESION.uid : '', creada:new Date().toISOString() });
    auditar('institucion-alta', n + ' · ' + c);
    cerrarModal();
    toast('Institución agregada para toda la asociación.', 'ok');
    if(alGuardar) alGuardar(id);
  };
  setTimeout(() => { const i = $('#niNombre'); if(i) i.focus(); }, 120);
}

/* ============================== WHATSAPP ============================== */
const ICO_WHATSAPP = '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/>'+
  '<path fill="#fff" d="M17.3 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a7.7 7.7 0 0 1-3.8-3.3c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.9-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.3s1 2.7 1.1 2.9c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.7-.4z"/></svg>';
function urlWhatsApp(tel, texto){
  let d = String(tel || '').replace(/\D/g, '');
  if(!d) return '';
  if(d.indexOf('00') === 0) d = d.slice(2);
  if(d.indexOf('54') !== 0){
    if(d.indexOf('0') === 0) d = d.slice(1);
    d = d.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2');
    d = '549' + d;
  } else if(d.indexOf('549') !== 0){
    d = '549' + d.slice(2);
  }
  return 'https://wa.me/' + d + (texto ? '?text=' + encodeURIComponent(texto) : '');
}
function abrirWhatsAppPaciente(p){
  const u = USUARIO || {};
  const url = urlWhatsApp(p.telefono, 'Hola ' + (p.nombre || '') + ', le escribe ' +
    (u.trato || 'el/la Dr/a.') + ' ' + (u.apellido || '') + ', anestesiólogo/a de AFAAR. ');
  if(!url) return toast('El paciente no tiene teléfono cargado.', 'warn');
  window.open(url, '_blank', 'noopener');
}

/* ============================== SPOTIFY ==============================
   El logo abre Spotify. La app no puede saber si la música suena (haría
   falta conectar la cuenta), así que al tocarlo entra en «momento de relax»
   por tres horas: el logo titila suave y, si hay avisos sin abrir, una voz
   le recuerda cada diez minutos que aproveche a completarlos. Abrir los
   avisos corta el recordatorio. */
const LS_RELAX = 'afar_relax_v1';
const RELAX_HORAS = 3, RELAX_CADA_MIN = 10;
function relaxActual(){
  try{
    const r = JSON.parse(sessionStorage.getItem(LS_RELAX) || 'null');
    if(!r || !SESION || r.uid !== SESION.uid) return null;
    if(Date.now() - new Date(r.desde).getTime() > RELAX_HORAS * 3600000) return null;
    return r;
  }catch(e){ return null; }
}
function guardarRelax(r){ try{ sessionStorage.setItem(LS_RELAX, JSON.stringify(r)); }catch(e){} }
function pintarBotonSpotify(){
  const b = $('#btnSpotify');
  if(b) b.classList.toggle('sonando', !!relaxActual());
}
function tocarSpotify(){
  window.open('https://open.spotify.com/', '_blank', 'noopener');
  if(SESION && !esInvitado()) guardarRelax({ uid:SESION.uid, desde:new Date().toISOString(), ultimaVoz:new Date().toISOString() });
  pintarBotonSpotify();
}
function hablar(texto){
  if(!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(texto);
  const voces = speechSynthesis.getVoices();
  const es = v => /^es[-_]ES/i.test(v.lang);
  u.voice = voces.find(v => es(v) && /(female|mujer|m[oó]nica|paulina|helena|laura|elvira|luc[ií]a|marisol|conchita|elena)/i.test(v.name))
         || voces.find(es) || voces.find(v => /^es/i.test(v.lang)) || null;
  u.lang = 'es-ES'; u.rate = 0.95; u.pitch = 1.05;
  try{ speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
function revisarRelax(){
  pintarBotonSpotify();
  const r = relaxActual();
  if(!r || r.avisosVistos) return;
  if(!calcularAvisos().length) return;
  if(Date.now() - new Date(r.ultimaVoz || r.desde).getTime() < RELAX_CADA_MIN * 60000) return;
  const trato = (USUARIO && USUARIO.trato) || 'Doctor';
  hablar(trato + ', está usted en un momento de relax. Aproveche a completar los pendientes que tiene.');
  r.ultimaVoz = new Date().toISOString();
  guardarRelax(r);
}
function iniciarRelax(){
  clearInterval(window.__relax);
  window.__relax = setInterval(revisarRelax, 60000);
  pintarBotonSpotify();
  if('speechSynthesis' in window) speechSynthesis.getVoices();
}

/* ======================= RESUMEN DEL DÍA AL SALIR ======================= */
function pedirSalida(){
  const mandar = SESION && !esInvitado() && !esCoordinador() && !esContable() &&
                 USUARIO && USUARIO.email && envioConfigurado();
  confirmar('Cerrar sesión',
    '¿Querés salir del portal? Los datos quedan guardados.'+
    (mandar ? '<br><br>Te llega a <b>'+esc(USUARIO.email)+'</b> el resumen del día: lo pendiente, '+
      'lo programado para mañana y lo finalizado hoy.' : ''),
    () => { if(mandar) enviarResumenDiario(); cerrarSesion(); }, 'Cerrar sesión');
}
function fechaMas(n){ const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); }
function htmlResumenDiario(){
  const u = USUARIO || {};
  const fichas = misFichas();
  const nom = f => { const p = DB.pacientes[f.pacienteId] || {}; return esc((p.apellido || '—') + ', ' + (p.nombre || '')); };
  const cx = f => esc(textoProcedimientos(f) || f.cirugia || 'sin cirugía');
  const inst = f => esc(nombreInstitucion(f.institucion).split('"')[0].trim() || 'sin institución');
  const tabla = (tit, filas, vacio) => '<h3 style="color:#0b2545;font-size:16px;margin:22px 0 8px">'+tit+
    ' <span style="color:#667;font-weight:normal">('+filas.length+')</span></h3>'+
    (filas.length ? '<table style="width:100%;border-collapse:collapse;font-size:14px">'+
      filas.map(r => '<tr>'+r.map(c => '<td style="padding:7px 8px;border-bottom:1px solid #dde4ee;vertical-align:top">'+c+'</td>').join('')+'</tr>').join('')+
      '</table>' : '<p style="color:#667;margin:0">'+vacio+'</p>');
  const avisos = calcularAvisos();
  const incompletas = misIncompletas();
  const sinFacturar = fichas.filter(f => (esActorFicha(f) && fechaCirugiaDe(f) && fechaCirugiaDe(f) <= hoyISO() && !(f.hon || {}).modalidad) ||
                                        (esAutorFicha(f) && f.valoracionGuardada && !(f.honConsulta || {}).modalidad));
  const manana = fechaMas(1);
  const programadas = lista('fichas').filter(f => fechaCirugiaDe(f) === manana &&
    (actorFicha(f) === SESION.uid || f.asignadoUid === SESION.uid || (f.ownerUid === SESION.uid && !actorFicha(f))));
  const hoy = fichas.filter(f => esActorFicha(f) && fechaCirugiaDe(f) === hoyISO());
  return '<div style="font-family:Calibri,Arial,sans-serif;color:#111;line-height:1.5;max-width:760px;margin:0 auto">'+
    '<p>Hola <b>'+esc((u.trato ? u.trato + ' ' : '') + (u.apellido || ''))+'</b>, este es tu resumen del '+
      esc(fFechaLarga(hoyISO()))+' en AFAAR.</p>'+
    tabla('1. Pendientes (avisos)', avisos.map(a => ['<b>'+esc(a.titulo)+'</b><br><span style="color:#556">'+
      esc(String(a.detalle || '').split('\n')[0])+'</span>']), 'No tenés avisos pendientes.')+
    tabla('2. Fichas incompletas', incompletas.map(f => [nom(f), cx(f), esc(queFaltaTexto(f))]), 'Ninguna.')+
    tabla('3. Sin facturar', sinFacturar.map(f => [nom(f), cx(f),
      (esActorFicha(f) && !(f.hon || {}).modalidad ? 'Honorario del acto' : 'Honorario de la consulta')]), 'Todo cargado.')+
    tabla('4. Programadas para mañana ('+esc(fFecha(manana))+')', programadas.map(f => [nom(f), cx(f), inst(f)]),
      'No tenés cirugías programadas para mañana.')+
    tabla('5. Realizadas hoy', hoy.map(f => [nom(f), cx(f),
      (f.firma || {}).firmado ? 'Finalizada' : 'Sin finalizar']), 'No registraste anestesias hoy.')+
    '<p style="font-size:12px;color:#667;margin-top:26px">Resumen generado por la aplicación al cerrar tu sesión. '+
      'Contiene datos de salud: es confidencial (Ley 25.326) y es solo para vos.</p></div>';
}
function enviarResumenDiario(){
  try{
    fetch(ENVIO_URL, { method:'POST', redirect:'follow', keepalive:true,
      body: JSON.stringify({ clave:ENVIO_CLAVE, para:USUARIO.email,
        nombre: typeof ENVIO_NOMBRE !== 'undefined' ? ENVIO_NOMBRE : 'AFAAR',
        asunto:'AFAAR — Tu resumen del día ' + fFecha(hoyISO()),
        html: htmlResumenDiario() }) }).catch(() => {});
    auditar('resumen-diario', 'Resumen del día enviado a ' + USUARIO.email);
  }catch(e){}
}

/* =================== AVISO DE ACTUALIZACIÓN A LAS 24 H =================== */
const HORAS_AVISO_ACTUALIZAR = 24;
function iniciarVigiaActualizacion(){
  clearInterval(window.__vigia);
  if(SESION && !SESION.desde){
    SESION.desde = new Date().toISOString();
    try{ localStorage.setItem(LS_SES, JSON.stringify(SESION)); }catch(e){}
  }
  const revisar = () => {
    if(!SESION || !SESION.desde) return;
    if(Date.now() - new Date(SESION.desde).getTime() < HORAS_AVISO_ACTUALIZAR * 3600000) return;
    if($('#actOK')) return;
    const trato = (USUARIO && USUARIO.trato) ? (USUARIO.trato === 'Doctora' ? 'Dra.' : 'Dr.') : 'Dr.';
    const texto = trato + ' Puede haber nuevas actualizaciones de la aplicación, compruébelo.';
    if(document.hidden && 'Notification' in window && Notification.permission === 'granted'){
      try{ new Notification('AFAAR', { body:texto, icon:'icons/icon-192.png', requireInteraction:true }); }catch(e){}
    }
    abrirModal('Actualización', '<div class="aviso info">'+ico('refrescar')+'<div><b>'+esc(texto)+'</b></div></div>',
      '<button class="btn pri grande" id="actOK">'+ico('refrescar')+' Comprobar</button>', '460px');
    modalSinSalida();
    $('#actOK').onclick = comprobarActualizacion;
  };
  window.__vigia = setInterval(revisar, 60000);
  setTimeout(revisar, 5000);
  /* Para que el aviso llegue aunque la app esté en segundo plano hace falta el
     permiso de notificaciones: se pide una sola vez, con el primer toque. */
  if('Notification' in window && Notification.permission === 'default' && !localStorage.getItem('afar_notif_pedido')){
    document.addEventListener('click', function pedir(){
      document.removeEventListener('click', pedir);
      try{ localStorage.setItem('afar_notif_pedido', '1'); Notification.requestPermission(); }catch(e){}
    });
  }
}
function comprobarActualizacion(){
  const b = $('#actOK'); if(b){ b.disabled = true; b.textContent = 'Comprobando…'; }
  if(SESION){ SESION.desde = new Date().toISOString(); try{ localStorage.setItem(LS_SES, JSON.stringify(SESION)); }catch(e){} }
  const tareas = [ fetch('index.html?v=' + Date.now(), { cache:'reload' }).catch(() => {}) ];
  if('serviceWorker' in navigator) tareas.push(navigator.serviceWorker.getRegistration()
    .then(r => r ? r.update() : null).catch(() => {}));
  Promise.all(tareas).then(() => location.reload());
  setTimeout(() => location.reload(), 4000);
}
