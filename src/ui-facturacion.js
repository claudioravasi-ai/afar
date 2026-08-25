/* =========================================================================
   FACTURACION MENSUAL
   Cruce de fichas por mes, institucion, financiador y modalidad de convenio.
   Exportacion a Excel (.xls legible) y a PDF por impresion.
   ========================================================================= */

let facMes = '', facInst = '', facOS = '', facModalidad = '', facEstado = '', facUid = '';

function vistaFacturacion(){
  if(!facMes) facMes = mesDe(hoyISO());
  const cont = $('#vFacturacion');
  /* Un mes anterior a la ventana viva no está en el dispositivo: se trae de la
     nube antes de calcular nada, o la facturación saldría incompleta. */
  if(!periodoCargado(facMes + '-01')){
    cont.innerHTML = '<div class="aviso info">'+ico('nube')+
      '<div><b>Trayendo la facturación de '+esc(nombreMes(facMes))+'…</b><br>'+
      'Los meses anteriores a los últimos 90 días viven en la nube.</div></div>';
    cargarFichasDesde(facMes + '-01').then(ok => {
      if(ok) vistaFacturacion();
      else cont.innerHTML = '<div class="aviso danger">'+ico('alerta')+
        '<div><b>No se pudo traer el histórico.</b> Revisá la conexión y volvé a entrar.</div></div>';
    });
    return;
  }
  let l = misPrestaciones().filter(x => mesDe(x.fecha) === facMes);
  if(facInst)      l = l.filter(x => x.ficha.institucion === facInst);
  if(facOS)        l = l.filter(x => x.ficha.obraSocial === facOS);
  /* El filtro de concepto discrimina los DOS actos médicos y, dentro de cada
     uno, su modalidad de convenio. El valor viaja como «grupo:modalidad»;
     sin modalidad, filtra el grupo entero. */
  if(facModalidad){
    const par = facModalidad.split(':'), gr = par[0], mid = par[1] || '';
    l = l.filter(x => {
      if(gr === 'consulta')
        return x.tipo === 'consulta' && (!mid || (x.ficha.honConsulta||{}).modalidad === mid);
      if(gr === 'acto')
        return x.tipo === 'acto' && (!mid || (x.ficha.hon||{}).modalidad === mid);
      return true;
    });
  }
  if(facEstado)    l = l.filter(x => x.estado === facEstado);
  if(facUid)       l = l.filter(x => x.uid === facUid);
  l.sort((a,b) => (a.fecha||'') < (b.fecha||'') ? -1 : 1);

  const total     = l.reduce((a,x) => a + x.monto, 0);
  const cobrado   = l.reduce((a,x) => a + x.cobrado, 0);
  const pendiente = l.filter(x => ['Pendiente','Presentado','Facturado'].indexOf(x.estado) >= 0)
                     .reduce((a,x) => a + x.monto, 0);
  const consultas = l.filter(x => x.tipo === 'consulta').length;
  const actos     = l.filter(x => x.tipo === 'acto').length;
  const montoConsultas = l.filter(x => x.tipo === 'consulta').reduce((a,x) => a + x.monto, 0);
  const montoActos     = l.filter(x => x.tipo === 'acto').reduce((a,x) => a + x.monto, 0);

  const porOS   = resumenPor(l, x => x.ficha.obraSocial || 'Sin cobertura');
  const porInst = resumenPor(l, x => nombreInstitucion(x.ficha.institucion).split('"')[0].trim());
  const porConcepto = resumenPor(l, x => x.tipo === 'consulta'
    ? 'Valoración prequirúrgica' : 'Acto anestésico');
  const porMod  = resumenPor(l, x => x.tipo === 'consulta'
    ? (MODALIDADES_CONSULTA.find(m => m.id === (x.ficha.honConsulta||{}).modalidad) || {n:'Consulta'}).n
    : (MODALIDADES_HONORARIOS.find(m => m.id === (x.ficha.hon||{}).modalidad) || {n:'Sin definir'}).n);

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Facturación</h1>'+
    '<p>'+nombreMes(facMes)+' · '+l.length+' prestaciones · '+consultas+' consulta'+
      (consultas===1?'':'s')+' y '+actos+' acto'+(actos===1?'':'s')+'</p></div>'+
    '<div class="acciones">'+
      '<button class="btn ghost chico" id="facExcel">'+ico('excel')+' Excel</button>'+
      '<button class="btn ghost chico" id="facPdf">'+ico('imprimir')+' PDF</button>'+
    '</div></div>'+

  '<div class="filtros">'+
    campoMesAnio('facMes','Mes', facMes)+
    '<div class="campo"><label>Institución</label><select id="facInst"><option value="">Todas</option>'+
      instituciones().map(i => '<option value="'+esc(i.id)+'"'+(facInst===i.id?' selected':'')+'>'+
        esc(i.nombre.split('"')[0].trim())+'</option>').join('')+'</select></div>'+
    '<div class="campo"><label>Financiador</label><select id="facOS"><option value="">Todos</option>'+
      obrasSociales().map(o => '<option'+(facOS===o?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select></div>'+
    '<div class="campo"><label>Concepto</label><select id="facMod">'+
      '<option value="">Todos los conceptos</option>'+
      '<optgroup label="Valoración prequirúrgica">'+
        '<option value="consulta"'+(facModalidad==='consulta'?' selected':'')+'>'+
          'Todas las valoraciones prequirúrgicas</option>'+
        MODALIDADES_CONSULTA.map(m => '<option value="consulta:'+m.id+'"'+
          (facModalidad==='consulta:'+m.id?' selected':'')+'>Valoración: '+esc(m.n)+'</option>').join('')+
      '</optgroup>'+
      '<optgroup label="Acto anestésico">'+
        '<option value="acto"'+(facModalidad==='acto'?' selected':'')+'>'+
          'Todos los actos anestésicos</option>'+
        MODALIDADES_HONORARIOS.map(m => '<option value="acto:'+m.id+'"'+
          (facModalidad==='acto:'+m.id?' selected':'')+'>Acto: '+esc(m.n)+'</option>').join('')+
      '</optgroup>'+
    '</select></div>'+
    '<div class="campo"><label>Estado</label><select id="facEstado"><option value="">Todos</option>'+
      ESTADOS_FACT.map(e => '<option'+(facEstado===e?' selected':'')+'>'+esc(e)+'</option>').join('')+'</select></div>'+
    (esCoordinador() ? '<div class="campo"><label>Anestesiólogo</label><select id="facUid"><option value="">Todos</option>'+
      lista('usuarios').filter(u => u.rol === 'socio').map(u => '<option value="'+esc(u.uid)+'"'+
        (facUid===u.uid?' selected':'')+'>'+esc(u.apellido+', '+u.nombre)+'</option>').join('')+
      '</select></div>' : '')+
  '</div>'+

  '<div class="grid c3 mb8">'+
    kpi('Devengado', fMoneda(total), 'azul', ico('dinero'), l.length+' prestaciones')+
    kpi('Pendiente de cobro', fMoneda(pendiente), pendiente?'warn':'ok', ico('reloj'), '')+
    kpi('Cobrado', fMoneda(cobrado), 'ok', ico('check'), total? Math.round(cobrado*100/total)+' % del devengado':'')+
  '</div>'+

  /* Los dos conceptos, cada uno con su importe: son actos médicos distintos
     y se facturan por separado, aunque salgan de la misma ficha. */
  '<div class="grid c2 mb8">'+
    kpi('Valoraciones prequirúrgicas', fMoneda(montoConsultas), 'aqua', ico('valoracion'),
        consultas+' consulta'+(consultas===1?'':'s')+
        (consultas ? ' · '+fMoneda(montoConsultas/consultas)+' promedio' : ''))+
    kpi('Actos anestésicos', fMoneda(montoActos), 'azul', ico('jeringa'),
        actos+' acto'+(actos===1?'':'s')+
        (actos ? ' · '+fMoneda(montoActos/actos)+' promedio' : ''))+
  '</div>'+

  '<div class="grid c2">'+
    tarjetaResumen('Por financiador', porOS)+
    tarjetaResumen('Por institución', porInst)+
  '</div>'+
  tarjetaResumen('Por concepto', porConcepto)+
  tarjetaResumen('Por modalidad de convenio', porMod)+

  '<div class="card"><h3>'+ico('lista')+'Detalle de prestaciones</h3>'+
    (l.length ? '<div class="tabla-wrap"><table><thead><tr>'+
      '<th>Fecha</th><th>Paciente</th><th>Concepto</th><th>Cirugía</th><th>Institución</th><th>Financiador</th>'+
      (esCoordinador()?'<th>Profesional</th>':'')+
      '<th class="num">Importe</th><th>Estado</th></tr></thead><tbody>'+
      l.map(x => {
        const f = x.ficha, p = DB.pacientes[f.pacienteId] || {};
        return '<tr data-f="'+f.id+'" style="cursor:pointer">'+
          '<td>'+fFecha(f.fecha)+'</td>'+
          '<td>'+esc((p.apellido||'—')+', '+(p.nombre||''))+'</td>'+
          '<td><span class="tag concepto '+(x.tipo==='consulta'?'aqua':'info')+'">'+
            (x.tipo==='consulta'?'Valoración prequirúrgica':'Acto anestésico')+'</span></td>'+
          '<td>'+esc((f.cirugia||'—').slice(0,38))+'</td>'+
          '<td>'+esc(nombreInstitucion(f.institucion).split('"')[0].trim())+'</td>'+
          '<td>'+esc(f.obraSocial||'—')+'</td>'+
          (esCoordinador()?'<td>'+esc(nombreUsuario(x.uid))+'</td>':'')+
          '<td class="num">'+fMoneda(x.monto)+'</td>'+
          '<td>'+etiquetaEstadoFact(x.estado)+'</td></tr>';
      }).join('')+
      '<tr style="font-weight:800;background:var(--panel-2)"><td colspan="'+(esCoordinador()?7:6)+'">TOTAL</td>'+
      '<td class="num">'+fMoneda(total)+'</td><td></td></tr>'+
      '</tbody></table></div>'
    : '<div class="vacio">'+ico('dinero')+'<b>Sin prestaciones en el mes</b>'+
      '<span>Cambiá los filtros o cargá fichas con honorarios.</span></div>')+
  '</div>'+

  '<div class="aviso info">'+ico('info')+'<div>Cada ficha puede generar <b>dos prestaciones con distinto '+
    'titular</b>: la consulta prequirúrgica, de quien hizo la valoración, y el acto anestésico, de quien operó. '+
    'Acá ves sólo las que te corresponden a vos. El resumen se emite con tu CUIT y condición frente al IVA '+
    'cargados en <b>Mi perfil</b>.</div></div>';

  cablearMesAnio('facMes', v => { facMes = v; vistaFacturacion(); });
  $('#facInst').onchange = e => { facInst = e.target.value; vistaFacturacion(); };
  $('#facOS').onchange = e => { facOS = e.target.value; vistaFacturacion(); };
  $('#facMod').onchange = e => { facModalidad = e.target.value; vistaFacturacion(); };
  $('#facEstado').onchange = e => { facEstado = e.target.value; vistaFacturacion(); };
  if($('#facUid')) $('#facUid').onchange = e => { facUid = e.target.value; vistaFacturacion(); };
  $('#facExcel').onclick = () => exportarFacturacionExcel(l, facMes);
  $('#facPdf').onclick  = () => imprimirFacturacion(l, facMes, { total, cobrado, pendiente }, porOS, porInst);
  $$('#vFacturacion tr[data-f]').forEach(tr => tr.onclick = () => abrirFicha(tr.dataset.f));
}

function resumenPor(l, fn){
  const m = {};
  l.forEach(x => {
    const k = fn(x) || '—';
    if(!m[k]) m[k] = { n:0, total:0, cobrado:0 };
    m[k].n++; m[k].total += x.monto; m[k].cobrado += x.cobrado;
  });
  return Object.keys(m).map(k => Object.assign({ t:k }, m[k])).sort((a,b) => b.total - a.total);
}
function tarjetaResumen(titulo, datos){
  if(!datos.length) return '';
  return '<div class="card"><h3>'+ico('filtro')+esc(titulo)+'</h3>'+
    '<div class="tabla-wrap"><table><thead><tr><th>'+esc(titulo.replace('Por ',''))+
    '</th><th class="num">N.º</th><th class="num">Devengado</th><th class="num">Cobrado</th></tr></thead><tbody>'+
    datos.map(d => '<tr><td>'+esc(d.t)+'</td><td class="num">'+d.n+'</td>'+
      '<td class="num">'+fMoneda(d.total)+'</td><td class="num">'+fMoneda(d.cobrado)+'</td></tr>').join('')+
    '</tbody></table></div></div>';
}
function etiquetaEstadoFact(e){
  const c = { 'Pendiente':'warn', 'Presentado':'info', 'Facturado':'info',
              'Cobrado':'ok', 'Débito / rechazado':'danger' };
  return '<span class="tag '+(c[e]||'')+'">'+esc(e||'Pendiente')+'</span>';
}
