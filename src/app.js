/* =========================================================================
   APLICACION - navegacion, panel principal y arranque
   ========================================================================= */

let vistaActual = 'panel';

/* La barra inferior son los cuatro accesos del manual de flujo de trabajo:
   Inicio · Pacientes · Historial · Ajustes. Lo que sale de la barra no se
   pierde: se entra por Ajustes, y en pantalla grande sigue en el lateral.
   `navTxt` es el rotulo corto que usa la barra; el lateral usa `txt`. */
const NAV = [
  { id:'panel',       ico:'panel',       txt:'Inicio',        nav:true,  clinico:true },
  { id:'pacientes',   ico:'pacientes',   txt:'Pacientes',     nav:true,  clinico:true },
  { id:'fichas',      ico:'ficha',       txt:'Fichas',        navTxt:'Historial', nav:true, clinico:true },
  { id:'ficha',       ico:'ficha',       txt:'Ficha',         nav:false, oculto:true, clinico:true },
  { id:'stats',       ico:'stats',       txt:'Estadísticas',  nav:false, clinico:true },
  { id:'coordinador', ico:'escudo',      txt:'Coordinación',  nav:true,  soloCoord:true },
  { id:'contable',    ico:'dinero',      txt:'Contable',      nav:true,  soloCont:true },
  /* Las dos bandejas de documentación del contador. En el teléfono aparecen
     en la barra inferior sólo cuando entra el contable: para el coordinador,
     que ya tiene cinco accesos abajo, quedan en el lateral y en Ajustes. */
  { id:'envValoracion', ico:'valoracion', txt:'Valoración pre-anestésica',
    navTxt:'Valoración', nav:'cont', soloDocs:true },
  { id:'envFicha',      ico:'bandeja',    txt:'Ficha anestésica y parte quirúrgico',
    navTxt:'Fichas', nav:'cont', soloDocs:true },
  { id:'mensajes',    ico:'correo',      txt:'Mensajes',      nav:false },
  { id:'facturacion', ico:'dinero',      txt:'Facturación',   nav:false, clinico:true },
  { id:'guias',       ico:'guias',       txt:'Guías',         nav:false, clinico:true },
  /* El manual lo ve todo el mundo, tambien el contable: explica su propio
     portal y el porque de lo que no puede ver. */
  { id:'manual',      ico:'archivo',     txt:'Manual de uso', nav:false },
  { id:'perfil',      ico:'ajustes',     txt:'Mi perfil',     navTxt:'Ajustes', nav:true }
];

/* El contable no accede a ninguna vista con datos clinicos (Ley 25.326) */
function puedeVerVista(id){
  const n = NAV.find(x => x.id === id);
  if(!n) return false;
  if(n.soloCoord && !esCoordinador()) return false;
  if(n.soloCont  && !esContable())    return false;
  if(n.soloDocs  && !puedeVerEnvios()) return false;
  if(n.clinico   && !verDatosClinicos()) return false;
  return true;
}
function itemsNav(){
  return NAV.filter(n => !n.oculto && puedeVerVista(n.id));
}
function vistaInicial(){ return esContable() ? 'contable' : 'panel'; }

function pintarNavegacion(){
  const pend = esCoordinador() ? pendientes().length : 0;
  const msg  = conteoMensajes();
  const items = itemsNav();
  const nMsg = msg.noLeidos + msg.vencidos;
  const badgeDe = (n, corto) => {
    if(n.id === 'coordinador' && pend) return '<span class="badge">'+pend+'</span>';
    if(n.id === 'mensajes' && nMsg) return '<span class="badge">'+(nMsg > 99 ? '99+' : nMsg)+'</span>';
    /* Mensajes ya no está en la barra inferior: su aviso viaja en Ajustes,
       que es por donde se entra. Sin esto, un reclamo sin responder pasaría
       inadvertido en el teléfono. */
    if(corto && n.id === 'perfil' && nMsg)
      return '<span class="badge">'+(nMsg > 99 ? '99+' : nMsg)+'</span>';
    return '';
  };
  const botonNav = (n, corto) =>
    '<button data-ir="'+n.id+'"'+(vistaActual===n.id?' class="on"':'')+'>'+ico(n.ico)+
    '<span>'+esc(corto && n.navTxt ? n.navTxt : n.txt)+'</span>'+badgeDe(n, corto)+'</button>';

  const grupo = (titulo, ids) => {
    const g = items.filter(n => ids.indexOf(n.id) >= 0);
    return g.length ? '<div class="grupo">'+titulo+'</div>'+g.map(n => botonNav(n)).join('') : '';
  };

  $('#sidebar').innerHTML =
    grupo('Portal',    ['panel','pacientes','fichas','contable'])+
    grupo('Documentación', ['envValoracion','envFicha'])+
    grupo('Gestión',   ['stats','facturacion','guias','manual'])+
    grupo('Asociación',['coordinador','mensajes'])+
    grupo('Cuenta',    ['perfil']);

  $('#navbar').innerHTML = items
    .filter(n => n.nav === true || (n.nav === 'cont' && esContable()))
    .map(n => botonNav(n, true)).join('');
  $$('[data-ir]').forEach(b => b.onclick = () => irA(b.dataset.ir));
}

function irA(v){
  /* Guarda de acceso: nadie entra a una vista que su rol no habilita */
  if(!puedeVerVista(v)) v = vistaInicial();
  vistaActual = v;
  $$('.vista').forEach(x => x.classList.remove('on'));
  const el = $('#v' + v.charAt(0).toUpperCase() + v.slice(1));
  if(el) el.classList.add('on');
  window.scrollTo({ top:0, behavior:'instant' in window ? 'instant' : 'auto' });
  pintarNavegacion();
  refrescarVistaActual();
  pintarBadgeAvisos();
}

function refrescarVistaActual(){
  if(!SESION) return;
  if(!puedeVerVista(vistaActual)) return;
  switch(vistaActual){
    case 'panel':       vistaPanel(); break;
    case 'contable':      vistaContable(); break;
    case 'envValoracion': vistaEnviosValoracion(); break;
    case 'envFicha':      vistaEnviosFicha(); break;
    case 'mensajes':    vistaMensajes(); break;
    case 'pacientes':   vistaPacientes(); break;
    case 'fichas':      vistaFichas(); break;
    case 'ficha':       break;   /* se pinta sola al abrir */
    case 'stats':       vistaStats(); break;
    case 'facturacion': vistaFacturacion(); break;
    case 'guias':       vistaGuias(); break;
    case 'manual':      vistaManual(); break;
    case 'coordinador': vistaCoordinador(); break;
    case 'perfil':      vistaPerfil(); break;
  }
}

/* --------------------------------------------------------- Encabezado */
function pintarEncabezado(){
  const u = USUARIO || {};
  $('#tbCtx').innerHTML = esCoordinador()
    ? 'Portal del coordinador'
    : (esContable()
       ? 'Contable AFAAR · portal económico'
       : esc((u.apellido||'') + ', ' + (u.nombre||'')) + ' · M.P. ' + esc(matriculaTxt(u.matriculaProvincial,'M.P.')));
  pintarNavegacion();
  pintarBadgeAvisos();
}

function pintarBadgeAvisos(){
  const b = $('#badgeAvisos');
  if(!b || !SESION) return;
  const c = conteoAvisos();
  b.textContent = c.total > 99 ? '99+' : c.total;
  b.classList.toggle('oculto', c.total === 0);
  b.classList.toggle('aviso-warn', c.urgentes === 0);
}

/* ============================== PANEL ==============================
   Pantalla de inicio del flujo de trabajo: institucion, los dos accesos
   que abren el flujo y el estado de las fichas propias.
   ================================================================== */

/* La institucion elegida se recuerda y precarga cada ficha nueva */
const LS_INST = 'afar_institucion_v1';
function institucionActiva(){
  const g = localStorage.getItem(LS_INST) || '';
  return instituciones().some(i => i.id === g) ? g : '';
}
function fijarInstitucion(id){ localStorage.setItem(LS_INST, id || ''); }

function vistaPanel(){
  const cont = $('#vPanel');
  const hoy = hoyISO();
  const mes = mesDe(hoy);
  const todas = misFichas();
  /* La actividad del día son las dos cosas que puede haber hecho hoy: ver
     pacientes en el consultorio y anestesiar en el quirófano. */
  const dia = todas.filter(f => fechaCirugiaDe(f) === hoy || fechaValoracionDe(f) === hoy);
  const delMes = todas.filter(f => mesDe(fechaDeFicha(f)) === mes);
  const semana = todas.filter(f => fechaDeFicha(f) && semanaISO(fechaDeFicha(f)) === semanaISO(hoy));
  const borradores = todas.filter(f => (f.estado || 'borrador') === 'borrador');
  const finalizadas = todas.filter(f => f.estado === 'cerrada');
  const sinFirmar = todas.filter(f => { const cx = fechaCirugiaDe(f);
    return cx && cx < hoy && f.estado !== 'cerrada' && (f.acto || {}).finCirugia; });
  const honPend = honorariosDiferidos();
  /* Los importes del mes y lo pendiente de cobro se consultan en Facturación,
     no en el inicio. */
  const proximas = todas.filter(f => { const cx = fechaCirugiaDe(f);
      return cx && cx >= hoy && diasHasta(cx) <= 7; })
    .sort((a,b) => (fechaCirugiaDe(a) + (a.hora||'')) < (fechaCirugiaDe(b) + (b.hora||'')) ? -1 : 1);

  /* fila de la lista de estado: rotulo, cuenta y a donde lleva */
  const filaEstado = (id, icono, txt, n, cls) =>
    '<button class="fila-estado'+(cls?' '+cls:'')+'" id="pe'+id+'">'+
      '<span class="ic">'+ico(icono)+'</span>'+
      '<span class="tx">'+esc(txt)+'</span>'+
      '<span class="n">'+n+'</span>'+
    '</button>';

  /* Sin encabezado de saludo: el manual arranca directo en «Institución».
     La fecha y el estado de la sincronización ya están en la barra de
     arriba, así que no se pierde nada. */
  cont.innerHTML = ''+
  (hayDemo() ? '<div class="demo-banner">'+ico('alerta')+
    '<div><b>Datos de demostración.</b> La anestesióloga Laura Fernández, sus pacientes y sus fichas '+
    'son de ejemplo, para que veas cómo funciona cada pantalla.</div>'+
    '<button class="btn danger chico" id="demoBorrar">Borrar</button></div>' : '')+

  /* ----------------------- institución de trabajo ---------------------- */
  '<div class="campo inst-campo"><label>Institución</label>'+
    '<div class="inst-sel">'+ico('hospital')+
      '<select id="pnInst"><option value="">— Todas / elegir en cada ficha —</option>'+
      instituciones().map(i => '<option value="'+esc(i.id)+'"'+
        (institucionActiva()===i.id?' selected':'')+'>'+
        esc(i.nombre.split('"')[0].trim())+' · '+esc(i.ciudad)+'</option>').join('')+
      '</select></div>'+
    '<div class="ayuda">Se precarga en cada ficha nueva. Podés cambiarla dentro de la ficha.</div>'+
  '</div>'+

  /* ------------------------- accesos del flujo ------------------------- */
  '<button class="acceso pri" id="pnValoracion">'+ico('mas')+
    '<span><b>Nueva valoración preanestésica</b>'+
    '<i>Paciente, antecedentes, escalas de riesgo y plan</i></span></button>'+
  '<button class="acceso" id="pnFicha">'+ico('mas')+
    '<span><b>Nueva ficha anestésica</b>'+
    '<i>Registro del acto: drogas, signos vitales, balance y eventos</i></span></button>'+

  /* ----------------------- estado de mis fichas ------------------------ */
  '<div class="filas-estado">'+
    filaEstado('Hoy','pacientes','Mis pacientes de hoy', dia.length)+
    filaEstado('Borr','ficha','Borradores', borradores.length, borradores.length?'warn':'')+
    filaEstado('Fin','check','Finalizadas', finalizadas.length, 'ok')+
    (sinFirmar.length ? filaEstado('Firm','firma','Pendientes de firma', sinFirmar.length, 'danger') : '')+
    (honPend.length ? filaEstado('Hon','dinero','Honorarios que dejaste para después',
      honPend.length, 'danger') : '')+
  '</div>'+

  tarjetaAvisosPanel()+

  '<div class="grid c3 mb8 mt20">'+
    kpi('Esta semana', semana.length, 'azul', ico('stats'), '')+
    kpi('Este mes', delMes.length, 'azul', ico('ficha'), nombreMes(mes))+
    kpi('Pacientes', misPacientes().length, 'aqua', ico('pacientes'), 'en el padrón')+
  '</div>'+

  '<h3 style="font-size:14px;margin:20px 0 10px">Accesos rápidos</h3>'+
  '<div class="tiles">'+
    tile('irPacientes','pacientes','','Pacientes','Historia completa')+
    tile('irFichas','lista','','Historial','Todas mis fichas')+
    tile('irVademecum','jeringa','aqua','Vademécum','Dosis de adultos y pediatría')+
    tile('irStats','stats','ok','Estadísticas','Día, semana y mes')+
    tile('irFacturacion','dinero','warn','Facturación','Resumen mensual y Excel')+
    tile('irGuias','guias','danger','Guías y protocolos','Vía aérea, LAST, HM')+
    tile('irCalc','calculadora','aqua','Calculadoras','Dosis, fluidos, sangrado')+
    tile('irAvisos','campana','warn','Avisos','Recordatorios y pendientes')+
    (esCoordinador() ? tile('irCoord','escudo','danger','Coordinación','Socios y catálogos') : '')+
    tile('irPerfil','usuario','','Mi perfil','Matrícula, firma y datos')+
  '</div>'+

  (proximas.length ? '<h3 style="font-size:14px;margin:22px 0 10px">Próximas cirugías</h3>'+
    '<div class="lista">'+ proximas.map(f => {
      const p = DB.pacientes[f.pacienteId] || {};
      const d = diasHasta(f.fecha);
      const falt = faltantesFicha(f).filter(x => x.critico);
      return '<div class="item" data-fic="'+f.id+'">'+
        '<div class="avatar" style="flex-direction:column;line-height:1.15;font-size:10px;'+
          (d===0 ? 'background:var(--danger-bg);color:var(--danger)'
                 : (d===1 ? 'background:var(--warn-bg);color:var(--warn)'
                          : 'background:var(--aqua-200);color:var(--aqua-600)'))+'">'+
          '<b style="font-size:10px">'+(d===0?'HOY':(d===1?'MAÑ':fFecha(f.fecha).slice(0,5)))+'</b>'+
          '<span>'+esc(f.hora||'—')+'</span></div>'+
        '<div class="txt"><b>'+esc((p.apellido||'—')+', '+(p.nombre||''))+'</b>'+
          '<span>'+esc(f.cirugia||'sin cirugía')+' · '+esc(nombreInstitucion(f.institucion).split('"')[0].trim())+'</span></div>'+
        '<div class="der">'+(falt.length
          ? '<span class="tag danger">Faltan '+falt.length+'</span>'
          : '<span class="tag ok">Lista</span>')+'</div></div>';
    }).join('') +'</div>' : '')+

  ((misFichas().length === 0) ? '<div class="card mt20"><h3>'+ico('info')+'Cómo empezar</h3>'+
    '<ol class="mini" style="padding-left:19px;line-height:2">'+
    '<li>Completá tu perfil: matrícula, CUIT y firma digital.</li>'+
    '<li>Cargá un paciente con sus datos filiatorios y sus antecedentes.</li>'+
    '<li>Abrí una valoración preanestésica: las escalas se calculan solas.</li>'+
    '<li>El día de la cirugía, registrá el acto: drogas, signos vitales, balance y eventos.</li>'+
    '<li>Cerrá con la recuperación, firmá y descargá el documento.</li>'+
    '</ol></div>' : '')+

  '<div class="mt20 txt-c"><svg class="ecg-line" viewBox="0 0 400 22" preserveAspectRatio="none">'+
    '<path d="M0 11h60l6-8 5 16 6-8h48l6-8 5 16 6-8h48l6-8 5 16 6-8h48l6-8 5 16 6-8h74"/></svg>'+
    '<p class="mini mt8">AFAAR · Asociación Fueguina de Anestesia, Analgesia y Reanimación</p></div>';

  const ir = (id, fn) => { const e = $('#'+id); if(e) e.onclick = fn; };
  $('#pnInst').onchange = e => fijarInstitucion(e.target.value);
  ir('pnValoracion', () => nuevaFichaEnInstitucion('preanestesia'));
  ir('pnFicha',      () => nuevaFichaEnInstitucion('anestesia'));
  ir('peHoy',  () => { filtroFichas = Object.assign({}, filtroFichas, { texto:'', estado:'' });
                       irA('fichas'); });
  ir('peBorr', () => { filtroFichas = Object.assign({}, filtroFichas, { estado:'borrador' });
                       irA('fichas'); });
  ir('peFin',  () => { filtroFichas = Object.assign({}, filtroFichas, { estado:'cerrada' });
                       irA('fichas'); });
  ir('peFirm', () => { filtroFichas = Object.assign({}, filtroFichas, { estado:'realizada' });
                       irA('fichas'); });
  /* Los honorarios diferidos se abren desde acá sin esperar al cartel de
     las tres horas: el que quiere sacárselos de encima puede hacerlo ya. */
  ir('peHon', () => { marcarCartelHon0(); revisarRecordatorioHonorarios(); });
  ir('tlIrPacientes', () => irA('pacientes'));
  ir('tlIrFichas', () => irA('fichas'));
  ir('tlIrVademecum', abrirVademecumSuelto);
  ir('tlIrStats', () => irA('stats'));
  ir('tlIrFacturacion', () => irA('facturacion'));
  ir('tlIrGuias', () => irA('guias'));
  ir('tlIrCalc', abrirCalculadoras);
  ir('tlIrCoord', () => irA('coordinador'));
  ir('tlIrPerfil', () => irA('perfil'));
  ir('tlIrAvisos', abrirAvisos);
  ir('demoBorrar', confirmarBorrarDemo);
  cablearAvisosPanel();
  $$('#vPanel .item[data-fic]').forEach(i => i.onclick = () => abrirFicha(i.dataset.fic));
}

/* Abre una ficha nueva ya ubicada en la institucion elegida y en el paso
   que corresponde al acceso que se toco. */
function nuevaFichaEnInstitucion(paso){
  abrirFicha(null);
  const inst = institucionActiva();
  if(inst){ fichaActual.institucion = inst; }
  /* La opción que se tocó en el inicio es la tarea en foco: la otra sección
     queda atenuada para que la pantalla muestre una sola cosa por vez. */
  modoFicha = (paso === 'anestesia') ? 'acto' : 'valoracion';
  if(paso === 'anestesia'){
    /* Nacida por el acto: se entra directo a Anestesia y el resto del
       recorrido queda cerrado hasta tomar el acto, decidir de dónde sale la
       valoración y elegir el paciente. Ver pasoHabilitado() en core.js. */
    fichaActual.viaActo = true;
    pasoFicha = 'anestesia';
    toast('Tomá el acto anestésico para empezar.', 'ok');
  } else {
    /* Nacida por la valoración: sólo Paciente y Preanestesia. El acto todavía
       no existe y ofrecer sus tres pasos es ofrecer pantallas vacías. */
    fichaActual.viaVal = true;
    pasoFicha = 'paciente';
  }
  pintarFicha();
}

/* El vademecum tambien se puede consultar suelto, sin una ficha abierta */
function abrirVademecumSuelto(){
  if(!fichaActual) fichaActual = { pacienteId:'', fecha:hoyISO(), acto:{ drogas:[] } };
  abrirVademecum();
}

function tile(id, icono, cls, titulo, sub){
  return '<button class="tile '+(cls||'')+'" id="tl'+id.charAt(0).toUpperCase()+id.slice(1)+'">'+
    '<div class="ico">'+ico(icono)+'</div><b>'+esc(titulo)+'</b><span>'+esc(sub)+'</span></button>';
}

/* ============================== ARRANQUE ============================== */
function arrancarApp(){
  $('#pantallaAuth').style.display = 'none';
  $('#app').classList.add('on');
  pintarEncabezado();
  irA(vistaInicial());
  if(verDatosClinicos()){
    notificarCirugias();
    /* Los honorarios que el anestesiólogo dejó para después se le recuerdan
       cada tres horas hasta que los cargue. */
    iniciarRecordatorioHonorarios();
    /* Y la valoracion que quedo debiendose en un acto ya firmado. */
    iniciarRecordatorioValoracion();
  }
  /* Un tono corto si hay algo esperando: avisos, recordatorios o mensajes sin
     ver. Entrar es un gesto del usuario, asi que el navegador deja sonar; si
     igual lo bloquea, queda armado para el primer toque. */
  sonoDesde = Date.now(); sonoHecho = false;
  setTimeout(() => sonarAvisosPendientes(false), 700);
  /* Refresco periodico: avisos clinicos cada 10 min y, para que el umbral de
     2 h de los reclamos se note sin recargar, los mensajes cada 2 minutos. */
  clearInterval(window.__tAvisos);
  window.__tAvisos = setInterval(() => {
    pintarBadgeAvisos();
    pintarNavegacion();
    if(vistaActual === 'panel') vistaPanel();
  }, 600000);
  clearInterval(window.__tMensajes);
  window.__tMensajes = setInterval(() => {
    pintarNavegacion();
    pintarBadgeAvisos();
    if(vistaActual === 'mensajes') vistaMensajes();
  }, 120000);
}

function aplicarTema(t){
  document.documentElement.dataset.tema = t;
  localStorage.setItem(LS_TEMA, t);
  const b = $('#btnTema');
  if(b) b.innerHTML = t === 'oscuro' ? ico('sol') : ico('luna');
  const m = document.querySelector('meta[name=theme-color]');
  if(m) m.setAttribute('content', t === 'oscuro' ? '#050f1e' : '#0b2545');
}

function iniciar(){
  /* El logo va incrustado como data URI, no como archivo suelto */
  if(typeof LOGO_AFAAR === 'string'){
    ['logoAuth','logoTopbar'].forEach(id => { const e = $('#'+id); if(e) e.src = LOGO_AFAAR; });
  }
  parsearCatalogos();
  parsearNomenclador();
  cargarLocal();
  sembrarDemo();                       /* sólo si la base está vacía */
  aplicarTema(localStorage.getItem(LS_TEMA) || 'claro');
  iniciarNube();

  /* pestañas de la pantalla de acceso */
  $$('.auth-tabs button').forEach(b => b.onclick = () => {
    $$('.auth-tabs button').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); pasoRegistro = 1; pintarAuth();
  });
  pintarAuth();

  $('#btnTema').onclick = () =>
    aplicarTema(document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro');
  $('#btnAvisos').onclick = abrirAvisos;
  $('#chipNube').onclick = abrirSincronizacion;
  $('#btnSalir').onclick = () => confirmar('Cerrar sesión',
    '¿Querés salir del portal? Los datos quedan guardados.', cerrarSesion, 'Cerrar sesión');

  if(restaurarSesion()) arrancarApp();

  /* atajo: escape cierra modales */
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && !modalObligatorio) cerrarModal();
  });

  /* service worker (sólo si se sirve por http) */
  if('serviceWorker' in navigator && location.protocol.indexOf('http') === 0){
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
