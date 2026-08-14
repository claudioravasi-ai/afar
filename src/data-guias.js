/* =========================================================================
   GUIAS Y PROTOCOLOS DE REFERENCIA RAPIDA
   Sintesis operativa basada en: ASA Practice Guidelines & Standards,
   DAS 2015 (via aerea dificil), ASRA Practice Advisory (LAST 2018 y
   Anticoagulacion 4a ed.), MHAUS (hipertermia maligna), ESAIC/AAGBI
   (anafilaxia perioperatoria), OMS (lista de verificacion quirurgica),
   ACC/AHA 2024 (evaluacion cardiovascular perioperatoria), ERAS Society.
   ADVERTENCIA: material de consulta rapida. No reemplaza el juicio clinico
   ni la lectura de la guia original.
   ========================================================================= */
const GUIAS = [
{ id:'g-vad', icono:'aire', titulo:'Vía aérea difícil — algoritmo operativo (DAS/ASA)', tag:'Crítico', color:'danger',
  cuerpo:[
  { h:'Antes de inducir', l:[
    'Plan A, B, C y D declarados en voz alta con el equipo.',
    'Preoxigenar con O₂ al 100 % hasta FeO₂ ≥ 0,9. Considerar oxigenación apneica nasal de alto flujo.',
    'Optimizar posición: alineación del meato auditivo con la horquilla esternal (rampa en obesos).',
    'Carro de vía aérea difícil, videolaringoscopio y capnografía verificados y a la vista.',
    'Predictores: Mallampati III-IV, distancia tiromentoniana < 6 cm, apertura bucal < 3 cm, protrusión mandibular limitada, cuello > 43 cm, barba, SAHOS, radioterapia cervical, antecedente documentado.'] },
  { h:'Plan A — laringoscopía e intubación', l:[
    'Máximo 3 intentos (+1 por operador más experimentado). Cambiar algo en cada intento: dispositivo, hoja, posición, BURP, bougie.',
    'Mantener oxigenación entre intentos con máscara facial.',
    'Confirmar SIEMPRE con capnografía sostenida en 7 curvas.'] },
  { h:'Plan B — dispositivo supraglótico', l:[
    'Máximo 3 intentos. Preferir 2ª generación (permite sonda gástrica).',
    'Si ventila: detenerse y decidir — despertar, proceder con DSG, intubar a través del DSG con fibroscopio, o traqueostomía.'] },
  { h:'Plan C — ventilación con máscara facial', l:[
    'Dos operadores, cánula orofaríngea y nasofaríngea, relajación completa.',
    'Si es efectiva: DESPERTAR al paciente salvo urgencia vital.'] },
  { h:'Plan D — "no intubo, no oxigeno" (CICO)', l:[
    'Declararlo en voz alta. Pedir ayuda. Relajación neuromuscular completa.',
    'Acceso cervical frontal de emergencia: cricotiroidotomía quirúrgica con bisturí (hoja 10), bougie y tubo 6.0 con balón (técnica scalpel-bougie-tube).',
    'Ventilar, confirmar con capnografía y planificar vía aérea definitiva.'] },
  { h:'Después', l:[
    'Registrar el evento en la ficha, entregar informe escrito al paciente y consignar la alerta en su historia.'] }
]},

{ id:'g-last', icono:'gota', titulo:'LAST — toxicidad sistémica por anestésicos locales (ASRA)', tag:'Crítico', color:'danger',
  cuerpo:[
  { h:'Reconocimiento', l:[
    'Pródromos: acúfenos, sabor metálico, parestesia peribucal, agitación, confusión, disartria.',
    'Progresión: convulsiones, depresión del sensorio, bradicardia, bloqueos, taquiarritmias ventriculares, asistolia.',
    'Puede aparecer hasta 30-60 min después de la inyección; sospechar siempre ante deterioro inexplicado tras un bloqueo.'] },
  { h:'Manejo inmediato', l:[
    'DETENER la inyección. Pedir ayuda y el kit de emulsión lipídica.',
    'Vía aérea: O₂ al 100 %, ventilación asistida. Evitar la hipoxemia y la acidosis (agravan la toxicidad).',
    'Convulsiones: benzodiazepinas (midazolam 2-5 mg EV). Evitar propofol en dosis altas si hay inestabilidad cardiovascular.',
    'Evitar vasopresina, bloqueantes cálcicos, betabloqueantes y otros anestésicos locales.'] },
  { h:'Emulsión lipídica al 20 %', l:[
    'Bolo 1,5 ml/kg de peso magro en 2-3 min (≈100 ml en el adulto de 70 kg).',
    'Infusión 0,25 ml/kg/min (≈ 18 ml/min o 1000 ml/h).',
    'Repetir el bolo 1-2 veces y duplicar la infusión si persiste la inestabilidad.',
    'Máximo recomendado 12 ml/kg. Continuar 10 min después de la estabilidad hemodinámica.'] },
  { h:'Paro cardíaco', l:[
    'RCP prolongada (puede requerir más de 1 hora). Adrenalina en dosis reducidas: ≤ 1 µg/kg por bolo.',
    'Amiodarona para arritmias ventriculares; NO lidocaína ni procainamida.',
    'Considerar circulación extracorpórea si está disponible.'] },
  { h:'Prevención', l:[
    'Dosis máximas: lidocaína 4,5 mg/kg (7 con adrenalina), bupivacaína 2 mg/kg (2,5 con adrenalina), ropivacaína 3 mg/kg.',
    'Aspirar cada 5 ml, inyección lenta y fraccionada, dosis test con adrenalina, guía ecográfica.'] }
]},

{ id:'g-hm', icono:'fuego', titulo:'Hipertermia maligna — protocolo (MHAUS)', tag:'Crítico', color:'danger',
  cuerpo:[
  { h:'Signos precoces', l:[
    'Aumento inexplicado del EtCO₂ pese a aumentar la ventilación minuto (el signo más precoz y sensible).',
    'Taquicardia inexplicada, rigidez muscular generalizada, espasmo maseterino tras succinilcolina.',
    'Tardíos: hipertermia (puede subir 1-2 °C cada 5 min), acidosis mixta, hiperkalemia, mioglobinuria, arritmias.'] },
  { h:'Acciones inmediatas', l:[
    'SUSPENDER halogenados y succinilcolina. Pedir ayuda y el carro de HM.',
    'Hiperventilar con O₂ al 100 % a 10 l/min (2-3 veces la ventilación minuto). No demorar el tratamiento cambiando la máquina; colocar filtro de carbón activado si se dispone.',
    'DANTROLENE 2,5 mg/kg EV en bolo rápido, repetir cada 5 min hasta el control (habitualmente hasta 10 mg/kg; sin dosis máxima si persisten los signos).',
    'Ryanodex® 250 mg en un solo vial (1 mg/kg) si está disponible.',
    'Finalizar o postergar la cirugía; si es imprescindible, continuar con técnica libre de gatillantes (TIVA).'] },
  { h:'Tratamiento de soporte', l:[
    'Enfriar: suero fisiológico frío EV, hielo en axilas e ingles, lavado de cavidades. Detener a 38,5 °C.',
    'Hiperkalemia: bicarbonato, insulina + glucosa, gluconato de calcio; salbutamol.',
    'Arritmias: amiodarona. NO usar bloqueantes cálcicos (interacción con dantrolene).',
    'Diuresis > 2 ml/kg/h; forzar con líquidos y furosemida para prevenir la falla renal por mioglobinuria.',
    'Monitorizar gases, CK, potasio, coagulación y mioglobina en orina. Continuar en UTI al menos 24-48 h (riesgo de recrudescencia).'] },
  { h:'Fármacos seguros', l:[
    'Propofol, benzodiazepinas, opioides, óxido nitroso, relajantes no despolarizantes, anestésicos locales.',
    'Documentar el episodio, derivar al paciente y a su familia para estudio genético/de contractura.'] }
]},

{ id:'g-anafilaxia', icono:'alerta', titulo:'Anafilaxia perioperatoria', tag:'Crítico', color:'danger',
  cuerpo:[
  { h:'Sospecha', l:[
    'Hipotensión súbita refractaria, taquicardia, broncoespasmo severo, aumento de presiones en vía aérea, eritema, edema.',
    'Agentes más frecuentes: relajantes neuromusculares, antibióticos (betalactámicos), clorhexidina, látex, coloides, contraste.'] },
  { h:'Tratamiento', l:[
    'Suspender el agente sospechoso. O₂ al 100 %. Pedir ayuda.',
    'ADRENALINA: 10-50 µg EV en bolos repetidos (grado II-III); 100-1000 µg y luego infusión en el grado IV. IM 0,5 mg si no hay acceso EV.',
    'Expansión con cristaloides 20-30 ml/kg. Elevar los miembros inferiores.',
    'Broncoespasmo: salbutamol inhalado, sulfato de magnesio 2 g EV, adrenalina en infusión.',
    'Refractariedad: noradrenalina, vasopresina 1-2 U, glucagón 1-2 mg si el paciente recibe betabloqueantes.',
    'Coadyuvantes (nunca de primera línea): hidrocortisona 200 mg y difenhidramina.'] },
  { h:'Estudio posterior', l:[
    'Triptasa sérica: a los 30-120 min, a las 4-6 h y basal a las 24 h.',
    'Derivar a alergología para pruebas cutáneas a las 4-6 semanas. Entregar informe escrito al paciente.'] }
]},

{ id:'g-asra', icono:'aguja', titulo:'Neuroeje y anticoagulantes — intervalos ASRA', tag:'Regional', color:'warn',
  cuerpo:[
  { h:'Antiagregantes', l:[
    'AAS y AINE: sin restricción para el bloqueo neuroaxial.',
    'Clopidogrel: 5-7 días. Prasugrel: 7-10 días. Ticagrelor: 5-7 días.',
    'Inhibidores IIb/IIIa (tirofibán, eptifibatida): 8-24 h. Abciximab: 24-48 h.'] },
  { h:'Heparinas', l:[
    'HNF subcutánea profiláctica (5000 U c/12 h): sin restricción; con dosis mayores esperar 12 h.',
    'HNF endovenosa: suspender 4-6 h y confirmar KPTT normal. Reiniciar 1 h después de la punción.',
    'HBPM profiláctica: 12 h antes de la punción; reiniciar 4 h después de retirar el catéter.',
    'HBPM terapéutica: 24 h antes; el catéter debe retirarse antes de reiniciar.',
    'Fondaparinux: 36-42 h; sólo punción única y atraumática.'] },
  { h:'Anticoagulantes orales', l:[
    'Warfarina/acenocumarol: suspender 5 días y verificar RIN ≤ 1,4-1,5.',
    'Rivaroxabán, apixabán y edoxabán: 72 h (o 24-48 h con dosaje de anti-Xa).',
    'Dabigatrán: 72 h con ClCr > 80; 96 h con ClCr 50-79; 120 h con ClCr 30-49.',
    'Reinicio de DOAC: 6 h después de retirar el catéter (24 h si la punción fue traumática).'] },
  { h:'Vigilancia', l:[
    'Control neurológico horario las primeras 24 h tras el retiro del catéter.',
    'Ante dolor lumbar intenso, déficit motor o disfunción esfinteriana: RESONANCIA URGENTE. La descompresión antes de las 8 h condiciona el pronóstico.'] }
]},

{ id:'g-ayuno', icono:'reloj', titulo:'Ayuno preoperatorio y profilaxis de aspiración (ASA 2023)', tag:'Preoperatorio', color:'info',
  cuerpo:[
  { h:'Tiempos mínimos', l:[
    'Líquidos claros: 2 h (se estimula la ingesta, incluidas bebidas con carbohidratos).',
    'Leche materna: 4 h. Fórmula infantil: 6 h.',
    'Leche no humana o comida liviana: 6 h. Comida grasa o carne: 8 h.',
    'Chicle y caramelos: descartarlos antes de la inducción; no obligan a suspender la cirugía.'] },
  { h:'Riesgo aumentado de aspiración', l:[
    'Embarazo con trabajo de parto, obstrucción intestinal, gastroparesia, RGE severo, obesidad mórbida, urgencia, diabetes de larga data, agonistas GLP-1.',
    'Considerar ecografía gástrica (antro en decúbito lateral derecho) ante la duda.'] },
  { h:'Profilaxis farmacológica', l:[
    'Ranitidina/famotidina 20-40 mg VO o EV, u omeprazol 40 mg la noche previa y 2 h antes.',
    'Citrato de sodio 0,3 M 30 ml VO inmediatamente antes (obstetricia).',
    'Metoclopramida 10 mg EV. No usar de rutina en pacientes sin riesgo.',
    'Secuencia de intubación rápida con presión cricoidea en el paciente con estómago ocupado.'] }
]},

{ id:'g-checklist', icono:'check', titulo:'Lista de verificación de seguridad quirúrgica (OMS)', tag:'Seguridad', color:'ok',
  cuerpo:[
  { h:'Entrada — antes de la inducción', l:[
    '¿El paciente confirmó identidad, sitio, procedimiento y consentimiento?',
    '¿Está marcado el sitio quirúrgico?',
    '¿Se completó la verificación del aparato de anestesia y la medicación?',
    '¿Está colocado el oxímetro de pulso y funcionando?',
    '¿Tiene alergias conocidas? ¿Vía aérea difícil o riesgo de aspiración? ¿Riesgo de sangrado > 500 ml (7 ml/kg en niños)?'] },
  { h:'Pausa — antes de la incisión', l:[
    'Presentación del equipo por nombre y función.',
    'Confirmación verbal de paciente, sitio y procedimiento.',
    'Cirujano: pasos críticos, duración prevista, pérdida sanguínea estimada.',
    'Anestesiólogo: preocupaciones específicas del paciente.',
    'Enfermería: esterilidad confirmada, problemas de instrumental.',
    '¿Se administró la profilaxis antibiótica en los últimos 60 minutos?',
    '¿Se muestran las imágenes diagnósticas esenciales?'] },
  { h:'Salida — antes de que el paciente salga del quirófano', l:[
    'Confirmación verbal del procedimiento realizado.',
    'Recuento de gasas, compresas, agujas e instrumental.',
    'Rotulado de las muestras con nombre del paciente.',
    'Problemas con el instrumental a resolver.',
    'Aspectos clave para la recuperación y el manejo postoperatorio.'] }
]},

{ id:'g-ponv', icono:'estomago', titulo:'Náuseas y vómitos postoperatorios — profilaxis (consenso 4ª edición)', tag:'Manejo', color:'info',
  cuerpo:[
  { h:'Factores de riesgo (Apfel)', l:[
    'Sexo femenino, no fumador, antecedente de NVPO o cineto­sis, uso de opioides postoperatorios.',
    '0-1 factores: riesgo 10-20 %. 2: 40 %. 3: 60 %. 4: 80 %.'] },
  { h:'Estrategia', l:[
    '0-1 factor: 1 antiemético o ninguno. 2 factores: 2 fármacos. ≥3: 3-4 fármacos de clases distintas + anestesia total endovenosa.',
    'Combinar siempre fármacos de mecanismos diferentes.'] },
  { h:'Fármacos', l:[
    'Ondansetrón 4 mg EV al final de la cirugía (antagonista 5-HT₃).',
    'Dexametasona 4-8 mg EV al inicio (corticoide).',
    'Droperidol 0,625-1,25 mg EV (vigilar QT).',
    'Aprepitant 40 mg VO (antagonista NK-1) en pacientes de muy alto riesgo.',
    'Metoclopramida 10 mg (débil como monoterapia). Dimenhidrinato 1 mg/kg.',
    'Escopolamina transdérmica 1,5 mg colocada 2-4 h antes.'] },
  { h:'Medidas no farmacológicas', l:[
    'TIVA con propofol, evitar óxido nitroso y halogenados, minimizar opioides con analgesia multimodal, hidratación adecuada, estimulación del punto P6.'] }
]},

{ id:'g-tev', icono:'vena', titulo:'Tromboprofilaxis perioperatoria', tag:'Manejo', color:'info',
  cuerpo:[
  { h:'Estratificación (Caprini)', l:[
    '0-1 punto: riesgo muy bajo → deambulación precoz.',
    '2 puntos: bajo → compresión neumática intermitente.',
    '3-4 puntos: moderado → HBPM o compresión mecánica.',
    '≥5 puntos: alto → HBPM + medidas mecánicas; prolongar 28-35 días en cirugía oncológica abdominopelviana y artroplastias.'] },
  { h:'Esquemas', l:[
    'Enoxaparina 40 mg/día SC (30 mg c/12 h en alto riesgo; ajustar con ClCr < 30 a 20-30 mg/día).',
    'HNF 5000 U SC c/8-12 h en insuficiencia renal severa.',
    'Rivaroxabán 10 mg/día o apixabán 2,5 mg c/12 h en artroplastia de cadera o rodilla.',
    'Iniciar 12 h antes o 6-12 h después de la cirugía según el riesgo hemorrágico y la técnica neuroaxial utilizada.'] }
]},

{ id:'g-cardio', icono:'corazon', titulo:'Evaluación cardiovascular preoperatoria (ACC/AHA 2024)', tag:'Preoperatorio', color:'warn',
  cuerpo:[
  { h:'Paso 1 — urgencia', l:['Si la cirugía es de emergencia, proceder con estratificación clínica y vigilancia perioperatoria; no demorar por estudios.'] },
  { h:'Paso 2 — síndrome coronario agudo', l:['Ante SCA, arritmia significativa, insuficiencia cardíaca descompensada o valvulopatía severa sintomática: postergar y tratar.'] },
  { h:'Paso 3 — riesgo combinado', l:[
    'Calcular RCRI o el modelo NSQIP. Riesgo de evento cardíaco mayor < 1 % → proceder sin más estudios.'] },
  { h:'Paso 4 — capacidad funcional', l:[
    '≥ 4 MET (subir dos pisos sin detenerse, caminar 6 km/h en llano): proceder.',
    '< 4 MET o desconocida: valorar si el resultado de un estudio cambiará el manejo.'] },
  { h:'Paso 5 — estudios', l:[
    'Prueba de estrés farmacológico sólo si modifica la conducta perioperatoria.',
    'Ecocardiograma ante disnea de causa desconocida, soplo nuevo o insuficiencia cardíaca con cambios clínicos.',
    'La revascularización profiláctica no está indicada sólo para reducir el riesgo perioperatorio.'] },
  { h:'Tiempos tras revascularización', l:[
    'Angioplastia con balón: 14 días. Stent metálico: 30 días. Stent farmacoactivo: 6 meses (3 meses si la cirugía no puede postergarse y el riesgo isquémico es bajo).'] }
]},

{ id:'g-transfusion', icono:'sangre', titulo:'Manejo de sangre del paciente y transfusión', tag:'Manejo', color:'info',
  cuerpo:[
  { h:'Umbrales restrictivos', l:[
    'Hb 7 g/dl en el paciente hemodinámicamente estable.',
    'Hb 7,5 g/dl en cirugía cardíaca.',
    'Hb 8 g/dl con enfermedad cardiovascular preexistente o sintomatología de anemia.',
    'Transfundir de a una unidad y reevaluar.'] },
  { h:'Pérdida sanguínea permisible', l:[
    'PSP = VS × (Hto inicial − Hto mínimo aceptable) / Hto inicial.',
    'Volemia: neonato 85-90 ml/kg, lactante 80, niño 75, adulto varón 70, adulto mujer 65 ml/kg.'] },
  { h:'Hemostáticos', l:[
    'Ácido tranexámico 15 mg/kg (o 1 g) antes de la incisión en cirugía con sangrado esperado; repetir según el procedimiento.',
    'Plasma fresco: sangrado activo con RIN > 1,5. Plaquetas: < 50.000 con sangrado o < 100.000 en neurocirugía y oftalmología.',
    'Fibrinógeno < 150-200 mg/dl: crioprecipitados o concentrado de fibrinógeno.',
    'Considerar recuperación de sangre intraoperatoria y protocolo de transfusión masiva 1:1:1.'] }
]},

{ id:'g-dosis', icono:'jeringa', titulo:'Dosis de referencia del adulto', tag:'Farmacología', color:'aqua',
  cuerpo:[
  { h:'Inducción', l:[
    'Propofol 1,5-2,5 mg/kg (reducir 30-50 % en el anciano y el paciente inestable).',
    'Etomidato 0,2-0,3 mg/kg. Ketamina 1-2 mg/kg EV. Tiopental 3-5 mg/kg.',
    'Midazolam 0,02-0,05 mg/kg. Dexmedetomidina 0,5-1 µg/kg en 10 min.'] },
  { h:'Opioides', l:[
    'Fentanilo 1-3 µg/kg. Remifentanilo 0,05-0,2 µg/kg/min. Sufentanilo 0,1-0,5 µg/kg.',
    'Morfina 0,05-0,1 mg/kg. Nalbufina 0,1-0,2 mg/kg.'] },
  { h:'Relajantes', l:[
    'Rocuronio 0,6 mg/kg (1,2 mg/kg para secuencia rápida). Atracurio 0,5 mg/kg. Cisatracurio 0,15 mg/kg.',
    'Succinilcolina 1-1,5 mg/kg. Vecuronio 0,1 mg/kg.',
    'Reversión: sugammadex 2 mg/kg (bloqueo moderado), 4 mg/kg (profundo), 16 mg/kg (inmediato tras rocuronio).',
    'Neostigmina 0,04-0,05 mg/kg + atropina 0,02 mg/kg (nunca con TOF count 0).'] },
  { h:'Emergencias', l:[
    'Adrenalina paro 1 mg EV cada 3-5 min. Anafilaxia 10-100 µg EV.',
    'Atropina 0,5-1 mg. Efedrina 5-10 mg. Fenilefrina 50-100 µg.',
    'Noradrenalina 0,05-0,5 µg/kg/min. Amiodarona 300 mg en paro, 150 mg en TV con pulso.',
    'Naloxona 40-80 µg tituladas. Flumazenil 0,2 mg repetibles.'] },
  { h:'Anestésicos locales — dosis máximas', l:[
    'Lidocaína 4,5 mg/kg (7 con adrenalina). Bupivacaína 2 mg/kg (2,5 con adrenalina).',
    'Ropivacaína 3 mg/kg. Levobupivacaína 2 mg/kg. Reducir en el anciano, hepatópata y embarazada.'] }
]},

{ id:'g-pediatria', icono:'nino', titulo:'Referencias pediátricas', tag:'Pediatría', color:'aqua',
  cuerpo:[
  { h:'Tubo endotraqueal', l:[
    'Sin balón: diámetro = (edad/4) + 4. Con balón: (edad/4) + 3,5.',
    'Profundidad ≈ diámetro × 3 (cm a la comisura labial).',
    'Neonato de término: 3,0-3,5. Lactante 6-12 meses: 3,5-4,0.'] },
  { h:'Fluidos', l:[
    'Regla 4-2-1: 4 ml/kg/h los primeros 10 kg, 2 ml/kg/h los siguientes 10, 1 ml/kg/h por encima de 20 kg.',
    'Solución balanceada con glucosa al 1-2 % en lactantes.'] },
  { h:'Dosis frecuentes', l:[
    'Propofol 3-4 mg/kg (mayor requerimiento que el adulto). Ketamina IM 4-6 mg/kg.',
    'Atropina 0,02 mg/kg (mínimo 0,1 mg). Adrenalina en paro 10 µg/kg.',
    'Paracetamol 15 mg/kg c/6 h. Ibuprofeno 10 mg/kg. Dexametasona 0,15 mg/kg.',
    'Midazolam oral premedicación 0,5 mg/kg (máx. 20 mg).',
    'Desfibrilación 2-4 J/kg. Cardioversión 0,5-1 J/kg.'] },
  { h:'Alertas', l:[
    'Infección respiratoria alta activa: postergar 2-4 semanas la cirugía electiva (6 si hubo compromiso de vía aérea baja).',
    'Evitar la succinilcolina de rutina por riesgo de hiperkalemia en miopatías no diagnosticadas.'] }
]},

{ id:'g-eras', icono:'hoja', titulo:'ERAS — recuperación mejorada tras la cirugía', tag:'Protocolo', color:'ok',
  cuerpo:[
  { h:'Preoperatorio', l:[
    'Información y expectativas del paciente. Prehabilitación y cese del tabaco 4 semanas antes.',
    'Corrección de la anemia con hierro. Sin preparación mecánica del colon de rutina.',
    'Ayuno abreviado con bebida rica en carbohidratos 2 h antes. Sin premedicación sedante de larga duración.'] },
  { h:'Intraoperatorio', l:[
    'Anestesia de acción corta con monitoreo de profundidad. Analgesia multimodal ahorradora de opioides.',
    'Bloqueos regionales o infiltración de la herida. Ventilación protectora (6-8 ml/kg de peso ideal, PEEP, maniobras de reclutamiento).',
    'Normotermia activa, fluidoterapia guiada por objetivos, profilaxis de NVPO, evitar drenajes y sondas innecesarias.'] },
  { h:'Postoperatorio', l:[
    'Movilización el mismo día. Ingesta oral precoz. Retiro temprano de sonda vesical.',
    'Tromboprofilaxis. Control glucémico. Auditoría de resultados.'] }
]},

{ id:'g-monitoreo', icono:'monitor', titulo:'Estándares ASA de monitoreo básico', tag:'Seguridad', color:'ok',
  cuerpo:[
  { h:'Estándar I', l:['Personal de anestesia calificado presente en el quirófano durante todo el acto anestésico.'] },
  { h:'Estándar II — oxigenación', l:[
    'Analizador de oxígeno en el circuito con alarma de baja concentración.',
    'Oximetría de pulso con tono variable y alarma audible. Iluminación adecuada para evaluar el color del paciente.'] },
  { h:'Estándar II — ventilación', l:[
    'Capnografía continua desde la intubación hasta la extubación o el traslado.',
    'Auscultación, observación de la excursión torácica y de la bolsa reservorio.',
    'Alarma de desconexión con señal audible en ventilación mecánica.'] },
  { h:'Estándar II — circulación', l:[
    'ECG continuo desde el inicio hasta el final.',
    'Presión arterial y frecuencia cardíaca al menos cada 5 minutos.',
    'Evaluación continua de la circulación: pulso, auscultación, trazado de pulso o presión invasiva.'] },
  { h:'Estándar II — temperatura', l:['Monitoreo cuando se prevean o se sospechen cambios clínicamente significativos.'] }
]}
];
