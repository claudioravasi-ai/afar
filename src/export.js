/* =========================================================================
   EXPORTACION
   Ficha anestesica en Word (.doc editable) y PDF (impresion del navegador).
   Facturacion y estadisticas en Excel (.xls) y PDF.
   Todo documento lleva membrete de la AFAAR, de la institucion y del
   anestesiologo actuante.
   ========================================================================= */

/* ------------------------------------------------------------ Membrete */
function membrete(f, titulo){
  const u = DB.usuarios[f.ownerUid] || USUARIO || {};
  const inst = instituciones().find(i => i.id === f.institucion);
  return ''+
  '<div class="membrete">'+
    '<div class="a">A F A A R</div>'+
    '<div class="b">ASOCIACIÓN FUEGUINA DE ANESTESIA, ANALGESIA Y REANIMACIÓN</div>'+
    '<div class="b" style="font-size:9px;letter-spacing:.02em">Tierra del Fuego, Antártida e Islas del Atlántico Sur — República Argentina</div>'+
  '</div>'+
  '<table style="width:100%;border:0;margin-bottom:10px"><tr>'+
    '<td style="border:0;width:50%;vertical-align:top;padding:0">'+
      '<b style="color:#0b2545;font-size:10px">INSTITUCIÓN</b><br>'+
      esc(inst ? inst.nombre : '—')+'<br>'+
      '<span style="font-size:10px">'+esc(inst ? inst.ciudad + ' — ' + inst.tipo : '')+'</span>'+
    '</td>'+
    '<td style="border:0;width:50%;vertical-align:top;padding:0;text-align:right">'+
      '<b style="color:#0b2545;font-size:10px">'+
        (f.actoPorUid && f.actoPorUid !== f.ownerUid ? 'VALORACIÓN PREQUIRÚRGICA' : 'ANESTESIÓLOGO/A ACTUANTE')+
        '</b><br>'+
      esc((u.apellido||'') + ', ' + (u.nombre||''))+'<br>'+
      '<span style="font-size:10px">'+esc(u.titulo || 'Médico Especialista en Anestesiología')+'<br>'+
      'M.N. '+esc(matriculaTxt(u.matriculaNacional,'M.N.'))+' · M.P. '+esc(matriculaTxt(u.matriculaProvincial,'M.P.'))+'</span>'+
      (f.actoPorUid && f.actoPorUid !== f.ownerUid ? (function(){
        const w = DB.usuarios[f.actoPorUid] || {};
        return '<br><b style="color:#0b2545;font-size:10px">ACTO ANESTÉSICO</b><br>'+
          esc((w.apellido||'') + ', ' + (w.nombre||''))+'<br>'+
          '<span style="font-size:10px">M.N. '+esc(matriculaTxt(w.matriculaNacional,'M.N.'))+
          ' · M.P. '+esc(matriculaTxt(w.matriculaProvincial,'M.P.'))+'</span>'; })() : '')+
    '</td>'+
  '</tr></table>'+
  '<h1>'+esc(titulo)+'</h1>'+
  '<div style="text-align:center;font-size:10px;color:#456;margin-bottom:8px">'+
    'Emitido el '+fFechaLarga(hoyISO())+' a las '+ahoraHora()+' h</div>';
}

function par(l, v){
  if(v === undefined || v === null || v === '' ||
     (Array.isArray(v) && !v.length)) return '';
  const t = Array.isArray(v) ? v.join(' · ') : v;
  return '<div class="par"><b>'+esc(l)+':</b><span>'+esc(t)+'</span></div>';
}
let __secN = 0;
function seccion(t, contenido){
  if(!contenido || !contenido.replace(/\s/g,'')) return '';
  __secN++;
  return '<h2>'+__secN+'. '+esc(t)+'</h2>'+contenido;
}

/* ============================ FICHA ANESTESICA ============================ */
/* opts.paraPaciente: copia para el propio paciente. Sale todo lo clinico y el
   consentimiento, y NO salen los honorarios ni el registro intraoperatorio.
   Los honorarios son informacion economica entre el anestesiologo y el
   financiador, no del paciente. */
/* opts.parte recorta el documento segun para que se lo pide:
     'valoracion' -> solo lo preoperatorio, que es lo que se factura como
                     consulta prequirurgica;
     'acto'       -> el registro del acto y la recuperacion, que es lo que
                     respalda el honorario del acto anestesico. NO repite la
                     valoracion: viaja como documento aparte en el mismo
                     envio y, duplicada, obligaba al auditor a leer dos veces
                     lo mismo. Queda una sintesis prequirurgica de lo que hay
                     que tener a la vista al leer el intraoperatorio;
     sin opts     -> el documento entero de siempre. */
function documentoFicha(f, opts){
  const paraPaciente = !!(opts && opts.paraPaciente);
  const parte = (opts && opts.parte) || '';
  const soloVal  = parte === 'valoracion';
  const soloActo = parte === 'acto';
  __secN = 0;
  const p = DB.pacientes[f.pacienteId] || {};
  const v = f.v || {}, pl = f.plan || {}, a = f.acto || {}, h = f.hon || {}, co = f.consent || {};
  const eq = a.equipo || {};
  const u = DB.usuarios[f.ownerUid] || USUARIO || {};
  const ed = edadDe(p.fechaNac, f.fecha);
  const imc = calcIMC((v.examen||{}).peso || p.peso, (v.examen||{}).talla || p.talla);
  const sc = v.scores || {};

  /* recomputar escalas para el documento */
  const eg = calcElGanzouri({
    aperturaBucal:(v.va||{}).aperturaBucal, tiromentoniana:(v.va||{}).tiromentoniana,
    mallampati:(v.va||{}).mallampati, cuelloMov:(v.va||{}).cuelloMov,
    protrusion:(v.va||{}).protrusion, peso:(v.examen||{}).peso || p.peso,
    intubacionPrevia:(v.va||{}).intubacionPrevia });
  const rc = {}; RCRI_ITEMS.forEach((it,i) => rc[it.k] = (sc.rcri||[]).indexOf(i) >= 0);
  const rcri = calcRCRI(rc);
  const sb = calcSTOPBANG(sc.stopbang || {});
  const ap = calcApfel(sc.apfel || {});
  const cap = calcCaprini(sc.caprini || []);
  const ar = calcARISCAT({ edad:ed, spo2:(v.examen||{}).spo2, hb:(v.lab||{}).hb,
    infeccionRespiratoria:sc.arInf, incision:sc.arIncision, duracion:sc.arDuracion,
    urgencia:f.caracter !== 'programada' });

  const aptitud = { apto:'APTO para el acto anestésico', reservas:'APTO CON RESERVAS',
    optimizar:'REQUIERE OPTIMIZACIÓN PREVIA', noapto:'NO APTO en las condiciones actuales'
  }[(v.riesgo||{}).aptitud || 'apto'];

  const lab = v.lab || {};
  const labFilas = [['Hb',lab.hb,'g/dl'],['Hto',lab.hto,'%'],['Plaquetas',lab.plaquetas,'mil/µl'],
    ['GB',lab.gb,'mil/µl'],['TP',lab.tp,'%'],['RIN',lab.rin,''],['KPTT',lab.kptt,'seg'],
    ['Glucemia',lab.glucemia,'mg/dl'],['HbA1c',lab.hba1c,'%'],['Urea',lab.urea,'mg/dl'],
    ['Creatinina',lab.creatinina,'mg/dl'],['Na',lab.sodio,'mEq/l'],['K',lab.potasio,'mEq/l'],
    ['GOT',lab.got,''],['GPT',lab.gpt,''],['Bilirrubina',lab.bilirrubina,'mg/dl'],
    ['Albúmina',lab.albumina,'g/dl']].filter(x => x[1] !== '' && x[1] !== undefined && x[1] !== null);

  const antec = Object.keys(v.antecedentes || {}).map(s =>
    '<div class="par"><b>'+esc(s)+':</b><span>'+esc((v.antecedentes[s]||[]).join(' · '))+'</span></div>').join('');

  return ''+
  membrete(f, paraPaciente
    ? 'VALORACIÓN PREQUIRÚRGICA Y CONSENTIMIENTO INFORMADO — COPIA PARA EL PACIENTE'
    : (soloVal ? 'VALORACIÓN PRE-ANESTÉSICA (PREQUIRÚRGICA)'
    : (parte === 'acto' ? 'FICHA ANESTÉSICA — REGISTRO DEL ACTO ANESTÉSICO'
    : 'FICHA ANESTÉSICA — VALORACIÓN PREQUIRÚRGICA Y ACTO ANESTÉSICO')))+

  seccion('Datos del paciente',
    '<table><tr>'+
      '<td style="width:50%"><b>Apellido y nombre:</b> '+esc((p.apellido||'')+', '+(p.nombre||''))+'</td>'+
      '<td><b>DNI:</b> '+esc(p.dni||'—')+'</td></tr>'+
    '<tr><td><b>Fecha de nacimiento:</b> '+fFecha(p.fechaNac)+(ed!==null?' ('+ed+' años)':'')+'</td>'+
      '<td><b>Sexo:</b> '+esc({F:'Femenino',M:'Masculino',X:'X'}[p.sexo]||'—')+'</td></tr>'+
    '<tr><td><b>Peso / Talla:</b> '+esc(((v.examen||{}).peso||p.peso||'—'))+' kg / '+
      esc(((v.examen||{}).talla||p.talla||'—'))+' cm'+(imc?' — IMC '+imc.toFixed(1):'')+'</td>'+
      '<td><b>Grupo y factor:</b> '+esc(p.grupoSanguineo||'—')+'</td></tr>'+
    '<tr><td><b>Obra social:</b> '+esc(f.obraSocial||p.obraSocial||'—')+'</td>'+
      '<td><b>N.º de afiliado:</b> '+esc(f.nroAfiliado||p.nroAfiliado||'—')+'</td></tr>'+
    '<tr><td colspan="2"><b>Domicilio:</b> '+esc([p.domicilio,p.localidad].filter(Boolean).join(', ')||'—')+
      ' · <b>Teléfono:</b> '+esc(p.telefono||'—')+'</td></tr>'+
    '</table>')+

  seccion('Datos del acto quirúrgico',
    '<table><tr>'+
      '<td style="width:50%"><b>Fecha:</b> '+fFecha(f.fecha)+' '+esc(f.hora||'')+'</td>'+
      '<td><b>Carácter:</b> '+esc(nombreCaracter(soloVal ? caracterValoracion(f)
          : caracterActo(f)).toUpperCase())+
        (!soloVal && caracterCambio(f)
          ? '<span style="font-weight:400"> (en la valoración: '+
            esc(nombreCaracter(caracterValoracion(f)).toLowerCase())+')</span>' : '')+
        '</td></tr>'+
    /* Una ficha puede tener varios procedimientos. El documento los imprime
       TODOS, con el porcentaje con el que se factura cada uno: si el registro
       dice una sola cirugía y la factura tiene tres, la auditoría del
       financiador debita. Ver procedimientosFacturables() en core.js. */
    (function(){
      const l = procedimientosFacturables(f);
      const lat = f.lateralidad && f.lateralidad !== 'No aplica' ? ' ('+esc(f.lateralidad)+')' : '';
      if(l.length <= 1)
        return '<tr><td colspan="2"><b>Cirugía:</b> '+esc((l[0]||{}).n || f.cirugia || '—')+lat+'</td></tr>';
      return '<tr><td colspan="2"><b>Cirugías ('+l.length+'):</b>'+lat+'<br>'+
        l.map((x,i) => (i+1)+'. '+esc(x.n)+
          (x.cod ? ' ['+esc(x.cod)+']' : '')+
          (x.comp ? ' · complejidad '+esc(x.comp) : '')+
          ' · '+esc(nombreVia(x.via))+
          ' · <b>'+x.pct+' %</b>').join('<br>')+
        '</td></tr>';
    })()+
    '<tr><td><b>Especialidad:</b> '+esc(f.especialidad||'—')+'</td>'+
      '<td><b>Diagnóstico:</b> '+esc(f.diagnostico || (f.dxQuirurgico ? f.dxQuirurgico.d : '') || '—')+'</td></tr>'+
    '<tr><td><b>Cirujano/a:</b> '+esc(eq.cirujano || f.cirujano || '—')+
      (eq.cirujanoMP ? ' (M.P. '+esc(eq.cirujanoMP)+')' : '')+'</td>'+
      '<td><b>Ayudante:</b> '+esc(eq.ayudante || f.ayudante || '—')+'</td></tr>'+
    ((eq.instrumentador || eq.anestesista2 || eq.circulante || f.instrumentador || f.anestesista2)
      ? '<tr><td><b>Instrumentador/a:</b> '+esc(eq.instrumentador || f.instrumentador || '—')+'</td>'+
        '<td><b>2.º anestesiólogo / residente:</b> '+esc(eq.anestesista2 || f.anestesista2 || '—')+'</td></tr>'+
        (eq.circulante ? '<tr><td colspan="2"><b>Circulante / técnico:</b> '+esc(eq.circulante)+'</td></tr>' : '')
      : '')+
    '</table>')+

  /* Lo minimo que hay que tener a la vista mientras se lee el
     intraoperatorio. El resto esta en la valoracion, que va aparte. */
  (soloActo ? seccion('Síntesis prequirúrgica',
    par('Riesgo ASA', sc.asa ? 'ASA '+sc.asa+(sc.asaE ? ' E' : '') : '')+
    par('Aptitud', aptitud)+
    par('Alergias', (v.alergias && v.alergias.length) ? v.alergias : 'Sin alergias conocidas')+
    par('Detalle de alergias', v.alergiaDetalle)+
    par('Vía aérea (El-Ganzouri)', eg.n+'/12 — '+eg.texto)+
    par('Ayuno', [(v.ayuno||{}).tipo, (v.ayuno||{}).hora ? (v.ayuno).hora+' h' : '']
      .filter(Boolean).join(' · '))+
    par('Técnica prevista', pl.tecnica)+
    '<div class="par"><span>El detalle completo de la valoración pre-anestésica'+
      ((v.riesgo||{}).fecha ? ' del '+fFecha((v.riesgo).fecha) : '')+
      ' consta en el documento «Valoración pre-anestésica», que se remite por '+
      'separado en este mismo envío.</span></div>') : '')+

  (soloActo ? '' : seccion('Antecedentes patológicos',
    ((v.antecedentes2||[]).length
      ? '<div class="par"><b>Antecedentes:</b><span>'+
        esc(v.antecedentes2.map(c => c.n || c.d).join(' · '))+'</span></div>'
      : (v.sinAntecedentes ? '<div class="par"><span>Sin antecedentes relevantes.</span></div>' : ''))+
    antec + par('Otros antecedentes', v.antecedentesOtros)))+

  (soloActo ? '' : seccion('Antecedentes anestésicos',
    par('Antecedentes', v.antAnestesicos) + par('Detalle', v.antAnestDetalle)))+

  (soloActo ? '' : seccion('Medicación habitual',
    (v.medicacion||[]).length
      ? '<table><tr><th>Fármaco</th><th>Dosis</th><th>Conducta perioperatoria</th></tr>'+
        v.medicacion.map(m => '<tr><td>'+esc(m.n)+'</td><td>'+esc(m.dosis||'—')+'</td>'+
        '<td><b>'+esc({continuar:'CONTINUAR',suspender:'SUSPENDER',evaluar:'EVALUAR'}[m.accion]||'')+
        '</b>'+(m.nota?'<br><span style="font-size:10px">'+esc(m.nota)+'</span>':'')+'</td></tr>').join('')+
        '</table>'
      : '' + par('Medicación', v.medicacionOtros)))+

  (soloActo ? '' : seccion('Alergias', par('Alergias', v.alergias) + par('Detalle', v.alergiaDetalle)))+

  (soloActo ? '' : seccion('Hábitos y capacidad funcional',
    par('Tabaquismo', (v.habitos||{}).tabaco) + par('Carga tabáquica', (v.habitos||{}).tabacoCant)+
    par('Alcohol', (v.habitos||{}).alcohol) + par('Otras sustancias', (v.habitos||{}).drogas)+
    par('Capacidad funcional', sc.mets ? sc.mets + ' MET — ' + interpMET(sc.mets).texto : '')+
    par('Fragilidad (Rockwood)', sc.fragilidad ? sc.fragilidad + ' — ' + (FRAGILIDAD.find(x => String(x[0])===String(sc.fragilidad))||['',''])[1] : '')))+

  (soloActo ? '' : seccion('Examen físico',
    par('Signos vitales', [(v.examen||{}).ta ? 'TA '+(v.examen).ta+' mmHg' : '',
      (v.examen||{}).fc ? 'FC '+(v.examen).fc+' lpm' : '',
      (v.examen||{}).fr ? 'FR '+(v.examen).fr+' rpm' : '',
      (v.examen||{}).spo2 ? 'SpO₂ '+(v.examen).spo2+' %' : '',
      (v.examen||{}).temp ? 'T '+(v.examen).temp+' °C' : ''].filter(Boolean).join(' · '))+
    par('Cardiovascular', (v.examen||{}).cardio) + par('Respiratorio', (v.examen||{}).respiratorio)+
    par('Abdomen', (v.examen||{}).abdomen) + par('Neurológico', (v.examen||{}).neuro)+
    par('Accesos venosos', (v.examen||{}).accesos) + par('Columna', (v.examen||{}).columna)))+

  (soloActo ? '' : seccion('Evaluación de la vía aérea',
    par('Mallampati', (v.va||{}).mallampati ? 'Clase '+(v.va).mallampati : '')+
    par('Apertura bucal', (v.va||{}).aperturaBucal ? (v.va).aperturaBucal+' cm' : '')+
    par('Distancia tiromentoniana', (v.va||{}).tiromentoniana ? (v.va).tiromentoniana+' cm' : '')+
    par('Distancia esternomentoniana', (v.va||{}).esternomentoniana ? (v.va).esternomentoniana+' cm' : '')+
    par('Movilidad cervical', (v.va||{}).cuelloMov)+
    par('Test de mordida del labio superior', (v.va||{}).protrusion)+
    par('Circunferencia del cuello', (v.va||{}).cuelloCirc ? (v.va).cuelloCirc+' cm' : '')+
    par('Dentición', (v.va||{}).denticion)+
    par('Intubación previa', (v.va||{}).intubacionPrevia)+
    par('Cormack-Lehane previo', (v.va||{}).cormackPrevia)+
    par('Otros hallazgos', (v.va||{}).otros)+
    '<div class="par"><b>Índice de El-Ganzouri:</b><span>'+eg.n+'/12 — '+esc(eg.texto)+'</span></div>'+
    par('Plan de vía aérea', (v.va||{}).plan)))+

  (soloActo ? '' : seccion('Laboratorio y estudios',
    (labFilas.length ? '<table><tr>'+labFilas.map(x => '<th>'+esc(x[0])+'</th>').join('')+'</tr><tr>'+
      labFilas.map(x => '<td>'+esc(x[1])+' '+esc(x[2])+'</td>').join('')+'</tr></table>'+
      (lab.fecha ? '<div class="par"><b>Fecha del laboratorio:</b><span>'+fFecha(lab.fecha)+'</span></div>' : '')
      : '')+
    par('Electrocardiograma', (v.estudios||{}).ecg)+
    par('Radiografía de tórax', (v.estudios||{}).rx)+
    par('Ecocardiograma', (v.estudios||{}).ecocardio)+
    par('Otros estudios', (v.estudios||{}).espirometria)))+

  (soloActo ? '' : seccion('Estratificación del riesgo',
    '<table><tr><th>Escala</th><th>Resultado</th><th>Interpretación</th></tr>'+
      (sc.asa ? '<tr><td>ASA Physical Status</td><td><b>ASA '+esc(sc.asa)+(sc.asaE?' E':'')+'</b></td>'+
        '<td>'+esc((ASA_PS.find(x => x.v === sc.asa)||{}).t||'')+'</td></tr>' : '')+
      '<tr><td>El-Ganzouri (vía aérea)</td><td><b>'+eg.n+'/12</b></td><td>'+esc(eg.texto)+'</td></tr>'+
      '<tr><td>RCRI (cardíaco)</td><td><b>'+rcri.n+'/6</b></td><td>'+esc(rcri.texto)+'</td></tr>'+
      '<tr><td>ARISCAT (pulmonar)</td><td><b>'+ar.n+'</b></td><td>'+esc(ar.texto)+'</td></tr>'+
      '<tr><td>STOP-BANG (SAHOS)</td><td><b>'+sb.n+'/8</b></td><td>'+esc(sb.texto)+'</td></tr>'+
      '<tr><td>Apfel (NVPO)</td><td><b>'+ap.n+'/4</b></td><td>'+esc(ap.texto)+'</td></tr>'+
      '<tr><td>Caprini (TEV)</td><td><b>'+cap.n+'</b></td><td>'+esc(cap.texto)+'</td></tr>'+
    '</table>'))+

  (soloActo ? '' : seccion('Ayuno preoperatorio',
    par('Última ingesta', (v.ayuno||{}).tipo) + par('Hora', (v.ayuno||{}).hora)+
    par('Factores de riesgo de aspiración', (v.ayuno||{}).riesgos)+
    par('Profilaxis indicada', (v.ayuno||{}).profilaxis)))+

  (soloActo ? '' : seccion('Plan anestésico',
    par('Técnica propuesta', pl.tecnica) + par('Manejo de la vía aérea', pl.dispositivosVA)+
    par('Monitoreo estándar', pl.monitoreoEstandar) + par('Monitoreo avanzado', pl.monitoreoAvanzado)+
    par('Accesos vasculares', pl.accesos)+
    par('Profilaxis antibiótica', pl.atb === 'Otro' ? pl.atbOtro : pl.atb)+
    par('Tromboprofilaxis', pl.tev) + par('Profilaxis de NVPO', pl.nvpo)+

    par('Previsión transfusional', pl.transfusion) + par('Destino postoperatorio', pl.destino)+
    par('Indicaciones al paciente', pl.indicaciones) + par('Observaciones', pl.observaciones)))+

  (soloActo ? '' : seccion('Conclusión de la valoración preanestésica',
    '<div style="border:2px solid #0b2545;padding:9px;margin-bottom:8px;text-align:center;font-weight:bold;font-size:13px">'+
      esc(aptitud)+'</div>'+
    par('Fundamentación', (v.riesgo||{}).fundamento)+
    par('Interconsultas solicitadas', (v.riesgo||{}).interconsultas)+
    par('Fecha de la evaluación', fFecha((v.riesgo||{}).fecha))+
    par('Ámbito', (v.riesgo||{}).ambito)))+

  ((paraPaciente || soloVal) ? '' : documentoActo(f))+
  ((paraPaciente || soloVal) ? '' : documentoRecuperacion(f))+

  /* En la ficha del acto va la constancia de que se firmo, no el texto
     entero: ese ya viaja completo en la valoracion del mismo envio. */
  ((co.quien && !(opts && opts.sinConsentimiento)) ? seccion('Consentimiento informado anestésico',
    (soloActo ? '' :
      '<div style="font-size:10.5px;white-space:pre-line;text-align:justify;line-height:1.45;'+
      'border:1px solid #c9d6e3;padding:9px;background:#fbfdff">'+esc(TEXTO_CONSENTIMIENTO)+'</div>')+
    par('Firma', co.quien) + par('Firmante', co.firmante)+
    par('Declaraciones', co.items) + par('Aclaraciones', co.observaciones)+
    par('Fecha del consentimiento', fFecha(co.fecha) + (co.hora ? ' — ' + co.hora + ' h' : ''))+
    (soloActo ? '<div class="par"><span>El texto completo del consentimiento consta en la '+
      'valoración pre-anestésica.</span></div>' : '')) : '')+

  ((!paraPaciente && (h.modalidad || (f.honConsulta||{}).modalidad)) ? seccion('Honorarios profesionales',
    '<table><tr><th>Concepto</th><th>Profesional</th><th>Modalidad</th><th>Importe</th><th>Estado</th></tr>'+
    (((f.honConsulta||{}).modalidad && parte !== 'acto') ? '<tr><td>Consulta prequirúrgica</td>'+
      '<td>'+esc(nombreUsuario(f.ownerUid))+'</td>'+
      '<td>'+esc((MODALIDADES_CONSULTA.find(m=>m.id===f.honConsulta.modalidad)||{}).n||'—')+'</td>'+
      '<td>'+fMoneda(f.honConsulta.total||0)+'</td>'+
      '<td>'+esc(f.honConsulta.estado||'Pendiente')+'</td></tr>' : '')+
    ((h.modalidad && !soloVal) ? '<tr><td>Acto anestésico'+
      (h.ua ? ' ('+h.ua+' UA × '+fMoneda(h.valorUnidad||0)+
        (h.pctAdicional ? ' + '+h.pctAdicional+' %' : '')+')' : '')+'</td>'+
      '<td>'+esc(nombreUsuario(actorFicha(f)))+'</td>'+
      '<td>'+esc((MODALIDADES_HONORARIOS.find(m=>m.id===h.modalidad)||{}).n||'—')+'</td>'+
      '<td>'+fMoneda(h.total||0)+'</td>'+
      '<td>'+esc(h.estado||'Pendiente')+'</td></tr>' : '')+
    '</table>') : '')+

  '<div class="firmas">'+
    '<div>'+(co.firmaPaciente ? '<img src="'+co.firmaPaciente+'" style="height:48px;display:block;margin:0 auto -6px">' : '<div style="height:42px"></div>')+
      'Firma del paciente o representante</div>'+
    '<div>'+((co.firmaAnestesiologo || u.firmaDataUrl) ?
      '<img src="'+(co.firmaAnestesiologo || u.firmaDataUrl)+'" style="height:48px;display:block;margin:0 auto -6px">' : '<div style="height:42px"></div>')+
      esc((u.apellido||'')+', '+(u.nombre||''))+'<br>M.P. '+esc(matriculaTxt(u.matriculaProvincial,'M.P.'))+
      (f.actoPorUid && f.actoPorUid !== f.ownerUid ? '<br>Valoración prequirúrgica' : '')+'</div>'+
    (f.actoPorUid && f.actoPorUid !== f.ownerUid ? (function(){
      const w = DB.usuarios[f.actoPorUid] || {};
      return '<div>'+(w.firmaDataUrl
          ? '<img src="'+w.firmaDataUrl+'" style="height:48px;display:block;margin:0 auto -6px">'
          : '<div style="height:42px"></div>')+
        esc((w.apellido||'')+', '+(w.nombre||''))+'<br>M.P. '+esc(matriculaTxt(w.matriculaProvincial,'M.P.'))+
        '<br>Acto anestésico</div>'; })() : '')+
  '</div>'+
  '<div style="margin-top:22px;font-size:9px;color:#678;text-align:center;border-top:1px solid #ccd">'+
    'Documento generado por AFAAR · Ficha '+esc(f.id)+' · '+
    'Última modificación: '+esc(f.modificado ? fFecha(f.modificado)+' '+String(f.modificado).slice(11,16) : '—')+
    ' por '+esc(f.modificadoPorNombre || nombreUsuario(f.modificadoPor||f.ownerUid))+'<br>'+
    ((f.firma||{}).firmado
      ? 'Registro finalizado y firmado el '+fFecha(f.firma.fecha)+' '+esc(f.firma.hora||'')+
        ' por '+esc(f.firma.nombre||'')+(f.firma.mp?' — M.P. '+esc(matriculaTxt(f.firma.mp,'M.P.')):'')+'<br>'
      : 'Registro NO finalizado: la ficha todavía no fue firmada.<br>')+
    'Historia clínica sujeta a la Ley 26.529. Conservación mínima: 10 años.'+
  '</div>';
}

/* =========================================================================
   REGISTRO DEL ACTO ANESTESICO EN EL DOCUMENTO
   Las tres tablas del intraoperatorio: drogas, signos vitales y eventos,
   mas el balance hidrico. Es la parte que antes era un campo de texto libre.
   ========================================================================= */
function documentoActo(f){
  const a = f.acto || {};
  const p = DB.pacientes[f.pacienteId] || {};
  const peso = Number(p.peso) || 0;
  const drogas = a.drogas || [];
  const ctrls = (a.controles || []).slice().sort((x,y) => (x.hora||'') < (y.hora||'') ? -1 : 1);
  const evs = a.eventos2 || [];
  const bal = calcularBalance(a.balance);
  const disp = DISPOSITIVOS_FLUJO.find(d => d.k === a.dispositivo);
  const durCx = minutosEntre(a.inicioCirugia, a.finCirugia);
  const durAn = minutosEntre(a.inicioAnestesia, a.finAnestesia);
  const acum = acumuladoAnestesicosLocales(drogas, peso);

  return seccion('Registro del acto anestésico',
    (f.actoPorUid && f.actoPorUid !== f.ownerUid
      ? par('Realizado por', nombreUsuario(f.actoPorUid)) : '')+
    '<table><tr>'+
      '<td style="width:50%"><b>Ingreso a quirófano:</b> '+esc(a.ingreso||'—')+'</td>'+
      '<td><b>Salida a recuperación:</b> '+esc(a.salida||'—')+'</td></tr>'+
    '<tr><td><b>Cirugía:</b> '+esc(a.inicioCirugia||'—')+' a '+esc(a.finCirugia||'—')+
      (durCx !== null ? ' ('+duracionTexto(durCx)+')' : '')+'</td>'+
      '<td><b>Anestesia:</b> '+esc(a.inicioAnestesia||'—')+' a '+esc(a.finAnestesia||'—')+
      (durAn !== null ? ' ('+duracionTexto(durAn)+')' : '')+'</td></tr>'+
    '</table>'+
    par('Técnica anestésica', (a.tecnicas||[]).map(k =>
      (TECNICAS_FLUJO.find(t => t.k === k)||{}).t).filter(Boolean))+
    par('Detalle de la técnica', a.tecnicaDetalle)+
    par('Vía aérea', (disp ? disp.t : '') + (a.tamano ? ' '+a.tamano : '') +
      (a.vaDificil === 'si' ? ' — VÍA AÉREA DIFÍCIL' : ''))+
    par('Cormack-Lehane', a.cormack) + par('Intentos de intubación', a.intentos)+
    par('Monitorización', (a.monitor||[]).concat(a.monitorExtra||[]))+
    par('Accesos vasculares', a.accesos)+
    par('Lista de verificación OMS', (a.oms||[]).map(o =>
      ({entrada:'Entrada',pausa:'Pausa quirúrgica',salida:'Salida'})[o]))+

    /* ---------------------------- drogas ---------------------------- */
    '<h3>Drogas administradas</h3>'+
    (drogas.length
      ? '<table><tr><th>Hora</th><th>Fármaco</th><th>Dosis</th><th>Vía</th><th>Observación</th></tr>'+
        drogas.map(d => '<tr><td>'+esc(d.hora||'—')+'</td><td>'+esc(d.n)+'</td>'+
          '<td>'+esc(fDosis(d.dosis)+' '+(d.unidad||''))+
          (peso && d.unidad === 'mg' ? ' ('+fDosis(d.dosis/peso)+' mg/kg)' : '')+'</td>'+
          '<td>'+esc(d.via||'—')+'</td>'+
          '<td style="font-size:10px">'+esc([d.nota,
            d.pct ? fDosis(d.pct)+' % · '+d.mL+' mL' : '',
            d.infMLh ? d.infMLh+' mL/h' : ''].filter(Boolean).join(' · '))+'</td></tr>').join('')+
        '</table>'
      : '<p style="font-size:10.5px">Sin drogas registradas.</p>')+
    par('Notas de fármacos', a.drogasNota)+
    (acum.items.length
      ? '<div class="par"><b>Anestésicos locales:</b><span>'+
        esc(acum.items.map(x => x.n+' '+fDosis(x.mg)+' mg'+
          (x.mgKg !== null ? ' ('+fDosis(x.mgKg)+' mg/kg)' : '')).join(' · '))+
        (acum.mezcla ? ' — combinación de anestésicos locales: toxicidad aditiva.' : '')+
        '</span></div>' : '')+

    /* ------------------------ signos vitales ------------------------ */
    '<h3>Signos vitales intraoperatorios</h3>'+
    (ctrls.length
      ? '<table><tr><th>Hora</th><th>TA (mmHg)</th><th>PAM</th><th>FC (lpm)</th>'+
        '<th>FR (rpm)</th><th>SpO₂ (%)</th>'+
        '<th>EtCO₂ (mmHg)</th><th>Temp (°C)</th><th>TOF</th></tr>'+
        ctrls.map(c => '<tr><td>'+esc(c.hora||'—')+
            /* Los controles cargados con el preseteado de valores normales
               salen marcados tambien en el papel: quien lea la historia tiene
               que poder distinguir el valor tipeado del preseteado. */
            (c.preset ? ' <span style="font-size:8px;letter-spacing:.4px">NORMAL</span>' : '')+
          '</td>'+
          '<td>'+esc(valorVital(c,'ta')||'—')+'</td>'+
          '<td>'+esc(valorVital(c,'pam')||'—')+'</td>'+
          '<td>'+esc(c.fc||'—')+'</td><td>'+esc(c.fr||'—')+'</td>'+
          '<td>'+esc(c.spo2||'—')+'</td><td>'+esc(c.etco2||'—')+'</td>'+
          '<td>'+esc(c.temp||'—')+'</td><td>'+esc(c.tof||'—')+'</td></tr>').join('')+
        '</table>'+
        (ctrls.some(c => c.preset)
          ? '<p style="font-size:9.5px">Los controles marcados <b>NORMAL</b> se cargaron con el '+
            'preseteado de valores normales calculado para este paciente y confirmados por el '+
            'anestesiólogo actuante.</p>' : '')+
        (ctrls.some(c => c.tofSitio)
          ? '<p style="font-size:9.5px">TOF medido en: '+
            esc(Array.from(new Set(ctrls.map(c => c.tofSitio).filter(Boolean))).join(' · '))+
            '. El recuento se expresa sobre 4 respuestas; el cociente T4/T1, en por ciento.</p>' : '')
      : '<p style="font-size:10.5px">Sin controles registrados.</p>')+

    /* -------------------------- balance ----------------------------- */
    '<h3>Balance hídrico</h3>'+
    '<table><tr><th>Ingresos</th><th>mL</th><th>Egresos</th><th>mL</th></tr>'+
      BALANCE_INGRESOS.map((x,i) => {
        const e = BALANCE_EGRESOS[i];
        return '<tr><td>'+esc(x.t)+'</td><td>'+((a.balance||{})[x.k]||0)+'</td>'+
          '<td>'+(e ? esc(e.t) : '')+'</td><td>'+(e ? ((a.balance||{})[e.k]||0) : '')+'</td></tr>';
      }).join('')+
      '<tr><td><b>Total ingresos</b></td><td><b>'+bal.ingresos+'</b></td>'+
      '<td><b>Total egresos</b></td><td><b>'+bal.egresos+'</b></td></tr>'+
      '<tr><td colspan="3"><b>BALANCE</b></td><td><b>'+
        (bal.balance>=0?'+':'')+bal.balance+' mL</b></td></tr>'+
    '</table>'+
    par('Hemoderivados', a.hemoderivados) + par('Drogas vasoactivas', a.vasoactivos)+

    /* --------------------------- eventos ---------------------------- */
    '<h3>Eventos intraoperatorios</h3>'+
    (evs.length
      ? '<table><tr><th>Hora</th><th>Evento</th><th>Descripción</th><th>Conducta</th></tr>'+
        evs.map(e => '<tr><td>'+esc(e.hora||'—')+'</td><td><b>'+esc(e.tipo)+'</b></td>'+
          '<td>'+esc(e.descripcion||'—')+'</td><td>'+esc(e.conducta||'—')+'</td></tr>').join('')+
        '</table>'
      : '<p style="font-size:10.5px">'+(a.sinEventos
          ? 'Sin eventos adversos durante el procedimiento.'
          : 'No se registraron eventos.')+'</p>')+
    par('Observaciones del acto', a.observaciones));
}

function documentoRecuperacion(f){
  const r = f.recup || {};
  if(!r.aldreteTotal && !r.destino && !r.observaciones && !(r.analgesia||[]).length) return '';
  return seccion('Recuperación postanestésica',
    par('Hora de ingreso a la URPA', r.hora)+
    par('Oxigenoterapia', r.oxigeno)+
    (r.aldreteCompleto
      ? '<table><tr>'+ALDRETE.map(i => '<th>'+esc(i.t)+'</th>').join('')+'<th>Total</th></tr><tr>'+
        ALDRETE.map(i => '<td>'+((r.aldrete||{})[i.k])+'</td>').join('')+
        '<td><b>'+r.aldreteTotal+'/10</b></td></tr></table>'+
        '<div class="par"><span>'+(r.aldreteTotal >= 9
          ? 'Cumple criterios de alta de la recuperación postanestésica.'
          : 'No alcanza el puntaje de alta (≥ 9).')+'</span></div>'
      : '')+
    par('Dolor (EVA)', r.eva !== '' && r.eva !== undefined ? r.eva + '/10' : '')+
    par('Náuseas / vómitos', r.nauseas === 'si' ? 'Sí' : (r.nauseas === 'no' ? 'No' : ''))+
    par('Rescate administrado', r.rescate)+
    par('Destino', r.destino) + par('Estado al egreso', r.estado)+
    /* La analgesia postoperatoria se indica al egreso de la URPA, no en la
       valoracion prequirurgica: se imprime aca, que es donde se decidio.
       Las fichas anteriores a la mudanza la tienen en el plan y se imprime
       igual, para que no desaparezca de ningun documento ya emitido. */
    par('Analgesia postoperatoria indicada',
        (r.analgesia && r.analgesia.length) ? r.analgesia : (f.plan||{}).analgesia)+
    par('Esquema analgésico detallado',
        r.analgesiaDetalle || (f.plan||{}).analgesiaDetalle)+
    par('Duración prevista del esquema',
        r.analgesiaDuracion || (f.plan||{}).analgesiaDuracion)+
    par('Rescate analgésico indicado',
        r.analgesiaRescate || (f.plan||{}).analgesiaRescate)+
    par('Seguimiento del dolor a cargo de', r.analgesiaResponsable)+
    par('Observaciones', r.observaciones));
}

/* --------------------------------------------------------------- Word */
const CSS_DOC = 'body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#111;margin:0}'+
  'h1{font-size:13pt;text-align:center;margin:2px 0 4px}'+
  'h2{font-size:10pt;text-transform:uppercase;letter-spacing:.06em;color:#0b2545;'+
    'border-bottom:1.2pt solid #0b2545;padding-bottom:2px;margin:12px 0 6px}'+
  'h3{font-size:9pt;text-transform:uppercase;letter-spacing:.04em;color:#1b4e85;'+
    'margin:9px 0 4px}'+
  '.membrete{border-bottom:2.5pt double #0b2545;padding-bottom:7px;margin-bottom:9px;text-align:center}'+
  '.membrete .a{font-size:17pt;font-weight:bold;letter-spacing:.16em;color:#0b2545}'+
  '.membrete .b{font-size:8pt;letter-spacing:.05em;color:#345}'+
  'table{border-collapse:collapse;width:100%;font-size:9.5pt;margin-bottom:5px}'+
  'th,td{border:.5pt solid #c9d6e3;padding:3pt 5pt;text-align:left;vertical-align:top}'+
  'th{background:#eef4fa;color:#0b2545;font-size:8.5pt}'+
  '.par{margin-bottom:2px;font-size:10pt}.par b{color:#0b2545}'+
  '.firmas{margin-top:34px}.firmas div{display:inline-block;width:45%;text-align:center;'+
    'border-top:.5pt solid #444;padding-top:3px;font-size:8.5pt;margin:0 2%}';

/* =========================================================================
   LOS TRES DOCUMENTOS QUE SE LE MANDAN AL PACIENTE
   -------------------------------------------------------------------------
   Van como TRES ARCHIVOS PDF SEPARADOS, no pegados uno abajo del otro en el
   cuerpo del mail:

     1. Valoracion pre-anestesica.  Lo clinico: filiacion, antecedentes,
        medicacion, alergias, examen, laboratorio, escalas y plan.
     2. Consentimiento informado anestesico.  Documento aparte porque es un
        instrumento juridico autonomo: se firma, se guarda y eventualmente se
        presenta solo. Mezclado adentro de otro papel pierde esa condicion.
     3. Hoja de indicaciones.  En castellano llano: ayuno, medicacion,
        horario, acompanante. Es la unica de las tres que el paciente
        realmente va a leer, y por eso va suelta.

   NINGUNO lleva un solo dato de facturacion: honorarios, modalidades e
   importes son cosa entre el anestesiologo y el financiador.

   Los tres se arman aca como HTML completo y el conversor de Google los pasa
   a PDF antes de adjuntarlos (ver apps-script/Codigo.gs). La app no necesita
   ninguna libreria de PDF y el paciente recibe archivos de verdad.
   ========================================================================= */

/* Envoltorio comun: hoja A4 con los estilos del documento */
function hojaHTML(titulo, cuerpo){
  return '<!DOCTYPE html><html lang="es-AR"><head><meta charset="utf-8">'+
    '<title>'+esc(titulo)+'</title>'+
    '<style>@page{size:A4;margin:1.5cm}'+CSS_DOC+
    '.consentimiento{font-size:10pt;white-space:pre-line;text-align:justify;line-height:1.5}'+
    '.declaraciones{font-size:10pt;margin:8px 0}'+
    '.declaraciones div{margin-bottom:3px}'+
    '.indic{font-size:11.5pt;line-height:1.7}'+
    '.indic h2{margin-top:14px}'+
    '.indic li{margin-bottom:6px}'+
    '.caja-legal{border:1pt solid #c9d6e3;background:#fbfdff;padding:8pt;font-size:8.5pt;'+
      'color:#456;line-height:1.5;margin-top:16px}'+
    '</style></head><body>'+cuerpo+'</body></html>';
}

/* Pie legal comun a los tres documentos */
function pieLegalPaciente(f){
  const u = DB.usuarios[f.ownerUid] || USUARIO || {};
  return '<div class="caja-legal">'+
    '<b>AFAAR — Asociación Fueguina de Anestesia, Analgesia y Reanimación.</b> '+
    'Tierra del Fuego, Antártida e Islas del Atlántico Sur, República Argentina.<br>'+
    'Profesional actuante: '+esc((u.apellido||'')+', '+(u.nombre||''))+' — '+
    esc(u.titulo || 'Médico/a Especialista en Anestesiología')+' — '+
    'M.N. '+esc(matriculaTxt(u.matriculaNacional,'M.N.'))+' · '+
    'M.P. '+esc(matriculaTxt(u.matriculaProvincial,'M.P.'))+
    (u.email ? ' — '+esc(u.email) : '')+'.<br><br>'+
    'Este documento contiene datos de salud, que la ley considera datos sensibles, y se entrega '+
    'a su titular. <b>Ley 26.529</b> de Derechos del Paciente y su modificatoria <b>Ley 26.742</b>: '+
    'integra su historia clínica, le pertenece y se conserva por un plazo mínimo de diez años. '+
    '<b>Ley 17.132</b> del Ejercicio de la Medicina: el profesional firmante está obligado a guardar '+
    'secreto profesional. <b>Ley 25.326</b> de Protección de los Datos Personales: usted puede '+
    'acceder a sus datos, pedir su rectificación y conocer su destino. Si usted no es el '+
    'destinatario de este documento, destrúyalo y avise al remitente.'+
  '</div>';
}

/* ---- 1. Valoracion pre-anestesica, sin una linea de facturacion ---- */
function docPacienteValoracion(f){
  return hojaHTML('Valoración pre-anestésica',
    documentoFicha(f, { paraPaciente:true, parte:'valoracion', sinConsentimiento:true })+
    pieLegalPaciente(f));
}

/* ---- 2. Consentimiento informado anestesico, como instrumento aparte ---- */
function docPacienteConsentimiento(f){
  const p  = DB.pacientes[f.pacienteId] || {};
  const co = f.consent || {};
  const u  = DB.usuarios[f.ownerUid] || USUARIO || {};
  const ed = edadDe(p.fechaNac, fechaValoracionDe(f));
  __secN = 0;

  return hojaHTML('Consentimiento informado anestésico',
    membrete(f, 'CONSENTIMIENTO INFORMADO ANESTÉSICO')+

    seccion('Datos del paciente',
      par('Apellido y nombre', (p.apellido||'')+', '+(p.nombre||''))+
      par('DNI', p.dni) + par('Historia clínica', p.hc)+
      par('Edad', ed !== null ? ed+' años' : '')+
      /* El consentimiento es de ESTAS intervenciones. Si se hacen tres y el
         papel nombra una, el consentimiento no cubre las otras dos
         (Ley 26.529, art. 5: se informa el procedimiento propuesto). */
      par('Cirugía propuesta', procedimientosFacturables(f).map(x => x.n).join(' + ') || f.cirugia)+
      par('Diagnóstico', f.diagnostico)+
      par('Lateralidad', f.lateralidad && f.lateralidad !== 'No aplica' ? f.lateralidad : '')+
      par('Institución', nombreInstitucion(f.institucion))+
      par('Técnica anestésica propuesta', (f.plan||{}).tecnica))+

    seccion('Declaración de consentimiento',
      '<div class="consentimiento">'+esc(TEXTO_CONSENTIMIENTO)+'</div>')+

    ((co.items||[]).length ? seccion('Declaraciones del paciente',
      '<div class="declaraciones">'+ (co.items||[]).map(i =>
        '<div>'+(i.indexOf('RECHAZA') === 0 ? '<b style="color:#a11">☒ '+esc(i)+'</b>'
                                            : '☒ '+esc(i))+'</div>').join('') +'</div>') : '')+

    seccion('Otorgamiento',
      par('Firma el consentimiento', co.quien)+
      par('Nombre y documento del firmante', co.firmante)+
      par('Aclaraciones', co.observaciones)+
      par('Lugar y fecha', (nombreInstitucion(f.institucion)||'')+', '+
        fFechaLarga(co.fecha || fechaValoracionDe(f))+(co.hora ? ' — '+co.hora+' h' : ''))+
      ((co.quien||'').indexOf('revocado') >= 0
        ? '<div style="border:2px solid #a11;color:#a11;padding:8px;text-align:center;'+
          'font-weight:bold;margin-top:8px">CONSENTIMIENTO REVOCADO POR EL PACIENTE — '+
          'NO SE DEBE REALIZAR EL ACTO ANESTÉSICO</div>' : ''))+

    '<div class="firmas">'+
      '<div>'+(co.firmaPaciente
        ? '<img src="'+co.firmaPaciente+'" style="height:52px;display:block;margin:0 auto -6px">'
        : '<div style="height:46px"></div>')+
        esc(co.firmante || 'Paciente o representante legal')+'<br>Firma y aclaración</div>'+
      '<div>'+((co.firmaAnestesiologo || u.firmaDataUrl)
        ? '<img src="'+(co.firmaAnestesiologo || u.firmaDataUrl)+'" style="height:52px;display:block;margin:0 auto -6px">'
        : '<div style="height:46px"></div>')+
        esc((u.apellido||'')+', '+(u.nombre||''))+'<br>M.P. '+
        esc(matriculaTxt(u.matriculaProvincial,'M.P.'))+' — Anestesiología</div>'+
    '</div>'+

    '<div style="margin-top:18px;font-size:9px;color:#678;text-align:center">'+
      'El paciente puede revocar este consentimiento en cualquier momento anterior al acto '+
      'anestésico, en forma libre y sin expresar causa (Ley 26.529, art. 10).</div>'+

    pieLegalPaciente(f));
}

/* ---- 3. Hoja de indicaciones, en castellano llano ---- */
function docPacienteIndicaciones(f){
  const p  = DB.pacientes[f.pacienteId] || {};
  const pl = f.plan || {};
  const v  = f.v || {};
  const ay = v.ayuno || {};
  const meds = (v.medicacion2 || v.medicacion || []).map(m => typeof m === 'string' ? m : (m.n || m.d || ''))
    .filter(Boolean);

  const li = (t, d) => d ? '<li><b>'+esc(t)+'</b> '+esc(d)+'</li>' : '';

  return hojaHTML('Indicaciones para el día de la cirugía',
    membrete(f, 'INDICACIONES PARA EL DÍA DE LA CIRUGÍA')+
    '<div class="indic">'+
      '<p>Estimado/a <b>'+esc(p.nombre || p.apellido || 'paciente')+'</b>: estas son las '+
      'indicaciones que tiene que cumplir antes de su '+
      (f.cirugia ? '<b>'+esc(textoProcedimientos(f) || f.cirugia)+'</b>' : 'intervención')+'. '+
      'Léalas con atención y guarde esta hoja.</p>'+

      '<h2>Ayuno</h2>'+
      '<ul>'+
        '<li><b>Ocho horas</b> sin comidas sólidas ni leche de vaca.</li>'+
        '<li><b>Seis horas</b> sin comidas livianas.</li>'+
        '<li><b>Dos horas</b> sin líquidos claros (agua, té o jugo colado sin pulpa).</li>'+
        (ay.tipo ? '<li><b>Indicación particular:</b> '+esc(ay.tipo)+
          (ay.desde ? ' — desde las '+esc(ay.desde)+' h' : '')+'</li>' : '')+
      '</ul>'+
      '<p><b>Importante:</b> si no cumple el ayuno, la cirugía se suspende. No es un capricho: '+
      'con el estómago lleno el contenido puede pasar al pulmón durante la anestesia.</p>'+

      '<h2>Medicación</h2>'+
      '<ul>'+
        li('Medicación que debe seguir tomando:', pl.indicaciones)+
        (meds.length ? '<li><b>Su medicación habitual registrada:</b> '+esc(meds.join(' · '))+
          '. Consulte con su anestesiólogo/a cuál suspender.</li>' : '')+
        '<li>El día de la cirugía tome la medicación indicada <b>con un sorbo de agua</b>.</li>'+
        '<li><b>No suspenda ni agregue ningún medicamento por su cuenta.</b></li>'+
      '</ul>'+

      '<h2>El día de la cirugía</h2>'+
      '<ul>'+
        '<li>Preséntese en <b>'+esc(nombreInstitucion(f.institucion) || 'la institución indicada')+'</b>'+
          (fechaCirugiaDe(f) ? ' el <b>'+fFechaLarga(fechaCirugiaDe(f))+'</b>' : ' el día y horario que le indiquen')+
          '.</li>'+
        '<li>Venga <b>con un acompañante adulto responsable</b>.</li>'+
        '<li>Sin maquillaje ni esmalte de uñas. Retire alhajas, piercings, lentes de contacto, '+
          'audífonos y prótesis dentales.</li>'+
        '<li>Traiga esta hoja, su documento, el carnet de la obra social y los estudios que tenga.</li>'+
        (pl.destino ? '<li><b>Destino previsto después de la cirugía:</b> '+esc(pl.destino)+'</li>' : '')+
      '</ul>'+

      '<h2>Avísenos antes si…</h2>'+
      '<ul>'+
        '<li>Tiene fiebre, tos, catarro o cualquier síntoma nuevo.</li>'+
        '<li>Empezó a tomar una medicación nueva.</li>'+
        '<li>Cambió algo en su salud desde la consulta.</li>'+
        '<li>Está o podría estar embarazada.</li>'+
      '</ul>'+
      '<p>Puede avisarnos respondiendo al correo con el que recibió esta documentación.</p>'+
    '</div>'+
    pieLegalPaciente(f));
}

function exportarFichaWord(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" '+
    'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'+
    '<head><meta charset="utf-8"><title>Ficha anestésica</title>'+
    '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>'+
    '<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'+
    '<style>@page{size:A4;margin:1.6cm}'+CSS_DOC+'</style></head><body>'+
    documentoFicha(f) + '</body></html>';
  const nombre = 'Ficha-' + (p.apellido||'paciente').replace(/\s+/g,'') + '-' + (f.fecha||hoyISO()) + '.doc';
  descargar(nombre, '﻿' + html, 'application/msword;charset=utf-8');
  auditar('export-word', nombre);
  toast('Documento Word descargado.', 'ok');
}

/* ---------------------------------------------------------------- PDF */
function imprimir(html){
  let area = $('#areaImpresion');
  if(!area){
    area = document.createElement('div');
    area.id = 'areaImpresion';
    document.body.appendChild(area);
  }
  area.innerHTML = '<div class="doc">'+html+'</div>';
  document.body.classList.add('imprimiendo');
  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove('imprimiendo'), 600);
  }, 220);
}
function imprimirFicha(f){
  imprimir(documentoFicha(f));
  auditar('export-pdf', f.id);
}

/* -------------------------------------------------------------- Excel */
function tablaExcel(titulo, cabeceras, filas, resumen){
  return '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8">'+
    '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>'+
    '<x:Name>AFAAR</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>'+
    '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->'+
    '<style>td,th{border:.5pt solid #b8c6d6;padding:4px 7px;font-family:Calibri,Arial;font-size:11pt}'+
    'th{background:#0b2545;color:#fff;font-weight:bold}'+
    '.tit{font-size:15pt;font-weight:bold;color:#0b2545;border:0}'+
    '.sub{font-size:10pt;color:#456;border:0}'+
    '.tot{background:#dce9f5;font-weight:bold}</style></head><body>'+
    '<table><tr><td class="tit" colspan="'+cabeceras.length+'">AFAAR — Asociación Fueguina de Anestesia, Analgesia y Reanimación</td></tr>'+
    '<tr><td class="sub" colspan="'+cabeceras.length+'">'+esc(titulo)+'</td></tr>'+
    '<tr><td class="sub" colspan="'+cabeceras.length+'">Generado el '+fFechaLarga(hoyISO())+
      ' por '+esc(USUARIO ? (USUARIO.apellido+', '+USUARIO.nombre) : '')+
      (USUARIO && USUARIO.cuit ? ' — CUIT '+esc(USUARIO.cuit)+' ('+esc(USUARIO.condicionIva||'')+')' : '')+
      '</td></tr><tr></tr>'+
    '<tr>'+cabeceras.map(c => '<th>'+esc(c)+'</th>').join('')+'</tr>'+
    filas.map(f => '<tr>'+f.map(c => '<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+
    (resumen ? resumen.map(r => '<tr class="tot">'+r.map(c => '<td>'+esc(c)+'</td>').join('')+'</tr>').join('') : '')+
    '</table></body></html>';
}

function exportarFacturacionExcel(l, mes){
  /* «Procedimientos» y «Detalle 100/75/50 %» son la respuesta escrita a la
     pregunta que hace toda auditoria: de donde salieron las UA de la factura
     cuando en el mismo acto se hizo mas de una cirugia. */
  const cab = ['Fecha','Concepto','Paciente','DNI','Cirugía','Procedimientos','Detalle 100/75/50 %',
    'Diagnóstico','Institución','Financiador',
    'CUIT financiador','Profesional','Carácter','ASA','Modalidad','UA','Valor unidad',
    'Adicionales %','Importe','Estado','Comprobante','Cobrado'];
  const filas = l.map(x => {
    const f = x.ficha, p = DB.pacientes[f.pacienteId] || {}, h = f.hon || {};
    return [ fFecha(f.fecha), x.tipo === 'consulta' ? 'Valoración prequirúrgica' : 'Acto anestésico',
      (p.apellido||'')+', '+(p.nombre||''), p.dni||'',
      f.cirugia||'',
      procedimientosFacturables(f).map(y => y.n).join(' + '),
      (h.detalleProcedimientos && h.detalleProcedimientos.length
        ? h.detalleProcedimientos.map(y => y.n+' '+y.ua+' UA al '+y.pct+' % = '+
            fNum(y.uaEfectiva,2)+' UA').join(' | ')
        : procedimientosFacturables(f).map(y => y.n+' al '+y.pct+' %').join(' | ')),
      f.diagnostico || (f.dxQuirurgico ? f.dxQuirurgico.d : '') || '',
      nombreInstitucion(f.institucion), f.obraSocial||'',
      (datosFinanciador(f.obraSocial)||{}).cuit || '', nombreUsuario(x.uid),
      nombreCaracter(caracterActo(f)), ((f.v||{}).scores||{}).asa || '',
      x.tipo === 'consulta'
        ? (MODALIDADES_CONSULTA.find(m => m.id === (f.honConsulta||{}).modalidad)||{}).n || ''
        : (MODALIDADES_HONORARIOS.find(m => m.id === h.modalidad)||{}).n || '',
      x.tipo === 'acto' ? (h.ua||0) : '', x.tipo === 'acto' ? (h.valorUnidad||0) : '',
      x.tipo === 'acto' ? (h.pctAdicional||0) : '',
      x.monto.toFixed(2), x.estado, x.comprobante, x.cobrado.toFixed(2) ];
  });
  const total = l.reduce((a,x) => a + x.monto, 0);
  const cobrado = l.reduce((a,x) => a + x.cobrado, 0);
  const resumen = [
    new Array(16).fill('').concat(['TOTAL DEVENGADO', (total).toFixed(2), '', '']),
    new Array(16).fill('').concat(['TOTAL COBRADO', (cobrado).toFixed(2), '', ''])
  ];
  descargar('AFAAR-facturacion-'+mes+'.xls',
    '﻿'+tablaExcel('Resumen de facturación — '+nombreMes(mes), cab, filas, resumen),
    'application/vnd.ms-excel;charset=utf-8');
  auditar('export-excel', 'Facturación '+mes);
  toast('Planilla Excel descargada.', 'ok');
}

/* La planilla sale con una fila por ficha, pero con las dos columnas de acto
   medico separadas: quien hizo la valoracion con su honorario y quien realizo
   el acto con el suyo. Sumar una sola columna daba una actividad falsa
   cuando intervenian dos profesionales distintos. */
function exportarEstadisticas(l, corteNombre, datos){
  const cab = ['Fecha','Paciente','Institución','Financiador','Cirugía','Especialidad','Carácter',
    'ASA','Valoración prequirúrgica','Anestesiólogo (valoración)','Hon. valoración',
    'Acto anestésico','Anestesiólogo (acto)','Hon. acto','Eventos','Total'];
  /* Un socio exporta SOLO su trabajo. En una ficha compartida —uno valoró y
     otro operó— la columna del colega sale en blanco: no es su actividad ni
     su honorario. El coordinador exporta las dos columnas completas. */
  const mioVal = f => esCoordinador() || (SESION && f.ownerUid === SESION.uid);
  const mioAct = f => esCoordinador() || (SESION && actorFicha(f) === SESION.uid);
  const filas = l.map(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    const v = hayValoracion(f) && mioVal(f);
    const a = hayActo(f) && mioAct(f);
    const hv = v ? Number((f.honConsulta||{}).total || 0) : 0;
    const ha = a ? Number((f.hon||{}).total || 0) : 0;
    return [ fFecha(f.fecha), (p.apellido||'')+', '+(p.nombre||''), nombreInstitucion(f.institucion),
      f.obraSocial||'', procedimientosFacturables(f).map(y => y.n).join(' + ') || f.cirugia || '',
      f.especialidad||'', nombreCaracter(caracterActo(f)),
      v ? (((f.v||{}).scores||{}).asa || '') : '',
      v ? 'Sí' : 'No', v ? nombreUsuario(f.ownerUid) : '', v ? hv.toFixed(2) : '',
      a ? 'Sí' : 'No', a ? nombreActor(f) : '', a ? ha.toFixed(2) : '',
      a ? ((f.acto||{}).eventos||[]).filter(e => e !== 'Sin eventos').join(' · ') : '',
      (hv + ha).toFixed(2) ];
  });
  const nVal = l.filter(f => hayValoracion(f) && mioVal(f)).length;
  const nAct = l.filter(f => hayActo(f) && mioAct(f)).length;
  const vacias = n => new Array(n).fill('');
  const resumen = [
    ['ACTOS MÉDICOS DEL PERÍODO'].concat(vacias(15)),
    ['Valoraciones prequirúrgicas', nVal].concat(vacias(14)),
    ['Actos anestésicos', nAct].concat(vacias(14)),
    ['RESUMEN POR '+corteNombre.toUpperCase()].concat(vacias(15))
  ].concat(datos.map(d => [d.t, d.v].concat(vacias(14))));
  const [d,h] = rangoPeriodo();
  descargar('AFAAR-estadisticas-'+d+'_'+h+'.xls',
    '﻿'+tablaExcel('Estadísticas del '+fFecha(d)+' al '+fFecha(h), cab, filas, resumen),
    'application/vnd.ms-excel;charset=utf-8');
  auditar('export-excel', 'Estadísticas');
  toast('Planilla Excel descargada.', 'ok');
}

function imprimirFacturacion(l, mes, tot, porOS, porInst){
  const u = USUARIO || {};
  const html = ''+
  '<div class="membrete"><div class="a">A F A A R</div>'+
    '<div class="b">ASOCIACIÓN FUEGUINA DE ANESTESIA, ANALGESIA Y REANIMACIÓN</div></div>'+
  '<h1>RESUMEN DE FACTURACIÓN — '+esc(nombreMes(mes).toUpperCase())+'</h1>'+
  '<table style="border:0;margin-bottom:10px"><tr>'+
    '<td style="border:0"><b>Profesional:</b> '+esc((u.apellido||'')+', '+(u.nombre||''))+'<br>'+
      '<b>Matrícula:</b> M.N. '+esc(matriculaTxt(u.matriculaNacional,'M.N.'))+' · M.P. '+esc(matriculaTxt(u.matriculaProvincial,'M.P.'))+'</td>'+
    '<td style="border:0;text-align:right"><b>CUIT:</b> '+esc(u.cuit||'—')+'<br>'+
      '<b>Condición IVA:</b> '+esc(u.condicionIva||'—')+'</td>'+
  '</tr></table>'+
  '<h2>Totales</h2>'+
  '<table><tr><th>Prestaciones</th><th>Devengado</th><th>Cobrado</th><th>Pendiente</th></tr>'+
    '<tr><td>'+l.length+'</td><td>'+fMoneda(tot.total)+'</td><td>'+fMoneda(tot.cobrado)+
    '</td><td>'+fMoneda(tot.pendiente)+'</td></tr></table>'+
  '<h2>Por financiador</h2>'+
  '<table><tr><th>Financiador</th><th>CUIT</th><th>Plazo</th><th>N.º</th>'+
    '<th>Devengado</th><th>Cobrado</th></tr>'+
    porOS.map(d => { const df = datosFinanciador(d.t) || {};
      return '<tr><td>'+esc(d.t)+'</td><td>'+esc(df.cuit||'—')+'</td>'+
      '<td>'+esc(df.plazoPago||'—')+'</td><td>'+d.n+'</td><td>'+fMoneda(d.total)+
      '</td><td>'+fMoneda(d.cobrado)+'</td></tr>'; }).join('')+'</table>'+
  '<h2>Por institución</h2>'+
  '<table><tr><th>Institución</th><th>N.º</th><th>Devengado</th><th>Cobrado</th></tr>'+
    porInst.map(d => '<tr><td>'+esc(d.t)+'</td><td>'+d.n+'</td><td>'+fMoneda(d.total)+
      '</td><td>'+fMoneda(d.cobrado)+'</td></tr>').join('')+'</table>'+
  '<h2>Por concepto</h2>'+
  (function(){
    const c = { 'Valoración prequirúrgica':{n:0,t:0,c:0}, 'Acto anestésico':{n:0,t:0,c:0} };
    l.forEach(x => { const k = x.tipo === 'consulta' ? 'Valoración prequirúrgica' : 'Acto anestésico';
                     c[k].n++; c[k].t += x.monto; c[k].c += x.cobrado; });
    return '<table><tr><th>Concepto</th><th>N.º</th><th>Devengado</th><th>Cobrado</th></tr>'+
      Object.keys(c).map(k => '<tr><td>'+k+'</td><td>'+c[k].n+'</td>'+
        '<td>'+fMoneda(c[k].t)+'</td><td>'+fMoneda(c[k].c)+'</td></tr>').join('')+'</table>';
  })()+
  '<h2>Detalle de prestaciones</h2>'+
  '<table><tr><th>Fecha</th><th>Concepto</th><th>Paciente</th><th>Cirugía</th><th>Institución</th>'+
    '<th>Financiador</th><th>Importe</th><th>Estado</th></tr>'+
    l.map(x => { const f = x.ficha, p = DB.pacientes[f.pacienteId]||{};
      return '<tr><td>'+fFecha(f.fecha)+'</td>'+
      '<td>'+(x.tipo==='consulta'?'Valoración prequirúrgica':'Acto anestésico')+'</td>'+
      '<td>'+esc((p.apellido||'')+', '+(p.nombre||''))+'</td>'+
      '<td>'+esc(textoProcedimientos(f)||'')+'</td><td>'+esc(nombreInstitucion(f.institucion).split('"')[0].trim())+'</td>'+
      '<td>'+esc(f.obraSocial||'')+'</td><td>'+fMoneda(x.monto)+'</td>'+
      '<td>'+esc(x.estado)+'</td></tr>'; }).join('')+
    '<tr style="font-weight:bold;background:#eef4fa"><td colspan="6">TOTAL</td>'+
    '<td>'+fMoneda(tot.total)+'</td><td></td></tr></table>'+
  '<div class="firmas"><div style="margin-top:40px">'+
    (u.firmaDataUrl ? '<img src="'+u.firmaDataUrl+'" style="height:48px;display:block;margin:0 auto -6px">' : '')+
    esc((u.apellido||'')+', '+(u.nombre||''))+'<br>M.P. '+esc(matriculaTxt(u.matriculaProvincial,'M.P.'))+'</div></div>';
  imprimir(html);
  auditar('export-pdf', 'Facturación '+mes);
}
