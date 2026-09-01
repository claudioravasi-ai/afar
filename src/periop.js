/* =========================================================================
   CONDUCTA PERIOPERATORIA DE LA MEDICACION HABITUAL
   -------------------------------------------------------------------------
   EL PROBLEMA QUE RESUELVE

   El paciente llega con siete comprimidos. El anestesiologo los carga uno por
   uno, lee siete notas de tres renglones cada una, y de esa lectura tiene que
   salir con una hoja de indicaciones que diga, en castellano, que deja de
   tomar y desde que dia. Esa traduccion -de la nota doctrinal al calendario
   del paciente- se hacia a mano cada vez, en la cabeza, y es exactamente
   donde se cometen los errores que despues suspenden la cirugia: el iSGLT2
   que nadie suspendio, la semaglutida que nadie pregunto, el clopidogrel que
   se suspendio sin llamar a cardiologia.

   Este archivo hace esa traduccion. Toma la medicacion cargada en la historia
   del paciente, la cruza con el vademecum perioperatorio de data-catalogos.js
   -que ahora trae los dias de anticipacion, las horas que pide ASRA para el
   neuroeje y las alertas que no se pueden pasar por alto- y devuelve la
   conducta ya resuelta y, si hay fecha de cirugia, con las fechas calculadas.

   LO QUE NO HACE, A PROPOSITO

   No decide. Propone. Cada conducta sigue siendo editable fármaco por fármaco
   en la historia del paciente, y la app no suspende nada sola: escribe lo que
   corresponde segun la guia y deja la firma del lado de la persona. Es la
   misma regla del vademecum anestesico y por el mismo motivo.

   Tampoco inventa la fecha de la cirugia. Cuando se hace la valoracion casi
   nunca se sabe -la cirugia se programa despues, ver htmlPasoPaciente()-, asi
   que el panel pide una FECHA PREVISTA opcional, que sirve solo para armar el
   calendario del paciente y no se confunde con la fecha real del acto, que se
   carga el dia de la cirugia en el paso Anestesia.
   ========================================================================= */

/* La fecha ISO que resulta de restarle n dias a otra. El mediodia evita que
   el cambio de huso horario corra la fecha un dia para atras. */
function fechaMenosDias(iso, n){
  if(!iso || typeof n !== 'number') return '';
  const d = new Date(String(iso).slice(0,10) + 'T12:00:00');
  if(isNaN(d)) return '';
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0,10);
}

function farmacoPeriop(nombre){
  return FARMACOS_PERIOP.find(x => x.n === nombre) || null;
}

/* Las tecnicas que obligan a respetar las esperas de ASRA. El neuroeje y los
   bloqueos profundos comparten criterio: un hematoma ahi no se comprime y no
   se drena a tiempo. */
function tecnicaNeuroaxial(f){
  const pl = (f && f.plan) || {};
  /* Si el plan esta en pantalla se lee de la pantalla, que es lo que el
     anestesiologo acaba de tildar y todavia no guardo. */
  const t = $('#plTecnica') ? leerChks('plTecnica') : (pl.tecnica || []);
  return (t.length ? t : (pl.tecnica || [])).some(x =>
    /raqu[ií]|peridur|epidur|neuroax|intradur|subaracn|caudal|paravertebral|cuadrado lumbar/i
      .test(String(x)));
}

/* La medicacion vigente de la ficha, ya fusionada con el vademecum.
   Fuente: la historia del paciente, que es donde se carga desde que la
   valoracion dejo de duplicar los antecedentes. Si la ficha guardo su propia
   copia -fichas viejas, o una conducta ajustada para esta cirugia- esa manda,
   porque es la decision que ya se tomo para este acto. */
function medicacionDeLaFicha(f){
  const v = (f && f.v) || {};
  const p = (f && DB.pacientes[f.pacienteId]) || {};
  const base = (v.medicacion && v.medicacion.length) ? v.medicacion : (p.medicacion || []);
  return base.map(m => {
    const cat = farmacoPeriop(m.n) || {};
    return {
      n: m.n, g: m.g || cat.g || 'Otros',
      dosis: m.dosis || '', porque: m.porque || '',
      accion: m.accion || cat.accion || 'evaluar',
      nota: m.nota || cat.nota || '',
      dias: (typeof cat.dias === 'number') ? cat.dias : null,
      neuro: (typeof cat.neuro === 'number') ? cat.neuro : null,
      reinicio: cat.reinicio || '',
      alerta: cat.alerta || ''
    };
  });
}

/* =========================================================================
   EL CALCULO
   Devuelve la conducta repartida en cuatro cajones, mas las alertas rojas y
   las esperas de ASRA. Cada item viaja con su fecha ya calculada cuando hay
   fecha de cirugia; si no la hay, viaja con los dias y el panel lo dice asi.
   ========================================================================= */
function conductaPerioperatoria(f){
  const v = (f && f.v) || {};
  const meds = medicacionDeLaFicha(f);
  const fechaCx = v.fechaPrevistaCx || fechaCirugiaDe(f) || '';
  const neuro = tecnicaNeuroaxial(f);

  const out = { fechaCx, conFecha: !!fechaCx, neuroaxial: neuro,
                suspender:[], omitir:[], continuar:[], evaluar:[],
                alertas:[], esperas:[], total: meds.length };

  meds.forEach(m => {
    const it = { n:m.n, g:m.g, dosis:m.dosis, nota:m.nota, reinicio:m.reinicio,
                 accion:m.accion, dias:m.dias, fecha:'' };
    if(typeof m.dias === 'number' && m.dias > 0 && fechaCx)
      it.fecha = fechaMenosDias(fechaCx, m.dias);

    if(m.alerta) out.alertas.push({ n:m.n, txt:m.alerta });
    if(neuro && typeof m.neuro === 'number' && m.neuro > 0)
      out.esperas.push({ n:m.n, horas:m.neuro });

    /* Un farmaco cuya conducta es «continuar» no entra en el calendario por
       mucho que el vademecum le conozca dias de suspension: la conducta
       elegida manda sobre la del catalogo, que es el sentido de poder
       editarla. La aspirina en prevencion secundaria es el caso tipico. */
    if(m.accion === 'continuar')      out.continuar.push(it);
    else if(m.dias === 0)             out.omitir.push(it);
    else if(m.accion === 'suspender') out.suspender.push(it);
    else                              out.evaluar.push(it);
  });

  /* Lo que se suspende primero va arriba: asi se lee como un calendario. */
  out.suspender.sort((a,b) => (b.dias || 0) - (a.dias || 0));
  out.evaluar.sort((a,b) => (b.dias || 0) - (a.dias || 0));
  out.esperas.sort((a,b) => b.horas - a.horas);
  return out;
}

/* La espera de ASRA en palabras: 72 h se entiende peor que «3 días». */
function textoEspera(h){
  if(h >= 48 && h % 24 === 0) return (h/24) + ' días';
  return h + ' h';
}

/* =========================================================================
   EL MISMO CALCULO, EN TEXTO LLANO PARA EL PACIENTE
   Es lo que se imprime en la hoja de indicaciones y lo que se ofrece copiar
   al campo de indicaciones del plan. Sin nombres de guias ni siglas: el
   paciente necesita saber que deja de tomar y desde cuando.
   ========================================================================= */
function conductaEnTextoPaciente(f){
  const c = conductaPerioperatoria(f);
  const l = [];
  const cuando = it => it.fecha ? ('desde el ' + fFecha(it.fecha))
                                : ('desde ' + it.dias + ' día' + (it.dias === 1 ? '' : 's') +
                                   ' antes de la cirugía');

  c.suspender.forEach(it => l.push('SUSPENDER ' + it.n +
    (it.dias ? ' ' + cuando(it) : ' según indicación de su anestesiólogo/a') + '.'));
  c.omitir.forEach(it => l.push('NO TOMAR la dosis de ' + it.n +
    ' de la mañana de la cirugía.'));
  c.continuar.forEach(it => l.push('SEGUIR TOMANDO ' + it.n +
    ', incluida la dosis de la mañana de la cirugía, con un sorbo de agua.'));
  c.evaluar.forEach(it => l.push('CONSULTAR por ' + it.n +
    ': la conducta la define su anestesiólogo/a.'));
  return l;
}
