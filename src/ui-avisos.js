/* =========================================================================
   AVISOS Y ALARMAS
   Recordatorios de cirugías próximas, datos faltantes en cada ficha,
   pendientes de facturación y de cobro, y perfil incompleto.
   Se muestran en la campana del encabezado y resumidos en el panel.
   ========================================================================= */

/* =========================================================================
   HONORARIOS DIFERIDOS - el recordatorio de cada tres horas
   -------------------------------------------------------------------------
   Al cerrar una ficha, la app pregunta si carga el honorario o lo deja para
   despues. Si lo difiere queda marcado, y a partir de ahi insiste: campana
   en rojo, permanente, y un cartel cada tres horas mientras la app este
   abierta. No es molestar por molestar: el honorario que no se carga en el
   momento es el que aparece de menos a fin de mes, y despues es imposible
   reconstruirlo.

   El recordatorio se apaga solo en cuanto se carga la modalidad del acto
   (ver abrirHonorarios en ui-ficha.js).
   ========================================================================= */
const HORAS_RECORDATORIO_HON = 3;

function honorariosDiferidos(){
  if(!SESION || !verDatosClinicos()) return [];
  return lista('fichas').filter(f =>
    (f.honDiferido || {}).desde &&
    f.honDiferido.uid === SESION.uid &&
    !(f.hon || {}).modalidad &&
    esActorFicha(f));
}

/* Momento del ultimo cartel, por usuario y por dispositivo. Se guarda fuera
   de la base: es una preferencia de este equipo, no un dato de la ficha. */
function ultimoCartelHon(){
  try{ return localStorage.getItem('afar_hon_cartel_' + (SESION ? SESION.uid : '')) || ''; }
  catch(e){ return ''; }
}
function marcarCartelHon(){
  try{ localStorage.setItem('afar_hon_cartel_' + (SESION ? SESION.uid : ''),
                            new Date().toISOString()); }catch(e){}
}

/* Borra el sello del ultimo cartel: se usa cuando el propio anestesiologo
   pide ver la lista desde el inicio, para que el cartel salga en el acto. */
function marcarCartelHon0(){
  try{ localStorage.removeItem('afar_hon_cartel_' + (SESION ? SESION.uid : '')); }catch(e){}
}

function revisarRecordatorioHonorarios(){
  const l = honorariosDiferidos();
  if(!l.length) return;
  const ultimo = ultimoCartelHon();
  if(ultimo && horasDesde(ultimo) < HORAS_RECORDATORIO_HON) return;
  if($('#modal') && $('#modal').classList.contains('on')) return;   /* no pisar otro modal */
  marcarCartelHon();

  const filas = l.map(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    const hs = Math.floor(horasDesde(f.honDiferido.desde));
    return '<button type="button" class="hon-pend" data-honf="'+esc(f.id)+'">'+
      ico('dinero')+'<span class="tx"><b>'+esc((p.apellido||'—')+', '+(p.nombre||''))+'</b>'+
      '<i>'+esc(f.cirugia || 'sin cirugía')+' · '+fFecha(fechaCirugiaDe(f) || f.fecha)+
      ' · pendiente hace '+hs+' h</i></span>'+
      ico('flecha').replace('<svg','<svg style="transform:rotate(-90deg);width:15px;height:15px;opacity:.5"')+
      '</button>';
  }).join('');

  abrirModal('Honorarios pendientes',
    '<div class="aviso warn">'+ico('reloj')+'<div><b>Dejaste '+l.length+' honorario'+
      (l.length===1?'':'s')+' para después.</b><br>Mientras no cargues la modalidad del acto, '+
      'la prestación no entra en tu facturación del mes ni en tus estadísticas.</div></div>'+
    '<div class="hon-pend-lista">'+filas+'</div>',
    '<button class="btn ghost" data-cerrar>Ahora no</button>');
  $$('#modal [data-honf]').forEach(b => b.onclick = () => {
    const id = b.dataset.honf;
    cerrarModal();
    abrirFicha(id);
    if(fichaActual && fichaActual.id === id) setTimeout(() => abrirHonorarios(fichaActual), 200);
  });
}

/* Arranca el reloj del recordatorio. Se llama al iniciar sesion. */
let __relojHon = null;
function iniciarRecordatorioHonorarios(){
  if(__relojHon) clearInterval(__relojHon);
  /* Un rato despues de entrar, para no recibir el cartel encima del login */
  setTimeout(revisarRecordatorioHonorarios, 45000);
  /* Se revisa cada diez minutos, pero el cartel sale cada tres horas: asi la
     cuenta sigue bien aunque la app quede abierta toda la guardia. */
  __relojHon = setInterval(revisarRecordatorioHonorarios, 10 * 60 * 1000);
}
function detenerRecordatorioHonorarios(){
  if(__relojHon){ clearInterval(__relojHon); __relojHon = null; }
}

/* ------------------------------------------- Qué le falta a una ficha -- */
function faltantesFicha(f){
  const m = [];
  const hoy = hoyISO();
  /* Lo del acto se reclama recién cuando la cirugía ya ocurrió. Mientras no
     haya fecha de cirugía cargada, la cirugía no ocurrió: la ficha está en
     la etapa de valoración y pedirle el Aldrete no tiene sentido. */
  const cx = fechaCirugiaDe(f);
  const pasada = !!cx && cx < hoy;
  const v = f.v || {}, sc = v.scores || {}, pl = f.plan || {}, a = f.acto || {}, h = f.hon || {};

  const r = f.recup || {};
  /* La solapa que se nombra es el paso del flujo al que hay que ir */
  if(!f.pacienteId)                        m.push({ t:'paciente', s:'paciente', critico:true });
  if(!f.institucion)                       m.push({ t:'institución', s:'paciente', critico:true });
  if(!f.cirugia)                           m.push({ t:'cirugía', s:'paciente', critico:true });
  if(!f.diagnostico && !f.dxQuirurgico)    m.push({ t:'diagnóstico', s:'paciente' });
  if(!f.obraSocial)                        m.push({ t:'financiador', s:'paciente' });
  if(!f.cirujano)                          m.push({ t:'cirujano', s:'paciente' });
  if(!pesoDePaciente(f))                   m.push({ t:'peso del paciente', s:'paciente', critico:true });
  if(!sc.asa)                              m.push({ t:'clasificación ASA', s:'preanestesia', critico:true });
  if(!(v.antecedentes2 || []).length && !v.sinAntecedentes)
                                           m.push({ t:'antecedentes patológicos', s:'preanestesia' });
  if(!(v.examen || {}).ta)                 m.push({ t:'signos vitales de la consulta', s:'preanestesia' });
  if(!(v.va || {}).mallampati)             m.push({ t:'evaluación de la vía aérea', s:'preanestesia', critico:true });
  if(!(v.lab || {}).hb)                    m.push({ t:'laboratorio', s:'preanestesia' });
  if(!(v.ayuno || {}).tipo)                m.push({ t:'control de ayuno', s:'preanestesia' });
  if(!(v.riesgo || {}).fundamento)         m.push({ t:'conclusión de aptitud', s:'preanestesia', critico:true });
  if(!(pl.tecnica || []).length)           m.push({ t:'plan anestésico', s:'preanestesia', critico:true });
  if(!consentimientoCompleto(f))           m.push({ t:'consentimiento informado (punto 15)',
                                                    s:'preanestesia', critico:true });
  if(!cx && (f.valoracionGuardada || (f.v||{}).scores))
                                           m.push({ t:'fecha de la cirugía', s:'anestesia' });
  if(pasada){
    if(!(a.tecnicas || []).length)         m.push({ t:'técnica anestésica realizada', s:'anestesia', critico:true });
    if(!a.finCirugia && !a.finAnestesia)   m.push({ t:'tiempos del procedimiento', s:'anestesia', critico:true });
    if(!(a.drogas || []).length)           m.push({ t:'drogas administradas', s:'anestesia' });
    if(!(a.controles || []).length)        m.push({ t:'controles de signos vitales', s:'anestesia' });
    if(!(a.eventos2 || []).length && !a.sinEventos)
                                           m.push({ t:'eventos intraoperatorios', s:'anestesia' });
    if(!r.aldreteTotal)                    m.push({ t:'Aldrete al egreso', s:'recuperacion' });
    if(!(f.firma || {}).firmado)           m.push({ t:'firma de la ficha', s:'firma', critico:true });
  }
  if(esActorFicha(f) && !h.modalidad)      m.push({ t:'honorarios del acto', s:'hon' });
  if(esAutorFicha(f) && !(f.honConsulta||{}).modalidad)
                                           m.push({ t:'honorarios de la consulta', s:'hon' });
  return m;
}

/* El peso vive en la historia del paciente, no en la ficha */
function pesoDePaciente(f){
  const p = DB.pacientes[f.pacienteId] || {};
  return Number(p.peso) || 0;
}

function diasHasta(iso){
  if(!iso) return null;
  const a = new Date(hoyISO() + 'T12:00:00'), b = new Date(iso + 'T12:00:00');
  return Math.round((b - a) / 86400000);
}
function cuandoTexto(d){
  if(d === 0) return 'HOY';
  if(d === 1) return 'MAÑANA';
  if(d === -1) return 'ayer';
  if(d < 0) return 'hace ' + (-d) + ' días';
  return 'en ' + d + ' días';
}

/* ------------------------------------------------- Cálculo de avisos -- */
function calcularAvisos(){
  const av = [];
  const hoy = hoyISO();

  /* --- 0. Comunicación interna: reclamos sin responder --- */
  misHilos().forEach(h => {
    const u = ultimoMensaje(h) || {};
    const hs = Math.floor(horasDesde(u.cuando));
    if(hiloVencido(h)){
      av.push({ nivel:'danger', icono:'correo', orden:1,
        titulo:'Sin responder hace ' + hs + ' h — ' + h.asunto,
        detalle: nombreParticipante(u.uid) + ' escribió y todavía no contestaste.' +
                 '\n«' + String(u.texto||'').slice(0,160) + '»',
        accion: () => abrirHilo(h.id) });
    } else if(miReclamoSinRespuesta(h)){
      av.push({ nivel:'warn', icono:'reloj', orden:2,
        titulo:'Tu reclamo lleva ' + hs + ' h sin respuesta — ' + h.asunto,
        detalle:'Nadie contestó desde tu último mensaje. Podés insistir o darlo por resuelto.',
        accion: () => abrirHilo(h.id) });
    } else if(hiloNoLeido(h)){
      av.push({ nivel:'info', icono:'correo', orden:3,
        titulo:'Mensaje nuevo — ' + h.asunto,
        detalle: nombreParticipante(u.uid) + ': «' + String(u.texto||'').slice(0,160) + '»',
        accion: () => abrirHilo(h.id) });
    }
  });

  /* El contable no accede a información clínica: sus avisos terminan acá. */
  if(!verDatosClinicos()) return av.sort((a,b) => a.orden - b.orden);

  const fichas = misFichas();

  /* --- 1. Solicitudes de acceso (coordinación) --- */
  if(esCoordinador()){
    const p = pendientes().length;
    if(p) av.push({ nivel:'danger', icono:'campana', orden:0,
      titulo: p + ' solicitud' + (p===1?'':'es') + ' de acceso sin resolver',
      detalle:'Verificá la matrícula para habilitar el ingreso.',
      accion: () => { coordSeccion = 'solicitudes'; irA('coordinador'); } });
  }

  /* --- 2. Cirugías de los próximos 7 días --- */
  fichas.filter(f => { const cx = fechaCirugiaDe(f);
      return cx && cx >= hoy && diasHasta(cx) <= 7; })
    .sort((a,b) => fechaCirugiaDe(a) < fechaCirugiaDe(b) ? -1 : 1)
    .forEach(f => {
      const d = diasHasta(fechaCirugiaDe(f));
      const p = DB.pacientes[f.pacienteId] || {};
      const falt = faltantesFicha(f);
      const criticos = falt.filter(x => x.critico);
      const urgente = d <= 1 && criticos.length;
      av.push({
        nivel: urgente ? 'danger' : (d === 0 ? 'warn' : 'info'),
        icono: d === 0 ? 'alerta' : 'calendario',
        orden: 10 + d,
        titulo: cuandoTexto(d) + (f.hora ? ' ' + f.hora + ' h' : '') + ' — ' +
                (p.apellido ? p.apellido + ', ' + p.nombre : 'sin paciente'),
        detalle: (f.cirugia || 'sin cirugía cargada') + ' · ' +
                 nombreInstitucion(f.institucion).split('"')[0].trim() +
                 (f.caracter !== 'programada' ? ' · ' + f.caracter.toUpperCase() : '') +
                 (actorFicha(f) !== f.ownerUid
                   ? '\nValoración: ' + autorFicha(f) + ' · Acto: ' + nombreActor(f) : '') +
                 (criticos.length
                   ? '\n⚠ Faltan datos esenciales: ' + criticos.map(x => x.t).join(', ') + '.'
                   : (falt.length ? '\nFaltan: ' + falt.map(x => x.t).join(', ') + '.' : '\nFicha completa.')),
        fichaId: f.id, solapa: criticos.length ? criticos[0].s : 'qx'
      });
    });

  /* --- 3. Cirugías ya realizadas sin registro del acto --- */
  fichas.filter(f => { const cx = fechaCirugiaDe(f);
      return cx && cx < hoy && !(f.acto || {}).finAnestesia; })
    .sort((a,b) => fechaCirugiaDe(a) < fechaCirugiaDe(b) ? 1 : -1).slice(0, 12)
    .forEach(f => {
      const p = DB.pacientes[f.pacienteId] || {};
      const cx = fechaCirugiaDe(f);
      av.push({ nivel:'warn', icono:'monitor', orden:30,
        titulo:'Sin registro del acto anestésico — ' + (p.apellido||'—') + ', ' + (p.nombre||''),
        detalle:(f.cirugia||'') + ' del ' + fFecha(cx) + ' (' + cuandoTexto(diasHasta(cx)) + ').' +
                '\nCompletá tiempos, técnica realizada, eventos y Aldrete.',
        fichaId:f.id, solapa:'anestesia' });
    });

  /* --- 4. Cirugías realizadas sin honorarios cargados --- */
  /* Los que el anestesiólogo DIFIRIO a proposito, al cerrar la ficha, van
     primero y en rojo: los pidio el recordatorio y el recordatorio insiste
     hasta que se cargan. Los demas quedan en ambar, como aviso normal. */
  honorariosDiferidos().forEach(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    const hs = Math.floor(horasDesde(f.honDiferido.desde));
    av.push({ nivel:'danger', icono:'dinero', orden:4,
      titulo:'Honorarios pendientes hace ' + hs + ' h — ' + (p.apellido||'—') + ', ' + (p.nombre||''),
      detalle:(f.cirugia||'') + ' del ' + fFecha(fechaCirugiaDe(f) || f.fecha) +
              '.\nLos dejaste para después al cerrar la ficha. Te lo recuerdo cada 3 horas ' +
              'hasta que los cargues: sin la modalidad del acto la prestación no entra en tu ' +
              'facturación del mes.',
      fichaId:f.id, solapa:'hon' });
  });

  fichas.filter(f => { const cx = fechaCirugiaDe(f);
      return cx && cx < hoy && esActorFicha(f) && !(f.hon || {}).modalidad && !(f.honDiferido||{}).desde; })
    .sort((a,b) => fechaCirugiaDe(a) < fechaCirugiaDe(b) ? 1 : -1).slice(0, 12)
    .forEach(f => {
      const p = DB.pacientes[f.pacienteId] || {};
      av.push({ nivel:'warn', icono:'dinero', orden:35,
        titulo:'Sin honorarios cargados — ' + (p.apellido||'—') + ', ' + (p.nombre||''),
        detalle:(f.cirugia||'') + ' del ' + fFecha(fechaCirugiaDe(f)) +
                '.\nMientras no cargues la modalidad del acto no aparece en tu facturación del mes.',
        fichaId:f.id, solapa:'hon' });
    });

  /* --- 4 bis. Valoraciones vencidas --- */
  fichas.filter(f => valoracionVencida(f) && !(f.firma||{}).firmado)
    .slice(0, 8)
    .forEach(f => {
      const p = DB.pacientes[f.pacienteId] || {};
      const d = diasDeValoracion(f);
      av.push({ nivel:'warn', icono:'reloj', orden:33,
        titulo:'Valoración vencida (' + d + ' días) — ' + (p.apellido||'—') + ', ' + (p.nombre||''),
        detalle:'La valoración prequirúrgica se hizo el ' + fFecha(fechaValoracionDe(f)) +
                ', hace ' + d + ' días.\nPasados ' + DIAS_VIGENCIA_VALORACION + ' días conviene ' +
                'reevaluar: pudo cambiar la medicación, aparecer una infección respiratoria o ' +
                'descompensarse una patología de base.',
        fichaId:f.id, solapa:'preanestesia' });
    });

  /* --- 5. Facturación del mes anterior sin presentar --- */
  const mesAnt = (() => { const d = new Date(); d.setMonth(d.getMonth()-1); return mesDe(d.toISOString()); })();
  const sinPresentar = misPrestaciones().filter(x => mesDe(x.fecha) === mesAnt &&
    x.monto > 0 && x.estado === 'Pendiente');
  if(sinPresentar.length){
    const t = sinPresentar.reduce((a,x) => a + x.monto, 0);
    av.push({ nivel:'warn', icono:'archivo', orden:40,
      titulo:'Facturación de ' + nombreMes(mesAnt) + ' sin presentar',
      detalle: sinPresentar.length + ' prestaciones por ' + fMoneda(t) +
               ' siguen en estado Pendiente.\nRevisalas y descargá el resumen en Excel o PDF.',
      accion: () => { facMes = mesAnt; facEstado = 'Pendiente'; irA('facturacion'); } });
  }

  /* --- 6. Cobros demorados más de 60 días --- */
  const demorados = misPrestaciones().filter(x => {
    if(['Presentado','Facturado'].indexOf(x.estado) < 0) return false;
    const d = diasHasta(x.fechaPresentacion || x.fecha);
    return d !== null && d < -60;
  });
  if(demorados.length){
    const t = demorados.reduce((a,x) => a + x.monto, 0);
    av.push({ nivel:'warn', icono:'reloj', orden:45,
      titulo: demorados.length + ' prestacion' + (demorados.length===1?'':'es') + ' sin cobrar hace más de 60 días',
      detalle:'Total pendiente: ' + fMoneda(t) + '.\nRevisá el estado con cada financiador.',
      accion: () => { facEstado = 'Facturado'; irA('facturacion'); } });
  }

  /* --- 7. Borradores olvidados --- */
  const viejos = fichas.filter(f => (f.estado || 'borrador') === 'borrador' &&
    fechaDeFicha(f) && diasHasta(fechaDeFicha(f)) < -14);
  if(viejos.length){
    av.push({ nivel:'info', icono:'editar', orden:50,
      titulo: viejos.length + ' ficha' + (viejos.length===1?'':'s') + ' en borrador hace más de dos semanas',
      detalle:'Completalas o eliminalas para que las estadísticas reflejen tu actividad real.',
      accion: () => { filtroFichas.estado = 'borrador'; irA('fichas'); } });
  }

  /* --- 8. Perfil incompleto --- */
  if(!esCoordinador() && USUARIO){
    const f = [];
    if(!USUARIO.matriculaProvincial || USUARIO.matriculaProvincial === '—') f.push('matrícula provincial');
    if(!USUARIO.cuit) f.push('CUIT');
    if(!USUARIO.firmaDataUrl) f.push('firma digital');
    if(f.length) av.push({ nivel:'info', icono:'usuario', orden:60,
      titulo:'Tu perfil está incompleto',
      detalle:'Falta cargar: ' + f.join(', ') + '.\nEstos datos encabezan y firman cada ficha que emitís.',
      accion: () => irA('perfil') });
  }

  /* --- 9. Sincronización sin configurar (sólo coordinación) --- */
  if(esCoordinador() && !configNube()){
    av.push({ nivel:'info', icono:'nube', orden:70,
      titulo:'Los datos se guardan sólo en este dispositivo',
      detalle:'Todavía no está conectada la base de datos compartida. Hasta que se conecte, ' +
              'lo que carga cada socio no se ve en los demás equipos.',
      accion: abrirSincronizacion });
  }

  return av.sort((a,b) => a.orden - b.orden);
}

function conteoAvisos(){
  const a = calcularAvisos();
  return { total:a.length, urgentes:a.filter(x => x.nivel === 'danger').length };
}

/* --------------------------------------------------- Panel de avisos -- */
function abrirAvisos(){
  const av = calcularAvisos();
  const cuerpo = av.length
    ? av.map((a,i) =>
        '<div class="aviso '+a.nivel+'" style="cursor:'+((a.accion||a.fichaId)?'pointer':'default')+
          ';align-items:flex-start" data-av="'+i+'">'+
          ico(a.icono)+
          '<div style="flex:1;min-width:0"><b>'+esc(a.titulo)+'</b>'+
          '<div style="white-space:pre-line;margin-top:3px;opacity:.92">'+esc(a.detalle)+'</div></div>'+
          ((a.accion||a.fichaId) ? '<span style="opacity:.5;flex:none">'+ico('flecha')
            .replace('<svg','<svg style="transform:rotate(-90deg);width:15px;height:15px"')+'</span>' : '')+
        '</div>').join('')
    : '<div class="vacio">'+ico('check')+'<b>No hay nada pendiente</b>'+
      '<span>Todas tus fichas están completas y al día.</span></div>';

  const permiso = ('Notification' in window) ? Notification.permission : 'no-soportado';
  const pie = ('Notification' in window)
    ? '<hr class="sep"><label class="chk'+(permiso==='granted'?' sel':'')+'" id="avNotif" style="width:100%">'+
      '<input type="checkbox"'+(permiso==='granted'?' checked disabled':'')+'>'+
      (permiso === 'granted'
        ? 'Recordatorios del sistema activados'
        : (permiso === 'denied'
           ? 'Recordatorios bloqueados en este navegador'
           : 'Avisarme con una notificación del sistema'))+
      '</label>'+
      '<p class="mini mt8">Al abrir la app te recuerda las cirugías del día y las del día siguiente.</p>'
    : '';

  abrirModal('Avisos y recordatorios', cuerpo + pie,
    '<button class="btn pri" data-cerrar>Cerrar</button>');

  $$('#modal [data-av]').forEach(el => el.onclick = () => {
    const a = av[Number(el.dataset.av)];
    cerrarModal();
    setTimeout(() => {
      if(a.fichaId){
        abrirFicha(a.fichaId);
        if(!fichaActual || fichaActual.id !== a.fichaId) return;   /* no se pudo abrir */
        if(a.solapa === 'hon') abrirHonorarios(fichaActual);
        else if(a.solapa && PASOS_FICHA.some(p => p.k === a.solapa)) irAPaso(a.solapa);
      } else if(a.accion) a.accion();
    }, 180);
  });

  const sw = $('#avNotif');
  if(sw && permiso === 'default') sw.onclick = e => {
    e.preventDefault();
    Notification.requestPermission().then(p => {
      if(p === 'granted'){ toast('Recordatorios activados.', 'ok'); notificarCirugias(true); }
      else toast('No se activaron los recordatorios.', 'warn');
      cerrarModal();
    });
  };
}

/* ------------------------------------------ Notificaciones del sistema */
function notificarCirugias(forzar){
  if(!('Notification' in window) || Notification.permission !== 'granted') return;
  const clave = 'afar_notif_' + hoyISO();
  if(!forzar && localStorage.getItem(clave)) return;
  const hoy = misFichas().filter(f => f.fecha === hoyISO());
  const man = misFichas().filter(f => f.fecha === diaRel(1));
  if(!hoy.length && !man.length) return;
  const partes = [];
  if(hoy.length) partes.push(hoy.length + ' hoy');
  if(man.length) partes.push(man.length + ' mañana');
  const incompletas = hoy.concat(man).filter(f => faltantesFicha(f).some(x => x.critico)).length;
  try{
    new Notification('AFAAR — ' + partes.join(' y '), {
      body: (hoy.length
        ? hoy.map(f => (f.hora||'') + ' ' + (f.cirugia||'sin cirugía')).join('\n')
        : 'Sin cirugías hoy.') +
        (incompletas ? '\n⚠ ' + incompletas + ' ficha(s) con datos esenciales sin cargar.' : ''),
      icon:'icons/icon-192.png', tag:'afaar-cirugias'
    });
    localStorage.setItem(clave, '1');
  }catch(e){}
}

/* ------------------------------------------- Tarjeta del panel -------- */
function tarjetaAvisosPanel(){
  const av = calcularAvisos();
  if(!av.length) return '';
  const top = av.slice(0, 4);
  return '<div class="card" style="border-left:4px solid var(--'+
      (av[0].nivel==='danger'?'danger':(av[0].nivel==='warn'?'warn':'info'))+')">'+
    '<h3>'+ico('campana')+'Avisos'+
      '<span class="tag '+(av.some(a=>a.nivel==='danger')?'danger':'warn')+'" style="margin-left:auto">'+
      av.length+'</span></h3>'+
    top.map((a,i) => '<div class="aviso '+a.nivel+'" style="cursor:pointer;align-items:flex-start;margin-bottom:8px" data-pav="'+i+'">'+
      ico(a.icono)+'<div style="flex:1;min-width:0"><b>'+esc(a.titulo)+'</b>'+
      '<div class="mini" style="white-space:pre-line;color:inherit;opacity:.9">'+esc(a.detalle)+'</div></div></div>').join('')+
    (av.length > 4
      ? '<button class="btn ghost full chico" id="avVerTodos">Ver los '+av.length+' avisos</button>'
      : '')+
  '</div>';
}

function cablearAvisosPanel(){
  const av = calcularAvisos();
  $$('#vPanel [data-pav]').forEach(el => el.onclick = () => {
    const a = av[Number(el.dataset.pav)];
    if(a.fichaId){
      abrirFicha(a.fichaId);
      if(!fichaActual || fichaActual.id !== a.fichaId) return;   /* no se pudo abrir */
      if(a.solapa === 'hon') abrirHonorarios(fichaActual);
      else if(a.solapa && PASOS_FICHA.some(p => p.k === a.solapa)) irAPaso(a.solapa);
    } else if(a.accion) a.accion();
  });
  if($('#avVerTodos')) $('#avVerTodos').onclick = abrirAvisos;
}

/* ------------------------- Banner de faltantes dentro de la ficha ----- */
function bannerFaltantes(f){
  const m = faltantesFicha(f);
  if(!m.length) return '<div class="aviso ok no-print">'+ico('check')+
    '<div><b>Ficha completa.</b> No falta ningún dato.</div></div>';
  const criticos = m.filter(x => x.critico), otros = m.filter(x => !x.critico);
  /* La urgencia se mide contra la fecha de la CIRUGÍA. Mientras no haya
     cirugía cargada no hay nada inminente: la ficha está en la etapa de
     valoración, y avisar «la cirugía es hoy» porque la consulta es hoy es
     decir una cosa por otra. */
  const cx = fechaCirugiaDe(f);
  const d = cx ? diasHasta(cx) : null;
  const inminente = d !== null && d >= 0 && d <= 1;
  return '<div class="aviso '+(criticos.length ? (inminente ? 'danger' : 'warn') : 'info')+' no-print">'+
    ico(criticos.length ? 'alerta' : 'info')+
    '<div><b>'+(criticos.length
      ? 'Faltan ' + criticos.length + ' dato' + (criticos.length===1?'':'s') + ' esencial' + (criticos.length===1?'':'es')
      : 'Faltan datos opcionales')+
      (inminente && criticos.length ? ' y la cirugía es ' + cuandoTexto(d).toLowerCase() : '')+'.</b><br>'+
    (criticos.length ? '<b>Esenciales:</b> '+esc(criticos.map(x=>x.t).join(' · '))+'<br>' : '')+
    (otros.length ? '<span style="opacity:.85">Opcionales: '+esc(otros.map(x=>x.t).join(' · '))+'</span>' : '')+
    '</div></div>';
}
