/* =========================================================================
   PRESTADORES  (Coordinación)
   Instituciones y financiadores: alta, edición, datos de facturación,
   detección y fusión de duplicados, y baja de los que no tienen fichas.
   Toda operación se escribe en la base compartida y queda auditada.
   ========================================================================= */

let prestSolapa = 'financiadores';

/* =================== OPERACIONES SOBRE LOS DATOS =================== */

/* Reasigna todas las fichas y pacientes de un financiador a otro.
   Sirve tanto para fusionar duplicados como para renombrar. */
function fusionarFinanciador(desde, hacia, motivo){
  const kd = clavePrestador(desde), kh = clavePrestador(hacia);
  if(!kd || !kh) return 0;
  let n = 0;

  lista('fichas').forEach(f => {
    if(clavePrestador(f.obraSocial) === kd){
      f.obraSocial = hacia;
      f.modificado = new Date().toISOString();
      escribir('fichas', f.id, f); n++;
    }
  });
  lista('pacientes').forEach(p => {
    if(clavePrestador(p.obraSocial) === kd){
      p.obraSocial = hacia;
      escribir('pacientes', p.id, p); n++;
    }
  });

  /* El valor de la unidad viaja con el nombre */
  const vu = Object.assign({}, DB.config.valoresUnidad || {});
  let tocado = false;
  Object.keys(vu).forEach(k => {
    if(k !== '_default' && clavePrestador(k) === kd){
      if(vu[hacia] === undefined && vu[k]) vu[hacia] = vu[k];
      delete vu[k]; tocado = true;
    }
  });
  if(tocado){ escribir('config', 'valoresUnidad', Object.assign({ id:'valoresUnidad' }, vu));
              DB.config.valoresUnidad = vu; }

  /* Los datos de facturación se conservan si el destino no tiene */
  const rd = datosFinanciador(desde), rh = datosFinanciador(hacia);
  if(rd){
    if(!rh){
      escribir('obrasSociales', rd.id, Object.assign({}, rd, { nombre:hacia }));
    } else {
      ['cuit','contacto','telefono','email','domicilio','plazoPago','notas'].forEach(c => {
        if(!rh[c] && rd[c]) rh[c] = rd[c];
      });
      escribir('obrasSociales', rh.id, rh);
      eliminar('obrasSociales', rd.id);
    }
  }

  /* Si el nombre viejo venía de la lista de base, se oculta */
  if(kd !== kh){
    const oc = prestadoresOcultos();
    if(oc.finOcultos.indexOf(kd) < 0){ oc.finOcultos.push(kd); guardarOcultos(oc); }
  }

  auditar('prestador-fusionar',
    '«' + desde + '» → «' + hacia + '» · ' + n + ' registros reasignados' +
    (motivo ? ' · ' + motivo : ''));
  return n;
}

/* Igual, para instituciones (las fichas guardan el identificador) */
function fusionarInstitucion(desdeId, haciaId, motivo){
  if(!desdeId || !haciaId || desdeId === haciaId) return 0;
  let n = 0;
  lista('fichas').forEach(f => {
    if(f.institucion === desdeId){
      f.institucion = haciaId;
      f.modificado = new Date().toISOString();
      escribir('fichas', f.id, f); n++;
    }
  });
  lista('usuarios').forEach(u => {
    const ins = u.instituciones || [];
    if(ins.indexOf(desdeId) >= 0){
      u.instituciones = ins.map(x => x === desdeId ? haciaId : x)
        .filter((x,i,a) => a.indexOf(x) === i);
      escribir('usuarios', u.uid, u); n++;
    }
  });
  const rec = lista('instituciones').find(i => i.id === desdeId);
  if(rec) eliminar('instituciones', desdeId);
  else {
    const oc = prestadoresOcultos();
    if(oc.instOcultas.indexOf(desdeId) < 0){ oc.instOcultas.push(desdeId); guardarOcultos(oc); }
  }
  auditar('prestador-fusionar',
    '«' + nombreInstitucion(desdeId) + '» → «' + nombreInstitucion(haciaId) + '» · ' +
    n + ' registros reasignados' + (motivo ? ' · ' + motivo : ''));
  return n;
}

/* Duplicados sospechados, en pares */
function duplicadosFinanciadores(){
  const l = obrasSociales(), pares = [];
  for(let i = 0; i < l.length; i++)
    for(let j = i + 1; j < l.length; j++){
      const m = parecidoPrestador(l[i], l[j]);
      if(m && !parIgnorado(clavePrestador(l[i]), clavePrestador(l[j]))){
        const ui = usoFinanciador(l[i]), uj = usoFinanciador(l[j]);
        /* el que más se usa se propone como el bueno */
        pares.push(ui >= uj ? { a:l[j], b:l[i], usoA:uj, usoB:ui, motivo:m }
                            : { a:l[i], b:l[j], usoA:ui, usoB:uj, motivo:m });
      }
    }
  return pares;
}
function duplicadosInstituciones(){
  const l = instituciones(), pares = [];
  for(let i = 0; i < l.length; i++)
    for(let j = i + 1; j < l.length; j++){
      const m = parecidoPrestador(l[i].nombre, l[j].nombre);
      if(m && !parIgnorado(l[i].id, l[j].id)){
        const ui = usoInstitucion(l[i].id), uj = usoInstitucion(l[j].id);
        pares.push(ui >= uj ? { a:l[j], b:l[i], usoA:uj, usoB:ui, motivo:m }
                            : { a:l[i], b:l[j], usoA:ui, usoB:uj, motivo:m });
      }
    }
  return pares;
}

/* =========================== PANTALLA =========================== */
function seccionPrestadores(c){
  const dupF = duplicadosFinanciadores(), dupI = duplicadosInstituciones();
  const dup = prestSolapa === 'financiadores' ? dupF : dupI;

  c.innerHTML = ''+
  '<div class="seg mb8" id="prSeg">'+
    '<button type="button" data-v="financiadores"'+(prestSolapa==='financiadores'?' class="on"':'')+'>'+
      'Financiadores ('+obrasSociales().length+')'+(dupF.length?' ⚠':'')+'</button>'+
    '<button type="button" data-v="instituciones"'+(prestSolapa==='instituciones'?' class="on"':'')+'>'+
      'Instituciones ('+instituciones().length+')'+(dupI.length?' ⚠':'')+'</button>'+
  '</div>'+

  (dup.length
    ? '<div class="card" style="border:1.5px solid var(--warn)">'+
        '<h3>'+ico('alerta')+'Posibles duplicados ('+dup.length+')</h3>'+
        '<p class="mini mb8">Se detectaron nombres que parecen el mismo prestador escrito distinto. '+
          'Al fusionarlos, todas las fichas y pacientes pasan al nombre que elijas.</p>'+
        dup.map((d,i) => {
          const na = prestSolapa === 'financiadores' ? d.a : d.a.nombre;
          const nb = prestSolapa === 'financiadores' ? d.b : d.b.nombre;
          return '<div class="aviso warn" style="align-items:center">'+ico('copiar')+
            '<div style="flex:1;min-width:0"><b>'+esc(na)+'</b> ('+d.usoA+' ficha'+(d.usoA===1?'':'s')+')'+
            ' &nbsp;→&nbsp; <b>'+esc(nb)+'</b> ('+d.usoB+')'+
            '<div class="mini" style="color:inherit;opacity:.85">Motivo: '+esc(d.motivo)+'</div></div>'+
            '<div class="btn-row" style="flex:none;flex-wrap:nowrap">'+
              '<button class="btn ghost chico" data-dist="'+i+'">Son distintos</button>'+
              '<button class="btn warn chico" data-fus="'+i+'">Fusionar</button>'+
            '</div></div>';
        }).join('')+
      '</div>'
    : '<div class="aviso ok">'+ico('check')+'<div>No se detectan nombres duplicados.</div></div>')+

  '<div class="card">'+
    '<h3>'+ico(prestSolapa==='financiadores'?'dinero':'hospital')+
      (prestSolapa==='financiadores'?'Financiadores':'Instituciones')+
      '<button class="btn pri chico" id="prNuevo" style="margin-left:auto">'+ico('mas')+' Agregar</button></h3>'+
    (prestSolapa === 'financiadores' ? tablaFinanciadores() : tablaInstituciones())+
  '</div>'+

  tarjetaParesIgnorados()+

  '<p class="mini">Los prestadores fusionados o dados de baja dejan de ofrecerse en los desplegables, '+
    'pero las fichas históricas conservan el nombre con el que se emitieron. Todos estos cambios se '+
    'guardan en la base compartida y quedan en la auditoría.</p>';

  $$('#prSeg button').forEach(b => b.onclick = () => { prestSolapa = b.dataset.v; vistaCoordinador(); });
  $$('#coCuerpo [data-dist]').forEach(b => b.onclick = () => {
    const d = dup[Number(b.dataset.dist)];
    const esFin = prestSolapa === 'financiadores';
    const na = esFin ? d.a : d.a.nombre, nb = esFin ? d.b : d.b.nombre;
    confirmar('Marcar como distintos',
      '<b>'+esc(na)+'</b> y <b>'+esc(nb)+'</b> quedan registrados como dos prestadores '+
      'diferentes y no se vuelven a proponer para fusionar. No se modifica ninguna ficha.<br><br>'+
      'Si más adelante cambiás de opinión, podés volver a revisarlos desde «Pares descartados».',
      () => {
        ignorarPar(esFin ? 'financiador' : 'institucion',
                   esFin ? clavePrestador(d.a) : d.a.id,
                   esFin ? clavePrestador(d.b) : d.b.id, na, nb);
        vistaCoordinador();
        toast('Marcados como distintos.', 'ok');
      }, 'Son distintos');
  });
  $$('#coCuerpo [data-rev]').forEach(b => b.onclick = () => {
    revisarParDeNuevo(b.dataset.rev);
    vistaCoordinador();
    toast('Vuelve a revisarse.', 'ok');
  });
  $$('#coCuerpo [data-fus]').forEach(b => b.onclick = () => {
    const d = dup[Number(b.dataset.fus)];
    prestSolapa === 'financiadores'
      ? confirmarFusionFinanciador(d.a, d.b, d.motivo)
      : confirmarFusionInstitucion(d.a, d.b, d.motivo);
  });
  $('#prNuevo').onclick = () => prestSolapa === 'financiadores'
    ? editarFinanciador(null) : editarInstitucion(null);
  $$('#coCuerpo [data-fin]').forEach(t => t.onclick = () => editarFinanciador(t.dataset.fin));
  $$('#coCuerpo [data-ins]').forEach(t => t.onclick = () => editarInstitucion(t.dataset.ins));
}

function tablaFinanciadores(){
  const vu = DB.config.valoresUnidad || {};
  const l = obrasSociales().map(n => {
    const d = datosFinanciador(n) || {};
    return { n, d, uso:usoFinanciador(n), vu: vu[n] };
  }).sort((a,b) => b.uso - a.uso || a.n.localeCompare(b.n, 'es'));
  if(!l.length) return '<p class="mini">Sin financiadores.</p>';
  return '<div class="tabla-wrap"><table><thead><tr>'+
    '<th>Financiador</th><th>CUIT</th><th>Contacto</th>'+
    '<th class="num">Valor unidad</th><th class="num">Consulta</th>'+
    '<th class="num">Fichas</th></tr></thead><tbody>'+
    l.map(x => '<tr data-fin="'+esc(x.n)+'" style="cursor:pointer">'+
      '<td><b>'+esc(x.n)+'</b></td>'+
      '<td>'+(x.d.cuit ? esc(x.d.cuit) : '<span style="opacity:.4">—</span>')+'</td>'+
      '<td>'+esc([x.d.contacto, x.d.telefono].filter(Boolean).join(' · ') || '—')+'</td>'+
      '<td class="num">'+(x.vu ? fMoneda(x.vu) : '<span style="opacity:.4">por defecto</span>')+'</td>'+
      '<td class="num">'+(x.d.valorConsulta ? fMoneda(x.d.valorConsulta) : '<span style="opacity:.4">—</span>')+'</td>'+
      '<td class="num">'+(x.uso || '<span style="opacity:.4">0</span>')+'</td></tr>').join('')+
    '</tbody></table></div>';
}

function tablaInstituciones(){
  const l = instituciones().map(i => Object.assign({ uso:usoInstitucion(i.id) }, i))
    .sort((a,b) => b.uso - a.uso || a.nombre.localeCompare(b.nombre, 'es'));
  return '<div class="tabla-wrap"><table><thead><tr>'+
    '<th>Institución</th><th>Ciudad</th><th>Tipo</th><th>Contacto</th>'+
    '<th class="num">Fichas</th></tr></thead><tbody>'+
    l.map(x => '<tr data-ins="'+esc(x.id)+'" style="cursor:pointer">'+
      '<td><b>'+esc(x.nombre)+'</b>'+(x.base?' <span class="tag" style="font-size:9.5px">de base</span>':'')+'</td>'+
      '<td>'+esc(x.ciudad||'—')+'</td><td>'+esc(x.tipo||'—')+'</td>'+
      '<td>'+esc([x.contacto, x.telefono].filter(Boolean).join(' · ') || '—')+'</td>'+
      '<td class="num">'+(x.uso || '<span style="opacity:.4">0</span>')+'</td></tr>').join('')+
    '</tbody></table></div>';
}

/* ==================== FICHA DE UN FINANCIADOR ==================== */
function editarFinanciador(nombre){
  const nuevo = !nombre;
  const d = nuevo ? {} : (datosFinanciador(nombre) || {});
  const uso = nuevo ? 0 : usoFinanciador(nombre);
  const vu = (DB.config.valoresUnidad || {})[nombre];

  abrirModal(nuevo ? 'Nuevo financiador' : nombre,
    (nuevo ? '' :
      '<div class="grid c3 mb8">'+
        kpi('Fichas', uso, uso?'azul':'', ico('ficha'))+
        kpi('Valor unidad', vu ? fMoneda(vu) : 'por defecto', 'aqua', ico('dinero'))+
        kpi('Devengado', fMoneda(lista('fichas')
          .filter(f => clavePrestador(f.obraSocial) === clavePrestador(nombre))
          .reduce((a,f) => a + Number((f.hon||{}).total||0), 0)), 'ok', ico('stats'))+
      '</div>')+
    campoTxt('fnNombre','Nombre *', nombre || '')+
    '<div id="fnAviso"></div>'+
    '<hr class="sep"><label class="mini strong" style="display:block;margin-bottom:8px">'+
      'Datos para la facturación</label>'+
    '<div class="grid c2">'+
      campoTxt('fnCuit','CUIT', d.cuit)+
      campoSel('fnPlazo','Plazo de pago',
        ['','30 días','45 días','60 días','90 días','Contra presentación','A convenir'], d.plazoPago)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('fnContacto','Persona de contacto / auditoría', d.contacto)+
      campoTxt('fnTel','Teléfono', d.telefono)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('fnEmail','Correo para presentaciones', d.email)+
      campoTxt('fnDom','Domicilio', d.domicilio)+
    '</div>'+
    '<div class="grid c2">'+
      campoNum('fnVU','Valor de la unidad anestésica', vu, 'step="0.01"')+
      campoNum('fnVC','Valor de la consulta prequirúrgica', d.valorConsulta, 'step="0.01"')+
    '</div>'+
    campoArea('fnNotas','Notas del convenio', d.notas,
      'Módulos pactados, débitos frecuentes, requisitos de presentación…')+
    (nuevo ? '' :
      '<hr class="sep">'+
      '<div class="btn-row">'+
        '<button class="btn warn chico" id="fnFusionar">'+ico('copiar')+' Fusionar con otro</button>'+
        (uso === 0
          ? '<button class="btn danger chico" id="fnBorrar">'+ico('borrar')+' Borrar</button>'
          : '<button class="btn ghost chico" id="fnOcultar">'+ico('candado')+' Dar de baja</button>')+
      '</div>'+
      '<p class="mini mt8">'+(uso === 0
        ? 'No tiene ninguna ficha asociada: se puede borrar sin consecuencias.'
        : 'Tiene '+uso+' ficha'+(uso===1?'':'s')+', así que no se puede borrar. Darlo de baja lo saca '+
          'de los desplegables y conserva el historial.')+'</p>'),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="fnGuardar">'+ico('check')+' Guardar</button>');

  /* aviso de parecido mientras escribe */
  const revisar = () => {
    const v = $('#fnNombre').value.trim();
    const par = v ? obrasSociales().filter(o =>
      clavePrestador(o) !== clavePrestador(nombre || '') && parecidoPrestador(v, o)) : [];
    $('#fnAviso').innerHTML = par.length
      ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Ya existe algo parecido:</b> '+
        par.map(esc).join(' · ')+'.<br>Si es el mismo, usá ese nombre o fusionalos después.</div></div>'
      : '';
  };
  $('#fnNombre').oninput = debounce(revisar, 250);
  revisar();

  $('#fnGuardar').onclick = () => {
    const n = $('#fnNombre').value.trim();
    if(!n) return toast('El nombre es obligatorio.', 'err');
    const datos = { cuit:val('fnCuit'), plazoPago:val('fnPlazo'), contacto:val('fnContacto'),
                    telefono:val('fnTel'), email:val('fnEmail'), domicilio:val('fnDom'),
                    valorConsulta:Number(val('fnVC')) || 0, notas:val('fnNotas') };
    const nuevoVU = Number(val('fnVU')) || 0;

    if(!nuevo && clavePrestador(n) !== clavePrestador(nombre)){
      /* renombrado: arrastra fichas y pacientes */
      const cant = fusionarFinanciador(nombre, n, 'renombrado');
      guardarDatosFinanciador(n, datos);
      aplicarValorUnidad(n, nuevoVU);
      cerrarModal(); vistaCoordinador();
      return toast('Renombrado. Se actualizaron ' + cant + ' registros.', 'ok');
    }
    guardarDatosFinanciador(n, datos);
    aplicarValorUnidad(n, nuevoVU);
    auditar(nuevo ? 'prestador-alta' : 'prestador-editar', 'Financiador «' + n + '»');
    cerrarModal(); vistaCoordinador();
    toast(nuevo ? 'Financiador agregado.' : 'Datos guardados.', 'ok');
  };

  if($('#fnFusionar')) $('#fnFusionar').onclick = () => elegirDestinoFinanciador(nombre);
  if($('#fnBorrar')) $('#fnBorrar').onclick = () => confirmar('Borrar financiador',
    'No tiene fichas asociadas, así que se puede quitar del catálogo sin afectar nada.',
    () => {
      const r = datosFinanciador(nombre);
      if(r) eliminar('obrasSociales', r.id);
      const oc = prestadoresOcultos();
      const k = clavePrestador(nombre);
      if(oc.finOcultos.indexOf(k) < 0){ oc.finOcultos.push(k); guardarOcultos(oc); }
      auditar('prestador-borrar', 'Financiador «' + nombre + '» (sin fichas)');
      cerrarModal(); vistaCoordinador(); toast('Financiador eliminado.', 'ok');
    }, 'Borrar', true);
  if($('#fnOcultar')) $('#fnOcultar').onclick = () => confirmar('Dar de baja',
    'Deja de aparecer en los desplegables. Las ' + uso + ' fichas ya emitidas lo conservan.',
    () => {
      const oc = prestadoresOcultos(), k = clavePrestador(nombre);
      if(oc.finOcultos.indexOf(k) < 0){ oc.finOcultos.push(k); guardarOcultos(oc); }
      auditar('prestador-baja', 'Financiador «' + nombre + '»');
      cerrarModal(); vistaCoordinador(); toast('Financiador dado de baja.', 'ok');
    }, 'Dar de baja', true);
}

function aplicarValorUnidad(nombre, valor){
  const vu = Object.assign({}, DB.config.valoresUnidad || {});
  if(valor > 0) vu[nombre] = valor; else delete vu[nombre];
  vu.id = 'valoresUnidad';
  escribir('config', 'valoresUnidad', vu);
  DB.config.valoresUnidad = vu;
}

function elegirDestinoFinanciador(desde){
  const otros = obrasSociales().filter(o => clavePrestador(o) !== clavePrestador(desde));
  abrirModal('Fusionar «' + desde + '»',
    '<p class="mini mb8">Elegí con cuál se une. Las ' + usoFinanciador(desde) +
      ' fichas de «' + esc(desde) + '» pasan a llamarse como el que elijas.</p>'+
    campoSel('fuDestino','Unir con', [''].concat(otros)),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn warn" id="fuOK">Fusionar</button>');
  $('#fuOK').onclick = () => {
    const h = $('#fuDestino').value;
    if(!h) return toast('Elegí el financiador de destino.', 'err');
    confirmarFusionFinanciador(desde, h, 'fusión manual');
  };
}

function confirmarFusionFinanciador(desde, hacia, motivo){
  const n = usoFinanciador(desde);
  confirmar('Fusionar financiadores',
    'Todas las fichas y pacientes de <b>' + esc(desde) + '</b> pasan a <b>' + esc(hacia) + '</b>.<br><br>'+
    'Se reasignan <b>' + n + '</b> ficha' + (n===1?'':'s') + '. El nombre «' + esc(desde) +
    '» deja de ofrecerse. Los datos de facturación y el valor de unidad se conservan. '+
    'Esta acción no se puede deshacer automáticamente.',
    () => {
      const cant = fusionarFinanciador(desde, hacia, motivo);
      cerrarModal(); vistaCoordinador();
      toast('Fusionados. ' + cant + ' registros actualizados.', 'ok');
    }, 'Fusionar', true);
}

/* ==================== FICHA DE UNA INSTITUCIÓN ==================== */
function editarInstitucion(id){
  const nuevo = !id;
  const i = nuevo ? {} : (institucionPorId(id) || {});
  const uso = nuevo ? 0 : usoInstitucion(id);

  abrirModal(nuevo ? 'Nueva institución' : i.nombre,
    (nuevo ? '' :
      '<div class="grid c2 mb8">'+
        kpi('Fichas', uso, uso?'azul':'', ico('ficha'))+
        kpi('Anestesiólogos', lista('usuarios')
          .filter(u => (u.instituciones||[]).indexOf(id) >= 0).length, 'aqua', ico('pacientes'))+
      '</div>')+
    campoTxt('inNombre','Nombre *', i.nombre)+
    '<div id="inAviso"></div>'+
    '<div class="grid c2">'+
      campoSel('inCiudad','Ciudad',
        ['Ushuaia','Río Grande','Tolhuin','Otra localidad de TDF','Fuera de la provincia'], i.ciudad)+
      campoSel('inTipo','Tipo',
        ['Público','Privado','Obra social','Fuerzas Armadas','Municipal','Otro'], i.tipo)+
    '</div>'+
    '<hr class="sep"><label class="mini strong" style="display:block;margin-bottom:8px">'+
      'Datos administrativos</label>'+
    '<div class="grid c2">'+
      campoTxt('inCuit','CUIT', i.cuit)+
      campoTxt('inTel','Teléfono', i.telefono)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('inContacto','Contacto (jefatura, facturación)', i.contacto)+
      campoTxt('inEmail','Correo', i.email)+
    '</div>'+
    campoTxt('inDom','Domicilio', i.domicilio)+
    campoArea('inNotas','Notas', i.notas)+
    (nuevo ? '' :
      '<hr class="sep">'+
      '<div class="btn-row">'+
        '<button class="btn warn chico" id="inFusionar">'+ico('copiar')+' Fusionar con otra</button>'+
        (uso === 0
          ? '<button class="btn danger chico" id="inBorrar">'+ico('borrar')+' Borrar</button>'
          : '<button class="btn ghost chico" id="inOcultar">'+ico('candado')+' Dar de baja</button>')+
      '</div>'+
      '<p class="mini mt8">'+(uso === 0
        ? 'No tiene fichas asociadas: se puede borrar sin consecuencias.'
        : 'Tiene '+uso+' ficha'+(uso===1?'':'s')+'. Darla de baja la saca de los desplegables y '+
          'conserva el historial.')+'</p>'),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="inGuardar">'+ico('check')+' Guardar</button>');

  const revisar = () => {
    const v = $('#inNombre').value.trim();
    const par = v ? instituciones().filter(o => o.id !== id && parecidoPrestador(v, o.nombre)) : [];
    $('#inAviso').innerHTML = par.length
      ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Ya existe algo parecido:</b> '+
        par.map(o => esc(o.nombre)).join(' · ')+'</div></div>'
      : '';
  };
  $('#inNombre').oninput = debounce(revisar, 250);
  revisar();

  $('#inGuardar').onclick = () => {
    const n = val('inNombre').trim();
    if(!n) return toast('El nombre es obligatorio.', 'err');
    const datos = { nombre:n, ciudad:val('inCiudad'), tipo:val('inTipo'), cuit:val('inCuit'),
                    telefono:val('inTel'), contacto:val('inContacto'), email:val('inEmail'),
                    domicilio:val('inDom'), notas:val('inNotas') };
    if(nuevo){
      const nid = uid('ins');
      escribir('instituciones', nid, Object.assign({ id:nid }, datos));
      auditar('prestador-alta', 'Institución «' + n + '»');
    } else if(i.base){
      /* Las de base no se editan en su lugar: se crea una copia propia y se
         fusiona la de base hacia ella, para que las fichas la sigan. */
      const nid = uid('ins');
      escribir('instituciones', nid, Object.assign({ id:nid }, datos));
      fusionarInstitucion(id, nid, 'edición de institución de base');
    } else {
      escribir('instituciones', id, Object.assign({}, i, datos, { id }));
      auditar('prestador-editar', 'Institución «' + n + '»');
    }
    cerrarModal(); vistaCoordinador();
    toast(nuevo ? 'Institución agregada.' : 'Institución actualizada.', 'ok');
  };

  if($('#inFusionar')) $('#inFusionar').onclick = () => {
    const otras = instituciones().filter(o => o.id !== id);
    abrirModal('Fusionar «' + i.nombre + '»',
      '<p class="mini mb8">Las ' + uso + ' fichas de esta institución pasan a la que elijas.</p>'+
      campoSel('fiDestino','Unir con', [{v:'',t:'—'}].concat(
        otras.map(o => ({ v:o.id, t:o.nombre })))),
      '<button class="btn ghost" data-cerrar>Cancelar</button>'+
      '<button class="btn warn" id="fiOK">Fusionar</button>');
    $('#fiOK').onclick = () => {
      const h = $('#fiDestino').value;
      if(!h) return toast('Elegí la institución de destino.', 'err');
      confirmarFusionInstitucion(i, institucionPorId(h), 'fusión manual');
    };
  };
  if($('#inBorrar')) $('#inBorrar').onclick = () => confirmar('Borrar institución',
    'No tiene fichas asociadas, así que se puede quitar del catálogo sin afectar nada.',
    () => {
      if(!i.base) eliminar('instituciones', id);
      const oc = prestadoresOcultos();
      if(oc.instOcultas.indexOf(id) < 0){ oc.instOcultas.push(id); guardarOcultos(oc); }
      auditar('prestador-borrar', 'Institución «' + i.nombre + '» (sin fichas)');
      cerrarModal(); vistaCoordinador(); toast('Institución eliminada.', 'ok');
    }, 'Borrar', true);
  if($('#inOcultar')) $('#inOcultar').onclick = () => confirmar('Dar de baja',
    'Deja de aparecer en los desplegables. Las ' + uso + ' fichas ya emitidas la conservan.',
    () => {
      const oc = prestadoresOcultos();
      if(oc.instOcultas.indexOf(id) < 0){ oc.instOcultas.push(id); guardarOcultos(oc); }
      auditar('prestador-baja', 'Institución «' + i.nombre + '»');
      cerrarModal(); vistaCoordinador(); toast('Institución dada de baja.', 'ok');
    }, 'Dar de baja', true);
}

function confirmarFusionInstitucion(a, b, motivo){
  if(!a || !b) return;
  const n = usoInstitucion(a.id);
  confirmar('Fusionar instituciones',
    'Todas las fichas de <b>' + esc(a.nombre) + '</b> pasan a <b>' + esc(b.nombre) + '</b>.<br><br>'+
    'Se reasignan <b>' + n + '</b> ficha' + (n===1?'':'s') + ', y también los lugares de trabajo de '+
    'los socios. Esta acción no se puede deshacer automáticamente.',
    () => {
      const cant = fusionarInstitucion(a.id, b.id, motivo);
      cerrarModal(); vistaCoordinador();
      toast('Fusionadas. ' + cant + ' registros actualizados.', 'ok');
    }, 'Fusionar', true);
}

/* Pares que el coordinador declaró distintos */
function tarjetaParesIgnorados(){
  const tipo = prestSolapa === 'financiadores' ? 'financiador' : 'institucion';
  const l = prestadoresOcultos().paresIgnorados.filter(p => (p.tipo || tipo) === tipo);
  if(!l.length) return '';
  return '<details class="acc"><summary><span class="n">'+ico('check')+'</span>'+
      'Pares descartados ('+l.length+')<span class="flecha">'+ico('flecha')+'</span></summary>'+
    '<div class="cuerpo">'+
      '<p class="mini mb8">Marcados como prestadores distintos, ya no se proponen para fusionar. '+
        'Si fue un error, volvé a ponerlos en revisión.</p>'+
      l.map(p => '<div class="aviso ok" style="align-items:center">'+ico('equis')+
        '<div style="flex:1;min-width:0"><b>'+esc(p.a)+'</b> y <b>'+esc(p.b)+'</b>'+
        '<div class="mini" style="color:inherit;opacity:.8">Descartado el '+fFecha(p.cuando)+
        (p.quien ? ' por '+esc(p.quien) : '')+'</div></div>'+
        '<button class="btn ghost chico" data-rev="'+esc(p.k)+'">Volver a revisar</button></div>').join('')+
    '</div></details>';
}
