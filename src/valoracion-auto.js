/* =========================================================================
   VALORACION PREQUIRURGICA — LO QUE LA APP PUEDE DEDUCIR SOLA
   =========================================================================
   El problema que resuelve este archivo, dicho sin vueltas: la valoracion
   tiene quince puntos y, entre las cinco escalas del punto 9, mas de
   cincuenta casillas. Casi todas preguntan algo que la app YA SABE porque se
   cargo dos pantallas antes.

   Ejemplos reales de la duplicacion que habia:

     El RCRI pregunta «cardiopatia isquemica», «insuficiencia cardiaca»,
     «ACV», «diabetes en tratamiento con insulina» y «creatinina > 2».
     Las cinco estan en el punto 1 (antecedentes), en el punto 3
     (medicacion) y en el punto 8 (laboratorio).

     El STOP-BANG pregunta IMC > 35, edad > 50, circunferencia del cuello y
     sexo. Los cuatro salen del paciente y del punto 7.

     El Apfel pregunta sexo, si fuma y si va a llevar opioides. Los tres
     estan cargados.

     El ARISCAT pregunta edad, SpO2, anemia y si es urgencia. Los cuatro
     estan cargados.

   Este archivo NO inventa datos clinicos. Solo deriva: mira lo que ya esta
   escrito en la ficha y dice que casilla corresponde marcar y POR QUE. Cada
   deduccion viaja con su fundamento en texto, se muestra en pantalla antes
   de aplicarse, y nunca pisa algo que la persona haya cargado a mano.

   Lo que NO se deduce, a proposito:
     - El ASA se PROPONE con su fundamento, pero se aplica con un clic: es
       una calificacion clinica, no una cuenta.
     - Ronquido, somnolencia y apneas observadas del STOP-BANG solo se
       marcan si hay diagnostico de SAHOS cargado. Son sintomas que se
       preguntan, no se calculan.
     - La aptitud del punto 11 no se deduce nunca. La firma una persona.
   ========================================================================= */

/* Contexto: todo lo que hay cargado ahora mismo, mirando el DOM si el paso
   esta en pantalla y la ficha guardada si no. */
function contextoValoracion(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const v = f.v || {}, pl = f.plan || {};
  const enPantalla = !!$('#scAsa');

  const dx = enPantalla ? (typeof dxSeleccionados !== 'undefined' ? dxSeleccionados : [])
                        : (v.antecedentes2 || []);
  const meds = enPantalla ? (typeof medSeleccionados !== 'undefined' ? medSeleccionados : [])
                          : (v.medicacion || []);
  const gv = (id, alt) => enPantalla ? val(id) : (alt === undefined ? '' : alt);

  const ed = edadDe(p.fechaNac, f.fecha);
  const peso = gv('exPeso', (v.examen||{}).peso) || p.peso;
  const talla = gv('exTalla', (v.examen||{}).talla) || p.talla;
  const procs = procedimientosFacturables(f);

  return {
    f, p, v, pl, dx, meds, enPantalla,
    edad: ed,
    sexo: p.sexo || '',
    peso, talla,
    imc: calcIMC(peso, talla),
    flags: flagsDeAntecedentes(dx),
    spo2: gv('exSpo2', (v.examen||{}).spo2),
    hb:   gv('labHb', (v.lab||{}).hb),
    creatinina: gv('labCrea', (v.lab||{}).creatinina),
    cuelloCirc: gv('vaCuelloCirc', (v.va||{}).cuelloCirc),
    tabaco: gv('habTabaco', (v.habitos||{}).tabaco),
    mets: gv('mets', (v.scores||{}).mets),
    procs,
    principal: procs[0] || null,
    caracter: caracterActo(f),
    urgente: esNoProgramado(caracterActo(f)),
    tecnicas: enPantalla ? leerChks('plTecnica') : (pl.tecnica || []),
    /* La analgesia ya no vive en el punto 13: se indica en Recuperacion.
       Para el Apfel alcanza con lo que la ficha tenga guardado. */
    analgesia: (pl.analgesia || []).concat((f.recup||{}).analgesia || [])
  };
}

/* --------------------------------------------- helpers de deteccion --- */
function tieneMed(meds, rx){ return (meds||[]).some(m => rx.test(String(m.n||'') + ' ' + String(m.g||''))); }
function tieneAnt(dx, rx){ return (dx||[]).some(d => rx.test(String(d.n || d.d || ''))); }

/* La cirugia es de alto riesgo cardiaco (criterio del RCRI: intraperitoneal,
   intratoracica o vascular suprainguinal). Se lee de la via de abordaje del
   procedimiento principal, que ya esta declarada en el paso 1. */
function cirugiaAltoRiesgoCardiaco(ctx){
  const via = ctx.principal ? ctx.principal.via : '';
  if(['laparotomia','toracotomia','laparoscopica','cesarea','neuroquirurgica'].indexOf(via) >= 0) return true;
  return (ctx.procs||[]).some(x => /vascular|aorta|aneurisma|by ?pass|femoro|carotid/i.test(x.n||''));
}

/* La incision del ARISCAT sale de la misma via */
function incisionDeVia(via){
  if(via === 'toracotomia') return 'toracica';
  if(['laparotomia','laparoscopica','cesarea'].indexOf(via) >= 0) return 'alta';
  return 'periferica';
}

/* Duracion prevista propuesta segun la complejidad del nomenclador. Es una
   estimacion declarada como tal: solo alimenta el ARISCAT, que corta en 2 y
   en 3 horas, y se puede corregir. */
function duracionPrevista(ctx){
  const p = ctx.principal;
  const extra = Math.max(0, (ctx.procs||[]).length - 1) * 30;
  const c = compNumerica(p ? p.comp : 0);
  if(c){
    if(c <= 2) return 30 + extra;
    if(c <= 3) return 45 + extra;
    if(c <= 5) return 90 + extra;
    if(c <= 7) return 150 + extra;
    return 240 + extra;
  }
  /* Las practicas del catalogo propio no traen complejidad pero si unidades
     anestesicas, que en el nomenclador acompanan a la duracion. */
  const ua = Number(p ? p.ua : 0) || 0;
  if(!ua) return 0;
  if(ua <= 6)  return 30 + extra;
  if(ua <= 10) return 60 + extra;
  if(ua <= 15) return 90 + extra;
  if(ua <= 25) return 150 + extra;
  return 240 + extra;
}

/* =========================================================================
   LA DEDUCCION
   Devuelve una lista de propuestas. Cada una sabe que campo toca, que valor
   propone, por que, y si el campo ya esta cargado a mano.
   ========================================================================= */
function derivarValoracion(f){
  const c = contextoValoracion(f);
  const out = [];
  const yaTildado = id => { const e = $('#'+id); return e ? e.checked : false; };
  const yaCargado = id => { const e = $('#'+id); return e ? !!e.value : false; };

  const marcar = (id, porque, grupo) => {
    if(yaTildado(id)) return;
    out.push({ tipo:'chk', id, porque, grupo });
  };
  /* Un campo que ya tiene valor NO se pisa. Pero si lo que se deduce
     contradice lo que hay —la incision declarada dice «periferica» y la via
     de abordaje del paso 1 es laparoscopica— eso hay que decirlo: se propone
     la correccion, DESTILDADA, para que la decida la persona. */
  const poner = (id, valor, porque, grupo) => {
    const e = $('#'+id);
    if(!e) return;
    if(String(e.value) === String(valor)) return;
    const etiquetaDe = v => {
      if(e.tagName !== 'SELECT') return v;
      const o = Array.prototype.find.call(e.options, x => x.value === v);
      return o ? o.textContent.trim() : v;
    };
    out.push({ tipo:'val', id, valor:String(valor), porque, grupo,
               reemplaza: e.value ? etiquetaDe(e.value) : '' });
  };

  /* ---------------- Punto 9 · RCRI ---------------- */
  const G9 = '9 · Escalas de riesgo';
  if(cirugiaAltoRiesgoCardiaco(c))
    marcar('rcri0', 'La cirugía es ' + nombreVia(c.principal ? c.principal.via : '').toLowerCase() +
      ': entra en el criterio de alto riesgo del índice de Lee.', G9);
  if(c.flags.cardiopatia)
    marcar('rcri1', 'Hay cardiopatía isquémica en los antecedentes del punto 1.', G9);
  if(c.flags.icc)
    marcar('rcri2', 'Hay insuficiencia cardíaca en los antecedentes del punto 1.', G9);
  if(c.flags.acv)
    marcar('rcri3', 'Hay enfermedad cerebrovascular en los antecedentes del punto 1.', G9);
  if(c.flags.diabetes && tieneMed(c.meds, /insulina/i))
    marcar('rcri4', 'Diabetes en el punto 1 e insulina en la medicación del punto 3.', G9);
  if(Number(c.creatinina) > 2)
    marcar('rcri5', 'Creatinina ' + c.creatinina + ' mg/dl en el laboratorio del punto 8.', G9);

  /* ---------------- Punto 9 · ARISCAT ---------------- */
  if(c.principal){
    const inc = incisionDeVia(c.principal.via);
    poner('arIncision', inc, 'La vía de abordaje declarada en el paso 1 es ' +
      nombreVia(c.principal.via).toLowerCase() + '.', G9);
    const dur = duracionPrevista(c);
    if(dur) poner('arDuracion', dur, 'Estimada por la complejidad ' + c.principal.comp +
      ' del nomenclador' + (c.procs.length > 1 ? ' y los ' + c.procs.length + ' procedimientos' : '') +
      '. Corregila si sabés la duración real.', G9);
  }
  if(c.flags.infeccionRespiratoria)
    marcar('arInf', 'Hay infección respiratoria en los antecedentes del punto 1.', G9);

  /* ---------------- Punto 9 · STOP-BANG ---------------- */
  if(c.flags.hta) marcar('sb_presion', 'Hipertensión arterial en el punto 1.', G9);
  if(c.imc > 35)  marcar('sb_imc', 'IMC ' + c.imc.toFixed(1) + ' calculado con el peso y la talla.', G9);
  if(c.edad !== null && c.edad > 50)
    marcar('sb_edad', 'El paciente tiene ' + c.edad + ' años.', G9);
  const cc = Number(c.cuelloCirc);
  if(cc && ((c.sexo === 'M' && cc > 43) || (c.sexo !== 'M' && cc > 41)))
    marcar('sb_cuello', 'Circunferencia del cuello ' + cc + ' cm, cargada en el punto 7.', G9);
  if(c.sexo === 'M') marcar('sb_sexo', 'El paciente es de sexo masculino.', G9);
  if(c.flags.saos){
    marcar('sb_ronquido', 'Hay apnea obstructiva del sueño diagnosticada en el punto 1.', G9);
    marcar('sb_cansancio','Hay apnea obstructiva del sueño diagnosticada en el punto 1.', G9);
    marcar('sb_apneas',   'Hay apnea obstructiva del sueño diagnosticada en el punto 1.', G9);
  }

  /* ---------------- Punto 9 · Apfel ---------------- */
  if(c.sexo === 'F') marcar('ap_mujer', 'La paciente es de sexo femenino.', G9);
  if(c.tabaco && c.tabaco !== 'Fumador activo')
    marcar('ap_nofuma', 'En el punto 5 figura «' + c.tabaco + '».', G9);
  if(tieneAnt(c.dx, /náusea|nausea|vómito|vomito|cinetosis|NVPO/i))
    marcar('ap_antNVPO', 'Hay antecedente de náuseas, vómitos o cinetosis en el punto 1.', G9);
  if(c.analgesia.some(x => /morfina|nalbufina|tramadol|oxicodona|fentanilo|buprenorfina|PCA/i.test(x)) ||
     c.tecnicas.some(x => /general/i.test(x)))
    marcar('ap_opioides', 'El plan del punto 12-13 prevé opioides postoperatorios.', G9);

  /* ---------------- Punto 9 · Caprini ---------------- */
  const cap = (i, porque) => {
    const e = $$('.cap').find(x => Number(x.dataset.i) === i);
    if(!e || e.checked) return;
    out.push({ tipo:'cap', i, porque, grupo:G9 });
  };
  if(c.edad !== null){
    if(c.edad >= 75)      cap(2, 'El paciente tiene ' + c.edad + ' años.');
    else if(c.edad >= 61) cap(1, 'El paciente tiene ' + c.edad + ' años.');
    else if(c.edad >= 41) cap(0, 'El paciente tiene ' + c.edad + ' años.');
  }
  const dur = duracionPrevista(c);
  if(dur >= 45) cap(4, 'Duración prevista ' + dur + ' min por la complejidad del procedimiento.');
  else if(dur)  cap(3, 'Procedimiento programado de menos de 45 minutos.');
  if(c.imc > 25) cap(5, 'IMC ' + c.imc.toFixed(1) + '.');
  if(c.flags.embarazo)   cap(8,  'Embarazo o puerperio en el punto 1.');
  if(c.flags.epoc)       cap(12, 'EPOC en el punto 1.');
  if(c.flags.oncologico) cap(17, 'Neoplasia maligna en el punto 1.');
  if(c.flags.tev)        cap(21, 'Antecedente de TVP o TEP en el punto 1.');
  if((c.procs||[]).some(x => /artroplast|protesis|prótesis de (cadera|rodilla)/i.test(x.n||'')))
    cap(26, 'El procedimiento cargado es una artroplastia mayor programada.');
  if((c.procs||[]).some(x => /fractura de (cadera|pelvis|femur|fémur|pierna|tibia)/i.test(x.n||'')))
    cap(27, 'El procedimiento cargado es una fractura de cadera, pelvis o pierna.');

  /* ---------------- Punto 10 · Ayuno y riesgo de aspiración ---------------- */
  const G10 = '10 · Ayuno';
  const marcarChk = (cont, texto, porque, grupo) => {
    const e = $$('#'+cont+' input').find(x => x.value === texto);
    if(!e || e.checked) return;
    out.push({ tipo:'chkval', cont, valor:texto, porque, grupo });
  };
  if(c.urgente)
    marcarChk('ayRiesgo', 'Cirugía de urgencia',
      'El acto está registrado como ' + nombreCaracter(c.caracter).toLowerCase() + '.', G10);
  if(tieneMed(c.meds, /semaglutida|liraglutida|dulaglutida|GLP-?1|ozempic|saxenda|trulicity/i))
    marcarChk('ayRiesgo', 'Agonista GLP-1 sin suspender',
      'Hay un agonista GLP-1 en la medicación del punto 3: retrasa el vaciamiento gástrico.', G10);
  if(c.flags.reflujo)
    marcarChk('ayRiesgo', 'Reflujo severo', 'Hay reflujo gastroesofágico en el punto 1.', G10);
  if(c.flags.embarazo)
    marcarChk('ayRiesgo', 'Embarazo con trabajo de parto', 'Embarazo en el punto 1.', G10);
  if(c.imc >= 40)
    marcarChk('ayRiesgo', 'Obesidad mórbida', 'IMC ' + c.imc.toFixed(1) + '.', G10);
  if(c.flags.diabetes && c.edad !== null && c.edad > 50)
    marcarChk('ayRiesgo', 'Diabetes de larga evolución',
      'Diabetes en el punto 1 en un paciente de ' + c.edad + ' años.', G10);

  /* ---------------- Punto 13 · Profilaxis que se deduce de las escalas ------ */
  const G13 = '13 · Profilaxis';
  const apv = {}; APFEL_ITEMS.forEach(it => apv[it.k] = yaTildado('ap_'+it.k) ||
    out.some(o => o.id === 'ap_'+it.k));
  const apf = calcApfel(apv);
  if(apf.n >= 1)
    marcarChk('plNVPO', 'Ondansetrón 4 mg', 'Apfel ' + apf.n + ' de 4: corresponde profilaxis de NVPO.', G13);
  if(apf.n >= 2)
    marcarChk('plNVPO', 'Dexametasona 4-8 mg', 'Apfel ' + apf.n + ' de 4: corresponde profilaxis doble.', G13);
  if(apf.n >= 3)
    marcarChk('plNVPO', 'TIVA con propofol', 'Apfel ' + apf.n + ' de 4: corresponde profilaxis triple y TIVA.', G13);

  const capSel = $$('.cap:checked').map(i => Number(i.dataset.i))
    .concat(out.filter(o => o.tipo === 'cap').map(o => o.i));
  const capr = calcCaprini(capSel);
  if(!yaCargado('plTEV')){
    const tev = capr.n <= 1 ? 'Deambulación precoz'
              : capr.n === 2 ? 'Compresión neumática intermitente'
              : capr.n <= 4 ? 'Enoxaparina 40 mg/día'
              : 'Mecánica + farmacológica';
    poner('plTEV', tev, 'Caprini ' + capr.n + ' puntos: ' + capr.texto.toLowerCase(), G13);
  }

  return { propuestas: out, ctx: c };
}

/* =========================================================================
   ASA PROPUESTO
   Se propone con su fundamento escrito y se aplica con un clic. No se aplica
   solo: el ASA es una calificacion clinica, la firma un medico y de ella
   dependen el adicional del honorario y la lectura que hace despues
   cualquiera que abra la historia.
   ========================================================================= */
function asaPropuesto(f){
  const c = contextoValoracion(f);
  const razones = [];
  let n = 1;

  const sube = (a, txt) => { if(a > n) n = a; razones.push(txt); };

  if(c.flags.hta)         sube(2, 'hipertensión arterial');
  if(c.flags.diabetes)    sube(2, 'diabetes');
  if(c.flags.tabaquismo || c.tabaco === 'Fumador activo') sube(2, 'tabaquismo activo');
  if(c.flags.embarazo)    sube(2, 'embarazo');
  if(c.flags.psiquiatrico)sube(2, 'enfermedad psiquiátrica en tratamiento');
  if(c.flags.tiroides)    sube(2, 'patología tiroidea');
  if(c.imc >= 30 && c.imc < 40) sube(2, 'obesidad (IMC ' + c.imc.toFixed(1) + ')');
  if(c.flags.asma)        sube(2, 'asma');

  if(c.imc >= 40)         sube(3, 'obesidad mórbida (IMC ' + c.imc.toFixed(1) + ')');
  if(c.flags.cardiopatia) sube(3, 'cardiopatía isquémica');
  if(c.flags.icc)         sube(3, 'insuficiencia cardíaca');
  if(c.flags.epoc)        sube(3, 'EPOC');
  if(c.flags.acv)         sube(3, 'enfermedad cerebrovascular');
  if(c.flags.renal)       sube(3, 'enfermedad renal crónica');
  if(c.flags.hepatopatia) sube(3, 'hepatopatía');
  if(c.flags.oncologico)  sube(3, 'enfermedad oncológica');
  if(c.flags.saos)        sube(3, 'apnea obstructiva del sueño');
  if(c.flags.arritmia)    sube(3, 'arritmia');
  if(Number(c.mets) && Number(c.mets) < 4) sube(3, 'capacidad funcional menor de 4 MET');
  if(Number(c.creatinina) > 2) sube(3, 'creatinina mayor de 2 mg/dl');

  if(c.flags.dialisis)    sube(4, 'diálisis crónica');
  if(c.flags.inmunosupresion && c.flags.oncologico) sube(4, 'enfermedad oncológica en inmunosupresión');

  /* El desplegable del punto 9 usa numeros ROMANOS —los valores de ASA_PS son
     'I','II','III'…—, asi que la propuesta tiene que devolver el mismo
     formato: con «2» el select no seleccionaba nada y el boton «Aceptar»
     dejaba el ASA vacio. */
  const v = ['','I','II','III','IV','V','VI'][n] || 'I';
  return {
    v,
    razones,
    e: c.urgente,
    texto: n === 1
      ? 'Sin antecedentes relevantes cargados, IMC dentro de rango y sin hallazgos que califiquen: '+
        'corresponde ASA I.'
      : 'Por ' + razones.join(', ') + '.',
    /* Lo que la app NO puede decidir y hay que mirar */
    reserva: n >= 3
      ? 'ASA III o más se apoya en el grado de control de cada enfermedad, no sólo en su presencia. '+
        'Revisalo antes de aceptarlo.'
      : ''
  };
}

/* =========================================================================
   REDACCION AUTOMATICA DE LA CONCLUSION (punto 11)
   -------------------------------------------------------------------------
   Es el campo que mas tiempo lleva y el unico enteramente derivable: la
   fundamentacion es el resumen de lo que ya esta cargado. Se redacta con un
   boton, queda EDITABLE, y si ya habia texto escrito no se pisa: se ofrece
   agregarlo abajo.
   ========================================================================= */
function redactarConclusion(f){
  const c = contextoValoracion(f);
  const p = c.p;
  const L = [];

  /* --- quien es el paciente --- */
  const quien = [];
  if(c.edad !== null) quien.push('Paciente de ' + c.edad + ' años');
  else quien.push('Paciente');
  if(c.sexo) quien.push('sexo ' + ({F:'femenino',M:'masculino',X:'no binario'}[c.sexo] || c.sexo));
  /* clasificaIMC() devuelve «Obesidad grado II»: bajarlo todo a minusculas
     convertia el numeral romano en «ii». Se baja solo la primera letra. */
  if(c.imc){
    const cl = clasificaIMC(c.imc);
    quien.push('IMC ' + fNum(c.imc,1) + ' (' + cl.charAt(0).toLowerCase() + cl.slice(1) + ')');
  }
  L.push(quien.join(', ') + '.');

  /* Para que se lea sola: de que intervencion se esta hablando */
  if((c.procs||[]).length)
    L.push('Se evalúa para ' + c.procs.map(x => x.n).join(' + ') +
      (c.f.diagnostico ? ', por ' + c.f.diagnostico : '') +
      (c.urgente ? ', de carácter ' + nombreCaracter(c.caracter).toLowerCase() : '') + '.');

  /* --- antecedentes y medicación --- */
  if((c.dx||[]).length)
    L.push('Antecedentes: ' + c.dx.map(d => (d.n || d.d)).join(', ') + '.');
  else if((c.v||{}).sinAntecedentes || $('#dxSin') && $('#dxSin').checked)
    L.push('Sin antecedentes patológicos relevantes.');
  if((c.meds||[]).length){
    const susp = c.meds.filter(m => m.accion === 'suspender').map(m => m.n);
    L.push('Medicación habitual: ' + c.meds.map(m => m.n).join(', ') + '.' +
      (susp.length ? ' Se indica suspender: ' + susp.join(', ') + '.' : ''));
  }

  /* --- escalas, con el numero y el nivel --- */
  const gv = id => val(id);
  const asa = gv('scAsa');
  if(asa) L.push('ASA ' + asa + (chk('scAsaE') ? 'E' : '') + '.');
  if(gv('mets')) L.push('Capacidad funcional ' + gv('mets') + ' MET.');

  const eg = calcElGanzouri({
    aperturaBucal: gv('vaApertura'), tiromentoniana: gv('vaTiro'), mallampati: gv('vaMallampati'),
    cuelloMov: gv('vaCuello'), protrusion: gv('vaProtrusion'), peso: c.peso,
    intubacionPrevia: gv('vaIntPrev') });
  if(gv('vaMallampati'))
    L.push('Vía aérea: Mallampati ' + gv('vaMallampati') + ', El-Ganzouri ' + eg.n +
      ' (riesgo ' + eg.nivel + ').');

  const rc = {}; RCRI_ITEMS.forEach((it,i) => rc[it.k] = chk('rcri'+i));
  const rcri = calcRCRI(rc);
  const ar = calcARISCAT({ edad:c.edad, spo2:gv('exSpo2'), hb:gv('labHb'),
    infeccionRespiratoria:chk('arInf'), incision:gv('arIncision'), duracion:gv('arDuracion'),
    urgencia:c.urgente });
  const sbv = {}; STOPBANG_ITEMS.forEach(it => sbv[it.k] = chk('sb_'+it.k));
  const sb = calcSTOPBANG(sbv);
  const apv = {}; APFEL_ITEMS.forEach(it => apv[it.k] = chk('ap_'+it.k));
  const ap = calcApfel(apv);
  const cap = calcCaprini($$('.cap:checked').map(i => Number(i.dataset.i)));
  L.push('Estratificación: RCRI ' + rcri.n + ' (' + rcri.nivel + '), ARISCAT ' + ar.n +
    ' (' + ar.nivel + '), STOP-BANG ' + sb.n + ' (' + sb.nivel + '), Apfel ' + ap.n +
    ' (' + ap.nivel + '), Caprini ' + cap.n + ' (' + cap.nivel + ').');

  /* --- laboratorio: solo lo que esta fuera de rango o es relevante --- */
  const lab = [];
  const dato = (id, et, um) => { const x = gv(id); if(x) lab.push(et + ' ' + x + (um||'')); };
  dato('labHb','Hb',' g/dl'); dato('labPlaq','plaquetas',' mil/µl'); dato('labRIN','RIN');
  dato('labCrea','creatinina',' mg/dl'); dato('labGlu','glucemia',' mg/dl');
  dato('labK','K',' mEq/l');
  if(lab.length) L.push('Laboratorio' + (gv('labFecha') ? ' del ' + fFecha(gv('labFecha')) : '') +
    ': ' + lab.join(', ') + '.');
  const alertasLab = alertasLaboratorio({ hb:gv('labHb'), plaquetas:gv('labPlaq'), rin:gv('labRIN'),
    potasio:gv('labK'), sodio:gv('labNa'), glucemia:gv('labGlu'), creatinina:gv('labCrea') });
  if(alertasLab.length) L.push('A destacar: ' + alertasLab.map(a => a[1]).join(' ') );

  /* --- ayuno --- */
  if(gv('ayTipo')) L.push('Ayuno: ' + gv('ayTipo') +
    (gv('ayHora') ? ' desde las ' + gv('ayHora') + ' h' : '') + '.');

  /* --- plan --- */
  const tec = leerChks('plTecnica');
  if(tec.length) L.push('Plan anestésico propuesto: ' + tec.join(', ').toLowerCase() + '.');
  /* La analgesia se indica en Recuperacion; si ya esta cargada, se nombra. */
  const analg = ((fichaActual.plan||{}).analgesia || [])
    .concat(((fichaActual.recup)||{}).analgesia || []);
  if(analg.length) L.push('Analgesia postoperatoria prevista: ' +
    Array.from(new Set(analg)).join(', ') + '.');
  if(gv('plTEV')) L.push('Tromboprofilaxis: ' + gv('plTEV') + '.');

  /* --- lo que hay que optimizar, deducido de los dominios en alto --- */
  const pend = [];
  if(eg.nivel === 'alto')   pend.push('preparar vía aérea difícil según el plan del punto 7');
  if(rcri.nivel !== 'bajo') pend.push('evaluación cardiológica y troponina perioperatoria');
  if(ar.nivel === 'alto')   pend.push('ventilación protectora y kinesiología perioperatoria');
  if(sb.nivel === 'alto')   pend.push('minimizar opioides y monitoreo prolongado en recuperación');
  if(cap.nivel === 'alto')  pend.push('tromboprofilaxis farmacológica y mecánica');
  if(c.imc >= 40)           pend.push('posición en rampa y preoxigenación optimizada');
  if(pend.length) L.push('Medidas de mitigación: ' + pend.join('; ') + '.');

  /* --- la conclusion propiamente dicha, en condicional: la aptitud la
         elige la persona en el segmento de arriba, no este texto --- */
  const apt = ($('#segAptitud button.on') || {}).dataset;
  const rot = { apto:'APTO', reservas:'APTO CON RESERVAS', optimizar:'REQUIERE OPTIMIZACIÓN',
                noapto:'NO APTO' }[(apt && apt.v) || 'apto'];
  L.push('Se considera ' + rot + ' para el procedimiento propuesto.');

  return L.join(' ');
}
