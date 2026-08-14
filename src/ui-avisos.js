/* =========================================================================
   AVISOS Y ALARMAS
   Recordatorios de cirugías próximas, datos faltantes en cada ficha,
   pendientes de facturación y de cobro, y perfil incompleto.
   Se muestran en la campana del encabezado y resumidos en el panel.
   ========================================================================= */

/* ------------------------------------------- Qué le falta a una ficha -- */
function faltantesFicha(f){
  const m = [];
  const hoy = hoyISO();
  const pasada = (f.fecha || '') < hoy;
  const v = f.v || {}, sc = v.scores || {}, pl = f.plan || {}, a = f.acto || {}, h = f.hon || {};

  if(!f.pacienteId)                        m.push({ t:'paciente', s:'qx', critico:true });
  if(!f.institucion)                       m.push({ t:'institución', s:'qx', critico:true });
  if(!f.cirugia)                           m.push({ t:'cirugía', s:'qx', critico:true });
  if(!f.obraSocial)                        m.push({ t:'financiador', s:'qx' });
  if(!f.cirujano)                          m.push({ t:'cirujano', s:'qx' });
  if(!sc.asa)                              m.push({ t:'clasificación ASA', s:'val', critico:true });
  if(!(v.cie10 || []).length)              m.push({ t:'diagnósticos CIE-10', s:'val' });
  if(!(v.examen || {}).ta)                 m.push({ t:'signos vitales', s:'val' });
  if(!(v.va || {}).mallampati)             m.push({ t:'evaluación de la vía aérea', s:'val', critico:true });
  if(!(v.lab || {}).hb)                    m.push({ t:'laboratorio', s:'val' });
  if(!(v.ayuno || {}).tipo)                m.push({ t:'control de ayuno', s:'val' });
  if(!(v.riesgo || {}).fundamento)         m.push({ t:'conclusión de aptitud', s:'val', critico:true });
  if(!(pl.tecnica || []).length)           m.push({ t:'plan anestésico', s:'plan', critico:true });
  if(!(f.consent || {}).quien)             m.push({ t:'consentimiento informado', s:'consent', critico:true });
  if(pasada){
    if(!a.finAnestesia)                    m.push({ t:'registro del acto anestésico', s:'acto', critico:true });
    if(!a.aldreteTotal)                    m.push({ t:'Aldrete al egreso', s:'acto' });
    if(!(a.eventos || []).length)          m.push({ t:'eventos intraoperatorios', s:'acto' });
  }
  if(esActorFicha(f) && !h.modalidad)      m.push({ t:'honorarios del acto', s:'hon' });
  if(esAutorFicha(f) && !(f.honConsulta||{}).modalidad)
                                           m.push({ t:'honorarios de la consulta', s:'hon' });
  return m;
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
  const fichas = misFichas();

  /* --- 1. Solicitudes de acceso (coordinación) --- */
  if(esCoordinador()){
    const p = pendientes().length;
    if(p) av.push({ nivel:'danger', icono:'campana', orden:0,
      titulo: p + ' solicitud' + (p===1?'':'es') + ' de acceso sin resolver',
      detalle:'Verificá matrícula y comprobante de socio para habilitar el ingreso.',
      accion: () => { coordSeccion = 'solicitudes'; irA('coordinador'); } });
  }

  /* --- 2. Cirugías de los próximos 7 días --- */
  fichas.filter(f => f.fecha && f.fecha >= hoy && diasHasta(f.fecha) <= 7)
    .sort((a,b) => (a.fecha + (a.hora||'')) < (b.fecha + (b.hora||'')) ? -1 : 1)
    .forEach(f => {
      const d = diasHasta(f.fecha);
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
  fichas.filter(f => f.fecha && f.fecha < hoy && !(f.acto || {}).finAnestesia)
    .sort((a,b) => a.fecha < b.fecha ? 1 : -1).slice(0, 12)
    .forEach(f => {
      const p = DB.pacientes[f.pacienteId] || {};
      av.push({ nivel:'warn', icono:'monitor', orden:30,
        titulo:'Sin registro del acto anestésico — ' + (p.apellido||'—') + ', ' + (p.nombre||''),
        detalle:(f.cirugia||'') + ' del ' + fFecha(f.fecha) + ' (' + cuandoTexto(diasHasta(f.fecha)) + ').' +
                '\nCompletá tiempos, técnica realizada, eventos y Aldrete.',
        fichaId:f.id, solapa:'acto' });
    });

  /* --- 4. Cirugías realizadas sin honorarios cargados --- */
  fichas.filter(f => f.fecha && f.fecha < hoy && esActorFicha(f) && !(f.hon || {}).modalidad)
    .sort((a,b) => a.fecha < b.fecha ? 1 : -1).slice(0, 12)
    .forEach(f => {
      const p = DB.pacientes[f.pacienteId] || {};
      av.push({ nivel:'warn', icono:'dinero', orden:35,
        titulo:'Sin honorarios cargados — ' + (p.apellido||'—') + ', ' + (p.nombre||''),
        detalle:(f.cirugia||'') + ' del ' + fFecha(f.fecha) +
                '.\nMientras no cargues la modalidad del acto no aparece en tu facturación del mes.',
        fichaId:f.id, solapa:'hon' });
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
    f.fecha && diasHasta(f.fecha) < -14);
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
        if(a.solapa === 'consent'){ abrirConsentimiento(fichaActual); }
        else if(a.solapa){ solapaFicha = a.solapa; pintarFicha(); }
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
    new Notification('AFAR — ' + partes.join(' y '), {
      body: (hoy.length
        ? hoy.map(f => (f.hora||'') + ' ' + (f.cirugia||'sin cirugía')).join('\n')
        : 'Sin cirugías hoy.') +
        (incompletas ? '\n⚠ ' + incompletas + ' ficha(s) con datos esenciales sin cargar.' : ''),
      icon:'icons/icon-192.png', tag:'afar-cirugias'
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
      if(a.solapa === 'consent') abrirConsentimiento(fichaActual);
      else if(a.solapa){ solapaFicha = a.solapa; pintarFicha(); }
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
  const d = diasHasta(f.fecha);
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
