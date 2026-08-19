/**
 * AFAAR — envío de documentación al paciente
 * =========================================================================
 * Este programa vive en script.google.com, NO en la app. Recibe el pedido de
 * la app y manda el mail desde la cuenta de Google de la asociación.
 *
 * ANTES DE IMPLEMENTAR: cambiá CLAVE_COMPARTIDA por una frase larga propia
 * (letras, números, unas 30 posiciones) y pegá esa MISMA frase en
 * src/email-config.js de la app.
 *
 * Implementar → Nueva implementación → Aplicación web
 *     Ejecutar como:      Yo
 *     Quién tiene acceso: Cualquier persona
 *
 * Cada vez que cambies este código hay que crear una implementación NUEVA
 * (o editar la existente y subir la versión) para que los cambios tomen efecto.
 */

/* ————————————————————————————————— Ajustes ————————————————————————————————— */

var CLAVE_COMPARTIDA = 'CAMBIAR-ESTA-FRASE-POR-UNA-LARGA-Y-PROPIA';

/* Tope de mails por día. Contiene el daño si alguien encuentra la clave en el
   código público de la app. Gmail gratuito permite 100 destinatarios diarios;
   dejamos margen para no agotar la cuota de la cuenta. */
var TOPE_DIARIO = 40;

/* Tamaño máximo del cuerpo del mail, por las dudas */
var TOPE_BYTES = 900000;

/* ————————————————————————————————— Envío ————————————————————————————————— */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder({ ok: false, error: 'Pedido vacío.' });
    }

    var d = JSON.parse(e.postData.contents);

    /* 1. Clave */
    if (!d.clave || d.clave !== CLAVE_COMPARTIDA) {
      registrar('RECHAZADO clave incorrecta', d.para || '(sin destinatario)');
      return responder({ ok: false, error: 'No autorizado.' });
    }

    /* 2. Datos mínimos */
    if (!d.para || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.para)) {
      return responder({ ok: false, error: 'Dirección de correo inválida.' });
    }
    if (!d.html || !d.asunto) {
      return responder({ ok: false, error: 'Falta el contenido del mensaje.' });
    }
    if (d.html.length > TOPE_BYTES) {
      return responder({ ok: false, error: 'El documento es demasiado grande.' });
    }

    /* 3. Tope diario propio */
    var usados = contarHoy();
    if (usados >= TOPE_DIARIO) {
      registrar('RECHAZADO tope diario alcanzado (' + usados + ')', d.para);
      return responder({ ok: false,
        error: 'Se alcanzó el tope de ' + TOPE_DIARIO + ' envíos por día.' });
    }

    /* 4. Cuota de Gmail de la propia cuenta */
    if (MailApp.getRemainingDailyQuota() < 1) {
      return responder({ ok: false,
        error: 'La cuenta de Google agotó su cuota diaria de correos.' });
    }

    /* 5. Enviar */
    var opciones = {
      to: d.para,
      subject: d.asunto,
      htmlBody: d.html,
      name: d.nombre || 'AFAAR'
    };
    if (d.responderA && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.responderA)) {
      opciones.replyTo = d.responderA;
    }
    MailApp.sendEmail(opciones);

    sumarHoy();
    registrar('ENVIADO ficha ' + (d.fichaId || '—') +
              ' por ' + (d.profesional || '—'), d.para);

    return responder({ ok: true, restantes: TOPE_DIARIO - (usados + 1) });

  } catch (err) {
    registrar('ERROR ' + err.message, '');
    return responder({ ok: false, error: String(err.message || err) });
  }
}

/* Si alguien abre la dirección en el navegador, que no muestre nada útil. */
function doGet() {
  return responder({ ok: false, error: 'Este servicio sólo recibe envíos.' });
}

/* ——————————————————————————— Contador diario ——————————————————————————— */

function claveDelDia() {
  return 'enviados_' + Utilities.formatDate(new Date(),
    Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function contarHoy() {
  var p = PropertiesService.getScriptProperties();
  return Number(p.getProperty(claveDelDia()) || 0);
}

function sumarHoy() {
  var p = PropertiesService.getScriptProperties();
  p.setProperty(claveDelDia(), String(contarHoy() + 1));
}

/* ——————————————————————————————— Registro ——————————————————————————————— */

/* Queda en Ejecuciones, dentro del editor de Apps Script. Sirve para revisar
   quién envió qué si alguna vez hay una sospecha de uso indebido. */
function registrar(que, aQuien) {
  console.log(Utilities.formatDate(new Date(), Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm:ss') + ' · ' + que + ' · ' + aQuien);
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ——————————————————————————————— Prueba ——————————————————————————————— */

/* Ejecutá esta función una vez desde el editor (botón Ejecutar) para que
   Google te pida los permisos de envío de correo. Te manda un mail de prueba
   a vos mismo. Sin esto, el primer envío real falla por falta de permisos. */
function pruebaDeEnvio() {
  var yo = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({
    to: yo,
    subject: 'AFAAR — prueba de configuración',
    htmlBody: '<p>Si estás leyendo esto, el envío de correos quedó configurado ' +
              'correctamente.</p><p>Cuota restante hoy: ' +
              MailApp.getRemainingDailyQuota() + ' correos.</p>',
    name: 'AFAAR'
  });
  console.log('Mail de prueba enviado a ' + yo);
}
