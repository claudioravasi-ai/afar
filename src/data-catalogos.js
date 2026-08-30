/* =========================================================================
   CATALOGOS BASE - AFAAR
   Instituciones de Tierra del Fuego, financiadores, especialidades,
   farmacos con manejo perioperatorio, y listas clinicas de referencia.
   Todo es ampliable manualmente desde la app (Coordinador > Catalogos).
   ========================================================================= */

/* ---------- Instituciones de Tierra del Fuego (AeIAS) ---------- */
const INSTITUCIONES_BASE = [
  { id:'hru',   nombre:'Hospital Regional Ushuaia "Gob. Ernesto M. Campos"', ciudad:'Ushuaia',    tipo:'Público' },
  { id:'hrrg',  nombre:'Hospital Regional Río Grande',                       ciudad:'Río Grande', tipo:'Público' },
  { id:'ssj',   nombre:'Sanatorio San Jorge',                                ciudad:'Ushuaia',    tipo:'Privado' },
  { id:'hnu',   nombre:'Hospital Naval Ushuaia "Cir. My. Dr. Pedro Mallo"',  ciudad:'Ushuaia',    tipo:'Fuerzas Armadas' },
  { id:'cemep', nombre:'Clínica CEMEP',                                      ciudad:'Río Grande', tipo:'Privado' },
  { id:'sfue',  nombre:'Sanatorio Fueguino',                                 ciudad:'Río Grande', tipo:'Privado' },
  { id:'tolh',  nombre:'Hospital Comunitario de Tolhuin',                    ciudad:'Tolhuin',    tipo:'Público' },
  { id:'cams',  nombre:'Centro Asistencial Municipal Ushuaia',               ciudad:'Ushuaia',    tipo:'Municipal' },
  { id:'cmep',  nombre:'Centro Médico Eva Perón',                            ciudad:'Ushuaia',    tipo:'Privado' }
];

/* ---------- Financiadores / obras sociales ---------- */
const OBRAS_SOCIALES_BASE = [
  'IPAUSS / OSEF (Tierra del Fuego)','PAMI - INSSJP','OSDE','Swiss Medical','Galeno',
  'Medifé','OMINT','Sancor Salud','Federada Salud','Prevención Salud','Avalian (ACA Salud)',
  'Accord Salud','Jerárquicos Salud','Unión Personal / Accord','OSPE (Petroleros)',
  'OSECAC (Comercio)','OSPRERA','UOM (Metalúrgicos)','OSCHOCA / Camioneros',
  'OSPIA','OSPAT','Construir Salud (UOCRA)','IOSFA (Fuerzas Armadas)',
  'Obra Social del Poder Judicial','DASPU / Universitarios','OSDEPYM','Andar',
  'Premedic','Hospital Italiano - Plan de Salud','Programa Incluir Salud',
  'ART (Aseguradora de Riesgos del Trabajo)','Particular / Privado','Sin cobertura'
];

/* ---------- Especialidades quirurgicas ---------- */
const ESPECIALIDADES = [
  'Cirugía General','Traumatología y Ortopedia','Ginecología','Obstetricia','Urología',
  'Otorrinolaringología','Oftalmología','Cirugía Plástica','Neurocirugía',
  'Cirugía Cardiovascular','Cirugía Torácica','Cirugía Vascular Periférica',
  'Cirugía Pediátrica','Cirugía de Cabeza y Cuello','Cirugía Maxilofacial',
  'Coloproctología','Cirugía Bariátrica','Odontología','Endoscopía Digestiva',
  'Hemodinamia','Diagnóstico por Imágenes','Cirugía Torácica Video-asistida',
  'Cirugía Plástica Reconstructiva','Procedimientos fuera de quirófano (NORA)'
];

/* =========================================================================
   VIAS DE ABORDAJE QUIRURGICO
   -------------------------------------------------------------------------
   De la via depende cuanto se factura el procedimiento secundario. La regla
   del nomenclador es:

     1er procedimiento (el de mayor complejidad)  ->  100 %
     2do y siguientes, VIA DISTINTA a la del 1ro  ->   75 %
     2do y siguientes, MISMA VIA que el 1ro       ->   50 %

   El fundamento es el trabajo anestesico real: cambiar de via obliga a
   reposicionar, recampar y muchas veces a cambiar el plan; seguir por la
   misma via es prolongar el mismo acto.

   Ejemplos del propio pedido:
     colecistectomia + fimosis                    -> vias distintas -> 75 %
     colecistectomia lap. + gastrostomia lap.     -> misma via      -> 50 %

   `det` son las palabras con las que se reconoce la via en el nombre de la
   practica del nomenclador, para proponerla sola. Siempre se puede corregir.
   ========================================================================= */
const VIAS_ABORDAJE = [
  { id:'laparoscopica',  n:'Laparoscópica / videoasistida' },
  { id:'laparotomia',    n:'Abierta abdominal (laparotomía)' },
  { id:'toracotomia',    n:'Abierta torácica (toracotomía / esternotomía)' },
  { id:'convencional',   n:'Abierta / convencional' },
  { id:'endoscopica',    n:'Endoscópica digestiva o respiratoria' },
  { id:'transuretral',   n:'Transuretral / endourológica' },
  { id:'percutanea',     n:'Percutánea / punción guiada' },
  { id:'endovascular',   n:'Endovascular / hemodinamia' },
  { id:'artroscopica',   n:'Artroscópica' },
  { id:'osteoarticular', n:'Osteoarticular abierta' },
  { id:'vaginal',        n:'Vaginal / obstétrica por vía baja' },
  { id:'cesarea',        n:'Abdominal obstétrica (cesárea)' },
  { id:'orl',            n:'Transnasal / transoral / ORL' },
  { id:'oftalmica',      n:'Oftálmica' },
  { id:'neuroquirurgica',n:'Craneal / raquídea neuroquirúrgica' },
  { id:'cutanea',        n:'Cutánea / superficial (piel y anexos)' },
  { id:'neuroaxial',     n:'Neuroaxial / perineural (procedimiento del dolor)' },
  { id:'otra',           n:'Otra vía' }
];

/* =========================================================================
   COMO SE RECONOCE LA VIA EN EL NOMBRE DE LA PRACTICA
   -------------------------------------------------------------------------
   El nomenclador AFAAR dice la via en el propio nombre cuando importa:

     01.04.07  Colecistectomia simple                     -> abierta abdominal
     01.04.11  Colecistectomia laparoscopica              -> laparoscopica
     01.04.16  Colecistectomia laparoscopica convertida   -> abierta: se
                                                             convirtio
     01.02.06  Absceso subfrenico (via convencional)      -> abierta abdominal
     01.01.17  Reparacion de hernia con malla (convencional)

   La lectura va en TRES pasadas, en este orden, y el orden es lo que la hace
   correcta:

     1. TECNICA EXPLICITA. «laparoscopica», «transuretral», «percutanea»,
        «endovascular», «artroscopica»… nombran la via sin ambiguedad y
        mandan sobre todo lo demas. «Convertida» va primero que
        «laparoscopica»: una laparoscopia convertida termina siendo una
        laparotomia y es lo que se anestesia.

     2. REGION ANATOMICA. Cuando el nombre no dice la via —«colecistectomia
        simple»— la region la determina: una colecistectomia sin apellido es
        abierta abdominal; una prostatectomia, convencional; una
        osteosintesis, osteoarticular.

     3. PALABRA GENERICA. «convencional», «a cielo abierto» sueltas, ya sin
        region que las ubique.

   Sin este orden, «Absceso subfrenico (via convencional)» daba «piel y
   partes blandas» por la palabra «convencional», y entonces junto a una
   colecistectomia abierta se facturaba al 75 % cuando comparten la via y
   corresponde el 50 %.

   Todo esto es una PROPUESTA: cada procedimiento muestra su via en un
   desplegable y cambiarlo recalcula el porcentaje en el acto.
   ========================================================================= */

/* 1. Tecnica explicita en el nombre */
const VIA_POR_TECNICA = [
  { via:'laparotomia',   det:['convertid'] },
  /* El nomenclador dice la via con todas las letras en varias practicas:
     «Hernia diafragmatica por via toraxica». Sin esta linea, «hernia» la
     mandaba a abdominal por la pasada de region. */
  { via:'toracotomia',   det:['por via toracica','por via toraxica','via toracica','via toraxica',
      'transtoracic','toraco-abdominal','toracoabdominal'] },
  { via:'laparotomia',   det:['por via abdominal','via abdominal','transabdominal',
      'por via convencional','via convencional'] },
  { via:'vaginal',       det:['por via vaginal','via vaginal','por via baja'] },
  { via:'transuretral',  det:['por via transuretral','via transuretral','via endoscopica'] },
  { via:'laparoscopica', det:['laparoscop','videoasist','video asist','toracoscop','vats',
      'celioscop','robotic','minilaparoscop'] },
  { via:'laparotomia',   det:['laparotom','celiotom'] },
  { via:'toracotomia',   det:['toracotom','esternotom'] },
  { via:'endoscopica',   det:['endoscop','fibroscop','broncoscop','colonoscop','rectosigmoidoscop',
      'gastroscop','cpre','esofagoscop','videolaringoscop'] },
  { via:'transuretral',  det:['transuretral','rtu ','r.t.u','uretrocistoscop','cistoscop',
      'ureteroscop','endourolog','ureterorenoscop'] },
  { via:'percutanea',    det:['percutan','puncion','punción','drenaje guiado','nefrostom',
      'biopsia con aguja','biopsia percutan'] },
  { via:'endovascular',  det:['endovascular','angioplast','cateterismo','embolizacion','embolización',
      'colocacion de stent','hemodinam','arteriograf','flebograf'] },
  { via:'artroscopica',  det:['artroscop'] },
  { via:'cesarea',       det:['cesarea','cesárea'] },
  { via:'vaginal',       det:['vaginal','via baja','vía baja','parto','vulv','perine','periné',
      'episiotom','colporraf'] },
  { via:'orl',           det:['transnasal','transoral','amigdal','adenoid','septoplast','sinusal',
      'faring','laring','otologic','otológic','timpan','oido','oído','nasal','rinoplast',
      'traqueostom'] },
  { via:'oftalmica',     det:['catarat','cristalino','vitrect','estrabismo','glaucoma','retina',
      'ocular','globo ocular','parpado','párpado','dacrio'] },
  { via:'neuroaxial',    det:['bloqueo','peridural','epidural','raquide','raquíde','radiofrecuencia',
      'infiltracion','infiltración','denervacion','denervación','neurolisis'] },
  { via:'cutanea',       det:['fimosis','circuncis','nevo','lipoma','quiste sebaceo','quiste sebáceo',
      'uña','uñas','onicect','lesion de piel','lesión de piel','injerto de piel','cutane','cután'] }
];

/* 2. Region anatomica, cuando el nombre no dice la via */
const VIA_POR_REGION = [
  { via:'laparotomia', det:['colecist','apendic','hernia','herniorraf','hernioplast','gastrectom',
      'gastrostom','gastro','colectom','colostom','sigmoid','recto','esofag','hepat','higado',
      'hígado','esplenect','bazo','pancrea','páncrea','intestin','duoden','yeyun','ileo','íleo',
      'vesicula','vesícula','via biliar','vía biliar','coledoc','colédoc','peritone','abdomin',
      'abdomen','eventracion','eventración','evisceracion','evisceración','ostomia','ostomía',
      'anastomosis','subfrenico','subfrénico','epiplon','epiplón','ano','anal','hemorroid'] },
  { via:'toracotomia', det:['pulmon','pulmón','lobectom','neumonectom','mediastin','pleur','timo',
      'diafragma','costilla','esternon','esternón','cardiac','cardíac','coronari','valvul','aorta',
      'toracic','torácic','torax','tórax'] },
  { via:'neuroquirurgica', det:['craneotom','craniectom','trepan','craneo','cráneo','cerebr',
      'encefal','hidrocefal','ventriculo','ventrículo','laminectom','discectom','columna','vertebr',
      'medul','médul','hematoma subdural','hematoma extradural','aneurisma cerebral'] },
  { via:'osteoarticular', det:['fractura','osteosintes','osteosíntes','artroplast','protesis',
      'prótesis','artrodesis','osteotom','amputacion','amputación','femur','fémur','tibia','humero',
      'húmero','radio','cubito','cúbito','clavicula','clavícula','cadera','rodilla','hombro',
      'tobillo','muneca','muñeca','escafoides','menisc','ligament','tendon','tendón','osteo',
      'ortoped','traumat','luxacion','luxación'] },
  { via:'convencional', det:['prostat','próstat','vejiga','rinon','riñon','riñón','nefrect','ureter',
      'uréter','testic','testíc','escrot','varicocel','hidrocel','orquid','orquiec','pene',
      'utero','útero','histerect','ovari','anex','anex','trompa','mama','mastect','tumorect',
      'tiroid','paratiroid','cuello','ganglio','adenopat','vascular','safen','safén','arteria',
      'vena','absceso','quiste','fistula','fístula','plastia','biopsia','tumor','maxilar',
      'mandibul','mandíbul','dental','dentari','labio','paladar'] }
];

/* 3. Palabra generica, ya sin region */
const VIA_GENERICA = [
  { via:'convencional', det:['convencional','a cielo abierto','incision','incisión','abierta'] }
];

function __buscaVia(t, tabla){
  for(let i = 0; i < tabla.length; i++){
    const r = tabla[i];
    for(let j = 0; j < r.det.length; j++)
      if(t.indexOf(norm(r.det[j])) >= 0) return r.via;
  }
  return '';
}

/* Propone la via mirando el nombre de la practica. Nunca decide sola nada
   que se facture: lo que propone se ve en pantalla y se corrige con un clic. */
function viaSugerida(nombre){
  const t = norm(nombre || '');
  if(!t) return '';
  return __buscaVia(t, VIA_POR_TECNICA) ||
         __buscaVia(t, VIA_POR_REGION)  ||
         __buscaVia(t, VIA_GENERICA)    || '';
}
function nombreVia(id){
  const v = VIAS_ABORDAJE.find(x => x.id === id);
  return v ? v.n : 'Vía sin definir';
}

/* ---------- Tecnicas anestesicas ---------- */
const TECNICAS_ANESTESICAS = [
  'Anestesia general balanceada','Anestesia general endovenosa total (TIVA)',
  'Anestesia general inhalatoria','Anestesia general con IOT','Anestesia general con máscara laríngea',
  'Secuencia de intubación rápida (SIR)','Intubación con paciente despierto / fibroscopía',
  'Anestesia raquídea (subaracnoidea)','Anestesia peridural','Anestesia combinada raqui-peridural',
  'Peridural continua con catéter','Bloqueo de plexo braquial (interescalénico)',
  'Bloqueo de plexo braquial (supraclavicular)','Bloqueo de plexo braquial (infraclavicular)',
  'Bloqueo de plexo braquial (axilar)','Bloqueo femoral','Bloqueo del canal aductor',
  'Bloqueo ciático (poplíteo)','Bloqueo TAP','Bloqueo del plano erector de la espina (ESP)',
  'Bloqueo PECS I-II / serrato','Bloqueo del cuadrado lumbar','Bloqueo paravertebral',
  'Bloqueo caudal','Bloqueo retrobulbar / peribulbar','Anestesia regional endovenosa (Bier)',
  'Sedación consciente','Sedación profunda','Cuidado anestésico monitorizado (MAC)',
  'Anestesia local + vigilancia','Analgesia del trabajo de parto'
];

/* ---------- Dispositivos de via aerea ---------- */
const DISPOSITIVOS_VA = [
  'Máscara facial','Cánula nasal / bigotera','Máscara laríngea 2ª generación',
  'Máscara laríngea clásica','Tubo endotraqueal (laringoscopía directa)',
  'Tubo endotraqueal (videolaringoscopio)','Tubo endotraqueal con guía Frova/bougie',
  'Fibrobroncoscopía flexible','Tubo de doble lumen','Bloqueador bronquial',
  'Tubo nasotraqueal','Traqueostomía','Cricotiroidotomía'
];

/* ---------- Monitoreo ---------- */
const MONITOREO_ESTANDAR = [
  'Oximetría de pulso (SpO₂)','ECG continuo','Presión arterial no invasiva (PANI)',
  'Capnografía (EtCO₂)','Temperatura','Analizador de gases anestésicos',
  'Monitoreo de bloqueo neuromuscular (TOF)'
];
const MONITOREO_AVANZADO = [
  'Presión arterial invasiva','Presión venosa central','Índice biespectral (BIS) / EEG procesado',
  'Gasto cardíaco mínimamente invasivo','Ecocardiografía transesofágica','Diuresis horaria',
  'Saturación venosa central (ScvO₂)','Variación de presión de pulso (VPP)',
  'Ecografía a la cabecera (POCUS)','Oximetría cerebral (NIRS)','Presión intracraneal',
  'Monitoreo de potenciales evocados'
];

/* ---------- Destino postoperatorio ---------- */
const DESTINOS_POP = [
  'Sala de recuperación postanestésica (URPA)','Sala general','Unidad coronaria',
  'Unidad de terapia intensiva','Unidad de terapia intermedia','Alta ambulatoria el mismo día',
  'Neonatología','Sala de partos / puerperio'
];

/* ---------- Alergias frecuentes ---------- */
const ALERGENOS = [
  'Penicilinas / betalactámicos','Cefalosporinas','Sulfamidas','AINE / AAS','Dipirona',
  'Látex','Yodo / contraste iodado','Clorhexidina','Relajantes neuromusculares',
  'Anestésicos locales tipo éster','Anestésicos locales tipo amida','Propofol (soja/huevo)',
  'Opioides (morfina/codeína)','Heparina (HIT)','Ondansetrón','Metoclopramida',
  'Adhesivos / telas','Alimentos','Otra'
];

/* ---------- Medicacion habitual con manejo perioperatorio ----------
   Fuente doctrinal: ASA Practice Advisory, ACC/AHA 2024 Perioperative,
   ESAIC Preoperative Evaluation, ASRA Anticoagulation 4th ed.,
   ASA Consensus GLP-1 (2023) y iSGLT2 (FDA/ASA).
   accion: continuar | suspender | evaluar
--------------------------------------------------------------------- */
const FARMACOS_PERIOP = [
  // Cardiovascular
  { n:'Aspirina (AAS)', g:'Antiagregante', accion:'evaluar', nota:'Continuar en prevención secundaria y stent coronario. Suspender 7 días sólo en prevención primaria o cirugía de alto riesgo hemorrágico (neuro, cámara posterior del ojo, próstata).' },
  { n:'Clopidogrel', g:'Antiagregante', accion:'suspender', nota:'Suspender 5-7 días. NO suspender antes de 1 mes de stent metálico o 3-6 meses de stent farmacoactivo sin consenso con cardiología.' },
  { n:'Prasugrel', g:'Antiagregante', accion:'suspender', nota:'Suspender 7-10 días.' },
  { n:'Ticagrelor', g:'Antiagregante', accion:'suspender', nota:'Suspender 3-5 días.' },
  { n:'Warfarina / Acenocumarol', g:'Anticoagulante', accion:'suspender', nota:'Suspender 5 días (acenocumarol 3 días). Control de RIN <1.5 (neuroaxial <1.4). Puente con HBPM sólo en alto riesgo tromboembólico.' },
  { n:'Rivaroxabán', g:'Anticoagulante (DOAC)', accion:'suspender', nota:'ClCr normal: 24 h bajo riesgo hemorrágico, 48-72 h alto riesgo. Neuroaxial: 72 h (ASRA).' },
  { n:'Apixabán', g:'Anticoagulante (DOAC)', accion:'suspender', nota:'24-48 h según riesgo. Neuroaxial: 72 h (ASRA).' },
  { n:'Dabigatrán', g:'Anticoagulante (DOAC)', accion:'suspender', nota:'ClCr>80: 48-72 h; ClCr 50-80: 72-96 h. Neuroaxial: 120 h con ClCr<50 (ASRA).' },
  { n:'Edoxabán', g:'Anticoagulante (DOAC)', accion:'suspender', nota:'24-48 h. Neuroaxial: 72 h.' },
  { n:'Enoxaparina profiláctica', g:'Anticoagulante', accion:'evaluar', nota:'Neuroaxial: esperar 12 h desde la última dosis; reiniciar 4 h post punción / retiro de catéter (ASRA).' },
  { n:'Enoxaparina terapéutica', g:'Anticoagulante', accion:'evaluar', nota:'Neuroaxial: esperar 24 h desde la última dosis (ASRA).' },
  { n:'Heparina sódica EV', g:'Anticoagulante', accion:'evaluar', nota:'Suspender 4-6 h y KPTT normal antes de neuroaxial.' },
  { n:'Enalapril / IECA', g:'Antihipertensivo', accion:'evaluar', nota:'Considerar omitir la dosis de la mañana: riesgo de hipotensión refractaria a la inducción. Continuar si es por insuficiencia cardíaca con estricta vigilancia.' },
  { n:'Losartán / ARA II', g:'Antihipertensivo', accion:'evaluar', nota:'Idem IECA: omitir dosis de la mañana en la mayoría de las cirugías.' },
  { n:'Atenolol / Bisoprolol / Betabloqueantes', g:'Antihipertensivo', accion:'continuar', nota:'CONTINUAR SIEMPRE. La suspensión abrupta aumenta mortalidad e isquemia. No iniciar betabloqueo el día de la cirugía.' },
  { n:'Amlodipina / Bloqueantes cálcicos', g:'Antihipertensivo', accion:'continuar', nota:'Continuar.' },
  { n:'Furosemida / Diuréticos', g:'Diurético', accion:'evaluar', nota:'Omitir la mañana de la cirugía salvo insuficiencia cardíaca descompensada. Controlar potasio.' },
  { n:'Atorvastatina / Estatinas', g:'Hipolipemiante', accion:'continuar', nota:'CONTINUAR: efecto protector cardiovascular perioperatorio.' },
  { n:'Digoxina', g:'Cardiológico', accion:'continuar', nota:'Continuar. Controlar potasio y digoxinemia si hay signos de toxicidad.' },
  { n:'Amiodarona', g:'Antiarrítmico', accion:'continuar', nota:'Continuar. Vigilar bradicardia y QT prolongado.' },
  // Metabolico
  { n:'Metformina', g:'Antidiabético', accion:'suspender', nota:'Suspender el día de la cirugía (24 h si hay contraste EV o deterioro renal): riesgo de acidosis láctica.' },
  { n:'Empagliflozina / Dapagliflozina (iSGLT2)', g:'Antidiabético', accion:'suspender', nota:'SUSPENDER 3-4 días antes: riesgo de cetoacidosis euglucémica. Control de cetonemia si se operó sin suspender.' },
  { n:'Semaglutida / Liraglutida (agonistas GLP-1)', g:'Antidiabético / obesidad', accion:'suspender', nota:'ASA 2023: suspender 1 semana antes si es semanal, 1 día si es diario. Riesgo de estómago lleno: ecografía gástrica o manejo como estómago ocupado.' },
  { n:'Insulina basal (glargina/NPH)', g:'Antidiabético', accion:'evaluar', nota:'Reducir 20-25 % la dosis nocturna previa. Control glucémico horario intraoperatorio.' },
  { n:'Insulina rápida / correcciones', g:'Antidiabético', accion:'suspender', nota:'Omitir mientras esté en ayunas; usar esquema de corrección.' },
  { n:'Glibenclamida / Sulfonilureas', g:'Antidiabético', accion:'suspender', nota:'Suspender el día de la cirugía: riesgo de hipoglucemia.' },
  { n:'Levotiroxina', g:'Endocrino', accion:'continuar', nota:'Continuar.' },
  { n:'Corticoides crónicos', g:'Endocrino', accion:'continuar', nota:'Continuar y evaluar dosis de estrés según magnitud quirúrgica (hidrocortisona 25-100 mg/día) si recibió >5 mg/día de prednisona por más de 3 semanas.' },
  // Neuro / psiquiatria
  { n:'Levetiracetam / Anticonvulsivantes', g:'Neurológico', accion:'continuar', nota:'CONTINUAR sin excepción, incluido el día de la cirugía.' },
  { n:'Levodopa / Carbidopa', g:'Neurológico', accion:'continuar', nota:'Continuar hasta la mañana; reanudar lo antes posible. Evitar metoclopramida, droperidol y haloperidol.' },
  { n:'Sertralina / ISRS', g:'Psiquiátrico', accion:'continuar', nota:'Continuar. Riesgo de síndrome serotoninérgico con tramadol, meperidina y azul de metileno.' },
  { n:'Amitriptilina / Tricíclicos', g:'Psiquiátrico', accion:'continuar', nota:'Continuar. Vigilar arritmias e interacción con simpaticomiméticos.' },
  { n:'IMAO (tranilcipromina, fenelzina)', g:'Psiquiátrico', accion:'evaluar', nota:'Consulta con psiquiatría. Evitar meperidina, efedrina e indirectos. Si es irreversible, valorar suspensión 2 semanas.' },
  { n:'Litio', g:'Psiquiátrico', accion:'evaluar', nota:'Suspender 72 h en cirugía mayor. Controlar litemia, sodio y función renal. Prolonga los relajantes.' },
  { n:'Clonazepam / Benzodiazepinas', g:'Psiquiátrico', accion:'continuar', nota:'Continuar para evitar síndrome de abstinencia.' },
  { n:'Quetiapina / Antipsicóticos', g:'Psiquiátrico', accion:'continuar', nota:'Continuar. Vigilar QT.' },
  // Otros
  { n:'Omeprazol / IBP', g:'Digestivo', accion:'continuar', nota:'Continuar; útil como profilaxis de aspiración.' },
  { n:'Salbutamol / Broncodilatadores', g:'Respiratorio', accion:'continuar', nota:'CONTINUAR e indicar broncodilatador inhalado inmediatamente antes de la cirugía.' },
  { n:'Corticoides inhalados', g:'Respiratorio', accion:'continuar', nota:'Continuar.' },
  { n:'Metotrexato', g:'Inmunosupresor', accion:'evaluar', nota:'Se puede continuar en cirugía menor; suspender 1-2 semanas en cirugía con alto riesgo de infección.' },
  { n:'Anti-TNF (adalimumab, etanercept)', g:'Inmunosupresor', accion:'suspender', nota:'Suspender 1 intervalo de dosis antes; reanudar al cicatrizar (guía ACR/AAHKS).' },
  { n:'Anticonceptivos orales / TRH', g:'Hormonal', accion:'evaluar', nota:'Considerar suspender 4 semanas antes de cirugía mayor por riesgo de TEV; anticoncepción alternativa.' },
  { n:'Tamoxifeno', g:'Oncológico', accion:'evaluar', nota:'Suspender 2-4 semanas antes de cirugía mayor por riesgo de TEV.' },
  { n:'Suplementos herbales (ginkgo, ajo, ginseng)', g:'Herbal', accion:'suspender', nota:'Suspender 7 días: alteran hemostasia e interactúan con anestésicos.' },
  { n:'Cannabis medicinal', g:'Otros', accion:'evaluar', nota:'Documentar consumo: aumenta requerimiento anestésico y riesgo de hiperreactividad de vía aérea.' },
  { n:'Naltrexona', g:'Otros', accion:'evaluar', nota:'Suspender 72 h si se planea analgesia opioide.' },
  { n:'Buprenorfina', g:'Opioide', accion:'evaluar', nota:'Se recomienda continuar y sumar opioides de alta afinidad; consultar con dolor crónico.' }
];

/* ---------- Antecedentes patologicos por sistema ----------
   La lista vive ahora en data-antecedentes.js: ANTECEDENTES_SISTEMAS se arma
   sola desde PATOLOGIAS para que no haya dos catalogos que mantener.
   Aca no queda nada: el CIE-10 se quito de la app y el unico nomenclador
   que sigue vigente es el anestesico.
------------------------------------------------------------ */

/* ---------- Antecedentes anestesicos ---------- */
const ANTECEDENTES_ANESTESICOS = [
  'Sin antecedentes anestésicos','Anestesia general previa sin complicaciones',
  'Anestesia regional previa sin complicaciones','Vía aérea difícil documentada',
  'Intubación fallida previa','Náuseas y vómitos postoperatorios severos',
  'Despertar intraoperatorio','Reacción anafiláctica perianestésica',
  'Hipertermia maligna personal o familiar','Déficit de pseudocolinesterasa (apnea prolongada)',
  'Cefalea pospunción dural','Delirio postoperatorio','Bloqueo neuromuscular residual',
  'Dificultad para acceso venoso','Ingreso no programado a UTI','Hipotensión severa en la inducción'
];

/* ---------- ASA Physical Status (definiciones ASA 2020) ---------- */
const ASA_PS = [
  { v:'I',   t:'Paciente sano', d:'Sano, no fumador, sin o con mínimo consumo de alcohol.' },
  { v:'II',  t:'Enfermedad sistémica leve', d:'Sin limitación funcional sustantiva: fumador, embarazo, obesidad (IMC 30-40), DM/HTA controladas, enfermedad pulmonar leve.' },
  { v:'III', t:'Enfermedad sistémica grave', d:'Limitación funcional sustantiva: DM/HTA mal controladas, EPOC, IMC ≥40, hepatitis activa, dependencia de alcohol, marcapasos, FEy moderadamente reducida, ERC en diálisis programada, IAM/ACV/stent >3 meses.' },
  { v:'IV',  t:'Enfermedad sistémica grave con amenaza vital constante', d:'IAM/ACV/stent <3 meses, isquemia cardíaca o disfunción valvular severa, FEy severamente reducida, sepsis, CID, ERC sin diálisis programada.' },
  { v:'V',   t:'Moribundo', d:'No se espera sobrevida sin la operación: aneurisma roto, trauma masivo, hemorragia intracraneal con efecto de masa, isquemia intestinal con falla multiorgánica.' },
  { v:'VI',  t:'Muerte cerebral', d:'Donante de órganos.' }
];

/* ---------- Ayuno preoperatorio (ASA 2023) ---------- */
const AYUNO_ASA = [
  { t:'Líquidos claros', h:2, d:'Agua, jugo sin pulpa, té o café sin leche, bebidas isotónicas. Se estimula la ingesta hasta 2 h antes.' },
  { t:'Carbohidratos (ERAS)', h:2, d:'Bebida con 12,5 % de maltodextrina hasta 2 h antes en pacientes sin diabetes ni riesgo de aspiración.' },
  { t:'Leche materna', h:4, d:'Lactantes.' },
  { t:'Fórmula infantil', h:6, d:'Lactantes.' },
  { t:'Leche no humana / comida liviana', h:6, d:'Tostada y líquido claro.' },
  { t:'Comida grasa, frita o carne', h:8, d:'Retardan el vaciamiento gástrico.' },
  { t:'Agonistas GLP-1', h:0, d:'Además del ayuno estándar, suspender 1 semana (semanal) o 1 día (diario); valorar contenido gástrico con ecografía.' }
];

/* ---------- Profilaxis antibiotica (referencia rapida) ---------- */
const PROFILAXIS_ATB = [
  { c:'Cefazolina', d:'2 g EV (3 g si >120 kg). Repetir a las 4 h o con sangrado >1500 ml.', u:'Estándar en la mayoría de las cirugías limpias y limpias-contaminadas.' },
  { c:'Cefazolina + Metronidazol', d:'2 g + 500 mg EV', u:'Colorrectal, apendicectomía, ginecológica contaminada.' },
  { c:'Clindamicina', d:'900 mg EV', u:'Alergia a betalactámicos.' },
  { c:'Vancomicina', d:'15 mg/kg EV en 60-90 min', u:'Colonización por SAMR, alergia grave. Iniciar 120 min antes.' },
  { c:'Cefuroxima', d:'1,5 g EV', u:'Cardiovascular, torácica.' },
  { c:'Ampicilina-Sulbactam', d:'3 g EV', u:'Cabeza y cuello contaminada, maxilofacial.' },
  { c:'Gentamicina', d:'5 mg/kg EV', u:'Urológica con urocultivo positivo.' }
];

/* ---------- Modalidades de honorarios ---------- */
const MODALIDADES_HONORARIOS = [
  { id:'abierto',   n:'Convenio abierto (por unidades)', d:'Se factura por unidades anestésicas del nomenclador × valor de la unidad, más adicionales.' },
  { id:'cerrado',   n:'Convenio cerrado (módulo)',       d:'Monto fijo pactado por prestación o módulo quirúrgico.' },
  { id:'capitado',  n:'Convenio capitado',               d:'Pago mensual fijo por padrón; la prestación se registra pero no se factura por acto.' },
  { id:'particular',n:'Particular',                      d:'Honorario acordado directamente con el paciente.' },
  { id:'salario',   n:'Relación de dependencia',         d:'Prestación cubierta por el sueldo institucional.' },
  { id:'sincargo',  n:'Sin cargo / bonificado',          d:'No genera honorario.' }
];

/* ---------- Modalidades de la consulta prequirurgica ----------
   La valoracion preanestesica es una consulta medica y se factura aparte
   del acto anestesico, con su propio titular: el que la realizo. */
const MODALIDADES_CONSULTA = [
  { id:'obrasocial', n:'Consulta por obra social',  d:'Se factura al financiador según el valor de consulta pactado.' },
  { id:'particular', n:'Consulta particular',       d:'Honorario acordado directamente con el paciente.' },
  { id:'incluida',   n:'Incluida en el acto',       d:'No se factura por separado; queda comprendida en el honorario del acto.' },
  { id:'institucional', n:'Cubierta por la institución', d:'La consulta la remunera la institución.' },
  { id:'sincargo',   n:'Sin cargo',                 d:'No genera honorario.' }
];

/* ---------- Por que un acto no tiene valoracion previa ----------
   Un acto anestesico sin valoracion prequirurgica cargada no siempre es un
   descuido: puede ser una urgencia sin tiempo, o una valoracion hecha en
   papel o en otra institucion. Lo que no puede es quedar sin explicacion.

   `deuda: true` marca los motivos que dejan una valoracion pendiente de
   completar y que por lo tanto disparan el recordatorio. */
const MOTIVOS_SIN_VALORACION = [
  /* Urgencia y emergencia van separadas: el caracter se toma de aca y no se
     vuelve a preguntar en el paso 1, asi que la opcion tiene que decir cual
     de las dos es. Las dos llevan el mismo adicional del nomenclador, pero no
     son lo mismo en la historia clinica. */
  { id:'urgencia',   deuda:true, caracter:'urgencia',   n:'Urgencia',
    d:'Debe resolverse en horas y no hubo tiempo de hacer la valoración. El carácter de la cirugía queda cargado solo.' },
  { id:'emergencia', deuda:true, caracter:'emergencia', n:'Emergencia',
    d:'Riesgo vital inmediato, sin demora posible. El carácter de la cirugía queda cargado solo.' },
  { id:'externa',  deuda:true,  n:'La valoración se hizo fuera de la aplicación',
    d:'En papel, en otra institución o por un profesional que no es socio. Se asienta quién la hizo y cuándo, y se adjunta la foto.' },
  /* Es para el paciente INTERNADO, en evolucion de una cirugia reciente y sin
     alta medica: ahi la valoracion anterior sigue describiendo a este
     paciente y se la puede traer para actualizarla. Un paciente que se fue de
     alta y vuelve meses despues no entra por aca —de aquella ficha solo
     quedan sus datos filiatorios, para no duplicarlo—: ese lleva valoracion
     nueva y entra por «la cargo ahora». */
  { id:'reintervencion', deuda:true, n:'Ya fue valorado para una intervención anterior',
    d:'Paciente internado, en evolución de una cirugía reciente y sin alta médica. Se importa la valoración de aquella ficha, propia o de un colega, para actualizarla.' },
  { id:'ahora',    deuda:false, n:'La cargo ahora',
    d:'Lleva al paso 2 para completarla antes de anestesiar. No queda nada declarado.' },
  /* Retirado: una sedacion para endoscopia o una cardioversion SI llevan
     valoracion prequirurgica, asi que este motivo era falso -hacia lo mismo
     que «la cargo ahora» pero fingiendo una excepcion que no existe-. Queda
     en la lista, oculto, para que las fichas ya declaradas asi se sigan
     leyendo bien. */
  { id:'sinconsulta', deuda:true, oculto:true, n:'Procedimiento sin consulta previa programada',
    d:'Motivo retirado. La valoración sigue pendiente.' }
];

/* ---------- Caracter de la cirugia y del acto ----------
   La misma lista sirve para los dos: el que se carga en la valoracion
   (paso 1) y el que se confirma en el acto (paso 3). Ver caracterActo()
   en core.js para por que son dos y no uno. */
const CARACTERES = [
  { id:'programada', n:'Programada', d:'Cirugía con fecha acordada.' },
  { id:'urgencia',   n:'Urgencia',   d:'Debe resolverse en horas.' },
  { id:'emergencia', n:'Emergencia', d:'Riesgo vital inmediato, sin demora posible.' }
];

/* ---------- Adicionales del nomenclador anestesico ---------- */
const ADICIONALES_HONORARIOS = [
  { id:'urgencia', n:'Urgencia / emergencia',            pct:50 },
  { id:'nocturno', n:'Horario nocturno (22 a 06 h)',     pct:50 },
  { id:'feriado',  n:'Sábado tarde, domingo o feriado',  pct:50 },
  { id:'asa34',    n:'ASA III-IV',                       pct:25 },
  { id:'asa5',     n:'ASA V',                            pct:50 },
  { id:'edad',     n:'Menor de 1 año o mayor de 80 años',pct:25 },
  { id:'obesidad', n:'Obesidad mórbida (IMC ≥ 40)',      pct:25 },
  { id:'prolong',  n:'Prolongación (por cada 30 min extra)', pct:15 },
  { id:'invasivo', n:'Monitoreo invasivo / línea arterial o PVC', pct:20 },
  { id:'bloqueo',  n:'Bloqueo analgésico complementario', pct:20 }
];

/* ---------- Estados de facturacion ---------- */
const ESTADOS_FACT = ['Pendiente','Presentado','Facturado','Cobrado','Débito / rechazado'];

/* ---------- Eventos adversos intraoperatorios ---------- */
const EVENTOS_ADVERSOS = [
  'Sin eventos','Hipotensión que requirió vasopresores','Hipertensión severa','Bradicardia severa',
  'Taquiarritmia','Isquemia miocárdica','Paro cardiorrespiratorio','Desaturación < 90 %',
  'Broncoespasmo','Laringoespasmo','Intubación dificultosa (>2 intentos)','Intubación fallida',
  'Aspiración de contenido gástrico','Neumotórax','Reacción anafiláctica','Sangrado mayor / transfusión',
  'Hipotermia < 35 °C','Hipertermia maligna','Punción dural accidental','Bloqueo neuroaxial fallido',
  'Toxicidad por anestésicos locales (LAST)','Náuseas y vómitos en URPA','Despertar intraoperatorio',
  'Lesión dentaria','Lesión nerviosa periférica','Delirio postoperatorio','Ingreso no previsto a UTI'
];

/* ---------- Analgesia postoperatoria multimodal ---------- */
/* Agrupada por escalon y por tecnica: la lista plana de 21 renglones obligaba
   a leerla entera para encontrar un bloqueo. Los grupos se dibujan como
   sub-listas en el punto 13 y el documento sigue imprimiendo los nombres tal
   cual, asi que las fichas ya cargadas se siguen leyendo sin tocar nada. */
const ANALGESIA_POP_GRUPOS = [
  { g:'No opioides — base de todo esquema multimodal', items:[
    'Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h','Ketorolac 30 mg EV c/8 h',
    'Diclofenac 75 mg IM/EV c/12 h','Ibuprofeno 400-600 mg VO c/8 h',
    'Ketoprofeno 100 mg EV c/12 h','Parecoxib 40 mg EV c/12 h',
    'Celecoxib 200 mg VO c/12 h','Naproxeno 500 mg VO c/12 h'] },

  { g:'Opioides sistémicos', items:[
    'Morfina EV titulada','Morfina subcutánea','Nalbufina 10 mg EV','Tramadol 100 mg EV c/8 h',
    'Oxicodona VO','Buprenorfina transdérmica','Fentanilo EV en infusión',
    'Remifentanilo EV en infusión (transición)','PCA endovenosa con morfina',
    'PCA endovenosa con fentanilo'] },

  { g:'Coadyuvantes sistémicos', items:[
    'Dexametasona 4-8 mg EV','Ketamina en dosis subanestésica','Lidocaína EV en infusión',
    'Sulfato de magnesio EV','Gabapentina / Pregabalina','Dexmedetomidina',
    'Clonidina','Alfa-2 agonista como ahorrador de opioides'] },

  /* Lo que faltaba: la anestesia regional como analgesia postoperatoria.
     Es la parte que mas cambia el consumo de opioides y la que el registro
     tiene que poder nombrar con precision -no alcanza con «bloqueo». */
  { g:'Bloqueos neuroaxiales', items:[
    'Peridural lumbar en bolos','Peridural torácica en bolos',
    'Peridural continua con anestésico local','Peridural continua con AL + opioide',
    'PCEA — peridural controlada por el paciente','Morfina intratecal (raquídea)',
    'Raquídea con opioide de acción prolongada','Bloqueo caudal (pediátrico)',
    'Catéter caudal continuo'] },

  { g:'Bloqueos de tronco y de plano fascial', items:[
    'Bloqueo TAP','Bloqueo del cuadrado lumbar (QLB)',
    'Bloqueo del plano erector de la espina (ESP)','Bloqueo paravertebral torácico',
    'Bloqueo intercostal','Bloqueo PECS I','Bloqueo PECS II',
    'Bloqueo del serrato anterior','Bloqueo del recto anterior del abdomen',
    'Bloqueo ilioinguinal-iliohipogástrico','Bloqueo del plano interfascial esternal (PIF)',
    'Bloqueo del nervio pudendo','Bloqueo peneano'] },

  { g:'Bloqueos de miembro superior', items:[
    'Bloqueo interescalénico','Bloqueo supraclavicular','Bloqueo infraclavicular',
    'Bloqueo axilar','Bloqueo del nervio supraescapular','Bloqueo de nervios distales del antebrazo',
    'Catéter interescalénico continuo','Catéter infraclavicular continuo'] },

  { g:'Bloqueos de miembro inferior', items:[
    'Bloqueo femoral','Bloqueo del canal aductor','Bloqueo del grupo pericapsular (PENG)',
    'Bloqueo de la fascia ilíaca','Bloqueo ciático (poplíteo)','Bloqueo ciático (subglúteo)',
    'Bloqueo del obturador','Bloqueo del tobillo','Catéter del canal aductor continuo',
    'Catéter perineural continuo'] },

  { g:'Analgesia local del sitio quirúrgico', items:[
    'Infiltración de la herida con anestésico local','Bloqueo de campo con AL',
    'Catéter de infiltración continua de la herida','Instilación intraperitoneal de AL',
    'Instilación intraarticular de AL','Anestésico local liposomal'] },

  { g:'Medidas no farmacológicas y seguimiento', items:[
    'Crioterapia / medidas no farmacológicas','TENS','Kinesiología y movilización precoz',
    'Ferulización o inmovilización analgésica',
    'Seguimiento por el equipo de dolor agudo','Escala EVA pautada cada 4 h',
    'Plan de rescate escrito indicado en la historia'] }
];

/* Lista plana: la siguen usando el documento impreso, el buscador y las
   fichas viejas, que guardan el nombre del item tal cual. */
const ANALGESIA_POP = ANALGESIA_POP_GRUPOS.reduce((a,g) => a.concat(g.items), []);

/* ---------- Consentimiento informado anestesico - texto base ----------
   Redactado sobre el modelo de consentimiento informado anestesico de la
   Asociacion de Anestesia, Analgesia y Reanimacion de Buenos Aires
   (anestesia.org.ar) y los formularios de anestesia y analgesia
   postoperatoria del Hospital Nacional Baldomero Sommer (Ministerio de
   Salud de la Nacion), ajustado a la Ley 26.529 de Derechos del Paciente,
   su modificatoria Ley 26.742, el Decreto reglamentario 1089/2012, el
   articulo 59 del Codigo Civil y Comercial, la Ley 17.132 del Ejercicio de
   la Medicina y la Ley 25.326 de Proteccion de Datos Personales.

   Se imprime completo en la valoracion pre-anestesica y viaja como PDF
   aparte en el envio al paciente. */
const TEXTO_CONSENTIMIENTO = `1. NATURALEZA DEL ACTO ANESTESICO

Declaro que el/la profesional anestesiólogo/a me ha explicado, en lenguaje claro, sencillo y comprensible, el procedimiento anestésico propuesto para la intervención indicada, sus motivos, características, propósitos, beneficios esperados, riesgos, molestias, efectos adversos previsibles y las alternativas razonables, con sus propios riesgos y beneficios, incluida la de no realizar ningún procedimiento.

Comprendo que la anestesia es un acto médico autónomo, distinto de la cirugía, cuyo objeto es suprimir el dolor, mantener las funciones vitales y cuidar mi estado general durante todo el procedimiento y en el postoperatorio inmediato. Entiendo que es el/la médico/a anestesiólogo/a quien indica la técnica anestésica adecuada a mi caso, según la operación prevista y mis condiciones de salud, y que puede modificarla si las circunstancias lo exigen.

2. TECNICAS ANESTESICAS Y EN QUE CONSISTEN

Se me ha informado que, según el caso, la anestesia puede ser:

· ANESTESIA GENERAL: administración de fármacos por vía intravenosa y/o gases inhalados que producen inconsciencia, amnesia, analgesia, relajación muscular y abolición de reflejos. Requiere canalizar una vena para administrar sueros y medicamentos y, habitualmente, colocar un tubo o dispositivo a través de la boca o la nariz hasta la vía aérea, conectado a un respirador que mantiene la respiración durante la intervención.

· ANESTESIA NEUROAXIAL (raquídea o peridural): inyección de anestésico local en la región lumbar o dorsal, que bloquea la sensibilidad y el movimiento de la mitad inferior del cuerpo de manera transitoria, con o sin colocación de un catéter para analgesia posterior.

· BLOQUEO DE NERVIOS O PLEXOS PERIFERICOS: inyección de anestésico local junto a un nervio o grupo de nervios, habitualmente guiada por ecografía y/o neuroestimulación, que anestesia únicamente la zona a operar.

· SEDACION O CUIDADO ANESTESICO MONITORIZADO: administración de fármacos que producen somnolencia, ansiólisis y analgesia, conservando en distinto grado la respiración espontánea. Comprendo que una sedación puede requerir convertirse en anestesia general si el procedimiento o mi estado lo hacen necesario.

· ANESTESIA LOCAL: infiltración de anestésico en la zona a intervenir, con o sin sedación complementaria.

3. MONITOREO Y PROCEDIMIENTOS ASOCIADOS

Se me ha explicado que durante todo el acto anestésico seré vigilado/a en forma continua con electrodos adhesivos en el pecho para el control del ritmo cardíaco, un manguito de presión arterial, un sensor en el dedo que mide el oxígeno en sangre (oximetría de pulso) y, cuando corresponda, medición del dióxido de carbono espirado, temperatura y profundidad anestésica. Autorizo asimismo la colocación de los accesos vasculares, sondas, catéteres y dispositivos que resulten necesarios para el procedimiento y para mi seguridad.

4. RIESGOS DEL ACTO ANESTESICO

Comprendo que todo acto anestésico, aun realizado con la mayor diligencia, con los medios adecuados y conforme a las reglas del arte, es un procedimiento capaz de originar lesiones agudas, secuelas crónicas, complicaciones graves e incluso la muerte, y que los riesgos NO pueden suprimirse por completo. Entiendo que su probabilidad guarda relación con mi estado de salud previo, mi edad, el tipo, la complejidad y la duración del acto quirúrgico, así como con reacciones alérgicas u otros factores de riesgo inevitables, y que cada técnica anestésica tiene sus riesgos propios.

Se me han explicado, a título ejemplificativo y no taxativo:

· Riesgos frecuentes y en general leves: náuseas y vómitos postoperatorios, dolor o irritación de garganta, ronquera, tos, escalofríos y temblores, somnolencia prolongada, dolores musculares, mareos, dolor o flebitis en el sitio de punción venosa, hematoma en el sitio de punción, retención urinaria, dolor lumbar, cefalea (incluida la cefalea pospunción dural en la anestesia neuroaxial), visión borrosa transitoria.

· Riesgos poco frecuentes: lesión dentaria, labial o de la lengua durante el manejo instrumental de la vía aérea; dificultad imprevista para colocar el tubo en la tráquea; lesión de cuerdas vocales; laringoespasmo o broncoespasmo; reacciones alérgicas a los fármacos anestésicos; hipotensión o hipertensión arterial, bradicardia o arritmias que requieran tratamiento; bloqueo insuficiente o fallido que obligue a repetirlo o a convertir a anestesia general; lesión nerviosa periférica transitoria por el bloqueo o por la posición en la mesa quirúrgica; lesiones oculares por compresión o sequedad.

· Riesgos graves e infrecuentes: imposibilidad de manejar la vía aérea; aspiración de contenido gástrico hacia el pulmón; despertar intraoperatorio; lesión nerviosa o medular permanente, hematoma o absceso peridural; convulsiones y toxicidad sistémica por anestésicos locales; anafilaxia; hipertermia maligna; infarto de miocardio; accidente cerebrovascular; insuficiencia renal o respiratoria; paro cardiorrespiratorio; daño cerebral, coma y muerte.

Entiendo que la enumeración anterior no agota todas las complicaciones posibles y que la medicina no es una ciencia exacta: el/la profesional se compromete a poner todos los medios a su alcance, pero no puede garantizar un resultado.

5. INSTRUCCIONES QUE ME FUERON DADAS Y ME COMPROMETO A CUMPLIR

a) AYUNO. Debo cumplir el ayuno preoperatorio indicado (como regla, ocho horas para alimentos sólidos y leche no materna, seis horas para comidas livianas y fórmulas, cuatro horas para leche materna y dos horas para líquidos claros, conforme las guías de ayuno perioperatorio vigentes). Comprendo que incumplir esta indicación pone en riesgo mi vida por aspiración de contenido gástrico y obliga a suspender la cirugía.

b) MEDICACION. Debo continuar la medicación habitual que se me indicó mantener —por ejemplo, la de la presión arterial—, tomándola el día de la cirugía con un sorbo de agua sin romper la norma anterior, y suspender únicamente aquella que se me indicó suspender y con la antelación señalada, en particular la que afecta la coagulación de la sangre. No debo suspender ni agregar medicamentos por mi cuenta.

c) TABACO Y OTRAS SUSTANCIAS. Si soy fumador/a, debo intentar interrumpir el hábito al menos una semana antes de la cirugía. Debo informar el consumo de alcohol, cannabis, cocaína u otras sustancias, y el uso de suplementos, hierbas o medicamentos para adelgazar, porque interactúan con los fármacos anestésicos.

d) PROTESIS Y ACCESORIOS. Debo informar y retirar prótesis dentales, lentes de contacto, audífonos, piercings y alhajas, y presentarme sin esmalte de uñas ni maquillaje.

e) ACOMPAÑANTE. Si el procedimiento es ambulatorio, debo concurrir con un acompañante adulto responsable y comprendo que durante las veinticuatro horas siguientes no debo conducir vehículos, operar maquinarias, firmar documentos de importancia ni permanecer solo/a.

6. SITUACIONES IMPREVISTAS

Estoy en conocimiento de que durante el curso de la anestesia pueden presentarse condiciones especiales que requieran medidas extras o diferentes de las originariamente previstas. Por ello autorizo y requiero que el/la anestesiólogo/a interviniente, o quien él/ella designe, realice los procedimientos que a su juicio profesional resulten necesarios y deseables para preservar mi vida y mi salud, incluidos el cambio de técnica anestésica, el ingreso a una unidad de cuidados críticos y la ventilación mecánica prolongada.

7. TRANSFUSION DE HEMODERIVADOS

Autorizo la transfusión de sangre o hemoderivados cuando resulte indispensable para preservar mi vida o mi salud, con conocimiento de sus riesgos —reacciones transfusionales y transmisión de infecciones—, salvo que haya consignado expresamente mi negativa en esta misma ficha, en cuyo caso asumo las consecuencias de esa decisión y solicito que se apliquen las alternativas disponibles de ahorro de sangre.

8. DECLARACION SOBRE MIS ANTECEDENTES

Declaro bajo juramento no haber omitido ni alterado datos al exponer mis antecedentes clínicos, quirúrgicos, anestésicos, alérgicos y de medicación, ni al responder los distintos aspectos consultados en la evaluación preanestésica. Me comprometo a informar de inmediato al equipo tratante cualquier cambio en mi estado de salud, medicación nueva o síntoma que aparezca entre esta evaluación y el día de la cirugía.

9. PREGUNTAS Y REVOCACION

Se me ha dado la oportunidad de hacer preguntas y todas ellas me han sido contestadas satisfactoriamente. Entiendo que puedo retractar y anular este consentimiento en cualquier momento antes de que se administre el tratamiento anestésico, analgésico y/o la sedación, en forma libre y sin expresión de causa, sin que ello afecte la calidad de mi atención ni mi relación con el equipo tratante, haciéndome responsable de las consecuencias que puedan derivarse de esa decisión. La revocación se documentará por escrito en mi historia clínica.

10. DATOS PERSONALES Y DOCENCIA

Se me ha informado que mis datos de salud son datos sensibles, que reciben tratamiento confidencial, que se usan con fines asistenciales, administrativos y de facturación, y que puedo acceder a ellos, pedir su rectificación y conocer su destino. El uso de imágenes o registros con fines docentes o científicos requiere mi autorización expresa, que consta por separado en esta ficha, y en ningún caso permitirá mi identificación.

11. MARCO LEGAL

Consentimiento otorgado de manera libre, voluntaria e informada conforme a la Ley 26.529 de Derechos del Paciente en su Relación con los Profesionales e Instituciones de la Salud, su modificatoria Ley 26.742, el Decreto reglamentario 1089/2012, el artículo 59 del Código Civil y Comercial de la Nación, la Ley 17.132 del Ejercicio de la Medicina y la Ley 25.326 de Protección de los Datos Personales. Este documento integra mi historia clínica, me pertenece y se conserva por el plazo legal mínimo de diez años.

Se me entrega copia del presente y de la valoración pre-anestésica.`;

/* ---------- Declaraciones que el paciente marca junto al texto ---------- */
const CONSENT_ITEMS = [
  'Recibí y comprendí la información sobre la técnica anestésica propuesta',
  'Se me explicaron los riesgos generales y los propios de mi estado de salud',
  'Pude hacer preguntas y todas fueron respondidas satisfactoriamente',
  'Recibí las indicaciones sobre el ayuno preoperatorio',
  'Recibí las indicaciones sobre la medicación a suspender y a continuar',
  'Acepta anestesia general',
  'Acepta técnica regional (raquídea, peridural o bloqueo)',
  'Acepta sedación / cuidado anestésico monitorizado',
  'Acepta transfusión de hemoderivados si fuera indispensable',
  'RECHAZA transfusión de hemoderivados',
  'Autoriza el uso de imágenes con fines docentes o científicos',
  'Concurrirá con acompañante adulto responsable (cirugía ambulatoria)'
];

/* Al paciente se le manda tambien una hoja de indicaciones en castellano
   llano: ayuno, medicacion, horario y acompanante. Es el unico de los tres
   documentos que realmente va a leer. */
const INDICACIONES_AL_PACIENTE = true;

/* ---------- Quien firma el consentimiento ---------- */
const CONSENT_QUIEN = [
  '', 'El paciente', 'Representante legal / familiar', 'Paciente y representante',
  'Menor de 16 años: firma su representante legal',
  'Paciente que rechaza transfusión',
  'No firmado — urgencia vital (art. 9 Ley 26.529)',
  'Consentimiento revocado por el paciente'
];

/* ---------- Escala de Aldrete modificada ---------- */
const ALDRETE = [
  { k:'actividad',  t:'Actividad motora', o:[[2,'Mueve las 4 extremidades'],[1,'Mueve 2 extremidades'],[0,'No mueve extremidades']] },
  { k:'respiracion',t:'Respiración',      o:[[2,'Respira profundo y tose bien'],[1,'Disnea o respiración limitada'],[0,'Apnea']] },
  { k:'circulacion',t:'Circulación (TA)', o:[[2,'TA ± 20 % del basal'],[1,'TA ± 20-49 % del basal'],[0,'TA ± 50 % del basal']] },
  { k:'conciencia', t:'Conciencia',       o:[[2,'Totalmente despierto'],[1,'Despierta al llamado'],[0,'No responde']] },
  { k:'saturacion', t:'Saturación',       o:[[2,'SpO₂ > 92 % al aire ambiente'],[1,'Requiere O₂ para SpO₂ > 90 %'],[0,'SpO₂ < 90 % con O₂']] }
];

/* =========================================================================
   FLUJO DE TRABAJO - catalogos de las pantallas del asistente
   Paciente > Preanestesia > Anestesia > Recuperacion > Firmar
   ========================================================================= */

/* ---------- Tecnica anestesica: los botones grandes de la pantalla ---------- */
const TECNICAS_FLUJO = [
  { k:'general',   t:'General',    det:'Anestesia general' },
  { k:'sedacion',  t:'Sedación',   det:'Sedación / cuidado anestésico monitorizado' },
  { k:'raquidea',  t:'Raquídea',   det:'Anestesia raquídea (subaracnoidea)' },
  { k:'peridural', t:'Peridural',  det:'Anestesia peridural' },
  { k:'combinada', t:'Combinada',  det:'Combinada raqui-peridural' },
  { k:'bloqueo',   t:'Bloqueo periférico ecoguiado', det:'Bloqueo de nervio o plexo bajo ecografía' },
  { k:'dolorev',   t:'Dolor EV sistémico 24 h en sala', det:'Analgesia endovenosa sistémica en sala, 24 horas' }
];

/* ---------- Dispositivos de via aerea del flujo ---------- */
const DISPOSITIVOS_FLUJO = [
  { k:'ninguno', t:'Ninguno / máscara facial', tam:[] },
  { k:'tet',     t:'Tubo endotraqueal (TET)',  tam:['5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0'], um:'mm' },
  { k:'ml',      t:'Máscara laríngea (ML)',    tam:['1','1.5','2','2.5','3','4','5','6'], um:'N.º' },
  { k:'canula',  t:'Cánula nasal / bigotera',  tam:[] },
  { k:'tqt',     t:'Traqueostomía',            tam:[] },
  { k:'doble',   t:'Tubo de doble lumen',      tam:['32','35','37','39','41'], um:'Fr' }
];

/* ---------- Monitorizacion del flujo: estandar arriba, adicional abajo ---------- */
const MONITOR_FLUJO      = ['ECG','PANI','SpO₂','EtCO₂','Temperatura','TOF'];
const MONITOR_FLUJO_EXTRA = ['PA invasiva','PVC','BIS / EEG','Diuresis horaria','NIRS','POCUS','Otros'];

/* ---------- Balance hidrico ---------- */
const BALANCE_INGRESOS = [
  { k:'cristaloides', t:'Cristaloides' },
  { k:'coloides',     t:'Coloides' },
  { k:'sangre',       t:'GR / Sangre' },
  { k:'plasma',       t:'Plasma' },
  { k:'otrosIn',      t:'Otros' }
];
const BALANCE_EGRESOS = [
  { k:'diuresis',   t:'Diuresis' },
  { k:'sangrado',   t:'Pérdida sanguínea' },
  { k:'otrosOut',   t:'Otros' }
];

/* ---------- Tipos de evento intraoperatorio (desplegable) ---------- */
const TIPOS_EVENTO = [
  'Hipotensión','Hipertensión','Bradicardia','Taquicardia','Arritmia','Desaturación',
  'Broncoespasmo','Laringoespasmo','Intubación dificultosa','Intubación fallida',
  'Aspiración de contenido gástrico','Sangrado mayor','Transfusión','Reacción alérgica / anafilaxia',
  'Hipotermia','Hipertermia maligna','Isquemia miocárdica','Paro cardiorrespiratorio',
  'Punción dural accidental','Bloqueo fallido','Toxicidad por anestésicos locales (LAST)',
  'Despertar intraoperatorio','Lesión dentaria','Cambio de técnica anestésica','Otro'
];

/* ---------- Vias de administracion ---------- */
const VIAS_ADMIN = ['IV','IM','SC','VO','Inhalatoria','Intratecal','Peridural','Perineural',
                    'Infiltración','Tópica','IO','Intranasal','Rectal'];

/* ---------- Destino desde recuperacion ---------- */
const DESTINOS_RECUPERACION = ['Sala de recuperación','Habitación','UTI','Alta ambulatoria','Otro'];
