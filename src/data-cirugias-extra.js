/* =========================================================================
   CIRUGIAS - Ampliacion del catalogo (segunda tanda)
   Mismo formato que data-cirugias.js: Nombre|UA, con # de especialidad.
   ========================================================================= */
const CIRUGIAS_TXT_EXTRA = `
# Cirugía General
Biopsia ganglionar cervical|7
Biopsia ganglionar axilar|7
Biopsia ganglionar inguinal|7
Exéresis de lipoma|6
Exéresis de quiste sebáceo|5
Onicectomía|4
Escisión de uña encarnada|4
Toilette de pie diabético|10
Necrosectomía pancreática|26
Marsupialización de seudoquiste pancreático|20
Colecistostomía percutánea|8
Derivación biliodigestiva|22
Hepatoyeyunostomía|24
Resección de tumor retroperitoneal|24
Linfadenectomía retroperitoneal|24
Peritonectomía con HIPEC|34
Relaparotomía programada|18
Cierre temporal de abdomen (bolsa de Bogotá)|14
Cierre de abdomen abierto|18
Reconstrucción de tránsito intestinal|20
Ileostomía|14
Cierre de ileostomía|14
Resección local de tumor de recto (TEM)|18
Ostomía de descarga por peritonitis|16
Hernia de Spiegel|12
Hernia lumbar|12
Hernia obturatriz|14
Reparación de hernia paraestomal|16
Cirugía de reflujo con malla|18
Cardiomiotomía de Heller|20
Esofagectomía transhiatal|32
Gastrectomía atípica (GIST)|18
Vaciamiento ganglionar axilar|14
Biopsia de ganglio centinela|10
Mastectomía profiláctica bilateral|20
Cirugía oncoplástica de mama|16
Tiroidectomía con vaciamiento central|18
Reintervención por hematoma cervical|14
Traqueostomía percutánea|8
Toracostomía de urgencia|8
Punción-drenaje de colección intraabdominal|8
Colocación de catéter de Tenckhoff|8
Retiro de catéter de diálisis peritoneal|6
Retiro de port-a-cath|6
Injerto de piel en quemado|14
Desbridamiento de fascitis necrotizante|18
Amputación transmetatarsiana|10
Desarticulación de cadera|20
Cirugía de hidatidosis pulmonar|22

# Traumatología y Ortopedia
Artroplastia total de codo|18
Artroplastia total de tobillo|18
Hemiartroplastia de hombro|16
Osteosíntesis de fractura de escápula|14
Osteosíntesis de fractura de olécranon|10
Osteosíntesis de fractura de meseta tibial|16
Osteosíntesis de fractura de pilón tibial|16
Osteosíntesis de fractura de astrágalo|12
Osteosíntesis de fractura de metacarpianos|8
Osteosíntesis de fractura de falanges|7
Osteosíntesis de fractura de escafoides|10
Fijación externa de urgencia|12
Reducción abierta de luxación de hombro|10
Estabilización de hombro (Latarjet)|14
Reparación de luxación acromioclavicular|12
Tenodesis del bíceps|12
Reparación del tendón de Aquiles|12
Reparación del manguito rotador a cielo abierto|14
Osteotomía tibial valguizante|16
Osteotomía femoral|16
Artrodesis de muñeca|12
Artrodesis subastragalina|14
Artroscopía de cadera|14
Reemplazo de disco cervical|20
Corticotomía y transporte óseo|18
Injerto óseo de cresta ilíaca|12
Resección de exostosis|10
Alargamiento de tendón|10
Transferencia tendinosa|14
Liberación de contractura muscular|12
Cirugía de mano en parálisis cerebral|14
Reducción de fractura pediátrica bajo anestesia|8
Enclavijado percutáneo en fractura pediátrica|10
Epifisiodesis|12
Cirugía de displasia de cadera infantil|16
Tenotomía de aductores|10
Extracción de cuerpo extraño en partes blandas|6
Punción articular diagnóstica bajo anestesia|5
Infiltración articular bajo sedación|5

# Ginecología y Obstetricia
Histerectomía radical laparoscópica|26
Linfadenectomía pelviana|20
Omentectomía por cáncer de ovario|24
Citorreducción en cáncer de ovario|30
Traquelectomía|18
Exenteración pelviana|34
Salpingooforectomía bilateral profiláctica|14
Resección de endometriosis profunda|22
Adhesiolisis pelviana|14
Fulguración de focos endometriósicos|12
Polipectomía endometrial|8
Ablación endometrial|10
Colocación de DIU bajo anestesia|5
Extracción de DIU migrado|8
Reparación de fístula vesicovaginal|18
Reparación de fístula rectovaginal|18
Neosalpingostomía|16
Colpocleisis|12
Himenectomía|6
Biopsia vulvar|5
Drenaje de hematoma de la pared vaginal|8
Legrado por aborto incompleto|6
Aspiración manual endouterina|6
Cesárea con placenta acreta|22
Cesárea gemelar|12
Parto en presentación podálica asistido|10
Extracción manual de placenta|8
Taponamiento uterino con balón|10
Histerectomía obstétrica de urgencia|22
Reparación de rotura uterina|20

# Urología
Cistolitotomía|12
Cistectomía parcial|18
Ureterocistoneostomía|18
Ureteroureterostomía|18
Derivación urinaria tipo Bricker|28
Neovejiga ortotópica|32
Prostatectomía radical robótica|26
Enucleación prostática con láser (HoLEP)|14
Vaporización prostática|12
Biopsia renal percutánea|7
Nefroureterectomía|24
Suprarrenalectomía abierta|22
Linfadenectomía retroperitoneal por tumor testicular|24
Implante de prótesis peneana|16
Corrección de incurvación peneana|12
Reducción de parafimosis|5
Exploración escrotal por torsión|10
Orquiectomía radical|12
Espermatocelectomía|8
Vasovasostomía|14
Uretrostomía perineal|14
Meatotomía|6
Colocación de esfínter urinario artificial|18
Inyección endoscópica de toxina botulínica vesical|8
Litotricia con láser|12
Cambio de catéter doble J|6
Cistectomía radical laparoscópica|32

# Otorrinolaringología
Septoplastia con turbinoplastia|12
Etmoidectomía|14
Cirugía de fístula de líquido cefalorraquídeo nasal|18
Descompresión orbitaria|18
Dacriocistorrinostomía endoscópica|12
Cirugía del nervio facial|18
Timpanoplastia con mastoidectomía|16
Estapedotomía|12
Neurectomía vestibular|20
Extirpación de neurinoma del acústico|30
Glosectomía parcial|16
Faringolaringectomía|28
Diverticulectomía de Zenker|18
Cordectomía por láser|12
Inyección de cuerda vocal|8
Dilatación traqueal|10
Resección traqueal con anastomosis|26
Cirugía de estenosis subglótica pediátrica|20
Extracción de cuerpo extraño esofágico|10
Adenoidectomía con radiofrecuencia|8
Biopsia de masa cervical|8
Tiroplastia|14
Cirugía endoscópica de la base del cráneo|26

# Oftalmología
Facoemulsificación bilateral secuencial|12
Cirugía combinada catarata + glaucoma|14
Vitrectomía + endoláser|16
Retinopexia neumática|10
Cerclaje escleral + vitrectomía|18
Cirugía de membrana epirretiniana|14
Cirugía de agujero macular|14
Capsulotomía quirúrgica|7
Recambio de lente intraocular|10
Cirugía de catarata congénita|12
Trabeculotomía en glaucoma congénito|12
Cirugía de retinopatía del prematuro|14
Reparación de herida corneal|12
Extracción de cuerpo extraño intraocular|16
Exenteración orbitaria|20
Cirugía de tumor orbitario|20
Reconstrucción palpebral|12
Tarsorrafia|7
Crioterapia retiniana|8
Fotocoagulación bajo anestesia|7

# Cirugía Plástica y Reparadora
Expansión tisular: colocación de expansor|14
Retiro de expansor y reconstrucción|16
Colgajo TRAM|26
Colgajo DIEP|28
Colgajo dorsal ancho|22
Colgajo libre de peroné|30
Colgajo anterolateral de muslo|26
Reconstrucción de pabellón auricular|18
Reconstrucción nasal con colgajo frontal|18
Braquioplastia|14
Cruroplastia|14
Lipoinjerto|12
Gluteoplastia|16
Cirugía de contorno corporal poscirugía bariátrica|22
Reconstrucción de pared abdominal compleja|22
Cierre de úlcera por presión con colgajo|18
Escarectomía tangencial extensa|20
Liberación de bridas cicatrizales|14
Cirugía de afirmación de género (mastectomía)|18
Cirugía de afirmación de género (genital)|30
Microcirugía de nervio periférico|20
Neurorrafia|16

# Neurocirugía
Craneotomía por metástasis cerebral|26
Craneotomía en paciente despierto|30
Resección de meningioma de la base del cráneo|32
Cirugía de glioma con neuronavegación|30
Embolización endovascular de aneurisma|26
Trombectomía mecánica en ACV|26
Endarterectomía carotídea bajo bloqueo cervical|22
Descompresión de fosa posterior|24
Cirugía de neuralgia del trigémino|22
Rizotomía|18
Colocación de bomba de baclofeno|16
Estimulador medular para dolor crónico|16
Derivación lumboperitoneal|14
Reparación de fístula de LCR|18
Cirugía de craneosinostosis|24
Cirugía de tumor de fosa posterior pediátrico|30
Corpectomía cervical|24
Artrodesis occipitocervical|26
Cifoplastia con balón|12
Cirugía de escoliosis neuromuscular|32

# Cirugía Cardiovascular y Torácica
Cirugía valvular mínimamente invasiva|38
Ablación quirúrgica de fibrilación auricular (Maze)|42
Reparación de aneurisma del ventrículo izquierdo|42
Trasplante cardíaco|50
Asistencia ventricular: implante|46
ECMO: canulación|30
Cierre de foramen oval percutáneo|18
Valvuloplastia mitral percutánea|18
MitraClip|24
Endarterectomía pulmonar|46
Cirugía de coartación de aorta|38
Operación de Fontan|44
Operación de Glenn|40
Switch arterial|48
Banding de arteria pulmonar|32
Toracoscopía diagnóstica|14
Simpatectomía torácica videoasistida|16
Resección de tumor de la pared torácica|24
Corrección de pectus excavatum (Nuss)|22
Plicatura diafragmática|20
Trasplante pulmonar|50
Traqueobroncoplastia|28
Lavado broncoalveolar terapéutico|12

# Endoscopía y procedimientos fuera de quirófano (NORA)
Colangioscopía|14
Enteroscopía de doble balón|14
Cápsula endoscópica con sedación|5
Manometría bajo sedación|5
Colocación de prótesis esofágica|12
Colocación de prótesis colónica|12
Disección endoscópica submucosa|16
Mucosectomía endoscópica|14
Hemostasia endoscópica de urgencia|12
Gastrostomía radiológica|8
Angiografía diagnóstica|8
Embolización arterial|16
Quimioembolización hepática|18
Ablación por radiofrecuencia de tumor|16
Drenaje biliar percutáneo|12
Punción lumbar bajo anestesia|5
Mielografía bajo sedación|6
Biopsia de médula ósea bajo sedación|6
Cardioversión programada|5
Ecocardiograma transesofágico bajo sedación|7
Implante de marcapasos transitorio|8
Estudio del sueño bajo sedación|5
Bloqueo de plexo celíaco|10
Bloqueo simpático lumbar|10
Bloqueo epidural de esteroides|8
Radiofrecuencia de facetas articulares|10
Infiltración de puntos gatillo|6
Colocación de reservorio de morfina intratecal|14
Vertebroplastia percutánea|12
Anestesia para procedimiento odontológico pediátrico|10

# Cirugía Pediátrica
Colecistectomía laparoscópica pediátrica|12
Fundoplicatura pediátrica|18
Gastrostomía pediátrica|10
Resección intestinal neonatal|22
Enterocolitis necrotizante: laparotomía|24
Corrección de atresia de vías biliares (Kasai)|26
Corrección de atresia duodenal|22
Quiste de colédoco: resección|24
Nefrostomía pediátrica|12
Pieloplastia pediátrica|18
Reimplante ureteral pediátrico|20
Extracción de cuerpo extraño en vía aérea pediátrica|12
Broncoscopía pediátrica|10
Toracoscopía pediátrica|18
Corrección de pectus carinatum|20
Exéresis de teratoma sacrococcígeo|24
Biopsia de tumor abdominal pediátrico|14
Nefroblastoma: nefrectomía|22
Punción de médula ósea pediátrica|5
Colocación de catéter implantable pediátrico|10
Curaciones de quemados pediátricos|8
Circuncisión con anestesia general|7
Hernia inguinal laparoscópica pediátrica|10

# Otros / Multidisciplinario
Anestesia para resonancia en paciente pediátrico|8
Anestesia para tomografía en paciente crítico|8
Traslado de paciente crítico con soporte anestésico|12
Reanimación cardiopulmonar avanzada|10
Intubación de urgencia fuera de quirófano|8
Manejo de vía aérea difícil programada|14
Analgesia epidural para pancreatitis|10
Bloqueo antálgico en dolor oncológico|10
Sedación paliativa|8
Punción arterial y colocación de línea|6
Colocación de vía venosa central ecoguiada|8
Colocación de catéter de arteria pulmonar|12
Cirugía simultánea de dos especialidades|26
Reintervención no programada|18
Donante en muerte encefálica: mantenimiento|20
`;
