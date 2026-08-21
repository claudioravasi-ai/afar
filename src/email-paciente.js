/* =========================================================================
   ENVIO AL PACIENTE DE LA VALORACION PREQUIRURGICA Y EL CONSENTIMIENTO
   -------------------------------------------------------------------------
   Arma el mail y se lo pasa al Apps Script configurado en email-config.js.
   Los documentos van en el CUERPO del mail, no como adjuntos: la app no
   genera PDF de verdad (el "PDF" es la impresion del navegador), asi que un
   adjunto seria un .doc que en el telefono se ve mal o no abre.

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

    '<p>Más abajo encontrará la documentación correspondiente a su evaluación '+
    'anestesiológica:</p>'+

    '<div style="border-left:4px solid #0b2545;padding:2px 0 2px 14px;margin:18px 0">'+
      '<p style="margin:6px 0"><b>Valoración prequirúrgica.</b> Resumen de su historia '+
      'clínica, antecedentes, medicación, alergias y la evaluación realizada. '+
      'Es la información que necesita el equipo quirúrgico.</p>'+
      '<p style="margin:6px 0"><b>Consentimiento informado en anestesia.</b> Deja constancia '+
      'de que se le explicaron los riesgos, los beneficios y las alternativas del '+
      'procedimiento anestésico, y de que usted lo autoriza.</p>'+
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

    /* ---- Los documentos, con el mismo formato que la version impresa ---- */
    '<div style="font-family:Calibri,Arial,sans-serif;font-size:12px">'+
      '<style>'+CSS_DOC+'</style>'+
      documentoFicha(f, { paraPaciente:true })+
    '</div>'+

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
  if(!(f.consent && f.consent.quien))
    return toast('Todavía no está firmado el consentimiento informado.', 'warn');

  const asunto = 'Documentación de valoración prequirúrgica — ' +
    (p.apellido || '') + ', ' + (p.nombre || '');

  confirmar('Enviar documentación al paciente',
    'Se envía a <b>'+esc(p.email)+'</b> la valoración prequirúrgica y el '+
    'consentimiento informado de <b>'+esc((p.apellido||'')+', '+(p.nombre||''))+'</b>.<br><br>'+
    'El mail sale a nombre de la AFAAR y las respuestas del paciente te llegan a '+
    '<b>'+esc(prof.email||'—')+'</b>.<br><br>'+
    'No se incluyen honorarios ni datos económicos.',
    async () => {
      toast('Enviando…');
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
          porUid: SESION ? SESION.uid : '', por: (prof.apellido||'')+', '+(prof.nombre||'')
        }]);
        escribir('fichas', base.id, base);
        if(fichaActual && fichaActual.id === base.id) fichaActual.envios = base.envios;
        auditar('email-paciente', 'Documentación enviada a ' + p.email);
        toast('Documentación enviada a ' + p.email, 'ok');
        pintarFicha();
      }catch(err){
        toast('No se pudo enviar: ' + err.message, 'err');
      }
    }, 'Enviar');
}
