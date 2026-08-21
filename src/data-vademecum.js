/* =========================================================================
   VADEMECUM ANESTESICO AFAAR - Adultos y Pediatria
   Transcripcion del documento de trabajo clinico "Vademecum anestesico para
   parametrizacion de la app", version 1.0.

   REGLA DE ORO, escrita en el propio documento y respetada en el codigo:
   los rangos son ORIENTATIVOS. La app calcula y muestra, el anestesiologo
   confirma. Nada se registra solo.

   Estructura de cada farmaco:
     n      nombre
     g      grupo (clave de VADEMECUM_GRUPOS)
     u      unidad en que se registra la dosis administrada
     vias   vias habituales
     pres   presentacion habitual (para el calculo de mL)
     adulto texto literal del vademecum
     pedia  texto literal del vademecum
     obs    uso / observacion del vademecum
     calc   reglas de calculo por peso; cada una:
              t   titulo de la indicacion
              min/max  rango
              u   unidad del rango (mg/kg, mcg/kg, mcg/kg/min, mg/kg/h, mg, mcg)
              pob 'a' adulto | 'p' pediatria | 'ap' ambos
              tope tope absoluto en la unidad de registro (opcional)
     alerta marca roja permanente (opcional)
   ========================================================================= */

const VADEMECUM_VERSION = '1.0';

const VADEMECUM_GRUPOS = [
  { k:'hipnoticos',  t:'Hipnóticos, inducción y sedación IV', ico:'jeringa' },
  { k:'opioides',    t:'Opioides y analgésicos IV',           ico:'gota' },
  { k:'bnm',         t:'Bloqueantes neuromusculares',         ico:'vena' },
  { k:'reversion',   t:'Reversión neuromuscular',             ico:'check' },
  { k:'inhalatorios',t:'Anestésicos inhalatorios',            ico:'aire' },
  { k:'analgesia',   t:'Analgesia no opioide y coadyuvantes', ico:'hoja' },
  { k:'antiemeticos',t:'Antieméticos',                        ico:'estomago' },
  { k:'vasoactivos', t:'Vasoactivos y cardiovascular',        ico:'corazon' },
  { k:'otros',       t:'Otros fármacos frecuentes en quirófano', ico:'lista' },
  { k:'locales',     t:'Anestésicos locales',                 ico:'jeringa' },
  { k:'neuroaxial',  t:'Neuroaxial',                          ico:'vena' },
  { k:'adyuvantes',  t:'Adyuvantes de bloqueos regionales',   ico:'gota' },
  { k:'emergencias', t:'Emergencias pediátricas',             ico:'alerta' }
];

const VADEMECUM = [

/* ---------------- 1. Hipnoticos, induccion y sedacion IV ---------------- */
{ n:'Propofol', g:'hipnoticos', u:'mg', vias:['IV'], pres:'10 mg/mL (ampolla 20 mL)',
  adulto:'Inducción 2–2,5 mg/kg IV; anciano/ASA III–IV 1–1,5 mg/kg. Mantenimiento 100–200 mcg/kg/min (6–12 mg/kg/h). MAC 25–75 mcg/kg/min.',
  pedia:'Inducción 3–16 años: 2,5–3,5 mg/kg. Mantenimiento ≥2 meses: 125–300 mcg/kg/min (7,5–18 mg/kg/h).',
  obs:'Titular a efecto. Presentación habitual 10 mg/mL.',
  calc:[
    { t:'Inducción', min:2, max:2.5, u:'mg/kg', pob:'a' },
    { t:'Inducción anciano / ASA III–IV', min:1, max:1.5, u:'mg/kg', pob:'a' },
    { t:'Inducción 3–16 años', min:2.5, max:3.5, u:'mg/kg', pob:'p' },
    { t:'Mantenimiento', min:100, max:200, u:'mcg/kg/min', pob:'a' },
    { t:'Mantenimiento ≥2 meses', min:125, max:300, u:'mcg/kg/min', pob:'p' },
    { t:'Sedación consciente (MAC)', min:25, max:75, u:'mcg/kg/min', pob:'a' }
  ] },

{ n:'Etomidato', g:'hipnoticos', u:'mg', vias:['IV'], pres:'2 mg/mL',
  adulto:'0,2–0,3 mg/kg IV', pedia:'0,2–0,3 mg/kg IV',
  obs:'Inducción; titular según contexto hemodinámico.',
  calc:[{ t:'Inducción', min:0.2, max:0.3, u:'mg/kg', pob:'ap' }] },

{ n:'Ketamina', g:'hipnoticos', u:'mg', vias:['IV','IM'], pres:'50 mg/mL',
  adulto:'Inducción 1–2 mg/kg IV; analgesia/subanestésica 0,1–0,5 mg/kg; infusión 0,1–0,5 mg/kg/h.',
  pedia:'Inducción 1–2 mg/kg IV; analgesia 0,1–0,5 mg/kg.',
  obs:'Titular a efecto; los rangos de infusión varían por indicación.',
  calc:[
    { t:'Inducción', min:1, max:2, u:'mg/kg', pob:'ap' },
    { t:'Analgesia / dosis subanestésica', min:0.1, max:0.5, u:'mg/kg', pob:'ap' },
    { t:'Infusión analgésica', min:0.1, max:0.5, u:'mg/kg/h', pob:'a' }
  ] },

{ n:'Midazolam', g:'hipnoticos', u:'mg', vias:['IV','IM','VO','Intranasal'], pres:'5 mg/mL',
  adulto:'Sedación IV 0,02–0,05 mg/kg, en bolos titulados.',
  pedia:'IV 0,05–0,1 mg/kg titulado; premedicación oral frecuentemente 0,25–0,5 mg/kg.',
  obs:'Evitar dosis automáticas; sensibilidad variable y sinergia con opioides.',
  calc:[
    { t:'Sedación IV en bolos titulados', min:0.02, max:0.05, u:'mg/kg', pob:'a' },
    { t:'Sedación IV titulada', min:0.05, max:0.1, u:'mg/kg', pob:'p' },
    { t:'Premedicación oral', min:0.25, max:0.5, u:'mg/kg', pob:'p' }
  ] },

{ n:'Tiopental', g:'hipnoticos', u:'mg', vias:['IV'], pres:'25 mg/mL (reconstituido)',
  adulto:'3–5 mg/kg IV', pedia:'4–6 mg/kg IV',
  obs:'Inducción; ajustar en hipovolemia/fragilidad.',
  calc:[
    { t:'Inducción', min:3, max:5, u:'mg/kg', pob:'a' },
    { t:'Inducción', min:4, max:6, u:'mg/kg', pob:'p' }
  ] },

/* ------------------- 2. Opioides y analgesicos IV ---------------------- */
{ n:'Fentanilo', g:'opioides', u:'mcg', vias:['IV','Intratecal','Peridural'], pres:'50 mcg/mL',
  adulto:'1–3 mcg/kg IV; dosis mayores según estímulo/técnica.',
  pedia:'1–3 mcg/kg IV, titular.',
  obs:'Diferenciar visualmente mcg de mg.',
  calc:[{ t:'Bolo IV', min:1, max:3, u:'mcg/kg', pob:'ap' }] },

{ n:'Remifentanilo', g:'opioides', u:'mcg', vias:['IV'], pres:'50 mcg/mL (diluido)',
  adulto:'Infusión 0,05–0,25 mcg/kg/min; titular.',
  pedia:'0,05–0,25 mcg/kg/min, titular según edad/contexto.',
  obs:'Evitar bolos rápidos no protocolizados.',
  calc:[{ t:'Infusión', min:0.05, max:0.25, u:'mcg/kg/min', pob:'ap' }] },

{ n:'Morfina', g:'opioides', u:'mg', vias:['IV','IM','Intratecal','Peridural'], pres:'10 mg/mL',
  adulto:'0,05–0,1 mg/kg IV, titulada.', pedia:'0,05–0,1 mg/kg IV, titulada.',
  obs:'Considerar depresión respiratoria y función renal.',
  calc:[{ t:'Bolo IV titulado', min:0.05, max:0.1, u:'mg/kg', pob:'ap' }] },

{ n:'Nalbufina', g:'opioides', u:'mg', vias:['IV','IM'], pres:'10 mg/mL',
  adulto:'0,1–0,2 mg/kg IV', pedia:'0,1–0,2 mg/kg IV',
  obs:'Titular; techo analgésico.',
  calc:[{ t:'Bolo IV', min:0.1, max:0.2, u:'mg/kg', pob:'ap' }] },

{ n:'Tramadol', g:'opioides', u:'mg', vias:['IV','IM','VO'], pres:'50 mg/mL',
  adulto:'1–2 mg/kg IV; máx. según protocolo/presentación.',
  pedia:'No parametrizar como rutina pediátrica sin validación institucional por restricciones según edad/país.',
  obs:'Configurar límites por protocolo local.',
  calc:[{ t:'Bolo IV', min:1, max:2, u:'mg/kg', pob:'a' }] },

/* ------------------- 3. Bloqueantes neuromusculares -------------------- */
{ n:'Rocuronio', g:'bnm', u:'mg', vias:['IV'], pres:'10 mg/mL', tof:true,
  adulto:'Intubación 0,6 mg/kg; RSI 1–1,2 mg/kg; mantenimiento 0,1–0,2 mg/kg según TOF.',
  pedia:'Inicial 0,6 mg/kg; mantenimiento aprox. 0,15 mg/kg según TOF; RSI según protocolo.',
  obs:'Vincular a monitorización neuromuscular.',
  calc:[
    { t:'Intubación', min:0.6, max:0.6, u:'mg/kg', pob:'ap' },
    { t:'Secuencia rápida (RSI)', min:1, max:1.2, u:'mg/kg', pob:'a' },
    { t:'Mantenimiento según TOF', min:0.1, max:0.2, u:'mg/kg', pob:'a' },
    { t:'Mantenimiento según TOF', min:0.15, max:0.15, u:'mg/kg', pob:'p' }
  ] },

{ n:'Succinilcolina', g:'bnm', u:'mg', vias:['IV','IM'], pres:'50 mg/mL', tof:true,
  adulto:'1–1,5 mg/kg IV', pedia:'1–2 mg/kg IV',
  obs:'Uso pediátrico restringido a indicaciones específicas; validar protocolo.',
  alerta:'Gatillante de hipertermia maligna. Contraindicada ante antecedente personal o familiar.',
  calc:[
    { t:'Intubación', min:1, max:1.5, u:'mg/kg', pob:'a' },
    { t:'Intubación', min:1, max:2, u:'mg/kg', pob:'p' }
  ] },

{ n:'Atracurio', g:'bnm', u:'mg', vias:['IV'], pres:'10 mg/mL', tof:true,
  adulto:'0,4–0,5 mg/kg IV; mantenimiento 0,08–0,1 mg/kg.', pedia:'0,4–0,5 mg/kg IV',
  obs:'Titular por TOF.',
  calc:[
    { t:'Intubación', min:0.4, max:0.5, u:'mg/kg', pob:'ap' },
    { t:'Mantenimiento', min:0.08, max:0.1, u:'mg/kg', pob:'a' }
  ] },

{ n:'Cisatracurio', g:'bnm', u:'mg', vias:['IV'], pres:'2 mg/mL', tof:true,
  adulto:'0,15–0,2 mg/kg IV; mantenimiento 0,03 mg/kg.', pedia:'0,1–0,15 mg/kg IV',
  obs:'Titular por TOF.',
  calc:[
    { t:'Intubación', min:0.15, max:0.2, u:'mg/kg', pob:'a' },
    { t:'Intubación', min:0.1, max:0.15, u:'mg/kg', pob:'p' },
    { t:'Mantenimiento', min:0.03, max:0.03, u:'mg/kg', pob:'a' }
  ] },

{ n:'Vecuronio', g:'bnm', u:'mg', vias:['IV'], pres:'2 mg/mL (reconstituido)', tof:true,
  adulto:'0,08–0,1 mg/kg IV; mantenimiento 0,01–0,015 mg/kg.', pedia:'0,08–0,1 mg/kg IV',
  obs:'Titular por TOF.',
  calc:[
    { t:'Intubación', min:0.08, max:0.1, u:'mg/kg', pob:'ap' },
    { t:'Mantenimiento', min:0.01, max:0.015, u:'mg/kg', pob:'a' }
  ] },

/* --------------------- 4. Reversion neuromuscular ---------------------- */
{ n:'Sugammadex', g:'reversion', u:'mg', vias:['IV'], pres:'100 mg/mL', tof:true,
  adulto:'2 mg/kg (reaparición T2); 4 mg/kg (1–2 PTC); 16 mg/kg reversión inmediata tras rocuronio 1,2 mg/kg.',
  pedia:'≥2 años: 2 o 4 mg/kg según profundidad. Reversión inmediata 16 mg/kg no estudiada en pediatría.',
  obs:'Dosis por peso real; mostrar TOF/PTC antes del cálculo.',
  calc:[
    { t:'Bloqueo moderado (reaparición de T2)', min:2, max:2, u:'mg/kg', pob:'ap' },
    { t:'Bloqueo profundo (1–2 PTC)', min:4, max:4, u:'mg/kg', pob:'ap' },
    { t:'Reversión inmediata tras rocuronio 1,2 mg/kg', min:16, max:16, u:'mg/kg', pob:'a' }
  ] },

{ n:'Neostigmina', g:'reversion', u:'mg', vias:['IV'], pres:'0,5 mg/mL', tof:true,
  adulto:'0,03–0,07 mg/kg IV; máx. habitual 5 mg.', pedia:'0,03–0,07 mg/kg IV',
  obs:'Asociar antimuscarínico y TOF.',
  calc:[{ t:'Reversión', min:0.03, max:0.07, u:'mg/kg', pob:'ap', tope:5 }] },

{ n:'Glicopirrolato', g:'reversion', u:'mg', vias:['IV'], pres:'0,2 mg/mL',
  adulto:'Aprox. 0,01 mg/kg IV con neostigmina.', pedia:'Aprox. 0,01 mg/kg IV',
  obs:'Ajustar al esquema de reversión.',
  calc:[{ t:'Con neostigmina', min:0.01, max:0.01, u:'mg/kg', pob:'ap' }] },

{ n:'Atropina (reversión)', g:'reversion', u:'mg', vias:['IV'], pres:'1 mg/mL',
  adulto:'0,01–0,02 mg/kg IV cuando se usa como antimuscarínico.',
  pedia:'0,02 mg/kg IV según indicación/protocolo.',
  obs:'No confundir con dosis de reanimación.',
  alerta:'Es la dosis como antimuscarínico. La dosis de bradicardia y de RCP está en Vasoactivos y en Emergencias pediátricas.',
  calc:[
    { t:'Antimuscarínico', min:0.01, max:0.02, u:'mg/kg', pob:'a' },
    { t:'Antimuscarínico', min:0.02, max:0.02, u:'mg/kg', pob:'p' }
  ] },

/* --------------------- 5. Anestesicos inhalatorios --------------------- */
{ n:'Sevoflurano', g:'inhalatorios', u:'%', vias:['Inhalatoria'], pres:'Vaporizador calibrado',
  adulto:'Inducción hasta ~8 %; mantenimiento habitualmente 0,5–3 %, titulado a MAC/efecto.',
  pedia:'Frecuente para inducción inhalatoria; hasta ~8 %, titulado. Mantenimiento según MAC/edad.',
  obs:'Registrar agente + concentración (%) + opcional MAC ajustada por edad.',
  alerta:'Gatillante de hipertermia maligna.',
  calc:[] },

{ n:'Desflurano', g:'inhalatorios', u:'%', vias:['Inhalatoria'], pres:'Vaporizador calibrado',
  adulto:'Mantenimiento aprox. 3–8 %, titulado.',
  pedia:'Uso pediátrico depende de edad, vía aérea y protocolo.',
  obs:'Registrar %; no usar dosis mg/kg.',
  alerta:'Gatillante de hipertermia maligna.',
  calc:[] },

{ n:'Isoflurano', g:'inhalatorios', u:'%', vias:['Inhalatoria'], pres:'Vaporizador calibrado',
  adulto:'Mantenimiento aprox. 0,5–2 %, titulado.',
  pedia:'Titular según MAC/edad y protocolo.',
  obs:'Registrar %.',
  alerta:'Gatillante de hipertermia maligna.',
  calc:[] },

{ n:'Óxido nitroso (N₂O)', g:'inhalatorios', u:'%', vias:['Inhalatoria'], pres:'Mezclador de gases',
  adulto:'Registrar concentración inspirada (%) cuando se utilice.',
  pedia:'Igual; uso según indicación/protocolo.',
  obs:'Registrar N₂O % y O₂ %.',
  calc:[] },

/* -------------- 6. Analgesia no opioide y coadyuvantes ----------------- */
{ n:'Paracetamol', g:'analgesia', u:'mg', vias:['IV','VO'], pres:'10 mg/mL (frasco 100 mL)',
  adulto:'1 g IV/VO; ajustar por peso/riesgo hepático.', pedia:'10–15 mg/kg por dosis.',
  obs:'Configurar máximo diario según peso/edad y protocolo.',
  calc:[
    { t:'Dosis habitual', min:1000, max:1000, u:'mg', pob:'a' },
    { t:'Por dosis', min:10, max:15, u:'mg/kg', pob:'p' }
  ] },

{ n:'Dipirona / Metamizol', g:'analgesia', u:'mg', vias:['IV','IM'], pres:'500 mg/mL',
  adulto:'1–2 g IV, según protocolo.', pedia:'10–20 mg/kg por dosis, según protocolo local.',
  obs:'Configurar límites máximos.',
  calc:[
    { t:'Dosis habitual', min:1000, max:2000, u:'mg', pob:'a' },
    { t:'Por dosis', min:10, max:20, u:'mg/kg', pob:'p' }
  ] },

{ n:'Ketorolac', g:'analgesia', u:'mg', vias:['IV','IM'], pres:'30 mg/mL',
  adulto:'15–30 mg IV.', pedia:'0,5 mg/kg (máx. por protocolo/edad).',
  obs:'Evitar/ajustar según renal, sangrado, edad.',
  calc:[
    { t:'Dosis habitual', min:15, max:30, u:'mg', pob:'a' },
    { t:'Por dosis', min:0.5, max:0.5, u:'mg/kg', pob:'p', tope:30 }
  ] },

{ n:'Ibuprofeno', g:'analgesia', u:'mg', vias:['VO','IV'], pres:'Comprimidos / suspensión',
  adulto:'400–600 mg VO cuando corresponda.', pedia:'10 mg/kg VO.',
  obs:'No es fármaco IV de rutina en todos los mercados.',
  calc:[
    { t:'Dosis habitual', min:400, max:600, u:'mg', pob:'a' },
    { t:'Por dosis', min:10, max:10, u:'mg/kg', pob:'p' }
  ] },

{ n:'Diclofenac', g:'analgesia', u:'mg', vias:['IM','IV','VO'], pres:'75 mg/3 mL',
  adulto:'50–75 mg según vía/presentación.', pedia:'Aprox. 1 mg/kg cuando esté indicado.',
  obs:'Validar formulación y edad.',
  calc:[
    { t:'Dosis habitual', min:50, max:75, u:'mg', pob:'a' },
    { t:'Por dosis', min:1, max:1, u:'mg/kg', pob:'p' }
  ] },

/* --------------------------- 7. Antiemeticos --------------------------- */
{ n:'Ondansetrón', g:'antiemeticos', u:'mg', vias:['IV'], pres:'2 mg/mL (ampolla 4 mg)',
  adulto:'4 mg IV', pedia:'0,1 mg/kg IV; máx. habitual 4 mg',
  obs:'Considerar QT.',
  calc:[
    { t:'Dosis habitual', min:4, max:4, u:'mg', pob:'a' },
    { t:'Por dosis', min:0.1, max:0.1, u:'mg/kg', pob:'p', tope:4 }
  ] },

{ n:'Dexametasona', g:'antiemeticos', u:'mg', vias:['IV'], pres:'4 mg/mL',
  adulto:'4–8 mg IV', pedia:'0,1–0,15 mg/kg IV',
  obs:'PONV; dosis según protocolo.',
  calc:[
    { t:'Profilaxis de NVPO', min:4, max:8, u:'mg', pob:'a' },
    { t:'Profilaxis de NVPO', min:0.1, max:0.15, u:'mg/kg', pob:'p' }
  ] },

{ n:'Droperidol', g:'antiemeticos', u:'mg', vias:['IV'], pres:'2,5 mg/mL',
  adulto:'0,625–1,25 mg IV', pedia:'10–15 mcg/kg según protocolo',
  obs:'Considerar QT y restricciones locales.',
  calc:[
    { t:'Profilaxis de NVPO', min:0.625, max:1.25, u:'mg', pob:'a' },
    { t:'Profilaxis de NVPO', min:10, max:15, u:'mcg/kg', pob:'p' }
  ] },

{ n:'Metoclopramida', g:'antiemeticos', u:'mg', vias:['IV'], pres:'5 mg/mL',
  adulto:'10 mg IV', pedia:'0,1–0,15 mg/kg cuando esté indicada',
  obs:'Precaución efectos extrapiramidales.',
  calc:[
    { t:'Dosis habitual', min:10, max:10, u:'mg', pob:'a' },
    { t:'Por dosis', min:0.1, max:0.15, u:'mg/kg', pob:'p' }
  ] },

/* -------------------- 8. Vasoactivos y cardiovascular ------------------ */
{ n:'Efedrina', g:'vasoactivos', u:'mg', vias:['IV'], pres:'50 mg/mL (diluir a 5 mg/mL)',
  adulto:'5–10 mg IV en bolos titulados.', pedia:'0,1–0,2 mg/kg IV, según protocolo.',
  obs:'Hipotensión; respuesta variable.',
  calc:[
    { t:'Bolo IV titulado', min:5, max:10, u:'mg', pob:'a' },
    { t:'Bolo IV', min:0.1, max:0.2, u:'mg/kg', pob:'p' }
  ] },

{ n:'Fenilefrina', g:'vasoactivos', u:'mcg', vias:['IV'], pres:'10 mg/mL (diluir a 100 mcg/mL)',
  adulto:'50–100 mcg IV en bolos; infusión titulada.',
  pedia:'0,5–2 mcg/kg IV en bolos según protocolo.',
  obs:'Configurar mcg, no mg.',
  calc:[
    { t:'Bolo IV', min:50, max:100, u:'mcg', pob:'a' },
    { t:'Bolo IV', min:0.5, max:2, u:'mcg/kg', pob:'p' }
  ] },

{ n:'Noradrenalina', g:'vasoactivos', u:'mcg', vias:['IV central'], pres:'1 mg/mL (diluir)', infusion:true,
  adulto:'Infusión 0,02–0,2 mcg/kg/min, titular; rangos mayores según shock/contexto.',
  pedia:'0,02–0,2 mcg/kg/min, titular según protocolo.',
  obs:'Permitir registrar concentración y mL/h.',
  calc:[{ t:'Infusión', min:0.02, max:0.2, u:'mcg/kg/min', pob:'ap' }] },

{ n:'Adrenalina (perioperatoria)', g:'vasoactivos', u:'mcg', vias:['IV'], pres:'1 mg/mL',
  adulto:'Bolos pequeños perioperatorios según indicación; reanimación 1 mg IV cada 3–5 min.',
  pedia:'Reanimación: 0,01 mg/kg IV/IO (0,1 mL/kg de 0,1 mg/mL), máx. 1 mg.',
  obs:'Separar claramente «perioperatorio» de «RCP».',
  alerta:'Esta entrada es la de uso perioperatorio. La dosis de RCP está en el módulo de Emergencias pediátricas.',
  calc:[] },

{ n:'Atropina (bradicardia)', g:'vasoactivos', u:'mg', vias:['IV','IO'], pres:'1 mg/mL',
  adulto:'Bradicardia adulta: 1 mg IV, repetir cada 3–5 min, máx. 3 mg.',
  pedia:'Bradicardia: 0,02 mg/kg IV/IO; mínimos/máximos según PALS/protocolo.',
  obs:'Separar de reversión neuromuscular.',
  calc:[
    { t:'Bradicardia (repetir c/3–5 min, máx. 3 mg)', min:1, max:1, u:'mg', pob:'a' },
    { t:'Bradicardia', min:0.02, max:0.02, u:'mg/kg', pob:'p' }
  ] },

{ n:'Esmolol', g:'vasoactivos', u:'mg', vias:['IV'], pres:'10 mg/mL',
  adulto:'0,5 mg/kg IV de carga; bolos/infusión titulados.',
  pedia:'0,5 mg/kg IV según indicación/protocolo.',
  obs:'Monitorización estricta.',
  calc:[{ t:'Carga', min:0.5, max:0.5, u:'mg/kg', pob:'ap' }] },

{ n:'Labetalol', g:'vasoactivos', u:'mg', vias:['IV'], pres:'5 mg/mL',
  adulto:'5–20 mg IV en bolos titulados.',
  pedia:'0,2–1 mg/kg IV según protocolo especializado.',
  obs:'No automatizar sin validación pediátrica.',
  calc:[
    { t:'Bolo IV titulado', min:5, max:20, u:'mg', pob:'a' },
    { t:'Bolo IV (protocolo especializado)', min:0.2, max:1, u:'mg/kg', pob:'p' }
  ] },

{ n:'Nitroglicerina', g:'vasoactivos', u:'mcg', vias:['IV'], pres:'5 mg/mL (diluir)', infusion:true,
  adulto:'Infusión inicial 5–10 mcg/min, titular.',
  pedia:'0,5–5 mcg/kg/min según indicación/protocolo.',
  obs:'Registrar mcg/min o mcg/kg/min.',
  calc:[
    { t:'Infusión inicial', min:5, max:10, u:'mcg/min', pob:'a' },
    { t:'Infusión', min:0.5, max:5, u:'mcg/kg/min', pob:'p' }
  ] },

/* --------------- 9. Otros farmacos frecuentes en quirofano ------------- */
{ n:'Lidocaína IV (sistémica)', g:'otros', u:'mg', vias:['IV'], pres:'20 mg/mL (2 %)',
  adulto:'1–1,5 mg/kg bolo; analgesia perioperatoria: infusión aprox. 1–2 mg/kg/h según protocolo.',
  pedia:'Uso sistémico pediátrico solo bajo protocolo específico.',
  obs:'Separar claramente de lidocaína para anestesia local.',
  alerta:'Es lidocaína por vía sistémica. La lidocaína para anestesia local está en Anestésicos locales y suma a la dosis acumulada.',
  calc:[
    { t:'Bolo IV', min:1, max:1.5, u:'mg/kg', pob:'a' },
    { t:'Infusión analgésica', min:1, max:2, u:'mg/kg/h', pob:'a' }
  ] },

{ n:'Sulfato de magnesio', g:'otros', u:'mg', vias:['IV'], pres:'250 mg/mL (25 %)',
  adulto:'30–50 mg/kg IV carga en indicaciones seleccionadas; infusión según objetivo.',
  pedia:'25–50 mg/kg IV según indicación/protocolo.',
  obs:'Configurar por indicación.',
  calc:[
    { t:'Carga', min:30, max:50, u:'mg/kg', pob:'a' },
    { t:'Carga', min:25, max:50, u:'mg/kg', pob:'p' }
  ] },

{ n:'Ácido tranexámico', g:'otros', u:'mg', vias:['IV'], pres:'100 mg/mL',
  adulto:'10–15 mg/kg IV; esquemas variables por cirugía.',
  pedia:'10–15 mg/kg IV; esquemas variables.',
  obs:'No usar esquema único para todas las cirugías.',
  calc:[{ t:'Dosis de carga', min:10, max:15, u:'mg/kg', pob:'ap' }] },

{ n:'Calcio gluconato 10 %', g:'otros', u:'mg', vias:['IV'], pres:'100 mg/mL (10 %)',
  adulto:'1–2 g IV según indicación.',
  pedia:'60–100 mg/kg de gluconato de calcio según protocolo.',
  obs:'Diferenciar de cloruro de calcio.',
  alerta:'No confundir con cloruro de calcio 10 %: son concentraciones de calcio elemental distintas.',
  calc:[
    { t:'Dosis habitual', min:1000, max:2000, u:'mg', pob:'a' },
    { t:'Por dosis', min:60, max:100, u:'mg/kg', pob:'p' }
  ] },

{ n:'Cloruro de calcio 10 %', g:'otros', u:'mg', vias:['IV central'], pres:'100 mg/mL (10 %)',
  adulto:'500–1000 mg IV según indicación.', pedia:'20 mg/kg según protocolo.',
  obs:'Preferir vía central; diferenciar concentración.',
  alerta:'No confundir con gluconato de calcio 10 %. Preferir vía central.',
  calc:[
    { t:'Dosis habitual', min:500, max:1000, u:'mg', pob:'a' },
    { t:'Por dosis', min:20, max:20, u:'mg/kg', pob:'p' }
  ] },

{ n:'Bicarbonato de sodio', g:'otros', u:'mEq', vias:['IV'], pres:'1 mEq/mL (8,4 %)',
  adulto:'Según gasometría/indicación; en RCP no es rutinario.',
  pedia:'1 mEq/kg en indicaciones específicas.',
  obs:'Evitar botón de dosis automática universal.',
  alerta:'Sin dosis automática: se indica por gasometría. En RCP no es de rutina.',
  calc:[{ t:'Indicación específica', min:1, max:1, u:'mEq/kg', pob:'p' }] },

{ n:'Glucosa', g:'otros', u:'g', vias:['IV'], pres:'Definir concentración antes de calcular',
  adulto:'Según hipoglucemia y concentración disponible.',
  pedia:'Dosis por g/kg y concentración según edad/protocolo.',
  obs:'La app debe pedir concentración antes de convertir a mL.',
  alerta:'Cargá primero la concentración disponible: sin ella no se puede convertir a mL.',
  calc:[] },

/* ------------------------ 10. Anestesicos locales ---------------------- */
{ n:'Lidocaína', g:'locales', u:'mg', vias:['Infiltración','Bloqueo','Peridural','Tópica'],
  pres:'0,5 % · 1 % · 2 %', local:true,
  concentraciones:[0.5, 1, 2], maxMgKg:4.5, maxMgKgAdr:7, maxAbs:300, maxAbsAdr:500,
  adulto:'Concentraciones habituales 0,5 %, 1 %, 2 %.',
  pedia:'Calcular siempre mg/kg acumulados.',
  obs:'Sin adrenalina: ~4,5 mg/kg (máx. 300 mg). Con adrenalina: ~7 mg/kg (máx. 500 mg). Los límites dependen del sitio, la técnica y el paciente; validar protocolo.',
  calc:[] },

{ n:'Bupivacaína', g:'locales', u:'mg', vias:['Infiltración','Bloqueo','Peridural','Raquídea'],
  pres:'0,125 % · 0,25 % · 0,5 %', local:true,
  concentraciones:[0.125, 0.25, 0.5], maxMgKg:2, maxMgKgAdr:2.5, maxAbs:150, maxAbsAdr:175,
  adulto:'Referencia habitual ~2–2,5 mg/kg sin adrenalina; los límites por dosis y por 24 h dependen de la ficha técnica.',
  pedia:'Calcular mg/kg acumulados con protocolo pediátrico.',
  obs:'Mayor cardiotoxicidad relativa; calcular mg totales.',
  alerta:'Cardiotoxicidad relativa mayor que la de lidocaína: la dosis test y la aspiración no son opcionales.',
  calc:[] },

{ n:'Ropivacaína', g:'locales', u:'mg', vias:['Infiltración','Bloqueo','Peridural'],
  pres:'0,2 % · 0,375 % · 0,5 % · 0,75 %', local:true,
  concentraciones:[0.2, 0.375, 0.5, 0.75], maxMgKg:0, maxMgKgAdr:0, maxAbs:0, maxAbsAdr:0,
  adulto:'No mostrar un único máximo universal; parametrizar por técnica y protocolo institucional.',
  pedia:'Parametrizar por técnica y protocolo pediátrico.',
  obs:'Registrar concentración, volumen y mg totales.',
  alerta:'Sin máximo universal cargado a propósito: el límite lo fija la técnica y el protocolo institucional.',
  calc:[] },

{ n:'Mepivacaína', g:'locales', u:'mg', vias:['Infiltración','Bloqueo','Peridural'],
  pres:'1 % · 1,5 % · 2 %', local:true,
  concentraciones:[1, 1.5, 2], maxMgKg:4.5, maxMgKgAdr:7, maxAbs:400, maxAbsAdr:500,
  adulto:'Referencia habitual ~4,5–5 mg/kg sin vasoconstrictor; mayor con adrenalina según ficha técnica/protocolo.',
  pedia:'Calcular mg/kg acumulados con protocolo pediátrico.',
  obs:'Validar límites institucionales.',
  calc:[] },

/* ------------------------------ 11. Neuroaxial ------------------------- */
{ n:'Bupivacaína hiperbárica 0,5 % — raquídea', g:'neuroaxial', u:'mg', vias:['Raquídea'],
  pres:'5 mg/mL (0,5 % hiperbárica)',
  adulto:'Frecuentemente 7,5–15 mg según cirugía, talla, edad y objetivo de bloqueo.',
  pedia:'Dosis estrictamente por peso/edad y técnica; validar protocolo pediátrico específico.',
  obs:'Registrar mg, concentración, nivel de punción y adyuvantes.',
  calc:[{ t:'Raquídea', min:7.5, max:15, u:'mg', pob:'a' }] },

{ n:'Bupivacaína / ropivacaína — peridural', g:'neuroaxial', u:'mg', vias:['Peridural'],
  pres:'Según concentración elegida',
  adulto:'Concentración y volumen según nivel, objetivo y procedimiento.',
  pedia:'Calcular mg/kg acumulados; usar protocolo pediátrico.',
  obs:'Registrar concentración + mL + mg totales.',
  calc:[] },

{ n:'Fentanilo intratecal', g:'neuroaxial', u:'mcg', vias:['Intratecal'], pres:'50 mcg/mL',
  adulto:'10–25 mcg según técnica/indicación.',
  pedia:'Uso/dosis según protocolo pediátrico especializado.',
  obs:'Registrar mcg y vía intratecal claramente.',
  calc:[{ t:'Intratecal', min:10, max:25, u:'mcg', pob:'a' }] },

{ n:'Morfina intratecal', g:'neuroaxial', u:'mg', vias:['Intratecal'], pres:'Sin conservantes',
  adulto:'0,1–0,2 mg frecuente en adultos según cirugía.',
  pedia:'Dosis por peso y protocolo especializado.',
  obs:'Requiere vigilancia respiratoria protocolizada.',
  alerta:'Exige vigilancia respiratoria protocolizada en las 24 h siguientes.',
  calc:[{ t:'Intratecal', min:0.1, max:0.2, u:'mg', pob:'a' }] },

/* ------------------ 12. Adyuvantes de bloqueos regionales -------------- */
{ n:'Dexametasona (adyuvante)', g:'adyuvantes', u:'mg', vias:['IV','Perineural'], pres:'4 mg/mL',
  adulto:'IV o perineural según práctica/protocolo.',
  pedia:'IV o perineural según protocolo.',
  obs:'No precargar dosis perineural universal; marcar uso perineural como off-label cuando corresponda.',
  alerta:'Uso perineural off-label. Sin dosis precargada a propósito.',
  calc:[] },

{ n:'Dexmedetomidina', g:'adyuvantes', u:'mcg', vias:['IV','Perineural'], pres:'4 mcg/mL (diluida)',
  adulto:'IV/perineural según técnica.', pedia:'Según protocolo.',
  obs:'No precargar dosis universal; validar institucionalmente.',
  alerta:'Sin dosis precargada: validar institucionalmente.',
  calc:[] },

{ n:'Clonidina', g:'adyuvantes', u:'mcg', vias:['Perineural','Neuroaxial'], pres:'150 mcg/mL',
  adulto:'Adyuvante neuroaxial/perineural en contextos seleccionados.',
  pedia:'Según protocolo.',
  obs:'Parametrizar sólo si AFAAR adopta protocolo.',
  alerta:'Sin dosis precargada: pendiente de que AFAAR adopte un protocolo.',
  calc:[] },

{ n:'Adrenalina (vasoconstrictor)', g:'adyuvantes', u:'mcg', vias:['Perineural','Infiltración'],
  pres:'1:200.000 (5 mcg/mL)',
  adulto:'Vasoconstrictor / marcador intravascular según técnica.',
  pedia:'Según técnica y protocolo.',
  obs:'Registrar concentración final y dosis total.',
  calc:[] },

/* ------------------- 13. Emergencias pediatricas ----------------------- */
{ n:'Adrenalina RCP', g:'emergencias', u:'mg', vias:['IV','IO'], pres:'0,1 mg/mL (1:10.000)',
  adulto:'Reanimación: 1 mg IV cada 3–5 min.',
  pedia:'0,01 mg/kg IV/IO de solución 0,1 mg/mL; repetir cada 3–5 min; máx. 1 mg por dosis.',
  obs:'Mostrar concentración obligatoriamente.',
  alerta:'Concentración obligatoria: 0,1 mg/mL (1:10.000). Equivale a 0,1 mL/kg.',
  calc:[
    { t:'RCP', min:1, max:1, u:'mg', pob:'a' },
    { t:'RCP (repetir c/3–5 min)', min:0.01, max:0.01, u:'mg/kg', pob:'p', tope:1 }
  ] },

{ n:'Atropina (PALS)', g:'emergencias', u:'mg', vias:['IV','IO'], pres:'1 mg/mL',
  adulto:'1 mg IV, repetir cada 3–5 min, máx. 3 mg.',
  pedia:'0,02 mg/kg IV/IO según indicación.',
  obs:'Aplicar mínimos/máximos del protocolo vigente.',
  calc:[
    { t:'Bradicardia', min:1, max:1, u:'mg', pob:'a', tope:3 },
    { t:'Bradicardia (PALS)', min:0.02, max:0.02, u:'mg/kg', pob:'p' }
  ] },

{ n:'Adenosina', g:'emergencias', u:'mg', vias:['IV','IO'], pres:'3 mg/mL',
  adulto:'1.ª dosis 6 mg; 2.ª dosis 12 mg, en bolo rápido con flush.',
  pedia:'1.ª: 0,1 mg/kg (máx. 6 mg); 2.ª: 0,2 mg/kg (máx. 12 mg).',
  obs:'Bolo rápido + flush.',
  alerta:'Bolo rápido seguido de flush inmediato de solución fisiológica.',
  calc:[
    { t:'1.ª dosis', min:0.1, max:0.1, u:'mg/kg', pob:'p', tope:6 },
    { t:'2.ª dosis', min:0.2, max:0.2, u:'mg/kg', pob:'p', tope:12 }
  ] },

{ n:'Amiodarona', g:'emergencias', u:'mg', vias:['IV','IO'], pres:'50 mg/mL',
  adulto:'300 mg IV/IO en paro con FV/TV sin pulso, según ACLS.',
  pedia:'5 mg/kg IV/IO en arritmias seleccionadas.',
  obs:'Seguir algoritmo PALS.',
  calc:[{ t:'Arritmias seleccionadas (PALS)', min:5, max:5, u:'mg/kg', pob:'p' }] },

{ n:'Magnesio (PALS)', g:'emergencias', u:'mg', vias:['IV','IO'], pres:'250 mg/mL (25 %)',
  adulto:'1–2 g IV según indicación.',
  pedia:'25–50 mg/kg IV/IO, máx. 2 g, según indicación.',
  obs:'Torsades de pointes, hipomagnesemia y otras indicaciones.',
  calc:[{ t:'Torsades / hipomagnesemia', min:25, max:50, u:'mg/kg', pob:'p', tope:2000 }] }
];

/* ---------------------------------------------------------------------- */
/* Reglas de seguridad del capitulo 14 del vademecum. Se muestran en la    */
/* propia pantalla de drogas para que no queden solo en el documento.      */
const VADEMECUM_REGLAS = [
  'El peso es obligatorio antes de calcular cualquier dosis pediátrica.',
  'Se muestra siempre la unidad original (mg, mcg, mg/kg, mcg/kg/min) y no se hacen conversiones ambiguas.',
  'mg y mcg se diferencian visualmente en toda la pantalla.',
  'La dosis calculada nunca se registra sola: el anestesiólogo la confirma.',
  'En infusiones se guarda fármaco, cantidad total, volumen final, concentración, dosis objetivo y mL/h.',
  'En anestésicos locales se convierte % → mg/mL, se calculan los mg totales y se acumulan los mg/kg.',
  'Si se combinan anestésicos locales, la app avisa que la toxicidad es aditiva.',
  'El TOF se pide en el flujo de bloqueantes neuromusculares y de reversión.',
  'Los fármacos de emergencia están separados de los de rutina para reducir errores de selección.',
  'Los favoritos son personales; la base maestra y los límites clínicos los administra AFAAR.'
];

const VADEMECUM_FUENTES = [
  'DailyMed y fichas técnicas vigentes de cada fármaco.',
  'Protocolos institucionales de AFAAR y de los hospitales y clínicas de Tierra del Fuego.',
  'Guías vigentes de reanimación pediátrica (PALS/ERC) para el módulo de emergencias.',
  'La versión de producción debe pasar por revisión farmacológica y clínica antes de habilitar cálculos automáticos.'
];

/* Favoritos que trae la app de fábrica; cada socio arma los suyos */
const FAVORITOS_BASE = ['Propofol','Fentanilo','Rocuronio','Dexametasona','Ondansetrón','Ketorolac'];
