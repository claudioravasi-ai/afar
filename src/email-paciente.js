/* =========================================================================
   ENVIO AL PACIENTE DE SU VALORACION Y SU CONSENTIMIENTO
   -------------------------------------------------------------------------
   QUE SE LE MANDA Y QUE NO
   Al paciente se le manda SOLO su valoracion pre-anestesica —filiacion,
   antecedentes, medicacion, alergias, examen, escalas y plan—, su
   consentimiento informado y la hoja de indicaciones.

   NO se le manda el registro del acto anestesico, la recuperacion ni la
   ficha firmada: son el registro del equipo tratante, con valor
   medico-legal y destino de auditoria, y no se entregan por correo. Tampoco
   sale un solo dato de facturacion: honorarios, modalidades e importes son
   cosa entre el anestesiologo y el financiador.

   COMO VIAJAN
   En TRES ARCHIVOS PDF SEPARADOS, no pegados uno abajo del otro en el cuerpo
   del mail:

     1. Valoracion pre-anestesica
     2. Consentimiento informado anestesico
     3. Indicaciones para el dia de la cirugia

   Van separados porque son tres cosas distintas: una es historia clinica,
   otra es un instrumento juridico que se firma y se presenta solo, y la
   tercera es la que el paciente lleva en el bolsillo. Cada una con su
   membrete de la institucion, los datos del anestesiologo y de la AFAAR y el
   pie legal que corresponde.

   La app no genera el PDF: manda el HTML de cada documento y el conversor de
   Google lo pasa a PDF antes de adjuntarlo (ver apps-script/Codigo.gs). Asi
   no hace falta cargar ninguna libreria de PDF en la app y el paciente
   recibe archivos de verdad, no un .doc que en el telefono no abre.

   El remitente es la cuenta de Google de la asociacion, no el mail personal
   del anestesiologo: ningun servicio puede enviar en nombre de una casilla
   ajena sin que el correo del paciente lo marque como sospechoso. Para que
   el paciente igual llegue al profesional, el mail lleva "Responder a" con
   su direccion, y su nombre, matricula y especialidad en la firma.
   ========================================================================= */

function envioConfigurado(){
  return typeof ENVIO_URL === 'string' && ENVIO_URL.trim().length > 0 &&
         typeof ENVIO_CLAVE === 'string' && ENVIO_CLAVE.trim().length > 0;
}

/* Los documentos que se adjuntan, en el orden en que los va a ver */
function documentosParaPaciente(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const ape = (p.apellido || 'paciente').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]+/g,'');
  const fch = fechaValoracionDe(f) || hoyISO();
  const l = [
    { nombre:'Valoracion-preanestesica-'+ape+'-'+fch+'.pdf',
      titulo:'Valoración pre-anestésica',
      html: docPacienteValoracion(f) },
    { nombre:'Consentimiento-informado-anestesico-'+ape+'-'+fch+'.pdf',
      titulo:'Consentimiento informado anestésico',
      html: docPacienteConsentimiento(f) }
  ];
  if(INDICACIONES_AL_PACIENTE) l.push({
    nombre:'Indicaciones-'+ape+'-'+fch+'.pdf',
    titulo:'Indicaciones para el día de la cirugía',
    html: docPacienteIndicaciones(f) });
  return l;
}

/* ------------------------------------------------- Cuerpo del mail (HTML) */
function htmlMailPaciente(f, prof){
  const p = DB.pacientes[f.pacienteId] || {};
  const trato = p.nombre ? esc(p.nombre) : 'paciente';
  const firma = (prof.apellido || '') + ', ' + (prof.nombre || '');

  return ''+
  '<div style="font-family:Calibri,Arial,sans-serif;font-size:15px;color:#111;'+
    'line-height:1.6;max-width:760px;margin:0 auto">'+

    '<p>Estimado/a <b>'+trato+'</b>,</p>'+

    '<p>Le escribo en mi carácter de médico/a anestesiólogo/a que realizó su '+
    'valoración prequirúrgica.</p>'+

    '<p>Adjunto a este correo va la documentación de su evaluación '+
    'anestesiológica, en <b>archivos PDF separados</b>:</p>'+

    '<div style="border-left:4px solid #0b2545;padding:2px 0 2px 14px;margin:18px 0">'+
      '<p style="margin:6px 0"><b>1. Valoración pre-anestésica.</b> Resumen de su historia '+
      'clínica, antecedentes, medicación, alergias y la evaluación realizada. '+
      'Es la información que necesita el equipo quirúrgico.</p>'+
      '<p style="margin:6px 0"><b>2. Consentimiento informado anestésico.</b> Deja constancia '+
      'de que se le explicaron los riesgos, los beneficios y las alternativas del '+
      'procedimiento anestésico, y de que usted lo autoriza. Puede revocarlo en cualquier '+
      'momento antes de la anestesia.</p>'+
      (INDICACIONES_AL_PACIENTE
        ? '<p style="margin:6px 0"><b>3. Indicaciones para el día de la cirugía.</b> Ayuno, '+
          'medicación que debe seguir tomando y cuál suspender, qué llevar y con quién venir. '+
          'Es la hoja que conviene tener a mano.</p>' : '')+
    '</div>'+

    '<div style="background:#fff8e6;border:1px solid #e6d08a;border-radius:8px;padding:12px 14px;margin:18px 0">'+
      '<b>Importante.</b> Imprima esta documentación y llévela el día de la '+
      'intervención. Si antes de la cirugía cambia algo en su salud, si empieza a '+
      'tomar una medicación nueva o si aparece cualquier síntoma, avísenos '+
      'respondiendo a este correo.'+
    '</div>'+

    '<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">'+
      '<tr><td style="padding:10px 12px;background:#eef4fa;border-radius:8px">'+
        '<b style="color:#0b2545">Profesional actuante</b><br>'+
        esc(firma)+'<br>'+
        esc(prof.titulo || 'Médico/a Especialista en Anestesiología')+'<br>'+
        'Matrícula provincial: '+esc(matriculaTxt(prof.matriculaProvincial,'M.P.'))+
        (prof.matriculaNacional ? ' · Matrícula nacional: '+esc(prof.matriculaNacional) : '')+'<br>'+
        'Correo: '+esc(prof.email || '—')+
      '</td></tr>'+
    '</table>'+

    '<p>Saludos cordiales,<br><b>'+esc(firma)+'</b></p>'+

    '<hr style="border:0;border-top:1px solid #ccd;margin:26px 0 14px">'+

    /* --------------------------- Pie legal --------------------------- */
    '<div style="font-size:11.5px;color:#455;line-height:1.55">'+
      '<b style="color:#0b2545">AVISO LEGAL Y PROTECCIÓN DE DATOS</b>'+
      '<p>Este mensaje contiene información de salud, que la ley considera un '+
      'dato sensible. Se le envía a usted por ser el titular de esos datos.</p>'+
      '<p><b>Ley 25.326 de Protección de Datos Personales.</b> Sus datos de salud '+
      'reciben tratamiento confidencial y se usan únicamente con fines asistenciales. '+
      'Usted puede acceder a ellos, pedir su rectificación y conocer su destino.</p>'+
      '<p><b>Ley 17.132 del Ejercicio de la Medicina.</b> El profesional firmante está '+
      'obligado a guardar secreto sobre todo lo que conoce en razón de su profesión.</p>'+
      '<p><b>Ley 26.529 de Derechos del Paciente.</b> Esta documentación forma parte de '+
      'su historia clínica, que le pertenece y se conserva un mínimo de diez años.</p>'+
      '<p>Si usted no es el destinatario de este correo, por favor elimínelo y avise '+
      'al remitente: contiene información amparada por el secreto médico.</p>'+
    '</div>'+
  '</div>';
}

/* --------------------------------------------------------------- Envio */
function enviarDocumentacionPaciente(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const prof = DB.usuarios[f.ownerUid] || USUARIO || {};

  if(!envioConfigurado())
    return toast('El envío por mail todavía no está configurado. Ver ENVIO-DE-MAILS.md', 'err');
  if(!f.pacienteId) return toast('La ficha no tiene paciente.', 'err');
  if(!p.email)      return toast('El paciente no tiene correo cargado. Agregalo en su ficha.', 'err');
  if(!consentimientoCompleto(f))
    return toast('Falta completar el punto 11: el consentimiento informado.', 'warn');
  if(!f.valoracionGuardada)
    return toast('Guardá primero la valoración con el botón «Guardar valoración».', 'warn');

  const asunto = 'Documentación de valoración prequirúrgica — ' +
    (p.apellido || '') + ', ' + (p.nombre || '');

  const docs = documentosParaPaciente(f);

  confirmar('Enviar documentación al paciente',
    'Se envía a <b>'+esc(p.email)+'</b> la documentación de <b>'+
    esc((p.apellido||'')+', '+(p.nombre||''))+'</b> en '+docs.length+
    ' archivos PDF <b>separados</b>:<br><br>'+
    '<ol style="margin:0 0 12px 18px;padding:0;line-height:1.7">'+
      docs.map(d => '<li>'+esc(d.titulo)+'</li>').join('')+
    '</ol>'+
    'Cada uno con el membrete de <b>'+esc(nombreInstitucion(f.institucion) || 'la institución')+
    '</b>, tus datos de matrícula y el pie legal de la AFAAR.<br><br>'+
    'El mail sale a nombre de la AFAAR y las respuestas del paciente te llegan a '+
    '<b>'+esc(prof.email||'—')+'</b>.<br><br>'+
    'No se incluyen el registro del acto anestésico, la recuperación ni <b>ningún '+
    'dato de facturación</b>.',
    async () => {
      /* El conversor a PDF lo pone la versión 3 del programa de Apps Script.
         Si el coordinador todavía no la republicó, el pedido saldría igual y
         el paciente recibiría un correo SIN un solo documento adjunto: peor
         que fallar. Se comprueba antes y no se manda nada. */
      /* Una visita con pase de invitado mira, no manda correos en nombre de
         la asociacion. Los envios no pasan por escribir(), asi que hay que
         preguntar aca. Ver pase.js */
      if(typeof soloLectura === 'function' && soloLectura('enviar correos')) return;
      if(!(await soportaDocumentosPdf()))
        return toast('El servicio de correo está en una versión vieja y no puede armar los PDF. '+
                     'El coordinador tiene que volver a publicar el programa: ver ENVIO-DE-MAILS.md.', 'err');
      toast('Generando los PDF y enviando…');
      try{
        /* Sin encabezados propios a proposito: agregar Content-Type dispara una
           consulta previa de permisos que Apps Script no responde y el envio
           falla. Asi el navegador lo manda como texto plano y funciona. */
        const r = await fetch(ENVIO_URL, {
          method: 'POST',
          redirect: 'follow',
          body: JSON.stringify({
            clave:      ENVIO_CLAVE,
            para:       p.email,
            responderA: prof.email || '',
            nombre:     typeof ENVIO_NOMBRE !== 'undefined' ? ENVIO_NOMBRE : 'AFAAR',
            asunto:     asunto,
            html:       htmlMailPaciente(f, prof),
            /* Cada documento va como HTML; el conversor de Google lo pasa a
               PDF y lo adjunta con este nombre de archivo. */
            documentos: docs.map(d => ({ nombre:d.nombre, html:d.html })),
            fichaId:    f.id,
            profesional: (prof.apellido||'')+', '+(prof.nombre||'')
          })
        });
        const res = await r.json();
        if(!res.ok) throw new Error(res.error || 'El servidor rechazó el envío.');

        /* Queda registrado en la ficha y en la auditoria */
        const base = JSON.parse(JSON.stringify(DB.fichas[f.id] || f));
        base.envios = (base.envios || []).concat([{
          fecha: new Date().toISOString(), a: p.email,
          documentos: docs.map(d => d.titulo),
          porUid: SESION ? SESION.uid : '', por: (prof.apellido||'')+', '+(prof.nombre||'')
        }]);
        escribir('fichas', base.id, base);
        if(fichaActual && fichaActual.id === base.id) fichaActual.envios = base.envios;
        auditar('email-paciente',
          docs.length + ' documentos enviados en PDF a ' + p.email);
        toast(docs.length + ' PDF enviados a ' + p.email, 'ok');
        pintarFicha();
      }catch(err){
        toast('No se pudo enviar: ' + err.message, 'err');
      }
    }, 'Enviar');
}

/* =========================================================================
   EL MAIL QUE LLEVA LA FICHA EN BLANCO Y EL ENLACE PARA COMPLETARLA
   -------------------------------------------------------------------------
   El correo lleva UNA sola cosa: el enlace para que el paciente complete su
   ficha dentro de la aplicacion. Sin adjuntos y sin formulario en papel, a
   proposito: lo que se busca es que el dato entre una sola vez, escrito por
   quien lo sabe, y llegue a la ficha sin que nadie lo transcriba.

   El enlace es la parte sensible del mensaje: quien lo tiene puede escribir
   en ese pedido. Por eso el correo lo dice con todas las letras y pide que no
   se reenvie. Ver paciente-portal.js.
   ========================================================================= */
function htmlMailFichaEnBlanco(f, prof, enlace){
  const p = DB.pacientes[f.pacienteId] || {};
  const trato = p.nombre ? esc(p.nombre) : 'paciente';
  const firma = (prof.apellido || '') + ', ' + (prof.nombre || '');
  const cx = textoProcedimientos(f) || f.cirugia || '';

  return ''+
  '<div style="font-family:Calibri,Arial,sans-serif;font-size:15px;color:#111;'+
    'line-height:1.6;max-width:760px;margin:0 auto">'+

    '<p>Estimado/a <b>' + trato + '</b>,</p>'+

    '<p>Soy el/la médico/a anestesiólogo/a que va a hacer su valoración prequirúrgica' +
      (cx ? ' para su <b>' + esc(cx) + '</b>' : '') + '.</p>'+

    '<p>Para que la consulta se dedique a lo importante y no a copiar datos, le pido que '+
    '<b>complete su ficha antes de venir</b>. Le lleva unos minutos y puede hacerlo con calma, '+
    'con las cajas de sus remedios a mano.</p>'+

    '<div style="text-align:center;margin:26px 0">'+
      '<a href="' + esc(enlace) + '" style="display:inline-block;background:#0b2545;color:#fff;'+
        'text-decoration:none;font-size:16px;font-weight:bold;padding:14px 30px;border-radius:8px">'+
        'Completar mi ficha</a>'+
      '<div style="font-size:12px;color:#556;margin-top:10px">Se abre en el teléfono o en la '+
        'computadora. No hace falta instalar nada ni crear ninguna cuenta.</div>'+
    '</div>'+


    '<div style="background:#eef4fa;border-radius:8px;padding:12px 14px;margin:18px 0">'+
      '<b>Qué se le pregunta.</b> Sus datos de filiación, las enfermedades que tuvo, las '+
      'operaciones que se hizo, cómo le fue con anestesias anteriores, qué remedios toma, a qué '+
      'es alérgico y sus hábitos. Nada más.'+
    '</div>'+

    '<div style="background:#fff8e6;border:1px solid #e6d08a;border-radius:8px;padding:12px 14px;margin:18px 0">'+
      '<b>Importante.</b> Si no está seguro de algo, déjelo vacío y pregúntelo en la consulta. '+
      'Lo que complete <b>no reemplaza la entrevista</b>: lo vamos a revisar juntos.<br><br>'+
      '<b>No suspenda ni empiece ningún medicamento por su cuenta.</b> Las indicaciones sobre '+
      'qué tomar y qué dejar de tomar antes de la cirugía se las doy yo después de la consulta.'+
    '</div>'+

    '<div style="background:#fdeeee;border:1px solid #e0a8a8;border-radius:8px;padding:12px 14px;margin:18px 0">'+
      '<b>El enlace es suyo y personal.</b> No lo reenvíe ni lo comparta: cualquiera que lo '+
      'tenga puede escribir en su ficha. Vence en 30 días.'+
    '</div>'+

    '<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">'+
      '<tr><td style="padding:10px 12px;background:#eef4fa;border-radius:8px">'+
        '<b style="color:#0b2545">Profesional actuante</b><br>'+
        esc(firma) + '<br>'+
        esc(prof.titulo || 'Médico/a Especialista en Anestesiología') + '<br>'+
        'Matrícula provincial: ' + esc(matriculaTxt(prof.matriculaProvincial, 'M.P.')) + '<br>'+
        'Correo: ' + esc(prof.email || '—')+
      '</td></tr>'+
    '</table>'+

    '<p>Saludos cordiales,<br><b>' + esc(firma) + '</b></p>'+

    '<hr style="border:0;border-top:1px solid #ccd;margin:26px 0 14px">'+
    '<div style="font-size:11.5px;color:#455;line-height:1.55">'+
      '<b style="color:#0b2545">AVISO LEGAL Y PROTECCIÓN DE DATOS</b>'+
      '<p><b>Ley 25.326 de Protección de Datos Personales.</b> Los datos de salud que cargue '+
      'reciben tratamiento confidencial y se usan únicamente con fines asistenciales. Usted '+
      'puede acceder a ellos, pedir su rectificación y conocer su destino.</p>'+
      '<p><b>Ley 17.132 del Ejercicio de la Medicina.</b> El profesional firmante está obligado '+
      'a guardar secreto sobre todo lo que conoce en razón de su profesión.</p>'+
      '<p><b>Ley 26.529 de Derechos del Paciente.</b> Lo que usted aporte se incorpora a su '+
      'historia clínica una vez revisado por el profesional. La historia le pertenece.</p>'+
      '<p>Si usted no es el destinatario de este correo, elimínelo y avise al remitente.</p>'+
    '</div>'+
  '</div>';
}
