/* =========================================================================
   GUIAS DE REFERENCIA RAPIDA Y CALCULADORAS ANESTESIOLOGICAS
   ========================================================================= */

let guiaFiltro = '';

function vistaGuias(){
  const cont = $('#vGuias');
  const q = norm(guiaFiltro);
  const l = q ? GUIAS.filter(g => norm(g.titulo + ' ' + g.tag + ' ' +
      g.cuerpo.map(s => s.h + ' ' + s.l.join(' ')).join(' ')).indexOf(q) >= 0) : GUIAS;

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Guías y protocolos</h1>'+
    '<p>Síntesis operativa de las recomendaciones de ASA, DAS, ASRA, MHAUS, ESAIC, ACC/AHA, OMS y ERAS.</p></div></div>'+

  '<div class="aviso warn">'+ico('alerta')+'<div><b>Material de consulta rápida.</b> '+
    'No reemplaza el juicio clínico ni la lectura de la guía original. Verificá dosis y disponibilidad '+
    'en tu institución antes de aplicarlas.</div></div>'+

  '<div class="campo"><div style="position:relative">'+
    '<input type="search" id="guiaBuscar" placeholder="Buscar en las guías: dantrolene, ayuno, ASRA, LAST…" value="'+esc(guiaFiltro)+'" style="padding-left:38px">'+
    '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--texto-3)">'+ico('buscar')+'</span>'+
  '</div></div>'+

  '<div class="tiles mb8">'+
    '<button class="tile danger" data-ir="g-vad"><div class="ico">'+ico('aire')+'</div><b>Vía aérea difícil</b><span>Plan A-B-C-D y CICO</span></button>'+
    '<button class="tile danger" data-ir="g-last"><div class="ico">'+ico('gota')+'</div><b>LAST</b><span>Emulsión lipídica</span></button>'+
    '<button class="tile danger" data-ir="g-hm"><div class="ico">'+ico('fuego')+'</div><b>Hipertermia maligna</b><span>Dantrolene</span></button>'+
    '<button class="tile danger" data-ir="g-anafilaxia"><div class="ico">'+ico('alerta')+'</div><b>Anafilaxia</b><span>Adrenalina y soporte</span></button>'+
    '<button class="tile aqua" data-calc="1"><div class="ico">'+ico('calculadora')+'</div><b>Calculadoras</b><span>Dosis, fluidos, sangrado</span></button>'+
  '</div>'+

  l.map(g => '<details class="acc" id="'+g.id+'">'+
    '<summary><span class="n" style="background:var(--'+g.color+'-bg,var(--azul-100));color:var(--'+g.color+',var(--azul-700))">'+
      ico(g.icono)+'</span>'+esc(g.titulo)+
      '<span class="est">'+esc(g.tag)+'</span>'+
      '<span class="flecha">'+ico('flecha')+'</span></summary>'+
    '<div class="cuerpo">'+ g.cuerpo.map(s =>
      '<div style="margin-bottom:14px"><b style="font-size:13px;color:var(--aqua-600);display:block;margin-bottom:6px">'+
      esc(s.h)+'</b><ul style="margin:0;padding-left:19px;line-height:1.7;font-size:13.5px">'+
      s.l.map(x => '<li style="margin-bottom:4px">'+esc(x)+'</li>').join('')+'</ul></div>').join('') +
    '</div></details>').join('')+

  (l.length ? '' : '<div class="vacio">'+ico('guias')+'<b>Sin resultados</b><span>Probá otra palabra.</span></div>')+

  '<p class="mini txt-c mt20">Fuentes: American Society of Anesthesiologists · Difficult Airway Society · '+
  'American Society of Regional Anesthesia and Pain Medicine · Malignant Hyperthermia Association of the US · '+
  'European Society of Anaesthesiology and Intensive Care · ACC/AHA · Organización Mundial de la Salud · ERAS Society.</p>';

  $('#guiaBuscar').oninput = debounce(e => { guiaFiltro = e.target.value; vistaGuias();
    const i = $('#guiaBuscar'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }, 260);
  $$('#vGuias [data-ir]').forEach(b => b.onclick = () => {
    const d = $('#'+b.dataset.ir); if(!d) return;
    d.open = true; d.scrollIntoView({ behavior:'smooth', block:'start' });
  });
  $$('#vGuias [data-calc]').forEach(b => b.onclick = abrirCalculadoras);
}

/* ========================== CALCULADORAS ========================== */
function abrirCalculadoras(){
  abrirModal('Calculadoras anestesiológicas',
    '<div class="campo"><label>Peso del paciente (kg)</label>'+
      '<input type="number" id="calcPeso" step="0.1" placeholder="70" inputmode="decimal"></div>'+
    '<div class="grid c2">'+
      '<div class="campo"><label>Talla (cm)</label><input type="number" id="calcTalla" placeholder="170"></div>'+
      '<div class="campo"><label>Edad (años)</label><input type="number" id="calcEdad" placeholder="45"></div>'+
    '</div>'+
    '<div class="campo"><label>Sexo</label><select id="calcSexo">'+
      '<option value="M">Masculino</option><option value="F">Femenino</option></select></div>'+
    '<div class="grid c2">'+
      '<div class="campo"><label>Hematocrito inicial (%)</label><input type="number" id="calcHto" placeholder="40"></div>'+
      '<div class="campo"><label>Hematocrito mínimo aceptable (%)</label><input type="number" id="calcHtoMin" placeholder="24"></div>'+
    '</div>'+
    '<div id="calcOut"></div>',
    '<button class="btn pri" data-cerrar>Cerrar</button>', '620px');

  const recalc = () => {
    const p = Number($('#calcPeso').value) || 0;
    const t = Number($('#calcTalla').value) || 0;
    const e = Number($('#calcEdad').value) || 0;
    const sx = $('#calcSexo').value;
    if(!p){ $('#calcOut').innerHTML = '<p class="mini">Ingresá el peso para calcular.</p>'; return; }

    const pi = t ? pesoIdeal(t, sx) : null;
    const imc = calcIMC(p, t);
    const sc = t ? superficieCorporal(p, t) : null;
    const volemia = e && e < 1 ? 85 : (e && e < 12 ? 75 : (sx === 'F' ? 65 : 70));
    const vs = p * volemia;
    const hto = Number($('#calcHto').value) || 0, htoMin = Number($('#calcHtoMin').value) || 0;
    const psp = (hto && htoMin && hto > htoMin) ? vs * (hto - htoMin) / hto : null;
    const mant = p <= 10 ? p*4 : (p <= 20 ? 40 + (p-10)*2 : 60 + (p-20));
    const tubo = e ? (e/4 + 4) : null;

    const t3 = (l, v, s) => '<tr><td>'+l+'</td><td class="num"><b>'+v+'</b></td><td class="mini">'+(s||'')+'</td></tr>';
    $('#calcOut').innerHTML =
    '<div class="tabla-wrap mt14"><table><tbody>'+
      (imc ? t3('IMC', imc.toFixed(1)+' kg/m²', clasificaIMC(imc)) : '')+
      (sc ? t3('Superficie corporal', sc.toFixed(2)+' m²', 'Mosteller') : '')+
      (pi ? t3('Peso ideal', pi.toFixed(1)+' kg', 'Devine — dosificar relajantes y volumen tidal') : '')+
      t3('Volemia estimada', Math.round(vs)+' ml', volemia+' ml/kg')+
      (psp ? t3('Pérdida sanguínea permisible', Math.round(psp)+' ml', 'Hasta el Hto mínimo indicado') : '')+
      t3('Mantenimiento hídrico', Math.round(mant)+' ml/h', 'Regla 4-2-1')+
      t3('Volumen tidal protector', Math.round((pi||p)*6)+'–'+Math.round((pi||p)*8)+' ml', '6-8 ml/kg de peso ideal')+
      (tubo && e < 16 ? t3('Tubo endotraqueal', (tubo).toFixed(1)+' sin balón / '+(e/4+3.5).toFixed(1)+' con balón',
        'Profundidad ≈ '+Math.round(tubo*3)+' cm') : '')+
    '</tbody></table></div>'+

    '<h3 style="font-size:14px;margin:18px 0 8px">Dosis calculadas</h3>'+
    '<div class="tabla-wrap"><table><tbody>'+
      t3('Propofol inducción', (p*1.5).toFixed(0)+'–'+(p*2.5).toFixed(0)+' mg', '1,5-2,5 mg/kg')+
      t3('Fentanilo', (p*1).toFixed(0)+'–'+(p*3).toFixed(0)+' µg', '1-3 µg/kg')+
      t3('Rocuronio', (p*0.6).toFixed(0)+' mg', '1,2 mg/kg = '+(p*1.2).toFixed(0)+' mg para secuencia rápida')+
      t3('Succinilcolina', (p*1).toFixed(0)+'–'+(p*1.5).toFixed(0)+' mg', '1-1,5 mg/kg')+
      t3('Sugammadex', (p*2).toFixed(0)+' / '+(p*4).toFixed(0)+' / '+(p*16).toFixed(0)+' mg',
         'Bloqueo moderado / profundo / reversión inmediata')+
      t3('Ketamina', (p*1).toFixed(0)+'–'+(p*2).toFixed(0)+' mg', '1-2 mg/kg EV')+
      t3('Lidocaína máx.', (p*4.5).toFixed(0)+' mg ('+(p*7).toFixed(0)+' con adrenalina)', 'al 2 % = '+((p*4.5)/20).toFixed(1)+' ml')+
      t3('Bupivacaína máx.', (p*2).toFixed(0)+' mg', 'al 0,5 % = '+((p*2)/5).toFixed(1)+' ml')+
      t3('Ropivacaína máx.', (p*3).toFixed(0)+' mg', 'al 0,75 % = '+((p*3)/7.5).toFixed(1)+' ml')+
      t3('Ácido tranexámico', (p*15).toFixed(0)+' mg', '15 mg/kg antes de la incisión')+
      t3('Adrenalina en paro', p < 40 ? (p*10).toFixed(0)+' µg' : '1 mg', p<40?'10 µg/kg':'dosis del adulto')+
    '</tbody></table></div>'+

    '<div class="aviso danger mt14">'+ico('gota')+'<div><b>Rescate lipídico (LAST) para '+p+' kg</b><br>'+
      'Bolo de emulsión lipídica al 20 %: <b>'+(p*1.5).toFixed(0)+' ml</b> en 2-3 min.<br>'+
      'Infusión: <b>'+(p*0.25).toFixed(0)+' ml/min</b> (≈ '+(p*15).toFixed(0)+' ml/h).<br>'+
      'Máximo acumulado: '+(p*12).toFixed(0)+' ml. Adrenalina ≤ '+(p*1).toFixed(0)+' µg por bolo.</div></div>'+

    '<div class="aviso warn">'+ico('fuego')+'<div><b>Dantrolene para '+p+' kg</b><br>'+
      'Dosis inicial 2,5 mg/kg = <b>'+(p*2.5).toFixed(0)+' mg</b> ('+Math.ceil(p*2.5/20)+' viales de 20 mg). '+
      'Repetir cada 5 min hasta el control; habitualmente hasta '+(p*10).toFixed(0)+' mg.</div></div>';
  };
  ['calcPeso','calcTalla','calcEdad','calcSexo','calcHto','calcHtoMin'].forEach(id => {
    const e = $('#'+id); if(e){ e.oninput = recalc; e.onchange = recalc; }
  });
  recalc();
}
