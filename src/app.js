/* =========================================================================
   APLICACION - navegacion, panel principal y arranque
   ========================================================================= */

let vistaActual = 'panel';

const NAV = [
  { id:'panel',       ico:'panel',       txt:'Inicio',        nav:true,  clinico:true },
  { id:'pacientes',   ico:'pacientes',   txt:'Pacientes',     nav:true,  clinico:true },
  { id:'fichas',      ico:'ficha',       txt:'Fichas',        nav:true,  clinico:true },
  { id:'ficha',       ico:'ficha',       txt:'Ficha',         nav:false, oculto:true, clinico:true },
  { id:'stats',       ico:'stats',       txt:'Estadísticas',  nav:true,  clinico:true },
  { id:'coordinador', ico:'escudo',      txt:'Coordinación',  nav:true,  soloCoord:true },
  { id:'contable',    ico:'dinero',      txt:'Contable',      nav:true,  soloCont:true },
  { id:'mensajes',    ico:'correo',      txt:'Mensajes',      nav:true  },
  { id:'facturacion', ico:'dinero',      txt:'Facturación',   nav:false, clinico:true },
  { id:'guias',       ico:'guias',       txt:'Guías',         nav:false, clinico:true },
  { id:'perfil',      ico:'usuario',     txt:'Mi perfil',     nav:true  }
];

/* El contable no accede a ninguna vista con datos clinicos (Ley 25.326) */
function puedeVerVista(id){
  const n = NAV.find(x => x.id === id);
  if(!n) return false;
  if(n.soloCoord && !esCoordinador()) return false;
  if(n.soloCont  && !esContable())    return false;
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
  const badgeDe = n => {
    if(n.id === 'coordinador' && pend) return '<span class="badge">'+pend+'</span>';
    if(n.id === 'mensajes'){
      const t = msg.noLeidos + msg.vencidos;
      if(t) return '<span class="badge">'+(t > 99 ? '99+' : t)+'</span>';
    }
    return '';
  };
  const botonNav = n =>
    '<button data-ir="'+n.id+'"'+(vistaActual===n.id?' class="on"':'')+'>'+ico(n.ico)+
    '<span>'+esc(n.txt)+'</span>'+badgeDe(n)+'</button>';

  const grupo = (titulo, ids) => {
    const g = items.filter(n => ids.indexOf(n.id) >= 0);
    return g.length ? '<div class="grupo">'+titulo+'</div>'+g.map(botonNav).join('') : '';
  };

  $('#sidebar').innerHTML =
    grupo('Portal',    ['panel','pacientes','fichas','contable'])+
    grupo('Gestión',   ['stats','facturacion','guias'])+
    grupo('Asociación',['coordinador','mensajes'])+
    grupo('Cuenta',    ['perfil']);

  $('#navbar').innerHTML = items.filter(n => n.nav).map(botonNav).join('');
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
    case 'contable':    vistaContable(); break;
    case 'mensajes':    vistaMensajes(); break;
    case 'pacientes':   vistaPacientes(); break;
    case 'fichas':      vistaFichas(); break;
    case 'ficha':       break;   /* se pinta sola al abrir */
    case 'stats':       vistaStats(); break;
    case 'facturacion': vistaFacturacion(); break;
    case 'guias':       vistaGuias(); break;
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
       : esc((u.apellido||'') + ', ' + (u.nombre||'')) + ' · M.P. ' + esc(u.matriculaProvincial||'—'));
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

/* ============================== PANEL ============================== */
function vistaPanel(){
  const cont = $('#vPanel');
  const hoy = hoyISO();
  const mes = mesDe(hoy);
  const todas = misFichas();
  const dia = todas.filter(f => f.fecha === hoy);
  const delMes = todas.filter(f => mesDe(f.fecha) === mes);
  const semana = todas.filter(f => f.fecha && semanaISO(f.fecha) === semanaISO(hoy));
  const prest = misPrestaciones();
  const honMes = prest.filter(x => mesDe(x.fecha) === mes).reduce((a,x) => a + x.monto, 0);
  const pendCobro = prest.filter(x => ['Pendiente','Presentado','Facturado'].indexOf(x.estado) >= 0)
    .reduce((a,x) => a + x.monto, 0);
  const proximas = todas.filter(f => f.fecha && f.fecha >= hoy && diasHasta(f.fecha) <= 7)
    .sort((a,b) => (a.fecha + (a.hora||'')) < (b.fecha + (b.hora||'')) ? -1 : 1);
  const u = USUARIO || {};
  const hora = new Date().getHours();
  const saludo = hora < 13 ? 'Buenos días' : (hora < 20 ? 'Buenas tardes' : 'Buenas noches');

  cont.innerHTML = ''+
  '<div class="vista-head"><div>'+
    '<h1>'+saludo+(u.nombre?', '+esc(u.nombre):'')+'</h1>'+
    '<p>'+fFechaLarga(hoy)+(nubeOK?' · sincronizado':' · datos en este dispositivo')+'</p>'+
  '</div></div>'+

  (hayDemo() ? '<div class="demo-banner">'+ico('alerta')+
    '<div><b>Datos de demostración.</b> La anestesióloga Laura Fernández, sus pacientes y sus fichas '+
    'son de ejemplo, para que veas cómo funciona cada pantalla.</div>'+
    '<button class="btn danger chico" id="demoBorrar">Borrar</button></div>' : '')+

  tarjetaAvisosPanel()+

  '<div class="grid c3 mb8">'+
    kpi('Hoy', dia.length, 'aqua', ico('calendario'), 'fichas del día')+
    kpi('Esta semana', semana.length, 'azul', ico('stats'), '')+
    kpi('Este mes', delMes.length, 'azul', ico('ficha'), nombreMes(mes))+
    kpi('Honorarios del mes', fMoneda(honMes), 'ok', ico('dinero'), '')+
    kpi('Pendiente de cobro', fMoneda(pendCobro), pendCobro?'warn':'ok', ico('reloj'), 'acumulado')+
    kpi('Pacientes', misPacientes().length, 'aqua', ico('pacientes'), 'en tu portal')+
  '</div>'+

  '<h3 style="font-size:14px;margin:20px 0 10px">Accesos rápidos</h3>'+
  '<div class="tiles">'+
    tile('nuevaFicha','ficha','aqua','Nueva ficha','Valoración y acto anestésico')+
    tile('nuevoPaciente','paciente','','Nuevo paciente','Datos filiatorios y cobertura')+
    tile('irPacientes','pacientes','','Pacientes','Buscar y editar')+
    tile('irFichas','lista','','Mis fichas','Historial completo')+
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
    '<li>Cargá un paciente con sus datos filiatorios y su cobertura.</li>'+
    '<li>Abrí una ficha: elegí institución, carácter, cirugía y diagnóstico CIE-10.</li>'+
    '<li>Completá la valoración anestésica: las escalas se calculan solas.</li>'+
    '<li>Registrá honorarios y descargá el documento en Word o PDF.</li>'+
    '</ol></div>' : '')+

  '<div class="mt20 txt-c"><svg class="ecg-line" viewBox="0 0 400 22" preserveAspectRatio="none">'+
    '<path d="M0 11h60l6-8 5 16 6-8h48l6-8 5 16 6-8h48l6-8 5 16 6-8h48l6-8 5 16 6-8h74"/></svg>'+
    '<p class="mini mt8">AFAAR by Yanina Andino · Asociación Fueguina de Analgesia, Anestesia y Reanimación</p></div>';

  const ir = (id, fn) => { const e = $('#'+id); if(e) e.onclick = fn; };
  ir('tlNuevaFicha', () => abrirFicha(null));
  ir('tlNuevoPaciente', () => editarPaciente(null));
  ir('tlIrPacientes', () => irA('pacientes'));
  ir('tlIrFichas', () => irA('fichas'));
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
  if(verDatosClinicos()) notificarCirugias();
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
  parsearCatalogos();
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
  document.addEventListener('keydown', e => { if(e.key === 'Escape') cerrarModal(); });

  /* service worker (sólo si se sirve por http) */
  if('serviceWorker' in navigator && location.protocol.indexOf('http') === 0){
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
