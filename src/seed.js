/* =========================================================================
   DATOS DE DEMOSTRACION
   Se cargan una sola vez, si la base esta completamente vacia.
   Todo registro creado aca lleva la marca demo:true y se puede borrar de
   una sola vez desde el cartel del panel o desde Coordinacion > Catalogos.
   ========================================================================= */

const DEMO_EMAIL   = 'demo@afar.org.ar';
const DEMO_EMAIL_2 = 'demo2@afar.org.ar';
const DEMO_CLAVE = 'demo1234';

function hayDemo(){
  return COLECCIONES.some(c => Object.values(DB[c] || {}).some(x => x && x.demo));
}

function borrarDemo(){
  let n = 0;
  COLECCIONES.forEach(col => {
    Object.values(DB[col] || {}).forEach(x => {
      if(x && x.demo){ eliminar(col, x.id || x.uid); n++; }
    });
  });
  return n;
}

/* Fecha relativa a hoy, en formato ISO */
function diaRel(d){
  const f = new Date();
  f.setDate(f.getDate() + d);
  return f.toISOString().slice(0,10);
}

/* ¿Está cargado el equipo ampliado (Torres, Sosa, Méndez y Vidal)? */
function faltaEquipoDemo(){ return !DB.usuarios['usr_demo3']; }

/* Siembra a pedido, desde Coordinacion > Catalogos.
   Existe porque, con la base compartida ya configurada, sembrarDemo() no
   corre sola: hace falta un gesto explicito del coordinador.

   Tambien completa instalaciones viejas: si ya estaba la demostracion
   original (Fernandez y Gomez) pero no el equipo ampliado, agrega solo lo
   que falta en vez de no hacer nada. Todo lleva demo:true, asi que no viaja
   a Firebase. */
function sembrarDemoManual(){
  const antes = Object.keys(DB.usuarios).length;
  if(!hayDemo())              sembrarDemo(true);      /* nada cargado: todo */
  else if(faltaEquipoDemo())  sembrarEquipoDemo();    /* completar lo que falta */
  else return 0;                                      /* ya estaba entero */
  return Object.keys(DB.usuarios).length - antes;
}

function sembrarDemo(forzar){
  if(!forzar){
    if(Object.keys(DB.usuarios).length) return false;   // ya hay datos reales
    /* Con la base compartida configurada, la asociacion esta en uso real: nunca
       se siembra sola la demostracion, para no inyectarla en los datos de todos.
       El coordinador puede cargarla a mano desde Catalogos. */
    if(configNube()) return false;
  }

  /* ---------------------------------------------------- Anestesióloga */
  const salt = 'demo' + Math.random().toString(36).slice(2,8);
  const U = 'usr_demo';
  escribir('usuarios', U, {
    uid:U, demo:true, rol:'socio', estado:'aprobado',
    email:DEMO_EMAIL, salt, passHash:hashClave(DEMO_CLAVE, salt),
    apellido:'Fernández', nombre:'Laura', dni:'27458113', fechaNac:'1980-03-22',
    matriculaNacional:'M.N. 128455', matriculaProvincial:'M.P. 1842',
    titulo:'Médica Especialista en Anestesiología',
    telefono:'2901-445566', cuit:'27-27458113-4', condicionIva:'Monotributista',
    domicilio:'Av. Maipú 1250, Ushuaia',
    instituciones:['hru','ssj','hnu'],
    comprobante:{ nombre:'cuota-afar-2026.pdf', tipo:'application/pdf', tam:84210,
                  dataUrl:'data:application/pdf;base64,JVBERi0xLjQK' },
    firmaDataUrl:'', creado:diaRel(-95), aprobadoEn:diaRel(-93), aprobadoPor:'coordinador'
  });

  /* --------------------------------------- Segundo anestesiólogo ----- */
  const salt2 = 'demo' + Math.random().toString(36).slice(2,8);
  const U2 = 'usr_demo2';
  escribir('usuarios', U2, {
    uid:U2, demo:true, rol:'socio', estado:'aprobado',
    email:DEMO_EMAIL_2, salt:salt2, passHash:hashClave(DEMO_CLAVE, salt2),
    apellido:'Gómez', nombre:'Juan Pablo', dni:'25987441', fechaNac:'1977-09-08',
    matriculaNacional:'M.N. 115209', matriculaProvincial:'M.P. 1533',
    titulo:'Médico Especialista en Anestesiología',
    telefono:'2964-556677', cuit:'20-25987441-3', condicionIva:'Responsable Inscripto',
    domicilio:'San Martín 640, Río Grande',
    instituciones:['hrrg','cemep','sfue'],
    comprobante:{ nombre:'cuota-afar-2026-gomez.pdf', tipo:'application/pdf', tam:79300,
                  dataUrl:'data:application/pdf;base64,JVBERi0xLjQK' },
    firmaDataUrl:'', creado:diaRel(-140), aprobadoEn:diaRel(-138), aprobadoPor:'coordinador'
  });

  /* -------------------------------------------------------- Pacientes */
  const P1 = 'pac_demo1', P2 = 'pac_demo2', P3 = 'pac_demo3';

  escribir('pacientes', P1, {
    id:P1, demo:true, ownerUid:U,
    apellido:'Pérez', nombre:'María Elena', dni:'20114872', fechaNac:'1968-07-14',
    sexo:'F', peso:'94', talla:'161', obraSocial:'OSDE', nroAfiliado:'62-4471903-01',
    telefono:'2901-556677', grupoSanguineo:'A+', domicilio:'Gobernador Paz 845',
    localidad:'Ushuaia', contactoEmergencia:'Jorge Pérez (hijo) — 2901-554433',
    observaciones:'Ansiedad marcada frente a procedimientos. Prefiere premedicación.',
    creado:diaRel(-60)
  });

  escribir('pacientes', P2, {
    id:P2, demo:true, ownerUid:U,
    apellido:'Suárez', nombre:'Roberto Carlos', dni:'10874336', fechaNac:'1949-11-03',
    sexo:'M', peso:'71', talla:'173', obraSocial:'PAMI - INSSJP', nroAfiliado:'150-10874336-00',
    telefono:'2964-421188', grupoSanguineo:'0+', domicilio:'Piedrabuena 120',
    localidad:'Río Grande', contactoEmergencia:'Marta Suárez (esposa) — 2964-421189',
    observaciones:'Portador de marcapasos DDD desde 2019. Anticoagulado por FA.',
    creado:diaRel(-2)
  });

  escribir('pacientes', P3, {
    id:P3, demo:true, ownerUid:U,
    apellido:'Ramírez', nombre:'Sofía', dni:'38992104', fechaNac:'1996-02-18',
    sexo:'F', peso:'78', talla:'166', obraSocial:'IPAUSS / OSEF (Tierra del Fuego)',
    nroAfiliado:'TF-889210', telefono:'2901-667788', grupoSanguineo:'0-',
    domicilio:'Kuanip 330', localidad:'Ushuaia',
    contactoEmergencia:'Diego Ramírez (pareja) — 2901-667789',
    observaciones:'Cursando 38 semanas. Cesárea anterior en 2022.',
    creado:diaRel(-8)
  });

  /* ------------------------------------------- Ficha 1 — completa, hoy */
  escribir('fichas', 'fic_demo1', {
    id:'fic_demo1', demo:true, ownerUid:U, pacienteId:P1,
    fecha:diaRel(0), hora:'08:30', turno:'Mañana', caracter:'programada',
    institucion:'ssj', obraSocial:'OSDE', nroAfiliado:'62-4471903-01',
    especialidad:'Cirugía General', cirugia:'Colecistectomía laparoscópica', cirugiaUA:12,
    dxQuirurgico:{ c:'K80.0', d:'Colelitiasis con colecistitis aguda' },
    lateralidad:'No aplica', cirujano:'Dr. Martín Gutiérrez', ayudante:'Dra. Paula Vega',
    instrumentador:'Inst. Carla Ruiz', estado:'cerrada',
    v:{
      cie10:[{c:'I10',d:'Hipertensión esencial (primaria)'},
             {c:'E11',d:'Diabetes mellitus tipo 2'},
             {c:'E66',d:'Obesidad'},
             {c:'K21',d:'Enfermedad por reflujo gastroesofágico'}],
      antecedentes:{
        'Cardiovascular':['Hipertensión arterial'],
        'Endocrino-metabólico':['Diabetes tipo 2','Obesidad','Dislipemia'],
        'Digestivo-hepático':['Reflujo gastroesofágico','Hernia hiatal'],
        'Respiratorio':['SAHOS / apnea del sueño']
      },
      antecedentesOtros:'Cesárea en 1994 y apendicectomía en 2008, ambas bajo anestesia general sin complicaciones.',
      antAnestesicos:['Anestesia general previa sin complicaciones','Náuseas y vómitos postoperatorios severos'],
      antAnestDetalle:'Apendicectomía 2008 (Hospital Regional Ushuaia): náuseas y vómitos intensos durante las primeras 12 h del postoperatorio.',
      medicacion:[
        {n:'Enalapril / IECA', g:'Antihipertensivo', accion:'evaluar', dosis:'10 mg cada 12 h',
         nota:'Considerar omitir la dosis de la mañana: riesgo de hipotensión refractaria a la inducción. Continuar si es por insuficiencia cardíaca con estricta vigilancia.'},
        {n:'Metformina', g:'Antidiabético', accion:'suspender', dosis:'850 mg cada 12 h',
         nota:'Suspender el día de la cirugía (24 h si hay contraste EV o deterioro renal): riesgo de acidosis láctica.'},
        {n:'Atorvastatina / Estatinas', g:'Hipolipemiante', accion:'continuar', dosis:'20 mg por día',
         nota:'CONTINUAR: efecto protector cardiovascular perioperatorio.'},
        {n:'Omeprazol / IBP', g:'Digestivo', accion:'continuar', dosis:'20 mg por día',
         nota:'Continuar; útil como profilaxis de aspiración.'}
      ],
      alergias:['Penicilinas / betalactámicos'],
      alergiaDetalle:'Exantema generalizado con amoxicilina a los 30 años. Sin compromiso respiratorio. Sin estudio alergológico.',
      habitos:{ tabaco:'Ex fumador', tabacoCant:'15', alcohol:'Social', drogas:'No consume' },
      examen:{ ta:'145/88', fc:'82', fr:'16', spo2:'96', temp:'36.4', peso:'94', talla:'161',
        cardio:'R1-R2 normofonéticos, sin soplos. Pulsos periféricos presentes y simétricos.',
        respiratorio:'Buena entrada de aire bilateral, sin ruidos agregados. Sin disnea de reposo.',
        abdomen:'Globuloso, blando, depresible. Murphy positivo. Sin defensa.',
        neuro:'Vigil, orientada, sin déficit focal.',
        accesos:'Regulares', columna:'Apófisis palpables, sin dificultad' },
      va:{ mallampati:'3', aperturaBucal:'4', tiromentoniana:'6.5', esternomentoniana:'13',
        cuelloMov:'normal', protrusion:'clase2', cuelloCirc:'42', denticion:'Completa y sana',
        intubacionPrevia:'facil', cormackPrevia:'II a',
        otros:['Obesidad cervical','Riesgo de aspiración'],
        plan:'Inducción en rampa con preoxigenación optimizada. Videolaringoscopio disponible como plan B. Segundo operador presente.' },
      lab:{ hb:'12.8', hto:'38.4', plaquetas:'254', gb:'7.2', tp:'92', rin:'1.05', kptt:'31',
        glucemia:'148', hba1c:'7.4', urea:'34', creatinina:'0.82', sodio:'139', potasio:'4.2',
        got:'28', gpt:'34', bilirrubina:'0.9', albumina:'4.1', fecha:diaRel(-5) },
      estudios:{ ecg:'Ritmo sinusal a 78 lpm. Eje normal. Sin alteraciones de la repolarización.',
        rx:'Sin infiltrados ni derrame. Índice cardiotorácico conservado.',
        ecocardio:'FEy 62 %. Hipertrofia concéntrica leve del ventrículo izquierdo. Sin valvulopatías significativas.',
        espirometria:'' },
      scores:{ asa:'III', asaE:false, mets:5, fragilidad:'2',
        rcri:[0], stopbang:{ronquido:true,cansancio:true,apneas:true,presion:true,imc:true,edad:true,cuello:false,sexo:false},
        apfel:{mujer:true,nofuma:true,antNVPO:true,opioides:true},
        caprini:[1,4,5,17], arIncision:'alta', arDuracion:'90', arInf:false },
      ayuno:{ tipo:'Comida grasa, frita o carne', hora:'21:00',
        riesgos:['Reflujo severo','Obesidad mórbida'],
        profilaxis:['Omeprazol 40 mg','Metoclopramida 10 mg'] },
      riesgo:{ aptitud:'reservas',
        fundamento:'Paciente ASA III con obesidad grado II, SAHOS de alto riesgo por STOP-BANG y diabetes con control metabólico subóptimo (HbA1c 7,4 %). Riesgo cardíaco bajo (RCRI 1) con capacidad funcional conservada de 5 MET. Apta con reservas: se planifica manejo de vía aérea con rampa y videolaringoscopio disponible, profilaxis antiemética cuádruple por Apfel 4/4, control glucémico horario y monitoreo prolongado en recuperación por el SAHOS.',
        interconsultas:'Endocrinología para optimización glucémica ambulatoria posterior al alta.',
        fecha:diaRel(-5), ambito:'Consultorio de preanestesia' }
    },
    plan:{
      tecnica:['Anestesia general balanceada','Anestesia general con IOT'],
      dispositivosVA:['Tubo endotraqueal (laringoscopía directa)','Tubo endotraqueal (videolaringoscopio)'],
      monitoreoEstandar:MONITOREO_ESTANDAR.slice(0,7),
      monitoreoAvanzado:['Índice biespectral (BIS) / EEG procesado','Diuresis horaria'],
      accesos:'Dos vías periféricas 18G en miembros superiores.',
      atb:'Cefazolina', atbOtro:'Alergia a betalactámicos: se reemplaza por clindamicina 900 mg EV.',
      tev:'Enoxaparina 40 mg/día',
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg','Droperidol 0,625-1,25 mg','TIVA con propofol'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h','Morfina EV titulada','Infiltración de la herida','Dexametasona 4-8 mg EV'],
      analgesiaDetalle:'Paracetamol 1 g EV cada 8 h fijo + dipirona 1 g EV cada 8 h alternada. Morfina 2 mg EV de rescate cada 10 min a demanda en recuperación.',
      destino:'Sala de recuperación postanestésica (URPA)',
      transfusion:'Grupo y factor solicitados',
      indicaciones:'Ayuno de 8 h para sólidos, líquidos claros hasta 2 h antes. Suspender metformina el día de la cirugía. Tomar enalapril sólo si la presión supera 160/100. Presentarse a las 07:00 con acompañante.',
      observaciones:'Solicitar cama de recuperación con monitoreo prolongado por SAHOS.'
    },
    acto:{
      ingreso:'08:20', inicioAnestesia:'08:35', finAnestesia:'10:05', salida:'10:20',
      tecnica:['Anestesia general balanceada','Anestesia general con IOT'],
      dispositivosVA:['Tubo endotraqueal (laringoscopía directa)'],
      cormack:'II a', intentos:'1', tubo:'TET 7.0 con balón, fijado a 21 cm',
      farmacos:'Inducción: propofol 180 mg, fentanilo 200 µg, rocuronio 50 mg. Mantenimiento: sevoflurano 1 CAM + remifentanilo 0,1 µg/kg/min. Reversión: sugammadex 200 mg. Antieméticos: ondansetrón 4 mg, dexametasona 8 mg. Analgesia: paracetamol 1 g, dipirona 2 g, morfina 4 mg.',
      cristaloides:'1200', coloides:'0', sangrado:'80', diuresis:'350',
      hemoderivados:'', vasoactivos:'Efedrina 10 mg en dos bolos por hipotensión post inducción.',
      oms:['entrada','pausa','salida'],
      eventos:['Hipotensión que requirió vasopresores'],
      eventosDetalle:'Hipotensión de 78/45 mmHg a los 4 minutos de la inducción, resuelta con dos bolos de efedrina de 5 mg y carga de 500 ml de cristaloides. Sin repercusión posterior.',
      aldrete:{actividad:2,respiracion:2,circulacion:2,conciencia:2,saturacion:2}, aldreteTotal:10,
      destinoReal:'Sala general', estadoEgreso:'Estable, sin complicaciones',
      observaciones:'Extubación sin incidentes en quirófano. Sin náuseas en recuperación pese al Apfel 4/4.'
    },
    consent:{ quien:'El paciente',
      firmante:'Pérez, María Elena — DNI 20114872',
      items:['Acepta transfusión de hemoderivados si fuera necesaria','Acepta anestesia general',
             'Recibió información sobre el ayuno','Recibió información sobre la medicación a suspender'],
      observaciones:'', firmaPaciente:'', firmaAnestesiologo:'', fecha:diaRel(-5), hora:'11:20' },
    honConsulta:{ modalidad:'obrasocial', total:38000, estado:'Facturado',
      fechaPresentacion:diaRel(0), comprobante:'FC-B-0003-00001846', cobrado:0 },
    hon:{ modalidad:'abierto', ua:12, valorUnidad:9500, adicionales:['asa34'], pctAdicional:25,
      montoFijo:0, total:142500, estado:'Facturado', fechaPresentacion:diaRel(0),
      comprobante:'FC-B-0003-00001847', cobrado:0,
      observaciones:'' },
    creado:diaRel(-5), modificado:new Date().toISOString(),
    modificadoPor:U, modificadoPorNombre:'Fernández, Laura'
  });

  /* --------------------------------- Ficha 2 — urgencia, ASA IV, ayer */
  escribir('fichas', 'fic_demo2', {
    id:'fic_demo2', demo:true, ownerUid:U, pacienteId:P2,
    fecha:diaRel(-1), hora:'23:40', turno:'Noche', caracter:'urgencia',
    institucion:'hrrg', obraSocial:'PAMI - INSSJP', nroAfiliado:'150-10874336-00',
    especialidad:'Traumatología y Ortopedia',
    cirugia:'Osteosíntesis de fractura de cadera (clavo endomedular)', cirugiaUA:14,
    dxQuirurgico:{ c:'S72.1', d:'Fractura pertrocantérea' },
    lateralidad:'Derecha', cirujano:'Dr. Hernán Ledesma', ayudante:'Dr. Nicolás Sosa',
    estado:'cerrada',
    v:{
      cie10:[{c:'I48',d:'Fibrilación y aleteo auricular'},
             {c:'I25',d:'Enfermedad isquémica crónica del corazón'},
             {c:'I50',d:'Insuficiencia cardíaca'},
             {c:'N18.4',d:'Enfermedad renal crónica estadio 4'},
             {c:'Z95.0',d:'Presencia de marcapasos cardíaco'},
             {c:'S72.1',d:'Fractura pertrocantérea'}],
      antecedentes:{
        'Cardiovascular':['Cardiopatía isquémica / IAM previo','Insuficiencia cardíaca','Fibrilación auricular','Portador de marcapasos / CDI','Stent coronario'],
        'Renal-urológico':['Insuficiencia renal crónica'],
        'Hematológico':['Anticoagulación crónica','Anemia'],
        'Neurológico':['ACV / AIT previo']
      },
      antecedentesOtros:'IAM en 2016 con angioplastia y stent farmacoactivo en descendente anterior. Marcapasos DDD implantado en 2019 por bloqueo AV completo. ACV isquémico menor en 2021 sin secuelas motoras.',
      antAnestesicos:['Anestesia raquídea previa sin complicaciones'],
      antAnestDetalle:'Resección transuretral de próstata en 2018 bajo raquídea, sin complicaciones.',
      medicacion:[
        {n:'Apixabán', g:'Anticoagulante (DOAC)', accion:'suspender', dosis:'5 mg cada 12 h — última toma hace 26 h',
         nota:'24-48 h según riesgo. Neuroaxial: 72 h (ASRA).'},
        {n:'Atenolol / Bisoprolol / Betabloqueantes', g:'Antihipertensivo', accion:'continuar', dosis:'Bisoprolol 5 mg por día',
         nota:'CONTINUAR SIEMPRE. La suspensión abrupta aumenta mortalidad e isquemia. No iniciar betabloqueo el día de la cirugía.'},
        {n:'Furosemida / Diuréticos', g:'Diurético', accion:'evaluar', dosis:'40 mg por día',
         nota:'Omitir la mañana de la cirugía salvo insuficiencia cardíaca descompensada. Controlar potasio.'},
        {n:'Atorvastatina / Estatinas', g:'Hipolipemiante', accion:'continuar', dosis:'40 mg por día',
         nota:'CONTINUAR: efecto protector cardiovascular perioperatorio.'},
        {n:'Aspirina (AAS)', g:'Antiagregante', accion:'evaluar', dosis:'100 mg por día',
         nota:'Continuar en prevención secundaria y stent coronario. Suspender 7 días sólo en prevención primaria o cirugía de alto riesgo hemorrágico.'}
      ],
      alergias:[], alergiaDetalle:'Sin alergias conocidas.',
      habitos:{ tabaco:'Ex fumador', tabacoCant:'40', alcohol:'No consume', drogas:'No consume' },
      examen:{ ta:'106/62', fc:'96', fr:'22', spo2:'93', temp:'36.1', peso:'71', talla:'173',
        cardio:'Ritmo irregular. Soplo sistólico 2/6 en foco aórtico. Ingurgitación yugular 2/3. Edemas maleolares.',
        respiratorio:'Rales crepitantes bibasales. Requiere oxígeno por cánula a 3 l/min.',
        abdomen:'Blando, indoloro, sin visceromegalias.',
        neuro:'Vigil, orientado. Dolor intenso en cadera derecha. Sin déficit focal.',
        accesos:'Dificultosos — prever ecografía',
        columna:'Escoliosis / cirugía previa' },
      va:{ mallampati:'3', aperturaBucal:'3.5', tiromentoniana:'6', esternomentoniana:'12',
        cuelloMov:'limitada', protrusion:'clase2', cuelloCirc:'38',
        denticion:'Prótesis removible', intubacionPrevia:'sin_datos', cormackPrevia:'',
        otros:['Cuello corto','Riesgo de aspiración'],
        plan:'Anestesia raquídea de elección por el estado cardiovascular. Carro de vía aérea difícil preparado por si se requiere conversión a general.' },
      lab:{ hb:'9.4', hto:'28.2', plaquetas:'168', gb:'11.4', tp:'68', rin:'1.38', kptt:'36',
        glucemia:'118', hba1c:'', urea:'88', creatinina:'2.34', sodio:'134', potasio:'5.1',
        got:'32', gpt:'28', bilirrubina:'1.1', albumina:'3.1', fecha:diaRel(-1) },
      estudios:{ ecg:'Fibrilación auricular con respuesta ventricular a 96 lpm. Espigas de marcapasos con captura ventricular intermitente.',
        rx:'Redistribución de flujo. Derrame pleural bilateral leve. Cardiomegalia.',
        ecocardio:'FEy 38 %. Aquinesia anteroseptal. Insuficiencia mitral moderada. PSAP estimada en 48 mmHg.',
        espirometria:'' },
      scores:{ asa:'IV', asaE:true, mets:2, fragilidad:'6',
        rcri:[1,2,3,5], stopbang:{ronquido:true,cansancio:true,apneas:false,presion:true,imc:false,edad:true,cuello:false,sexo:true},
        apfel:{mujer:false,nofuma:true,antNVPO:false,opioides:true},
        caprini:[2,4,18,19,20,27,28], arIncision:'periferica', arDuracion:'120', arInf:false },
      ayuno:{ tipo:'Comida grasa, frita o carne', hora:'20:30',
        riesgos:['Cirugía de urgencia','Trauma reciente'],
        profilaxis:['Omeprazol 40 mg','Metoclopramida 10 mg'] },
      riesgo:{ aptitud:'optimizar',
        fundamento:'Paciente ASA IV E de 76 años con insuficiencia cardíaca descompensada (FEy 38 %, rales bibasales, PSAP 48 mmHg), fibrilación auricular anticoagulada con apixabán de última toma a las 26 h, enfermedad renal crónica estadio 4 y anemia de 9,4 g/dl. RCRI 4 con riesgo de evento cardiovascular mayor superior al 15 %. Fragilidad 6/9. Se difiere la cirugía seis horas para diuresis, corrección de la sobrecarga y transfusión de una unidad de glóbulos rojos. El intervalo de 26 h desde el apixabán CONTRAINDICA el bloqueo neuroaxial según ASRA, que exige 72 h; se reevalúa a las 72 h o se procede con anestesia general si la demora resulta inaceptable por el riesgo de la fractura.',
        interconsultas:'Cardiología: evaluación de la descompensación y control del marcapasos. Hematología: manejo de la anticoagulación perioperatoria.',
        fecha:diaRel(-1), ambito:'Guardia / urgencia' }
    },
    plan:{
      tecnica:['Anestesia general balanceada','Secuencia de intubación rápida (SIR)'],
      dispositivosVA:['Tubo endotraqueal (videolaringoscopio)'],
      monitoreoEstandar:MONITOREO_ESTANDAR.slice(0,7),
      monitoreoAvanzado:['Presión arterial invasiva','Presión venosa central','Diuresis horaria','Ecografía a la cabecera (POCUS)'],
      accesos:'Vía periférica 16G ecoguiada + línea arterial radial izquierda + acceso venoso central yugular derecho.',
      atb:'Cefazolina', atbOtro:'',
      tev:'HNF 5000 U c/8-12 h',
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Morfina EV titulada','Bloqueo femoral','Bloqueo del canal aductor'],
      analgesiaDetalle:'Bloqueo femoral ecoguiado con ropivacaína 0,375 % 20 ml antes de la inducción, para movilizar al paciente con menor dolor. Paracetamol fijo. Morfina titulada. Evitar AINE por la función renal.',
      destino:'Unidad de terapia intensiva',
      transfusion:'Reserva de 2 unidades',
      indicaciones:'Ayuno mantenido. Oxígeno a 3 l/min. Furosemida 40 mg EV y control de diuresis horaria previo a quirófano.',
      observaciones:'Imán disponible en quirófano por el marcapasos. Programación revisada por cardiología: no dependiente. Evitar bisturí monopolar prolongado.'
    },
    acto:{
      ingreso:'23:35', inicioAnestesia:'23:50', finAnestesia:'01:35', salida:'01:50',
      tecnica:['Anestesia general balanceada','Secuencia de intubación rápida (SIR)','Bloqueo femoral'],
      dispositivosVA:['Tubo endotraqueal (videolaringoscopio)'],
      cormack:'III', intentos:'2', tubo:'TET 8.0 con balón, fijado a 23 cm, con guía Frova',
      farmacos:'Bloqueo femoral con ropivacaína 0,375 % 20 ml. Inducción: etomidato 14 mg, fentanilo 100 µg, rocuronio 85 mg. Mantenimiento: sevoflurano 0,8 CAM. Noradrenalina en infusión 0,08 µg/kg/min. Ácido tranexámico 1 g. Reversión: sugammadex 300 mg.',
      cristaloides:'700', coloides:'0', sangrado:'450', diuresis:'180',
      hemoderivados:'1 unidad de glóbulos rojos desplasmatizados intraoperatoria.',
      vasoactivos:'Noradrenalina en infusión continua durante todo el procedimiento, destetada parcialmente al final.',
      oms:['entrada','pausa','salida'],
      eventos:['Hipotensión que requirió vasopresores','Taquiarritmia','Intubación dificultosa (>2 intentos)','Sangrado mayor / transfusión','Hipotermia < 35 °C'],
      eventosDetalle:'Cormack III en el primer intento con laringoscopía directa; se logra la intubación en el segundo intento con videolaringoscopio y guía Frova. Respuesta ventricular rápida de la fibrilación auricular a 145 lpm a los 40 minutos, controlada con amiodarona 150 mg EV en 10 minutos. Temperatura mínima de 34,8 °C, corregida con manta térmica y calentador de fluidos.',
      aldrete:{actividad:1,respiracion:1,circulacion:1,conciencia:1,saturacion:1}, aldreteTotal:5,
      destinoReal:'Unidad de terapia intensiva', estadoEgreso:'Requiere vigilancia estrecha',
      observaciones:'Se traslada a terapia intensiva intubado, con noradrenalina en infusión, para destete y extubación programada. Se informa a la familia.'
    },
    consent:{ quien:'Representante legal / familiar',
      firmante:'Marta Suárez (esposa) — DNI 11987654',
      items:['Acepta transfusión de hemoderivados si fuera necesaria','Acepta anestesia general'],
      observaciones:'Consentimiento otorgado por la cónyuge dada la situación de urgencia y el dolor del paciente. Se explicó el riesgo elevado (ASA IV) y la posibilidad de ingreso a terapia intensiva.',
      firmaPaciente:'', firmaAnestesiologo:'', fecha:diaRel(-1), hora:'23:15' },
    honConsulta:{ modalidad:'incluida', total:0, estado:'Pendiente' },
    hon:{ modalidad:'abierto', ua:14, valorUnidad:7500, adicionales:['urgencia','nocturno','asa34','edad','invasivo','bloqueo'],
      pctAdicional:190, montoFijo:0, total:304500, estado:'Pendiente', fechaPresentacion:'',
      comprobante:'', cobrado:0,
      observaciones:'Presentar con el detalle de los adicionales: urgencia, nocturnidad, ASA IV, mayor de 80 años, monitoreo invasivo y bloqueo analgésico complementario.' },
    creado:diaRel(-1), modificado:new Date().toISOString(),
    modificadoPor:U, modificadoPorNombre:'Fernández, Laura'
  });

  /* ------------------------ Ficha 3 — mañana, INCOMPLETA (dispara avisos) */
  escribir('fichas', 'fic_demo3', {
    id:'fic_demo3', demo:true, ownerUid:U, pacienteId:P3,
    fecha:diaRel(1), hora:'10:00', turno:'Mañana', caracter:'programada',
    institucion:'hru', obraSocial:'IPAUSS / OSEF (Tierra del Fuego)', nroAfiliado:'TF-889210',
    especialidad:'Obstetricia', cirugia:'Cesárea programada', cirugiaUA:10,
    dxQuirurgico:{ c:'O34.2', d:'Cicatriz uterina por cirugía previa' },
    lateralidad:'No aplica', cirujano:'Dra. Verónica Ibáñez', ayudante:'',
    asignadoUid:U2,          /* la evalúa Laura, la opera Juan Pablo */
    estado:'borrador',
    v:{
      cie10:[{c:'O34.2',d:'Cicatriz uterina por cirugía previa'}],
      antecedentes:{ 'Obstétrico':['Embarazo actual','Cesárea previa'] },
      antecedentesOtros:'',
      antAnestesicos:['Anestesia raquídea previa sin complicaciones'], antAnestDetalle:'',
      medicacion:[], medicacionOtros:'Hierro y ácido fólico del control prenatal.',
      alergias:[], alergiaDetalle:'',
      habitos:{ tabaco:'No fumador', alcohol:'No consume', drogas:'No consume' },
      examen:{ ta:'118/72', fc:'88', spo2:'98', peso:'78', talla:'166' },
      va:{ mallampati:'2', aperturaBucal:'4' },
      lab:{ hb:'11.1', plaquetas:'186', fecha:diaRel(-3) },
      estudios:{},
      scores:{ rcri:[], stopbang:{}, apfel:{mujer:true,nofuma:true}, caprini:[] },
      ayuno:{},
      riesgo:{}
    },
    plan:{}, acto:{}, hon:{}, consent:{},
    creado:diaRel(-3), modificado:new Date(Date.now()-86400000*3).toISOString(),
    modificadoPor:U, modificadoPorNombre:'Fernández, Laura'
  });

  /* --------------------------- Ficha 4 — mes anterior, cobrada */
  const mesPasado = (() => { const d = new Date(); d.setMonth(d.getMonth()-1); d.setDate(12);
    return d.toISOString().slice(0,10); })();
  escribir('fichas', 'fic_demo4', {
    id:'fic_demo4', demo:true, ownerUid:U, pacienteId:P1,
    fecha:mesPasado, hora:'14:15', turno:'Tarde', caracter:'programada',
    institucion:'hru', obraSocial:'OSDE', nroAfiliado:'62-4471903-01',
    especialidad:'Cirugía General', cirugia:'Hernioplastia umbilical', cirugiaUA:7,
    dxQuirurgico:{ c:'K42', d:'Hernia umbilical' },
    cirujano:'Dr. Martín Gutiérrez', estado:'cerrada',
    v:{ cie10:[{c:'I10',d:'Hipertensión esencial (primaria)'},{c:'E11',d:'Diabetes mellitus tipo 2'}],
      antecedentes:{'Cardiovascular':['Hipertensión arterial'],'Endocrino-metabólico':['Diabetes tipo 2','Obesidad']},
      medicacion:[], alergias:['Penicilinas / betalactámicos'],
      examen:{ ta:'138/84', fc:'76', spo2:'97', peso:'95', talla:'161' },
      va:{ mallampati:'3', aperturaBucal:'4', tiromentoniana:'6.5' },
      lab:{ hb:'13.1', plaquetas:'249', creatinina:'0.79' },
      estudios:{},
      scores:{ asa:'III', mets:5, rcri:[0], stopbang:{ronquido:true,imc:true,edad:true},
        apfel:{mujer:true,nofuma:true,antNVPO:true,opioides:true}, caprini:[1,4],
        arIncision:'periferica', arDuracion:'60' },
      ayuno:{ tipo:'Comida grasa, frita o carne', hora:'22:00' },
      riesgo:{ aptitud:'apto', fundamento:'ASA III estable para cirugía de bajo riesgo. Sin cambios respecto de la evaluación previa.', fecha:mesPasado, ambito:'Consultorio de preanestesia' } },
    plan:{ tecnica:['Anestesia raquídea (subaracnoidea)'],
      monitoreoEstandar:MONITOREO_ESTANDAR.slice(0,5),
      atb:'Clindamicina', tev:'Deambulación precoz',
      nvpo:['Ondansetrón 4 mg','Dexametasona 4-8 mg'],
      analgesia:['Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h','Infiltración de la herida'],
      destino:'Alta ambulatoria el mismo día' },
    acto:{ inicioAnestesia:'14:20', finAnestesia:'15:10',
      tecnica:['Anestesia raquídea (subaracnoidea)'],
      farmacos:'Bupivacaína hiperbárica 0,5 % 12,5 mg + fentanilo 20 µg intratecal. Sedación con midazolam 2 mg.',
      cristaloides:'800', sangrado:'30', oms:['entrada','pausa','salida'],
      eventos:['Sin eventos'],
      aldrete:{actividad:2,respiracion:2,circulacion:2,conciencia:2,saturacion:2}, aldreteTotal:10,
      destinoReal:'Alta ambulatoria el mismo día', estadoEgreso:'Estable, sin complicaciones' },
    consent:{ quien:'El paciente', firmante:'Pérez, María Elena — DNI 20114872',
      items:['Acepta técnica regional','Acepta transfusión de hemoderivados si fuera necesaria'],
      fecha:mesPasado, hora:'13:40' },
    honConsulta:{ modalidad:'obrasocial', total:34000, estado:'Cobrado',
      fechaPresentacion:mesPasado, comprobante:'FC-B-0003-00001790', cobrado:34000 },
    hon:{ modalidad:'abierto', ua:7, valorUnidad:9500, adicionales:['asa34'], pctAdicional:25,
      total:83125, estado:'Cobrado', fechaPresentacion:mesPasado,
      comprobante:'FC-B-0003-00001791', cobrado:83125, observaciones:'' },
    creado:mesPasado, modificado:mesPasado+'T18:00:00.000Z',
    modificadoPor:U, modificadoPorNombre:'Fernández, Laura'
  });

  /* ------- Ficha 5 — hace 9 días, quedó sin cerrar (dispara dos avisos) */
  escribir('fichas', 'fic_demo5', {
    id:'fic_demo5', demo:true, ownerUid:U, pacienteId:P2,
    fecha:diaRel(-9), hora:'11:30', turno:'Mañana', caracter:'programada',
    institucion:'cemep', obraSocial:'PAMI - INSSJP', nroAfiliado:'150-10874336-00',
    especialidad:'Endoscopía Digestiva',
    cirugia:'Videoendoscopía digestiva alta con sedación', cirugiaUA:5,
    dxQuirurgico:{ c:'D64.9', d:'Anemia no especificada' },
    cirujano:'Dr. Alejandro Bravo', estado:'borrador',
    v:{
      cie10:[{c:'D64.9',d:'Anemia no especificada'},
             {c:'I48',d:'Fibrilación y aleteo auricular'},
             {c:'Z79.01',d:'Uso prolongado de anticoagulantes'}],
      antecedentes:{ 'Cardiovascular':['Fibrilación auricular','Cardiopatía isquémica / IAM previo'],
                     'Hematológico':['Anemia','Anticoagulación crónica'] },
      antAnestesicos:['Sin antecedentes anestésicos'],
      medicacion:[{n:'Apixabán', g:'Anticoagulante (DOAC)', accion:'suspender', dosis:'5 mg cada 12 h',
        nota:'24-48 h según riesgo. Neuroaxial: 72 h (ASRA).'}],
      alergias:[],
      habitos:{ tabaco:'Ex fumador', alcohol:'No consume' },
      examen:{ ta:'128/76', fc:'74', spo2:'96', peso:'72', talla:'173' },
      va:{ mallampati:'3', aperturaBucal:'3.5', tiromentoniana:'6' },
      lab:{ hb:'9.1', hto:'27.8', plaquetas:'175', creatinina:'2.1', fecha:diaRel(-11) },
      estudios:{},
      scores:{ asa:'III', mets:3, rcri:[1], stopbang:{ronquido:true,edad:true,sexo:true},
        apfel:{nofuma:true}, caprini:[2,17], arIncision:'periferica', arDuracion:'30' },
      ayuno:{ tipo:'Comida grasa, frita o carne', hora:'22:00' },
      riesgo:{ aptitud:'apto', fundamento:'ASA III para procedimiento de bajo riesgo bajo sedación. Anticoagulación suspendida 48 h antes. Se monitoriza en sala de endoscopía con equipo de reanimación disponible.',
        fecha:diaRel(-11), ambito:'Consultorio de preanestesia' }
    },
    plan:{ tecnica:['Sedación profunda','Cuidado anestésico monitorizado (MAC)'],
      dispositivosVA:['Cánula nasal / bigotera'],
      monitoreoEstandar:MONITOREO_ESTANDAR.slice(0,4),
      tev:'Deambulación precoz',
      analgesia:['Paracetamol 1 g EV c/6-8 h'],
      destino:'Alta ambulatoria el mismo día' },
    acto:{}, hon:{}, consent:{},
    creado:diaRel(-11), modificado:new Date(Date.now()-86400000*9).toISOString(),
    modificadoPor:U, modificadoPorNombre:'Fernández, Laura'
  });

  /* --------- Ficha 6 — mes anterior, sin presentar a la obra social */
  escribir('fichas', 'fic_demo6', {
    id:'fic_demo6', demo:true, ownerUid:U, pacienteId:P2,
    fecha:mesPasado, hora:'09:00', turno:'Mañana', caracter:'programada',
    institucion:'hrrg', obraSocial:'PAMI - INSSJP', nroAfiliado:'150-10874336-00',
    especialidad:'Hemodinamia', cirugia:'Cardioversión eléctrica', cirugiaUA:5,
    dxQuirurgico:{ c:'I48.0', d:'Fibrilación auricular paroxística' },
    cirujano:'Dr. Sebastián Ocampo', estado:'cerrada',
    v:{ cie10:[{c:'I48.0',d:'Fibrilación auricular paroxística'},
               {c:'I50',d:'Insuficiencia cardíaca'}],
      antecedentes:{ 'Cardiovascular':['Fibrilación auricular','Insuficiencia cardíaca','Portador de marcapasos / CDI'] },
      antAnestesicos:['Sin antecedentes anestésicos'],
      medicacion:[], alergias:[],
      habitos:{ tabaco:'Ex fumador', alcohol:'No consume' },
      examen:{ ta:'118/70', fc:'128', spo2:'95', peso:'72', talla:'173' },
      va:{ mallampati:'3', aperturaBucal:'3.5', tiromentoniana:'6' },
      lab:{ hb:'10.2', plaquetas:'180', potasio:'4.4', creatinina:'2.0' },
      estudios:{ ecg:'Fibrilación auricular con respuesta ventricular rápida a 128 lpm.' },
      scores:{ asa:'IV', mets:2, rcri:[1,2], stopbang:{ronquido:true,edad:true,sexo:true},
        apfel:{nofuma:true}, caprini:[2,17], arIncision:'periferica', arDuracion:'20' },
      ayuno:{ tipo:'Comida grasa, frita o carne', hora:'21:00' },
      riesgo:{ aptitud:'apto', fundamento:'Sedación breve para cardioversión programada, con anticoagulación efectiva por más de tres semanas y ecocardiograma transesofágico sin trombo auricular.',
        fecha:mesPasado, ambito:'Sala de internación' } },
    plan:{ tecnica:['Sedación profunda'], dispositivosVA:['Máscara facial'],
      monitoreoEstandar:MONITOREO_ESTANDAR.slice(0,5),
      analgesia:[], destino:'Unidad coronaria' },
    acto:{ inicioAnestesia:'09:05', finAnestesia:'09:25',
      tecnica:['Sedación profunda'], dispositivosVA:['Máscara facial'],
      farmacos:'Propofol 70 mg en bolos fraccionados. Oxígeno al 100 % con máscara facial.',
      cristaloides:'250', sangrado:'0', oms:['entrada','pausa','salida'],
      eventos:['Sin eventos'],
      aldrete:{actividad:2,respiracion:2,circulacion:2,conciencia:2,saturacion:2}, aldreteTotal:10,
      destinoReal:'Unidad coronaria', estadoEgreso:'Estable, sin complicaciones',
      observaciones:'Cardioversión exitosa al primer choque sincronizado de 150 J. Ritmo sinusal a 72 lpm.' },
    consent:{ quien:'El paciente', firmante:'Suárez, Roberto Carlos — DNI 10874336',
      items:['Acepta sedación'], fecha:mesPasado, hora:'08:30' },
    honConsulta:{ modalidad:'incluida', total:0, estado:'Pendiente' },
    hon:{ modalidad:'abierto', ua:5, valorUnidad:7500, adicionales:['asa34'], pctAdicional:25,
      total:46875, estado:'Pendiente', fechaPresentacion:'', comprobante:'', cobrado:0,
      observaciones:'' },
    creado:mesPasado, modificado:mesPasado+'T10:00:00.000Z',
    modificadoPor:U, modificadoPorNombre:'Fernández, Laura'
  });

  /* ------- Ficha 7 — propia de Juan Pablo, hace 3 días ------- */
  escribir('fichas', 'fic_demo7', {
    id:'fic_demo7', demo:true, ownerUid:U2, pacienteId:P2,
    fecha:diaRel(-3), hora:'16:00', turno:'Tarde', caracter:'programada',
    institucion:'sfue', obraSocial:'PAMI - INSSJP', nroAfiliado:'150-10874336-00',
    especialidad:'Oftalmología', cirugia:'Facoemulsificación con lente intraocular', cirugiaUA:8,
    dxQuirurgico:{ c:'H25', d:'Catarata senil' },
    lateralidad:'Derecha', cirujano:'Dra. Silvia Peralta', estado:'cerrada',
    v:{ cie10:[{c:'H25',d:'Catarata senil'},{c:'I48',d:'Fibrilación y aleteo auricular'},
               {c:'I25',d:'Enfermedad isquémica crónica del corazón'}],
      antecedentes:{ 'Cardiovascular':['Fibrilación auricular','Cardiopatía isquémica / IAM previo','Portador de marcapasos / CDI'],
                     'Oncológico':[] },
      antAnestesicos:['Anestesia raquídea previa sin complicaciones'],
      medicacion:[{n:'Apixabán', g:'Anticoagulante (DOAC)', accion:'continuar', dosis:'5 mg cada 12 h',
        nota:'En cirugía de catarata con anestesia tópica no se suspende la anticoagulación.'}],
      alergias:[],
      habitos:{ tabaco:'Ex fumador', alcohol:'No consume' },
      examen:{ ta:'132/78', fc:'70', spo2:'96', peso:'71', talla:'173' },
      va:{ mallampati:'3', aperturaBucal:'3.5', tiromentoniana:'6' },
      lab:{ hb:'10.8', plaquetas:'190', creatinina:'2.0' },
      estudios:{ ecg:'Fibrilación auricular con marcapasos, respuesta controlada a 70 lpm.' },
      scores:{ asa:'III', mets:3, rcri:[1], stopbang:{ronquido:true,edad:true,sexo:true},
        apfel:{nofuma:true}, caprini:[2,17], arIncision:'periferica', arDuracion:'25' },
      ayuno:{ tipo:'Comida grasa, frita o carne', hora:'08:00' },
      riesgo:{ aptitud:'apto', fundamento:'Cirugía de mínima invasión bajo anestesia tópica con sedación consciente. No requiere suspender la anticoagulación. Monitoreo estándar y control de la respuesta ventricular.',
        fecha:diaRel(-6), ambito:'Consultorio de preanestesia' } },
    plan:{ tecnica:['Sedación consciente','Anestesia local + vigilancia'],
      dispositivosVA:['Cánula nasal / bigotera'],
      monitoreoEstandar:MONITOREO_ESTANDAR.slice(0,4),
      analgesia:['Paracetamol 1 g EV c/6-8 h'], destino:'Alta ambulatoria el mismo día' },
    acto:{ inicioAnestesia:'16:05', finAnestesia:'16:35',
      tecnica:['Sedación consciente','Anestesia local + vigilancia'],
      dispositivosVA:['Cánula nasal / bigotera'],
      farmacos:'Midazolam 1 mg y fentanilo 25 µg EV. Anestesia tópica con proparacaína por el cirujano.',
      cristaloides:'250', sangrado:'0', oms:['entrada','pausa','salida'],
      eventos:['Sin eventos'],
      aldrete:{actividad:2,respiracion:2,circulacion:2,conciencia:2,saturacion:2}, aldreteTotal:10,
      destinoReal:'Alta ambulatoria el mismo día', estadoEgreso:'Estable, sin complicaciones' },
    consent:{ quien:'El paciente', firmante:'Suárez, Roberto Carlos — DNI 10874336',
      items:['Acepta sedación'], fecha:diaRel(-6), hora:'10:15' },
    honConsulta:{ modalidad:'obrasocial', total:22000, estado:'Presentado',
      fechaPresentacion:diaRel(-1), comprobante:'FC-A-0002-00000914', cobrado:0 },
    hon:{ modalidad:'abierto', ua:8, valorUnidad:7500, adicionales:['asa34'], pctAdicional:25,
      total:75000, estado:'Presentado', fechaPresentacion:diaRel(-1),
      comprobante:'FC-A-0002-00000915', cobrado:0, observaciones:'' },
    creado:diaRel(-6), modificado:new Date(Date.now()-86400000*3).toISOString(),
    modificadoPor:U2, modificadoPorNombre:'Gómez, Juan Pablo'
  });

  /* Financiadores de la demostración, con sus datos de facturación */
  escribir('obrasSociales', 'os_demo1', {
    id:'os_demo1', demo:true, nombre:'OSDE', cuit:'30-54666577-8',
    contacto:'Auditoría médica Patagonia', telefono:'0810-555-6733',
    email:'auditoria.sur@osde.com.ar', plazoPago:'60 días',
    valorConsulta:38000, notas:'Presentación hasta el día 10 de cada mes.' });
  escribir('obrasSociales', 'os_demo2', {
    id:'os_demo2', demo:true, nombre:'PAMI - INSSJP', cuit:'30-62317063-2',
    contacto:'UGL XXXI Tierra del Fuego', telefono:'2901-433900',
    plazoPago:'90 días', valorConsulta:22000,
    notas:'Requiere consentimiento y orden de prestación adjunta.' });

  /* Valor de unidad por defecto, para que las fichas nuevas lo tomen solas */
  escribir('config', 'valoresUnidad', {
    id:'valoresUnidad', demo:true, _default:7500,
    'OSDE':9500, 'PAMI - INSSJP':7500, 'IPAUSS / OSEF (Tierra del Fuego)':8200,
    'Swiss Medical':9800, 'Particular / Privado':12000
  });
  DB.config.valoresUnidad = DB.config.valoresUnidad;

  /* Los otros cuatro anestesiólogos, con sus fichas en distintos estados */
  if(typeof sembrarEquipoDemo === 'function') sembrarEquipoDemo();

  return true;
}
