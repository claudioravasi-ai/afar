/* =========================================================================
   ANTECEDENTES DEL PACIENTE
   Reemplaza al nomenclador CIE-10, que se quito de la app por pedido de la
   asociacion: en el consultorio de preanestesia no se codifica, se describe.
   El unico nomenclador que queda es el anestesico (data-nomenclador.js).

   Cada patologia trae:
     n     nombre clinico
     sis   sistema
     chip  etiqueta corta para los accesos rapidos (opcional)
     meds  medicacion habitual asociada; los nombres coinciden con
           FARMACOS_PERIOP para poder ofrecer la conducta perioperatoria
     flags marcas que consumen las escalas y los estudios sugeridos
   ========================================================================= */

const PATOLOGIAS = [

/* ------------------------------ Cardiovascular ------------------------- */
{ n:'Hipertensión arterial', sis:'Cardiovascular', chip:'HTA', flags:['hta'],
  meds:['Enalapril / IECA','Losartán / ARA II','Amlodipina / Bloqueantes cálcicos',
        'Atenolol / Bisoprolol / Betabloqueantes','Furosemida / Diuréticos'] },
{ n:'Cardiopatía isquémica / IAM previo', sis:'Cardiovascular', chip:'Cardiopatía',
  flags:['cardiopatia'],
  meds:['Aspirina (AAS)','Clopidogrel','Atorvastatina / Estatinas',
        'Atenolol / Bisoprolol / Betabloqueantes','Enalapril / IECA'] },
{ n:'Angina de pecho', sis:'Cardiovascular', flags:['cardiopatia'],
  meds:['Aspirina (AAS)','Atorvastatina / Estatinas','Atenolol / Bisoprolol / Betabloqueantes'] },
{ n:'Insuficiencia cardíaca', sis:'Cardiovascular', flags:['cardiopatia','icc'],
  meds:['Furosemida / Diuréticos','Enalapril / IECA','Atenolol / Bisoprolol / Betabloqueantes',
        'Digoxina','Empagliflozina / Dapagliflozina (iSGLT2)'] },
{ n:'Fibrilación auricular', sis:'Cardiovascular', chip:'Arritmia', flags:['arritmia'],
  meds:['Warfarina / Acenocumarol','Rivaroxabán','Apixabán','Dabigatrán','Digoxina','Amiodarona'] },
{ n:'Otras arritmias', sis:'Cardiovascular', flags:['arritmia'],
  meds:['Amiodarona','Atenolol / Bisoprolol / Betabloqueantes'] },
{ n:'Valvulopatía', sis:'Cardiovascular', flags:['cardiopatia'],
  meds:['Warfarina / Acenocumarol','Furosemida / Diuréticos'] },
{ n:'Portador de marcapasos / CDI', sis:'Cardiovascular', flags:['arritmia','dispositivo'], meds:[] },
{ n:'Stent coronario', sis:'Cardiovascular', flags:['cardiopatia'],
  meds:['Aspirina (AAS)','Clopidogrel','Ticagrelor','Prasugrel','Atorvastatina / Estatinas'] },
{ n:'Cirugía cardíaca previa', sis:'Cardiovascular', flags:['cardiopatia'], meds:[] },
{ n:'Miocardiopatía', sis:'Cardiovascular', flags:['cardiopatia','icc'],
  meds:['Enalapril / IECA','Atenolol / Bisoprolol / Betabloqueantes','Furosemida / Diuréticos'] },
{ n:'Hipertensión pulmonar', sis:'Cardiovascular', flags:['cardiopatia','respiratorio'], meds:[] },
{ n:'Enfermedad arterial periférica', sis:'Cardiovascular', flags:['cardiopatia'],
  meds:['Aspirina (AAS)','Clopidogrel','Atorvastatina / Estatinas'] },
{ n:'ACV / AIT previo', sis:'Cardiovascular', flags:['acv'],
  meds:['Aspirina (AAS)','Clopidogrel','Atorvastatina / Estatinas'] },

/* ------------------------------- Respiratorio -------------------------- */
{ n:'Asma', sis:'Respiratorio', chip:'EPOC / Asma', flags:['respiratorio','asma'],
  meds:['Salbutamol / Broncodilatadores','Corticoides inhalados'] },
{ n:'EPOC', sis:'Respiratorio', flags:['respiratorio','epoc'],
  meds:['Salbutamol / Broncodilatadores','Corticoides inhalados'] },
{ n:'SAHOS / apnea obstructiva del sueño', sis:'Respiratorio', chip:'SAOS',
  flags:['respiratorio','saos'], meds:[] },
{ n:'Tabaquismo activo', sis:'Respiratorio', flags:['respiratorio','tabaquismo'], meds:[] },
{ n:'Ex tabaquista', sis:'Respiratorio', flags:['tabaquismo'], meds:[] },
{ n:'Neumopatía intersticial', sis:'Respiratorio', flags:['respiratorio'], meds:['Corticoides crónicos'] },
{ n:'Tuberculosis previa', sis:'Respiratorio', flags:['respiratorio'], meds:[] },
{ n:'Infección respiratoria reciente (< 6 semanas)', sis:'Respiratorio',
  flags:['respiratorio','infeccionRespiratoria'], meds:[] },
{ n:'Oxígeno domiciliario', sis:'Respiratorio', flags:['respiratorio'], meds:[] },
{ n:'CPAP / BiPAP nocturno', sis:'Respiratorio', flags:['respiratorio','saos'], meds:[] },
{ n:'Bronquiectasias', sis:'Respiratorio', flags:['respiratorio'], meds:[] },
{ n:'Traqueostomía', sis:'Respiratorio', flags:['respiratorio','viaAerea'], meds:[] },

/* -------------------------- Endocrino-metabólico ----------------------- */
{ n:'Diabetes tipo 1', sis:'Endocrino-metabólico', flags:['diabetes'],
  meds:['Insulina basal (glargina/NPH)','Insulina rápida / correcciones'] },
{ n:'Diabetes tipo 2', sis:'Endocrino-metabólico', chip:'DBT', flags:['diabetes'],
  meds:['Metformina','Empagliflozina / Dapagliflozina (iSGLT2)',
        'Semaglutida / Liraglutida (agonistas GLP-1)','Glibenclamida / Sulfonilureas',
        'Insulina basal (glargina/NPH)'] },
{ n:'Obesidad', sis:'Endocrino-metabólico', chip:'Obesidad', flags:['obesidad'],
  meds:['Semaglutida / Liraglutida (agonistas GLP-1)'] },
{ n:'Hipotiroidismo', sis:'Endocrino-metabólico', flags:['tiroides'], meds:['Levotiroxina'] },
{ n:'Hipertiroidismo', sis:'Endocrino-metabólico', flags:['tiroides'], meds:[] },
{ n:'Insuficiencia suprarrenal', sis:'Endocrino-metabólico', flags:['corticoides'],
  meds:['Corticoides crónicos'] },
{ n:'Corticoterapia crónica', sis:'Endocrino-metabólico', flags:['corticoides'],
  meds:['Corticoides crónicos'] },
{ n:'Dislipemia', sis:'Endocrino-metabólico', flags:[], meds:['Atorvastatina / Estatinas'] },
{ n:'Feocromocitoma', sis:'Endocrino-metabólico', flags:['hta','feocromocitoma'], meds:[] },
{ n:'Cirugía bariátrica previa', sis:'Endocrino-metabólico', flags:['obesidad'], meds:[] },

/* ----------------------------- Renal-urológico ------------------------- */
{ n:'Insuficiencia renal crónica', sis:'Renal-urológico', chip:'Enf. renal', flags:['renal'],
  meds:['Furosemida / Diuréticos'] },
{ n:'Diálisis', sis:'Renal-urológico', flags:['renal','dialisis'], meds:[] },
{ n:'Trasplante renal', sis:'Renal-urológico', flags:['renal','inmunosupresion'],
  meds:['Corticoides crónicos','Metotrexato'] },
{ n:'Litiasis renal', sis:'Renal-urológico', flags:[], meds:[] },
{ n:'Infección urinaria a repetición', sis:'Renal-urológico', flags:[], meds:[] },

/* --------------------------- Digestivo-hepático ------------------------ */
{ n:'Reflujo gastroesofágico', sis:'Digestivo-hepático', chip:'ERGE / Hernia hiatal',
  flags:['reflujo','aspiracion'], meds:['Omeprazol / IBP'] },
{ n:'Hernia hiatal', sis:'Digestivo-hepático', flags:['reflujo','aspiracion'],
  meds:['Omeprazol / IBP'] },
{ n:'Úlcera péptica', sis:'Digestivo-hepático', flags:[], meds:['Omeprazol / IBP'] },
{ n:'Hepatopatía crónica / cirrosis', sis:'Digestivo-hepático', chip:'Hepatopatía',
  flags:['hepatopatia'], meds:['Furosemida / Diuréticos'] },
{ n:'Hepatitis B / C', sis:'Digestivo-hepático', flags:['hepatopatia'], meds:[] },
{ n:'Enfermedad inflamatoria intestinal', sis:'Digestivo-hepático', flags:['inmunosupresion'],
  meds:['Corticoides crónicos','Anti-TNF (adalimumab, etanercept)','Metotrexato'] },
{ n:'Gastroparesia', sis:'Digestivo-hepático', flags:['aspiracion'], meds:[] },
{ n:'Várices esofágicas', sis:'Digestivo-hepático', flags:['hepatopatia','sangrado'],
  meds:['Atenolol / Bisoprolol / Betabloqueantes'] },

/* ------------------------------- Neurológico --------------------------- */
{ n:'Epilepsia', sis:'Neurológico', chip:'Neurológica', flags:['neurologico'],
  meds:['Levetiracetam / Anticonvulsivantes'] },
{ n:'Enfermedad de Parkinson', sis:'Neurológico', flags:['neurologico'],
  meds:['Levodopa / Carbidopa'] },
{ n:'Demencia', sis:'Neurológico', flags:['neurologico','fragilidad'], meds:[] },
{ n:'Esclerosis múltiple', sis:'Neurológico', flags:['neurologico'],
  meds:['Corticoides crónicos'] },
{ n:'Miastenia gravis', sis:'Neurológico', flags:['neurologico','bnm'],
  meds:['Corticoides crónicos'] },
{ n:'Neuropatía periférica', sis:'Neurológico', flags:['neurologico'], meds:[] },
{ n:'Hipertensión endocraneana', sis:'Neurológico', flags:['neurologico'], meds:[] },
{ n:'Lesión medular', sis:'Neurológico', flags:['neurologico'], meds:[] },
{ n:'Cefalea crónica', sis:'Neurológico', flags:[], meds:[] },
{ n:'Aneurisma cerebral', sis:'Neurológico', flags:['neurologico'], meds:[] },

/* ------------------------------ Hematológico --------------------------- */
{ n:'Anemia', sis:'Hematológico', chip:'Anemia', flags:['anemia'], meds:[] },
{ n:'Anticoagulación crónica', sis:'Hematológico', chip:'Coagulación',
  flags:['anticoagulado','sangrado'],
  meds:['Warfarina / Acenocumarol','Rivaroxabán','Apixabán','Dabigatrán','Edoxabán',
        'Enoxaparina terapéutica'] },
{ n:'Antiagregación crónica', sis:'Hematológico', flags:['antiagregado','sangrado'],
  meds:['Aspirina (AAS)','Clopidogrel','Ticagrelor','Prasugrel'] },
{ n:'Trombofilia', sis:'Hematológico', flags:['tev'], meds:['Enoxaparina profiláctica'] },
{ n:'TVP / TEP previos', sis:'Hematológico', flags:['tev'],
  meds:['Rivaroxabán','Apixabán','Warfarina / Acenocumarol'] },
{ n:'Coagulopatía', sis:'Hematológico', flags:['sangrado','coagulopatia'], meds:[] },
{ n:'Trombocitopenia', sis:'Hematológico', flags:['sangrado','coagulopatia'], meds:[] },
{ n:'Hemofilia', sis:'Hematológico', flags:['sangrado','coagulopatia'], meds:[] },
{ n:'Anemia falciforme', sis:'Hematológico', flags:['anemia'], meds:[] },
{ n:'Rechazo a transfusión (Testigo de Jehová)', sis:'Hematológico', flags:['sinTransfusion'], meds:[] },

/* ----------------------- Reumatológico-osteoarticular ------------------ */
{ n:'Artritis reumatoidea', sis:'Reumatológico-osteoarticular', flags:['viaAerea','inmunosupresion'],
  meds:['Metotrexato','Anti-TNF (adalimumab, etanercept)','Corticoides crónicos'] },
{ n:'Lupus', sis:'Reumatológico-osteoarticular', flags:['inmunosupresion'],
  meds:['Corticoides crónicos','Metotrexato'] },
{ n:'Espondilitis anquilosante', sis:'Reumatológico-osteoarticular', flags:['viaAerea','neuroaxial'],
  meds:['Anti-TNF (adalimumab, etanercept)'] },
{ n:'Artrosis cervical', sis:'Reumatológico-osteoarticular', flags:['viaAerea'], meds:[] },
{ n:'Escoliosis / cifosis', sis:'Reumatológico-osteoarticular', flags:['neuroaxial'], meds:[] },
{ n:'Fibromialgia', sis:'Reumatológico-osteoarticular', flags:['dolorCronico'],
  meds:['Amitriptilina / Tricíclicos'] },
{ n:'Osteoporosis', sis:'Reumatológico-osteoarticular', flags:[], meds:[] },

/* ------------------------------- Psiquiátrico -------------------------- */
{ n:'Depresión', sis:'Psiquiátrico', flags:['psiquiatrico'],
  meds:['Sertralina / ISRS','Amitriptilina / Tricíclicos'] },
{ n:'Ansiedad', sis:'Psiquiátrico', flags:['psiquiatrico'],
  meds:['Clonazepam / Benzodiazepinas','Sertralina / ISRS'] },
{ n:'Trastorno bipolar', sis:'Psiquiátrico', flags:['psiquiatrico'],
  meds:['Litio','Quetiapina / Antipsicóticos'] },
{ n:'Esquizofrenia', sis:'Psiquiátrico', flags:['psiquiatrico'],
  meds:['Quetiapina / Antipsicóticos'] },
{ n:'Consumo problemático de alcohol', sis:'Psiquiátrico', flags:['alcohol'], meds:[] },
{ n:'Consumo de sustancias', sis:'Psiquiátrico', flags:['sustancias'],
  meds:['Cannabis medicinal','Naltrexona'] },
{ n:'Dolor crónico / uso de opioides', sis:'Psiquiátrico', flags:['dolorCronico','opioides'],
  meds:['Buprenorfina','Amitriptilina / Tricíclicos'] },

/* ------------------------ Infectológico-inmunológico ------------------- */
{ n:'VIH', sis:'Infectológico-inmunológico', flags:['inmunosupresion'], meds:[] },
{ n:'Inmunosupresión', sis:'Infectológico-inmunológico', flags:['inmunosupresion'],
  meds:['Corticoides crónicos','Metotrexato','Anti-TNF (adalimumab, etanercept)'] },
{ n:'Trasplante de órgano sólido', sis:'Infectológico-inmunológico', flags:['inmunosupresion'],
  meds:['Corticoides crónicos'] },
{ n:'Colonización por gérmenes multirresistentes', sis:'Infectológico-inmunológico',
  flags:['aislamiento'], meds:[] },
{ n:'COVID-19 previo con secuelas', sis:'Infectológico-inmunológico', flags:['respiratorio'], meds:[] },

/* -------------------------------- Oncológico --------------------------- */
{ n:'Neoplasia activa', sis:'Oncológico', chip:'Oncológica', flags:['oncologico','tev'],
  meds:['Tamoxifeno'] },
{ n:'Quimioterapia reciente', sis:'Oncológico', flags:['oncologico','anemia'], meds:[] },
{ n:'Radioterapia cervical / torácica', sis:'Oncológico', flags:['oncologico','viaAerea'], meds:[] },
{ n:'Neoplasia en remisión', sis:'Oncológico', flags:['oncologico'], meds:[] },

/* -------------------------------- Obstétrico --------------------------- */
{ n:'Embarazo actual', sis:'Obstétrico', flags:['embarazo','aspiracion'], meds:[] },
{ n:'Preeclampsia', sis:'Obstétrico', flags:['embarazo','hta'], meds:[] },
{ n:'Diabetes gestacional', sis:'Obstétrico', flags:['embarazo','diabetes'],
  meds:['Insulina basal (glargina/NPH)'] },
{ n:'Cesárea previa', sis:'Obstétrico', flags:['embarazo'], meds:[] },
{ n:'Hemorragia postparto previa', sis:'Obstétrico', flags:['embarazo','sangrado'], meds:[] },
{ n:'Placenta previa / acretismo', sis:'Obstétrico', flags:['embarazo','sangrado'], meds:[] }
];

/* Accesos rapidos que se ven como botones en la pantalla de antecedentes.
   El orden es el del manual de flujo de trabajo, no el del catalogo. */
const ORDEN_CHIPS = ['HTA','DBT','Cardiopatía','Arritmia','EPOC / Asma','SAOS',
  'ERGE / Hernia hiatal','Obesidad','Enf. renal','Hepatopatía','Neurológica',
  'Oncológica','Coagulación','Anemia'];
const PATOLOGIAS_CHIP = ORDEN_CHIPS
  .map(c => PATOLOGIAS.find(p => p.chip === c))
  .filter(Boolean)
  .concat(PATOLOGIAS.filter(p => p.chip && ORDEN_CHIPS.indexOf(p.chip) < 0));

/* Compatibilidad: la revision rapida por sistemas se arma sola desde el
   catalogo, para que no haya dos listas que mantener. */
const ANTECEDENTES_SISTEMAS = (function(){
  const o = {};
  PATOLOGIAS.forEach(p => { (o[p.sis] = o[p.sis] || []).push(p.n); });
  return o;
})();

function patologiaPorNombre(n){
  const k = String(n || '').toLowerCase();
  return PATOLOGIAS.find(p => p.n.toLowerCase() === k) || null;
}

/* Todas las marcas activas de una lista de antecedentes del paciente */
function flagsDeAntecedentes(lista){
  const f = {};
  (lista || []).forEach(a => {
    const p = patologiaPorNombre(a.n || a);
    if(p) (p.flags || []).forEach(x => f[x] = true);
  });
  return f;
}

/* Medicacion habitual sugerida a partir de los antecedentes cargados */
function medicacionSugerida(lista){
  const vistos = {}, out = [];
  (lista || []).forEach(a => {
    const p = patologiaPorNombre(a.n || a);
    if(!p) return;
    (p.meds || []).forEach(m => {
      if(vistos[m]) return;
      vistos[m] = true;
      const fp = FARMACOS_PERIOP.find(x => x.n === m);
      out.push({ n:m, g: fp ? fp.g : 'Otro', accion: fp ? fp.accion : 'evaluar',
                 nota: fp ? fp.nota : '', porque: p.n });
    });
  });
  return out;
}

/* --------------------- Antecedentes quirurgicos ------------------------ */
const CIRUGIAS_PREVIAS = [
  'Apendicectomía','Colecistectomía','Hernioplastia inguinal','Hernioplastia umbilical',
  'Cesárea','Histerectomía','Cirugía de ovario / anexos','Prostatectomía','RTU de próstata',
  'Cirugía de rodilla','Prótesis de cadera','Prótesis de rodilla','Osteosíntesis de fractura',
  'Artroscopia','Cirugía de columna','Cirugía cardíaca / by-pass','Angioplastia con stent',
  'Cirugía de válvula cardíaca','Cirugía vascular periférica','Cirugía de tiroides',
  'Cirugía bariátrica','Gastrectomía','Cirugía de colon','Cirugía de recto / ano',
  'Cirugía de mama','Amigdalectomía','Adenoidectomía','Septoplastia','Cirugía de senos paranasales',
  'Cirugía de catarata','Vitrectomía','Cirugía plástica / estética','Cirugía de várices',
  'Traqueostomía','Craneotomía','Trasplante de órgano','Cirugía torácica / pulmonar',
  'Cirugía maxilofacial','Cirugía urológica','Cesárea de urgencia'
];

/* --------------------- Antecedentes familiares ------------------------- */
const ANTECEDENTES_FAMILIARES = [
  'Sin antecedentes familiares relevantes',
  'Hipertermia maligna','Muerte súbita','Cardiopatía isquémica precoz','Miocardiopatía',
  'Arritmias hereditarias / QT largo','Diabetes','Hipertensión arterial',
  'Enfermedad tromboembólica','Trombofilia','Coagulopatía / hemofilia',
  'Déficit de pseudocolinesterasa','Enfermedad neuromuscular','Distrofia muscular',
  'Cáncer familiar','Enfermedad renal hereditaria','Reacción anestésica adversa en la familia'
];
