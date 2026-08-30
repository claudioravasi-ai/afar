/* =========================================================================
   EL ACTO ANESTESICO — LO QUE LA APP PUEDE PROPONER SOLA
   =========================================================================
   Hermano de valoracion-auto.js, con el mismo criterio y las mismas
   limitaciones: acá NO se inventa nada clínico. Se mira lo que ya está
   cargado —sexo, peso, talla, IMC, edad, antecedentes, medicación, alergias
   y la cirugía prevista con su vía de abordaje— y de ahí sale una PROPUESTA,
   con su fundamento escrito al lado, que la persona aplica o descarta.

   Dos cosas se proponen:

     1. El BALANCE HIDRICO. Un plan de fluidos calculado con Holliday-Segar,
        el déficit de ayuno y las pérdidas por trauma quirúrgico, corregido
        por lo que el paciente tiene encima —insuficiencia cardíaca, riñón,
        diálisis, obesidad, embarazo—. Sale a los campos del balance, que
        siguen siendo editables: es un punto de partida, no un mandato.

     2. Los EVENTOS ADVERSOS mas probables. La lista de tipos de evento tiene
        veinticinco entradas y el desplegable las muestra todas iguales.
        Cuando el paciente es un ASA III con SAHOS, obeso, en una
        laparoscopía, los eventos que van a pasar son cuatro o cinco y están
        perdidos entre las otras veinte. Se los sube arriba con el motivo.

   Nada de esto marca, tilda ni guarda solo. Se muestra, se explica, y se
   aplica con un clic.
   ========================================================================= */

/* -------------------------------------------------------------------------
   Peso de cálculo.
   En el obeso el volumen de distribución del agua no crece como el peso: con
   el peso real la reposición se va al doble de lo que corresponde. Se usa el
   peso ajustado —ideal de Devine más el 40 % del exceso—, que es el que
   recomiendan las guías para fluidos y para la mayoría de las drogas.
   ------------------------------------------------------------------------- */
function pesoIdealDevine(talla, sexo){
  const t = Number(talla);
  if(!t || t < 120) return 0;
  const base = sexo === 'F' ? 45.5 : 50;
  return Math.max(30, base + 0.9 * (t - 152));
}
function pesoParaFluidos(peso, talla, sexo){
  const p = Number(peso) || 0;
  const imc = calcIMC(peso, talla);
  if(!p) return 0;
  if(!imc || imc < 30) return p;
  const pi = pesoIdealDevine(talla, sexo);
  if(!pi) return p;
  return Math.round((pi + 0.4 * (p - pi)) * 10) / 10;
}

/* Mantenimiento horario por la regla 4-2-1 de Holliday-Segar. Es la misma
   cuenta en el adulto y en el chico; lo que cambia es el peso. */
function mantenimientoHorario(peso){
  const p = Number(peso) || 0;
  if(!p) return 0;
  if(p <= 10) return p * 4;
  if(p <= 20) return 40 + (p - 10) * 2;
  return 60 + (p - 20);
}

/* -------------------------------------------------------------------------
   Grado de trauma quirurgico, leido de la via de abordaje que ya se declaro
   en el paso 1. De el salen las perdidas al tercer espacio: 2, 4 o 6 mL/kg/h.

   La cifra es la clasica. Las guias de recuperacion acelerada (ERAS)
   discuten que el tercer espacio exista como se lo describia y proponen
   reposiciones bastante mas bajas; por eso la propuesta se muestra con las
   dos lecturas y el numero final lo pone la persona.
   ------------------------------------------------------------------------- */
const TRAUMA_POR_VIA = {
  cutanea:1, oftalmica:1, orl:1, artroscopica:1, percutanea:1, endoscopica:1,
  transuretral:1, neuroaxial:1, endovascular:1, vaginal:1,
  laparoscopica:2, convencional:2, osteoarticular:2, cesarea:2, neuroquirurgica:2,
  laparotomia:3, toracotomia:3
};
const GRADOS_TRAUMA = [
  { g:1, n:'mínimo',   mlkgh:2, d:'Cirugía superficial o endoscópica, sin exposición de cavidades.' },
  { g:2, n:'moderado', mlkgh:4, d:'Cavidad abierta o videoasistida, exposición limitada.' },
  { g:3, n:'severo',   mlkgh:6, d:'Laparotomía o toracotomía amplia, exposición prolongada de vísceras.' }
];
function gradoTrauma(ctx){
  const via = ctx.principal ? ctx.principal.via : '';
  let g = TRAUMA_POR_VIA[via] || 2;
  /* Mas de un procedimiento en el mismo acto suma exposicion y tiempo */
  if((ctx.procs || []).length > 2 && g < 3) g++;
  return GRADOS_TRAUMA.find(x => x.g === g) || GRADOS_TRAUMA[1];
}

/* Horas de ayuno declaradas en el punto 10 de la valoracion. Si no estan, se
   usan las 8 h del ayuno habitual, dicho como supuesto. */
function horasDeAyuno(f){
  const ay = ((f.v || {}).ayuno) || {};
  if(!ay.hora) return { h:8, supuesto:true };
  const [hh, mm] = String(ay.hora).split(':').map(Number);
  if(isNaN(hh)) return { h:8, supuesto:true };
  const ahora = new Date();
  const desde = new Date(ahora); desde.setHours(hh, mm || 0, 0, 0);
  if(desde > ahora) desde.setDate(desde.getDate() - 1);
  const h = (ahora - desde) / 3600000;
  if(h < 0 || h > 36) return { h:8, supuesto:true };
  return { h: Math.round(h * 10) / 10, supuesto:false };
}

/* Duracion del acto: la real si ya estan los horarios cargados, y si no la
   estimada por la complejidad del nomenclador. */
function duracionDelActo(f, ctx){
  const a = f.acto || {};
  const real = minutosEntre(a.inicioCirugia, a.finCirugia) ||
               minutosEntre(a.inicioAnestesia, a.finAnestesia);
  if(real && real > 0) return { min:real, real:true };
  const est = (typeof duracionPrevista === 'function') ? duracionPrevista(ctx) : 60;
  return { min: est || 60, real:false };
}

/* -------------------------------------------------------------------------
   EL PLAN DE FLUIDOS
   Devuelve los numeros, los campos que se pueden volcar al balance y el
   fundamento de cada renglon. Si falta el peso no devuelve nada: sin peso
   esto no es una estimacion, es un numero inventado.
   ------------------------------------------------------------------------- */
function planDeFluidos(f){
  const ctx = contextoValoracion(f);
  const p = ctx.p || {};
  const pesoReal = Number(ctx.peso) || 0;
  if(!pesoReal) return null;

  const peso = pesoParaFluidos(pesoReal, ctx.talla, ctx.sexo);
  const imc = ctx.imc;
  const edad = ctx.edad;
  const pedia = esPediatrico(edad);
  const fl = ctx.flags || {};
  const dur = duracionDelActo(f, ctx);
  const horas = dur.min / 60;
  const trauma = gradoTrauma(ctx);
  const ayuno = horasDeAyuno(f);

  const mantHora = mantenimientoHorario(peso);
  const mantenimiento = Math.round(mantHora * horas);
  /* Deficit de ayuno: mantenimiento x horas sin ingesta. La escuela clasica
     repone la mitad en la primera hora; ERAS, con liquidos claros hasta 2 h
     antes, casi no lo repone. Se calcula y se dice cuanto se suele dar. */
  const deficit = Math.round(mantHora * ayuno.h);
  const deficitPropuesto = Math.round(deficit * 0.5);
  const tercerEspacio = Math.round(peso * trauma.mlkgh * horas);

  const motivos = [];
  motivos.push({ t:'Peso de cálculo',
    v: (peso !== pesoReal ? peso + ' kg ajustado' : peso + ' kg'),
    d: peso !== pesoReal
      ? 'IMC '+fNum(imc,1)+': se usa el peso ajustado (ideal + 40 % del exceso), '+
        'no los '+pesoReal+' kg reales. Con el peso real la reposición sale casi al doble.'
      : 'Peso cargado en la historia del paciente.' });
  motivos.push({ t:'Mantenimiento', v: Math.round(mantHora)+' mL/h',
    d:'Regla 4-2-1 de Holliday-Segar sobre '+peso+' kg.' });
  motivos.push({ t:'Duración prevista', v: duracionTexto(dur.min),
    d: dur.real ? 'Horarios ya cargados en el acto.'
                : 'Estimada por la complejidad del nomenclador; se recalcula al cargar los horarios.' });
  motivos.push({ t:'Trauma quirúrgico', v: trauma.n+' · '+trauma.mlkgh+' mL/kg/h',
    d: trauma.d + (ctx.principal && ctx.principal.via
        ? ' Vía declarada: '+nombreVia(ctx.principal.via)+'.'
        : ' Sin vía de abordaje declarada: se asume moderado.') });
  motivos.push({ t:'Ayuno', v: fNum(ayuno.h,1)+' h',
    d: ayuno.supuesto
      ? 'No hay hora de última ingesta cargada en el punto 10: se asumen 8 h.'
      : 'Calculado sobre la hora de la última ingesta del punto 10.' });

  /* ---------------- correcciones por lo que el paciente tiene ------------ */
  let factor = 1, restrictivo = false;
  const advertencias = [];

  if(fl.icc){
    factor = Math.min(factor, 0.6); restrictivo = true;
    advertencias.push({ n:'Insuficiencia cardíaca', c:'danger',
      d:'Reposición restrictiva. La sobrecarga es la complicación que más se paga en este '+
        'paciente: preferir bolos chicos guiados por respuesta y no infusión fija.' });
  }
  if(fl.dialisis){
    factor = Math.min(factor, 0.5); restrictivo = true;
    advertencias.push({ n:'Diálisis', c:'danger',
      d:'Sin diuresis propia: el mantenimiento por peso no aplica. Reponer sólo pérdidas '+
        'medidas y evitar soluciones con potasio.' });
  } else if(fl.renal){
    factor = Math.min(factor, 0.8); restrictivo = true;
    advertencias.push({ n:'Enfermedad renal crónica', c:'warn',
      d:'Cuidar el volumen y el potasio. El Ringer lactato es preferible al fisiológico por '+
        'la acidosis hiperclorémica, salvo hiperkalemia.' });
  }
  if(fl.hepatopatia)
    advertencias.push({ n:'Hepatopatía', c:'warn',
      d:'Tercer espacio aumentado y albúmina baja: el cristaloide se va al intersticio. '+
        'Considerar coloide o albúmina si hay ascitis.' });
  if(fl.cardiopatia && !fl.icc)
    advertencias.push({ n:'Cardiopatía isquémica', c:'warn',
      d:'Mantener la precarga sin sobrecargar: la hipotensión y la sobrecarga son ambas '+
        'isquémicas en este paciente.' });
  if(fl.embarazo)
    advertencias.push({ n:'Embarazo', c:'warn',
      d:'Volemia aumentada ~40 % y compresión aortocava. La hipotensión post-raquídea se '+
        'previene con vasopresor, no con volumen.' });
  if(imc && imc >= 40)
    advertencias.push({ n:'Obesidad mórbida (IMC '+fNum(imc,1)+')', c:'warn',
      d:'Cálculo hecho sobre el peso ajustado. Vigilar diuresis: la sobrecarga empeora la '+
        'mecánica respiratoria en el postoperatorio.' });
  if(pedia)
    advertencias.push({ n:'Paciente pediátrico ('+edad+' años)', c:'warn',
      d:'Volemia 80 mL/kg. Usar bomba o bureta: en el chico el error de volumen es de otra '+
        'escala. Vigilar glucemia en el lactante.' });
  if(fl.anemia || Number((f.v||{}).lab && f.v.lab.hb) && Number(f.v.lab.hb) < 10)
    advertencias.push({ n:'Anemia previa', c:'warn',
      d:'La pérdida sanguínea tolerable es menor: revisar el umbral de transfusión antes '+
        'de empezar.' });
  if(fl.sinTransfusion)
    advertencias.push({ n:'Rechazo de hemoderivados', c:'danger',
      d:'Declarado en los antecedentes. Ninguna casilla de sangre o plasma debería cargarse '+
        'sin revisar la voluntad del paciente y lo firmado en el consentimiento.' });
  if(tieneMed(ctx.meds, /furosemida|diurético|diuretico/i))
    advertencias.push({ n:'Diurético habitual', c:'warn',
      d:'Suele llegar hipovolémico y con potasio bajo. Revisar el ionograma del punto 8.' });
  if(tieneMed(ctx.meds, /iSGLT2|empagliflozina|dapagliflozina/i))
    advertencias.push({ n:'iSGLT2 sin suspender', c:'warn',
      d:'Riesgo de cetoacidosis euglucémica y de depleción de volumen.' });

  const cristaloides = Math.max(0, Math.round(
    (mantenimiento + deficitPropuesto + tercerEspacio) * factor / 50) * 50);

  /* Diuresis esperable: 0,5 mL/kg/h en el adulto, 1 en el chico. Es lo que
     sirve para saber si el plan alcanzo, no un ingreso. */
  const diuresis = Math.round(pesoReal * (pedia ? 1 : 0.5) * horas / 10) * 10;

  /* Perdida sanguinea admisible, con la formula clasica: volemia por la
     caida relativa de hematocrito hasta el umbral. */
  const volemia = Math.round(pesoReal * (pedia ? 80 : 70));
  const hto = Number(((f.v || {}).lab || {}).hto) || 0;
  const htoMin = fl.cardiopatia || fl.icc ? 27 : 24;
  const perdidaAdmisible = hto > htoMin
    ? Math.round(volemia * (hto - htoMin) / hto / 50) * 50 : null;

  return {
    peso, pesoReal, imc, edad, pedia, horas, trauma, ayuno, dur,
    mantHora: Math.round(mantHora), mantenimiento, deficit, deficitPropuesto,
    tercerEspacio, factor, restrictivo, cristaloides, diuresis,
    volemia, hto, htoMin, perdidaAdmisible,
    motivos, advertencias,
    /* Lo que se vuelca a los campos del balance cuando se aplica */
    campos: { cristaloides: String(cristaloides), diuresis: String(diuresis) }
  };
}

/* -------------------------------------------------------------------------
   LOS EVENTOS MAS PROBABLES
   Devuelve tipos de TIPOS_EVENTO ordenados por cuánto los empuja este
   paciente y esta cirugía, cada uno con el motivo en texto. No los registra:
   los pone a un clic de distancia, que es lo que falta cuando el evento está
   pasando y hay que anotarlo con una mano.
   ------------------------------------------------------------------------- */
function eventosProbables(f, tope){
  const ctx = contextoValoracion(f);
  const fl = ctx.flags || {};
  const a = f.acto || {};
  const imc = ctx.imc, edad = ctx.edad;
  const tec = (a.tecnicas || []).join(' ') + ' ' + (ctx.tecnicas || []).join(' ');
  const via = ctx.principal ? ctx.principal.via : '';
  const nombreCx = (ctx.procs || []).map(x => x.n).join(' ');
  const drogas = (a.drogas || []).map(d => d.n || '').join(' ');

  const m = {};
  const sumar = (tipo, peso, motivo) => {
    if(TIPOS_EVENTO.indexOf(tipo) < 0) return;
    if(!m[tipo]) m[tipo] = { tipo, peso:0, motivos:[] };
    m[tipo].peso += peso;
    if(motivo && m[tipo].motivos.indexOf(motivo) < 0) m[tipo].motivos.push(motivo);
  };

  /* --------------------------- hemodinamia --------------------------- */
  if(/raquidea|raquídea|peridural|neuroaxial|subaracnoidea/i.test(tec)){
    sumar('Hipotensión', 5, 'bloqueo neuroaxial');
    sumar('Bradicardia', 3, 'bloqueo neuroaxial alto');
    sumar('Bloqueo fallido', 2, 'técnica regional');
  }
  if(/general/i.test(tec)) sumar('Hipotensión', 2, 'inducción de anestesia general');
  if(fl.hta){ sumar('Hipertensión', 3, 'hipertensión arterial'); sumar('Hipotensión', 2, 'hipertensión arterial de larga data'); }
  if(tieneMed(ctx.meds, /IECA|enalapril|losartán|losartan|ARA ?II/i))
    sumar('Hipotensión', 3, 'IECA o ARA II en la medicación habitual');
  if(tieneMed(ctx.meds, /betabloque|atenolol|bisoprolol|carvedilol/i))
    sumar('Bradicardia', 3, 'betabloqueante habitual');
  if(fl.arritmia){ sumar('Arritmia', 5, 'arritmia conocida'); sumar('Taquicardia', 2, 'arritmia conocida'); }
  if(fl.cardiopatia){ sumar('Isquemia miocárdica', 4, 'cardiopatía'); sumar('Arritmia', 2, 'cardiopatía'); }
  if(fl.icc){ sumar('Hipotensión', 3, 'insuficiencia cardíaca'); sumar('Arritmia', 2, 'insuficiencia cardíaca'); }
  if(edad !== null && edad >= 75){ sumar('Hipotensión', 2, 'edad ≥ 75 años'); sumar('Hipotermia', 2, 'edad ≥ 75 años'); }
  if(ctx.urgente){ sumar('Hipotensión', 3, 'acto de '+nombreCaracter(ctx.caracter).toLowerCase());
                   sumar('Aspiración de contenido gástrico', 3, 'estómago lleno en '+nombreCaracter(ctx.caracter).toLowerCase()); }

  /* ------------------------- via aerea y respiratorio ----------------- */
  const vaDificilPrevista = (((f.v||{}).va||{}).intubacionPrevia === 'Sí' ) ||
                            Number((((f.v||{}).va||{}).mallampati||'').replace(/\D/g,'')) >= 3;
  if(fl.viaAerea || vaDificilPrevista){
    sumar('Intubación dificultosa', 5, 'vía aérea prevista dificultosa en el punto 7');
    sumar('Lesión dentaria', 2, 'laringoscopia dificultosa prevista');
  }
  if(fl.saos){ sumar('Desaturación', 5, 'SAHOS'); sumar('Intubación dificultosa', 3, 'SAHOS'); }
  if(imc && imc >= 35){ sumar('Desaturación', 4, 'IMC '+fNum(imc,1)); sumar('Intubación dificultosa', 3, 'IMC '+fNum(imc,1)); }
  if(fl.asma){ sumar('Broncoespasmo', 5, 'asma'); sumar('Desaturación', 2, 'asma'); }
  if(fl.epoc){ sumar('Broncoespasmo', 4, 'EPOC'); sumar('Desaturación', 3, 'EPOC'); }
  if(fl.tabaquismo){ sumar('Broncoespasmo', 2, 'tabaquismo'); sumar('Laringoespasmo', 2, 'tabaquismo'); }
  if(fl.infeccionRespiratoria){ sumar('Laringoespasmo', 4, 'infección respiratoria reciente');
                                sumar('Desaturación', 3, 'infección respiratoria reciente'); }
  if(fl.reflujo || fl.aspiracion) sumar('Aspiración de contenido gástrico', 4, 'reflujo o riesgo de aspiración');
  if(fl.embarazo){ sumar('Aspiración de contenido gástrico', 3, 'embarazo');
                   sumar('Intubación dificultosa', 3, 'embarazo');
                   sumar('Hipotensión', 4, 'compresión aortocava'); }
  if(edad !== null && edad < 8){ sumar('Laringoespasmo', 4, 'paciente pediátrico');
                                 sumar('Desaturación', 3, 'paciente pediátrico'); }
  if(((f.v||{}).va||{}).denticion && /mal|protesis|prótesis|piez/i.test(String(f.v.va.denticion)))
    sumar('Lesión dentaria', 3, 'dentición en mal estado');

  /* ------------------------------ sangrado --------------------------- */
  if(fl.anticoagulado){ sumar('Sangrado mayor', 5, 'anticoagulación'); sumar('Transfusión', 3, 'anticoagulación'); }
  if(fl.antiagregado) sumar('Sangrado mayor', 3, 'antiagregación');
  if(fl.coagulopatia || fl.sangrado){ sumar('Sangrado mayor', 5, 'coagulopatía'); sumar('Transfusión', 3, 'coagulopatía'); }
  if(fl.hepatopatia) sumar('Sangrado mayor', 3, 'hepatopatía');
  if(fl.anemia) sumar('Transfusión', 3, 'anemia previa');
  if(['laparotomia','toracotomia'].indexOf(via) >= 0){
    sumar('Sangrado mayor', 4, nombreVia(via).toLowerCase());
    sumar('Hipotermia', 4, 'cavidad abierta');
    sumar('Transfusión', 2, nombreVia(via).toLowerCase());
  }
  if(/cesárea|cesarea|histerect|prostatect|artroplast|cadera|columna|hepatect|aneurism|vascular/i.test(nombreCx))
    sumar('Sangrado mayor', 3, 'procedimiento de sangrado esperable');

  /* ------------------------------ regional --------------------------- */
  if(/peridural/i.test(tec)) sumar('Punción dural accidental', 3, 'peridural');
  if(/bloqueo|plexo|periférico|periferico/i.test(tec)){
    sumar('Bloqueo fallido', 3, 'bloqueo periférico');
    sumar('Toxicidad por anestésicos locales (LAST)', 3, 'volumen alto de anestésico local');
  }
  if(imc && imc >= 35 && /raquidea|raquídea|peridural|bloqueo/i.test(tec))
    sumar('Bloqueo fallido', 2, 'obesidad: referencias difíciles');

  /* --------------------------- otros sistemas ------------------------ */
  if(fl.diabetes) sumar('Isquemia miocárdica', 2, 'diabetes');
  if(((f.v||{}).alergias||[]).length || (f.v||{}).alergiaDetalle)
    sumar('Reacción alérgica / anafilaxia', 4, 'alergias declaradas en el punto 4');
  if(/latex|látex|antibiótic|antibiotic|penicilina/i.test(String((f.v||{}).alergiaDetalle||'') +
      ' ' + ((f.v||{}).alergias||[]).join(' ')))
    sumar('Reacción alérgica / anafilaxia', 2, 'alérgeno de riesgo anestésico');
  if(fl.opioides || fl.dolorCronico) sumar('Cambio de técnica anestésica', 2, 'tolerancia a opioides');
  if(tieneAnt(ctx.dx, /hipertermia maligna|miopat|distrofia/i))
    sumar('Hipertermia maligna', 6, 'antecedente de hipertermia maligna o miopatía');
  if(fl.neurologico) sumar('Despertar intraoperatorio', 1, 'patología neurológica');
  if(/tiva|total intravenosa|propofol.*remifentanil/i.test(tec + ' ' + drogas))
    sumar('Despertar intraoperatorio', 3, 'anestesia total intravenosa');
  if(ctx.urgente) sumar('Despertar intraoperatorio', 2, 'inducción con dosis reducidas en urgencia');
  if(edad !== null && (edad >= 75 || edad < 3)) sumar('Hipotermia', 3, 'extremos de la vida');
  if(imc && imc < 18.5) sumar('Hipotermia', 2, 'bajo peso');
  const durMin = duracionDelActo(f, ctx).min;
  if(durMin >= 120) sumar('Hipotermia', 3, 'procedimiento de más de 2 horas');
  if(fl.cardiopatia && ctx.urgente) sumar('Paro cardiorrespiratorio', 2, 'cardiopatía en acto no programado');

  const l = Object.keys(m).map(k => m[k]).sort((a, b) => b.peso - a.peso || a.tipo.localeCompare(b.tipo, 'es'));
  return l.filter(x => x.peso >= 2).slice(0, tope || 8);
}
