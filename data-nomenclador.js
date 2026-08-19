/* =========================================================================
   NOMENCLADOR DE PRACTICAS ANESTESIOLOGICAS — AFAAR 2021
   -------------------------------------------------------------------------
   Transcripcion literal del archivo "NOMENCLADOR AFAAR 2021.xlsx".

   FORMATO
     # gg|GRUPO            -> grupo de practicas (01..19)
     ## gg.ss|Subgrupo     -> subgrupo
     gg.ss.pp|Practica|C   -> practica y su COMPLEJIDAD anestesiologica
     ...|C|B               -> ademas se factura con la GRILLA B de valores
                              (Cardiovascular, Torax, Neurocirugia, Hemodinamia,
                              Maxilo-Facial y cirujanos itinerantes)

   La complejidad es la del nomenclador y NO es lo mismo que las unidades
   anestesicas (UA) que la app usa para el honorario. Se muestran juntas:
   la complejidad orienta, la UA sigue siendo la base del calculo.

   Anexo de dolor cronico: la complejidad puede no ser un numero
   ("1 + 50%", "1/3 comp 1", "sin cargo") y se conserva tal cual figura.
   RX / RF / INT indican si la practica requiere radioscopia,
   radiofrecuencia o internacion.
   ========================================================================= */
'use strict';

/* 1412 practicas */
const NOMENCLADOR_TXT = `
# 01|ABDOMEN
## 01.01|Pared
01.01.01|Hematoma o abseso supra o infra aponeurótico|3
01.01.02|Herida (hasta aponeurosis) de menos de 20 cm|3
01.01.03|Cuerpo extraño|2
01.01.04|Herida de pared abdominal de más de 20 cm|4
01.01.05|Fístula umbilical|3
01.01.06|Onfalitis|3
01.01.07|Diastasis de los rectos|3
01.01.08|Tumor de pared|3
01.01.09|Hernia umbilical, crural o epigástrica|3
01.01.10|Hernia recidivada|3
01.01.11|Hernia estrangulada|3
01.01.12|Hernia atascada|3
01.01.13|Hernia inguinal en lactantes unilateral|4
01.01.14|Hernia inguinal en adultos (no complicadas) unilateral|4
01.01.15|Eventración|4
01.01.16|Eviceración|4
01.01.17|Reparación de hernia con colocación de malla (convencional)|4
01.01.18|Hernia estrangulada con reseccion intestinal|5
01.01.19|Hernia inguinal laparoscopica sin colocacion de malla unilateral|5
01.01.20|Hernia inguinal laparoscopica con colocación de malla unilateral|6
01.01.21|Reparación eventración plástica con injerto (malla)|5
01.01.22|Dermolipectomía no estética|5
01.01.23|Onfalocele - tratamiento quirúrgico|7
## 01.02|Cavidad
01.02.01|Peritoneocentesis|2
01.02.02|Laparotomía exploradora, como única intervención|4
01.02.03|Laparotomía contenida (lavado de cavidad)|4
01.02.04|Biopsia|3
01.02.05|Resección de epiplón|3
01.02.06|Absceso subfrénico (via convencional)|4
01.02.07|Simpaticectomia abdominal o lumbar|3
01.02.08|Laparoscopía exploradora, como unica intervención|4
01.02.09|Peritonitis generalizada por laparotomia|5
01.02.10|Hernia hiatal|4
01.02.11|Peritonitis por video laparoscopia|6
01.02.12|Absceso subfrénico laparoscopico|5
01.02.13|Absceso intra abdominal o profundo (via convencional)|4
01.02.14|Absceso intra abdominal o profundo por Video Laparoscopia|5
01.02.15|Vaciamiento inguino-escrotal|5
01.02.16|Vaciamiento inguino-abdominal|5
01.02.17|Hernia hiatal por vía laparoscopica|6
01.02.18|Hernia diafragmática por vía abdominal|6
01.02.19|Hernia diafragmática por vía toraxica|6
01.02.20|Laparotomía exploradora en paciente crítico|7
01.02.21|Hernia diafragmática congénita|7
01.02.22|Hernia diafragmática por vía toraco-abdominal|7
## 01.03|Retroperitoneo
01.03.01|Hematoma retroperitoneal|4
01.03.02|Tumor retroperitoneal|5
01.03.03|Linfadenectomía lumboaortica|6
01.03.04|Tumor retroperitoneal laparóscopico|7
## 01.04|Higado, Vesicula y Vías Biliares
01.04.01|Biopsia percutanea de higado|1
01.04.02|Biopsia de higado a cielo abierto o laparoscopica|3
01.04.03|Sutura de herida simple de higado|3
01.04.04|Colecistostomía percutanea|3
01.04.05|Colecistostomía|4
01.04.06|Absceso de higado|4
01.04.07|Colecistectomía simple|4
01.04.08|Coledocotomía, como única intervención|4
01.04.09|Colocación de cateter inahepatico para quimioterapia|4
01.04.10|Quiste hidatidico de higado|5
01.04.11|Colecistectomía laparoscopica|5
01.04.12|Exploración de vías biliares (via convencional)|5
01.04.13|Instrumentacion de via biliar por laparoscopia|6
01.04.14|Herida traumática de higado|5
01.04.15|Duodenopapilotomía con o sin colecistectomía|6
01.04.16|Colecistectomía laparoscopica convertida|6
01.04.17|Metastasis hepatica fenolización termotratamiento|6
01.04.18|Embolización hepatica|6
01.04.19|Anastomosis bilio-digestiva con o sin colecistectomía|6
01.04.20|Fístula biliar con anastomosis bilio-digestiva, con o sin colecistectomía|6
01.04.21|Exploración de vías biliares por LAPAROSCOPIA|6
01.04.22|Hepatectomía lobar derecha o izquierda|7
01.04.23|Segmentectomía hepática|7
01.04.24|Reconstrucción de vías biliares|7
01.04.25|Hemihepatectomía|7
01.04.26|Trasplante hepático|9|B
## 01.05|Bazo y Pancreas
01.05.01|Esplenoportografía|3
01.05.02|Quiste hidatidico de bazo|4
01.05.03|Esplenectomía electiva|4
01.05.04|Drenaje de wirsung|4
01.05.05|Quiste de pancreas|5
01.05.06|Absceso de pancreas|5
01.05.07|Esplenectomía por rotura de bazo|5
01.05.08|Anastomosis pancreato-digestiva|5
01.05.09|Secuestrectomía|5
01.05.10|Pancreatectomía con exploración y drenaje|6
01.05.11|Esplenectomía por toracotomia|7
01.05.12|Pancreato-duodenectomía - duodenopancreatectomía|7
01.05.13|Esplenopancreatectomía corporocaudal|7
01.05.14|Implante de células B|7
## 01.06|Estomago
01.06.01|Gastrostomía (excluye cirugia bariatrica)|4
01.06.02|Hipertrofia de piloro-piloromiotomía|4
01.06.03|Gastrostomía - exploración - extracción de cuerpo extraño, lesión local o tumor beningno (excluye cirugia bariatrica)|4
01.06.04|Cierre de gastrostomía|4
01.06.05|Vagotomía, vagotomía selectiva, gastropexia, piloroplastía|4
01.06.06|Gastrostomía endoscopia percutanea|5
01.06.07|Gastrorrafia - herida o traumatismo estomago|5
01.06.08|Hipertrofia de piloro por vía laparoscopica|5
01.06.09|Gastroenteroanastomosis|5
01.06.10|Ulcera perforada, gastrorrafia, herida perforada, cierre de fístula gástrica|5
01.06.11|Ulcera perforada, gastrorrafia, herida perforada, cierre de fístula gástrica por VIDEOLAPAROSCOPIA|6
01.06.12|Gastrectomía subtotal (excluye cirugia bariatrica)|6
01.06.13|Gastrectomía total (excluye cirugia bariatrica)|7
01.06.14|Gastrectomía total por toracolaparotomía|7
01.06.15|Gastroquisis|7
01.06.16|Cirugia bariatrica por laparoscopia|7 x 2
01.06.17|Gastrectomía subtotal laparoscopica (excluye cirugia bariatrica)|7
01.06.18|Gastrectomía total laparoscopica (excluye cirugia bariatrica)|8|B
## 01.07|Intestino
01.07.01|Colostomía|3
01.07.02|Enterostomía temporaria o definitiva|3
01.07.03|Cecostomía|3
01.07.04|Cierre de colostomía|3
01.07.05|Colpopexia|3
01.07.06|Enterorrafia simple|3
01.07.08|Yeyunostomía|3
01.07.09|Ileostomía|3
01.07.10|Cierre de ileostomía|3
01.07.11|Apendicectomía|4
01.07.12|Apendicectomía con peritonitis|5
01.07.13|Divetículo de meckel|4
01.07.14|Enterolisis o debridamiento intestinal o de epiplon o adhesiolisis|5
01.07.15|Apendicectomía laparoscópica|5
01.07.16|Apendicectomía laparoscópica con peritonitis|6
01.07.17|Enterorrafia múltiple|5
01.07.18|Devolvulación - desinvaginación intestinal|5
01.07.19|Derivaciones intestinales internas|5
01.07.20|Resección de intestino delgado|5
01.07.21|Sigmoidectomía|5
01.07.22|Oclusión con resección de intestino|5
01.07.23|Hemicolectomía|5
01.07.24|Plicatura intestinal - op. De noble|5
01.07.25|Cierre de hartman|5
01.07.26|Tratamiento quirúrgico del megacolon|5
01.07.27|Debridamiento intestinal - enterotomía|5
01.07.28|Colectomía transversa segmentaria - op. De hartman|6
01.07.29|Cierre de hartman laparoscopica|6
01.07.30|Sigmoidectomía laparoscopica|7
01.07.31|Hemicolectomía laparoscopica|7
01.07.32|Hartman laparoscopica|7
01.07.33|Colectomía total|7
01.07.34|Colectomía o hemicolectomía abdomen -pélvica|7
01.07.35|Hemicolectomía abdomino-perineal- Op de Miles|7
01.07.36|Atresia ano-rectal por vía sagital en pediatría|7
## 01.08|Endoscopias abdominales
01.08.01|Esofagovideoscopía|2
01.08.02|Gastrovideoscopía|2
01.08.03|Rectoscopía|2
01.08.04|Rectosigmoideoscopía|2
01.08.05|Dilatación esofágica, pilórica o colonica en adulto|3
01.08.06|Gastrostomía por vía endoscópica|5
01.08.07|Videocolonoscopía|3
01.08.08|Extracción de cuerpo extraño de esófago|3
01.08.09|Devolvulación endoscópica|3
01.08.10|Colocación de prótesis en esófago|3
01.08.11|Videocolonoscopía con toma de biopsia|4
01.08.12|Colocación de sonda de alimentación por endoscopía|3
01.08.13|Dilatación esofágica, pilórica o colonica en niños|4
01.08.14|Gastrostomía por vía endoscópica en niños|4
01.08.15|Extracción de cuerpo extraño de esófago en niños|4
01.08.16|Colocación de stent en duodeno por endoscopía|5
01.08.17|Resección de pólipo por fibrocolonoscopía|4
01.08.18|Tratamiento endoscópico de hemorragia digestiva|4
01.08.19|Tratamiento varices esofágicas (bandas o esclerosis)|4
01.08.20|Videocolonoscopía con polipectomía|4
01.08.21|Colocación de stent colónico|4
01.08.22|Videogastroduodenoscopía con polipectomía|4
01.08.23|Drenaje transgástrico de quiste pancreático guiado por ecografía|4
01.08.24|Drenaje percutaneo de vía biliar|4
01.08.25|Drenaje absceso hepático|4
01.08.26|Tratamiento de ulceras o fístulas traqueoesofágicas por endoscopías|4
01.08.27|Colangio Papilotomia Retrograda Endoscopica|6
01.08.28|Colocación de stent vía biliar|5
01.08.29|Dilatación endoscópica de estenosis de vía biliar|5
01.08.30|Colocación stent vía biliar por punción hepática|5
01.08.31|Extracción de pólipo gigante colónico - gástrico - duodenal|5
01.08.32|Exeresis de tumor hepático por radiofrecuencia|5
01.08.33|Papilotomía con o sin extracción de cálculo vía endoscópica|6
## 01.09|Laparoscopía Abdominal
01.09.01|Laparoscopía diagnóstica|3
01.09.02|Biopsia de higado laparoscópica|4
01.09.03|Apendicectomía laparoscópica|5
01.09.04|Apendicectomía laparoscópica con peritonitis|6
01.09.05|Enterolisis abdominal laparoscópica (como única intervención)|5
01.09.06|Hernia inguinal unilateral por laparoscopía sin colocacion de malla|5
01.09.07|Hernia inguinal unilateral por laparoscopía con colocacion de malla|6
01.09.08|Vagotomía laparoscópica|5
01.09.09|Colecistectomía laparoscópica|5
01.09.10|Hernia hiatal laparoscópica|6
01.09.11|Esplenectomía laparoscópica|6
01.09.12|Hartman, cierre asistido por laparoscopía|6
01.09.13|Nefrectomía laparoscópica unilateral|7
# 02|PROCTOLOGIA
## 02.00|Recto y Ano
02.00.01|Dilatación anal|1
02.00.02|Absceso perianal|2
02.00.03|Esfinterotomía|2
02.00.04|Esfinterectomia|3
02.00.05|Condilomas acuminados (fulguración)|2
02.00.06|Fístula anal o fistulectomía o fistulotomía o cuerpo extraño o bolo fecal|3
02.00.07|Cuerpo extraño infraaponeurótico|3
02.00.08|Hemorroidectomía|3
02.00.09|Trombosis hemorroidal|3
02.00.10|Proctorrafia|3
02.00.11|Fisura anal|3
02.00.12|Absceso perirectal|3
02.00.13|Tumor benigno de ano|3
02.00.14|Esfinteroplastía tipo plicatura|3
02.00.15|Plástica anal - anoplastía|3
02.00.16|Cerclaje anal|3
02.00.17|Quiste sacrocoxígeo|4
02.00.18|Prolapso rectal|3
02.00.19|Propalso proctohemorroidal|5
02.00.20|Fulguración de neoplasia de recto|4
02.00.21|Plástica anal o anoplastía|4
02.00.22|Ano imperforado con recto bajo (excepto en neonato)|4
02.00.23|Esfinteroplastía con colostomía|4
02.00.24|Proctectomía|4
02.00.25|Colocación de semillas radioactivas transrectal|4
02.00.26|Protectomía con prostatectomía|5
02.00.27|Recto, resección anterior (vía abdominal) tipo hartman|5
02.00.28|Megacolon congénito|6
02.00.29|Operación de dixon|6
02.00.30|Ano imperforado con recto alto (excepto en neonato)|6
02.00.31|Dixon laparoscópico|6
02.00.32|Operación de Miles o similares|7
02.00.33|Operaciones plásticas de malformaciones congénitas ano-rectales|8|B
# 03|TORAX
## 03.01|Pared
03.01.01|Biopsia de ganglios linfáticos de pared toráxico|1|B
03.01.02|Punción pleural|1|B
03.01.03|Biopsia costal|2|B
03.01.04|Tumor de paredes blandas|2|B
03.01.05|Absceso de pared|4|B
03.01.06|Resección costal|4|B
03.01.07|Biopsia de grasa preescalenica|2|B
03.01.08|Tumor de pared costal|3|B
03.01.09|Osteosíntesis de esternon como única intervención|5|B
03.01.10|Toracoplastía|5|B
03.01.11|Cierre de fístula bronco-cutánea|5|B
03.01.12|Torax excavado|7|B
## 03.02|Pleura
03.02.01|Punción de cavidad pleural para lavaje o instalación de sustancias terapeúticas|2|B
03.02.02|Drenaje pleural por toracotomía mínima o biopsia pleural|3|B
03.02.03|Resección pleuro-parietal|5|B
03.02.04|Decorticación pleuropulmonar|6|B
03.02.05|Decorticación pleuropulmonar o reseccion pleuro-parietal por VIDEOTORACOSCOPIA|7|B
## 03.03|Pulmón
03.03.01|Videotorascoscopía diagnóstica|4|B
03.03.02|Videotorascoscopía para tratamiento de bullas|6|B
03.03.03|Broncorrafía|5|B
03.03.04|Cavernostomía|5|B
03.03.05|Lesión de pulmón (absceso, tumor)|6|B
03.03.06|Toracotomía exploradora amplia o biopsia pulmonar|6|B
03.03.07|Traqueoplastía|6|B
03.03.08|Resección tumor bronquial con laser|7|B
03.03.09|Neumonectomía|7|B
03.03.10|Lobectomía|7|B
03.03.11|Segmentectomía|7|B
03.03.12|Neumonectomía por VIDEOTORACOSCOPIA|8|B
03.03.13|Segmentectomía o lobectomía por VIDEOTORACOSCOPIA|8|B
## 03.04|Mediastino
03.04.01|Linfadenectomía mediastínica|6|B
03.04.02|Mediastinitis|6|B
03.04.03|Bocio endotorácico|6|B
03.04.04|Mediastinoscopía diagnóstica|5|B
03.04.05|Timectomía por miastenia gravis|6|B
03.04.06|Tumores mediastinales|6|B
## 03.05|Esófago
03.05.01|Dilatación de esófago - extracción de cuerpo extraño|3|B
03.05.02|Ecocardiograma transesofágico|3|B
03.05.03|Esofagostomía|4|B
03.05.04|Megaesofago|5|B
03.05.05|Perforaciones de esófago|5|B
03.05.06|Divertículo de esófago|5|B
03.05.07|Hernia diafragmática por vía toráxica|6|B
03.05.08|Derivación paliativa de esófago|6|B
03.05.09|Fístula traqueo-esofágica|6|B
03.05.10|Resección de esófago|6|B
03.05.11|Esofaguectomía total|6|B
03.05.12|Malformaciones congénitas de esófago - atresia|7|B
03.05.13|Esofaguectomía laparoscópica|7|B
03.05.14|Reemplazo de esófago|7|B
03.05.15|Esofagogastrectomía|8|B
## 03.06|Endoscopias Toráxicas
03.06.01|Lavado de cavidad|3|B
03.06.02|Broncoscopía|3|B
03.06.03|Broncoscopía con biopsia, con o sin lavado|4|B
03.06.04|Lavado bronquial para desobstrucción|4|B
03.06.05|Broncoscopía con broncospio rígido|3|B
03.06.06|Colocación de stent bronquial por endoscopía|5|B
## 03.07|Toracoscopía
03.07.01|Toracoscopía diagnóstica|3|B
03.07.02|Toracoscopía tratamiento de bullas|5|B
# 04|ENDOCRINAS
## 04.01|Tiroides
04.01.01|Punción biopsia de tiroides|2
04.01.02|Quiste tirogloso (extirpación)|3
04.01.03|Hemitiroidectomía|4
04.01.04|Tiroidectomía total|5
04.01.05|Tiroidectomía endóscopica|6
04.01.06|Tiroidectomía total con vaciamiento cervical|6
## 04.02|Paratiroides
04.02.01|Paratiroidectomía|5
## 04.03|Suprarenales
04.03.01|Adrenalectomía unilateral|6
04.03.02|Suprarenalectomía laparoscópica unilateral|7
# 05|GINECOLOGIA
## 05.01|Mama
05.01.01|Punción de mama unilateral|2
05.01.02|Absceso de mama - drenaje unilateral|2
05.01.03|Biopsia de mama unilateral|2
05.01.04|Quiste de mama unilateral|2
05.01.05|Mastotomía unilateral|2
05.01.06|Nódulo de mama unilateral|3
05.01.07|Ginecomastía unilateral - mama supernumeraria|3
05.01.09|Tumorectomia unilateral|3
05.01.10|Adenomastectomía - mastectomía simple unilateral|4
05.01.11|Biopsia radioquirúrgica de mama unilateral|4
05.01.12|Cuadrantectomia unilateral|4
05.01.13|Cuadrantectomía unilateral con ganglio centinela|5
05.01.14|Cuadrantectomía unilateral con vaciamiento axilar|6
05.01.15|Tumorectomía unilateral con vaciamiento axilar|6
05.01.16|Mastectomía subradical - mastoplastía unilateral - op. Urban|6
05.01.17|Mastectomía radical unilateral|6
05.01.18|Mastectomía radical unilateral con vaciamiento ganglionar|7
05.01.19|Mastectomía unilateral y colocación de prótesis|8|B
## 05.02|Utero
05.02.01|Examen ginecológico bajo anestesia|1
05.02.02|Diu, colocación y extracción|1
05.02.03|Pólipo de cuello|3
05.02.04|Curetaje - legrado|2
05.02.05|Biopsia o cauterización de cuello uterino|2
05.02.06|Miomectomía vaginal (mioma nascens)|3
05.02.07|Desgarro de cuello uterino|3
05.02.08|Conización de cuello uterino o leep|3
05.02.09|Desinversión uterina - colocación de radium por sesión|2
05.02.10|Amputación de cuello como único procedimiento|3
05.02.11|Histeroscopia diagnostica|3
05.02.12|Cauterización de cuello con laser|3
05.02.13|Operación correctora de vicios de conformación uterina|3
05.02.14|Histerectomía fundica|4
05.02.15|Ligamentopexia abdominal|4
05.02.16|Cerclaje|4
05.02.17|Colpopexia|3
05.02.18|Histeroscopia terapeutica|4
05.02.19|Miomectomía - histerorrafia|4
05.02.20|Fístula recto-uterina o vesico-uterina|5
05.02.21|Miomectomía por laparoscopía|5
05.02.22|Endometrosis tratamiento por videolaparoscopía|5
05.02.23|Histerectomía sin anexectomía|5
05.02.24|Histerectomía vaginal con o sin colpoperineorrafia|5
05.02.25|Miomectomía múltiple - ligamentopexia - colpopexia abdominal|6
05.02.26|Miomectomía por laparoscopía múltiple|6
05.02.27|Histerectomía laparoscópica|6
05.02.28|Werthein - colpoanexohisterectomía total ampliada|7
05.02.29|Werthein|6
05.02.30|Malformaciones uterinas|6
05.02.31|Werthein con lavaje cavitario|7
## 05.03|Anexos: Ovarios y Trompas
05.03.01|Resección cuneiforme de ovario, unilateral|3
05.03.02|Ooforectomía simple unilateral|3
05.03.03|Ooforosalpinguectomía unilateral|4
05.03.04|Varicocele pelviano|3
05.03.05|Quiste de ovario, unilateral|4
05.03.06|Embarazo ectópico no complicado|4
05.03.07|Tumor de ovario, unilateral|4
05.03.08|Embarazo ectópico hemorragico|5
05.03.09|Salpingoplastía unilateral|4
05.03.10|Salpingolisis unilateral|4
05.03.11|Resección de plexo hipogastrico|4
05.03.12|Salpingolisis unilateral por VIDEOLAPAROSCOPIA|5
05.03.13|Microcirugía tubaria unilateral|5
## 05.04|Vagina
05.04.01|Colpotomía - lesión local de vagina|2
05.04.02|Punción drenaje de douglas|2
05.04.03|Biopsia de vagina|2
05.04.04|Tumor beningo de vagina|2
05.04.05|Desgarro de vagina - colporrafia o colpocleisis fuera del trabajo de parto|3
05.04.06|Operación de lefort|3
05.04.07|Fístula recto-vaginal|4
05.04.08|Colocación de radium|4
05.04.09|Cobaltoterapia|4
05.04.10|Laser de vagina|4
05.04.11|Fístula vesico-vaginal - colporrafia posterior con reconstrucción del esfínter anal|5
05.04.12|Formación de vagina artificial|6
## 05.05|Perine-Vulva
05.05.01|Biopsia de vulva|2
05.05.02|Tumor benigno de vulva|2
05.05.03|Drenaje de absceso de glándula de bartholino|2
05.05.04|Marsupialización de glándula de bartholino|2
05.05.05|Episiorrafia|2
05.05.06|Perineorrafia|2
05.05.07|Extirpación de glándula de bartholino|3
05.05.08|Vulvectomía simple|3
05.05.09|Fístula vagino-perineal|3
05.05.10|Colpoperineorrafia anterior o posterior - episioperineoplastía|5
05.05.11|Inclusión de semillas radioactivas en periné|4
05.05.12|Corrección incontinencia orina (bursch, marchal marchetti - pereyra)|5
05.05.13|Tratamiento combinado incontinencia urinaria (tvt)|5
05.05.14|Vulvectomía con vaciamiento ganglionar|6
## 05.06|Endoscopías Ginecológicas
05.06.01|Histeroscopía diagnóstica|3
05.06.02|Histeroscopía terapéutica|4
## 05.07|Laparoscopía Ginecológica
05.07.01|Laparoscopía diagnóstica ginecológica|3
05.07.02|Ooforectomía laparoscópica, unilateral|4
05.07.03|Ooforosalpinguectomía unilateral laparoscópica|5
05.07.04|Endometrosis tratamiento por videolaparoscopía|5
05.07.05|Tumor de ovario por laparoscopía, unilateral|5
05.07.06|Embarazon ectópico no complicado por video laparoscopía|5
05.07.07|Laparoscopía para seguimiento de esterilidad|4
05.07.08|Laparoscopía para fertilización asistida|4
05.07.09|Lisis pelviana, unilateral por laparoscopía|5
05.07.10|Miomectomía laparoscópica|5
05.07.11|Varicocele pelviano por laparoscopía|4
05.07.12|Incontinencia de orina, corrección laparoscópica (bursch o similares)|5
05.07.13|Quiste de ovario, unilateral por laparoscopía|5
05.07.14|Salpingoplastía, unilateral por laparoscopía|5
05.07.15|Embarazo ectopico HEMORRAGICO por video laparoscopia|6
05.07.16|Lisis tubarica unilateral o ligadura de trompa UNILATERAL, por laparoscopía|5
05.07.17|Resección de plexo hipogástrico por laparoscopía (op. De Cotte)|5
05.07.18|Miomectomía múltiple por laparoscopía|6
05.07.19|Salpinguectomía, unilateral por video laparoscopía|5
05.07.20|Microcirugía tubaria unilateral por laparoscopía|6
05.07.21|Histerectomía vaginal asistida|6
05.07.22|Histerectomía laparoscópica|6
# 06|OBSTETRICIA
06.00.01|Examen gineco-obstétrico bajo anestesia|1
06.00.02|Legrado uterino|2
06.00.03|Huevo muerto y retenido - legrado|3
06.00.04|Amniocentesis|2
06.00.05|Episiorrafia|2
06.00.06|Desgarro de vagina o esfínter|3
06.00.07|Extracción manual de placenta como único procedimiento|2
06.00.08|Cerclaje|4
06.00.09|Taponamiento intrauterino|2
06.00.10|Legrado por mola o similar|3
06.00.11|Aborto del segundo trimestre con mecanismo de parto|3
06.00.12|Parto-período expulsivo, distócico o no, espontáneo o instrumental con o sin episiotomía y con o sin desgarro bajo anestesia general o regional (hasta 60 minutos)|3
06.00.13|Cesárea - microcesárea|4
06.00.14|Cesárea|4
06.00.15|Conducción del trabajo de parto bajo anestesia epidural continua, que termina en parto por vía vaginal espontáneo o instrumental con o sin episiotomía y con o sin desgarro de mas de 60 minutos|5
06.00.16|Conducción del trabajo de parto bajo anestesia epidural continua, por más de 60 minutos que fracasa y pasa a cesarea|6
06.00.17|Cesárea por placenta ácreta e histerectomía|8|B
06.00.18|Cirugías intrauterino a cielo abierto o por punción|9|B
# 07|UROLOGIA
07.01.01|Meatotomía|1
07.01.02|Frenulotomía|2
07.01.03|Drenaje de absceso testicular|2
07.01.04|Punción de derrame escrotal|2
07.01.05|Biopsia de pene|2
07.01.06|Biopsia de testículo|2
07.01.07|Biopsia de epidídimo|2
07.01.08|Epididimotomía y drenaje|2
07.01.09|Anastomosis de conducto deferente|2
07.01.10|Quiste de cordón|2
07.01.11|Varicocele|3
07.01.12|Vasectomía unilateral|3
07.01.13|Vasectomía unilateral por videolaparoscopia|4
07.00.14|Epididimectomía|3
07.01.15|Hidrocele|3
07.01.16|Orquidopexia|3
07.01.17|Circuncisión|3
07.01.18|Fimosis y parafimosis - postioplastía|3
07.01.19|Orquidectomía|3
07.01.20|Escrotoplastía|3
07.01.21|Varicocele por VIDEOLAPAROSCOPIA|5
07.01.22|Amputación total o parcial de pene|5
07.01.23|Hipospadia - epispadia - plástica de pene|5
07.01.24|Prótesis testicular unilateral|5
07.01.25|Enfermedad de peyronie (lesión peneana)|6
07.01.26|Emasculación total con vaciamiento inguino-abdominal|6
07.01.27|Prótesis de pene con injerto|7
07.01.28|Prótesis peneana|7|B
07.01.29|Microcirugía de la vía espermal|9
## 07.02|Uretra
07.02.01|Uretrotomía interna - uretroscopía|2
07.02.02|Uretrografia|2
07.02.03|Caruncular uretral|2
07.02.04|Dilatación uretral|2
07.02.05|Uretrorrafia|2
07.02.07|Plástica de uretra|4
07.02.09|Cierre de fístua uretro-rectal|4
07.02.11|Plástica de uretra con injerto de mucosa yugal o lingual|6
## 07.03|Riñon
07.03.01|Biopsia renal percutánea|2
07.03.02|Arteriografia renal|2
07.03.03|Embolectomía renal|3
07.03.04|Exploración renal sin biopsia|3
07.03.05|Exploración renal con biopsia|4
07.03.06|Colocación o retiro de doble j (pig tail)|3
07.03.07|Nefropexia|4
07.03.08|Nefrostomía (percutánea)|4
07.03.09|Pielografia descendente|2
07.03.10|Pielolitotomía|4
07.03.11|Nefrolitotomía|5
07.03.12|Nefrectomía|6
07.03.13|Nefrectomía parcial|6
07.03.14|Litotricia percutánea|6
07.03.15|Pielolitotomía laparoscópica|6
07.03.16|Plástica pieloureteral laparoscópica|6
07.03.17|Nefrectomía por toraco-freno-laparotomía|7
07.03.18|Trasplante renal|9
07.03.19|Nefrectomía total o parcial por videolaparoscópica|7
## 07.04|Uréter
07.04.01|Cateterismo de uréter|2
07.04.02|Extracción de cálculo por endoscopía|2
07.04.03|Pielografía ascendente por ureteroscopia|2
07.04.04|Ureterectomía|3
07.04.05|Ureterostomía|3
07.04.06|Dilatación de uréter más colocación de doble j|4
07.04.07|Litotricia por choque extracorporeo|3
07.04.08|Ureterolitotomía|4
07.04.09|Plástica ureteral|4
07.04.10|Reimplante de uréter unilateral|4
07.04.11|Abocamiento de uréter a piel|4
07.04.13|Uretro-sigmoideo anastomosis|5
07.04.14|Reimplante ureteral unilateral con afinamiento|5
07.04.15|Litotricia ureteral por vía endoscópica|5
07.04.16|Litotricia ureteral por vía endoscópica con LASER|6
07.04.17|Llitotricia calculo multiple en ureter|6
07.04.18|Litotomia unilateral laparoscópica|6
07.04.19|Plastica ureteral laparoscópica|6
07.04.20|Reimplante ureteral unilateral laparoscópico|6
## 07.05|Vejiga
07.05.01|Cistoscopia|2
07.05.02|Cistotomía por punción|2
07.05.03|Colocación de taponaje vesical|2
07.05.04|Biopsia de vejiga|3
07.05.05|Cistotomía (talla)|3
07.05.06|Fístula vesico-parietal|3
07.05.07|Resección de cuello de vejiga|3
07.05.08|Levantamiento de vejiga por vía abdominal|3
07.05.09|Resección endoscópica por electrocoagulación|4
07.05.10|Litotricia por choque extracorporeo|3
07.05.11|Cateterismo vesical / cistomanometria|3
07.05.12|Litotricia cálculo único|4
07.05.13|Extirpación de tumor laparotomía|4
07.05.14|Cistectomía parcial|4
07.05.15|Rtu de vejiga pólipo, tumor|5
07.05.16|Cistectomía parcial con reimplante de uréter|5
07.05.17|Cistoplastía - uretero sigmoideo anastomosis|5
07.05.18|Litotricia cálculo múltiple en vejiga|6
07.05.19|Neovejiga|6
07.05.20|Fístula vesico-útero-vaginal con anastomosis uretero-intestinal|6
07.05.21|Fístula uretero-vaginal con anastomosis uretero-vesical|6
07.05.22|Cistectomía total|7
07.05.23|Cistectomia total laparoscópica|7
07.05.24|Cistectomia parcial laparoscópica|7
## 07.06|Próstata
07.06.01|Biopsia prostática por punción|2
07.06.02|Extracción taponaje loge prostática|2
07.06.03|Braquiterapia de próstata|3
07.06.04|Punción /biopsia de próstata bajo contro ecográfico|3
07.06.05|Resección transuretral de próstata (RTU)|5
07.06.06|Prostatectomía o adenectomía por vía abdominal, con o sin vasectomía|5
07.06.07|Prostatectomía radical|6
07.06.08|Resección video por laser|7
07.06.09|Prostatectomía radical laparoscópica|7
## 07.07|Practicas urologicas LASER
07.07.01|Litiasis vesical|6
07.07.02|Litotricia transuretral|6
07.07.03|Litotricia transvesical|6
07.07.04|Litiasis ureter|6
07.07.05|Litotricia endouretral|6
07.07.06|Litiasis pielica o calicilar|6
07.07.07|Litotricia endopielocalicilar con uretroscopia flexible|6
07.07.08|Tumor de ureter, caliz o pelvis renal|6
07.07.09|Ablacion de tumor de ureter|6
07.07.10|Ablacion de tumor de caliz o pelvis|6
07.07.11|Biopsia y laserterapia por HPV pene|6
07.07.12|Biopsia y laserterapia por HPV testiculo|6
07.07.13|Tratamientos con energia bipolar|6
07.07.14|Uretrotomia interna bipolar|6
07.07.15|RTU prostata bibolar|6
07.07.16|RTU bipolar de vejiga por tumor|6
# 08|ORTOPEDIA
## 08.01|Yesos
08.01.01|Colocación o extracción de yesos|1
08.01.02|Yesos de antebrazo, braquipalmar, pierna o inguinopedico|1
08.01.03|Yesos -minerva, corsé, toracobraquial, pelvi rotuliano o pédico|2
## 08.02|Generalización de Huesos
08.02.01|Tracción esquelética|1
08.02.02|Curetaje oseo|1
08.02.03|Movilizaciones|2
08.02.04|Punción biopsia de hueso|2
08.02.05|Resección de exostosis|2
08.02.06|Reducción incruenta de fracturas- reducción de luxaciones|2
08.02.07|Biopsia quirúrgica de hueso|2
08.02.08|Osteoclasia - extirpación neurinoma de morton|2
08.02.09|Osteotomía simple|2
08.02.10|Quiste oseo (resección)|2
08.02.11|Obtención de injerto simple de hueso|2
08.02.12|Extracción de placas o tornillos (no de rodilla ni de cadera)|2
08.02.13|Artrodesis hasta tres dedos|3
08.02.14|Tutor externo (excepto cadera o maxilar)|4
08.02.15|Tutor externo de tibia|4
08.02.16|Tutor externo de antebrazo (radio - cúbito)|4
08.02.17|Tutor externo de clavícula|4
08.02.18|Tutor externo de húmero|4
08.02.19|Tutor externo de fémur|4
08.02.20|Toilette de fracturas expuestas|4
08.02.21|Tutor externo de cadera|5
08.02.22|Resección total de huesos (radio, cúbito, peroné, astrálago, calcáneo, clavícula, malar, etc.)|5
08.02.23|Reducción quirúrgica -osteosíntesis de fractura de maxilar superior e inferior|5
08.02.24|Tutor externo de maxilar|5
08.02.25|Toilette quirúrgica|4
08.02.26|Resección diaficiaria con prótesis o injerto de sustitución|5
08.02.27|Retiro de material miembro superior (unilateral)|4
08.02.28|Retiro de material miembro inferior (unilateral)|4
## 08.03|Articulaciones
08.03.01|Artrocentesis|1
08.03.02|Capsulotomía|2
08.03.03|Quiste artrosinovial|2
08.03.04|Capsuloplastía|3
08.03.06|Artrotomía - exploración intraarticular|3
08.03.07|Derivación articular|3
08.03.08|Artrovideoscopía diagnóstica de rodilla|4
08.03.09|Artrodesis de muñeca, tarso, hombro y codo|4
08.03.10|Meniscectomía artroscópica|4
08.03.11|Artroplastía convencional de hombro|5
08.03.12|Hemiartroplastía de cadera|5
08.03.13|Artroplastía (no de cadera)|5
08.03.14|Artrodesis triple chopart|5
08.03.15|Osteosíntesis de rodilla, hombro o cadera|5
08.03.16|Plástica de ligamento cruzado anterior o cruzado posterior o ligamento lateral (convencional)|5
08.03.17|Artrovideoscopía de hombro (manguito rotador)|6
08.03.18|Plástica de ligamento cruzado anterior o posterior por artroscopía|6
08.03.19|Artroscopía quirúrgica de tobillo|6
08.03.20|Mosaicoplastía videoartroscópica|6
08.03.21|Artoscopia de muñeca|5
## 08.04|Tendones
08.04.01|Extirpación de ganglión|2
08.04.02|Tenotomía simple|2
08.04.03|Tenotomía múltiple|3
08.04.04|Tenolisis (hasta 3 tendones)|3
08.04.05|Tratamiento de secuelas de parálisis (por cada procedimiento)|3
08.04.06|Tenorrafia (más de 3 tendones)|5
08.04.07|Tenorrafia o tenolisis (4 tendones o más)|5
08.04.08|Trasplante y alargamiento (hasta 3 tendones)|5
08.04.09|Tenoplastía con alargamiento en mano|6
08.04.10|Trasplante y alargamiento (más de 3 tendones)|6
08.04.11|Tenoplastía con alargamiento o acortamiento fuera de mano|6
## 08.05|Aponeurosis y Músculos
08.05.01|Tracción de partes blandas|2
08.05.02|Aponeurotomía - fasciotomía cutánea|2
08.05.03|Reparación de hernia muscular|2
08.05.04|Síntesis muscular|2
08.05.05|Extirpación de tumor de partes blandas de brazo o antebrazo (unilateral)|2
08.05.06|Sección de abductores|2
08.05.07|Exploración drenajes, cuerpo extraño o biopsia de músculos|2
08.05.08|Tortícolis congénita - miectomías|4
08.05.09|Sección de aductores|4
## 08.06|Miembro Superior
08.06.01|Panadizo|1
08.06.02|Reducción incruenta de luxaciones|2
08.06.03|Bursitis miembro superior, unilateral|2
08.06.04|Calcificaciones de hombro|2
08.06.05|Tumor de dedo|2
08.06.06|Amputación de dedo|2
08.06.07|Limpieza quirúrgica de mano|4
08.06.08|Cuerpo extraño de mano|3
08.06.09|Túnel carpiano|3
08.06.10|Epifiolisis|3
08.06.11|Resección de más de 3 falanges|3
08.06.12|Amputación de más de 3 dedos|3
08.06.13|Limpieza quirúrgica de fractura expuesta|4
08.06.14|Extirpación de aponeurosis palmar hasta 3 dedos|3
08.06.15|Resección de cabeza de radio|3
08.06.16|Mallet finger|3
08.06.17|Artroplastía de un dedo|3
08.06.18|Enfermedad de dequervain|3
08.06.19|Osteosíntesis de falange o metacarpiano (hasta 3 huesos)|4
08.06.20|Artrodesis de más de 3 dedos|4
08.06.21|Transposición de nervio periférico|4
08.06.22|Fractura supracondilea de codo|4
08.06.23|Extirpación de aponeurosis palmar más de 3 dedos|4
08.06.24|Amputación de antebrazo|4
08.06.25|Amputación de brazo|4
08.06.26|Amputación de mano|4
08.06.27|Artrodesis de hombro|4
08.06.28|Extirpación aponeurosis palmar más de 3 dedos (dupuytren)|4
08.06.29|Túnel carpiano por artroscopía|4
08.06.30|Osteosíntesis de hasta 2 huesos del carpo|4
08.06.31|Osteosíntesis de escafoide|5
08.06.32|Osteosíntes de cúbito o radio|5
08.06.33|Osteosíntesis de clavícula, costilla o escápula|5
08.06.34|Reimplante de dedo (hasta dos)|5
08.06.35|Artrodesis de cualquier hueso|5
08.06.36|Osteosíntesis de más de 2 huesos del carpo|5
08.06.37|Osteosíntesis de húmero, alargamiento, acortamiento, epifisiolisis, injerto de huesos, seudoartrosis, consolidación viciosa|6
08.06.38|Desarticulación interescapulo torácica - reemplazo parcial o total de hombro|6
08.06.39|Reimplante de más de dos dedos (unilateral)|6
08.06.40|Gran cirugía reconstructora de mano|7
08.06.41|Reimplante de miembro superior|8
08.06.42|Revision de hombro|7
## 08.07|Miembro Inferior
08.07.01|Cuerpo extraño de tobillo|1
08.07.02|Dedos en martillo cada uno|1
08.07.03|Bursitis miembro inferior unilateral|2
08.07.04|Metatarsalgia|2
08.07.05|Resección de exostosis|2
08.07.06|Ratas articulares|2
08.07.07|Luxación de cadera, reducción incruenta|2
08.07.08|Resección de exostosis y bursitis (operación de haglund)|2
08.07.09|Desgarro muscular de cara anterior de muslo|2
08.07.10|Luxación recidivante de rótula|3
08.07.11|Desgarro muscular de cara aposterior de muslo|3
08.07.12|Biopsia quirúrgica de cadera|3
08.07.13|Extirpación de aponeurosis plantar hasta 3 dedos|3
08.07.14|Patelectomía - osteosíntesis de rótula|3
08.07.15|Meniscectomía|3
08.07.16|Retoque de muñon|3
08.07.17|Exploración de heridas en partes blandas|3
08.07.18|Plástica de cuadriceps|3
08.07.19|Osteotomía correctora de pie|3
08.07.20|Acortamiento de los metatarsianos|3
08.07.21|Sinovectomía|3
08.07.22|Hallux valgus completo unilateral|3
08.07.23|Limpieza quirúrgica de fractura expuesta (no fémur)|4
08.07.24|Extracción de clavo intramedular|4
08.07.25|Extracción de prótesis de rodilla, un elemento|4
08.07.26|Pie plano unilateral|4
08.07.27|Artrodesis de pie y tibioastragalina|4
08.07.28|Artrodesis de rodilla|4
08.07.29|Amputación de pierna|4
08.07.30|Osteotomía correctora de tibia o peroné|4
08.07.31|Tendón de aquiles, plástica|4
08.07.32|Quiste - tumor de hueso poplíteo|4
08.07.33|Exéresis de neuroma de morton|4
08.07.34|Displacia de cadera|4
08.07.35|Epifiolisis de cadera|4
08.07.36|Osteosíntesis de tarso o metatarso hasta 2 huesos|4
08.07.37|Amputación de muslo, pie o antepie|4
08.07.38|Resección parcial de hueso infeccioso o tumoral|4
08.07.39|Pie bot unilateral|5
08.07.40|Extracción prótesis total de rodilla|5
08.07.41|Osteosíntesis de tibia o peroné o tobillo (calcáneo - astralago)|5
08.07.42|Fractura expuesta de fémur|6
08.07.43|Osteosíntesis de fémur (kunntcher y otras)|5
08.07.44|Artrodesis de cadera|5
08.07.45|Reducción cruenta de luxación de cadera|5
08.07.46|Extracción de prótesis total de cadera|5
08.07.47|Reparación ligamentaria de rodilla - ligamento laterales o cruzados (convencional)|5
08.07.48|Reemplazo parcial de cadera|5
08.07.49|Resección parcial de cadera|5
08.07.50|Cadera en resorte|5
08.07.51|Osteosíntesis tarso o metatarso más de 2 huesos|5
08.07.52|Plástica de ligamentos de rodilla no cruzados|5
08.07.53|Pie cavo o equino|5
08.07.54|Pie zambo, varo, equino supinado|5
08.07.55|Gran cirugía reconstructora de pie|7
08.07.56|Reducción de fractura o luxación de cócix|5
08.07.57|Fractura bimaleolar de tobillo o platillo tibial|5
08.07.58|Osteoplastía de tibia o peroné - alargamiento, acortamiento, epifiolisis, injerto de huesos, seudoartrosis, consolidación viciosa tibia o peroné|6
08.07.59|Desarticulación coxo femoral|6
08.07.60|Reemplazo total de cadera|6
08.07.61|Reemplazo total de fémur|6
08.07.62|Reemplazo total de rodilla|6
08.07.63|Luxación congénita de cadera, cruenta con o sin osteotomía|6
08.07.64|Amputación interilioabdominal|6
08.07.65|Trasplante oseo en procedimientos primarios|6
08.07.66|Trasplante oseo intercalares|6
08.07.67|Trasplante oseo osteoarticulares|6
08.07.68|Extracción de prótesis y reemplazo (mismo acto)|7
08.07.69|Reimplante de miembro inferior|7
08.07.70|Trasplante oseo combinados con prótesis|7
08.07.71|Trasplante oseo con artroplastías primarias|7
08.07.72|Trasplante oseo en revisión de artroplastías|8
08.07.73|Revision de cadera|7
08.07.74|Revision de rodilla|7
## 08.08|Cintura Escapular
08.08.01|Operación de hueso escapular|3
08.08.02|Exploración de hombro doloroso|4
08.08.03|Luxación recidivante de hombro|4
08.08.04|Resección de clavícula o acromio|5
08.08.05|Osteosíntesis clavicular|5
08.08.06|Escápula alata|5
08.08.07|Manguito rotador plástica (no artroscópico)|5
08.08.08|Desarticulación del brazo|6
08.08.09|Cirugías artroscópica de hombro|6
08.08.10|Cirugía artroscópia de codo|6
## 08.09|Cintura Pelviana
08.09.01|Reducción incruenta de luxación de cadera|2
08.09.02|Diastasis del pubis|4
08.09.03|Resección parcial de pelvis infecciosa o tumoral|4
08.09.04|Reducción cruenta de fractura de pelvis|5
08.09.05|Amputación interiliofemoral|6
08.09.06|Artroscopía de cadera|6
08.09.07|Osteosíntesis de fractura de pelvis|6
## 08.10|Neurocirugía de Columna
08.10.01|Movilización (quiropraxia )|2|B
08.10.02|Extirpación de cócix|3|B
08.10.03|Biopsia de vértebra|4|B
08.10.04|Reducción cruenta de luxación o fractura de columna sin fijación|5|B
08.10.05|Hernia de disco dorsolumbar|5|B
08.10.06|Exploración de columna por vía anterior|5|B
08.10.07|Reducción incruenta cervical o dorsal|5|B
08.10.08|Hernia de disco cervical un espacio vía posterior|6|B
08.10.09|Operación de frikolm (hasta 2 discos)|6|B
08.10.10|Vertebroplastía cada una|6|B
08.10.11|Hernia de disco dorsolumbar múltiple|6|B
08.10.12|Torticolis congénita|6|B
08.10.13|Artrodesis dorsal, lumbar o sacra (hasta 3 vértebras)|7|B
08.10.14|Artrodesis dinámica (colocación de espaciadores)|7|B
08.10.15|Sindrome apicotransverso|7|B
08.10.16|Reducción de columna con fijación hasta 7 horas|7|B
08.10.17|Artrodesis cervical|7|B
08.10.18|Plástica canal estrecho con discectomía hasta 2 espacios|7|B
08.10.19|Hernia de disco cervical por vía anterior|7|B
08.10.20|Colocación de prótesis cervical o dorsal o lumbar|7|B
08.10.21|Extracción de prótesis de columna|7|B
08.10.22|Resección parcial osea infecciosa o tumoral (coporectomía)|7|B
08.10.23|Artrodesis cervico-dorso-lumbar|8|B
08.10.24|Plástica canal estrecho con discectomía más de 2 espacios|8|B
08.10.25|Cirugía de columna por fibroscopía|8|B
08.10.26|Prótesis de columna más de 7 horas de cirugía|8|B
08.10.27|Intervención quirúrgica correctora de columna vertebral (escoliosis, lordosis, cifosis) hasta 7 horas|8|B
08.10.28|Revisión de fijación de columna|8|B
08.10.29|Intervención quirúrgica correctora de columna vertebral (escoliosis, lordosis, cifosis) más de 7 horas|9|B
08.10.30|Revision de herida quirurgica en columna dentro de las primeras 24 hs|4|B
08.10.31|Reintervención dentro de las primeras 24 hs|6|B
08.10.32|Reintervencion entre 24 hs y 72 hs|7|B
## 08.11|Cara
08.11.01|Reducción incruenta de luxación de maxilar|2
08.11.02|Meniscectomía maxilar|3
08.11.03|Fijación interdentaria|3
08.11.04|Osteosíntesis malar o maxilar (hasta 2 placas)|5
08.11.05|Osteosíntesis malar o maxilar más de 2 placas|6
# 09|OTORRINOLARINGOLOGIA
## 09.01|Oído
09.01.01|Escisión de lesiónn local de CAE|1
09.01.02|Incisión y drenaje de aurícula|2
09.01.03|Sutura de pabellón auricular|2
09.01.04|Incisión y drenaje de CAE y /o biopsia|2
09.01.05|Extracción de cuerpo extraño de CAE|2
09.01.06|Otoplastía de lóbulo hendido|2
09.01.07|Extirpación de coloboma auris|2
09.01.08|Miringotomía (paracentesis) unilateral|2
09.01.09|Miringotomía (paracentesis) unilateral con colocación de drenaje (diábolos o similar)|3
09.01.10|Molivización de estribo, unilateral|2
09.01.11|Punción de antromastoideo|2
09.01.12|Miringoplastía unilateral|3
09.01.13|Timpanoplastía unilateral|4
09.01.14|Plástica de pabellón auricular unilateral|4
09.01.15|Cirugía de agenesia de CAE unilateral|4
09.01.16|Resección de osteoma de CAE|4
09.01.17|Mastoidectomía simple unilateral|4
09.01.18|Mastoidectomía radical (operación radical de oído) unilateral|5
09.01.19|Antrotomía o atico-antrotomía unilateral|4
09.01.20|Cierre de fístula mastoidea|4
09.01.21|Estapedectomía unilateral|5
09.01.22|Laberintectomía unilateral|5
09.01.23|Fenestración del conducto semicircular externo, unilateral|5
09.01.24|Cirugía del saco endolinfático, unilateral|5
09.01.25|Timpanomastoidectomía, unilateral|5
09.01.26|Cirugía de la 2da y 3ra porción del nervio facial, unilateral|6
09.01.27|Cirugía del CAI y su contenido, unilateral|6
09.01.28|Cirugía 1ra porción del facial, nervio auditivo o vestibular, cualquiera fuera la vía de abordaje, unilateral|6
09.01.29|Agenesia del oído medio (cirugía plástica) , unilateral|6
09.01.30|Cirugía del glomus yugularis, unilateral|6
09.01.31|Fractura de peñasco (tratamiento quirúrgico), unilateral|6
09.01.32|Neurinoma del acústico por vía óptica (tratamiento quirúrgico)|7
## 09.02|Nariz y Senos Paranasales
09.02.01|Punción de seno con o sin inserción de sonda o biopsia de seno paranasal|1
09.02.02|Taponaje anterior o posterior|1
09.02.03|Sutura o biopsia de nariz - extracción de cuerpo extraño de fosa nasal|2
09.02.04|Escisión de pólipo retrocoanal unilateral|2
09.02.05|Endoscopía nasal diagnóstica|3
09.02.06|Resección de lesión local endonasal de septum, cornetes, hematoma septal o drenaje de septum)|3
09.02.07|Extirpación de pólipos nasales unilateral|3
09.02.08|Sinusotomía frontal externa (trepanación de seno frontal)|3
09.02.09|Turbinectomía parcial o completa simple (única o múltiple)|3
09.02.10|Resección submucosa de cornete inferior|3
09.02.11|Punción de seno esfenoidal|3
09.02.12|Septumplastía o resección de tabique nasal (operación de killian o similar)|4
09.02.13|Extirpación pólipos por endoscopías unilateral|4
09.02.14|Reconstrucción diferida de pirámide nasal con colgajo|4
09.02.15|Escición de tumores endonasales por rinotomia lateral|4
09.02.16|Sinusotomía maxilar simple|4
09.02.17|Sinusotompia maxilar radical|4
09.02.18|Sinusotomía frontal radical por vía externa|4
09.02.19|Sinusotomía esfenoidal|4
09.02.20|Etmoidectomía interna|4
09.02.21|Cierre de fístula oral del seno maxilar (bucoantral)|4
09.02.22|Rinoseptumplastía|5
09.02.23|Cirugia videoendoscopica rinosinusal unilateral|5
09.02.24|Tumores etmoidales|5
09.02.25|Cierre de fístula meningea por vía transinusal|5
09.02.26|Sinusotomías combinadas (frontal, etmoidal, etc.) por vía externa transmaxilar|5
09.02.27|Cirugía de fosa pterigo-maxilar (exploración, escisión de tumores, etc.) con o sin septumplastía|5
09.02.28|Atresia de coanas por vía palatina - sinusotomía combinada endoscópica|6
09.02.29|Reduccion de fractura de nariz|4
## 09.03|Boca y Lengua
09.03.01|Sección de frenillo lingual|1
09.03.02|Sialografía|1
09.03.03|Escisión local de lesión de labio|2
09.03.04|Incisión y drenaje, biopsia o sutura de labio|2
09.03.05|Biopsia de encia|2
09.03.06|Glosotomía con drenaje de absceso o hematoma|2
09.03.07|Glosoplastía|2
09.03.08|Extracción de cuerpo extraño o sutura de lengua|2
09.03.09|Escisión de lesión localizada superficial de lengua|2
09.03.10|Incisión y drenaje de paladar, absceso|4
09.03.11|Biopsia o sutura de paladar|2
09.03.12|Papilotomía del conducto de warthon o stenon|2
09.03.13|Sutura de encia|2
09.03.14|Extracción cruenta de cálculos salivales|3
09.03.15|Extirpación de ranula|3
09.03.16|Incisión y drenaje de glándula parotidia o submaxilar|3
09.03.17|Incisión y drenaje, biopsia o sutura de piso del boca o mejilla|2
09.03.18|Biopsia de glándula saliaval|2
09.03.19|Quiste de maxilar, pieza dental incluida|3
09.03.20|Cierre de fístula externa de boca|3
09.03.21|Palatoplastía|4
09.03.22|Gingivectomía parcial por tumores|3
09.03.23|Extracción dentaria hasta tres piezas|3
09.03.24|Parotidectomía de lóbulo superficial|4
09.03.25|Gingivectomía total ampliada|4
09.03.26|Escisión radical de glándula submaxilar|4
09.03.27|Arreglos hasta cuatro piezas|4
09.03.28|Resección parcial de paladar|5
09.03.29|Parotidectomía total|5
09.03.30|Operación comando de encias o trigonoretromolar|5
09.03.31|Escisión de lesión primaria de encias más vaciamiento cervical|6
09.03.32|Escisión ampliada de mucosa yugal y recomposición inmediata con injerto o colgajo (incluye toma)|5
09.03.33|Estomatoplastía con injerto (incluye toma)|5
09.03.34|Glosectomía subtotal ampliada|5
09.03.35|Extracción dentaria piezas múltiples (mas de tres piezas)|5
09.03.36|Reconstrucción total de paladar inmediata con injerto o colgajo|6
09.03.37|Resección total de paladar|6
09.03.38|Operación comando de paladar blando|6
09.03.39|Operación comando de glándula submaxilar|6
09.03.40|Operación comando de piso de la boca|6
09.03.41|Glosectomía total - operación comando de lengua|6
09.03.42|Arreglos más de cuatro piezas|6
## 09.04|Laringe
09.04.01|Intubación laringotraqueal (como único procedimiento)|1
09.04.02|Intubación con fibroscopía|2
09.04.03|Traqueostomía como única operación|4
09.04.04|Microcirugía de laringe|4
09.04.05|Laringoplastía o cordopexia o aritenoideopexia|4
09.04.06|Incisión y drenaje de laringe, absceso, pericondritis, etc.|4
09.04.07|Laringotomía mediana o laringofisura o cricotomía o laringografía como única operación|4
09.04.08|Laringuectomía parcial|5
09.04.09|Laringuectomía total|6
09.04.10|Laringuectomía radical con vaciamiento cervical|7
09.04.11|Laringofaringuectomía|7
09.04.12|Laringofaringuectomía con vaciamiento cervical|8
## 09.05|Faringe
09.05.01|Incisión y drenaje de amigdalas o tejido periamigdalino|2
09.05.02|Resto amigdalectomía o resto de adenoamigdalectomía|2
09.05.03|Escisión o electrocoagulación de amigdalas lingual|2
09.05.04|Biopsia de faringe o amigdala, faringe, biopsia de lesión nasofaringea|2
09.05.05|Exploración, extracción de cuerpo extraño, incisión y drenaje de tejido retrofaringeo por vía oral|2
09.05.06|Amigdalectomía o adenoidectomía|3
09.05.07|Adenoamigdalectomía|4
09.05.08|Hemorragia post adenoamigdalectomía|4
09.05.09|Cierre de faringostomía|4
09.05.10|Sutura de faringe|4
09.05.11|Escisión de divertículo faringoesofágico, faringe, fístula branquial o quiste branquial o vestigio|4
09.05.12|Faringoplastía|5
09.05.13|Somnoplastía|5
09.05.14|Faringuectomía parcial|5
09.05.15|Escisión radical de tumor de nasofaringeo|6
09.05.16|Operación comando de faringe con vaciamiento|7
## 09.06|Endoscopía ORL
09.06.01|Polipectomía nasal endoscópica unilateral|4
09.06.02|Etmoidectomía endoscópica|5
09.06.03|Cirguia videoendoscopica rinosinusal|5
09.06.04|Sinusotomía combinadas endoscópicas|5
# 10|OFTALMOLOGIA
## 10.01|Examenes Auxiliares
10.01.01|Fondo de ojo|1
10.01.02|Esquiascopías|1
10.01.03|Potenciales evocados|1
10.01.04|Electrorretinograma|1
10.01.05|Retinografía|1
10.01.06|Ecografía de ojo|1
10.01.07|Toma de tensión ocular|1
10.01.08|Gonioscopía|1
10.01.09|Examen con lámpara de hendidura|1
10.01.10|Test de ducción forzada y fuerza generada|1
10.01.11|Punción de cámara anterior para diagnóstico|1
10.01.12|Tomografía computada de ojo|2
10.01.13|Dacriocistografía|2
## 10.02|Orbita
10.02.01|Inyección de sustancias retrobulbares|1
10.02.02|Excenteración del contenido orbitario|3
10.02.03|Orbitotomía con escisión de lesión de orbita con extracción de cuerpo extraño, con exploración, biopsia, drenaje|3
10.02.04|Reparación plástica de orbita, con o sin injerto de piel|4
10.02.05|Excenteración del contenido orbitario con resección total de maxilar superior|6
## 10.03|Músculos Oculares
10.03.01|Estrabismo - dos músculos|3
10.03.02|Estrabismo más de dos músculos|4
10.03.03|Estrabismo más de cuatro músculos|5
10.03.04|Estrabismo bilateral|6
## 10.04|Globo Ocular
10.04.01|Neurotomía del nervio óptico|2
10.04.02|Enucleación ocular|3
10.04.03|Evisceración ocular|3
10.04.04|Hipema|3
10.04.05|Herida penetrante de ojo|4
10.04.06|Extracción de cuerpo extraño endoocular|4
10.04.07|Aspiración, lavado e implante de vitreo|4
10.04.08|Vitrectomía|6
## 10.05|Parpados
10.05.01|Absceso de párpado|1
10.05.02|Chalazión|2
10.05.03|Orzuelo|1
10.05.04|Extracción de puntos de párpados|1
10.05.05|Escisión de lesión local de párpados|2
10.05.06|Herida de párpado|2
10.05.07|Tarsorrafía|2
10.05.08|Ptosis palpebral|3
10.05.09|Blefaroplastía unilateral|4
10.05.10|Reconstrucción total de párpado (unilateral)|4
## 10.06|Conjuntiva
10.06.01|Inyección subconjuntival|1
10.06.02|Extracción de punto de conjuntiva|1
10.06.03|Extracción de cuerpo extraño superficial (conjuntiva)|1
10.06.04|Sutura de conjuntiva|2
10.06.05|Escisión de lesión conjuntival|2
10.06.06|Conjuntivoplastía unilateral|3
## 10.07|Cornea
10.07.01|Fulguración corneal con o sin raspado|1
10.07.02|Queratosentesis|2
10.07.03|Estafiloma|2
10.07.04|Sutura de cornea|3
10.07.05|Sutura de herida de cornea con prolapso de iris y o herida de cristalino|4
10.07.06|Injerto de cornea (unilateral) - queratoprótesis con anestesia regional|5
10.07.07|Injerto de cornea (unilateral)- queratoprótesis con anestesia general|6
## 10.08|Iris y Cuerpo ciliar
10.08.01|Diatermia o crioaplicacion escleral|2
10.08.02|Operación correctora de glaucoma|4
## 10.09|Retina
10.09.01|Aplicación de láser en retina|2
10.09.02|Fotocoagulación de retina|2
10.09.03|Retinopexia (diatermia y o crioaplicacion)|4
10.09.04|Retinopexia y esclerectomia|5
10.09.05|Retinopexia con o sin esclerectomia e implante, o con endoláser y vitrectomía posterior e inyección de sustancias (aceites de siliconas )|6
## 10.10|Esclera
10.10.01|Esclerotomia|3
10.10.02|Esclerotomia con extracción de cuerpo extraño intraocular|4
10.10.03|Injerto de esclera|4
## 10.11|Cristalino
10.11.01|Capsulotomia (cristalino)|2
10.11.02|Facoemulsificacion con asistencia anestesiológica|2
10.11.03|Extracción de masas cristalinas|3
10.11.04|Faco con anestesia para bulbar|3
10.11.05|Facofragmentacion y facoexeresis|4
10.11.06|Extracción intracapsular de cristalino|4
10.11.07|Extracción extracapsular de cristalino|4
10.11.08|Implante secundario de lente intraocular|5
10.11.09|Facoexeresis con implante de lente intraocular|5
## 10.12|Vía Lagrimal
10.12.01|Sondaje y lavado de via lagrimal unilateral|2
10.12.02|Drenaje de glandula y o saco lagrimal unilateral|2
10.12.03|Herida de via lagrimal|4
10.12.04|Plastica de via lagrimal unilateral|5
10.12.05|Dacricistorrinostomia|5
10.12.06|Dacriocistorrinoanastomosis|5
# 11|NEUROCIRUGIA
## 11.01|Generalidades
11.01.01|Punción transfontanoidal|2|B
## 11.02|Nervios Periféricos
11.02.01|Neurolisis extracraneal|2|B
11.02.02|Bloqueo extracraneal antalgico|2|B
11.02.03|Neurolisis de nervios perifericos|2|B
11.02.04|Inyeccion paravertebral de troncos y ganglios simpaticos|2|B
11.02.05|Neurolisis química|2|B
11.02.06|Transposición del cubital|3|B
11.02.07|Túnel carpiano – resección tumoral de nervio periférico|3|B
11.02.08|Neurotomía infra o supraorbitaria, suboccipital, temporal superior|3|B
11.02.09|Neurotomía del facial , glosofaríngeo o neumogástrico cervical|3|B
11.02.10|Injerto o anastomosis facial, hipogloso o similar|4|B
11.02.11|Exploración de plexo cervico-braquial|4|B
11.02.12|Resección de plexo hipogástrico|4|B
11.02.13|Neurorrafia con o sin injerto de un solo nervio|4|B
11.02.14|Exploración de plexo lumbo-sacro|5|B
11.02.15|Neurotomía trigeminal, vestibular o glosofaríngeo|7|B
11.02.16|Liberación nervio cubital|3|B
11.02.17|Liberación nervio mediano|3|B
11.02.18|Liberación nervio radial|3|B
11.02.19|Intervenciones en nervios ópticos|7|B
## 11.03|Sistema Neurovegetativo
11.03.01|Simpatectomía periarterial|3|B
11.03.02|Simpatectomía lumbar|3|B
11.03.03|Simpatectomía cervical|4|B
11.03.04|Simpatectomía toracica|5|B
11.03.05|Simpatectomía lumbar o toraxica por laparoscopía|6|B
## 11.04|Raquis
11.04.01|Mielografia – punción raquídea diagnóstica|2|B
11.04.02|Hernia de disco lumbar|5|B
11.04.03|Laminectomia descompresiva|5|B
11.04.04|Rizotomia ligamento dentado|5|B
11.04.05|Hernia de disco cervical|6|B
11.04.06|Espina bifida|6|B
11.04.07|Meningocele|6|B
11.04.08|Cordotomia|6|B
11.04.09|Lesiones adquiridas o congénitas vertebro-meningo-medulares|7|B
11.04.10|Aneurismas medulares- Aneurismas o malformaciones AV medulares|8|B
## 11.05|Cráneo y Cerebro
11.05.01|Arteriografia cerebral por cateterismo|2|B
11.05.02|Neumoencefalografia|3|B
11.05.03|Extracción de tubo de derivación|3|B
11.05.04|Drenaje ventricular continuo|4|B
11.05.05|Punción ventricular por trepanación|4|B
11.05.06|Neurolisis transoval del trigemino|4|B
11.05.07|Panarterectomia o panarteriografía cerebral|4|B
11.05.08|Revisión de válvulas|4|B
11.05.09|Diagnóstico estereotaxico para estudios de epilepsia|5|B
11.05.10|Reducción de fractura expuesta de cráneo|6|B
11.05.11|Lesión tumoral de los huesos del cráneo|5|B
11.05.12|Evacuación por punición de colección intracerebral o extracerebral|5|B
11.05.13|Craneotomia exploradora – colocación de catéter p/ pic|5|B
11.05.14|Descompresión orbitaria|5|B
11.05.15|Recambio de vávulas|6|B
11.05.16|Derivación ventrículo peritoneal|6|B
11.05.17|Hematoma extradural|6|B
11.05.18|Encefalomeningocele|6|B
11.05.19|Craneoplastía|6|B
11.05.20|Reparación de senos craneales|6|B
11.05.21|Extracción de cuerpo extraño de cerebro|6|B
11.05.22|Hematoma cerebral intradural|6|B
11.05.23|Ventriculocisternotomia|6|B
11.05.24|Tractotomia|6|B
11.05.25|Craneoestenosis|7|B
11.05.26|Neuroendoscopía (hasta 6 horas)|7|B
11.05.27|Lobectomia|7|B
11.05.28|Tumor cerebral intracraneal|7|B
11.05.29|Aneurisma cerebral único|7|B
11.05.30|Intervensiones estereotaxicas|7|B
11.05.31|Tumor de fosa posterior (Arnold-Chiari)|7|B
11.05.32|Tumor de hipofisis|7|B
11.05.33|Hipofisectomia transeptoesfenoidal|7|B
11.05.34|Implante de material radioactivo en cerebro|7|B
11.05.35|Tratamiento endovascular aneurisma cerebral|7|B
11.05.36|Tratamiento de seudoaneurisma con o sin colocación de stent|7|B
11.05.37|Tratamiento de aneurisma- coils mas stent|7|B
11.05.38|Tratamiento endovascular de malformación arterio-venosa|7|B
11.05.39|Neuroendoscopía (más de 6 horas)|8|B
11.05.40|Tumor cerebral más de 7 horas|8|B
11.05.41|Tumor de fosa posterior más d 7 horas|8|B
11.05.42|Tumor de hipofisis más de 7 horas|8|B
11.05.43|By-pass temporo-silviano|8|B
11.05.44|Tratamiento Endovascular de dos o mas aneurismas cerebrales|8|B
11.05.45|Revision de herida quirurgica en cerebro o craneo dentro de las primeras 24 hs|4|B
11.05.46|Reintervención dentro de las primeras 24 hs|6|B
11.05.47|Reintevencion entre las 24 hs y 72 hs|7|B
# 12|CARDIOVASCULAR
## 12.01|Vasos Periféricos
12.01.01|Canalización de venas o arterias como único procedimiento|1|B
12.01.02|Canalizacion arterial para monitoreo|2|B
12.01.03|Colocación vía central o catéter para quimioterapia|2|B
12.01.04|Flebografia de miembros|2|B
12.01.05|Ligadura unilateral de troncos profundos de miembros|2|B
12.01.06|Safenectomia externa unilateral|3|B
12.01.07|Safenectomia interna unilateral|3|B
12.01.08|Embolectomia de arteria periferica|3|B
12.01.09|Exploración de arteria periferica|3|B
12.01.10|Operación de cigorraga|3|B
12.01.11|Flebectomia segmentaria, varices residuales como única operación|3|B
12.01.13|Safenectomia interna unilateral con o sin comunicantes|3|B
12.01.14|Varices no residuales - microcirugía|3|B
12.01.15|Fistula arterio-venosa para hemodialisis|4|B
12.01.16|Operación de linton como único procedimiento|3|B
12.01.17|Operación de gockett como único procedimiento|3|B
12.01.18|Arteriografia|4|B
12.01.19|Angiografía del cuello|4|B
12.01.20|Angiografia de vasos uterinos|4|B
12.01.21|Angiografía medular|4|B
12.01.22|Angiografía control tratamiento aneurisma|4|B
12.01.23|Angiografía de vasos miembros inferior o superior|4|B
12.01.24|Tromboendarterectomia de vasos periféricos|4|B
12.01.25|Aneurisma de fístula arterio-venosa|4|B
12.01.26|Angioplastia de un vaso periférico con o sin stent|4|B
12.01.27|Trombectomia venosa profunda|4|B
12.01.28|Safenectomia interna unilateral con flebectomia segmentaria o varices residuales|4|B
12.01.29|Safenectomia interna unilateral con exeresis escalonada de multiples colaterales de pierna y muslo|4|B
12.01.30|Tratamiento con laser más flebectomía segmentaria|5|B
12.01.31|By-pass de vasos perisfericos unilateral – derivación aorto-ilíaca, o femoral|5|B
12.01.32|Ligadura subaponeurotica de perforantes directas , más safenectomía interna unilateral con exeresis escalonadas de colaterales insuficientes de pierna y muslo (unilateral)|5|B
12.01.33|Operacion de gockett, más safenectomía interna unilateral con exeresis escalonada de múltiples colaterales insuficientes de pierna y muslo unilateral|5|B
12.01.34|Angioplastia de mas de un vaso con o sin stent|6|B
12.01.35|Derivacion aorto-renal|6|B
12.01.36|Tumor de glomus carotideo|6|B
## 12.02|Grandes Vasos
12.02.01|Aortografia por punción – colocación de vía central|2|B
12.02.02|Sutura o ligadura de vasos profundos del cuello|4|B
12.02.03|Cavografia torácica o abdominal – colocación de portacath|3|B
12.02.04|Colocación de filtros en la vena cava|4|B
12.02.05|Cirugía de vena cava|4|B
12.02.06|Cirugía de ramas de la aorta abdominal|5|B
12.02.07|Cirugía de carótida|6|B
12.02.08|Derivación aorto-iliaca con o sin simpaticectomia|6|B
12.02.09|Cirugía de los grandes troncos arteriovenosos de tórax|6|B
12.02.10|Derivación aorto-bifemoral|6|B
12.02.11|Anastomosis portocava o espleno-renal|6|B
12.02.12|Aneurisma de aorta abdominal no complicado|6|B
12.02.13|Endoprótesis toracico-abdominal|6|B
12.02.14|Endoprótesis abdominal mas by-pass femoral-femoral o biiliaco|6|B
12.02.15|Endoprótesis aorto- biiliaco|6|B
12.02.16|Tratamiento endovascular de arterias uterinas|6|B
12.02.17|Tratamiento endovascular de seudoaneurisma periférico|6|B
12.02.18|Tratamiento quirúrgico de seudoaneurisma de arteria humeral o femoral|6|B
12.02.19|Aneurisma de aorta abdominal complicado|7|B
12.02.20|Aneurisma del cayado de la aorta ascendente o descendente|7|B
12.02.21|Endoprótesis toracico más by pass carotideo|7|B
12.02.22|Endoprótesis toracico-abdominal más embolización arteria renal|7|B
12.02.23|Endoprótesis arteria abdominal o arteria iliaca|7|B
12.02.24|Tratamiento Quirúrgico de seudo-aneurisma de arteria humeral o femoral con colocación de by pass o Prótesis|7|B
## 12.03|Corazón
12.03.01|Cardioversión|2|B
12.03.02|Colocación de marcapaso endocavitario|3|B
12.03.03|Cambio de generador|2|B
12.03.04|Pericardiosentesis|2|B
12.03.05|Cateterismo cardiaco para toma de presiones y muestras de sangre|3|B
12.03.06|Retiro de cables endocavitarios|3|B
12.03.07|Implantación de circulación asistida - coronariografía|3|B
12.03.08|Cateterismo mas angiocardiografia|4|B
12.03.09|Estudio electrofisiológico|3|B
12.03.10|Biopsia de pericardio|4|B
12.03.11|Pericardiotomía|4|B
12.03.12|Pericardiectomía no constrictiva|4|B
12.03.13|Colocación de marcapaso epicardico|4|B
12.03.14|Ablación de arritmias|4|B
12.03.15|Cardiorrafia|5|B
12.03.16|Angioplastia coronaria - ductus|5|B
12.03.17|Desfibrilador interno (colocación)|5|B
12.03.18|Septostomia interauricular (blalock- hannoq)|6|B
12.03.19|Pericardiectomia amplia (pericarditis contrictiva)|6|B
12.03.20|Angiosplastía coronaria mas stent|6|B
12.03.21|Septostomía auricular (Blaloc – Hannoq)|6|B
12.03.22|Reintervención dentro de las primeras 24 hs (practica de origen 12.03.01 a 12.03.21)|7|B
12.03.23|Valvuloplastía mitral, aortica o pulmonar|7|B
12.03.24|By-pass aorto-coronario simples|7|B
12.03.25|Cierre de defectos septales congénitos simples|7|B
12.03.26|Valvuloplastia mitral , aortica o pulmonar|7|B
12.03.27|By-pass mamario-coronario|7|B
12.03.28|Aneurisma ventricular|7|B
12.03.29|Anuloplastia mistral y tricuspidea|7|B
12.03.30|Electro fisiologia para tratamiento de arritmias|7|B
12.03.31|Reemplazo valvular unico|7|B
12.03.32|Cierre de defectos septales adquiridos|7|B
12.03.33|By-pass aorto-coronario múltiple|7|B
12.03.34|Derivación pericardio-peritoneal/ ventana pleuro-pericardica|7|B
12.03.35|Cardiomioplastía|7|B
12.03.36|Ablación de corazón|7|B
12.03.37|Reemplazo valvular o bivalvular con cirugía de revascularización|8|B
12.03.38|Tumoración cardiaca|7|B
12.03.39|Toilette cardiaco post-quirúrgico con o sin extracción de alambres|7|B
12.03.40|Insuficiencia mitral con civ post infarto|8|B
12.03.41|Reemplazo de una válvula cardiaca y plástica de otra|8|B
12.03.42|Cardiopatias congénitas complejas|8|B
12.03.43|Cirugía coronaria o valvular por minitoracotomía|8|B
12.03.44|Reemplazo bivalvular|8|B
12.03.45|Reoperación alejada más de 24 hs, cambio valvula , by pass, prótesis, banding|8|B
12.03.46|Trasplante de corazón|9|B
# 13|VASOS Y GANGLIOS LINFATICOS
## 13.00|Ganglios Linfáticos
13.00.01|Punción de ganglio|1
13.00.02|Biopsia de ganglios linfáticos o exeresis|2
13.00.03|Disección quirúrgica para linfoadenografia|2
13.00.04|Linfadenectomía cervical, axilar o inguinal como única operación|4
13.00.05|Escisión de lesión de conductos linfáticos (linfangioma higroma)|4
13.00.06|Resección de plexos hipogástricos|5
13.00.07|Vaciamiento ganglionar lumbo-aortico|6
# 14|CIRUGIA REPARADORA
## 14.01|Generalidades
14.01.01|Sutura de herida simple de menos de 10 cm excepto cabeza y cuello|1
14.01.02|Biopsia de piel excepto cabeza y cuello|1
14.01.03|Nevus, extirpación, hasta 3 excepto cabeza y cuello|1
14.01.04|Papilomas, extirpación hasta 5, excepto cabeza y cuello|1
14.01.05|Drenaje de hematoma, excepto cabeza y cuello|1
14.01.06|Quiste sebaceo, extirpación, excepto cabeza y cuello|2
14.01.07|Sutura de herida simple hasta 5 cm en cabeza y o cuello|2
14.01.08|Sutura de herida simple desde 5 cm hasta 10 cm en cabeza y o cuello|3
14.01.09|Biopsia de piel en cabeza o cuello|2
14.01.10|Absceso, drenaje en cabeza o cuello|4
14.01.11|Nevus, extirpación, hasta 3 en cabeza o cuello|2
14.01.12|Quiste sebaceo, extirpación en cabeza o cuello|3
14.01.13|Papilomas, extirpación, más de 5 cm|2
14.01.14|Tumor benigno de más de 5 cm|2
14.01.15|Sutura de herida simple de más de 10 cm excepto cabeza y cuello|2
14.01.16|Sutura de herida simple de más de 10 cm en cabeza o cuello|4
14.01.17|Injerto de piel|2
14.01.18|Cicatriz , resección simple|2
14.01.19|Angioma, inyección esclerosante|2
14.01.20|Escara, resección con el paciente en decúbito dorsal o lateral|3
14.01.21|Quiste sacro-coxigeo|2
14.01.22|Colgajo diferido|3
14.01.23|Colgajo de vecindad|3
14.01.24|Lipoma, resección con el paciente en decúbito dorsal o lateral|3
14.01.25|Gran cicatriz, resección - zetoplastía|3
14.01.26|Nevus, resección de más de 3 excepto en cabeza y cuello|3
14.01.27|Nevus, resección de más de 3 en cabeza y cuello|4
14.01.28|Angioma , extirpación|3
14.01.29|Tumor benigno de más de 5 cm, extirpación y cierre plástico|3
14.01.30|Lipoma, resección con el paciente en decúbito ventral|3
14.01.31|Escara, resección con el paciente en decúbito ventral|5
14.01.32|Queloide, resección|3
14.01.33|Queloide, tratamiento intralesional sin reseccion|2
14.01.34|Cicatriz retractil de cuello, resección e injerto|4
14.01.35|Resección de tumor maligno externo con reconstrucción plástica|4
14.01.37|Colgajo miocutaneo|4
14.01.38|Colgajo alejado|5
14.01.39|Cierre de grandes defectos con combinación de varios colgajos|5
14.01.40|Colgajos libres con microcirugía vascular|6
## 14.02|Cara
14.02.01|Extracción de cuerpo extraño profundo|3
14.02.02|Rinofina|3
14.02.03|Secuelas de paralisis facial en todas sus formas|4
14.02.04|Implante capilar|7
## 14.03|Cejas y Párpados
14.03.01|Tarsorrafia|2
14.03.02|Ectropion simple|2
14.03.03|Cantotomia externa|2
14.03.04|Epicanto|2
14.03.05|Blefaroplastía simple, no estetica|2
14.03.06|Injerto libre de ceja|2
14.03.07|Coloboma de párpado, reconstrucción simple|2
14.03.08|Colgajo en isla, reparación de ceja|3
14.03.09|Telecanto|4
14.03.10|Ptosis de párpado|4
14.04.01|Fractura simple de orbita, reducción y osteosintesis|3|B
14.04.02|Resección de tumor, intraorbitario mediante orbitotomia|3|B
14.04.03|Reconstrucción parcial de orbita|4|B
14.04.04|Fractura compleja de orbita, reducción, osteosintesis o injerto|5|B
14.04.05|Reseccion de tumor de orbita c/ reseccion ósea y reconstrucción inmediata|5|B
14.04.06|Exoftalmia endocrina o de otras causas|5|B
14.04.07|Reconstrucción total de orbita con injerto por tumores esfenoorbitarios o anoftalmia congénita|6|B
14.04.08|Hipertelorismo, fisura facial mediana|7|B
## 14.05|Bóveda Craneana
14.05.01|Craneoplastía|6|B
14.05.02|Remodelación de la bóveda craneana (turricefalia, plagioce falia)|7|B
## 14.06|Naríz
14.06.01|Reducción de fractura nasal|2
14.06.02|Rinoplastía simple, no estética|2
14.06.03|Extirpación parcial de nariz|2
14.06.04|Nariz leporina compleja|3
14.06.05|Rinoplastía compleja con o sin injerto, no estética|3
14.06.06|Reconstrucción nasal parcial|3
14.06.07|Fractura nasal asociada (naso-orbitaria , etc. )|5
14.06.08|Reconstrucción total de nariz mediante colgajos|5
## 14.07|Maxilares y Huesos Faciales
14.07.01|Incisión y drenaje de lesión dentaria|2|B
14.07.02|Extirpación dentaria|2|B
14.07.03|Biopsia ósea|2|B
14.07.04|Fractura simple|2|B
14.07.05|Extracción dentaria hasta 3 piezas|3|B
14.07.06|Retromentonismo no estético|3|B
14.07.07|Tumor óseo, extirpación|4|B
14.07.08|Anquilosis temporo mandibular, unilateral|4|B
14.07.09|Extracción dentaria múltiples|5|B
14.07.10|Tumor óseo, extirpación- reconstrucción|5|B
14.07.11|Anquilosis temporo-mandibular bilateral|5|B
14.07.12|Microsomia hemifacial, osteotomias e injertos oseos en mandibula|5|B
14.07.13|Maxilar inferior: prognatismo - retrognatismo|5|B
14.07.14|Obturación dentaria mas de 4 piezas|6|B
17.07.15|Fractura compleja de maxilares y huesos de la cara|6|B
14.07.16|Maxilar superior: pronasia - retronasia|6|B
14.07.17|Fisura congénita del esqueleto facial ( treacher- collins, etc. )|7|B
14.07.18|Osteotomía craneo facial sin tiempo neuroquirúrgico (crouzon apert, etc. )|7|B
14.07.19|Osteotomía craneofacial con tiempo neuroquirúgico|7|B
## 14.08|Labios
14.08.01|Bermellectomia|2
14.08.02|Resección cuneiforme de labio|2
14.08.03|Ectropion de labio|2
14.08.04|Comisuroplastía|2
14.08.05|Heridas complejas de labio|3
14.08.06|Colgajo para reconstrucción parcial de labio|3
14.08.07|Labio leporino unilateral incompleto|4
14.08.08|Colgajo de vecindad o a la distancia para reconstrucción total de labio|4
14.08.09|Labio leporino unilateral completo|5
## 14.09|Paladar
14.09.01|Palatorrafia|3
14.09.02|Estafilorrafia|3
14.09.03|Palatoplastía|4
## 14.10|Oreja
14.10.01|Lóbulo hendido de oreja|2
14.10.02|Microtia, reconstrucción en varios tiempos|2
14.10.03|Amputación de oreja|3
14.10.04|Oreja en asa y otras malformaciones|3
14.10.05|Reconstrucción de oreja parcial o total mediante colgajos y o injertos|4
14.10.06|Reconstrucción de conducto auditivo externo|4
14.10.07|Reimplante de oreja con microcirugía vascular|6
## 14.11|Cuello
14.11.01|Biopsia de ganglios linfáticos de cuello|2
14.11.02|Cierre de traqueostomía|2
14.11.03|Extracción de cuerpo extraño profundo de cuello|3
14.11.04|Quiste congénito (tirogloso , etc)|3
14.11.05|Fístula congénita de cuello|3
14.11.06|Cierre de colgajo de faringostoma|3
14.11.07|Vaciamiento radical unilateral de cuello|4
## 14.12|Mamas
14.12.01|Ginecomastia unilateral|3
14.12.02|Mama supernumeraria unilateral|3
14.12.03|Reconstrucción de areola o pezón|3
14.12.04|Implante mamario unilateral en cirugía reconstructiva|4
14.12.05|Implante mamario unilateral más pexia|5
14.12.06|Mastomegalia, cirugía reductora no estética unilateral|6
14.12.07|Reconstrucción mamaria con colgajo cutáneo o miocutaneo|6
14.12.08|Reductiva bilateral|7
## 14.13|Abdomen y Genitales
14.13.01|Reconstrucción de ombligo|2
14.13.02|Reconstrucción de vulva|4
14.13.03|Reconstrucción de pene y o escroto|4
14.13.04|Dermolipectomía|5
14.13.05|Liposucción abdomen|5
14.13.06|Hipospadia, epispadia, cada tiempo|5
14.13.07|Reconstrucción de pared abdominal|5
14.13.08|Dermolipectomía con ombligo|6
## 14.14|Miembros
14.14.01|Polidactilia|3
14.14.02|Sindactilia|3
14.14.03|Liposucción de cadera|5
14.14.04|Liposucción de muslo|5
14.14.05|Reimplante total o parcial de miembro con microcirugía|8
## 14.15|Quemados
14.15.01|Resección de escara con el paciente en decúbito lateral o dorsal|3
14.15.02|Curación de un quemado hasta el 30%|3
14.15.03|Curación de un gran quemado, mas del 30%|4
14.15.04|Resección de escara con el paciente en decúbito ventral|5
14.15.05|Grandes quemados, injertos|5
# 15|MISCELANIAS
## 15.00|Interconsultas
15.00.01|Consultorio anestesiológico|0.5
15.00.02|Interconsulta anestesiológica|1
15.00.03|Conversion eléctrica de arritmias cardiacas|1
15.00.04|Anestesia para terapia electroconvulsiva|1
## 15.01|Tomografía Axial Computada
15.01.01|Tomografía cerebro, órbita, cara, cuello o columna, con o sin contraste (un area)|3
15.01.02|Tomografía cerebro, órbita, cara, cuello o columna, con o sin contraste (dos o mas areas areas)|4
15.01.03|Tomografía tridimensional (un area)|3
15.01.04|Tomografía tridimensional (2 o mas areas)|4
15.01.05|Tomografía tórax con o sin contraste|4
15.01.06|Tomografía abdomen, con o sin contraste|4
15.01.07|Angiotomografia|4
15.01.08|Tomografía de cuerpo entero, con o sin contraste|5
## 15.02|Resonancia Magnética Nuclear
15.02.01|Resonancia- un área|3
15.02.02|Resonancia un área con espectroscopia|4
15.02.03|Resonancia- dos o mas áreas|4
## 15.03|Reanimación Cardíaca, Respiratoria y Cerebral
15.03.01|Reanimación fuera del acto anestesiologico|4
# 16|MEDICINA NUCLEAR
## 16.01|Radio Terapia
16.01.01|Anestesia para sesión de cobaltoterapia o acelerador|2
16.01.02|Implante intraorbitario (melanoma de retina)|2
16.01.03|Braquiterapia ginecología (colocacion de radiun)|2
16.01.04|Simulacion de tratamiento para radioterapia|2
16.01.05|Braquiterapia urológica|3
16.01.06|Braquiterapia instertisial de cabeza y cuello|3
16.01.07|Braquiterapia insterticial de partes blandas|3
16.01.08|Radioterapia de intensidad modulada(IMRT)|3
16.01.09|Braquiterapia urológica con abordaje abdominal para reseccion de plexos hipogastricos|6
16.01.10|Radioterapia intraoperatoria|7
16.01.11|Radioneurocirugia esterotaxica|7
## 16.02|Cámara Gama
16.02.01|Dinámica renal|2
16.02.02|Centellograma oseo|2
# 17|DOLOR
## 17.00|Dolor Agudo
17.00.01|Medicación sistémica antalgica (neuroleptoanalgesia, agripnianalgesia): c/24hs o fracción siguiente|1
17.00.02|Analgesia regional continua c/24 hs o fracción siguiente|1
17.00.03|Hipotermia controlada: c/24 hs 0 fracción siguiente|1
17.00.04|Bloqueo diagnóstico diferencial, por sesión|1
17.00.05|Acupuntura por sesión|1
17.00.06|Medicación sistémica antalgica (neuroleptoanalgesia, agripnianalgesia): 1ras 24 hs o fracción|2
17.00.07|Analgesia regional continua: 1ras 24 hs o fracción siguiente|2
17.00.08|Hipotermia controlada: 1ras 24 hs o fracción|2
17.00.09|Estimulación electrica transcutanea - eet: c/24 hs o fracción|2
17.00.10|Analgesia regional por bloqueo subaracnoideo con fenol o similar|2
17.00.11|Corticoides epidurales, por sesión|2
17.00.12|Morfina o morfinosimiles por vía epidural o subaracnoidea, por sesión: continua 1ras 24 hs o fracción|2
17.00.13|Bloqueo diagnóstico o neurolisis de plexo celiaco, ganglio estrellado, o similar .|2
17.00.14|Barbotaje de líquido cefaloraquideo 0 crioanalgesia|2
17.00.15|Bloqueo periférico ecoguiado o por neurolocalizacion para analgesia posquirurgica en las primeras 24 hs|2
# 18|CIRUGÍAS ESTÉTICAS REPARADORAS autorizadas por la Obra Social
18.00.01|Cicatriz reseccion simple|2
18.00.02|Capsulectomia|3
18.00.03|Diastasis de Rectos|3
18.00.04|Dermoabrasion|3
18.00.05|Ginecomastia unilateral-mama supernumeraria|3
18.00.06|Blefaroplastia Unilateral|4
18.00.07|Rinoplastia estetica|4
18.00.08|Cicatriz grande, reseccion, zetoplastia|4
18.00.09|Colocacion de Expansores Mamarios|4
18.00.10|FLAP unilateral incompleto|4
18.00.11|Implante de protesis UNILATERAL|5
18.00.12|Cambio Implante Unilateral|5
18.00.13|Cicatirz retractil en cuello reseccion e injerto|5
18.00.14|Cuadrantectomia c/ Vaciamiento Axilar|5
18.00.15|Expansor Cuero Cabelludo|5
18.00.16|FLAP unilateral completo|5
18.00.17|Implantes gluteos|5
18.00.18|Laser Panfacial|5
18.00.19|Lipoaspiracion hasta 2 zonas|5
18.00.20|Mastectomia Subradical - mastoplastia unilateral|5
18.00.21|Pexia Mamaria Unilateral|5
18.00.22|Rinoseptumplastia|5
18.00.23|Abdominoplastia|6
18.00.24|Abdominoplastia Vert-Horiz|6
18.00.25|Dermolipectomia|6
18.00.26|Dorsal Ancho|6
18.00.27|Lifting|6
18.00.28|Lifting Completo|6
18.00.29|Lipoaspiracion hasta 3 zonas|6
18.00.30|Mastectomia Radical con Vaciamiento Ganglionar|6
18.00.31|Pexia + Implante de Protesis Unilateral|6
18.00.32|Reductiva Mamaria Unilateral|6
18.00.33|TRAM|6
18.00.34|Lifting Endoscopico|7
18.00.35|Lipoaspiracion hasta 4 zonas|7`;

/* 65 practicas — anexo */
const NOMENCLADOR_DOLOR_TXT = `
# 19|Dolor cronico
## |Consulta
19.01.01|Primera consulta - consultorio o internación|1
19.01.02|Primera consulta domicilio|1 + 50%
19.01.03|Consultas posteriores - consultorio o internación|1/3 comp 1
19.01.04|Consultas posteriores domicilio|1
19.01.05|Solo recetas - 1 por mes|sin cargo
## |Paciente Oncológico
19.02.01|Paciente oncológico - atención clínica por mes o fracción mayor a 14 días|5|INT:si - no
19.02.02|Paciente oncológico - atención clínica por 2 a 14 días|3|INT:si - no
19.02.03|Neurolisis química nervios esplácnicos|6|RX:TAC;INT:si
19.02.04|Neurolisis con Rf de nervios esplácnicos|6|RX:TAC;RF:si;INT:si
19.02.05|Neurolisis química plexo celíaco|6|RX:TAC;INT:si
19.02.06|Neurolisis con Rf de plexo celíaco|6|RX:TAC;RF:si;INT:si
19.02.07|Neurolisis química de plexo hipogástrico superior|6|RX:si;INT:si
19.02.08|Neurolisis por Rf de plexo hipogástrico superior|6|RX:si;RF:si;INT:si
19.02.10|Bloqueo diagnóstico ganglio de Walter|4|RX:si;INT:si
19.02.11|Neurolisis química de ganglio de Walter|6|RX:si;INT:si
19.02.12|Neurolisis pcon Rf de ganglio de Walter|6|RX:si;RF:si;INT:si
19.02.13|Neurolisis ganglio esfeno-palatino con Rf|6|RX:si;RF:si;INT:si
19.02.14|Neurolisis nervio glosofaríngeo con Rf|6|RX:si;RF:si;INT:si
19.02.15|Neurolisis trigémino con Rf|7|RX:si;RF:si;INT:si
## |Raquis
19.03.01|Peridural lumbar con esteroides|2
19.03.02|Peridural dorsal o cervical con esteroides|2
19.03.03|Bloqueo transforaminal - 1 nivel|3|RX:si
19.03.04|Bloqueo transforaminal + de 1 nivel|4|RX:si
19.03.05|Neuromodulación con Rf pulsada ganglio raíz dorsal - 1 nivel|4|RX:si;RF:si
19.03.06|Neuromodulación con Rf pulsada ganglio raíz dorsal + de 1 nivel|5|RX:si;RF:si
19.03.07|Epiduroplastía - incluye dosis esteroides por catéter|6|RX:si;RF:si;INT:si
19.03.08|Bloqueo facetario diagnóstico - hasta dos facetas|3|RX:si
19.03.09|Bloqueo facetario diagnóstico + de 2 facetas|4|RX:si;RF:si
19.03.10|Neurolisis con Rf de nervios facetarios - dos niveles|5|RX:si;RF:si
19.03.11|Neurolisis con Rf de nervios facetarios + de dos niveles|6|RX:si;RF:si
19.03.12|Bloqueo diagnóstico articulación atlanto axoidea uni o bilateral|3|RX:si
19.03.13|Bloqueo diagnóstico articulación atlanto-occipital uni o bilateral|3|RX:si
19.03.14|Neuromodulación con Rf pulsada de articulación AA o AO|5|RX:si;RF:si
19.03.15|Bloqueo diagnóstico articulación sacro-ilíaca|3|RX:si
19.03.16|Neurolisis con Rf de articulación sacro-ilíaca|5|RX:si;RF:si
19.03.17|Discografía provocativa - un disco|3|RX:si
19.03.18|Discografía provocativa - dos a tres discos|4|RX:si
19.03.19|Nucleoplastía y/o anuloplastía con Rf - un disco|6|RX:si;RF:si
19.03.20|Nucleoplastía y/o anuloplastía con Rf - dos a tres discos|7|RX:si;RF:si;INT:si
## |Nervios Perisféricos
19.04.01|Bloqueo diagnóstico nervio periférico sin Rx|2
19.04.02|Bloqueo diagnóstico nervio periférico bajo radioscopía|3|RX:si
19.04.03|Neurolisis nervio periférico sin Rx|3
19.04.04|Neurolisis nervio periférico con Rx|4|RX:si
19.04.05|Neurolisis - modulación nervio periférico con Rf|4|RX:si-no;RF:si
## |Nervios Cráneos
19.05.01|Neurolisis-modulación ganglio esfeno-palatino con Rf|6|RX:si;RF:si;INT:si
19.05.02|Neurolisis-modulación nervio glosofaríngeo con Rf|6|RX:si;RF:si;INT:si
19.05.03|Neurolisis-modulación del trigémino con Rf|7|RX:si;RF:si;INT:si
## |Sistema Simpático
19.06.01|Bloqueo diagnóstico / terapéuticco ganglio estrellado|2|RX:si
19.06.02|Neurolisis química ganglio estrellado|3|RX:si
19.06.03|Neurolisis - modulación ganglio estrellado con Rf|4|RX:si;RF:si
19.06.04|Neurolisis química nervios esplácnicos|6|RX:TAC;INT:si
19.06.05|Neurolisis con Rf de nervios esplácnicos|6|RX:TAC;RF:si;INT:si
19.06.06|Neurolisis química de plexo simpático lumbar|6|RX:si;INT:si
19.06.07|Neruolisis con Rf de plexo simoático lumbar|6|RX:si;RF:si;INT:si
19.06.08|Neurolisis química de plexo hipogástrico superior|6|RX:si;INT:si
19.06.09|Neurolisis por Rf de plexo hipogástrico superior|6|RX:si;RF:si;INT:si
19.06.10|Bloqueo diagnóstico ganglio de Walter|4|RX:si;INT:si
19.06.11|Neurolisis química de ganglio de Walter|6|RX:si;INT:si
19.06.12|Neurolisis pcon Rf de ganglio de Walter|6|RX:si;RF:si;INT:si
## |Grandes Articulaciones
19.07.01|Bloqueo diagnóstico / terapéutico de rodilla|2|RX:si
19.07.02|Neuromodulación articulación de rodilla con Rf pulsada|3|RX:si;RF:si
19.07.03|Bloqueo diagnóstico / terapéutico de hombro|2
19.07.04|Neuromodulación articulación de hombro con Rf pulsada|3|RF:si
19.07.05|Bloqueo diagnóstico de cadera|3|RX:si
19.07.06|Neuroablación aferentes articulación de cadera con Rf|5|RX:si;RF:si;INT:si`;
