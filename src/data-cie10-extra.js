/* =========================================================================
   CIE-10 - Ampliacion del set curado (segunda tanda)
   Mayor granularidad en los capitulos de mayor peso anestesiologico.
   Mismo formato que data-cie10.js
   ========================================================================= */
const CIE10_TXT_EXTRA = `
# I - Ciertas enfermedades infecciosas y parasitarias
A00|Cólera
A01|Fiebres tifoidea y paratifoidea
A05|Otras intoxicaciones alimentarias bacterianas
A06|Amebiasis
A08|Infecciones intestinales virales
A17|Tuberculosis del sistema nervioso
A19|Tuberculosis miliar
A32|Listeriosis
A35|Otros tétanos
A36|Difteria
A37|Tos ferina
A39|Infección meningocócica
A41.0|Sepsis por Staphylococcus aureus
A41.5|Sepsis por otros organismos gramnegativos
A42|Actinomicosis
A48.1|Enfermedad de los legionarios
A50|Sífilis congénita
A53|Sífilis no especificada
A60|Infecciones anogenitales por herpes
A63|Otras enfermedades de transmisión predominantemente sexual
A66|Frambesia
A69|Otras infecciones por espiroquetas
A77|Fiebre maculosa (rickettsiosis)
A81|Infecciones atípicas del sistema nervioso central
A82|Rabia
A84|Encefalitis viral transmitida por artrópodos
A85|Otras encefalitis virales
A86|Encefalitis viral no especificada
A87|Meningitis viral
A88|Otras infecciones virales del sistema nervioso
A90|Dengue
A92|Otras fiebres virales transmitidas por mosquitos
B05|Sarampión
B06|Rubéola
B08|Otras infecciones virales con lesiones de la piel
B18|Hepatitis viral crónica
B19|Hepatitis viral no especificada
B25|Enfermedad por citomegalovirus
B26|Parotiditis infecciosa
B27|Mononucleosis infecciosa
B33|Otras enfermedades virales
B35|Dermatofitosis
B38|Coccidioidomicosis
B39|Histoplasmosis
B45|Criptococosis
B50|Paludismo por Plasmodium falciparum
B54|Paludismo no especificado
B57|Enfermedad de Chagas
B65|Esquistosomiasis
B67|Equinococosis (hidatidosis)
B68|Teniasis
B69|Cisticercosis
B76|Anquilostomiasis
B77|Ascariasis
B80|Enterobiasis
B86|Escabiosis
B90|Secuelas de tuberculosis
B94|Secuelas de otras enfermedades infecciosas
B97|Agentes virales como causa de enfermedades
B99|Enfermedades infecciosas no especificadas

# II - Neoplasias
C00|Tumor maligno del labio
C01|Tumor maligno de la base de la lengua
C02|Tumor maligno de otras partes de la lengua
C03|Tumor maligno de la encía
C04|Tumor maligno del piso de la boca
C05|Tumor maligno del paladar
C06|Tumor maligno de otras partes de la boca
C07|Tumor maligno de la glándula parótida
C08|Tumor maligno de otras glándulas salivales mayores
C09|Tumor maligno de la amígdala
C10|Tumor maligno de la orofaringe
C11|Tumor maligno de la nasofaringe
C12|Tumor maligno del seno piriforme
C13|Tumor maligno de la hipofaringe
C14|Tumor maligno de otros sitios de labio, boca y faringe
C17|Tumor maligno del intestino delgado
C24|Tumor maligno de otras vías biliares
C26|Tumor maligno de otros sitios digestivos
C30|Tumor maligno de fosa nasal y oído medio
C31|Tumor maligno de los senos paranasales
C37|Tumor maligno del timo
C39|Tumor maligno de otros sitios del aparato respiratorio
C41|Tumor maligno de huesos de otros sitios
C45|Mesotelioma
C46|Sarcoma de Kaposi
C47|Tumor maligno de nervios periféricos
C51|Tumor maligno de la vulva
C52|Tumor maligno de la vagina
C55|Tumor maligno del útero, parte no especificada
C57|Tumor maligno de otros órganos genitales femeninos
C60|Tumor maligno del pene
C63|Tumor maligno de otros órganos genitales masculinos
C65|Tumor maligno de la pelvis renal
C66|Tumor maligno del uréter
C68|Tumor maligno de otros órganos urinarios
C69|Tumor maligno del ojo y sus anexos
C70|Tumor maligno de las meninges
C72|Tumor maligno de la médula espinal y otros del SNC
C74|Tumor maligno de la glándula suprarrenal
C75|Tumor maligno de otras glándulas endocrinas
C76|Tumor maligno de otros sitios mal definidos
C82|Linfoma folicular
C83|Linfoma no folicular
C84|Linfomas de células T
C88|Enfermedades inmunoproliferativas malignas
C93|Leucemia monocítica
C95|Leucemia de células no especificadas
C96|Otros tumores malignos del tejido linfático y hematopoyético
D00|Carcinoma in situ de cavidad bucal, esófago y estómago
D01|Carcinoma in situ de otros órganos digestivos
D06|Carcinoma in situ del cuello del útero
D09|Carcinoma in situ de otros sitios
D10|Tumor benigno de la boca y de la faringe
D11|Tumor benigno de las glándulas salivales mayores
D13|Tumor benigno de otras partes del aparato digestivo
D14|Tumor benigno del oído medio y aparato respiratorio
D15|Tumor benigno de otros órganos intratorácicos
D16|Tumor benigno del hueso y del cartílago articular
D19|Tumor benigno del tejido mesotelial
D20|Tumor benigno del tejido blando del retroperitoneo
D23|Otros tumores benignos de la piel
D24|Tumor benigno de la mama
D26|Otros tumores benignos del útero
D28|Tumor benigno de otros órganos genitales femeninos
D29|Tumor benigno de los órganos genitales masculinos
D30|Tumor benigno de los órganos urinarios
D31|Tumor benigno del ojo y sus anexos
D35|Tumor benigno de otras glándulas endocrinas
D36|Tumor benigno de otros sitios especificados
D38|Tumor de comportamiento incierto de órganos respiratorios
D39|Tumor de comportamiento incierto de órganos genitales femeninos
D42|Tumor de comportamiento incierto de las meninges
D43|Tumor de comportamiento incierto del encéfalo y del SNC
D44|Tumor de comportamiento incierto de las glándulas endocrinas
D45|Policitemia vera
D46|Síndromes mielodisplásicos
D47|Otros tumores de comportamiento incierto del tejido linfático

# III - Sangre y órganos hematopoyéticos
D50.0|Anemia por deficiencia de hierro secundaria a pérdida de sangre
D63|Anemia en enfermedades crónicas
D68.0|Enfermedad de von Willebrand
D68.4|Deficiencia adquirida de factores de la coagulación
D69.3|Púrpura trombocitopénica idiopática
D69.5|Trombocitopenia secundaria
D71|Trastornos funcionales de los neutrófilos polimorfonucleares
D72|Otros trastornos de los leucocitos
D73|Enfermedades del bazo
D73.0|Hipoesplenismo
D74|Metahemoglobinemia
D76|Otras enfermedades del tejido linforreticular
D77|Otros trastornos de la sangre en enfermedades clasificadas en otra parte
D82|Inmunodeficiencia asociada con otros defectos mayores
D83|Inmunodeficiencia común variable
D86|Sarcoidosis

# IV - Endocrino, nutricional y metabólico
E00|Síndrome congénito de deficiencia de yodo
E01|Trastornos tiroideos por deficiencia de yodo
E02|Hipotiroidismo subclínico por deficiencia de yodo
E07|Otros trastornos de la tiroides
E10.1|Diabetes tipo 1 con cetoacidosis
E10.2|Diabetes tipo 1 con complicaciones renales
E11.0|Diabetes tipo 2 con coma
E11.1|Diabetes tipo 2 con cetoacidosis
E11.6|Diabetes tipo 2 con otras complicaciones especificadas
E11.7|Diabetes tipo 2 con complicaciones múltiples
E11.9|Diabetes tipo 2 sin complicaciones
E12|Diabetes mellitus asociada con desnutrición
E16.0|Hipoglucemia inducida por fármacos sin coma
E16.2|Hipoglucemia no especificada
E22.0|Acromegalia y gigantismo hipofisario
E22.2|Síndrome de secreción inadecuada de ADH
E23.2|Diabetes insípida
E25|Trastornos adrenogenitales
E26.0|Hiperaldosteronismo primario
E27.2|Crisis addisoniana
E27.5|Hiperfunción adrenomedular
E31|Disfunción poliglandular
E32|Enfermedades del timo
E40|Kwashiorkor
E43|Desnutrición proteicocalórica severa
E50|Deficiencia de vitamina A
E53|Deficiencia de otras vitaminas del grupo B
E55|Deficiencia de vitamina D
E56|Otras deficiencias vitamínicas
E58|Deficiencia dietética de calcio
E61|Deficiencia de otros elementos nutricionales
E63|Otras deficiencias nutricionales
E64|Secuelas de la desnutrición
E66.1|Obesidad inducida por drogas
E66.9|Obesidad no especificada
E67|Otros tipos de hiperalimentación
E68|Secuelas de hiperalimentación
E71|Trastornos del metabolismo de aminoácidos de cadena ramificada
E72|Otros trastornos del metabolismo de los aminoácidos
E73|Intolerancia a la lactosa
E75|Trastornos del metabolismo de esfingolípidos
E76|Trastornos del metabolismo de glucosaminoglicanos
E77|Trastornos del metabolismo de glucoproteínas
E80|Trastornos del metabolismo de las porfirinas
E80.2|Porfiria aguda intermitente
E83.0|Trastornos del metabolismo del cobre (Wilson)
E83.1|Trastornos del metabolismo del hierro (hemocromatosis)
E83.5|Trastornos del metabolismo del calcio
E85|Amiloidosis
E87.0|Hiperosmolalidad e hipernatremia
E87.3|Alcalosis
E87.4|Trastorno mixto del equilibrio ácido-base
E89|Trastornos endocrinos consecutivos a procedimientos

# V - Trastornos mentales
F00|Demencia en la enfermedad de Alzheimer
F01|Demencia vascular
F04|Síndrome amnésico orgánico
F06|Otros trastornos mentales por lesión cerebral
F07|Trastornos de la personalidad de origen orgánico
F10.2|Síndrome de dependencia del alcohol
F10.3|Estado de abstinencia alcohólica
F10.4|Delirium tremens
F13|Trastornos por sedantes o hipnóticos
F15|Trastornos por otros estimulantes (cafeína, anfetaminas)
F16|Trastornos por alucinógenos
F18|Trastornos por disolventes volátiles
F21|Trastorno esquizotípico
F22|Trastornos delirantes persistentes
F25|Trastornos esquizoafectivos
F34|Trastornos del humor persistentes
F40|Trastornos fóbicos de ansiedad
F42|Trastorno obsesivo-compulsivo
F43.1|Trastorno de estrés postraumático
F44|Trastornos disociativos
F48|Otros trastornos neuróticos
F52|Disfunción sexual no orgánica
F53|Trastornos mentales del puerperio
F55|Abuso de sustancias que no producen dependencia
F60|Trastornos específicos de la personalidad
F63|Trastornos de los hábitos y de los impulsos
F72|Retraso mental grave
F73|Retraso mental profundo
F79|Retraso mental no especificado
F80|Trastornos del desarrollo del habla y del lenguaje
F91|Trastornos de la conducta
F95|Trastornos por tics
F99|Trastorno mental no especificado

# VI - Sistema nervioso
G00|Meningitis bacteriana
G03|Meningitis por otras causas
G04|Encefalitis, mielitis y encefalomielitis
G06|Absceso y granuloma intracraneal e intrarraquídeo
G08|Flebitis y tromboflebitis intracraneal
G09|Secuelas de enfermedades inflamatorias del SNC
G10|Enfermedad de Huntington
G11|Ataxia hereditaria
G12|Atrofia muscular espinal
G12.2|Esclerosis lateral amiotrófica
G23|Otras enfermedades degenerativas de los ganglios basales
G31|Otras enfermedades degenerativas del sistema nervioso
G36|Otras desmielinizaciones diseminadas agudas
G37|Otras enfermedades desmielinizantes del SNC
G40.3|Epilepsia generalizada idiopática
G40.9|Epilepsia no especificada
G44.2|Cefalea tensional
G47|Trastornos del sueño
G47.0|Insomnio
G47.4|Narcolepsia y cataplejía
G52|Trastornos de otros nervios craneales
G53|Trastornos de los nervios craneales en otras enfermedades
G56.2|Lesión del nervio cubital
G57.1|Meralgia parestésica
G58|Otras mononeuropatías
G62.0|Polineuropatía inducida por drogas
G64|Otros trastornos del sistema nervioso periférico
G70.0|Miastenia gravis
G70.2|Miastenia congénita
G71.0|Distrofia muscular (Duchenne / Becker)
G71.2|Miopatías congénitas
G72.0|Miopatía inducida por drogas
G73|Trastornos musculares en enfermedades clasificadas en otra parte
G83|Otros síndromes paralíticos
G90|Trastornos del sistema nervioso autónomo
G90.3|Degeneración multisistémica (disautonomía)
G92|Encefalopatía tóxica
G93|Otros trastornos del encéfalo
G93.1|Daño cerebral anóxico
G93.4|Encefalopatía no especificada
G94|Otros trastornos del encéfalo en enfermedades clasificadas en otra parte
G95.0|Siringomielia y siringobulbia
G96|Otros trastornos del sistema nervioso central
G98|Otros trastornos del sistema nervioso

# IX - Sistema circulatorio
I00|Fiebre reumática sin mención de complicación cardíaca
I01|Fiebre reumática con complicación cardíaca
I07|Enfermedades reumáticas de la válvula tricúspide
I08|Enfermedades valvulares múltiples
I09|Otras enfermedades reumáticas del corazón
I21.0|Infarto agudo transmural de la pared anterior
I21.1|Infarto agudo transmural de la pared inferior
I21.4|Infarto agudo subendocárdico
I23|Complicaciones del infarto agudo de miocardio
I25.5|Miocardiopatía isquémica
I28|Otras enfermedades de los vasos pulmonares
I30|Pericarditis aguda
I31.3|Derrame pericárdico
I32|Pericarditis en enfermedades clasificadas en otra parte
I34.0|Insuficiencia mitral
I34.2|Estenosis mitral no reumática
I35.1|Insuficiencia aórtica
I35.2|Estenosis aórtica con insuficiencia
I37|Trastornos de la válvula pulmonar
I41|Miocarditis en enfermedades clasificadas en otra parte
I42.2|Otras miocardiopatías hipertróficas
I42.5|Otras miocardiopatías restrictivas
I42.6|Miocardiopatía alcohólica
I43|Miocardiopatía en enfermedades clasificadas en otra parte
I44.0|Bloqueo auriculoventricular de primer grado
I44.1|Bloqueo auriculoventricular de segundo grado
I44.7|Bloqueo de rama izquierda no especificado
I45.0|Bloqueo fascicular derecho
I45.1|Bloqueo de rama derecha
I45.8|Otros trastornos especificados de la conducción (QT largo)
I47.1|Taquicardia supraventricular
I47.2|Taquicardia ventricular
I48.0|Fibrilación auricular paroxística
I48.2|Fibrilación auricular crónica
I49.0|Fibrilación y aleteo ventricular
I49.1|Despolarización auricular prematura
I49.3|Despolarización ventricular prematura
I49.4|Otras despolarizaciones prematuras
I50.1|Insuficiencia ventricular izquierda
I50.9|Insuficiencia cardíaca no especificada
I60.9|Hemorragia subaracnoidea no especificada
I61.9|Hemorragia intraencefálica no especificada
I63.9|Infarto cerebral no especificado
I66|Oclusión y estenosis de arterias cerebrales
I68|Trastornos cerebrovasculares en enfermedades clasificadas en otra parte
I70.2|Aterosclerosis de las arterias de los miembros
I71.0|Disección de la aorta
I71.1|Aneurisma de la aorta torácica roto
I71.3|Aneurisma de la aorta abdominal roto
I71.5|Aneurisma toracoabdominal sin ruptura
I72.0|Aneurisma de la arteria carótida
I73.0|Síndrome de Raynaud
I73.9|Enfermedad vascular periférica no especificada
I74.3|Embolia y trombosis de arterias de los miembros inferiores
I74.5|Embolia y trombosis de la arteria ilíaca
I77.6|Arteritis no especificada
I78|Enfermedades de los capilares
I81|Trombosis de la vena porta
I82.9|Embolia y trombosis venosa de vaso no especificado
I83.0|Várices de miembros inferiores con úlcera
I86|Várices de otros sitios
I88|Linfadenitis inespecífica
I95.1|Hipotensión ortostática
I95.2|Hipotensión debida a drogas
I97.0|Síndrome de postcardiotomía
I98|Otros trastornos del sistema circulatorio
I99|Trastornos del aparato circulatorio no especificados

# X - Sistema respiratorio
J09|Influenza por virus identificado
J10|Influenza por otro virus de la influenza identificado
J14|Neumonía por Haemophilus influenzae
J16|Neumonía por otros microorganismos infecciosos
J17|Neumonía en enfermedades clasificadas en otra parte
J21|Bronquiolitis aguda
J22|Infección aguda no especificada de las vías respiratorias inferiores
J30|Rinitis alérgica y vasomotora
J33|Pólipo nasal
J36|Absceso periamigdalino
J37|Laringitis y laringotraqueítis crónicas
J38.1|Pólipo de la cuerda vocal y de la laringe
J38.3|Otras enfermedades de las cuerdas vocales
J38.4|Edema de laringe
J38.5|Espasmo laríngeo
J38.6|Estenosis laríngea
J39|Otras enfermedades de las vías respiratorias superiores
J42|Bronquitis crónica no especificada
J44.0|EPOC con infección aguda de las vías respiratorias inferiores
J44.9|EPOC no especificada
J45.0|Asma predominantemente alérgica
J45.1|Asma no alérgica
J61|Neumoconiosis por asbesto
J62|Neumoconiosis por polvo de sílice
J67|Neumonitis por hipersensibilidad
J68|Afecciones respiratorias por inhalación de gases y vapores
J70|Afecciones respiratorias por otros agentes externos
J82|Eosinofilia pulmonar
J85|Absceso del pulmón y del mediastino
J91|Derrame pleural en enfermedades clasificadas en otra parte
J92|Paquipleuritis
J93.1|Otros neumotórax espontáneos
J94|Otras afecciones pleurales
J95.0|Mal funcionamiento de la traqueostomía
J95.1|Insuficiencia pulmonar aguda posterior a cirugía torácica
J95.2|Insuficiencia pulmonar aguda posterior a cirugía no torácica
J95.4|Síndrome de Mendelson
J95.5|Estenosis subglótica consecutiva a procedimientos
J96.1|Insuficiencia respiratoria crónica
J98.0|Enfermedades de los bronquios
J98.1|Colapso pulmonar (atelectasia)
J98.4|Otros trastornos del pulmón
J99|Trastornos respiratorios en enfermedades clasificadas en otra parte

# XI - Sistema digestivo
K01|Dientes incluidos e impactados
K03|Otras enfermedades de los tejidos duros de los dientes
K06|Otros trastornos de la encía y de la zona edéntula
K09|Quistes de la región bucal
K10|Otras enfermedades de los maxilares
K11.2|Sialoadenitis
K11.5|Sialolitiasis
K14|Enfermedades de la lengua
K22.0|Acalasia del cardias
K22.1|Úlcera del esófago
K22.3|Perforación del esófago
K22.6|Síndrome de Mallory-Weiss
K23|Trastornos del esófago en enfermedades clasificadas en otra parte
K25.0|Úlcera gástrica aguda con hemorragia
K25.1|Úlcera gástrica aguda con perforación
K26.0|Úlcera duodenal aguda con hemorragia
K28|Úlcera gastroyeyunal
K31.1|Estenosis pilórica hipertrófica del adulto
K31.5|Obstrucción del duodeno
K35.2|Apendicitis aguda con peritonitis generalizada
K35.3|Apendicitis aguda con peritonitis localizada
K38|Otras enfermedades del apéndice
K40.3|Hernia inguinal unilateral con obstrucción
K40.4|Hernia inguinal unilateral con gangrena
K41.3|Hernia femoral con obstrucción
K42.0|Hernia umbilical con obstrucción
K43.0|Hernia incisional con obstrucción
K44.0|Hernia diafragmática con obstrucción
K52.9|Gastroenteritis y colitis no infecciosa
K55.0|Trastornos vasculares agudos del intestino
K56.0|Íleo paralítico
K56.1|Invaginación intestinal
K56.2|Vólvulo
K56.4|Impactación intestinal
K56.5|Adherencias intestinales con obstrucción
K57.2|Enfermedad diverticular del colon con perforación y absceso
K57.3|Enfermedad diverticular del colon sin perforación
K59.0|Constipación
K60.0|Fisura anal aguda
K60.2|Fisura anal no especificada
K60.3|Fístula anal
K62.5|Hemorragia del ano y del recto
K63.1|Perforación del intestino
K63.2|Fístula del intestino
K65.0|Peritonitis aguda
K66.0|Adherencias peritoneales
K70.0|Hígado graso alcohólico
K70.3|Cirrosis hepática alcohólica
K71|Enfermedad tóxica del hígado
K72.0|Insuficiencia hepática aguda y subaguda
K72.9|Insuficiencia hepática no especificada
K73|Hepatitis crónica no clasificada en otra parte
K74.6|Cirrosis hepática no especificada
K75.0|Absceso del hígado
K76.6|Hipertensión portal
K76.7|Síndrome hepatorrenal
K80.1|Colelitiasis con otra colecistitis
K80.2|Colelitiasis sin colecistitis
K80.3|Cálculo del conducto biliar con colangitis
K80.4|Cálculo del conducto biliar con colecistitis
K81.0|Colecistitis aguda
K81.1|Colecistitis crónica
K82.2|Perforación de la vesícula biliar
K83.0|Colangitis
K83.1|Obstrucción del conducto biliar
K85.0|Pancreatitis aguda idiopática
K85.1|Pancreatitis aguda biliar
K85.2|Pancreatitis aguda alcohólica
K86.2|Quiste del páncreas
K86.3|Seudoquiste del páncreas
K90|Malabsorción intestinal
K91.3|Obstrucción intestinal postoperatoria
K92.0|Hematemesis
K92.1|Melena
K92.2|Hemorragia gastrointestinal no especificada

# XIII - Osteomuscular
M00|Artritis piógena
M02|Artropatías reactivas
M07|Artropatía psoriásica y enteropática
M11|Otras artropatías por cristales
M12|Otras artropatías específicas
M20.1|Hallux valgus adquirido
M21.4|Pie plano adquirido
M22|Trastornos de la rótula
M23.2|Trastorno de menisco por desgarro antiguo
M24.5|Contractura articular
M25.5|Dolor articular
M31|Otras vasculopatías necrotizantes
M32.1|Lupus eritematoso sistémico con compromiso de órganos
M35.0|Síndrome seco (Sjögren)
M42|Osteocondrosis de la columna vertebral
M43.1|Espondilolistesis
M48.0|Estenosis del canal raquídeo
M48.5|Vértebra colapsada
M50.0|Trastorno de disco cervical con mielopatía
M50.1|Trastorno de disco cervical con radiculopatía
M51.0|Trastornos de discos lumbares con mielopatía
M51.2|Otros desplazamientos de discos intervertebrales
M54.1|Radiculopatía
M54.2|Cervicalgia
M54.3|Ciática
M54.4|Lumbago con ciática
M62|Otros trastornos de los músculos
M62.8|Rabdomiólisis
M70.2|Bursitis del olécranon
M71.2|Quiste sinovial del hueco poplíteo (Baker)
M72.0|Fibromatosis de la fascia palmar
M75.0|Capsulitis adhesiva del hombro
M75.4|Síndrome de choque del hombro
M76.6|Tendinitis aquiliana
M77.0|Epicondilitis medial
M77.1|Epicondilitis lateral
M79.1|Mialgia
M79.7|Fibromialgia
M80.0|Osteoporosis postmenopáusica con fractura patológica
M81.0|Osteoporosis postmenopáusica
M84.1|Falta de consolidación de fractura (seudoartrosis)
M86.1|Otras osteomielitis agudas
M86.6|Otras osteomielitis crónicas
M87.0|Necrosis aséptica idiopática del hueso
M89|Otros trastornos del hueso
M93|Otras osteocondropatías
M94|Otros trastornos del cartílago

# XIV - Genitourinario
N00|Síndrome nefrítico agudo
N05|Síndrome nefrítico no especificado
N08|Trastornos glomerulares en enfermedades clasificadas en otra parte
N12|Nefritis tubulointersticial no especificada
N14|Afecciones tubulointersticiales inducidas por drogas
N15|Otras enfermedades renales tubulointersticiales
N17.0|Insuficiencia renal aguda con necrosis tubular
N18.3|Enfermedad renal crónica estadio 3
N18.4|Enfermedad renal crónica estadio 4
N20.0|Cálculo del riñón
N20.1|Cálculo del uréter
N21.0|Cálculo en la vejiga
N25|Trastornos por función tubular renal alterada
N26|Riñón contraído no especificado
N27|Riñón pequeño de causa desconocida
N31|Disfunción neuromuscular de la vejiga
N32.0|Obstrucción del cuello de la vejiga
N33|Trastornos vesicales en enfermedades clasificadas en otra parte
N34|Uretritis y síndrome uretral
N35|Estrechez uretral
N36|Otros trastornos de la uretra
N39.3|Incontinencia urinaria de esfuerzo
N39.4|Otras incontinencias urinarias
N42|Otros trastornos de la próstata
N45.9|Orquitis y epididimitis sin absceso
N46|Infertilidad masculina
N48.3|Priapismo
N49|Trastornos inflamatorios de órganos genitales masculinos
N62|Hipertrofia de la mama
N65|Deformidades adquiridas de la mama
N72|Enfermedad inflamatoria del cuello uterino
N75|Enfermedades de la glándula de Bartholin
N76|Otras inflamaciones de la vagina y de la vulva
N81.1|Cistocele
N81.2|Prolapso uterovaginal incompleto
N81.3|Prolapso uterovaginal completo
N83.0|Quiste folicular del ovario
N83.5|Torsión del ovario y de la trompa
N84.0|Pólipo del cuerpo uterino
N85.0|Hiperplasia glandular del endometrio
N86|Erosión y ectropión del cuello del útero
N89|Otros trastornos no inflamatorios de la vagina
N90|Otros trastornos no inflamatorios de la vulva
N93.8|Otras hemorragias uterinas y vaginales anormales
N94|Dolor y otras afecciones del aparato genital femenino
N96|Abortadora habitual
N98|Complicaciones asociadas con la fecundación artificial
N99|Trastornos genitourinarios consecutivos a procedimientos

# XV - Embarazo, parto y puerperio
O01|Mola hidatiforme
O08|Complicaciones consecutivas al aborto
O12|Edema y proteinuria gestacionales sin hipertensión
O16|Hipertensión materna no especificada
O20|Hemorragia precoz del embarazo
O22|Complicaciones venosas en el embarazo
O23|Infección de las vías genitourinarias en el embarazo
O24.0|Diabetes preexistente insulinodependiente en el embarazo
O25|Desnutrición en el embarazo
O26.6|Trastornos del hígado en el embarazo (colestasis)
O28|Hallazgos anormales en el examen prenatal
O29|Complicaciones de la anestesia durante el embarazo
O31|Complicaciones específicas del embarazo múltiple
O35|Atención materna por anomalía fetal
O36.5|Atención materna por deficiencia del crecimiento fetal
O40|Polihidramnios
O43.2|Placenta mórbidamente adherente (acretismo)
O44.1|Placenta previa con hemorragia
O46|Hemorragia anteparto
O61|Fracaso de la inducción del trabajo de parto
O65|Trabajo de parto obstruido por anomalía de la pelvis materna
O66|Otros trabajos de parto obstruidos
O67|Trabajo de parto complicado por hemorragia intraparto
O71.1|Ruptura del útero durante el trabajo de parto
O72.0|Hemorragia del tercer período del parto
O72.1|Otras hemorragias postparto inmediatas
O73|Retención de placenta sin hemorragia
O74.0|Neumonitis por aspiración durante la anestesia del parto
O74.5|Cefalea pospunción durante la anestesia del parto
O75.1|Choque durante o después del trabajo de parto
O81|Parto único con fórceps o ventosa
O83|Otros partos únicos asistidos
O84|Parto múltiple
O87|Complicaciones venosas en el puerperio
O88.1|Embolia de líquido amniótico
O90|Complicaciones del puerperio
O91|Infecciones de la mama asociadas con el parto
O98|Enfermedades infecciosas maternas clasificables en otra parte

# XVIII - Síntomas y signos
R01|Soplos cardíacos
R02|Gangrena
R03|Lectura de presión sanguínea anormal
R06.1|Estridor
R06.2|Sibilancias
R06.4|Hiperventilación
R07.4|Dolor en el pecho no especificado
R09.0|Asfixia
R09.2|Paro respiratorio
R10.0|Abdomen agudo
R12|Acidez
R15|Incontinencia fecal
R20|Alteraciones de la sensibilidad cutánea
R21|Erupción cutánea
R23|Otros cambios en la piel (cianosis, palidez)
R25|Movimientos involuntarios anormales
R26|Anormalidades de la marcha
R27|Otras fallas de coordinación
R29|Otros síntomas del sistema nervioso y osteomuscular
R30|Dolor asociado con la micción
R32|Incontinencia urinaria no especificada
R34|Anuria y oliguria
R36|Descarga uretral
R40.2|Coma no especificado
R41.0|Desorientación no especificada
R43|Trastornos del olfato y del gusto
R44|Otros síntomas concernientes a las sensaciones
R47|Alteraciones del habla
R49|Alteraciones de la voz
R50.9|Fiebre no especificada
R56.0|Convulsiones febriles
R56.8|Otras convulsiones y las no especificadas
R57.2|Choque séptico
R59|Adenomegalia
R62|Retardo del desarrollo fisiológico normal
R65|Síndrome de respuesta inflamatoria sistémica
R68|Otros síntomas y signos generales
R71|Anormalidad de los eritrocitos
R74|Niveles anormales de enzimas séricas
R76|Otros hallazgos inmunológicos anormales en suero
R78|Hallazgo de drogas en la sangre
R80|Proteinuria aislada
R82|Otros hallazgos anormales en la orina
R87|Hallazgos anormales en muestras de órganos genitales
R89|Hallazgos anormales en muestras de otros órganos
R93|Hallazgos anormales en diagnóstico por imagen de otras estructuras
R96|Otras muertes súbitas de causa desconocida
R99|Otras causas mal definidas de mortalidad

# XIX - Traumatismos y complicaciones
S02.0|Fractura de la bóveda del cráneo
S02.1|Fractura de la base del cráneo
S02.2|Fractura de los huesos nasales
S02.4|Fractura del malar y del maxilar superior
S05|Traumatismo del ojo y de la órbita
S06.0|Concusión
S06.1|Edema cerebral traumático
S06.6|Hemorragia subaracnoidea traumática
S11|Herida del cuello
S21|Herida del tórax
S22.4|Fracturas múltiples de costillas
S24|Traumatismo de nervios y médula espinal a nivel del tórax
S25|Traumatismo de vasos sanguíneos del tórax
S26|Traumatismo del corazón
S27.0|Neumotórax traumático
S27.1|Hemotórax traumático
S31|Herida del abdomen y de la pelvis
S32.1|Fractura del sacro
S32.4|Fractura del acetábulo
S32.5|Fractura del pubis
S34|Traumatismo de nervios y médula lumbar
S35|Traumatismo de vasos sanguíneos abdominales
S36.1|Traumatismo del hígado o de la vesícula biliar
S36.4|Traumatismo del intestino delgado
S36.5|Traumatismo del colon
S37.0|Traumatismo del riñón
S37.2|Traumatismo de la vejiga
S41|Herida del hombro y del brazo
S42.3|Fractura de la diáfisis del húmero
S42.4|Fractura de la extremidad inferior del húmero
S43.0|Luxación de la articulación del hombro
S45|Traumatismo de vasos sanguíneos del hombro y del brazo
S46|Traumatismo de tendón y músculo del hombro y del brazo
S51|Herida del antebrazo
S52.0|Fractura de la extremidad superior del cúbito
S52.6|Fractura de la extremidad distal de cúbito y radio
S53|Luxación y esguince del codo
S55|Traumatismo de vasos sanguíneos del antebrazo
S63|Luxación y esguince de la muñeca y de la mano
S65|Traumatismo de vasos sanguíneos de la muñeca y de la mano
S68|Amputación traumática de la muñeca y de la mano
S71|Herida de la cadera y del muslo
S72.2|Fractura subtrocantérea
S72.4|Fractura de la extremidad distal del fémur
S73|Luxación y esguince de la cadera
S75|Traumatismo de vasos sanguíneos de la cadera y del muslo
S76|Traumatismo de tendón y músculo de la cadera y del muslo
S81|Herida de la pierna
S82.2|Fractura de la diáfisis de la tibia
S82.3|Fractura de la extremidad distal de la tibia
S82.8|Fracturas de otras partes de la pierna
S85|Traumatismo de vasos sanguíneos de la pierna
S88|Amputación traumática de la pierna
S91|Herida del tobillo y del pie
S93|Luxación y esguince del tobillo y del pie
S98|Amputación traumática del tobillo y del pie
T02|Fracturas que afectan múltiples regiones del cuerpo
T06|Otros traumatismos que afectan múltiples regiones
T08|Fractura de la columna vertebral, nivel no especificado
T09|Otros traumatismos de la columna vertebral y del tronco
T15|Cuerpo extraño en la parte externa del ojo
T16|Cuerpo extraño en el oído
T19|Cuerpo extraño en las vías genitourinarias
T23|Quemadura de la muñeca y de la mano
T25|Quemadura del tobillo y del pie
T27|Quemadura del tracto respiratorio
T28|Quemadura de otros órganos internos
T29|Quemaduras de múltiples regiones
T30|Quemadura de región no especificada
T33|Congelamiento superficial
T34|Congelamiento con necrosis tisular
T39|Envenenamiento por analgésicos no opiáceos
T43|Envenenamiento por psicotrópicos
T44|Envenenamiento por drogas que afectan el sistema autónomo
T45|Envenenamiento por agentes hematológicos
T46|Envenenamiento por agentes que afectan el sistema cardiovascular
T48|Envenenamiento por agentes que actúan sobre músculos y respiración
T51|Efecto tóxico del alcohol
T52|Efecto tóxico de disolventes orgánicos
T54|Efecto tóxico de sustancias corrosivas
T58|Efecto tóxico del monóxido de carbono
T59|Efecto tóxico de otros gases y vapores
T63|Efecto tóxico por contacto con animales venenosos
T65|Efecto tóxico de otras sustancias
T67|Efectos del calor y de la luz
T68|Hipotermia
T69|Otros efectos de la temperatura reducida
T71|Asfixia
T73|Efectos de otras privaciones
T74|Síndromes del maltrato
T75|Efectos de otras causas externas
T78.1|Otras reacciones adversas a los alimentos
T78.3|Edema angioneurótico
T78.4|Alergia no especificada
T79.0|Embolia gaseosa traumática
T79.1|Embolia grasa traumática
T79.4|Choque traumático
T79.5|Anuria traumática
T79.6|Isquemia muscular traumática (síndrome compartimental)
T80.1|Complicaciones vasculares consecutivas a infusión
T80.2|Infecciones consecutivas a infusión o transfusión
T80.3|Reacción de incompatibilidad ABO
T80.5|Choque anafiláctico debido a suero
T81.1|Choque durante o resultante de un procedimiento
T81.2|Punción o laceración accidental durante un procedimiento
T81.3|Dehiscencia de la herida quirúrgica
T81.5|Cuerpo extraño dejado accidentalmente en cavidad
T81.6|Reacción aguda a sustancia extraña dejada durante un procedimiento
T81.7|Complicaciones vasculares consecutivas a un procedimiento
T82.6|Infección debida a prótesis valvular cardíaca
T83|Complicaciones de dispositivos genitourinarios
T85.7|Infección debida a otros dispositivos protésicos
T86|Falla y rechazo de órganos y tejidos trasplantados
T87|Complicaciones propias de la reimplantación y amputación
T88.0|Infección consecutiva a inmunización
T88.1|Otras complicaciones consecutivas a inmunización
T88.7|Efecto adverso no especificado de droga o medicamento
T88.8|Otras complicaciones de la atención médica
T90|Secuelas de traumatismos de la cabeza
T91|Secuelas de traumatismos del cuello y del tronco
T92|Secuelas de traumatismos del miembro superior
T93|Secuelas de traumatismos del miembro inferior
T94|Secuelas de traumatismos de regiones múltiples
T98|Secuelas de otros efectos de causas externas

# XXI - Factores que influyen en el estado de salud
Z00|Examen general e investigación de personas sin quejas
Z01.6|Examen radiológico no clasificado en otra parte
Z02|Examen y contacto para fines administrativos
Z08|Examen de seguimiento después de tratamiento por neoplasia
Z09|Examen de seguimiento después de tratamiento por otras afecciones
Z11|Examen de pesquisa especial para enfermedades infecciosas
Z12|Examen de pesquisa especial para tumores
Z20|Contacto con enfermedades transmisibles
Z21|Estado de infección asintomática por VIH
Z23|Necesidad de inmunización
Z29|Necesidad de otras medidas profilácticas
Z31|Atención para la procreación
Z32|Examen y prueba del embarazo
Z33|Estado de embarazo incidental
Z35|Supervisión de embarazo de alto riesgo
Z36|Pesquisa prenatal
Z37|Producto del parto
Z39|Examen y atención del postparto
Z40|Cirugía profiláctica
Z44|Prueba y ajuste de dispositivos protésicos externos
Z46|Prueba y ajuste de otros dispositivos
Z49|Cuidados relativos a la diálisis
Z50|Atención por uso de procedimientos de rehabilitación
Z51.0|Sesión de radioterapia
Z51.1|Sesión de quimioterapia por tumor
Z51.5|Atención paliativa
Z52|Donantes de órganos y tejidos
Z53|Procedimiento no realizado
Z54|Convalecencia
Z56|Problemas relacionados con el empleo
Z59|Problemas relacionados con la vivienda
Z60|Problemas relacionados con el ambiente social
Z63|Otros problemas relacionados con el grupo primario de apoyo
Z72|Problemas relacionados con el estilo de vida
Z73|Problemas relacionados con dificultades en el manejo de la vida
Z74|Problemas relacionados con la dependencia del prestador de servicios
Z75|Problemas relacionados con las facilidades de atención médica
Z76|Personas en contacto con servicios de salud por otras circunstancias
Z80|Historia familiar de tumor maligno
Z82|Historia familiar de discapacidades crónicas
Z83|Historia familiar de otros trastornos específicos
Z85|Historia personal de tumor maligno
Z86|Historia personal de otras enfermedades
Z89|Ausencia adquirida de miembros
Z91|Historia personal de factores de riesgo
Z91.1|Incumplimiento del tratamiento médico
Z93|Orificios artificiales
Z93.0|Traqueostomía
Z93.1|Gastrostomía
Z93.3|Colostomía
Z94.0|Riñón trasplantado
Z94.1|Corazón trasplantado
Z94.4|Hígado trasplantado
Z95.1|Presencia de injerto de derivación aortocoronaria
Z95.2|Presencia de prótesis de válvula cardíaca
Z95.3|Presencia de válvula cardíaca xenogénica
Z95.8|Presencia de otros implantes cardíacos y vasculares
Z96.6|Presencia de implantes ortopédicos articulares
Z96.7|Presencia de otros implantes de hueso y tendón
Z97.8|Presencia de otros dispositivos especificados
Z99.1|Dependencia de respirador
Z99.3|Dependencia de silla de ruedas
`;
