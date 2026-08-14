/* =========================================================================
   PORTAL CONTABLE - AFAR
   Acceso exclusivo del contador de la asociacion.

   NO accede a ningun dato clinico: trabaja unicamente sobre la proyeccion
   anonimizada que devuelve prestacionesContables() (ver core.js). No hay
   pacientes, ni cirugias, ni diagnosticos, ni valoraciones en este portal.
   ========================================================================= */

let contSeccion = 'panel';
let contDesde = '', contHasta = '', contUid = '', contInst = '';

const CONT_SECCIONES = [
  { id:'panel',      ico:'panel',        t:'Tablero' },
  { id:'cartera',    ico:'dinero',       t:'Cartera y deuda' },
  { id:'indexacion', ico:'stats',        t:'Indexación' },
  { id:'fiscal',     ico:'archivo',      t:'Situación fiscal' },
  { id:'consejos',   ico:'guias',        t:'Recomendaciones' },
  { id:'parametros', ico:'ajustes',      t:'Parámetros' }
];

/* ------------------------------------------------------------- Filtros */
function contPeriodo(){
  if(!contHasta) contHasta = mesDe(hoyISO());
  if(!contDesde) contDesde = sumarMeses(contHasta, -11);
  return { desde:contDesde, hasta:contHasta };
}
function contDatos(){
  const p = contPeriodo();
  let l = prestacionesContables().filter(x => x.mes >= p.desde && x.mes <= p.hasta);
  if(contUid)  l = l.filter(x => x.uid === contUid);
  if(contInst) l = l.filter(x => x.institucionId === contInst);
  return l;
}
/* Dias de antiguedad del saldo: desde la presentacion, o desde la prestacion */
function diasDeuda(x){
  const ref = x.fechaPresentacion || x.fecha;
  if(!ref) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(ref + 'T12:00:00').getTime()) / 86400000));
}
function estaImpago(x){
  return x.saldo > 0 && ['Pendiente','Presentado','Facturado','Débito / rechazado'].indexOf(x.estado) >= 0;
}

/* ============================== VISTA ============================== */
function vistaContable(){
  const cont = $('#vContable');
  const p = contPeriodo();
  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Contable AFAR</h1>'+
    '<p>Gestión económica de la asociación · '+nombreMes(p.desde)+' a '+nombreMes(p.hasta)+'</p></div></div>'+

  '<div class="aviso info">'+ico('candado')+'<div><b>Portal sin datos clínicos.</b> '+
    'Este acceso trabaja sobre prestaciones anonimizadas: importes, financiadores, instituciones y '+
    'profesionales. No contiene pacientes, cirugías ni diagnósticos, en cumplimiento de la Ley 25.326.</div></div>'+

  '<div class="filtros">'+
    '<div class="campo"><label>Desde</label><input type="month" id="ctDesde" value="'+esc(p.desde)+'"></div>'+
    '<div class="campo"><label>Hasta</label><input type="month" id="ctHasta" value="'+esc(p.hasta)+'"></div>'+
    '<div class="campo"><label>Anestesiólogo</label><select id="ctUid"><option value="">Todos</option>'+
      socios().map(u => '<option value="'+esc(u.uid)+'"'+(contUid===u.uid?' selected':'')+'>'+
        esc(u.apellido+', '+u.nombre)+'</option>').join('')+'</select></div>'+
    '<div class="campo"><label>Institución</label><select id="ctInst"><option value="">Todas</option>'+
      instituciones().map(i => '<option value="'+esc(i.id)+'"'+(contInst===i.id?' selected':'')+'>'+
        esc(i.nombre.split('"')[0].trim())+'</option>').join('')+'</select></div>'+
  '</div>'+

  '<div class="scroll-x mb8">'+ CONT_SECCIONES.map(s =>
    '<button type="button" class="tag'+(contSeccion===s.id?' on':'')+'" data-cs="'+s.id+'"'+
    ' style="border:0;font:inherit;cursor:pointer">'+
    ico(s.ico).replace('<svg','<svg style="width:14px;height:14px;display:inline-block;'+
      'vertical-align:-2px;margin-right:4px"')+esc(s.t)+'</button>').join('') +'</div>'+

  '<div id="ctCuerpo"></div>';

  $('#ctDesde').onchange = e => { contDesde = e.target.value; vistaContable(); };
  $('#ctHasta').onchange = e => { contHasta = e.target.value; vistaContable(); };
  $('#ctUid').onchange  = e => { contUid  = e.target.value; vistaContable(); };
  $('#ctInst').onchange = e => { contInst = e.target.value; vistaContable(); };
  $$('#vContable [data-cs]').forEach(b => b.onclick = () => { contSeccion = b.dataset.cs; vistaContable(); });

  const c = $('#ctCuerpo');
  if(contSeccion === 'panel')      { c.innerHTML = ctPanel();      ctCablearPanel(); }
  if(contSeccion === 'cartera')    { c.innerHTML = ctCartera();    ctCablearCartera(); }
  if(contSeccion === 'indexacion') { c.innerHTML = ctIndexacion(); }
  if(contSeccion === 'fiscal')     { c.innerHTML = ctFiscal();     }
  if(contSeccion === 'consejos')   { c.innerHTML = ctConsejos();   ctCablearConsejos(); }
  if(contSeccion === 'parametros') { c.innerHTML = ctParametros(); ctCablearParametros(); }
}

/* --------------------------------------------------------- 1. TABLERO */
function ctPanel(){
  const l = contDatos();
  const devengado = l.reduce((a,x) => a + x.monto, 0);
  const cobrado   = l.reduce((a,x) => a + x.cobrado, 0);
  const impagas   = l.filter(estaImpago);
  const adeudado  = impagas.reduce((a,x) => a + x.saldo, 0);

  /* Deuda llevada a moneda de hoy */
  let indexado = 0, perdida = 0, sinDato = 0;
  impagas.forEach(x => {
    const r = indexarSaldo(x.saldo, x.mes);
    indexado += r.actualizado; perdida += r.perdida;
    if(r.mesesSinDato) sinDato++;
  });

  const proy = proyeccionAnual(6);
  const infl = inflacionUltimos(12);
  const porProf = ctAgrupar(l, x => nombreUsuario(x.uid) || 'Sin asignar');
  const porInst = ctAgrupar(l, x => x.institucion);
  const porFin  = ctAgrupar(l, x => x.financiador);

  return ''+
  '<div class="grid c4 mb8">'+
    kpi('Devengado', fMoneda(devengado), 'azul', ico('dinero'), l.length+' prestaciones')+
    kpi('Cobrado', fMoneda(cobrado), 'ok', ico('check'),
        devengado ? Math.round(cobrado*100/devengado)+' % del devengado' : '')+
    kpi('Adeudado', fMoneda(adeudado), adeudado?'warn':'ok', ico('reloj'), impagas.length+' prestaciones')+
    kpi('Deuda a hoy', fMoneda(indexado), indexado>adeudado?'danger':'', ico('stats'), 'ajustada por IPC')+
  '</div>'+

  (adeudado ? '<div class="aviso '+(perdida > adeudado*0.15 ? 'danger':'warn')+'">'+ico('alerta')+
    '<div><b>Pérdida por exposición a la inflación: '+fMoneda(perdida)+'</b><br>'+
    'Es lo que la asociación resignó en poder adquisitivo por cobrar tarde: el saldo nominal de '+
    fMoneda(adeudado)+' equivale hoy a '+fMoneda(indexado)+'.'+
    (sinDato ? ' <b>Atención:</b> '+sinDato+' saldos abarcan meses sin IPC cargado, así que el ajuste está '+
      'subestimado.' : '')+'</div></div>' : '')+

  '<div class="grid c2">'+
    '<div class="card"><h3>'+ico('stats')+'Inflación</h3>'+
      (infl ? '<div class="tabla-wrap"><table><tbody>'+
        '<tr><td>Acumulada '+infl.meses+' meses ('+nombreMes(infl.desde)+' a '+nombreMes(infl.hasta)+')</td>'+
          '<td class="num"><b>'+fNum(infl.pct,1)+' %</b></td></tr>'+
        (proy ? '<tr><td>Promedio mensual (últimos 6 meses)</td><td class="num">'+fNum(proy.mensual,2)+' %</td></tr>'+
          '<tr><td>Proyección anualizada</td><td class="num"><b>'+fNum(proy.anual,1)+' %</b></td></tr>' : '')+
        '</tbody></table></div>'+
        '<p class="mini mt8">La proyección extrapola el promedio de los últimos seis meses. '+
        'Es una referencia de trabajo, no un pronóstico.</p>'
      : '<div class="aviso warn" style="margin:0">'+ico('alerta')+
        '<div>No hay IPC cargado. Cargalo en <b>Parámetros</b>.</div></div>')+
    '</div>'+
    '<div class="card"><h3>'+ico('reloj')+'Antigüedad de la deuda</h3>'+
      ctTablaAging(impagas)+
    '</div>'+
  '</div>'+

  ctTablaGrupo('Por anestesiólogo', porProf, 'Profesional')+
  '<div class="grid c2">'+
    ctTablaGrupo('Por institución', porInst, 'Institución')+
    ctTablaGrupo('Por financiador', porFin, 'Financiador')+
  '</div>'+

  '<div class="btn-row mt14">'+
    '<button class="btn ghost" id="ctExcel">'+ico('excel')+' Exportar a Excel</button>'+
    '<button class="btn ghost" id="ctImprimir">'+ico('imprimir')+' Informe PDF</button>'+
  '</div>';
}
function ctCablearPanel(){
  if($('#ctExcel'))     $('#ctExcel').onclick = () => exportarContableExcel(contDatos());
  if($('#ctImprimir'))  $('#ctImprimir').onclick = () => imprimirInformeContable(contDatos());
}

/* Agrupa sumando devengado, cobrado, saldo e indexado */
function ctAgrupar(l, fn){
  const m = {};
  l.forEach(x => {
    const k = fn(x) || '—';
    if(!m[k]) m[k] = { t:k, n:0, devengado:0, cobrado:0, saldo:0, indexado:0 };
    m[k].n++; m[k].devengado += x.monto; m[k].cobrado += x.cobrado;
    if(estaImpago(x)){
      m[k].saldo += x.saldo;
      m[k].indexado += indexarSaldo(x.saldo, x.mes).actualizado;
    }
  });
  return Object.values(m).sort((a,b) => b.devengado - a.devengado);
}
function ctTablaGrupo(titulo, datos, col){
  if(!datos.length) return '';
  const tot = datos.reduce((a,d) => ({
    n:a.n+d.n, devengado:a.devengado+d.devengado, cobrado:a.cobrado+d.cobrado,
    saldo:a.saldo+d.saldo, indexado:a.indexado+d.indexado
  }), {n:0,devengado:0,cobrado:0,saldo:0,indexado:0});
  return '<div class="card"><h3>'+ico('filtro')+esc(titulo)+'</h3><div class="tabla-wrap"><table>'+
    '<thead><tr><th>'+esc(col)+'</th><th class="num">N.º</th><th class="num">Devengado</th>'+
    '<th class="num">Cobrado</th><th class="num">Adeudado</th><th class="num">A hoy</th>'+
    '<th class="num">Cobranza</th></tr></thead><tbody>'+
    datos.map(d => '<tr><td>'+esc(d.t)+'</td><td class="num">'+d.n+'</td>'+
      '<td class="num">'+fMoneda(d.devengado)+'</td>'+
      '<td class="num">'+fMoneda(d.cobrado)+'</td>'+
      '<td class="num'+(d.saldo?' ':'')+'">'+fMoneda(d.saldo)+'</td>'+
      '<td class="num">'+(d.saldo ? fMoneda(d.indexado) : '—')+'</td>'+
      '<td class="num">'+(d.devengado ? fNum(d.cobrado*100/d.devengado,0)+' %' : '—')+'</td></tr>').join('')+
    '<tr style="font-weight:800;background:var(--panel-2)"><td>TOTAL</td><td class="num">'+tot.n+'</td>'+
      '<td class="num">'+fMoneda(tot.devengado)+'</td><td class="num">'+fMoneda(tot.cobrado)+'</td>'+
      '<td class="num">'+fMoneda(tot.saldo)+'</td><td class="num">'+fMoneda(tot.indexado)+'</td>'+
      '<td class="num">'+(tot.devengado?fNum(tot.cobrado*100/tot.devengado,0)+' %':'—')+'</td></tr>'+
    '</tbody></table></div></div>';
}

/* Tramos de antiguedad */
const TRAMOS_DEUDA = [
  { t:'Al día (0 a 30 días)',   min:0,   max:30,   cls:'ok'     },
  { t:'31 a 60 días',           min:31,  max:60,   cls:''       },
  { t:'61 a 90 días',           min:61,  max:90,   cls:'warn'   },
  { t:'91 a 180 días',          min:91,  max:180,  cls:'warn'   },
  { t:'181 a 365 días',         min:181, max:365,  cls:'danger' },
  { t:'Más de un año',          min:366, max:1e9,  cls:'danger' }
];
function ctTablaAging(impagas){
  if(!impagas.length) return '<div class="vacio" style="padding:20px">'+ico('check')+
    '<b>Sin deuda pendiente</b><span>Todas las prestaciones del período están cobradas.</span></div>';
  const filas = TRAMOS_DEUDA.map(t => {
    const g = impagas.filter(x => { const d = diasDeuda(x); return d >= t.min && d <= t.max; });
    return { t:t, n:g.length, monto:g.reduce((a,x) => a + x.saldo, 0),
             indexado:g.reduce((a,x) => a + indexarSaldo(x.saldo, x.mes).actualizado, 0) };
  }).filter(f => f.n);
  const total = filas.reduce((a,f) => a + f.monto, 0);
  return '<div class="tabla-wrap"><table><thead><tr><th>Antigüedad</th><th class="num">N.º</th>'+
    '<th class="num">Nominal</th><th class="num">A hoy</th><th class="num">%</th></tr></thead><tbody>'+
    filas.map(f => '<tr><td><span class="tag '+f.t.cls+'">'+esc(f.t.t)+'</span></td>'+
      '<td class="num">'+f.n+'</td><td class="num">'+fMoneda(f.monto)+'</td>'+
      '<td class="num">'+fMoneda(f.indexado)+'</td>'+
      '<td class="num">'+(total?fNum(f.monto*100/total,0):'0')+' %</td></tr>').join('')+
    '</tbody></table></div>';
}

/* ------------------------------------------------- 2. CARTERA Y DEUDA */
function ctCartera(){
  const l = contDatos().filter(estaImpago)
    .sort((a,b) => diasDeuda(b) - diasDeuda(a));
  const pf = paramsFiscales();
  const total = l.reduce((a,x) => a + x.saldo, 0);
  const moroso = l.filter(x => diasDeuda(x) > pf.diasAlerta);
  const incob  = l.filter(x => diasDeuda(x) > pf.diasIncobrable);

  return ''+
  '<div class="grid c4 mb8">'+
    kpi('Deuda total', fMoneda(total), 'warn', ico('dinero'), l.length+' prestaciones')+
    kpi('Morosa (+'+pf.diasAlerta+' d)', fMoneda(moroso.reduce((a,x)=>a+x.saldo,0)),
        moroso.length?'danger':'ok', ico('alerta'), moroso.length+' prestaciones')+
    kpi('Incobrable (+'+pf.diasIncobrable+' d)', fMoneda(incob.reduce((a,x)=>a+x.saldo,0)),
        incob.length?'danger':'ok', ico('equis'), incob.length+' prestaciones')+
    kpi('Días promedio', fNum(l.length ? l.reduce((a,x)=>a+diasDeuda(x),0)/l.length : 0, 0),
        'azul', ico('reloj'), 'de antigüedad')+
  '</div>'+

  '<div class="card"><h3>'+ico('lista')+'Detalle de la deuda</h3>'+
    (l.length ? '<div class="tabla-wrap"><table><thead><tr>'+
      '<th>Mes</th><th>Concepto</th><th>Profesional</th><th>Institución</th><th>Financiador</th>'+
      '<th class="num">Saldo</th><th class="num">Días</th><th class="num">A hoy</th><th>Estado</th>'+
      '</tr></thead><tbody>'+
      l.map(x => {
        const d = diasDeuda(x);
        const r = indexarSaldo(x.saldo, x.mes);
        const cls = d > pf.diasIncobrable ? 'danger' : (d > pf.diasAlerta ? 'warn' : '');
        return '<tr>'+
          '<td>'+esc(nombreMes(x.mes))+'</td>'+
          '<td><span class="tag '+(x.tipo==='consulta'?'aqua':'info')+'">'+
            (x.tipo==='consulta'?'Consulta':'Acto')+'</span></td>'+
          '<td>'+esc(nombreUsuario(x.uid))+'</td>'+
          '<td>'+esc(x.institucion)+'</td>'+
          '<td>'+esc(x.financiador)+'</td>'+
          '<td class="num">'+fMoneda(x.saldo)+'</td>'+
          '<td class="num"><span class="tag '+cls+'">'+d+'</span></td>'+
          '<td class="num">'+fMoneda(r.actualizado)+'</td>'+
          '<td>'+etiquetaEstadoFact(x.estado)+'</td></tr>';
      }).join('')+
      '<tr style="font-weight:800;background:var(--panel-2)"><td colspan="5">TOTAL</td>'+
      '<td class="num">'+fMoneda(total)+'</td><td></td>'+
      '<td class="num">'+fMoneda(l.reduce((a,x)=>a+indexarSaldo(x.saldo,x.mes).actualizado,0))+'</td>'+
      '<td></td></tr></tbody></table></div>'
    : '<div class="vacio">'+ico('check')+'<b>Sin deuda</b>'+
      '<span>No hay prestaciones impagas en el período.</span></div>')+
  '</div>'+

  '<div class="btn-row mt14">'+
    '<button class="btn ghost" id="ctDeudaExcel">'+ico('excel')+' Exportar deuda</button>'+
    '<button class="btn pri" id="ctReclamar">'+ico('correo')+' Abrir reclamo interno</button>'+
  '</div>';
}
function ctCablearCartera(){
  if($('#ctDeudaExcel')) $('#ctDeudaExcel').onclick =
    () => exportarContableExcel(contDatos().filter(estaImpago), 'deuda');
  if($('#ctReclamar')) $('#ctReclamar').onclick = () => componerHilo('coordinador',
    'Gestión de cobranza — saldos vencidos');
}

/* ---------------------------------------------------- 3. INDEXACION */
function ctIndexacion(){
  const l = contDatos().filter(estaImpago);
  const proy = proyeccionAnual(6);
  const kProy = proy ? Math.pow(1 + proy.mensual/100, 12) : 1;

  /* Por anestesiologo y por institucion, discriminado */
  const armar = fn => {
    const m = {};
    l.forEach(x => {
      const k = fn(x) || '—';
      const r = indexarSaldo(x.saldo, x.mes);
      if(!m[k]) m[k] = { t:k, n:0, nominal:0, hoy:0, perdida:0, proy:0, sinDato:0 };
      m[k].n++; m[k].nominal += x.saldo; m[k].hoy += r.actualizado;
      m[k].perdida += r.perdida; m[k].proy += r.actualizado * kProy;
      if(r.mesesSinDato) m[k].sinDato++;
    });
    return Object.values(m).sort((a,b) => b.nominal - a.nominal);
  };
  const tabla = (titulo, datos, col) => {
    if(!datos.length) return '';
    const t = datos.reduce((a,d) => ({ n:a.n+d.n, nominal:a.nominal+d.nominal, hoy:a.hoy+d.hoy,
      perdida:a.perdida+d.perdida, proy:a.proy+d.proy }), {n:0,nominal:0,hoy:0,perdida:0,proy:0});
    return '<div class="card"><h3>'+ico('stats')+esc(titulo)+'</h3><div class="tabla-wrap"><table>'+
      '<thead><tr><th>'+esc(col)+'</th><th class="num">N.º</th><th class="num">Nominal</th>'+
      '<th class="num">A hoy</th><th class="num">Pérdida</th><th class="num">Proyectado 12 m</th>'+
      '</tr></thead><tbody>'+
      datos.map(d => '<tr><td>'+esc(d.t)+(d.sinDato?' <span class="tag warn">IPC incompleto</span>':'')+'</td>'+
        '<td class="num">'+d.n+'</td><td class="num">'+fMoneda(d.nominal)+'</td>'+
        '<td class="num">'+fMoneda(d.hoy)+'</td>'+
        '<td class="num" style="color:var(--danger)">'+fMoneda(d.perdida)+'</td>'+
        '<td class="num">'+fMoneda(d.proy)+'</td></tr>').join('')+
      '<tr style="font-weight:800;background:var(--panel-2)"><td>TOTAL</td><td class="num">'+t.n+'</td>'+
        '<td class="num">'+fMoneda(t.nominal)+'</td><td class="num">'+fMoneda(t.hoy)+'</td>'+
        '<td class="num">'+fMoneda(t.perdida)+'</td><td class="num">'+fMoneda(t.proy)+'</td></tr>'+
      '</tbody></table></div></div>';
  };

  const faltantes = ctMesesSinIPC();

  return ''+
  (faltantes.length ? '<div class="aviso danger">'+ico('alerta')+'<div><b>'+
    (faltantes.length === 1 ? 'Falta 1 mes de IPC.' : 'Faltan '+faltantes.length+' meses de IPC.')+
    '</b><br>Sin ese dato la actualización queda subestimada. '+
    (faltantes.length === 1 ? 'Mes sin dato: ' : 'Meses sin dato: ')+
    esc(faltantes.slice(0,14).map(nombreMes).join(', '))+
    (faltantes.length>14?' y '+(faltantes.length-14)+' más':'')+
    '.<br>Cargalo en <b>Parámetros → Índice de precios</b>.</div></div>' : '')+

  (proy ? '<div class="aviso info">'+ico('stats')+'<div><b>Coeficiente de proyección anual: '+
    fNum((kProy-1)*100,1)+' %.</b><br>Surge de anualizar el promedio mensual de los últimos seis meses '+
    'cargados ('+fNum(proy.mensual,2)+' % mensual). Sirve para dimensionar cuánto vale hoy un saldo '+
    'que se cobre dentro de un año, no para pronosticar la inflación.</div></div>' : '')+

  tabla('Saldos indexados por anestesiólogo', armar(x => nombreUsuario(x.uid) || 'Sin asignar'), 'Profesional')+
  tabla('Saldos indexados por institución', armar(x => x.institucion), 'Institución')+
  tabla('Saldos indexados por financiador', armar(x => x.financiador), 'Financiador')+

  '<div class="card"><h3>'+ico('info')+'Cómo se calcula</h3>'+
    '<ul class="mini" style="padding-left:18px;line-height:1.9">'+
    '<li><b>Nominal:</b> el saldo tal como fue facturado.</li>'+
    '<li><b>A hoy:</b> el nominal multiplicado por el coeficiente de IPC acumulado desde el mes de la '+
      'prestación hasta el mes corriente. Se compone mes a mes: (1+i₁)×(1+i₂)×…</li>'+
    '<li><b>Pérdida:</b> la diferencia entre ambos. Es el poder adquisitivo que se resignó por cobrar tarde.</li>'+
    '<li><b>Proyectado 12 m:</b> el valor a hoy llevado doce meses más con la inflación proyectada. '+
      'Responde a «si esto se cobra recién dentro de un año, ¿cuánto habría que reclamar?».</li>'+
    '</ul></div>';
}
function ctMesesSinIPC(){
  const t = ipcTabla();
  const l = prestacionesContables().filter(estaImpago);
  if(!l.length) return [];
  const min = l.reduce((a,x) => (!a || x.mes < a) ? x.mes : a, '');
  const hoy = mesDe(hoyISO());
  const out = [];
  if(!min) return out;
  let m = sumarMeses(min, 1);
  while(m <= hoy){ if(!isFinite(Number(t[m]))) out.push(m); m = sumarMeses(m, 1); }
  return out;
}

/* ------------------------------------------------ 4. SITUACION FISCAL */
function ctFiscal(){
  const hasta = contPeriodo().hasta;
  const desde12 = sumarMeses(hasta, -11);
  const todo = prestacionesContables();
  const pf = paramsFiscales();

  const filas = socios().map(u => {
    const suyas = todo.filter(x => x.uid === u.uid);
    const anual = suyas.filter(x => x.mes >= desde12 && x.mes <= hasta)
                       .reduce((a,x) => a + x.monto, 0);
    const cobradoAnual = suyas.filter(x => x.mes >= desde12 && x.mes <= hasta)
                              .reduce((a,x) => a + x.cobrado, 0);
    const cat = categoriaMonotributo(anual);
    /* Ritmo de los ultimos 3 meses, anualizado */
    const ult3 = suyas.filter(x => x.mes > sumarMeses(hasta, -3) && x.mes <= hasta)
                      .reduce((a,x) => a + x.monto, 0);
    const ritmoAnual = ult3 * 4;
    const catProy = categoriaMonotributo(ritmoAnual);
    return { u:u, anual:anual, cobradoAnual:cobradoAnual, cat:cat,
             ritmoAnual:ritmoAnual, catProy:catProy };
  }).sort((a,b) => b.anual - a.anual);

  const vig = monotributoVigencia();
  const precargado = monotributoEsPrecargado();

  return ''+
  (precargado ? '<div class="aviso danger">'+ico('alerta')+'<div><b>Escala de monotributo sin confirmar.</b><br>'+
    'Está cargada la de referencia ('+esc(vig)+'). Las escalas se actualizan por semestre: '+
    'reemplazala por la vigente en <b>Parámetros → Monotributo</b> antes de tomar decisiones.</div></div>'
  : '<div class="aviso info">'+ico('check')+'<div>Escala en uso: <b>'+esc(vig)+'</b>.</div></div>')+

  '<div class="card"><h3>'+ico('archivo')+'Categorización por anestesiólogo</h3>'+
    '<p class="mini mb8">Ingresos brutos devengados de los últimos doce meses ('+nombreMes(desde12)+
    ' a '+nombreMes(hasta)+') contra los topes de la escala de locación de servicios.</p>'+
    (filas.length ? '<div class="tabla-wrap"><table><thead><tr>'+
      '<th>Profesional</th><th>CUIT</th><th>Condición</th><th class="num">Devengado 12 m</th>'+
      '<th class="num">Cobrado 12 m</th><th>Categoría</th><th class="num">Uso del tope</th>'+
      '<th class="num">Margen</th><th>Proyección</th></tr></thead><tbody>'+
      filas.map(f => {
        const cls = f.cat.excedido ? 'danger' : (f.cat.usoPct > 90 ? 'danger'
                   : (f.cat.usoPct > 75 ? 'warn' : 'ok'));
        const salto = !f.cat.excedido && f.catProy.cat !== f.cat.cat;
        return '<tr>'+
          '<td>'+esc(f.u.apellido+', '+f.u.nombre)+'</td>'+
          '<td>'+esc(f.u.cuit || '—')+'</td>'+
          '<td>'+esc(f.u.condicionIva || '—')+'</td>'+
          '<td class="num">'+fMoneda(f.anual)+'</td>'+
          '<td class="num">'+fMoneda(f.cobradoAnual)+'</td>'+
          '<td><span class="tag '+cls+'">'+esc(f.cat.cat)+'</span></td>'+
          '<td class="num">'+fNum(f.cat.usoPct,0)+' %</td>'+
          '<td class="num">'+(f.cat.excedido ? 'excedido' : fMoneda(f.cat.margen))+'</td>'+
          '<td>'+(f.cat.excedido
            ? '<span class="tag danger">Fuera de escala</span>'
            : (salto ? '<span class="tag warn">Iría a '+esc(f.catProy.cat)+'</span>'
                     : '<span class="tag ok">Estable</span>'))+'</td></tr>';
      }).join('')+
    '</tbody></table></div>'
    : '<div class="vacio">'+ico('usuario')+'<b>Sin anestesiólogos habilitados</b></div>')+
  '</div>'+

  '<div class="card"><h3>'+ico('alerta')+'Situaciones a resolver</h3>'+
    (() => {
      const av = [];
      filas.forEach(f => {
        if(f.cat.excedido) av.push(['danger', f.u.apellido+', '+f.u.nombre+' supera el tope máximo de la escala. '+
          'Corresponde evaluar el pase a responsable inscripto y la exclusión del régimen simplificado.']);
        else if(f.cat.usoPct > 90) av.push(['danger', f.u.apellido+', '+f.u.nombre+' usó el '+
          fNum(f.cat.usoPct,0)+' % del tope de la categoría '+f.cat.cat+'. Queda un margen de '+
          fMoneda(f.cat.margen)+'.']);
        else if(f.catProy.cat !== f.cat.cat && !f.catProy.excedido)
          av.push(['warn', f.u.apellido+', '+f.u.nombre+': al ritmo de los últimos tres meses '+
            'terminaría el año en categoría '+f.catProy.cat+' (hoy '+f.cat.cat+'). '+
            'Anticipar la recategorización.']);
        if(!f.u.cuit) av.push(['warn', f.u.apellido+', '+f.u.nombre+' no tiene CUIT cargado en su perfil. '+
          'Sin CUIT no se puede emitir el comprobante.']);
        if(!f.u.condicionIva) av.push(['warn', f.u.apellido+', '+f.u.nombre+
          ' no declaró su condición frente al IVA.']);
      });
      if(!av.length) return '<div class="aviso ok" style="margin:0">'+ico('check')+
        '<div>No hay situaciones pendientes de resolver.</div></div>';
      return av.map(a => '<div class="aviso '+a[0]+'">'+ico(a[0]==='danger'?'alerta':'info')+
        '<div>'+esc(a[1])+'</div></div>').join('');
    })()+
  '</div>'+

  '<div class="card"><h3>'+ico('calendario')+'Calendario de obligaciones</h3>'+
    '<div class="tabla-wrap"><table><thead><tr><th>Obligación</th><th>Periodicidad</th>'+
    '<th>Alcanza a</th><th>Referencia</th></tr></thead><tbody>'+
    [['Cuota del monotributo','Mensual','Monotributistas','Vence según terminación de CUIT'],
     ['Recategorización','Semestral (enero y julio)','Monotributistas','Sobre los 12 meses anteriores'],
     ['IVA — declaración jurada','Mensual','Responsables inscriptos',
      'Alícuota general '+fNum(pf.ivaAlicuota,1)+' %; prestaciones de salud '+fNum(pf.ivaSalud,1)+' %'],
     ['Ingresos Brutos','Mensual','Todos los que facturan',
      'Tierra del Fuego, '+fNum(pf.iibbAlicuota,1)+' %'],
     ['Ganancias — anticipos','Bimestral','Responsables inscriptos','Según declaración anterior'],
     ['Ganancias — declaración jurada','Anual','Responsables inscriptos','Ejercicio calendario'],
     ['Bienes Personales','Anual','Según patrimonio','Sobre bienes al 31 de diciembre'],
     ['Libro IVA Digital','Mensual','Responsables inscriptos','Registro de comprobantes']
    ].map(r => '<tr><td><b>'+esc(r[0])+'</b></td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td>'+
      '<td class="mini">'+esc(r[3])+'</td></tr>').join('')+
    '</tbody></table></div>'+
    '<div class="aviso warn mt8" style="margin-bottom:0">'+ico('info')+'<div>Los vencimientos concretos '+
      'los fija ARCA cada año. Este calendario es un recordatorio de qué hay que presentar, no un '+
      'almanaque de fechas.</div></div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('dinero')+'Retenciones a considerar</h3>'+
    '<div class="tabla-wrap"><table><thead><tr><th>Concepto</th><th class="num">Alícuota</th>'+
    '<th>Quién retiene</th></tr></thead><tbody>'+
    '<tr><td>Retención de Ganancias sobre honorarios</td><td class="num">'+fNum(pf.retencionGanancias,1)+
      ' %</td><td>Financiadores designados agentes de retención</td></tr>'+
    '<tr><td>Retención de IVA</td><td class="num">'+fNum(pf.retencionIva,1)+
      ' %</td><td>Sobre el IVA facturado, responsables inscriptos</td></tr>'+
    '<tr><td>Retención de Ingresos Brutos</td><td class="num">'+fNum(pf.iibbAlicuota,1)+
      ' %</td><td>Agentes de recaudación provinciales</td></tr>'+
    '</tbody></table></div>'+
    '<p class="mini mt8">Las retenciones sufridas son pago a cuenta: hay que computarlas en la '+
    'declaración del período y reclamar los certificados al financiador que las practicó.</p></div>';
}

/* ------------------------------------------------- 5. RECOMENDACIONES */
function ctConsejos(){
  const pf = paramsFiscales();
  const l = contDatos().filter(estaImpago);
  const proy = proyeccionAnual(6);
  const mensual = proy ? proy.mensual : 0;
  const c = [];

  /* --- Deuda por tramos --- */
  const t60  = l.filter(x => diasDeuda(x) > pf.diasAlerta && diasDeuda(x) <= 180);
  const t180 = l.filter(x => diasDeuda(x) > 180 && diasDeuda(x) <= pf.diasIncobrable);
  const t365 = l.filter(x => diasDeuda(x) > pf.diasIncobrable);

  if(t60.length) c.push({ n:'warn', i:'reloj',
    t:'Reclamar formalmente '+t60.length+' prestaciones por '+
      fMoneda(t60.reduce((a,x)=>a+x.saldo,0)),
    d:'Superaron los '+pf.diasAlerta+' días. A esta altura conviene la intimación por medio fehaciente: '+
      'corta la prescripción, deja constancia y habilita el reclamo de intereses. '+
      'Con una inflación mensual del '+fNum(mensual,1)+' %, cada mes de demora les quita '+
      fMoneda(t60.reduce((a,x)=>a+x.saldo,0) * mensual/100)+' de poder adquisitivo.' });

  if(t180.length) c.push({ n:'danger', i:'alerta',
    t:'Gestión intensiva sobre '+fMoneda(t180.reduce((a,x)=>a+x.saldo,0))+' con más de 180 días',
    d:'Pasado el semestre la probabilidad de cobro cae fuerte. Corresponde escalar: nota a la '+
      'gerencia del financiador, mesa de trabajo con la institución y, si no hay respuesta, '+
      'evaluar la vía judicial. Documentar cada gestión.' });

  if(t365.length) c.push({ n:'danger', i:'equis',
    t:'Evaluar previsión por incobrabilidad: '+fMoneda(t365.reduce((a,x)=>a+x.saldo,0)),
    d:'Con más de un año de mora y gestiones de cobro documentadas sin resultado, estos saldos '+
      'reúnen los índices de incobrabilidad que admite la ley de Ganancias. Deducirlos reduce la '+
      'carga fiscal de quien ya tributó por un ingreso que nunca entró. Requiere respaldo: '+
      'intimaciones, respuestas y constancia de la gestión.' });

  /* --- Cuando indexar --- */
  const umbral = 10;
  const paraIndexar = l.filter(x => {
    const r = indexarSaldo(x.saldo, x.mes);
    return (r.coeficiente - 1) * 100 >= umbral;
  });
  if(paraIndexar.length){
    const nom = paraIndexar.reduce((a,x)=>a+x.saldo,0);
    const act = paraIndexar.reduce((a,x)=>a+indexarSaldo(x.saldo,x.mes).actualizado,0);
    c.push({ n:'danger', i:'stats',
      t:'Momento de renegociar valores: '+paraIndexar.length+' prestaciones perdieron más del '+umbral+' %',
      d:'Su valor nominal es '+fMoneda(nom)+' y a moneda de hoy equivalen a '+fMoneda(act)+
        ' ('+fMoneda(act-nom)+' de diferencia). Cuando la brecha supera el '+umbral+' % conviene '+
        'reclamar el ajuste por IPC o, si el convenio no lo prevé, usar este número como argumento '+
        'para renegociar el valor de la unidad anestésica hacia adelante.' });
  }

  /* --- Valor de la unidad por financiador --- */
  const porFin = ctAgrupar(contDatos(), x => x.financiador);
  const malPagador = porFin.filter(f => f.devengado > 0 && f.cobrado / f.devengado < 0.5 && f.saldo > 0);
  if(malPagador.length) c.push({ n:'warn', i:'filtro',
    t:'Financiadores con cobranza por debajo del 50 %',
    d: malPagador.map(f => f.t + ' (' + fNum(f.cobrado*100/f.devengado,0) + ' % cobrado, ' +
       fMoneda(f.saldo) + ' pendiente)').join(' · ') +
       '. Conviene revisar el convenio: plazos de pago, penalidad por mora y ajuste automático. '+
       'Un financiador que paga tarde en un contexto inflacionario está pagando menos.' });

  /* --- Prestaciones sin comprobante --- */
  const sinComp = contDatos().filter(x => !x.comprobante &&
    ['Presentado','Facturado','Cobrado'].indexOf(x.estado) >= 0);
  if(sinComp.length) c.push({ n:'warn', i:'archivo',
    t:sinComp.length+' prestaciones facturadas sin número de comprobante',
    d:'Sin el número no se puede conciliar el cobro ni respaldar la deducción. '+
      'Pedirle a cada anestesiólogo que complete el dato en su ficha de honorarios.' });

  /* --- Presentaciones atrasadas --- */
  const sinPresentar = contDatos().filter(x => x.estado === 'Pendiente' &&
    diasDeuda(x) > pf.diasPlazoNormal);
  if(sinPresentar.length) c.push({ n:'danger', i:'campana',
    t: sinPresentar.length === 1 ? 'Una prestación nunca se presentó a cobro'
                                 : sinPresentar.length+' prestaciones nunca se presentaron a cobro',
    d:'Por '+fMoneda(sinPresentar.reduce((a,x)=>a+x.saldo,0))+'. '+
      (sinPresentar.length === 1 ? 'Sigue' : 'Siguen')+' en estado «Pendiente» pasados '+
      pf.diasPlazoNormal+' días. Es plata devengada que ni siquiera empezó el circuito de cobro: '+
      'es lo primero a destrabar, porque el plazo del financiador recién arranca cuando se presenta.' });

  /* --- IPC incompleto --- */
  const faltan = ctMesesSinIPC();
  if(faltan.length) c.push({ n:'danger', i:'alerta',
    t: faltan.length === 1 ? 'Cargar el mes de IPC pendiente'
                           : 'Cargar '+faltan.length+' meses de IPC pendientes',
    d:'Sin la serie completa toda la indexación de este portal queda subestimada y las '+
      'recomendaciones pierden precisión. Es la tarea de mantenimiento más importante: '+
      'cinco minutos por mes en Parámetros.' });

  /* --- Monotributo --- */
  if(monotributoEsPrecargado()) c.push({ n:'danger', i:'archivo',
    t:'Confirmar la escala del monotributo',
    d:'Está en uso la escala de referencia precargada. Se actualiza cada semestre: mientras no se '+
      'reemplace por la vigente, las categorías y los márgenes que muestra el portal son orientativos.' });

  if(!c.length) c.push({ n:'ok', i:'check', t:'No hay acciones pendientes',
    d:'La cartera está al día, la serie de IPC completa y la escala fiscal confirmada.' });

  return ''+
  '<div class="aviso info">'+ico('guias')+'<div>Recomendaciones generadas a partir de los datos '+
    'cargados. Son un apoyo a la decisión profesional del contador, no un dictamen: cada situación '+
    'concreta exige su propio análisis.</div></div>'+

  c.map(x => '<div class="card"><h3>'+ico(x.i)+esc(x.t)+'</h3>'+
    '<p style="margin:0;line-height:1.7">'+esc(x.d)+'</p></div>').join('')+

  '<div class="card"><h3>'+ico('info')+'Criterio general para indexar</h3>'+
    '<div class="tabla-wrap"><table><thead><tr><th>Situación</th><th>Qué conviene hacer</th>'+
    '</tr></thead><tbody>'+
    [['Deuda de menos de 30 días','Nada. Está dentro del plazo normal de pago.'],
     ['Deuda de 30 a 60 días','Seguimiento. Confirmar que la presentación fue recibida y conformada.'],
     ['Pérdida acumulada menor al 10 %','Reclamar el capital. El ajuste todavía no justifica el desgaste.'],
     ['Pérdida acumulada del 10 al 25 %','Reclamar con ajuste por IPC. Dejar asentado el cálculo en la intimación.'],
     ['Pérdida acumulada mayor al 25 %','Ajuste innegociable y revisión del convenio hacia adelante.'],
     ['Más de un año sin cobrar','Previsión por incobrabilidad y evaluación de la vía judicial.']
    ].map(r => '<tr><td><b>'+esc(r[0])+'</b></td><td>'+esc(r[1])+'</td></tr>').join('')+
    '</tbody></table></div></div>'+

  '<div class="btn-row mt14">'+
    '<button class="btn pri" id="ctConsejoReclamo">'+ico('correo')+
      ' Comunicar estas conclusiones</button></div>';
}
function ctCablearConsejos(){
  if($('#ctConsejoReclamo')) $('#ctConsejoReclamo').onclick =
    () => componerHilo('coordinador', 'Informe de cobranzas y situación fiscal');
}

/* ------------------------------------------------------ 6. PARAMETROS */
function ctParametros(){
  const t = ipcTabla();
  const meses = ipcMeses();
  const cats = monotributoTabla();
  const pf = paramsFiscales();
  const hoy = mesDe(hoyISO());

  return ''+
  '<div class="card"><h3>'+ico('stats')+'Índice de precios al consumidor (INDEC)</h3>'+
    (ipcEsPrecargado() ? '<div class="aviso warn">'+ico('alerta')+'<div>Serie precargada de referencia, '+
      'hasta '+nombreMes(IPC_PRECARGADO_HASTA)+'. Verificala y completala contra la publicación del INDEC.'+
      '</div></div>' : '')+
    '<p class="mini mb8">Variación mensual, nivel general, en por ciento. Al guardar, la serie se '+
    'replica a todos los dispositivos de la asociación.</p>'+
    '<div class="grid c3" style="align-items:end">'+
      '<div class="campo"><label>Mes</label><input type="month" id="ipcMes" value="'+esc(hoy)+'"></div>'+
      '<div class="campo"><label>Variación (%)</label>'+
        '<input type="number" step="0.01" id="ipcValor" placeholder="2,40"></div>'+
      '<div class="campo"><button class="btn pri full" id="ipcAgregar">'+ico('mas')+' Cargar mes</button></div>'+
    '</div>'+
    (meses.length ? '<div class="tabla-wrap mt8" style="max-height:280px;overflow:auto"><table>'+
      '<thead><tr><th>Mes</th><th class="num">Variación</th><th class="num">Acumulado 12 m</th>'+
      '<th></th></tr></thead><tbody>'+
      meses.slice().reverse().map(m => {
        const doce = coeficienteIPC(sumarMeses(m, -12), m);
        return '<tr><td>'+esc(nombreMes(m))+'</td>'+
          '<td class="num">'+fNum(Number(t[m]),2)+' %</td>'+
          '<td class="num">'+(doce.faltan ? '—' : fNum((doce.k-1)*100,1)+' %')+'</td>'+
          '<td class="num"><button class="btn ghost chico" data-ipcdel="'+esc(m)+'">'+
            ico('borrar')+'</button></td></tr>';
      }).join('')+'</tbody></table></div>' : '')+
  '</div>'+

  '<div class="card"><h3>'+ico('archivo')+'Escala del monotributo</h3>'+
    '<div class="aviso '+(monotributoEsPrecargado()?'warn':'info')+'">'+
      ico(monotributoEsPrecargado()?'alerta':'check')+'<div>'+
      (monotributoEsPrecargado()
        ? 'Escala de referencia sin confirmar. Reemplazala por la vigente y guardá.'
        : 'Escala confirmada: '+esc(monotributoVigencia()))+'</div></div>'+
    '<div class="campo"><label>Identificación de la escala</label>'+
      '<input type="text" id="mtVigencia" value="'+esc(monotributoVigencia())+'" '+
      'placeholder="Escala vigente desde enero de 2026"></div>'+
    '<p class="mini mb8">Tope de ingresos brutos anuales por locación de servicios y componentes '+
    'mensuales de la cuota.</p>'+
    '<div class="tabla-wrap"><table><thead><tr><th>Cat.</th><th class="num">Tope anual</th>'+
    '<th class="num">Impuesto</th><th class="num">SIPA</th><th class="num">Obra social</th>'+
    '<th class="num">Cuota</th></tr></thead><tbody>'+
    cats.map((c,i) => '<tr><td><b>'+esc(c.cat)+'</b></td>'+
      '<td class="num"><input type="number" step="0.01" data-mt="'+i+'" data-campo="ingresos" '+
        'value="'+esc(c.ingresos)+'" style="width:130px;text-align:right"></td>'+
      '<td class="num"><input type="number" step="0.01" data-mt="'+i+'" data-campo="impuesto" '+
        'value="'+esc(c.impuesto)+'" style="width:95px;text-align:right"></td>'+
      '<td class="num"><input type="number" step="0.01" data-mt="'+i+'" data-campo="sipa" '+
        'value="'+esc(c.sipa)+'" style="width:95px;text-align:right"></td>'+
      '<td class="num"><input type="number" step="0.01" data-mt="'+i+'" data-campo="obraSocial" '+
        'value="'+esc(c.obraSocial)+'" style="width:95px;text-align:right"></td>'+
      '<td class="num">'+fMoneda(Number(c.impuesto||0)+Number(c.sipa||0)+Number(c.obraSocial||0))+
      '</td></tr>').join('')+
    '</tbody></table></div>'+
    '<div class="btn-row mt8"><button class="btn pri" id="mtGuardar">'+ico('check')+
      ' Guardar escala</button></div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('ajustes')+'Alícuotas y plazos</h3>'+
    '<div class="grid c3">'+
      campoNum('pfIva','IVA general (%)', pf.ivaAlicuota, 'step="0.1"')+
      campoNum('pfIvaSalud','IVA salud (%)', pf.ivaSalud, 'step="0.1"')+
      campoNum('pfIibb','Ingresos Brutos (%)', pf.iibbAlicuota, 'step="0.1"')+
    '</div>'+
    '<div class="grid c3">'+
      campoNum('pfRetGan','Retención Ganancias (%)', pf.retencionGanancias, 'step="0.1"')+
      campoNum('pfRetIva','Retención IVA (%)', pf.retencionIva, 'step="0.1"')+
      campoNum('pfPlazo','Plazo de pago normal (días)', pf.diasPlazoNormal)+
    '</div>'+
    '<div class="grid c2">'+
      campoNum('pfAlerta','Mora a partir de (días)', pf.diasAlerta)+
      campoNum('pfIncob','Incobrable a partir de (días)', pf.diasIncobrable)+
    '</div>'+
    '<div class="btn-row mt8"><button class="btn pri" id="pfGuardarFisc">'+ico('check')+
      ' Guardar parámetros</button></div>'+
  '</div>';
}
function ctCablearParametros(){
  $('#ipcAgregar').onclick = () => {
    const m = $('#ipcMes').value, v = Number($('#ipcValor').value);
    if(!m) return toast('Elegí el mes.', 'err');
    if(!isFinite(v)) return toast('Cargá la variación del mes.', 'err');
    const t = Object.assign({}, ipcTabla()); t[m] = v;
    guardarIpc(t, USUARIO ? (USUARIO.apellido+', '+USUARIO.nombre) : 'Contable');
    auditar('ipc-carga', nombreMes(m) + ': ' + v + ' %');
    toast('IPC de ' + nombreMes(m) + ' cargado.', 'ok');
    vistaContable();
  };
  $$('#ctCuerpo [data-ipcdel]').forEach(b => b.onclick = () => {
    const m = b.dataset.ipcdel;
    const t = Object.assign({}, ipcTabla()); delete t[m];
    guardarIpc(t, USUARIO ? (USUARIO.apellido+', '+USUARIO.nombre) : 'Contable');
    auditar('ipc-borrado', nombreMes(m));
    vistaContable();
  });
  $('#mtGuardar').onclick = () => {
    const cats = monotributoTabla().map(c => Object.assign({}, c));
    $$('#ctCuerpo [data-mt]').forEach(i => {
      const f = cats[Number(i.dataset.mt)];
      if(f) f[i.dataset.campo] = Number(i.value) || 0;
    });
    guardarMonotributo(cats, $('#mtVigencia').value.trim() || 'Escala sin identificar',
      USUARIO ? (USUARIO.apellido+', '+USUARIO.nombre) : 'Contable');
    auditar('monotributo', 'Escala actualizada');
    toast('Escala guardada.', 'ok');
    vistaContable();
  };
  $('#pfGuardarFisc').onclick = () => {
    guardarParamsFiscales({
      ivaAlicuota:Number(val('pfIva'))||0, ivaSalud:Number(val('pfIvaSalud'))||0,
      iibbAlicuota:Number(val('pfIibb'))||0, retencionGanancias:Number(val('pfRetGan'))||0,
      retencionIva:Number(val('pfRetIva'))||0, diasPlazoNormal:Number(val('pfPlazo'))||30,
      diasAlerta:Number(val('pfAlerta'))||60, diasIncobrable:Number(val('pfIncob'))||365
    }, USUARIO ? (USUARIO.apellido+', '+USUARIO.nombre) : 'Contable');
    auditar('params-fiscales', 'Alícuotas y plazos actualizados');
    toast('Parámetros guardados.', 'ok');
    vistaContable();
  };
}

/* ------------------------------------------------------ Exportaciones */
function exportarContableExcel(l, sufijo){
  const filas = l.map(x => ({
    Mes: nombreMes(x.mes), Fecha: fFecha(x.fecha),
    Concepto: x.tipo === 'consulta' ? 'Consulta prequirúrgica' : 'Acto anestésico',
    Profesional: nombreUsuario(x.uid), Institucion: x.institucion, Financiador: x.financiador,
    UA: x.ua || '', ValorUnidad: x.valorUnidad || '', Adicional: x.pctAdicional + ' %',
    Devengado: x.monto, Cobrado: x.cobrado, Saldo: x.saldo,
    Dias: diasDeuda(x), Indexado: Math.round(indexarSaldo(x.saldo, x.mes).actualizado * 100) / 100,
    Estado: x.estado, Comprobante: x.comprobante
  }));
  const cols = filas.length ? Object.keys(filas[0]) : [];
  const html = '<html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>'+
    cols.map(c => '<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+
    filas.map(f => '<tr>'+cols.map(c => '<td>'+esc(f[c])+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></body></html>';
  descargar('afar-contable-'+(sufijo||'prestaciones')+'-'+hoyISO()+'.xls', html,
    'application/vnd.ms-excel');
}
function imprimirInformeContable(l){
  const dev = l.reduce((a,x)=>a+x.monto,0), cob = l.reduce((a,x)=>a+x.cobrado,0);
  const imp = l.filter(estaImpago);
  const sal = imp.reduce((a,x)=>a+x.saldo,0);
  const idx = imp.reduce((a,x)=>a+indexarSaldo(x.saldo,x.mes).actualizado,0);
  const p = contPeriodo();
  const grupo = (titulo, datos, col) => '<h3>'+titulo+'</h3><table><thead><tr><th>'+col+
    '</th><th>N.º</th><th>Devengado</th><th>Cobrado</th><th>Adeudado</th><th>A hoy</th></tr></thead><tbody>'+
    datos.map(d => '<tr><td>'+esc(d.t)+'</td><td>'+d.n+'</td><td>'+fMoneda(d.devengado)+'</td>'+
      '<td>'+fMoneda(d.cobrado)+'</td><td>'+fMoneda(d.saldo)+'</td>'+
      '<td>'+fMoneda(d.indexado)+'</td></tr>').join('')+'</tbody></table>';
  $('#areaImpresion').innerHTML =
    '<div class="doc"><h1>AFAR — Informe contable</h1>'+
    '<p><b>Período:</b> '+nombreMes(p.desde)+' a '+nombreMes(p.hasta)+
    ' · <b>Emitido:</b> '+fFechaLarga(hoyISO())+'</p>'+
    '<table><tbody>'+
      '<tr><td>Devengado</td><td>'+fMoneda(dev)+'</td></tr>'+
      '<tr><td>Cobrado</td><td>'+fMoneda(cob)+'</td></tr>'+
      '<tr><td>Adeudado (nominal)</td><td>'+fMoneda(sal)+'</td></tr>'+
      '<tr><td>Adeudado a moneda de hoy</td><td>'+fMoneda(idx)+'</td></tr>'+
      '<tr><td>Pérdida por inflación</td><td>'+fMoneda(idx-sal)+'</td></tr>'+
    '</tbody></table>'+
    grupo('Por anestesiólogo', ctAgrupar(l, x => nombreUsuario(x.uid) || 'Sin asignar'), 'Profesional')+
    grupo('Por institución', ctAgrupar(l, x => x.institucion), 'Institución')+
    grupo('Por financiador', ctAgrupar(l, x => x.financiador), 'Financiador')+
    '<p style="margin-top:20px;font-size:11px">Informe sin datos clínicos, elaborado sobre '+
    'prestaciones anonimizadas (Ley 25.326).</p></div>';
  window.print();
}
