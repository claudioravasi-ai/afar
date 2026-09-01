/* =========================================================================
   PRECARGA ABIERTA — EL PACIENTE QUE SE ANOTA SOLO
   =========================================================================
   QUE ES Y EN QUE SE DIFERENCIA DEL PORTAL POR INVITACION

   El portal de paciente-portal.js es POR INVITACION: el anestesiologo emite
   el enlace, asi que cada entrada esta avalada por un profesional y colgada
   de una ficha que ya existe. Sirve para el paciente que la app ya conoce.

   Esto es lo contrario y resuelve el caso de antes: la persona que saco turno
   en una institucion y todavia no existe en ningun lado. Entra sola a una
   direccion publica, deja sus datos, dice cuando y donde se hace el
   prequirurgico, y saca una foto del ticket del turno. Eso aterriza en una
   bandeja de la app y el anestesiologo que atiende ese dia lo toma.

   LAS TRES DECISIONES QUE SOSTIENEN ESTO

   1. NO HAY CUENTAS NI CONTRASENAS. Es un formulario que se llena una vez.
      Una cuenta para eso es puro costo: contrasenas olvidadas, recuperacion,
      y una linea de soporte que la asociacion no tiene. Se entra con un
      ENLACE que llega por mail.

      Descartado a proposito el codigo de seis digitos: un codigo que genera
      el navegador del paciente y que despues ese mismo navegador verifica no
      prueba nada, se saltea sin esfuerzo. El enlace SI prueba, porque solo
      llega a la casilla: si lo abrio, el correo es suyo. Misma verificacion
      de identidad, sin nada que chequear del lado del servidor.

   2. NO ES UN PADRON, ES UNA AGENDA. Se piden dia, hora e institucion, asi
      que la pantalla util no es una lista alfabetica de toda la provincia:
      es «quienes vienen el martes al HRU». El anestesiologo que atiende los
      martes en el HRU quiere ver su martes. Y de paso resuelve solo a quien
      le toca cada paciente: toma los de su turno.

   3. EL TICKET DEL TURNO ES EL ANCLA DE CONFIANZA. No es un adjunto
      decorativo: es la prueba de que esa persona realmente saco turno. Una
      precarga con ticket y una sin ticket no valen lo mismo y la bandeja las
      muestra distinto. Con eso se cae casi todo el problema de abuso, que es
      el precio de tener una puerta abierta a internet.

   LO QUE EL PACIENTE ESCRIBE NO ES HISTORIA CLINICA

   Igual que en el portal por invitacion, y por el mismo motivo: una historia
   clinica la escribe un profesional. Lo que llega es una PROPUESTA. El
   anestesiologo la revisa, decide que incorpora, y recien ahi nace el
   paciente en el padron. Ver tomarPrecarga().

   ADEMAS: ESTO ES UNA DECLARACION, NO UN SISTEMA DE TURNOS

   El paciente dice que viene el martes. La institucion no confirmo nada y el
   turno se puede mover. La bandeja es una ayuda para prepararse, no la
   fuente de verdad de quien viene. Por eso nada se agenda solo.

   POR DONDE VIAJA
   Rama `afar-precargas`, colgada de la RAIZ, al lado de `afar` y de
   `afar-prellenado`. Reglas en reglas-firebase.txt.
   ========================================================================= */

const PRECARGA_RAIZ      = 'afar-precargas';
const PRECARGA_DIAS      = 45;   /* vida del enlace */
const PRECARGA_PURGA     = 15;   /* dias despues del turno sin que nadie la tome */
const PRECARGA_TICKET_PX = 1400; /* lado mayor de la foto del ticket */

let precargaActual = null;
let precargaPaso   = 'entrada';  /* entrada | enviado | datos | salud | turno | fin */
let precargaSel    = null;
let precargaTicket = null;       /* dataURL de la foto, mientras se completa */

function refPrecarga(token){
  return (fbDb && token) ? fbDb.ref(PRECARGA_RAIZ + '/' + token) : null;
}

function tokenDeLaUrlPrecarga(){
  const m = String(location.hash || '').match(/^#pre=([a-z0-9]{20,64})$/i);
  return m ? m[1] : '';
}

function esModoPrecarga(){
  return !!tokenDeLaUrlPrecarga() || /^#precarga$/i.test(String(location.hash || ''));
}

function urlPrecarga(token){
  return location.origin + location.pathname + (token ? '#pre=' + token : '#precarga');
}

/* =========================================================================
   LADO PACIENTE
   ========================================================================= */

function arrancarPrecarga(){
  const cont = $('#portalPaciente');
  const auth = $('#pantallaAuth'), app = $('#app');
  if(auth) auth.style.display = 'none';
  if(app)  app.style.display  = 'none';
  cont.style.display = 'block';

  const token = tokenDeLaUrlPrecarga();

  if(!token){                       /* llegó a #precarga, todavía sin enlace */
    precargaActual = null; precargaPaso = 'entrada'; pintarPrecarga();
    return;
  }

  cont.innerHTML = cascaraPrecarga(
    '<div class="portal-cargando">' + ico('nube') + ' Buscando su formulario…</div>');

  if(!fbDb) return errorPrecarga('Esta página necesita conexión con el servidor de la '+
    'asociación y no la encuentra. Probá de nuevo en unos minutos.');

  identificarseEnLaNube()
    .then(() => refPrecarga(token).once('value'))
    .then(sn => {
      const d = sn.val();
      if(!d) return errorPrecarga('Este enlace no es válido o ya fue dado de baja. '+
        'Podés empezar de nuevo desde la página de precarga.');
      if(d.vence && d.vence < hoyISO()) return errorPrecarga('Este enlace venció el ' +
        fFecha(d.vence) + '. Empezá de nuevo y te mandamos uno nuevo.');

      precargaActual = d;
      precargaTicket = d.ticket || null;
      const s = d.salud || {};
      precargaSel = {
        antecedentes: (s.antecedentes || []).slice(),
        quirurgicos:  (s.quirurgicos  || []).slice(),
        anestesicos:  (s.anestesicos  || []).slice(),
        familiares:   (s.familiares   || []).slice(),
        medicacion:   (s.medicacion   || []).slice(),
        alergias:     (s.alergias     || []).slice()
      };
      /* Una precarga ya enviada se puede volver a abrir con el mismo enlace y
         corregir, MIENTRAS nadie la haya tomado. Cuando un anestesiólogo la
         toma pasa a ser historia clínica y deja de ser del paciente: los
         cambios los hace el profesional en la consulta. */
      precargaPaso = (d.estado === 'tomada') ? 'fin' : 'datos';
      pintarPrecarga();
    })
    .catch(e => {
      console.warn('precarga', e);
      errorPrecarga('No se pudo abrir su formulario. Puede ser un problema de conexión. '+
        'Probá de nuevo en unos minutos.');
    });
}

function cascaraPrecarga(cuerpo, pie){
  return ''+
  '<div class="portal">'+
    '<header class="portal-top">'+
      '<img src="' + (typeof LOGO_AFAAR === 'string' ? LOGO_AFAAR : '') + '" alt="" class="portal-logo">'+
      '<div><div class="marca">AFAAR</div>'+
        '<div class="sub">Asociación Fueguina de Anestesia, Analgesia y Reanimación</div></div>'+
    '</header>'+
    '<main class="portal-cuerpo">' + cuerpo + '</main>'+
    (pie ? '<div class="portal-pie">' + pie + '</div>' : '')+
    '<footer class="portal-legal">'+
      'Sus datos de salud reciben tratamiento confidencial y se usan únicamente con fines '+
      'asistenciales (Ley 25.326 de Protección de Datos Personales y Ley 17.132 del Ejercicio '+
      'de la Medicina). Los ve el anestesiólogo/a que lo va a valorar y nadie más.'+
    '</footer>'+
  '</div>';
}

function errorPrecarga(msg){
  $('#portalPaciente').innerHTML = cascaraPrecarga(
    '<div class="aviso danger">' + ico('alerta') + '<div>' + esc(msg) + '</div></div>'+
    '<div class="btn-row mt14"><a class="btn ghost" href="' + esc(urlPrecarga('')) + '" '+
      'onclick="setTimeout(function(){location.reload()},10)">' + ico('atras') +
      ' Empezar de nuevo</a></div>');
}

function pintarPrecarga(){
  const cont = $('#portalPaciente');
  if(precargaPaso === 'entrada')      cont.innerHTML = cascaraPrecarga(htmlPrecargaEntrada());
  else if(precargaPaso === 'enviado') cont.innerHTML = cascaraPrecarga(htmlPrecargaEnviado());
  else if(precargaPaso === 'fin')     cont.innerHTML = cascaraPrecarga(htmlPrecargaFin());
  else {
    const html = precargaPaso === 'datos' ? htmlPrecargaDatos()
               : precargaPaso === 'salud' ? htmlPrecargaSalud()
               : htmlPrecargaTurno();
    cont.innerHTML = cascaraPrecarga(html, piePrecarga());
    if(precargaPaso === 'datos')      cablearPrecargaDatos();
    else if(precargaPaso === 'salud') cablearPrecargaSalud();
    else                              cablearPrecargaTurno();
  }
  if(precargaPaso === 'entrada') cablearPrecargaEntrada();
  window.scrollTo(0, 0);
}

function pasosPrecarga(actual){
  const l = [['datos','1 · Sus datos'], ['salud','2 · Su salud'], ['turno','3 · Su turno']];
  const i = l.findIndex(x => x[0] === actual);
  return '<div class="portal-pasos">' + l.map((x, j) =>
    '<span class="' + (j === i ? 'on' : (j < i ? 'hecho' : '')) + '">' + esc(x[1]) + '</span>')
    .join('') + '</div>';
}

function piePrecarga(){
  const enDatos = precargaPaso === 'datos';
  const enTurno = precargaPaso === 'turno';
  return '<div class="portal-nav">'+
    (enDatos ? '<span></span>'
             : '<button class="btn ghost" id="preAtras">' + ico('atras') + ' Volver</button>')+
    (enTurno
      ? '<button class="btn pri grande" id="preFinalizar">' + ico('check') + ' FINALIZADO</button>'
      : '<button class="btn pri grande" id="preSiguiente">Siguiente ' +
        ico('flecha').replace('<svg', '<svg style="transform:rotate(-90deg)"') + '</button>')+
  '</div>';
}

/* ------------------------------------------------- Pantalla de entrada */
function htmlPrecargaEntrada(){
  return ''+
  '<h1>Complete su ficha antes de la consulta prequirúrgica</h1>'+
  '<p class="portal-intro">Si le dieron turno para una <b>consulta prequirúrgica</b> con un '+
    'anestesiólogo/a de la AFAAR, puede dejar sus datos acá y llegar con la ficha hecha. '+
    'La consulta se dedica entonces a lo importante y no a copiar datos.</p>'+

  '<div class="card plano"><h3>' + ico('correo') + 'Empecemos</h3>'+
    '<div class="ayuda">Le vamos a mandar un enlace a su correo. Con ese enlace completa la '+
      'ficha, y si tiene que dejarla por la mitad puede volver con el mismo enlace más tarde.</div>'+
    '<div class="grid c2">'+
      campoTxt('preDni','Su DNI', '')+
      campoTxt('preEmail','Su correo electrónico', '')+
    '</div>'+
    '<div class="btn-row mt14">'+
      '<button class="btn pri grande" id="prePedir">' + ico('correo') +
        ' Enviarme el enlace</button>'+
    '</div>'+
    '<div class="ayuda">Revise que el correo esté bien escrito: es a donde llega el enlace. '+
      'Si no tiene casilla propia, puede usar la de un familiar.</div>'+
  '</div>'+

  '<div class="aviso info">' + ico('info') + '<div><b>Esto no reemplaza la consulta ni reserva '+
    'ningún turno.</b> El turno lo saca en la institución como siempre. Esto es sólo para que el '+
    'anestesiólogo/a lo reciba con su ficha ya empezada.</div></div>';
}

function cablearPrecargaEntrada(){
  $('#prePedir').onclick = () => {
    const dni = val('preDni').replace(/\D/g, '');
    const email = val('preEmail').trim();
    if(dni.length < 6)     return toast('Revisá el DNI: escribilo sin puntos.', 'err');
    if(!mailValido(email)) return toast('Revisá el correo: no tiene forma de dirección válida.', 'err');
    if(!envioConfigurado())
      return toast('El envío de correos no está disponible en este momento.', 'err');
    if(!fbDb) return toast('Sin conexión con el servidor. Probá en unos minutos.', 'err');

    const b = $('#prePedir');
    b.disabled = true; b.textContent = 'Enviando…';

    const token = tokenPrellenado();          /* mismo generador que el portal */
    const pedido = {
      token, dni, email, estado:'borrador',
      creado: new Date().toISOString(),
      vence: fechaMasDias(hoyISO(), PRECARGA_DIAS),
      datos: { dni, email }
    };

    identificarseEnLaNube()
      .then(() => refPrecarga(token).set(pedido))
      .then(() => fetch(ENVIO_URL, {
        method:'POST', redirect:'follow',
        body: JSON.stringify({
          clave: ENVIO_CLAVE, para: email,
          nombre: typeof ENVIO_NOMBRE !== 'undefined' ? ENVIO_NOMBRE : 'AFAAR',
          asunto: 'Su enlace para completar la ficha prequirúrgica',
          html: htmlMailPrecarga(urlPrecarga(token))
        })
      }))
      .then(r => r.json())
      .then(res => {
        if(!res || !res.ok) throw new Error((res && res.error) || 'sin respuesta');
        precargaActual = pedido; precargaPaso = 'enviado'; pintarPrecarga();
      })
      .catch(e => {
        console.warn('precarga', e);
        b.disabled = false; b.innerHTML = ico('correo') + ' Enviarme el enlace';
        toast('No se pudo enviar el enlace. Revisá el correo y probá otra vez.', 'err');
      });
  };
}

function htmlPrecargaEnviado(){
  const mail = (precargaActual && precargaActual.email) || 'su correo';
  return ''+
  '<div class="portal-fin">' + ico('correo') +
    '<h1>Revise su correo</h1>'+
    '<p>Le mandamos un enlace a <b>' + esc(mail) + '</b>. Ábralo desde el teléfono o la '+
      'computadora y complete su ficha.</p>'+
    '<p class="mini">Si no lo ve en unos minutos, fíjese en la carpeta de <b>correo no '+
      'deseado</b>. El enlace vale ' + PRECARGA_DIAS + ' días y lo puede abrir las veces que '+
      'necesite: si deja la ficha por la mitad, vuelve con el mismo enlace.</p>'+
  '</div>';
}

/* ---------------------------------------------- Paso 1: sus datos */
function htmlPrecargaDatos(){
  return pasosPrecarga('datos')+
  '<h1>Sus datos</h1>'+
  '<p class="portal-intro">Complete con tranquilidad. Lo que escriba <b>no reemplaza la '+
    'consulta</b>: el anestesiólogo/a lo revisa con usted. Si duda de algo, déjelo vacío y '+
    'pregúntelo cuando lo atiendan.</p>'+
  htmlFormDatosPaciente(precargaActual.datos || {});
}

function cablearPrecargaDatos(){
  $('#preSiguiente').onclick = () => {
    precargaActual.datos = Object.assign({}, precargaActual.datos || {},
                                         leerFormDatosPaciente());
    const d = precargaActual.datos;
    if(!d.apellido || !d.nombre) return toast('Falta su apellido y su nombre.', 'err');
    if(!d.dni)                   return toast('Falta su DNI.', 'err');
    guardarBorradorPrecarga();
    precargaPaso = 'salud'; pintarPrecarga();
  };
}

/* ---------------------------------------------- Paso 2: su salud */
function htmlPrecargaSalud(){
  return pasosPrecarga('salud') +
         htmlFormSaludPaciente(precargaActual.salud || {}, precargaSel);
}

function cablearPrecargaSalud(){
  cablearFormSaludPaciente(precargaSel);
  $('#preAtras').onclick = () => {
    precargaActual.salud = leerFormSaludPaciente(precargaSel);
    guardarBorradorPrecarga(); precargaPaso = 'datos'; pintarPrecarga();
  };
  $('#preSiguiente').onclick = () => {
    precargaActual.salud = leerFormSaludPaciente(precargaSel);
    guardarBorradorPrecarga(); precargaPaso = 'turno'; pintarPrecarga();
  };
}

/* ---------------------------------------------- Paso 3: su turno
   Es el paso que no existe en el portal por invitacion, porque alli el turno
   ya lo sabe el anestesiologo. Aca es lo que convierte una lista de nombres
   en una agenda, y la foto del ticket es lo que hace creible el resto. */
function htmlPrecargaTurno(){
  const t = precargaActual.turno || {};
  return pasosPrecarga('turno')+
  '<h1>Su turno</h1>'+
  '<p class="portal-intro">Díganos cuándo y dónde le dieron la consulta prequirúrgica, para que '+
    'el anestesiólogo/a que atiende ese día lo tenga en su lista.</p>'+

  '<div class="card plano"><h3>' + ico('calendario') + 'Cuándo y dónde</h3>'+
    '<div class="campo"><label>Institución donde lo van a atender</label>'+
      '<select id="preInst"><option value="">— Elegir —</option>'+
      instituciones().map(i => '<option value="' + esc(i.id) + '"' +
        (t.inst === i.id ? ' selected' : '') + '>' + esc(i.nombre) + ' (' + esc(i.ciudad) +
        ')</option>').join('')+
      '</select></div>'+
    '<div class="grid c2">'+
      campoFecha('preFecha','Día de la consulta', t.fecha)+
      '<div class="campo"><label>Hora</label>'+
        '<input type="time" id="preHora" value="' + esc(t.hora || '') + '"></div>'+
    '</div>'+
    campoTxt('preMotivo','¿Para qué cirugía? (si lo sabe)', t.motivo)+
  '</div>'+

  '<div class="card plano"><h3>' + ico('camara') + 'La foto de su ticket del turno</h3>'+
    '<div class="ayuda">Sáquele una foto al comprobante del turno, o adjunte el archivo si se lo '+
      'mandaron por mail. <b>Es lo que nos permite confirmar que su turno es real</b>, así que es '+
      'la parte más importante de esta pantalla.</div>'+
    '<div id="preTicketBox"></div>'+
    '<div class="btn-row mt8">'+
      '<label class="btn ghost" for="preTicketFile">' + ico('camara') +
        ' Sacar foto o elegir archivo</label>'+
      '<input type="file" id="preTicketFile" accept="image/*" capture="environment" '+
        'style="position:absolute;width:1px;height:1px;opacity:0">'+
    '</div>'+
  '</div>'+

  '<div class="aviso info">' + ico('info') + '<div>Si todavía no tiene el ticket a mano, puede '+
    'finalizar igual y volver más tarde con el mismo enlace para agregarlo.</div></div>';
}

function cablearPrecargaTurno(){
  pintarTicketPrecarga();

  $('#preTicketFile').onchange = e => {
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    toast('Procesando la foto…');
    comprimirImagen(f, PRECARGA_TICKET_PX, 0.7)
      .then(dataUrl => {
        precargaTicket = dataUrl;
        pintarTicketPrecarga();
        toast('Foto lista.', 'ok');
      })
      .catch(err => toast(err.message || 'No se pudo procesar la foto.', 'err'));
  };

  $('#preAtras').onclick = () => {
    leerPrecargaTurno(); guardarBorradorPrecarga();
    precargaPaso = 'salud'; pintarPrecarga();
  };
  $('#preFinalizar').onclick = finalizarPrecarga;
}

function pintarTicketPrecarga(){
  const c = $('#preTicketBox'); if(!c) return;
  c.innerHTML = precargaTicket
    ? '<div class="ticket-previa"><img src="' + precargaTicket + '" alt="Ticket del turno">'+
      '<button type="button" class="btn ghost chico" id="preTicketQuitar">' + ico('borrar') +
      ' Sacar esta foto</button></div>'
    : '<div class="aviso warn">' + ico('camara') + '<div>Todavía no adjuntó el ticket.</div></div>';
  if($('#preTicketQuitar')) $('#preTicketQuitar').onclick = () => {
    precargaTicket = null; pintarTicketPrecarga();
  };
}

function leerPrecargaTurno(){
  precargaActual.turno = {
    inst:   val('preInst'),
    fecha:  val('preFecha'),
    hora:   val('preHora'),
    motivo: val('preMotivo')
  };
}

/* El borrador se guarda al pasar de pantalla: si cierra el teléfono a la
   mitad, vuelve con el mismo enlace y encuentra lo cargado. */
function guardarBorradorPrecarga(){
  if(!precargaActual || !fbDb) return Promise.resolve();
  return refPrecarga(precargaActual.token).update({
    datos: precargaActual.datos || {},
    salud: precargaActual.salud || {},
    turno: precargaActual.turno || {},
    ticket: precargaTicket || null,
    tocado: new Date().toISOString()
  }).catch(e => console.warn('borrador precarga', e));
}

function finalizarPrecarga(){
  leerPrecargaTurno();
  const t = precargaActual.turno;
  if(!t.inst)  return toast('Elegí la institución donde te van a atender.', 'err');
  if(!t.fecha) return toast('Falta el día de la consulta.', 'err');

  confirmar('Enviar su ficha',
    '<p>Se envía a los anestesiólogos de la AFAAR que atienden en <b>' +
      esc(nombreInstitucion(t.inst)) + '</b> el <b>' + fFecha(t.fecha) + '</b>.</p>'+
    (precargaTicket ? '' :
      '<p style="background:#fff8e6;border:1px solid #e6d08a;border-radius:8px;padding:10px 12px">'+
      '<b>No adjuntó la foto del ticket.</b> Puede enviarla igual, pero con el ticket es mucho '+
      'más fácil confirmar su turno. Si lo tiene a mano, vuelva y sáquele una foto.</p>')+
    '<p>Va a poder volver con el mismo enlace y corregir lo que haga falta, <b>hasta que un '+
      'anestesiólogo/a tome su ficha</b>. A partir de ahí los cambios se los dice a él en la '+
      'consulta.</p>'+
    '<p>Revise sobre todo <b>los remedios que toma y las alergias</b>: son los dos datos que más '+
      'cambian el manejo de su anestesia.</p>',
    () => {
      toast('Enviando…');
      refPrecarga(precargaActual.token).update({
        datos: precargaActual.datos || {},
        salud: precargaActual.salud || {},
        turno: t,
        ticket: precargaTicket || null,
        conTicket: !!precargaTicket,
        /* Denormalizados para que la bandeja pueda ordenar y agrupar sin
           tener que abrir cada precarga entera. */
        inst: t.inst, fecha: t.fecha, hora: t.hora || '',
        apellido: (precargaActual.datos || {}).apellido || '',
        nombre:   (precargaActual.datos || {}).nombre || '',
        estado: 'enviada',
        enviada: new Date().toISOString(),
        purga: fechaMasDias(t.fecha, PRECARGA_PURGA)
      })
      .then(() => { precargaActual.estado = 'enviada'; precargaPaso = 'fin'; pintarPrecarga(); })
      .catch(e => {
        console.warn('finalizar precarga', e);
        toast('No se pudo enviar. Revisá la conexión y probá otra vez.', 'err');
      });
    }, 'Enviar mi ficha');
}

function htmlPrecargaFin(){
  const t = (precargaActual && precargaActual.turno) || {};
  const tomada = precargaActual && precargaActual.estado === 'tomada';
  return ''+
  '<div class="portal-fin">' + ico('check') +
    '<h1>FINALIZADO</h1>'+
    '<p>Su ficha quedó enviada' +
      (t.inst ? ' a <b>' + esc(nombreInstitucion(t.inst)) + '</b>' : '') +
      (t.fecha ? ' para el <b>' + fFecha(t.fecha) + '</b>' : '') + '.</p>'+
    (tomada
      ? '<p class="mini">Un anestesiólogo/a ya la tomó y la va a revisar con usted en la '+
        'consulta. Si necesita corregir algo, dígaselo ahí.</p>'
      : '<p class="mini">Puede volver con el mismo enlace y corregir lo que haga falta hasta que '+
        'un anestesiólogo/a la tome.</p>')+
    '<div class="aviso warn" style="text-align:left;margin-top:18px">' + ico('alerta') +
      '<div><b>Presentese igual el día del turno.</b> Esto no reserva ni confirma ningún turno: '+
      'el turno es el que le dio la institución. Y <b>no suspenda ni empiece ningún medicamento '+
      'por su cuenta</b>: eso se lo indica el anestesiólogo/a después de la consulta.</div></div>'+
  '</div>';
}

/* ------------------------------------------------ El mail del enlace */
function htmlMailPrecarga(enlace){
  return ''+
  '<div style="font-family:Calibri,Arial,sans-serif;font-size:15px;color:#111;'+
    'line-height:1.6;max-width:760px;margin:0 auto">'+
    '<p>Hola,</p>'+
    '<p>Pediste el enlace para completar tu ficha antes de la <b>consulta prequirúrgica</b> con '+
    'un anestesiólogo/a de la AFAAR. Es este:</p>'+
    '<div style="text-align:center;margin:26px 0">'+
      '<a href="' + esc(enlace) + '" style="display:inline-block;background:#0b2545;color:#fff;'+
        'text-decoration:none;font-size:16px;font-weight:bold;padding:14px 30px;border-radius:8px">'+
        'Completar mi ficha</a>'+
      '<div style="font-size:12px;color:#556;margin-top:10px">Se abre en el teléfono o en la '+
        'computadora. No hace falta instalar nada ni crear ninguna cuenta.</div>'+
    '</div>'+
    '<p>Tené a mano <b>las cajas de los remedios que tomás</b> y <b>el ticket del turno</b>: te '+
    'vamos a pedir una foto, y es lo que nos permite confirmar que tu turno es real.</p>'+
    '<div style="background:#eef4fa;border-radius:8px;padding:12px 14px;margin:18px 0">'+
      'Podés dejarlo por la mitad y volver con este mismo enlace. Vale ' + PRECARGA_DIAS +
      ' días.</div>'+
    '<div style="background:#fdeeee;border:1px solid #e0a8a8;border-radius:8px;padding:12px 14px;margin:18px 0">'+
      '<b>Este enlace es tuyo.</b> No lo reenvíes: cualquiera que lo tenga puede escribir en tu '+
      'ficha.</div>'+
    '<div style="background:#fff8e6;border:1px solid #e6d08a;border-radius:8px;padding:12px 14px;margin:18px 0">'+
      '<b>Si no pediste esto, ignorá el mensaje.</b> No se creó ninguna cuenta a tu nombre y sin '+
      'abrir el enlace no queda nada cargado.</div>'+
    '<p>Saludos,<br><b>AFAAR</b><br>Asociación Fueguina de Anestesia, Analgesia y Reanimación</p>'+
    '<hr style="border:0;border-top:1px solid #ccd;margin:26px 0 14px">'+
    '<div style="font-size:11.5px;color:#455;line-height:1.55">'+
      '<b style="color:#0b2545">PROTECCIÓN DE DATOS</b>'+
      '<p>Los datos de salud que cargues reciben tratamiento confidencial y se usan únicamente '+
      'con fines asistenciales (Ley 25.326). Los ve el anestesiólogo/a que te va a valorar. '+
      'Podés acceder a ellos, pedir su rectificación y conocer su destino.</p>'+
      '<p>Esto <b>no reserva ni confirma ningún turno</b>: el turno es el que te dio la '+
      'institución.</p>'+
    '</div>'+
  '</div>';
}

/* =========================================================================
   LADO ANESTESIOLOGO — LA BANDEJA
   -------------------------------------------------------------------------
   No es una lista alfabetica del padron: es una AGENDA. Se agrupa por
   institucion y por dia, porque el anestesiologo que atiende los martes en el
   HRU quiere ver su martes, no a toda la provincia ordenada por apellido.
   ========================================================================= */

let PRECARGAS = {};          /* lo que se leyo de la rama, en memoria */
let escuchaPrecargas = null;

function suscribirPrecargas(){
  if(!fbDb || escuchaPrecargas) return;
  escuchaPrecargas = fbDb.ref(PRECARGA_RAIZ);
  escuchaPrecargas.on('value', sn => {
    const d = sn.val() || {};
    /* Los borradores no se muestran: es gente que pidio el enlace y todavia
       no completo nada. Mostrarlos seria una lista de nombres a medio
       escribir que no le sirve a nadie. */
    PRECARGAS = {};
    Object.keys(d).forEach(k => {
      if(d[k] && (d[k].estado === 'enviada' || d[k].estado === 'tomada')) PRECARGAS[k] = d[k];
    });
    if($('#vPacientes') && $('#vPacientes').classList.contains('on') && alcancePac === 'precargas')
      vistaPacientes();
  }, e => console.warn('precargas', e));
}

function precargasPendientes(){
  return Object.values(PRECARGAS).filter(p => p.estado === 'enviada');
}

/* Agrupadas por institucion y dia, que es como se trabaja */
function agendaDePrecargas(){
  const g = {};
  precargasPendientes().forEach(p => {
    const k = (p.inst || 'sin') + '|' + (p.fecha || '');
    (g[k] = g[k] || { inst:p.inst, fecha:p.fecha, l:[] }).l.push(p);
  });
  return Object.values(g)
    .map(x => { x.l.sort((a,b) => (a.hora||'').localeCompare(b.hora||'')); return x; })
    .sort((a,b) => (a.fecha || '9999').localeCompare(b.fecha || '9999') ||
                   nombreInstitucion(a.inst).localeCompare(nombreInstitucion(b.inst), 'es'));
}

function htmlBandejaPrecargas(){
  const grupos = agendaDePrecargas();
  const hoy = hoyISO();

  if(!grupos.length)
    return '<div class="vacio">' + ico('calendario') + '<b>No hay pacientes precargados</b>'+
      '<span>Acá aparecen los pacientes que completaron su ficha por su cuenta antes de la '+
      'consulta prequirúrgica, agrupados por institución y por día.</span></div>';

  return ''+
  '<div class="aviso info">' + ico('info') + '<div><b>Esto lo cargó el paciente, no un '+
    'profesional.</b> Es una <b>declaración</b>, no un turno confirmado: la institución no '+
    'validó nada y el turno se puede mover. Al tomar uno, revisás lo que cargó y recién ahí entra '+
    'a su historia clínica.</div></div>'+

  '<div class="agenda-pre">' + grupos.map(g => {
    const pasado = g.fecha && g.fecha < hoy;
    return '<div class="agenda-dia' + (pasado ? ' pasado' : '') + '">'+
      '<div class="agenda-cab">'+
        '<div><b>' + esc(g.fecha ? fFechaLarga(g.fecha) : 'Sin fecha') + '</b>'+
          '<div class="mini">' + esc(nombreInstitucion(g.inst)) + '</div></div>'+
        '<span class="tag' + (pasado ? ' danger' : ' aqua') + '">' + g.l.length +
          (pasado ? ' sin tomar' : '') + '</span>'+
      '</div>'+
      g.l.map(p => {
        const yaEsta = lista('pacientes').find(x => x.dni && norm(x.dni) === norm(p.dni));
        return '<button type="button" class="agenda-item" data-pre="' + esc(p.token) + '">'+
          '<span class="hora">' + esc(p.hora || '—') + '</span>'+
          '<span class="quien"><b>' + esc((p.apellido || '') + ', ' + (p.nombre || '')) + '</b>'+
            '<span class="mini">DNI ' + esc(p.dni || '—') +
            ((p.turno || {}).motivo ? ' · ' + esc(p.turno.motivo) : '') + '</span></span>'+
          '<span class="sellos">'+
            (p.conTicket
              ? '<span class="tag ok" title="Adjuntó la foto del ticket del turno">' +
                ico('camara') + ' Ticket</span>'
              : '<span class="tag warn" title="No adjuntó comprobante del turno">Sin ticket</span>')+
            (yaEsta ? '<span class="tag" title="Ya existe en el padrón con ese DNI">En el padrón</span>' : '')+
          '</span>'+
        '</button>';
      }).join('')+
    '</div>';
  }).join('') + '</div>';
}

function cablearBandejaPrecargas(){
  $$('#vPacientes [data-pre]').forEach(b => b.onclick = () => abrirPrecarga(b.dataset.pre));
}

/* ------------------------------------------- Ver una y tomarla */
function abrirPrecarga(token){
  const p = PRECARGAS[token];
  if(!p) return toast('Esa precarga ya no está disponible.', 'warn');
  const s = p.salud || {}, d = p.datos || {}, t = p.turno || {};
  const yaEsta = lista('pacientes').find(x => x.dni && norm(x.dni) === norm(p.dni));

  const fila = (k, v) => v ? '<div class="par"><span class="k">' + esc(k) + '</span>'+
    '<span class="v">' + esc(v) + '</span></div>' : '';
  const l = a => (a || []).join(' · ');

  abrirModal('Precarga de ' + esc((d.apellido || '') + ', ' + (d.nombre || '')),
    '<div class="aviso warn">' + ico('alerta') + '<div><b>Lo escribió el paciente.</b> Al tomarlo '+
      'vas a poder revisar campo por campo qué incorporás a su historia clínica.</div></div>'+

    '<div class="hist-lista">'+
      fila('Turno declarado', (t.fecha ? fFecha(t.fecha) : '') + (t.hora ? ' · ' + t.hora : '') +
                              (t.inst ? ' · ' + nombreInstitucion(t.inst) : ''))+
      fila('Para', t.motivo)+
      fila('DNI', d.dni) + fila('Nacimiento', d.fechaNac ? fFecha(d.fechaNac) : '')+
      fila('Sexo', d.sexo) + fila('Peso / talla',
        [d.peso ? d.peso + ' kg' : '', d.talla ? d.talla + ' cm' : ''].filter(Boolean).join(' · '))+
      fila('Teléfono', d.telefono) + fila('Correo', d.email)+
      fila('Domicilio', [d.domicilio, d.localidad].filter(Boolean).join(', '))+
      fila('Antecedentes', l(s.antecedentes) || (s.antecedentesOtros ? '—' : ''))+
      fila('Otros', s.antecedentesOtros)+
      fila('Cirugías previas', l(s.quirurgicos))+
      fila('Anestesias previas', l(s.anestesicos))+
      fila('En la familia', l(s.familiares))+
      fila('Medicación', (s.medicacion || []).map(m =>
        (m.n || m) + (m.dosis ? ' (' + m.dosis + ')' : '')).join(' · '))+
      fila('Otra medicación', s.medicacionOtros)+
      fila('Alergias', l(s.alergias)) + fila('Detalle', s.alergiaDetalle)+
      fila('Hábitos', [
        (s.habitos || {}).tabaco && 'Tabaco: ' + s.habitos.tabaco,
        (s.habitos || {}).alcohol && 'Alcohol: ' + s.habitos.alcohol,
        (s.habitos || {}).drogas && 'Sustancias: ' + s.habitos.drogas,
        (s.habitos || {}).actividad && 'Actividad: ' + s.habitos.actividad
      ].filter(Boolean).join(' · '))+
    '</div>'+

    '<h4 class="mini strong mt14">Ticket del turno</h4>'+
    (p.ticket
      ? '<img src="' + p.ticket + '" alt="Ticket del turno" class="ticket-grande">'
      : '<div class="aviso warn">' + ico('alerta') + '<div><b>No adjuntó el ticket.</b> No hay '+
        'comprobante de que el turno exista. Confirmalo antes de preparar nada.</div></div>')+

    (yaEsta
      ? '<div class="aviso info mt14">' + ico('pacientes') + '<div><b>Ya hay un paciente con ese '+
        'DNI en el padrón:</b> ' + esc(yaEsta.apellido + ', ' + yaEsta.nombre) + '.<br>'+
        'Al tomarlo se <b>suma</b> a esa historia, no se crea un paciente nuevo.</div></div>'
      : ''),

    '<button class="btn ghost" data-cerrar>Cerrar</button>'+
    '<button class="btn pri" id="preTomar">' + ico('check') + ' Tomar este paciente</button>');

  $('#preTomar').onclick = () => tomarPrecarga(token);
}

/* -------------------------------------------------------- Tomarla
   Tres cosas pasan acá, y el orden importa:

   1. Se resuelve QUIEN es. Si ya hay un paciente con ese DNI en el padron, se
      suma a esa historia; no se crea uno nuevo. Sin esto el padron se llena
      de duplicados, que es exactamente el problema que el padron existe para
      evitar.
   2. Se revisa campo por campo. Lo que escribio el paciente no entra solo.
   3. Recien despues se abre la ficha y arranca el recorrido normal de la app.
--------------------------------------------------------------------------- */
function tomarPrecarga(token){
  const pre = PRECARGAS[token];
  if(!pre) return toast('Esa precarga ya no está disponible.', 'warn');
  const d = pre.datos || {};

  const existente = lista('pacientes').find(x => x.dni && norm(x.dni) === norm(pre.dni));
  const nuevo = !existente;

  /* El paciente destino. Si es nuevo todavía no se guarda: se guarda dentro
     de incorporarDatosDePaciente(), con lo que el profesional haya tildado. */
  const p = existente || {
    id: uid('pac'), ownerUid: SESION.uid,
    creado: new Date().toISOString(),
    apellido: d.apellido || '', nombre: d.nombre || '', dni: pre.dni || d.dni || '',
    email: d.email || pre.email || '',
    antecedentes:[], antQuirurgicos:[], antAnestesicos:[], antFamiliares:[],
    medicacion:[], alergias:[], habitos:{}
  };

  cerrarModal();
  setTimeout(() => {
    abrirRevisionDatosPaciente(p, { datos:d, salud:pre.salud || {}, finalizado:pre.enviada },
      marcados => {
        const n = incorporarDatosDePaciente(p, { datos:d, salud:pre.salud || {} }, marcados);

        /* Un paciente nuevo tiene que quedar guardado aunque no se haya
           tildado nada: si no, se pierde la identidad y la precarga queda
           tomada apuntando a la nada. */
        if(nuevo && !DB.pacientes[p.id]){
          p.modificado = new Date().toISOString(); p.modificadoPor = SESION.uid;
          escribir('pacientes', p.id, p);
        }

        refPrecarga(token).update({
          estado:'tomada', tomadaPor:SESION.uid,
          tomadaEn:new Date().toISOString(), pacienteId:p.id
        }).catch(e => console.warn('tomar precarga', e));

        auditar('precarga-tomada',
          'Precarga tomada para ' + (p.apellido || '') + ', ' + (p.nombre || '') +
          ' — ' + n + ' dato(s) incorporados' + (nuevo ? ' (paciente nuevo)' : ' (ya estaba en el padrón)'));

        cerrarModal();
        toast((nuevo ? 'Paciente creado' : 'Datos sumados a su historia') +
              (n ? ' · ' + n + ' dato' + (n===1?'':'s') + ' incorporado' + (n===1?'':'s') : '') +
              '.', 'ok');

        /* El recorrido normal de la app arranca acá: se ofrece abrirle la
           ficha, que es a lo que se vino. */
        confirmar('Abrir su ficha',
          '<p><b>' + esc((p.apellido || '') + ', ' + (p.nombre || '')) + '</b> ya está en tu '+
          'padrón' + (nuevo ? '' : ' y sus datos quedaron actualizados') + '.</p>'+
          '<p>¿Le abrimos la ficha para hacerle la valoración prequirúrgica?</p>'+
          ((pre.turno || {}).motivo
            ? '<p class="mini">Declaró que es para: <b>' + esc(pre.turno.motivo) + '</b>.</p>'
            : ''),
          () => nuevaFichaPara(p.id, pre),
          'Abrir la ficha');
      });
  }, 180);
}

/* Abre una ficha nueva con lo poco que la precarga ya sabe. La institución
   se propone, no se impone: el paciente declaró dónde le dieron el turno y
   eso puede haber cambiado, así que queda editable como cualquier otro campo
   del paso Paciente. */
function nuevaFichaPara(pacienteId, pre){
  const t = (pre && pre.turno) || {};
  abrirFicha(null, pacienteId);
  if(fichaActual && t.inst && !fichaActual.institucion){
    fichaActual.institucion = t.inst;
    pintarFicha();
  }
}

/* ------------------------------------------------------------- Purga
   Una precarga que nadie tomo es historia clinica sin profesional
   responsable. Pasada la fecha del turno mas los dias de gracia, se borra
   sola. Lo hace el primero que entra a la bandeja: no hay servidor que lo
   haga solo y no hace falta uno. */
function purgarPrecargasVencidas(){
  if(!fbDb) return;
  const hoy = hoyISO();
  Object.values(PRECARGAS).forEach(p => {
    if(p.estado === 'tomada') return;
    if(!p.purga || p.purga >= hoy) return;
    refPrecarga(p.token).remove()
      .then(() => auditar('precarga-vencida',
        'Precarga sin tomar de ' + (p.apellido || '?') + ' borrada al vencer'))
      .catch(e => console.warn('purga', e));
  });
}
