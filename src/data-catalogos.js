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

/* ---------- VADEMECUM PERIOPERATORIO DE LA MEDICACION HABITUAL ----------
   Fuente doctrinal: ASA Practice Advisory, ACC/AHA 2024 Perioperative,
   ESAIC Preoperative Evaluation, ASRA Anticoagulation 4th ed.,
   ASA Consensus GLP-1 (2023) e iSGLT2 (FDA/ASA), ACR/AAHKS 2022.

   PARA QUE ESTAN LOS CAMPOS NUEVOS
   La lista existia desde el principio con la conducta escrita en prosa, y el
   anestesiologo tenia que leer cada nota y hacer la cuenta de calendario en
   la cabeza. Los campos que siguen son los que le permiten a la app hacer esa
   cuenta sola y armar la CONDUCTA PERIOPERATORIA del punto 1 de la
   valoracion, con las fechas ya calculadas contra la fecha de la cirugia.

     n        nombre con el que se muestra
     g        grupo terapeutico
     sin      sinonimos y nombres comerciales, sólo para que el buscador
              encuentre el farmaco escriba como escriba el que busca
     accion   continuar | suspender | evaluar  (la conducta por defecto)
     dias     dias de anticipacion con que se suspende.
                0  = se omite unicamente la dosis del dia de la cirugia
                n  = se suspende n dias antes; la app calcula la fecha
                ausente = no se suspende
     neuro    horas de espera que pide ASRA antes de una puncion neuroaxial.
              Solo en los farmacos que afectan la hemostasia. 0 significa que
              no exige espera.
     reinicio cuando se reanuda en el postoperatorio
     alerta   lo que no se puede pasar por alto: sube al tope del panel de
              conducta perioperatoria en rojo, aunque el farmaco se continue
     nota     el texto completo de la recomendacion

   REGLA DE ORO, la misma del vademecum anestesico: la app calcula y muestra,
   el anestesiologo confirma. Toda conducta propuesta es editable y ninguna
   se aplica sola.
--------------------------------------------------------------------- */
const FARMACOS_PERIOP = [

  /* ============================ ANTIAGREGANTES ============================ */
  { n:'Aspirina (AAS)', g:'Antiagregante', sin:'acido acetilsalicilico aspirineta bayaspirina cardioaspirina AAS',
    accion:'evaluar', dias:7, neuro:0, reinicio:'24 h del postoperatorio si la hemostasia es adecuada.',
    nota:'CONTINUAR en prevención secundaria, stent coronario, ACV isquémico previo o arteriopatía periférica. Suspender 7 días SÓLO en prevención primaria o si la cirugía es de alto riesgo hemorrágico (neurocirugía, cámara posterior del ojo, próstata, canal medular).' },
  { n:'Clopidogrel', g:'Antiagregante', sin:'plavix iscover',
    accion:'suspender', dias:7, neuro:168, reinicio:'24 h del postoperatorio, con dosis de carga si venía por stent.',
    alerta:'No suspender un inhibidor P2Y12 sin hablar con cardiología si hay stent reciente: la trombosis del stent es mortal en cerca de un tercio de los casos.',
    nota:'Suspender 5-7 días. NO suspender antes de 1 mes de stent metálico ni de 3-6 meses de stent farmacoactivo sin consenso con cardiología. ASRA: 7 días antes de neuroaxial.' },
  { n:'Prasugrel', g:'Antiagregante', sin:'effient',
    accion:'suspender', dias:10, neuro:168, reinicio:'24-72 h según hemostasia.',
    alerta:'Igual que clopidogrel: la ventana del stent manda sobre el riesgo hemorrágico.',
    nota:'Suspender 7-10 días. ASRA: 7-10 días antes de neuroaxial.' },
  { n:'Ticagrelor', g:'Antiagregante', sin:'brilinta',
    accion:'suspender', dias:5, neuro:120, reinicio:'24 h con dosis de carga si corresponde.',
    alerta:'Igual que clopidogrel: consensuar la ventana con cardiología si hay stent reciente.',
    nota:'Suspender 3-5 días. ASRA: 5-7 días antes de neuroaxial. Efecto reversible, se recupera más rápido que el clopidogrel.' },
  { n:'Cilostazol', g:'Antiagregante', sin:'pletal',
    accion:'suspender', dias:2, neuro:42, reinicio:'24 h del postoperatorio.',
    nota:'Suspender 2 días. ASRA: 42 h antes de neuroaxial.' },
  { n:'Dipiridamol', g:'Antiagregante', sin:'persantin agrenox',
    accion:'suspender', dias:2, neuro:24, reinicio:'24 h del postoperatorio.',
    nota:'Suspender 24-48 h. ASRA: 24 h antes de neuroaxial (formulación de liberación prolongada).' },
  { n:'Triflusal', g:'Antiagregante', sin:'disgren',
    accion:'suspender', dias:7, neuro:168,
    nota:'Suspender 7 días; mismo criterio que la aspirina en prevención secundaria.' },
  { n:'Vorapaxar', g:'Antiagregante', sin:'zontivity',
    accion:'suspender', dias:28, neuro:672,
    nota:'Vida media muy larga: suspender 4 semanas. No hay reversión posible.' },

  /* ============================ ANTICOAGULANTES =========================== */
  { n:'Warfarina / Acenocumarol', g:'Anticoagulante', sin:'coumadin sintrom acenocumarol dicumarinico antagonista vitamina K',
    accion:'suspender', dias:5, neuro:120, reinicio:'12-24 h del postoperatorio si la hemostasia es adecuada.',
    alerta:'Pedir RIN el día previo o el mismo día: sin RIN no se punza el neuroeje ni se opera con seguridad.',
    nota:'Suspender 5 días (acenocumarol 3 días). RIN objetivo <1,5 para cirugía y <1,4 para neuroaxial. Puente con HBPM sólo en alto riesgo tromboembólico: válvula mecánica mitral, FA con CHA₂DS₂-VASc alto o TEV <3 meses.' },
  { n:'Rivaroxabán', g:'Anticoagulante (DOAC)', sin:'xarelto',
    accion:'suspender', dias:3, neuro:72, reinicio:'24 h (bajo riesgo) o 48-72 h (alto riesgo hemorrágico).',
    nota:'Con ClCr normal: 24 h si el riesgo hemorrágico es bajo, 48-72 h si es alto. ASRA: 72 h antes de neuroaxial y catéter retirado 6 h antes de la dosis siguiente.' },
  { n:'Apixabán', g:'Anticoagulante (DOAC)', sin:'eliquis',
    accion:'suspender', dias:3, neuro:72, reinicio:'24-48 h según hemostasia.',
    nota:'24 h en bajo riesgo, 48 h en alto riesgo hemorrágico. ASRA: 72 h antes de neuroaxial.' },
  { n:'Dabigatrán', g:'Anticoagulante (DOAC)', sin:'pradaxa',
    accion:'suspender', dias:4, neuro:120, reinicio:'24-48 h; existe reversión con idarucizumab.',
    nota:'ClCr >80: 48-72 h. ClCr 50-80: 72-96 h. ClCr <50: 96-120 h. ASRA: 120 h antes de neuroaxial con ClCr <50. Único DOAC con antídoto específico (idarucizumab).' },
  { n:'Edoxabán', g:'Anticoagulante (DOAC)', sin:'lixiana savaysa',
    accion:'suspender', dias:3, neuro:72, reinicio:'24-48 h según hemostasia.',
    nota:'24-48 h según riesgo hemorrágico y función renal. ASRA: 72 h antes de neuroaxial.' },
  { n:'Enoxaparina profiláctica', g:'Anticoagulante (HBPM)', sin:'clexane heparina bajo peso molecular HBPM 40 mg',
    accion:'evaluar', dias:1, neuro:12, reinicio:'4 h después de la punción o del retiro del catéter.',
    nota:'ASRA: esperar 12 h desde la última dosis profiláctica antes de punción neuroaxial; reiniciar 4 h después de la punción o del retiro del catéter.' },
  { n:'Enoxaparina terapéutica', g:'Anticoagulante (HBPM)', sin:'clexane 1 mg/kg dosis anticoagulante',
    accion:'evaluar', dias:1, neuro:24, reinicio:'24 h del postoperatorio en cirugía de alto riesgo hemorrágico.',
    nota:'ASRA: esperar 24 h desde la última dosis terapéutica antes de punción neuroaxial. Omitir la dosis de la noche previa.' },
  { n:'Dalteparina / Nadroparina', g:'Anticoagulante (HBPM)', sin:'fragmin fraxiparina',
    accion:'evaluar', dias:1, neuro:12,
    nota:'Mismo criterio que enoxaparina: 12 h si es profiláctica y 24 h si es terapéutica antes del neuroeje.' },
  { n:'Heparina sódica EV', g:'Anticoagulante', sin:'heparina no fraccionada HNF endovenosa',
    accion:'evaluar', dias:0, neuro:6, reinicio:'1 h después de la punción o del retiro del catéter.',
    nota:'Suspender 4-6 h y confirmar KPTT normal antes de neuroaxial. Reversible con protamina.' },
  { n:'Heparina cálcica subcutánea', g:'Anticoagulante', sin:'heparina subcutanea calcica 5000 UI',
    accion:'evaluar', dias:0, neuro:6,
    nota:'5.000 UI cada 12 h: esperar 4-6 h. Dosis mayores a 10.000 UI/día: esperar 12 h y controlar KPTT (ASRA).' },
  { n:'Fondaparinux', g:'Anticoagulante', sin:'arixtra',
    accion:'suspender', dias:3, neuro:72,
    nota:'ASRA: 72-96 h antes de neuroaxial. Punción única y atraumática; evitar catéter peridural.' },

  /* ========================== ANTIHIPERTENSIVOS =========================== */
  { n:'Enalapril / IECA', g:'Antihipertensivo', sin:'lisinopril ramipril perindopril captopril enalapril IECA inhibidor enzima convertidora',
    accion:'evaluar', dias:0, reinicio:'Cuando el paciente esté normovolémico y tolere vía oral.',
    nota:'Omitir la dosis de la mañana: riesgo de hipotensión refractaria a vasopresores en la inducción. Continuar si la indicación es insuficiencia cardíaca con fracción de eyección reducida, con vigilancia estricta y vasopresor preparado.' },
  { n:'Losartán / ARA II', g:'Antihipertensivo', sin:'valsartan telmisartan irbesartan candesartan losartan ARA II',
    accion:'evaluar', dias:0, reinicio:'Cuando esté normovolémico y tolere vía oral.',
    nota:'Igual que los IECA: omitir la dosis de la mañana en la mayoría de las cirugías. La hipotensión por bloqueo del eje renina-angiotensina responde a vasopresina más que a efedrina.' },
  { n:'Sacubitrilo / Valsartán', g:'Antihipertensivo', sin:'entresto',
    accion:'evaluar', dias:1, reinicio:'Con el paciente estable y normovolémico.',
    nota:'Omitir 24-36 h antes: hipotensión perioperatoria más marcada y prolongada que con un ARA II solo.' },
  { n:'Atenolol / Bisoprolol / Betabloqueantes', g:'Antihipertensivo', sin:'metoprolol carvedilol propranolol nebivolol betabloqueante atenolol bisoprolol',
    accion:'continuar', reinicio:'No se interrumpe; reanudar por sonda si no hay vía oral.',
    alerta:'La suspensión abrupta de un betabloqueante aumenta la mortalidad y la isquemia perioperatoria. No se suspende nunca por la cirugía.',
    nota:'CONTINUAR SIEMPRE, incluida la dosis de la mañana. Tampoco se INICIA betabloqueo el día de la cirugía: aumenta el ACV y la mortalidad (POISE).' },
  { n:'Amlodipina / Bloqueantes cálcicos', g:'Antihipertensivo', sin:'nifedipina lercanidipina felodipina amlodipina',
    accion:'continuar', nota:'Continuar, incluida la dosis de la mañana.' },
  { n:'Diltiazem / Verapamilo', g:'Antihipertensivo', sin:'diltiazem verapamilo calcioantagonista no dihidropiridinico',
    accion:'continuar', nota:'Continuar. Vigilar bradicardia y bloqueo AV, sobre todo asociado a betabloqueantes o a anestésicos halogenados.' },
  { n:'Furosemida / Diuréticos de asa', g:'Diurético', sin:'furosemida lasix torasemida bumetanida',
    accion:'evaluar', dias:0, reinicio:'Al recuperar la vía oral y con volemia controlada.',
    nota:'Omitir la mañana de la cirugía salvo insuficiencia cardíaca descompensada. Controlar potasio y magnesio: la hipopotasemia arritmiza.' },
  { n:'Hidroclorotiazida / Indapamida', g:'Diurético', sin:'hidroclorotiazida tiazida indapamida clortalidona',
    accion:'evaluar', dias:0, nota:'Omitir la mañana. Controlar sodio y potasio: la hiponatremia por tiazidas es frecuente y silenciosa.' },
  { n:'Espironolactona / Eplerenona', g:'Diurético', sin:'espironolactona aldactone eplerenona antialdosteronico',
    accion:'evaluar', dias:0, nota:'Omitir la mañana. Controlar potasio: riesgo de hiperpotasemia, sobre todo con IECA/ARA II o deterioro renal.' },
  { n:'Clonidina', g:'Antihipertensivo', sin:'clonidina catapresan alfa2 agonista',
    accion:'continuar', alerta:'La suspensión brusca provoca crisis hipertensiva de rebote.',
    nota:'CONTINUAR. Si no hay vía oral, prever parche transdérmico o sustitución con dexmedetomidina.' },
  { n:'Doxazosina / Alfabloqueantes', g:'Antihipertensivo', sin:'doxazosina prazosina terazosina',
    accion:'evaluar', dias:0, nota:'Omitir la mañana: potencia la hipotensión de la inducción.' },
  { n:'Tamsulosina', g:'Urológico', sin:'tamsulosina flomax silodosina alfuzosina prostata',
    accion:'continuar', alerta:'Antecedente de alfabloqueante: avisar al oftalmólogo antes de una cirugía de catarata por el síndrome del iris flácido intraoperatorio.',
    nota:'Continuar. Lo que importa no es suspenderlo —el efecto sobre el iris persiste meses— sino que el cirujano lo sepa.' },
  { n:'Alfa-metildopa', g:'Antihipertensivo', sin:'metildopa aldomet embarazo',
    accion:'continuar', nota:'Continuar, especialmente en la embarazada. Puede dar anemia hemolítica y test de Coombs positivo, que confunde la compatibilización.' },
  { n:'Hidralazina', g:'Antihipertensivo', sin:'hidralazina',
    accion:'continuar', nota:'Continuar. Vigilar taquicardia refleja.' },

  /* ======================= CARDIOLÓGICOS Y LÍPIDOS ======================== */
  { n:'Digoxina', g:'Cardiológico', sin:'digoxina lanoxin digital',
    accion:'continuar', nota:'Continuar. Controlar potasio y digoxinemia si hay náuseas, alteraciones visuales o arritmia: la hipopotasemia precipita la intoxicación.' },
  { n:'Amiodarona', g:'Antiarrítmico', sin:'amiodarona atlansil cordarone',
    accion:'continuar', nota:'Continuar. Vigilar bradicardia, bloqueo AV y QT prolongado. Vida media de semanas: suspenderla antes de la cirugía no cambia nada.' },
  { n:'Ivabradina', g:'Cardiológico', sin:'ivabradina procoralan',
    accion:'evaluar', dias:0, nota:'Omitir la mañana en cirugía mayor: bradicardia aditiva. Continuar si es por insuficiencia cardíaca.' },
  { n:'Nitratos (isosorbide)', g:'Cardiológico', sin:'isosorbide dinitrato mononitrato nitroglicerina parche',
    accion:'continuar', nota:'Continuar, incluido el parche. Retirar el parche si va a haber resonancia o cardioversión.' },
  { n:'Ranolazina', g:'Cardiológico', sin:'ranolazina ranexa',
    accion:'evaluar', dias:0, nota:'Omitir la mañana en cirugía mayor. Prolonga el QT.' },
  { n:'Atorvastatina / Estatinas', g:'Hipolipemiante', sin:'rosuvastatina simvastatina pravastatina estatina atorvastatina',
    accion:'continuar', alerta:'', nota:'CONTINUAR: la suspensión perioperatoria se asocia a más eventos cardiovasculares. Efecto protector demostrado en cirugía vascular.' },
  { n:'Ezetimibe / Fibratos', g:'Hipolipemiante', sin:'ezetimibe fenofibrato gemfibrozil bezafibrato',
    accion:'evaluar', dias:1, nota:'Se pueden omitir el día de la cirugía; no aportan nada en el perioperatorio y los fibratos suman riesgo de miopatía.' },
  { n:'Sildenafil / Tadalafil (HTP o disfunción eréctil)', g:'Cardiovascular', sin:'sildenafil viagra tadalafil revatio hipertension pulmonar',
    accion:'evaluar', dias:1, alerta:'Hipotensión grave si se asocia a nitratos o a nitroprusiato.',
    nota:'Suspender 24 h (sildenafil) o 48 h (tadalafil) si es por disfunción eréctil. CONTINUAR si la indicación es hipertensión pulmonar: la suspensión produce rebote.' },

  /* ============================= ANTIDIABÉTICOS =========================== */
  { n:'Metformina', g:'Antidiabético', sin:'metformina glucophage dbi biguanida',
    accion:'suspender', dias:1, reinicio:'48 h del postoperatorio con función renal y vía oral normales.',
    nota:'Suspender el día de la cirugía. Si hay contraste endovenoso o deterioro renal, suspender 24-48 h antes: riesgo de acidosis láctica.' },
  { n:'Empagliflozina / Dapagliflozina (iSGLT2)', g:'Antidiabético', sin:'empagliflozina dapagliflozina canagliflozina jardiance forxiga iSGLT2 gliflozina',
    accion:'suspender', dias:4, reinicio:'Con el paciente comiendo y sin cetonemia.',
    alerta:'Cetoacidosis euglucémica: la glucemia puede ser normal y el paciente estar en acidosis. Si no se suspendió, pedir cetonemia y estado ácido-base antes de inducir.',
    nota:'SUSPENDER 3-4 días antes (FDA/ASA). Es el error más frecuente y el más peligroso de esta lista, porque la glucemia normal tranquiliza falsamente.' },
  { n:'Semaglutida / Liraglutida (agonistas GLP-1)', g:'Antidiabético / obesidad', sin:'semaglutida ozempic wegovy liraglutida saxenda victoza dulaglutida tirzepatida mounjaro GLP1',
    accion:'suspender', dias:7, reinicio:'Al retomar la alimentación normal.',
    alerta:'Estómago lleno pese al ayuno correcto. Si no se suspendió: ecografía gástrica o inducción de secuencia rápida con manejo de estómago ocupado.',
    nota:'ASA 2023: suspender 1 semana antes si la presentación es semanal y 1 día si es diaria. Retrasan el vaciamiento gástrico durante días.' },
  { n:'Insulina basal (glargina / NPH / degludec)', g:'Antidiabético', sin:'insulina glargina lantus NPH degludec tresiba basal levemir',
    accion:'evaluar', dias:0, reinicio:'Al reiniciar la alimentación, con control horario.',
    nota:'Reducir 20-25 % la dosis de la noche previa y dar 50-80 % de la basal la mañana de la cirugía. Nunca suspenderla del todo en diabetes tipo 1: riesgo de cetoacidosis.' },
  { n:'Insulina rápida / correcciones', g:'Antidiabético', sin:'insulina corriente cristalina aspartica lispro glulisina correccion',
    accion:'suspender', dias:0, nota:'Omitir mientras esté en ayunas. Usar esquema de corrección con controles cada 1-2 h.' },
  { n:'Insulina premezclada', g:'Antidiabético', sin:'insulina premezcla 70/30 mixtard novomix humalog mix',
    accion:'evaluar', dias:0, nota:'La mañana de la cirugía: dar la mitad de la dosis o pasar a esquema basal-corrección.' },
  { n:'Bomba de insulina', g:'Antidiabético', sin:'bomba infusora insulina microinfusora sistema integrado',
    accion:'evaluar', dias:0, alerta:'No apagar la bomba sin plan de reemplazo: la diabetes tipo 1 sin insulina hace cetoacidosis en horas.',
    nota:'Mantener la basal en cirugía corta. En cirugía mayor o larga, pasar a infusión endovenosa de insulina y glucosa con controles horarios.' },
  { n:'Glibenclamida / Sulfonilureas', g:'Antidiabético', sin:'glibenclamida glimepirida gliclazida sulfonilurea daonil',
    accion:'suspender', dias:1, reinicio:'Con el paciente comiendo.',
    nota:'Suspender el día de la cirugía: riesgo de hipoglucemia prolongada en ayunas, sobre todo con glibenclamida.' },
  { n:'Repaglinida / Glinidas', g:'Antidiabético', sin:'repaglinida nateglinida glinida',
    accion:'suspender', dias:0, nota:'Omitir mientras esté en ayunas; se toman con las comidas.' },
  { n:'Sitagliptina / iDPP-4', g:'Antidiabético', sin:'sitagliptina vildagliptina linagliptina saxagliptina gliptina januvia',
    accion:'continuar', nota:'Se pueden continuar: bajo riesgo de hipoglucemia. También es aceptable omitir la dosis del día.' },
  { n:'Pioglitazona', g:'Antidiabético', sin:'pioglitazona glitazona actos',
    accion:'suspender', dias:1, nota:'Omitir el día de la cirugía: retención hidrosalina y riesgo de descompensación cardíaca.' },
  { n:'Acarbosa', g:'Antidiabético', sin:'acarbosa glucobay',
    accion:'suspender', dias:0, nota:'Omitir en ayunas; sólo actúa con la comida.' },

  /* ============================== ENDOCRINO =============================== */
  { n:'Levotiroxina', g:'Endocrino', sin:'levotiroxina t4 euthyrox levoxyl tiroides hipotiroidismo',
    accion:'continuar', nota:'Continuar. Vida media larga: omitir un día no tiene consecuencias, pero no hay razón para hacerlo.' },
  { n:'Metimazol / Propiltiouracilo', g:'Endocrino', sin:'metimazol danantizol propiltiouracilo hipertiroidismo',
    accion:'continuar', alerta:'Hipertiroidismo no controlado: postergar la cirugía electiva por riesgo de tormenta tiroidea.',
    nota:'CONTINUAR sin interrupción, junto con el betabloqueante si lo tiene.' },
  { n:'Corticoides crónicos', g:'Endocrino', sin:'prednisona meprednisona dexametasona hidrocortisona corticoide cronico deltisona',
    accion:'continuar', reinicio:'Volver a la dosis habitual en 24-48 h.',
    alerta:'Supresión del eje: prever dosis de estrés. La insuficiencia suprarrenal aguda intraoperatoria se presenta como hipotensión que no responde a vasopresores.',
    nota:'CONTINUAR la dosis habitual. Si recibió más de 5 mg/día de prednisona por más de 3 semanas en el último año, agregar hidrocortisona: 25 mg en cirugía menor, 50-75 mg en cirugía intermedia y 100-150 mg/día en cirugía mayor.' },
  { n:'Fludrocortisona', g:'Endocrino', sin:'fludrocortisona florinef addison',
    accion:'continuar', nota:'Continuar. Cubrir con hidrocortisona en dosis de estrés, que ya tiene efecto mineralocorticoide.' },
  { n:'Desmopresina', g:'Endocrino', sin:'desmopresina DDAVP minirin diabetes insipida',
    accion:'continuar', alerta:'Diabetes insípida sin desmopresina: poliuria masiva e hipernatremia intraoperatoria.',
    nota:'CONTINUAR. Controlar sodio, diuresis y balance con rigor.' },
  { n:'Bifosfonatos / Denosumab', g:'Endocrino', sin:'alendronato acido zoledronico denosumab prolia osteoporosis',
    accion:'evaluar', nota:'No requieren suspensión anestésica. Interesan al cirujano maxilofacial por el riesgo de osteonecrosis mandibular.' },

  /* ============================= NEUROLÓGICOS ============================= */
  { n:'Levetiracetam / Anticonvulsivantes', g:'Neurológico', sin:'levetiracetam keppra lamotrigina topiramato oxcarbazepina anticonvulsivante antiepileptico',
    accion:'continuar', reinicio:'Si no hay vía oral, pasar a la forma endovenosa equivalente.',
    alerta:'No suspender ningún anticonvulsivante por la cirugía: el estatus epiléptico perioperatorio es una complicación evitable.',
    nota:'CONTINUAR sin excepción, incluida la dosis de la mañana con un sorbo de agua.' },
  { n:'Ácido valproico', g:'Neurológico', sin:'valproico valproato depakene acido valproico',
    accion:'continuar', nota:'CONTINUAR. Puede alterar plaquetas y fibrinógeno: pedir coagulograma si la cirugía es hemorrágica.' },
  { n:'Carbamazepina / Fenitoína', g:'Neurológico', sin:'carbamazepina tegretol fenitoina epamin difenilhidantoina',
    accion:'continuar', nota:'CONTINUAR. Inducen enzimas hepáticas: acortan la duración de los relajantes no despolarizantes y de muchos anestésicos.' },
  { n:'Levodopa / Carbidopa', g:'Neurológico', sin:'levodopa carbidopa sinemet madopar parkinson',
    accion:'continuar', reinicio:'Reanudar lo antes posible, por sonda si hace falta.',
    alerta:'Más de 6-12 h sin levodopa: rigidez, disfagia y riesgo de síndrome neuroléptico maligno. Evitar metoclopramida, droperidol y haloperidol.',
    nota:'CONTINUAR hasta la mañana inclusive. Programarlo primero en el parte quirúrgico para acortar el ayuno.' },
  { n:'Pramipexol / Agonistas dopaminérgicos', g:'Neurológico', sin:'pramipexol ropinirol rotigotina parche parkinson',
    accion:'continuar', nota:'Continuar. El parche de rotigotina es la alternativa cuando no hay vía oral.' },
  { n:'Rasagilina / Selegilina (IMAO-B)', g:'Neurológico', sin:'rasagilina selegilina azilect IMAO B parkinson',
    accion:'evaluar', alerta:'Evitar meperidina y tramadol: riesgo de síndrome serotoninérgico.',
    nota:'Se puede continuar. Preferir opioides distintos de meperidina y tramadol, y simpaticomiméticos de acción directa.' },
  { n:'Piridostigmina (miastenia gravis)', g:'Neurológico', sin:'piridostigmina mestinon miastenia gravis',
    accion:'evaluar', alerta:'Miastenia gravis: extrema sensibilidad a los relajantes no despolarizantes. Monitorización neuromuscular obligatoria y plan de ventilación postoperatoria.',
    nota:'Decisión individual con neurología: continuarla mantiene la fuerza pero prolonga la succinilcolina y antagoniza los no despolarizantes. Titular todo con TOF.' },
  { n:'Donepecilo / Memantina', g:'Neurológico', sin:'donepecilo rivastigmina galantamina memantina alzheimer demencia',
    accion:'evaluar', nota:'Se pueden continuar. Los anticolinesterásicos prolongan la succinilcolina y pueden dar bradicardia. Considerar el riesgo de delirio postoperatorio.' },
  { n:'Baclofeno', g:'Neurológico', sin:'baclofeno lioresal intratecal espasticidad',
    accion:'continuar', alerta:'La suspensión del baclofeno intratecal produce un síndrome de abstinencia grave, con fiebre, rigidez y rabdomiólisis.',
    nota:'CONTINUAR. Si es por bomba intratecal, verificar carga y funcionamiento antes de la cirugía.' },
  { n:'Gabapentina / Pregabalina', g:'Neurológico', sin:'gabapentina pregabalina lyrica neurontin dolor neuropatico',
    accion:'continuar', nota:'Continuar. Suman sedación con los opioides; vigilar en el paciente añoso y en el apneico.' },
  { n:'Triptanes', g:'Neurológico', sin:'sumatriptan rizatriptan migraña triptan',
    accion:'evaluar', dias:1, nota:'Omitir el día de la cirugía: vasoconstricción coronaria y riesgo serotoninérgico.' },
  { n:'Riluzol', g:'Neurológico', sin:'riluzol rilutek ELA esclerosis lateral',
    accion:'continuar', alerta:'ELA: evitar succinilcolina por riesgo de hiperpotasemia grave; sensibilidad aumentada a los no despolarizantes.',
    nota:'Continuar. Lo importante es la enfermedad de base, no el fármaco.' },

  /* ============================= PSIQUIÁTRICOS ============================ */
  { n:'Sertralina / ISRS', g:'Psiquiátrico', sin:'sertralina fluoxetina paroxetina escitalopram citalopram ISRS antidepresivo',
    accion:'continuar', alerta:'Síndrome serotoninérgico con tramadol, meperidina, ondansetrón en dosis altas y azul de metileno.',
    nota:'CONTINUAR: la suspensión abrupta da síndrome de discontinuación. Puede aumentar el sangrado por disfunción plaquetaria.' },
  { n:'Venlafaxina / Duloxetina (IRSN)', g:'Psiquiátrico', sin:'venlafaxina duloxetina desvenlafaxina IRSN cymbalta',
    accion:'continuar', alerta:'Igual que los ISRS: evitar meperidina, tramadol y azul de metileno.',
    nota:'CONTINUAR. La venlafaxina puede dar hipertensión y taquicardia; la discontinuación abrupta es especialmente sintomática.' },
  { n:'Amitriptilina / Tricíclicos', g:'Psiquiátrico', sin:'amitriptilina nortriptilina imipramina clomipramina triciclico',
    accion:'continuar', nota:'Continuar. Vigilar arritmias y QT. Respuesta exagerada a los simpaticomiméticos indirectos como la efedrina: preferir fenilefrina o noradrenalina.' },
  { n:'IMAO (tranilcipromina, fenelzina)', g:'Psiquiátrico', sin:'tranilcipromina fenelzina moclobemida IMAO inhibidor monoaminooxidasa',
    accion:'evaluar', dias:14,
    alerta:'PROHIBIDA la meperidina: reacción excitatoria fatal. Evitar efedrina y todo simpaticomimético indirecto. Usar vasopresores directos en dosis reducida.',
    nota:'Consultar con psiquiatría antes de decidir. Si es irreversible y la cirugía lo permite, valorar suspensión 2 semanas; si no, anestesia libre de meperidina e indirectos.' },
  { n:'Litio', g:'Psiquiátrico', sin:'litio carbonato de litio ceglution bipolar',
    accion:'evaluar', dias:3, reinicio:'Con función renal y sodio normales.',
    alerta:'Ventana terapéutica estrecha: la deshidratación, los diuréticos y los AINE precipitan la intoxicación.',
    nota:'Suspender 72 h antes de cirugía mayor. Controlar litemia, sodio y función renal. Prolonga los relajantes musculares.' },
  { n:'Clonazepam / Benzodiazepinas', g:'Psiquiátrico', sin:'clonazepam alprazolam lorazepam diazepam benzodiazepina rivotril',
    accion:'continuar', alerta:'La suspensión brusca en el consumidor crónico da abstinencia, con convulsiones y delirio.',
    nota:'CONTINUAR. Tener presente la tolerancia cruzada: van a necesitar más hipnótico del esperado.' },
  { n:'Quetiapina / Antipsicóticos', g:'Psiquiátrico', sin:'quetiapina risperidona olanzapina haloperidol aripiprazol antipsicotico neuroleptico',
    accion:'continuar', nota:'Continuar. Vigilar QT prolongado e hipotensión. Riesgo de síndrome neuroléptico maligno, que en el quirófano se confunde con hipertermia maligna.' },
  { n:'Clozapina', g:'Psiquiátrico', sin:'clozapina leponex',
    accion:'continuar', alerta:'Agranulocitosis y miocarditis: pedir hemograma reciente antes de la cirugía.',
    nota:'CONTINUAR, la suspensión descompensa. Vigilar sialorrea, hipotensión, convulsiones y QT.' },
  { n:'Bupropión', g:'Psiquiátrico', sin:'bupropion wellbutrin zyban',
    accion:'evaluar', nota:'Se puede continuar. Baja el umbral convulsivo y puede aumentar la presión arterial.' },
  { n:'Mirtazapina / Trazodona', g:'Psiquiátrico', sin:'mirtazapina trazodona',
    accion:'continuar', nota:'Continuar. Suman sedación; la trazodona prolonga el QT.' },
  { n:'Metilfenidato / Lisdexanfetamina', g:'Psiquiátrico', sin:'metilfenidato ritalina concerta lisdexanfetamina anfetamina TDAH',
    accion:'suspender', dias:1, alerta:'Consumo reciente: hipertensión, taquicardia y arritmias; depleción de catecolaminas si el consumo es crónico.',
    nota:'Omitir el día de la cirugía. Documentar el consumo: cambia la respuesta a los vasopresores.' },

  /* ============================= RESPIRATORIO ============================= */
  { n:'Salbutamol / Broncodilatadores', g:'Respiratorio', sin:'salbutamol ventolin broncodilatador beta2 aerosol puff',
    accion:'continuar', alerta:'',
    nota:'CONTINUAR y administrar dos disparos inmediatamente antes de entrar a quirófano: es la profilaxis más efectiva del broncoespasmo a la intubación.' },
  { n:'Corticoides inhalados', g:'Respiratorio', sin:'budesonide fluticasona beclometasona corticoide inhalado seretide symbicort',
    accion:'continuar', nota:'Continuar, incluida la dosis de la mañana.' },
  { n:'Tiotropio / LAMA-LABA', g:'Respiratorio', sin:'tiotropio spiriva indacaterol formoterol salmeterol LAMA LABA EPOC',
    accion:'continuar', nota:'Continuar. Llevar el inhalador a quirófano y a la recuperación.' },
  { n:'Montelukast', g:'Respiratorio', sin:'montelukast singulair antileucotrieno',
    accion:'continuar', nota:'Continuar.' },
  { n:'Teofilina', g:'Respiratorio', sin:'teofilina aminofilina',
    accion:'evaluar', alerta:'Ventana terapéutica estrecha: arritmias y convulsiones por intoxicación, potenciadas por el halotano.',
    nota:'Continuar con control de teofilinemia si es posible. Evitar halogenados que sensibilicen el miocardio.' },
  { n:'Omalizumab / Biológicos para asma', g:'Respiratorio', sin:'omalizumab mepolizumab benralizumab dupilumab biologico asma',
    accion:'evaluar', nota:'No requieren suspensión. Coordinar la cirugía lejos del día de la infusión si es posible.' },

  /* ============================== DIGESTIVO =============================== */
  { n:'Omeprazol / IBP', g:'Digestivo', sin:'omeprazol pantoprazol esomeprazol lansoprazol IBP inhibidor bomba protones',
    accion:'continuar', nota:'Continuar; además sirve como profilaxis de aspiración. Dar la dosis de la mañana con un sorbo de agua.' },
  { n:'Ranitidina / Famotidina', g:'Digestivo', sin:'famotidina ranitidina antiH2 anti H2',
    accion:'continuar', nota:'Continuar. Útil en la profilaxis de aspiración.' },
  { n:'Metoclopramida', g:'Digestivo', sin:'metoclopramida reliveran primperan',
    accion:'continuar', alerta:'Contraindicada en Parkinson y en obstrucción intestinal.',
    nota:'Continuar. Vigilar reacciones extrapiramidales, sobre todo en jóvenes.' },
  { n:'Mesalazina / Sulfasalazina', g:'Digestivo', sin:'mesalazina sulfasalazina colitis crohn',
    accion:'continuar', nota:'Continuar.' },
  { n:'Ácido ursodesoxicólico', g:'Digestivo', sin:'ursodesoxicolico ursofalk',
    accion:'continuar', nota:'Continuar.' },

  /* ==================== INMUNOSUPRESORES Y ONCOLÓGICOS ==================== */
  { n:'Metotrexato', g:'Inmunosupresor', sin:'metotrexato MTX artritis reumatoidea',
    accion:'evaluar', dias:7, reinicio:'Al cicatrizar, en general a las 2 semanas.',
    nota:'Se puede continuar en cirugía menor y en artritis reumatoidea estable. Suspender 1-2 semanas si la cirugía tiene alto riesgo de infección o el paciente tiene deterioro renal.' },
  { n:'Leflunomida', g:'Inmunosupresor', sin:'leflunomida arava',
    accion:'evaluar', dias:14, nota:'Vida media muy larga. Suspender 2 semanas en cirugía mayor; en casos urgentes se puede acelerar la eliminación con colestiramina.' },
  { n:'Hidroxicloroquina', g:'Inmunosupresor', sin:'hidroxicloroquina cloroquina plaquenil lupus',
    accion:'continuar', nota:'CONTINUAR: no aumenta el riesgo infeccioso y su suspensión reactiva el lupus.' },
  { n:'Azatioprina', g:'Inmunosupresor', sin:'azatioprina imuran',
    accion:'continuar', nota:'Continuar. Pedir hemograma: mielosupresión. Antagoniza los relajantes no despolarizantes.' },
  { n:'Micofenolato', g:'Inmunosupresor', sin:'micofenolato cellcept myfortic trasplante',
    accion:'continuar', alerta:'Trasplantado: la inmunosupresión no se interrumpe sin el equipo de trasplante.',
    nota:'CONTINUAR en el trasplantado. En enfermedad autoinmune, puede suspenderse 1 semana en cirugía de alto riesgo infeccioso.' },
  { n:'Ciclosporina / Tacrolimus', g:'Inmunosupresor', sin:'ciclosporina tacrolimus prograf sandimmun trasplante',
    accion:'continuar', alerta:'Nefrotóxicos: evitar AINE y controlar creatinina, potasio y magnesio.',
    nota:'CONTINUAR sin interrupción y con dosaje de niveles. Prolongan los relajantes no despolarizantes.' },
  { n:'Anti-TNF (adalimumab, etanercept, infliximab)', g:'Inmunosupresor', sin:'adalimumab humira etanercept enbrel infliximab remicade golimumab certolizumab antiTNF biologico',
    accion:'suspender', dias:14, reinicio:'Al cicatrizar la herida, en general 14 días.',
    nota:'Suspender un intervalo completo de dosis antes de la cirugía y programarla al final de ese intervalo (guía ACR/AAHKS 2022).' },
  { n:'Rituximab', g:'Inmunosupresor', sin:'rituximab mabthera',
    accion:'suspender', dias:180, nota:'Programar la cirugía en el mes 7 del ciclo de 6 meses. Hipogammaglobulinemia prolongada.' },
  { n:'Tocilizumab / Abatacept', g:'Inmunosupresor', sin:'tocilizumab actemra abatacept orencia',
    accion:'suspender', dias:14, nota:'Suspender un intervalo de dosis. El tocilizumab enmascara la fiebre y la PCR: la infección postoperatoria puede pasar inadvertida.' },
  { n:'Tofacitinib / inhibidores JAK', g:'Inmunosupresor', sin:'tofacitinib xeljanz baricitinib upadacitinib JAK',
    accion:'suspender', dias:3, reinicio:'Al cicatrizar.',
    nota:'Suspender 3 días antes (ACR/AAHKS). Aumentan el riesgo de tromboembolismo, que se suma al de la cirugía.' },
  { n:'Bleomicina', g:'Oncológico', sin:'bleomicina quimioterapia',
    accion:'evaluar', alerta:'Toxicidad pulmonar por oxígeno: usar la FiO₂ más baja que mantenga saturación aceptable, idealmente menor a 0,30. Restringir fluidos.',
    nota:'Antecedente de bleomicina, aunque sea años atrás: la fibrosis pulmonar por hiperoxia es el riesgo, no el fármaco actual.' },
  { n:'Antraciclinas (doxorrubicina)', g:'Oncológico', sin:'doxorrubicina adriamicina epirubicina antraciclina',
    accion:'evaluar', alerta:'Cardiotoxicidad acumulativa: pedir ecocardiograma con fracción de eyección antes de cirugía mayor.',
    nota:'Documentar dosis acumulada. La miocardiopatía puede ser tardía y silenciosa.' },
  { n:'Bevacizumab', g:'Oncológico', sin:'bevacizumab avastin antiangiogenico',
    accion:'suspender', dias:42, nota:'Suspender 6 semanas antes y reanudar 4 semanas después: retrasa la cicatrización y provoca dehiscencia de suturas.' },
  { n:'Inhibidores de tirosina quinasa', g:'Oncológico', sin:'imatinib sunitinib sorafenib erlotinib pazopanib inhibidor tirosina quinasa',
    accion:'suspender', dias:7, nota:'Suspender según vida media, en general 1 semana. Hipertensión, sangrado y mala cicatrización.' },
  { n:'Inhibidores de checkpoint (nivolumab, pembrolizumab)', g:'Oncológico', sin:'nivolumab pembrolizumab ipilimumab inmunoterapia checkpoint',
    accion:'evaluar', alerta:'Miocarditis, neumonitis y colitis autoinmunes: buscar toxicidad activa antes de operar.',
    nota:'No requieren suspensión anestésica. Lo que importa es descartar toxicidad de órgano en curso.' },

  /* ============================ HORMONAL Y GINECO ========================= */
  { n:'Anticonceptivos orales / TRH', g:'Hormonal', sin:'anticonceptivo oral ACO estrogeno terapia reemplazo hormonal etinilestradiol',
    accion:'evaluar', dias:28, reinicio:'2 semanas después, con el paciente deambulando.',
    nota:'Considerar suspender 4 semanas antes de cirugía mayor u ortopédica por riesgo de tromboembolismo. Si se suspende, indicar anticoncepción alternativa; si no se suspende, reforzar la profilaxis antitrombótica.' },
  { n:'Tamoxifeno', g:'Oncológico', sin:'tamoxifeno nolvadex',
    accion:'evaluar', dias:21, nota:'Suspender 2-4 semanas antes de cirugía mayor por riesgo de tromboembolismo, consensuado con oncología.' },
  { n:'Raloxifeno', g:'Hormonal', sin:'raloxifeno evista',
    accion:'suspender', dias:3, nota:'Suspender 72 h antes de cirugía con inmovilización prolongada: riesgo de TEV.' },
  { n:'Inhibidores de aromatasa', g:'Oncológico', sin:'anastrozol letrozol exemestano aromatasa',
    accion:'continuar', nota:'Continuar: no aumentan el riesgo tromboembólico.' },
  { n:'Testosterona', g:'Hormonal', sin:'testosterona androgeno testoviron nebido',
    accion:'evaluar', nota:'Controlar hematocrito: la poliglobulia aumenta el riesgo trombótico.' },
  { n:'Análogos de GnRH', g:'Hormonal', sin:'leuprolide goserelina triptorelina GnRH',
    accion:'continuar', nota:'Continuar.' },

  /* ============================ DOLOR Y ADICCIONES ======================== */
  { n:'AINE (ibuprofeno, diclofenac, naproxeno)', g:'Analgésico', sin:'ibuprofeno diclofenac naproxeno ketorolac AINE antiinflamatorio',
    accion:'suspender', dias:3, neuro:24, reinicio:'Postoperatorio inmediato si la función renal y la hemostasia lo permiten.',
    nota:'Suspender 1-3 días según vida media (ibuprofeno 1 día, naproxeno 3 días, piroxicam 10 días). Disfunción plaquetaria y nefrotoxicidad con la hipovolemia. Los AINE solos no contraindican el neuroeje (ASRA).' },
  { n:'Celecoxib / Coxib', g:'Analgésico', sin:'celecoxib etoricoxib coxib',
    accion:'continuar', nota:'Se puede continuar: no afecta las plaquetas. Cautela en cardiopatía isquémica y en deterioro renal.' },
  { n:'Paracetamol', g:'Analgésico', sin:'paracetamol acetaminofeno tafirol',
    accion:'continuar', nota:'Continuar; forma parte de la analgesia multimodal.' },
  { n:'Tramadol', g:'Opioide', sin:'tramadol tramal',
    accion:'continuar', alerta:'Riesgo serotoninérgico con ISRS, IRSN e IMAO; baja el umbral convulsivo.',
    nota:'Continuar para evitar abstinencia. Revisar interacciones antes de repetirlo en el postoperatorio.' },
  { n:'Opioides crónicos (oxicodona, morfina, fentanilo parche)', g:'Opioide', sin:'oxicodona morfina fentanilo parche durogesic opioide cronico dolor',
    accion:'continuar', reinicio:'Mantener la dosis basal y sumar analgesia para el dolor agudo.',
    alerta:'Tolerancia: el requerimiento intraoperatorio y postoperatorio va a ser mucho mayor. No suspender la dosis basal.',
    nota:'CONTINUAR, incluido el parche transdérmico. Planificar analgesia multimodal y regional; consultar con el equipo de dolor.' },
  { n:'Buprenorfina', g:'Opioide', sin:'buprenorfina temgesic subutex suboxone',
    accion:'evaluar', alerta:'Alta afinidad por el receptor: los opioides habituales pueden no funcionar.',
    nota:'La recomendación actual es CONTINUARLA y sumar opioides de alta afinidad titulados, más analgesia regional. Consultar con el equipo de dolor crónico.' },
  { n:'Metadona', g:'Opioide', sin:'metadona',
    accion:'continuar', alerta:'Prolonga el QT: pedir ECG.',
    nota:'CONTINUAR la dosis basal, que cubre la abstinencia pero no el dolor agudo: hace falta analgesia adicional.' },
  { n:'Naltrexona', g:'Otros', sin:'naltrexona revia vivitrol',
    accion:'suspender', dias:3, reinicio:'No reiniciar hasta que no necesite opioides.',
    alerta:'Bloquea los opioides: si no se suspendió, planificar analgesia sin opioides (regional, ketamina, AINE).',
    nota:'Suspender 72 h antes si se planea analgesia opioide. La forma inyectable de depósito requiere 4 semanas.' },

  /* ================================ OTROS ================================= */
  { n:'Alopurinol', g:'Otros', sin:'alopurinol zyloric gota',
    accion:'continuar', nota:'Continuar.' },
  { n:'Colchicina', g:'Otros', sin:'colchicina colchicur gota',
    accion:'continuar', nota:'Continuar. Vigilar diarrea y mielosupresión con deterioro renal.' },
  { n:'Antirretrovirales (TARV)', g:'Otros', sin:'antirretroviral TARV HIV VIH ritonavir dolutegravir tenofovir',
    accion:'continuar', alerta:'El ritonavir inhibe el citocromo P450: prolonga fentanilo, midazolam y muchos otros.',
    nota:'CONTINUAR sin interrupción: la interrupción genera resistencias. Revisar interacciones antes de elegir los fármacos anestésicos.' },
  { n:'Antituberculosos (rifampicina, isoniazida)', g:'Otros', sin:'rifampicina isoniazida etambutol pirazinamida tuberculosis',
    accion:'continuar', nota:'Continuar. La rifampicina induce enzimas y acorta la duración de muchos anestésicos; la isoniazida es hepatotóxica.' },
  { n:'Anticolinérgicos vesicales (oxibutinina, solifenacina)', g:'Urológico', sin:'oxibutinina solifenacina tolterodina vejiga hiperactiva',
    accion:'evaluar', dias:1, nota:'Omitir el día de la cirugía en el paciente añoso: suman al delirio postoperatorio y a la retención urinaria.' },
  { n:'Finasteride / Dutasteride', g:'Urológico', sin:'finasteride dutasteride prostata',
    accion:'continuar', nota:'Continuar.' },
  { n:'Timolol y colirios betabloqueantes', g:'Oftalmológico', sin:'timolol colirio glaucoma betabloqueante oftalmico',
    accion:'continuar', alerta:'Absorción sistémica real: puede dar bradicardia y broncoespasmo pese a ser una gota.',
    nota:'Continuar. Tenerlo presente ante una bradicardia sin otra explicación.' },
  { n:'Acetazolamida', g:'Oftalmológico', sin:'acetazolamida diamox glaucoma',
    accion:'continuar', nota:'Continuar. Controlar potasio y estado ácido-base: produce acidosis metabólica hiperclorémica.' },
  { n:'Suplementos herbales (ginkgo, ajo, ginseng)', g:'Herbal', sin:'ginkgo ajo ginseng hierba san juan valeriana kava efedra herbal suplemento natural',
    accion:'suspender', dias:7,
    alerta:'Los pacientes no los declaran como medicación: hay que preguntarlos por separado.',
    nota:'Suspender 7 días. Los tres "G" (ginkgo, ajo, ginseng) alteran la hemostasia; la hierba de San Juan induce enzimas; la kava y la valeriana potencian la sedación; la efedra da arritmias.' },
  { n:'Vitamina E en dosis altas / Omega 3', g:'Herbal', sin:'vitamina E omega 3 aceite pescado',
    accion:'suspender', dias:7, nota:'Suspender 7 días si la cirugía es hemorrágica: efecto antiagregante leve.' },
  { n:'Cannabis medicinal o recreativo', g:'Otros', sin:'cannabis marihuana THC CBD aceite cannabis',
    accion:'evaluar', dias:3,
    alerta:'Hiperreactividad de la vía aérea si fuma, mayor requerimiento anestésico y taquicardia. Preguntar cuándo fue el último consumo.',
    nota:'Documentar forma y frecuencia de consumo. Idealmente sin consumo las 72 h previas. El consumo agudo aumenta el riesgo de laringoespasmo.' },
  { n:'Cocaína / estimulantes', g:'Otros', sin:'cocaina anfetamina estimulante droga',
    accion:'evaluar', alerta:'Consumo en las últimas 24-48 h: postergar la cirugía electiva por riesgo de isquemia miocárdica y arritmias. Evitar betabloqueantes puros.',
    nota:'Preguntar sin juzgar y documentar. Cambia por completo el manejo hemodinámico.' },
  { n:'Disulfiram', g:'Otros', sin:'disulfiram antabus alcoholismo',
    accion:'evaluar', dias:10, alerta:'Evitar todo preparado con alcohol, incluidas soluciones endovenosas y antisépticos con etanol.',
    nota:'Suspender 10 días antes de cirugía programada. Puede dar hipotensión por inhibición de la dopamina-betahidroxilasa.' },
  { n:'Antiácidos y sucralfato', g:'Digestivo', sin:'sucralfato hidroxido aluminio magnesio antiacido',
    accion:'suspender', dias:0, nota:'Omitir la mañana: los antiácidos con partículas aumentan el riesgo de neumonitis si hay aspiración. Si hace falta, usar citrato de sodio.' },
  { n:'Otro fármaco no listado', g:'Otros', sin:'otro',
    accion:'evaluar', nota:'Conducta a definir por el anestesiólogo. Dejar asentado nombre, dosis, indicación y la decisión tomada.' }
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
   sub-listas en el punto 9 y el documento sigue imprimiendo los nombres tal
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
