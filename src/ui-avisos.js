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

/* =========================================================================
   RECORDATORIO DE VALORACION ADEUDADA
   -------------------------------------------------------------------------
   Cuando un acto se firmo habiendose declarado que no habia valoracion previa
   -urgencia, o valoracion hecha en papel-, la ficha queda con una deuda: el
   documento que se emite sale de la preanestesia, y sin ella sale vacio.

   El cartel vuelve cada diez minutos, con tono, hasta que la valoracion este
   completa. Es a proposito mas insistente que el de honorarios (tres horas):
   ahi lo que se pierde es plata, aca lo que falta es la mitad de una historia
   clinica de un paciente que ya se anestesio.

   Se puede posponer una hora. Sin esa salida, el cartel caeria encima de
   alguien que puede estar anestesiando a otro paciente, y un recordatorio que
   interrumpe un acto medico deja de ser un recordatorio.
   ========================================================================= */
const MIN_RECORDATORIO_VAL = 10;

function selloCartelVal(){
  try{ return localStorage.getItem('afar_val_cartel_' + (SESION ? SESION.uid : '')) || ''; }
  catch(e){ return ''; }
}
function marcarCartelVal(minutos){
  const t = new Date(Date.now() + (minutos || 0) * 60000).toISOString();
  try{ localStorage.setItem('afar_val_cartel_' + (SESION ? SESION.uid : ''), t); }catch(e){}
}

function revisarRecordatorioValoracion(){
  const l = valoracionesAdeudadas();
  if(!l.length) return;
  const sello = selloCartelVal();
  if(sello && (Date.now() - new Date(sello).getTime()) / 60000 < MIN_RECORDATORIO_VAL) return;
  if($('#modal') && $('#modal').classList.contains('on')) return;   /* no pisar otro modal */
  marcarCartelVal(0);

  const filas = l.map(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    const s = deudaValoracion(f) || {};
    const m = MOTIVOS_SIN_VALORACION.find(x => x.id === s.motivo) || {};
    return '<button type="button" class="hon-pend" data-valf="'+esc(f.id)+'">'+
      ico('valoracion')+'<span class="tx"><b>'+esc((p.apellido||'—')+', '+(p.nombre||''))+'</b>'+
      '<i>'+esc(f.cirugia || 'sin cirugía')+' · '+fFecha(fechaCirugiaDe(f) || f.fecha)+
      ' · '+esc(m.n || 'sin valoración')+'</i></span>'+
      ico('flecha').replace('<svg','<svg style="transform:rotate(-90deg);width:15px;height:15px;opacity:.5"')+
      '</button>';
  }).join('');

  abrirModal('Falta completar la valoración prequirúrgica',
    '<div class="aviso danger">'+ico('alerta')+'<div><b>'+
      (l.length === 1 ? 'Hay un acto anestésico terminado sin su valoración prequirúrgica.'
                      : 'Hay '+l.length+' actos anestésicos terminados sin su valoración prequirúrgica.')+
      '</b><br>Se declaró el motivo en su momento, pero la valoración sigue faltando. Sin ella la '+
      'historia clínica del paciente queda por la mitad, el documento que se emite sale incompleto '+
      'y '+(l.length === 1 ? 'la ficha no se puede firmar' : 'esas fichas no se pueden firmar')+
      '.</div></div>'+
    '<div class="hon-pend-lista">'+filas+'</div>',
    '<button class="btn ghost" id="valPosponer">Posponer una hora</button>'+
    '<button class="btn pri" data-cerrar>Entendido</button>');

  $$('#modal [data-valf]').forEach(b => b.onclick = () => {
    const id = b.dataset.valf;
    cerrarModal();
    abrirFicha(id);
    if(fichaActual && fichaActual.id === id) setTimeout(() => irAPaso('preanestesia'), 200);
  });
  if($('#valPosponer')) $('#valPosponer').onclick = () => {
    marcarCartelVal(60 - MIN_RECORDATORIO_VAL);
    cerrarModal();
    toast('Se vuelve a avisar en una hora.', 'ok');
  };

  /* El tono usa la misma preferencia que el aviso de apertura: quien la
     apago no quiere que la aplicacion suene, y esto tambien es sonar. */
  if(sonidoAvisosOn()) tocarAvisoSonoro();
}

let __relojVal = null;
function iniciarRecordatorioValoracion(){
  if(__relojVal) clearInterval(__relojVal);
  setTimeout(revisarRecordatorioValoracion, 60000);
  __relojVal = setInterval(revisarRecordatorioValoracion, MIN_RECORDATORIO_VAL * 60 * 1000);
}
function detenerRecordatorioValoracion(){
  if(__relojVal){ clearInterval(__relojVal); __relojVal = null; }
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
  /* `s`   es el paso del flujo al que hay que ir.
     `anc` es el ancla dentro de ese paso: el id del acordeon o del campo
           exacto. Con eso, cada faltante del cartel es un boton que lleva al
           lugar donde se completa, en vez de dejar al usuario buscandolo.
     `sol` es la solapa, para los faltantes del acto anestesico. */
  if(!f.pacienteId)                        m.push({ t:'paciente', s:'paciente', anc:'qxPaciente', critico:true });
  if(!f.institucion)                       m.push({ t:'institución', s:'paciente', anc:'qxInst', critico:true });
  if(!f.cirugia)                           m.push({ t:'cirugía', s:'paciente', anc:'cxBuscar', critico:true });
  if(!f.diagnostico && !f.dxQuirurgico)    m.push({ t:'diagnóstico', s:'paciente', anc:'qxDx' });
  if(!f.obraSocial)                        m.push({ t:'financiador', s:'paciente', anc:'qxOS' });
  /* El cirujano vive en acto.equipo.cirujano desde que el equipo quirurgico
     paso al paso Anestesia. Se seguia mirando f.cirujano, que solo existe en
     fichas viejas: por eso «falta cirujano» no se iba nunca aunque estuviera
     cargado. Y no se reclama antes de que la cirugia ocurra: el dia de la
     valoracion todavia no se sabe quien opera. */
  const cirujano = (a.equipo || {}).cirujano || f.cirujano || '';
  if(pasada && !cirujano)                  m.push({ t:'cirujano', s:'anestesia', sol:'resumen', anc:'acCirujano' });
  if(!pesoDePaciente(f))                   m.push({ t:'peso del paciente', s:'paciente', anc:'qxPeso', critico:true });
  if(!sc.asa)                              m.push({ t:'clasificación ASA', s:'preanestesia', anc:'acScores', critico:true });
  if(!(v.antecedentes2 || []).length && !v.sinAntecedentes)
                                           m.push({ t:'antecedentes patológicos', s:'preanestesia', anc:'acDx' });
  if(!(v.examen || {}).ta)                 m.push({ t:'signos vitales de la consulta', s:'preanestesia', anc:'acExamen' });
  if(!(v.va || {}).mallampati)             m.push({ t:'evaluación de la vía aérea', s:'preanestesia', anc:'acVA', critico:true });
  if(!(v.lab || {}).hb)                    m.push({ t:'laboratorio', s:'preanestesia', anc:'acLab' });
  if(!(v.ayuno || {}).tipo)                m.push({ t:'control de ayuno', s:'preanestesia', anc:'acAyuno' });
  if(!(v.riesgo || {}).fundamento)         m.push({ t:'conclusión de aptitud', s:'preanestesia', anc:'acConclusion', critico:true });
  if(!(pl.tecnica || []).length)           m.push({ t:'plan anestésico', s:'preanestesia', anc:'acPlan', critico:true });
  if(!consentimientoCompleto(f))           m.push({ t:'consentimiento informado (punto 15)',
                                                    s:'preanestesia', anc:'acConsent', critico:true });
  if(!cx && (f.valoracionGuardada || (f.v||{}).scores))
                                           m.push({ t:'fecha de la cirugía', s:'anestesia', sol:'resumen', anc:'acFechaCx' });
  if(pasada){
    if(!(a.tecnicas || []).length)         m.push({ t:'técnica anestésica realizada', s:'anestesia', sol:'resumen', anc:'acTecnicas', critico:true });
    if(!a.finCirugia && !a.finAnestesia)   m.push({ t:'tiempos del procedimiento', s:'anestesia', sol:'resumen', anc:'acFinCx', critico:true });
    if(!(a.drogas || []).length)           m.push({ t:'drogas administradas', s:'anestesia', sol:'drogas' });
    if(!(a.controles || []).length)        m.push({ t:'controles de signos vitales', s:'anestesia', sol:'vitales' });
    if(!(a.eventos2 || []).length && !a.sinEventos)
                                           m.push({ t:'eventos intraoperatorios', s:'anestesia', sol:'eventos' });
    if(!r.aldreteTotal)                    m.push({ t:'Aldrete al egreso', s:'recuperacion', anc:'aldTotal' });
    /* La analgesia postoperatoria se indica al egreso de la URPA. Un paciente
       que sale sin esquema escrito es un paciente sin analgesia: la sala hace
       lo que dice la indicacion. */
    if(!(r.analgesia||[]).length && !((f.plan||{}).analgesia||[]).length)
                                           m.push({ t:'analgesia postoperatoria', s:'recuperacion',
                                                    anc:'reAnalgesia' });
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

  /* --- 0 bis. Actos firmados con la valoración todavía debiéndose --- */
  valoracionesAdeudadas().forEach(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    const s = deudaValoracion(f) || {};
    const m = MOTIVOS_SIN_VALORACION.find(x => x.id === s.motivo) || {};
    av.push({ nivel:'danger', icono:'valoracion', orden:1,
      titulo:'Falta completar la valoración prequirúrgica — ' +
             (p.apellido||'—') + ', ' + (p.nombre||''),
      detalle:(m.n || 'Sin valoración previa') + '.' +
              '\nEl acto se registró el ' + fFecha(fechaCirugiaDe(f) || f.fecha) +
              ' y la valoración sigue sin cargarse: hasta que esté, la ficha no se puede firmar.',
      fichaId:f.id, solapa:'preanestesia' });
  });

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
                 (esNoProgramado(caracterActo(f))
                   ? ' · ' + nombreCaracter(caracterActo(f)).toUpperCase() : '') +
                 (actorFicha(f) !== f.ownerUid
                   ? '\nValoración: ' + autorFicha(f) + ' · Acto: ' + nombreActor(f) : '') +
                 (criticos.length
                   ? '\n⚠ Faltan datos esenciales: ' + criticos.map(x => x.t).join(', ') + '.'
                   : (falt.length ? '\nFaltan: ' + falt.map(x => x.t).join(', ') + '.' : '\nFicha completa.')),
        fichaId: f.id, solapa: criticos.length ? criticos[0].s : 'qx'
      });
    });

  /* --- 2 bis. Valoraciones mías empezadas y sin concluir ---
     Mientras no estén cerradas, ningún colega puede tomar el acto: la ficha
     queda bloqueando a otro sin que su autor se entere. */
  fichas.filter(f => f.ownerUid === SESION.uid && !(f.firma||{}).firmado &&
                     hayValoracion(f) && !valoracionConcluida(f))
    .forEach(f => {
      const p = DB.pacientes[f.pacienteId] || {};
      av.push({ nivel:'warn', icono:'valoracion', orden:6,
        titulo:'Valoración sin concluir — ' + (p.apellido ? p.apellido+', '+p.nombre : 'sin paciente'),
        detalle:'Falta ' + faltaDeLaValoracion(f) + '.' +
                '\nHasta que esté completa, ningún colega puede tomar el acto de esta ficha.',
        fichaId:f.id,
        solapa: estadoPaso(f,'paciente') !== 'ok' ? 'paciente' : 'preanestesia' });
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

  /* ---- Pie: las dos maneras de enterarse desde afuera de la pantalla ----
     La casilla de notificaciones NO se tilda al tocarla: el permiso lo da el
     navegador, no nosotros, asi que se pide y despues se repinta el modal con
     el estado real. Tildarla antes seria mentir sobre algo que puede fallar. */
  const soporta = ('Notification' in window);
  const permiso = soporta ? Notification.permission : 'no-soportado';
  const casilla = (id, marcado, bloqueada, txt) =>
    '<label class="chk'+(marcado ? ' sel' : '')+'" id="'+id+'" style="width:100%">'+
    '<input type="checkbox"'+(marcado ? ' checked' : '')+(bloqueada ? ' disabled' : '')+'>'+
    esc(txt)+'</label>';

  const pie = '<hr class="sep">'+
    (soporta
      ? casilla('avNotif', permiso === 'granted', permiso !== 'default',
          permiso === 'granted' ? 'Recordatorios del sistema activados'
          : permiso === 'denied' ? 'Recordatorios bloqueados en este navegador'
          : 'Avisarme con una notificación del sistema')+
        (permiso === 'denied'
          ? '<p class="mini mt8">Los bloqueaste alguna vez y el navegador ya no vuelve a preguntar. '+
            'Se destraban desde el candado de la barra de direcciones, en Notificaciones → Permitir.</p>'
          : '<p class="mini mt8">Al abrir la app te recuerda las cirugías del día y las del día '+
            'siguiente, aunque la tengas en segundo plano.</p>')
      : '<p class="mini">Este navegador no da notificaciones del sistema. En iPhone y iPad sólo '+
        'funcionan con la app agregada a la pantalla de inicio.</p>')+
    casilla('avSonido', sonidoAvisosOn(), false,
      'Sonar un tono al abrir la app cuando haya algo pendiente')+
    '<p class="mini mt8">Suena una sola vez por apertura, y sólo si hay avisos, recordatorios o '+
    'mensajes sin ver. Funciona sin conexión y sin permiso del navegador.</p>';

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

  /* Notificaciones: se pide el permiso y se vuelve a pintar el modal con lo
     que el navegador haya contestado. Antes cerraba la ventana y la casilla
     quedaba igual que antes, asi que parecia que el clic no hacia nada. */
  const sw = $('#avNotif');
  if(sw && permiso === 'default') sw.onclick = e => {
    e.preventDefault();
    Notification.requestPermission().then(p => {
      if(p === 'granted'){ toast('Recordatorios activados.', 'ok'); notificarCirugias(true); }
      else if(p === 'denied') toast('El navegador bloqueó las notificaciones.', 'err');
      else toast('No se activaron los recordatorios.', 'warn');
      abrirAvisos();          /* se repinta con el estado real */
    }).catch(() => toast('Este navegador no pudo pedir el permiso.', 'err'));
  };

  /* Sonido: esta si es nuestra, se tilda sola y se guarda en el dispositivo.
     Al activarla suena de muestra, y esa muestra ya cuenta como el aviso de
     esta apertura: no tiene sentido sonar dos veces seguidas. */
  const ss = $('#avSonido');
  if(ss) ss.onclick = () => setTimeout(() => {
    const on = ss.querySelector('input').checked;
    ss.classList.toggle('sel', on);
    guardarSonidoAvisos(on);
    if(on){ sonoHecho = true; tocarAvisoSonoro(); toast('Sonido activado.', 'ok'); }
    else toast('Sonido silenciado.', 'warn');
  }, 0);
}

/* =========================================================================
   AVISO SONORO AL ABRIR LA APP
   -------------------------------------------------------------------------
   Quien abre la aplicacion y tiene avisos, recordatorios o mensajes sin ver
   escucha un tono corto, una sola vez por apertura. No reemplaza a la
   campana: solo hace que nadie entre sin enterarse de que hay algo esperando.

   El tono se sintetiza en el navegador (WebAudio): no hay archivo que
   descargar, asi que tambien suena con la app instalada y sin conexion.

   Los navegadores no dejan sonar antes de que la persona toque la pantalla.
   Si el primer intento queda bloqueado, el aviso queda armado y suena en el
   primer toque o tecla, sin volver a sonar despues.
   ========================================================================= */
const SONO_PREF_KEY = 'afar_sonido_avisos_v1';
const SONO_VENTANA_MS = 120000;   /* margen de apertura: la nube puede tardar */
let sonoDesde  = Date.now();
let sonoHecho  = false;
let sonoArmado = false;

function sonidoAvisosOn(){
  try{ return localStorage.getItem(SONO_PREF_KEY) !== 'off'; }catch(e){ return true; }
}
function guardarSonidoAvisos(on){
  try{ localStorage.setItem(SONO_PREF_KEY, on ? 'on' : 'off'); }catch(e){}
}

/* Lo que cuenta como actividad pendiente: los avisos clinicos de la campana
   y los mensajes internos sin leer o vencidos. */
function pendientesParaSonar(){
  const av = conteoAvisos().total;
  const m  = conteoMensajes();
  return av + m.noLeidos + m.vencidos;
}

/* Dos notas ascendentes, cortas y sin estridencia: se oye en un pasillo de
   quirofano sin sobresaltar a nadie. Devuelve si el dispositivo dejo sonar. */
function tocarAvisoSonoro(){
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return Promise.resolve(false);
  let ctx;
  try{ ctx = new AC(); }catch(e){ return Promise.resolve(false); }
  const emitir = () => {
    const t0 = ctx.currentTime + 0.02;
    [[880, 0], [1174.66, 0.17]].forEach(([hz, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(hz, t0 + d);
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.18, t0 + d + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.42);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0 + d); o.stop(t0 + d + 0.45);
    });
    setTimeout(() => { try{ ctx.close(); }catch(e){} }, 1400);
  };
  let r;
  try{ r = ctx.resume ? ctx.resume() : null; }catch(e){ r = null; }
  return Promise.resolve(r).catch(() => {}).then(() => {
    if(ctx.state !== 'running'){ try{ ctx.close(); }catch(e){} return false; }
    emitir();
    return true;
  });
}

function armarSonidoPorGesto(){
  if(sonoArmado) return;
  sonoArmado = true;
  const evs = ['pointerdown','keydown','touchstart'];
  const alTocar = () => {
    evs.forEach(ev => document.removeEventListener(ev, alTocar, true));
    sonoArmado = false;
    sonarAvisosPendientes(true);   /* el gesto vale aunque la ventana ya cerro */
  };
  evs.forEach(ev => document.addEventListener(ev, alTocar, true));
}

/* Se llama al entrar. Si los datos de la nube llegan tarde, el aviso igual se
   escucha una sola vez dentro de la ventana de dos minutos. */
function sonarAvisosPendientes(porGesto){
  if(sonoHecho || !sonidoAvisosOn()) return;
  if(!porGesto && Date.now() - sonoDesde > SONO_VENTANA_MS) return;
  const n = pendientesParaSonar();
  if(!n) return;
  sonoHecho = true;
  tocarAvisoSonoro().then(ok => {
    if(!ok){ sonoHecho = false; armarSonidoPorGesto(); return; }
    toast('Tenes ' + n + ' cosa' + (n === 1 ? '' : 's') + ' pendiente' +
          (n === 1 ? '' : 's') + ' a resolver.', 'warn');
  });
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

/* ------------------------- Banner de faltantes dentro de la ficha -----
   Cada faltante es un BOTON: lleva al paso donde se carga, abre el punto
   exacto y lo deja en pantalla. Y el cartel se recalcula solo mientras se
   escribe —ver refrescarFaltantes()—, asi que en cuanto se completa algo
   desaparece de la lista sin tener que guardar ni cambiar de paso.
   Antes era texto muerto: decia «falta la conclusion de aptitud» y seguia
   diciendolo despues de escribirla, porque solo se redibujaba al repintar
   la ficha entera.                                                        */
function bannerFaltantes(f){
  const m = faltantesFicha(f);
  if(!m.length) return '<div class="aviso ok no-print" id="fiFaltantes">'+ico('check')+
    '<div><b>Ficha completa.</b> No falta ningún dato.</div></div>';
  const criticos = m.filter(x => x.critico), otros = m.filter(x => !x.critico);
  /* La urgencia se mide contra la fecha de la CIRUGÍA. Mientras no haya
     cirugía cargada no hay nada inminente: la ficha está en la etapa de
     valoración, y avisar «la cirugía es hoy» porque la consulta es hoy es
     decir una cosa por otra. */
  const cx = fechaCirugiaDe(f);
  const d = cx ? diasHasta(cx) : null;
  const inminente = d !== null && d >= 0 && d <= 1;
  const chip = (x, opc) => '<button type="button"'+(opc?' class="opc"':'')+
    ' data-falta-s="'+esc(x.s)+'"'+
    (x.anc ? ' data-falta-anc="'+esc(x.anc)+'"' : '')+
    (x.sol ? ' data-falta-sol="'+esc(x.sol)+'"' : '')+
    '>'+esc(x.t)+'</button>';
  return '<div class="aviso '+(criticos.length ? (inminente ? 'danger' : 'warn') : 'info')+
    ' no-print" id="fiFaltantes">'+
    ico(criticos.length ? 'alerta' : 'info')+
    '<div><b>'+(criticos.length
      ? (criticos.length===1 ? 'Falta 1 dato esencial'
                             : 'Faltan ' + criticos.length + ' datos esenciales')
      : 'Faltan datos opcionales')+
      (inminente && criticos.length ? ' y la cirugía es ' + cuandoTexto(d).toLowerCase() : '')+'.</b> '+
    '<span class="mini">Tocá cualquiera para ir a completarlo.</span>'+
    (criticos.length ? '<div class="falta-chips">'+criticos.map(x => chip(x,false)).join('')+'</div>' : '')+
    (otros.length ? '<div class="falta-chips">'+otros.map(x => chip(x,true)).join('')+'</div>' : '')+
    '</div></div>';
}
