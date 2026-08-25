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

/* Tamaño máximo del cuerpo del mail, por las dudas. No cuenta los
   documentos: esos viajan aparte, en d.documentos, y se miden contra
   TOPE_ADJUNTOS una vez convertidos a PDF. */
var TOPE_BYTES = 900000;

/* Tamaño máximo del conjunto de adjuntos. Gmail rechaza por encima de 25 MB
   contando la codificación; se deja margen. */
var TOPE_ADJUNTOS = 18000000;

/* Carpeta del Drive de la asociación donde se archiva el registro de
   auditoría. Se crea sola la primera vez, en "Mi unidad" de la cuenta que
   ejecuta este programa. Si querés otro nombre, cambialo acá. */
var CARPETA_AUDITORIA = 'AFAAR — Auditoría';

/* Tope de un archivo de auditoría, por las dudas */
var TOPE_AUDITORIA = 12000000;

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

    /* 1b. ¿Es un archivado de auditoría? No lleva destinatario ni correo:
       se guarda en el Drive de la asociación y termina acá. */
    if (d.auditoria && d.auditoria.csv) {
      return archivarAuditoria(d.auditoria);
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

    /* 5b. Adjuntos (parte quirurgico y documento del envio a contaduria).
       Llegan como [{nombre, mime, datos}] con datos en base64 SIN el prefijo
       "data:...;base64,". Si no vienen, el mail sale igual que siempre. */
    if (d.adjuntos && d.adjuntos.length) {
      var blobs = [];
      var pesoTotal = 0;
      for (var i = 0; i < d.adjuntos.length; i++) {
        var a = d.adjuntos[i];
        if (!a || !a.datos) continue;
        var bytes = Utilities.base64Decode(a.datos);
        pesoTotal += bytes.length;
        if (pesoTotal > TOPE_ADJUNTOS) {
          return responder({ ok: false,
            error: 'Los adjuntos superan los ' + Math.round(TOPE_ADJUNTOS/1048576) + ' MB.' });
        }
        blobs.push(Utilities.newBlob(bytes,
          a.mime || 'application/octet-stream',
          a.nombre || ('adjunto-' + (i+1))));
      }
      if (blobs.length) opciones.attachments = blobs;
    }
    /* 5c. Documentos que llegan como HTML y hay que convertir a PDF.
       Es lo que le mandamos al paciente: valoracion pre-anestesica,
       consentimiento informado e indicaciones, cada uno en su propio
       archivo. La app no tiene libreria de PDF; el conversor de Google si,
       y produce un PDF de verdad, que se abre en cualquier telefono.
       Llegan como [{nombre, html}]. */
    if (d.documentos && d.documentos.length) {
      var pdfs = opciones.attachments || [];
      var pesoPdf = 0;
      for (var j = 0; j < d.documentos.length; j++) {
        var doc = d.documentos[j];
        if (!doc || !doc.html) continue;
        var nombre = doc.nombre || ('documento-' + (j + 1) + '.pdf');
        if (nombre.slice(-4).toLowerCase() !== '.pdf') nombre += '.pdf';
        var pdf = Utilities.newBlob(doc.html, 'text/html', nombre)
                           .getAs('application/pdf')
                           .setName(nombre);
        pesoPdf += pdf.getBytes().length;
        if (pesoPdf > TOPE_ADJUNTOS) {
          return responder({ ok: false,
            error: 'Los documentos superan los ' + Math.round(TOPE_ADJUNTOS/1048576) + ' MB.' });
        }
        pdfs.push(pdf);
      }
      if (pdfs.length) opciones.attachments = pdfs;
    }

    if (d.responderA && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.responderA)) {
      opciones.replyTo = d.responderA;
    }
    MailApp.sendEmail(opciones);

    sumarHoy();
    registrar('ENVIADO ficha ' + (d.fichaId || '—') +
              ' por ' + (d.profesional || '—') +
              (opciones.attachments ? ' con ' + opciones.attachments.length + ' adjunto(s)' : ''),
              d.para);

    return responder({ ok: true, restantes: TOPE_DIARIO - (usados + 1) });

  } catch (err) {
    registrar('ERROR ' + err.message, '');
    return responder({ ok: false, error: String(err.message || err) });
  }
}

/* ——————————————————————— Archivo de auditoría ———————————————————————
   Guarda en el Drive de la asociación el tramo viejo del registro de
   auditoría que la app está por sacar del dispositivo.

   Va como CSV a propósito: pesa poco, lo abre Google Sheets con un clic, se
   puede filtrar y ordenar, y se sigue leyendo dentro de veinte años con
   cualquier programa. Un archivo de 1.500 eventos ocupa unos 250 KB.

   La app NO borra nada hasta que esta función confirma que quedó guardado.  */
function archivarAuditoria(a) {
  var csv = String(a.csv || '');
  if (!csv) return responder({ ok: false, error: 'Archivo vacío.' });
  if (csv.length > TOPE_AUDITORIA) {
    return responder({ ok: false, error: 'El archivo de auditoría es demasiado grande.' });
  }

  var nombre = a.nombre || ('auditoria-' + Utilities.formatDate(new Date(),
    Session.getScriptTimeZone(), 'yyyy-MM-dd-HHmm') + '.csv');
  if (nombre.slice(-4).toLowerCase() !== '.csv') nombre += '.csv';

  /* La carpeta se busca por nombre y se crea sólo si no existe */
  var carpeta;
  var it = DriveApp.getFoldersByName(CARPETA_AUDITORIA);
  carpeta = it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_AUDITORIA);

  var archivo = carpeta.createFile(
    Utilities.newBlob(csv, 'text/csv', nombre));

  registrar('AUDITORIA archivada: ' + nombre + ' (' + Math.round(csv.length/1024) + ' KB)',
            carpeta.getName());

  return responder({
    ok: true,
    nombre: archivo.getName(),
    url: archivo.getUrl(),
    id: archivo.getId(),
    carpeta: carpeta.getName(),
    kb: Math.round(csv.length / 1024)
  });
}

/* Si alguien abre la dirección en el navegador, que no muestre nada útil.
   Lo único que informa es de qué versión es este programa, para que la app
   sepa si puede mandarle adjuntos o si todavía está publicada la versión
   vieja. No revela ni la clave ni ningún dato. */
function doGet() {
  return responder({
    ok: false,
    error: 'Este servicio sólo recibe envíos.',
    version: 4,
    adjuntos: true,
    documentosPdf: true,
    auditoriaDrive: true
  });
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
