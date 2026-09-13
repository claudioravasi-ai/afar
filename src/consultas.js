/* =========================================================================
   PACIENTES VALORADOS POR MOTIVOS NO QUIRÚRGICOS
   -------------------------------------------------------------------------
   Pedido del 13-09-2026. Una interconsulta puede ser prequirúrgica —y
   entonces es una valoración preanestésica de siempre— o por otro motivo:
   dolor, valoración interdisciplinaria, sedación para un estudio… Esas NO
   son valoraciones preanestésicas y no van a la base de las fichas: viven en
   su propia colección, `consultas`, y se ven en Historial, en la segunda
   ventana. El paciente que se cargó sólo para eso no aparece en los listados
   del padrón; se lo encuentra buscándolo por apellido o DNI, y si algún día
   se opera se le abre la valoración como a cualquiera.
   ========================================================================= */
const MOTIVOS_CONSULTA = [
  ['prequirurgica', 'Prequirúrgica (valoración preanestésica)'],
  ['dolor-agudo', 'Dolor agudo'],
  ['dolor-cronico', 'Dolor crónico'],
  ['interdisciplinaria', 'Valoración interdisciplinaria'],
  ['sedacion', 'Sedación para estudio o procedimiento'],
  ['acceso', 'Acceso vascular o vía aérea'],
  ['parto', 'Evaluación para analgesia de parto'],
  ['critico', 'Paciente crítico / reanimación'],
  ['otro', 'Otro motivo']
];
function nombreMotivo(k){ return (MOTIVOS_CONSULTA.find(m => m[0] === k) || [k, k || 'Sin motivo'])[1]; }

function misConsultas(){
  if(!SESION) return [];
  return lista('consultas').filter(c => esCoordinador() || c.ownerUid === SESION.uid);
}
/* Un paciente es «sólo de consulta» mientras no tenga ninguna ficha */
function esSoloConsulta(p){
  return !!(p && p.soloConsulta) && !lista('fichas').some(f => f.pacienteId === p.id);
}

function abrirConsulta(id, pid, extra){
  const c = id ? Object.assign({}, DB.consultas[id]) : Object.assign({ motivo:'dolor-agudo', fecha:hoyISO() }, extra || {});
  const p = DB.pacientes[id ? c.pacienteId : pid] || {};
  const pacId = id ? c.pacienteId : pid;
  const mia = !id || esCoordinador() || c.ownerUid === (SESION && SESION.uid);
  abrirModal(id ? 'Consulta no quirúrgica' : 'Nueva consulta no quirúrgica',
    '<div class="aviso info">'+ico('paciente')+'<div><b>'+esc((p.apellido || '—')+', '+(p.nombre || ''))+'</b>'+
      (p.dni ? ' · DNI '+esc(p.dni) : '')+'<br><span class="mini">No es una valoración preanestésica: '+
      'queda en Historial → Valorados por motivos no quirúrgicos.</span></div></div>'+
    '<div class="grid c2">'+
      campoSel('csMotivo', 'Motivo de la interconsulta',
        MOTIVOS_CONSULTA.filter(m => m[0] !== 'prequirurgica').map(m => ({ v:m[0], t:m[1] })), c.motivo)+
      campoFecha('csFecha', 'Fecha', c.fecha)+'</div>'+
    campoTxt('csLugar', 'Servicio y cama', c.lugar)+
    campoArea('csEval', 'Evaluación', c.evaluacion, 'Motivo, hallazgos, escalas de dolor, antecedentes relevantes')+
    campoArea('csIndic', 'Indicaciones y conducta', c.indicaciones, 'Analgesia indicada, controles, seguimiento'),
    (id ? '<button class="btn ghost" id="csValorar">'+ico('valoracion')+' Pasar a valoración prequirúrgica</button>' : '')+
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    (mia ? '<button class="btn pri" id="csGuardar">'+ico('check')+' Guardar</button>' : ''), '680px');
  if($('#csValorar')) $('#csValorar').onclick = () => { cerrarModal(); iniciarValoracionPara(pacId); };
  if($('#csGuardar')) $('#csGuardar').onclick = () => {
    const ahora = new Date().toISOString();
    const reg = Object.assign({}, c, {
      id: id || uid('cns'), pacienteId: pacId,
      motivo: val('csMotivo'), fecha: val('csFecha') || hoyISO(), lugar: val('csLugar'),
      evaluacion: val('csEval'), indicaciones: val('csIndic'),
      ownerUid: c.ownerUid || SESION.uid,
      ownerNombre: c.ownerNombre || (USUARIO ? USUARIO.apellido + ', ' + USUARIO.nombre : ''),
      creado: c.creado || ahora, modificado: ahora
    });
    escribir('consultas', reg.id, reg);
    auditar(id ? 'consulta-editar' : 'consulta-alta', nombreMotivo(reg.motivo) + ' — ' + (p.apellido || '') + ', ' + (p.nombre || ''));
    cerrarModal();
    toast('Consulta guardada.', 'ok');
    if(vistaActual === 'fichas') vistaFichas();
  };
}

/* Historial: las dos ventanas de arriba */
let historialVista = 'fichas';
let consultasOrden = 'paciente';
function htmlVentanasHistorial(){
  const nF = (esCoordinador() ? lista('fichas') : misFichas()).length, nC = misConsultas().length;
  return '<div class="hist-ventanas">'+
    '<button type="button" class="hist-v'+(historialVista === 'fichas' ? ' on' : '')+'" data-histv="fichas">'+
      ico('ficha')+'<b>FICHAS ANESTÉSICAS</b><span>Mías, de colegas y disponibles · '+nF+'</span></button>'+
    '<button type="button" class="hist-v'+(historialVista === 'consultas' ? ' on' : '')+'" data-histv="consultas">'+
      ico('pacientes')+'<b>PACIENTES VALORADOS POR MOTIVOS NO QUIRÚRGICOS</b><span>Dolor, interdisciplinaria y otros · '+nC+'</span></button>'+
  '</div>';
}
function cablearVentanasHistorial(){
  $$('#vFichas [data-histv]').forEach(b => b.onclick = () => { historialVista = b.dataset.histv; vistaFichas(); });
}
function vistaHistorialConsultas(){
  const cont = $('#vFichas');
  const l = misConsultas().map(c => ({ c, p: DB.pacientes[c.pacienteId] || {} }));
  const alfa = (a, b) => ((a.p.apellido || '') + (a.p.nombre || '')).localeCompare((b.p.apellido || '') + (b.p.nombre || ''), 'es');
  const fila = x => '<div class="item" data-cns="'+esc(x.c.id)+'"><div class="avatar">'+esc(iniciales(x.p.nombre, x.p.apellido))+'</div>'+
    '<div class="txt"><b>'+esc((x.p.apellido || '—')+', '+(x.p.nombre || ''))+'</b><span>'+
      esc(nombreMotivo(x.c.motivo))+' · '+esc(fFecha(x.c.fecha))+(x.c.lugar ? ' · '+esc(x.c.lugar) : '')+'</span>'+
      (esCoordinador() && x.c.ownerUid !== SESION.uid ? '<span class="quien">'+esc(x.c.ownerNombre || nombreUsuario(x.c.ownerUid))+'</span>' : '')+
    '</div></div>';
  let cuerpo;
  if(!l.length){
    cuerpo = '<div class="vacio">'+ico('pacientes')+'<b>Todavía no hay consultas no quirúrgicas</b>'+
      '<span>Se cargan desde el inicio: 2 · Prequirúrgico → Interconsulta, eligiendo un motivo que no sea prequirúrgico.</span></div>';
  } else if(consultasOrden === 'motivo'){
    cuerpo = MOTIVOS_CONSULTA.map(m => {
      const g = l.filter(x => x.c.motivo === m[0]).sort(alfa);
      return g.length ? '<h3 class="sec-t">'+esc(m[1])+' ('+g.length+')</h3><div class="lista">'+g.map(fila).join('')+'</div>' : '';
    }).join('');
  } else {
    cuerpo = '<div class="lista">'+ l.slice().sort(alfa).map(fila).join('') +'</div>';
  }
  cont.innerHTML = htmlVentanasHistorial()+
    '<div class="vista-head"><div><h1>Valorados por motivos no quirúrgicos</h1><p>'+l.length+' consulta'+(l.length === 1 ? '' : 's')+'</p></div></div>'+
    '<div class="seg mb8" id="csOrden">'+
      '<button type="button" data-v="paciente"'+(consultasOrden === 'paciente' ? ' class="on"' : '')+'>Por paciente (A–Z)</button>'+
      '<button type="button" data-v="motivo"'+(consultasOrden === 'motivo' ? ' class="on"' : '')+'>Por motivo</button></div>'+
    '<div class="ayuda mb8">Estos pacientes no forman parte del padrón de las fichas anestésicas. Para operarlos o '+
      'valorarlos para una cirugía, buscalos por apellido o DNI en Pacientes, o abrí la consulta y tocá '+
      '«Pasar a valoración prequirúrgica».</div>'+
    cuerpo;
  cablearVentanasHistorial();
  $$('#csOrden button').forEach(b => b.onclick = () => { consultasOrden = b.dataset.v; vistaHistorialConsultas(); });
  $$('#vFichas [data-cns]').forEach(it => it.onclick = () => abrirConsulta(it.dataset.cns));
}
