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
    '<div class="a">A F A R</div>'+
    '<div class="b">ASOCIACIÓN FUEGUINA DE ANESTESIA Y REANIMACIÓN</div>'+
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
      'M.N. '+esc(u.matriculaNacional||'—')+' · M.P. '+esc(u.matriculaProvincial||'—')+'</span>'+
      (f.actoPorUid && f.actoPorUid !== f.ownerUid ? (function(){
        const w = DB.usuarios[f.actoPorUid] || {};
        return '<br><b style="color:#0b2545;font-size:10px">ACTO ANESTÉSICO</b><br>'+
          esc((w.apellido||'') + ', ' + (w.nombre||''))+'<br>'+
          '<span style="font-size:10px">M.N. '+esc(w.matriculaNacional||'—')+
          ' · M.P. '+esc(w.matriculaProvincial||'—')+'</span>'; })() : '')+
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
function documentoFicha(f){
  __secN = 0;
  const p = DB.pacientes[f.pacienteId] || {};
  const v = f.v || {}, pl = f.plan || {}, a = f.acto || {}, h = f.hon || {}, co = f.consent || {};
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
  membrete(f, 'FICHA ANESTÉSICA — VALORACIÓN PREQUIRÚRGICA Y ACTO ANESTÉSICO')+

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
      '<td><b>Carácter:</b> '+esc((f.caracter||'programada').toUpperCase())+'</td></tr>'+
    '<tr><td colspan="2"><b>Cirugía:</b> '+esc(f.cirugia||'—')+
      (f.lateralidad && f.lateralidad !== 'No aplica' ? ' ('+esc(f.lateralidad)+')' : '')+'</td></tr>'+
    '<tr><td><b>Especialidad:</b> '+esc(f.especialidad||'—')+'</td>'+
      '<td><b>Diagnóstico (CIE-10):</b> '+esc(f.dxQuirurgico ? f.dxQuirurgico.c+' — '+f.dxQuirurgico.d : '—')+'</td></tr>'+
    '<tr><td><b>Cirujano/a:</b> '+esc(f.cirujano||'—')+'</td>'+
      '<td><b>Ayudante:</b> '+esc(f.ayudante||'—')+'</td></tr>'+
    '</table>')+

  seccion('Antecedentes patológicos',
    ((v.cie10||[]).length ? '<div class="par"><b>Codificados (CIE-10):</b><span>'+
      esc(v.cie10.map(c => c.c+' — '+c.d).join(' · '))+'</span></div>' : '')+
    antec + par('Otros antecedentes', v.antecedentesOtros))+

  seccion('Antecedentes anestésicos',
    par('Antecedentes', v.antAnestesicos) + par('Detalle', v.antAnestDetalle))+

  seccion('Medicación habitual',
    (v.medicacion||[]).length
      ? '<table><tr><th>Fármaco</th><th>Dosis</th><th>Conducta perioperatoria</th></tr>'+
        v.medicacion.map(m => '<tr><td>'+esc(m.n)+'</td><td>'+esc(m.dosis||'—')+'</td>'+
        '<td><b>'+esc({continuar:'CONTINUAR',suspender:'SUSPENDER',evaluar:'EVALUAR'}[m.accion]||'')+
        '</b>'+(m.nota?'<br><span style="font-size:10px">'+esc(m.nota)+'</span>':'')+'</td></tr>').join('')+
        '</table>'
      : '' + par('Medicación', v.medicacionOtros))+

  seccion('Alergias', par('Alergias', v.alergias) + par('Detalle', v.alergiaDetalle))+

  seccion('Hábitos y capacidad funcional',
    par('Tabaquismo', (v.habitos||{}).tabaco) + par('Carga tabáquica', (v.habitos||{}).tabacoCant)+
    par('Alcohol', (v.habitos||{}).alcohol) + par('Otras sustancias', (v.habitos||{}).drogas)+
    par('Capacidad funcional', sc.mets ? sc.mets + ' MET — ' + interpMET(sc.mets).texto : '')+
    par('Fragilidad (Rockwood)', sc.fragilidad ? sc.fragilidad + ' — ' + (FRAGILIDAD.find(x => String(x[0])===String(sc.fragilidad))||['',''])[1] : ''))+

  seccion('Examen físico',
    par('Signos vitales', [(v.examen||{}).ta ? 'TA '+(v.examen).ta+' mmHg' : '',
      (v.examen||{}).fc ? 'FC '+(v.examen).fc+' lpm' : '',
      (v.examen||{}).fr ? 'FR '+(v.examen).fr+' rpm' : '',
      (v.examen||{}).spo2 ? 'SpO₂ '+(v.examen).spo2+' %' : '',
      (v.examen||{}).temp ? 'T '+(v.examen).temp+' °C' : ''].filter(Boolean).join(' · '))+
    par('Cardiovascular', (v.examen||{}).cardio) + par('Respiratorio', (v.examen||{}).respiratorio)+
    par('Abdomen', (v.examen||{}).abdomen) + par('Neurológico', (v.examen||{}).neuro)+
    par('Accesos venosos', (v.examen||{}).accesos) + par('Columna', (v.examen||{}).columna))+

  seccion('Evaluación de la vía aérea',
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
    par('Plan de vía aérea', (v.va||{}).plan))+

  seccion('Laboratorio y estudios',
    (labFilas.length ? '<table><tr>'+labFilas.map(x => '<th>'+esc(x[0])+'</th>').join('')+'</tr><tr>'+
      labFilas.map(x => '<td>'+esc(x[1])+' '+esc(x[2])+'</td>').join('')+'</tr></table>'+
      (lab.fecha ? '<div class="par"><b>Fecha del laboratorio:</b><span>'+fFecha(lab.fecha)+'</span></div>' : '')
      : '')+
    par('Electrocardiograma', (v.estudios||{}).ecg)+
    par('Radiografía de tórax', (v.estudios||{}).rx)+
    par('Ecocardiograma', (v.estudios||{}).ecocardio)+
    par('Otros estudios', (v.estudios||{}).espirometria))+

  seccion('Estratificación del riesgo',
    '<table><tr><th>Escala</th><th>Resultado</th><th>Interpretación</th></tr>'+
      (sc.asa ? '<tr><td>ASA Physical Status</td><td><b>ASA '+esc(sc.asa)+(sc.asaE?' E':'')+'</b></td>'+
        '<td>'+esc((ASA_PS.find(x => x.v === sc.asa)||{}).t||'')+'</td></tr>' : '')+
      '<tr><td>El-Ganzouri (vía aérea)</td><td><b>'+eg.n+'/12</b></td><td>'+esc(eg.texto)+'</td></tr>'+
      '<tr><td>RCRI (cardíaco)</td><td><b>'+rcri.n+'/6</b></td><td>'+esc(rcri.texto)+'</td></tr>'+
      '<tr><td>ARISCAT (pulmonar)</td><td><b>'+ar.n+'</b></td><td>'+esc(ar.texto)+'</td></tr>'+
      '<tr><td>STOP-BANG (SAHOS)</td><td><b>'+sb.n+'/8</b></td><td>'+esc(sb.texto)+'</td></tr>'+
      '<tr><td>Apfel (NVPO)</td><td><b>'+ap.n+'/4</b></td><td>'+esc(ap.texto)+'</td></tr>'+
      '<tr><td>Caprini (TEV)</td><td><b>'+cap.n+'</b></td><td>'+esc(cap.texto)+'</td></tr>'+
    '</table>')+

  seccion('Ayuno preoperatorio',
    par('Última ingesta', (v.ayuno||{}).tipo) + par('Hora', (v.ayuno||{}).hora)+
    par('Factores de riesgo de aspiración', (v.ayuno||{}).riesgos)+
    par('Profilaxis indicada', (v.ayuno||{}).profilaxis))+

  seccion('Plan anestésico',
    par('Técnica propuesta', pl.tecnica) + par('Manejo de la vía aérea', pl.dispositivosVA)+
    par('Monitoreo estándar', pl.monitoreoEstandar) + par('Monitoreo avanzado', pl.monitoreoAvanzado)+
    par('Accesos vasculares', pl.accesos)+
    par('Profilaxis antibiótica', pl.atb === 'Otro' ? pl.atbOtro : pl.atb)+
    par('Tromboprofilaxis', pl.tev) + par('Profilaxis de NVPO', pl.nvpo)+
    par('Analgesia postoperatoria', pl.analgesia) + par('Esquema analgésico', pl.analgesiaDetalle)+
    par('Previsión transfusional', pl.transfusion) + par('Destino postoperatorio', pl.destino)+
    par('Indicaciones al paciente', pl.indicaciones) + par('Observaciones', pl.observaciones))+

  seccion('Conclusión de la valoración preanestésica',
    '<div style="border:2px solid #0b2545;padding:9px;margin-bottom:8px;text-align:center;font-weight:bold;font-size:13px">'+
      esc(aptitud)+'</div>'+
    par('Fundamentación', (v.riesgo||{}).fundamento)+
    par('Interconsultas solicitadas', (v.riesgo||{}).interconsultas)+
    par('Fecha de la evaluación', fFecha((v.riesgo||{}).fecha))+
    par('Ámbito', (v.riesgo||{}).ambito))+

  seccion('Registro del acto anestésico',
    (f.actoPorUid && f.actoPorUid !== f.ownerUid
      ? par('Realizado por', nombreUsuario(f.actoPorUid)) : '')+
    par('Ingreso a quirófano', a.ingreso) + par('Inicio de la anestesia', a.inicioAnestesia)+
    par('Fin de la anestesia', a.finAnestesia) + par('Salida', a.salida)+
    par('Técnica realizada', a.tecnica) + par('Dispositivo de vía aérea', a.dispositivosVA)+
    par('Cormack-Lehane', a.cormack) + par('Intentos de intubación', a.intentos)+
    par('Tubo / dispositivo', a.tubo) + par('Fármacos administrados', a.farmacos)+
    par('Cristaloides', a.cristaloides ? a.cristaloides+' ml' : '')+
    par('Coloides', a.coloides ? a.coloides+' ml' : '')+
    par('Sangrado estimado', a.sangrado ? a.sangrado+' ml' : '')+
    par('Diuresis', a.diuresis ? a.diuresis+' ml' : '')+
    par('Hemoderivados', a.hemoderivados) + par('Drogas vasoactivas', a.vasoactivos)+
    par('Lista de verificación OMS', (a.oms||[]).map(o =>
      ({entrada:'Entrada',pausa:'Pausa quirúrgica',salida:'Salida'})[o]))+
    par('Eventos intraoperatorios', a.eventos) + par('Detalle de eventos', a.eventosDetalle)+
    par('Aldrete al egreso', a.aldreteTotal !== undefined ? a.aldreteTotal + '/10' : '')+
    par('Destino real', a.destinoReal) + par('Estado al egreso', a.estadoEgreso)+
    par('Observaciones', a.observaciones))+

  (co.quien ? seccion('Consentimiento informado anestésico',
    '<div style="font-size:10.5px;white-space:pre-line;text-align:justify;line-height:1.45;'+
      'border:1px solid #c9d6e3;padding:9px;background:#fbfdff">'+esc(TEXTO_CONSENTIMIENTO)+'</div>'+
    par('Firma', co.quien) + par('Firmante', co.firmante)+
    par('Declaraciones', co.items) + par('Aclaraciones', co.observaciones)+
    par('Fecha del consentimiento', fFecha(co.fecha) + (co.hora ? ' — ' + co.hora + ' h' : ''))) : '')+

  ((h.modalidad || (f.honConsulta||{}).modalidad) ? seccion('Honorarios profesionales',
    '<table><tr><th>Concepto</th><th>Profesional</th><th>Modalidad</th><th>Importe</th><th>Estado</th></tr>'+
    ((f.honConsulta||{}).modalidad ? '<tr><td>Consulta prequirúrgica</td>'+
      '<td>'+esc(nombreUsuario(f.ownerUid))+'</td>'+
      '<td>'+esc((MODALIDADES_CONSULTA.find(m=>m.id===f.honConsulta.modalidad)||{}).n||'—')+'</td>'+
      '<td>'+fMoneda(f.honConsulta.total||0)+'</td>'+
      '<td>'+esc(f.honConsulta.estado||'Pendiente')+'</td></tr>' : '')+
    (h.modalidad ? '<tr><td>Acto anestésico'+
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
      esc((u.apellido||'')+', '+(u.nombre||''))+'<br>M.P. '+esc(u.matriculaProvincial||'—')+
      (f.actoPorUid && f.actoPorUid !== f.ownerUid ? '<br>Valoración prequirúrgica' : '')+'</div>'+
    (f.actoPorUid && f.actoPorUid !== f.ownerUid ? (function(){
      const w = DB.usuarios[f.actoPorUid] || {};
      return '<div>'+(w.firmaDataUrl
          ? '<img src="'+w.firmaDataUrl+'" style="height:48px;display:block;margin:0 auto -6px">'
          : '<div style="height:42px"></div>')+
        esc((w.apellido||'')+', '+(w.nombre||''))+'<br>M.P. '+esc(w.matriculaProvincial||'—')+
        '<br>Acto anestésico</div>'; })() : '')+
  '</div>'+
  '<div style="margin-top:22px;font-size:9px;color:#678;text-align:center;border-top:1px solid #ccd">'+
    'Documento generado por AFAAR by Yanina Andino · Ficha '+esc(f.id)+' · '+
    'Última modificación: '+esc(f.modificado ? fFecha(f.modificado)+' '+String(f.modificado).slice(11,16) : '—')+
    ' por '+esc(f.modificadoPorNombre || nombreUsuario(f.modificadoPor||f.ownerUid))+'<br>'+
    'Historia clínica sujeta a la Ley 26.529. Conservación mínima: 10 años.'+
  '</div>';
}

/* --------------------------------------------------------------- Word */
const CSS_DOC = 'body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#111;margin:0}'+
  'h1{font-size:13pt;text-align:center;margin:2px 0 4px}'+
  'h2{font-size:10pt;text-transform:uppercase;letter-spacing:.06em;color:#0b2545;'+
    'border-bottom:1.2pt solid #0b2545;padding-bottom:2px;margin:12px 0 6px}'+
  '.membrete{border-bottom:2.5pt double #0b2545;padding-bottom:7px;margin-bottom:9px;text-align:center}'+
  '.membrete .a{font-size:17pt;font-weight:bold;letter-spacing:.16em;color:#0b2545}'+
  '.membrete .b{font-size:8pt;letter-spacing:.05em;color:#345}'+
  'table{border-collapse:collapse;width:100%;font-size:9.5pt;margin-bottom:5px}'+
  'th,td{border:.5pt solid #c9d6e3;padding:3pt 5pt;text-align:left;vertical-align:top}'+
  'th{background:#eef4fa;color:#0b2545;font-size:8.5pt}'+
  '.par{margin-bottom:2px;font-size:10pt}.par b{color:#0b2545}'+
  '.firmas{margin-top:34px}.firmas div{display:inline-block;width:45%;text-align:center;'+
    'border-top:.5pt solid #444;padding-top:3px;font-size:8.5pt;margin:0 2%}';

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
    '<table><tr><td class="tit" colspan="'+cabeceras.length+'">AFAAR — Asociación Fueguina de Analgesia, Anestesia y Reanimación</td></tr>'+
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
  const cab = ['Fecha','Concepto','Paciente','DNI','Cirugía','Diagnóstico','Institución','Financiador',
    'CUIT financiador','Profesional','Carácter','ASA','Modalidad','UA','Valor unidad',
    'Adicionales %','Importe','Estado','Comprobante','Cobrado'];
  const filas = l.map(x => {
    const f = x.ficha, p = DB.pacientes[f.pacienteId] || {}, h = f.hon || {};
    return [ fFecha(f.fecha), x.tipo === 'consulta' ? 'Consulta prequirúrgica' : 'Acto anestésico',
      (p.apellido||'')+', '+(p.nombre||''), p.dni||'',
      f.cirugia||'', f.dxQuirurgico ? f.dxQuirurgico.c+' — '+f.dxQuirurgico.d : '',
      nombreInstitucion(f.institucion), f.obraSocial||'',
      (datosFinanciador(f.obraSocial)||{}).cuit || '', nombreUsuario(x.uid),
      f.caracter||'', ((f.v||{}).scores||{}).asa || '',
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

function exportarEstadisticas(l, corteNombre, datos){
  const cab = ['Fecha','Paciente','Institución','Financiador','Cirugía','Especialidad','Carácter',
    'ASA','Anestesiólogo','Eventos','Importe'];
  const filas = l.map(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    return [ fFecha(f.fecha), (p.apellido||'')+', '+(p.nombre||''), nombreInstitucion(f.institucion),
      f.obraSocial||'', f.cirugia||'', f.especialidad||'', f.caracter||'',
      ((f.v||{}).scores||{}).asa||'', nombreUsuario(f.ownerUid),
      ((f.acto||{}).eventos||[]).filter(e => e !== 'Sin eventos').join(' · '),
      ((f.hon||{}).total||0).toFixed(2) ];
  });
  const resumen = [['RESUMEN POR '+corteNombre.toUpperCase(),'','','','','','','','','','']]
    .concat(datos.map(d => [d.t, d.v, '', '', '', '', '', '', '', '', '']));
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
  '<div class="membrete"><div class="a">A F A R</div>'+
    '<div class="b">ASOCIACIÓN FUEGUINA DE ANESTESIA Y REANIMACIÓN</div></div>'+
  '<h1>RESUMEN DE FACTURACIÓN — '+esc(nombreMes(mes).toUpperCase())+'</h1>'+
  '<table style="border:0;margin-bottom:10px"><tr>'+
    '<td style="border:0"><b>Profesional:</b> '+esc((u.apellido||'')+', '+(u.nombre||''))+'<br>'+
      '<b>Matrícula:</b> M.N. '+esc(u.matriculaNacional||'—')+' · M.P. '+esc(u.matriculaProvincial||'—')+'</td>'+
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
  '<h2>Detalle de prestaciones</h2>'+
  '<table><tr><th>Fecha</th><th>Concepto</th><th>Paciente</th><th>Cirugía</th><th>Institución</th>'+
    '<th>Financiador</th><th>Importe</th><th>Estado</th></tr>'+
    l.map(x => { const f = x.ficha, p = DB.pacientes[f.pacienteId]||{};
      return '<tr><td>'+fFecha(f.fecha)+'</td>'+
      '<td>'+(x.tipo==='consulta'?'Consulta':'Acto')+'</td>'+
      '<td>'+esc((p.apellido||'')+', '+(p.nombre||''))+'</td>'+
      '<td>'+esc(f.cirugia||'')+'</td><td>'+esc(nombreInstitucion(f.institucion).split('"')[0].trim())+'</td>'+
      '<td>'+esc(f.obraSocial||'')+'</td><td>'+fMoneda(x.monto)+'</td>'+
      '<td>'+esc(x.estado)+'</td></tr>'; }).join('')+
    '<tr style="font-weight:bold;background:#eef4fa"><td colspan="6">TOTAL</td>'+
    '<td>'+fMoneda(tot.total)+'</td><td></td></tr></table>'+
  '<div class="firmas"><div style="margin-top:40px">'+
    (u.firmaDataUrl ? '<img src="'+u.firmaDataUrl+'" style="height:48px;display:block;margin:0 auto -6px">' : '')+
    esc((u.apellido||'')+', '+(u.nombre||''))+'<br>M.P. '+esc(u.matriculaProvincial||'—')+'</div></div>';
  imprimir(html);
  auditar('export-pdf', 'Facturación '+mes);
}
