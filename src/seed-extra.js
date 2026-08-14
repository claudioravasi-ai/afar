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
    comprobante:{ nombre:'cuota-afar-2026.pdf', tipo:'application/pdf', tam:80100,
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
    domicilio:'Magallanes 780', localidad:'Ushuaia',
    contactoEmergencia:'Silvia Coronel (esposa) — 2901-223345',
    observaciones:'Tabaquista de 30 paquetes-año. EPOC leve.', creado:diaRel(-30)
  });
  escribir('pacientes', PB, {
    id:PB, demo:true, ownerUid:U4,
    apellido:'Aguirre', nombre:'Lucía', dni:'42557318', fechaNac:'2000-08-19',
    sexo:'F', peso:'62', talla:'168', obraSocial:'Swiss Medical',
    nroAfiliado:'SM-4255731', telefono:'2964-660011', grupoSanguineo:'A-',
    domicilio:'Perito Moreno 45', localidad:'Río Grande',
    contactoEmergencia:'Norma Aguirre (madre) — 2964-660012',
    observaciones:'Sin antecedentes de relevancia.', creado:diaRel(-21)
  });
  escribir('pacientes', PC, {
    id:PC, demo:true, ownerUid:U5,
    apellido:'Barrientos', nombre:'Omar', dni:'12908744', fechaNac:'1957-12-09',
    sexo:'M', peso:'102', talla:'170', obraSocial:'PAMI - INSSJP',
    nroAfiliado:'150-12908744-01', telefono:'2901-771122', grupoSanguineo:'0+',
    domicilio:'Yaganes 66', localidad:'Ushuaia',
    contactoEmergencia:'Elsa Barrientos (hija) — 2901-771123',
    observaciones:'Insuficiencia renal crónica en diálisis trisemanal.', creado:diaRel(-150)
  });
  escribir('pacientes', PD, {
    id:PD, demo:true, ownerUid:U3,
    apellido:'Quiroga', nombre:'Valentina', dni:'45120983', fechaNac:'2003-03-14',
    sexo:'F', peso:'55', talla:'162', obraSocial:'Particular / Privado',
    telefono:'2901-909090', grupoSanguineo:'A+',
    domicilio:'Fuegia Basket 300', localidad:'Ushuaia',
    contactoEmergencia:'Pablo Quiroga (padre) — 2901-909091',
    observaciones:'', creado:diaRel(-3)
  });

  /* Bloques reutilizables, para no repetir cien líneas por ficha */
  const valBase = (asa, mets) => ({
    cie10:[], antecedentes:{}, medicacion:[], alergias:['Sin alergias conocidas'],
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
    dxQuirurgico:{ c:'N40', d:'Hiperplasia prostática benigna' },
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
    dxQuirurgico:{ c:'M23', d:'Trastorno interno de la rodilla' },
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
    dxQuirurgico:{ c:'K35', d:'Apendicitis aguda' },
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
    dxQuirurgico:{ c:'J35', d:'Amigdalitis crónica' },
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
    dxQuirurgico:{ c:'N18', d:'Enfermedad renal crónica' },
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
    dxQuirurgico:{ c:'K56', d:'Íleo paralítico y obstrucción intestinal' },
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
    dxQuirurgico:{ c:'H25', d:'Catarata senil' },
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
