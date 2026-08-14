/* =========================================================================
   ESTADISTICAS - por dia, semana y mes, con cruces por anestesiologo,
   institucion, patologia, cirugia, obra social, caracter y riesgo ASA.
   ========================================================================= */

let stPeriodo = 'mes', stDesde = '', stHasta = '', stCorte = 'institucion';

function rangoPeriodo(){
  const hoy = new Date();
  const iso = d => d.toISOString().slice(0,10);
  if(stPeriodo === 'dia')    return [iso(hoy), iso(hoy)];
  if(stPeriodo === 'semana'){
    const d = new Date(hoy); const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    const f = new Date(d); f.setDate(f.getDate() + 6);
    return [iso(d), iso(f)];
  }
  if(stPeriodo === 'mes'){
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const f = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return [iso(d), iso(f)];
  }
  if(stPeriodo === 'anio') return [hoy.getFullYear()+'-01-01', hoy.getFullYear()+'-12-31'];
  return [stDesde || '2000-01-01', stHasta || '2100-12-31'];
}
function fichasEnRango(){
  const [d,h] = rangoPeriodo();
  return misFichas().filter(f => f.fecha && f.fecha >= d && f.fecha <= h);
}
function agrupar(fichas, fn){
  const m = {};
  fichas.forEach(f => {
    const ks = fn(f);
    (Array.isArray(ks) ? ks : [ks]).forEach(k => {
      if(!k) return; m[k] = (m[k] || 0) + 1;
    });
  });
  return Object.keys(m).map(k => ({ t:k, v:m[k] })).sort((a,b) => b.v - a.v);
}

function vistaStats(){
  const cont = $('#vStats');
  const [d,h] = rangoPeriodo();
  const l = fichasEnRango();
  const [rd,rh] = rangoPeriodo();
  const totalHon = misPrestaciones()
    .filter(x => x.fecha >= rd && x.fecha <= rh).reduce((a,x) => a + x.monto, 0);
  const urg = l.filter(f => f.caracter !== 'programada').length;
  const eventos = l.filter(f => ((f.acto||{}).eventos||[]).some(e => e !== 'Sin eventos')).length;
  const asa34 = l.filter(f => ['III','IV','V'].indexOf(((f.v||{}).scores||{}).asa) >= 0).length;
  const pacs = new Set(l.map(f => f.pacienteId)).size;

  const cortes = {
    institucion:   ['Institución',   f => nombreInstitucion(f.institucion).split('"')[0].trim()],
    obraSocial:    ['Financiador',   f => f.obraSocial || 'Sin cobertura'],
    cirugia:       ['Cirugía',       f => f.cirugia || 'Sin especificar'],
    especialidad:  ['Especialidad',  f => f.especialidad || 'Sin especificar'],
    patologia:     ['Patología (CIE-10)', f => ((f.v||{}).cie10 || []).map(c => c.d)],
    anestesiologo: ['Anestesiólogo (valoración)', f => nombreUsuario(f.ownerUid)],
    actor:         ['Anestesiólogo (acto)',        f => nombreActor(f)],
    caracter:      ['Carácter',      f => (f.caracter||'programada').charAt(0).toUpperCase() + (f.caracter||'programada').slice(1)],
    asa:           ['Riesgo ASA',    f => 'ASA ' + (((f.v||{}).scores||{}).asa || 'sin cargar')],
    tecnica:       ['Técnica',       f => ((f.acto||{}).tecnica || (f.plan||{}).tecnica || [])],
    eventos:       ['Eventos adversos', f => ((f.acto||{}).eventos || []).filter(e => e !== 'Sin eventos')]
  };
  const datos = agrupar(l, cortes[stCorte][1]);

  /* serie temporal por dia dentro del rango */
  const serie = {};
  l.forEach(f => { serie[f.fecha] = (serie[f.fecha] || 0) + 1; });
  const dias = Object.keys(serie).sort().map(k => ({ t: k.slice(8)+'/'+k.slice(5,7), v: serie[k] }));

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Estadísticas</h1>'+
    '<p>'+fFecha(d)+' al '+fFecha(h)+(esCoordinador()?' · toda la asociación':' · tu actividad')+'</p></div>'+
    '<div class="acciones"><button class="btn ghost chico" id="stExportar">'+ico('excel')+' Exportar</button></div></div>'+

  '<div class="scroll-x mb8">'+
    [['dia','Hoy'],['semana','Esta semana'],['mes','Este mes'],['anio','Este año'],['rango','Rango…']]
      .map(p => '<span class="tag'+(stPeriodo===p[0]?' on':'')+'" data-per="'+p[0]+'">'+p[1]+'</span>').join('')+
  '</div>'+
  (stPeriodo === 'rango' ? '<div class="filtros">'+
    '<div class="campo"><label>Desde</label><input type="date" id="stDesde" value="'+esc(stDesde)+'"></div>'+
    '<div class="campo"><label>Hasta</label><input type="date" id="stHasta" value="'+esc(stHasta)+'"></div>'+
  '</div>' : '')+

  '<div class="grid c3 mb8">'+
    kpi('Fichas', l.length, 'azul', ico('ficha'), pacs+' pacientes distintos')+
    kpi('Urgencias', urg, urg? 'warn':'', ico('alerta'), l.length? Math.round(urg*100/l.length)+' % del total':'')+
    kpi('ASA III-V', asa34, asa34?'danger':'', ico('escudo'), 'Alto riesgo')+
    kpi('Eventos adversos', eventos, eventos?'danger':'ok', ico('monitor'),
        l.length? (eventos*100/l.length).toFixed(1)+' % de las fichas':'')+
    kpi('Honorarios', fMoneda(totalHon), 'ok', ico('dinero'), 'Devengado en el período')+
    kpi('Promedio por ficha', fMoneda(l.length? totalHon/l.length : 0), 'aqua', ico('calculadora'), '')+
  '</div>'+

  (dias.length > 1 ? '<div class="card"><h3>'+ico('stats')+'Actividad por día</h3>'+
    '<div class="chart">'+svgBarras(dias, 150, 'var(--aqua-500)')+'</div></div>' : '')+

  '<div class="card"><h3>'+ico('filtro')+'Distribución</h3>'+
    '<div class="campo"><select id="stCorte">'+
      Object.keys(cortes).map(k => '<option value="'+k+'"'+(stCorte===k?' selected':'')+'>'+
        esc(cortes[k][0])+'</option>').join('')+
    '</select></div>'+
    (datos.length ?
      '<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:center">'+
        svgDona(datos.slice(0,8), 'fichas')+
        '<div style="flex:1;min-width:220px">'+leyenda(datos.slice(0,8))+'</div>'+
      '</div>'+
      '<div class="tabla-wrap mt14"><table><thead><tr><th>'+esc(cortes[stCorte][0])+
        '</th><th class="num">Fichas</th><th class="num">%</th></tr></thead><tbody>'+
        datos.map(x => '<tr><td>'+esc(x.t)+'</td><td class="num">'+x.v+'</td><td class="num">'+
          Math.round(x.v*100/Math.max(1,datos.reduce((a,b)=>a+b.v,0)))+' %</td></tr>').join('')+
      '</tbody></table></div>'
      : '<div class="vacio">'+ico('stats')+'<b>Sin datos en el período</b><span>Cambiá el rango o cargá fichas.</span></div>')+
  '</div>'+

  (esCoordinador() ? '<div class="card"><h3>'+ico('pacientes')+'Actividad por anestesiólogo</h3>'+
    tablaAnestesiologos(l)+'</div>' : '');

  $$('#vStats [data-per]').forEach(t => t.onclick = () => { stPeriodo = t.dataset.per; vistaStats(); });
  if($('#stDesde')) $('#stDesde').onchange = e => { stDesde = e.target.value; vistaStats(); };
  if($('#stHasta')) $('#stHasta').onchange = e => { stHasta = e.target.value; vistaStats(); };
  $('#stCorte').onchange = e => { stCorte = e.target.value; vistaStats(); };
  $('#stExportar').onclick = () => exportarEstadisticas(l, cortes[stCorte][0], datos);
}

function kpi(l, v, cls, icono, pie){
  return '<div class="kpi '+(cls||'')+'"><div class="lbl">'+(icono||'')+esc(l)+'</div>'+
    '<div class="val">'+(typeof v === 'number' ? fNum(v) : esc(v))+'</div>'+
    (pie ? '<div class="pie">'+esc(pie)+'</div>' : '')+'</div>';
}

function tablaAnestesiologos(l){
  const m = {};
  l.forEach(f => {
    const k = f.ownerUid;
    if(!m[k]) m[k] = { n:0, hon:0, urg:0, ev:0 };
    m[k].n++; m[k].hon += Number((f.hon||{}).total || 0) + Number((f.honConsulta||{}).total || 0);
    if(f.caracter !== 'programada') m[k].urg++;
    if(((f.acto||{}).eventos||[]).some(e => e !== 'Sin eventos')) m[k].ev++;
  });
  const filas = Object.keys(m).map(k => Object.assign({ uid:k, nombre:nombreUsuario(k) }, m[k]))
    .sort((a,b) => b.n - a.n);
  if(!filas.length) return '<p class="mini">Sin actividad registrada.</p>';
  return '<div class="tabla-wrap"><table><thead><tr><th>Anestesiólogo</th>'+
    '<th class="num">Fichas</th><th class="num">Urgencias</th><th class="num">Eventos</th>'+
    '<th class="num">Honorarios</th></tr></thead><tbody>'+
    filas.map(f => '<tr><td>'+esc(f.nombre)+'</td><td class="num">'+f.n+'</td>'+
      '<td class="num">'+f.urg+'</td><td class="num">'+f.ev+'</td>'+
      '<td class="num">'+fMoneda(f.hon)+'</td></tr>').join('')+
    '</tbody></table></div>';
}
