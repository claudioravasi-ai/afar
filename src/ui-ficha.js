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

/* =========================================================================
   LAS DOS SECCIONES DE UNA FICHA Y DE QUIEN ES CADA UNA
   -------------------------------------------------------------------------
   Una ficha contiene dos actos medicos que muchas veces son de dos
   profesionales distintos: el anestesiologo 1 hace la valoracion
   prequirurgica y el anestesiologo 2 anestesia. Cada uno ve la ficha
   entera —para anestesiar hay que poder leer el prequirurgico— pero
   ESCRIBE unicamente en su seccion. Lo del otro se muestra atenuado y
   bloqueado: se lee, no se toca.

     valoracion -> paso Preanestesia                      (del autor de la ficha)
     acto       -> pasos Anestesia, Recuperacion y Firmar  (del actuante)

   El paso Paciente no es de ninguna de las dos: es la identificacion del
   paciente y de la cirugia, hace falta para las dos tareas y nunca se
   atenua. Editarlo sigue siendo del autor de la ficha.

   El modo es ademas el que se elige en el inicio, con «Nueva valoracion
   preanestesica» o «Nueva ficha anestesica»: la seccion que no se eligio
   queda atenuada para que la pantalla muestre una sola tarea por vez. Se
   puede cambiar con el selector que esta debajo de la barra de pasos, pero
   cambiar de modo NO da permisos: los permisos los da la titularidad.
   ========================================================================= */
const SECCION_DE_PASO = {
  paciente:'ambas', preanestesia:'valoracion',
  anestesia:'acto', recuperacion:'acto', firma:'acto'
};
const MODOS_FICHA = [
  { k:'valoracion', t:'Valoración prequirúrgica' },
  { k:'acto',       t:'Acto anestésico' },
  { k:'completo',   t:'Todo' }
];
let modoFicha = 'completo';

function seccionDePaso(k){ return SECCION_DE_PASO[k] || 'valoracion'; }

/* El paso pertenece a lo que el usuario esta trabajando ahora */
function pasoEnFoco(k){
  const s = seccionDePaso(k);
  return modoFicha === 'completo' || s === 'ambas' || s === modoFicha;
}

/* Titularidad: la valoracion es de quien la hizo, el acto de quien opera.
   Un acto todavia sin dueno lo puede tomar cualquiera —para eso esta el
   boton «Voy a realizar este acto»—, pero una vez que tiene dueno es suyo. */
function puedeEditarSeccion(f, sec){
  if(esCoordinador()) return true;
  if(sec === 'acto') return esActorFicha(f) || !actorFicha(f);
  return puedeEditarFicha(f);          /* valoracion y paso Paciente: el autor */
}

/* Con que modo se abre una ficha ya existente: con la seccion que es mia.
   Si soy las dos cosas —lo habitual— se abre completa. */
function modoDeFicha(g){
  if(!g) return 'completo';
  const mia  = puedeEditarSeccion(g, 'valoracion');
  const acto = puedeEditarSeccion(g, 'acto');
  if(mia && acto) return 'completo';
  return mia ? 'valoracion' : 'acto';
}

/* ============================ LISTADO ============================ */
let filtroFichas = { texto:'', caracter:'', institucion:'', estado:'', alcance:'mias',
                     periodo:'vivo' };

/* Desde qué fecha pide cada opción del selector de período */
function desdeDelPeriodo(k){
  if(k === 'anio') return new Date().getFullYear() + '-01-01';
  if(k === 'todo') return '2000-01-01';
  return desdeEnVivo();
}
/* Cambia el período: si hace falta traer histórico de la nube, lo trae y
   recién entonces repinta. */
function cambiarPeriodoFichas(k){
  filtroFichas.periodo = k;
  const desde = desdeDelPeriodo(k);
  if(periodoCargado(desde)) return vistaFichas();
  toast('Trayendo el histórico…');
  cargarFichasDesde(desde).then(ok => {
    vistaFichas();
    if(!ok) toast('No se pudo traer el histórico. Revisá la conexión.', 'err');
  });
}

function vistaFichas(){
  const cont = $('#vFichas');
  /* Tres alcances y ninguno mas: lo mio, lo que comparto con un colega y lo
     que esta libre para tomar. Ver la ficha de un paciente en el que nunca
     intervine ya no es una opcion. */
  const universo = esCoordinador() ? lista('fichas')
    : (filtroFichas.alcance === 'colegas'     ? fichasCompartidas()
     : filtroFichas.alcance === 'disponibles' ? fichasDisponibles()
     :                                          misFichas());
  const desdeP = desdeDelPeriodo(filtroFichas.periodo);
  let l = universo
    .filter(f => !nubeOK || (fechaDeFicha(f) || '') >= desdeP)
    .sort((a,b) =>
      (fechaDeFicha(b)||'') + (b.hora||'') < (fechaDeFicha(a)||'') + (a.hora||'') ? -1 : 1);
  const q = norm(filtroFichas.texto);
  if(q) l = l.filter(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    return norm([p.apellido,p.nombre,p.dni,f.cirugia,f.cirujano,autorFicha(f)].join(' ')).indexOf(q) >= 0;
  });
  if(filtroFichas.caracter)    l = l.filter(f => caracterActo(f) === filtroFichas.caracter);
  if(filtroFichas.institucion) l = l.filter(f => f.institucion === filtroFichas.institucion);
  if(filtroFichas.estado)      l = l.filter(f => (f.estado||'borrador') === filtroFichas.estado);

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Fichas anestésicas</h1>'+
    '<p>'+l.length+' de '+universo.length+' fichas</p></div>'+
    '<div class="acciones"><button class="btn pri" id="btnNuevaFicha">'+ico('mas')+' Nueva ficha</button></div></div>'+

  (esCoordinador() ? '' :
    '<div class="seg mb8" id="fAlcance">'+
      [['mias','Mías', misFichas().length],
       ['colegas','De colegas', fichasCompartidas().length],
       ['disponibles','Disponibles', fichasDisponibles().length]].map(a =>
        '<button type="button" data-v="'+a[0]+'"'+(filtroFichas.alcance===a[0]?' class="on"':'')+'>'+
        a[1]+(a[2] ? '<span class="badge">'+a[2]+'</span>' : '')+'</button>').join('')+
    '</div>'+
    '<div class="ayuda mb8">'+
      (filtroFichas.alcance === 'colegas'
        ? 'Fichas que compartís con otro anestesiólogo: uno hizo la valoración prequirúrgica y el otro el acto. Los dos las ven completas.'
       : filtroFichas.alcance === 'disponibles'
        ? 'Valoraciones prequirúrgicas de la asociación cuyo acto anestésico todavía no tiene anestesiólogo. Cualquiera puede tomarlas. Al tomar una, pasa a «Mías».'
        : 'Pacientes en los que interviniste, por la valoración prequirúrgica, por el acto anestésico o por los dos.')+
    '</div>')+

  (nubeOK ? '<div class="seg mb8" id="fPeriodo">'+
      [['vivo','Últimos 90 días'],['anio','Este año'],['todo','Todo el historial']].map(a =>
        '<button type="button" data-v="'+a[0]+'"'+(filtroFichas.periodo===a[0]?' class="on"':'')+'>'+
        a[1]+'</button>').join('')+
    '</div>'+
    '<div class="ayuda mb8">En el dispositivo viven los <b>últimos 90 días</b>, que son los que se '+
      'sincronizan al instante. El resto está completo en la nube y se trae al pedirlo.</div>' : '')+

  '<div class="filtros">'+
    '<div class="campo" style="flex:2"><label>Buscar</label>'+
      '<input type="search" id="fBuscar" placeholder="Paciente, DNI, cirugía o cirujano" value="'+esc(filtroFichas.texto)+'"></div>'+
    '<div class="campo"><label>Carácter</label><select id="fCaracter">'+
      '<option value="">Todos</option>'+
      CARACTERES.map(c => '<option value="'+c.id+'"'+
        (filtroFichas.caracter===c.id?' selected':'')+'>'+esc(c.n)+'</option>').join('')+
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
    const cx  = fechaCirugiaDe(f);
    const mio = esAutorFicha(f), actor = esActorFicha(f);
    return '<div class="item" data-f="'+f.id+'">'+
      '<div class="avatar" style="'+(!esNoProgramado(caracterActo(f))
        ? 'background:var(--azul-100);color:var(--azul-700)'
        : 'background:var(--danger-bg);color:var(--danger)')+'">'+
        (!esNoProgramado(caracterActo(f))?ico('calendario'):ico('alerta'))+'</div>'+
      '<div class="txt"><b>'+esc(p.apellido||'—')+', '+esc(p.nombre||'')+'</b>'+
        '<span>'+esc(f.cirugia||'Sin cirugía')+' · '+
        /* Se muestra la fecha que corresponde y se dice cuál es: una ficha
           que dice «12/03» sin aclarar si es la consulta o la cirugía no
           informa, confunde. */
        (cx ? 'cirugía '+fFecha(cx) : 'valoración '+fFecha(fechaValoracionDe(f)))+' · '+
        esc(nombreInstitucion(f.institucion).split('"')[0].trim())+'</span>'+
        '<span class="quien">'+
          (mio ? 'Valoración tuya' : 'Valoración de '+esc(autorFicha(f)))+
          ' · '+(actor ? 'acto tuyo'
               : actoLibre(f) ? 'acto sin tomar'
               : 'acto de '+esc(nombreActor(f)))+
        '</span></div>'+
      '<div class="der">'+
        (mio || actor ? '' : '<span class="tag info">de colega</span> ')+
        (actoLibre(f) && !mio ? '<span class="tag warn">libre</span> ' : '')+
        (valoracionVencida(f) ? '<span class="tag danger" title="Más de '+
          DIAS_VIGENCIA_VALORACION+' días entre la valoración y la cirugía">valoración vencida</span> ' : '')+
        etiquetaEstadoFicha(f)+
        (f.hon && f.hon.total && actor ? '<div class="mini mt8">'+fMoneda(f.hon.total)+'</div>' : '')+
      '</div></div>';
  }).join('') +'</div>'
  : '<div class="vacio">'+ico('ficha')+'<b>'+
      (filtroFichas.alcance === 'colegas'     ? 'Sin fichas compartidas'
     : filtroFichas.alcance === 'disponibles' ? 'No hay actos libres'
     :                                          'Sin fichas')+'</b><span>'+
      (filtroFichas.alcance === 'colegas'
        ? 'Acá van a aparecer las fichas en las que trabajaste junto a otro anestesiólogo.'
     : filtroFichas.alcance === 'disponibles'
        ? 'Todas las valoraciones de la asociación ya tienen anestesiólogo asignado para el acto.'
        : 'Creá la primera desde «Nueva ficha».')+'</span></div>');

  $('#btnNuevaFicha').onclick = () => abrirFicha(null);
  $('#fBuscar').oninput = debounce(e => { filtroFichas.texto = e.target.value; vistaFichas();
    const i = $('#fBuscar'); if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 260);
  $$('#fAlcance button').forEach(b => b.onclick = () => {
    filtroFichas.alcance = b.dataset.v; vistaFichas(); });
  $$('#fPeriodo button').forEach(b => b.onclick = () => cambiarPeriodoFichas(b.dataset.v));
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

  /* --------------------------------------------------------------------
     LAS DOS FECHAS. Hasta ahora la ficha tenía una sola, `f.fecha`, que en
     el modelo viejo era la fecha de la CIRUGÍA: se cargaba en el paso 1
     junto con la hora y el turno. Ahora hay dos, y hay que repartir esa
     única fecha entre las dos sin inventar nada:

       · la fecha de la cirugía es la que estaba en f.fecha, siempre que
         haya un acto registrado o que la fecha ya haya pasado;
       · la de la valoración es la que quedó asentada en el punto 11, y si
         no hay, la de creación de la ficha.

     Una ficha vieja que nunca llegó al quirófano y con fecha futura no
     recibe fecha de cirugía: es una programación, no un acto realizado, y
     el anestesiólogo la va a cargar el día que opere.
     -------------------------------------------------------------------- */
  if(!f.__fechas2){
    f.__fechas2 = true;
    if(!a.fechaCirugia && !f.fechaCirugia && f.fecha){
      const hubo = !!(a.finAnestesia || a.finCirugia || a.inicioAnestesia ||
                      (a.tecnicas || []).length || (f.firma || {}).firmado);
      if(hubo || f.fecha < hoyISO()) a.fechaCirugia = f.fecha;
    }
    if(!f.fechaValoracion)
      f.fechaValoracion = ((f.v || {}).riesgo || {}).fecha ||
                          (f.creado || '').slice(0,10) || f.fecha || '';
    if(f.turno && !a.turno) a.turno = f.turno;
  }

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
  /* El equipo quirurgico vivia suelto en la raiz de la ficha, cargado en el
     paso 1. Ahora se registra en el paso «Anestesia», dentro de f.acto, para
     que tambien lo pueda guardar el colega que toma el acto. Las fichas
     viejas se mudan solas, sin perder nada. */
  if(!a.equipo){
    a.equipo = { cirujano:f.cirujano || '', cirujanoMP:'', ayudante:f.ayudante || '',
                 instrumentador:f.instrumentador || '', anestesista2:f.anestesista2 || '',
                 circulante:'' };
  }
  /* Adjuntos de la foja o parte quirurgico (dentro del acto, ver core.js) */
  a.parteQuirurgico = a.parteQuirurgico || f.parteQuirurgico || [];
  if(f.parteQuirurgico) delete f.parteQuirurgico;

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
  /* Las fichas de más de 90 días no viven en el dispositivo: se traen de la
     nube en el momento en que alguien las abre. Se pide y se vuelve a entrar. */
  if(id && !DB.fichas[id]){
    toast('Buscando la ficha en el archivo…');
    return asegurarFicha(id).then(ok => ok
      ? abrirFicha(id, pacienteId)
      : toast('No se encontró la ficha.', 'err'));
  }
  /* Una ficha de un paciente en el que nunca intervine y cuyo acto ya tiene
     dueño no se abre: no es mi historia clínica para leer. */
  if(id && !puedeAbrirFicha(DB.fichas[id]))
    return toast('Esa ficha es de otro anestesiólogo y su acto ya tiene responsable.', 'err');
  fichaActual = migrarFicha(id ? JSON.parse(JSON.stringify(DB.fichas[id])) : {
    id: uid('fic'), ownerUid: SESION.uid, pacienteId: pacienteId || '',
    /* La fecha que nace con la ficha es la de la VALORACIÓN. La de la
       cirugía se carga en el paso Anestesia, el día del acto. */
    fechaValoracion: hoyISO(), fecha: hoyISO(), caracter:'programada',
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
  /* Se entra por el primer paso de la seccion propia: al que viene a
     anestesiar la ficha de un colega no le sirve arrancar en la
     identificacion del paciente, que no puede tocar. */
  const g = id ? DB.fichas[id] : null;
  modoFicha = modoDeFicha(g);
  /* Al que viene a anestesiar la ficha de un colega no le sirve arrancar en
     la identificación del paciente, que no puede tocar: entra por el acto. */
  pasoFicha = (g && !esAutorFicha(g) && !esCoordinador()) ? 'anestesia'
            : modoFicha === 'acto' ? 'anestesia' : 'paciente';
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

/* =========================================================================
   POR QUE ESTE ACTO NO TIENE VALORACION PREVIA
   -------------------------------------------------------------------------
   No bloquea: preguntar y dejar constancia sirve; impedir el registro de un
   acto que ya esta ocurriendo, no. Lo que si esta bloqueado es la FIRMA, que
   exige la preanestesia en verde, y ahi es donde la deuda se paga.

   Los tres motivos no son intercambiables. El de urgencia mueve el caracter
   del acto, que arrastra el adicional del nomenclador: por eso no alcanza con
   uno solo -si urgencia fuera la unica salida, todo el mundo marcaria
   urgencia para poder trabajar, y la facturacion se llenaria de recargos sin
   respaldo-.
   ========================================================================= */
function pedirMotivoSinValoracion(f, forzar){
  if(!f || !debeDeclararSinValoracion(f)) return;
  /* `forzar` lo usan los «Volver» de las subventanas: ahí sí hay que pisar el
     modal abierto, que es justamente el que se quiere dejar atrás. */
  if(!forzar && $('#modal') && $('#modal').classList.contains('on')) return;

  abrirModal('Este acto no tiene valoración prequirúrgica',
    '<div class="aviso warn">'+ico('alerta')+'<div>En esta ficha el paso <b>Preanestesia</b> está '+
      'sin tocar. Antes de registrar el acto, decinos por qué: queda asentado en la ficha y en la '+
      'auditoría.</div></div>'+
    /* «La cargo ahora» no es un motivo: es no tener ninguno. Mezclarla con las
       cuatro excepciones las pone al mismo nivel, y no lo están. Va al pie. */
    /* Urgencia y emergencia van en un solo renglón, con sus dos botones: son
       la misma situación —no hubo tiempo de valorar— pero hay que saber cuál
       de las dos es, porque de ahí sale el carácter que ya no se vuelve a
       preguntar en el paso 1. */
    '<div class="hon-pend-lista">'+
      '<div class="hon-pend" style="cursor:default;align-items:flex-start">'+
        ico('alerta')+
        '<span class="tx"><b>Urgencia o emergencia</b>'+
          '<i>No hubo tiempo de hacer la valoración prequirúrgica. El carácter de la cirugía '+
          'queda cargado solo, sin volver a preguntarlo.</i>'+
          '<span class="btn-row mt8">'+
            '<button type="button" class="btn ghost chico" data-motivo="urgencia">'+
              'Urgencia <span class="mini">· en horas</span></button>'+
            '<button type="button" class="btn danger chico" data-motivo="emergencia">'+
              'Emergencia <span class="mini">· sin demora</span></button>'+
          '</span>'+
        '</span>'+
      '</div>'+
      MOTIVOS_SIN_VALORACION.filter(m => m.deuda && !m.oculto && !m.caracter).map(m =>
      '<button type="button" class="hon-pend" data-motivo="'+esc(m.id)+'">'+
        ico({ externa:'archivo', reintervencion:'ficha' }[m.id] || 'valoracion')+
        '<span class="tx"><b>'+esc(m.n)+'</b><i>'+esc(m.d)+'</i></span>'+
        ico('flecha').replace('<svg','<svg style="transform:rotate(-90deg);width:15px;height:15px;opacity:.5"')+
      '</button>').join('') +'</div>'+
    '<p class="mini mt8">Si el paciente ya fue valorado por otro socio, no elijas ninguna: '+
      'buscá la ficha en <b>Fichas → Disponibles</b> y tomá el acto desde ahí.</p>',
    '<button class="btn pri" data-motivo="ahora">'+ico('valoracion')+
      ' Ninguna: la cargo ahora</button>', '620px');
  /* De acá sólo se sale eligiendo. Cerrarla dejaba el acto tomado y trabado,
     y las cinco opciones ya cubren todos los casos, incluido el de no tener
     ninguna excepción. */
  modalSinSalida();

  $$('#modal [data-motivo]').forEach(b => b.onclick = () => {
    const id = b.dataset.motivo;
    if(id === 'ahora'){
      cerrarModal();
      /* No declara nada, pero igual cuenta como decidido: se marca para que el
         recorrido siga y no vuelva a preguntar en la misma ficha. */
      f.sinValoracion = Object.assign({}, sinValoracion(f), { motivo:'ahora',
        cuando:new Date().toISOString(), porUid: SESION ? SESION.uid : '' });
      seguirTrasElMotivo(f, 'preanestesia');
      return;
    }
    if(id === 'externa'){ pedirDatosValoracionExterna(f); return; }
    if(id === 'reintervencion'){ pedirFichaDeOrigen(f); return; }

    /* Urgencia y emergencia. El carácter se toma de la opción elegida y se
       escribe en los dos lugares —la cirugía y el acto—, así el paso 1 ya no
       lo vuelve a preguntar: es el único dato que la ventana puede dar por
       sabido, porque acaba de decirlo la persona.
       No manda al paso 2: el paciente está por entrar y lo que hay que hacer
       ahora es anestesiar. La valoración se reclama después. */
    const m = MOTIVOS_SIN_VALORACION.find(x => x.id === id) || {};
    guardarMotivoSinValoracion(f, id, {});
    cerrarModal();
    if(m.caracter){
      f.caracter = m.caracter;
      f.acto = f.acto || {};
      f.acto.caracterActo = m.caracter;
    }
    seguirTrasElMotivo(f, null,
      'Declarado como ' + nombreCaracter(m.caracter || 'urgencia').toLowerCase() +
      '. Queda pendiente completar la valoración.');
  });
}

/* Segundo paso, solo para la valoracion hecha fuera de la app */
function pedirDatosValoracionExterna(f){
  const s = sinValoracion(f) || {};
  abrirModal('Valoración hecha fuera de la aplicación',
    '<div class="aviso info">'+ico('info')+'<div>Queda asentado que la valoración existe y dónde '+
      'está. <b>No reemplaza a cargarla</b>: la ficha no se puede firmar hasta que el paso '+
      'Preanestesia esté completo, porque el documento que se emite sale de ahí.</div></div>'+
    campoTxt('svQuien','Quién la hizo — apellido y nombre, o la institución', s.quien)+
    campoFecha('svFecha','Fecha de esa valoración', s.fechaVal || hoyISO())+
    campoArea('svNota','Dónde está / observaciones', s.nota,
      'Historia clínica en papel del sanatorio, carpeta de quirófano, etc.'),
    '<button class="btn ghost" id="svVolver">Volver</button>'+
    '<button class="btn pri" id="svGuardar">'+ico('check')+' Declarar</button>', '620px');
  modalSinSalida();
  $('#svVolver').onclick = () => pedirMotivoSinValoracion(f, true);

  $('#svGuardar').onclick = () => {
    guardarMotivoSinValoracion(f, 'externa', {
      quien: val('svQuien'), fechaVal: val('svFecha'), nota: val('svNota')
    });
    cerrarModal();
    /* Lleva a donde se resuelve: la tarjeta con el botón de la foto */
    seguirTrasElMotivo(f, 'preanestesia', 'Declarado. Adjuntá acá la foto de la valoración en papel.');
    setTimeout(() => { const c = $('#svCard'); if(c) c.scrollIntoView({ block:'start' }); }, 200);
  };
}

/* Reintervencion: se elige de cual de las fichas anteriores del paciente
   viene la valoracion. Enlazar sola no alcanza -el paso 2 de esta ficha
   quedaria vacio y no se podria firmar-, asi que ademas se ofrece traerla. */
/* La lista de intervenciones ya valoradas.
   -------------------------------------------------------------------------
   Con paciente elegido muestra las de ese paciente. Sin paciente -que es lo
   normal en este recorrido, porque el acto se toma antes de identificarlo-
   muestra todas las de la asociacion, propias y de colegas, con buscador. En
   ese caso elegir la intervencion resuelve tambien el paciente: sale de la
   ficha elegida, que es de donde tiene que salir. */
let __filtroOrigen = '';

function pedirFichaDeOrigen(f){
  __filtroOrigen = '';
  const todas = fichasValoradasDe(f.pacienteId, f.id);
  if(!todas.length){
    /* Se explica por qué no hay ninguna: la lista filtra por completas, y sin
       decirlo parecería que la aplicación no encuentra nada. */
    abrirModal('No hay ninguna valoración completa para importar',
      '<div class="aviso warn">'+ico('alerta')+'<div>'+
        (f.pacienteId
          ? 'Este paciente no tiene ninguna intervención anterior con la valoración completa.'
          : 'Todavía no hay ninguna intervención con la valoración completa en la aplicación.')+
        '<br>Sólo se ofrecen las que están <b>en verde en los pasos Paciente y Preanestesia</b> '+
        '—con ASA, conclusión de aptitud, plan anestésico y consentimiento firmado—. Importar una '+
        'valoración a medias dejaría esta ficha igual de incompleta, pero con apariencia de '+
        'resuelta.</div></div>',
      '<button class="btn pri" id="svVolver">Volver a las opciones</button>', '620px');
    modalSinSalida();
    $('#svVolver').onclick = () => pedirMotivoSinValoracion(f, true);
    return;
  }
  const porPaciente = !!f.pacienteId;

  const filas = () => {
    const q = norm(__filtroOrigen);
    const l = (q ? todas.filter(g => {
      const p = DB.pacientes[g.pacienteId] || {};
      return norm((p.apellido||'')+' '+(p.nombre||'')+' '+(p.dni||'')+' '+
                  (g.cirugia||'')+' '+autorFicha(g)).indexOf(q) >= 0;
    }) : todas).slice(0, 40);
    if(!l.length) return '<div class="vacio" style="padding:18px">'+ico('buscar')+
      '<b>Sin resultados</b><span>Probá con el apellido, el documento o la cirugía.</span></div>';
    return l.map(g => {
      const p = DB.pacientes[g.pacienteId] || {};
      const fe = fechaDeFicha(g) || g.fecha;
      const dias = fe ? Math.round((Date.now() - new Date(fe+'T12:00:00').getTime())/86400000) : null;
      return '<button type="button" class="hon-pend" data-origen="'+esc(g.id)+'">'+
        ico('valoracion')+'<span class="tx"><b>'+
        (porPaciente ? esc(g.cirugia || 'Sin cirugía')
                     : esc((p.apellido||'—')+', '+(p.nombre||'')))+'</b>'+
        '<i>'+(porPaciente ? '' : esc(g.cirugia || 'sin cirugía')+' · ')+
        (fe ? fFecha(fe) : 'sin fecha')+
        (dias !== null ? ' · hace '+dias+' día'+(dias===1?'':'s') : '')+
        ' · ASA '+esc(((g.v||{}).scores||{}).asa || '—')+
        ' · valoró '+esc(autorFicha(g))+'</i></span>'+
        ico('flecha').replace('<svg','<svg style="transform:rotate(-90deg);width:15px;height:15px;opacity:.5"')+
        '</button>';
    }).join('') + (todas.length > 40 && !norm(__filtroOrigen)
      ? '<p class="mini mt8">Se muestran las 40 más recientes de '+todas.length+
        '. Usá el buscador para encontrar otra.</p>' : '');
  };

  abrirModal('¿De qué intervención viene la valoración?',
    '<div class="aviso info">'+ico('info')+'<div>'+
      (porPaciente
        ? 'Intervenciones anteriores de este paciente con la valoración <b>completa</b>.'
        : 'Intervenciones con la valoración <b>completa</b>, propias y de colegas. '+
          'Al elegir una, <b>el paciente sale de esa ficha</b>: no hace falta cargarlo aparte.')+
      ' Se enlaza aquella ficha y se traen sus antecedentes, examen, laboratorio, escalas y plan '+
      'para actualizarlos.<br>Sólo aparecen las que estaban en verde: una valoración a medias no '+
      'sostiene un acto anestésico.</div></div>'+
    (porPaciente ? '' :
      '<div class="campo"><div style="position:relative">'+
        '<input type="search" id="svBuscar" placeholder="Apellido, documento, cirugía o colega" '+
        'style="padding-left:38px">'+
        '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);'+
        'color:var(--texto-3)">'+ico('buscar')+'</span></div></div>')+
    '<div class="hon-pend-lista" id="svLista2">'+ filas() +'</div>'+
    '<label class="chk sel" id="svCopiar" style="width:100%;margin-top:12px">'+
      '<input type="checkbox" checked>Traer esa valoración a esta ficha</label>'+
    '<p class="mini mt8">El <b>consentimiento informado no se copia</b>: es de aquel procedimiento '+
      'y de aquel riesgo. Hay que firmar el del punto 15 para esta intervención.</p>',
    '<button class="btn ghost" id="svVolver">Volver</button>', '640px');
  modalSinSalida();
  $('#svVolver').onclick = () => pedirMotivoSinValoracion(f, true);

  const cablear = () => {
    $$('#modal .chk').forEach(l => l.onclick = () =>
      setTimeout(() => l.classList.toggle('sel', l.querySelector('input').checked), 0));
    $$('#svLista2 [data-origen]').forEach(b => b.onclick = () => elegirOrigen(f, b.dataset.origen));
  };
  cablear();
  if($('#svBuscar')) $('#svBuscar').oninput = debounce(e => {
    __filtroOrigen = e.target.value;
    $('#svLista2').innerHTML = filas();
    cablear();
  }, 220);
}

function elegirOrigen(f, id){
  const g = DB.fichas[id];
  const cx = $('#svCopiar') ? $('#svCopiar').querySelector('input') : null;
  const copiar = cx ? cx.checked : true;
  /* Sin paciente propio, el de la ficha elegida es el de ésta: es la misma
     persona, por definición de reintervención. */
  const trajoPaciente = !f.pacienteId && g && g.pacienteId;
  if(trajoPaciente) f.pacienteId = g.pacienteId;

  guardarMotivoSinValoracion(f, 'reintervencion', {
    fichaOrigen: id,
    origenTxt: (g ? ((g.cirugia || 'sin cirugía') + ' · ' +
                fFecha(fechaDeFicha(g) || g.fecha)) : '')
  });
  let copiada = false;
  if(copiar && g) copiada = copiarValoracionDesde(f, g);
  cerrarModal();
  if(copiada) auditar('valoracion-copiada', 'de la ficha ' + id + ' a ' + f.id);
  const p = DB.pacientes[f.pacienteId] || {};
  const quien = trajoPaciente ? 'Paciente: ' + (p.apellido||'') + ', ' + (p.nombre||'') + '. ' : '';
  /* El consentimiento nuevo tiene que decir de QUÉ cirugía es. Si todavía no
     están la cirugía y el diagnóstico de esta intervención, primero se cargan:
     firmar ahora produciría un consentimiento sin procedimiento adentro. */
  if(!f.cirugia || !f.diagnostico){
    guardarFicha(true, true);
    irAPaso('paciente');
    toast(quien + 'Cargá la cirugía y el diagnóstico de ESTA intervención; después firmás el '+
          'consentimiento.', 'warn');
    return;
  }
  seguirTrasElMotivo(f, 'preanestesia', quien +
    (copiada ? 'Valoración traída — falta firmar el consentimiento de esta intervención.'
             : 'Ficha enlazada. La valoración de esta intervención sigue pendiente.'));
}

/* Resuelto el motivo, lo único que puede faltar es el paciente. Ahí va. */
function seguirTrasElMotivo(f, destinoPreferido, aviso){
  /* Sin paciente no hay nada que escribir: la ficha entera viaja cuando se lo
     elija. Llamar a guardarFicha() acá sólo produciría un error en pantalla. */
  if(!f.pacienteId){
    irAPaso('paciente');
    /* Si lo que se declaró fue la valoración en papel, lo primero que tiene
       que ver es la tarjeta para adjuntarla: la hoja la tiene en la mano. */
    setTimeout(() => { const c = $('#svCard'); if(c) c.scrollIntoView({ block:'start' }); }, 220);
    toast('Falta el paciente: elegilo o cargalo. Podés adjuntar la valoración en papel acá mismo.',
          'warn');
    return;
  }
  guardarFicha(true, true);
  if(aviso) toast(aviso, 'ok');
  if(destinoPreferido) irAPaso(destinoPreferido);
  else pintarFicha();
}

function guardarMotivoSinValoracion(f, motivo, extra){
  const previo = sinValoracion(f) || {};
  f.sinValoracion = Object.assign({}, previo, extra, {
    motivo: motivo,
    cuando: new Date().toISOString(),
    porUid: SESION ? SESION.uid : '',
    porNombre: USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '',
    adjuntos: previo.adjuntos || []
  });
  auditar('acto-sin-valoracion',
    (MOTIVOS_SIN_VALORACION.find(x => x.id === motivo) || {}).n + ' — ficha ' + f.id);
}
function pasoVecino(delta){
  const i = PASOS_FICHA.findIndex(p => p.k === pasoFicha);
  const j = i + delta;
  return (j >= 0 && j < PASOS_FICHA.length) ? PASOS_FICHA[j].k : null;
}

/* =========================================================================
   SEMAFORO DE LOS CINCO PASOS
   -------------------------------------------------------------------------
   Cada paso se pinta solo con uno de cuatro colores, y el color se lee de un
   golpe de vista sin abrir el paso:

     ok     verde  - completo, no falta nada de lo esencial
     medio  ambar  - empezado, falta algo para darlo por cerrado
     alerta rojo   - empezado y falta algo que NO se puede omitir
     pend   gris   - todavia sin tocar

   Es lo que le dice al anestesiologo, desde cualquier paso, si el registro
   esta en condiciones de firmarse.
   ========================================================================= */
const ROTULO_ESTADO = { ok:'Completo', medio:'A medias', alerta:'Falta', pend:'Pendiente' };

function estadoPaso(f, k){
  const v = f.v || {}, a = f.acto || {}, r = f.recup || {}, co = f.consent || {};

  if(k === 'paciente'){
    if(!f.pacienteId) return 'pend';
    /* Las fichas viejas guardaban el diagnóstico codificado en dxQuirurgico.
       Sigue valiendo: es el mismo dato con otro nombre. */
    const dx = f.diagnostico || (f.dxQuirurgico || {}).d || f.dxQuirurgico;
    return (f.cirugia && f.institucion && dx) ? 'ok'
         : (f.cirugia || f.institucion) ? 'alerta' : 'medio';
  }
  if(k === 'preanestesia'){
    const sc = v.scores || {}, pl = f.plan || {};
    /* Una valoración que ya se guardó nunca vuelve a leerse «Pendiente»:
       está empezada por definición, y si le falta algo hay que decirlo. */
    const arranco = !!(f.valoracionGuardada || sc.asa || co.quien ||
                       (v.antecedentes2||[]).length || v.sinAntecedentes);
    if(!arranco) return 'pend';
    /* el consentimiento es el punto 15 y es condicion para cerrar */
    const cerrada = sc.asa && (v.riesgo||{}).fundamento && (pl.tecnica||[]).length &&
                    consentimientoCompleto(f);
    if(cerrada) return 'ok';
    return (sc.asa && (v.riesgo||{}).fundamento) ? 'alerta' : 'medio';
  }
  if(k === 'anestesia'){
    const arranco = (a.tecnicas||[]).length || (a.drogas||[]).length ||
                    (a.controles||[]).length || a.ingreso || a.fechaCirugia;
    if(!arranco) return 'pend';
    return (a.fechaCirugia && (a.tecnicas||[]).length && a.finAnestesia) ? 'ok'
         : (a.tecnicas||[]).length ? 'alerta' : 'medio';
  }
  if(k === 'recuperacion'){
    if(!r.hora && !r.aldreteTotal && !r.destino) return 'pend';
    return r.aldreteCompleto && r.destino ? 'ok' : 'alerta';
  }
  if(k === 'firma'){
    if((f.firma||{}).firmado) return 'ok';
    /* Miraba solo anestesia y recuperacion. Una ficha se firma entera: si el
       paciente, la valoracion o el consentimiento no estan cerrados, no hay
       nada que firmar todavia. */
    return pasosPreviosPendientes(f).length ? 'pend' : 'alerta';
  }
  return 'pend';
}

/* =========================================================================
   LA CONDICION PARA FIRMAR
   -------------------------------------------------------------------------
   Una ficha no se cierra con la firma si alguno de los cuatro pasos previos
   no esta en verde. Antes se podia firmar igual y el documento salia
   incompleto: una historia clinica firmada con la vía aérea sin evaluar o sin
   consentimiento no es un registro incompleto, es un registro que no deberia
   existir. La Ley 26.529 pide que la historia clinica sea completa y la firma
   es lo que la cierra.

   Las dos salidas legitimas del consentimiento -urgencia vital del art. 9 y
   revocacion del paciente- ya cuentan como consentimiento completo, asi que
   esta regla no traba la emergencia: la traba es no haberlo documentado.
   ========================================================================= */
const PASOS_PREVIOS_FIRMA = ['paciente','preanestesia','anestesia','recuperacion'];

function pasosPreviosPendientes(f){
  return PASOS_PREVIOS_FIRMA
    .filter(k => estadoPaso(f, k) !== 'ok')
    .map(k => ({ k:k, t:(PASOS_FICHA.find(x => x.k === k) || {}).t || k,
                 estado:estadoPaso(f, k) }));
}

/* =========================================================================
   PUNTO 15 - CONSENTIMIENTO INFORMADO ANESTESICO
   Sin el consentimiento no hay valoracion prequirurgica que se pueda dar por
   concluida: la Ley 26.529 lo exige por escrito para todo procedimiento con
   riesgo relevante, y la anestesia lo es. Las dos unicas salidas legitimas
   son la urgencia vital del art. 9 y la revocacion del paciente, y las dos
   quedan asentadas en el propio consentimiento.
   ========================================================================= */
function consentSinFirma(q){
  return q === 'No firmado — urgencia vital (art. 9 Ley 26.529)' ||
         q === 'Consentimiento revocado por el paciente';
}
function consentimientoCompleto(f){
  const c = f.consent || {};
  if(!c.quien) return false;
  if(consentSinFirma(c.quien)) return true;      /* documentado, sin firma */
  return !!(c.firmante && c.firmaPaciente && c.firmaAnestesiologo);
}
/* Que le falta al punto 15, en palabras, para poder decirselo al usuario */
function faltaDelConsentimiento(f){
  const c = f.consent || {};
  if(!c.quien) return 'elegí quién firma el consentimiento';
  if(consentSinFirma(c.quien)) return '';
  const l = [];
  if(!c.firmante)            l.push('el nombre y DNI del firmante');
  if(!c.firmaPaciente)       l.push('la firma del paciente');
  if(!c.firmaAnestesiologo)  l.push('tu firma');
  return l.join(', ');
}

/* =========================================================================
   QUE BOTONES LLEVA CADA PASO
   -------------------------------------------------------------------------
   Antes los cinco pasos mostraban los mismos seis botones abajo: Guardar,
   Siguiente, Honorarios, Consentimiento, Word, PDF y Enviar. Eso es ruido:
   el anestesiologo tenia que leer siete botones para elegir el unico que
   necesitaba, y varios no tenian sentido en el paso donde estaban.

   Ahora cada paso muestra lo suyo:

     Paciente      Siguiente.                        Autoguarda al pasar.
     Preanestesia  Guardar + Siguiente + documentos de la VALORACION.
     Anestesia     Siguiente.                        Autoguarda al editar.
     Recuperacion  Siguiente.                        Autoguarda al pasar.
     Firmar        Guardar + documentos del ACTO.

   El consentimiento ya no es un boton en ningun paso: es el punto 15 de la
   Preanestesia. Y en Firmar no vuelve a aparecer porque ya se le entrego al
   paciente con la valoracion: repetirlo ahi no agrega nada.
   ========================================================================= */
const PASO_GUARDA  = { preanestesia:true, firma:true };
const PASO_EXTRAS  = { preanestesia:'valoracion', firma:'acto' };

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
    /* El recorrido depende de por dónde nació la ficha. Ver pasoHabilitado() */
    const trabado = !pasoHabilitado(f, s.k);
    return '<button type="button" class="step'+(s.k===pasoFicha?' on':'')+' '+est+
      (pasoEnFoco(s.k) && !trabado ? '' : ' atenuado')+
      '" data-paso="'+s.k+'"'+(trabado ? ' data-trabado="1"' : '')+
      ' title="'+esc(trabado
        ? s.t+' — '+motivoPasoCerrado(f, s.k)
        : s.t+' — '+ROTULO_ESTADO[est])+'">'+
      '<span class="dot">'+(est==='ok' ? ico('check') : est==='alerta' ? ico('alerta') : ico(s.ico))+'</span>'+
      '<span class="lbl">'+esc(s.t)+'</span>'+
      '<span class="est '+est+'">'+esc(ROTULO_ESTADO[est])+'</span>'+
      (i < PASOS_FICHA.length-1 ? '<span class="linea"></span>' : '')+
      '</button>';
  }).join('') +'</div>'+
  /* El conmutador existe para poder LEER la sección del colega: quien valoró
     necesita ver el acto y quien anestesia necesita leer el prequirúrgico.
     Cuando las dos secciones son de la misma persona no separa nada, así que
     no se dibuja: son tres botones permanentes para una acción que no existe. */
  (modoDeFicha(DB.fichas[f.id] || f) === 'completo'
    ? ''
    : '<div class="modo-sw seg no-print">'+ MODOS_FICHA.map(m =>
        '<button type="button" data-modo="'+m.k+'"'+(m.k===modoFicha?' class="on"':'')+'>'+
        esc(m.t)+'</button>').join('') +'</div>')+
  '<div class="paso-cabecera no-print">'+
    '<div><b>Paso '+(idx+1)+' de '+PASOS_FICHA.length+'</b> · '+esc(PASOS_FICHA[idx].sub)+'</div>'+
    '<div class="barra"><span style="width:'+Math.round((idx+1)/PASOS_FICHA.length*100)+'%"></span></div>'+
  '</div>'+

  (firmada ? '<div class="aviso ok no-print">'+ico('candado')+'<div><b>Registro finalizado y firmado.</b> '+
    'Queda en sólo lectura. Si hay que corregir algo, reabrilo desde el paso «Firmar».</div></div>' : '')+
  /* En una ficha ajena el banner de arriba ya explica de quién es cada
     sección: repetirlo con bannerSeccion() sería decir dos veces lo mismo. */
  /* Durante el recorrido guiado el cartel de faltantes es ruido: enumera ocho
     datos que la persona todavía no tuvo oportunidad de cargar. Vuelve solo
     en cuanto el acto queda desbloqueado, que es cuando sirve. */
  (soloActo ? bannerFichaAjena(f)
            : (actoDesbloqueado(f) ? bannerFaltantes(f) : '') + bannerSeccion(guardada || f))+

  /* «Tomar acto anestésico» vive FUERA del cuerpo del paso, a propósito.
     El cuerpo se atenúa y se bloquea entero cuando la sección es de un
     colega —que es exactamente la situación en la que hay que poder tomar el
     acto—. Adentro, el botón nacía gris y muerto: no se podía tomar
     justamente el acto que había que tomar. */
  (pasoFicha === 'anestesia' ? htmlTomarActo(f) : '')+

  '<div id="fiCuerpo"></div>'+

  /* ---------------------- navegación entre pasos ---------------------- */
  '<div class="paso-nav no-print">'+
    /* «Anterior» sólo si el paso anterior está habilitado: en el recorrido
       guiado apunta a una pantalla cerrada, y un botón que no lleva a ningún
       lado es peor que no tenerlo. */
    (pasoVecino(-1) && pasoHabilitado(f, pasoVecino(-1))
      ? '<button class="btn ghost" id="fiAtras">'+ico('atras')+' Anterior</button>'
      : '<span></span>')+
    (PASO_GUARDA[pasoFicha]
      ? '<button class="btn pri grande" id="fiGuardar">'+ico('check')+' Guardar '+
        (pasoFicha === 'preanestesia' ? 'valoración' : 'y cerrar')+'</button>'
      : '<span></span>')+
    /* Mismo criterio que «Anterior»: si el paso siguiente está cerrado, el
       botón saltearía el recorrido. En el arranque del acto no hay nada que
       avanzar hasta tomarlo. */
    (pasoVecino(1) && pasoHabilitado(f, pasoVecino(1))
      ? '<button class="btn '+(PASO_GUARDA[pasoFicha] ? 'ghost' : 'pri grande')+'" id="fiSiguiente">'+
        'Siguiente '+ico('flecha').replace('<svg','<svg style="transform:rotate(-90deg)"')+'</button>'
      : '<span></span>')+
  '</div>'+

  /* Los pasos que no guardan a mano lo dicen, para que nadie salga de la
     pantalla con la duda de si lo que cargó quedó grabado. */
  (PASO_GUARDA[pasoFicha] || !actoDesbloqueado(f) ? '' :
    '<div class="autoguarda no-print">'+ico('nube')+'Lo que cargás en este paso se guarda solo '+
    'al tocar «Siguiente».</div>')+

  htmlExtrasDePaso(f, soloActo)+

  (DB.fichas[f.id] && !soloActo && pasoFicha === 'firma'
    ? '<div class="btn-row mt14 no-print"><button class="btn danger chico" id="fiBorrar">'+
      ico('borrar')+' Eliminar ficha</button></div>' : '');

  $('#fiVolver').onclick = () => { guardarPasoActual(); irA('fichas'); vistaFichas(); };
  /* El banner de ficha ajena vive fuera del cuerpo del paso: su botón se
     cablea acá para que funcione en los cinco pasos, no sólo en el primero. */
  if($('#fiTomar')) $('#fiTomar').onclick = () => tomarActo(f);
  if($('#acTomar')) $('#acTomar').onclick = () => tomarActo(f);
  $$('#vFicha [data-paso]').forEach(b => b.onclick = () => {
    if(b.dataset.trabado){
      toast(motivoPasoCerrado(f, b.dataset.paso), 'warn');
      /* Lleva al paso donde ESTÁ lo que falta, no a uno cualquiera */
      const destino = PASOS_FICHA.map(x => x.k).find(x => pasoHabilitado(f, x));
      if(destino && destino !== pasoFicha) irAPaso(destino);
      return;
    }
    irAPaso(b.dataset.paso);
  });
  $$('#vFicha [data-modo]').forEach(b => b.onclick = () => cambiarModoFicha(b.dataset.modo));
  if($('#fiAtras'))     $('#fiAtras').onclick = () => irAPaso(pasoVecino(-1));
  if($('#fiSiguiente')) $('#fiSiguiente').onclick = () => avanzarPaso();
  if($('#fiGuardar'))   $('#fiGuardar').onclick = () => guardarPasoConCierre();
  cablearExtrasDePaso();
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

  /* Se escribe sólo en la sección propia y sólo en la que se está trabajando.
     Y una ficha firmada no se toca hasta que se reabra. */
  const miSeccion = puedeEditarSeccion(guardada || f, seccionDePaso(pasoFicha));
  const enFoco    = pasoEnFoco(pasoFicha);
  const editable  = miSeccion && enFoco && (!firmada || pasoFicha === 'firma');
  if(!editable) bloquearCuerpo();
  /* Lo que no se puede editar se ve atenuado: sigue completamente legible
     —el que anestesia necesita leer el prequirúrgico— pero se distingue de
     un golpe de vista lo que es propio de lo que es del colega. */
  if(!miSeccion || !enFoco) cuerpo.classList.add('atenuado');
}

/* =========================================================================
   LOS DOCUMENTOS DE CADA PASO
   -------------------------------------------------------------------------
   Se habilitan recien cuando lo que documentan esta guardado. Un PDF de una
   valoracion a medio cargar no le sirve a nadie, y mandarsela asi al
   paciente es peor todavia: lleva su nombre, su historia clinica y la firma
   del profesional. Por eso los botones existen siempre —para que se vea que
   estan— pero nacen apagados y se encienden al guardar.
   ========================================================================= */
function htmlExtrasDePaso(f, soloActo){
  const tipo = PASO_EXTRAS[pasoFicha];
  if(!tipo) return '';
  const guardada = DB.fichas[f.id];

  /* ---------------- Documentos de la VALORACION prequirurgica ------------- */
  if(tipo === 'valoracion'){
    if(soloActo) return '';                    /* la valoracion es de un colega */
    const lista  = !!(guardada && guardada.valoracionGuardada);
    const p      = DB.pacientes[f.pacienteId] || {};
    const sinMail = !p.email;
    const off = lista ? '' : ' disabled';
    return '<div class="doc-caja no-print">'+
      '<div class="doc-caja-tit">'+ico('valoracion')+
        '<b>Documentación de la valoración prequirúrgica</b></div>'+
      (lista
        ? '<div class="mini">Valoración guardada el '+
          fFechaLarga(String(guardada.valoracionGuardada).slice(0,10))+' a las '+
          esc(String(guardada.valoracionGuardada).slice(11,16))+' h.</div>'
        : '<div class="aviso warn mt8">'+ico('candado')+'<div><b>Todavía no se puede documentar.</b> '+
          'Completá la valoración —incluido el punto 15, el consentimiento informado— y tocá '+
          '<b>«Guardar valoración»</b>. Recién ahí se habilitan estos cuatro botones.</div></div>')+
      '<div class="btn-row mt8 fi-extras">'+
        '<button class="btn ghost chico" id="fiHon"'+off+'>'+ico('dinero')+' Honorarios</button>'+
        '<button class="btn ghost chico" id="fiWord"'+off+'>'+ico('word')+' Word</button>'+
        '<button class="btn ghost chico" id="fiPdf"'+off+'>'+ico('imprimir')+' PDF</button>'+
        '<button class="btn pri chico" id="fiMail"'+(lista && !sinMail ? '' : ' disabled')+'>'+
          ico('adjunto')+' Enviar valoración al paciente</button>'+
      '</div>'+
      (lista && sinMail
        ? '<div class="ayuda">El paciente no tiene correo cargado: agregalo en su historia '+
          'para poder enviarle la documentación.</div>' : '')+
      (lista
        ? '<div class="ayuda">Al paciente le llegan <b>dos PDF por separado</b>: la valoración '+
          'pre-anestésica y el consentimiento informado firmado'+
          (INDICACIONES_AL_PACIENTE ? ', más la hoja de indicaciones' : '')+
          '. Sin ningún dato de facturación.</div>' : '')+
    '</div>';
  }

  /* ------------------- Documentos del ACTO anestesico -------------------- */
  const enBase = !!guardada;
  const off = enBase ? '' : ' disabled';
  return '<div class="doc-caja no-print">'+
    '<div class="doc-caja-tit">'+ico('ficha')+'<b>Documentación del acto anestésico</b></div>'+
    (enBase ? '' : '<div class="aviso warn mt8">'+ico('candado')+
      '<div>Guardá el registro para poder exportarlo.</div></div>')+
    '<div class="btn-row mt8 fi-extras">'+
      '<button class="btn ghost chico" id="fiHon"'+off+'>'+ico('dinero')+' Honorarios</button>'+
      '<button class="btn ghost chico" id="fiWord"'+off+'>'+ico('word')+' Word</button>'+
      '<button class="btn ghost chico" id="fiPdf"'+off+'>'+ico('imprimir')+' PDF</button>'+
    '</div>'+
    /* El consentimiento NO vuelve a aparecer acá: se firmó en el punto 15 de
       la Preanestesia y ya se le entregó al paciente con su valoración.
       Repetirlo en el cierre no agrega nada y confunde sobre cuál es el que
       vale. */
    '<div class="ayuda">El consentimiento informado ya se firmó y se entregó con la valoración '+
      'prequirúrgica (punto 15). Sale impreso dentro de estos documentos.</div>'+
  '</div>';
}

function cablearExtrasDePaso(){
  if($('#fiHon'))  $('#fiHon').onclick  = () => { guardarPasoActual(); abrirHonorarios(fichaActual); };
  if($('#fiWord')) $('#fiWord').onclick = () => { guardarPasoActual(); exportarFichaWord(fichaActual); };
  if($('#fiPdf'))  $('#fiPdf').onclick  = () => { guardarPasoActual(); imprimirFicha(fichaActual); };
  if($('#fiMail')) $('#fiMail').onclick = () => { guardarPasoActual(); enviarDocumentacionPaciente(fichaActual); };
}

/* =========================================================================
   AVANZAR DE PASO: guarda solo y sigue
   -------------------------------------------------------------------------
   «Siguiente» no es nada mas moverse de pantalla: graba en la base lo que se
   cargo en el paso. Es como trabaja el anestesiologo —termina una cosa y
   pasa a la otra— y evita el error mas caro de todos, que es perder un
   registro por haber salido sin apretar Guardar.
   ========================================================================= */
function avanzarPaso(){
  const k = pasoVecino(1);
  if(!k) return;
  const f = fichaActual;
  /* Segunda línea de defensa: el botón ya no se dibuja si el paso siguiente
     está cerrado, pero avanzarPaso() también se llama desde otros lados. */
  if(!pasoHabilitado(f, k)) return toast(motivoPasoCerrado(f, k), 'warn');
  guardarPasoActual();

  /* Sin paciente no hay nada que guardar: la ficha no existe todavia */
  if(!f.pacienteId){
    pasoFicha = 'paciente'; pintarFicha();
    return toast('Elegí un paciente para poder continuar.', 'err');
  }

  const mio = puedeEditarSeccion(DB.fichas[f.id] || f, seccionDePaso(pasoFicha));
  if(mio && !(f.firma || {}).firmado){
    guardarFicha(true, true);                        /* silencioso, sin repintar */
    toast(({ paciente:     'Datos del paciente y del procedimiento guardados.',
             preanestesia: 'Valoración guardada.',
             anestesia:    'Acto anestésico guardado.',
             recuperacion: 'Recuperación guardada.' })[pasoFicha] || 'Guardado.', 'ok');
  }
  irAPaso(k);
}

/* =========================================================================
   GUARDAR EL PASO QUE CIERRA UNA SECCION
   Preanestesia y Firmar no son un paso mas: cada uno cierra un acto medico
   completo y habilita su documentacion. Por eso tienen boton propio y
   validacion propia.
   ========================================================================= */
function guardarPasoConCierre(){
  guardarPasoActual();
  const f = fichaActual;

  if(pasoFicha === 'preanestesia'){
    if(!f.pacienteId){ pasoFicha = 'paciente'; pintarFicha();
      return toast('Elegí un paciente para poder continuar.', 'err'); }

    /* --- El punto 15 es condicion para dar la valoracion por concluida --- */
    if(!consentimientoCompleto(f)){
      const falta = faltaDelConsentimiento(f);
      pintarFicha();
      const acc = $('#acConsent');
      if(acc){ acc.open = true; acc.scrollIntoView({ behavior:'smooth', block:'center' }); }
      return toast('Falta el punto 15, consentimiento informado: ' + falta + '.', 'err');
    }

    f.fechaValoracion = f.fechaValoracion || (f.v && f.v.riesgo && f.v.riesgo.fecha) || hoyISO();
    f.valoracionGuardada = new Date().toISOString();
    f.valoracionPorUid   = SESION.uid;
    if((f.estado || 'borrador') === 'borrador') f.estado = 'realizada';
    guardarFicha(true);
    auditar('valoracion-cerrar', 'Valoración prequirúrgica concluida y firmada');
    toast('Valoración prequirúrgica guardada. Ya podés generar y enviar la documentación.', 'ok');
    pintarFicha();
    const caja = $('.doc-caja');
    if(caja) caja.scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }

  /* ------------------------------- Firmar ------------------------------- */
  guardarFicha(true);
  cierreDeFicha(fichaActual);
}

/* =========================================================================
   CIERRE DE LA FICHA - las dos preguntas del final
   -------------------------------------------------------------------------
   1. ¿Se lleva el registro en un archivo o queda solamente guardado?
      El acto, la recuperacion y la firma son historia clinica: muchas
      instituciones piden la copia en papel o en PDF para el legajo del
      paciente, y el anestesiologo suele querer la suya.

   2. ¿Carga los honorarios ahora o los difiere?
      Cargarlos en caliente es lo que evita el agujero de facturacion de fin
      de mes. Si los difiere, la app se lo recuerda cada tres horas hasta que
      los cargue: no se pierde, insiste.
   ========================================================================= */
function cierreDeFicha(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const quien = (p.apellido || '') + ', ' + (p.nombre || '');

  abrirModal('Registro guardado',
    '<div class="aviso ok">'+ico('check')+'<div><b>El acto anestésico, la recuperación y la '+
      'firma quedaron guardados</b>'+(nubeOK ? ' y sincronizados' : ' en este dispositivo')+
      '.<br>'+esc(quien)+' · '+esc(f.cirugia || 'sin cirugía')+'</div></div>'+
    '<p class="mini strong mt14">¿Querés llevarte el registro en un archivo?</p>'+
    '<div class="opciones-cierre">'+
      '<button type="button" class="op-cierre" id="ciPdf">'+ico('imprimir')+
        '<b>PDF</b><span>Acto, recuperación y firma listos para imprimir o guardar</span></button>'+
      '<button type="button" class="op-cierre" id="ciWord">'+ico('word')+
        '<b>Word</b><span>El mismo documento, editable</span></button>'+
      '<button type="button" class="op-cierre" id="ciNada">'+ico('nube')+
        '<b>Sólo guardado</b><span>Queda en tu archivo personal de fichas, sin descargar nada</span></button>'+
    '</div>', '');
  $('#ciPdf').onclick  = () => { imprimirFicha(f);      cerrarModal(); setTimeout(() => preguntarHonorarios(f), 700); };
  $('#ciWord').onclick = () => { exportarFichaWord(f);  cerrarModal(); setTimeout(() => preguntarHonorarios(f), 400); };
  $('#ciNada').onclick = () => { cerrarModal();         setTimeout(() => preguntarHonorarios(f), 180); };
}

function preguntarHonorarios(f){
  const g = DB.fichas[f.id] || f;
  /* Los honorarios del acto son de quien anestesió. Al que sólo hizo la
     valoración no se le pregunta por un honorario que no es suyo. */
  if(!puedeEditarSeccion(g, 'acto') || (g.hon || {}).modalidad){
    return irAPaso('firma');
  }
  abrirModal('Honorarios del acto',
    '<p style="margin:0 0 12px;line-height:1.6">Todavía no cargaste los honorarios de este acto '+
      'anestésico. Mientras no lo hagas, la prestación no aparece en tu facturación del mes ni '+
      'en tus estadísticas de ingresos.</p>'+
    '<div class="opciones-cierre">'+
      '<button type="button" class="op-cierre" id="hoAhora">'+ico('dinero')+
        '<b>Cargarlos ahora</b><span>Se abre la ventana de honorarios, son dos minutos</span></button>'+
      '<button type="button" class="op-cierre" id="hoDespues">'+ico('reloj')+
        '<b>Dejarlo para después</b><span>Te lo recuerdo cada 3 horas hasta que lo cargues</span></button>'+
    '</div>', '');
  $('#hoAhora').onclick = () => { cerrarModal(); abrirHonorarios(fichaActual); };
  $('#hoDespues').onclick = () => {
    cerrarModal();
    diferirHonorarios(fichaActual);
  };
}

/* Deja marcado que el honorario quedó pendiente a proposito. El recordatorio
   lo dispara ui-avisos.js: campana en rojo y cartel cada tres horas. */
function diferirHonorarios(f){
  const base = JSON.parse(JSON.stringify(DB.fichas[f.id] || f));
  base.honDiferido = { desde: new Date().toISOString(), uid: SESION.uid, avisado: '' };
  escribir('fichas', base.id, base);
  if(fichaActual && fichaActual.id === base.id) fichaActual.honDiferido = base.honDiferido;
  auditar('honorarios-diferir', 'Honorarios del acto diferidos');
  toast('Anotado. Te lo voy a recordar cada 3 horas hasta que los cargues.', 'warn');
  irA('panel');
}

/* Cambia la tarea en foco. NO cambia permisos: si el acto es de un colega,
   pasar a «Acto anestésico» lo muestra en claro, pero sigue bloqueado. */
function cambiarModoFicha(k){
  guardarPasoActual();
  modoFicha = k;
  /* Si el paso donde estoy no pertenece al modo elegido, me lleva al primero
     que sí: cambiar de tarea sin moverse de pantalla confunde. */
  if(!pasoEnFoco(pasoFicha)){
    const p = PASOS_FICHA.find(x => pasoEnFoco(x.k));
    if(p) pasoFicha = p.k;
  }
  pintarFicha();
}

/* Aviso de a quién pertenece lo que se está mirando */
function bannerSeccion(g){
  const sec = seccionDePaso(pasoFicha);
  if(!puedeEditarSeccion(g, sec)){
    const duenio = sec === 'acto' ? nombreActor(g) : autorFicha(g);
    const qué = sec === 'acto'       ? 'El acto anestésico'
              : sec === 'preanestesia' || sec === 'valoracion'
                                     ? 'La valoración prequirúrgica'
                                     : 'La identificación del paciente';
    return '<div class="aviso info no-print">'+ico('candado')+'<div><b>'+qué+
      ' es de '+esc(duenio)+'.</b> La ves completa para trabajar sobre esa '+
      'información, pero no la podés editar: cada anestesiólogo firma lo suyo.</div></div>';
  }
  if(pasoEnFoco(pasoFicha)) return '';
  const otra = sec === 'acto' ? 'acto' : 'valoracion';
  return '<div class="aviso warn no-print">'+ico('info')+'<div><b>Este paso es de la otra '+
    'sección.</b> Estás trabajando en «'+esc((MODOS_FICHA.find(m => m.k===modoFicha)||{}).t)+'». '+
    '<button class="btn pri chico mt8" data-modo="'+otra+'">'+ico('editar')+
    ' Trabajar en '+(otra === 'acto' ? 'el acto anestésico' : 'la valoración')+'</button></div></div>';
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
  /* Nadie escribe en la sección del otro: el que hizo la valoración no toca
     el acto de su colega, y el que anestesió no toca la valoración. */
  if(!puedeEditarSeccion(guardada || f, seccionDePaso(pasoFicha))) return;
  if(pasoFicha === 'paciente')          Object.assign(f, leerPasoPaciente());
  else if(pasoFicha === 'preanestesia'){ f.v = leerValoracion(); f.plan = leerPlan();
                                        f.consent = leerConsentimiento(f);   /* punto 15 */
                                        Object.assign(f, leerAsignacionActo()); }
  else if(pasoFicha === 'anestesia')     f.acto = leerPasoAnestesia();
  else if(pasoFicha === 'recuperacion')  f.recup = leerPasoRecuperacion();
}

/* sinRepintar: guarda sin rehacer la pantalla entera. Lo usa la carga del
   parte quirúrgico, que sólo necesita refrescar su propia lista: rehacer
   #vFicha devolvía al usuario al principio del registro. */
function guardarFicha(silencioso, sinRepintar){
  const f = fichaActual;
  const guardada = DB.fichas[f.id];

  /* Ficha de un colega: se escribe únicamente lo que le corresponde, sobre la
     versión vigente en la base, para no pisar nada de lo que él cargó. */
  if(guardada && !puedeEditarFicha(guardada)){
    /* Si tampoco el acto es mío, no hay nada mío que guardar en esta ficha:
       escribirla igual pisaría con una copia vieja lo que cargó su dueño. */
    if(!puedeEditarSeccion(guardada, 'acto')){
      if(!silencioso) toast('Esta ficha es de '+autorFicha(guardada)+
        ' y el acto es de '+nombreActor(guardada)+': la podés leer, no editar.', 'err');
      return;
    }
    const base = migrarFicha(JSON.parse(JSON.stringify(guardada)));
    base.acto = f.acto || {};
    base.recup = f.recup || {};
    if(esActorFicha(guardada) && f.hon) base.hon = f.hon;   /* su propio honorario */
    base.actoPorUid = SESION.uid;
    base.actoPorNombre = USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '';
    sincronizarFechas(base);
    base.modificado = new Date().toISOString();
    base.modificadoPor = SESION.uid;
    base.modificadoPorNombre = base.actoPorNombre;
    escribir('fichas', base.id, base);
    auditar('ficha-acto-colega',
      'Acto anestésico registrado en la ficha de ' + autorFicha(guardada));
    fichaActual = base;
    if(!silencioso) toast('Acto anestésico guardado' + (nubeOK ? ' y sincronizado.' : '.'), 'ok');
    if(!sinRepintar) pintarFicha();
    return;
  }

  if(!f.pacienteId){
    if(!sinRepintar){ pasoFicha = 'paciente'; pintarFicha(); }
    return toast('Seleccioná un paciente en el paso 1.', 'err');
  }
  sincronizarFechas(f);
  f.modificado = new Date().toISOString();
  f.modificadoPor = SESION.uid;
  f.modificadoPorNombre = USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '';
  escribir('fichas', f.id, f);
  auditar('ficha-guardar', (DB.pacientes[f.pacienteId]||{}).apellido + ' — ' + (f.cirugia||''));
  if(!silencioso) toast('Ficha guardada' + (nubeOK ? ' y sincronizada.' : ' en este dispositivo.'), 'ok');
  if(!sinRepintar) pintarFicha();
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
  /* La tarjeta de la valoración pendiente encabeza también este paso. Cuando
     se declara que la valoración se hizo en papel, la aplicación cae acá
     —falta el paciente— y ahí mismo tiene que estar el botón de la foto: es
     el momento en que la persona tiene la hoja en la mano. */
  (deudaValoracion(f) ? htmlValoracionExterna(f) : '')+
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
    /* Si el carácter se declaró al tomar el acto —urgencia o emergencia—, acá
       no se vuelve a preguntar: ya lo dijo la persona hace treinta segundos.
       Se muestra lo que quedó, y se corrige donde corresponde, que es el
       carácter del acto en el paso 3. */
    (function(){
      const decl = motivoSinValoracion(f);
      if(decl && decl.caracter) return ''+
        '<div class="campo"><label>Carácter de la cirugía</label>'+
          '<div class="aviso warn" style="margin:0">'+ico('alerta')+'<div>'+
            '<b>'+esc(nombreCaracter(decl.caracter).toUpperCase())+'</b> — '+
            'declarado al tomar el acto anestésico.<br>'+
            'Si hace falta corregirlo, se hace en el paso <b>Anestesia</b>, que es el carácter que '+
            'se informa y se factura.</div></div></div>';
      return ''+
      '<div class="campo"><label>Carácter de la cirugía, tal como se la ve hoy '+
        '<span class="req">*</span></label>'+
        '<div class="seg" id="qxCaracter">'+
          CARACTERES.map(c => '<button type="button" data-v="'+c.id+'"'+
            (caracterValoracion(f)===c.id?' class="on"':'')+'>'+esc(c.n)+'</button>').join('')+
        '</div>'+
        '<div class="ayuda">Urgencia: debe resolverse en horas. Emergencia: riesgo vital inmediato, '+
        'sin demora posible.</div>'+
        /* El caracter del ACTO se confirma en el paso 3: una programada que se
           adelanta se anestesia de urgencia, y de ese dato -no de este- dependen
           las estadisticas y el adicional del honorario. */
        '<div class="aviso info mt8">'+ico('info')+'<div>Este es el carácter de <b>la consulta</b>. '+
          'El del acto anestésico se confirma el día de la cirugía, en el paso <b>Anestesia</b>: '+
          'una programada que se adelanta se anestesia de urgencia, y es ese el que se informa y '+
          'se factura.</div></div></div>';
    })()+
    /* Fecha, hora y turno NO se piden acá: cuando el anestesiólogo hace la
       valoración prequirúrgica todavía no los sabe —la cirugía se programa
       después—. La fecha real del acto se carga en el paso Anestesia, y la
       de esta consulta queda registrada sola en el punto 11 de la
       Preanestesia. Son dos fechas distintas y casi nunca coinciden. */
    '<div class="aviso info">'+ico('calendario')+'<div><b>La fecha de la cirugía se carga en el '+
      'paso Anestesia</b>, el día del acto. Esta valoración queda fechada '+
      (f.fechaValoracion ? 'el <b>'+fFecha(f.fechaValoracion)+'</b>' : 'hoy')+'.</div></div>'+
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
      '<div class="ayuda">Diagnóstico quirúrgico en texto claro.</div></div>'+
    '<div class="campo"><label>Cirugía / procedimiento <span class="req">*</span></label>'+
      '<div class="buscador"><input type="search" id="cxBuscar" placeholder="Buscar en el nomenclador anestésico… ej.: colecistectomía, cesárea, cadera" autocomplete="off">'+
      '<div class="res" id="cxRes"></div></div>'+
      '<div class="ayuda">Nomenclador anestésico AFAAR. Si el procedimiento no está, lo agregás desde el mismo buscador.</div>'+
      '<div id="cxSel" class="mt8"></div></div>'+
    campoSel('qxLateralidad','Lateralidad', ['No aplica','Derecha','Izquierda','Bilateral'], f.lateralidad)+
  '</div>'+

  '<div class="aviso info">'+ico('info')+'<div>El <b>equipo quirúrgico</b> se carga en el paso '+
    '<b>Anestesia</b>, donde queda asentado quién operó de verdad. El <b>anestesiólogo que realiza '+
    'el acto</b> se designa en el paso <b>Preanestesia</b>, punto 14.</div></div>';
}

function cablearPasoPaciente(f){
  cablearValoracionExterna(f);
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
  /* Si el carácter se declaró al tomar el acto, el selector no se dibuja: hay
     que conservar lo que ya está, no reponer «programada» sobre una urgencia
     declarada hace un minuto. */
  const b = $('#qxCaracter button.on');
  const carDeclarado = !$('#qxCaracter') ? caracterValoracion(fichaActual) : null;
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
    pacienteId: pid, caracter: carDeclarado || (b ? b.dataset.v : 'programada'),
    institucion: val('qxInst'), obraSocial: val('qxOS'), nroAfiliado: val('qxAfiliado'),
    especialidad: val('qxEsp'),
    diagnostico: val('qxDx'),
    cirugia: cxSeleccionada ? cxSeleccionada.n : '',
    cirugiaUA: cxSeleccionada ? cxSeleccionada.ua : 0,
    cirugiaCod: cxSeleccionada ? (cxSeleccionada.cod || '') : '',
    cirugiaComp: cxSeleccionada ? (cxSeleccionada.comp || '') : '',
    cirugiaGrillaB: cxSeleccionada ? !!cxSeleccionada.grillaB : false,
    cirugiaNota: cxSeleccionada ? (cxSeleccionada.nota || '') : '',
    lateralidad: val('qxLateralidad')
    /* El equipo quirúrgico se lee en el paso Anestesia (acto.equipo) y la
       designación del actuante en el paso Preanestesia (punto 14). Si se
       leyeran acá, cada vez que se guarda el paso 1 se borrarían. */
  };
}

/* =========================================================================
   TOMAR EL ACTO ANESTESICO
   Deja al que toca asentado como el anestesiologo que realiza el acto: es el
   que va a firmarlo, el que responde por el y a cuyo nombre se factura. La
   consulta prequirurgica sigue siendo de quien la hizo: son dos actos
   medicos distintos y se facturan por separado.
   ========================================================================= */
function tomarActo(f){
  const g = DB.fichas[f.id];
  const deColega = g && !esAutorFicha(g);
  const otro = actorFicha(g || f);
  const pisando = otro && SESION && otro !== SESION.uid;

  confirmar('Tomar el acto anestésico',
    '<b>'+esc((USUARIO ? USUARIO.apellido+', '+USUARIO.nombre : 'Vos'))+'</b> queda registrado como '+
    'el anestesiólogo que realiza este acto.<br><br>'+
    (pisando
      ? '<b>Ojo:</b> en el punto 14 estaba designado <b>'+esc(nombreActor(g || f))+'</b>. '+
        'Al tomarlo, el acto y su honorario pasan a tu nombre y queda asentado en la auditoría.<br><br>'
      : '')+
    'El honorario del acto pasa a ser tuyo; la consulta prequirúrgica sigue siendo de '+
    esc(autorFicha(g || f))+'.',
    () => {
      /* Sin paciente el acto se toma igual, pero NO se escribe en la base
         compartida: quedaría una ficha fantasma sin nadie adentro. Se queda en
         memoria y viaja entera cuando se elija el paciente, que es el paso
         siguiente del recorrido. Tomar el acto es una afirmación sobre uno
         mismo; la identidad del paciente viene después, y en una urgencia
         así es como ocurre. */
      const local = !f.pacienteId;
      if(!g && !local) guardarFicha(true, true);
      const base = migrarFicha(JSON.parse(JSON.stringify(DB.fichas[f.id] || f)));
      base.asignadoUid   = SESION.uid;
      base.actoPorUid    = SESION.uid;
      base.actoPorNombre = USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '';
      base.actoTomado    = new Date().toISOString();
      base.actorExterno  = '';
      base.modificado    = new Date().toISOString();
      if(!local) escribir('fichas', base.id, base);
      auditar('ficha-tomar-acto',
        (deColega ? 'Acto de la ficha de ' + autorFicha(base) : 'Acto propio') +
        (pisando ? ' (estaba designado ' + nombreUsuario(otro) + ')' : ''));
      fichaActual = base;
      pasoFicha = 'anestesia';
      modoFicha = pasoEnFoco('anestesia') ? modoFicha : 'acto';
      pintarFicha();
      toast(local ? 'El acto quedó a tu nombre.' : 'El acto quedó a tu nombre. Ya podés registrarlo.', 'ok');
      /* Tomar el acto es el momento en que alguien se hace responsable. Recién
         ahí tiene sentido preguntar qué pasa con la valoración: antes, quien
         mira la ficha todavía no es nadie. */
      if(debeDeclararSinValoracion(base))
        setTimeout(() => pedirMotivoSinValoracion(base), 300);
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
  /* El parte quirurgico y el envio del acto son de quien anestesio */
  const miActo = puedeEditarSeccion(DB.fichas[f.id] || f, 'acto');
  const a = f.acto || {}, r = f.recup || {}, v = f.v || {}, pl = f.plan || {};
  const fi = f.firma || {};
  const bal = calcularBalance(a.balance);
  const durCx = minutosEntre(a.inicioCirugia, a.finCirugia);
  const durAn = minutosEntre(a.inicioAnestesia, a.finAnestesia);
  const eventos = (a.eventos2 || []);
  const faltan = faltantesFicha(f).filter(x => x.critico);
  const trabas = pasosPreviosPendientes(f);
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
        '<button class="btn ghost" id="fiInicio">'+ico('panel')+' Volver al inicio</button>'+
        '<button class="btn ghost chico" id="fiReabrir">'+ico('editar')+' Reabrir para corregir</button>'+
      '</div>'+
    '</div>'+
    tarjetaResumenAnestesia(f)+
    htmlParteQuirurgico(f, miActo)+
    htmlEnvioFicha(f);

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

  (trabas.length
    ? '<div class="aviso danger">'+ico('alerta')+'<div><b>La ficha todavía no se puede firmar.</b><br>'+
      'Falta cerrar '+(trabas.length === 1 ? 'este paso' : 'estos pasos')+', que quedan en '+
      (trabas.length === 1 ? 'estado' : 'estados')+' distinto'+(trabas.length === 1 ? '' : 's')+
      ' de «Completo»:'+
      '<div class="btn-row mt8">'+ trabas.map(t =>
        '<button class="btn ghost chico" data-irpaso="'+t.k+'">'+ico('flecha')+' '+
        esc(t.t)+' — '+esc(ROTULO_ESTADO[t.estado])+'</button>').join('')+'</div>'+
      (faltan.length ? '<div class="mini mt8">Datos esenciales sin cargar: '+
        esc(faltan.map(x => x.t).join(', '))+'.</div>' : '')+
      '</div></div>'
    : '<div class="aviso ok">'+ico('check')+'<div>El registro está completo. Ya se puede firmar.</div></div>')+

  '<div class="card"><h3>'+ico('firma')+'Firma del anestesiólogo</h3>'+
    '<p class="mini">Al firmar, la ficha queda cerrada y en sólo lectura. Después se puede '+
      'reabrir dejando constancia en la auditoría.</p>'+
    '<div class="firma-box"><canvas id="fiFirmaCanvas"></canvas><div class="hint">Firmar aquí</div></div>'+
    '<div class="btn-row mt8">'+
      '<button class="btn ghost chico" id="fiFirmaLimpiar">Borrar</button>'+
      '<button class="btn ghost chico" id="fiFirmaPerfil">Usar mi firma guardada</button>'+
    '</div>'+
    '<button class="btn pri grande mt14" id="fiFirmar"'+(trabas.length ? ' disabled' : '')+'>'+
      ico('check')+' Finalizar y firmar</button>'+
    (trabas.length ? '<p class="mini mt8">El botón se habilita cuando los cinco puntos del '+
      'recorrido estén en verde.</p>' : '')+
  '</div>'+

  /* La foja quirúrgica y el envío a contaduría van al final del registro, en
     los dos estados: casi siempre el parte del cirujano llega DESPUÉS de que
     el anestesiólogo firmó su ficha, y tiene que poder adjuntarlo igual. */
  htmlParteQuirurgico(f, miActo)+
  htmlEnvioFicha(f)+

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
  cablearParteQuirurgico(f);
  cablearEnvioFicha(f);

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
  /* Los botones del cartel llevan al paso que falta cerrar */
  $$('#vFicha [data-irpaso]').forEach(b => b.onclick = () => irAPaso(b.dataset.irpaso));

  $('#fiFirmar').onclick = () => {
    /* El boton ya sale deshabilitado, pero la comprobacion se rehace aca:
       entre que se pinto la pantalla y el clic pudo cambiar algo. */
    const trabas = pasosPreviosPendientes(fichaActual);
    if(trabas.length) return toast('Falta cerrar: ' +
      trabas.map(t => t.t).join(', ') + '.', 'err');
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
        guardarFicha(true);
        toast('Ficha anestésica completa.', 'ok');
        /* Firmar es el final del acto médico, pero no el final del trámite:
           quedan la copia del registro y el honorario. Se preguntan las dos
           cosas acá, en caliente, que es cuando el anestesiólogo todavía
           tiene la ficha en la cabeza. */
        cierreDeFicha(fichaActual);
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
    /* Cargado el honorario, se apaga el recordatorio de cada tres horas: la
       razón por la que existía dejó de estar. */
    if(fichaActual.hon && fichaActual.hon.modalidad) fichaActual.honDiferido = null;
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

  '<div id="hoCaracterAviso"></div>'+
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

    let total = 0, detalle = '', base = 0;
    if(porUnidades){
      const ua = Number(val('hoUA')) || 0, vu = Number(val('hoVU')) || 0;
      base = ua * vu;
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

    /* Cruce entre lo que dice el registro del acto y lo que se esta
       facturando. NO auto-tilda nada: el adicional depende del convenio y no
       solo del caracter, y un recargo puesto por la maquina en una factura
       que firma una persona es exactamente lo que no hay que hacer. Lo unico
       que hace es decir que los dos datos se contradicen, que hasta ahora no
       lo veia nadie: al contador el caracter no le llega. */
    const avCar = $('#hoCaracterAviso');
    if(avCar){
      const car = caracterActo(fichaActual);
      const urg = $$('#hoAdic input:checked').map(i => i.value).indexOf('urgencia') >= 0;
      let aviso = '';
      if(porUnidades && esNoProgramado(car) && !urg)
        aviso = '<div class="aviso warn">'+ico('alerta')+'<div><b>El acto está registrado como '+
          esc(nombreCaracter(car).toLowerCase())+' y el honorario no lleva el adicional de '+
          'urgencia.</b><br>Si el convenio lo reconoce, corresponde tildarlo: son '+
          fMoneda(base * 0.5)+' más. Si el convenio no lo prevé, dejalo así.</div></div>';
      else if(porUnidades && !esNoProgramado(car) && urg)
        aviso = '<div class="aviso danger">'+ico('alerta')+'<div><b>El honorario lleva el adicional '+
          'de urgencia, pero el acto está registrado como programado.</b><br>Revisá cuál de los dos '+
          'está mal. Un recargo sin respaldo en el registro es lo primero que debita una auditoría '+
          'del financiador.</div></div>';
      avCar.innerHTML = aviso;
    }

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
/* =========================================================================
   ATAJO AL PUNTO 15
   El consentimiento dejo de ser una ventana aparte: vive dentro de la
   valoracion, como punto 15, porque es parte de ella y no un tramite suelto.
   Esta funcion queda porque los avisos y los enlaces viejos apuntan al
   consentimiento: en vez de abrir un modal, lleva al punto donde ahora esta.
   ========================================================================= */
/* =========================================================================
   EL CONSENTIMIENTO COMO VENTANA PROPIA
   -------------------------------------------------------------------------
   Quien viene por el acto anestesico no tiene por que abrir la valoracion
   prequirurgica para firmar un consentimiento: la valoracion puede ser de un
   colega, o de una intervencion anterior, y entrar ahi invita a tocar lo que
   no es de uno.

   El punto 15 se monta tal cual en una ventana: es el mismo formulario, con
   el mismo texto legal, las mismas declaraciones y las mismas dos firmas. Lo
   que cambia es de donde se lo abre.

   El consentimiento es de ESTA intervencion. En una reintervencion la
   valoracion se importa, pero el consentimiento no: otro procedimiento, otro
   riesgo, otra firma. Por eso la ventana muestra la cirugia y el diagnostico
   de ahora en el encabezado, para que quien firma sepa que esta firmando.
   ========================================================================= */
function abrirConsentimientoModal(f){
  if(!f) return;
  if(!f.cirugia || !f.diagnostico)
    return toast('Cargá la cirugía y el diagnóstico de esta intervención antes de firmar.', 'err');
  const p = DB.pacientes[f.pacienteId] || {};
  abrirModal('Consentimiento informado anestésico',
    '<div class="aviso info">'+ico('info')+'<div>'+
      '<b>'+esc((p.apellido||'—')+', '+(p.nombre||''))+'</b>'+
      (p.dni ? ' — DNI '+esc(p.dni) : '')+'<br>'+
      esc(f.cirugia)+' · '+esc(f.diagnostico)+
      (motivoSinValoracion(f) && sinValoracion(f).origenTxt
        ? '<br><span class="mini">La valoración prequirúrgica viene de: '+
          esc(sinValoracion(f).origenTxt)+'. Este consentimiento es de la intervención de hoy.</span>'
        : '')+
    '</div></div>'+
    htmlConsentimiento(f, true),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="coGuardar">'+ico('check')+' Guardar consentimiento</button>',
    '780px');
  cablearConsentimiento(f);
  $('#coGuardar').onclick = () => {
    const c = leerConsentimiento(f);
    if(!c.quien) return toast('Elegí quién firma el consentimiento.', 'err');
    const falta = (() => {
      if(consentSinFirma(c.quien)) return '';
      const l = [];
      if(!c.firmante)           l.push('el nombre y DNI del firmante');
      if(!c.firmaPaciente)      l.push('la firma del paciente');
      if(!c.firmaAnestesiologo) l.push('tu firma');
      return l.join(', ');
    })();
    if(falta) return toast('Falta '+falta+'.', 'err');
    f.consent = c;
    cerrarModal();
    guardarFicha(true, true);
    auditar('consentimiento', 'Otorgado en la ficha ' + f.id);
    pintarFicha();
    toast('Consentimiento otorgado.', 'ok');
  };
}

function abrirConsentimiento(f){
  modoFicha = pasoEnFoco('preanestesia') ? modoFicha : 'valoracion';
  irAPaso('preanestesia');
  setTimeout(() => {
    const acc = $('#acConsent');
    if(acc){ acc.open = true; acc.scrollIntoView({ behavior:'smooth', block:'center' }); }
  }, 120);
}
