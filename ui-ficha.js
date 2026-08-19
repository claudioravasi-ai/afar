/* =========================================================================
   FICHA ANESTESICA
   Un documento por acto anestesico: datos quirurgicos, valoracion
   prequirurgica, plan, consentimiento, registro intraoperatorio y honorarios.
   ========================================================================= */

let fichaActual = null;
let solapaFicha = 'qx';
let firmaPaciente = null, firmaAnest = null;
let cxSeleccionada = null, dxQxSeleccionado = null;

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
      [['borrador','Borrador'],['realizada','Realizada'],['cerrada','Cerrada']].map(e =>
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

/* ============================ EDITOR ============================ */
function abrirFicha(id, pacienteId){
  const nueva = !id;
  if(id && !DB.fichas[id]) return toast('No se encontró la ficha.', 'err');
  fichaActual = id ? JSON.parse(JSON.stringify(DB.fichas[id])) : {
    id: uid('fic'), ownerUid: SESION.uid, pacienteId: pacienteId || '',
    fecha: hoyISO(), hora: ahoraHora(), caracter:'programada',
    institucion:'', obraSocial:'', estado:'borrador',
    v:{}, plan:{}, acto:{}, hon:{}, consent:{},
    creado:new Date().toISOString()
  };
  if(pacienteId) fichaActual.pacienteId = pacienteId;
  /* Si la ficha la hizo otro anestesiologo y el acto todavia no es mio,
     abre directamente en la solapa para tomar el acto operatorio. */
  const g = id ? DB.fichas[id] : null;
  solapaFicha = (g && !puedeEditarFicha(g) && !esActorFicha(g)) ? 'tomar' : 'qx';
  cxSeleccionada = fichaActual.cirugia ? {
    n: fichaActual.cirugia, ua: fichaActual.cirugiaUA,
    cod: fichaActual.cirugiaCod || '', comp: fichaActual.cirugiaComp || '',
    grillaB: !!fichaActual.cirugiaGrillaB, nota: fichaActual.cirugiaNota || ''
  } : null;
  dxQxSeleccionado = fichaActual.dxQuirurgico || null;
  irA('ficha');
  pintarFicha();
  if(nueva) toast('Nueva ficha creada. Recordá guardarla.', 'ok');
}

function pintarFicha(){
  const f = fichaActual;
  const guardada = DB.fichas[f.id];
  const soloActo = !!guardada && !puedeEditarFicha(guardada);
  const p = DB.pacientes[f.pacienteId] || null;
  const cont = $('#vFicha');
  /* La ficha son dos actos medicos distintos y se muestran como dos bloques
     separados: la valoracion prequirurgica (datos filiatorios, valoracion y
     plan) y el acto quirurgico. Honorarios queda aparte porque abarca los dos.
     Si la ficha es de un colega, al principio aparece la solapa para tomar
     el acto operatorio. */
  const grupos = [
    (soloActo ? { t:'Tomo la ficha', solapas:[['tomar','firma','Tomo ficha anestésica para acto operatorio']] } : null),
    { t:'Valoración prequirúrgica', solapas:[
        ['qx','ficha','Datos filiatorios'],
        ['val','valoracion','Valoración'],
        ['plan','lista','Plan']
    ] },
    { t:'Acto quirúrgico', solapas:[
        ['acto','monitor','Acto quirúrgico']
    ] },
    { t:'Honorarios', solapas:[
        ['hon','dinero','Honorarios']
    ] }
  ].filter(Boolean);
  const solapas = grupos.reduce((a,g) => a.concat(g.solapas), []);
  if(!solapas.some(s => s[0] === solapaFicha)) solapaFicha = solapas[0][0];

  cont.innerHTML = ''+
  '<div class="vista-head no-print">'+
    '<button class="btn ghost chico" id="fiVolver">'+ico('atras')+' Fichas</button>'+
    '<div style="flex:1;min-width:150px"><h1 style="font-size:18px">'+
      (p ? esc(p.apellido+', '+p.nombre) : 'Ficha sin paciente')+'</h1>'+
      '<p>'+fFecha(f.fecha)+' · '+esc(nombreInstitucion(f.institucion).split('"')[0].trim())+
      ' · '+etiquetaEstadoFicha(f)+'</p></div>'+
  '</div>'+

  '<div class="fi-secciones no-print mb8">'+ grupos.map(g =>
    '<div class="fi-seccion">'+
      '<span class="fi-seccion-t">'+esc(g.t)+'</span>'+
      '<div class="fi-seccion-s">'+ g.solapas.map(s =>
        '<span class="tag'+(solapaFicha===s[0]?' on':'')+'" data-solapa="'+s[0]+'">'+
        ico(s[1]).replace('<svg','<svg style="width:14px;height:14px;display:inline-block;vertical-align:-2px;margin-right:4px"')+
        esc(s[2])+'</span>').join('') +'</div>'+
    '</div>').join('') +'</div>'+

  (soloActo ? bannerFichaAjena(f) : bannerFaltantes(f))+

  '<div id="fiCuerpo"></div>'+

  '<div class="btn-row mt20 no-print">'+
    '<button class="btn pri grande" id="fiGuardar">'+ico('check')+' Guardar ficha</button>'+
    '<button class="btn ghost" id="fiWord">'+ico('word')+' Word</button>'+
    '<button class="btn ghost" id="fiPdf">'+ico('imprimir')+' PDF</button>'+
    (soloActo ? '' : '<button class="btn ghost" id="fiConsent">'+ico('firma')+' Consentimiento</button>')+
    (DB.fichas[f.id] && !soloActo ? '<button class="btn danger" id="fiBorrar">'+ico('borrar')+'</button>' : '')+
  '</div>';

  $('#fiVolver').onclick = () => { irA('fichas'); vistaFichas(); };
  $$('#vFicha [data-solapa]').forEach(t => t.onclick = () => {
    guardarSolapaActual(); solapaFicha = t.dataset.solapa; pintarFicha();
  });
  $('#fiGuardar').onclick = () => { guardarSolapaActual(); guardarFicha(); };
  $('#fiWord').onclick = () => { guardarSolapaActual(); exportarFichaWord(fichaActual); };
  $('#fiPdf').onclick  = () => { guardarSolapaActual(); imprimirFicha(fichaActual); };
  if($('#fiConsent')) $('#fiConsent').onclick = () => { guardarSolapaActual(); abrirConsentimiento(fichaActual); };
  if($('#fiBorrar')) $('#fiBorrar').onclick = () => confirmar('Eliminar ficha',
    'Se elimina de forma permanente en todos los dispositivos. Esta acción no se puede deshacer.',
    () => { eliminar('fichas', f.id); auditar('ficha-borrar', f.id);
            toast('Ficha eliminada.', 'ok'); irA('fichas'); vistaFichas(); }, 'Eliminar', true);

  const cuerpo = $('#fiCuerpo');
  if(solapaFicha === 'tomar')     { cuerpo.innerHTML = htmlTomarActo(f);   cablearTomarActo(f); return; }
  if(solapaFicha === 'qx')        { cuerpo.innerHTML = htmlQuirurgico(f);  cablearQuirurgico(f); }
  else if(solapaFicha === 'val')  { cuerpo.innerHTML = htmlValoracion(f);  cablearValoracion(f); }
  else if(solapaFicha === 'plan') { cuerpo.innerHTML = htmlPlan(f);        cablearGenerico(); }
  else if(solapaFicha === 'acto') { cuerpo.innerHTML = htmlActo(f);        cablearActo(f); }
  else                            { cuerpo.innerHTML = htmlHonorarios(f);  cablearHonorarios(f); }

  /* Un colega puede tocar el acto siempre, y los honorarios del acto sólo si
     el acto está a su nombre. El resto queda en lectura. */
  const editable = !soloActo
    || solapaFicha === 'acto'
    || (solapaFicha === 'hon' && esActorFicha(guardada));
  if(!editable) bloquearCuerpo();
}

/* Deja la solapa en modo lectura: se ve todo, no se cambia nada */
function bloquearCuerpo(){
  $$('#fiCuerpo input, #fiCuerpo select, #fiCuerpo textarea').forEach(e => { e.disabled = true; });
  $$('#fiCuerpo button').forEach(e => { e.disabled = true; e.style.opacity = '.5'; });
  $$('#fiCuerpo .buscador').forEach(e => { e.style.opacity = '.55'; });
  $$('#fiCuerpo .chk, #fiCuerpo .seg').forEach(e => { e.style.pointerEvents = 'none'; });
}

function bannerFichaAjena(f){
  const a = autorFicha(f);
  const mio = esActorFicha(f);
  return '<div class="aviso '+(mio?'ok':'info')+' no-print">'+ico(mio?'jeringa':'candado')+
    '<div><b>Valoración prequirúrgica de '+esc(a)+'.</b><br>'+
    (mio
      ? 'El acto anestésico está a tu nombre: podés completarlo y cargar <b>tus honorarios del acto</b>. '
      : 'Podés leerla completa y registrar el acto anestésico si sos vos quien opera. ')+
    'La valoración, el plan y la consulta prequirúrgica son de '+esc(a)+' y quedan bloqueados.'+
    (f.actoPorUid && f.actoPorUid !== f.ownerUid
      ? '<br>Acto registrado por <b>'+esc(nombreUsuario(f.actoPorUid))+'</b>.' : '')+
    (mio ? '' : '<br>Si sos vos quien opera, tomá la ficha desde la solapa '+
      '<b>«Tomo ficha anestésica para acto operatorio»</b>.')+
    '</div></div>';
}

/* ================= TOMO FICHA ANESTESICA PARA ACTO OPERATORIO =============
   Primera solapa cuando la ficha la abrio un anestesiologo distinto del que
   hizo la valoracion. Muestra por defecto quien hizo el prequirurgico y deja
   registrado quien se hace cargo del acto. */
function htmlTomarActo(f){
  const p    = DB.pacientes[f.pacienteId] || {};
  const mio  = esActorFicha(f);
  const prev = f.asignadoUid === 'sinasignar' || (!f.asignadoUid && !f.actorExterno)
    ? '' : nombreActor(f);

  return ''+
  '<div class="card"><h3>'+ico('firma')+'Tomo ficha anestésica para acto operatorio</h3>'+

    '<div class="campo"><label>Valoración prequirúrgica realizada por</label>'+
      '<input type="text" value="'+esc(autorFicha(f))+'" readonly>'+
      '<div class="ayuda">Es el anestesiólogo que hizo los datos filiatorios, la valoración '+
      'y el plan. La consulta prequirúrgica se factura a su nombre.</div></div>'+

    '<div class="campo"><label>Anestesiólogo previsto para el acto</label>'+
      '<input type="text" value="'+esc(prev || 'Todavía no se sabe quién opera')+'" readonly>'+
      '</div>'+

    (p.apellido ? '<div class="campo"><label>Paciente</label>'+
      '<input type="text" value="'+esc(p.apellido+', '+p.nombre)+'" readonly></div>' : '')+

    (f.cirugia ? '<div class="campo"><label>Cirugía</label>'+
      '<input type="text" value="'+esc(f.cirugia+(f.cirugiaComp ? ' — complejidad '+f.cirugiaComp : ''))+'" readonly>'+
      '</div>' : '')+

    (mio
      ? '<div class="aviso ok">'+ico('check')+'<div><b>El acto operatorio ya está a tu nombre.</b><br>'+
        'Completá la solapa <b>Acto quirúrgico</b> y cargá tus honorarios del acto.</div></div>'
      : '<div class="aviso info">'+ico('info')+'<div>Al tomar la ficha quedás registrado como el '+
        'anestesiólogo que realiza el acto operatorio. El honorario del acto pasa a tu nombre; '+
        'la consulta prequirúrgica sigue siendo de <b>'+esc(autorFicha(f))+'</b>.</div></div>'+
        '<button class="btn pri grande" id="fiTomar2">'+ico('firma')+
        ' Tomo esta ficha para el acto operatorio</button>')+
  '</div>';
}

function cablearTomarActo(f){
  if(!$('#fiTomar2')) return;
  $('#fiTomar2').onclick = () => confirmar('Tomar el acto operatorio',
    'Vas a quedar registrado como el anestesiólogo que realiza este acto. '+
    'El honorario del acto pasa a tu nombre; la consulta prequirúrgica sigue siendo de '+
    esc(autorFicha(f))+'.',
    () => {
      const base = JSON.parse(JSON.stringify(DB.fichas[f.id]));
      base.asignadoUid = SESION.uid;
      base.actorExterno = '';
      base.modificado = new Date().toISOString();
      escribir('fichas', base.id, base);
      auditar('ficha-tomar-acto', 'Acto de la ficha de ' + autorFicha(base));
      fichaActual = base;
      solapaFicha = 'acto';
      pintarFicha();
      toast('El acto quedó a tu nombre.', 'ok');
    }, 'Tomar el acto');
}

function guardarSolapaActual(){
  const f = fichaActual;
  const guardada = DB.fichas[f.id];
  if(guardada && !puedeEditarFicha(guardada)){
    if(solapaFicha === 'acto') f.acto = leerActo();
    if(solapaFicha === 'hon' && esActorFicha(guardada)) f.hon = leerHonorarios();
    return;                                   /* lo demás no se toca */
  }
  if(solapaFicha === 'qx')        Object.assign(f, leerQuirurgico());
  else if(solapaFicha === 'val')  f.v = leerValoracion();
  else if(solapaFicha === 'plan') f.plan = leerPlan();
  else if(solapaFicha === 'acto') f.acto = leerActo();
  else{ f.hon = leerHonorarios(); f.honConsulta = leerHonorariosConsulta(); }
}

function guardarFicha(){
  const f = fichaActual;
  const guardada = DB.fichas[f.id];

  /* Ficha de un colega: se escribe únicamente el acto anestésico, sobre la
     versión vigente en la base, para no pisar nada de lo que él cargó. */
  if(guardada && !puedeEditarFicha(guardada)){
    const base = JSON.parse(JSON.stringify(guardada));
    base.acto = f.acto || {};
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
    toast('Acto anestésico guardado' + (nubeOK ? ' y sincronizado.' : '.'), 'ok');
    pintarFicha();
    return;
  }

  if(!f.pacienteId) return toast('Seleccioná un paciente en la solapa Quirúrgico.', 'err');
  f.modificado = new Date().toISOString();
  f.modificadoPor = SESION.uid;
  f.modificadoPorNombre = USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '';
  escribir('fichas', f.id, f);
  auditar('ficha-guardar', (DB.pacientes[f.pacienteId]||{}).apellido + ' — ' + (f.cirugia||''));
  toast('Ficha guardada' + (nubeOK ? ' y sincronizada.' : ' en este dispositivo.'), 'ok');
  pintarFicha();
}

/* ---------------------------------------------------- Solapa QUIRURGICO */
function htmlQuirurgico(f){
  const pacs = misPacientes().sort((a,b) => (a.apellido||'').localeCompare(b.apellido||'', 'es'));
  const p = DB.pacientes[f.pacienteId];
  return ''+
  '<div class="card"><h3>'+ico('paciente')+'Paciente</h3>'+
    '<div class="campo"><label>Paciente <span class="req">*</span></label>'+
      '<select id="qxPaciente"><option value="">— Seleccionar paciente —</option>'+
      pacs.map(x => '<option value="'+x.id+'"'+(f.pacienteId===x.id?' selected':'')+'>'+
        esc(x.apellido+', '+x.nombre)+' — DNI '+esc(x.dni||'')+'</option>').join('')+
      '</select></div>'+
    '<button class="btn ghost chico" id="qxNuevoPac">'+ico('mas')+' Crear paciente nuevo</button>'+
    (p ? '<div class="aviso info mt14">'+ico('info')+'<div><b>'+esc(p.apellido+', '+p.nombre)+'</b> · DNI '+
      esc(p.dni||'—')+' · '+(edadDe(p.fechaNac, f.fecha)||'—')+' años · '+esc(p.obraSocial||'sin cobertura')+'</div></div>' : '')+
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
      '<div class="campo"><label>Hora de inicio</label><input type="time" id="qxHora" value="'+esc(f.hora||'')+'"></div>'+
      campoSel('qxTurno','Turno', ['Mañana','Tarde','Noche','Fin de semana / feriado'], f.turno)+
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
    '<div class="campo"><label>Cirugía a realizar <span class="req">*</span></label>'+
      '<div class="buscador"><input type="search" id="cxBuscar" placeholder="Buscar procedimiento… ej.: colecistectomía, cesárea, cadera" autocomplete="off">'+
      '<div class="res" id="cxRes"></div></div>'+
      '<div class="ayuda">Si el procedimiento no está en el catálogo, lo agregás desde el mismo buscador.</div>'+
      '<div id="cxSel" class="mt8"></div></div>'+
    '<div class="campo"><label>Diagnóstico quirúrgico (CIE-10)</label>'+
      '<div class="buscador"><input type="search" id="dqBuscar" placeholder="Buscar diagnóstico o código…" autocomplete="off">'+
      '<div class="res" id="dqRes"></div></div>'+
      '<div id="dqSel" class="mt8"></div></div>'+
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

function cablearQuirurgico(f){
  $('#qxPaciente').onchange = e => { fichaActual.pacienteId = e.target.value;
    const p = DB.pacientes[e.target.value];
    if(p && p.obraSocial && !$('#qxOS').value) $('#qxOS').value = p.obraSocial;
    guardarSolapaActual(); pintarFicha(); };
  $('#qxNuevoPac').onclick = () => editarPaciente(null);
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
        cerrarModal(); guardarSolapaActual(); fichaActual.institucion = ya.id; pintarFicha();
        return toast('Esa institución ya estaba en la lista.', 'warn');
      }
      const id = uid('ins');
      escribir('instituciones', id, { id, nombre:n, ciudad:$('#niCiudad').value, tipo:$('#niTipo').value });
      cerrarModal(); guardarSolapaActual(); fichaActual.institucion = id; pintarFicha();
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
        cerrarModal(); guardarSolapaActual(); fichaActual.obraSocial = sugerido; pintarFicha();
        toast('Se usó el financiador que ya existía.', 'ok');
      };
    };
    $('#noNombre').oninput = debounce(revisar, 250);
    $('#noGuardar').onclick = () => {
      const n = $('#noNombre').value.trim();
      if(!n) return toast('Ingresá el nombre.', 'err');
      const ya = obrasSociales().find(o => clavePrestador(o) === clavePrestador(n));
      if(ya){
        cerrarModal(); guardarSolapaActual(); fichaActual.obraSocial = ya; pintarFicha();
        return toast('Ese financiador ya estaba en la lista.', 'warn');
      }
      const id = uid('os');
      escribir('obrasSociales', id, { id, nombre:n });
      auditar('prestador-alta', 'Financiador «'+n+'» desde una ficha');
      cerrarModal(); guardarSolapaActual(); fichaActual.obraSocial = n; pintarFicha();
      toast('Financiador agregado.', 'ok');
    };
  };

  /* buscador de cirugías — nomenclador AFAAR 2021 + catálogo propio */
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
            'por unidades anestésicas, cargá las UA en la solapa Honorarios.</div>' : '')
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
        '<div class="ayuda">Sólo para prácticas que no figuran en el nomenclador AFAAR. '+
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

  /* buscador de diagnóstico quirúrgico */
  const pintarDq = () => {
    $('#dqSel').innerHTML = dxQxSeleccionado
      ? '<span class="pill"><b>'+esc(dxQxSeleccionado.c)+'</b><span>'+esc(dxQxSeleccionado.d)+'</span>'+
        '<button id="dqQuitar">&times;</button></span>'
      : '<span class="mini">Sin diagnóstico seleccionado.</span>';
    if($('#dqQuitar')) $('#dqQuitar').onclick = () => { dxQxSeleccionado = null; pintarDq(); };
  };
  montarBuscador({
    input:$('#dqBuscar'), caja:$('#dqRes'), manual:true,
    fuente: () => todosCIE().map(x => ({ cod:x.c, etiqueta:x.d, sub:x.cap,
      busca: norm(x.c+' '+x.d+' '+x.cap), dato:x })),
    onElegir: x => { dxQxSeleccionado = { c:x.dato.c, d:x.dato.d }; pintarDq(); },
    onManual: txt => { if(!txt) return; agregarExtra('cie', { c:'', d:txt });
      dxQxSeleccionado = { c:'—', d:txt }; pintarDq(); }
  });
  pintarDq();
}

function leerQuirurgico(){
  const b = $('#qxCaracter button.on');
  return {
    pacienteId: val('qxPaciente'), caracter: b ? b.dataset.v : 'programada',
    fecha: val('qxFecha'), hora: val('qxHora'), turno: val('qxTurno'),
    institucion: val('qxInst'), obraSocial: val('qxOS'), nroAfiliado: val('qxAfiliado'),
    especialidad: val('qxEsp'),
    cirugia: cxSeleccionada ? cxSeleccionada.n : '',
    cirugiaUA: cxSeleccionada ? cxSeleccionada.ua : 0,
    cirugiaCod: cxSeleccionada ? (cxSeleccionada.cod || '') : '',
    cirugiaComp: cxSeleccionada ? (cxSeleccionada.comp || '') : '',
    cirugiaGrillaB: cxSeleccionada ? !!cxSeleccionada.grillaB : false,
    cirugiaNota: cxSeleccionada ? (cxSeleccionada.nota || '') : '',
    dxQuirurgico: dxQxSeleccionado,
    lateralidad: val('qxLateralidad'),
    cirujano: val('qxCirujano'), ayudante: val('qxAyudante'),
    instrumentador: val('qxInstrumentador'), anestesista2: val('qxAnestesista2'),
    asignadoUid: val('qxAsignado') || undefined,
    actorExterno: val('qxAsignado') === 'externo' ? val('qxActorExterno') : ''
  };
}

/* --------------------------------------------------------- Solapa PLAN */
function htmlPlan(f){
  const pl = f.plan || {};
  return ''+
  '<div class="card"><h3>'+ico('jeringa')+'Plan anestésico propuesto</h3>'+
    '<label class="mini strong">Técnica</label>'+
    chksHTML('plTecnica', TECNICAS_ANESTESICAS, pl.tecnica)+
    '<label class="mini strong mt14" style="display:block">Manejo de la vía aérea</label>'+
    chksHTML('plVA', DISPOSITIVOS_VA, pl.dispositivosVA)+
  '</div>'+

  '<div class="card"><h3>'+ico('monitor')+'Monitoreo previsto</h3>'+
    '<label class="mini strong">Estándar ASA</label>'+
    chksHTML('plMonEst', MONITOREO_ESTANDAR, pl.monitoreoEstandar || MONITOREO_ESTANDAR.slice(0,5))+
    '<label class="mini strong mt14" style="display:block">Avanzado</label>'+
    chksHTML('plMonAv', MONITOREO_AVANZADO, pl.monitoreoAvanzado)+
    campoTxt('plAccesos','Accesos vasculares previstos', pl.accesos)+
  '</div>'+

  '<div class="card"><h3>'+ico('escudo')+'Profilaxis</h3>'+
    '<div class="campo"><label>Profilaxis antibiótica</label><select id="plATB">'+
      '<option value="">— No indicada —</option>'+
      PROFILAXIS_ATB.map(a => '<option value="'+esc(a.c)+'"'+(pl.atb===a.c?' selected':'')+'>'+
        esc(a.c)+' — '+esc(a.d)+'</option>').join('')+
      '<option value="Otro"'+(pl.atb==='Otro'?' selected':'')+'>Otro (detallar)</option>'+
    '</select><div class="ayuda">Administrar dentro de los 60 minutos previos a la incisión (120 min para vancomicina).</div></div>'+
    campoTxt('plATBOtro','Detalle del antibiótico', pl.atbOtro)+
    campoSel('plTEV','Tromboprofilaxis',
      ['Deambulación precoz','Compresión neumática intermitente','Enoxaparina 40 mg/día',
       'Enoxaparina 30 mg c/12 h','HNF 5000 U c/8-12 h','Anticoagulante oral directo',
       'Mecánica + farmacológica','No indicada'], pl.tev)+
    chksHTML('plNVPO', ['Ondansetrón 4 mg','Dexametasona 4-8 mg','Droperidol 0,625-1,25 mg',
      'Metoclopramida 10 mg','Dimenhidrinato','TIVA con propofol','Aprepitant'], pl.nvpo)+
  '</div>'+

  '<div class="card"><h3>'+ico('gota')+'Analgesia postoperatoria multimodal</h3>'+
    chksHTML('plAnalgesia', ANALGESIA_POP, pl.analgesia)+
    campoArea('plAnalgesiaDet','Esquema detallado', pl.analgesiaDetalle,
      'Fármaco, dosis, vía, intervalo y duración prevista')+
  '</div>'+

  '<div class="card"><h3>'+ico('hospital')+'Previsiones y destino</h3>'+
    '<div class="grid c2">'+
      campoSel('plDestino','Destino postoperatorio', [''].concat(DESTINOS_POP), pl.destino)+
      campoSel('plTransfusion','Previsión transfusional',
        ['No prevista','Grupo y factor solicitados','Reserva de 2 unidades','Reserva de 4 unidades',
         'Protocolo de transfusión masiva','Paciente que rechaza transfusión'], pl.transfusion)+
    '</div>'+
    campoArea('plIndicaciones','Indicaciones preoperatorias al paciente', pl.indicaciones,
      'Ayuno, medicación a suspender y a continuar, higiene, acompañante, horario de presentación')+
    campoArea('plObs','Observaciones del plan', pl.observaciones)+
  '</div>';
}
function cablearGenerico(){
  $$('#vFicha .chk').forEach(l => {
    l.onclick = () => setTimeout(() => l.classList.toggle('sel', l.querySelector('input').checked), 0);
  });
}
function leerPlan(){
  return {
    tecnica: leerChks('plTecnica'), dispositivosVA: leerChks('plVA'),
    monitoreoEstandar: leerChks('plMonEst'), monitoreoAvanzado: leerChks('plMonAv'),
    accesos: val('plAccesos'), atb: val('plATB'), atbOtro: val('plATBOtro'),
    tev: val('plTEV'), nvpo: leerChks('plNVPO'),
    analgesia: leerChks('plAnalgesia'), analgesiaDetalle: val('plAnalgesiaDet'),
    destino: val('plDestino'), transfusion: val('plTransfusion'),
    indicaciones: val('plIndicaciones'), observaciones: val('plObs')
  };
}

/* --------------------------------------------------------- Solapa ACTO */
function htmlActo(f){
  const a = f.acto || {};
  return ''+
  '<div class="aviso info">'+ico('monitor')+'<div><b>Registro del acto anestésico.</b> '+
    'Se completa durante o inmediatamente después del procedimiento.</div></div>'+

  '<div class="card"><h3>'+ico('reloj')+'Tiempos</h3>'+
    '<div class="grid c4">'+
      '<div class="campo"><label>Ingreso a quirófano</label><input type="time" id="acIngreso" value="'+esc(a.ingreso||'')+'"></div>'+
      '<div class="campo"><label>Inicio anestesia</label><input type="time" id="acIniAnest" value="'+esc(a.inicioAnestesia||'')+'"></div>'+
      '<div class="campo"><label>Fin anestesia</label><input type="time" id="acFinAnest" value="'+esc(a.finAnestesia||'')+'"></div>'+
      '<div class="campo"><label>Salida a recuperación</label><input type="time" id="acSalida" value="'+esc(a.salida||'')+'"></div>'+
    '</div>'+
    '<div id="acDuracion"></div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('jeringa')+'Técnica efectivamente realizada</h3>'+
    chksHTML('acTecnica', TECNICAS_ANESTESICAS, a.tecnica)+
    '<label class="mini strong mt14" style="display:block">Dispositivo de vía aérea utilizado</label>'+
    chksHTML('acVA', DISPOSITIVOS_VA, a.dispositivosVA)+
    '<div class="grid c3 mt14">'+
      campoSel('acCormack','Cormack-Lehane obtenido', ['','I','II a','II b','III','IV'], a.cormack)+
      campoNum('acIntentos','Intentos de intubación', a.intentos)+
      campoTxt('acTubo','Tubo / dispositivo (n.º)', a.tubo)+
    '</div>'+
    campoArea('acFarmacos','Fármacos administrados', a.farmacos,
      'Inducción, mantenimiento, relajantes, opioides, reversión, vasoactivos: dosis totales')+
  '</div>'+

  '<div class="card"><h3>'+ico('gota')+'Balance y soporte</h3>'+
    '<div class="grid c4">'+
      campoNum('acCristaloides','Cristaloides (ml)', a.cristaloides)+
      campoNum('acColoides','Coloides (ml)', a.coloides)+
      campoNum('acSangrado','Sangrado estimado (ml)', a.sangrado)+
      campoNum('acDiuresis','Diuresis (ml)', a.diuresis)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('acHemoderivados','Hemoderivados transfundidos', a.hemoderivados)+
      campoTxt('acVasoactivos','Drogas vasoactivas', a.vasoactivos)+
    '</div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('check')+'Lista de verificación quirúrgica (OMS)</h3>'+
    '<div class="chks" id="acOMS">'+
      [['entrada','Entrada — antes de la inducción'],
       ['pausa','Pausa quirúrgica — antes de la incisión'],
       ['salida','Salida — antes de que el paciente deje el quirófano']].map(o =>
      '<label class="chk'+((a.oms||[]).indexOf(o[0])>=0?' sel':'')+'"><input type="checkbox" value="'+o[0]+'"'+
      ((a.oms||[]).indexOf(o[0])>=0?' checked':'')+'>'+o[1]+'</label>').join('')+
    '</div></div>'+

  '<div class="card"><h3>'+ico('alerta')+'Eventos intraoperatorios</h3>'+
    chksHTML('acEventos', EVENTOS_ADVERSOS, a.eventos)+
    campoArea('acEventosDet','Descripción y manejo de los eventos', a.eventosDetalle)+
  '</div>'+

  '<div class="card"><h3>'+ico('monitor')+'Egreso — Aldrete modificado</h3>'+
    ALDRETE.map(item => '<div class="campo"><label>'+esc(item.t)+'</label><select id="ald_'+item.k+'">'+
      item.o.map(o => '<option value="'+o[0]+'"'+(String((a.aldrete||{})[item.k])===String(o[0])?' selected':'')+'>'+
        o[0]+' — '+esc(o[1])+'</option>').join('')+
    '</select></div>').join('')+
    '<div id="aldOut"></div>'+
    '<div class="grid c2">'+
      campoSel('acDestinoReal','Destino real', [''].concat(DESTINOS_POP), a.destinoReal)+
      campoSel('acEstadoEgreso','Estado al egreso',
        ['Estable, sin complicaciones','Estable con analgesia en curso','Requiere vigilancia estrecha',
         'Complicación resuelta','Traslado a UTI','Óbito intraoperatorio'], a.estadoEgreso)+
    '</div>'+
    campoArea('acObs','Observaciones del acto anestésico', a.observaciones)+
  '</div>';
}
function cablearActo(f){
  cablearGenerico();
  const recalc = () => {
    const i = val('acIniAnest'), fin = val('acFinAnest');
    if(i && fin){
      const [h1,m1] = i.split(':').map(Number), [h2,m2] = fin.split(':').map(Number);
      let min = (h2*60+m2) - (h1*60+m1); if(min < 0) min += 1440;
      $('#acDuracion').innerHTML = '<div class="aviso info">'+ico('reloj')+
        '<div><b>Duración anestésica: '+Math.floor(min/60)+' h '+(min%60)+' min</b> ('+min+' minutos)'+
        (min > 120 ? ' — corresponde adicional por prolongación en el nomenclador.' : '')+'</div></div>';
    } else $('#acDuracion').innerHTML = '';
    const total = ALDRETE.reduce((acc,it) => acc + Number(val('ald_'+it.k) || 0), 0);
    const ok = total >= 9;
    $('#aldOut').innerHTML = '<div class="aviso '+(ok?'ok':'warn')+'">'+ico(ok?'check':'alerta')+
      '<div><b>Aldrete '+total+'/10</b> — '+(ok
        ? 'Cumple criterios de alta de la recuperación postanestésica.'
        : 'No alcanza el puntaje de alta (≥ 9). Continuar la vigilancia en la URPA.')+'</div></div>';
  };
  $('#fiCuerpo').addEventListener('change', recalc);
  $('#fiCuerpo').addEventListener('input', debounce(recalc, 250));
  recalc();
}
function leerActo(){
  const aldrete = {}; ALDRETE.forEach(i => aldrete[i.k] = Number(val('ald_'+i.k) || 0));
  return {
    ingreso:val('acIngreso'), inicioAnestesia:val('acIniAnest'), finAnestesia:val('acFinAnest'),
    salida:val('acSalida'), tecnica:leerChks('acTecnica'), dispositivosVA:leerChks('acVA'),
    cormack:val('acCormack'), intentos:val('acIntentos'), tubo:val('acTubo'), farmacos:val('acFarmacos'),
    cristaloides:val('acCristaloides'), coloides:val('acColoides'), sangrado:val('acSangrado'),
    diuresis:val('acDiuresis'), hemoderivados:val('acHemoderivados'), vasoactivos:val('acVasoactivos'),
    oms:leerChks('acOMS'), eventos:leerChks('acEventos'), eventosDetalle:val('acEventosDet'),
    aldrete, aldreteTotal: Object.values(aldrete).reduce((a,b)=>a+b,0),
    destinoReal:val('acDestinoReal'), estadoEgreso:val('acEstadoEgreso'), observaciones:val('acObs')
  };
}

/* ---------------------------------------------------- Solapa HONORARIOS */
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
function cablearHonorarios(f){
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
  $('#fiCuerpo').addEventListener('change', recalc);
  $('#fiCuerpo').addEventListener('input', debounce(recalc, 220));
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
