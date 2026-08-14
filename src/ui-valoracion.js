/* =========================================================================
   VALORACION ANESTESICA PREQUIRURGICA
   Estructura alineada con ASA Practice Advisory for Preanesthesia Evaluation,
   ESAIC Preoperative Evaluation of the Adult, ACC/AHA 2024 y las escalas
   de uso corriente en la practica anestesiologica.
   ========================================================================= */

const val = (id, d) => { const e = $('#'+id); return e ? e.value : (d===undefined?'':d); };
const chk = id => { const e = $('#'+id); return e ? e.checked : false; };

function acc(id, icono, titulo, cuerpo, abierto){
  return '<details class="acc" id="'+id+'"'+(abierto?' open':'')+'>'+
    '<summary><span class="n">'+ico(icono)+'</span>'+esc(titulo)+
      '<span class="flecha">'+ico('flecha')+'</span></summary>'+
    '<div class="cuerpo">'+cuerpo+'</div></details>';
}

/* =================================================== HTML de la seccion */
function htmlValoracion(f){
  const v = f.v || {};
  const p = DB.pacientes[f.pacienteId] || {};
  const ed = edadDe(p.fechaNac, f.fecha);

  return ''+
  '<div class="aviso info">'+ico('valoracion')+'<div><b>Valoración anestésica prequirúrgica</b><br>'+
    'Las escalas se calculan solas a medida que completás. Todo campo puede dejarse vacío: '+
    'el documento final sólo imprime lo que cargaste.</div></div>'+

  /* -------- 1. Antecedentes patológicos (CIE-10) -------- */
  acc('acDx','lista','1 · Diagnósticos y antecedentes patológicos (CIE-10)',
    '<div class="campo"><label>Antecedentes codificados — buscá por palabra o por código</label>'+
      '<div class="buscador"><input type="search" id="dxBuscar" placeholder="Ej.: hipertensión, diabetes, I10, asma…" autocomplete="off">'+
      '<div class="res" id="dxRes"></div></div>'+
      '<div class="ayuda">Escribí al menos 2 letras. Si el diagnóstico no figura, podés agregarlo manualmente desde el propio buscador.</div>'+
      '<div class="seleccionados" id="dxSel"></div></div>'+
    '<hr class="sep">'+
    '<label style="font-size:12px;font-weight:700;color:var(--texto-2)">Revisión rápida por sistemas</label>'+
    Object.keys(ANTECEDENTES_SISTEMAS).map((s,i) =>
      '<div class="mt8"><div class="mini strong" style="margin-bottom:5px">'+esc(s)+'</div>'+
      chksHTML('antSis'+i, ANTECEDENTES_SISTEMAS[s], (v.antecedentes||{})[s])+'</div>').join('')+
    campoArea('antOtros','Otros antecedentes y detalles', v.antecedentesOtros,
      'Cronología, tratamientos, cirugías previas, internaciones…'), true)+

  /* -------- 2. Antecedentes anestésicos -------- */
  acc('acAnest','jeringa','2 · Antecedentes anestésicos y familiares',
    chksHTML('antAnest', ANTECEDENTES_ANESTESICOS, v.antAnestesicos)+
    campoArea('antAnestDet','Detalle de eventos anestésicos previos', v.antAnestDetalle,
      'Fecha, procedimiento, institución, qué ocurrió y cómo se resolvió')+
    '<div class="aviso warn" id="alertaHM" style="display:none">'+ico('fuego')+
      '<div><b>Antecedente de hipertermia maligna.</b> Planificar técnica libre de gatillantes (TIVA), '+
      'máquina purgada o con filtros de carbón activado, dantrolene disponible y monitoreo de temperatura y EtCO₂. '+
      'Consultá el protocolo completo en la sección Guías.</div></div>')+

  /* -------- 3. Medicación habitual -------- */
  acc('acMed','jeringa','3 · Medicación habitual y manejo perioperatorio',
    '<div class="campo"><label>Buscar fármaco</label>'+
      '<div class="buscador"><input type="search" id="medBuscar" placeholder="Ej.: aspirina, metformina, enalapril…" autocomplete="off">'+
      '<div class="res" id="medRes"></div></div>'+
      '<div class="ayuda">Cada fármaco trae la conducta perioperatoria sugerida según las guías vigentes; podés modificarla.</div></div>'+
      '<div id="medLista" class="mt8"></div>'+
    campoArea('medOtros','Otra medicación o aclaraciones', v.medicacionOtros))+

  /* -------- 4. Alergias -------- */
  acc('acAlergias','alerta','4 · Alergias e intolerancias',
    chksHTML('alerg', ALERGENOS, v.alergias)+
    campoArea('alergDet','Detalle de la reacción', v.alergiaDetalle,
      'Tipo de reacción, gravedad, fecha, estudio alergológico realizado'))+

  /* -------- 5. Hábitos -------- */
  acc('acHabitos','hoja','5 · Hábitos y estilo de vida',
    '<div class="grid c2">'+
      campoSel('habTabaco','Tabaquismo', ['No fumador','Ex fumador','Fumador activo'], (v.habitos||{}).tabaco)+
      campoTxt('habTabacoCant','Carga tabáquica (paquetes/año)', (v.habitos||{}).tabacoCant)+
    '</div>'+
    '<div class="grid c2">'+
      campoSel('habAlcohol','Alcohol', ['No consume','Social','Consumo de riesgo','Dependencia'], (v.habitos||{}).alcohol)+
      campoSel('habDrogas','Otras sustancias', ['No consume','Cannabis','Cocaína','Opioides','Múltiples','Prefiere no informar'], (v.habitos||{}).drogas)+
    '</div>'+
    '<div class="campo"><label>Capacidad funcional (MET)</label>'+
      '<select id="mets">'+MET_OPCIONES.map(m =>
        '<option value="'+m.v+'"'+(String((v.scores||{}).mets)===String(m.v)?' selected':'')+'>'+
        m.v+' MET — '+esc(m.t)+'</option>').join('')+'</select></div>'+
    '<div id="metsOut"></div>'+
    '<div class="campo"><label>Escala clínica de fragilidad (Rockwood)</label>'+
      '<select id="fragilidad"><option value="">No evaluada</option>'+
      FRAGILIDAD.map(fr => '<option value="'+fr[0]+'"'+(String((v.scores||{}).fragilidad)===String(fr[0])?' selected':'')+'>'+
        fr[0]+' — '+esc(fr[1])+'</option>').join('')+'</select></div>')+

  /* -------- 6. Examen físico -------- */
  acc('acExamen','corazon','6 · Examen físico y semiología',
    '<div class="grid c4">'+
      campoTxt('exTA','TA (mmHg)', (v.examen||{}).ta)+
      campoNum('exFC','FC (lpm)', (v.examen||{}).fc)+
      campoNum('exFR','FR (rpm)', (v.examen||{}).fr)+
      campoNum('exSpo2','SpO₂ (%)', (v.examen||{}).spo2)+
    '</div>'+
    '<div class="grid c4">'+
      campoNum('exTemp','Temperatura (°C)', (v.examen||{}).temp, 'step="0.1"')+
      campoNum('exPeso','Peso (kg)', (v.examen||{}).peso || p.peso)+
      campoNum('exTalla','Talla (cm)', (v.examen||{}).talla || p.talla)+
      campoTxt('exEdad','Edad', ed !== null ? ed+' años' : '—', true)+
    '</div>'+
    '<div id="exAntropo"></div>'+
    '<div class="grid c2">'+
      campoArea('exCardio','Aparato cardiovascular', (v.examen||{}).cardio, 'R1-R2 normofonéticos, sin soplos, pulsos presentes y simétricos…')+
      campoArea('exResp','Aparato respiratorio', (v.examen||{}).respiratorio, 'Buena entrada de aire bilateral, sin ruidos agregados…')+
    '</div>'+
    '<div class="grid c2">'+
      campoArea('exAbd','Abdomen', (v.examen||{}).abdomen)+
      campoArea('exNeuro','Neurológico', (v.examen||{}).neuro)+
    '</div>'+
    '<div class="grid c2">'+
      campoSel('exAccesos','Accesos venosos periféricos',
        ['Buenos','Regulares','Dificultosos — prever ecografía','Requiere acceso central'], (v.examen||{}).accesos)+
      campoSel('exColumna','Columna para bloqueo neuroaxial',
        ['Apófisis palpables, sin dificultad','Palpación dificultosa','Escoliosis / cirugía previa','Contraindicado','No evaluada'], (v.examen||{}).columna)+
    '</div>')+

  /* -------- 7. Vía aérea -------- */
  acc('acVA','aire','7 · Evaluación de la vía aérea',
    '<div class="grid c2">'+
      campoSel('vaMallampati','Mallampati modificado (Samsoon-Young)',
        [{v:'',t:'No evaluado'},{v:'1',t:'Clase I — paladar blando, úvula, pilares'},
         {v:'2',t:'Clase II — paladar blando y úvula'},
         {v:'3',t:'Clase III — paladar blando y base de la úvula'},
         {v:'4',t:'Clase IV — sólo paladar duro'}], (v.va||{}).mallampati)+
      campoNum('vaApertura','Apertura bucal (cm)', (v.va||{}).aperturaBucal, 'step="0.5"')+
    '</div>'+
    '<div class="grid c2">'+
      campoNum('vaTiro','Distancia tiromentoniana (cm)', (v.va||{}).tiromentoniana, 'step="0.5"')+
      campoNum('vaEsterno','Distancia esternomentoniana (cm)', (v.va||{}).esternomentoniana, 'step="0.5"')+
    '</div>'+
    '<div class="grid c2">'+
      campoSel('vaCuello','Movilidad cervical',
        [{v:'normal',t:'Normal (> 90°)'},{v:'limitada',t:'Limitada (80-90°)'},{v:'muy_limitada',t:'Muy limitada (< 80°) o collar'}], (v.va||{}).cuelloMov)+
      campoSel('vaProtrusion','Test de mordida del labio superior',
        [{v:'clase1',t:'Clase I — muerde el labio por encima de la línea del bermellón'},
         {v:'clase2',t:'Clase II — muerde el labio por debajo de la línea'},
         {v:'clase3',t:'Clase III — no alcanza el labio superior'}], (v.va||{}).protrusion)+
    '</div>'+
    '<div class="grid c2">'+
      campoNum('vaCuelloCirc','Circunferencia del cuello (cm)', (v.va||{}).cuelloCirc)+
      campoSel('vaDenticion','Dentición',
        ['Completa y sana','Piezas ausentes','Prótesis removible','Prótesis fija','Piezas flojas o en mal estado','Edéntulo'], (v.va||{}).denticion)+
    '</div>'+
    '<div class="grid c2">'+
      campoSel('vaIntPrev','Intubación previa',
        [{v:'sin_datos',t:'Sin datos'},{v:'facil',t:'Fácil documentada'},{v:'dificil',t:'Difícil documentada'}], (v.va||{}).intubacionPrevia)+
      campoSel('vaCormack','Cormack-Lehane previo',
        ['','I','II a','II b','III','IV'], (v.va||{}).cormackPrevia)+
    '</div>'+
    chksHTML('vaOtros', ['Barba','Obesidad cervical','Macroglosia','Micrognatia','Cuello corto',
      'Radioterapia cervical','Tumor de vía aérea','Traqueostomía','Trauma facial',
      'Limitación de la apertura por dolor','Embarazo a término','Riesgo de aspiración'], (v.va||{}).otros)+
    '<div id="vaScore" class="mt14"></div>'+
    campoArea('vaPlan','Plan de manejo de la vía aérea', (v.va||{}).plan,
      'Dispositivo primario, plan B, quién asiste, material preparado'))+

  /* -------- 8. Laboratorio y estudios -------- */
  acc('acLab','gota','8 · Laboratorio y estudios complementarios',
    '<div class="grid c4">'+
      campoNum('labHb','Hb (g/dl)', (v.lab||{}).hb, 'step="0.1"')+
      campoNum('labHto','Hto (%)', (v.lab||{}).hto, 'step="0.1"')+
      campoNum('labPlaq','Plaquetas (mil/µl)', (v.lab||{}).plaquetas)+
      campoNum('labGB','Glóbulos blancos (mil/µl)', (v.lab||{}).gb, 'step="0.1"')+
    '</div>'+
    '<div class="grid c4">'+
      campoNum('labTP','TP (%)', (v.lab||{}).tp)+
      campoNum('labRIN','RIN', (v.lab||{}).rin, 'step="0.01"')+
      campoNum('labKPTT','KPTT (seg)', (v.lab||{}).kptt)+
      campoNum('labFibrin','Fibrinógeno (mg/dl)', (v.lab||{}).fibrinogeno)+
    '</div>'+
    '<div class="grid c4">'+
      campoNum('labGlu','Glucemia (mg/dl)', (v.lab||{}).glucemia)+
      campoNum('labHba1c','HbA1c (%)', (v.lab||{}).hba1c, 'step="0.1"')+
      campoNum('labUrea','Urea (mg/dl)', (v.lab||{}).urea)+
      campoNum('labCrea','Creatinina (mg/dl)', (v.lab||{}).creatinina, 'step="0.01"')+
    '</div>'+
    '<div class="grid c4">'+
      campoNum('labNa','Sodio (mEq/l)', (v.lab||{}).sodio)+
      campoNum('labK','Potasio (mEq/l)', (v.lab||{}).potasio, 'step="0.1"')+
      campoNum('labGOT','GOT / TGO', (v.lab||{}).got)+
      campoNum('labGPT','GPT / TGP', (v.lab||{}).gpt)+
    '</div>'+
    '<div class="grid c4">'+
      campoNum('labBili','Bilirrubina (mg/dl)', (v.lab||{}).bilirrubina, 'step="0.1"')+
      campoNum('labAlb','Albúmina (g/dl)', (v.lab||{}).albumina, 'step="0.1"')+
      campoFecha('labFecha','Fecha del laboratorio', (v.lab||{}).fecha)+
      campoTxt('labEgfr','Filtrado glomerular', '', true)+
    '</div>'+
    '<div id="labAlertas" class="mt8"></div>'+
    '<hr class="sep">'+
    '<div class="grid c2">'+
      campoArea('esEcg','Electrocardiograma', (v.estudios||{}).ecg, 'Ritmo, frecuencia, eje, alteraciones')+
      campoArea('esRx','Radiografía de tórax', (v.estudios||{}).rx)+
    '</div>'+
    '<div class="grid c2">'+
      campoArea('esEco','Ecocardiograma', (v.estudios||{}).ecocardio, 'FEy, valvulopatías, presión pulmonar')+
      campoArea('esEspiro','Espirometría / otros', (v.estudios||{}).espirometria)+
    '</div>'+
    '<div id="esSugeridos"></div>')+

  /* -------- 9. Escalas de riesgo -------- */
  acc('acScores','stats','9 · Estratificación del riesgo',
    '<div class="card plano" style="border:1.5px solid var(--borde)"><h3>'+ico('escudo')+'ASA Physical Status</h3>'+
      '<div class="campo"><select id="scAsa">'+
        '<option value="">— Seleccionar —</option>'+
        ASA_PS.map(a => '<option value="'+a.v+'"'+((v.scores||{}).asa===a.v?' selected':'')+'>ASA '+a.v+' — '+esc(a.t)+'</option>').join('')+
      '</select></div>'+
      '<label class="chk'+((v.scores||{}).asaE?' sel':'')+'" id="scAsaEL"><input type="checkbox" id="scAsaE"'+
        ((v.scores||{}).asaE?' checked':'')+'>Modificador E — procedimiento de emergencia</label>'+
      '<div id="scAsaDesc" class="mini mt8"></div></div>'+

    '<div class="card plano" style="border:1.5px solid var(--borde)"><h3>'+ico('corazon')+'RCRI — índice de riesgo cardíaco revisado (Lee)</h3>'+
      RCRI_ITEMS.map((it,i) => '<label class="chk mb8" style="display:flex;width:100%;margin-bottom:6px">'+
        '<input type="checkbox" id="rcri'+i+'"'+(((v.scores||{}).rcri||[]).indexOf(i)>=0?' checked':'')+'>'+esc(it.t)+'</label>').join('')+
      '<div id="rcriOut" class="mt8"></div></div>'+

    '<div class="card plano" style="border:1.5px solid var(--borde)"><h3>'+ico('pulmon')+'ARISCAT — riesgo de complicaciones pulmonares</h3>'+
      '<div class="grid c2">'+
        campoSel('arIncision','Incisión quirúrgica',
          [{v:'periferica',t:'Periférica'},{v:'alta',t:'Abdominal alta'},{v:'toracica',t:'Torácica'}], (v.scores||{}).arIncision)+
        campoNum('arDuracion','Duración prevista (min)', (v.scores||{}).arDuracion)+
      '</div>'+
      '<label class="chk mb8" style="display:flex;width:100%;margin-bottom:6px"><input type="checkbox" id="arInf"'+
        ((v.scores||{}).arInf?' checked':'')+'>Infección respiratoria en el último mes</label>'+
      '<div id="ariscatOut" class="mt8"></div></div>'+

    '<div class="card plano" style="border:1.5px solid var(--borde)"><h3>'+ico('aire')+'STOP-BANG — apnea obstructiva del sueño</h3>'+
      STOPBANG_ITEMS.map(it => '<label class="chk mb8" style="display:flex;width:100%;margin-bottom:6px">'+
        '<input type="checkbox" id="sb_'+it.k+'"'+(((v.scores||{}).stopbang||{})[it.k]?' checked':'')+'>'+esc(it.t)+'</label>').join('')+
      '<div id="sbOut" class="mt8"></div></div>'+

    '<div class="card plano" style="border:1.5px solid var(--borde)"><h3>'+ico('estomago')+'Apfel — náuseas y vómitos postoperatorios</h3>'+
      APFEL_ITEMS.map(it => '<label class="chk mb8" style="display:flex;width:100%;margin-bottom:6px">'+
        '<input type="checkbox" id="ap_'+it.k+'"'+(((v.scores||{}).apfel||{})[it.k]?' checked':'')+'>'+esc(it.t)+'</label>').join('')+
      '<div id="apOut" class="mt8"></div></div>'+

    '<div class="card plano" style="border:1.5px solid var(--borde)"><h3>'+ico('vena')+'Caprini — riesgo de tromboembolismo venoso</h3>'+
      '<div class="chks">'+CAPRINI_ITEMS.map((it,i) =>
        '<label class="chk'+(((v.scores||{}).caprini||[]).indexOf(i)>=0?' sel':'')+'">'+
        '<input type="checkbox" class="cap" data-i="'+i+'"'+(((v.scores||{}).caprini||[]).indexOf(i)>=0?' checked':'')+'>'+
        esc(it.t)+' <b style="opacity:.6">('+it.p+')</b></label>').join('')+'</div>'+
      '<div id="capOut" class="mt8"></div></div>')+

  /* -------- 10. Ayuno -------- */
  acc('acAyuno','reloj','10 · Ayuno preoperatorio y profilaxis de aspiración',
    '<div class="grid c2">'+
      campoSel('ayTipo','Última ingesta', AYUNO_ASA.map(a => a.t), (v.ayuno||{}).tipo)+
      '<div class="campo"><label>Hora de la última ingesta</label>'+
        '<input type="time" id="ayHora" value="'+esc((v.ayuno||{}).hora||'')+'"></div>'+
    '</div>'+
    '<div id="ayOut"></div>'+
    chksHTML('ayRiesgo', ['Embarazo con trabajo de parto','Obstrucción intestinal','Gastroparesia',
      'Reflujo severo','Obesidad mórbida','Cirugía de urgencia','Diabetes de larga evolución',
      'Agonista GLP-1 sin suspender','Trauma reciente','Íleo'], (v.ayuno||{}).riesgos)+
    chksHTML('ayProfilaxis', ['Omeprazol 40 mg','Ranitidina / famotidina','Citrato de sodio 0,3 M',
      'Metoclopramida 10 mg','Secuencia de intubación rápida','Ecografía gástrica',
      'Sonda nasogástrica previa'], (v.ayuno||{}).profilaxis))+

  /* -------- 11. Conclusión -------- */
  acc('acConclusion','check','11 · Conclusión y aptitud anestésica',
    '<div id="resumenRiesgo"></div>'+
    '<div class="campo"><label>Aptitud para el acto anestésico</label>'+
      '<div class="seg" id="segAptitud">'+
        [['apto','Apto'],['reservas','Apto con reservas'],['optimizar','Requiere optimización'],['noapto','No apto']]
          .map(a => '<button type="button" data-v="'+a[0]+'"'+
            (((v.riesgo||{}).aptitud||'apto')===a[0]?' class="on"':'')+'>'+a[1]+'</button>').join('')+
      '</div></div>'+
    campoArea('rgFundamento','Fundamentación y recomendaciones', (v.riesgo||{}).fundamento,
      'Riesgo global, optimizaciones necesarias, interconsultas, condiciones para operar')+
    campoArea('rgInterconsultas','Interconsultas solicitadas', (v.riesgo||{}).interconsultas,
      'Cardiología, neumonología, hematología, endocrinología…')+
    '<div class="grid c2">'+
      campoFecha('rgFechaEval','Fecha de la evaluación', (v.riesgo||{}).fecha || hoyISO())+
      campoSel('rgAmbito','Ámbito de la evaluación',
        ['Consultorio de preanestesia','Sala de internación','Antecámara de quirófano','Guardia / urgencia','Telemedicina'], (v.riesgo||{}).ambito)+
    '</div>');
}

/* ============================== Cableado ============================== */
let dxSeleccionados = [], medSeleccionados = [];

function cablearValoracion(f){
  const v = f.v || {};
  dxSeleccionados = (v.cie10 || []).slice();
  medSeleccionados = (v.medicacion || []).slice();

  /* --- buscador CIE-10 --- */
  montarBuscador({
    input: $('#dxBuscar'), caja: $('#dxRes'), manual: true,
    fuente: () => todosCIE().map(x => ({
      cod:x.c, etiqueta:x.d, sub:x.cap, busca: norm(x.c+' '+x.d+' '+x.cap), dato:x })),
    onElegir: x => { if(!dxSeleccionados.some(d => d.c === x.dato.c && d.d === x.dato.d))
        dxSeleccionados.push({ c:x.dato.c, d:x.dato.d }); pintarDx(); },
    onManual: txt => {
      if(!txt) return;
      agregarExtra('cie', { c:'', d:txt });
      dxSeleccionados.push({ c:'—', d:txt, manual:true }); pintarDx();
      toast('Diagnóstico agregado al catálogo.', 'ok');
    }
  });
  pintarDx();

  /* --- buscador de fármacos --- */
  montarBuscador({
    input: $('#medBuscar'), caja: $('#medRes'), manual: true,
    fuente: () => FARMACOS_PERIOP.map(x => ({
      etiqueta:x.n, sub:x.g+' · '+({continuar:'Continuar',suspender:'Suspender',evaluar:'Evaluar'}[x.accion]),
      busca: norm(x.n+' '+x.g), dato:x })),
    onElegir: x => { if(!medSeleccionados.some(m => m.n === x.dato.n))
        medSeleccionados.push({ n:x.dato.n, g:x.dato.g, accion:x.dato.accion, nota:x.dato.nota, dosis:'' });
      pintarMed(); },
    onManual: txt => { if(!txt) return;
      medSeleccionados.push({ n:txt, g:'Otro', accion:'evaluar', nota:'', dosis:'' }); pintarMed(); }
  });
  pintarMed();

  /* --- checkboxes con estilo --- */
  Object.keys(ANTECEDENTES_SISTEMAS).forEach((s,i) => cablearChks('antSis'+i));
  ['antAnest','alerg','vaOtros','ayRiesgo','ayProfilaxis'].forEach(cablearChks);
  $$('#vFicha .chk').forEach(l => {
    l.onclick = () => setTimeout(() => l.classList.toggle('sel', l.querySelector('input').checked), 0);
  });

  /* --- alerta de hipertermia maligna --- */
  const revisarHM = () => {
    const marcado = $$('#antAnest input:checked').some(i => i.value.indexOf('Hipertermia maligna') >= 0);
    $('#alertaHM').style.display = marcado ? '' : 'none';
  };
  $('#antAnest').addEventListener('change', revisarHM); revisarHM();

  /* --- recalcular todo --- */
  const recalcular = () => {
    /* antropometría */
    const peso = val('exPeso'), talla = val('exTalla');
    const imc = calcIMC(peso, talla);
    const p = DB.pacientes[f.pacienteId] || {};
    const ed = edadDe(p.fechaNac, f.fecha);
    $('#exAntropo').innerHTML = imc ?
      '<div class="aviso info">'+ico('info')+'<div><b>IMC '+imc.toFixed(1)+'</b> — '+clasificaIMC(imc)+
      ' · SC '+superficieCorporal(peso,talla).toFixed(2)+' m²'+
      ' · Peso ideal '+(pesoIdeal(talla, p.sexo)||0).toFixed(1)+' kg</div></div>' : '';

    /* MET */
    const m = interpMET(val('mets'));
    $('#metsOut').innerHTML = '<div class="aviso '+(m.nivel==='bajo'?'ok':(m.nivel==='moderado'?'warn':'danger'))+'">'+
      ico('corazon')+'<div>'+m.texto+'</div></div>';

    /* vía aérea */
    const eg = calcElGanzouri({
      aperturaBucal: val('vaApertura'), tiromentoniana: val('vaTiro'),
      mallampati: val('vaMallampati'), cuelloMov: val('vaCuello'),
      protrusion: val('vaProtrusion'), peso: peso, intubacionPrevia: val('vaIntPrev')
    });
    $('#vaScore').innerHTML = tarjetaScore('Índice de El-Ganzouri (riesgo de vía aérea difícil)', eg);

    /* laboratorio */
    const lab = {};
    [['hb','labHb'],['hto','labHto'],['plaquetas','labPlaq'],['rin','labRIN'],['potasio','labK'],
     ['sodio','labNa'],['glucemia','labGlu'],['hba1c','labHba1c'],['creatinina','labCrea']]
      .forEach(([k,id]) => lab[k] = val(id));
    const al = alertasLaboratorio(lab);
    $('#labAlertas').innerHTML = al.map(a =>
      '<div class="aviso '+a[0]+'">'+ico(a[0]==='danger'?'alerta':'info')+'<div>'+esc(a[1])+'</div></div>').join('');
    const g = eGFR(val('labCrea'), ed, p.sexo);
    if($('#labEgfr')) $('#labEgfr').value = g ? Math.round(g)+' ml/min/1,73m² — '+estadioERC(g) : '—';

    /* ASA */
    const a = ASA_PS.find(x => x.v === val('scAsa'));
    $('#scAsaDesc').innerHTML = a ? '<b>'+esc(a.t)+'.</b> '+esc(a.d) : '';

    /* RCRI */
    const rc = {}; RCRI_ITEMS.forEach((it,i) => rc[it.k] = chk('rcri'+i));
    const rcri = calcRCRI(rc);
    $('#rcriOut').innerHTML = tarjetaScore('RCRI', rcri);

    /* ARISCAT */
    const ar = calcARISCAT({
      edad: ed, spo2: val('exSpo2'), hb: val('labHb'),
      infeccionRespiratoria: chk('arInf'), incision: val('arIncision'),
      duracion: val('arDuracion'), urgencia: (f.caracter && f.caracter !== 'programada')
    });
    $('#ariscatOut').innerHTML = tarjetaScore('ARISCAT', ar);

    /* STOP-BANG */
    const sbv = {}; STOPBANG_ITEMS.forEach(it => sbv[it.k] = chk('sb_'+it.k));
    const sb = calcSTOPBANG(sbv);
    $('#sbOut').innerHTML = tarjetaScore('STOP-BANG', sb);

    /* Apfel */
    const apv = {}; APFEL_ITEMS.forEach(it => apv[it.k] = chk('ap_'+it.k));
    const ap = calcApfel(apv);
    $('#apOut').innerHTML = tarjetaScore('Apfel', ap);

    /* Caprini */
    const capSel = $$('.cap:checked').map(i => Number(i.dataset.i));
    const cap = calcCaprini(capSel);
    $('#capOut').innerHTML = tarjetaScore('Caprini', cap);

    /* Ayuno */
    const tipo = val('ayTipo'), hora = val('ayHora');
    const reg = AYUNO_ASA.find(x => x.t === tipo);
    if(reg && hora){
      const [hh,mm] = hora.split(':').map(Number);
      const ahora = new Date();
      const ult = new Date(); ult.setHours(hh, mm, 0, 0);
      if(ult > ahora) ult.setDate(ult.getDate() - 1);
      const hrs = (ahora - ult) / 3600000;
      const ok = hrs >= reg.h;
      $('#ayOut').innerHTML = '<div class="aviso '+(ok?'ok':'warn')+'">'+ico('reloj')+
        '<div><b>'+hrs.toFixed(1)+' h de ayuno</b> — se requieren '+reg.h+' h para «'+esc(reg.t)+'». '+
        (ok ? 'Cumple el ayuno recomendado.' : 'AYUNO INSUFICIENTE: manejar como estómago ocupado o postergar.')+
        '<br><span class="mini">'+esc(reg.d)+'</span></div></div>';
    } else if(reg){
      $('#ayOut').innerHTML = '<div class="aviso info">'+ico('info')+'<div>Requiere '+reg.h+' h de ayuno. '+esc(reg.d)+'</div></div>';
    } else $('#ayOut').innerHTML = '';

    /* estudios sugeridos */
    const cond = {
      anticoagulado: medSeleccionados.some(m => /anticoagul|warfar|rivarox|apix|dabig|edox|heparin/i.test(m.n+m.g)),
      renal: !!val('labCrea') && Number(val('labCrea')) > 1.5,
      hta: dxSeleccionados.some(d => /hipertens/i.test(d.d)),
      diabetes: dxSeleccionados.some(d => /diabet/i.test(d.d)),
      cardiopatia: rc.cardiopatia || rc.icc,
      arritmia: dxSeleccionados.some(d => /arritm|fibrilaci/i.test(d.d)),
      respiratorio: dxSeleccionados.some(d => /asma|epoc|respirat|pulmon/i.test(d.d)),
      tabaquismo: val('habTabaco') === 'Fumador activo',
      hepatopatia: dxSeleccionados.some(d => /hepat|cirros/i.test(d.d)),
      sangrado: ar.nivel === 'alto',
      soplo: false, disnea: false,
      embarazoPosible: p.sexo === 'F' && ed !== null && ed >= 12 && ed <= 55
    };
    const riesgoCx = val('arIncision') === 'periferica' ? 'bajo' : (val('arIncision') === 'toracica' ? 'alto' : 'medio');
    $('#esSugeridos').innerHTML = '<div class="aviso info">'+ico('lista')+
      '<div><b>Estudios preoperatorios sugeridos</b><br>'+
      estudiosSugeridos(ed, val('scAsa'), riesgoCx, cond).map(esc).join(' · ')+'</div></div>';

    /* resumen final */
    const alto = [eg, rcri, ar, sb, cap].filter(x => x.nivel === 'alto');
    $('#resumenRiesgo').innerHTML =
      '<div class="grid c2 mb8">'+
        tarjetaScore('Vía aérea (El-Ganzouri)', eg)+
        tarjetaScore('Cardíaco (RCRI)', rcri)+
        tarjetaScore('Pulmonar (ARISCAT)', ar)+
        tarjetaScore('SAHOS (STOP-BANG)', sb)+
        tarjetaScore('NVPO (Apfel)', ap)+
        tarjetaScore('TEV (Caprini)', cap)+
      '</div>'+
      (alto.length ? '<div class="aviso danger">'+ico('alerta')+'<div><b>'+alto.length+
        ' dominio(s) en riesgo alto.</b> Revisá la fundamentación y las medidas de mitigación antes de emitir la aptitud.</div></div>'
      : '<div class="aviso ok">'+ico('check')+'<div>Ningún dominio evaluado alcanza el nivel de riesgo alto.</div></div>');
  };
  window.__recalcValoracion = recalcular;

  const cont = $('#fiCuerpo');
  cont.addEventListener('input', debounce(recalcular, 200));
  cont.addEventListener('change', recalcular);

  /* segmento de aptitud */
  $$('#segAptitud button').forEach(b => {
    b.onclick = () => { $$('#segAptitud button').forEach(x => x.classList.remove('on')); b.classList.add('on'); };
  });
  $('#scAsaEL').onclick = () => setTimeout(() =>
    $('#scAsaEL').classList.toggle('sel', $('#scAsaE').checked), 0);

  recalcular();
}

function pintarDx(){
  $('#dxSel').innerHTML = dxSeleccionados.map((d,i) =>
    '<span class="pill"><b>'+esc(d.c)+'</b><span>'+esc(d.d)+'</span>'+
    '<button data-dx="'+i+'">&times;</button></span>').join('') ||
    '<span class="mini">Sin diagnósticos cargados.</span>';
  $$('#dxSel button').forEach(b => b.onclick = () => {
    dxSeleccionados.splice(Number(b.dataset.dx), 1); pintarDx();
    if(window.__recalcValoracion) window.__recalcValoracion();
  });
}

function pintarMed(){
  const cont = $('#medLista');
  if(!medSeleccionados.length){
    cont.innerHTML = '<p class="mini">Sin medicación cargada.</p>'; return;
  }
  const color = { continuar:'ok', suspender:'danger', evaluar:'warn' };
  const txt = { continuar:'CONTINUAR', suspender:'SUSPENDER', evaluar:'EVALUAR' };
  cont.innerHTML = medSeleccionados.map((m,i) =>
    '<div class="card plano" style="border:1.5px solid var(--borde);padding:12px;margin-bottom:9px">'+
      '<div style="display:flex;align-items:center;gap:9px;margin-bottom:7px;flex-wrap:wrap">'+
        '<b style="flex:1;min-width:120px">'+esc(m.n)+'</b>'+
        '<span class="tag '+color[m.accion]+'">'+txt[m.accion]+'</span>'+
        '<button class="btn ghost chico" data-quitar="'+i+'">'+ico('borrar')+'</button>'+
      '</div>'+
      '<div class="grid c2">'+
        '<div class="campo" style="margin:0"><label>Dosis y frecuencia</label>'+
          '<input type="text" data-dosis="'+i+'" value="'+esc(m.dosis||'')+'" placeholder="Ej.: 10 mg/día"></div>'+
        '<div class="campo" style="margin:0"><label>Conducta</label><select data-accion="'+i+'">'+
          ['continuar','suspender','evaluar'].map(a =>
            '<option value="'+a+'"'+(m.accion===a?' selected':'')+'>'+txt[a]+'</option>').join('')+
        '</select></div>'+
      '</div>'+
      (m.nota ? '<div class="mini mt8" style="background:var(--bg-2);padding:8px 10px;border-radius:8px">'+esc(m.nota)+'</div>' : '')+
    '</div>').join('');
  $$('#medLista [data-quitar]').forEach(b => b.onclick = () => {
    medSeleccionados.splice(Number(b.dataset.quitar), 1); pintarMed(); });
  $$('#medLista [data-dosis]').forEach(i => i.oninput = () =>
    medSeleccionados[Number(i.dataset.dosis)].dosis = i.value);
  $$('#medLista [data-accion]').forEach(s => s.onchange = () => {
    medSeleccionados[Number(s.dataset.accion)].accion = s.value; pintarMed(); });
}

/* ============================ Lectura de datos ========================= */
function leerValoracion(){
  const antecedentes = {};
  Object.keys(ANTECEDENTES_SISTEMAS).forEach((s,i) => {
    const sel = leerChks('antSis'+i);
    if(sel.length) antecedentes[s] = sel;
  });
  const rcri = []; RCRI_ITEMS.forEach((it,i) => { if(chk('rcri'+i)) rcri.push(i); });
  const stopbang = {}; STOPBANG_ITEMS.forEach(it => stopbang[it.k] = chk('sb_'+it.k));
  const apfel = {}; APFEL_ITEMS.forEach(it => apfel[it.k] = chk('ap_'+it.k));
  const caprini = $$('.cap:checked').map(i => Number(i.dataset.i));
  const aptBtn = $('#segAptitud button.on');

  return {
    cie10: dxSeleccionados,
    antecedentes, antecedentesOtros: val('antOtros'),
    antAnestesicos: leerChks('antAnest'), antAnestDetalle: val('antAnestDet'),
    medicacion: medSeleccionados, medicacionOtros: val('medOtros'),
    alergias: leerChks('alerg'), alergiaDetalle: val('alergDet'),
    habitos: { tabaco: val('habTabaco'), tabacoCant: val('habTabacoCant'),
               alcohol: val('habAlcohol'), drogas: val('habDrogas') },
    examen: { ta:val('exTA'), fc:val('exFC'), fr:val('exFR'), spo2:val('exSpo2'), temp:val('exTemp'),
              peso:val('exPeso'), talla:val('exTalla'), cardio:val('exCardio'), respiratorio:val('exResp'),
              abdomen:val('exAbd'), neuro:val('exNeuro'), accesos:val('exAccesos'), columna:val('exColumna') },
    va: { mallampati:val('vaMallampati'), aperturaBucal:val('vaApertura'), tiromentoniana:val('vaTiro'),
          esternomentoniana:val('vaEsterno'), cuelloMov:val('vaCuello'), protrusion:val('vaProtrusion'),
          cuelloCirc:val('vaCuelloCirc'), denticion:val('vaDenticion'), intubacionPrevia:val('vaIntPrev'),
          cormackPrevia:val('vaCormack'), otros:leerChks('vaOtros'), plan:val('vaPlan') },
    lab: { hb:val('labHb'), hto:val('labHto'), plaquetas:val('labPlaq'), gb:val('labGB'), tp:val('labTP'),
           rin:val('labRIN'), kptt:val('labKPTT'), fibrinogeno:val('labFibrin'), glucemia:val('labGlu'),
           hba1c:val('labHba1c'), urea:val('labUrea'), creatinina:val('labCrea'), sodio:val('labNa'),
           potasio:val('labK'), got:val('labGOT'), gpt:val('labGPT'), bilirrubina:val('labBili'),
           albumina:val('labAlb'), fecha:val('labFecha') },
    estudios: { ecg:val('esEcg'), rx:val('esRx'), ecocardio:val('esEco'), espirometria:val('esEspiro') },
    scores: { asa:val('scAsa'), asaE:chk('scAsaE'), mets:val('mets'), fragilidad:val('fragilidad'),
              rcri, stopbang, apfel, caprini,
              arIncision:val('arIncision'), arDuracion:val('arDuracion'), arInf:chk('arInf') },
    ayuno: { tipo:val('ayTipo'), hora:val('ayHora'), riesgos:leerChks('ayRiesgo'),
             profilaxis:leerChks('ayProfilaxis') },
    riesgo: { aptitud: aptBtn ? aptBtn.dataset.v : 'apto', fundamento:val('rgFundamento'),
              interconsultas:val('rgInterconsultas'), fecha:val('rgFechaEval'), ambito:val('rgAmbito') }
  };
}
