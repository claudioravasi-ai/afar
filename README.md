# AFAR by Yanina Andino

Aplicación de la **Asociación Fueguina de Anestesia y Reanimación**: valoración
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

| | Socio | Coordinador |
|---|---|---|
| Padrón de pacientes | Completo, compartido por la asociación | Completo |
| Fichas propias | Lectura y edición total | Todas |
| Fichas de colegas | Lectura completa; sólo puede cargar el **acto anestésico** | Todas |
| Estadísticas y facturación | Sólo su actividad | Toda la asociación |

El **padrón de pacientes es común**: cualquier socio busca por apellido, nombre
o DNI y encuentra a un paciente ya cargado por otro, sin duplicarlo. Al escribir
un DNI que ya existe, la app avisa y ofrece abrir la ficha existente.

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

---

## Qué incluye

### Portal del socio
- **Pacientes**: datos filiatorios, cobertura, antropometría con IMC y
  superficie corporal calculados.
- **Ficha anestésica** en cinco solapas:
  1. **Quirúrgico** — carácter (programada / urgencia / emergencia),
     institución, financiador, cirugía y diagnóstico CIE-10, equipo quirúrgico.
  2. **Valoración** — once secciones con cálculo automático de escalas.
  3. **Plan** — técnica, vía aérea, monitoreo, profilaxis, analgesia, destino.
  4. **Acto** — tiempos, técnica realizada, balance, checklist de la OMS,
     eventos adversos y Aldrete al egreso.
  5. **Honorarios** — modalidad de convenio, unidades, adicionales y estado
     administrativo.
- **Consentimiento informado** (Ley 26.529) con firma táctil del paciente y
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
| Copia de seguridad | **JSON** | Indicador de sincronización (encabezado) |

Todos llevan membrete de la AFAR, de la institución y del anestesiólogo
actuante, con su matrícula y su firma.

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
| `src/data-cie10*.js` | Catálogo CIE-10 |
| `src/data-cirugias*.js` | Catálogo quirúrgico con unidades anestésicas |
| `src/data-guias.js` | Guías y protocolos |
| `src/core.js` | Estado, persistencia, Firebase, iconos, motor de scores |
| `src/ui-*.js` | Cada pantalla |
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
