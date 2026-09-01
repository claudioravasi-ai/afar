/* =========================================================================
   EQUIPO DE DEMOSTRACION AMPLIADO
   Cuatro anestesiologos mas, con fichas en distintos estados, para recorrer
   la aplicacion entera: avisos, estadisticas, facturacion, portal contable
   y comunicacion interna.

   Todo lleva demo:true, asi que:
     - NUNCA se sube a Firebase (subirTodoLocal descarta los registros demo),
     - se borra de una sola vez con el boton «Borrar» del cartel amarillo.

   Cada profesional ilustra una situacion distinta:
     Torres    — valoraciones hechas y actos por venir
     Sosa      — cirugias realizadas sin registrar el acto
     Méndez    — deuda vieja sin cobrar, para ver la indexacion del contable
     Vidal     — solicitud de alta pendiente de aprobacion
   ========================================================================= */

function usuarioDemo(uid, datos){
  const salt = 'demo' + Math.random().toString(36).slice(2,8);
  escribir('usuarios', uid, Object.assign({
    uid:uid, demo:true, rol:'socio', estado:'aprobado',
    salt:salt, passHash:hashClave(DEMO_CLAVE, salt),
    titulo:'Médico Especialista en Anestesiología',
    comprobante:{ nombre:'cuota-afaar-2026.pdf', tipo:'application/pdf', tam:80100,
                  dataUrl:'data:application/pdf;base64,JVBERi0xLjQK' },
    firmaDataUrl:''
  }, datos));
}

function sembrarEquipoDemo(){
  const U3 = 'usr_demo3', U4 = 'usr_demo4', U5 = 'usr_demo5', U6 = 'usr_demo6';

  /* ------------------------------------------------- Anestesiólogos -- */
  usuarioDemo(U3, {
    email:'torres@afar.org.ar',
    apellido:'Torres', nombre:'Alejandra', dni:'29334120', fechaNac:'1982-05-30',
    matriculaNacional:'M.N. 134788', matriculaProvincial:'M.P. 1976',
    telefono:'2901-447722', cuit:'27-29334120-9', condicionIva:'Monotributista',
    domicilio:'Onas 455, Ushuaia', instituciones:['hru','cams'],
    creado:diaRel(-210), aprobadoEn:diaRel(-208), aprobadoPor:'coordinador'
  });
  usuarioDemo(U4, {
    email:'sosa@afar.org.ar',
    apellido:'Sosa', nombre:'Ricardo', dni:'23110455', fechaNac:'1973-01-17',
    matriculaNacional:'M.N. 101233', matriculaProvincial:'M.P. 1408',
    telefono:'2964-501144', cuit:'20-23110455-1', condicionIva:'Responsable Inscripto',
    domicilio:'Rivadavia 980, Río Grande', instituciones:['hrrg','sfue'],
    creado:diaRel(-320), aprobadoEn:diaRel(-318), aprobadoPor:'coordinador'
  });
  usuarioDemo(U5, {
    email:'mendez@afar.org.ar',
    apellido:'Méndez', nombre:'Carolina', dni:'31502877', fechaNac:'1985-10-02',
    matriculaNacional:'M.N. 141902', matriculaProvincial:'M.P. 2051',
    telefono:'2901-338899', cuit:'27-31502877-2', condicionIva:'Monotributista',
    domicilio:'Deloqui 1120, Ushuaia', instituciones:['ssj','hnu','hru'],
    creado:diaRel(-260), aprobadoEn:diaRel(-258), aprobadoPor:'coordinador'
  });
  /* Pendiente: aparece en Coordinación → Solicitudes */
  usuarioDemo(U6, {
    email:'vidal@afar.org.ar', estado:'pendiente',
    apellido:'Vidal', nombre:'Esteban', dni:'34778201', fechaNac:'1989-06-11',
    matriculaNacional:'M.N. 152340', matriculaProvincial:'M.P. 2210',
    telefono:'2964-778811', cuit:'20-34778201-4', condicionIva:'Monotributista',
    domicilio:'Belgrano 210, Río Grande', instituciones:['hrrg'],
    creado:diaRel(-4)
  });

  /* ------------------------------------------------------- Pacientes -- */
  const PA = 'pac_demo4', PB = 'pac_demo5', PC = 'pac_demo6', PD = 'pac_demo7';

  escribir('pacientes', PA, {
    id:PA, demo:true, ownerUid:U3,
    apellido:'Coronel', nombre:'Héctor Daniel', dni:'16443902', fechaNac:'1963-04-25',
    sexo:'M', peso:'88', talla:'175', obraSocial:'IPAUSS / OSEF (Tierra del Fuego)',
    nroAfiliado:'TF-164439', telefono:'2901-223344', grupoSanguineo:'B+',
    email:'hd.coronel@ejemplo.com',
    domicilio:'Magallanes 780', localidad:'Ushuaia',
    contactoEmergencia:'Silvia Coronel (esposa) — 2901-223345',
    observaciones:'Tabaquista de 30 paquetes-año. EPOC leve.', creado:diaRel(-30)
  });
  escribir('pacientes', PB, {
    id:PB, demo:true, ownerUid:U4,
    apellido:'Aguirre', nombre:'Lucía', dni:'42557318', fechaNac:'2000-08-19',
    sexo:'F', peso:'62', talla:'168', obraSocial:'Swiss Medical',
    nroAfiliado:'SM-4255731', telefono:'2964-660011', grupoSanguineo:'A-',
    email:'lucia.aguirre@ejemplo.com',
    domicilio:'Perito Moreno 45', localidad:'Río Grande',
    contactoEmergencia:'Norma Aguirre (madre) — 2964-660012',
    observaciones:'Sin antecedentes de relevancia.', creado:diaRel(-21)
  });
  escribir('pacientes', PC, {
    id:PC, demo:true, ownerUid:U5,
    apellido:'Barrientos', nombre:'Omar', dni:'12908744', fechaNac:'1957-12-09',
    sexo:'M', peso:'102', talla:'170', obraSocial:'PAMI - INSSJP',
    nroAfiliado:'150-12908744-01', telefono:'2901-771122', grupoSanguineo:'0+',
    email:'omar.barrientos@ejemplo.com',
    domicilio:'Yaganes 66', localidad:'Ushuaia',
    contactoEmergencia:'Elsa Barrientos (hija) — 2901-771123',
    observaciones:'Insuficiencia renal crónica en diálisis trisemanal.', creado:diaRel(-150)
  });
  escribir('pacientes', PD, {
    id:PD, demo:true, ownerUid:U3,
    apellido:'Quiroga', nombre:'Valentina', dni:'45120983', fechaNac:'2003-03-14',
    sexo:'F', peso:'55', talla:'162', obraSocial:'Particular / Privado',
    telefono:'2901-909090', grupoSanguineo:'A+',
    email:'valen.quiroga@ejemplo.com',
    domicilio:'Fuegia Basket 300', localidad:'Ushuaia',
    contactoEmergencia:'Pablo Quiroga (padre) — 2901-909091',
    observaciones:'', creado:diaRel(-3)
  });

  /* Bloques reutilizables, para no repetir cien líneas por ficha */
  const valBase = (asa, mets) => ({
    antecedentes2:[], antecedentes:{}, medicacion:[], alergias:['Sin alergias conocidas'],
    examen:{ ta:'126/78', fc:'72', spo2:'98' },
    va:{ mallampati:'2', aperturaBucal:'5', tiromentoniana:'7' },
    lab:{ hb:'13.4', plaquetas:'232', creatinina:'0.85' }, estudios:{},
    scores:{ asa:asa, mets:mets, rcri:[], stopbang:{}, apfel:{mujer:true,nofuma:true},
             caprini:[0], arIncision:'periferica', arDuracion:'60' },
    ayuno:{ tipo:'Comida liviana', hora:'22:00' },
    riesgo:{ aptitud:'apto', fundamento:'Paciente en condiciones de recibir el procedimiento propuesto.',
             fecha:diaRel(-2), ambito:'Consultorio de preanestesia' }
  });
  const planBase = tec => ({
    tecnica:[tec], monitoreoEstandar:MONITOREO_ESTANDAR.slice(0,5),
    atb:'Cefazolina', tev:'Deambulación precoz',
    nvpo:['Ondansetrón 4 mg'], analgesia:['Paracetamol 1 g EV c/6-8 h'],
    destino:'Sala de recuperación postanestésica'
  });
  const actoBase = (ini, fin, tec) => ({
    inicioAnestesia:ini, finAnestesia:fin, tecnica:[tec],
    farmacos:'Propofol, fentanilo y rocuronio a dosis habituales.',
    cristaloides:'900', sangrado:'50', oms:['entrada','pausa','salida'],
    eventos:['Sin eventos'],
    aldrete:{actividad:2,respiracion:2,circulacion:2,conciencia:2,saturacion:2}, aldreteTotal:10,
    destinoReal:'Sala de recuperación postanestésica', estadoEgreso:'Estable, sin complicaciones'
  });

  /* ============ TORRES — valoración lista, cirugía por venir ============ */
  escribir('fichas', 'fic_demo8', {
    id:'fic_demo8', demo:true, ownerUid:U3, pacienteId:PA,
    fecha:diaRel(3), hora:'09:00', turno:'Mañana', caracter:'programada',
    institucion:'hru', obraSocial:'IPAUSS / OSEF (Tierra del Fuego)', nroAfiliado:'TF-164439',
    especialidad:'Urología', cirugia:'Resección transuretral de próstata', cirugiaUA:11,
    diagnostico:'Hiperplasia prostática benigna',
    cirujano:'Dr. Fernando Ibáñez', estado:'abierta',
    v:valBase('II', 6), plan:planBase('Anestesia raquídea (subaracnoidea)'),
    acto:{}, honConsulta:{ modalidad:'obrasocial', total:28000, estado:'Presentado',
      fechaPresentacion:diaRel(-2), comprobante:'FC-B-0004-00000210', cobrado:0 },
    hon:{},
    creado:diaRel(-5), modificado:new Date().toISOString(),
    modificadoPor:U3, modificadoPorNombre:'Torres, Alejandra'
  });

  /* Valoración de Torres, acto asignado a Méndez: reparto de honorarios */
  escribir('fichas', 'fic_demo9', {
    id:'fic_demo9', demo:true, ownerUid:U3, pacienteId:PD,
    fecha:diaRel(1), hora:'11:30', turno:'Mañana', caracter:'programada',
    institucion:'ssj', obraSocial:'Particular / Privado',
    especialidad:'Traumatología', cirugia:'Artroscopía de rodilla', cirugiaUA:9,
    diagnostico:'Trastorno interno de la rodilla',
    cirujano:'Dra. Marina Costa', estado:'abierta', asignadoUid:U5,
    v:valBase('I', 9), plan:planBase('Anestesia general balanceada'),
    acto:{},
    honConsulta:{ modalidad:'particular', total:45000, estado:'Cobrado',
      fechaPresentacion:diaRel(-1), comprobante:'REC-0007', cobrado:45000 },
    hon:{},
    creado:diaRel(-3), modificado:new Date().toISOString(),
    modificadoPor:U3, modificadoPorNombre:'Torres, Alejandra'
  });

  /* ====== SOSA — cirugía hecha, acto SIN registrar (dispara avisos) ====== */
  escribir('fichas', 'fic_demo10', {
    id:'fic_demo10', demo:true, ownerUid:U4, pacienteId:PB,
    fecha:diaRel(-6), hora:'16:00', turno:'Tarde', caracter:'urgencia',
    institucion:'hrrg', obraSocial:'Swiss Medical', nroAfiliado:'SM-4255731',
    especialidad:'Cirugía General', cirugia:'Apendicectomía laparoscópica', cirugiaUA:10,
    diagnostico:'Apendicitis aguda',
    cirujano:'Dr. Andrés Peralta', estado:'abierta',
    v:valBase('I', 10), plan:planBase('Anestesia general balanceada'),
    acto:{},                       /* sin registrar: la app lo reclama */
    honConsulta:{ modalidad:'incluida', total:0, estado:'Pendiente', cobrado:0 },
    hon:{},                        /* sin honorarios: segundo aviso */
    creado:diaRel(-6), modificado:new Date(Date.now()-86400000*6).toISOString(),
    modificadoPor:U4, modificadoPorNombre:'Sosa, Ricardo'
  });

  /* Sosa — acto hecho y cobrado, para que su facturación no dé cero */
  escribir('fichas', 'fic_demo11', {
    id:'fic_demo11', demo:true, ownerUid:U4, pacienteId:PB,
    fecha:diaRel(-40), hora:'08:00', turno:'Mañana', caracter:'programada',
    institucion:'sfue', obraSocial:'Swiss Medical', nroAfiliado:'SM-4255731',
    especialidad:'Otorrinolaringología', cirugia:'Amigdalectomía', cirugiaUA:8,
    diagnostico:'Amigdalitis crónica',
    cirujano:'Dra. Inés Ferrari', estado:'cerrada',
    v:valBase('I', 10), plan:planBase('Anestesia general balanceada'),
    acto:actoBase('08:05','09:00','Anestesia general balanceada'),
    honConsulta:{ modalidad:'obrasocial', total:31000, estado:'Cobrado',
      fechaPresentacion:diaRel(-38), comprobante:'FC-A-0005-00001120', cobrado:31000 },
    hon:{ modalidad:'abierto', ua:8, valorUnidad:9800, adicionales:[], pctAdicional:0,
      total:78400, estado:'Cobrado', fechaPresentacion:diaRel(-38),
      comprobante:'FC-A-0005-00001121', cobrado:78400, observaciones:'' },
    creado:diaRel(-40), modificado:new Date(Date.now()-86400000*38).toISOString(),
    modificadoPor:U4, modificadoPorNombre:'Sosa, Ricardo'
  });

  /* ===== MÉNDEZ — deuda vieja: lo que hace visible la indexación ===== */
  escribir('fichas', 'fic_demo12', {
    id:'fic_demo12', demo:true, ownerUid:U5, pacienteId:PC,
    fecha:diaRel(-140), hora:'10:00', turno:'Mañana', caracter:'programada',
    institucion:'hnu', obraSocial:'PAMI - INSSJP', nroAfiliado:'150-12908744-01',
    especialidad:'Cirugía Vascular', cirugia:'Confección de fístula arteriovenosa', cirugiaUA:12,
    diagnostico:'Enfermedad renal crónica',
    cirujano:'Dr. Hugo Lamas', estado:'cerrada',
    v:valBase('IV', 3), plan:planBase('Bloqueo de plexo braquial'),
    acto:actoBase('10:10','11:40','Bloqueo de plexo braquial'),
    honConsulta:{ modalidad:'obrasocial', total:22000, estado:'Presentado',
      fechaPresentacion:diaRel(-135), comprobante:'FC-B-0006-00000455', cobrado:0 },
    hon:{ modalidad:'abierto', ua:12, valorUnidad:7500, adicionales:['asa34','invasivo'],
      pctAdicional:45, total:130500, estado:'Presentado', fechaPresentacion:diaRel(-135),
      comprobante:'FC-B-0006-00000456', cobrado:0,
      observaciones:'Reclamado dos veces. Sin respuesta de la UGL.' },
    creado:diaRel(-140), modificado:new Date(Date.now()-86400000*135).toISOString(),
    modificadoPor:U5, modificadoPorNombre:'Méndez, Carolina'
  });

  /* Méndez — deuda de más de un año: candidata a incobrable */
  escribir('fichas', 'fic_demo13', {
    id:'fic_demo13', demo:true, ownerUid:U5, pacienteId:PC,
    fecha:diaRel(-400), hora:'15:00', turno:'Tarde', caracter:'emergencia',
    institucion:'hru', obraSocial:'PAMI - INSSJP', nroAfiliado:'150-12908744-01',
    especialidad:'Cirugía General', cirugia:'Laparotomía exploradora', cirugiaUA:15,
    diagnostico:'Íleo paralítico y obstrucción intestinal',
    cirujano:'Dr. Martín Gutiérrez', estado:'cerrada',
    v:valBase('IV', 2), plan:planBase('Anestesia general balanceada'),
    acto:actoBase('15:10','17:50','Anestesia general balanceada'),
    honConsulta:{ modalidad:'incluida', total:0, estado:'Pendiente', cobrado:0 },
    hon:{ modalidad:'abierto', ua:15, valorUnidad:6200, adicionales:['urgencia','asa34'],
      pctAdicional:75, total:162750, estado:'Débito / rechazado',
      fechaPresentacion:diaRel(-395), comprobante:'FC-B-0006-00000301', cobrado:0,
      observaciones:'Debitado por falta de orden de prestación. Reclamo presentado sin respuesta.' },
    creado:diaRel(-400), modificado:new Date(Date.now()-86400000*395).toISOString(),
    modificadoPor:U5, modificadoPorNombre:'Méndez, Carolina'
  });

  /* Méndez — mes pasado, cobrado: contraste sano en las estadísticas */
  escribir('fichas', 'fic_demo14', {
    id:'fic_demo14', demo:true, ownerUid:U5, pacienteId:PA,
    fecha:diaRel(-25), hora:'13:00', turno:'Tarde', caracter:'programada',
    institucion:'ssj', obraSocial:'IPAUSS / OSEF (Tierra del Fuego)', nroAfiliado:'TF-164439',
    especialidad:'Oftalmología', cirugia:'Facoemulsificación con implante de lente', cirugiaUA:6,
    diagnostico:'Catarata senil',
    cirujano:'Dra. Lorena Sanz', estado:'cerrada',
    v:valBase('II', 7), plan:planBase('Sedación consciente'),
    acto:actoBase('13:05','13:45','Sedación consciente'),
    honConsulta:{ modalidad:'obrasocial', total:26000, estado:'Cobrado',
      fechaPresentacion:diaRel(-22), comprobante:'FC-B-0006-00000512', cobrado:26000 },
    hon:{ modalidad:'abierto', ua:6, valorUnidad:8200, adicionales:[], pctAdicional:0,
      total:49200, estado:'Cobrado', fechaPresentacion:diaRel(-22),
      comprobante:'FC-B-0006-00000513', cobrado:49200, observaciones:'' },
    creado:diaRel(-25), modificado:new Date(Date.now()-86400000*22).toISOString(),
    modificadoPor:U5, modificadoPorNombre:'Méndez, Carolina'
  });

  /* ------------------------------ Un reclamo abierto y sin responder --- */
  const H = 'hilo_demo1';
  const hace5h = new Date(Date.now() - 5*3600000).toISOString();
  escribir('mensajes', H, {
    id:H, demo:true, asunto:'Débito de PAMI en la ficha de noviembre',
    tipo:'reclamo', prioridad:'alta', creadoPor:U5, creado:hace5h, actualizado:hace5h,
    participantes:[U5,'contable'], estado:'abierto',
    mensajes:{ m1:{ id:'m1', uid:U5, cuando:hace5h,
      texto:'PAMI debitó la laparotomía por falta de orden de prestación. '+
            '¿Puedo volver a presentarla o conviene reclamar por nota?' } },
    leido:{ [U5]:hace5h }
  });

  return true;
}

/* =========================================================================
   ENVIOS A CONTADURIA DE LA DEMOSTRACION
   -------------------------------------------------------------------------
   Ejemplos para que el contador vea sus dos bandejas funcionando: varios
   anestesiologos, meses distintos, envios abiertos y sin abrir, con parte
   quirurgico y sin el.

   Los adjuntos NO son archivos incrustados en el codigo: se dibujan en un
   canvas y se arma un PDF de una pagina en el momento. Asi la demostracion
   pesa unos pocos KB de codigo en vez de un megabyte de base64, y los
   archivos se ven y se abren como los de verdad.

   Todo lleva demo:true y se queda en el equipo (ver escribir() y
   archivoGuardar() en core.js).
   ========================================================================= */

/* ---------------------------------------- Foto del parte quirurgico ---- */
function imagenParteDemo(d){
  const cv = document.createElement('canvas');
  cv.width = 900; cv.height = 1240;
  const c = cv.getContext('2d');

  /* Papel con un tono apenas amarillento: es una foto, no un escaneo */
  c.fillStyle = '#f3f1ea'; c.fillRect(0, 0, 900, 1240);
  c.fillStyle = '#fdfdfb'; c.fillRect(28, 30, 844, 1180);

  const txt = (s, x, y, size, bold, color) => {
    c.fillStyle = color || '#1a1a1a';
    c.font = (bold ? 'bold ' : '') + size + 'px Helvetica, Arial, sans-serif';
    c.fillText(s, x, y);
  };
  const linea = (y, x1, x2) => {
    c.strokeStyle = '#b9b9b0'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x1 || 60, y); c.lineTo(x2 || 840, y); c.stroke();
  };
  const campo = (rot, val, y) => {
    txt(rot, 60, y, 15, true, '#444');
    txt(val, 60 + c.measureText(rot).width + 10, y, 16);
    linea(y + 9);
  };

  txt(d.institucion, 60, 78, 20, true, '#111');
  txt('SERVICIO DE CIRUGÍA — PARTE QUIRÚRGICO', 60, 106, 15, true, '#555');
  c.strokeStyle = '#333'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(60, 122); c.lineTo(840, 122); c.stroke();

  let y = 168;
  campo('Paciente:', d.paciente, y);            y += 46;
  campo('DNI:', d.dni + '        Fecha: ' + d.fecha + '        Hora: ' + d.hora, y); y += 46;
  campo('Cirujano/a:', d.cirujano, y);          y += 46;
  campo('Ayudante:', d.ayudante || '—', y);     y += 46;
  campo('Anestesiólogo/a:', d.anestesiologo, y); y += 56;

  txt('DIAGNÓSTICO PREOPERATORIO', 60, y, 14, true, '#444'); y += 26;
  txt(d.dxPre, 60, y, 16); linea(y + 9); y += 52;

  txt('DIAGNÓSTICO POSTOPERATORIO', 60, y, 14, true, '#444'); y += 26;
  txt(d.dxPost, 60, y, 16); linea(y + 9); y += 52;

  txt('PROCEDIMIENTO REALIZADO', 60, y, 14, true, '#444'); y += 26;
  txt(d.procedimiento, 60, y, 16); linea(y + 9); y += 52;

  txt('DESCRIPCIÓN OPERATORIA', 60, y, 14, true, '#444'); y += 28;
  (d.descripcion || []).forEach(l => { txt(l, 60, y, 15, false, '#222'); y += 26; });
  y += 18;

  campo('Sangrado estimado:', d.sangrado, y);   y += 46;
  campo('Material enviado a anatomía patológica:', d.anatomia || 'No', y); y += 46;
  campo('Complicaciones:', d.complicaciones || 'Sin complicaciones', y);

  /* Firma manuscrita del cirujano */
  const fy = 1120;
  c.strokeStyle = '#26408b'; c.lineWidth = 2.4; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(560, fy);
  c.bezierCurveTo(600, fy - 40, 640, fy + 24, 682, fy - 14);
  c.bezierCurveTo(710, fy - 38, 726, fy + 18, 770, fy - 22);
  c.stroke();
  c.strokeStyle = '#555'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(540, fy + 26); c.lineTo(830, fy + 26); c.stroke();
  txt(d.cirujano, 560, fy + 48, 13, false, '#444');
  txt('Firma y sello del cirujano', 560, fy + 68, 12, false, '#777');

  return cv.toDataURL('image/jpeg', 0.62);
}

/* ------------------------------------------- PDF de una sola pagina ---- */
/* PDF 1.4 minimo pero valido, con su tabla de referencias cruzadas bien
   calculada: se abre en el visor del navegador como cualquier otro. El texto
   va sin acentos a proposito, para que la longitud en caracteres coincida
   con la longitud en bytes y los desplazamientos del xref no se corran. */
function pdfDemo(lineas){
  const q = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^\x20-\x7e]/g, ' ')
                          .replace(/([\\()])/g, '\\$1');
  let y = 790, cont = 'BT\n';
  lineas.forEach(l => {
    const tam = l.t === 'h' ? 16 : (l.t === 's' ? 12 : 11);
    cont += '/F1 ' + tam + ' Tf\n1 0 0 1 56 ' + y + ' Tm\n(' + q(l.x || '') + ') Tj\n';
    y -= (l.t === 'h' ? 34 : (l.t === 'b' ? 26 : 18));
  });
  cont += 'ET';

  const objs = ['',
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]'+
      '/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>',
    '<</Length ' + cont.length + '>>\nstream\n' + cont + '\nendstream',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>'];

  let pdf = '%PDF-1.4\n';
  const off = [];
  for(let i = 1; i <= 5; i++){
    off[i] = pdf.length;
    pdf += i + ' 0 obj\n' + objs[i] + '\nendobj\n';
  }
  const xref = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for(let i = 1; i <= 5; i++){
    pdf += ('0000000000' + off[i]).slice(-10) + ' 00000 n \n';
  }
  pdf += 'trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n' + xref + '\n%%EOF';
  return pdf;
}

function sembrarEnviosDemo(){
  if(typeof armarEnvio !== 'function') return false;

  const cache = archivosCache();
  /* Se escribe en la cache y se guarda UNA vez al final: guardar en cada
     archivo serializaria un megabyte veinte veces y la app arrancaría lenta. */
  const guardarArch = reg => { cache[reg.id] = Object.assign({}, reg, { usado:reg.cuando }); };

  const hora = (fecha, dias, hhmm) => {
    const d = new Date((fecha || hoyISO()) + 'T' + hhmm + ':00');
    d.setDate(d.getDate() + dias);
    return d.toISOString();
  };

  /* Cuelga los adjuntos de la ficha, como si el anestesiólogo los hubiera
     subido desde el paso «Firmar». */
  const adjuntar = (fichaId, archivos) => {
    const f = DB.fichas[fichaId];
    if(!f) return;
    const p = DB.pacientes[f.pacienteId] || {};
    const eq = (f.acto || {}).equipo || {};
    const quien = actorFicha(f);
    const cuando = hora(f.fecha, 1, '19:20');
    const metas = archivos.map((a, i) => {
      const id = 'arch_demo_' + fichaId.replace('fic_', '') + '_' + i;
      const base = {
        institucion: nombreInstitucion(f.institucion).split('"')[0].trim(),
        paciente: (p.apellido || '') + ', ' + (p.nombre || ''),
        dni: p.dni || '', fecha: fFecha(f.fecha), hora: f.hora || '—',
        cirujano: eq.cirujano || a.cirujano || 'Dr. Martín Gutiérrez',
        ayudante: eq.ayudante || '',
        anestesiologo: nombreUsuario(quien),
        dxPre: f.diagnostico || a.dxPre || '—',
        dxPost: a.dxPost || f.diagnostico || '—',
        procedimiento: f.cirugia || '—',
        descripcion: a.descripcion || [],
        sangrado: a.sangrado || 'Escaso', anatomia: a.anatomia,
        complicaciones: a.complicaciones
      };
      const datos = a.pdf
        ? 'data:application/pdf;base64,' + btoa(pdfDemo(a.pdf(base)))
        : imagenParteDemo(base);
      const tam = Math.round((datos.length - datos.indexOf(',') - 1) * 0.75);
      guardarArch({ id, fichaId, nombre:a.n, mime: a.pdf ? 'application/pdf' : 'image/jpeg',
                    tam, datos, demo:true, cuando,
                    porUid:quien, porNombre:nombreUsuario(quien) });
      return { id, nombre:a.n, mime: a.pdf ? 'application/pdf' : 'image/jpeg', tam,
               cuando, porUid:quien, porNombre:nombreUsuario(quien), enNube:false };
    });
    f.acto = f.acto || {};
    f.acto.parteQuirurgico = metas;
    escribir('fichas', fichaId, f);
  };

  /* Registra el envío tal como lo haría el botón de la ficha */
  const enviar = (n, fichaId, tipo, o) => {
    const f = DB.fichas[fichaId];
    if(!f) return;
    const op = o || {};
    const titular = titularDeEnvio(f, tipo);
    const a = armarEnvio(f, tipo, {
      id: 'env_demo_' + n,
      enviado: hora(f.fecha, op.dias === undefined ? 2 : op.dias, op.hh || '18:40'),
      enviadoPor: titular, enviadoPorNombre: nombreUsuario(titular),
      nota: op.nota || '', visto: !!op.visto
    });
    guardarArch({ id:a.docId, fichaId, nombre:a.nombreDoc, mime:'text/html', demo:true,
      tam:a.docHtml.length, cuando:a.envio.enviado,
      datos:'data:text/html;charset=utf-8;base64,' +
            btoa(unescape(encodeURIComponent(a.docHtml))) });
    escribir('envios', a.envio.id, a.envio);
  };

  /* ------------------------- Partes quirúrgicos ------------------------- */
  adjuntar('fic_demo1', [
    { n:'foja-quirurgica-perez.jpg',
      dxPost:'Colelitiasis. Colecistitis crónica reagudizada',
      descripcion:['Neumoperitoneo con aguja de Veress. Cuatro trocares.',
                   'Vesícula de paredes engrosadas, adherencias laxas al epiplón.',
                   'Disección del triángulo de Calot. Visión crítica de seguridad.',
                   'Clipado y sección de arteria y conducto cístico.',
                   'Colecistectomía anterógrada. Extracción por trocar umbilical.'],
      sangrado:'Menor a 50 mL', anatomia:'Sí — vesícula biliar' },
    { n:'protocolo-anatomia-patologica.pdf', pdf: b => ([
        { t:'h', x:'ANATOMIA PATOLOGICA — PROTOCOLO N. 2026/4471' },
        { t:'b', x:b.institucion },
        { x:'Paciente: ' + b.paciente + '   DNI: ' + b.dni },
        { x:'Fecha de recepcion: ' + b.fecha },
        { x:'Cirujano remitente: ' + b.cirujano },
        { t:'b', x:'' },
        { t:'s', x:'MATERIAL REMITIDO' },
        { x:'Vesicula biliar de 8,5 x 4 x 3 cm.' },
        { t:'b', x:'' },
        { t:'s', x:'DESCRIPCION MACROSCOPICA' },
        { x:'Pared engrosada de hasta 5 mm. Mucosa aterciopelada.' },
        { x:'Luz ocupada por multiples calculos facetados de 3 a 11 mm.' },
        { t:'b', x:'' },
        { t:'s', x:'DIAGNOSTICO' },
        { x:'Colecistitis cronica litiasica. Sin signos de malignidad.' },
        { t:'b', x:'' },
        { x:'Dra. Silvia Nunez — Anatomia Patologica — M.P. 2210' }
      ]) }
  ]);

  adjuntar('fic_demo2', [
    { n:'parte-quirurgico-suarez.jpg', cirujano:'Dr. Emilio Sandoval',
      dxPost:'Fractura pertrocantérea de cadera derecha',
      descripcion:['Paciente en mesa de tracción, control radioscópico.',
                   'Reducción cerrada satisfactoria de la fractura.',
                   'Abordaje lateral. Colocación de clavo cefalomedular corto.',
                   'Tornillo cefálico y bloqueo distal bajo radioscopía.',
                   'Control final: reducción y material en posición correcta.'],
      sangrado:'Aproximadamente 250 mL', complicaciones:'Sin complicaciones' }
  ]);

  adjuntar('fic_demo4', [
    { n:'foja-quirurgica.jpg',
      dxPost:'Hernia umbilical no complicada',
      descripcion:['Incisión periumbilical. Disección del saco herniario.',
                   'Reducción del contenido, sin compromiso de asas.',
                   'Cierre del defecto con malla de polipropileno.',
                   'Hemostasia prolija. Cierre por planos.'],
      sangrado:'Escaso' }
  ]);

  adjuntar('fic_demo7', [
    { n:'parte-quirurgico-oftalmologia.pdf', pdf: b => ([
        { t:'h', x:'PARTE QUIRURGICO' },
        { t:'b', x:b.institucion + ' — Servicio de Oftalmologia' },
        { x:'Paciente: ' + b.paciente + '   DNI: ' + b.dni },
        { x:'Fecha: ' + b.fecha + '   Hora: ' + b.hora },
        { x:'Cirujano: ' + b.cirujano },
        { x:'Anestesiologo: ' + b.anestesiologo },
        { t:'b', x:'' },
        { t:'s', x:'DIAGNOSTICO PREOPERATORIO' },
        { x:'Catarata senil nuclear, ojo derecho.' },
        { t:'b', x:'' },
        { t:'s', x:'PROCEDIMIENTO' },
        { x:'Facoemulsificacion con implante de lente intraocular plegable.' },
        { t:'b', x:'' },
        { t:'s', x:'DESCRIPCION' },
        { x:'Anestesia topica mas sedacion. Incision en cornea clara de 2,2 mm.' },
        { x:'Capsulorrexis circular continua. Hidrodiseccion e hidrodelineacion.' },
        { x:'Facoemulsificacion del nucleo. Aspiracion de masas corticales.' },
        { x:'Implante de LIO en saco capsular, bien centrada.' },
        { x:'Sellado de incisiones por hidratacion estromal.' },
        { t:'b', x:'' },
        { x:'Sangrado: nulo.   Complicaciones: ninguna.' },
        { t:'b', x:'' },
        { x:b.cirujano + ' — Firma y sello' }
      ]) }
  ]);

  adjuntar('fic_demo11', [
    { n:'foja-quirurgica-orl.jpg', cirujano:'Dra. Andrea Bianchi',
      dxPost:'Amigdalitis crónica recurrente',
      descripcion:['Intubación orotraqueal. Abrebocas de Davis.',
                   'Amigdalectomía bilateral por disección fría.',
                   'Hemostasia con electrocoagulación bipolar.',
                   'Lechos amigdalinos secos al finalizar.'],
      sangrado:'Aproximadamente 40 mL' }
  ]);

  adjuntar('fic_demo12', [
    { n:'parte-quirurgico-fistula.jpg', cirujano:'Dr. Hernán Lascano',
      dxPost:'Enfermedad renal crónica estadio 5. Acceso vascular',
      descripcion:['Abordaje en muñeca izquierda bajo anestesia regional.',
                   'Disección de arteria radial y vena cefálica.',
                   'Anastomosis latero-terminal con polipropileno 7-0.',
                   'Thrill palpable y soplo audible al finalizar.'],
      sangrado:'Escaso', complicaciones:'Sin complicaciones' },
    { n:'consentimiento-cirujano-firmado.jpg', cirujano:'Dr. Hernán Lascano',
      dxPost:'Enfermedad renal crónica estadio 5',
      descripcion:['Se adjunta consentimiento del acto quirúrgico,',
                   'firmado por el paciente y por el cirujano actuante.'],
      sangrado:'—' }
  ]);

  /* ------------------ Bandeja: valoración pre-anestésica ---------------- */
  enviar(1,  'fic_demo1',  'valoracion', { dias:-6, hh:'11:05', visto:true });
  enviar(2,  'fic_demo4',  'valoracion', { dias:-4, hh:'09:40', visto:true });
  enviar(3,  'fic_demo7',  'valoracion', { dias:-3, hh:'17:15', visto:true });
  enviar(4,  'fic_demo11', 'valoracion', { dias:-2, hh:'12:30', visto:true,
    nota:'La consulta se hizo en consultorio externo, no en la guardia.' });
  enviar(5,  'fic_demo14', 'valoracion', { dias:-5, hh:'10:10', visto:true });
  enviar(6,  'fic_demo12', 'valoracion', { dias:-3, hh:'16:00', visto:true });
  enviar(7,  'fic_demo8',  'valoracion', { dias:1,  hh:'08:55',
    nota:'Paciente ASA III, se pidió interconsulta con cardiología antes de operar.' });
  enviar(8,  'fic_demo9',  'valoracion', { dias:1,  hh:'19:25' });
  enviar(9,  'fic_demo10', 'valoracion', { dias:2,  hh:'13:45' });

  /* -------------- Bandeja: ficha anestésica y parte quirúrgico ---------- */
  enviar(20, 'fic_demo1',  'acto', { dias:2, hh:'20:15', visto:true,
    nota:'Se adjunta protocolo de anatomía patológica. El adicional del 25 % '+
         'corresponde a ASA III, ya asentado en la valoración.' });
  enviar(21, 'fic_demo4',  'acto', { dias:3, hh:'18:05', visto:true });
  enviar(22, 'fic_demo7',  'acto', { dias:2, hh:'21:00' });
  enviar(23, 'fic_demo11', 'acto', { dias:2, hh:'15:20', visto:true });
  enviar(24, 'fic_demo12', 'acto', { dias:4, hh:'11:40',
    nota:'PAMI pidió la documentación completa por auditoría. Va la ficha, el '+
         'parte quirúrgico y el consentimiento firmado por el cirujano.' });
  enviar(25, 'fic_demo2',  'acto', { dias:3, hh:'19:50',
    nota:'Cirugía de urgencia en horario nocturno: el honorario lleva los dos '+
         'adicionales del nomenclador.' });
  /* A propósito sin parte quirúrgico: así se ve el aviso que le queda al
     contador cuando falta la foja. */
  enviar(26, 'fic_demo14', 'acto', { dias:5, hh:'10:35' });
  enviar(27, 'fic_demo6',  'acto', { dias:2, hh:'17:30', visto:true });

  guardarArchivosCache();
  return true;
}

/* =========================================================================
   DEMOSTRACION: PACIENTE PARA PROBAR LA REINTERVENCION
   -------------------------------------------------------------------------
   Las fichas de la demostracion original tienen el consentimiento sin firmar,
   asi que ninguna sirve para probar la importacion: la lista solo ofrece las
   valoraciones COMPLETAS. Esta ficha si lo esta -ASA, conclusion de aptitud,
   plan anestesico y consentimiento con las dos firmas-, y ademas la valoro
   una colega, que es el caso que interesa: «ya fue valorado», no «yo lo
   valore».

   Con ella se prueba el recorrido entero: nueva ficha anestesica, tomar el
   acto, «ya fue valorado para una intervencion anterior», importar, y firmar
   el consentimiento nuevo de la reintervencion en su propia ventana.
   ========================================================================= */
const FIRMA_DEMO_PAC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAABGCAIAAACljX2OAAACjklEQVR42u3cS27jMBBFUS4i415J9r8tBehBo+EAhihVFeXiucggQBLHfKpL8SePA8BfhggAMgBkwE58/fkmA2jw/e+LDGDChA9kABPIACaQAUwgA/YyYfbPyQAmkAFGR2QAE8gQnL4c2gyQyBDTA7GihwlkuK5B4DXAE0wgQ4wJlCADE/jQxwQyXDHh/58GLmVgrQlkmJ4u3/xNkKF/1nz4dBPIEFzZfPhcE8gQ38fnXaqXzY09dzlSuxsyxI92Yi+YJayyGy8ZUuKOqldLumTokPWdep3d3NhBiYKWkiEx62v1eqbin+/D77f68n39bZYMizue8yV7rct/pg+Bt7LK1pEh/RZc0NM/x4drQ7vfW/tLdvfJUDQezZ4DPMGHy1Odh4wAyVC3U5Y9D17ow5nivmlLQSsGE4oTT73kS2ooaZ2gXmkyLBtaJD0uV9yi+6O7Ny9SfEUGE/ot0le2K/B/LT9gQoaeO1Y1TWsW4GBCy73b+vWxBqENJnQ9xVC5edIjMTJ0PtJTs63eJq4xFYES0VIyHG1avtvJ5/D2Ng5wPLP9N885kiGpyb3Te5wMqfuRHhALfGKpX1DjOUEUH92xYCC9WxPo7Efd805u+SiXm80nw4KlifMHen2oUVlBb5LeWNg9zNZ31LNgx8bcf3KocTijrHc5WdkhY6o7r7+VDO8D2S29kZrmVEFnzzGYMBX+humN7N4lL2UmZNyWd05vRKW5cFWHCdldySaZjMA0U4dGU2/paHR+ZLkP+wQyYtOMnStjrRK7RTGSohT0Jyqx+R11pHYtNMBeMhw+LBpkmPJB1thFhjdKSBk7yvAihnxBBoAMABkAMgBkAMgAkAEgA0AGgAwAGQAyAJvzAyEix9qpem6CAAAAAElFTkSuQmCC';
const FIRMA_DEMO_ANE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAABGCAIAAACljX2OAAACXklEQVR42u3dW07kMBAF0FrEfLOS2f+2ggQSGg2Cdpzy+1y1+CLYKfsk7oR0xyUiHwklEIFBBAYRGERgEIFBBAYRGERgWDN/3v5+/vx8KQgMhzL45aU+MJxu4D8PVMBAghMFDEdKKESigDDsL6H87KGMMGwooWSTug0FhmUkpJxSVBWG4yTcXWIJDDtL4AEGEkYumb7fFz+BHwzLSOhzijj51gcMK0loQaL8Rsf2HmBYT0IWierb4buSgGFVCYUT+qelf/qGMMhgDIkH+PKe7+oBhrUlpJD42nzOS1swkNCJRG5zMMg125x4ufTfeN9hIGGiCixaBBhI4AEGM0A1YDD2R9WkvA8wWCDtXJZb3YCBhG2Lc7cbMJCwZ4kqOgADDBtWqa5pGEjYrVbVjcJAwlYVe9Jc3GrGuMIwc9EeNhR3mzGoSjFn6Z43EX2acbrnoWn1Uv5+mAp2f/UaZp15Yt0J8f3BlA6HHBJm85A4QIthKHwkNwsGCZN7yB2gGC67sN2r+8eZkDCzhxYPncZY2dW73VSFD3Kc3EOj0YlJ+lHNoHzt9PLJd1+MMNDDk497yupS9NyNLAa/vCWogPHy903cnge7gWfs6Mz6SY1SPsvEl6nN76H8aJXbmUjcjXalGfKuw0wd7qHz6ETubkwo4e4lKbNzfg+NuhHpuzEhg5cwLv+GuA6Jdh2IRvuQsmSUk0n0P1pFU9N1KxYTQoYk0kG7iCmnY7geX8o0GLIPhmoShkH2xFBI4nIBRw7B8C+Jy0VMgUEEBhEYRGAQgUEEBhEYRGAQgUEEBhEYRI7LOxohlJnKKMRHAAAAAElFTkSuQmCC';

function faltaReintervencionDemo(){ return !DB.pacientes['pac_demo_reint']; }

function sembrarReintervencionDemo(){
  const U3 = 'usr_demo3';                     /* Torres, Alejandra */
  const PR = 'pac_demo_reint';

  escribir('pacientes', PR, {
    id:PR, demo:true, ownerUid:U3,
    apellido:'Ledesma', nombre:'Ana Clara', dni:'27655310', fechaNac:'1979-03-22',
    sexo:'F', peso:'68', talla:'165', obraSocial:'OSDE', nroAfiliado:'62-2765531-04',
    telefono:'2901-447722', grupoSanguineo:'0+', domicilio:'Karukinka 1180',
    localidad:'Ushuaia', email:'anaclara.ledesma@ejemplo.com',
    contactoEmergencia:'Sergio Ledesma (hermano) — 2901-447723',
    observaciones:'Paciente de prueba para el circuito de reintervencion.',
    creado:diaRel(-4)
  });

  escribir('fichas', 'fic_demo_reint', {
    id:'fic_demo_reint', demo:true, ownerUid:U3, pacienteId:PR,
    fecha:diaRel(-3), fechaValoracion:diaRel(-4), fechaCirugia:diaRel(-3),
    hora:'09:15', turno:'Manana', caracter:'programada',
    institucion:'ssj', obraSocial:'OSDE', nroAfiliado:'62-2765531-04',
    especialidad:'Cirugia General', cirugia:'Colecistectomia laparoscopica', cirugiaUA:12,
    diagnostico:'Colelitiasis sintomatica',
    lateralidad:'No aplica', cirujano:'Dr. Martin Gutierrez',
    estado:'cerrada', valoracionGuardada:diaRel(-4)+'T10:40:00.000Z',
    v:{
      antecedentes2:[{n:'Hipotiroidismo', sis:'Endocrino-metabolico'},
                     {n:'Migrana', sis:'Neurologico'}],
      antecedentes:{ 'Endocrino-metabolico':['Hipotiroidismo'], 'Neurologico':['Migrana'] },
      antAnestesicos:['Anestesia general previa sin complicaciones'],
      antAnestDetalle:'Cesarea en 2011 bajo anestesia raquidea, sin complicaciones.',
      medicacion:[{ n:'Levotiroxina', g:'Hormonal', accion:'continuar', dosis:'75 mcg por dia',
                    nota:'CONTINUAR con un sorbo de agua la manana de la cirugia.' }],
      alergias:[], alergiaDetalle:'Sin alergias conocidas.',
      habitos:{ tabaco:'No fuma', alcohol:'Social', drogas:'No consume' },
      examen:{ ta:'118/74', fc:'72', fr:'15', spo2:'98', temp:'36.5', peso:'68', talla:'165',
        cardio:'R1-R2 normofoneticos, sin soplos.',
        respiratorio:'Buena entrada de aire bilateral, sin ruidos agregados.' },
      va:{ mallampati:'II', aperturaBucal:'Mayor a 3 cm', tiromentoniana:'Mayor a 6,5 cm',
           cuelloMov:'Conservada', dentadura:'Completa, sin piezas flojas' },
      lab:{ hb:'13.2', hto:'39', plaquetas:'244000', creatinina:'0.8', glucemia:'92',
            fecha:diaRel(-6) },
      ayuno:{ tipo:'Líquidos claros', hora:'22:00' },
      scores:{ asa:'II', asaE:false },
      riesgo:{ aptitud:'apto',
        fundamento:'Paciente ASA II, hipotiroidea compensada, sin antecedentes cardiovasculares '+
          'ni respiratorios. Via aerea sin predictores de dificultad. Laboratorio dentro de '+
          'parametros. Apta para anestesia general.' ,
        interconsultas:'' }
    },
    /* Los valores tienen que ser EXACTAMENTE los del catalogo: las casillas se
       marcan por coincidencia de texto, y una que no coincide se pierde al
       releer el paso. Ver TECNICAS_ANESTESICAS, DISPOSITIVOS_VA y
       MONITOREO_ESTANDAR en data-catalogos.js. */
    plan:{
      tecnica:['Anestesia general balanceada'],
      dispositivosVA:['Tubo endotraqueal (laringoscopía directa)'],
      monitoreoEstandar:['Oximetría de pulso (SpO₂)','ECG continuo',
                         'Presión arterial no invasiva (PANI)','Capnografía (EtCO₂)','Temperatura'],
      monitoreoAvanzado:[],
      accesos:'Vía periférica 18 G en antebrazo derecho',
      atb:'Cefazolina 2 g EV en la inducción',
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      analgesia:[], destino:'Sala de recuperación' },
    consent:{ quien:'El paciente',
      firmante:'Ledesma, Ana Clara — DNI 27655310',
      items:['Acepta transfusion de hemoderivados si fuera indispensable',
             'Acepta anestesia general',
             'Recibio informacion sobre el ayuno',
             'Recibio informacion sobre la medicacion a suspender'],
      observaciones:'Se converso con la paciente y su hermano. Sin objeciones.',
      firmaPaciente:FIRMA_DEMO_PAC, firmaAnestesiologo:FIRMA_DEMO_ANE,
      fecha:diaRel(-4), hora:'10:35' },
    firma:{ firmado:true, uid:U3, nombre:'Torres, Alejandra', mp:'M.P. 1290',
      fecha:diaRel(-3), hora:'11:40', firmaDataUrl:FIRMA_DEMO_ANE },
    creado:diaRel(-4), modificado:new Date().toISOString(),
    modificadoPor:U3, modificadoPorNombre:'Torres, Alejandra'
  });
  return true;
}
