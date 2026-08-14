/* =========================================================================
   CIE-10 (CIE-10-ES / OMS) - Set curado con relevancia anestesiologica
   Formato: una entrada por linea  ->  CODIGO|Descripcion
   Las lineas que empiezan con # definen el capitulo vigente.
   Ampliable manualmente desde la app (se puede cargar cualquier diagnostico
   que no figure en la lista y queda guardado en el catalogo del usuario).
   ========================================================================= */
const CIE10_TXT = `
# I - Ciertas enfermedades infecciosas y parasitarias
A02|Otras infecciones por Salmonella
A04.7|Enterocolitis por Clostridioides difficile
A09|Diarrea y gastroenteritis de presunto origen infeccioso
A15|Tuberculosis respiratoria confirmada bacteriológicamente
A16|Tuberculosis respiratoria no confirmada
A18|Tuberculosis de otros órganos
A31|Infección por otras micobacterias
A40|Sepsis estreptocócica
A41|Otras sepsis
A41.9|Sepsis, no especificada
A46|Erisipela
A48.0|Gangrena gaseosa
A49|Infección bacteriana de sitio no especificado
A54|Infección gonocócica
A56|Otras infecciones por clamidias de transmisión sexual
A80|Poliomielitis aguda
B00|Infecciones por herpes simple
B01|Varicela
B02|Herpes zóster
B15|Hepatitis aguda tipo A
B16|Hepatitis aguda tipo B
B17.1|Hepatitis aguda tipo C
B18.1|Hepatitis viral crónica tipo B
B18.2|Hepatitis viral crónica tipo C
B20|Enfermedad por VIH con enfermedades infecciosas y parasitarias
B24|Enfermedad por VIH, sin otra especificación
B34.2|Infección por coronavirus, sitio no especificado
B37|Candidiasis
B44|Aspergilosis
B49|Micosis no especificada
B95|Estreptococos y estafilococos como causa de enfermedades
B96|Otros agentes bacterianos como causa de enfermedades
U07.1|COVID-19, virus identificado
U09.9|Afección posterior a COVID-19
Z22.3|Portador de otras enfermedades bacterianas (colonización por MR)

# II - Neoplasias
C15|Tumor maligno del esófago
C16|Tumor maligno del estómago
C18|Tumor maligno del colon
C19|Tumor maligno de la unión rectosigmoidea
C20|Tumor maligno del recto
C21|Tumor maligno del ano y del conducto anal
C22|Tumor maligno del hígado y vías biliares intrahepáticas
C23|Tumor maligno de la vesícula biliar
C25|Tumor maligno del páncreas
C32|Tumor maligno de la laringe
C33|Tumor maligno de la tráquea
C34|Tumor maligno de bronquios y pulmón
C38|Tumor maligno del mediastino y la pleura
C40|Tumor maligno de huesos y cartílago articular de los miembros
C43|Melanoma maligno de la piel
C44|Otros tumores malignos de la piel
C48|Tumor maligno del retroperitoneo y del peritoneo
C49|Tumor maligno de tejido conjuntivo y blando
C50|Tumor maligno de la mama
C53|Tumor maligno del cuello del útero
C54|Tumor maligno del cuerpo del útero
C56|Tumor maligno del ovario
C61|Tumor maligno de la próstata
C62|Tumor maligno del testículo
C64|Tumor maligno del riñón
C67|Tumor maligno de la vejiga urinaria
C71|Tumor maligno del encéfalo
C73|Tumor maligno de la glándula tiroides
C77|Tumor maligno secundario de ganglios linfáticos
C78|Tumor maligno secundario de órganos respiratorios y digestivos
C79|Tumor maligno secundario de otros sitios
C79.5|Metástasis óseas
C80|Tumor maligno de sitio primario no especificado
C81|Enfermedad de Hodgkin
C85|Linfoma no Hodgkin
C90|Mieloma múltiple
C91|Leucemia linfoide
C92|Leucemia mieloide
D05|Carcinoma in situ de la mama
D12|Tumor benigno del colon y del recto
D17|Tumor benigno lipomatoso
D18|Hemangioma y linfangioma
D21|Tumor benigno de tejido conjuntivo y blando
D22|Nevo melanocítico
D25|Leiomioma del útero
D27|Tumor benigno del ovario
D32|Tumor benigno de las meninges (meningioma)
D33|Tumor benigno del encéfalo
D34|Tumor benigno de la glándula tiroides
D35.2|Tumor benigno de la hipófisis
D35.0|Tumor benigno de la glándula suprarrenal
D37|Tumor de comportamiento incierto de la cavidad bucal y digestivo
D41|Tumor de comportamiento incierto de órganos urinarios
D48|Tumor de comportamiento incierto de otros sitios

# III - Enfermedades de la sangre y de los órganos hematopoyéticos
D50|Anemia por deficiencia de hierro
D51|Anemia por deficiencia de vitamina B12
D52|Anemia por deficiencia de folatos
D53|Otras anemias nutricionales
D55|Anemia por trastornos enzimáticos
D56|Talasemia
D57|Trastornos falciformes (drepanocitosis)
D58|Otras anemias hemolíticas hereditarias
D59|Anemia hemolítica adquirida
D61|Anemia aplásica
D62|Anemia posthemorrágica aguda
D64|Otras anemias
D64.9|Anemia no especificada
D65|Coagulación intravascular diseminada
D66|Deficiencia hereditaria del factor VIII (hemofilia A)
D67|Deficiencia hereditaria del factor IX (hemofilia B)
D68|Otros defectos de la coagulación
D68.3|Trastorno hemorrágico por anticoagulantes circulantes
D68.5|Trombofilia primaria
D68.6|Otras trombofilias (síndrome antifosfolipídico)
D69|Púrpura y otras afecciones hemorrágicas
D69.6|Trombocitopenia no especificada
D70|Agranulocitosis / neutropenia
D75|Otras enfermedades de la sangre (policitemia secundaria)
D80|Inmunodeficiencia con predominio de defectos de anticuerpos
D84|Otras inmunodeficiencias
D89|Otros trastornos que afectan el mecanismo inmunitario

# IV - Enfermedades endocrinas, nutricionales y metabólicas
E03|Hipotiroidismo
E05|Tirotoxicosis (hipertiroidismo)
E04|Bocio no tóxico
E06|Tiroiditis
E10|Diabetes mellitus tipo 1
E11|Diabetes mellitus tipo 2
E11.2|Diabetes tipo 2 con complicaciones renales
E11.4|Diabetes tipo 2 con complicaciones neurológicas
E11.5|Diabetes tipo 2 con complicaciones circulatorias periféricas
E13|Otras diabetes mellitus especificadas
E14|Diabetes mellitus no especificada
E15|Coma hipoglucémico no diabético
E16|Otros trastornos de la secreción interna del páncreas
E20|Hipoparatiroidismo
E21|Hiperparatiroidismo
E22|Hiperfunción de la hipófisis (acromegalia)
E23|Hipofunción de la hipófisis
E24|Síndrome de Cushing
E26|Hiperaldosteronismo
E27|Otros trastornos de la glándula suprarrenal
E27.1|Insuficiencia adrenocortical primaria (Addison)
E34.0|Síndrome carcinoide
E44|Desnutrición proteicocalórica moderada y leve
E46|Desnutrición proteicocalórica no especificada
E66|Obesidad
E66.0|Obesidad por exceso de calorías
E66.2|Obesidad extrema con hipoventilación alveolar
E70|Trastornos del metabolismo de aminoácidos aromáticos
E74|Otros trastornos del metabolismo de carbohidratos
E78|Trastornos del metabolismo de las lipoproteínas (dislipemia)
E79|Trastornos del metabolismo de purinas (gota)
E83|Trastornos del metabolismo de los minerales
E84|Fibrosis quística
E86|Depleción de volumen (deshidratación)
E87|Otros trastornos hidroelectrolíticos y del equilibrio ácido-base
E87.1|Hipoosmolalidad e hiponatremia
E87.5|Hiperpotasemia
E87.6|Hipopotasemia
E87.2|Acidosis
E88|Otros trastornos metabólicos

# V - Trastornos mentales y del comportamiento
F03|Demencia no especificada
F05|Delirio no inducido por alcohol ni otras sustancias
F10|Trastornos mentales por consumo de alcohol
F11|Trastornos mentales por consumo de opiáceos
F12|Trastornos mentales por consumo de cannabinoides
F14|Trastornos mentales por consumo de cocaína
F17|Trastornos mentales por consumo de tabaco
F19|Trastornos por consumo de múltiples sustancias
F20|Esquizofrenia
F31|Trastorno afectivo bipolar
F32|Episodio depresivo
F33|Trastorno depresivo recurrente
F41|Otros trastornos de ansiedad
F41.0|Trastorno de pánico
F43|Reacción al estrés grave y trastornos de adaptación
F45|Trastornos somatomorfos
F50|Trastornos de la conducta alimentaria
F51|Trastornos no orgánicos del sueño
F70|Retraso mental leve
F71|Retraso mental moderado
F84|Trastornos generalizados del desarrollo (TEA)
F90|Trastornos hipercinéticos (TDAH)

# VI - Enfermedades del sistema nervioso
G20|Enfermedad de Parkinson
G21|Parkinsonismo secundario
G24|Distonía
G25|Otros trastornos extrapiramidales
G30|Enfermedad de Alzheimer
G35|Esclerosis múltiple
G40|Epilepsia
G41|Estado de mal epiléptico
G43|Migraña
G44|Otros síndromes de cefalea
G45|Accidentes isquémicos cerebrales transitorios
G46|Síndromes vasculares encefálicos
G47.3|Apnea del sueño
G47.31|Apnea obstructiva del sueño
G50|Trastornos del nervio trigémino
G51|Trastornos del nervio facial
G54|Trastornos de las raíces y plexos nerviosos
G55|Compresiones de raíces y plexos nerviosos
G56|Mononeuropatías del miembro superior
G56.0|Síndrome del túnel carpiano
G57|Mononeuropatías del miembro inferior
G60|Neuropatía hereditaria e idiopática
G61|Polineuropatía inflamatoria (Guillain-Barré)
G62|Otras polineuropatías
G63|Polineuropatía en enfermedades clasificadas en otra parte
G70|Miastenia gravis y otros trastornos neuromusculares
G71|Trastornos primarios del músculo (distrofias musculares)
G71.1|Trastornos miotónicos
G72|Otras miopatías
G80|Parálisis cerebral infantil
G81|Hemiplejía
G82|Paraplejía y cuadriplejía
G89|Dolor no clasificado en otra parte
G91|Hidrocefalia
G93.2|Hipertensión intracraneal benigna
G93.6|Edema cerebral
G95|Otras enfermedades de la médula espolinal
G97|Trastornos del sistema nervioso consecutivos a procedimientos

# VII-VIII - Ojo y oído
H00|Orzuelo y calacio
H02|Otros trastornos del párpado
H04|Trastornos del aparato lagrimal
H16|Queratitis
H25|Catarata senil
H26|Otras cataratas
H33|Desprendimiento y desgarro de la retina
H35|Otros trastornos de la retina
H36|Trastornos de la retina en enfermedades clasificadas en otra parte
H40|Glaucoma
H43|Trastornos del cuerpo vítreo
H49|Estrabismo paralítico
H50|Otros estrabismos
H52|Trastornos de la acomodación y de la refracción
H60|Otitis externa
H65|Otitis media no supurativa
H66|Otitis media supurativa
H70|Mastoiditis
H72|Perforación de la membrana timpánica
H81|Trastornos de la función vestibular (vértigo)
H90|Hipoacusia conductiva y neurosensorial
H91|Otras hipoacusias

# IX - Enfermedades del sistema circulatorio
I05|Enfermedades reumáticas de la válvula mitral
I06|Enfermedades reumáticas de la válvula aórtica
I10|Hipertensión esencial (primaria)
I11|Enfermedad cardíaca hipertensiva
I12|Enfermedad renal hipertensiva
I13|Enfermedad cardiorrenal hipertensiva
I15|Hipertensión secundaria
I20|Angina de pecho
I20.0|Angina inestable
I21|Infarto agudo de miocardio
I22|Infarto subsecuente de miocardio
I24|Otras enfermedades isquémicas agudas del corazón
I25|Enfermedad isquémica crónica del corazón
I25.2|Infarto antiguo de miocardio
I26|Embolia pulmonar
I27|Otras enfermedades cardiopulmonares
I27.0|Hipertensión pulmonar primaria
I31|Otras enfermedades del pericardio
I33|Endocarditis aguda y subaguda
I34|Trastornos no reumáticos de la válvula mitral
I35|Trastornos no reumáticos de la válvula aórtica
I35.0|Estenosis aórtica
I36|Trastornos no reumáticos de la válvula tricúspide
I38|Endocarditis, válvula no especificada
I40|Miocarditis aguda
I42|Miocardiopatía
I42.0|Miocardiopatía dilatada
I42.1|Miocardiopatía hipertrófica obstructiva
I44|Bloqueo auriculoventricular y de rama izquierda
I44.2|Bloqueo auriculoventricular completo
I45|Otros trastornos de la conducción
I45.6|Síndrome de preexcitación (WPW)
I46|Paro cardíaco
I47|Taquicardia paroxística
I48|Fibrilación y aleteo auricular
I49|Otras arritmias cardíacas
I49.5|Síndrome del seno enfermo
I50|Insuficiencia cardíaca
I50.0|Insuficiencia cardíaca congestiva
I51|Complicaciones y descripciones mal definidas de enfermedad cardíaca
I60|Hemorragia subaracnoidea
I61|Hemorragia intraencefálica
I62|Otras hemorragias intracraneales no traumáticas
I63|Infarto cerebral
I64|Accidente cerebrovascular no especificado
I65|Oclusión y estenosis de arterias precerebrales
I67|Otras enfermedades cerebrovasculares
I69|Secuelas de enfermedad cerebrovascular
I70|Aterosclerosis
I71|Aneurisma y disección aórticos
I71.4|Aneurisma de la aorta abdominal sin ruptura
I72|Otros aneurismas
I73|Otras enfermedades vasculares periféricas
I74|Embolia y trombosis arteriales
I77|Otros trastornos de arterias y arteriolas
I80|Flebitis y tromboflebitis
I80.2|Trombosis venosa profunda de miembro inferior
I82|Otras embolias y trombosis venosas
I83|Várices de los miembros inferiores
I84|Hemorroides
I85|Várices esofágicas
I87|Otros trastornos de las venas
I89|Otros trastornos no infecciosos de vasos y ganglios linfáticos
I95|Hipotensión
I97|Trastornos circulatorios consecutivos a procedimientos

# X - Enfermedades del sistema respiratorio
J00|Rinofaringitis aguda (resfriado común)
J01|Sinusitis aguda
J02|Faringitis aguda
J03|Amigdalitis aguda
J04|Laringitis y traqueítis agudas
J05|Laringitis obstructiva aguda (crup) y epiglotitis
J06|Infecciones agudas de las vías respiratorias superiores
J11|Influenza
J12|Neumonía viral
J13|Neumonía por Streptococcus pneumoniae
J15|Neumonía bacteriana
J18|Neumonía, organismo no especificado
J20|Bronquitis aguda
J31|Rinitis y faringitis crónicas
J32|Sinusitis crónica
J34|Otros trastornos de la nariz y de los senos paranasales
J34.2|Desviación del tabique nasal
J35|Enfermedades crónicas de las amígdalas y adenoides
J38|Enfermedades de las cuerdas vocales y de la laringe
J38.0|Parálisis de las cuerdas vocales
J40|Bronquitis no especificada
J41|Bronquitis crónica simple y mucopurulenta
J43|Enfisema
J44|Enfermedad pulmonar obstructiva crónica
J44.1|EPOC con exacerbación aguda
J45|Asma
J45.9|Asma no especificada
J46|Estado asmático
J47|Bronquiectasias
J60|Neumoconiosis
J69|Neumonitis por sólidos y líquidos (aspiración)
J80|Síndrome de dificultad respiratoria del adulto
J81|Edema pulmonar
J84|Otras enfermedades pulmonares intersticiales
J86|Piotórax
J90|Derrame pleural
J93|Neumotórax
J93.0|Neumotórax espontáneo a tensión
J95|Trastornos respiratorios consecutivos a procedimientos
J96|Insuficiencia respiratoria
J96.0|Insuficiencia respiratoria aguda
J98|Otros trastornos respiratorios

# XI - Enfermedades del sistema digestivo
K00|Trastornos del desarrollo y de la erupción de los dientes
K02|Caries dental
K04|Enfermedades de la pulpa y de los tejidos periapicales
K05|Gingivitis y enfermedades periodontales
K07|Anomalías dentofaciales (maloclusión)
K08|Otros trastornos de los dientes y sus estructuras
K11|Enfermedades de las glándulas salivales
K12|Estomatitis
K13|Otras enfermedades de los labios y de la mucosa bucal
K20|Esofagitis
K21|Enfermedad por reflujo gastroesofágico
K22|Otras enfermedades del esófago
K22.2|Obstrucción del esófago
K25|Úlcera gástrica
K26|Úlcera duodenal
K27|Úlcera péptica de sitio no especificado
K29|Gastritis y duodenitis
K30|Dispepsia
K31|Otras enfermedades del estómago y del duodeno
K35|Apendicitis aguda
K36|Otras apendicitis
K37|Apendicitis no especificada
K40|Hernia inguinal
K41|Hernia femoral (crural)
K42|Hernia umbilical
K43|Hernia ventral / eventración
K44|Hernia diafragmática (hiatal)
K45|Otras hernias de la cavidad abdominal
K46|Hernia no especificada de la cavidad abdominal
K50|Enfermedad de Crohn
K51|Colitis ulcerosa
K52|Otras colitis y gastroenteritis no infecciosas
K55|Trastornos vasculares del intestino (isquemia mesentérica)
K56|Íleo paralítico y obstrucción intestinal sin hernia
K56.6|Obstrucción intestinal no especificada
K57|Enfermedad diverticular del intestino
K58|Síndrome del colon irritable
K59|Otros trastornos funcionales del intestino
K60|Fisura y fístula de las regiones anal y rectal
K61|Absceso de las regiones anal y rectal
K62|Otras enfermedades del ano y del recto
K63|Otras enfermedades del intestino
K64|Hemorroides y trombosis venosa perianal
K65|Peritonitis
K66|Otros trastornos del peritoneo
K70|Enfermedad hepática alcohólica
K72|Insuficiencia hepática
K74|Fibrosis y cirrosis del hígado
K75|Otras enfermedades inflamatorias del hígado
K76|Otras enfermedades del hígado
K76.0|Hígado graso no alcohólico
K80|Colelitiasis
K80.0|Colelitiasis con colecistitis aguda
K80.5|Coledocolitiasis
K81|Colecistitis
K82|Otras enfermedades de la vesícula biliar
K83|Otras enfermedades de las vías biliares
K85|Pancreatitis aguda
K86|Otras enfermedades del páncreas
K86.1|Pancreatitis crónica
K91|Trastornos del sistema digestivo consecutivos a procedimientos
K92|Otras enfermedades del sistema digestivo (hemorragia digestiva)

# XII - Enfermedades de la piel y del tejido subcutáneo
L02|Absceso cutáneo, furúnculo y ántrax
L03|Celulitis
L05|Quiste pilonidal
L08|Otras infecciones locales de la piel
L20|Dermatitis atópica
L27|Dermatitis por sustancias ingeridas
L30|Otras dermatitis
L40|Psoriasis
L50|Urticaria
L51|Eritema multiforme (Stevens-Johnson)
L57|Cambios cutáneos por radiación ultravioleta
L72|Quistes foliculares de la piel (sebáceo)
L73|Otros trastornos foliculares (hidrosadenitis)
L84|Callos y callosidades
L89|Úlcera por presión
L90|Trastornos atróficos de la piel
L91|Trastornos hipertróficos de la piel (queloide)
L97|Úlcera de miembro inferior
L98|Otros trastornos de la piel

# XIII - Sistema osteomuscular y tejido conjuntivo
M05|Artritis reumatoide seropositiva
M06|Otras artritis reumatoides
M10|Gota
M13|Otras artritis
M15|Poliartrosis
M16|Coxartrosis (artrosis de cadera)
M17|Gonartrosis (artrosis de rodilla)
M19|Otras artrosis
M20|Deformidades adquiridas de los dedos (hallux valgus)
M21|Otras deformidades adquiridas de los miembros
M23|Trastorno interno de la rodilla (lesión meniscal)
M24|Otros trastornos articulares específicos
M25|Otros trastornos articulares
M32|Lupus eritematoso sistémico
M33|Dermatopolimiositis
M34|Esclerosis sistémica
M35|Otros trastornos del tejido conjuntivo
M40|Cifosis y lordosis
M41|Escoliosis
M43|Otras dorsopatías deformantes (espondilolistesis)
M45|Espondilitis anquilosante
M46|Otras espondilopatías inflamatorias
M47|Espondilosis
M48|Otras espondilopatías (estenosis del canal)
M50|Trastornos de disco cervical
M51|Otros trastornos de discos intervertebrales
M51.1|Hernia de disco lumbar con radiculopatía
M53|Otras dorsopatías
M54|Dorsalgia
M54.5|Lumbago
M65|Sinovitis y tenosinovitis
M65.3|Dedo en gatillo
M66|Ruptura espontánea de sinovia y tendón
M67|Otros trastornos de la sinovia y del tendón
M70|Trastornos de tejidos blandos relacionados con el uso
M71|Otras bursopatías
M72|Trastornos fibroblásticos (Dupuytren)
M75|Lesiones del hombro
M75.1|Síndrome del manguito rotador
M76|Entesopatías del miembro inferior
M77|Otras entesopatías (epicondilitis)
M79|Otros trastornos de los tejidos blandos
M80|Osteoporosis con fractura patológica
M81|Osteoporosis sin fractura patológica
M84|Trastornos de la continuidad del hueso (seudoartrosis)
M85|Otros trastornos de la densidad y estructura óseas
M86|Osteomielitis
M87|Osteonecrosis
M96|Trastornos osteomusculares consecutivos a procedimientos

# XIV - Enfermedades del sistema genitourinario
N02|Hematuria recurrente y persistente
N03|Síndrome nefrítico crónico
N04|Síndrome nefrótico
N10|Nefritis tubulointersticial aguda (pielonefritis)
N11|Nefritis tubulointersticial crónica
N13|Uropatía obstructiva y por reflujo
N17|Insuficiencia renal aguda
N18|Enfermedad renal crónica
N18.5|Enfermedad renal crónica estadio 5
N18.6|Enfermedad renal terminal en diálisis
N19|Insuficiencia renal no especificada
N20|Cálculo del riñón y del uréter
N21|Cálculo de las vías urinarias inferiores
N23|Cólico renal no especificado
N28|Otros trastornos del riñón y del uréter
N30|Cistitis
N32|Otros trastornos de la vejiga
N39|Otros trastornos del sistema urinario
N39.0|Infección de vías urinarias, sitio no especificado
N40|Hiperplasia de la próstata
N41|Enfermedades inflamatorias de la próstata
N43|Hidrocele y espermatocele
N44|Torsión del testículo
N45|Orquitis y epididimitis
N47|Prepucio redundante, fimosis y parafimosis
N48|Otros trastornos del pene
N50|Otros trastornos de los órganos genitales masculinos
N60|Displasia mamaria benigna
N61|Trastornos inflamatorios de la mama
N63|Masa no especificada en la mama
N64|Otros trastornos de la mama
N70|Salpingitis y ooforitis
N71|Enfermedad inflamatoria del útero
N73|Otras enfermedades pélvicas inflamatorias femeninas
N80|Endometriosis
N81|Prolapso genital femenino
N83|Trastornos no inflamatorios del ovario y de la trompa
N83.2|Quiste de ovario
N84|Pólipo del tracto genital femenino
N85|Otros trastornos no inflamatorios del útero
N87|Displasia del cuello uterino
N88|Otros trastornos no inflamatorios del cuello uterino
N91|Amenorrea y oligomenorrea
N92|Menstruación excesiva, frecuente e irregular
N93|Otras hemorragias uterinas y vaginales anormales
N95|Trastornos menopáusicos
N97|Infertilidad femenina

# XV - Embarazo, parto y puerperio
O00|Embarazo ectópico
O02|Otros productos anormales de la concepción
O03|Aborto espontáneo
O04|Aborto médico
O10|Hipertensión preexistente que complica el embarazo
O11|Trastorno hipertensivo preexistente con preeclampsia sobreagregada
O13|Hipertensión gestacional
O14|Preeclampsia
O14.1|Preeclampsia severa
O14.2|Síndrome HELLP
O15|Eclampsia
O21|Vómitos excesivos en el embarazo (hiperemesis)
O24|Diabetes mellitus en el embarazo
O24.4|Diabetes mellitus gestacional
O26|Otras afecciones relacionadas con el embarazo
O30|Embarazo múltiple
O32|Presentación fetal anormal
O33|Desproporción cefalopélvica
O34|Anomalía de los órganos pelvianos maternos
O34.2|Cicatriz uterina por cirugía previa
O36|Otros problemas fetales que afectan a la madre
O41|Otros trastornos del líquido amniótico y las membranas
O42|Ruptura prematura de membranas
O44|Placenta previa
O43|Trastornos placentarios (acretismo)
O45|Desprendimiento prematuro de placenta
O47|Falso trabajo de parto
O48|Embarazo prolongado
O60|Parto prematuro
O62|Anomalías de la dinámica del trabajo de parto
O63|Trabajo de parto prolongado
O64|Trabajo de parto obstruido por mala posición fetal
O68|Trabajo de parto complicado por sufrimiento fetal
O69|Trabajo de parto complicado por problemas del cordón
O70|Desgarro perineal durante el parto
O71|Otro trauma obstétrico (rotura uterina)
O72|Hemorragia postparto
O74|Complicaciones de la anestesia durante el parto
O75|Otras complicaciones del trabajo de parto y del parto
O80|Parto único espontáneo
O82|Parto único por cesárea
O85|Sepsis puerperal
O86|Otras infecciones puerperales
O88|Embolia obstétrica
O89|Complicaciones de la anestesia durante el puerperio
O99|Otras enfermedades maternas clasificables en otra parte

# XVI-XVII - Perinatal y malformaciones congénitas
P07|Trastornos por prematuridad y bajo peso al nacer
P21|Asfixia del nacimiento
P22|Dificultad respiratoria del recién nacido
P29|Trastornos cardiovasculares del período perinatal
P59|Ictericia neonatal
Q02|Microcefalia
Q03|Hidrocéfalo congénito
Q05|Espina bífida
Q21|Malformaciones congénitas de los tabiques cardíacos
Q21.0|Comunicación interventricular
Q21.1|Comunicación interauricular
Q21.3|Tetralogía de Fallot
Q23|Malformaciones congénitas de las válvulas aórtica y mitral
Q25|Malformaciones congénitas de las grandes arterias
Q25.0|Conducto arterioso persistente
Q31|Malformaciones congénitas de la laringe
Q35|Fisura del paladar
Q37|Fisura del paladar con labio leporino
Q39|Malformaciones congénitas del esófago (atresia/fístula)
Q40|Otras malformaciones congénitas del tracto digestivo superior
Q42|Ausencia, atresia y estenosis congénitas del intestino grueso
Q43|Otras malformaciones congénitas del intestino
Q53|Testículo no descendido (criptorquidia)
Q54|Hipospadias
Q62|Defectos obstructivos congénitos de la pelvis renal
Q65|Deformidades congénitas de la cadera
Q66|Deformidades congénitas de los pies (pie bot)
Q67|Deformidades osteomusculares congénitas de cabeza y tórax
Q75|Otras malformaciones congénitas de huesos de cráneo y cara
Q77|Osteocondrodisplasia (acondroplasia)
Q78|Otras osteocondrodisplasias (osteogénesis imperfecta)
Q79|Malformaciones congénitas del sistema osteomuscular
Q79.0|Hernia diafragmática congénita
Q87|Otros síndromes de malformaciones congénitas
Q87.4|Síndrome de Marfan
Q90|Síndrome de Down
Q96|Síndrome de Turner

# XVIII - Síntomas, signos y hallazgos anormales
R00|Anormalidades del latido cardíaco
R04|Hemorragia de las vías respiratorias
R05|Tos
R06|Anormalidades de la respiración
R06.0|Disnea
R07|Dolor de garganta y en el pecho
R09|Otros síntomas del sistema circulatorio y respiratorio
R10|Dolor abdominal y pélvico
R11|Náuseas y vómitos
R13|Disfagia
R14|Flatulencia
R16|Hepatomegalia y esplenomegalia
R17|Ictericia no especificada
R18|Ascitis
R19|Otros síntomas del aparato digestivo
R22|Tumefacción o masa localizada
R31|Hematuria no especificada
R33|Retención de orina
R35|Poliuria
R39|Otros síntomas del sistema urinario
R40|Somnolencia, estupor y coma
R41|Otros síntomas del conocimiento y la percepción
R42|Mareo y desvanecimiento
R45|Síntomas concernientes al estado emocional
R50|Fiebre de origen desconocido
R51|Cefalea
R52|Dolor no clasificado en otra parte
R53|Malestar, fatiga y astenia
R54|Senilidad / fragilidad
R55|Síncope y colapso
R56|Convulsiones
R57|Choque no clasificado en otra parte
R57.0|Choque cardiogénico
R57.1|Choque hipovolémico
R58|Hemorragia no clasificada en otra parte
R60|Edema no clasificado en otra parte
R63|Síntomas concernientes a la alimentación
R64|Caquexia
R73|Nivel elevado de glucosa en sangre
R77|Otras anormalidades de las proteínas plasmáticas
R79|Otros hallazgos anormales de la química sanguínea
R91|Hallazgos anormales en diagnóstico por imagen del pulmón
R94|Resultados anormales de estudios funcionales

# XIX - Traumatismos, envenenamientos y causas externas
S00|Traumatismo superficial de la cabeza
S01|Herida de la cabeza
S02|Fractura de huesos del cráneo y de la cara
S02.6|Fractura del maxilar inferior
S06|Traumatismo intracraneal
S06.5|Hematoma subdural traumático
S06.4|Hematoma epidural
S12|Fractura del cuello (columna cervical)
S13|Luxación y esguince de articulaciones del cuello
S14|Traumatismo de la médula y nervios cervicales
S22|Fractura de las costillas, esternón y columna torácica
S27|Traumatismo de otros órganos intratorácicos
S32|Fractura de la columna lumbar y de la pelvis
S32.0|Fractura de vértebra lumbar
S36|Traumatismo de órganos intraabdominales
S36.0|Traumatismo del bazo
S37|Traumatismo de órganos urinarios y pélvicos
S42|Fractura del hombro y del brazo
S42.0|Fractura de la clavícula
S42.2|Fractura de la extremidad superior del húmero
S43|Luxación y esguince de la cintura escapular
S52|Fractura del antebrazo
S52.5|Fractura de la extremidad distal del radio
S60|Traumatismo superficial de la muñeca y de la mano
S61|Herida de la muñeca y de la mano
S62|Fractura a nivel de la muñeca y de la mano
S66|Traumatismo de tendón y músculo de la muñeca y la mano
S72|Fractura del fémur
S72.0|Fractura del cuello del fémur
S72.1|Fractura pertrocantérea
S72.3|Fractura de la diáfisis del fémur
S82|Fractura de la pierna, incluido el tobillo
S82.1|Fractura de la extremidad proximal de la tibia
S82.6|Fractura del maléolo externo
S83|Luxación y esguince de la rodilla
S83.2|Desgarro de menisco
S83.5|Esguince del ligamento cruzado de la rodilla
S86|Traumatismo de tendón y músculo de la pierna (aquíleo)
S92|Fractura del pie
T07|Traumatismos múltiples no especificados
T14|Traumatismo de región no especificada del cuerpo
T17|Cuerpo extraño en las vías respiratorias
T18|Cuerpo extraño en el tubo digestivo
T20|Quemadura de la cabeza y del cuello
T21|Quemadura del tronco
T22|Quemadura del hombro y del miembro superior
T24|Quemadura de la cadera y del miembro inferior
T31|Quemaduras clasificadas según la extensión
T40|Envenenamiento por narcóticos y psicodislépticos
T41|Envenenamiento por anestésicos y gases terapéuticos
T42|Envenenamiento por antiepilépticos y sedantes
T50|Envenenamiento por otras drogas y sustancias
T78|Efectos adversos no clasificados en otra parte
T78.0|Choque anafiláctico por alimentos
T78.2|Choque anafiláctico no especificado
T79|Complicaciones precoces de traumatismos
T80|Complicaciones consecutivas a infusión y transfusión
T81|Complicaciones de procedimientos no clasificadas en otra parte
T81.0|Hemorragia y hematoma que complican un procedimiento
T81.4|Infección consecutiva a un procedimiento
T82|Complicaciones de dispositivos cardíacos y vasculares
T84|Complicaciones de dispositivos ortopédicos internos
T85|Complicaciones de otros dispositivos protésicos internos
T88|Otras complicaciones de la atención médica
T88.2|Choque debido a la anestesia
T88.3|Hipertermia maligna debida a la anestesia
T88.4|Intubación fallida o difícil
T88.5|Otras complicaciones de la anestesia
T88.6|Choque anafiláctico por medicamento correctamente administrado

# XXI - Factores que influyen en el estado de salud
Z01|Otros exámenes especiales e investigaciones
Z01.8|Examen preoperatorio
Z03|Observación médica por sospecha de enfermedades
Z30|Atención para la anticoncepción
Z34|Supervisión de embarazo normal
Z38|Nacidos vivos según lugar de nacimiento
Z41|Procedimientos para propósitos distintos del cuidado de la salud
Z42|Cuidados posteriores a cirugía plástica
Z43|Atención de orificios artificiales
Z45|Ajuste y manejo de dispositivo implantado
Z45.0|Control de marcapasos cardíaco
Z47|Otros cuidados posteriores a la ortopedia
Z48|Otros cuidados posteriores a la cirugía
Z51|Otra atención médica (quimioterapia, radioterapia)
Z71|Consulta para asesoramiento médico
Z79|Uso prolongado de medicamentos
Z79.01|Uso prolongado de anticoagulantes
Z79.4|Uso prolongado de insulina
Z79.52|Uso prolongado de corticoides sistémicos
Z87|Historia personal de otras enfermedades
Z88|Historia personal de alergia a medicamentos
Z88.4|Historia personal de alergia a anestésicos
Z90|Ausencia adquirida de órganos
Z92|Historia personal de tratamiento médico
Z94|Órgano y tejido trasplantado
Z95|Presencia de implantes cardíacos y vasculares
Z95.0|Presencia de marcapasos cardíaco
Z95.5|Presencia de implante y stent coronario
Z96|Presencia de otros implantes funcionales
Z97|Presencia de otros dispositivos
Z98|Otros estados postquirúrgicos
Z99|Dependencia de máquinas y dispositivos capacitantes
Z99.2|Dependencia de diálisis renal
`;
