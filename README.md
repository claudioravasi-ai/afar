# AFAAR

Aplicación de la **Asociación Fueguina de Anestesia, Analgesia y Reanimación**: valoración
anestésica prequirúrgica, ficha del acto anestésico, estadísticas y facturación.

PWA en JavaScript vanilla, **sin build step ni dependencias**. Se abre con doble
clic o se sirve por HTTP para instalarla como aplicación en iOS, Android,
Windows y Mac.

---

## Cómo abrirla

**Con doble clic** — abrí `index.html`. Funciona todo salvo la instalación como
app y el service worker.

**Servida por HTTP** (recomendado, permite instalarla en el teléfono):

```bash
cd ~/Desktop/Claude/afar && python3 -m http.server 8777
```

Después entrá a `http://127.0.0.1:8777` desde la computadora, o a
`http://LA-IP-DE-TU-MAC:8777` desde el celular conectado a la misma red.
En iPhone: *Compartir → Agregar a pantalla de inicio*. En Android: *Instalar
aplicación*.

---

## Accesos

| Portal | Credencial |
|---|---|
| **Coordinador** | clave única `0112` (pestaña «Coordinador») |
| **Contable** | clave única `2358` (pestaña «Contable») |
| **Socio** | correo y contraseña propios, creados en «Registrarme» |
| **Socio de prueba** | `demo@afar.org.ar` / `demo1234` |
| **Segundo socio de prueba** | `demo2@afar.org.ar` / `demo1234` |

La aplicación arranca con **dos anestesiólogos de demostración** —Laura
Fernández y Juan Pablo Gómez—, tres pacientes y siete fichas, para ver cómo se
comporta cada pantalla con datos reales. Entre ellas hay una cesárea que
**evalúa Laura y opera Juan Pablo**: sirve para ver el reparto de honorarios y
los permisos entrando con una y otra credencial. Se borra todo de una vez con el botón **Borrar** del
cartel amarillo del panel, o desde *Coordinación → Catálogos*. Al borrarla, la
aplicación queda vacía y lista para el uso real.

El registro de cada socio queda **pendiente** hasta que el coordinador verifique
matrícula y comprobante de socio y lo apruebe.

**Qué ve cada uno:**

| | Socio | Coordinador | Contable |
|---|---|---|---|
| Pacientes | Aquellos en los que intervino | Completo | **Ninguno** |
| Padrón de la asociación | Sólo identificación, para no duplicar | Completo | **Ninguno** |
| Fichas propias | Lectura y edición total | Todas | **Ninguna** |
| Fichas compartidas con un colega | Lectura completa; escribe sólo su sección | Todas | **Ninguna** |
| Fichas ajenas ya tomadas | **No las ve** | Todas | **Ninguna** |
| Valoraciones con el acto libre | Las ve y puede tomar el acto | Todas | **Ninguna** |
| Estadísticas y facturación | Sólo su actividad | Toda la asociación | Toda, sin datos clínicos |
| Comunicación interna | Sus hilos | Sus hilos | Sus hilos |

**Acceso por intervención.** Cada anestesiólogo ve lo que hizo. La historia
clínica de un paciente en el que nunca intervino no es asunto suyo (Ley 26.529
art. 2 inc. c y Ley 25.326). Las fichas se agrupan en tres solapas:

- **Mías** — hice la valoración prequirúrgica, el acto anestésico, o los dos.
- **De colegas** — intervinimos dos: uno valoró y el otro anestesió. Los dos la
  ven entera, porque los dos la necesitan. El que anestesia tiene que poder leer
  el prequirúrgico; el que valoró tiene derecho a saber cómo terminó su
  paciente.
- **Disponibles** — valoraciones de cualquier socio cuyo acto **todavía no tiene
  anestesiólogo**. Se comparten con todos, porque cualquiera puede tener que
  tomar ese acto: de eso se trata una guardia. En cuanto alguien lo toma, sale
  de esta lista y pasa a ser suya y del que valoró.

El **padrón de pacientes sigue siendo común**, porque sin él la app se llena de
pacientes duplicados: antes de cargar a alguien hay que poder averiguar si ya
está. Pero de los pacientes en los que no se intervino se ven **sólo apellido,
nombre y documento**; los antecedentes, las alergias y las fichas se abren
cuando se les hace la valoración o el acto.

### Dos actos médicos, dos honorarios

Cada ficha puede involucrar a dos profesionales y genera hasta **dos
prestaciones facturables con distinto titular**:

| | Titular | Se factura |
|---|---|---|
| **Consulta prequirúrgica** (valoración) | Quien la realizó | Como consulta médica, con su propio valor por financiador |
| **Acto anestésico** | Quien operó | Por unidades del nomenclador y adicionales |

En la solapa *Quirúrgico* se elige el **anestesiólogo que realiza el acto**
—por defecto, el mismo que hizo la valoración—. Si es otro, ese colega:

- recibe el **recordatorio de la cirugía** igual que quien la evaluó;
- ve la ficha completa y **registra el acto anestésico**;
- carga **sus propios honorarios del acto**, que van a *su* facturación;
- **no puede tocar** la valoración, el plan ni la consulta prequirúrgica, que
  son autoría y responsabilidad de quien los firmó.

También puede tomar el acto por su cuenta con el botón *«Voy a realizar este
acto»*, si la asignación no estaba hecha.

Cada uno ve en su facturación sólo los renglones que le corresponden, sin doble
cobro. Si la consulta se hizo en la guardia o va comprendida en el acto, se
marca como **«Incluida en el acto»** y no genera renglón aparte. El documento
final identifica ambas autorías con sus matrículas y sus firmas.

El anestesiólogo que designa quién realiza el acto lo hace al final de la
valoración, en el **punto 14** del paso *Preanestesia*: cuando ya se sabe qué
anestesia hace falta. El **equipo quirúrgico** se registra en el paso
*Anestesia*, que es donde consta quién operó de verdad y no quién estaba
anotado en la programación.

### Envío a contaduría

Terminada la valoración —o la ficha anestésica— el profesional la manda al
contador de la asociación con un botón. **No hay ningún envío automático**: la
cesión la dispone siempre el profesional tratante, ficha por ficha, y queda
asentada en la auditoría con quién, qué y cuándo.

Al final de la ficha anestésica se adjunta la **foja o parte quirúrgico** que
firma el cirujano: se puede sacar una foto con el teléfono o subir el archivo
(PDF, JPG, PNG, HEIC de iPhone, Word). Las fotos se comprimen solas —lado mayor
de 1800 px— para que viajen rápido sin perder legibilidad. El parte se puede
adjuntar **después de firmar la ficha**, que es lo que pasa casi siempre, y lo
puede subir el colega que realizó el acto aunque la valoración sea de otro.

El contador recibe todo en dos solapas de su menú:

| Solapa | Qué contiene |
|---|---|
| **Valoración pre-anestésica** | La valoración prequirúrgica con el honorario de la consulta discriminado |
| **Ficha anestésica y parte quirúrgico** | La ficha del acto, el parte quirúrgico adjunto y el honorario del acto renglón por renglón: base, adicionales del nomenclador y total |

Cada solapa lista primero a los **profesionales** que enviaron algo, con su
cantidad de envíos y el total de honorarios; al abrir uno aparecen sus envíos, y
al abrir un envío, la documentación completa. Desde ahí el contador la descarga,
la imprime o la reenvía por correo cuando una **auditoría médica** de un
financiador la solicita.

Los archivos pesados —el documento y las fotos del parte— **no viajan por las
colecciones normales**: van a la rama `afar/archivos` de la base, que ningún
dispositivo escucha en vivo, y se leen de a uno cuando alguien abre el envío.
Si se sincronizaran como el resto, un solo parte quirúrgico fotografiado
llenaría el `localStorage` de todos los equipos.

---

## Qué incluye

### Portal del socio
- **Pacientes**: datos filiatorios, cobertura, antropometría con IMC y
  superficie corporal calculados.
- **Ficha anestésica** en cinco pasos, en el orden en que ocurre el acto
  médico. Cada paso se pinta solo con uno de cuatro colores —**completo**,
  **a medias**, **falta** y **pendiente**—, con el rótulo escrito debajo del
  punto, para saber de un vistazo si el registro está en condiciones de
  firmarse:
  1. **Paciente** — carácter (programada / urgencia / emergencia), institución,
     financiador, diagnóstico y cirugía del nomenclador. **No pide fecha ni
     hora**: cuando se hace la valoración, la cirugía todavía no está
     programada.
  2. **Preanestesia** — quince puntos con cálculo automático de escalas, plan
     anestésico, designación del anestesiólogo que va a operar y, como
     **punto 15, el consentimiento informado**, que se firma en la tablet, la
     computadora o el teléfono y sin el cual la valoración no se puede
     concluir.
  3. **Anestesia** — botón **TOMAR ACTO ANESTÉSICO**, fecha real de la cirugía,
     cronómetro de los seis tiempos, y cinco solapas que **se guardan solas** a
     medida que se editan: Resumen, Drogas, Signos vitales, Balance y Eventos.
  4. **Recuperación** — Aldrete modificado, dolor EVA, náuseas y destino.
  5. **Firmar** — resumen, firma del anestesiólogo y cierre del registro.

  Los pasos Paciente, Anestesia y Recuperación **no tienen botón Guardar**: se
  graban solos al tocar «Siguiente». Guardan a mano únicamente los dos que
  cierran un acto médico completo, Preanestesia y Firmar.
- **Honorarios** — modalidad de convenio, unidades, adicionales y estado
  administrativo. Al cerrar la ficha la app pregunta si se cargan en el momento
  o se difieren; si se difieren, **lo recuerda cada tres horas** hasta que se
  carguen.
- **Consentimiento informado** anestésico (Leyes 26.529 y 26.742, decreto
  1089/2012, art. 59 del CCyCN), con once apartados —naturaleza del acto,
  técnicas, monitoreo, riesgos frecuentes, poco frecuentes y graves, ayuno y
  medicación, situaciones imprevistas, transfusión, declaración jurada de
  antecedentes, revocación y datos personales— y firma táctil del paciente y
  del anestesiólogo.
- **Estadísticas** por día, semana, mes, año o rango, cruzadas por institución,
  financiador, cirugía, especialidad, patología, anestesiólogo, carácter,
  riesgo ASA, técnica y eventos adversos.
- **Facturación** mensual con totales por financiador, institución y modalidad;
  exportación a Excel y PDF.
- **Guías y protocolos** de referencia rápida y **calculadoras** de dosis,
  fluidos, sangrado permisible, rescate lipídico y dantrolene.

### Portal del coordinador
Solicitudes de acceso, padrón de socios, **prestadores**, catálogos y auditoría
de accesos y cambios.

### Portal contable

Acceso exclusivo del contador de la asociación, con clave propia (`2358`).
El **tablero económico no accede a ningún dato clínico**: trabaja sobre una
proyección anonimizada
de las prestaciones —importes, financiadores, instituciones y profesionales—
construida con una lista blanca de campos económicos, de modo que ni un cambio
futuro en la ficha pueda filtrar información de pacientes (Ley 25.326). De los
adicionales del nomenclador sólo recibe el **porcentaje total**: puede auditar
la aritmética de la factura sin enterarse de que el recargo vino de un ASA V o
de una obesidad mórbida.

Seis secciones:

1. **Tablero** — devengado, cobrado, adeudado y deuda a moneda de hoy;
   inflación acumulada y proyectada; antigüedad de la deuda por tramos;
   cruces por anestesiólogo, institución y financiador.
2. **Cartera y deuda** — detalle de cada saldo impago con sus días de mora,
   discriminando lo moroso de lo potencialmente incobrable.
3. **Indexación** — saldos ajustados por IPC **discriminados por anestesiólogo,
   institución y financiador**, con la pérdida de poder adquisitivo de cada uno
   y su proyección a doce meses.
4. **Situación fiscal** — categoría del monotributo de cada anestesiólogo sobre
   sus ingresos de los últimos doce meses, uso del tope, margen restante y
   proyección de recategorización; calendario de obligaciones y retenciones.
5. **Recomendaciones** — qué hacer con cada tramo de deuda y cuándo conviene
   indexar, generado a partir de los datos reales cargados.
6. **Parámetros** — serie de IPC, escala del monotributo, alícuotas y plazos.

⚠️ **La app no puede descargar sola el IPC ni la escala de ARCA**: no tiene
servidor propio. Los valores vienen precargados como referencia y el contador
los mantiene desde *Parámetros*; una vez cargados se replican por Firebase a
todos los dispositivos. Todo valor sin confirmar se muestra marcado.

### Comunicación interna

Correo/chat interno entre anestesiólogos acreditados, la coordinación y el
contable. Cada hilo es un **reclamo**, una **consulta** o un **aviso**, con
prioridad y estado.

Un hilo lo ven **únicamente sus participantes**: ni la coordinación ni el
contable leen conversaciones ajenas.

Cuando un reclamo lleva **más de 2 horas sin respuesta**, aparece en rojo en la
bandeja, se suma a la campana de avisos y se cuenta aparte —tanto para quien
debe contestar como para quien lo abrió y sigue esperando—. La alarma se apaga
sola al responder o al darlo por resuelto. La bandeja se refresca cada dos
minutos, así que el umbral se cumple sin recargar la aplicación.

### Prestadores
Instituciones y financiadores en un solo lugar, con el número de fichas de cada
uno. Se cargan CUIT, contacto, teléfono, correo, domicilio, plazo de pago,
valor de la unidad anestésica y notas del convenio; el CUIT y el plazo salen
impresos en el resumen de facturación y en la planilla Excel.

Los nombres se comparan **ignorando mayúsculas, acentos, puntos y espacios**:
«OSDE», «osde» y «O.S.D.E.» son el mismo prestador. Además detecta los que se
parecen —«Sancor» y «Sancor Salud», «Swiss Medical» y «Swis Medical»— y propone
fusionarlos: al hacerlo, todas las fichas y pacientes se reasignan solos, y el
valor de la unidad y los datos de facturación viajan con el nombre. Renombrar
funciona igual: arrastra el historial. Los que no tienen ninguna ficha se pueden
borrar; los que sí, darse de baja —salen de los desplegables y las fichas viejas
conservan el nombre con el que se emitieron.

Cuando dos nombres se parecen pero son prestadores realmente distintos, el
botón **«Son distintos»** los deja registrados como tales y el aviso no vuelve a
aparecer. Los pares descartados quedan listados en un desplegable, con quién y
cuándo los descartó, por si hace falta volver a revisarlos.

Al agregar un financiador desde una ficha, si se parece a uno existente la app
avisa y ofrece usar el que ya está, para no ensuciar el catálogo.

### Avisos y recordatorios
La campana del encabezado avisa de las cirugías de los próximos siete días, de
los datos que faltan en cada ficha, de las cirugías ya realizadas sin registro
del acto o sin honorarios, de la facturación del mes anterior sin presentar, de
los cobros demorados más de 60 días y del perfil incompleto. Dentro de cada
ficha, un cartel indica exactamente qué falta. Opcionalmente puede avisar con
una notificación del sistema al abrir la aplicación.

### Escalas que calcula solas
ASA-PS 2020 · El-Ganzouri (vía aérea difícil) · RCRI de Lee · ARISCAT ·
STOP-BANG · Apfel · Caprini · MET / DASI · Escala de fragilidad de Rockwood ·
Aldrete modificado · IMC, superficie corporal y peso ideal · CKD-EPI 2021 ·
control de ayuno según ASA 2023 · alertas de laboratorio y sugerencia de
estudios preoperatorios.

### Catálogos precargados
- **1.585 códigos CIE-10** curados con relevancia anestesiológica.
- **725 procedimientos quirúrgicos** de todas las especialidades, con unidades
  anestésicas sugeridas.
- 47 fármacos con su conducta perioperatoria según las guías vigentes.
- 8 instituciones de Tierra del Fuego y 33 financiadores.

Todo lo que no esté en un catálogo se puede **agregar manualmente desde el
propio buscador** y queda disponible para el resto de la asociación.

---

## Documentos que emite

| Documento | Formato | Dónde |
|---|---|---|
| Ficha anestésica completa | **Word (.doc) editable** | Ficha → Word |
| Ficha anestésica | **PDF** (imprimir → guardar como PDF) | Ficha → PDF |
| Resumen de facturación | **Excel (.xls)** | Facturación → Excel |
| Resumen de facturación | **PDF** | Facturación → PDF |
| Estadísticas del período | **Excel (.xls)** | Estadísticas → Exportar |
| Valoración pre-anestésica para el paciente | **PDF** adjunto | Preanestesia → Enviar valoración al paciente |
| Consentimiento informado firmado | **PDF** adjunto aparte | Preanestesia → Enviar valoración al paciente |
| Indicaciones para el día de la cirugía | **PDF** adjunto aparte | Preanestesia → Enviar valoración al paciente |
| Valoración pre-anestésica sola | **Word (.doc)** y **PDF** | Contaduría → envío → Documento |
| Ficha anestésica del acto sola | **Word (.doc)** y **PDF** | Contaduría → envío → Documento |
| Parte quirúrgico adjunto | El archivo original (PDF, JPG, …) | Contaduría → envío → Parte quirúrgico |
| Envíos de un profesional | **Excel (.xls)** | Contaduría → profesional → Planilla |
| Copia de seguridad | **JSON** | Indicador de sincronización (encabezado) |

Todos llevan membrete de la AFAAR, de la institución y del anestesiólogo
actuante, con su matrícula y su firma.

Los **tres documentos que se le mandan al paciente** viajan como archivos PDF
**separados**, no pegados uno abajo del otro en el cuerpo del correo, y **sin un
solo dato de facturación**. Los arma el conversor de Google a partir del HTML
que manda la app, de modo que no hace falta ninguna librería de PDF: ver
[ENVIO-DE-MAILS.md](ENVIO-DE-MAILS.md), que explica cómo republicar el programa
de Apps Script para habilitarlos.

---

## Sincronización en la nube

Sin configurar, la app guarda todo en el dispositivo (IndexedDB/localStorage) y
funciona sin conexión. Para que los datos se compartan entre equipos hay que
crear un proyecto de Firebase y pegar su configuración tocando el indicador
de estado del encabezado (dice **«Local»** hasta que se conecta, y **«En línea»**
después). Se hace una sola vez; a partir de ahí cada cambio se replica al
instante en todos los dispositivos y no hay nada más que administrar.
El paso a paso completo está en `PUBLICAR.md`.

El estado lo ve cualquiera, pero **conectar, cambiar o desconectar la base de
datos, y descargar o restaurar la copia de seguridad, exige la credencial de
coordinación**. Cada uno de esos cambios se asienta en Firebase con el nombre de
quien lo hizo, la fecha, la hora y el dispositivo, y queda visible en
*Coordinación → Auditoría*. Los intentos fallidos también se registran.

⚠️ Antes de usarla con pacientes reales, cambiá las reglas de la base de datos.
Ver `reglas-firebase.txt`.

---

## Desarrollo

El `index.html` de 389 KB es **generado**: no se edita a mano. Las fuentes están
en `src/` y se ensamblan con:

```bash
cd ~/Desktop/Claude/afar && python3 build.py
```

| Archivo | Contenido |
|---|---|
| `src/styles.css` | Sistema de diseño completo, claro y oscuro |
| `src/body.html` | Estructura del documento |
| `src/data-catalogos.js` | Instituciones, financiadores, fármacos, escalas |
| `src/data-antecedentes.js` | Catálogo de patologías por sistema, con su medicación habitual |
| `src/data-vademecum.js` | Vademécum anestésico de adultos y pediatría |
| `src/data-cirugias*.js` | Catálogo quirúrgico con unidades anestésicas |
| `src/data-guias.js` | Guías y protocolos |
| `src/data-fiscal.js` | IPC, escala del monotributo y motor de indexación |
| `src/core.js` | Estado, persistencia, Firebase, iconos, motor de scores |
| `src/ui-*.js` | Cada pantalla |
| `src/ui-envios.js` | Parte quirúrgico, envío a contaduría y las dos bandejas del contador |
| `src/seed*.js` | Demostración: socios, pacientes, fichas y envíos de ejemplo |
| `src/export.js` | Word, PDF y Excel |
| `src/app.js` | Navegación, panel y arranque |

Los íconos se regeneran con `python3 make-icons.py` (sin dependencias).

---

## Base doctrinal

American Society of Anesthesiologists (estándares de monitoreo, ayuno 2023,
ASA-PS 2020, consenso GLP-1) · Difficult Airway Society 2015 · ASRA (LAST 2018
y anticoagulación 4.ª edición) · MHAUS (hipertermia maligna) · ESAIC
(evaluación preoperatoria del adulto) · ACC/AHA 2024 (evaluación cardiovascular
perioperatoria) · Organización Mundial de la Salud (lista de verificación
quirúrgica) · ERAS Society · Consenso de manejo de NVPO, 4.ª edición.

Las guías incluidas son material de consulta rápida y no reemplazan el juicio
clínico ni la lectura de la fuente original.

---

## Marco legal

Los datos cargados son datos sensibles de salud alcanzados por la **Ley 25.326**
de Protección de los Datos Personales. La historia clínica y el consentimiento
informado se rigen por la **Ley 26.529** y su modificatoria **26.742**, con una
conservación mínima de diez años desde la última actuación.
