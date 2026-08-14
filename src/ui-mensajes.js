/* =========================================================================
   COMUNICACION INTERNA - reclamos, consultas y avisos
   Correo/chat interno entre anestesiologos acreditados, la coordinacion y
   el contador. Con recordatorio de respuesta pendiente a las 2 horas.

   Un hilo lo ven UNICAMENTE sus participantes: ni la coordinacion ni el
   contador leen conversaciones ajenas.
   ========================================================================= */

const HORAS_SIN_RESPONDER = 2;      /* umbral de reclamo sin resolver */

const TIPOS_HILO = [
  { id:'reclamo',  n:'Reclamo',  d:'Requiere respuesta y seguimiento hasta resolverse.', cls:'danger' },
  { id:'consulta', n:'Consulta', d:'Pregunta o pedido de información.',                  cls:'info'   },
  { id:'aviso',    n:'Aviso',    d:'Comunicación informativa, no exige respuesta.',      cls:''       }
];
const PRIORIDADES_HILO = [
  { id:'alta',   n:'Alta',   cls:'danger' },
  { id:'normal', n:'Normal', cls:'info'   },
  { id:'baja',   n:'Baja',   cls:''       }
];

let filtroMensajes = 'todos';

/* ------------------------------------------------------ Datos del hilo */
function hilos(){ return lista('mensajes'); }

/* Solo los hilos en los que participo. */
function misHilos(){
  if(!SESION) return [];
  return hilos().filter(h => (h.participantes || []).indexOf(SESION.uid) >= 0)
    .sort((a,b) => (b.actualizado || b.creado || '').localeCompare(a.actualizado || a.creado || ''));
}
function mensajesDe(h){
  return Object.values(h.mensajes || {})
    .sort((a,b) => (a.cuando || '').localeCompare(b.cuando || ''));
}
function ultimoMensaje(h){
  const m = mensajesDe(h);
  return m.length ? m[m.length-1] : null;
}
/* Horas transcurridas desde el último mensaje */
function horasDesde(iso){
  if(!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}
/* ¿Este hilo espera una respuesta MIA y ya pasaron las 2 horas?
   Sólo aplica a hilos abiertos cuyo último mensaje lo escribió otro. */
function esperaRespuestaMia(h){
  if(!SESION || h.estado === 'resuelto' || h.tipo === 'aviso') return false;
  const u = ultimoMensaje(h);
  if(!u || u.uid === SESION.uid) return false;
  return true;
}
function hiloVencido(h){
  return esperaRespuestaMia(h) && horasDesde((ultimoMensaje(h) || {}).cuando) >= HORAS_SIN_RESPONDER;
}
/* Reclamo abierto que YO inicié y nadie contestó a tiempo */
function miReclamoSinRespuesta(h){
  if(!SESION || h.estado === 'resuelto' || h.tipo !== 'reclamo') return false;
  const u = ultimoMensaje(h);
  if(!u || u.uid !== SESION.uid) return false;
  return horasDesde(u.cuando) >= HORAS_SIN_RESPONDER;
}
function hiloNoLeido(h){
  if(!SESION) return false;
  const u = ultimoMensaje(h);
  if(!u || u.uid === SESION.uid) return false;
  const visto = (h.leido || {})[SESION.uid] || '';
  return (u.cuando || '') > visto;
}
function marcarLeido(h){
  if(!SESION) return;
  const u = ultimoMensaje(h);
  if(!u) return;
  const leido = Object.assign({}, h.leido || {});
  if(leido[SESION.uid] === u.cuando) return;
  leido[SESION.uid] = u.cuando;
  escribir('mensajes', h.id, Object.assign({}, h, { leido:leido }));
}
function conteoMensajes(){
  const l = misHilos();
  return {
    noLeidos:  l.filter(hiloNoLeido).length,
    vencidos:  l.filter(hiloVencido).length,
    abiertos:  l.filter(h => h.estado !== 'resuelto').length
  };
}

/* Personas con las que se puede hablar */
/* Coordinacion y Contable son roles institucionales fijos: se ofrecen siempre,
   aunque todavia no hayan entrado nunca desde este dispositivo. El mensaje
   queda esperandolos, como un correo. */
function destinatariosPosibles(){
  const l = socios().map(u => ({ uid:u.uid, n:u.apellido + ', ' + u.nombre, rol:'Anestesiólogo' }));
  l.unshift({ uid:'coordinador', n:'Coordinación AFAR', rol:'Coordinación' });
  l.unshift({ uid:'contable',    n:'Contable AFAR',     rol:'Contable' });
  return l.filter(x => !SESION || x.uid !== SESION.uid);
}
function nombreParticipante(u){
  if(u === 'coordinador') return 'Coordinación AFAR';
  if(u === 'contable')    return 'Contable AFAR';
  return nombreUsuario(u);
}

/* --------------------------------------------------------- Acciones --- */
function crearHilo(datos){
  const id = uid('hilo');
  const ahora = new Date().toISOString();
  const m0 = uid('msg');
  const parts = [SESION.uid].concat(datos.participantes.filter(p => p !== SESION.uid));
  escribir('mensajes', id, {
    id:id, asunto:datos.asunto, tipo:datos.tipo, prioridad:datos.prioridad,
    creadoPor:SESION.uid, creado:ahora, actualizado:ahora,
    participantes:parts, estado:'abierto',
    mensajes:{ [m0]:{ id:m0, uid:SESION.uid, texto:datos.texto, cuando:ahora } },
    leido:{ [SESION.uid]:ahora }
  });
  auditar('mensaje-nuevo', datos.tipo + ' «' + datos.asunto + '» a ' +
    parts.filter(p => p !== SESION.uid).map(nombreParticipante).join(', '));
  return id;
}
function responderHilo(id, texto){
  const h = DB.mensajes[id]; if(!h || !texto.trim()) return;
  const ahora = new Date().toISOString();
  const mid = uid('msg');
  const ms = Object.assign({}, h.mensajes || {});
  ms[mid] = { id:mid, uid:SESION.uid, texto:texto.trim(), cuando:ahora };
  escribir('mensajes', id, Object.assign({}, h, {
    mensajes:ms, actualizado:ahora,
    leido: Object.assign({}, h.leido || {}, { [SESION.uid]:ahora })
  }));
}
function resolverHilo(id, resolver){
  const h = DB.mensajes[id]; if(!h) return;
  escribir('mensajes', id, Object.assign({}, h, {
    estado: resolver ? 'resuelto' : 'abierto',
    cerradoPor: resolver ? SESION.uid : '',
    cerradoEn: resolver ? new Date().toISOString() : '',
    actualizado: new Date().toISOString()
  }));
  auditar('mensaje-estado', (resolver ? 'Resuelto' : 'Reabierto') + ' «' + h.asunto + '»');
}

/* ============================== VISTA ============================== */
function vistaMensajes(){
  const cont = $('#vMensajes');
  let l = misHilos();
  if(filtroMensajes === 'abiertos')  l = l.filter(h => h.estado !== 'resuelto');
  if(filtroMensajes === 'vencidos')  l = l.filter(h => hiloVencido(h) || miReclamoSinRespuesta(h));
  if(filtroMensajes === 'noleidos')  l = l.filter(hiloNoLeido);
  if(filtroMensajes === 'resueltos') l = l.filter(h => h.estado === 'resuelto');

  const c = conteoMensajes();
  const pendientesMios = misHilos().filter(miReclamoSinRespuesta).length;

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Comunicación interna</h1>'+
    '<p>Reclamos, consultas y avisos entre anestesiólogos, coordinación y contable</p></div>'+
    '<div class="acciones"><button class="btn pri chico" id="msgNuevo">'+ico('mas')+' Nuevo mensaje</button></div>'+
  '</div>'+

  (c.vencidos ? '<div class="aviso danger">'+ico('reloj')+'<div><b>'+c.vencidos+
    ' mensaje'+(c.vencidos===1?'':'s')+' esperando tu respuesta hace más de '+HORAS_SIN_RESPONDER+' horas.</b><br>'+
    'Un reclamo sin responder frena la gestión del colega que lo abrió.</div></div>' : '')+
  (pendientesMios ? '<div class="aviso warn">'+ico('alerta')+'<div><b>'+pendientesMios+
    ' reclamo'+(pendientesMios===1?'':'s')+' tuyo'+(pendientesMios===1?'':'s')+' sin respuesta.</b><br>'+
    'Pasaron más de '+HORAS_SIN_RESPONDER+' horas desde tu último mensaje sin que nadie contestara.</div></div>' : '')+

  '<div class="grid c4 mb8">'+
    kpi('Sin leer', c.noLeidos, c.noLeidos?'aqua':'', ico('correo'), '')+
    kpi('Abiertos', c.abiertos, 'azul', ico('lista'), '')+
    kpi('Esperan tu respuesta', c.vencidos, c.vencidos?'danger':'ok', ico('reloj'), '+'+HORAS_SIN_RESPONDER+' h')+
    kpi('Sin respuesta ajena', pendientesMios, pendientesMios?'warn':'ok', ico('campana'), 'reclamos míos')+
  '</div>'+

  '<div class="filtros">'+
    '<div class="campo"><label>Ver</label><select id="msgFiltro">'+
      [['todos','Todos'],['abiertos','Abiertos'],['noleidos','Sin leer'],
       ['vencidos','Esperan respuesta'],['resueltos','Resueltos']]
        .map(o => '<option value="'+o[0]+'"'+(filtroMensajes===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')+
    '</select></div>'+
  '</div>'+

  (l.length ? '<div class="lista">'+ l.map(h => {
    const u = ultimoMensaje(h) || {};
    const t = TIPOS_HILO.find(x => x.id === h.tipo) || TIPOS_HILO[1];
    const pr = PRIORIDADES_HILO.find(x => x.id === h.prioridad) || PRIORIDADES_HILO[1];
    const venc = hiloVencido(h), noLeido = hiloNoLeido(h);
    const otros = (h.participantes||[]).filter(p => p !== SESION.uid).map(nombreParticipante).join(', ');
    return '<div class="item" data-hilo="'+esc(h.id)+'">'+
      '<div class="avatar" style="'+(venc?'background:var(--danger-bg);color:var(--danger)':
        (noLeido?'background:var(--aqua-200);color:var(--aqua-600)':''))+'">'+
        ico(h.tipo === 'reclamo' ? 'alerta' : (h.tipo === 'aviso' ? 'campana' : 'correo'))+'</div>'+
      '<div class="txt"><b>'+(noLeido?'● ':'')+esc(h.asunto)+'</b>'+
        '<span>'+esc(otros || 'sin destinatarios')+' · '+
        esc((u.texto||'').slice(0,70))+(String(u.texto||'').length>70?'…':'')+'</span></div>'+
      '<div class="der" style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">'+
        '<span class="tag '+t.cls+'">'+esc(t.n)+'</span>'+
        (h.estado === 'resuelto'
          ? '<span class="tag ok">Resuelto</span>'
          : (venc ? '<span class="tag danger">+'+Math.floor(horasDesde(u.cuando))+' h</span>'
                  : (h.prioridad === 'alta' ? '<span class="tag '+pr.cls+'">Alta</span>' : '')))+
        '<span class="mini">'+esc(fFecha(String(u.cuando||'').slice(0,10)))+'</span>'+
      '</div></div>';
  }).join('') +'</div>'
  : '<div class="vacio">'+ico('correo')+'<b>No hay mensajes</b>'+
    '<span>Abrí un reclamo o una consulta con el botón «Nuevo mensaje».</span></div>')+

  '<div class="aviso info mt14">'+ico('info')+'<div>Los hilos los ven <b>solamente sus participantes</b>. '+
    'Un reclamo que no recibe respuesta en '+HORAS_SIN_RESPONDER+' horas aparece marcado en rojo y se suma '+
    'a los avisos de la campana, hasta que alguien conteste o se lo dé por resuelto.</div></div>';

  $('#msgNuevo').onclick = () => componerHilo();
  $('#msgFiltro').onchange = e => { filtroMensajes = e.target.value; vistaMensajes(); };
  $$('#vMensajes .item[data-hilo]').forEach(i => i.onclick = () => abrirHilo(i.dataset.hilo));
}

/* ------------------------------------------------------- Nuevo hilo --- */
function componerHilo(preParticipante, preAsunto){
  const dest = destinatariosPosibles();
  if(!dest.length) return toast('No hay otros usuarios habilitados todavía.', 'err');
  abrirModal('Nuevo mensaje interno',
    '<div class="campo"><label>Para <span class="req">*</span></label>'+
      '<div class="chks" id="mhDest">'+ dest.map(d =>
        '<label class="chk'+(preParticipante===d.uid?' sel':'')+'">'+
        '<input type="checkbox" value="'+esc(d.uid)+'"'+(preParticipante===d.uid?' checked':'')+'>'+
        esc(d.n)+' <b style="opacity:.55">'+esc(d.rol)+'</b></label>').join('') +'</div></div>'+
    '<div class="grid c2">'+
      '<div class="campo"><label>Tipo</label><select id="mhTipo">'+
        TIPOS_HILO.map(t => '<option value="'+t.id+'">'+esc(t.n)+'</option>').join('')+
        '</select><div class="ayuda" id="mhTipoD"></div></div>'+
      '<div class="campo"><label>Prioridad</label><select id="mhPrio">'+
        PRIORIDADES_HILO.map(p => '<option value="'+p.id+'"'+(p.id==='normal'?' selected':'')+'>'+
          esc(p.n)+'</option>').join('')+'</select></div>'+
    '</div>'+
    '<div class="campo"><label>Asunto <span class="req">*</span></label>'+
      '<input type="text" id="mhAsunto" maxlength="90" value="'+esc(preAsunto||'')+'" '+
      'placeholder="Débito de OSDE en la facturación de marzo"></div>'+
    '<div class="campo"><label>Mensaje <span class="req">*</span></label>'+
      '<textarea id="mhTexto" rows="5" placeholder="Escribí el detalle del reclamo o la consulta"></textarea></div>'+
    '<div class="aviso warn" style="margin-bottom:0">'+ico('candado')+'<div>No incluyas datos del paciente. '+
      'Este canal es administrativo y el contable no está habilitado a acceder a información clínica.</div></div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="mhEnviar">'+ico('correo')+' Enviar</button>', '620px');

  cablearChks('mhDest');
  const desc = () => { const t = TIPOS_HILO.find(x => x.id === $('#mhTipo').value);
    $('#mhTipoD').textContent = t ? t.d : ''; };
  $('#mhTipo').onchange = desc; desc();

  $('#mhEnviar').onclick = () => {
    const parts = leerChks('mhDest');
    const asunto = $('#mhAsunto').value.trim();
    const texto  = $('#mhTexto').value.trim();
    if(!parts.length) return toast('Elegí al menos un destinatario.', 'err');
    if(!asunto)       return toast('Poné un asunto.', 'err');
    if(!texto)        return toast('Escribí el mensaje.', 'err');
    const id = crearHilo({ participantes:parts, asunto:asunto, texto:texto,
      tipo:$('#mhTipo').value, prioridad:$('#mhPrio').value });
    cerrarModal();
    toast('Mensaje enviado.', 'ok');
    if(vistaActual === 'mensajes') vistaMensajes();
    pintarBadgeAvisos();
    setTimeout(() => abrirHilo(id), 220);
  };
}

/* --------------------------------------------------------- Ver hilo --- */
function abrirHilo(id){
  const h = DB.mensajes[id];
  if(!h) return toast('El mensaje ya no existe.', 'err');
  marcarLeido(h);
  const ms = mensajesDe(h);
  const t = TIPOS_HILO.find(x => x.id === h.tipo) || TIPOS_HILO[1];
  const otros = (h.participantes||[]).filter(p => p !== SESION.uid).map(nombreParticipante).join(', ');
  const venc = hiloVencido(h);

  const cuerpo = ''+
    '<div class="aviso '+(h.estado==='resuelto'?'ok':(venc?'danger':'info'))+'">'+
      ico(h.estado==='resuelto'?'check':(venc?'reloj':'info'))+
      '<div><b>'+esc(t.n)+(h.prioridad==='alta'?' · prioridad alta':'')+'</b><br>'+
      'Entre vos y '+esc(otros)+'. Abierto el '+fFecha(String(h.creado).slice(0,10))+'.'+
      (h.estado === 'resuelto'
        ? '<br>Resuelto por '+esc(nombreParticipante(h.cerradoPor))+' el '+
          fFecha(String(h.cerradoEn).slice(0,10))+'.'
        : (venc ? '<br><b>Espera tu respuesta hace '+Math.floor(horasDesde((ultimoMensaje(h)||{}).cuando))+
                  ' horas.</b>' : ''))+
      '</div></div>'+

    '<div id="mhConv" style="max-height:46vh;overflow:auto;display:flex;flex-direction:column;gap:8px;'+
      'padding:4px 2px;margin-bottom:12px">'+
      ms.map(m => {
        const mio = m.uid === SESION.uid;
        return '<div style="align-self:'+(mio?'flex-end':'flex-start')+';max-width:86%;'+
          'background:'+(mio?'var(--aqua-200)':'var(--panel-2)')+';'+
          'color:var(--texto);border-radius:12px;padding:9px 12px;'+
          'border:1px solid var(--borde)">'+
          '<div class="mini" style="opacity:.7;margin-bottom:3px">'+
            esc(mio ? 'Vos' : nombreParticipante(m.uid))+' · '+
            esc(fFecha(String(m.cuando).slice(0,10)))+' '+esc(String(m.cuando).slice(11,16))+' h</div>'+
          '<div style="white-space:pre-wrap;line-height:1.55">'+esc(m.texto)+'</div></div>';
      }).join('')+
    '</div>'+

    (h.estado === 'resuelto' ? '' :
      '<div class="campo" style="margin-bottom:8px"><label>Responder</label>'+
      '<textarea id="mhResp" rows="3" placeholder="Escribí tu respuesta"></textarea></div>');

  abrirModal(h.asunto, cuerpo,
    (h.estado === 'resuelto'
      ? '<button class="btn ghost" id="mhReabrir">'+ico('refrescar')+' Reabrir</button>'+
        '<button class="btn pri" data-cerrar>Cerrar</button>'
      : '<button class="btn ghost" id="mhResolver">'+ico('check')+' Dar por resuelto</button>'+
        '<button class="btn pri" id="mhResponder">'+ico('correo')+' Responder</button>'), '640px');

  const conv = $('#mhConv'); if(conv) conv.scrollTop = conv.scrollHeight;

  if($('#mhResponder')) $('#mhResponder').onclick = () => {
    const txt = $('#mhResp').value.trim();
    if(!txt) return toast('Escribí una respuesta.', 'err');
    responderHilo(id, txt);
    cerrarModal();
    toast('Respuesta enviada.', 'ok');
    if(vistaActual === 'mensajes') vistaMensajes();
    pintarBadgeAvisos();
    setTimeout(() => abrirHilo(id), 200);
  };
  if($('#mhResolver')) $('#mhResolver').onclick = () => {
    resolverHilo(id, true); cerrarModal(); toast('Marcado como resuelto.', 'ok');
    if(vistaActual === 'mensajes') vistaMensajes();
    pintarBadgeAvisos();
  };
  if($('#mhReabrir')) $('#mhReabrir').onclick = () => {
    resolverHilo(id, false); cerrarModal(); toast('Reabierto.', 'ok');
    if(vistaActual === 'mensajes') vistaMensajes();
    pintarBadgeAvisos();
  };
}
