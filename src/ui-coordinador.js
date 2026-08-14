/* =========================================================================
   PORTAL DEL COORDINADOR
   Aprobacion de socios, padron, catalogos y valores, auditoria,
   configuracion de la nube y respaldos.
   ========================================================================= */

let coordSeccion = 'solicitudes';

function pendientes(){
  return lista('usuarios').filter(u => u.rol === 'socio' && u.estado === 'pendiente');
}

function vistaCoordinador(){
  const cont = $('#vCoordinador');
  const secciones = [
    ['solicitudes','campana','Solicitudes'],
    ['padron','pacientes','Padrón'],
    ['prestadores','hospital','Prestadores'],
    ['catalogos','lista','Catálogos'],
    ['auditoria','ojo','Auditoría']
  ];
  const pend = pendientes().length;

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Portal del coordinador</h1>'+
    '<p>Gestión institucional de la Asociación Fueguina de Anestesia y Reanimación</p></div></div>'+
  '<div class="scroll-x mb8">'+ secciones.map(s =>
    '<span class="tag'+(coordSeccion===s[0]?' on':'')+'" data-cs="'+s[0]+'">'+
    ico(s[1]).replace('<svg','<svg style="width:14px;height:14px;display:inline-block;vertical-align:-2px;margin-right:4px"')+
    s[2] + (s[0]==='solicitudes' && pend ? ' ('+pend+')' : '') +'</span>').join('') +'</div>'+
  '<div id="coCuerpo"></div>';

  $$('#vCoordinador [data-cs]').forEach(t => t.onclick = () => { coordSeccion = t.dataset.cs; vistaCoordinador(); });

  const c = $('#coCuerpo');
  if(coordSeccion === 'padron')            seccionPadron(c);
  else if(coordSeccion === 'prestadores')  seccionPrestadores(c);
  else if(coordSeccion === 'catalogos')    seccionCatalogos(c);
  else if(coordSeccion === 'auditoria') seccionAuditoria(c);
  else                                  seccionSolicitudes(c);
}

/* ------------------------------------------------------- Solicitudes -- */
function seccionSolicitudes(c){
  const p = pendientes().sort((a,b) => (a.creado||'') < (b.creado||'') ? -1 : 1);
  c.innerHTML = p.length
    ? '<div class="aviso warn">'+ico('campana')+'<div><b>'+p.length+' solicitud'+(p.length===1?'':'es')+
      ' esperando aprobación.</b> Verificá matrícula y comprobante antes de habilitar el acceso.</div></div>'+
      '<div class="lista">'+ p.map(u =>
        '<div class="item" data-sol="'+u.uid+'">'+
          '<div class="avatar" style="background:var(--warn-bg);color:var(--warn)">'+esc(iniciales(u.nombre,u.apellido))+'</div>'+
          '<div class="txt"><b>'+esc(u.apellido+', '+u.nombre)+'</b>'+
            '<span>M.P. '+esc(u.matriculaProvincial||'—')+' · '+esc(u.email)+' · solicitó el '+fFecha(u.creado)+'</span></div>'+
          '<div class="der"><span class="tag warn">Pendiente</span></div>'+
        '</div>').join('') +'</div>'
    : '<div class="vacio">'+ico('check')+'<b>No hay solicitudes pendientes</b>'+
      '<span>Todas las altas fueron resueltas.</span></div>';
  $$('#coCuerpo .item[data-sol]').forEach(i => i.onclick = () => revisarSolicitud(i.dataset.sol));
}

function revisarSolicitud(u){
  const s = DB.usuarios[u]; if(!s) return;
  const insts = (s.instituciones||[]).map(nombreInstitucion).join(' · ') || '—';
  abrirModal('Revisión de solicitud',
    '<div class="card plano" style="border:1px solid var(--borde)">'+
      fila('Apellido y nombre', s.apellido+', '+s.nombre)+
      fila('DNI', s.dni||'—')+
      fila('Fecha de nacimiento', fFecha(s.fechaNac))+
      fila('Matrícula nacional', s.matriculaNacional||'—')+
      fila('Matrícula provincial', s.matriculaProvincial||'—')+
      fila('Título', s.titulo||'—')+
      fila('Correo', s.email)+
      fila('Teléfono', s.telefono||'—')+
      fila('CUIT', s.cuit||'—')+
      fila('Lugares de trabajo', insts)+
      fila('Solicitud enviada', fFechaLarga(s.creado))+
    '</div>'+
    (s.comprobante
      ? '<div class="mt14"><label class="mini strong">Comprobante de socio AFAR</label>'+
        ((s.comprobante.tipo||'').indexOf('pdf') >= 0
          ? '<div class="aviso info mt8">'+ico('archivo')+'<div>'+esc(s.comprobante.nombre)+' (PDF)</div></div>'
          : '<img src="'+s.comprobante.dataUrl+'" style="width:100%;border-radius:10px;margin-top:8px" alt="Comprobante">')+
        '</div>'
      : '<div class="aviso danger mt14">'+ico('alerta')+'<div>No adjuntó comprobante.</div></div>'),
    '<button class="btn danger" id="solRechazar">'+ico('equis')+' Denegar</button>'+
    '<button class="btn ok" id="solAprobar">'+ico('check')+' Aprobar acceso</button>');

  $('#solAprobar').onclick = () => {
    s.estado = 'aprobado'; s.aprobadoPor = SESION.uid; s.aprobadoEn = hoyISO();
    escribir('usuarios', s.uid, s);
    auditar('socio-aprobar', s.apellido+', '+s.nombre);
    cerrarModal(); toast('Acceso aprobado.', 'ok'); vistaCoordinador(); pintarEncabezado();
  };
  $('#solRechazar').onclick = () => {
    abrirModal('Denegar solicitud',
      campoArea('rcMotivo','Motivo de la denegación', '',
        'Se le muestra al solicitante cuando intente ingresar'),
      '<button class="btn ghost" data-cerrar>Cancelar</button>'+
      '<button class="btn danger" id="rcOK">Denegar acceso</button>');
    $('#rcOK').onclick = () => {
      s.estado = 'rechazado'; s.motivoRechazo = $('#rcMotivo').value.trim() || 'Sin detalle.';
      s.aprobadoPor = SESION.uid; s.aprobadoEn = hoyISO();
      escribir('usuarios', s.uid, s);
      auditar('socio-rechazar', s.apellido+', '+s.nombre);
      cerrarModal(); toast('Solicitud denegada.', 'warn'); vistaCoordinador(); pintarEncabezado();
    };
  };
}

/* ------------------------------------------------------------ Padrón -- */
function seccionPadron(c){
  const socios = lista('usuarios').filter(u => u.rol === 'socio')
    .sort((a,b) => (a.apellido||'').localeCompare(b.apellido||'', 'es'));
  const color = { aprobado:'ok', pendiente:'warn', rechazado:'danger', suspendido:'danger' };
  c.innerHTML = socios.length
    ? '<div class="grid c4 mb8">'+
        kpi('Socios activos', socios.filter(s=>s.estado==='aprobado').length, 'ok', ico('pacientes'))+
        kpi('Pendientes', socios.filter(s=>s.estado==='pendiente').length, 'warn', ico('reloj'))+
        kpi('Suspendidos', socios.filter(s=>s.estado==='suspendido').length, '', ico('candado'))+
        kpi('Denegados', socios.filter(s=>s.estado==='rechazado').length, '', ico('equis'))+
      '</div>'+
      '<div class="lista">'+ socios.map(u => {
        const nf = lista('fichas').filter(f => f.ownerUid === u.uid).length;
        return '<div class="item" data-soc="'+u.uid+'">'+
          '<div class="avatar">'+esc(iniciales(u.nombre,u.apellido))+'</div>'+
          '<div class="txt"><b>'+esc(u.apellido+', '+u.nombre)+'</b>'+
            '<span>M.P. '+esc(u.matriculaProvincial||'—')+' · '+nf+' fichas · '+esc(u.email)+'</span></div>'+
          '<div class="der"><span class="tag '+(color[u.estado]||'')+'">'+esc(u.estado)+'</span></div></div>';
      }).join('') +'</div>'
    : '<div class="vacio">'+ico('pacientes')+'<b>Padrón vacío</b><span>Todavía no hay socios registrados.</span></div>';
  $$('#coCuerpo .item[data-soc]').forEach(i => i.onclick = () => fichaSocio(i.dataset.soc));
}

function fichaSocio(u){
  const s = DB.usuarios[u]; if(!s) return;
  const fichas = lista('fichas').filter(f => f.ownerUid === u);
  const hon = fichas.reduce((a,f) => a + Number((f.hon||{}).total||0), 0);
  abrirModal(s.apellido+', '+s.nombre,
    '<div class="grid c3 mb8">'+
      kpi('Fichas', fichas.length, 'azul')+
      kpi('Pacientes', new Set(fichas.map(f=>f.pacienteId)).size, 'aqua')+
      kpi('Honorarios', fMoneda(hon), 'ok')+
    '</div>'+
    '<div class="card plano" style="border:1px solid var(--borde)">'+
      fila('Estado', s.estado)+
      fila('Correo', s.email)+
      fila('DNI', s.dni||'—')+
      fila('Matrícula nacional', s.matriculaNacional||'—')+
      fila('Matrícula provincial', s.matriculaProvincial||'—')+
      fila('Teléfono', s.telefono||'—')+
      fila('CUIT / IVA', (s.cuit||'—')+' · '+(s.condicionIva||'—'))+
      fila('Instituciones', (s.instituciones||[]).map(nombreInstitucion).join(' · ')||'—')+
      fila('Alta', fFechaLarga(s.creado))+
      (s.aprobadoEn ? fila('Resuelta el', fFecha(s.aprobadoEn)) : '')+
    '</div>',
    '<button class="btn ghost" id="scComprobante">'+ico('adjunto')+' Comprobante</button>'+
    (s.estado === 'suspendido'
      ? '<button class="btn ok" id="scReactivar">'+ico('check')+' Reactivar</button>'
      : '<button class="btn warn" id="scSuspender">'+ico('candado')+' Suspender</button>')+
    '<button class="btn danger" id="scClave">'+ico('candado')+' Resetear clave</button>');

  $('#scComprobante').onclick = () => verComprobante(s);
  if($('#scSuspender')) $('#scSuspender').onclick = () => {
    s.estado = 'suspendido'; escribir('usuarios', s.uid, s);
    auditar('socio-suspender', s.apellido); cerrarModal(); vistaCoordinador(); toast('Socio suspendido.', 'warn');
  };
  if($('#scReactivar')) $('#scReactivar').onclick = () => {
    s.estado = 'aprobado'; escribir('usuarios', s.uid, s);
    auditar('socio-reactivar', s.apellido); cerrarModal(); vistaCoordinador(); toast('Socio reactivado.', 'ok');
  };
  $('#scClave').onclick = () => {
    const nueva = 'afar' + Math.floor(1000 + Math.random()*9000);
    confirmar('Resetear contraseña',
      'Se asigna la contraseña provisoria <b>'+nueva+'</b> a '+esc(s.apellido)+'. '+
      'Anotala y comunicásela: no se puede recuperar después.',
      () => {
        s.salt = Math.random().toString(36).slice(2,12);
        s.passHash = hashClave(nueva, s.salt);
        escribir('usuarios', s.uid, s);
        auditar('socio-reset-clave', s.apellido);
        cerrarModal();
        abrirModal('Contraseña provisoria',
          '<div class="aviso ok">'+ico('candado')+'<div>Nueva contraseña de '+esc(s.apellido+', '+s.nombre)+
          ':<br><b style="font-size:22px;letter-spacing:.1em">'+nueva+'</b></div></div>',
          '<button class="btn pri" data-cerrar>Listo</button>');
      }, 'Resetear', true);
  };
}

/* --------------------------------------------------------- Catálogos -- */
function seccionCatalogos(c){
  const vu = DB.config.valoresUnidad || {};
  const extraCie = extras('cie'), extraCx = extras('cx');
  c.innerHTML = ''+
  '<div class="card"><h3>'+ico('dinero')+'Valor de la unidad anestésica por financiador</h3>'+
    '<p class="mini mb8">Se aplica automáticamente al abrir la solapa de honorarios de cada ficha. '+
      'El CUIT y los datos de contacto de cada financiador se cargan en la solapa <b>Prestadores</b>.</p>'+
    campoNum('vuDefault','Valor por defecto', vu._default, 'step="0.01"')+
    '<div class="tabla-wrap"><table><thead><tr><th>Financiador</th><th class="num" style="width:150px">Valor unidad</th></tr></thead><tbody>'+
      obrasSociales().map((o,i) => '<tr><td>'+esc(o)+'</td>'+
        '<td><input type="number" step="0.01" data-vu="'+esc(o)+'" value="'+esc(vu[o]||'')+'" '+
        'style="padding:5px 8px;text-align:right"></td></tr>').join('')+
    '</tbody></table></div>'+
    '<button class="btn pri mt14" id="vuGuardar">'+ico('check')+' Guardar valores</button>'+
  '</div>'+

  '<div class="card"><h3>'+ico('hospital')+'Instituciones y financiadores</h3>'+
    '<p class="mini">Se administran en la solapa <b>Prestadores</b>: alta, edición, datos de '+
      'facturación, fusión de duplicados y baja.</p>'+
    '<button class="btn ghost chico mt8" id="coIrPrestadores">'+ico('hospital')+' Ir a Prestadores</button>'+
  '</div>'+

  '<div class="card"><h3>'+ico('lista')+'Agregados manualmente por los socios</h3>'+
    '<div class="grid c2">'+
      '<div><b class="mini">Diagnósticos ('+extraCie.length+')</b>'+
        (extraCie.length ? '<ul class="mini" style="padding-left:18px;line-height:1.7">'+
          extraCie.slice(0,40).map(e => '<li>'+esc(e.d)+'</li>').join('')+'</ul>'
          : '<p class="mini">Ninguno.</p>')+'</div>'+
      '<div><b class="mini">Cirugías ('+extraCx.length+')</b>'+
        (extraCx.length ? '<ul class="mini" style="padding-left:18px;line-height:1.7">'+
          extraCx.slice(0,40).map(e => '<li>'+esc(e.n)+' — '+e.ua+' UA</li>').join('')+'</ul>'
          : '<p class="mini">Ninguna.</p>')+'</div>'+
    '</div>'+
    '<p class="mini mt14">Catálogo de base: '+CIE10.length+' códigos CIE-10 y '+CIRUGIAS.length+
    ' procedimientos quirúrgicos precargados.</p>'+
  '</div>'+

  '<div class="card" style="border:1.5px solid var('+(hayDemo()?'--warn':'--borde')+')">'+
    '<h3>'+ico(hayDemo()?'alerta':'pacientes')+'Datos de demostración</h3>'+
    (hayDemo()
      ? '<p class="mini mb8">Anestesiólogos de ejemplo con pacientes y fichas en distintos estados, '+
        'para que se vea cómo funciona cada pantalla. No son datos reales y '+
        '<b>nunca se envían a la base compartida</b>: viven sólo en este dispositivo.</p>'
      : '<p class="mini mb8">Carga seis anestesiólogos de ejemplo con pacientes y fichas en distintos '+
        'estados —valoraciones sin acto, actos sin honorarios, deuda vieja sin cobrar, una solicitud de '+
        'alta pendiente y un reclamo sin responder— para recorrer la aplicación entera. '+
        '<b>No tocan la base compartida.</b></p>')+
    (faltaEquipoDemo() && hayDemo()
      ? '<div class="aviso info" style="margin-bottom:11px">'+ico('info')+
        '<div>Tenés cargada la demostración original (Fernández y Gómez). Faltan los otros '+
        '<b>cuatro anestesiólogos</b> —Torres, Sosa, Méndez y Vidal— con sus fichas, su deuda vieja '+
        'y un reclamo sin responder.</div></div>' : '')+
    '<div class="btn-row">'+
      (faltaEquipoDemo()
        ? '<button class="btn pri" id="coCargarDemo">'+ico('mas')+
          (hayDemo() ? ' Completar la demostración' : ' Cargar datos de demostración')+'</button>' : '')+
      (hayDemo()
        ? '<button class="btn danger" id="coBorrarDemo">'+ico('borrar')+' Borrar la demostración</button>' : '')+
    '</div>'+
  '</div>';

  $('#vuGuardar').onclick = () => {
    const v = { _default: Number($('#vuDefault').value) || 0 };
    $$('[data-vu]').forEach(i => { if(i.value) v[i.dataset.vu] = Number(i.value) || 0; });
    DB.config.valoresUnidad = v;
    escribir('config', 'valoresUnidad', v);
    DB.config.valoresUnidad = v;
    auditar('catalogo-valores', 'Actualización de valores de unidad');
    toast('Valores guardados.', 'ok');
  };
  if($('#coBorrarDemo')) $('#coBorrarDemo').onclick = confirmarBorrarDemo;
  if($('#coCargarDemo')) $('#coCargarDemo').onclick = () => confirmar(
    hayDemo() ? 'Completar la demostración' : 'Cargar datos de demostración',
    'Se agregan los anestesiólogos de ejemplo que falten, con sus pacientes y fichas. Quedan sólo en '+
    'este dispositivo, no viajan a la base compartida, y los podés borrar cuando quieras.',
    () => {
      const n = sembrarDemoManual();
      if(!n) return toast('La demostración ya estaba completa.', 'warn');
      auditar('demo-carga', 'Datos de demostración cargados en este dispositivo');
      toast('Demostración cargada.', 'ok');
      vistaCoordinador();
    }, 'Cargar');
  if($('#coIrPrestadores')) $('#coIrPrestadores').onclick = () => { coordSeccion='prestadores'; vistaCoordinador(); };
  $$('[data-delinst]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    confirmar('Eliminar institución', 'Las fichas ya cargadas conservan el nombre.',
      () => { eliminar('instituciones', b.dataset.delinst); vistaCoordinador(); }, 'Eliminar', true);
  });
}

/* --------------------------------------------------------- Auditoría -- */
function seccionAuditoria(c){
  const l = lista('auditoria').sort((a,b) => a.cuando < b.cuando ? 1 : -1).slice(0, 200);
  c.innerHTML = ''+
  '<div class="aviso info">'+ico('ojo')+'<div>Registro de accesos y cambios. Se conservan los últimos 800 eventos.</div></div>'+
  (l.length ? '<div class="tabla-wrap"><table><thead><tr><th>Fecha y hora</th><th>Usuario</th>'+
    '<th>Acción</th><th>Detalle</th></tr></thead><tbody>'+
    l.map(x => '<tr><td>'+fFecha(x.cuando)+' '+String(x.cuando).slice(11,16)+'</td>'+
      '<td>'+esc(x.quien)+'</td><td><span class="tag">'+esc(x.accion)+'</span></td>'+
      '<td>'+esc(x.detalle)+'</td></tr>').join('')+
    '</tbody></table></div>'
    : '<div class="vacio">'+ico('ojo')+'<b>Sin eventos registrados</b></div>');
}


/* =========================================================================
   SINCRONIZACION
   No es una solapa: se abre tocando el indicador del encabezado.
   El estado lo ve cualquiera; TODO lo que modifique la base de datos queda
   detras de la credencial de coordinacion, y cada cambio se asienta en
   Firebase (auditoria + config/nube) para que quede constancia de quien lo
   hizo, cuando y desde que dispositivo.
   ========================================================================= */
let nubeDesbloqueada = false;      /* se reinicia al recargar la aplicacion */

function abrirSincronizacion(){
  const cfg = configNube();
  const conectada = !!(cfg && cfg.databaseURL);
  const ult = DB.config && DB.config.nube;

  /* ---------- Estado, visible para todos ---------- */
  const estado = conectada
    ? '<div class="aviso '+(nubeOK?'ok':'warn')+'">'+ico(nubeOK?'check':'reloj')+
        '<div><b>'+(nubeOK ? 'Todo sincronizado.' : 'Sin conexión en este momento.')+'</b><br>'+
        (nubeOK
          ? 'Cada cambio se guarda al instante y aparece en el resto de los dispositivos de la asociación.'
          : 'Podés seguir trabajando: los cambios se guardan en este dispositivo y se envían solos '+
            'cuando vuelva internet.')+
        '</div></div>'+
      (usandoConfigEmbebida()
        ? '<div class="aviso info">'+ico('candado')+'<div><b>Configuración incluida en la aplicación.</b><br>'+
          'Nadie tiene que cargar nada: cada dispositivo se conecta solo al abrirla. '+
          'Para cambiar de proyecto, pegá otra configuración acá abajo; para dejar este equipo '+
          'trabajando en local, usá «Desconectar».</div></div>'
        : '')+
      '<div class="card plano" style="border:1px solid var(--borde)">'+
        fila('Base de datos', cfg.projectId || '—')+
        fila('Origen', usandoConfigEmbebida() ? 'incluida en la app' : 'cargada en este dispositivo')+
        fila('Socios', String(lista('usuarios').filter(u => u.rol === 'socio').length))+
        fila('Pacientes', String(lista('pacientes').length))+
        fila('Fichas', String(lista('fichas').length))+
        (ult ? fila('Última modificación',
          fFecha(ult.cuando) + ' ' + String(ult.cuando).slice(11,16) + ' h — ' + (ult.quien || '—')) : '')+
      '</div>'
    : '<div class="aviso warn">'+ico('alerta')+
        '<div><b>Los datos se guardan sólo en este dispositivo.</b><br>'+
        'Lo que carga cada socio no se ve en los demás equipos. La base compartida se '+
        'configura una sola vez.</div></div>';

  /* ---------- Zona protegida ---------- */
  const candado =
    '<hr class="sep">'+
    '<div class="aviso info" style="margin-bottom:11px">'+ico('candado')+
      '<div><b>Configuración protegida.</b><br>'+
      'Cambiar la base de datos, descargar la copia de seguridad o restaurarla '+
      'requiere la credencial de coordinación de la AFAR.</div></div>'+
    '<div class="campo"><label>Credencial de coordinación</label>'+
      '<input type="password" id="snClave" inputmode="numeric" autocomplete="off" placeholder="••••"></div>'+
    '<button class="btn ghost full" id="snDesbloquear">'+ico('candado')+' Desbloquear</button>';

  const avanzado =
    '<hr class="sep">'+
    '<div class="aviso ok" style="margin-bottom:11px">'+ico('check')+
      '<div><b>Configuración desbloqueada.</b> Todo cambio queda registrado en la base '+
      'con tu nombre, la fecha y el dispositivo.</div></div>'+
    '<div class="campo"><label>Configuración de Firebase</label>'+
      '<textarea id="fbCfg" style="min-height:'+(conectada?'120':'150')+'px;font-family:var(--mono);font-size:11.5px" '+
      'placeholder=\'const firebaseConfig = {\n  apiKey: "…",\n  databaseURL: "https://afar-anestesia-default-rtdb.firebaseio.com",\n  projectId: "afar-anestesia",\n  …\n};\'>'+
      (conectada ? esc(JSON.stringify(cfg, null, 2)) : '')+'</textarea>'+
      (conectada ? '<div class="ayuda">Reemplazá el contenido sólo si vas a mudar la asociación a otro proyecto de Firebase.</div>'
                 : '<div class="ayuda">Pegá el bloque que muestra la consola de Firebase. El paso a paso está en PUBLICAR.md.</div>')+
    '</div>'+
    '<div class="btn-row">'+
      '<button class="btn pri chico" id="fbConectar">'+ico('nube')+
        (conectada ? ' Guardar cambios' : ' Conectar')+'</button>'+
      (conectada ? '<button class="btn danger chico" id="fbDesconectar">Desconectar</button>' : '')+
    '</div>'+
    '<hr class="sep">'+
    '<p class="mini mb8">Copia de seguridad con todos los datos de la asociación. '+
      (conectada ? 'Firebase ya los conserva; esto es un resguardo adicional.'
                 : 'Guardala en un lugar seguro: hoy los datos viven sólo en este equipo.')+'</p>'+
    '<div class="btn-row">'+
      '<button class="btn ghost chico" id="snRespaldo">'+ico('descargar')+' Descargar copia</button>'+
      '<button class="btn ghost chico" id="snRestaurar">'+ico('refrescar')+' Restaurar copia</button>'+
      '<button class="btn ghost chico" id="snBloquear">'+ico('candado')+' Volver a bloquear</button>'+
    '</div>'+
    '<input type="file" id="bkArchivo" accept="application/json" class="oculto">';

  abrirModal('Sincronización', estado + (nubeDesbloqueada ? avanzado : candado),
    '<button class="btn pri" data-cerrar>Cerrar</button>');

  /* ---------------- desbloqueo ---------------- */
  if($('#snDesbloquear')){
    const intentar = () => {
      const c = $('#snClave').value.trim();
      if(c !== CLAVE_COORDINADOR){
        auditar('base-de-datos-intento-fallido', 'Credencial incorrecta al intentar abrir la configuración');
        $('#snClave').value = '';
        return toast('Credencial de coordinación incorrecta.', 'err');
      }
      nubeDesbloqueada = true;
      auditar('base-de-datos-desbloqueo', 'Se abrió la configuración de la base de datos');
      cerrarModal();
      setTimeout(abrirSincronizacion, 150);
    };
    $('#snDesbloquear').onclick = intentar;
    $('#snClave').onkeydown = e => { if(e.key === 'Enter') intentar(); };
    setTimeout(() => { const i = $('#snClave'); if(i) i.focus(); }, 250);
  }
  if($('#snBloquear')) $('#snBloquear').onclick = () => {
    nubeDesbloqueada = false; cerrarModal(); setTimeout(abrirSincronizacion, 150);
  };

  /* ---------------- conectar / cambiar de base ---------------- */
  if($('#fbConectar')) $('#fbConectar').onclick = () => {
    if(!nubeDesbloqueada) return toast('Configuración bloqueada.', 'err');
    const txt = $('#fbCfg').value.trim();
    if(!txt) return toast('Pegá la configuración de Firebase.', 'err');
    let cfgN;
    try{
      cfgN = JSON.parse(txt.replace(/^\s*(const|let|var)\s+\w+\s*=\s*/,'').replace(/;\s*$/,'')
        .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g,'$1"$2":').replace(/'/g,'"'));
    }catch(e){ return toast('No se pudo leer la configuración. Copiá el bloque completo, con las llaves.', 'err'); }
    if(!cfgN.databaseURL)
      return toast('Falta la línea databaseURL: creá la Realtime Database en Firebase y volvé a copiar el bloque.', 'err');

    const mudanza = conectada && cfg.databaseURL !== cfgN.databaseURL;
    const aplicar = () => {
      registrarCambioNube(conectada ? (mudanza ? 'cambiar' : 'actualizar') : 'conectar', cfgN);
      guardarConfigNube(cfgN);
      toast('Conectando…', 'ok');
      setTimeout(() => location.reload(), 800);
    };
    if(mudanza){
      confirmar('Cambiar de base de datos',
        'Vas a apuntar la aplicación a <b>'+esc(cfgN.projectId || cfgN.databaseURL)+'</b>, distinta de la actual. '+
        'Los socios pasarán a ver los datos de la base nueva. El cambio queda registrado a tu nombre.',
        aplicar, 'Cambiar de base', true);
    } else aplicar();
  };

  if($('#fbDesconectar')) $('#fbDesconectar').onclick = () => confirmar('Desconectar la base compartida',
    'La aplicación vuelve a guardar sólo en este dispositivo. Los datos ya sincronizados quedan en Firebase. '+
    'El cambio queda registrado a tu nombre.',
    () => {
      registrarCambioNube('desconectar', cfg);
      guardarConfigNube(null);
      setTimeout(() => location.reload(), 500);
    }, 'Desconectar', true);

  /* ---------------- copia de seguridad ---------------- */
  if($('#snRespaldo')) $('#snRespaldo').onclick = () => {
    if(!nubeDesbloqueada) return toast('Configuración bloqueada.', 'err');
    descargar('afar-copia-'+hoyISO()+'.json',
      JSON.stringify({ app:'AFAR by Yanina Andino', version:window.AFAR_BUILD,
                       generado:new Date().toISOString(), datos:DB }, null, 2),
      'application/json');
    auditar('respaldo', 'Descarga de copia de seguridad');
    toast('Copia descargada.', 'ok');
  };
  if($('#snRestaurar')) $('#snRestaurar').onclick = () => {
    if(!nubeDesbloqueada) return toast('Configuración bloqueada.', 'err');
    $('#bkArchivo').click();
  };
  if($('#bkArchivo')) $('#bkArchivo').onchange = e => {
    const f = e.target.files[0]; if(!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try{
        const d = JSON.parse(fr.result);
        const datos = d.datos || d;
        confirmar('Restaurar copia',
          'Se fusionan los datos del archivo con los actuales. Los registros con el mismo identificador se sobrescriben.',
          () => {
            COLECCIONES.forEach(col => Object.keys(datos[col] || {})
              .forEach(id => escribir(col, id, datos[col][id])));
            auditar('restaurar', f.name);
            toast('Copia restaurada.', 'ok');
            cerrarModal(); refrescarVistaActual();
          }, 'Restaurar');
      }catch(err){ toast('El archivo no es una copia válida de AFAR.', 'err'); }
    };
    fr.readAsText(f);
  };
}

/* ------------------------------------------- Borrado de la demostración */
function confirmarBorrarDemo(){
  confirmar('Borrar los datos de demostración',
    'Se eliminan la anestesióloga de ejemplo, sus pacientes y sus fichas en todos los dispositivos. '+
    'Los datos reales que hayas cargado no se tocan.',
    () => {
      const n = borrarDemo();
      auditar('demo-borrar', n + ' registros');
      toast(n + ' registros de demostración eliminados.', 'ok');
      if(SESION && SESION.uid === 'usr_demo') return cerrarSesion();
      irA(vistaActual === 'coordinador' ? 'coordinador' : 'panel');
    }, 'Borrar todo', true);
}
