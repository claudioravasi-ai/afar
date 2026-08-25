# Enviar la documentación al paciente por correo

Instructivo para el coordinador. Se hace **una sola vez**. Después, cada
anestesiólogo sólo aprieta un botón: no configura nada en su computadora.

Tiempo estimado: 15 minutos. No hace falta instalar nada ni poner tarjeta.

---

## Antes de empezar

Necesitás **una cuenta de Google de la asociación**, no tu cuenta personal. Los
correos a los pacientes van a salir desde ahí, y va a figurar como remitente.

Si AFAAR no tiene una, creá una gratuita (por ejemplo
`valoraciones.afaar@gmail.com`). Conviene que la contraseña la tengan al menos
dos personas de la comisión.

---

## Paso 1 — Crear el programa

1. Entrá a **script.google.com** con la cuenta de la asociación.
2. Botón **Nuevo proyecto**.
3. Borrá todo lo que aparece en el editor (dice `function myFunction() {}`).
4. Abrí el archivo `apps-script/Codigo.gs` de la app, copiá **todo** su
   contenido y pegalo en el editor.
5. Arriba a la izquierda, donde dice *Proyecto sin título*, ponele
   **AFAAR — envío a pacientes**.

## Paso 2 — Poner una frase secreta

En el código que acabás de pegar, buscá cerca del principio la línea:

```
var CLAVE_COMPARTIDA = 'CAMBIAR-ESTA-FRASE-POR-UNA-LARGA-Y-PROPIA';
```

Cambiá ese texto por una frase larga inventada por vos, de unos 30 caracteres,
sin espacios. Por ejemplo: `afaar-ushuaia-2026-valoraciones-k7m2`

**Anotala**, la vas a necesitar en el paso 5.

Guardá con el ícono del disquete (o `Cmd + S`).

## Paso 3 — Autorizar el envío de correos

1. En la barra de arriba, en el desplegable de funciones, elegí **pruebaDeEnvio**.
2. Apretá **Ejecutar**.
3. Google te va a pedir permisos. Aceptá:
   - *Revisar permisos* → elegí la cuenta de la asociación
   - Va a aparecer **"Google no verificó esta aplicación"**. Es normal: la
     aplicación sos vos mismo. Clic en **Configuración avanzada** → **Ir a
     AFAAR — envío a pacientes (no seguro)**
   - **Permitir**
4. Revisá la casilla de la asociación: te tiene que haber llegado un mail de
   prueba. Si llegó, esta parte está lista.

## Paso 4 — Publicar

1. Arriba a la derecha, botón azul **Implementar** → **Nueva implementación**.
2. En el engranaje de la izquierda, elegí **Aplicación web**.
3. Completá:
   - **Descripción**: `v1`
   - **Ejecutar como**: **Yo** (la cuenta de la asociación)
   - **Quién tiene acceso**: **Cualquier persona**
4. **Implementar**.
5. Copiá la **URL de la aplicación web**. Termina en `/exec`. Es larga.

> **Ojo con este paso.** Si en *Quién tiene acceso* dejás "Sólo yo", la app no
> va a poder enviar y el botón va a dar error.

## Paso 5 — Conectarlo con la app

Abrí `src/email-config.js` y completá las dos líneas:

```js
const ENVIO_URL   = 'pegá acá la URL que termina en /exec';
const ENVIO_CLAVE = 'pegá acá la frase del paso 2';
```

Después, en la Terminal:

```bash
cd ~/Desktop/Claude/afar && python3 build.py
```

Y subí a GitHub el `index.html` nuevo y el `src/email-config.js`.

---

## Cómo se usa

El anestesiólogo abre la ficha y aprieta **Enviar al paciente**. La app pide
confirmación mostrando a qué dirección va, y envía.

Para que el botón funcione hacen falta tres cosas:

- El paciente tiene que tener **correo cargado** (en su ficha, campo *Correo
  electrónico*).
- El **consentimiento tiene que estar firmado**.
- La ficha tiene que ser propia (no se envía la ficha de un colega).

Cada envío queda registrado en la ficha y en la auditoría, con fecha, dirección
y quién lo mandó.

---

## Qué recibe el paciente

Un correo de la AFAAR con una explicación en lenguaje llano y **tres archivos
PDF separados**:

1. **Valoración pre-anestésica.** Filiación, antecedentes, medicación,
   alergias, examen, laboratorio, escalas de riesgo y plan anestésico.
2. **Consentimiento informado anestésico.** El texto completo, las
   declaraciones que marcó el paciente y las dos firmas —la suya y la del
   anestesiólogo—. Va aparte porque es un instrumento jurídico autónomo: se
   firma, se guarda y eventualmente se presenta solo.
3. **Indicaciones para el día de la cirugía.** En castellano llano: ayuno,
   qué medicación seguir tomando y cuál suspender, qué llevar, con quién venir
   y en qué casos avisar antes.

Los tres llevan el membrete de la institución donde se hizo la valoración, los
datos del profesional —nombre, título, matrícula nacional y provincial y
correo— y el pie legal con las leyes **26.529** y **26.742** (derechos del
paciente), **17.132** (ejercicio de la medicina) y **25.326** (protección de
datos personales).

**No llevan honorarios ni ningún dato económico.** Tampoco el registro
intraoperatorio, la recuperación ni la ficha firmada: eso es historia clínica
del equipo tratante y destino de auditoría, no correspondencia con el
paciente.

El botón sólo se habilita después de tocar **«Guardar valoración»** en el paso
Preanestesia, y exige que esté completo el punto 15, el consentimiento
informado. Un PDF de una valoración a medio cargar no le sirve a nadie.

Si el paciente responde, la respuesta le llega **al anestesiólogo**, no a la
casilla de la asociación.

---

## Por qué el remitente no es el mail del anestesiólogo

Era la idea original, pero no se puede hacer bien. Ningún servicio puede enviar
un correo que diga venir de una casilla ajena (`@gmail.com`, por ejemplo) sin
que el correo del destinatario lo marque como sospechoso o lo mande a spam. Es
la protección estándar contra la suplantación de identidad.

La solución que usan las clínicas, y la que quedó implementada: el correo sale
de la dirección institucional, y lleva **Responder a** con el mail del
anestesiólogo. El paciente ve claramente quién lo atendió, y si responde le
llega a él.

---

## Límites

- **40 envíos por día** (tope propio, se puede subir en `TOPE_DIARIO`).
- Google permite 100 destinatarios diarios en cuentas gratuitas.

---

## Seguridad — leer antes de usarlo con pacientes reales

La dirección del servicio y la frase secreta **viajan dentro del `index.html`,
que es público**. Alguien que lea el código puede encontrarlas y usar el envío
para mandar correos desde la cuenta de la asociación.

Contra eso hay tres barreras: el tope diario, el registro de todo lo enviado
(visible en *Ejecuciones*, dentro del editor de Apps Script) y la posibilidad de
cortar el acceso en dos minutos.

**Si sospechás uso indebido:** cambiá `CLAVE_COMPARTIDA` en Apps Script, poné la
misma frase nueva en `email-config.js`, reconstruí y subí. Los envíos con la
clave vieja quedan rechazados al instante.

Estas barreras limitan el daño, no lo impiden. La protección real requiere que
la app se identifique contra un servicio de autenticación — el mismo trabajo
pendiente que el de las reglas de la base de datos, en `reglas-firebase.txt`.
Conviene resolver los dos juntos antes del uso asistencial con pacientes reales.


---

## Actualización: adjuntos (agosto de 2026)

El portal contable puede reenviar la documentación de un envío a la auditoría
médica de un financiador. Para que el **parte quirúrgico viaje como archivo
adjunto** —y no sólo el documento dentro del cuerpo del mensaje— hay que volver
a publicar el programa de Apps Script:

1. Entrar a `script.google.com`, abrir el proyecto de AFAAR.
2. Pegar de nuevo el contenido de `apps-script/Codigo.gs` **completo**
   (conservando tu `CLAVE_COMPARTIDA`, que no cambió).
3. *Implementar → Gestionar implementaciones → editar (lápiz) → Versión: nueva
   → Implementar*. **Importante: editar la implementación existente**, no crear
   una nueva, para que la dirección `/exec` siga siendo la misma y no haya que
   tocar `src/email-config.js`.

La app se da cuenta sola de qué versión está publicada: le pregunta al servicio
antes de abrir el formulario de envío. Si todavía está la versión vieja, avisa
en pantalla y manda el documento en el cuerpo del mensaje, sin adjuntos; el
contador los descarga con «Descargar todo» y los agrega desde su casilla. No se
rompe nada mientras tanto.

Lo que agrega la versión nueva:

- `doPost` acepta `adjuntos: [{ nombre, mime, datos }]`, con `datos` en base64
  sin el prefijo `data:...;base64,`.
- Tope de 18 MB para el conjunto de adjuntos, con margen sobre el límite de
  Gmail (25 MB contando la codificación).
- `doGet` informa la versión y si admite adjuntos. No revela la clave ni ningún
  dato: sólo sirve para que la app sepa qué puede mandarle.
- El registro de envíos anota cuántos adjuntos llevó cada correo.

---

## Actualización: los tres PDF del paciente (agosto de 2026)

La app **no genera PDF**: no tiene ninguna librería de PDF y no hay proceso de
compilación que permita agregarla. Lo que hace es mandarle a Apps Script el
**HTML de cada documento**, y el conversor de Google lo pasa a PDF antes de
adjuntarlo. Sale un PDF de verdad, que abre en cualquier teléfono, sin cargar
un solo kilobyte más en la app.

Para que esto funcione hay que **volver a publicar el programa**, igual que con
los adjuntos:

1. Entrar a `script.google.com`, abrir el proyecto de AFAAR.
2. Pegar de nuevo el contenido de `apps-script/Codigo.gs` **completo**
   (conservando tu `CLAVE_COMPARTIDA`, que no cambió).
3. *Implementar → Gestionar implementaciones → editar (lápiz) → Versión: nueva
   → Implementar*. **Editar la implementación existente**, no crear una nueva,
   para que la dirección `/exec` siga siendo la misma.

Hasta que se republique, la app **no deja mandar nada**: antes de enviar le
pregunta al servicio qué versión está publicada y, si es la vieja, avisa en
pantalla y cancela. Es a propósito. La versión vieja no conoce el campo
`documentos` y mandaría el correo **sin un solo archivo adjunto**, que es peor
que fallar: el anestesiólogo creería que el paciente recibió su documentación.
El resto de la app funciona igual; lo único que espera la republicación es
este botón.

Lo que agrega la versión 3:

- `doPost` acepta `documentos: [{ nombre, html }]` y convierte cada uno a PDF
  con `Utilities.newBlob(html, 'text/html', nombre).getAs('application/pdf')`.
- Los PDF convertidos se suman a los adjuntos binarios que ya existían y se
  miden contra el mismo tope de 18 MB.
- `doGet` informa `version: 3` y `documentosPdf: true`.
