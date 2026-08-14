/* =========================================================================
   CATALOGO DE CIRUGIAS POR ESPECIALIDAD
   Formato: Nombre del procedimiento|UA
   UA = unidades anestesicas sugeridas (base del nomenclador anestesiologico
   argentino, AAARBA/FAAAAR). Son orientativas y editables por el usuario en
   cada ficha; el coordinador puede redefinir el valor de la unidad por
   financiador desde Catalogos.
   Las lineas que empiezan con # definen la especialidad vigente.
   ========================================================================= */
const CIRUGIAS_TXT = `
# Cirugía General
Apendicectomía convencional|8
Apendicectomía laparoscópica|10
Colecistectomía convencional|10
Colecistectomía laparoscópica|12
Colecistectomía laparoscópica + colangiografía|14
Exploración de vía biliar|16
Hernioplastia inguinal unilateral|8
Hernioplastia inguinal bilateral|10
Hernioplastia inguinal laparoscópica (TAPP/TEP)|12
Hernioplastia umbilical|7
Hernioplastia epigástrica|7
Eventroplastia con malla|12
Eventroplastia laparoscópica|14
Hernioplastia crural|8
Laparotomía exploradora|14
Laparoscopía diagnóstica|8
Laparotomía por abdomen agudo|16
Gastrectomía subtotal|20
Gastrectomía total|24
Gastrostomía|8
Yeyunostomía|8
Resección de intestino delgado|16
Hemicolectomía derecha|18
Hemicolectomía izquierda|18
Sigmoidectomía|18
Resección anterior de recto|22
Amputación abdominoperineal|24
Colostomía|12
Cierre de colostomía|14
Colectomía total|24
Esplenectomía|16
Esplenectomía laparoscópica|18
Hepatectomía parcial|26
Quiste hidatídico hepático|20
Pancreatectomía distal|24
Duodenopancreatectomía cefálica (Whipple)|32
Adrenalectomía laparoscópica|18
Tiroidectomía total|14
Tiroidectomía subtotal / lobectomía|12
Paratiroidectomía|14
Vaciamiento ganglionar cervical|18
Mastectomía radical modificada|16
Mastectomía simple|12
Tumorectomía de mama|8
Tumorectomía de mama + ganglio centinela|12
Biopsia de mama|6
Drenaje de absceso superficial|5
Drenaje de absceso profundo|8
Exéresis de lesión de partes blandas|6
Exéresis de quiste sacrocoxígeo|8
Fistulectomía anal|8
Hemorroidectomía|8
Esfinterotomía anal|7
Drenaje de absceso perianal|6
Cirugía de sinus pilonidal|8
Traqueostomía|10
Toracocentesis / drenaje pleural|6
Gastroyeyuno anastomosis|18
Vagotomía y piloroplastia|18
Bypass gástrico laparoscópico|22
Gastrectomía en manga (sleeve)|20
Banda gástrica ajustable|16
Funduplicatura de Nissen laparoscópica|18
Cirugía de control de daños|24
Nefrectomía por trauma|22
Reparación de víscera hueca por trauma|20
Colocación de catéter de diálisis peritoneal|8
Colocación de port-a-cath|8
Acceso venoso central tunelizado|8
Amputación supracondílea de miembro inferior|14
Amputación infracondílea|12
Amputación de dedos|6
Toilette quirúrgica de partes blandas|8
Fasciotomía|10

# Traumatología y Ortopedia
Osteosíntesis de fractura de cadera (clavo endomedular)|14
Osteosíntesis de fractura de cadera (DHS)|14
Artroplastia total de cadera|18
Artroplastia parcial de cadera|16
Revisión de artroplastia de cadera|24
Artroplastia total de rodilla|18
Revisión de artroplastia de rodilla|24
Artroplastia total de hombro|18
Artroscopía de rodilla diagnóstica|8
Meniscectomía artroscópica|10
Plástica de ligamento cruzado anterior|14
Plástica de ligamento cruzado posterior|16
Artroscopía de hombro|12
Reparación artroscópica del manguito rotador|14
Acromioplastia|12
Artroscopía de tobillo|10
Osteosíntesis de fractura de fémur diafisario|16
Osteosíntesis de fractura de tibia|14
Osteosíntesis de fractura de tobillo|12
Osteosíntesis de fractura de húmero|12
Osteosíntesis de fractura de antebrazo|10
Osteosíntesis de fractura de radio distal|10
Osteosíntesis de fractura de clavícula|10
Osteosíntesis de fractura de patela|10
Osteosíntesis de fractura de calcáneo|12
Osteosíntesis de fractura de pelvis|20
Osteosíntesis de fractura expuesta|16
Reducción cerrada e inmovilización|6
Retiro de material de osteosíntesis|8
Artrodesis de tobillo|14
Artrodesis de columna lumbar (2 niveles)|22
Artrodesis de columna cervical|20
Discectomía lumbar|14
Laminectomía descompresiva|16
Corrección de escoliosis con instrumentación|30
Vertebroplastia / cifoplastia|12
Hallux valgus (osteotomía)|10
Cirugía del pie plano|12
Corrección de pie bot|12
Tenorrafia|8
Liberación del túnel carpiano|6
Cirugía de dedo en gatillo|5
Fasciectomía palmar (Dupuytren)|10
Sinovectomía|10
Biopsia ósea|6
Toilette de artritis séptica|10
Limpieza quirúrgica de osteomielitis|12
Alargamiento óseo / fijador externo|16
Tumor óseo: resección y reconstrucción|26
Reducción de luxación bajo anestesia|6
Manipulación articular bajo anestesia|6

# Ginecología
Histerectomía abdominal total|16
Histerectomía vaginal|14
Histerectomía laparoscópica|18
Histerectomía radical (Wertheim)|24
Miomectomía abdominal|16
Miomectomía laparoscópica|18
Miomectomía histeroscópica|10
Anexectomía / ooforectomía|12
Quistectomía de ovario laparoscópica|14
Salpingectomía por embarazo ectópico|14
Ligadura tubaria laparoscópica|10
Ligadura tubaria por minilaparotomía|8
Laparoscopía ginecológica diagnóstica|10
Histeroscopía diagnóstica|6
Histeroscopía quirúrgica|10
Legrado uterino / raspado evacuador|6
Legrado biópsico fraccionado|6
Conización cervical / LEEP|7
Colporrafia anterior|10
Colporrafia posterior|10
Colpoperineoplastia|12
Cirugía de incontinencia urinaria (sling TVT/TOT)|10
Colpopexia sacra laparoscópica|20
Marsupialización de quiste de Bartholino|6
Vulvectomía|14
Drenaje de absceso tuboovárico|12
Cerclaje cervical|8
Punción folicular / aspiración ovocitaria|6
Reversión de ligadura tubaria|16

# Obstetricia
Cesárea programada|10
Cesárea de urgencia|12
Cesárea + histerectomía|20
Analgesia peridural del trabajo de parto|8
Parto vaginal instrumental|8
Alumbramiento manual / revisión de cavidad|8
Legrado puerperal|8
Reparación de desgarro perineal complejo|10
Corrección de inversión uterina|14
Ligadura de arterias hipogástricas|18
Cerclaje de emergencia|10
Cerclaje uterino B-Lynch|14

# Urología
Resección transuretral de próstata (RTU-P)|12
Resección transuretral de vejiga (RTU-V)|10
Adenomectomía prostática abierta|16
Prostatectomía radical|22
Prostatectomía radical laparoscópica|24
Nefrectomía radical|20
Nefrectomía parcial|22
Nefrectomía laparoscópica|22
Pielolitotomía|16
Ureterolitotomía|14
Ureterolitotricia endoscópica|10
Litotricia extracorpórea|8
Nefrolitotomía percutánea|16
Colocación de catéter doble J|7
Cistoscopía|6
Cistoscopía con biopsia|8
Cistectomía radical con derivación|30
Ureterorrenoscopía|10
Uretrotomía interna|8
Uretroplastia|16
Orquidopexia|8
Orquiectomía|10
Varicocelectomía|8
Hidrocelectomía|8
Circuncisión|6
Vasectomía|6
Biopsia prostática transrectal|6
Nefrostomía percutánea|8
Cirugía de reflujo vesicoureteral|16
Pieloplastia|18
Trasplante renal|30

# Otorrinolaringología
Amigdalectomía|8
Adenoidectomía|7
Adenoamigdalectomía|9
Timpanoplastia|12
Miringotomía con tubos de ventilación|6
Mastoidectomía|14
Estapedectomía|12
Implante coclear|20
Septoplastia|10
Turbinoplastia|8
Rinoseptoplastia funcional|12
Cirugía endoscópica de senos paranasales (CENS)|12
Polipectomía nasal|8
Cauterización de epistaxis|6
Microcirugía de laringe|10
Laringoscopía directa diagnóstica|7
Traqueostomía por ORL|10
Laringectomía total|24
Laringectomía parcial|20
Vaciamiento cervical funcional|18
Parotidectomía|16
Submaxilectomía|12
Exéresis de quiste tirogloso|10
Exéresis de fístula branquial|12
Extracción de cuerpo extraño en vía aérea|10
Broncoscopía rígida|10
Esofagoscopía rígida|8
Uvulopalatofaringoplastia|14
Drenaje de absceso periamigdalino|7
Cirugía del ronquido con radiofrecuencia|8

# Oftalmología
Facoemulsificación con lente intraocular|8
Extracción extracapsular de catarata|9
Vitrectomía posterior|14
Cirugía de desprendimiento de retina|16
Cerclaje escleral|14
Trabeculectomía|10
Implante valvular para glaucoma|12
Iridotomía|6
Cirugía de estrabismo|10
Cirugía de pterigión|6
Dacriocistorrinostomía|10
Sondaje de vía lagrimal|5
Blefaroplastia funcional|8
Corrección de ptosis palpebral|9
Enucleación ocular|12
Evisceración ocular|12
Queratoplastia penetrante|14
Inyección intravítrea|4
Exploración de globo ocular por trauma|12
Examen oftalmológico bajo anestesia|5

# Cirugía Plástica
Injerto de piel|10
Colgajo local|12
Colgajo libre microquirúrgico|28
Escarectomía y autoinjerto en quemados|18
Abdominoplastia|16
Lipoaspiración|14
Mamoplastia de aumento|14
Mamoplastia de reducción|16
Mastopexia|14
Reconstrucción mamaria con expansor|16
Reconstrucción mamaria con colgajo|24
Ritidoplastia (lifting facial)|16
Otoplastia|8
Rinoplastia estética|12
Blefaroplastia estética|8
Corrección de cicatriz / queloide|8
Reparación de labio leporino|12
Palatoplastia|14
Reimplante digital|24
Sutura de tendones flexores de la mano|12
Sindactilia: liberación|12
Resección de tumor cutáneo con reconstrucción|10

# Neurocirugía
Craneotomía por tumor supratentorial|26
Craneotomía por tumor de fosa posterior|28
Craneotomía por hematoma epidural|22
Craneotomía por hematoma subdural agudo|22
Trepanación por hematoma subdural crónico|14
Clipado de aneurisma cerebral|30
Resección de malformación arteriovenosa|30
Derivación ventrículo-peritoneal|16
Ventriculostomía externa|12
Cirugía transesfenoidal de hipófisis|22
Biopsia estereotáxica cerebral|14
Discectomía cervical anterior con artrodesis|20
Microdiscectomía lumbar|14
Laminectomía lumbar descompresiva|16
Instrumentación transpedicular|24
Cirugía de tumor medular|26
Cirugía de epilepsia|30
Estimulación cerebral profunda|26
Craneoplastia|16
Descompresión de nervio periférico|10
Cirugía de Chiari|22
Cirugía de mielomeningocele|20

# Cirugía Cardiovascular
Cirugía de revascularización miocárdica (CRM)|40
CRM sin circulación extracorpórea|38
Reemplazo valvular aórtico|40
Reemplazo valvular mitral|40
Plástica valvular mitral|40
Doble reemplazo valvular|44
Cirugía de aorta ascendente / Bentall|48
Cirugía de disección aórtica|50
Cierre de comunicación interauricular|36
Cierre de comunicación interventricular|38
Corrección de tetralogía de Fallot|44
Ligadura de ductus arterioso|24
Implante de marcapasos definitivo|10
Implante de cardiodesfibrilador|12
Recambio de generador de marcapasos|8
TAVI (implante valvular aórtico percutáneo)|24
Pericardiectomía / ventana pericárdica|18
Trombectomía pulmonar|40
Angioplastia coronaria (soporte anestésico)|10

# Cirugía Vascular Periférica
Aneurisma de aorta abdominal: cirugía abierta|34
EVAR (endoprótesis aórtica)|22
Bypass aortobifemoral|30
Bypass femoropoplíteo|22
Bypass distal|24
Endarterectomía carotídea|22
Endarterectomía femoral|16
Embolectomía arterial|14
Angioplastia periférica|10
Safenectomía / várices unilateral|10
Safenectomía bilateral|12
Escleroterapia / láser endovenoso|8
Fístula arteriovenosa para hemodiálisis|10
Reparación de fístula arteriovenosa|12
Simpatectomía lumbar|14
Amputación mayor por isquemia|14
Trombectomía venosa|14
Filtro de vena cava|10

# Cirugía Torácica
Lobectomía pulmonar|26
Neumonectomía|30
Segmentectomía pulmonar|24
Lobectomía por videotoracoscopía (VATS)|24
Biopsia pulmonar por VATS|16
Decorticación pleural|22
Pleurodesis|14
Bullectomía|18
Timectomía|22
Mediastinoscopía|14
Resección de tumor mediastínico|26
Esofaguectomía|34
Reparación de hernia diafragmática|22
Toracotomía exploradora|20
Broncoscopía flexible con sedación|6
Traqueoplastia|24

# Cirugía Pediátrica
Hernioplastia inguinal pediátrica|8
Hernioplastia umbilical pediátrica|7
Orquidopexia pediátrica|9
Circuncisión pediátrica|6
Apendicectomía pediátrica|9
Piloromiotomía|12
Corrección de atresia esofágica|26
Corrección de hernia diafragmática congénita|26
Corrección de malrotación intestinal|20
Enterostomía neonatal|16
Corrección de ano imperforado|20
Descenso abdominoperineal (Hirschsprung)|24
Corrección de onfalocele / gastrosquisis|24
Colocación de catéter central en neonato|10
Exéresis de quiste tirogloso pediátrico|10
Nefrectomía pediátrica|18
Cirugía de hipospadias|14
Punción lumbar bajo sedación|4
Estudios por imágenes bajo sedación|5
Endoscopía digestiva pediátrica|6
Curación de quemaduras bajo anestesia|8

# Cirugía Maxilofacial y Odontología
Osteosíntesis de fractura mandibular|14
Osteosíntesis de fractura malar / orbitaria|14
Osteotomía ortognática bimaxilar|24
Extracción de cordales incluidos|8
Rehabilitación odontológica bajo anestesia general|10
Exéresis de tumor de cavidad oral|14
Quiste odontogénico: enucleación|10
Reducción de luxación temporomandibular|6
Cirugía de articulación temporomandibular|14
Implantes dentales bajo anestesia general|10

# Endoscopía y procedimientos fuera de quirófano (NORA)
Videoendoscopía digestiva alta con sedación|5
Videocolonoscopía con sedación|6
Endoscopía alta + colonoscopía|8
CPRE (colangiopancreatografía retrógrada)|12
Ecoendoscopía|10
Polipectomía endoscópica|8
Ligadura de várices esofágicas|10
Dilatación esofágica|8
Colocación de sonda de gastrostomía endoscópica|8
Resonancia magnética bajo anestesia|8
Tomografía bajo sedación|5
Radioterapia bajo sedación (por sesión)|5
Cardioversión eléctrica|5
Estudio electrofisiológico y ablación|14
Cateterismo cardíaco pediátrico|14
Punción-biopsia guiada por imagen|6
Terapia electroconvulsiva|5
Curaciones seriadas bajo sedación|6
Procedimiento de dolor crónico (bloqueo)|8
Colocación de catéter peridural para dolor|8

# Otros / Multidisciplinario
Cirugía de urgencia no especificada|12
Reoperación por sangrado|16
Toilette y drenaje de sepsis abdominal|18
Exploración quirúrgica por trauma múltiple|24
Procuración de órganos (donante)|20
Trasplante hepático|48
Trasplante renal (receptor)|30
Cirugía combinada multidisciplinaria|24
Procedimiento no listado (carga manual)|10
`;
