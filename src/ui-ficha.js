/* =========================================================================
   FICHA ANESTESICA - FLUJO DE TRABAJO
   Cinco pasos, en el orden en que ocurre el acto medico:

     Paciente  >  Preanestesia  >  Anestesia  >  Recuperacion  >  Firmar

   Los honorarios quedan fuera del flujo clinico, en su propio acceso: son
   un tramite administrativo y no forman parte del registro anestesico.
   ========================================================================= */

let fichaActual = null;
let pasoFicha = 'paciente';
let cxSeleccionada = null;

const PASOS_FICHA = [
  { k:'paciente',     ico:'paciente',   t:'Paciente',     sub:'Identificación y procedimiento' },
  { k:'preanestesia', ico:'valoracion', t:'Preanestesia', sub:'Valoración y plan' },
  { k:'anestesia',    ico:'jeringa',    t:'Anestesia',    sub:'Registro intraoperatorio' },
  { k:'recuperacion', ico:'corazon',    t:'Recuperación', sub:'Aldrete, dolor y destino' },
  { k:'firma',        ico:'firma',      t:'Firmar',       sub:'Cierre del registro' }
];

/* ============================ LISTADO ============================ */
let filtroFichas = { texto:'', caracter:'', institucion:'', estado:'', alcance:'mias' };

function vistaFichas(){
  const cont = $('#vFichas');
  const universo = esCoordinador() ? fichasVisibles()
    : (filtroFichas.alcance === 'mias'    ? misFichas()
     : filtroFichas.alcance === 'colegas' ? fichasVisibles().filter(f => !esAutorFicha(f))
     :                                      fichasVisibles());
  let l = universo.sort((a,b) => (b.fecha||'') + (b.hora||'') < (a.fecha||'') + (a.hora||'') ? -1 : 1);
  const q = norm(filtroFichas.texto);
  if(q) l = l.filter(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    return norm([p.apellido,p.nombre,p.dni,f.cirugia,f.cirujano,autorFicha(f)].join(' ')).indexOf(q) >= 0;
  });
  if(filtroFichas.caracter)    l = l.filter(f => f.caracter === filtroFichas.caracter);
  if(filtroFichas.institucion) l = l.filter(f => f.institucion === filtroFichas.institucion);
  if(filtroFichas.estado)      l = l.filter(f => (f.estado||'borrador') === filtroFichas.estado);

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Fichas anestésicas</h1>'+
    '<p>'+l.length+' de '+universo.length+' fichas</p></div>'+
    '<div class="acciones"><button class="btn pri" id="btnNuevaFicha">'+ico('mas')+' Nueva ficha</button></div></div>'+

  (esCoordinador() ? '' :
    '<div class="seg mb8" id="fAlcance">'+
      [['mias','Mías'],['colegas','De colegas'],['todas','Todas']].map(a =>
        '<button type="button" data-v="'+a[0]+'"'+(filtroFichas.alcance===a[0]?' class="on"':'')+'>'+
        a[1]+'</button>').join('')+
    '</div>')+

  '<div class="filtros">'+
    '<div class="campo" style="flex:2"><label>Buscar</label>'+
      '<input type="search" id="fBuscar" placeholder="Paciente, DNI, cirugía o cirujano" value="'+esc(filtroFichas.texto)+'"></div>'+
    '<div class="campo"><label>Carácter</label><select id="fCaracter">'+
      '<option value="">Todos</option>'+
      ['programada','urgencia','emergencia'].map(c => '<option value="'+c+'"'+
        (filtroFichas.caracter===c?' selected':'')+'>'+c.charAt(0).toUpperCase()+c.slice(1)+'</option>').join('')+
    '</select></div>'+
    '<div class="campo"><label>Institución</label><select id="fInst">'+
      '<option value="">Todas</option>'+
      instituciones().map(i => '<option value="'+esc(i.id)+'"'+(filtroFichas.institucion===i.id?' selected':'')+'>'+
        esc(i.nombre.split('"')[0].trim())+'</option>').join('')+
    '</select></div>'+
    '<div class="campo"><label>Estado</label><select id="fEstado">'+
      '<option value="">Todos</option>'+
      [['borrador','Borrador'],['realizada','Realizada'],['cerrada','Finalizada']].map(e =>
        '<option value="'+e[0]+'"'+(filtroFichas.estado===e[0]?' selected':'')+'>'+e[1]+'</option>').join('')+
    '</select></div>'+
  '</div>'+

  (l.length ? '<div class="lista">'+ l.map(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    return '<div class="item" data-f="'+f.id+'">'+
      '<div class="avatar" style="'+(f.caracter==='programada'
        ? 'background:var(--azul-100);color:var(--azul-700)'
        : 'background:var(--danger-bg);color:var(--danger)')+'">'+
        (f.caracter==='programada'?ico('calendario'):ico('alerta'))+'</div>'+
      '<div class="txt"><b>'+esc(p.apellido||'—')+', '+esc(p.nombre||'')+'</b>'+
        '<span>'+esc(f.cirugia||'Sin cirugía')+' · '+fFecha(f.fecha)+' · '+
        esc(nombreInstitucion(f.institucion).split('"')[0].trim())+
        (esAutorFicha(f) ? '' : ' · '+esc(autorFicha(f)))+'</span></div>'+
      '<div class="der">'+(esAutorFicha(f)?'':'<span class="tag info">de colega</span> ')+etiquetaEstadoFicha(f)+
        (f.hon && f.hon.total ? '<div class="mini mt8">'+fMoneda(f.hon.total)+'</div>' : '')+
      '</div></div>';
  }).join('') +'</div>'
  : '<div class="vacio">'+ico('ficha')+'<b>Sin fichas</b><span>Creá la primera desde «Nueva ficha».</span></div>');

  $('#btnNuevaFicha').onclick = () => abrirFicha(null);
  $('#fBuscar').oninput = debounce(e => { filtroFichas.texto = e.target.value; vistaFichas();
    const i = $('#fBuscar'); if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 260);
  $$('#fAlcance button').forEach(b => b.onclick = () => {
    filtroFichas.alcance = b.dataset.v; vistaFichas(); });
  $('#fCaracter').onchange = e => { filtroFichas.caracter = e.target.value; vistaFichas(); };
  $('#fInst').onchange = e => { filtroFichas.institucion = e.target.value; vistaFichas(); };
  $('#fEstado').onchange = e => { filtroFichas.estado = e.target.value; vistaFichas(); };
  $$('#vFichas .item').forEach(it => it.onclick = () => abrirFicha(it.dataset.f));
}

/* =========================================================================
   APERTURA Y MIGRACION
   ========================================================================= */

/* Las fichas viejas guardaban el acto de otra manera. Se traduce al abrir,
   sin tocar la base: si el anestesiologo guarda, se graba ya migrada. */
function migrarFicha(f){
  const a = f.acto = f.acto || {};
  if(!a.__v2){
    a.__v2 = true;
    a.drogas   = a.drogas   || [];
    a.controles= a.controles|| [];
    a.eventos2 = a.eventos2 || [];
    a.monitor  = a.monitor  || [];
    a.monitorExtra = a.monitorExtra || [];
    a.tecnicas = a.tecnicas || [];
    a.balance  = a.balance || {};
    /* el balance vivia en campos sueltos */
    ['cristaloides','coloides','diuresis'].forEach(k => {
      if(a[k] && a.balance[k] === undefined) a.balance[k] = a[k];
    });
    if(a.sangrado && a.balance.sangrado === undefined) a.balance.sangrado = a.sangrado;
    /* el texto libre de farmacos se conserva como nota, no se inventa una
       lista de drogas que nadie cargo asi */
    if(a.farmacos && !a.drogasNota) a.drogasNota = a.farmacos;
    /* los eventos eran una lista de casillas */
    if((a.eventos || []).length && !a.eventos2.length){
      a.eventos2 = a.eventos.filter(e => e !== 'Sin eventos').map(e => ({
        id: uid('ev'), tipo:e, hora:'', descripcion: a.eventosDetalle || '', conducta:'' }));
      if((a.eventos || []).indexOf('Sin eventos') >= 0) a.sinEventos = true;
    }
    /* tecnica y via aerea */
    if(!a.tecnicas.length && (a.tecnica || []).length){
      const mapa = [['general','general'],['sedaci','sedacion'],['raqu','raquidea'],
                    ['peridural','peridural'],['combinada','combinada'],['bloqueo','bloqueo']];
      a.tecnica.forEach(t => {
        const m = mapa.find(x => norm(t).indexOf(x[0]) >= 0);
        if(m && a.tecnicas.indexOf(m[1]) < 0) a.tecnicas.push(m[1]);
      });
      a.tecnicaDetalle = a.tecnica.join(' · ');
    }
    if(!a.dispositivo && (a.dispositivosVA || []).length){
      const d = a.dispositivosVA.join(' ');
      a.dispositivo = /endotraqueal/i.test(d) ? 'tet' : (/laríngea|laringea/i.test(d) ? 'ml' : 'ninguno');
      a.tamano = a.tubo || '';
    }
    if(!a.monitor.length && (f.plan || {}).monitoreoEstandar){
      const mapa = { 'ECG continuo':'ECG', 'Presión arterial no invasiva (PANI)':'PANI',
        'Oximetría de pulso (SpO₂)':'SpO₂', 'Capnografía (EtCO₂)':'EtCO₂',
        'Temperatura':'Temperatura', 'Monitoreo de bloqueo neuromuscular (TOF)':'TOF' };
      f.plan.monitoreoEstandar.forEach(m => { if(mapa[m]) a.monitor.push(mapa[m]); });
    }
  }
  /* la recuperacion se separo del acto */
  if(!f.recup){
    f.recup = {
      aldrete: a.aldrete || {}, aldreteTotal: a.aldreteTotal || 0,
      eva: '', nauseas: '', destino: a.destinoReal || '',
      observaciones: a.observaciones || '', hora: a.salida || ''
    };
  }
  f.firma = f.firma || {};
  /* Antes del flujo de trabajo, «cerrada» era el equivalente de firmada.
     Se respeta para que las fichas viejas no aparezcan como pendientes. */
  if(f.estado === 'cerrada' && !f.firma.firmado){
    const u = DB.usuarios[actorFicha(f)] || DB.usuarios[f.ownerUid] || {};
    f.firma = {
      firmado:true, uid: u.uid || f.ownerUid,
      nombre: (u.apellido||'')+', '+(u.nombre||''),
      mp: u.matriculaProvincial || '',
      fecha: f.fecha || hoyISO(), hora: (f.acto||{}).salida || '',
      firmaDataUrl: u.firmaDataUrl || '',
      retroactiva: true
    };
  }
  return f;
}

function abrirFicha(id, pacienteId){
  const nueva = !id;
  if(id && !DB.fichas[id]) return toast('No se encontró la ficha.', 'err');
  fichaActual = migrarFicha(id ? JSON.parse(JSON.stringify(DB.fichas[id])) : {
    id: uid('fic'), ownerUid: SESION.uid, pacienteId: pacienteId || '',
    fecha: hoyISO(), hora: ahoraHora(), caracter:'programada',
    institucion:'', obraSocial:'', estado:'borrador',
    v:{}, plan:{}, acto:{}, recup:{}, hon:{}, consent:{}, firma:{},
    creado:new Date().toISOString()
  });
  if(pacienteId) fichaActual.pacienteId = pacienteId;
  cxSeleccionada = fichaActual.cirugia ? {
    n: fichaActual.cirugia, ua: fichaActual.cirugiaUA,
    cod: fichaActual.cirugiaCod || '', comp: fichaActual.cirugiaComp || '',
    grillaB: !!fichaActual.cirugiaGrillaB, nota: fichaActual.cirugiaNota || ''
  } : null;
  /* Si la ficha es de un colega y el acto no es mio, se entra por el paso
     de anestesia: es lo unico que ese colega puede tocar. */
  const g = id ? DB.fichas[id] : null;
  pasoFicha = (g && !puedeEditarFicha(g) && !esActorFicha(g)) ? 'anestesia' : 'paciente';
  irA('ficha');
  pintarFicha();
  if(nueva) toast('Nueva ficha creada. Recordá guardarla.', 'ok');
}

/* Avanza al paso siguiente / anterior guardando lo que haya en pantalla */
function irAPaso(k){
  guardarPasoActual();
  pasoFicha = k;
  pintarFicha();
  const m = $('main'); if(m) m.scrollTop = 0;
  window.scrollTo({ top:0, behavior:'auto' });
}
function pasoVecino(delta){
  const i = PASOS_FICHA.findIndex(p => p.k === pasoFicha);
  const j = i + delta;
  return (j >= 0 && j < PASOS_FICHA.length) ? PASOS_FICHA[j].k : null;
}

/* Cuánto tiene completo cada paso: el punto del stepper se pinta con esto */
function estadoPaso(f, k){
  const v = f.v || {}, a = f.acto || {}, r = f.recup || {};
  if(k === 'paciente')     return f.pacienteId && f.cirugia && f.institucion ? 'ok' : 'pend';
  if(k === 'preanestesia') return (v.scores||{}).asa ? ((v.riesgo||{}).fundamento ? 'ok' : 'medio') : 'pend';
  if(k === 'anestesia')    return (a.tecnicas||[]).length ? (a.finCirugia ? 'ok' : 'medio') : 'pend';
  if(k === 'recuperacion') return r.aldreteTotal ? 'ok' : 'pend';
  if(k === 'firma')        return (f.firma||{}).firmado ? 'ok' : 'pend';
  return 'pend';
}

/* =========================================================================
   PANTALLA
   ========================================================================= */
function pintarFicha(){
  const f = fichaActual;
  const guardada = DB.fichas[f.id];
  const soloActo = !!guardada && !puedeEditarFicha(guardada);
  const p = DB.pacientes[f.pacienteId] || null;
  const cont = $('#vFicha');
  const idx = PASOS_FICHA.findIndex(x => x.k === pasoFicha);
  const firmada = !!(f.firma || {}).firmado;

  cont.innerHTML = ''+
  '<div class="fi-top no-print">'+
    '<button class="btn ghost chico" id="fiVolver">'+ico('atras')+' Fichas</button>'+
    '<div class="fi-top-txt">'+
      '<h1>'+(p ? esc(p.apellido+', '+p.nombre) : 'Ficha sin paciente')+'</h1>'+
      '<p>'+(p && p.dni ? 'DNI/HC '+esc(p.hc || p.dni)+' · ' : '')+
        (p ? (edadDe(p.fechaNac, f.fecha) !== null ? edadDe(p.fechaNac, f.fecha)+' años · ' : '') : '')+
        esc(nombreInstitucion(f.institucion).split('"')[0].trim() || 'sin institución')+'</p>'+
    '</div>'+
    etiquetaEstadoFicha(f)+
  '</div>'+

  /* ------- barra de pasos, igual que el flujo de trabajo del manual ------- */
  '<div class="stepper no-print">'+ PASOS_FICHA.map((s,i) => {
    const est = estadoPaso(f, s.k);
    return '<button type="button" class="step'+(s.k===pasoFicha?' on':'')+' '+est+
      '" data-paso="'+s.k+'">'+
      '<span class="dot">'+(est==='ok' ? ico('check') : ico(s.ico))+'</span>'+
      '<span class="lbl">'+esc(s.t)+'</span>'+
      (i < PASOS_FICHA.length-1 ? '<span class="linea"></span>' : '')+
      '</button>';
  }).join('') +'</div>'+
  '<div class="paso-cabecera no-print">'+
    '<div><b>Paso '+(idx+1)+' de '+PASOS_FICHA.length+'</b> · '+esc(PASOS_FICHA[idx].sub)+'</div>'+
    '<div class="barra"><span style="width:'+Math.round((idx+1)/PASOS_FICHA.length*100)+'%"></span></div>'+
  '</div>'+

  (firmada ? '<div class="aviso ok no-print">'+ico('candado')+'<div><b>Registro finalizado y firmado.</b> '+
    'Queda en sólo lectura. Si hay que corregir algo, reabrilo desde el paso «Firmar».</div></div>' : '')+
  (soloActo ? bannerFichaAjena(f) : bannerFaltantes(f))+

  '<div id="fiCuerpo"></div>'+

  /* ---------------------- navegación entre pasos ---------------------- */
  '<div class="paso-nav no-print">'+
    (pasoVecino(-1) ? '<button class="btn ghost" id="fiAtras">'+ico('atras')+' Anterior</button>' : '<span></span>')+
    '<button class="btn pri grande" id="fiGuardar">'+ico('check')+' Guardar</button>'+
    (pasoVecino(1) ? '<button class="btn pri" id="fiSiguiente">Siguiente '+
      ico('flecha').replace('<svg','<svg style="transform:rotate(-90deg)"')+'</button>' : '<span></span>')+
  '</div>'+

  '<div class="btn-row mt14 no-print fi-extras">'+
    '<button class="btn ghost chico" id="fiHon">'+ico('dinero')+' Honorarios</button>'+
    (soloActo ? '' : '<button class="btn ghost chico" id="fiConsent">'+ico('firma')+' Consentimiento</button>')+
    '<button class="btn ghost chico" id="fiWord">'+ico('word')+' Word</button>'+
    '<button class="btn ghost chico" id="fiPdf">'+ico('imprimir')+' PDF</button>'+
    (soloActo ? '' : '<button class="btn ghost chico" id="fiMail">'+ico('adjunto')+' Enviar al paciente</button>')+
    (DB.fichas[f.id] && !soloActo ? '<button class="btn danger chico" id="fiBorrar">'+ico('borrar')+'</button>' : '')+
  '</div>';

  $('#fiVolver').onclick = () => { guardarPasoActual(); irA('fichas'); vistaFichas(); };
  /* El banner de ficha ajena vive fuera del cuerpo del paso: su botón se
     cablea acá para que funcione en los cinco pasos, no sólo en el primero. */
  if($('#fiTomar')) $('#fiTomar').onclick = () => tomarActo(f);
  $$('#vFicha [data-paso]').forEach(b => b.onclick = () => irAPaso(b.dataset.paso));
  if($('#fiAtras'))     $('#fiAtras').onclick = () => irAPaso(pasoVecino(-1));
  if($('#fiSiguiente')) $('#fiSiguiente').onclick = () => irAPaso(pasoVecino(1));
  $('#fiGuardar').onclick = () => { guardarPasoActual(); guardarFicha(); };
  $('#fiHon').onclick = () => { guardarPasoActual(); abrirHonorarios(fichaActual); };
  $('#fiWord').onclick = () => { guardarPasoActual(); exportarFichaWord(fichaActual); };
  $('#fiPdf').onclick  = () => { guardarPasoActual(); imprimirFicha(fichaActual); };
  if($('#fiConsent')) $('#fiConsent').onclick = () => { guardarPasoActual(); abrirConsentimiento(fichaActual); };
  if($('#fiMail')) $('#fiMail').onclick = () => { guardarPasoActual(); enviarDocumentacionPaciente(fichaActual); };
  if($('#fiBorrar')) $('#fiBorrar').onclick = () => confirmar('Eliminar ficha',
    'Se elimina de forma permanente en todos los dispositivos. Esta acción no se puede deshacer.',
    () => { eliminar('fichas', f.id); auditar('ficha-borrar', f.id);
            toast('Ficha eliminada.', 'ok'); irA('fichas'); vistaFichas(); }, 'Eliminar', true);

  const cuerpo = $('#fiCuerpo');
  if(pasoFicha === 'paciente')          { cuerpo.innerHTML = htmlPasoPaciente(f);     cablearPasoPaciente(f); }
  else if(pasoFicha === 'preanestesia') { cuerpo.innerHTML = htmlValoracion(f);       cablearValoracion(f); }
  else if(pasoFicha === 'anestesia')    { pintarPasoAnestesia(f); }
  else if(pasoFicha === 'recuperacion') { cuerpo.innerHTML = htmlPasoRecuperacion(f); cablearPasoRecuperacion(f); }
  else                                  { cuerpo.innerHTML = htmlPasoFirma(f);        cablearPasoFirma(f); }

  /* Un colega puede tocar el acto y la recuperación; el resto queda en
     lectura. Y una ficha firmada no se toca hasta que se reabra. */
  const editable = (!soloActo || pasoFicha === 'anestesia' || pasoFicha === 'recuperacion')
    && (!firmada || pasoFicha === 'firma');
  if(!editable) bloquearCuerpo();
}

/* Deja el paso en modo lectura: se ve todo, no se cambia nada.
   Lo que sirve para MIRAR sigue vivo: las solapas del acto, el detalle de
   dosis, el gráfico y el vademécum. Bloquear también la navegación dejaría
   una ficha firmada imposible de consultar. */
const SOLO_LECTURA = '.acto-solapas button, [data-lectura], [data-drver]';
function bloquearCuerpo(){
  $$('#fiCuerpo input, #fiCuerpo select, #fiCuerpo textarea').forEach(e => { e.disabled = true; });
  $$('#fiCuerpo button').forEach(e => {
    if(e.closest(SOLO_LECTURA) || e.matches(SOLO_LECTURA)) return;
    e.disabled = true; e.style.opacity = '.5';
  });
  $$('#fiCuerpo .buscador').forEach(e => { e.style.opacity = '.55'; });
  $$('#fiCuerpo .chk, #fiCuerpo .seg, #fiCuerpo .chips').forEach(e => { e.style.pointerEvents = 'none'; });
}

function bannerFichaAjena(f){
  const a = autorFicha(f);
  const mio = esActorFicha(f);
  return '<div class="aviso '+(mio?'ok':'info')+' no-print">'+ico(mio?'jeringa':'candado')+
    '<div><b>Valoración prequirúrgica de '+esc(a)+'.</b><br>'+
    (mio
      ? 'El acto anestésico está a tu nombre: podés completar los pasos <b>Anestesia</b> y '+
        '<b>Recuperación</b> y cargar tus honorarios del acto. '
      : 'Podés leerla completa y registrar el acto anestésico si sos vos quien opera. ')+
    'El paso <b>Paciente</b> y la <b>Preanestesia</b> son de '+esc(a)+' y quedan bloqueados.'+
    (f.actoPorUid && f.actoPorUid !== f.ownerUid
      ? '<br>Acto registrado por <b>'+esc(nombreUsuario(f.actoPorUid))+'</b>.' : '')+
    (mio ? '' : '<br><button class="btn pri chico mt8" id="fiTomar">'+ico('firma')+
      ' Voy a realizar este acto</button>')+
    '</div></div>';
}

/* =========================================================================
   GUARDADO
   ========================================================================= */
function guardarPasoActual(){
  const f = fichaActual;
  const guardada = DB.fichas[f.id];
  if((f.firma || {}).firmado && pasoFicha !== 'firma') return;   /* firmada: no se toca */
  if(guardada && !puedeEditarFicha(guardada)){
    if(pasoFicha === 'anestesia')    f.acto = leerPasoAnestesia();
    if(pasoFicha === 'recuperacion') f.recup = leerPasoRecuperacion();
    return;                                   /* lo demás no se toca */
  }
  if(pasoFicha === 'paciente')          Object.assign(f, leerPasoPaciente());
  else if(pasoFicha === 'preanestesia'){ f.v = leerValoracion(); f.plan = leerPlan(); }
  else if(pasoFicha === 'anestesia')     f.acto = leerPasoAnestesia();
  else if(pasoFicha === 'recuperacion')  f.recup = leerPasoRecuperacion();
}

function guardarFicha(silencioso){
  const f = fichaActual;
  const guardada = DB.fichas[f.id];

  /* Ficha de un colega: se escribe únicamente lo que le corresponde, sobre la
     versión vigente en la base, para no pisar nada de lo que él cargó. */
  if(guardada && !puedeEditarFicha(guardada)){
    const base = migrarFicha(JSON.parse(JSON.stringify(guardada)));
    base.acto = f.acto || {};
    base.recup = f.recup || {};
    if(esActorFicha(guardada) && f.hon) base.hon = f.hon;   /* su propio honorario */
    base.actoPorUid = SESION.uid;
    base.actoPorNombre = USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '';
    base.modificado = new Date().toISOString();
    base.modificadoPor = SESION.uid;
    base.modificadoPorNombre = base.actoPorNombre;
    escribir('fichas', base.id, base);
    auditar('ficha-acto-colega',
      'Acto anestésico registrado en la ficha de ' + autorFicha(guardada));
    fichaActual = base;
    if(!silencioso) toast('Acto anestésico guardado' + (nubeOK ? ' y sincronizado.' : '.'), 'ok');
    pintarFicha();
    return;
  }

  if(!f.pacienteId){ pasoFicha = 'paciente'; pintarFicha();
    return toast('Seleccioná un paciente en el paso 1.', 'err'); }
  f.modificado = new Date().toISOString();
  f.modificadoPor = SESION.uid;
  f.modificadoPorNombre = USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '';
  escribir('fichas', f.id, f);
  auditar('ficha-guardar', (DB.pacientes[f.pacienteId]||{}).apellido + ' — ' + (f.cirugia||''));
  if(!silencioso) toast('Ficha guardada' + (nubeOK ? ' y sincronizada.' : ' en este dispositivo.'), 'ok');
  pintarFicha();
}

/* =========================================================================
   PASO 1 - PACIENTE
   Identificacion del paciente y datos del procedimiento.
   ========================================================================= */
function htmlPasoPaciente(f){
  const pacs = misPacientes().sort((a,b) => (a.apellido||'').localeCompare(b.apellido||'', 'es'));
  const p = DB.pacientes[f.pacienteId];
  const ed = p ? edadDe(p.fechaNac, f.fecha) : null;
  const imc = p ? calcIMC(p.peso, p.talla) : null;

  return ''+
  '<div class="card"><h3>'+ico('paciente')+'Identificación del paciente</h3>'+
    '<div class="campo"><label>Paciente <span class="req">*</span></label>'+
      '<select id="qxPaciente"><option value="">— Seleccionar paciente del padrón —</option>'+
      pacs.map(x => '<option value="'+x.id+'"'+(f.pacienteId===x.id?' selected':'')+'>'+
        esc(x.apellido+', '+x.nombre)+' — DNI '+esc(x.dni||'')+'</option>').join('')+
      '</select></div>'+
    '<div class="btn-row">'+
      '<button class="btn ghost chico" id="qxNuevoPac">'+ico('mas')+' Crear paciente nuevo</button>'+
      (p ? '<button class="btn ghost chico" id="qxEditarPac">'+ico('editar')+' Editar historia</button>' : '')+
    '</div>'+

    (p ? '<div class="ficha-pac mt14">'+
      '<div class="grid c3">'+
        campoTxt('qxPacNombre','Apellido y nombre', p.apellido+', '+p.nombre, true)+
        campoTxt('qxPacDni','DNI / HC', (p.dni||'') + (p.hc ? ' / '+p.hc : ''), true)+
        campoTxt('qxPacEdad','Edad', ed !== null ? ed+' años' : '—', true)+
      '</div>'+
      '<div class="grid c3">'+
        campoTxt('qxPacSexo','Sexo', ({F:'Femenino',M:'Masculino',X:'X / No binario'}[p.sexo]||'—'), true)+
        campoNum('qxPeso','Peso (kg)', p.peso, 'inputmode="decimal"')+
        campoNum('qxTalla','Talla (cm)', p.talla, 'inputmode="decimal"')+
      '</div>'+
      '<div id="qxIMC"></div>'+
      '<div class="ayuda">El peso y la talla se guardan en la historia del paciente. El peso es '+
        'obligatorio para calcular dosis: sin él, el vademécum no propone ninguna.</div>'+
      campoTxt('qxPacOS','Obra social', (p.obraSocial||'Sin cobertura'), true)+
    '</div>' : '<div class="aviso warn mt14">'+ico('alerta')+
      '<div>Elegí un paciente del padrón o creá uno nuevo para poder continuar.</div></div>')+
  '</div>'+

  '<div class="card"><h3>'+ico('calendario')+'Datos de la cirugía</h3>'+
    '<div class="campo"><label>Carácter de la cirugía <span class="req">*</span></label>'+
      '<div class="seg" id="qxCaracter">'+
        [['programada','Programada'],['urgencia','Urgencia'],['emergencia','Emergencia']].map(c =>
          '<button type="button" data-v="'+c[0]+'"'+(f.caracter===c[0]?' class="on"':'')+'>'+c[1]+'</button>').join('')+
      '</div>'+
      '<div class="ayuda">Urgencia: debe resolverse en horas. Emergencia: riesgo vital inmediato, sin demora posible.</div></div>'+
    '<div class="grid c3">'+
      campoFecha('qxFecha','Fecha', f.fecha)+
      '<div class="campo"><label>Hora prevista</label><input type="time" id="qxHora" value="'+esc(f.hora||'')+'"></div>'+
      campoSel('qxTurno','Turno', ['','Mañana','Tarde','Noche','Fin de semana / feriado'], f.turno)+
    '</div>'+
    '<div class="campo"><label>Institución <span class="req">*</span></label>'+
      '<select id="qxInst"><option value="">— Seleccionar —</option>'+
      instituciones().map(i => '<option value="'+esc(i.id)+'"'+(f.institucion===i.id?' selected':'')+'>'+
        esc(i.nombre)+' ('+esc(i.ciudad)+')</option>').join('')+
      '</select></div>'+
    '<button class="btn ghost chico" id="qxNuevaInst">'+ico('mas')+' Agregar otra institución</button>'+
    '<div class="grid c2 mt14">'+
      '<div class="campo"><label>Obra social / financiador</label><select id="qxOS">'+
        '<option value="">— Seleccionar —</option>'+
        obrasSociales().map(o => '<option'+(f.obraSocial===o?' selected':'')+'>'+esc(o)+'</option>').join('')+
      '</select></div>'+
      campoTxt('qxAfiliado','N.º de afiliado / autorización', f.nroAfiliado || (p?p.nroAfiliado:''))+
    '</div>'+
    '<button class="btn ghost chico" id="qxNuevaOS">'+ico('mas')+' Agregar otro financiador</button>'+
  '</div>'+

  '<div class="card"><h3>'+ico('bisturi')+'Procedimiento</h3>'+
    campoSel('qxEsp','Especialidad quirúrgica', [''].concat(ESPECIALIDADES), f.especialidad)+
    '<div class="campo"><label>Diagnóstico <span class="req">*</span></label>'+
      '<input type="text" id="qxDx" value="'+esc(f.diagnostico || (f.dxQuirurgico ? f.dxQuirurgico.d : ''))+'" '+
        'placeholder="Ej.: Colelitiasis" autocomplete="off">'+
      '<div class="ayuda">Diagnóstico quirúrgico en texto claro. La app ya no usa codificación CIE-10.</div></div>'+
    '<div class="campo"><label>Cirugía / procedimiento <span class="req">*</span></label>'+
      '<div class="buscador"><input type="search" id="cxBuscar" placeholder="Buscar en el nomenclador anestésico… ej.: colecistectomía, cesárea, cadera" autocomplete="off">'+
      '<div class="res" id="cxRes"></div></div>'+
      '<div class="ayuda">Nomenclador anestésico AFAAR. Si el procedimiento no está, lo agregás desde el mismo buscador.</div>'+
      '<div id="cxSel" class="mt8"></div></div>'+
    campoSel('qxLateralidad','Lateralidad', ['No aplica','Derecha','Izquierda','Bilateral'], f.lateralidad)+
  '</div>'+

  '<div class="card"><h3>'+ico('pacientes')+'Equipo quirúrgico</h3>'+
    '<div class="grid c2">'+
      campoTxt('qxCirujano','Cirujano/a', f.cirujano)+
      campoTxt('qxAyudante','Ayudante', f.ayudante)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('qxInstrumentador','Instrumentador/a', f.instrumentador)+
      campoTxt('qxAnestesista2','Segundo anestesiólogo / residente', f.anestesista2)+
    '</div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('jeringa')+'Anestesiólogo que realiza el acto</h3>'+
    '<div class="campo"><select id="qxAsignado">'+
      socios().map(u => '<option value="'+esc(u.uid)+'"'+
        (!f.actorExterno && actorFicha(f) === u.uid ? ' selected' : '')+'>'+
        esc(u.apellido+', '+u.nombre)+(u.uid === f.ownerUid ? ' — hizo la valoración' : '')+
        '</option>').join('')+
      '<option value="sinasignar"'+(f.asignadoUid === 'sinasignar' ? ' selected' : '')+'>'+
        '— Todavía no se sabe quién opera —</option>'+
      '<option value="externo"'+(f.actorExterno ? ' selected' : '')+'>'+
        '— Otro anestesiólogo, no registrado en la app —</option>'+
    '</select>'+
    '<div class="ayuda">La valoración prequirúrgica se factura como consulta a nombre de '+
      esc(autorFicha(f))+'. El acto anestésico lo factura quien opera.</div></div>'+

    '<div class="campo'+(f.actorExterno ? '' : ' oculto')+'" id="qxExternoBox">'+
      '<label>Nombre del anestesiólogo externo</label>'+
      '<input type="text" id="qxActorExterno" value="'+esc(f.actorExterno||'')+'" '+
        'placeholder="Apellido, nombre y matrícula">'+
      '<div class="ayuda">Queda registrado en el documento. Como no tiene usuario en la app, '+
        'el honorario del acto no entra en la facturación de nadie.</div></div>'+

    '<div id="qxAsignadoAviso"></div>'+
  '</div>';
}

function cablearPasoPaciente(f){
  $('#qxPaciente').onchange = e => {
    fichaActual.pacienteId = e.target.value;
    const p = DB.pacientes[e.target.value];
    if(p && p.obraSocial && !$('#qxOS').value) $('#qxOS').value = p.obraSocial;
    guardarPasoActual(); pintarFicha();
  };
  $('#qxNuevoPac').onclick = () => editarPaciente(null, nid => {
    fichaActual.pacienteId = nid; pintarFicha();
  });
  if($('#qxEditarPac')) $('#qxEditarPac').onclick = () => editarPaciente(f.pacienteId, () => pintarFicha());

  /* peso y talla se editan acá y viajan a la historia del paciente */
  if($('#qxPeso')){
    const recalcIMC = () => {
      const imc = calcIMC($('#qxPeso').value, $('#qxTalla').value);
      $('#qxIMC').innerHTML = imc
        ? '<div class="imc-box '+claseIMC(imc)+'"><span class="lbl">IMC</span>'+
          '<span class="val">'+fNum(imc,1)+'</span><span class="um">kg/m²</span>'+
          '<span class="tag '+claseIMC(imc)+'">'+esc(clasificaIMC(imc))+'</span></div>'
        : '<div class="aviso warn">'+ico('alerta')+'<div>Sin peso y talla no se calcula el IMC '+
          'ni se pueden proponer dosis.</div></div>';
    };
    $('#qxPeso').oninput = debounce(recalcIMC, 200);
    $('#qxTalla').oninput = debounce(recalcIMC, 200);
    recalcIMC();
  }

  const avisarAsignado = () => {
    const v = $('#qxAsignado').value;
    $('#qxExternoBox').classList.toggle('oculto', v !== 'externo');
    const box = $('#qxAsignadoAviso');
    if(v === 'sinasignar')
      box.innerHTML = '<div class="aviso info">'+ico('info')+'<div>Cualquier socio va a poder '+
        'abrir esta ficha y tomar el acto desde el botón <b>«Voy a realizar este acto»</b>. '+
        'Hasta entonces el recordatorio te llega sólo a vos.</div></div>';
    else if(v === 'externo')
      box.innerHTML = '<div class="aviso warn">'+ico('alerta')+'<div>El acto lo realiza alguien '+
        'sin usuario en la app: queda documentado en la ficha, pero <b>su honorario no se factura '+
        'acá</b>. Vos seguís facturando la consulta prequirúrgica.</div></div>';
    else if(v && v !== SESION.uid)
      box.innerHTML = '<div class="aviso ok">'+ico('check')+'<div><b>'+
        esc(nombreUsuario(v))+'</b> va a recibir el recordatorio de la cirugía y va a poder '+
        'completar el acto y cargar sus honorarios. La consulta prequirúrgica sigue siendo tuya.</div></div>';
    else box.innerHTML = '';
  };
  $('#qxAsignado').onchange = avisarAsignado;
  avisarAsignado();

  $$('#qxCaracter button').forEach(b => b.onclick = () => {
    $$('#qxCaracter button').forEach(x => x.classList.remove('on')); b.classList.add('on');
    fichaActual.caracter = b.dataset.v; });

  $('#qxNuevaInst').onclick = () => {
    abrirModal('Nueva institución',
      campoTxt('niNombre','Nombre de la institución')+
      campoSel('niCiudad','Ciudad', ['Ushuaia','Río Grande','Tolhuin','Otra localidad de TDF','Fuera de la provincia'])+
      campoSel('niTipo','Tipo', ['Público','Privado','Obra social','Fuerzas Armadas','Municipal','Otro']),
      '<button class="btn ghost" data-cerrar>Cancelar</button>'+
      '<button class="btn pri" id="niGuardar">Agregar</button>');
    $('#niGuardar').onclick = () => {
      const n = $('#niNombre').value.trim();
      if(!n) return toast('Ingresá el nombre.', 'err');
      const ya = instituciones().find(o => parecidoPrestador(n, o.nombre) === 'idéntico');
      if(ya){
        cerrarModal(); guardarPasoActual(); fichaActual.institucion = ya.id; pintarFicha();
        return toast('Esa institución ya estaba en la lista.', 'warn');
      }
      const id = uid('ins');
      escribir('instituciones', id, { id, nombre:n, ciudad:$('#niCiudad').value, tipo:$('#niTipo').value });
      cerrarModal(); guardarPasoActual(); fichaActual.institucion = id; pintarFicha();
      toast('Institución agregada al catálogo.', 'ok');
    };
  };
  $('#qxNuevaOS').onclick = () => {
    abrirModal('Nuevo financiador',
      campoTxt('noNombre','Nombre de la obra social, prepaga o ART')+
      '<div id="noAviso"></div>',
      '<button class="btn ghost" data-cerrar>Cancelar</button>'+
      '<button class="btn pri" id="noGuardar">Agregar</button>');
    let sugerido = '';
    const revisar = () => {
      const v = $('#noNombre').value.trim();
      const par = v ? obrasSociales().filter(o => parecidoPrestador(v, o)) : [];
      sugerido = par[0] || '';
      $('#noAviso').innerHTML = par.length
        ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Ya existe algo muy parecido.</b><br>'+
          par.map(esc).join(' · ')+'<br><button class="btn warn chico mt8" id="noUsar">'+
          'Usar «'+esc(par[0])+'»</button></div></div>'
        : '';
      if($('#noUsar')) $('#noUsar').onclick = () => {
        cerrarModal(); guardarPasoActual(); fichaActual.obraSocial = sugerido; pintarFicha();
        toast('Se usó el financiador que ya existía.', 'ok');
      };
    };
    $('#noNombre').oninput = debounce(revisar, 250);
    $('#noGuardar').onclick = () => {
      const n = $('#noNombre').value.trim();
      if(!n) return toast('Ingresá el nombre.', 'err');
      const ya = obrasSociales().find(o => clavePrestador(o) === clavePrestador(n));
      if(ya){
        cerrarModal(); guardarPasoActual(); fichaActual.obraSocial = ya; pintarFicha();
        return toast('Ese financiador ya estaba en la lista.', 'warn');
      }
      const id = uid('os');
      escribir('obrasSociales', id, { id, nombre:n });
      auditar('prestador-alta', 'Financiador «'+n+'» desde una ficha');
      cerrarModal(); guardarPasoActual(); fichaActual.obraSocial = n; pintarFicha();
      toast('Financiador agregado.', 'ok');
    };
  };

  /* buscador de cirugías — nomenclador anestésico AFAAR + catálogo propio */
  const pintarCx = () => {
    $('#cxSel').innerHTML = cxSeleccionada
      ? '<span class="pill">'+
          (cxSeleccionada.cod ? '<b>'+esc(cxSeleccionada.cod)+'</b>' : '')+
          '<span>'+esc(cxSeleccionada.n)+'</span>'+
          (cxSeleccionada.comp ? '<b class="comp">Complejidad '+esc(cxSeleccionada.comp)+'</b>' : '')+
          (cxSeleccionada.ua ? '<b>'+cxSeleccionada.ua+' UA</b>' : '')+
          '<button id="cxQuitar">&times;</button></span>'+
        (cxSeleccionada.grillaB
          ? '<div class="ayuda">Práctica de <b>Grilla B</b>: se factura con la grilla de '+
            'Cardiovascular, Tórax, Neurocirugía, Hemodinamia, Maxilofacial o cirujano itinerante.</div>' : '')+
        (cxSeleccionada.nota
          ? '<div class="ayuda">'+esc(cxSeleccionada.nota.replace(/;/g,' · ')
              .replace('RX:','Requiere radioscopia: ').replace('RF:','Radiofrecuencia: ')
              .replace('INT:','Internación: '))+'</div>' : '')+
        (cxSeleccionada.cod && !cxSeleccionada.ua
          ? '<div class="ayuda">El nomenclador tabula por complejidad. Si tu convenio se liquida '+
            'por unidades anestésicas, cargá las UA en Honorarios.</div>' : '')
      : '<span class="mini">Sin cirugía seleccionada.</span>';
    if($('#cxQuitar')) $('#cxQuitar').onclick = () => { cxSeleccionada = null; pintarCx(); };
  };
  montarBuscador({
    input:$('#cxBuscar'), caja:$('#cxRes'), manual:true,
    fuente: () => NOMENCLADOR.map(x => ({
        cod: x.cod,
        etiqueta: x.n,
        sub: 'Complejidad '+x.comp+' · '+x.grupo+(x.sub ? ' · '+x.sub : '')+(x.grillaB ? ' · Grilla B' : ''),
        /* el nombre va primero para que el ranking por prefijo funcione;
           el codigo sigue siendo buscable */
        busca: norm(x.n+' '+x.cod+' '+x.grupo+' '+x.sub), peso:0, dato:x
      })).concat(todasCirugias().map(x => ({
        etiqueta: x.n, sub: 'Catálogo propio · '+x.esp+' · '+x.ua+' unidades anestésicas',
        busca: norm(x.n+' '+x.esp), peso:1, dato:x }))),
    onElegir: x => {
      const d = x.dato;
      cxSeleccionada = d.cod
        ? { n:d.n, cod:d.cod, comp:d.comp, grillaB:d.grillaB, nota:d.nota, ua:0 }
        : { n:d.n, ua:d.ua, cod:'', comp:'', grillaB:false, nota:'' };
      if(!$('#qxEsp').value && d.esp) $('#qxEsp').value = d.esp;
      pintarCx();
    },
    onManual: txt => { if(!txt) return;
      abrirModal('Agregar procedimiento al catálogo',
        campoTxt('ncNombre','Nombre del procedimiento', txt)+
        campoSel('ncEsp','Especialidad', ESPECIALIDADES)+
        campoNum('ncUA','Unidades anestésicas', 10)+
        '<div class="ayuda">Sólo para prácticas que no figuran en el nomenclador anestésico AFAAR. '+
        'El nomenclador indica facturar por similitud antes que crear una práctica nueva.</div>',
        '<button class="btn ghost" data-cerrar>Cancelar</button>'+
        '<button class="btn pri" id="ncGuardar">Agregar</button>');
      $('#ncGuardar').onclick = () => {
        const n = $('#ncNombre').value.trim(); if(!n) return;
        agregarExtra('cx', { n, esp:$('#ncEsp').value, ua:Number($('#ncUA').value)||10 });
        cxSeleccionada = { n, ua:Number($('#ncUA').value)||10, cod:'', comp:'', grillaB:false, nota:'' };
        cerrarModal(); pintarCx(); toast('Procedimiento agregado al catálogo.', 'ok');
      };
    }
  });
  pintarCx();
}

function leerPasoPaciente(){
  const b = $('#qxCaracter button.on');
  /* el peso y la talla se guardan en la historia del paciente, que es donde
     viven: la ficha no lleva su propia copia que después queda vieja */
  const pid = val('qxPaciente');
  if(pid && DB.pacientes[pid] && $('#qxPeso')){
    const p = JSON.parse(JSON.stringify(DB.pacientes[pid]));
    const peso = val('qxPeso'), talla = val('qxTalla');
    if(String(p.peso||'') !== String(peso) || String(p.talla||'') !== String(talla)){
      p.peso = peso; p.talla = talla;
      p.modificado = new Date().toISOString(); p.modificadoPor = SESION.uid;
      escribir('pacientes', pid, p);
    }
  }
  return {
    pacienteId: pid, caracter: b ? b.dataset.v : 'programada',
    fecha: val('qxFecha'), hora: val('qxHora'), turno: val('qxTurno'),
    institucion: val('qxInst'), obraSocial: val('qxOS'), nroAfiliado: val('qxAfiliado'),
    especialidad: val('qxEsp'),
    diagnostico: val('qxDx'),
    cirugia: cxSeleccionada ? cxSeleccionada.n : '',
    cirugiaUA: cxSeleccionada ? cxSeleccionada.ua : 0,
    cirugiaCod: cxSeleccionada ? (cxSeleccionada.cod || '') : '',
    cirugiaComp: cxSeleccionada ? (cxSeleccionada.comp || '') : '',
    cirugiaGrillaB: cxSeleccionada ? !!cxSeleccionada.grillaB : false,
    cirugiaNota: cxSeleccionada ? (cxSeleccionada.nota || '') : '',
    lateralidad: val('qxLateralidad'),
    cirujano: val('qxCirujano'), ayudante: val('qxAyudante'),
    instrumentador: val('qxInstrumentador'), anestesista2: val('qxAnestesista2'),
    asignadoUid: val('qxAsignado') || undefined,
    actorExterno: val('qxAsignado') === 'externo' ? val('qxActorExterno') : ''
  };
}

/* Un colega toma el acto operatorio a su nombre */
function tomarActo(f){
  confirmar('Voy a realizar este acto',
    'Vas a quedar registrado como el anestesiólogo que realiza este acto. '+
    'El honorario del acto pasa a tu nombre; la consulta prequirúrgica sigue siendo de '+
    esc(autorFicha(f))+'.',
    () => {
      const base = migrarFicha(JSON.parse(JSON.stringify(DB.fichas[f.id])));
      base.asignadoUid = SESION.uid;
      base.actorExterno = '';
      base.modificado = new Date().toISOString();
      escribir('fichas', base.id, base);
      auditar('ficha-tomar-acto', 'Acto de la ficha de ' + autorFicha(base));
      fichaActual = base;
      pasoFicha = 'anestesia';
      pintarFicha();
      toast('El acto quedó a tu nombre.', 'ok');
    }, 'Tomar el acto');
}

/* =========================================================================
   PASO 4 - RECUPERACION
   Aldrete modificado, dolor EVA, nauseas y destino.
   ========================================================================= */
function htmlPasoRecuperacion(f){
  const r = f.recup || {};
  const a = f.acto || {};
  return ''+
  '<div class="card"><h3>'+ico('reloj')+'Ingreso a recuperación</h3>'+
    '<div class="grid c2">'+
      '<div class="campo"><label>Hora de ingreso a la URPA</label>'+
        '<input type="time" id="reHora" value="'+esc(r.hora || a.salida || '')+'"></div>'+
      campoSel('reOxigeno','Oxigenoterapia al ingreso',
        ['','Aire ambiente','Cánula nasal','Máscara con reservorio','Ventilación mecánica',
         'VNI / CPAP'], r.oxigeno)+
    '</div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('monitor')+'Aldrete modificado</h3>'+
    '<div class="aldrete">'+ ALDRETE.map(item =>
      '<div class="ald-fila"><label>'+esc(item.t)+'</label>'+
        '<div class="ald-ops" data-ald="'+item.k+'">'+ item.o.map(o =>
          '<button type="button" data-v="'+o[0]+'"'+
          (String((r.aldrete||{})[item.k]) === String(o[0]) ? ' class="on"' : '')+
          ' title="'+esc(o[1])+'">'+o[0]+'</button>').join('') +'</div>'+
        '<div class="ald-txt" id="aldTxt_'+item.k+'"></div>'+
      '</div>').join('') +'</div>'+
    '<div class="ald-total" id="aldTotal"></div>'+
    '<div id="aldOut"></div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('gota')+'Dolor y náuseas</h3>'+
    '<div class="campo"><label>Dolor — escala visual analógica (0 a 10)</label>'+
      '<div class="eva">'+
        '<input type="range" id="reEva" min="0" max="10" step="1" value="'+esc(r.eva || 0)+'">'+
        '<output id="reEvaOut">'+esc(r.eva || 0)+'</output>'+
      '</div>'+
      '<div id="reEvaTxt"></div></div>'+
    '<div class="grid c2">'+
      '<div class="campo"><label>Náuseas / vómitos</label>'+
        '<div class="seg" id="reNauseas">'+
          [['no','No'],['si','Sí']].map(o => '<button type="button" data-v="'+o[0]+'"'+
            ((r.nauseas||'no')===o[0]?' class="on"':'')+'>'+o[1]+'</button>').join('')+
        '</div></div>'+
      campoTxt('reRescate','Analgesia / antiemético de rescate', r.rescate)+
    '</div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('hospital')+'Destino</h3>'+
    '<div class="campo"><label>Destino del paciente</label>'+
      '<div class="seg wrap" id="reDestino">'+ DESTINOS_RECUPERACION.map(d =>
        '<button type="button" data-v="'+esc(d)+'"'+
        ((r.destino||'Sala de recuperación')===d?' class="on"':'')+'>'+esc(d)+'</button>').join('')+
      '</div></div>'+
    campoSel('reEstado','Estado al egreso',
      ['','Estable, sin complicaciones','Estable con analgesia en curso','Requiere vigilancia estrecha',
       'Complicación resuelta','Traslado a UTI','Óbito intraoperatorio'], r.estado)+
    campoArea('reObs','Observaciones', r.observaciones,
      'Indicaciones al alta, controles pendientes, avisos al equipo tratante')+
  '</div>';
}

function cablearPasoRecuperacion(f){
  const segs = id => $$('#'+id+' button').forEach(b => b.onclick = () => {
    $$('#'+id+' button').forEach(x => x.classList.remove('on')); b.classList.add('on'); });
  segs('reNauseas'); segs('reDestino');

  const recalc = () => {
    let total = 0;
    ALDRETE.forEach(item => {
      const on = $('#fiCuerpo [data-ald="'+item.k+'"] button.on');
      const v = on ? Number(on.dataset.v) : null;
      if(v !== null) total += v;
      const t = $('#aldTxt_'+item.k);
      const op = v !== null ? item.o.find(o => String(o[0]) === String(v)) : null;
      if(t) t.textContent = op ? op[1] : 'Sin evaluar';
    });
    const completo = ALDRETE.every(item => $('#fiCuerpo [data-ald="'+item.k+'"] button.on'));
    const ok = total >= 9;
    $('#aldTotal').innerHTML = '<span class="lbl">Puntaje total</span>'+
      '<span class="val '+(completo ? (ok?'ok':'warn') : '')+'">'+(completo ? total : '—')+' / 10</span>';
    $('#aldOut').innerHTML = !completo
      ? '<div class="aviso info">'+ico('info')+'<div>Completá los cinco parámetros para obtener el puntaje.</div></div>'
      : '<div class="aviso '+(ok?'ok':'warn')+'">'+ico(ok?'check':'alerta')+
        '<div><b>Aldrete '+total+'/10</b> — '+(ok
          ? 'Cumple criterios de alta de la recuperación postanestésica.'
          : 'No alcanza el puntaje de alta (≥ 9). Continuar la vigilancia en la URPA.')+'</div></div>';
  };
  ALDRETE.forEach(item => {
    $$('#fiCuerpo [data-ald="'+item.k+'"] button').forEach(b => b.onclick = () => {
      $$('#fiCuerpo [data-ald="'+item.k+'"] button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); recalc();
    });
  });
  recalc();

  const eva = $('#reEva');
  const pintarEva = () => {
    const v = Number(eva.value);
    $('#reEvaOut').textContent = v;
    eva.className = v <= 3 ? 'ok' : (v <= 6 ? 'warn' : 'danger');
    $('#reEvaTxt').innerHTML = '<div class="aviso '+(v<=3?'ok':(v<=6?'warn':'danger'))+'">'+
      ico(v<=3?'check':'alerta')+'<div>'+(v===0 ? 'Sin dolor.'
        : v<=3 ? 'Dolor leve. Analgesia habitual.'
        : v<=6 ? 'Dolor moderado. Revisar el esquema analgésico antes del alta de la URPA.'
        : 'Dolor severo. Rescate analgésico y reevaluación antes del alta.')+'</div></div>';
  };
  eva.oninput = pintarEva;
  pintarEva();
}

function leerPasoRecuperacion(){
  const aldrete = {};
  ALDRETE.forEach(i => {
    const on = $('#fiCuerpo [data-ald="'+i.k+'"] button.on');
    aldrete[i.k] = on ? Number(on.dataset.v) : null;
  });
  const completo = ALDRETE.every(i => aldrete[i.k] !== null);
  const seg = id => { const b = $('#'+id+' button.on'); return b ? b.dataset.v : ''; };
  return {
    hora: val('reHora'), oxigeno: val('reOxigeno'),
    aldrete, aldreteTotal: completo ? Object.values(aldrete).reduce((a,b)=>a+b,0) : 0,
    aldreteCompleto: completo,
    eva: val('reEva'), nauseas: seg('reNauseas'), rescate: val('reRescate'),
    destino: seg('reDestino'), estado: val('reEstado'), observaciones: val('reObs')
  };
}

/* =========================================================================
   PASO 5 - FIRMAR
   Resumen de la anestesia y cierre del registro.
   ========================================================================= */
function htmlPasoFirma(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const a = f.acto || {}, r = f.recup || {}, v = f.v || {}, pl = f.plan || {};
  const fi = f.firma || {};
  const bal = calcularBalance(a.balance);
  const durCx = minutosEntre(a.inicioCirugia, a.finCirugia);
  const durAn = minutosEntre(a.inicioAnestesia, a.finAnestesia);
  const eventos = (a.eventos2 || []);
  const faltan = faltantesFicha(f).filter(x => x.critico);
  const disp = DISPOSITIVOS_FLUJO.find(d => d.k === a.dispositivo);
  const alertas = alertasVitales(a.controles || []);
  const analgesia = (pl.analgesia || []).length || pl.analgesiaDetalle ? 'Planificada' : 'Sin planificar';

  const linea = (l, valor, cls) =>
    '<div class="res-fila"><span>'+esc(l)+'</span><b'+(cls?' class="'+cls+'"':'')+'>'+valor+'</b></div>';

  /* ---------------- VENTANA 10: ficha completa ---------------- */
  if(fi.firmado) return ''+
    '<div class="final">'+
      '<div class="final-check">'+ico('check')+'</div>'+
      '<h2>Ficha anestésica<br>completa</h2>'+
      '<p class="mini">Registro finalizado correctamente.</p>'+
      '<div class="final-firma">'+
        '<b>'+esc(fi.nombre || nombreUsuario(fi.uid))+'</b>'+
        (fi.mp ? '<span>M.P. '+esc(matriculaTxt(fi.mp,'M.P.'))+'</span>' : '')+
        '<span>'+fFechaLarga(fi.fecha)+' · '+esc(fi.hora||'')+'</span>'+
      '</div>'+
      (fi.firmaDataUrl ? '<img class="firma-img" src="'+esc(fi.firmaDataUrl)+'" alt="Firma del anestesiólogo">' : '')+
      '<div class="final-acciones">'+
        '<button class="btn pri grande" id="fiDocPdf">'+ico('imprimir')+' Generar PDF</button>'+
        '<button class="btn ghost grande" id="fiDocWord">'+ico('word')+' Compartir / descargar</button>'+
        '<button class="btn ghost grande" id="fiDocMail">'+ico('adjunto')+' Enviar al paciente</button>'+
        '<button class="btn ghost" id="fiInicio">'+ico('panel')+' Volver al inicio</button>'+
        '<button class="btn ghost chico" id="fiReabrir">'+ico('editar')+' Reabrir para corregir</button>'+
      '</div>'+
    '</div>'+
    tarjetaResumenAnestesia(f);

  /* ---------------- VENTANA 9: resumen de anestesia ---------------- */
  return ''+
  '<div class="card"><h3>'+ico('lista')+'Resumen de anestesia</h3>'+
    '<div class="resumen">'+
      linea('Paciente', esc((p.apellido||'—')+', '+(p.nombre||'')))+
      linea('Procedimiento', esc(f.cirugia || '—'))+
      linea('Diagnóstico', esc(f.diagnostico || '—'))+
      linea('Técnica anestésica', esc((a.tecnicas||[]).map(k =>
        (TECNICAS_FLUJO.find(t => t.k === k)||{}).t).filter(Boolean).join(' + ') || '—'))+
      linea('Vía aérea', esc((disp ? disp.t : '—') + (a.tamano ? ' '+a.tamano : '') +
        (a.vaDificil === 'si' ? ' · difícil' : ' · no difícil')),
        a.vaDificil === 'si' ? 'danger' : '')+
      linea('ASA', esc('ASA ' + ((v.scores||{}).asa || '—') + ((v.scores||{}).asaE ? ' E' : '')))+
      linea('Duración de cirugía', durCx !== null ? esc(duracionTexto(durCx)) : '—')+
      linea('Duración de anestesia', durAn !== null ? esc(duracionTexto(durAn)) : '—')+
      linea('Hemodinamia', (a.controles||[]).length
        ? (alertas.length ? '<span class="warn">'+esc(alertas.join(' · '))+'</span>'
                          : '<span class="ok">Estable</span>')
        : '—', '')+
      linea('Drogas administradas', (a.drogas||[]).length + ' registro'+((a.drogas||[]).length===1?'':'s'))+
      linea('Controles de signos vitales', (a.controles||[]).length)+
      linea('Pérdida sanguínea', ((a.balance||{}).sangrado || 0) + ' mL')+
      linea('Balance hídrico', '<span class="'+(bal.balance >= 0 ? 'ok' : 'warn')+'">'+
        (bal.balance >= 0 ? '+' : '') + bal.balance + ' mL</span>')+
      linea('Eventos adversos', eventos.length
        ? '<span class="danger">'+eventos.length+' evento'+(eventos.length===1?'':'s')+'</span>'
        : '<span class="ok">Sin eventos</span>')+
      linea('Analgesia postoperatoria', '<span class="'+(analgesia==='Planificada'?'ok':'warn')+'">'+
        analgesia+'</span>')+
      linea('Aldrete al egreso', r.aldreteCompleto ? r.aldreteTotal+' / 10' : '—',
        r.aldreteCompleto && r.aldreteTotal >= 9 ? 'ok' : 'warn')+
      linea('Dolor EVA', r.eva !== undefined && r.eva !== '' ? r.eva + ' / 10' : '—')+
    '</div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('hospital')+'Destino</h3>'+
    '<div class="seg wrap" id="fiDestino">'+ DESTINOS_RECUPERACION.map(d =>
      '<button type="button" data-v="'+esc(d)+'"'+
      ((r.destino||'Sala de recuperación')===d?' class="on"':'')+'>'+esc(d)+'</button>').join('')+
    '</div>'+
    campoArea('fiObsFinal','Observaciones', r.observaciones,
      'Paciente estable. Sin complicaciones.')+
  '</div>'+

  (faltan.length
    ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Faltan datos importantes:</b> '+
      esc(faltan.map(x => x.t).join(', '))+'.<br>Podés firmar igual, pero el documento sale incompleto.</div></div>'
    : '<div class="aviso ok">'+ico('check')+'<div>El registro está completo.</div></div>')+

  '<div class="card"><h3>'+ico('firma')+'Firma del anestesiólogo</h3>'+
    '<p class="mini">Al firmar, la ficha queda cerrada y en sólo lectura. Después se puede '+
      'reabrir dejando constancia en la auditoría.</p>'+
    '<div class="firma-box"><canvas id="fiFirmaCanvas"></canvas><div class="hint">Firmar aquí</div></div>'+
    '<div class="btn-row mt8">'+
      '<button class="btn ghost chico" id="fiFirmaLimpiar">Borrar</button>'+
      '<button class="btn ghost chico" id="fiFirmaPerfil">Usar mi firma guardada</button>'+
    '</div>'+
    '<button class="btn pri grande mt14" id="fiFirmar">'+ico('check')+' Finalizar y firmar</button>'+
  '</div>'+

  leyendaEstados();
}

/* Resumen compacto que acompana a la pantalla de ficha completa */
function tarjetaResumenAnestesia(f){
  const a = f.acto || {}, r = f.recup || {};
  const durAn = minutosEntre(a.inicioAnestesia, a.finAnestesia);
  const bal = calcularBalance(a.balance);
  return '<div class="card"><h3>'+ico('lista')+'Lo que quedó registrado</h3>'+
    '<div class="grid c3">'+
      kpi('Drogas', (a.drogas||[]).length, 'azul', ico('jeringa'), 'administradas')+
      kpi('Controles', (a.controles||[]).length, 'aqua', ico('monitor'), 'de signos vitales')+
      kpi('Eventos', (a.eventos2||[]).length, (a.eventos2||[]).length?'danger':'ok', ico('alerta'), '')+
    '</div>'+
    '<div class="resumen mt14">'+
      '<div class="res-fila"><span>Duración de anestesia</span><b>'+
        (durAn !== null ? esc(duracionTexto(durAn)) : '—')+'</b></div>'+
      '<div class="res-fila"><span>Balance hídrico</span><b>'+
        (bal.balance >= 0 ? '+' : '')+bal.balance+' mL</b></div>'+
      '<div class="res-fila"><span>Aldrete al egreso</span><b>'+
        (r.aldreteCompleto ? r.aldreteTotal+' / 10' : '—')+'</b></div>'+
      '<div class="res-fila"><span>Destino</span><b>'+esc(r.destino || '—')+'</b></div>'+
    '</div></div>';
}

/* Los cuatro estados de color del manual, para que se lean igual en toda
   la app: completo, atencion, alerta y pendiente. */
function leyendaEstados(){
  return '<div class="leyenda-estados">'+
    '<b>Estados</b>'+
    '<span><i class="ok"></i>Completo / Apto / Estable</span>'+
    '<span><i class="warn"></i>Atención / Consideraciones</span>'+
    '<span><i class="danger"></i>Alerta / Evento / Crítico</span>'+
    '<span><i class="pend"></i>Pendiente</span>'+
  '</div>';
}

function cablearPasoFirma(f){
  if($('#fiReabrir')) $('#fiReabrir').onclick = () => confirmar('Reabrir la ficha',
    'La ficha vuelve a quedar editable. Queda registrado en la auditoría quién la reabrió y cuándo.',
    () => {
      fichaActual.firma = Object.assign({}, fichaActual.firma, { firmado:false,
        reabiertaPor: SESION.uid, reabierta: new Date().toISOString() });
      fichaActual.estado = 'realizada';
      auditar('ficha-reabrir', fichaActual.id);
      guardarFicha();
    }, 'Reabrir');

  if($('#fiDocPdf'))  $('#fiDocPdf').onclick  = () => imprimirFicha(fichaActual);
  if($('#fiDocWord')) $('#fiDocWord').onclick = () => exportarFichaWord(fichaActual);
  if($('#fiDocMail')) $('#fiDocMail').onclick = () => enviarDocumentacionPaciente(fichaActual);
  if($('#fiInicio'))  $('#fiInicio').onclick  = () => irA('panel');

  $$('#fiDestino button').forEach(b => b.onclick = () => {
    $$('#fiDestino button').forEach(x => x.classList.remove('on')); b.classList.add('on'); });

  if(!$('#fiFirmaCanvas')) return;
  let firma = (USUARIO && USUARIO.firmaDataUrl) || '';
  const c = montarFirma($('#fiFirmaCanvas'), d => firma = d);
  setTimeout(() => { if(firma) c.cargar(firma); }, 150);
  $('#fiFirmaLimpiar').onclick = () => { c.limpiar(); firma = ''; };
  $('#fiFirmaPerfil').onclick = () => {
    if(!USUARIO || !USUARIO.firmaDataUrl) return toast('No tenés firma guardada en Mi perfil.', 'err');
    c.limpiar(); c.cargar(USUARIO.firmaDataUrl); firma = USUARIO.firmaDataUrl;
  };
  $('#fiFirmar').onclick = () => {
    if(!firma) return toast('Firmá antes de finalizar el registro.', 'err');
    confirmar('Finalizar y firmar',
      'La ficha queda cerrada y en sólo lectura. Se puede reabrir después, dejando constancia.',
      () => {
        const u = USUARIO || {};
        /* el destino y las observaciones que se ajustaron acá van a la recuperación */
        const d = $('#fiDestino button.on');
        fichaActual.recup = Object.assign({}, fichaActual.recup, {
          destino: d ? d.dataset.v : (fichaActual.recup||{}).destino,
          observaciones: val('fiObsFinal')
        });
        fichaActual.firma = {
          firmado:true, uid:SESION.uid,
          nombre:(u.apellido||'')+', '+(u.nombre||''),
          mp: u.matriculaProvincial || '',
          fecha: hoyISO(), hora: ahoraHora(), firmaDataUrl: firma
        };
        fichaActual.estado = 'cerrada';
        auditar('ficha-firmar', fichaActual.id);
        guardarFicha();
        toast('Ficha anestésica completa.', 'ok');
      }, 'Finalizar y firmar');
  };
}

/* =========================================================================
   HONORARIOS - fuera del flujo clinico, en su propia ventana
   ========================================================================= */
function abrirHonorarios(f){
  abrirModal('Honorarios', '<div id="honCuerpo">'+htmlHonorarios(f)+'</div>',
    '<button class="btn ghost" data-cerrar>Cerrar</button>'+
    '<button class="btn pri" id="honGuardar">'+ico('check')+' Guardar honorarios</button>', '860px');
  cablearHonorariosModal(f);
  $('#honGuardar').onclick = () => {
    fichaActual.hon = leerHonorarios();
    fichaActual.honConsulta = leerHonorariosConsulta();
    cerrarModal();
    guardarFicha();
  };
}


/* Casillas con estilo: la clase .sel es lo que pinta el recuadro */
function cablearGenerico(){
  $$('#modal .chk, #vFicha .chk').forEach(l => {
    l.onclick = () => setTimeout(() => l.classList.toggle('sel', l.querySelector('input').checked), 0);
  });
}

function valorUnidadDe(obraSocial){
  const c = DB.config.valoresUnidad || {};
  return Number(c[obraSocial] || c._default || 0);
}
function htmlHonorarios(f){
  const h = f.hon || {}, hc = f.honConsulta || {};
  const ua = h.ua !== undefined && h.ua !== '' ? h.ua : (f.cirugiaUA || 0);
  const vu = h.valorUnidad || valorUnidadDe(f.obraSocial);
  const vc = hc.total || (datosFinanciador(f.obraSocial) || {}).valorConsulta || 0;
  const soyAutor = esAutorFicha(f) || esCoordinador();
  const soyActor = esActorFicha(f) || esCoordinador();
  return ''+
  '<div class="aviso info">'+ico('dinero')+'<div><b>Son dos actos médicos distintos.</b><br>'+
    'La <b>consulta prequirúrgica</b> la factura quien hizo la valoración ('+esc(autorFicha(f))+'). '+
    'El <b>acto anestésico</b> lo factura quien opera ('+esc(nombreActor(f))+').</div></div>'+

  '<div class="card"'+(soyAutor?'':' style="opacity:.72"')+'><h3>'+ico('valoracion')+
    'Consulta prequirúrgica — '+esc(autorFicha(f))+
    (soyAutor?'':' <span class="tag" style="margin-left:auto">no es tuya</span>')+'</h3>'+
    '<div class="campo"><label>Modalidad</label><select id="hcModalidad"'+(soyAutor?'':' disabled')+'>'+
      MODALIDADES_CONSULTA.map(m => '<option value="'+m.id+'"'+
        (hc.modalidad===m.id?' selected':'')+'>'+esc(m.n)+'</option>').join('')+
    '</select><div class="ayuda" id="hcDesc"></div></div>'+
    '<div class="grid c2" id="hcMontoBox">'+
      campoNum('hcMonto','Honorario de la consulta', vc, 'step="0.01"'+(soyAutor?'':' disabled'))+
      campoSel('hcEstado','Estado', ESTADOS_FACT, hc.estado)+
    '</div>'+
    '<div class="grid c2">'+
      campoFecha('hcFecha','Fecha de presentación', hc.fechaPresentacion)+
      campoTxt('hcComprobante','N.º de comprobante', hc.comprobante)+
    '</div>'+
    campoNum('hcCobrado','Monto cobrado', hc.cobrado, 'step="0.01"')+
  '</div>'+

  '<div class="card"'+(soyActor?'':' style="opacity:.72"')+'><h3>'+ico('jeringa')+
    'Acto anestésico — '+esc(nombreActor(f))+
    (soyActor?'':' <span class="tag" style="margin-left:auto">no es tuyo</span>')+'</h3></div>'+

  '<div class="card"><h3>'+ico('dinero')+'Modalidad de convenio del acto</h3>'+
    '<div class="campo"><select id="hoModalidad">'+
      MODALIDADES_HONORARIOS.map(m => '<option value="'+m.id+'"'+(h.modalidad===m.id?' selected':'')+'>'+
        esc(m.n)+'</option>').join('')+
    '</select><div class="ayuda" id="hoModDesc"></div></div>'+
  '</div>'+

  '<div class="card" id="hoAbierto"><h3>'+ico('calculadora')+'Cálculo por unidades anestésicas</h3>'+
    '<div class="grid c2">'+
      campoNum('hoUA','Unidades anestésicas (UA)', ua)+
      campoNum('hoVU','Valor de la unidad', vu, 'step="0.01"')+
    '</div>'+
    '<label class="mini strong" style="display:block;margin-bottom:6px">Adicionales del nomenclador</label>'+
    '<div class="chks" id="hoAdic">'+ ADICIONALES_HONORARIOS.map(a =>
      '<label class="chk'+((h.adicionales||[]).indexOf(a.id)>=0?' sel':'')+'">'+
      '<input type="checkbox" value="'+a.id+'"'+((h.adicionales||[]).indexOf(a.id)>=0?' checked':'')+'>'+
      esc(a.n)+' <b style="opacity:.6">+'+a.pct+'%</b></label>').join('') +'</div>'+
    '<div id="hoCalculo" class="mt14"></div>'+
  '</div>'+

  '<div class="card" id="hoFijo"><h3>'+ico('dinero')+'Monto pactado</h3>'+
    campoNum('hoMontoFijo','Monto del módulo o convenio cerrado', h.montoFijo, 'step="0.01"')+
    '<div class="ayuda">Se usa en convenios cerrados, particulares y módulos pactados.</div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('archivo')+'Estado administrativo</h3>'+
    '<div class="grid c2">'+
      campoSel('hoEstado','Estado de la facturación', ESTADOS_FACT, h.estado)+
      campoFecha('hoFecha','Fecha de presentación', h.fechaPresentacion)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('hoComprobante','N.º de comprobante / factura', h.comprobante)+
      campoNum('hoCobrado','Monto efectivamente cobrado', h.cobrado, 'step="0.01"')+
    '</div>'+
    campoArea('hoObs','Observaciones administrativas', h.observaciones,
      'Débitos, reclamos, auditoría del financiador, número de expediente')+
  '</div>'+

  '<div id="hoResumen"></div>';
}
function cablearHonorariosModal(f){
  cablearGenerico();
  /* La consulta la edita quien hizo la valoración; el acto, quien opera. */
  const puedeConsulta = esAutorFicha(f) || esCoordinador();
  const puedeActoHon  = esActorFicha(f) || esCoordinador();
  if(!puedeConsulta) ['hcModalidad','hcMonto','hcEstado','hcFecha','hcComprobante','hcCobrado']
    .forEach(i => { const e = $('#'+i); if(e) e.disabled = true; });
  if(!puedeActoHon){
    ['hoModalidad','hoUA','hoVU','hoMontoFijo','hoEstado','hoFecha','hoComprobante',
     'hoCobrado','hoObs'].forEach(i => { const e = $('#'+i); if(e) e.disabled = true; });
    $$('#hoAdic input').forEach(e => { e.disabled = true; });
    const a = $('#hoAdic'); if(a) a.style.pointerEvents = 'none';
  }
  const recalc = () => {
    const mod = val('hoModalidad');
    const m = MODALIDADES_HONORARIOS.find(x => x.id === mod);
    $('#hoModDesc').textContent = m ? m.d : '';
    const porUnidades = mod === 'abierto';
    const fijo = (mod === 'cerrado' || mod === 'particular');
    $('#hoAbierto').style.display = porUnidades ? '' : 'none';
    $('#hoFijo').style.display    = fijo ? '' : 'none';

    let total = 0, detalle = '';
    if(porUnidades){
      const ua = Number(val('hoUA')) || 0, vu = Number(val('hoVU')) || 0;
      const base = ua * vu;
      const sel = $$('#hoAdic input:checked').map(i => i.value);
      const pct = sel.reduce((a,id) => a + (ADICIONALES_HONORARIOS.find(x => x.id === id) || {pct:0}).pct, 0);
      total = base * (1 + pct/100);
      detalle = '<table><tbody>'+
        '<tr><td>Base: '+ua+' UA × '+fMoneda(vu)+'</td><td class="num">'+fMoneda(base)+'</td></tr>'+
        sel.map(id => { const a = ADICIONALES_HONORARIOS.find(x => x.id === id);
          return '<tr><td>'+esc(a.n)+' (+'+a.pct+' %)</td><td class="num">'+fMoneda(base*a.pct/100)+'</td></tr>'; }).join('')+
        '<tr style="font-weight:800"><td>TOTAL</td><td class="num">'+fMoneda(total)+'</td></tr>'+
      '</tbody></table>';
      $('#hoCalculo').innerHTML = '<div class="tabla-wrap">'+detalle+'</div>'+
        (vu === 0 ? '<div class="aviso warn mt8">'+ico('alerta')+
          '<div>No hay valor de unidad cargado para «'+esc(f.obraSocial||'este financiador')+'». '+
          'El coordinador puede definirlo en Catálogos para que se complete solo.</div></div>' : '');
    } else if(fijo){
      total = Number(val('hoMontoFijo')) || 0;
    }
    const mc = MODALIDADES_CONSULTA.find(x => x.id === val('hcModalidad'));
    if($('#hcDesc')) $('#hcDesc').textContent = mc ? mc.d : '';
    const sinConsulta = val('hcModalidad') === 'incluida' || val('hcModalidad') === 'sincargo';
    if($('#hcMontoBox')) $('#hcMontoBox').style.display = sinConsulta ? 'none' : '';
    const consulta = sinConsulta ? 0 : (Number(val('hcMonto')) || 0);

    $('#hoResumen').innerHTML = '<div class="grid c3">'+
      '<div class="kpi aqua"><div class="lbl">'+ico('valoracion')+' Consulta</div>'+
        '<div class="val">'+fMoneda(consulta)+'</div>'+
        '<div class="pie">'+esc(autorFicha(fichaActual))+'</div></div>'+
      '<div class="kpi azul"><div class="lbl">'+ico('jeringa')+' Acto anestésico</div>'+
        '<div class="val">'+fMoneda(total)+'</div>'+
        '<div class="pie">'+esc(nombreActor(fichaActual))+'</div></div>'+
      '<div class="kpi ok"><div class="lbl">'+ico('dinero')+' Total de la ficha</div>'+
        '<div class="val">'+fMoneda(consulta + total)+'</div>'+
        '<div class="pie">'+(esAutorFicha(fichaActual) && esActorFicha(fichaActual)
          ? 'todo tuyo' : 'repartido entre dos profesionales')+'</div></div>'+
    '</div>';
    fichaActual.hon = Object.assign(fichaActual.hon || {}, { total });
    fichaActual.honConsulta = Object.assign(fichaActual.honConsulta || {}, { total:consulta });
  };
  $('#honCuerpo').addEventListener('change', recalc);
  $('#honCuerpo').addEventListener('input', debounce(recalc, 220));
  recalc();
}
function leerHonorariosConsulta(){
  const mod = val('hcModalidad');
  const monto = (mod === 'incluida' || mod === 'sincargo') ? 0 : (Number(val('hcMonto')) || 0);
  return { modalidad:mod, total:monto, estado:val('hcEstado'),
           fechaPresentacion:val('hcFecha'), comprobante:val('hcComprobante'),
           cobrado:Number(val('hcCobrado')) || 0 };
}
function leerHonorarios(){
  const mod = val('hoModalidad');
  const ua = Number(val('hoUA')) || 0, vu = Number(val('hoVU')) || 0;
  const adicionales = leerChks('hoAdic');
  const pct = adicionales.reduce((a,id) => a + (ADICIONALES_HONORARIOS.find(x => x.id === id) || {pct:0}).pct, 0);
  let total = 0;
  if(mod === 'abierto') total = ua * vu * (1 + pct/100);
  else if(mod === 'cerrado' || mod === 'particular') total = Number(val('hoMontoFijo')) || 0;
  return {
    modalidad: mod, ua, valorUnidad: vu, adicionales, pctAdicional: pct,
    montoFijo: Number(val('hoMontoFijo')) || 0, total,
    estado: val('hoEstado'), fechaPresentacion: val('hoFecha'),
    comprobante: val('hoComprobante'), cobrado: Number(val('hoCobrado')) || 0,
    observaciones: val('hoObs')
  };
}

/* ------------------------------------------------------ Consentimiento */
function abrirConsentimiento(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const c = f.consent || {};
  abrirModal('Consentimiento informado anestésico',
    '<div class="aviso info">'+ico('info')+'<div>Ley 26.529 de Derechos del Paciente. '+
      'El texto se imprime completo en el documento final.</div></div>'+
    '<div class="mini" style="max-height:190px;overflow:auto;background:var(--bg-2);padding:12px;'+
      'border-radius:10px;white-space:pre-line;line-height:1.6">'+esc(TEXTO_CONSENTIMIENTO)+'</div>'+
    '<div class="grid c2 mt14">'+
      campoSel('coQuien','Firma el consentimiento',
        ['El paciente','Representante legal / familiar','Paciente y representante',
         'No firmado — urgencia vital','Paciente que rechaza transfusión'], c.quien)+
      campoTxt('coFirmante','Nombre y DNI del firmante', c.firmante || (p.apellido?p.apellido+', '+p.nombre+' — '+(p.dni||''):''))+
    '</div>'+
    chksHTML('coItems', ['Acepta transfusión de hemoderivados si fuera necesaria',
      'RECHAZA transfusión de hemoderivados','Acepta técnica regional','Acepta anestesia general',
      'Acepta sedación','Autoriza el uso de imágenes con fines docentes',
      'Recibió información sobre el ayuno','Recibió información sobre la medicación a suspender'], c.items)+
    '<label class="mini strong" style="display:block;margin:14px 0 6px">Firma del paciente o representante</label>'+
    '<div class="firma-box"><canvas id="coFirmaPac"></canvas><div class="hint">Firmar aquí</div></div>'+
    '<div class="btn-row mt8"><button class="btn ghost chico" id="coLimpiarPac">Borrar</button></div>'+
    '<label class="mini strong" style="display:block;margin:14px 0 6px">Firma del anestesiólogo</label>'+
    '<div class="firma-box"><canvas id="coFirmaAnest"></canvas><div class="hint">Firmar aquí</div></div>'+
    '<div class="btn-row mt8"><button class="btn ghost chico" id="coLimpiarAnest">Borrar</button>'+
    '<button class="btn ghost chico" id="coUsarPerfil">Usar mi firma guardada</button></div>'+
    campoArea('coObs','Aclaraciones', c.observaciones),
    '<button class="btn ghost" data-cerrar>Cerrar</button>'+
    '<button class="btn pri" id="coGuardar">'+ico('check')+' Guardar consentimiento</button>');

  cablearGenerico();
  let fp = c.firmaPaciente || '', fa = c.firmaAnestesiologo || (USUARIO ? USUARIO.firmaDataUrl : '') || '';
  const cp = montarFirma($('#coFirmaPac'), d => fp = d);
  const ca = montarFirma($('#coFirmaAnest'), d => fa = d);
  setTimeout(() => { if(fp) cp.cargar(fp); if(fa) ca.cargar(fa); }, 150);
  $('#coLimpiarPac').onclick = () => { cp.limpiar(); fp = ''; };
  $('#coLimpiarAnest').onclick = () => { ca.limpiar(); fa = ''; };
  $('#coUsarPerfil').onclick = () => {
    if(!USUARIO || !USUARIO.firmaDataUrl) return toast('No tenés firma guardada en Mi perfil.', 'err');
    ca.limpiar(); ca.cargar(USUARIO.firmaDataUrl); fa = USUARIO.firmaDataUrl;
  };
  $('#coGuardar').onclick = () => {
    fichaActual.consent = {
      quien: val('coQuien'), firmante: val('coFirmante'), items: leerChks('coItems'),
      observaciones: val('coObs'), firmaPaciente: fp, firmaAnestesiologo: fa,
      fecha: hoyISO(), hora: ahoraHora()
    };
    guardarFicha();
    cerrarModal();
  };
}
