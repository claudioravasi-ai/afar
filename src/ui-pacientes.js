/* =========================================================================
   PACIENTES - alta, edicion, busqueda y ficha del paciente
   ========================================================================= */

let filtroPac = '';

function vistaPacientes(){
  const cont = $('#vPacientes');
  const todos = misPacientes().sort((a,b) =>
    (a.apellido+a.nombre).localeCompare(b.apellido+b.nombre, 'es'));
  const q = norm(filtroPac).trim();
  /* cada palabra tipeada debe aparecer en algún dato del paciente, así
     "perez maria" y "maria perez" encuentran lo mismo, y el DNI se puede
     buscar entero o por sus últimos dígitos */
  const palabras = q ? q.split(/\s+/) : [];
  const l = palabras.length
    ? todos.filter(p => {
        const campos = norm([p.apellido, p.nombre, p.dni, p.obraSocial,
                             p.nroAfiliado, p.localidad].join(' '));
        return palabras.every(w => campos.indexOf(w) >= 0);
      })
    : todos;

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Pacientes</h1>'+
    '<p>'+todos.length+' paciente'+(todos.length===1?'':'s')+' en el padrón de la asociación'+
    (q ? ' · '+l.length+' coinciden con la búsqueda' : '')+'.</p></div>'+
    '<div class="acciones"><button class="btn pri" id="btnNuevoPac">'+ico('mas')+' Nuevo paciente</button></div></div>'+

  '<div class="campo"><div style="position:relative">'+
    '<input type="search" id="pacBuscar" placeholder="Buscar por apellido, nombre o DNI…" value="'+esc(filtroPac)+'" style="padding-left:38px" autocomplete="off">'+
    '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--texto-3)">'+ico('buscar')+'</span>'+
  '</div></div>'+

  (todos.length ? '<div class="aviso info">'+ico('pacientes')+'<div>'+
    'El padrón es común a toda la asociación: antes de cargar un paciente, buscalo por DNI '+
    'para no duplicarlo.</div></div>' : '')+

  (l.length ? '<div class="lista">'+ l.map(p => {
      const fichas = fichasVisibles().filter(f => f.pacienteId === p.id);
      const mias = fichas.filter(esAutorFicha).length;
      const ed = edadDe(p.fechaNac);
      return '<div class="item" data-pac="'+p.id+'">'+
        '<div class="avatar">'+esc(iniciales(p.nombre,p.apellido))+'</div>'+
        '<div class="txt"><b>'+esc(p.apellido)+', '+esc(p.nombre)+'</b>'+
          '<span>DNI '+esc(p.dni||'—')+(ed!==null?' · '+ed+' años':'')+' · '+esc(p.obraSocial||'Sin cobertura')+'</span></div>'+
        '<div class="der"><span class="tag'+(fichas.length?' aqua':'')+'">'+fichas.length+' ficha'+(fichas.length===1?'':'s')+'</span>'+
          (fichas.length && mias < fichas.length
            ? '<div class="mini mt8">'+(mias||'ninguna')+' tuya'+(mias===1?'':'s')+'</div>' : '')+
        '</div></div>';
    }).join('') +'</div>'
    : '<div class="vacio">'+ico('pacientes')+'<b>'+(q?'Sin resultados':'Todavía no cargaste pacientes')+'</b>'+
      '<span>'+(q?'Probá con otro apellido o DNI.':'Tocá «Nuevo paciente» para empezar.')+'</span></div>');

  $('#btnNuevoPac').onclick = () => editarPaciente(null);
  $('#pacBuscar').oninput = debounce(e => { filtroPac = e.target.value; vistaPacientes();
    const i = $('#pacBuscar'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }, 260);
  $$('#vPacientes .item').forEach(it => {
    it.onclick = () => abrirPaciente(it.dataset.pac);
  });
}

/* ------------------------------------------------------- Alta / edicion */
function editarPaciente(id){
  const p = id ? DB.pacientes[id] : {};
  const os = obrasSociales();
  abrirModal(id ? 'Editar paciente' : 'Nuevo paciente',
    '<div class="grid c2">'+
      campoTxt('paApellido','Apellido *', p.apellido)+
      campoTxt('paNombre','Nombre *', p.nombre)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('paDni','DNI *', p.dni)+
      campoFecha('paNac','Fecha de nacimiento', p.fechaNac)+
    '</div>'+
    '<div id="paAvisoDni"></div>'+
    '<div class="grid c3">'+
      campoSel('paSexo','Sexo', [{v:'F',t:'Femenino'},{v:'M',t:'Masculino'},{v:'X',t:'X / No binario'}], p.sexo)+
      campoNum('paPeso','Peso (kg)', p.peso, 'inputmode="decimal"')+
      campoNum('paTalla','Talla (cm)', p.talla, 'inputmode="decimal"')+
    '</div>'+
    '<div id="paIMC"></div>'+
    '<div class="grid c2">'+
      '<div class="campo"><label>Obra social / financiador</label><select id="paOS">'+
        '<option value="">— Seleccionar —</option>'+
        os.map(o => '<option'+(p.obraSocial===o?' selected':'')+'>'+esc(o)+'</option>').join('')+
      '</select></div>'+
      campoTxt('paAfiliado','N.º de afiliado', p.nroAfiliado)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('paTel','Teléfono', p.telefono)+
      campoSel('paGrupo','Grupo y factor',
        ['','0+','0-','A+','A-','B+','B-','AB+','AB-'], p.grupoSanguineo)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('paDom','Domicilio', p.domicilio)+
      campoSel('paLocalidad','Localidad',
        ['','Ushuaia','Río Grande','Tolhuin','Otra localidad de TDF','Fuera de la provincia'], p.localidad)+
    '</div>'+
    campoTxt('paEmergencia','Contacto de emergencia (nombre y teléfono)', p.contactoEmergencia)+
    campoArea('paObs','Observaciones generales', p.observaciones,
      'Datos relevantes que quieras tener a mano cada vez que abras este paciente'),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="paGuardar">'+ico('check')+' Guardar</button>');

  const recalc = () => {
    const imc = calcIMC($('#paPeso').value, $('#paTalla').value);
    $('#paIMC').innerHTML = imc ?
      '<div class="aviso info" style="margin-bottom:13px">'+ico('info')+
      '<div><b>IMC '+imc.toFixed(1)+' kg/m²</b> — '+clasificaIMC(imc)+
      ' · Superficie corporal '+superficieCorporal($('#paPeso').value,$('#paTalla').value).toFixed(2)+' m²</div></div>' : '';
  };
  $('#paPeso').oninput = recalc; $('#paTalla').oninput = recalc; recalc();

  const revisarDni = () => {
    const d = $('#paDni').value.trim();
    const ya = d ? lista('pacientes').find(x => x.id !== id && norm(x.dni) === norm(d)) : null;
    $('#paAvisoDni').innerHTML = ya
      ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Ya hay un paciente con ese DNI:</b> '+
        esc(ya.apellido+', '+ya.nombre)+'.<br><button class="btn warn chico mt8" id="paIrExistente">'+
        'Abrir el que ya existe</button></div></div>'
      : '';
    if($('#paIrExistente')) $('#paIrExistente').onclick = () => {
      cerrarModal(); setTimeout(() => abrirPaciente(ya.id), 180);
    };
  };
  $('#paDni').oninput = debounce(revisarDni, 250);
  revisarDni();

  $('#paGuardar').onclick = () => {
    const g = i => $('#'+i).value.trim();
    if(!g('paApellido') || !g('paNombre')) return toast('Apellido y nombre son obligatorios.', 'err');
    if(!g('paDni')) return toast('El DNI es obligatorio.', 'err');
    const dup = lista('pacientes').find(x => x.id !== id && norm(x.dni) === norm(g('paDni')));
    if(dup && !id) return toast('Ya existe un paciente con ese DNI: '+dup.apellido+', '+dup.nombre, 'err');
    const nid = id || uid('pac');
    escribir('pacientes', nid, Object.assign({}, p, {
      id:nid, ownerUid: p.ownerUid || SESION.uid,
      apellido:g('paApellido'), nombre:g('paNombre'), dni:g('paDni'), fechaNac:g('paNac'),
      sexo:$('#paSexo').value, peso:g('paPeso'), talla:g('paTalla'),
      obraSocial:$('#paOS').value, nroAfiliado:g('paAfiliado'), telefono:g('paTel'),
      grupoSanguineo:$('#paGrupo').value, domicilio:g('paDom'), localidad:$('#paLocalidad').value,
      contactoEmergencia:g('paEmergencia'), observaciones:g('paObs'),
      creado: p.creado || new Date().toISOString(),
      modificado: new Date().toISOString(), modificadoPor: SESION.uid
    }));
    auditar(id?'paciente-editar':'paciente-alta', g('paApellido')+', '+g('paNombre'));
    cerrarModal();
    toast(id ? 'Paciente actualizado.' : 'Paciente creado.', 'ok');
    vistaPacientes();
    if(!id) setTimeout(() => abrirPaciente(nid), 200);
  };
}

/* -------------------------------------------------- Detalle de paciente */
function abrirPaciente(id){
  const p = DB.pacientes[id]; if(!p) return;
  const fichas = fichasVisibles().filter(f => f.pacienteId === id)
    .sort((a,b) => (b.fecha||'') < (a.fecha||'') ? -1 : 1);
  const ed = edadDe(p.fechaNac);
  const imc = calcIMC(p.peso, p.talla);

  const cuerpo = ''+
  '<div style="display:flex;gap:13px;align-items:center;margin-bottom:15px">'+
    '<div class="avatar" style="width:54px;height:54px;border-radius:15px;font-size:19px;display:grid;place-items:center;background:var(--azul-100);color:var(--azul-700);font-weight:800">'+
      esc(iniciales(p.nombre,p.apellido))+'</div>'+
    '<div><div style="font-size:17px;font-weight:750">'+esc(p.apellido)+', '+esc(p.nombre)+'</div>'+
    '<div class="mini">DNI '+esc(p.dni||'—')+(ed!==null?' · '+ed+' años':'')+
      (p.sexo?' · '+({F:'Femenino',M:'Masculino',X:'X'}[p.sexo]||''):'')+'</div></div>'+
  '</div>'+
  '<div class="grid c3 mb8">'+
    kpiMini('Peso', p.peso ? p.peso+' kg' : '—')+
    kpiMini('Talla', p.talla ? p.talla+' cm' : '—')+
    kpiMini('IMC', imc ? imc.toFixed(1) : '—')+
  '</div>'+
  '<div class="card plano" style="margin-bottom:12px">'+
    fila('Obra social', (p.obraSocial||'Sin cobertura') + (p.nroAfiliado ? ' — N.º '+p.nroAfiliado : ''))+
    fila('Grupo y factor', p.grupoSanguineo || '—')+
    fila('Teléfono', p.telefono || '—')+
    fila('Domicilio', [p.domicilio, p.localidad].filter(Boolean).join(', ') || '—')+
    fila('Contacto de emergencia', p.contactoEmergencia || '—')+
    (p.observaciones ? fila('Observaciones', p.observaciones) : '')+
    fila('Cargado por', nombreUsuario(p.ownerUid) +
      (p.modificadoPor && p.modificadoPor !== p.ownerUid
        ? ' · última edición: ' + nombreUsuario(p.modificadoPor) : ''))+
  '</div>'+
  '<h3 style="font-size:14px;margin:16px 0 9px">Fichas anestésicas ('+fichas.length+')</h3>'+
  (fichas.length ? '<div class="lista">'+ fichas.map(f =>
      '<div class="item" data-ficha="'+f.id+'">'+
        '<div class="avatar" style="background:'+(f.caracter==='urgencia'?'var(--danger-bg);color:var(--danger)':'var(--aqua-200);color:var(--aqua-600)')+'">'+
          ico('ficha')+'</div>'+
        '<div class="txt"><b>'+esc(f.cirugia||'Sin cirugía cargada')+'</b>'+
          '<span>'+fFecha(f.fecha)+' · '+esc(nombreInstitucion(f.institucion).split('"')[0].trim())+
          ' · '+esc(autorFicha(f))+(esAutorFicha(f)?' (vos)':'')+'</span></div>'+
        '<div class="der">'+etiquetaEstadoFicha(f)+'</div>'+
      '</div>').join('') +'</div>'
    : '<p class="mini">Todavía no hay fichas para este paciente.</p>');

  abrirModal('Paciente', cuerpo,
    '<button class="btn ghost" id="pdEditar">'+ico('editar')+' Editar</button>'+
    '<button class="btn pri" id="pdNuevaFicha">'+ico('mas')+' Nueva ficha</button>');

  $('#pdEditar').onclick = () => { cerrarModal(); setTimeout(() => editarPaciente(id), 180); };
  $('#pdNuevaFicha').onclick = () => { cerrarModal(); setTimeout(() => abrirFicha(null, id), 180); };
  $$('#modal .item[data-ficha]').forEach(it => {
    it.onclick = () => { const fid = it.dataset.ficha; cerrarModal(); setTimeout(() => abrirFicha(fid), 180); };
  });
}

function kpiMini(l, v){
  return '<div class="kpi"><div class="lbl">'+esc(l)+'</div><div class="val" style="font-size:19px">'+esc(v)+'</div></div>';
}
function fila(l, v){
  return '<div class="doc-par" style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--borde);font-size:13px">'+
    '<b style="min-width:135px;color:var(--texto-2);font-weight:650">'+esc(l)+'</b>'+
    '<span style="flex:1">'+esc(v)+'</span></div>';
}
function etiquetaEstadoFicha(f){
  if(f.estado === 'cerrada') return '<span class="tag ok">Cerrada</span>';
  if(f.estado === 'realizada') return '<span class="tag info">Realizada</span>';
  return '<span class="tag warn">Borrador</span>';
}
