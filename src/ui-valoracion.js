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

/* =========================================================================
   VALORACION EXPRES — lo minimo indispensable, arriba de todo
   -------------------------------------------------------------------------
   La valoracion tiene once puntos porque la historia clinica los pide. Pero
   para que una valoracion se pueda dar por CONCLUIDA y sostener un acto
   anestesico hacen falta seis cosas, no quince:

     peso · ASA · via aerea · aptitud fundamentada · plan · consentimiento

   Esas seis estan ahora en una tarjeta al principio, con su estado a la vista
   y un boton que lleva a cada una. Los once puntos siguen abajo, enteros:
   no se saco nada. Lo que cambio es que ya no hay que recorrerlos para saber
   que falta ni para terminar una valoracion sencilla.

   Y arriba de esa tarjeta hay UN atajo, no dos. Habia tambien un boton de
   «autocompletar con lo cargado» y se saco: aparecia al abrir la valoracion,
   cuando todavia no hay nada cargado mas que la filiacion, y ahi no tiene de
   donde deducir nada. Lo unico que quedo es lo que si sirve desde el primer
   segundo:
     - PLANTILLAS: el punto de partida de la valoracion. Rellenan de una vez
       el examen fisico normal, la via aerea, el ayuno, el plan y la
       profilaxis de la situacion elegida, y una de ellas -«patologias
       tratadas y compensadas»- deja escribir las patologias y la medicacion
       del paciente para que la conducta perioperatoria se arme sola.
   La deduccion automatica sigue viva donde tiene sentido: el ASA propuesto,
   que se ofrece solo y se acepta con un clic (asaPropuesto()).
   ========================================================================= */

/* Las seis condiciones para concluir, con su estado y adonde ir a cargarlas */
function itemsExpres(f){
  const v = f.v || {}, sc = v.scores || {}, pl = f.plan || {};
  const p = DB.pacientes[f.pacienteId] || {};
  const peso = (typeof val === 'function' && $('#exPeso') ? val('exPeso') : '') || p.peso;
  return [
    { k:'peso',   t:'Peso del paciente',            ok:!!Number(peso),
      v: peso ? peso + ' kg' : '', anc:'exPeso' },
    { k:'asa',    t:'Clasificación ASA',            ok:!!($('#scAsa') ? val('scAsa') : sc.asa),
      v: ($('#scAsa') ? val('scAsa') : sc.asa) ? 'ASA ' + ($('#scAsa') ? val('scAsa') : sc.asa) : '',
      anc:'scAsa' },
    { k:'va',     t:'Vía aérea (Mallampati)',       ok:!!($('#vaMallampati') ? val('vaMallampati') : (v.va||{}).mallampati),
      v: ($('#vaMallampati') ? val('vaMallampati') : (v.va||{}).mallampati)
         ? 'Clase ' + ($('#vaMallampati') ? val('vaMallampati') : (v.va||{}).mallampati) : '',
      anc:'vaMallampati' },
    { k:'apt',    t:'Conclusión de aptitud',        ok:!!($('#rgFundamento') ? val('rgFundamento') : (v.riesgo||{}).fundamento),
      v:'', anc:'rgFundamento' },
    { k:'plan',   t:'Plan anestésico (técnica)',    ok:!!(($('#plTecnica') ? leerChks('plTecnica') : (pl.tecnica||[])).length),
      v:'', anc:'acPlan' },
    { k:'consent',t:'Consentimiento (punto 11)',    ok: consentimientoCompleto(f),
      v:'', anc:'acConsent' }
  ];
}

function htmlValoracionExpres(f){
  const it = itemsExpres(f);
  const faltan = it.filter(x => !x.ok);
  return ''+
  '<div class="card expres"><h3>'+ico('valoracion')+'Valoración prequirúrgica'+
    '<span class="tag '+(faltan.length?'warn':'ok')+'" style="margin-left:auto">'+
      (faltan.length ? faltan.length+' pendiente'+(faltan.length===1?'':'s') : 'Completa')+'</span></h3>'+

    '<div class="btn-row">'+
      '<button type="button" class="btn pri" id="vaPlantilla">'+ico('lista')+
        ' Usar una plantilla</button>'+
    '</div>'+
    '<div class="ayuda">Una plantilla carga de una vez el examen físico habitual de esa '+
      'situación, la vía aérea, el ayuno, el plan anestésico y la profilaxis. Elegí la que se '+
      'parezca a este paciente y corregí lo que no coincida: <b>nunca pisa lo que ya cargaste</b>. '+
      'Cuando la apliques, la lista de acá abajo te dice qué quedó pendiente.</div>'+

    '<div id="vaAsaSug"></div>'+

    '<label class="mini strong mt14" style="display:block">Lo que hace falta para poder concluirla</label>'+
    '<div class="items">'+ it.map(x =>
      '<div class="it">'+
        '<span class="ic '+(x.ok?'si':'no')+'">'+(x.ok?'✓':'!')+'</span>'+
        '<span class="t">'+esc(x.t)+'</span>'+
        (x.v ? '<span class="v">'+esc(x.v)+'</span>' : '')+
        (x.ok ? '' : '<button type="button" class="btn ghost chico" data-expres="'+esc(x.anc)+'">Ir</button>')+
      '</div>').join('') +'</div>'+
    '<div class="ayuda">Los once puntos completos siguen abajo. Esta tarjeta es sólo el atajo: '+
      'con estos seis la valoración se puede cerrar y sostiene el acto anestésico.</div>'+
  '</div>';
}

/* Tarjeta de escala: el resultado a la vista, los items detras de un
   desplegable. Los inputs siguen en el DOM aunque el desplegable este
   cerrado, asi que leerValoracion() los lee igual que siempre. */
function tarjetaEscala(icono, titulo, idOut, itemsHTML, cuantos){
  return '<div class="card plano" style="border:1.5px solid var(--borde)"><h3>'+ico(icono)+
    esc(titulo)+'</h3>'+
    '<div id="'+idOut+'"></div>'+
    '<details class="acc" style="margin:9px 0 0"><summary><span class="n">'+ico('editar')+'</span>'+
      'Revisar los '+cuantos+' ítems<span class="flecha">'+ico('flecha')+'</span></summary>'+
      '<div class="cuerpo">'+itemsHTML+'</div></details>'+
  '</div>';
}

/* ------------------------------------------------ Cableado del expres -- */
function cablearValoracionExpres(f){
  $$('#fiCuerpo [data-expres]').forEach(b => b.onclick = () => {
    const e = $('#'+b.dataset.expres);
    if(!e) return;
    const acc = e.closest ? e.closest('details.acc') : null;
    if(acc) acc.open = true;
    if(e.tagName === 'DETAILS') e.open = true;
    e.scrollIntoView({ behavior:'smooth', block:'center' });
    setTimeout(() => {
      if(/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) e.focus();
      else { const x = e.querySelector('input,select,textarea'); if(x) x.focus(); }
    }, 400);
  });

  /* --- ASA propuesto: se muestra, se acepta con un clic --- */
  const pintarAsa = () => {
    const caja = $('#vaAsaSug'); if(!caja) return;
    if(val('scAsa')){ caja.innerHTML = ''; return; }
    const a = asaPropuesto(f);
    caja.innerHTML = '<div class="aviso info">'+ico('escudo')+'<div>'+
      '<b>ASA propuesto: '+esc(a.v)+(a.e?'E':'')+'.</b> '+esc(a.texto)+
      (a.reserva ? '<br><span class="mini">'+esc(a.reserva)+'</span>' : '')+
      '<div class="btn-row mt8"><button type="button" class="btn ghost chico" id="vaAsaOK">'+
        ico('check')+' Aceptar ASA '+esc(a.v)+(a.e?'E':'')+'</button></div></div></div>';
    $('#vaAsaOK').onclick = () => {
      $('#scAsa').value = a.v;
      if(a.e) $('#scAsaE').checked = true;
      $('#scAsaEL').classList.toggle('sel', !!a.e);
      caja.innerHTML = '';
      if(window.__recalcValoracion) window.__recalcValoracion();
      pintarExpres();
      toast('ASA '+a.v+(a.e?'E':'')+' cargado. Podés cambiarlo en el punto 5.', 'ok');
    };
  };

  if($('#vaPlantilla')) $('#vaPlantilla').onclick = () => abrirPlantillas(f);
  if($('#rgRedactar')) $('#rgRedactar').onclick = () => {
    const txt = redactarConclusion(fichaActual);
    const ya = val('rgFundamento').trim();
    if(!ya){
      $('#rgFundamento').value = txt;
      $('#rgFundamento').dispatchEvent(new Event('input', { bubbles:true }));
      pintarExpres();
      return toast('Conclusión redactada. Léela y corregí lo que haga falta antes de guardar.', 'ok');
    }
    confirmar('Ya hay texto escrito',
      'La fundamentación no está vacía. ¿Querés <b>agregar</b> el resumen debajo de lo que ya '+
      'escribiste, o <b>reemplazarlo</b>?<br><br>Lo redactado es un resumen de lo cargado: '+
      'revisalo siempre antes de guardar.',
      () => {
        $('#rgFundamento').value = ya + '\n\n' + txt;
        $('#rgFundamento').dispatchEvent(new Event('input', { bubbles:true }));
        pintarExpres(); toast('Resumen agregado debajo.', 'ok');
      }, 'Agregar debajo');
  };
  pintarAsa();
  window.__pintarAsaSug = pintarAsa;
}

/* Repinta solo la tarjeta expres, sin rehacer la valoracion entera: rehacerla
   cerraria todos los acordeones que la persona tiene abiertos. */
function pintarExpres(){
  const c = $('.expres'); if(!c) return;
  const f = typeof fichaEnPantalla === 'function' ? fichaEnPantalla() : fichaActual;
  const nuevo = document.createElement('div');
  nuevo.innerHTML = htmlValoracionExpres(f);
  const tarjeta = nuevo.firstElementChild;
  /* Se reemplaza solo la lista de estados y el contador: los botones y el
     cartel del ASA se dejan como estan para no cortar un clic a medias. */
  const items = c.querySelector('.items'), itemsN = tarjeta.querySelector('.items');
  if(items && itemsN) items.innerHTML = itemsN.innerHTML;
  const tag = c.querySelector('h3 .tag'), tagN = tarjeta.querySelector('h3 .tag');
  if(tag && tagN){ tag.className = tagN.className; tag.textContent = tagN.textContent; }
  cablearValoracionExpres(fichaActual);
}

/* =========================================================================
   EL AUTOCOMPLETADO QUE SE SACO
   -------------------------------------------------------------------------
   Aca vivia abrirAutocompletado(): una ventana que proponia marcar las
   casillas de las escalas deducibles de lo ya cargado. Se saco por pedido de
   la asociacion y el motivo es sensato: el boton aparecia al abrir la
   valoracion, cuando lo unico cargado es la filiacion, y entonces no tenia
   nada de donde deducir. Ofrecer un atajo que casi siempre contesta «no hay
   nada que completar» ensucia la pantalla y hace dudar de si la app calculo
   algo por su cuenta.

   Lo que hace el mismo trabajo y quedo: las PLANTILLAS de aca abajo, que
   cargan de una vez lo que de verdad se repite, y el ASA propuesto, que se
   ofrece solo. derivarValoracion() sigue en valoracion-auto.js por si algun
   dia se quiere volver a colgar de otro lado.
   ========================================================================= */


/* =========================================================================
   PLANTILLAS
   -------------------------------------------------------------------------
   Doce situaciones que cubren la enorme mayoria de las valoraciones, en tres
   grupos: el adulto sano, el adulto con patologia y las situaciones
   especiales. Cada una rellena de una vez el examen fisico habitual de esa
   situacion, la via aerea, el ayuno, el ASA, el plan y la profilaxis. Todo
   queda editable y nada de lo que ya este cargado se pisa.

   El examen fisico «normal» que escriben es la redaccion habitual de un
   examen sin hallazgos. Se carga para no tener que tipearlo: hay que leerlo
   y corregirlo si el paciente no es asi, igual que cualquier plantilla de
   historia clinica.

   UNA DE ELLAS PREGUNTA ANTES DE APLICARSE
   «Adulto con patologias tratadas y compensadas» abre un segundo paso donde
   se eligen las patologias del paciente y la medicacion que toma. Eso no se
   escribe en la valoracion: se escribe en la HISTORIA del paciente, que es
   donde vive desde que la valoracion dejo de duplicarla, y desde ahi el resto
   de la app trabaja sola —la conducta perioperatoria de cada farmaco, las
   escalas, los estudios sugeridos y las alertas del punto 1—. Por eso esa
   plantilla no es un texto mas: es la puerta por la que entra lo que el
   sistema necesita para «determinar como seguir».

   QUE NO HACEN
   No escriben la conclusion de aptitud ni el consentimiento. Esas dos son la
   firma del anestesiologo sobre este paciente y no salen de ninguna
   plantilla. Por eso, despues de aplicar una, la lista «Lo que hace falta
   para poder concluirla» sigue marcando lo que falta: casi siempre esas dos.
   ========================================================================= */

/* El examen sin hallazgos, que repiten casi todas las plantillas de adulto */
const EXAMEN_NORMAL = {
  cardio:'R1-R2 normofonéticos, silencios libres, sin soplos. Pulsos periféricos presentes y simétricos.',
  respiratorio:'Buena entrada de aire bilateral, murmullo vesicular conservado, sin ruidos agregados.',
  abdomen:'Blando, depresible, indoloro, sin visceromegalias.',
  neuro:'Vigil, orientado en tiempo y espacio, sin déficit focal.',
  accesos:'Buenos', columna:'Apófisis palpables, sin dificultad'
};

const PLANTILLAS_VAL = [

/* ------------------------------ ADULTO SANO ---------------------------- */
  { id:'sano', grupo:'Adulto sano', n:'Adulto sano para cirugía menor o ambulatoria',
    d:'ASA I-II sin antecedentes. Examen normal, ayuno cumplido, general balanceada o sedación con '+
      'máscara laríngea, analgesia multimodal sin opioides y alta el mismo día.',
    aplica:{
      examen: EXAMEN_NORMAL,
      va:{ mallampati:'1', cuelloMov:'normal', protrusion:'clase1', denticion:'Completa y sana',
           intubacionPrevia:'sin_datos' },
      asa:'I', mets:'10',
      ayuno:'Leche no humana / comida liviana',
      tecnica:['Anestesia general balanceada','Anestesia general con máscara laríngea'],
      va_disp:['Máscara laríngea 2ª generación'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h',
                 'Infiltración de la herida con anestésico local'],
      nvpo:['Ondansetrón 4 mg'],
      tev:'Deambulación precoz',
      destino:'Alta ambulatoria el mismo día', ambito:'Consultorio de preanestesia' } },

  { id:'sano-mayor', grupo:'Adulto sano', n:'Adulto sano para cirugía mayor',
    d:'ASA I-II sin antecedentes, pero con una cirugía de porte: intubación orotraqueal, monitoreo '+
      'ampliado, tromboprofilaxis farmacológica, analgesia multimodal con opioide y recuperación '+
      'en URPA.',
    aplica:{
      examen: EXAMEN_NORMAL,
      va:{ mallampati:'2', cuelloMov:'normal', protrusion:'clase1', denticion:'Completa y sana',
           intubacionPrevia:'sin_datos' },
      asa:'II', mets:'10',
      ayuno:'Leche no humana / comida liviana',
      tecnica:['Anestesia general balanceada','Anestesia general con IOT'],
      va_disp:['Tubo endotraqueal (laringoscopía directa)'],
      monAv:['Presión arterial invasiva','Diuresis horaria'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h','Morfina EV titulada',
                 'Infiltración de la herida con anestésico local'],
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      tev:'Enoxaparina 40 mg/día',
      destino:'Sala de recuperación postanestésica (URPA)', ambito:'Consultorio de preanestesia' } },

/* -------------------------- ADULTO CON PATOLOGIA ----------------------- */
  { id:'hta', grupo:'Adulto con patología', n:'Adulto con hipertensión arterial tratada y compensada',
    d:'ASA II. Examen normal con tensión controlada por la medicación habitual, IOT, analgesia '+
      'multimodal y profilaxis de náuseas. La conducta con cada antihipertensivo la calcula el '+
      'punto 1 a partir de la medicación de su historia.',
    patologias:['Hipertensión arterial'],
    aplica:{
      examen: Object.assign({}, EXAMEN_NORMAL, {
        cardio:'R1-R2 normofonéticos, sin soplos. Tensión arterial controlada con la medicación habitual.' }),
      va:{ mallampati:'2', cuelloMov:'normal', protrusion:'clase1', intubacionPrevia:'sin_datos' },
      asa:'II', mets:'4',
      ayuno:'Leche no humana / comida liviana',
      tecnica:['Anestesia general balanceada','Anestesia general con IOT'],
      va_disp:['Tubo endotraqueal (laringoscopía directa)'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h','Morfina EV titulada'],
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      tev:'Enoxaparina 40 mg/día',
      destino:'Sala de recuperación postanestésica (URPA)', ambito:'Consultorio de preanestesia',
      interconsultas:'' } },

  { id:'dbt', grupo:'Adulto con patología', n:'Adulto con diabetes tipo 2 tratada',
    d:'ASA II-III. Suma al examen normal lo que la diabetes obliga a mirar: ayuno con riesgo de '+
      'gastroparesia, control glucémico y la suspensión de iSGLT2 y agonistas GLP-1, que el punto 1 '+
      'resuelve solo si la medicación está en su historia.',
    patologias:['Diabetes tipo 2'],
    aplica:{
      examen: Object.assign({}, EXAMEN_NORMAL, {
        neuro:'Vigil, orientado, sin déficit focal. Sin signos de neuropatía periférica al examen.' }),
      va:{ mallampati:'2', cuelloMov:'normal', protrusion:'clase1', intubacionPrevia:'sin_datos' },
      asa:'III', mets:'4',
      ayuno:'Leche no humana / comida liviana',
      ayRiesgo:['Diabetes de larga evolución'],
      tecnica:['Anestesia general balanceada','Anestesia general con IOT'],
      va_disp:['Tubo endotraqueal (laringoscopía directa)'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h','Morfina EV titulada'],
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      tev:'Enoxaparina 40 mg/día',
      destino:'Sala de recuperación postanestésica (URPA)', ambito:'Consultorio de preanestesia',
      indicaciones:'Control de glucemia capilar la mañana de la cirugía. Traer su medidor y su '+
        'registro de glucemias. No aplicarse la insulina rápida del desayuno el día de la cirugía.' } },

  /* La plantilla que pregunta. Ver abrirPlantillaPatologias(). */
  { id:'compensado', grupo:'Adulto con patología', pide:'patologias',
    n:'Adulto con patologías tratadas y compensadas — elegir cuáles',
    d:'Abre un paso previo para marcar las patologías del paciente y la medicación que toma. Eso se '+
      'guarda en su historia clínica y desde ahí el sistema arma solo la conducta perioperatoria '+
      'de cada fármaco, las alertas y los estudios sugeridos.',
    aplica:{
      examen: Object.assign({}, EXAMEN_NORMAL, {
        cardio:'R1-R2 normofonéticos, sin soplos. Compensado con la medicación habitual.' }),
      va:{ mallampati:'2', cuelloMov:'normal', protrusion:'clase1', intubacionPrevia:'sin_datos' },
      asa:'III', mets:'4',
      ayuno:'Leche no humana / comida liviana',
      tecnica:['Anestesia general balanceada','Anestesia general con IOT'],
      va_disp:['Tubo endotraqueal (laringoscopía directa)'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h','Morfina EV titulada'],
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      tev:'Enoxaparina 40 mg/día',
      destino:'Sala de recuperación postanestésica (URPA)', ambito:'Consultorio de preanestesia' } },

  { id:'coronario', grupo:'Adulto con patología',
    n:'Cardiópata o coronario para cirugía no cardíaca',
    d:'ASA III. Betabloqueo y estatina que se continúan, antiagregación que hay que consensuar con '+
      'cardiología, monitoreo ampliado y destino en área de cuidados. Marca la interconsulta.',
    patologias:['Cardiopatía isquémica / IAM previo'],
    aplica:{
      examen: Object.assign({}, EXAMEN_NORMAL, {
        cardio:'R1-R2 normofonéticos, sin soplos ni tercer ruido. Sin ingurgitación yugular ni edemas. '+
               'Sin angina en reposo ni de esfuerzo reciente.' }),
      va:{ mallampati:'2', cuelloMov:'normal', protrusion:'clase1', intubacionPrevia:'sin_datos' },
      asa:'III', mets:'4',
      ayuno:'Leche no humana / comida liviana',
      tecnica:['Anestesia general balanceada','Anestesia general con IOT'],
      va_disp:['Tubo endotraqueal (laringoscopía directa)'],
      monAv:['Presión arterial invasiva','Diuresis horaria'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Morfina EV titulada'],
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      tev:'Enoxaparina 40 mg/día',
      destino:'Unidad de terapia intermedia', ambito:'Consultorio de preanestesia',
      interconsultas:'Cardiología: riesgo perioperatorio, conducta con la antiagregación y ventana '+
        'del stent si lo tuviera. Solicitar ECG y ecocardiograma recientes.' } },

  { id:'respiratorio', grupo:'Adulto con patología',
    n:'EPOC o asma bajo tratamiento y estable',
    d:'ASA II-III. Broncodilatadores que se continúan e incluso se administran antes de entrar, '+
      'preferencia por la regional cuando la cirugía lo permite y kinesiología en el postoperatorio.',
    patologias:['EPOC'],
    aplica:{
      examen: Object.assign({}, EXAMEN_NORMAL, {
        respiratorio:'Buena entrada de aire bilateral, sin sibilancias ni ruidos agregados en el '+
          'momento del examen. Sin disnea de reposo. Sin infección respiratoria en las últimas 6 semanas.' }),
      va:{ mallampati:'2', cuelloMov:'normal', protrusion:'clase1', intubacionPrevia:'sin_datos' },
      asa:'III', mets:'4',
      ayuno:'Leche no humana / comida liviana',
      tecnica:['Anestesia general balanceada','Anestesia general con máscara laríngea'],
      va_disp:['Máscara laríngea 2ª generación'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h',
                 'Infiltración de la herida con anestésico local','Kinesiología y movilización precoz'],
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      tev:'Enoxaparina 40 mg/día',
      destino:'Sala de recuperación postanestésica (URPA)', ambito:'Consultorio de preanestesia',
      indicaciones:'Traer sus broncodilatadores el día de la cirugía y usarlos como todos los días, '+
        'incluida la dosis de la mañana. Avisar si aparece tos, fiebre o aumento de la expectoración.' } },

  { id:'obeso', grupo:'Adulto con patología',
    n:'Obesidad con sospecha o diagnóstico de apnea del sueño',
    d:'ASA III. Vía aérea potencialmente difícil, riesgo de aspiración, posición en rampa, '+
      'preoxigenación y analgesia que evita el opioide. Marca los ítems de vía aérea que hay que mirar.',
    patologias:['Obesidad','SAHOS / apnea obstructiva del sueño'],
    aplica:{
      examen: Object.assign({}, EXAMEN_NORMAL, {
        respiratorio:'Buena entrada de aire bilateral. Refiere ronquido nocturno y somnolencia diurna.',
        accesos:'Dificultosos — prever ecografía' }),
      va:{ mallampati:'3', cuelloMov:'normal', protrusion:'clase2', intubacionPrevia:'sin_datos' },
      vaOtros:['Obesidad cervical','Cuello corto','Riesgo de aspiración'],
      asa:'III', mets:'4',
      ayuno:'Leche no humana / comida liviana',
      ayRiesgo:['Obesidad mórbida','Reflujo severo'],
      ayProfilaxis:['Omeprazol 40 mg'],
      tecnica:['Anestesia general balanceada','Anestesia general con IOT'],
      va_disp:['Tubo endotraqueal (videolaringoscopio)'],
      monAv:['Índice biespectral (BIS) / EEG procesado'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h','Bloqueo TAP',
                 'Infiltración de la herida con anestésico local'],
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      tev:'Enoxaparina 40 mg/día',
      destino:'Sala de recuperación postanestésica (URPA)', ambito:'Consultorio de preanestesia',
      indicaciones:'Traer su CPAP al internarse y usarla en el postoperatorio como en su casa.' } },

  { id:'anciano', grupo:'Adulto con patología',
    n:'Adulto mayor frágil (más de 75 años)',
    d:'ASA III. Dosis reducidas, prevención de delirium, normotermia, analgesia sin opioides fuertes '+
      'y movilización precoz. Deja marcada la evaluación cognitiva y funcional.',
    aplica:{
      examen: Object.assign({}, EXAMEN_NORMAL, {
        neuro:'Vigil, orientado en tiempo y espacio. Sin déficit focal. Marcha autónoma / con apoyo. '+
              'Sin deterioro cognitivo referido por la familia.',
        accesos:'Dificultosos — prever ecografía' }),
      va:{ mallampati:'2', cuelloMov:'limitada', denticion:'Prótesis removible', intubacionPrevia:'sin_datos' },
      asa:'III', mets:'4',
      ayuno:'Líquidos claros',
      tecnica:['Anestesia general balanceada','Anestesia raquídea (subaracnoidea)'],
      va_disp:['Máscara laríngea 2ª generación'],
      monAv:['Índice biespectral (BIS) / EEG procesado'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Bloqueo del grupo pericapsular (PENG)',
                 'Infiltración de la herida con anestésico local','Kinesiología y movilización precoz'],
      nvpo:['Ondansetrón 4 mg'],
      tev:'Enoxaparina 40 mg/día',
      destino:'Sala de recuperación postanestésica (URPA)', ambito:'Consultorio de preanestesia',
      indicaciones:'Tomar líquidos claros hasta 2 horas antes para no llegar deshidratado. Venir con '+
        'los anteojos y el audífono puestos, y con un acompañante.' } },

/* ------------------------ SITUACIONES ESPECIALES ----------------------- */
  { id:'urgencia', grupo:'Situaciones especiales', n:'Urgencia — estómago ocupado',
    d:'Ayuno no cumplido, secuencia de intubación rápida, profilaxis de aspiración y monitoreo '+
      'según el estado. Deja el ámbito en guardia y el ASA con la E de urgencia.',
    aplica:{
      asa:'III', asaE:true,
      ayuno:'Comida grasa, frita o carne',
      ayRiesgo:['Cirugía de urgencia'],
      ayProfilaxis:['Secuencia de intubación rápida','Omeprazol 40 mg','Metoclopramida 10 mg',
                    'Ecografía gástrica'],
      va:{ intubacionPrevia:'sin_datos' },
      vaOtros:['Riesgo de aspiración'],
      tecnica:['Anestesia general con IOT','Secuencia de intubación rápida (SIR)'],
      va_disp:['Tubo endotraqueal (videolaringoscopio)'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Morfina EV titulada'],
      nvpo:['Ondansetrón 4 mg'],
      tev:'Compresión neumática intermitente',
      destino:'Sala de recuperación postanestésica (URPA)', ambito:'Guardia / urgencia' } },

  { id:'obstetrica', grupo:'Situaciones especiales', n:'Cesárea u obstétrica',
    d:'Raquídea con opioide, profilaxis de aspiración, decúbito lateral izquierdo, vasopresor '+
      'preparado y analgesia compatible con la lactancia.',
    aplica:{
      examen: Object.assign({}, EXAMEN_NORMAL, {
        abdomen:'Grávido, acorde a la edad gestacional.',
        columna:'Apófisis palpables, sin dificultad' }),
      va:{ mallampati:'3', cuelloMov:'normal', intubacionPrevia:'sin_datos' },
      vaOtros:['Embarazo a término','Riesgo de aspiración'],
      asa:'II', asaE:true, mets:'4',
      ayuno:'Líquidos claros',
      ayRiesgo:['Embarazo con trabajo de parto'],
      ayProfilaxis:['Citrato de sodio 0,3 M','Ranitidina / famotidina','Metoclopramida 10 mg'],
      tecnica:['Anestesia raquídea (subaracnoidea)'],
      va_disp:['Máscara facial'],
      analgesia:['Morfina intratecal (raquídea)','Paracetamol 1 g EV c/6-8 h',
                 'Dipirona 1-2 g EV c/8 h','Infiltración de la herida con anestésico local'],
      nvpo:['Ondansetrón 4 mg'],
      tev:'Enoxaparina 40 mg/día',
      destino:'Sala de partos / puerperio', ambito:'Antecámara de quirófano' } },

  { id:'pedia', grupo:'Situaciones especiales', n:'Pediátrico sano',
    d:'ASA I, inducción inhalatoria, máscara laríngea, analgesia sin AINE fuerte y bloqueo caudal '+
      'o de campo. Ayuno pediátrico y presencia de los padres en la inducción.',
    aplica:{
      examen:{ cardio:'R1-R2 normofonéticos, sin soplos.',
               respiratorio:'Buena entrada de aire bilateral, sin ruidos agregados. Sin infección '+
                 'respiratoria en las últimas 2 semanas.',
               abdomen:'Blando, depresible, indoloro.',
               neuro:'Vigil, reactivo, acorde a la edad.',
               accesos:'Buenos' },
      va:{ mallampati:'1', cuelloMov:'normal', denticion:'Completa y sana', intubacionPrevia:'sin_datos' },
      asa:'I', mets:'10',
      ayuno:'Leche materna',
      tecnica:['Anestesia general inhalatoria','Anestesia general con máscara laríngea'],
      va_disp:['Máscara laríngea 2ª generación'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Bloqueo caudal (pediátrico)',
                 'Infiltración de la herida con anestésico local'],
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      tev:'Deambulación precoz',
      destino:'Sala de recuperación postanestésica (URPA)', ambito:'Consultorio de preanestesia',
      indicaciones:'Puede tomar líquidos claros hasta 2 horas antes. Traer su juguete o su mantita. '+
        'Un adulto puede acompañarlo hasta que se duerma.' } }
];

function abrirPlantillas(f){
  const grupos = [];
  PLANTILLAS_VAL.forEach(x => {
    let g = grupos.find(y => y.g === x.grupo);
    if(!g){ g = { g:x.grupo, l:[] }; grupos.push(g); }
    g.l.push(x);
  });

  abrirModal('Usar una plantilla',
    '<div class="aviso warn">'+ico('alerta')+'<div><b>Una plantilla es un punto de partida, no una '+
      'valoración.</b> Rellena el ASA, el examen físico, la vía aérea, el ayuno, el plan y la '+
      'profilaxis con lo habitual de esa situación para que no haya que tipearlos. <b>Leelos y '+
      'corregí lo que no coincida con este paciente antes de guardar</b>: lo que se firma después '+
      'es historia clínica.<br>'+
      'No se pisa nada de lo que ya tengas cargado, y no escribe ni la conclusión de aptitud ni el '+
      'consentimiento: ésas son tuyas.</div></div>'+
    grupos.map(g =>
      '<label class="mini strong mt14" style="display:block">'+esc(g.g)+'</label>'+
      g.l.map(x =>
        '<label class="chk" style="width:100%;align-items:flex-start;border-radius:9px;margin-bottom:7px">'+
          '<input type="radio" name="plt" value="'+esc(x.id)+'">'+
          '<span><b>'+esc(x.n)+'</b>'+
          (x.pide ? ' <span class="tag warn">pregunta antes</span>' : '')+
          '<br><span class="mini" style="font-weight:400;opacity:.85">'+
          esc(x.d)+'</span></span></label>').join('')).join(''),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="pltOK">'+ico('check')+' Aplicar</button>');

  $$('#modal .chk').forEach(l => l.onclick = () =>
    setTimeout(() => $$('#modal .chk').forEach(x =>
      x.classList.toggle('sel', x.querySelector('input').checked)), 0));

  $('#pltOK').onclick = () => {
    const r = $('#modal input[name="plt"]:checked');
    if(!r) return toast('Elegí una plantilla.', 'warn');
    const t = PLANTILLAS_VAL.find(x => x.id === r.value);
    cerrarModal();
    /* La plantilla de patologias no se aplica: primero pregunta cuales. */
    if(t.pide === 'patologias') setTimeout(() => abrirPlantillaPatologias(f, t), 180);
    else aplicarPlantilla(t);
  };
}

/* =========================================================================
   LA PLANTILLA QUE PREGUNTA: PATOLOGIAS Y MEDICACION
   -------------------------------------------------------------------------
   «Adulto con patologias tratadas y compensadas» no puede rellenar nada sin
   saber cuales. Este paso las pide y hace con ellas lo unico que sirve: las
   escribe en la HISTORIA del paciente.

   Por que en la historia y no en la valoracion: porque una patologia es de la
   persona, no de esta cirugia, y porque todo el resto de la app lee de ahi.
   En cuanto quedan cargadas, sin tocar nada mas:
     - el punto 1 arma la conducta perioperatoria de cada farmaco, con los
       dias de suspension, las esperas de ASRA y las alertas rojas (periop.js);
     - las escalas y los estudios sugeridos leen las flags de cada patologia;
     - el ASA propuesto cambia;
     - lo cargado viaja a la ficha de hoy y a todas las que vengan.
   Eso es lo que se pidio con «que el sistema determine como seguir».

   La medicacion se ofrece deducida de las patologias elegidas -cada una trae
   su lista habitual en data-antecedentes.js- y ademas se puede escribir a
   mano, un farmaco por renglon, para lo que el catalogo no tenga.
   ========================================================================= */
let pltPatoElegidas = [];
let pltMedElegidas  = [];
let pltMedSugeridas = [];

function abrirPlantillaPatologias(f, t){
  const p = DB.pacientes[f.pacienteId];
  if(!p) return toast('La ficha todavía no tiene paciente.', 'err');
  pltPatoElegidas = [];
  pltMedElegidas  = [];

  abrirModal('¿Qué patologías tiene, tratadas y compensadas?',
    '<div class="aviso info">'+ico('info')+'<div>Lo que marques se guarda en la <b>historia de '+
      esc((p.apellido||'')+', '+(p.nombre||''))+'</b>, no en esta ficha suelta: es de la persona y '+
      'lo hereda cada valoración que se le haga. Con eso cargado, la app arma sola la conducta '+
      'perioperatoria de cada fármaco —qué suspender, cuántos días antes y qué continuar— y las '+
      'alertas del punto 1.</div></div>'+

    '<div class="campo"><label>Buscar una patología</label>'+
      '<input type="search" id="pltBuscar" placeholder="Hipertensión, diabetes, EPOC, hipotiroidismo…" '+
        'autocomplete="off"></div>'+
    '<div id="pltPatoLista" class="chks" style="flex-direction:column;align-items:stretch;'+
      'max-height:230px;overflow:auto"></div>'+
    '<div id="pltPatoSel" class="mt8"></div>'+

    '<label class="mini strong mt14" style="display:block">Medicación que toma</label>'+
    '<div class="ayuda">Se propone la habitual de cada patología marcada. Tildá la que de verdad '+
      'toma; después, en la historia, se le puede cargar la dosis.</div>'+
    '<div id="pltMedLista" class="chks" style="flex-direction:column;align-items:stretch"></div>'+
    '<div class="campo mt8"><label>Otra medicación, un fármaco por renglón</label>'+
      '<textarea id="pltMedOtra" rows="3" placeholder="Levotiroxina 100 mcg&#10;Omeprazol 20 mg"></textarea>'+
      '<div class="ayuda">Lo que escribas acá entra como fármaco «a evaluar»: la app no le conoce '+
        'la conducta perioperatoria y te la deja para que la decidas vos en la historia.</div></div>',

    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="pltPatoOK">'+ico('check')+
      ' Guardar en la historia y aplicar</button>', '760px');

  const pintarLista = () => {
    const q = norm($('#pltBuscar') ? $('#pltBuscar').value : '');
    const l = PATOLOGIAS
      .filter(x => !q || norm(x.n + ' ' + (x.chip||'') + ' ' + x.sis).indexOf(q) >= 0)
      .slice(0, q ? 40 : 14);
    $('#pltPatoLista').innerHTML = l.length
      ? l.map(x => {
          const ya = tieneAntecedente(p, x.n);
          const sel = pltPatoElegidas.indexOf(x.n) >= 0;
          return '<label class="chk'+(sel||ya?' sel':'')+'" style="width:100%;border-radius:9px">'+
            '<input type="checkbox" class="pltPato" value="'+esc(x.n)+'"'+
              (sel?' checked':'')+(ya?' disabled':'')+'>'+
            '<span>'+esc(x.n)+' <span class="mini" style="font-weight:400;opacity:.7">· '+
            esc(x.sis)+'</span>'+
            (ya ? ' <span class="tag ok">ya está en su historia</span>' : '')+'</span></label>';
        }).join('')
      : '<span class="mini">Ninguna patología del catálogo coincide. Cargala a mano después, '+
        'desde «Editar la historia del paciente».</span>';
    $$('#pltPatoLista .pltPato').forEach(i => i.onchange = () => {
      const v = i.value;
      const k = pltPatoElegidas.indexOf(v);
      if(i.checked && k < 0) pltPatoElegidas.push(v);
      if(!i.checked && k >= 0) pltPatoElegidas.splice(k, 1);
      i.closest('label').classList.toggle('sel', i.checked);
      pintarSeleccion(); pintarMeds();
    });
  };

  const pintarSeleccion = () => {
    $('#pltPatoSel').innerHTML = pltPatoElegidas.length
      ? '<div class="aviso ok">'+ico('check')+'<div><b>Se van a agregar a su historia:</b> '+
        pltPatoElegidas.map(x => '<span class="tag">'+esc(x)+'</span>').join(' ')+'</div></div>'
      : '';
  };

  /* La medicacion propuesta sale de las patologias elegidas MAS las que el
     paciente ya tenia cargadas: si ya era hipertenso y ahora se agrega
     diabetes, se ofrece la medicacion de las dos. */
  const pintarMeds = () => {
    const base = (p.antecedentes || []).concat(pltPatoElegidas.map(n => ({ n })));
    const sug = medicacionSugerida(base)
      .filter(m => !(p.medicacion || []).some(x => x.n === m.n));
    /* Se guarda la propuesta entera, no solo el nombre: cada fármaco viaja con
       su grupo, su conducta perioperatoria y la patología por la que se ofrece,
       que es lo que después se ve en la historia y en el punto 1. */
    pltMedSugeridas = sug;
    $('#pltMedLista').innerHTML = sug.length
      ? sug.map(m => {
          const sel = pltMedElegidas.indexOf(m.n) >= 0;
          return '<label class="chk'+(sel?' sel':'')+'" style="width:100%;align-items:flex-start;'+
            'border-radius:9px"><input type="checkbox" class="pltMed" value="'+esc(m.n)+'"'+
            (sel?' checked':'')+'>'+
            '<span><b>'+esc(m.n)+'</b> <span class="mini" style="font-weight:400;opacity:.75">· '+
            esc(m.g)+' · por '+esc(m.porque)+'</span></span></label>';
        }).join('')
      : '<span class="mini">'+(pltPatoElegidas.length || (p.antecedentes||[]).length
          ? 'Sin medicación nueva para proponer: la habitual de esas patologías ya está cargada.'
          : 'Marcá una patología y acá aparece su medicación habitual.')+'</span>';
    $$('#pltMedLista .pltMed').forEach(i => i.onchange = () => {
      const k = pltMedElegidas.indexOf(i.value);
      if(i.checked && k < 0) pltMedElegidas.push(i.value);
      if(!i.checked && k >= 0) pltMedElegidas.splice(k, 1);
      i.closest('label').classList.toggle('sel', i.checked);
    });
  };

  $('#pltBuscar').oninput = debounce(pintarLista, 200);
  pintarLista(); pintarSeleccion(); pintarMeds();

  $('#pltPatoOK').onclick = () => {
    const otras = ($('#pltMedOtra').value || '').split('\n')
      .map(x => x.trim()).filter(Boolean);
    if(!pltPatoElegidas.length && !pltMedElegidas.length && !otras.length)
      return toast('No marcaste ninguna patología ni medicación. Si el paciente no tiene, usá la '+
                   'plantilla de adulto sano.', 'warn');
    const elegidas = pltMedElegidas
      .map(n => pltMedSugeridas.find(m => m.n === n) || { n:n });
    guardarHistoriaDePlantilla(f, pltPatoElegidas, elegidas, otras);
    cerrarModal();
    aplicarPlantilla(t);
  };
}

/* Escribe en la historia del paciente lo que se marco. Solo agrega: no pisa
   ni borra nada de lo que ya estaba. */
function guardarHistoriaDePlantilla(f, patos, meds, otras){
  const g = DB.pacientes[f.pacienteId];
  if(!g) return;
  const p = JSON.parse(JSON.stringify(g));
  p.antecedentes = p.antecedentes || [];
  p.medicacion   = p.medicacion || [];
  let nA = 0, nM = 0;

  patos.forEach(n => {
    if(p.antecedentes.some(a => (a.n || a) === n)) return;
    const cat = patologiaPorNombre(n);
    p.antecedentes.push({ n:n, sis: cat ? cat.sis : 'Otros' });
    nA++;
  });
  /* Si se cargan antecedentes, «sin antecedentes relevantes» deja de ser
     cierto: se apaga sola para que la historia no se contradiga. */
  if(nA) p.sinAntecedentes = false;

  /* `meds` viene de la lista sugerida y trae grupo, conducta y motivo ya
     resueltos; `otras` son nombres sueltos escritos a mano, que se buscan en
     el vademécum perioperatorio por si el nombre coincide y, si no, entran
     como «a evaluar»: la app no le inventa una conducta a un fármaco que no
     conoce. */
  const sumarMed = m => {
    const n = m.n;
    if(!n || p.medicacion.some(x => x.n === n)) return;
    const fp = FARMACOS_PERIOP.find(x => x.n === n);
    p.medicacion.push({ n:n,
      g:      m.g      || (fp ? fp.g : 'Otro'),
      accion: m.accion || (fp ? fp.accion : 'evaluar'),
      nota:   m.nota   || (fp ? fp.nota : ''),
      dosis:'', porque: m.porque || '' });
    nM++;
  };
  (meds || []).forEach(m => sumarMed(typeof m === 'string' ? { n:m } : m));
  (otras || []).forEach(n => sumarMed({ n:n }));

  p.modificado = new Date().toISOString();
  p.modificadoPor = SESION ? SESION.uid : '';
  escribir('pacientes', p.id, p);
  auditar('paciente-historia-plantilla',
    'Desde la valoración: ' + nA + ' antecedente(s) y ' + nM + ' fármaco(s) agregados a la '+
    'historia de ' + (p.apellido||'') + ', ' + (p.nombre||''));
  toast(nA + ' antecedente' + (nA===1?'':'s') + ' y ' + nM + ' fármaco' + (nM===1?'':'s') +
        ' cargados en la historia. La conducta perioperatoria del punto 1 ya los tiene en cuenta.',
        'ok');
}

/* Aplica sin pisar: solo escribe donde no hay nada */
function aplicarPlantilla(t){
  const a = t.aplica;
  let n = 0;
  const ponerSi = (id, v) => {
    const e = $('#'+id); if(!e || e.value || !v) return;
    /* En un desplegable, escribir un valor que no es una de sus opciones lo
       deja vacio y sin decirlo. Se comprueba antes: es la diferencia entre
       una plantilla que carga y una que aparenta cargar. */
    if(e.tagName === 'SELECT' &&
       !Array.prototype.some.call(e.options, o => o.value === v)){
      console.warn('plantilla', t.id, ': «'+v+'» no es una opción de #'+id);
      return;
    }
    e.value = v; n++;
  };
  const tildarSi = (cont, lista) => (lista||[]).forEach(txt => {
    const e = $$('#'+cont+' input').find(x => x.value === txt);
    if(e && !e.checked){ e.checked = true;
      const l = e.closest('label'); if(l) l.classList.add('sel');
      const d = e.closest('details'); if(d) d.open = true; n++; }
  });

  /* `sinAntecedentes` y los habitos ya no se tocan desde aca: viven en la
     historia del paciente y una plantilla de valoracion no tiene por que
     escribir en la historia clinica de la persona. Las plantillas siguen
     rellenando lo que SI es de esta cirugia: examen, via aerea, ayuno, plan
     y profilaxis. La unica que escribe en la historia es la de patologias, y
     lo hace en un paso aparte, preguntando. */
  if(a.examen){
    ponerSi('exCardio', a.examen.cardio); ponerSi('exResp', a.examen.respiratorio);
    ponerSi('exAbd', a.examen.abdomen);   ponerSi('exNeuro', a.examen.neuro);
    ponerSi('exAccesos', a.examen.accesos); ponerSi('exColumna', a.examen.columna);
  }
  if(a.va){
    ponerSi('vaMallampati', a.va.mallampati); ponerSi('vaCuello', a.va.cuelloMov);
    ponerSi('vaProtrusion', a.va.protrusion); ponerSi('vaDenticion', a.va.denticion);
    ponerSi('vaIntPrev', a.va.intubacionPrevia);
  }
  tildarSi('vaOtros', a.vaOtros);
  /* El ASA lo propone la plantilla porque el nombre de la plantilla ya es una
     afirmacion sobre el estado del paciente. Sigue siendo un desplegable
     editable en el punto 5, y si ya habia uno cargado no se toca. */
  ponerSi('scAsa', a.asa);
  if(a.asaE && $('#scAsaE') && !$('#scAsaE').checked){
    $('#scAsaE').checked = true;
    if($('#scAsaEL')) $('#scAsaEL').classList.add('sel');
    n++;
  }
  if(a.mets && $('#mets') && !$('#mets').value) { $('#mets').value = a.mets; n++; }
  ponerSi('ayTipo', a.ayuno);
  tildarSi('ayRiesgo', a.ayRiesgo); tildarSi('ayProfilaxis', a.ayProfilaxis);
  tildarSi('plTecnica', a.tecnica);  tildarSi('plVA', a.va_disp);
  tildarSi('plMonAv', a.monAv);
  /* La analgesia de las plantillas se guarda para que el paso Recuperacion la
     proponga: ahi es donde ahora se indica. */
  if(a.analgesia && !((fichaActual.plan||{}).analgesia||[]).length){
    fichaActual.plan = fichaActual.plan || {};
    fichaActual.plan.analgesia = a.analgesia.slice();
    n += a.analgesia.length;
  }
  tildarSi('plNVPO', a.nvpo);
  ponerSi('plTEV', a.tev); ponerSi('plDestino', a.destino); ponerSi('rgAmbito', a.ambito);
  ponerSi('rgInterconsultas', a.interconsultas);
  /* Las indicaciones se SUMAN a las que ya haya: la conducta perioperatoria
     tambien escribe ahi y no tienen por que pisarse. */
  if(a.indicaciones && $('#plIndicaciones')){
    const c = $('#plIndicaciones');
    if(c.value.indexOf(a.indicaciones) < 0){
      c.value = c.value ? (c.value.replace(/\s+$/,'') + '\n' + a.indicaciones) : a.indicaciones;
      n++;
    }
  }

  if(window.__recalcValoracion) window.__recalcValoracion();
  if(window.__pintarAsaSug) window.__pintarAsaSug();
  pintarConductaPeriop();
  pintarExpres();
  pintarHistoriaEnValoracion();
  toast(n
    ? 'Plantilla «'+t.n+'» aplicada: '+n+' campo'+(n===1?'':'s')+'. Revisalos antes de guardar.'
    : 'La plantilla no agregó nada: todo lo que rellena ya estaba cargado.',
    n ? 'ok' : 'warn');
}

/* =========================================================================
   LA HISTORIA DEL PACIENTE, DE LECTURA
   -------------------------------------------------------------------------
   Los cinco primeros puntos de la valoracion -antecedentes patologicos,
   revision por sistemas, antecedentes anestesicos y familiares, medicacion
   habitual, alergias y habitos- preguntaban exactamente lo mismo que las
   cuatro solapas de «anotar nuevo paciente». Eran el mismo formulario dos
   veces, y esa duplicacion no era neutral: se cargaba una vez en un lado, se
   corregia en el otro, y despues habia dos versiones del mismo antecedente
   sin forma de saber cual valia.

   Ahora se carga UNA sola vez, en la historia del paciente, que es su lugar:
   los antecedentes son de la persona, no de esta cirugia. La valoracion los
   MUESTRA y no los vuelve a pedir; para corregirlos se va a la historia, con
   el boton de esta misma tarjeta, y al volver la valoracion los relee.

   Lo que si es de esta cirugia -que hacer con cada farmaco antes de operar-
   quedo en la valoracion, en el punto 1, y ahora se calcula solo.

   EL SEMAFORO DE LO FILIATORIO
   La tarjeta ya no se limita a mostrar: dice si lo que hay ALCANZA para
   concluir la valoracion. Arriba, los datos de filiacion que la valoracion
   necesita de verdad -no todos, solo los que cambian una conducta
   anestesica-, en rojo los que faltan y en verde los que estan:

     apellido y nombre · documento · fecha de nacimiento · sexo · peso ·
     talla · correo

   Peso y talla porque sin ellos el vademecum no propone una sola dosis y no
   hay IMC; la fecha de nacimiento porque la edad entra en casi todas las
   escalas; el sexo porque cambia el peso ideal; el correo porque es por donde
   se le entrega la documentacion. Los demas datos de la ficha del paciente
   -domicilio, ocupacion, contacto de emergencia- no aparecen aca: son utiles,
   pero no traban una valoracion, y marcarlos en rojo seria alarmar por algo
   que no lo merece.

   Abajo, lo clinico de siempre, cada renglon con su estado: verde cuando hay
   algo cargado o cuando esta declarado que no hay -«sin antecedentes
   relevantes», «sin alergias conocidas»-, y ambar cuando esta en blanco, que
   no es lo mismo. Un renglon vacio no dice que el paciente no tenga: dice
   que nadie pregunto.
   ========================================================================= */

/* Los datos de filiacion que la valoracion necesita, con como se leen */
function filiatoriosDeValoracion(p){
  const ed = edadDe(p.fechaNac);
  return [
    { t:'Apellido y nombre', ok:!!(p.apellido && p.nombre),
      v:(p.apellido||'')+(p.nombre ? ', '+p.nombre : '') },
    { t:'Documento', ok:!!p.dni, v:p.dni || '' },
    { t:'Fecha de nacimiento', ok:!!p.fechaNac,
      v: p.fechaNac ? fFecha(p.fechaNac) + (ed !== null ? ' · '+ed+' años' : '') : '',
      porque:'La edad entra en el ASA, en Caprini, en ARISCAT y en el cálculo de dosis.' },
    { t:'Sexo', ok:!!p.sexo,
      v:{ F:'Femenino', M:'Masculino', X:'X / No binario' }[p.sexo] || '',
      porque:'Cambia el peso ideal y con él las dosis del vademécum.' },
    { t:'Peso', ok:!!Number(p.peso), v: p.peso ? p.peso+' kg' : '',
      porque:'Sin peso el vademécum no propone ninguna dosis.' },
    { t:'Talla', ok:!!Number(p.talla), v: p.talla ? p.talla+' cm' : '',
      porque:'Sin talla no hay IMC ni peso ideal.' },
    { t:'Correo electrónico', ok:!!p.email, v:p.email || '',
      porque:'Es por donde se le entrega la valoración y el consentimiento.' }
  ];
}

function htmlHistoriaEnValoracion(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const h = p.habitos || {};
  const ant = p.antecedentes || [];
  const meds = p.medicacion || [];
  const ale = (p.alergias || []).filter(x => x !== 'Sin alergias conocidas');
  const sinAle = (p.alergias || []).indexOf('Sin alergias conocidas') >= 0;

  /* ------------------------------ filiatorios ------------------------- */
  const fil = filiatoriosDeValoracion(p);
  const faltan = fil.filter(x => !x.ok);

  const filaFil = x =>
    '<div class="it'+(x.ok ? '' : ' falta')+'">'+
      '<span class="ic '+(x.ok?'si':'no')+'">'+(x.ok?'✓':'!')+'</span>'+
      '<span class="t">'+esc(x.t)+'</span>'+
      (x.ok
        ? '<span class="v">'+esc(x.v)+'</span>'
        : '<span class="v falta">Falta'+(x.porque ? ' — '+esc(x.porque) : '')+'</span>')+
    '</div>';

  /* ------------------------------ clinico ----------------------------- */
  /* `ok` es «hay una respuesta», no «hay hallazgos»: declarar que no tiene
     antecedentes es una respuesta y cuenta como cargado. */
  const fila = (t, ok, cont, vacio) =>
    '<div class="par'+(ok ? '' : ' vacio')+'">'+
      '<span class="k">'+(ok ? '<span class="ic si">✓</span>' : '<span class="ic ne">?</span>')+
        esc(t)+'</span>'+
      '<span class="v">'+(ok ? cont : '<i class="sin-cargar">'+esc(vacio)+'</i>')+'</span></div>';
  const chips = l => l.map(x => '<span class="tag">'+esc(x)+'</span>').join(' ');

  const habitos = [
    h.tabaco  ? 'Tabaco: '+h.tabaco+(h.tabacoCant ? ' ('+h.tabacoCant+' paq/año)' : '') : '',
    h.alcohol ? 'Alcohol: '+h.alcohol : '',
    h.drogas  ? 'Sustancias: '+h.drogas : '',
    h.actividad ? 'Actividad: '+h.actividad : ''
  ].filter(Boolean);

  const anesFam = (p.antAnestesicos||[]).concat(p.antFamiliares||[]);
  const quir = (p.antQuirurgicos||[]).map(q => (q.n || q) + (q.anio ? ' (' + q.anio + ')' : ''));

  return ''+
  '<div class="card plano historia-val" id="histVal"><h3>'+ico('pacientes')+'Historia de '+
    esc((p.apellido||'') + (p.nombre ? ', '+p.nombre : '') || 'el paciente')+
    '<span class="tag '+(faltan.length?'danger':'ok')+'" style="margin-left:auto">'+
      (faltan.length
        ? faltan.length+' dato'+(faltan.length===1?'':'s')+' filiatorio'+
          (faltan.length===1?'':'s')+' sin cargar'
        : 'Datos filiatorios cargados')+'</span></h3>'+

    '<div class="ayuda">Esto se carga una sola vez, en la historia del paciente, y se '+
      'hereda en cada ficha. La valoración ya no lo vuelve a preguntar.</div>'+

    /* -------- filiatorios: rojo lo que falta, verde lo que está -------- */
    (faltan.length
      ? '<div class="aviso danger mt8">'+ico('alerta')+'<div><b>Faltan datos de filiación que la '+
        'valoración necesita.</b> No traban el guardado, pero sin ellos el vademécum no propone '+
        'dosis, las escalas quedan a medias y no hay a dónde mandarle la documentación.</div></div>'
      : '<div class="aviso ok mt8">'+ico('check')+'<div><b>Datos filiatorios completos.</b> '+
        'Está todo lo que la valoración necesita de la filiación.</div></div>')+
    '<div class="items fil-items">'+ fil.map(filaFil).join('') +'</div>'+

    /* --------------------------- lo clínico --------------------------- */
    '<label class="mini strong mt14" style="display:block">Antecedentes, medicación y alergias</label>'+
    '<div class="hist-lista mt8">'+
      fila('Antecedentes', !!(ant.length || p.sinAntecedentes),
           ant.length ? chips(ant.map(a => a.n || a))
                      : '<span class="tag ok">Sin antecedentes relevantes</span>',
           'Sin cargar: nadie preguntó todavía')+
      fila('Anestésicos y familiares', !!anesFam.length, chips(anesFam), 'Sin cargar')+
      /* Los quirúrgicos se guardan como {n, anio}, no como texto suelto:
         el año importa —una cirugía cardíaca de hace un mes no es lo mismo
         que una de hace veinte años— y por eso tiene campo propio. */
      fila('Quirúrgicos', !!quir.length, chips(quir), 'Sin cargar')+
      fila('Medicación habitual', !!meds.length,
           chips(meds.map(m => m.n + (m.dosis ? ' '+m.dosis : ''))),
           'Sin medicación cargada')+
      fila('Alergias', !!(ale.length || sinAle),
           ale.length ? '<span class="tag danger">'+esc(ale.join(' · '))+'</span>'
                      : '<span class="tag ok">Sin alergias conocidas</span>',
           'Sin cargar: sin preguntar por alergias no se puede concluir')+
      fila('Hábitos', !!habitos.length, esc(habitos.join(' · ')), 'Sin cargar')+
    '</div>'+

    '<button type="button" class="btn '+(faltan.length ? 'warn' : 'ghost')+' chico mt14" '+
      'id="valEditarHistoria">'+ico('editar')+
      (faltan.length ? ' Completar la historia del paciente' : ' Editar la historia del paciente')+
    '</button>'+
  '</div>';
}

/* Repinta solo la tarjeta de la historia, sin rehacer la valoracion entera:
   se llama despues de aplicar una plantilla que escribio en la historia. */
function pintarHistoriaEnValoracion(){
  const c = $('#histVal');
  if(!c || !fichaActual) return;
  const nuevo = document.createElement('div');
  nuevo.innerHTML = htmlHistoriaEnValoracion(fichaActual);
  c.innerHTML = nuevo.firstElementChild.innerHTML;
  if($('#valEditarHistoria')) $('#valEditarHistoria').onclick = () => {
    guardarPasoActual();
    editarPaciente(fichaActual.pacienteId, () => pintarFicha());
  };
}

/* =========================================================================
   EL PANEL DE CONDUCTA PERIOPERATORIA
   -------------------------------------------------------------------------
   Lo calcula periop.js. Aca solo se dibuja: primero lo que no se puede pasar
   por alto, despues las esperas del neuroeje si la tecnica lo pide, y al
   final el calendario repartido en los cuatro cajones.
   ========================================================================= */
function pintarConductaPeriop(){
  const cont = $('#periopPanel');
  if(!cont || !fichaActual) return;
  const f = fichaActual;
  const c = conductaPerioperatoria(f);
  const v = f.v || {};

  const fechaBox =
    '<div class="campo"><label>Fecha prevista de la cirugía <span class="mini" '+
      'style="font-weight:400;opacity:.75">(opcional)</span></label>'+
      '<input type="date" id="periopFecha" value="'+esc(v.fechaPrevistaCx || '')+'">'+
      '<div class="ayuda">Sólo sirve para poner fechas al calendario de suspensiones que se le '+
        'entrega al paciente. No es la fecha del acto: ésa se carga el día de la cirugía en el '+
        'paso <b>Anestesia</b>.</div></div>';

  if(!c.total){
    cont.innerHTML = fechaBox +
      '<div class="aviso info">'+ico('info')+'<div><b>Sin medicación habitual cargada.</b> '+
      'Si el paciente toma algo, cargalo en la historia del paciente y la conducta '+
      'perioperatoria se arma sola.</div></div>';
    cablearConductaPeriop();
    return;
  }

  const cuando = it => it.fecha
    ? 'Sin tomarlo desde el <b>'+fFecha(it.fecha)+'</b>'
    : (typeof it.dias === 'number' && it.dias > 0
        ? 'Suspender <b>'+it.dias+' día'+(it.dias===1?'':'s')+'</b> antes de la cirugía'
        : 'Anticipación a definir');

  const grupo = (titulo, icono, clase, lista, pie) => lista.length
    ? '<div class="periop-grupo '+clase+'"><h4>'+ico(icono)+esc(titulo)+
        '<span class="tag">'+lista.length+'</span></h4>'+
        lista.map(it =>
          '<div class="periop-item">'+
            '<div class="periop-n"><b>'+esc(it.n)+'</b>'+
              (it.dosis ? '<span class="mini"> · '+esc(it.dosis)+'</span>' : '')+'</div>'+
            (pie ? '<div class="periop-cuando">'+pie(it)+'</div>' : '')+
            (it.nota ? '<div class="periop-nota">'+esc(it.nota)+'</div>' : '')+
            (it.reinicio ? '<div class="mini periop-reinicio">'+ico('atras')+
              ' Reinicio: '+esc(it.reinicio)+'</div>' : '')+
          '</div>').join('')+
      '</div>'
    : '';

  cont.innerHTML =
    fechaBox +

    (c.alertas.length
      ? '<div class="aviso danger">'+ico('alerta')+'<div><b>Lo que no se puede pasar por alto</b>'+
          '<ul class="periop-alertas">'+ c.alertas.map(a =>
            '<li><b>'+esc(a.n)+'.</b> '+esc(a.txt)+'</li>').join('') +'</ul></div></div>'
      : '')+

    (c.neuroaxial && c.esperas.length
      ? '<div class="aviso warn">'+ico('vena')+'<div><b>El plan incluye una técnica neuroaxial o un '+
          'bloqueo profundo.</b> Esperas mínimas desde la última dosis (ASRA, 4.ª ed.):'+
          '<ul class="periop-alertas">'+ c.esperas.map(e =>
            '<li><b>'+esc(e.n)+':</b> '+esc(textoEspera(e.horas))+'</li>').join('') +'</ul>'+
          'Si la espera no se puede cumplir, la indicación es cambiar de técnica, no acortarla.'+
          '</div></div>'
      : '')+

    (c.conFecha
      ? '<div class="aviso ok">'+ico('calendario')+'<div>Calendario calculado sobre el <b>'+
          fFecha(c.fechaCx)+'</b>.</div></div>'
      : '<div class="aviso info">'+ico('calendario')+'<div>Sin fecha de cirugía: la conducta se '+
          'expresa en <b>días de anticipación</b>. Cargá la fecha prevista arriba y se convierte '+
          'en fechas.</div></div>')+

    grupo('Suspender antes de la cirugía','alerta','danger', c.suspender, cuando)+
    grupo('Omitir sólo la dosis de la mañana','reloj','warn', c.omitir,
          () => 'No toma la dosis del día de la cirugía; el resto sigue igual')+
    grupo('Continuar, incluida la mañana de la cirugía','check','ok', c.continuar,
          () => 'Con un sorbo de agua, sin romper el ayuno')+
    grupo('A definir por el anestesiólogo','info','warn', c.evaluar, cuando)+

    '<div class="btn-row mt14">'+
      '<button type="button" class="btn ghost" id="periopAIndic">'+ico('lista')+
        ' Pasar a las indicaciones del paciente</button>'+
    '</div>'+
    '<div class="ayuda">La conducta de cada fármaco se cambia en la historia del paciente, en la '+
      'solapa <b>Medicación</b>. Lo que se ve acá es lo que dicen las guías, con las fechas ya '+
      'hechas: la decisión sigue siendo del anestesiólogo.</div>';

  cablearConductaPeriop();
}

function cablearConductaPeriop(){
  const fe = $('#periopFecha');
  if(fe) fe.onchange = () => {
    fichaActual.v = fichaActual.v || {};
    fichaActual.v.fechaPrevistaCx = fe.value;
    pintarConductaPeriop();
  };
  const b = $('#periopAIndic');
  if(b) b.onclick = () => {
    const l = conductaEnTextoPaciente(fichaActual);
    if(!l.length) return toast('No hay conducta para pasar.', 'warn');
    const campo = $('#plIndicaciones');
    const txt = l.join('\n');
    if(campo){
      campo.value = campo.value ? (campo.value.replace(/\s+$/,'') + '\n' + txt) : txt;
      campo.dispatchEvent(new Event('input'));
      const acc = campo.closest('details'); if(acc) acc.open = true;
      campo.scrollIntoView({ behavior:'smooth', block:'center' });
      toast(l.length+' indicación'+(l.length===1?'':'es')+' agregada'+(l.length===1?'':'s')+
            ' al punto 9. Revisalas antes de guardar.', 'ok');
    } else {
      fichaActual.plan = fichaActual.plan || {};
      fichaActual.plan.indicaciones =
        (fichaActual.plan.indicaciones ? fichaActual.plan.indicaciones + '\n' : '') + txt;
      toast('Indicaciones agregadas al plan.', 'ok');
    }
  };
}

/* =================================================== HTML de la seccion */
function htmlValoracion(f){
  const v = f.v || {};
  const p = DB.pacientes[f.pacienteId] || {};
  const ed = edadDe(p.fechaNac, f.fecha);

  return ''+
  /* Si se declaro que el acto arranco sin valoracion, la deuda se cobra aca:
     es el paso donde se salda. Desaparece sola al llegar a verde. */
  htmlValoracionExterna(f)+
  htmlValoracionExpres(f)+

  /* -------- La historia del paciente, de lectura -------- */
  htmlHistoriaEnValoracion(f)+

  /* -------- 1. Conducta perioperatoria -------- */
  acc('acPeriop','jeringa','1 · Conducta perioperatoria de la medicación habitual',
    '<div id="periopPanel"></div>', true)+

  /* -------- 2. Examen físico -------- */
  acc('acExamen','corazon','2 · Examen físico y semiología',
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

  /* -------- 3. Vía aérea -------- */
  acc('acVA','aire','3 · Evaluación de la vía aérea',
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

  /* -------- 4. Laboratorio y estudios -------- */
  acc('acLab','gota','4 · Laboratorio y estudios complementarios',
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

  /* -------- 5. Escalas de riesgo -------- */
  acc('acScores','stats','5 · Estratificación del riesgo',
    '<div class="card plano" style="border:1.5px solid var(--borde)"><h3>'+ico('escudo')+'ASA Physical Status</h3>'+
      '<div class="campo"><select id="scAsa">'+
        '<option value="">— Seleccionar —</option>'+
        ASA_PS.map(a => '<option value="'+a.v+'"'+((v.scores||{}).asa===a.v?' selected':'')+'>ASA '+a.v+' — '+esc(a.t)+'</option>').join('')+
      '</select></div>'+
      '<label class="chk'+((v.scores||{}).asaE?' sel':'')+'" id="scAsaEL"><input type="checkbox" id="scAsaE"'+
        ((v.scores||{}).asaE?' checked':'')+'>Modificador E — procedimiento de emergencia</label>'+
      '<div id="scAsaDesc" class="mini mt8"></div></div>'+

    /* Capacidad funcional y fragilidad estaban en «Hábitos y estilo de vida»,
       que se fue entero a la historia del paciente porque ahi se cargaba dos
       veces. Estas dos no: no son un habito, son dos escalas de riesgo, y
       este es su lugar. Alimentan el RCRI, el ARISCAT y la conclusion. */
    '<div class="card plano" style="border:1.5px solid var(--borde)"><h3>'+ico('corazon')+
      'Capacidad funcional y fragilidad</h3>'+
      '<div class="campo"><label>Capacidad funcional (MET)</label>'+
        '<select id="mets">'+MET_OPCIONES.map(m =>
          '<option value="'+m.v+'"'+(String((v.scores||{}).mets)===String(m.v)?' selected':'')+'>'+
          m.v+' MET — '+esc(m.t)+'</option>').join('')+'</select></div>'+
      '<div id="metsOut"></div>'+
      '<div class="campo"><label>Escala clínica de fragilidad (Rockwood)</label>'+
        '<select id="fragilidad"><option value="">No evaluada</option>'+
        FRAGILIDAD.map(fr => '<option value="'+fr[0]+'"'+(String((v.scores||{}).fragilidad)===String(fr[0])?' selected':'')+'>'+
          fr[0]+' — '+esc(fr[1])+'</option>').join('')+'</select>'+
        '<div class="ayuda">Rockwood ≥ 5 predice complicaciones, estadía prolongada y mortalidad '+
        'mejor que la edad sola.</div></div></div>'+

    /* Las cinco escalas muestran el RESULTADO arriba y esconden sus ítems
       detrás de «Revisar los ítems». Eran cincuenta y tres casillas siempre a
       la vista, y casi todas repiten algo que ya está cargado en la historia del
       paciente y en los puntos 2, 3 y 4: el autocompletado de arriba las marca solo. Los ítems
       siguen estando —y en el DOM, así que se guardan igual—: se abren cuando
       hay que corregir uno. */
    tarjetaEscala('corazon','RCRI — índice de riesgo cardíaco revisado (Lee)','rcriOut',
      RCRI_ITEMS.map((it,i) => '<label class="chk mb8" style="display:flex;width:100%;margin-bottom:6px">'+
        '<input type="checkbox" id="rcri'+i+'"'+(((v.scores||{}).rcri||[]).indexOf(i)>=0?' checked':'')+'>'+esc(it.t)+'</label>').join(''),
      RCRI_ITEMS.length)+

    tarjetaEscala('pulmon','ARISCAT — riesgo de complicaciones pulmonares','ariscatOut',
      '<div class="grid c2">'+
        campoSel('arIncision','Incisión quirúrgica',
          [{v:'periferica',t:'Periférica'},{v:'alta',t:'Abdominal alta'},{v:'toracica',t:'Torácica'}], (v.scores||{}).arIncision)+
        campoNum('arDuracion','Duración prevista (min)', (v.scores||{}).arDuracion)+
      '</div>'+
      '<label class="chk mb8" style="display:flex;width:100%;margin-bottom:6px"><input type="checkbox" id="arInf"'+
        ((v.scores||{}).arInf?' checked':'')+'>Infección respiratoria en el último mes</label>', 3)+

    tarjetaEscala('aire','STOP-BANG — apnea obstructiva del sueño','sbOut',
      STOPBANG_ITEMS.map(it => '<label class="chk mb8" style="display:flex;width:100%;margin-bottom:6px">'+
        '<input type="checkbox" id="sb_'+it.k+'"'+(((v.scores||{}).stopbang||{})[it.k]?' checked':'')+'>'+esc(it.t)+'</label>').join(''),
      STOPBANG_ITEMS.length)+

    tarjetaEscala('estomago','Apfel — náuseas y vómitos postoperatorios','apOut',
      APFEL_ITEMS.map(it => '<label class="chk mb8" style="display:flex;width:100%;margin-bottom:6px">'+
        '<input type="checkbox" id="ap_'+it.k+'"'+(((v.scores||{}).apfel||{})[it.k]?' checked':'')+'>'+esc(it.t)+'</label>').join(''),
      APFEL_ITEMS.length)+

    tarjetaEscala('vena','Caprini — riesgo de tromboembolismo venoso','capOut',
      '<div class="chks">'+CAPRINI_ITEMS.map((it,i) =>
        '<label class="chk'+(((v.scores||{}).caprini||[]).indexOf(i)>=0?' sel':'')+'">'+
        '<input type="checkbox" class="cap" data-i="'+i+'"'+(((v.scores||{}).caprini||[]).indexOf(i)>=0?' checked':'')+'>'+
        esc(it.t)+' <b style="opacity:.6">('+it.p+')</b></label>').join('')+'</div>',
      CAPRINI_ITEMS.length))+

  /* -------- 6. Ayuno -------- */
  acc('acAyuno','reloj','6 · Ayuno preoperatorio y profilaxis de aspiración',
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

  /* -------- 7. Conclusión -------- */
  acc('acConclusion','check','7 · Conclusión y aptitud anestésica',
    '<div id="resumenRiesgo"></div>'+
    '<div class="campo"><label>Aptitud para el acto anestésico</label>'+
      '<div class="seg" id="segAptitud">'+
        [['apto','Apto'],['reservas','Apto con reservas'],['optimizar','Requiere optimización'],['noapto','No apto']]
          .map(a => '<button type="button" data-v="'+a[0]+'"'+
            (((v.riesgo||{}).aptitud||'apto')===a[0]?' class="on"':'')+'>'+a[1]+'</button>').join('')+
      '</div></div>'+
    campoArea('rgFundamento','Fundamentación y recomendaciones', (v.riesgo||{}).fundamento,
      'Riesgo global, optimizaciones necesarias, interconsultas, condiciones para operar')+
    /* El campo que más tiempo llevaba y el único enteramente derivable: la
       fundamentación es el resumen de lo que ya está cargado arriba. Se
       redacta con un botón y queda editable; si ya hay texto escrito no se
       pisa, se pregunta. */
    '<div class="btn-row" style="margin-top:-6px;margin-bottom:12px">'+
      '<button type="button" class="btn ghost chico" id="rgRedactar">'+ico('valoracion')+
        ' Redactar con lo cargado</button>'+
      '<span class="mini" style="align-self:center;opacity:.8">Resume antecedentes, escalas, '+
        'laboratorio y plan. Después lo corregís.</span>'+
    '</div>'+
    campoArea('rgInterconsultas','Interconsultas solicitadas', (v.riesgo||{}).interconsultas,
      'Cardiología, neumonología, hematología, endocrinología…')+
    '<div class="grid c2">'+
      campoFecha('rgFechaEval','Fecha de la evaluación', (v.riesgo||{}).fecha || hoyISO())+
      campoSel('rgAmbito','Ámbito de la evaluación',
        ['Consultorio de preanestesia','Sala de internación','Antecámara de quirófano','Guardia / urgencia','Telemedicina'], (v.riesgo||{}).ambito)+
    '</div>')+

  /* -------- 12, 13 y 14. Plan, profilaxis y actuante -------- */
  htmlPlan(f)+

  htmlEnvioValoracion(f);
}

/* =========================================================================
   PLAN ANESTESICO PROPUESTO
   Es la segunda mitad del paso 2: lo que se piensa hacer, antes de hacerlo.
   ========================================================================= */
function htmlPlan(f){
  const pl = f.plan || {};
  return ''+
  acc('acPlan','jeringa','8 · Plan anestésico propuesto',
    '<label class="mini strong">Técnica</label>'+
    chksHTML('plTecnica', TECNICAS_ANESTESICAS, pl.tecnica)+
    '<label class="mini strong mt14" style="display:block">Manejo de la vía aérea</label>'+
    chksHTML('plVA', DISPOSITIVOS_VA, pl.dispositivosVA)+
    '<label class="mini strong mt14" style="display:block">Monitoreo estándar ASA</label>'+
    chksHTML('plMonEst', MONITOREO_ESTANDAR, pl.monitoreoEstandar || MONITOREO_ESTANDAR.slice(0,5))+
    '<label class="mini strong mt14" style="display:block">Monitoreo avanzado</label>'+
    chksHTML('plMonAv', MONITOREO_AVANZADO, pl.monitoreoAvanzado)+
    campoTxt('plAccesos','Accesos vasculares previstos', pl.accesos))+

  acc('acProfilaxis','escudo','9 · Profilaxis, analgesia y destino',
    '<div class="campo"><label>Profilaxis antibiótica</label><select id="plATB">'+
      '<option value="">— No indicada —</option>'+
      PROFILAXIS_ATB.map(a => '<option value="'+esc(a.c)+'"'+(pl.atb===a.c?' selected':'')+'>'+
        esc(a.c)+' — '+esc(a.d)+'</option>').join('')+
      '<option value="Otro"'+(pl.atb==='Otro'?' selected':'')+'>Otro (detallar)</option>'+
    '</select><div class="ayuda">Administrar dentro de los 60 minutos previos a la incisión (120 min para vancomicina).</div></div>'+
    campoTxt('plATBOtro','Detalle del antibiótico', pl.atbOtro)+
    campoSel('plTEV','Tromboprofilaxis',
      ['Deambulación precoz','Compresión neumática intermitente','Enoxaparina 40 mg/día',
       'Enoxaparina 30 mg c/12 h','HNF 5000 U c/8-12 h','Anticoagulante oral directo',
       'Mecánica + farmacológica','No indicada'], pl.tev)+
    '<label class="mini strong mt14" style="display:block">Profilaxis de náuseas y vómitos</label>'+
    chksHTML('plNVPO', ['Ondansetrón 4 mg','Dexametasona 4-8 mg','Droperidol 0,625-1,25 mg',
      'Metoclopramida 10 mg','Dimenhidrinato','TIVA con propofol','Aprepitant'], pl.nvpo)+
    /* La analgesia postoperatoria se MUDO al paso Recuperacion, despues del
       destino. Ver htmlPasoRecuperacion() en ui-ficha.js.

       El motivo es el momento: lo que se indica al egreso de la URPA no es lo
       que se penso el dia de la consulta prequirurgica. Entre una cosa y la
       otra pasaron la cirugia entera, el sangrado real, el bloqueo que
       funciono o no y el EVA que el paciente tiene delante. Preguntarlo aca
       obligaba a decidirlo a ciegas y despues nadie volvia a corregirlo.

       Lo que queda en el punto 9 es lo que SI se decide antes: profilaxis
       antibiotica, tromboprofilaxis, profilaxis de nauseas y vomitos,
       destino previsto y prevision transfusional. */
    '<div class="aviso info">'+ico('info')+'<div><b>La analgesia postoperatoria se indica en el paso '+
      '<b>Recuperación</b>, después del destino.</b><br>Es donde corresponde: lo que se indica al '+
      'egreso depende de cómo salió la cirugía, de si el bloqueo funcionó y del dolor que el '+
      'paciente tiene delante, no de lo que se pensó semanas antes.'+
      ((f.plan||{}).analgesia && (f.plan||{}).analgesia.length
        ? '<br><span class="mini">Esta ficha tiene un esquema cargado de antes: aparece propuesto '+
          'en Recuperación para confirmarlo o cambiarlo.</span>' : '')+
      '</div></div>'+
    '<div class="grid c2">'+
      campoSel('plDestino','Destino postoperatorio previsto', [''].concat(DESTINOS_POP), pl.destino)+
      campoSel('plTransfusion','Previsión transfusional',
        ['No prevista','Grupo y factor solicitados','Reserva de 2 unidades','Reserva de 4 unidades',
         'Protocolo de transfusión masiva','Paciente que rechaza transfusión'], pl.transfusion)+
    '</div>'+
    campoArea('plIndicaciones','Indicaciones preoperatorias al paciente', pl.indicaciones,
      'Ayuno, medicación a suspender y a continuar, higiene, acompañante, horario de presentación')+
    campoArea('plObs','Observaciones del plan', pl.observaciones))+

  /* --------------------------------------------------------------------
     14. Anestesiologo que realiza el acto.
     Estaba en el paso 1, junto a los datos del paciente, y ahi no
     correspondia: quien va a anestesiar se define cuando ya se sabe que
     anestesia hace falta, es decir al final de la valoracion. De esta
     designacion dependen dos cosas: a quien le llega el recordatorio de la
     cirugia y a nombre de quien se factura el acto (la consulta
     prequirurgica sigue siendo de quien firma esta valoracion).
     -------------------------------------------------------------------- */
  acc('acActuante','jeringa','10 · Anestesiólogo que realiza el acto anestésico',
    /* ---------------------------------------------------------------------
       POR QUE «TODAVIA NO SE SABE» VA PRIMERO Y VIENE ELEGIDO DE FABRICA

       Estaba ultimo y sin marcar. Un desplegable sin ninguna opcion
       seleccionada muestra la primera, asi que toda valoracion nueva se
       guardaba con el acto designado al primer socio de la lista por orden
       alfabetico, sin que nadie lo hubiera elegido. Y una ficha con acto
       designado NO es un acto libre: actoLibre() en core.js pide que
       asignadoUid este vacio o en «sinasignar». Resultado: las valoraciones
       nunca aparecian en Fichas → Disponibles, que es exactamente la lista
       donde tienen que estar para que un colega pueda tomar el acto.

       Ahora la opcion honesta -todavia no se sabe- es la primera y la que
       viene marcada mientras nadie diga otra cosa. Designar a alguien pasa a
       ser un acto deliberado, que es lo que era en la realidad.
       --------------------------------------------------------------------- */
    '<div class="campo"><label>Profesional designado</label><select id="qxAsignado">'+
      '<option value="sinasignar"'+
        ((!f.actorExterno && !actorFicha(f)) || f.asignadoUid === 'sinasignar' ? ' selected' : '')+'>'+
        '— Todavía no se sabe quién opera —</option>'+
      socios().map(u => '<option value="'+esc(u.uid)+'"'+
        (!f.actorExterno && actorFicha(f) === u.uid ? ' selected' : '')+'>'+
        esc(u.apellido+', '+u.nombre)+(u.uid === f.ownerUid ? ' — hizo la valoración' : '')+
        '</option>').join('')+
      '<option value="externo"'+(f.actorExterno ? ' selected' : '')+'>'+
        '— Otro anestesiólogo, no registrado en la app —</option>'+
    '</select>'+
    '<div class="ayuda">Si lo dejás en <b>«todavía no se sabe quién opera»</b>, la ficha aparece '+
      'en <b>Fichas → Disponibles</b> de todos los socios en cuanto guardes la valoración, y el '+
      'que haga el acto la toma desde ahí. Si designás a alguien, sale de esa lista y le llega '+
      'sólo a esa persona.<br>'+
      'La valoración prequirúrgica se factura como consulta a nombre de '+
      esc(autorFicha(f))+'. El acto anestésico lo factura quien opera.</div></div>'+

    '<div class="campo'+(f.actorExterno ? '' : ' oculto')+'" id="qxExternoBox">'+
      '<label>Nombre del anestesiólogo externo</label>'+
      '<input type="text" id="qxActorExterno" value="'+esc(f.actorExterno||'')+'" '+
        'placeholder="Apellido, nombre y matrícula">'+
      '<div class="ayuda">Queda registrado en el documento. Como no tiene usuario en la app, '+
        'el honorario del acto no entra en la facturación de nadie.</div></div>'+

    '<div id="qxAsignadoAviso"></div>', true)+

  htmlConsentimiento(f);
}

/* =========================================================================
   15. CONSENTIMIENTO INFORMADO ANESTESICO
   -------------------------------------------------------------------------
   Estaba en una ventana aparte, a la que se llegaba por un boton perdido al
   pie de la ficha. Ahi se olvidaba: quedaban valoraciones completas y bien
   hechas sin el papel que la ley exige. Ahora es el punto 11 de la propia
   valoracion y es CONDICION para darla por concluida (ver
   consentimientoCompleto() en ui-ficha.js): la Ley 26.529 lo pide por
   escrito para todo procedimiento con riesgo relevante, y la anestesia lo
   es. Las dos unicas salidas legitimas —urgencia vital del art. 9 y
   revocacion del paciente— se eligen en el mismo desplegable y quedan
   asentadas, que es exactamente lo que la ley manda hacer con ellas.

   Se firma con el dedo en la tablet, con el mouse en la computadora o con el
   dedo en el telefono, sobre el mismo lienzo. El anestesiologo, ademas,
   puede traer la firma que tiene guardada en su perfil o subir una imagen.
   ========================================================================= */
function htmlConsentimiento(f, abierto){
  const c = f.consent || {};
  const p = DB.pacientes[f.pacienteId] || {};
  const completo = consentimientoCompleto(f);
  const sinFirma = consentSinFirma(c.quien);

  return acc('acConsent','firma','11 · Consentimiento informado anestésico',
    (completo
      ? '<div class="aviso ok">'+ico('check')+'<div><b>Consentimiento otorgado.</b> '+
        (sinFirma
          ? esc(c.quien)+'. Queda documentado en la historia clínica, como exige la ley.'
          : 'Firmado por '+esc(c.firmante || 'el paciente')+
            (c.fecha ? ' el '+fFechaLarga(c.fecha)+(c.hora ? ' a las '+esc(c.hora)+' h' : '') : '')+'.')+
        '</div></div>'
      : '<div class="aviso warn">'+ico('alerta')+'<div><b>Sin el consentimiento no se puede '+
        'concluir la valoración.</b> Es un requisito de la Ley 26.529 para todo procedimiento '+
        'con riesgo relevante. Si el paciente no puede firmarlo, dejá asentado el motivo en '+
        '«Quién firma».</div></div>')+

    '<label class="mini strong mt14" style="display:block">Texto que se le lee y se le entrega al paciente</label>'+
    '<div class="consent-texto">'+esc(TEXTO_CONSENTIMIENTO)+'</div>'+
    '<div class="ayuda">Redactado sobre el modelo de consentimiento anestésico de la Asociación '+
      'de Anestesia, Analgesia y Reanimación de Buenos Aires y los formularios del Ministerio de '+
      'Salud de la Nación, conforme a las leyes 26.529, 26.742, 17.132 y 25.326, el decreto '+
      '1089/2012 y el art. 59 del Código Civil y Comercial. Se imprime completo en el documento '+
      'y viaja como PDF aparte en el envío al paciente.</div>'+

    '<div class="grid c2 mt14">'+
      '<div class="campo"><label>Quién firma <span class="req">*</span></label>'+
        '<select id="coQuien">'+ CONSENT_QUIEN.map(o =>
          '<option value="'+esc(o)+'"'+(c.quien===o?' selected':'')+'>'+
          esc(o || '— Seleccionar —')+'</option>').join('') +'</select></div>'+
      campoTxt('coFirmante','Nombre y DNI del firmante',
        c.firmante || (p.apellido ? p.apellido+', '+p.nombre+' — DNI '+(p.dni||'') : ''))+
    '</div>'+
    '<div id="coAvisoQuien"></div>'+

    '<label class="mini strong mt14" style="display:block">Declaraciones del paciente</label>'+
    chksHTML('coItems', CONSENT_ITEMS, c.items)+
    '<div id="coAvisoTransf"></div>'+

    '<div id="coFirmas"'+(sinFirma ? ' class="oculto"' : '')+'>'+
      '<label class="mini strong mt14" style="display:block">Firma del paciente o representante</label>'+
      '<div class="firma-box"><canvas id="coFirmaPac"></canvas><div class="hint">Firmar aquí con el dedo o el mouse</div></div>'+
      '<div class="btn-row mt8"><button type="button" class="btn ghost chico" id="coLimpiarPac">'+
        ico('borrar')+' Borrar</button></div>'+

      '<label class="mini strong mt14" style="display:block">Firma del anestesiólogo</label>'+
      '<div class="firma-box"><canvas id="coFirmaAnest"></canvas><div class="hint">Firmar aquí</div></div>'+
      '<div class="btn-row mt8">'+
        '<button type="button" class="btn ghost chico" id="coLimpiarAnest">'+ico('borrar')+' Borrar</button>'+
        '<button type="button" class="btn ghost chico" id="coUsarPerfil">'+ico('firma')+' Usar mi firma guardada</button>'+
        '<button type="button" class="btn ghost chico" id="coSubirFirma">'+ico('adjunto')+' Subir imagen de firma</button>'+
      '</div>'+
      '<div class="ayuda">La firma guardada es la que cargaste en <b>Mi perfil</b>. Si subís una '+
        'imagen, se guarda también en tu perfil para las próximas fichas.</div>'+
    '</div>'+

    campoArea('coObs','Aclaraciones', c.observaciones,
      'Lo que se conversó, quién estuvo presente, objeciones del paciente'),
    !completo || abierto);
}

/* ---- Lo que el punto 11 escribe en f.consent (no dentro de f.v) ---- */
let coFirmaPac = '', coFirmaAnest = '';

function leerConsentimiento(f){
  if(!$('#coQuien')) return f.consent || {};      /* el paso no está en pantalla */
  const previo = f.consent || {};
  const quien = val('coQuien');
  const hayAlgo = quien || coFirmaPac || coFirmaAnest || val('coObs');
  return {
    quien, firmante: val('coFirmante'), items: leerChks('coItems'),
    observaciones: val('coObs'),
    firmaPaciente: coFirmaPac, firmaAnestesiologo: coFirmaAnest,
    /* la fecha del consentimiento es la del dia en que se firmo, no la de
       cada vez que se vuelve a abrir la ficha */
    fecha: previo.fecha || (hayAlgo ? hoyISO() : ''),
    hora:  previo.hora  || (hayAlgo ? ahoraHora() : '')
  };
}

function cablearConsentimiento(f){
  if(!$('#coQuien')) return;
  const c = f.consent || {};
  coFirmaPac   = c.firmaPaciente || '';
  coFirmaAnest = c.firmaAnestesiologo || (USUARIO ? USUARIO.firmaDataUrl : '') || '';

  cablearChks('coItems');

  /* Aceptar y rechazar la transfusión a la vez es una contradicción que no
     puede quedar en un documento que se firma. */
  const revisarTransf = () => {
    const l = leerChks('coItems');
    const si = l.indexOf('Acepta transfusión de hemoderivados si fuera indispensable') >= 0;
    const no = l.indexOf('RECHAZA transfusión de hemoderivados') >= 0;
    $('#coAvisoTransf').innerHTML = (si && no)
      ? '<div class="aviso danger mt8">'+ico('alerta')+'<div><b>Se marcó aceptar y rechazar la '+
        'transfusión al mismo tiempo.</b> Dejá una sola: el documento no puede decir las dos cosas.</div></div>'
      : (no ? '<div class="aviso warn mt8">'+ico('alerta')+'<div><b>El paciente rechaza la '+
        'transfusión de hemoderivados.</b> Queda asentado en el consentimiento y se imprime '+
        'destacado en la ficha. Preveé las alternativas de ahorro de sangre en el punto 9.</div></div>' : '');
  };
  $$('#coItems input').forEach(i => i.addEventListener('change', revisarTransf));
  revisarTransf();

  const revisarQuien = () => {
    const q = $('#coQuien').value;
    const sin = consentSinFirma(q);
    $('#coFirmas').classList.toggle('oculto', sin);
    $('#coAvisoQuien').innerHTML = !q
      ? ''
      : q === 'No firmado — urgencia vital (art. 9 Ley 26.529)'
        ? '<div class="aviso warn mt8">'+ico('alerta')+'<div><b>Excepción del art. 9 de la Ley '+
          '26.529.</b> Se prescinde del consentimiento por grave peligro para la vida del '+
          'paciente. Dejá constancia del motivo en «Aclaraciones»: es lo que respalda la '+
          'excepción ante una auditoría.</div></div>'
      : q === 'Consentimiento revocado por el paciente'
        ? '<div class="aviso danger mt8">'+ico('alerta')+'<div><b>Consentimiento revocado.</b> '+
          'El paciente puede revocarlo en cualquier momento y sin expresar causa. Queda '+
          'documentado por escrito, como exige la ley, y <b>no se debe realizar el acto '+
          'anestésico</b>.</div></div>'
      : q.indexOf('Representante') >= 0 || q.indexOf('Menor') >= 0
        ? '<div class="aviso info mt8">'+ico('info')+'<div>Cargá en «Nombre y DNI del firmante» '+
          'los datos del representante y su vínculo con el paciente.</div></div>'
        : '';
  };
  $('#coQuien').onchange = revisarQuien;
  revisarQuien();

  const cp = montarFirma($('#coFirmaPac'),   d => coFirmaPac = d);
  const ca = montarFirma($('#coFirmaAnest'), d => coFirmaAnest = d);
  setTimeout(() => { if(coFirmaPac) cp.cargar(coFirmaPac); if(coFirmaAnest) ca.cargar(coFirmaAnest); }, 150);

  $('#coLimpiarPac').onclick   = () => { cp.limpiar(); coFirmaPac = ''; };
  $('#coLimpiarAnest').onclick = () => { ca.limpiar(); coFirmaAnest = ''; };
  $('#coUsarPerfil').onclick = () => {
    if(!USUARIO || !USUARIO.firmaDataUrl)
      return toast('No tenés firma guardada. Cargala en Mi perfil o subí una imagen.', 'err');
    ca.limpiar(); ca.cargar(USUARIO.firmaDataUrl); coFirmaAnest = USUARIO.firmaDataUrl;
  };
  /* La imagen que sube el profesional puede venir de la cámara y pesar
     megabytes. Se achica igual que la firma dibujada —360 px de ancho— antes
     de guardarla: si no, una sola firma subida pesaría más que toda la ficha. */
  $('#coSubirFirma').onclick = () => pedirArchivos('image/*', false, fs => {
    if(!fs || !fs.length) return;
    comprimirImagen(fs[0], FIRMA_ANCHO_MAX, 0.82).then(d => {
      ca.limpiar(); ca.cargar(d); coFirmaAnest = d;
      /* Se guarda en el perfil: la próxima vez alcanza con «Usar mi firma guardada» */
      if(USUARIO && SESION){
        const u = JSON.parse(JSON.stringify(USUARIO));
        u.firmaDataUrl = d;
        escribir('usuarios', SESION.uid, u);
        USUARIO = u;
        toast('Firma cargada y guardada en tu perfil ('+Math.round(d.length/1024)+' KB).', 'ok');
      }
    }).catch(e => toast('No se pudo procesar la imagen: '+e.message, 'err'));
  });
}

/* Lo que el punto 10 escribe en la raíz de la ficha (no dentro de f.plan) */
function leerAsignacionActo(){
  if(!$('#qxAsignado')) return {};       /* el paso no está en pantalla */
  const v = val('qxAsignado');
  const o = { actorExterno: v === 'externo' ? val('qxActorExterno') : '' };
  if(v) o.asignadoUid = v;
  return o;
}

function cablearAsignacionActo(){
  if(!$('#qxAsignado')) return;
  const avisar = () => {
    const v = $('#qxAsignado').value;
    $('#qxExternoBox').classList.toggle('oculto', v !== 'externo');
    const box = $('#qxAsignadoAviso');
    if(v === 'sinasignar')
      box.innerHTML = '<div class="aviso ok">'+ico('check')+'<div><b>La ficha va a figurar en '+
        '«Fichas → Disponibles» de todos los socios</b> en cuanto guardes la valoración. '+
        'Cualquiera va a poder abrirla y tomar el acto desde el botón <b>«Voy a realizar este '+
        'acto»</b>. Hasta entonces el recordatorio te llega sólo a vos.</div></div>';
    else if(v === 'externo')
      box.innerHTML = '<div class="aviso warn">'+ico('alerta')+'<div>El acto lo realiza alguien '+
        'sin usuario en la app: queda documentado en la ficha, pero <b>su honorario no se factura '+
        'acá</b>. Vos seguís facturando la consulta prequirúrgica.</div></div>';
    else if(v && SESION && v !== SESION.uid)
      box.innerHTML = '<div class="aviso ok">'+ico('check')+'<div><b>'+
        esc(nombreUsuario(v))+'</b> va a recibir el recordatorio de la cirugía y va a poder '+
        'completar el acto y cargar sus honorarios. La consulta prequirúrgica sigue siendo tuya.</div></div>';
    /* Designarse a uno mismo es una decision valida -y frecuente-, pero cierra
       la ficha para el resto. Se dice, porque es la diferencia entre que la
       ficha aparezca o no en el «Disponibles» de los demas. */
    else if(v && SESION && v === SESION.uid)
      box.innerHTML = '<div class="aviso info">'+ico('info')+'<div>El acto queda <b>a tu nombre</b>: '+
        'esta ficha <b>no</b> va a aparecer en «Disponibles» de tus colegas, porque ya tiene quién '+
        'la haga. Si todavía no se sabe quién opera, elegí <b>«todavía no se sabe quién opera»</b> '+
        'y queda libre para que la tome cualquier socio.</div></div>';
    else box.innerHTML = '';
  };
  $('#qxAsignado').onchange = avisar;
  avisar();
}

function leerPlan(){
  return {
    tecnica: leerChks('plTecnica'), dispositivosVA: leerChks('plVA'),
    monitoreoEstandar: leerChks('plMonEst'), monitoreoAvanzado: leerChks('plMonAv'),
    accesos: val('plAccesos'), atb: val('plATB'), atbOtro: val('plATBOtro'),
    tev: val('plTEV'), nvpo: leerChks('plNVPO'),
    /* La analgesia ya no se edita en el punto 9. Se conserva lo que tenga la
       ficha para no perder nada de lo cargado antes de la mudanza: el paso
       Recuperacion lo lee como propuesta. */
    analgesia: (fichaActual.plan || {}).analgesia || [],
    analgesiaDetalle: (fichaActual.plan || {}).analgesiaDetalle || '',
    destino: val('plDestino'), transfusion: val('plTransfusion'),
    indicaciones: val('plIndicaciones'), observaciones: val('plObs')
  };
}

/* ============================== Cableado ============================== */

/* Los antecedentes y la medicacion que valen para ESTA ficha. Siguen siendo
   una foto: la ficha guarda su propia copia -ver leerValoracion()- para que
   una valoracion firmada diga lo que decia el dia que se firmo, aunque la
   historia del paciente cambie despues. Lo que se fue es la pantalla para
   editarlos aca; la fuente es la historia. */
function antecedentesDeLaFicha(f){
  const v = (f && f.v) || {}, p = (f && DB.pacientes[f.pacienteId]) || {};
  return (v.antecedentes2 && v.antecedentes2.length)
    ? v.antecedentes2.slice()
    : (p.antecedentes || []).map(a => ({ n:a.n, sis:a.sis }));
}

/* =========================================================================
   LO QUE QUEDO ATRAPADO EN LAS FICHAS VIEJAS
   -------------------------------------------------------------------------
   En el modelo anterior los antecedentes se cargaban en la ficha, asi que hay
   fichas de hace meses con alergias, medicacion y habitos que su paciente no
   tiene en la historia. Con la valoracion nueva esos datos siguen guardados
   -no se pierde nada, salen en el PDF igual- pero no se ven en la tarjeta de
   historia ni alimentan la conducta perioperatoria, porque esas dos leen la
   historia del paciente.

   Asi que al abrir una valoracion se suben. Solo lo que FALTA: nunca pisa un
   dato de la historia, nunca borra. Es estrictamente aditivo, y es la misma
   afirmacion clinica que la ficha ya hacia sobre ese paciente, solo que
   guardada donde ahora corresponde.
   ========================================================================= */
function subirHistoriaDeFichaVieja(f){
  const p = DB.pacientes[f.pacienteId];
  const v = f.v || {};
  if(!p) return 0;
  let n = 0;

  (v.antecedentes2 || []).forEach(a => {
    const nom = a.n || a.d; if(!nom) return;
    p.antecedentes = p.antecedentes || [];
    if(p.antecedentes.some(x => (x.n || x) === nom)) return;
    p.antecedentes.push({ n:nom, sis: a.sis || 'Otros' }); n++;
  });

  (v.medicacion || []).forEach(m => {
    const nom = m.n || m; if(!nom) return;
    p.medicacion = p.medicacion || [];
    if(p.medicacion.some(x => x.n === nom)) return;
    p.medicacion.push(Object.assign({}, typeof m === 'string' ? { n:m } : m)); n++;
  });

  [['antAnestesicos','antAnestesicos'], ['alergias','alergias']]
    .forEach(([enFicha, enPaciente]) => {
      (v[enFicha] || []).forEach(x => {
        p[enPaciente] = p[enPaciente] || [];
        if(p[enPaciente].indexOf(x) < 0){ p[enPaciente].push(x); n++; }
      });
    });

  /* Los quirúrgicos van aparte porque en la historia son {n, anio} */
  (v.antQuirurgicos || []).forEach(q => {
    const nom = q.n || q; if(!nom) return;
    p.antQuirurgicos = p.antQuirurgicos || [];
    if(p.antQuirurgicos.some(x => (x.n || x) === nom)) return;
    p.antQuirurgicos.push({ n:nom, anio:(q && q.anio) || '' }); n++;
  });

  [['antecedentesOtros','antecedentesOtros'], ['medicacionOtros','medicacionOtros'],
   ['alergiaDetalle','alergiaDetalle'], ['antAnestDetalle','antAnestDetalle']]
    .forEach(([a,b]) => { if(v[a] && !p[b]){ p[b] = v[a]; n++; } });

  const hv = v.habitos || {};
  p.habitos = p.habitos || {};
  ['tabaco','tabacoCant','alcohol','drogas','actividad'].forEach(k => {
    if(hv[k] && !p.habitos[k]){ p.habitos[k] = hv[k]; n++; }
  });

  if(v.sinAntecedentes && !p.sinAntecedentes && !(p.antecedentes || []).length){
    p.sinAntecedentes = true; n++;
  }

  if(n){
    p.modificado = new Date().toISOString();
    p.modificadoPor = SESION ? SESION.uid : '-';
    escribir('pacientes', p.id, p);
    auditar('historia-migrada',
      n + ' dato(s) de la ficha ' + f.id + ' subidos a la historia de ' + p.id);
  }
  return n;
}

function cablearValoracion(f){
  cablearValoracionExterna(f);
  const v = f.v || {};
  const p = DB.pacientes[f.pacienteId] || {};

  /* Fichas del modelo viejo: lo que tenian cargado sube a la historia, que es
     donde la valoracion nueva lo lee. Ver el comentario de arriba. */
  const migrados = subirHistoriaDeFichaVieja(f);
  if(migrados) toast(migrados + ' dato' + (migrados===1?'':'s') + ' de esta ficha se '+
    'pasaron a la historia del paciente, que es donde se cargan ahora.', 'ok');

  /* La historia se lee, no se edita: el boton lleva a la solapa donde si se
     edita y, al volver, la valoracion se repinta con lo nuevo. */
  if($('#valEditarHistoria')) $('#valEditarHistoria').onclick = () => {
    guardarPasoActual();
    editarPaciente(f.pacienteId, () => pintarFicha());
  };

  pintarConductaPeriop();

  /* --- checkboxes con estilo --- */
  ['vaOtros','ayRiesgo','ayProfilaxis'].forEach(cablearChks);
  ['plTecnica','plVA','plMonEst','plMonAv','plNVPO'].forEach(cablearChks);
  $$('#vFicha .chk').forEach(l => {
    l.onclick = () => setTimeout(() => l.classList.toggle('sel', l.querySelector('input').checked), 0);
  });

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
    /* Las marcas salen del catálogo de patologías, no de adivinar por texto */
    const dxF = antecedentesDeLaFicha(f);
    const medF = medicacionDeLaFicha(f);
    const habF = (DB.pacientes[f.pacienteId] || {}).habitos || {};
    const fl = flagsDeAntecedentes(dxF);
    const cond = {
      anticoagulado: fl.anticoagulado ||
        medF.some(m => /anticoagul|warfar|rivarox|apix|dabig|edox|heparin/i.test(m.n+m.g)),
      renal: fl.renal || (!!val('labCrea') && Number(val('labCrea')) > 1.5),
      hta: !!fl.hta,
      diabetes: !!fl.diabetes,
      cardiopatia: rc.cardiopatia || rc.icc || !!fl.cardiopatia,
      arritmia: !!fl.arritmia,
      respiratorio: !!fl.respiratorio,
      tabaquismo: habF.tabaco === 'Fumador activo' || !!fl.tabaquismo,
      hepatopatia: !!fl.hepatopatia,
      sangrado: ar.nivel === 'alto' || !!fl.sangrado,
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

    /* La ficha recuerda si el paciente esta anticoagulado: lo usa el paso
       Recuperacion para avisar antes de indicar un bloqueo neuroaxial. */
    fichaActual.__anticoagulado = cond.anticoagulado;

    /* Y el cartel de faltantes de arriba y la tarjeta exprés, que miran esta
       misma pantalla y tienen que reflejar lo que se acaba de escribir. */
    if(typeof refrescarFaltantes === 'function') refrescarFaltantes();
    if(typeof pintarExpres === 'function') pintarExpres();
    if(window.__pintarAsaSug) window.__pintarAsaSug();
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

  cablearValoracionExpres(f);   /* tarjeta exprés, autocompletado y plantillas */
  cablearAsignacionActo();      /* punto 10 */
  cablearConsentimiento(f);     /* punto 11 */
  cablearEnvioValoracion(f);    /* envío de la valoración a contaduría */

  recalcular();
}

function nombreAnt(d){ return d.n || d.d || ''; }

/* pintarDx(), pintarMedsDeAntecedentes() y pintarMed() vivian aca y dibujaban
   los antecedentes y la medicacion dentro de la valoracion. Se fueron con los
   puntos 1 a 5: la unica pantalla que los edita es ahora la historia del
   paciente -pintarMedPaciente() en ui-pacientes.js-. Lo que quedo de este
   lado es de lectura y lo dibuja htmlHistoriaEnValoracion(). */

/* ============================ Lectura de datos ========================= */
/* =========================================================================
   POR QUE LA FICHA SIGUE GUARDANDO LOS ANTECEDENTES SI YA NO LOS PIDE

   Podria no guardarlos y leerlos siempre de la historia del paciente. Seria
   mas prolijo y estaria mal: una valoracion firmada es un documento con
   valor medico-legal y tiene que decir lo que decia el dia que se firmo. Si
   dentro de ocho meses al paciente le diagnostican una insuficiencia
   cardiaca, esa valoracion no puede pasar a decir retroactivamente que la
   tenia. Asi que se guarda una FOTO del momento -eso hacia antes tambien-,
   solo que ahora la foto se saca de la historia del paciente en vez de una
   pantalla que preguntaba lo mismo dos veces.

   La foto se refresca en cada guardado mientras la valoracion este abierta.
   Al cerrarla queda congelada, que es lo que se busca.
   ========================================================================= */
function leerValoracion(){
  const f = fichaActual || {};
  const p = DB.pacientes[f.pacienteId] || {};
  const dx = antecedentesDeLaFicha(f);
  const meds = (p.medicacion && p.medicacion.length)
    ? p.medicacion.map(m => Object.assign({}, m))
    : ((f.v || {}).medicacion || []);
  const h = p.habitos || {};

  /* La agrupación por sistemas se deriva de lo cargado, no se pide aparte */
  const antecedentes = {};
  dx.forEach(d => {
    const sis = d.sis || 'Otros';
    (antecedentes[sis] = antecedentes[sis] || []).push(nombreAnt(d));
  });
  const rcri = []; RCRI_ITEMS.forEach((it,i) => { if(chk('rcri'+i)) rcri.push(i); });
  const stopbang = {}; STOPBANG_ITEMS.forEach(it => stopbang[it.k] = chk('sb_'+it.k));
  const apfel = {}; APFEL_ITEMS.forEach(it => apfel[it.k] = chk('ap_'+it.k));
  const caprini = $$('.cap:checked').map(i => Number(i.dataset.i));
  const aptBtn = $('#segAptitud button.on');

  /* La historia del paciente manda, PERO SOLO SI TIENE ALGO QUE DECIR.
     Una ficha vieja guarda cosas que su paciente todavia no tiene cargadas
     -asi era el modelo anterior: se cargaba en la ficha-. Si se sobrescribiera
     con el vacio de la historia, volver a guardar una ficha de hace un ano le
     borraria las alergias. Nunca se pisa un dato con nada. */
  const previo = fichaActual && fichaActual.v ? fichaActual.v : {};
  const mandaLista = (deLaHistoria, deLaFicha) =>
    (deLaHistoria && deLaHistoria.length) ? deLaHistoria : (deLaFicha || []);
  const mandaTexto = (deLaHistoria, deLaFicha) => deLaHistoria || deLaFicha || '';

  const habPrevio = previo.habitos || {};
  const habitos = {};
  ['tabaco','tabacoCant','alcohol','drogas','actividad'].forEach(k => {
    habitos[k] = mandaTexto(h[k], habPrevio[k]);
  });

  return {
    /* --- foto de la historia del paciente, ver el comentario de arriba --- */
    antecedentes2: dx,
    sinAntecedentes: !!(p.sinAntecedentes || previo.sinAntecedentes),
    antecedentes,
    antecedentesOtros: mandaTexto(p.antecedentesOtros, previo.antecedentesOtros),
    antAnestesicos: mandaLista((p.antAnestesicos || []).concat(p.antFamiliares || []),
                               previo.antAnestesicos),
    antAnestDetalle: mandaTexto([p.antAnestDetalle, p.antFamDetalle].filter(Boolean).join(' — '),
                                previo.antAnestDetalle),
    antQuirurgicos: mandaLista(p.antQuirurgicos, previo.antQuirurgicos),
    medicacion: meds,
    medicacionOtros: mandaTexto(p.medicacionOtros, previo.medicacionOtros),
    alergias: mandaLista(p.alergias, previo.alergias),
    alergiaDetalle: mandaTexto(p.alergiaDetalle, previo.alergiaDetalle),
    habitos,
    /* --- fecha prevista sólo para el calendario de suspensiones (punto 1) --- */
    fechaPrevistaCx: ($('#periopFecha') ? val('periopFecha') : (f.v || {}).fechaPrevistaCx) || '',
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
