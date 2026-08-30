/* =========================================================================
   PASO 3 - ANESTESIA (registro intraoperatorio)
   Cinco solapas: Resumen · Drogas · Signos vitales · Balance · Eventos.

   El modulo de drogas usa el vademecum anestesico de AFAAR. Calcula por
   peso y muestra el rango, pero NUNCA registra una dosis sola: el
   anestesiologo la confirma. Es la regla 4 del capitulo 14 del vademecum.
   ========================================================================= */

let solapaActo = 'resumen';

const SOLAPAS_ACTO = [
  ['resumen','ficha','Resumen'],
  ['drogas','jeringa','Drogas'],
  ['vitales','monitor','Signos vitales'],
  ['balance','gota','Balance'],
  ['eventos','alerta','Eventos']
];

/* =========================================================================
   QUIEN ANESTESIA - el boton que abre el acto
   -------------------------------------------------------------------------
   Un acto anestesico tiene que tener un dueno con nombre y apellido antes de
   que se escriba una sola linea: es el que firma, el que responde y el que
   factura. En el punto 14 de la valoracion se DESIGNA a alguien, pero una
   designacion no es una toma: el que designaron puede no estar, y en una
   urgencia anestesia el que esta. Por eso al entrar al paso el primer
   elemento de la pantalla, imposible de pasar por alto, es este.
   ========================================================================= */
function htmlTomarActo(f){
  const g = DB.fichas[f.id] || f;
  const mio      = esActorFicha(g);
  const designado = g.asignadoUid && g.asignadoUid !== 'sinasignar' ? g.asignadoUid : '';
  const tomado   = !!g.actoPorUid;
  const firmada  = !!(g.firma || {}).firmado;

  if(firmada) return '';

  /* Ya es mio: no hay nada que tomar */
  if(mio && tomado)
    return '<div class="aviso ok no-print">'+ico('jeringa')+'<div><b>El acto anestésico está a tu '+
      'nombre.</b> Lo que registres acá lo firmás vos y el honorario del acto es tuyo.</div></div>';

  const quien = g.actorExterno ? g.actorExterno + ' (externo, sin usuario en la app)'
              : designado      ? nombreUsuario(designado)
              :                  '';

  const yoSoyElDesignado = designado && SESION && designado === SESION.uid;

  return '<div class="tomar-acto no-print">'+
    '<div class="ta-txt">'+ico('jeringa')+
      '<div><b>'+(yoSoyElDesignado
        ? 'Te designaron para este acto anestésico'
        : quien
          ? 'Acto designado a '+esc(quien)
          : 'Este acto anestésico todavía no tiene anestesiólogo')+'</b>'+
      '<span>'+(yoSoyElDesignado
        ? 'En el punto 14 de la valoración de '+esc(autorFicha(g))+' figurás vos. '+
          'Confirmalo para empezar el registro: a partir de ahí el acto es tuyo.'
        : quien
          ? 'Si finalmente lo vas a anestesiar vos, tomalo: la designación del punto 14 es una '+
            'previsión y en el quirófano manda quien está.'
          : 'En el punto 14 quedó como «todavía no se sabe quién opera». Tomalo para poder '+
            'registrar el acto y facturarlo.')+'</span></div>'+
    '</div>'+
    '<button class="btn pri grande" id="acTomar">'+ico('firma')+' TOMAR ACTO ANESTÉSICO</button>'+
  '</div>'+
  '<div class="aviso warn no-print">'+ico('candado')+'<div>Hasta que no lo tomes, lo que cargues '+
    'no se guarda: un registro anestésico sin anestesiólogo responsable no tiene valor '+
    'médico-legal.</div></div>';
}

function pintarPasoAnestesia(f){
  const a = f.acto || {};
  const cuenta = { drogas:(a.drogas||[]).length, vitales:(a.controles||[]).length,
                   eventos:(a.eventos2||[]).length };
  const g = DB.fichas[f.id] || f;
  const sinDueno = !(g.firma||{}).firmado && !esActorFicha(g);

  /* Antes de resolver las tres cosas del recorrido, el paso muestra sólo el
     botón de tomar el acto —que vive fuera de este cuerpo—. Las cinco solapas
     no se dibujan: son pantallas para registrar un acto que todavía no tiene
     ni responsable ni paciente. */
  if(!actoDesbloqueado(f)){
    /* Si cerró la ventana de motivos con la cruz, quedaría trabado sin manera
       de seguir. Nunca se deja a alguien encerrado: el camino de vuelta está
       siempre a la vista, en la misma pantalla donde se cortó. */
    const faltaMotivo = !!f.actoPorUid && !sinValoracion(f) && !hayValoracion(f);
    const faltaPac    = !!f.actoPorUid && !faltaMotivo && !f.pacienteId;
    $('#fiCuerpo').innerHTML = !f.actoPorUid ? '' :
      '<div class="aviso warn">'+ico('reloj')+'<div><b>'+esc(motivoPasoCerrado(f,'anestesia'))+
      '</b><br>El registro del acto —drogas, signos vitales, balance y eventos— se abre '+
      'en cuanto termines.'+
      (faltaMotivo
        ? '<div class="btn-row mt8"><button class="btn pri chico" id="acReabrirMotivo">'+
          ico('valoracion')+' Elegir de dónde sale la valoración</button></div>'
        : '')+
      (faltaPac
        ? '<div class="btn-row mt8"><button class="btn pri chico" id="acIrPaciente">'+
          ico('pacientes')+' Elegir el paciente</button></div>'
        : '')+
      '</div></div>';
    if($('#acReabrirMotivo')) $('#acReabrirMotivo').onclick = () => pedirMotivoSinValoracion(f, true);
    if($('#acIrPaciente'))    $('#acIrPaciente').onclick = () => irAPaso('paciente');
    return;
  }

  /* La tarjeta de la valoración pendiente también vive acá, no sólo en el
     paso 2: quien entró por el acto no tiene por qué ir a la valoración —puede
     ser de un colega— y desde acá firma el consentimiento en su propia
     ventana, sin abrir nada ajeno. */
  const tarjetaVal = deudaValoracion(f) ? htmlValoracionExterna(f) : '';

  /* Mientras el punto 15 esté pendiente, el acto lo recuerda. Es el paso donde
     se pasa el tiempo, y el que no lo vea acá se entera recién en Firmar, con
     el paciente ya en recuperación. El botón abre el consentimiento en su
     ventana, sin obligar a entrar a la valoración. */
  const faltaConsent = !consentimientoCompleto(f) && !(f.firma || {}).firmado &&
                       puedeEditarSeccion(DB.fichas[f.id] || f, 'valoracion');
  const avisoConsent = !faltaConsent ? '' :
    '<div class="aviso warn no-print">'+ico('firma')+'<div>'+
      '<b>Falta el consentimiento informado.</b> Sin él no se puede firmar la ficha, y sin firma '+
      'no hay registro cerrado.'+
      (f.cirugia && f.diagnostico
        ? '<div class="btn-row mt8"><button class="btn pri chico" id="acConsentAhora">'+ico('firma')+
          ' Completar y firmar el consentimiento</button></div>'
        : '<br><span class="mini">Cargá antes la cirugía y el diagnóstico en el paso Paciente.</span>')+
    '</div></div>';

  $('#fiCuerpo').innerHTML = tarjetaVal + avisoConsent +
    '<div class="acto-solapas no-print">'+ SOLAPAS_ACTO.map(s =>
      '<button type="button" class="'+(solapaActo===s[0]?'on':'')+'" data-asolapa="'+s[0]+'">'+
        ico(s[1]).replace('<svg','<svg style="width:14px;height:14px;vertical-align:-2px;margin-right:5px"')+
        esc(s[2])+(cuenta[s[0]] ? '<span class="badge">'+cuenta[s[0]]+'</span>' : '')+
      '</button>').join('') +'</div>'+
    '<div id="actoCuerpo"></div>'+
    '<div class="autoguarda-acto no-print" id="acAviso"></div>';

  $$('#fiCuerpo [data-asolapa]').forEach(b => b.onclick = () => {
    fichaActual.acto = leerPasoAnestesia();
    autoguardarActo(true);                 /* cambiar de solapa también guarda */
    solapaActo = b.dataset.asolapa;
    pintarPasoAnestesia(fichaActual);
  });

  const c = $('#actoCuerpo');
  if(solapaActo === 'resumen'){ c.innerHTML = htmlActoResumen(f); cablearActoResumen(f); }
  else if(solapaActo === 'drogas'){ c.innerHTML = htmlActoDrogas(f); cablearActoDrogas(f); }
  else if(solapaActo === 'vitales'){ c.innerHTML = htmlActoVitales(f); cablearActoVitales(f); }
  else if(solapaActo === 'balance'){ c.innerHTML = htmlActoBalance(f); cablearActoBalance(f); }
  else { c.innerHTML = htmlActoEventos(f); cablearActoEventos(f); }

  if(tarjetaVal) cablearValoracionExterna(f);
  if($('#acConsentAhora')) $('#acConsentAhora').onclick = () => abrirConsentimientoModal(f);
  if(!sinDueno) cablearAutoguardadoActo();
}

/* =========================================================================
   AUTOGUARDADO DE LAS CINCO SOLAPAS
   -------------------------------------------------------------------------
   El acto anestesico se registra mientras se anestesia: con una mano, entre
   dos drogas, mirando el monitor. Pedirle a esa persona que se acuerde de
   apretar «Guardar» es pedirle lo unico que seguro se va a olvidar, y lo que
   se pierde es el registro de un acto medico. Asi que se guarda solo: cada
   vez que se toca un campo, se cambia de solapa o se sale del paso.
   El cartelito de abajo dice cuando fue la ultima vez, para que no haya que
   confiar a ciegas.
   ========================================================================= */
let __actoUltimo = '';

function autoguardarActo(silencioso){
  const f = fichaActual;
  if(!f || pasoFicha !== 'anestesia') return;
  const g = DB.fichas[f.id] || f;
  if((g.firma || {}).firmado) return;                 /* firmada: no se toca */
  if(!puedeEditarSeccion(g, 'acto')) return;          /* el acto es de un colega */
  if(!f.pacienteId) return;                           /* ficha sin paciente: nada que guardar */
  f.acto = leerPasoAnestesia();
  guardarFicha(true, true);                           /* silencioso y sin repintar */
  __actoUltimo = ahoraHora();
  const av = $('#acAviso');
  if(av) av.innerHTML = ico('check')+'Guardado automáticamente a las '+esc(__actoUltimo)+' h';
  if(!silencioso) return;
}

function cablearAutoguardadoActo(){
  const cuerpo = $('#actoCuerpo');
  if(!cuerpo) return;
  const guardar = debounce(() => autoguardarActo(true), 900);
  cuerpo.addEventListener('input',  guardar);
  cuerpo.addEventListener('change', guardar);
  /* Los botones de técnica, de sí/no y las casillas no disparan «change»:
     se pintan por clase. Se los escucha aparte. */
  cuerpo.addEventListener('click', e => {
    if(e.target.closest('.tec, .seg button, .chk, [data-ahora], [data-crono]')) guardar();
  });
  const av = $('#acAviso');
  if(av) av.innerHTML = __actoUltimo
    ? ico('check')+'Guardado automáticamente a las '+esc(__actoUltimo)+' h'
    : ico('nube')+'Este paso se guarda solo a medida que lo completás.';
}

/* El peso del paciente manda en todo el modulo de drogas */
function pesoDeFicha(f){
  const p = DB.pacientes[f.pacienteId] || {};
  return Number(p.peso) || 0;
}
function edadDeFicha(f){
  const p = DB.pacientes[f.pacienteId] || {};
  return edadDe(p.fechaNac, f.fecha);
}

/* =========================================================================
   SOLAPA 1 - RESUMEN: datos del procedimiento, tecnica, via aerea, monitoreo
   ========================================================================= */
function htmlActoResumen(f){
  const a = f.acto || {};
  const eq = a.equipo || {};
  /* El caracter del acto: propuesto desde la valoracion hasta que se lo
     confirma aca. Ver caracterActo() en core.js. */
  const carAct  = caracterActo(f);
  const carVal  = caracterValoracion(f);
  const carConf = caracterActoConfirmado(f);
  /* En una ficha ya firmada no se pide confirmar nada: el registro esta
     cerrado y el aviso solo seria ruido. Las fichas anteriores a este campo
     se leen con el caracter de la valoracion, que es lo que siempre tuvieron. */
  const carCerrado = carConf || !!(f.firma || {}).firmado;
  const disp = DISPOSITIVOS_FLUJO.find(d => d.k === (a.dispositivo || 'ninguno')) || DISPOSITIVOS_FLUJO[0];
  /* Los seis sellos de tiempo del acto, en el orden en que ocurren. El
     cronometro pone la hora del reloj de un toque: en el quirofano nadie
     tipea 07:42 con guantes puestos. */
  const CRONO = [
    ['acIngreso',  'Ingreso a quirófano',    a.ingreso],
    ['acIniAnest', 'Inicio de anestesia',    a.inicioAnestesia],
    ['acIniCx',    'Inicio de cirugía',      a.inicioCirugia],
    ['acFinCx',    'Fin de cirugía',         a.finCirugia],
    ['acFinAnest', 'Fin de anestesia',       a.finAnestesia],
    ['acSalida',   'Salida a recuperación',  a.salida]
  ];

  return ''+
  '<div class="card"><h3>'+ico('calendario')+'Fecha y carácter del acto</h3>'+
    /* La fecha del acto NO es la de la valoración. Entre una y otra suelen
       pasar días o semanas, y de cuál se use dependen la facturación del mes,
       las estadísticas y el aviso de cirugía próxima. Se carga acá, el día
       del acto, que es cuando se sabe de verdad. */
    '<div class="grid c2">'+
      campoFecha('acFechaCx','Fecha en que se realizó la cirugía', a.fechaCirugia || hoyISO())+
      campoSel('acTurnoCx','Turno', ['','Mañana','Tarde','Noche','Fin de semana / feriado'], a.turno)+
    '</div>'+
    '<div class="ayuda">La <b>valoración prequirúrgica</b> quedó fechada '+
      (f.fechaValoracion ? 'el <b>'+fFecha(f.fechaValoracion)+'</b>' : 'aparte')+
      '. Son dos fechas distintas: la consulta se factura e informa en su mes, y el acto en el '+
      'suyo.</div>'+

    /* El caracter tampoco se sabe en la consulta: una programada se adelanta
       por una perforacion y se anestesia de urgencia. Se propone el de la
       valoracion y se confirma aca, que es cuando se sabe. De este dato
       dependen las estadisticas y el adicional del honorario. */
    '<div class="campo mt14"><label>Carácter del acto anestésico <span class="req">*</span></label>'+
      '<div class="seg" id="acCaracter" data-conf="'+(carConf ? '1' : '0')+'">'+
        CARACTERES.map(c => '<button type="button" data-v="'+c.id+'"'+
          (carAct === c.id ? ' class="on"' : '')+'>'+esc(c.n)+'</button>').join('')+
      '</div>'+
      '<div id="acCaracterNota">'+
      (carCerrado
        ? (carAct !== carVal
            ? '<div class="aviso info mt8">'+ico('info')+'<div>La valoración se hizo como <b>'+
              esc(nombreCaracter(carVal).toLowerCase())+'</b> y este acto se registró como <b>'+
              esc(nombreCaracter(carAct).toLowerCase())+'</b>. Las dos cosas quedan asentadas: la '+
              'consulta fue lo que fue, y el acto también.</div></div>'
            : '<div class="ayuda">'+esc(CARACTERES.find(c => c.id === carAct).d)+'</div>')
        : '<div class="aviso warn mt8">'+ico('alerta')+'<div><b>Propuesto desde la valoración, '+
          'donde se cargó como '+esc(nombreCaracter(carVal).toLowerCase())+'.</b><br>'+
          'Confirmalo o corregilo: es el carácter con el que este acto se informa y se factura, y '+
          'no siempre es el que se previó en la consulta.</div></div>')+
      '</div>'+
    '</div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('reloj')+'Tiempos del procedimiento</h3>'+
    '<div class="crono">'+ CRONO.map(c =>
      '<div class="crono-fila">'+
        '<label for="'+c[0]+'">'+esc(c[1])+'</label>'+
        '<input type="time" id="'+c[0]+'" value="'+esc(c[2]||'')+'">'+
        '<button type="button" class="btn '+(c[2] ? 'ghost' : 'pri')+' chico" data-crono="'+c[0]+'" '+
          'title="Sellar con la hora actual">'+ico('reloj')+' Ahora</button>'+
      '</div>').join('') +'</div>'+
    '<div class="ayuda">Tocá <b>Ahora</b> a medida que ocurren y quedan sellados con la hora del '+
      'reloj. También se pueden escribir a mano si estás completando la ficha después.</div>'+
    '<div id="acDuracion"></div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('jeringa')+'Técnica anestésica</h3>'+
    '<div class="tec-grid" id="acTecnicas">'+ TECNICAS_FLUJO.map(t =>
      '<button type="button" class="tec'+((a.tecnicas||[]).indexOf(t.k)>=0?' on':'')+
      '" data-tec="'+t.k+'" title="'+esc(t.det)+'">'+esc(t.t)+'</button>').join('') +'</div>'+
    '<div class="ayuda">Se puede marcar más de una: por ejemplo general + bloqueo periférico.</div>'+
    campoTxt('acTecDet','Detalle de la técnica', a.tecnicaDetalle,
      false)+
  '</div>'+

  '<div class="card"><h3>'+ico('aire')+'Vía aérea</h3>'+
    '<div class="campo"><label>¿Vía aérea difícil?</label>'+
      '<div class="seg si-no" id="acVaDificil">'+
        [['no','No'],['si','Sí']].map(o => '<button type="button" data-v="'+o[0]+'"'+
          ((a.vaDificil||'no')===o[0]?' class="on"':'')+'>'+o[1]+'</button>').join('')+
      '</div></div>'+
    '<div class="grid c2">'+
      '<div class="campo"><label>Dispositivo</label><select id="acDisp">'+
        DISPOSITIVOS_FLUJO.map(d => '<option value="'+d.k+'"'+
          ((a.dispositivo||'ninguno')===d.k?' selected':'')+'>'+esc(d.t)+'</option>').join('')+
      '</select></div>'+
      '<div class="campo" id="acTamBox"><label id="acTamLbl">Tamaño</label>'+
        '<select id="acTam">'+ (disp.tam||[]).map(t =>
          '<option'+(String(a.tamano)===String(t)?' selected':'')+'>'+esc(t)+'</option>').join('') +'</select></div>'+
    '</div>'+
    '<div class="grid c2">'+
      campoSel('acCormack','Cormack-Lehane obtenido', ['','I','II a','II b','III','IV'], a.cormack)+
      campoNum('acIntentos','Intentos de intubación', a.intentos)+
    '</div>'+
    '<div id="acVaAviso"></div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('monitor')+'Monitorización</h3>'+
    '<div class="chks compacto" id="acMonitor">'+ MONITOR_FLUJO.map(m =>
      '<label class="chk'+((a.monitor||[]).indexOf(m)>=0?' sel':'')+'">'+
      '<input type="checkbox" value="'+esc(m)+'"'+((a.monitor||[]).indexOf(m)>=0?' checked':'')+'>'+
      esc(m)+'</label>').join('') +'</div>'+
    '<label class="mini strong mt14" style="display:block">Adicional</label>'+
    '<div class="chks compacto" id="acMonitorExtra">'+ MONITOR_FLUJO_EXTRA.map(m =>
      '<label class="chk'+((a.monitorExtra||[]).indexOf(m)>=0?' sel':'')+'">'+
      '<input type="checkbox" value="'+esc(m)+'"'+((a.monitorExtra||[]).indexOf(m)>=0?' checked':'')+'>'+
      esc(m)+'</label>').join('') +'</div>'+
    campoTxt('acAccesos','Accesos vasculares', a.accesos)+
  '</div>'+

  /* --------------------------------------------------------------------
     Equipo quirurgico. Se mudo aca desde el paso «Paciente»: antes de la
     cirugia el equipo es una intencion (figura en el parte de programacion
     y cambia a ultimo momento); en el quirofano es un hecho. Se registra
     donde se sabe con certeza, junto al resto del acto.
     Vive dentro de f.acto para que el colega que toma el acto tambien lo
     pueda guardar: al escribir una ficha ajena solo se graban acto y recup.
     -------------------------------------------------------------------- */
  '<div class="card"><h3>'+ico('pacientes')+'Equipo quirúrgico</h3>'+
    '<div class="grid c2">'+
      campoTxt('acCirujano','Cirujano/a', eq.cirujano)+
      campoTxt('acAyudante','Ayudante', eq.ayudante)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('acInstrumentador','Instrumentador/a', eq.instrumentador)+
      campoTxt('acAnestesista2','Segundo anestesiólogo / residente', eq.anestesista2)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('acCirujanoMP','Matrícula del cirujano/a', eq.cirujanoMP)+
      campoTxt('acCircTecnico','Circulante / técnico de anestesia', eq.circulante)+
    '</div>'+
    '<div class="ayuda">Es el equipo que efectivamente intervino. El cirujano que figura acá es '+
      'el que firma la foja quirúrgica que se adjunta al final de la ficha.</div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('check')+'Lista de verificación quirúrgica (OMS)</h3>'+
    '<div class="chks" id="acOMS">'+
      [['entrada','Entrada — antes de la inducción'],
       ['pausa','Pausa quirúrgica — antes de la incisión'],
       ['salida','Salida — antes de que el paciente deje el quirófano']].map(o =>
      '<label class="chk'+((a.oms||[]).indexOf(o[0])>=0?' sel':'')+'"><input type="checkbox" value="'+o[0]+'"'+
      ((a.oms||[]).indexOf(o[0])>=0?' checked':'')+'>'+o[1]+'</label>').join('')+
    '</div>'+
    campoArea('acObs','Observaciones del acto anestésico', a.observaciones)+
  '</div>';
}

function cablearActoResumen(f){
  $$('#actoCuerpo [data-crono]').forEach(b => b.onclick = () => {
    const e = $('#'+b.dataset.crono);
    e.value = ahoraHora();
    b.classList.remove('pri'); b.classList.add('ghost');
    e.classList.add('sellado');
    setTimeout(() => e.classList.remove('sellado'), 900);
    recalcTiempos();
  });
  $$('#acTecnicas .tec').forEach(b => b.onclick = () => b.classList.toggle('on'));
  $$('#acVaDificil button').forEach(b => b.onclick = () => {
    $$('#acVaDificil button').forEach(x => x.classList.remove('on')); b.classList.add('on');
    avisarVA();
  });

  /* Caracter del acto. Al tocarlo deja de ser una propuesta: se repinta solo
     la nota, no la solapa entera, para no perder lo que se este tipeando. */
  const notaCaracter = () => {
    const el = $('#acCaracterNota');
    const b = $('#acCaracter button.on');
    if(!el || !b) return;
    const car = b.dataset.v, val = caracterValoracion(f);
    el.innerHTML = car !== val
      ? '<div class="aviso info mt8">'+ico('info')+'<div>La valoración se hizo como <b>'+
        esc(nombreCaracter(val).toLowerCase())+'</b> y este acto se registró como <b>'+
        esc(nombreCaracter(car).toLowerCase())+'</b>. Las dos cosas quedan asentadas: la consulta '+
        'fue lo que fue, y el acto también.</div></div>'
      : '<div class="ayuda">'+esc((CARACTERES.find(c => c.id === car) || {}).d || '')+'</div>';
  };
  $$('#acCaracter button').forEach(b => b.onclick = () => {
    $$('#acCaracter button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    /* Recien acá deja de ser una propuesta: el boton venia pintado con el
       caracter de la valoracion, y guardarlo sin que nadie lo mire seria
       darlo por confirmado sin que nadie lo confirme. */
    const cnt = $('#acCaracter'); if(cnt) cnt.dataset.conf = '1';
    notaCaracter();
  });
  ['acMonitor','acMonitorExtra','acOMS'].forEach(id => $$('#'+id+' .chk').forEach(l => {
    l.onclick = () => setTimeout(() => l.classList.toggle('sel', l.querySelector('input').checked), 0);
  }));

  const pintarTam = () => {
    const d = DISPOSITIVOS_FLUJO.find(x => x.k === $('#acDisp').value) || DISPOSITIVOS_FLUJO[0];
    const box = $('#acTamBox');
    if(!(d.tam || []).length){ box.style.display = 'none'; return; }
    box.style.display = '';
    $('#acTamLbl').textContent = 'Tamaño' + (d.um ? ' ('+d.um+')' : '');
    const actual = $('#acTam').value;
    $('#acTam').innerHTML = d.tam.map(t =>
      '<option'+(String(actual)===String(t)?' selected':'')+'>'+esc(t)+'</option>').join('');
  };
  $('#acDisp').onchange = pintarTam;
  pintarTam();

  const avisarVA = () => {
    const dif = ($('#acVaDificil button.on') || {}).dataset;
    $('#acVaAviso').innerHTML = (dif && dif.v === 'si')
      ? '<div class="aviso danger">'+ico('alerta')+'<div><b>Vía aérea difícil.</b> Queda asentado '+
        'en la ficha y en la historia del paciente. Detallá en las observaciones qué dispositivo '+
        'resolvió la intubación, para que el próximo anestesiólogo lo sepa.</div></div>'
      : '';
  };
  avisarVA();

  const recalcTiempos = () => {
    const dcx = minutosEntre(val('acIniCx'), val('acFinCx'));
    const dan = minutosEntre(val('acIniAnest'), val('acFinAnest'));
    let h = '';
    if(dcx !== null) h += '<div class="tiempo"><span>Duración de cirugía</span><b>'+duracionTexto(dcx)+'</b></div>';
    if(dan !== null) h += '<div class="tiempo"><span>Duración de anestesia</span><b>'+duracionTexto(dan)+'</b></div>';
    $('#acDuracion').innerHTML = h
      ? '<div class="tiempos">'+h+'</div>'+
        (dan !== null && dan > 120 ? '<div class="aviso info">'+ico('dinero')+
          '<div>Más de 2 horas de anestesia: corresponde el adicional por prolongación del '+
          'nomenclador anestésico. Cargalo en Honorarios.</div></div>' : '')
      : '';
  };
  $('#actoCuerpo').addEventListener('input', debounce(recalcTiempos, 200));
  $('#actoCuerpo').addEventListener('change', recalcTiempos);
  recalcTiempos();
}

/* =========================================================================
   SOLAPA 2 - DROGAS
   ========================================================================= */
function htmlActoDrogas(f){
  const a = f.acto || {};
  const drogas = a.drogas || [];
  const peso = pesoDeFicha(f);
  const edad = edadDeFicha(f);
  const pedia = esPediatrico(edad);
  const favs = favoritosDrogas();
  const acum = acumuladoAnestesicosLocales(drogas, peso);

  return ''+
  (pedia && !peso ? '<div class="aviso danger">'+ico('alerta')+
    '<div><b>Paciente pediátrico sin peso cargado.</b> El vademécum no propone ninguna dosis '+
    'hasta que cargues el peso en el paso 1. Es una regla de seguridad, no una limitación técnica.</div></div>'
   : (!peso ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Sin peso cargado.</b> Podés registrar '+
      'drogas igual, pero no se puede calcular ninguna dosis por kg.</div></div>' : ''))+

  '<div class="card"><h3>'+ico('buscar')+'Buscar fármaco</h3>'+
    '<div class="buscador"><input type="search" id="drBuscar" '+
      'placeholder="Buscar en el vademécum: propofol, fentanilo, rocuronio…" autocomplete="off">'+
      '<div class="res" id="drRes"></div></div>'+

    '<label class="mini strong mt14" style="display:block">Favoritos</label>'+
    '<div class="chips" id="drFavs">'+ favs.map(n =>
      '<button type="button" class="chip" data-fav="'+esc(n)+'">'+esc(n)+'</button>').join('') +
      '<button type="button" class="chip mas" id="drTodas" data-lectura>'+ico('lista')+' Ver vademécum</button>'+
    '</div>'+

    '<button class="btn pri grande mt14" id="drAgregar">'+ico('mas')+' Agregar droga</button>'+
  '</div>'+

  '<div class="card"><h3>'+ico('jeringa')+'Drogas administradas'+
    '<span class="tag" style="margin-left:auto">Total: '+drogas.length+'</span></h3>'+
    (drogas.length
      ? '<div class="drogas-lista">'+ drogas.map((d,i) => {
          const fa = farmacoPorNombre(d.n);
          return '<div class="droga-fila" data-dr="'+i+'">'+
            '<div class="dr-n"><b>'+esc(d.n)+'</b>'+
              (d.hora ? '<span class="mini">'+esc(d.hora)+'</span>' : '')+'</div>'+
            '<div class="dr-d">'+esc(String(d.dosis||''))+' '+unidadHTML(d.unidad||'')+'</div>'+
            '<div class="dr-v">'+esc(d.via||'')+'</div>'+
            '<div class="dr-a">'+
              '<button type="button" class="ico-btn" data-drver="'+i+'" title="Ver detalle">'+ico('info')+'</button>'+
              '<button type="button" class="ico-btn danger" data-drdel="'+i+'" title="Quitar">'+ico('borrar')+'</button>'+
            '</div>'+
            (fa && fa.alerta ? '<div class="dr-alerta">'+ico('alerta')+esc(fa.alerta)+'</div>' : '')+
          '</div>';
        }).join('') +'</div>'+
        '<button class="btn ghost mt14" id="drDetalle" data-lectura>'+ico('lista')+' Ver detalle de dosis</button>'
      : '<p class="mini">Todavía no registraste ninguna droga.</p>')+
  '</div>'+

  /* ---- acumulado de anestesicos locales: mg totales y mg/kg ---- */
  (acum.items.length ? '<div class="card"><h3>'+ico('gota')+'Anestésicos locales — dosis acumulada</h3>'+
    '<div class="tabla-wrap"><table><thead><tr><th>Fármaco</th><th class="num">mg totales</th>'+
    '<th class="num">mg/kg</th><th class="num">Referencia</th></tr></thead><tbody>'+
    acum.items.map(x => {
      const alto = x.pct !== null && x.pct >= 80;
      return '<tr'+(alto?' class="alto"':'')+'><td>'+esc(x.n)+
        (x.conAdrenalina?' <span class="mini">con adrenalina</span>':'')+'</td>'+
        '<td class="num">'+fDosis(x.mg)+'</td>'+
        '<td class="num">'+(x.mgKg !== null ? fDosis(x.mgKg) : '—')+'</td>'+
        '<td class="num">'+(x.sinTope ? '<span class="mini">sin máximo universal</span>'
          : (x.referencia ? fDosis(x.referencia)+' mg'+(x.pct!==null?' · '+x.pct+' %':'') : '—'))+'</td></tr>';
    }).join('')+
    '</tbody></table></div>'+
    (acum.mezcla ? '<div class="aviso danger mt8">'+ico('alerta')+'<div>'+
      '<b>Se combinaron '+acum.items.length+' anestésicos locales: la toxicidad es aditiva.</b> '+
      'Los porcentajes de arriba son de cada fármaco por separado y no se pueden sumar como si '+
      'fueran independientes. Ningún máximo es una garantía de seguridad.</div></div>' : '')+
    (acum.items.some(x => x.pct !== null && x.pct >= 80)
      ? '<div class="aviso warn mt8">'+ico('alerta')+'<div>Hay un anestésico local por encima del '+
        '80 % de su dosis de referencia. Revisá el protocolo institucional y tené a mano la '+
        'emulsión lipídica.</div></div>' : '')+
    (!acum.peso ? '<div class="aviso warn mt8">'+ico('alerta')+
      '<div>Sin peso no se puede calcular mg/kg.</div></div>' : '')+
  '</div>' : '')+

  '<div class="card"><h3>'+ico('archivo')+'Notas de fármacos</h3>'+
    campoArea('acDrogasNota','Aclaraciones sobre la medicación administrada', a.drogasNota,
      'Infusiones, esquemas de mantenimiento, cambios de plan, drogas de otro equipo')+
  '</div>'+

  '<details class="acc"><summary><span class="n">'+ico('escudo')+'</span>'+
    'Reglas de seguridad del vademécum<span class="flecha">'+ico('flecha')+'</span></summary>'+
    '<div class="cuerpo"><ul class="reglas">'+
      VADEMECUM_REGLAS.map(r => '<li>'+esc(r)+'</li>').join('')+
    '</ul></div></details>';
}

function cablearActoDrogas(f){
  montarBuscador({
    input:$('#drBuscar'), caja:$('#drRes'),
    fuente: () => VADEMECUM.map(x => ({
      etiqueta:x.n, sub: grupoVademecum(x.g).t,
      busca: norm(x.n+' '+grupoVademecum(x.g).t), dato:x })),
    onElegir: x => abrirDroga(x.dato.n)
  });
  $$('#drFavs [data-fav]').forEach(b => b.onclick = () => abrirDroga(b.dataset.fav));
  $('#drTodas').onclick = abrirVademecum;
  $('#drAgregar').onclick = abrirVademecum;

  $$('#actoCuerpo [data-drver]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    abrirDetalleDroga(Number(b.dataset.drver));
  });
  $$('#actoCuerpo [data-drdel]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const i = Number(b.dataset.drdel);
    const d = (fichaActual.acto.drogas || [])[i];
    confirmar('Quitar droga', '¿Quitar <b>'+esc(d.n)+'</b> del registro?', () => {
      fichaActual.acto = leerPasoAnestesia();
      fichaActual.acto.drogas.splice(i, 1);
      cerrarModal(); pintarPasoAnestesia(fichaActual);
    }, 'Quitar', true);
  });
  if($('#drDetalle')) $('#drDetalle').onclick = abrirTablaDosis;
}

/* ---------------------------------------- Vademecum completo por grupos */
function abrirVademecum(){
  const f = fichaActual;
  const edad = edadDeFicha(f);
  const pedia = esPediatrico(edad);
  const favs = favoritosDrogas();
  abrirModal('Vademécum anestésico AFAAR',
    '<div class="aviso info">'+ico('info')+'<div>Rangos orientativos, versión '+VADEMECUM_VERSION+'. '+
      'La dosis final se individualiza según edad, peso, ASA, comorbilidades, técnica, interacciones '+
      'y protocolo institucional. <b>'+(pedia
        ? 'Paciente pediátrico: se muestran las dosis de pediatría.'
        : 'Paciente adulto: se muestran las dosis de adulto.')+'</b></div></div>'+
    '<div class="campo"><input type="search" id="vdBuscar" placeholder="Filtrar por nombre…" autocomplete="off"></div>'+
    '<div id="vdLista">'+ VADEMECUM_GRUPOS.map(g => {
      const items = VADEMECUM.filter(x => x.g === g.k);
      if(!items.length) return '';
      return '<details class="acc vd-grupo'+(g.k==='emergencias'?' emergencia':'')+'"'+
        (g.k==='hipnoticos'?' open':'')+'>'+
        '<summary><span class="n">'+ico(g.ico)+'</span>'+esc(g.t)+
        '<span class="cuenta">'+items.length+'</span>'+
        '<span class="flecha">'+ico('flecha')+'</span></summary>'+
        '<div class="cuerpo"><div class="vd-items">'+ items.map(x =>
          '<button type="button" class="vd-item'+(favs.indexOf(x.n)>=0?' fav':'')+
          '" data-vd="'+esc(x.n)+'" data-busca="'+esc(norm(x.n))+'">'+
            '<b>'+esc(x.n)+'</b>'+
            '<span>'+esc((pedia ? x.pedia : x.adulto) || '').slice(0,90)+'</span>'+
            (x.alerta ? '<i class="ale">'+ico('alerta')+'</i>' : '')+
          '</button>').join('') +'</div></div></details>';
    }).join('') +'</div>'+
    '<details class="acc mt14"><summary><span class="n">'+ico('guias')+'</span>'+
      'Fuentes de validación<span class="flecha">'+ico('flecha')+'</span></summary>'+
      '<div class="cuerpo"><ul class="reglas">'+VADEMECUM_FUENTES.map(x => '<li>'+esc(x)+'</li>').join('')+
      '</ul></div></details>',
    '<button class="btn ghost" data-cerrar>Cerrar</button>', '860px');

  $$('#vdLista [data-vd]').forEach(b => b.onclick = () => abrirDroga(b.dataset.vd));
  $('#vdBuscar').oninput = debounce(e => {
    const q = norm(e.target.value.trim());
    $$('#vdLista .vd-item').forEach(b => {
      b.style.display = (!q || b.dataset.busca.indexOf(q) >= 0) ? '' : 'none';
    });
    $$('#vdLista .vd-grupo').forEach(d => {
      const hay = $$('.vd-item', d).some(b => b.style.display !== 'none');
      d.style.display = hay ? '' : 'none';
      if(q && hay) d.open = true;
    });
  }, 180);
}

/* ------------------------------------------- Calculadora de una droga */
function abrirDroga(nombre, indiceEdicion){
  const fa = farmacoPorNombre(nombre);
  if(!fa) return toast('Ese fármaco no está en el vademécum.', 'err');
  const f = fichaActual;
  const peso = pesoDeFicha(f);
  const edad = edadDeFicha(f);
  const pedia = esPediatrico(edad);
  const editando = indiceEdicion !== undefined && indiceEdicion !== null;
  const prev = editando ? (f.acto.drogas || [])[indiceEdicion] : null;
  const reglas = reglasAplicables(fa, edad);
  const esFav = favoritosDrogas().indexOf(fa.n) >= 0;

  /* Regla de seguridad 1: sin peso no se calcula nada en pediatria */
  const bloqueado = pedia && !peso;

  abrirModal('Detalle de droga',
    '<div class="droga-head">'+
      '<div><h2>'+esc(fa.n)+'</h2>'+
        '<span class="mini">'+esc(grupoVademecum(fa.g).t)+'</span></div>'+
      '<button type="button" class="estrella'+(esFav?' on':'')+'" id="drFav" title="Favorito">★</button>'+
    '</div>'+

    (fa.alerta ? '<div class="aviso danger">'+ico('alerta')+'<div>'+esc(fa.alerta)+'</div></div>' : '')+
    (fa.tof ? '<div class="aviso info">'+ico('monitor')+'<div><b>Monitorización neuromuscular.</b> '+
      'Registrá el TOF antes y después de este fármaco en la solapa de signos vitales.</div></div>' : '')+

    (bloqueado
      ? '<div class="aviso danger">'+ico('alerta')+'<div><b>Falta el peso del paciente.</b><br>'+
        'En pediatría la app exige el peso antes de calcular cualquier dosis. Cargalo en el paso 1 '+
        'y volvé.</div></div>'
      : '')+

    /* ---- indicaciones calculadas ---- */
    (reglas.length && !bloqueado
      ? '<label class="mini strong" style="display:block;margin-bottom:7px">'+
        'Dosis calculada para '+(peso ? fDosis(peso)+' kg' : 'este paciente')+
        ' — '+(pedia?'pediatría':'adulto')+'</label>'+
        '<div class="dosis-ops">'+ reglas.map((r,i) => {
          const c = calcularDosis(r, peso);
          if(c.pesoFalta) return '<div class="dosis-op falta">'+
            '<b>'+esc(r.t)+'</b><span>'+esc(c.rangoDefecto || (r.min+'–'+r.max+' '+r.u))+
            '</span><i>Falta el peso</i></div>';
          return '<button type="button" class="dosis-op" data-regla="'+i+'" '+
            'data-min="'+c.min+'" data-max="'+c.max+'" data-unidad="'+esc(c.unidad)+'">'+
            '<b>'+esc(r.t)+'</b>'+
            '<span class="calc">'+esc(c.texto.replace(c.unidad,'').trim())+' '+unidadHTML(c.unidad)+'</span>'+
            '<i>'+esc(c.rango)+' '+esc(c.rangoUnidad)+(c.tope?' · tope aplicado':'')+'</i>'+
            '</button>';
        }).join('') +'</div>'+
        '<div class="ayuda">Tocá una indicación para llevar el valor al campo de dosis. '+
        '<b>Nada se registra solo</b>: el valor queda editable y lo confirmás vos.</div>'
      : (!bloqueado ? '<div class="aviso warn">'+ico('info')+'<div>Este fármaco no tiene dosis '+
          'precargada a propósito: se indica por protocolo, gasometría o técnica. Cargá la dosis '+
          'a mano.</div></div>' : ''))+

    '<hr class="sep">'+

    /* ---- registro de la dosis ---- */
    '<div class="grid c3">'+
      '<div class="campo"><label>Dosis administrada</label>'+
        '<input type="number" step="any" id="drDosis" inputmode="decimal" value="'+
          esc(prev ? prev.dosis : '')+'"></div>'+
      '<div class="campo"><label>Unidad</label>'+
        '<input type="text" id="drUnidad" value="'+esc(prev ? prev.unidad : fa.u)+'" readonly '+
        'class="'+(/mcg/.test(prev ? prev.unidad : fa.u) ? 'u-mcg-campo' : '')+'"></div>'+
      '<div class="campo"><label>Vía</label><select id="drVia">'+
        (fa.vias || VIAS_ADMIN).map(v => '<option'+((prev?prev.via:(fa.vias||[])[0])===v?' selected':'')+
          '>'+esc(v)+'</option>').join('')+
      '</select></div>'+
    '</div>'+
    '<div class="grid c2">'+
      '<div class="campo"><label>Hora</label>'+
        '<div class="hora-campo"><input type="time" id="drHora" value="'+
          esc(prev ? prev.hora : ahoraHora())+'">'+
        '<button type="button" class="btn ghost chico" id="drAhora">Ahora</button></div></div>'+
      '<div class="campo"><label>Volumen a cargar</label>'+
        '<input type="text" id="drML" readonly></div>'+
    '</div>'+

    /* ---- anestesico local: %, volumen y mg ---- */
    (fa.local ? '<div class="card plano local"><h3>'+ico('gota')+'Anestésico local</h3>'+
      '<div class="grid c3">'+
        '<div class="campo"><label>Concentración</label><select id="drPct">'+
          (fa.concentraciones||[]).map(c => '<option value="'+c+'"'+
            (prev && String(prev.pct)===String(c)?' selected':'')+'>'+fDosis(c)+' %</option>').join('')+
        '</select></div>'+
        campoNum('drVol','Volumen (mL)', prev ? prev.mL : '', 'inputmode="decimal"')+
        '<div class="campo"><label>mg calculados</label><input type="text" id="drMg" readonly></div>'+
      '</div>'+
      '<label class="chk'+(prev && prev.adrenalina?' sel':'')+'" id="drAdrL">'+
        '<input type="checkbox" id="drAdr"'+(prev && prev.adrenalina?' checked':'')+'>'+
        'Con adrenalina</label>'+
      '<div id="drLocalAviso"></div>'+
    '</div>' : '')+

    /* ---- infusion ---- */
    (fa.infusion ? '<div class="card plano"><h3>'+ico('vena')+'Infusión</h3>'+
      '<div class="grid c3">'+
        campoNum('drInfMg','Cantidad total en el frasco', prev ? prev.infMg : '')+
        campoNum('drInfML','Volumen final (mL)', prev ? prev.infML : '')+
        campoNum('drInfObj','Objetivo (mcg/kg/min)', prev ? prev.infObj : '', 'step="0.01"')+
      '</div>'+
      '<div id="drInfOut"></div>'+
    '</div>' : '')+

    campoTxt('drNota','Observación', prev ? prev.nota : '')+

    /* ---- referencia del vademecum ---- */
    '<div class="card plano ref"><h3>'+ico('guias')+'Referencia del vademécum</h3>'+
      '<div class="ref-fila'+(pedia?'':' destacada')+'"><span>Adulto</span><p>'+esc(fa.adulto||'—')+'</p></div>'+
      '<div class="ref-fila'+(pedia?' destacada':'')+'"><span>Pediatría</span><p>'+esc(fa.pedia||'—')+'</p></div>'+
      (fa.obs ? '<div class="ref-fila"><span>Uso</span><p>'+esc(fa.obs)+'</p></div>' : '')+
      (fa.pres ? '<div class="ref-fila"><span>Presentación</span><p>'+esc(fa.pres)+'</p></div>' : '')+
    '</div>',

    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="drOK">'+ico('check')+
      (editando ? ' Guardar cambios' : ' Confirmar y registrar')+'</button>', '760px');

  /* -------------------------------------------------------- cableado */
  $('#drFav').onclick = () => {
    alternarFavorito(fa.n);
    $('#drFav').classList.toggle('on');
    toast(favoritosDrogas().indexOf(fa.n) >= 0 ? 'Agregada a favoritos.' : 'Quitada de favoritos.', 'ok');
  };
  $('#drAhora').onclick = () => { $('#drHora').value = ahoraHora(); };

  $$('#modal [data-regla]').forEach(b => b.onclick = () => {
    /* se propone el punto medio del rango; queda editable */
    const min = Number(b.dataset.min), max = Number(b.dataset.max);
    $('#drDosis').value = redondearDosis(min === max ? min : (min + max) / 2);
    $('#drUnidad').value = b.dataset.unidad;
    $('#drUnidad').className = /mcg/.test(b.dataset.unidad) ? 'u-mcg-campo' : '';
    $$('#modal [data-regla]').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    recalcDroga();
  });

  function recalcDroga(){
    /* mL a cargar según la presentación */
    const ml = mLDePresentacion(fa.pres, val('drDosis'), val('drUnidad'));
    $('#drML').value = ml ? fDosis(ml)+' mL  ('+fa.pres+')' : '—';

    /* anestésico local: % → mg/mL → mg totales */
    if(fa.local && $('#drPct')){
      const pct = Number(val('drPct')), vol = Number(val('drVol')) || 0;
      const mg = mgAnestesicoLocal(pct, vol);
      $('#drMg').value = mg ? fDosis(mg)+' mg' : '—';
      if(mg) $('#drDosis').value = mg;
      const conAdr = chk('drAdr');
      const previas = (f.acto.drogas || []).filter((d,i) => i !== indiceEdicion);
      const acum = acumuladoAnestesicosLocales(
        previas.concat([{ n:fa.n, mg:mg, adrenalina:conAdr }]), peso);
      const mio = acum.items.find(x => x.n === fa.n) || {};
      $('#drLocalAviso').innerHTML =
        '<div class="aviso info">'+ico('calculadora')+'<div>'+
          '<b>'+fDosis(pct)+' % = '+fDosis(pctAmgml(pct))+' mg/mL.</b> '+
          (vol ? vol+' mL = <b>'+fDosis(mg)+' mg</b>. ' : '')+
          (peso && mio.mgKg !== undefined && mio.mgKg !== null
            ? 'Acumulado de '+esc(fa.n)+': <b>'+fDosis(mio.mg)+' mg</b> ('+fDosis(mio.mgKg)+' mg/kg)'+
              (mio.sinTope ? ' — sin máximo universal parametrizado.'
               : (mio.referencia ? ' sobre una referencia de '+fDosis(mio.referencia)+' mg ('+mio.pct+' %).' : '.'))
            : (peso ? '' : 'Sin peso no se calcula mg/kg.'))+
        '</div></div>'+
        (mio.pct !== null && mio.pct !== undefined && mio.pct >= 80
          ? '<div class="aviso danger">'+ico('alerta')+'<div>Por encima del 80 % de la dosis de '+
            'referencia. El máximo no es una garantía: depende del sitio, la técnica y el paciente.</div></div>' : '')+
        (acum.mezcla ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Ya hay otro anestésico '+
          'local registrado en esta ficha: la toxicidad es aditiva.</b></div></div>' : '');
    }

    /* infusión: concentración y mL/h */
    if(fa.infusion && $('#drInfMg')){
      const r = calcularInfusion(val('drInfMg'), val('drInfML'), peso, val('drInfObj'));
      $('#drInfOut').innerHTML = r
        ? '<div class="aviso ok">'+ico('calculadora')+'<div>'+
          '<b>Concentración: '+fDosis(r.mcgPorML)+' mcg/mL</b> ('+fDosis(r.mgPorML)+' mg/mL).'+
          (r.mLh ? ' Para '+val('drInfObj')+' mcg/kg/min en '+fDosis(peso)+' kg: <b>'+
            fDosis(r.mLh)+' mL/h</b>.' : (peso ? '' : ' Cargá el peso para obtener los mL/h.'))+
          '</div></div>'
        : '<div class="ayuda">Cargá la cantidad total y el volumen final para obtener la concentración.</div>';
    }
  }
  $('#modal').addEventListener('input', debounce(recalcDroga, 180));
  $('#modal').addEventListener('change', recalcDroga);
  if($('#drAdrL')) $('#drAdrL').onclick = () =>
    setTimeout(() => { $('#drAdrL').classList.toggle('sel', chk('drAdr')); recalcDroga(); }, 0);
  recalcDroga();

  $('#drOK').onclick = () => {
    const dosis = val('drDosis');
    if(dosis === '' || Number(dosis) <= 0) return toast('Cargá la dosis administrada.', 'err');
    const reg = {
      id: prev ? prev.id : uid('dro'),
      n: fa.n, g: fa.g,
      dosis: Number(dosis), unidad: val('drUnidad'), via: val('drVia'),
      hora: val('drHora'), nota: val('drNota'),
      porUid: SESION.uid
    };
    if(fa.local){
      reg.pct = Number(val('drPct')); reg.mL = Number(val('drVol')) || 0;
      reg.mg = mgAnestesicoLocal(reg.pct, reg.mL) || Number(dosis);
      reg.adrenalina = chk('drAdr');
    }
    if(fa.infusion){
      reg.infMg = Number(val('drInfMg')) || 0;
      reg.infML = Number(val('drInfML')) || 0;
      reg.infObj = Number(val('drInfObj')) || 0;
      const r = calcularInfusion(reg.infMg, reg.infML, peso, reg.infObj);
      if(r){ reg.infConc = r.mcgPorML; reg.infMLh = r.mLh || 0; }
    }
    fichaActual.acto = leerPasoAnestesia();
    fichaActual.acto.drogas = fichaActual.acto.drogas || [];
    if(editando) fichaActual.acto.drogas[indiceEdicion] = reg;
    else fichaActual.acto.drogas.push(reg);
    fichaActual.acto.drogas.sort((a,b) => (a.hora||'') < (b.hora||'') ? -1 : 1);
    cerrarModal();
    pintarPasoAnestesia(fichaActual);
    toast(editando ? 'Dosis actualizada.' : fa.n+' registrado.', 'ok');
  };
}

/* Detalle de una droga ya registrada */
function abrirDetalleDroga(i){
  const d = (fichaActual.acto.drogas || [])[i];
  if(!d) return;
  abrirDroga(d.n, i);
}

/* Tabla completa de dosis administradas */
function abrirTablaDosis(){
  const f = fichaActual;
  const drogas = f.acto.drogas || [];
  const peso = pesoDeFicha(f);
  abrirModal('Detalle de dosis',
    '<div class="tabla-wrap"><table><thead><tr>'+
      '<th>Hora</th><th>Fármaco</th><th class="num">Dosis</th><th>Vía</th>'+
      '<th class="num">mg/kg</th><th>Observación</th></tr></thead><tbody>'+
    (drogas.length ? drogas.map(d => {
      const mgkg = (peso && /^mg$/.test(d.unidad)) ? fDosis(d.dosis / peso) : '—';
      return '<tr><td>'+esc(d.hora||'—')+'</td><td>'+esc(d.n)+'</td>'+
        '<td class="num">'+fDosis(d.dosis)+' '+unidadHTML(d.unidad||'')+'</td>'+
        '<td>'+esc(d.via||'—')+'</td><td class="num">'+mgkg+'</td>'+
        '<td class="mini">'+esc([d.nota, d.pct ? fDosis(d.pct)+' % · '+d.mL+' mL' : '',
          d.infMLh ? d.infMLh+' mL/h' : ''].filter(Boolean).join(' · '))+'</td></tr>';
    }).join('') : '<tr><td colspan="6">Sin drogas registradas.</td></tr>')+
    '</tbody></table></div>'+
    (peso ? '' : '<div class="aviso warn mt8">'+ico('alerta')+
      '<div>Sin peso cargado no se puede mostrar mg/kg.</div></div>'),
    '<button class="btn ghost" data-cerrar>Cerrar</button>', '860px');
}

/* =========================================================================
   SOLAPA 3 - SIGNOS VITALES
   ========================================================================= */
const COLS_VITALES = [
  { k:'ta',    t:'TA',    um:'mmHg' },
  { k:'fc',    t:'FC',    um:'lpm' },
  { k:'spo2',  t:'SpO₂',  um:'%' },
  { k:'etco2', t:'EtCO₂', um:'mmHg' },
  { k:'temp',  t:'Temp',  um:'°C' },
  { k:'tof',   t:'TOF',   um:'' }
];

function htmlActoVitales(f){
  const a = f.acto || {};
  const ctrls = (a.controles || []).slice().sort((x,y) => (y.hora||'') < (x.hora||'') ? -1 : 1);
  const ult = ctrls[0];
  const alerta = alertasVitales(ctrls);

  return ''+
  (ctrls.length
    ? '<div class="aviso '+(alerta.length?'warn':'ok')+'">'+ico(alerta.length?'alerta':'check')+
      '<div>'+(alerta.length
        ? '<b>Revisar:</b> '+esc(alerta.join(' · '))
        : '<b>Evolución estable durante el procedimiento</b>')+'</div></div>'
    : '')+

  '<button class="btn pri grande" id="svNuevo">'+ico('mas')+' Registrar control</button>'+

  (ult ? '<div class="card ultimo-control"><h3>'+ico('monitor')+'Último control · '+esc(ult.hora||'')+'</h3>'+
    '<div class="vitales-grid">'+ COLS_VITALES.map(c =>
      '<div class="vital"><span class="t">'+c.t+'</span>'+
        '<span class="v">'+esc(valorVital(ult, c.k) || '—')+'</span>'+
        '<span class="u">'+esc(c.um)+'</span></div>').join('') +'</div>'+
  '</div>' : '')+

  '<div class="card"><h3>'+ico('lista')+'Controles registrados'+
    '<span class="tag" style="margin-left:auto">'+ctrls.length+'</span></h3>'+
    (ctrls.length
      ? '<div class="tabla-wrap"><table class="vitales-tabla"><thead><tr><th>Hora</th>'+
        COLS_VITALES.map(c => '<th class="num">'+c.t+(c.um?'<br><span class="mini">'+c.um+'</span>':'')+'</th>').join('')+
        '<th></th></tr></thead><tbody>'+
        ctrls.map(c => '<tr data-ctrl="'+esc(c.id)+'">'+
          '<td><b>'+esc(c.hora||'—')+'</b></td>'+
          COLS_VITALES.map(col => '<td class="num">'+esc(valorVital(c, col.k) || '—')+'</td>').join('')+
          '<td><button type="button" class="ico-btn danger" data-svdel="'+esc(c.id)+'">'+ico('borrar')+'</button></td>'+
        '</tr>').join('')+
        '</tbody></table></div>'+
        '<button class="btn ghost mt14" id="svGrafico" data-lectura>'+ico('stats')+' Ver gráfico</button>'
      : '<p class="mini">Todavía no registraste controles. Tocá «Registrar control» para el primero.</p>')+
  '</div>';
}

function valorVital(c, k){
  if(!c) return '';
  if(k === 'ta') return (c.tas && c.tad) ? c.tas+'/'+c.tad : '';
  return c[k] === undefined || c[k] === '' ? '' : String(c[k]);
}

/* Revisa los controles y devuelve lo que amerita mirar dos veces */
function alertasVitales(ctrls){
  const out = [];
  const hay = (k, test) => ctrls.some(c => c[k] !== '' && c[k] !== undefined && test(Number(c[k])));
  if(ctrls.some(c => c.tas && Number(c.tas) < 90))  out.push('hipotensión (TAS < 90)');
  if(ctrls.some(c => c.tas && Number(c.tas) > 180)) out.push('hipertensión (TAS > 180)');
  if(hay('fc', v => v < 45))    out.push('bradicardia (FC < 45)');
  if(hay('fc', v => v > 120))   out.push('taquicardia (FC > 120)');
  if(hay('spo2', v => v < 92))  out.push('desaturación (SpO₂ < 92 %)');
  if(hay('etco2', v => v < 25 || v > 50)) out.push('EtCO₂ fuera de rango');
  if(hay('temp', v => v < 35))  out.push('hipotermia (< 35 °C)');
  if(hay('temp', v => v > 38))  out.push('hipertermia (> 38 °C)');
  return out;
}

function cablearActoVitales(f){
  $('#svNuevo').onclick = () => abrirControl(null);
  $$('#actoCuerpo [data-ctrl]').forEach(tr => tr.onclick = e => {
    if(e.target.closest('[data-svdel]')) return;
    abrirControl(tr.dataset.ctrl);
  });
  $$('#actoCuerpo [data-svdel]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    fichaActual.acto = leerPasoAnestesia();
    fichaActual.acto.controles = (fichaActual.acto.controles||[])
      .filter(c => c.id !== b.dataset.svdel);
    pintarPasoAnestesia(fichaActual);
  });
  if($('#svGrafico')) $('#svGrafico').onclick = abrirGraficoVitales;
}

function abrirControl(id){
  const f = fichaActual;
  const c = id ? (f.acto.controles || []).find(x => x.id === id) || {} : {};
  const ult = ultimoControl(f.acto.controles);
  abrirModal(id ? 'Editar control' : 'Registrar control',
    '<div class="campo"><label>Hora</label>'+
      '<div class="hora-campo"><input type="time" id="svHora" value="'+esc(c.hora || ahoraHora())+'">'+
      '<button type="button" class="btn ghost chico" id="svAhora">Ahora</button></div></div>'+
    '<div class="grid c3">'+
      '<div class="campo"><label>TA (mmHg)</label>'+
        '<div class="ta-campo">'+
          '<input type="number" id="svTas" placeholder="118" inputmode="numeric" value="'+esc(c.tas||'')+'">'+
          '<span>/</span>'+
          '<input type="number" id="svTad" placeholder="70" inputmode="numeric" value="'+esc(c.tad||'')+'">'+
        '</div></div>'+
      campoNum('svFc','FC (lpm)', c.fc, 'inputmode="numeric"')+
      campoNum('svSpo2','SpO₂ (%)', c.spo2, 'inputmode="numeric"')+
    '</div>'+
    '<div class="grid c3">'+
      campoNum('svEtco2','EtCO₂ (mmHg)', c.etco2, 'inputmode="numeric"')+
      campoNum('svTemp','Temp (°C)', c.temp, 'step="0.1" inputmode="decimal"')+
      campoTxt('svTof','TOF', c.tof)+
    '</div>'+
    (ult && !id ? '<div class="ayuda">Último control a las '+esc(ult.hora||'—')+': '+
      esc([valorVital(ult,'ta')+' mmHg', ult.fc?ult.fc+' lpm':'', ult.spo2?ult.spo2+' %':'']
        .filter(x => x && x !== ' mmHg').join(' · '))+'</div>' : '')+
    campoTxt('svObs','Observaciones', c.obs),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="svOK">'+ico('check')+' Guardar control</button>');

  $('#svAhora').onclick = () => { $('#svHora').value = ahoraHora(); };
  $('#svOK').onclick = () => {
    const reg = {
      id: c.id || uid('ctl'), hora: val('svHora'),
      tas: val('svTas'), tad: val('svTad'), fc: val('svFc'), spo2: val('svSpo2'),
      etco2: val('svEtco2'), temp: val('svTemp'), tof: val('svTof'), obs: val('svObs')
    };
    if(!reg.hora) return toast('Cargá la hora del control.', 'err');
    fichaActual.acto = leerPasoAnestesia();
    fichaActual.acto.controles = fichaActual.acto.controles || [];
    const i = fichaActual.acto.controles.findIndex(x => x.id === reg.id);
    if(i >= 0) fichaActual.acto.controles[i] = reg;
    else fichaActual.acto.controles.push(reg);
    fichaActual.acto.controles.sort((a,b) => (a.hora||'') < (b.hora||'') ? -1 : 1);
    cerrarModal();
    pintarPasoAnestesia(fichaActual);
    toast('Control registrado.', 'ok');
  };
}

/* Grafico de tendencia: TA sistolica/diastolica, FC y SpO2 en SVG a mano,
   sin librerias, igual que el resto de los graficos de la app. */
function abrirGraficoVitales(){
  const ctrls = (fichaActual.acto.controles || []).slice()
    .sort((a,b) => (a.hora||'') < (b.hora||'') ? -1 : 1);
  if(ctrls.length < 2) return toast('Hacen falta al menos dos controles para el gráfico.', 'warn');

  const W = 640, H = 260, ML = 38, MR = 12, MT = 14, MB = 30;
  const n = ctrls.length;
  const x = i => ML + (i * (W - ML - MR)) / Math.max(1, n - 1);
  const serie = (k, min, max, color, dash) => {
    const pts = ctrls.map((c,i) => {
      const v = Number(k === 'tas' ? c.tas : k === 'tad' ? c.tad : c[k]);
      if(!isFinite(v) || !v) return null;
      const y = MT + (H - MT - MB) * (1 - (v - min) / (max - min));
      return [x(i), Math.max(MT, Math.min(H - MB, y))];
    }).filter(Boolean);
    if(pts.length < 2) return '';
    return '<polyline fill="none" stroke="'+color+'" stroke-width="2.2" '+
      (dash ? 'stroke-dasharray="4 3" ' : '')+
      'points="'+pts.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+'"/>'+
      pts.map(p => '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="2.6" fill="'+color+'"/>').join('');
  };

  const ejeY = [0,25,50,75,100].map(pct => {
    const y = MT + (H - MT - MB) * (1 - pct/100);
    return '<line x1="'+ML+'" y1="'+y+'" x2="'+(W-MR)+'" y2="'+y+'" stroke="currentColor" '+
      'stroke-opacity=".12"/><text x="'+(ML-6)+'" y="'+(y+3.5)+'" text-anchor="end" '+
      'font-size="9" fill="currentColor" opacity=".55">'+Math.round(pct*2)+'</text>';
  }).join('');

  abrirModal('Evolución intraoperatoria',
    '<div class="grafico-vitales"><svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+
      ejeY+
      serie('tas', 0, 200, '#dc2626')+
      serie('tad', 0, 200, '#dc2626', true)+
      serie('fc',  0, 200, '#1b4e85')+
      serie('spo2',0, 200, '#14b8a6')+
      ctrls.map((c,i) => (n <= 10 || i % Math.ceil(n/10) === 0)
        ? '<text x="'+x(i).toFixed(1)+'" y="'+(H-10)+'" text-anchor="middle" font-size="9" '+
          'fill="currentColor" opacity=".55">'+esc(c.hora||'')+'</text>' : '').join('')+
    '</svg></div>'+
    '<div class="leyenda-vitales">'+
      '<span><i style="background:#dc2626"></i>TA sistólica</span>'+
      '<span><i style="background:#dc2626;opacity:.5"></i>TA diastólica</span>'+
      '<span><i style="background:#1b4e85"></i>FC</span>'+
      '<span><i style="background:#14b8a6"></i>SpO₂</span>'+
    '</div>'+
    '<div class="ayuda">Escala común de 0 a 200 para las cuatro curvas.</div>',
    '<button class="btn ghost" data-cerrar>Cerrar</button>', '760px');
}

/* =========================================================================
   SOLAPA 4 - BALANCE HIDRICO
   ========================================================================= */
function htmlActoBalance(f){
  const a = f.acto || {};
  const b = a.balance || {};
  return ''+
  '<div class="card"><h3>'+ico('gota')+'Balance hídrico</h3>'+
    '<div class="balance">'+
      '<div class="bal-col"><h4>Ingresos</h4>'+
        BALANCE_INGRESOS.map(x =>
          '<div class="bal-fila"><label for="bal_'+x.k+'">'+esc(x.t)+'</label>'+
          '<input type="number" id="bal_'+x.k+'" inputmode="numeric" value="'+esc(b[x.k]||'')+'" '+
          'placeholder="0"><span>mL</span></div>').join('')+
        '<div class="bal-total" id="balTotalIn"></div>'+
      '</div>'+
      '<div class="bal-col"><h4>Egresos</h4>'+
        BALANCE_EGRESOS.map(x =>
          '<div class="bal-fila"><label for="bal_'+x.k+'">'+esc(x.t)+'</label>'+
          '<input type="number" id="bal_'+x.k+'" inputmode="numeric" value="'+esc(b[x.k]||'')+'" '+
          'placeholder="0"><span>mL</span></div>').join('')+
        '<div class="bal-total" id="balTotalOut"></div>'+
      '</div>'+
    '</div>'+
    '<div class="bal-resultado" id="balResultado"></div>'+
    '<div id="balAviso"></div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('vena')+'Hemoderivados y soporte</h3>'+
    '<div class="grid c2">'+
      campoTxt('acHemo','Hemoderivados transfundidos', a.hemoderivados,
        false)+
      campoTxt('acVaso','Drogas vasoactivas en infusión', a.vasoactivos)+
    '</div>'+
  '</div>';
}

function cablearActoBalance(f){
  const recalc = () => {
    const b = {};
    BALANCE_INGRESOS.concat(BALANCE_EGRESOS).forEach(x => b[x.k] = val('bal_'+x.k));
    const r = calcularBalance(b);
    $('#balTotalIn').innerHTML  = '<span>Total ingresos</span><b>'+r.ingresos+' mL</b>';
    $('#balTotalOut').innerHTML = '<span>Total egresos</span><b>'+r.egresos+' mL</b>';
    const signo = r.balance > 0 ? '+' : '';
    $('#balResultado').innerHTML =
      '<span class="lbl">Balance calculado</span>'+
      '<span class="val '+(r.balance >= 0 ? 'ok' : 'warn')+'">'+signo+r.balance+' mL</span>';

    const sangrado = Number(b.sangrado) || 0;
    const peso = pesoDeFicha(f);
    /* volemia estimada: 70 mL/kg en adulto, 80 en pediatria */
    const pedia = esPediatrico(edadDeFicha(f));
    const volemia = peso ? peso * (pedia ? 80 : 70) : 0;
    const pct = volemia ? Math.round(sangrado / volemia * 100) : null;
    $('#balAviso').innerHTML =
      (sangrado && volemia
        ? '<div class="aviso '+(pct >= 30 ? 'danger' : (pct >= 15 ? 'warn' : 'info'))+'">'+
          ico(pct >= 15 ? 'alerta' : 'info')+'<div>'+
          'Pérdida sanguínea de <b>'+sangrado+' mL</b> sobre una volemia estimada de '+
          Math.round(volemia)+' mL ('+(pedia?'80':'70')+' mL/kg): <b>'+pct+' %</b>. '+
          (pct >= 30 ? 'Clase III o mayor: considerar transfusión y protocolo de hemorragia.'
           : pct >= 15 ? 'Clase II: reponer con cristaloides y controlar hematocrito.'
           : 'Pérdida menor.')+'</div></div>'
        : '')+
      (r.balance < -1000 ? '<div class="aviso warn">'+ico('alerta')+
        '<div>Balance negativo mayor a 1000 mL. Revisar la reposición antes del pase a recuperación.</div></div>' : '');
  };
  $('#actoCuerpo').addEventListener('input', debounce(recalc, 200));
  $('#actoCuerpo').addEventListener('change', recalc);
  recalc();
}

/* =========================================================================
   SOLAPA 5 - EVENTOS
   ========================================================================= */
function htmlActoEventos(f){
  const a = f.acto || {};
  const evs = a.eventos2 || [];
  const sin = !!a.sinEventos && !evs.length;
  return ''+
  '<div class="card"><h3>'+ico('alerta')+'Eventos adversos</h3>'+
    '<label class="toggle-verde'+(sin?' on':'')+'" id="evSinL">'+
      '<input type="checkbox" id="evSin"'+(sin?' checked':'')+(evs.length?' disabled':'')+'>'+
      ico('check')+' Sin eventos adversos</label>'+
    (evs.length ? '<div class="ayuda">Hay eventos registrados: para marcar «sin eventos» hay que '+
      'quitarlos primero.</div>' : '')+

    '<button class="btn pri grande mt14" id="evNuevo">'+ico('mas')+' Agregar evento</button>'+

    (evs.length
      ? '<div class="eventos mt14">'+ evs.map(e =>
          '<div class="evento" data-ev="'+esc(e.id)+'">'+
            '<div class="ev-head"><span class="tag danger">'+esc(e.tipo)+'</span>'+
              (e.hora ? '<span class="mini">'+esc(e.hora)+'</span>' : '')+
              '<button type="button" class="ico-btn danger" data-evdel="'+esc(e.id)+'">'+ico('borrar')+'</button>'+
            '</div>'+
            (e.descripcion ? '<p class="ev-desc">'+esc(e.descripcion)+'</p>' : '')+
            (e.conducta ? '<p class="ev-cond"><b>Conducta:</b> '+esc(e.conducta)+'</p>' : '')+
          '</div>').join('') +'</div>'
      : (sin ? '' : '<div class="vacio chico">'+ico('lista')+
          '<b>No se registraron eventos</b><span>durante el procedimiento.</span></div>'))+
  '</div>';
}

function cablearActoEventos(f){
  $('#evSinL').onclick = () => setTimeout(() => {
    $('#evSinL').classList.toggle('on', chk('evSin'));
  }, 0);
  $('#evNuevo').onclick = () => abrirEvento(null);
  $$('#actoCuerpo .evento').forEach(el => el.onclick = e => {
    if(e.target.closest('[data-evdel]')) return;
    abrirEvento(el.dataset.ev);
  });
  $$('#actoCuerpo [data-evdel]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    fichaActual.acto = leerPasoAnestesia();
    fichaActual.acto.eventos2 = (fichaActual.acto.eventos2||[]).filter(x => x.id !== b.dataset.evdel);
    pintarPasoAnestesia(fichaActual);
  });
}

function abrirEvento(id){
  const f = fichaActual;
  const e = id ? (f.acto.eventos2 || []).find(x => x.id === id) || {} : {};
  abrirModal(id ? 'Editar evento' : 'Agregar evento',
    campoSel('evTipo','Tipo de evento', TIPOS_EVENTO, e.tipo)+
    '<div class="campo"><label>Hora</label>'+
      '<div class="hora-campo"><input type="time" id="evHora" value="'+esc(e.hora || ahoraHora())+'">'+
      '<button type="button" class="btn ghost chico" id="evAhora">Ahora</button></div></div>'+
    campoArea('evDesc','Descripción', e.descripcion,
      'Qué pasó, en qué momento del procedimiento y con qué valores')+
    campoArea('evCond','Conducta realizada', e.conducta,
      'Qué se hizo, con qué dosis y cuál fue la respuesta'),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="evOK">'+ico('check')+' Guardar evento</button>');

  $('#evAhora').onclick = () => { $('#evHora').value = ahoraHora(); };
  $('#evOK').onclick = () => {
    const reg = { id: e.id || uid('ev'), tipo: val('evTipo'), hora: val('evHora'),
                  descripcion: val('evDesc'), conducta: val('evCond') };
    if(!reg.tipo) return toast('Elegí el tipo de evento.', 'err');
    fichaActual.acto = leerPasoAnestesia();
    fichaActual.acto.eventos2 = fichaActual.acto.eventos2 || [];
    const i = fichaActual.acto.eventos2.findIndex(x => x.id === reg.id);
    if(i >= 0) fichaActual.acto.eventos2[i] = reg;
    else fichaActual.acto.eventos2.push(reg);
    fichaActual.acto.eventos2.sort((a,b) => (a.hora||'') < (b.hora||'') ? -1 : 1);
    fichaActual.acto.sinEventos = false;
    cerrarModal();
    pintarPasoAnestesia(fichaActual);
    toast('Evento registrado.', 'ok');
  };
}

/* =========================================================================
   LECTURA DEL PASO COMPLETO
   Las listas (drogas, controles, eventos) viven en fichaActual.acto y se
   editan por sus propios modales; lo que se lee de la pantalla es solo lo
   que esta visible en la solapa activa.
   ========================================================================= */
function leerPasoAnestesia(){
  const a = Object.assign({}, fichaActual.acto || {});
  a.__v2 = true;
  a.drogas    = a.drogas    || [];
  a.controles = a.controles || [];
  a.eventos2  = a.eventos2  || [];
  a.balance   = a.balance   || {};

  if(solapaActo === 'resumen' && $('#acIniCx')){
    a.fechaCirugia = val('acFechaCx');      a.turno = val('acTurnoCx');
    /* Solo se guarda si el anestesiologo lo toco. Mientras no lo haga, la
       ficha no tiene caracter de acto propio y caracterActo() sigue
       devolviendo el de la valoracion: es una propuesta, no una herencia. */
    const cnt = $('#acCaracter'), bc = $('#acCaracter button.on');
    if(cnt && bc && cnt.dataset.conf === '1') a.caracterActo = bc.dataset.v;
    a.inicioCirugia = val('acIniCx');       a.finCirugia = val('acFinCx');
    a.ingreso = val('acIngreso');           a.inicioAnestesia = val('acIniAnest');
    a.finAnestesia = val('acFinAnest');     a.salida = val('acSalida');
    a.tecnicas = $$('#acTecnicas .tec.on').map(b => b.dataset.tec);
    a.tecnicaDetalle = val('acTecDet');
    const d = $('#acVaDificil button.on');
    a.vaDificil = d ? d.dataset.v : 'no';
    a.dispositivo = val('acDisp'); a.tamano = val('acTam');
    a.cormack = val('acCormack');  a.intentos = val('acIntentos');
    a.monitor = leerChks('acMonitor'); a.monitorExtra = leerChks('acMonitorExtra');
    a.accesos = val('acAccesos');
    a.oms = leerChks('acOMS');
    a.equipo = {
      cirujano: val('acCirujano'), cirujanoMP: val('acCirujanoMP'),
      ayudante: val('acAyudante'), instrumentador: val('acInstrumentador'),
      anestesista2: val('acAnestesista2'), circulante: val('acCircTecnico')
    };
    a.observaciones = val('acObs');
  }
  if(solapaActo === 'drogas' && $('#acDrogasNota')){
    a.drogasNota = val('acDrogasNota');
  }
  if(solapaActo === 'balance' && $('#bal_cristaloides')){
    const b = {};
    BALANCE_INGRESOS.concat(BALANCE_EGRESOS).forEach(x => b[x.k] = val('bal_'+x.k));
    a.balance = b;
    a.hemoderivados = val('acHemo'); a.vasoactivos = val('acVaso');
  }
  if(solapaActo === 'eventos' && $('#evSin')){
    a.sinEventos = chk('evSin') && !a.eventos2.length;
  }
  /* resumen numerico que consumen las estadisticas y el documento */
  const bal = calcularBalance(a.balance);
  a.balanceTotal = bal.balance;
  a.sangrado = Number(a.balance.sangrado) || 0;
  a.cristaloides = Number(a.balance.cristaloides) || 0;
  a.diuresis = Number(a.balance.diuresis) || 0;
  a.eventos = a.eventos2.length ? a.eventos2.map(e => e.tipo) : (a.sinEventos ? ['Sin eventos'] : []);
  return a;
}
