/* =========================================================================
   CATALOGOS BASE - AFAR
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
  { id:'cams',  nombre:'Centro Asistencial Municipal Ushuaia',               ciudad:'Ushuaia',    tipo:'Municipal' }
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

/* ---------- Antecedentes patologicos por sistema (chequeo rapido) ---------- */
const ANTECEDENTES_SISTEMAS = {
  'Cardiovascular':['Hipertensión arterial','Cardiopatía isquémica / IAM previo','Angina de pecho',
    'Insuficiencia cardíaca','Fibrilación auricular','Otras arritmias','Valvulopatía',
    'Portador de marcapasos / CDI','Stent coronario','Cirugía cardíaca previa',
    'Miocardiopatía','Hipertensión pulmonar','Enfermedad arterial periférica','ACV / AIT previo'],
  'Respiratorio':['Asma','EPOC','Tabaquismo activo','Ex tabaquista','SAHOS / apnea del sueño',
    'Neumopatía intersticial','Tuberculosis previa','Infección respiratoria reciente (<6 sem)',
    'Oxígeno domiciliario','CPAP/BiPAP nocturno','Bronquiectasias','Traqueostomía'],
  'Endocrino-metabólico':['Diabetes tipo 1','Diabetes tipo 2','Obesidad','Hipotiroidismo',
    'Hipertiroidismo','Insuficiencia suprarrenal','Corticoterapia crónica','Dislipemia',
    'Feocromocitoma','Cirugía bariátrica previa'],
  'Renal-urológico':['Insuficiencia renal crónica','Diálisis','Trasplante renal',
    'Litiasis renal','Infección urinaria a repetición'],
  'Digestivo-hepático':['Reflujo gastroesofágico','Hernia hiatal','Úlcera péptica',
    'Hepatopatía crónica / cirrosis','Hepatitis B/C','Enfermedad inflamatoria intestinal',
    'Gastroparesia','Várices esofágicas'],
  'Neurológico':['Epilepsia','Enfermedad de Parkinson','Demencia','Esclerosis múltiple',
    'Miastenia gravis','Neuropatía periférica','Hipertensión endocraneana','Lesión medular',
    'Cefalea crónica','Aneurisma cerebral'],
  'Hematológico':['Anemia','Anticoagulación crónica','Antiagregación crónica','Trombofilia',
    'TVP / TEP previos','Coagulopatía','Trombocitopenia','Hemofilia','Anemia falciforme',
    'Rechazo a transfusión (Testigo de Jehová)'],
  'Reumatológico-osteoarticular':['Artritis reumatoidea','Lupus','Espondilitis anquilosante',
    'Artrosis cervical','Escoliosis / cifosis','Fibromialgia','Osteoporosis'],
  'Psiquiátrico':['Depresión','Ansiedad','Trastorno bipolar','Esquizofrenia',
    'Consumo problemático de alcohol','Consumo de sustancias','Dolor crónico / opioides'],
  'Infectológico-inmunológico':['VIH','Inmunosupresión','Trasplante de órgano sólido',
    'Colonización por gérmenes multirresistentes','COVID-19 previo con secuelas'],
  'Oncológico':['Neoplasia activa','Quimioterapia reciente','Radioterapia cervical/torácica',
    'Neoplasia en remisión'],
  'Obstétrico':['Embarazo actual','Preeclampsia','Diabetes gestacional','Cesárea previa',
    'Hemorragia postparto previa','Placenta previa / acretismo']
};

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
const ANALGESIA_POP = [
  'Paracetamol 1 g EV c/6-8 h','Dipirona 1-2 g EV c/8 h','Ketorolac 30 mg EV c/8 h',
  'Diclofenac 75 mg IM/EV c/12 h','Ibuprofeno 400-600 mg VO c/8 h','Morfina EV titulada',
  'Morfina subcutánea','Nalbufina 10 mg EV','Tramadol 100 mg EV c/8 h','PCA endovenosa',
  'Peridural continua con anestésico local','Catéter perineural continuo','Bloqueo de campo con AL',
  'Infiltración de la herida','Dexametasona 4-8 mg EV','Ketamina en dosis subanestésica',
  'Lidocaína EV en infusión','Sulfato de magnesio EV','Gabapentina / Pregabalina',
  'Dexmedetomidina','Crioterapia / medidas no farmacológicas'
];

/* ---------- Consentimiento informado - texto base ---------- */
const TEXTO_CONSENTIMIENTO = `Declaro que el/la profesional anestesiólogo/a me ha explicado, en lenguaje claro y comprensible, el procedimiento anestésico propuesto para la intervención indicada, así como sus alternativas razonables.

Comprendo que la anestesia es un acto médico que, aun realizado con la mayor diligencia, no está exento de riesgos. Se me han explicado los riesgos generales (náuseas y vómitos, dolor de garganta, lesión dentaria o labial, cefalea, dolor lumbar, retención urinaria, hipotensión, reacciones alérgicas) y los riesgos graves poco frecuentes (dificultad en el manejo de la vía aérea, aspiración de contenido gástrico, lesión nerviosa, despertar intraoperatorio, infarto, accidente cerebrovascular, hipertermia maligna, coma y muerte), cuya probabilidad aumenta en función de mi estado de salud previo y de la complejidad de la cirugía.

Se me ha informado sobre mi riesgo anestésico particular, se me ha dado la oportunidad de realizar preguntas y todas ellas fueron respondidas satisfactoriamente. Entiendo que puedo revocar este consentimiento en cualquier momento antes del procedimiento sin que ello afecte la calidad de mi atención.

Autorizo asimismo a que, si durante el acto anestésico surgieran situaciones imprevistas, el equipo adopte las medidas que resulten necesarias para preservar mi vida y mi salud, incluida la transfusión de hemoderivados cuando sea indispensable, salvo la objeción que se consigna expresamente en esta ficha.

Consentimiento otorgado conforme a la Ley Nacional 26.529 de Derechos del Paciente y su modificatoria Ley 26.742.`;

/* ---------- Escala de Aldrete modificada ---------- */
const ALDRETE = [
  { k:'actividad',  t:'Actividad motora', o:[[2,'Mueve las 4 extremidades'],[1,'Mueve 2 extremidades'],[0,'No mueve extremidades']] },
  { k:'respiracion',t:'Respiración',      o:[[2,'Respira profundo y tose bien'],[1,'Disnea o respiración limitada'],[0,'Apnea']] },
  { k:'circulacion',t:'Circulación (TA)', o:[[2,'TA ± 20 % del basal'],[1,'TA ± 20-49 % del basal'],[0,'TA ± 50 % del basal']] },
  { k:'conciencia', t:'Conciencia',       o:[[2,'Totalmente despierto'],[1,'Despierta al llamado'],[0,'No responde']] },
  { k:'saturacion', t:'Saturación',       o:[[2,'SpO₂ > 92 % al aire ambiente'],[1,'Requiere O₂ para SpO₂ > 90 %'],[0,'SpO₂ < 90 % con O₂']] }
];
