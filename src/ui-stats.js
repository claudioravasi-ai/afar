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
/* Una ficha entra en el rango si cae dentro CUALQUIERA de sus dos fechas: la
   de la valoración prequirúrgica o la del acto anestésico. Suelen estar en
   meses distintos, y el que hizo la consulta en marzo tiene que ver ese
   trabajo en marzo aunque la cirugía haya sido en abril. */
function fichaEnRango(f, d, h){
  const v = fechaValoracionDe(f), c = fechaCirugiaDe(f);
  return (!!v && v >= d && v <= h) || (!!c && c >= d && c <= h);
}
function fichasEnRango(){
  const [d,h] = rangoPeriodo();
  return misFichas().filter(f => fichaEnRango(f, d, h));
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
  /* Igual que en facturación: si el período pedido es anterior a la ventana
     viva, primero se trae de la nube. Estadísticas a medias engañan más que
     no tener estadísticas. */
  if(!periodoCargado(d)){
    cont.innerHTML = '<div class="aviso info">'+ico('nube')+
      '<div><b>Trayendo el histórico desde '+fFecha(d)+'…</b><br>'+
      'En el dispositivo viven los últimos 90 días; el resto está en la nube.</div></div>';
    cargarFichasDesde(d).then(ok => {
      if(ok) vistaStats();
      else cont.innerHTML = '<div class="aviso danger">'+ico('alerta')+
        '<div><b>No se pudo traer el histórico.</b> Revisá la conexión y volvé a entrar.</div></div>';
    });
    return;
  }
  const l = fichasEnRango();
  const [rd,rh] = rangoPeriodo();

  /* Una ficha no es una prestación: puede contener la valoración
     prequirúrgica, el acto anestésico o los dos, y cada uno es un acto médico
     propio, con su titular y su honorario. Se cuentan por separado.

     Y cada socio ve SOLO SU trabajo. misFichas() trae también las fichas en
     las que intervino un colega —si él hizo la valoración y yo el acto, la
     ficha nos aparece a los dos—, así que contar fichas enteras le mostraría
     a cada uno la actividad ajena. Se cuenta acto por acto: la valoración es
     de quien la firmó y el acto de quien operó. La mirada de conjunto de la
     asociación es del coordinador, con su credencial. */
  const valoraciones = misValoraciones(l);
  const actos        = misActos(l);

  /* Fichas en las que efectivamente hice algo: la unión de las dos listas,
     sin repetir la ficha en la que hice los dos actos. */
  const idsMios = {};
  valoraciones.concat(actos).forEach(f => { idsMios[f.id] = f; });
  const mias = Object.keys(idsMios).map(k => idsMios[k]);

  const prest = misPrestaciones().filter(x => x.fecha >= rd && x.fecha <= rh);
  const honConsulta = prest.filter(x => x.tipo === 'consulta').reduce((a,x) => a + x.monto, 0);
  const honActo     = prest.filter(x => x.tipo === 'acto').reduce((a,x) => a + x.monto, 0);
  const totalHon = honConsulta + honActo;
  const nActos = valoraciones.length + actos.length;

  /* Cada indicador se calcula sobre el acto que lo genera: el ASA sale de la
     valoración y los eventos adversos del intraoperatorio. Si el colega tuvo
     un evento en un acto suyo, no es mi estadística. */
  const urg = mias.filter(f => f.caracter !== 'programada').length;
  const eventos = actos.filter(f => ((f.acto||{}).eventos||[]).some(e => e !== 'Sin eventos')).length;
  const asa34 = valoraciones.filter(f => ['III','IV','V'].indexOf(((f.v||{}).scores||{}).asa) >= 0).length;
  const pacs = new Set(mias.map(f => f.pacienteId)).size;

  const cortes = {
    /* Una ficha puede caer en las dos filas: la valoración y el acto son dos
       actos médicos distintos, no dos etapas de uno solo. */
    actoMedico:    ['Acto médico',   f => {
      const r = [];
      if(hayValoracion(f)) r.push('Valoración prequirúrgica');
      if(hayActo(f))       r.push('Acto anestésico');
      return r.length ? r : ['Sin cargar'];
    }],
    institucion:   ['Institución',   f => nombreInstitucion(f.institucion).split('"')[0].trim()],
    obraSocial:    ['Financiador',   f => f.obraSocial || 'Sin cobertura'],
    cirugia:       ['Cirugía',       f => f.cirugia || 'Sin especificar'],
    especialidad:  ['Especialidad',  f => f.especialidad || 'Sin especificar'],
    patologia:     ['Antecedente patológico', f => ((f.v||{}).antecedentes2 || []).map(c => c.n || c.d)],
    /* Los dos cortes por profesional nombran a colegas: son sólo del
       coordinador. Se quitan más abajo para el resto. */
    anestesiologo: ['Anestesiólogo (valoración)', f => nombreUsuario(f.ownerUid)],
    actor:         ['Anestesiólogo (acto)',        f => nombreActor(f)],
    caracter:      ['Carácter',      f => (f.caracter||'programada').charAt(0).toUpperCase() + (f.caracter||'programada').slice(1)],
    asa:           ['Riesgo ASA',    f => 'ASA ' + (((f.v||{}).scores||{}).asa || 'sin cargar')],
    tecnica:       ['Técnica',       f => ((f.acto||{}).tecnica || (f.plan||{}).tecnica || [])],
    eventos:       ['Eventos adversos', f => ((f.acto||{}).eventos || []).filter(e => e !== 'Sin eventos')]
  };
  if(!esCoordinador()){ delete cortes.anestesiologo; delete cortes.actor; }
  if(!cortes[stCorte]) stCorte = 'actoMedico';
  const datos = agrupar(mias, cortes[stCorte][1]);

  /* serie temporal por dia dentro del rango */
  const serie = {};
  mias.forEach(f => { const k = fechaDeFicha(f);
    if(k) serie[k] = (serie[k] || 0) + 1; });
  const dias = Object.keys(serie).sort().map(k => ({ t: k.slice(8)+'/'+k.slice(5,7), v: serie[k] }));

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Estadísticas</h1>'+
    '<p>'+fFecha(d)+' al '+fFecha(h)+(esCoordinador()?' · toda la asociación':' · sólo tu actividad')+
      ' · '+mias.length+' ficha'+(mias.length===1?'':'s')+'</p></div>'+
    '<div class="acciones"><button class="btn ghost chico" id="stExportar">'+ico('excel')+' Exportar</button></div></div>'+

  '<div class="scroll-x mb8">'+
    [['dia','Hoy'],['semana','Esta semana'],['mes','Este mes'],['anio','Este año'],['rango','Rango…']]
      .map(p => '<span class="tag'+(stPeriodo===p[0]?' on':'')+'" data-per="'+p[0]+'">'+p[1]+'</span>').join('')+
  '</div>'+
  (stPeriodo === 'rango' ? '<div class="filtros">'+
    '<div class="campo"><label>Desde</label><input type="date" id="stDesde" value="'+esc(stDesde)+'"></div>'+
    '<div class="campo"><label>Hasta</label><input type="date" id="stHasta" value="'+esc(stHasta)+'"></div>'+
  '</div>' : '')+

  /* ---- Los dos actos médicos, contados por separado ---- */
  '<div class="grid c3 mb8">'+
    kpi('Valoraciones prequirúrgicas', valoraciones.length, 'aqua', ico('valoracion'),
        esCoordinador() ? 'de toda la asociación' : 'firmadas por vos')+
    kpi('Actos anestésicos', actos.length, 'azul', ico('jeringa'),
        esCoordinador() ? 'de toda la asociación' : 'realizados por vos')+
    kpi('Pacientes', pacs, '', ico('pacientes'), 'distintos en el período')+
  '</div>'+

  '<div class="grid c3 mb8">'+
    kpi('Urgencias', urg, urg? 'warn':'', ico('alerta'),
        mias.length? Math.round(urg*100/mias.length)+' % de tus fichas':'')+
    kpi('ASA III-V', asa34, asa34?'danger':'', ico('escudo'),
        valoraciones.length? 'sobre '+valoraciones.length+' valoraciones':'Alto riesgo')+
    kpi('Eventos adversos', eventos, eventos?'danger':'ok', ico('monitor'),
        actos.length? (eventos*100/actos.length).toFixed(1)+' % de tus actos':'')+
  '</div>'+

  '<div class="grid c3 mb8">'+
    kpi('Honorarios de valoración', fMoneda(honConsulta), 'aqua', ico('valoracion'),
        valoraciones.length+' consulta'+(valoraciones.length===1?'':'s')+' prequirúrgica'+
        (valoraciones.length===1?'':'s'))+
    kpi('Honorarios del acto', fMoneda(honActo), 'azul', ico('jeringa'),
        actos.length+' acto'+(actos.length===1?'':'s')+' anestésico'+(actos.length===1?'':'s'))+
    kpi('Total devengado', fMoneda(totalHon), 'ok', ico('dinero'),
        nActos ? fMoneda(totalHon/nActos)+' por acto médico' : '')+
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

  (esCoordinador()
    ? '<div class="card"><h3>'+ico('pacientes')+'Actividad por anestesiólogo</h3>'+
      tablaAnestesiologos(l)+'</div>'
    : '<div class="aviso info">'+ico('candado')+'<div>Estas estadísticas son <b>sólo tuyas</b>: '+
      'la valoración prequirúrgica cuenta si la firmaste vos y el acto anestésico si lo '+
      'realizaste vos. Lo que hizo un colega en una ficha compartida no entra acá. '+
      'La actividad de toda la asociación la ve la coordinación.</div></div>');

  $$('#vStats [data-per]').forEach(t => t.onclick = () => { stPeriodo = t.dataset.per; vistaStats(); });
  if($('#stDesde')) $('#stDesde').onchange = e => { stDesde = e.target.value; vistaStats(); };
  if($('#stHasta')) $('#stHasta').onchange = e => { stHasta = e.target.value; vistaStats(); };
  $('#stCorte').onchange = e => { stCorte = e.target.value; vistaStats(); };
  $('#stExportar').onclick = () => exportarEstadisticas(mias, cortes[stCorte][0], datos);
}

function kpi(l, v, cls, icono, pie){
  return '<div class="kpi '+(cls||'')+'"><div class="lbl">'+(icono||'')+esc(l)+'</div>'+
    '<div class="val">'+(typeof v === 'number' ? fNum(v) : esc(v))+'</div>'+
    (pie ? '<div class="pie">'+esc(pie)+'</div>' : '')+'</div>';
}

/* Actividad por anestesiólogo, discriminando los dos actos médicos.
   La valoración se le imputa a quien la hizo (ownerUid) y el acto a quien
   operó (actorFicha): cuando intervinieron dos profesionales, cada uno
   aparece con lo suyo y ninguno se lleva el trabajo del otro. */
function tablaAnestesiologos(l){
  const m = {};
  const fila = k => {
    if(!m[k]) m[k] = { val:0, act:0, urg:0, ev:0, honVal:0, honAct:0 };
    return m[k];
  };
  l.forEach(f => {
    if(hayValoracion(f) && f.ownerUid){
      const r = fila(f.ownerUid);
      r.val++; r.honVal += Number((f.honConsulta||{}).total || 0);
    }
    /* Un acto puede haberlo hecho un anestesiólogo externo, sin usuario en la
       app. Se agrupa aparte en vez de descartarlo: si no, el total de la
       tabla no coincidiría con el devengado del período. */
    const act = actorFicha(f) || (hayActo(f) ? '__externo' : '');
    if(hayActo(f) && act){
      const r = fila(act);
      r.act++; r.honAct += Number((f.hon||{}).total || 0);
      if(f.caracter !== 'programada') r.urg++;
      if(((f.acto||{}).eventos||[]).some(e => e !== 'Sin eventos')) r.ev++;
    }
  });
  const filas = Object.keys(m).map(k => Object.assign({ uid:k,
      nombre: k === '__externo' ? 'Anestesiólogo externo / sin asignar' : nombreUsuario(k) }, m[k]))
    .sort((a,b) => (b.val + b.act) - (a.val + a.act));
  if(!filas.length) return '<p class="mini">Sin actividad registrada.</p>';

  const tot = filas.reduce((a,f) => ({
    val:a.val+f.val, act:a.act+f.act, urg:a.urg+f.urg, ev:a.ev+f.ev,
    honVal:a.honVal+f.honVal, honAct:a.honAct+f.honAct
  }), { val:0, act:0, urg:0, ev:0, honVal:0, honAct:0 });

  return '<div class="tabla-wrap"><table><thead><tr><th>Anestesiólogo</th>'+
    '<th class="num">Valoraciones</th><th class="num">Actos</th>'+
    '<th class="num">Urgencias</th><th class="num">Eventos</th>'+
    '<th class="num">Hon. valoración</th><th class="num">Hon. acto</th>'+
    '<th class="num">Total</th></tr></thead><tbody>'+
    filas.map(f => '<tr><td>'+esc(f.nombre)+'</td>'+
      '<td class="num">'+f.val+'</td><td class="num">'+f.act+'</td>'+
      '<td class="num">'+f.urg+'</td><td class="num">'+f.ev+'</td>'+
      '<td class="num">'+fMoneda(f.honVal)+'</td><td class="num">'+fMoneda(f.honAct)+'</td>'+
      '<td class="num">'+fMoneda(f.honVal + f.honAct)+'</td></tr>').join('')+
    '<tr style="font-weight:800;background:var(--panel-2)"><td>TOTAL</td>'+
      '<td class="num">'+tot.val+'</td><td class="num">'+tot.act+'</td>'+
      '<td class="num">'+tot.urg+'</td><td class="num">'+tot.ev+'</td>'+
      '<td class="num">'+fMoneda(tot.honVal)+'</td><td class="num">'+fMoneda(tot.honAct)+'</td>'+
      '<td class="num">'+fMoneda(tot.honVal + tot.honAct)+'</td></tr>'+
    '</tbody></table></div>'+
    '<div class="ayuda">La valoración prequirúrgica se imputa a quien la firmó y el acto '+
      'anestésico a quien lo realizó. Una misma ficha puede sumar en dos profesionales.</div>';
}
