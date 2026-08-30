# Poner AFAAR en línea — paso a paso

Son **tres cosas independientes**. Podés hacerlas en cualquier orden, pero las
tres tienen que estar para que la app funcione entera:

| | Qué habilita | Si falta |
|---|---|---|
| **1. Apps Script** | Los tres PDF que se le mandan al paciente | El botón «Enviar valoración al paciente» avisa y cancela. El resto anda. |
| **2. Firebase** | Que todos los dispositivos vean lo mismo **en tiempo real** | Cada equipo guarda lo suyo por separado, sin compartir nada. |
| **3. GitHub Pages** | La dirección web desde donde se abre la app | Sólo se puede abrir el archivo local, en tu Mac. |

Tu repositorio es **`claudioravasi-ai/afar`** y la dirección pública va a ser
**`https://claudioravasi-ai.github.io/afar/`**.

---

# PARTE 1 — Apps Script (los PDF del paciente)

La app **no genera PDF**: no tiene librería de PDF ni proceso de compilación
donde meterla. Lo que hace es mandarle a Google el **HTML de cada documento**, y
el conversor de Google lo devuelve como PDF ya listo para adjuntar.

Eso lo hace la **versión 3** del programa. Si tenés publicada una anterior, la
app **detecta la versión vieja y cancela el envío** en vez de mandarle al
paciente un correo sin ningún archivo adjunto.

## 1. Abrir el proyecto

1. Entrá a **https://script.google.com** con la cuenta de Google de la AFAAR
   (la misma desde la que salen los correos, no una personal).
2. Abrí el proyecto de AFAAR que ya existe. **No crees uno nuevo:** si creás
   otro, cambia la dirección `/exec` y habría que tocar el código de la app.

## 2. Reemplazar el código

1. En el editor, seleccioná **todo** el contenido de `Codigo.gs` y borralo.
2. Abrí en tu Mac el archivo **`afar/apps-script/Codigo.gs`** y copiá **todo**.
3. Pegalo en el editor de Apps Script.
4. Buscá la línea de arriba de todo:

   ```js
   var CLAVE_COMPARTIDA = 'CAMBIAR-ESTA-FRASE-POR-UNA-LARGA-Y-PROPIA';
   ```

   y reemplazala por la que ya venías usando, que es la que está en
   `src/email-config.js`:

   ```js
   var CLAVE_COMPARTIDA = 'AFAAR-CONTACTO-PACIENTES-x7kq93m4';
   ```

   ⚠️ **Si no hacés este paso, el envío deja de funcionar**: el programa
   rechaza los pedidos de la app por clave incorrecta.
5. Tocá el ícono del **disquete** (Guardar proyecto).

## 3. Volver a publicarlo

Este es el paso que la gente saltea, y sin él **no cambia nada**: Apps Script
sigue sirviendo la versión anterior.

1. Arriba a la derecha: **Implementar → Gestionar implementaciones**.
2. En la implementación que ya existe, tocá el **lápiz** (Editar).
3. En **Versión** elegí **«Versión nueva»**.
4. Tocá **Implementar**.

**Editá la que existe, no crees una nueva.** Así la dirección que termina en
`/exec` sigue siendo la misma y no hay que tocar `src/email-config.js`.

## 4. Comprobar que quedó

Abrí en el navegador la dirección que está en `src/email-config.js` (la que
termina en `/exec`). Tiene que responder algo así:

```json
{"ok":false,"error":"Este servicio sólo recibe envíos.","version":3,
 "adjuntos":true,"documentosPdf":true}
```

Lo que importa es **`"version":3`** y **`"documentosPdf":true`**. Si dice
`version: 2`, la publicación del paso 3 no se hizo o no se guardó.

---

# PARTE 2 — Firebase (tiempo real y base cerrada)

La conexión **ya está escrita dentro de la app** (`src/firebase-config.js`,
proyecto `afar-anestesia`). No hay que pegar nada en ninguna pantalla. Lo que sí
hay que hacer, en la consola, son **dos cosas**.

## 1. Activar el proveedor Anónimo

Desde el 23-08-2026 la app **pide sola un pase a Firebase** al arrancar, sin
que el usuario vea ni haga nada. Si el proveedor no está activado, ese pase
falla y la app se queda trabajando **sólo en el dispositivo**.

1. **https://console.firebase.google.com** → proyecto **`afar-anestesia`**.
2. Menú izquierdo: **Compilación (Build) → Authentication**.
3. Si es la primera vez, tocá **«Comenzar»**.
4. Pestaña **Sign-in method** → en la lista, **Anónimo**.
5. Activá el interruptor y tocá **Guardar**.

Este pase **no reemplaza el ingreso a la app**: el socio sigue entrando con su
correo y su contraseña, y el coordinador con su credencial. Es la cerradura de
la *base de datos*, no la de la aplicación.

## 2. Cerrar las reglas

1. **Compilación (Build) → Realtime Database → pestaña «Reglas»**.
2. Borrá lo que haya y pegá **exactamente** esto:

```json
{
  "rules": {
    "afar": {
      ".read": "auth != null",
      ".write": "auth != null",
      "fichas":    { ".indexOn": ["ownerUid", "fecha"] },
      "pacientes": { ".indexOn": ["ownerUid"] },
      "archivos": {
        "$id": {
          ".write": "auth != null && newData.child('datos').val().length < 12000000"
        }
      }
    }
  }
}
```

3. Tocá **Publicar**.

Con esto, quien conozca la dirección de la base **ya no puede leerla ni
escribirla** sin pasar por la app. Antes alcanzaba con conocer la URL para
llevarse todas las historias clínicas.

> **Ojo con el orden.** Si cerrás las reglas *antes* de activar el proveedor
> Anónimo, la app deja de sincronizar y avisa «La nube rechazó el acceso».
> No se pierde nada —sigue guardando en el dispositivo— pero hasta que actives
> el proveedor nadie ve lo del otro. Hacé primero el punto 1.

## 3. Restringir la clave de API al dominio — opcional

La clave de API viaja dentro del `index.html`, que es público. Se le puede pedir
que sólo funcione desde tu dirección.

> **Esto NO es obligatorio y conviene dejarlo para el final.** La app funciona
> perfectamente sin la restricción. Y tiene un riesgo: esta clave es la que usa
> la app para **pedir el pase anónimo a Firebase**. Si la restricción queda mal
> escrita, el pase falla y la app **deja de sincronizar en silencio** — vuelve
> a decir «Local» y cada equipo queda aislado. No se pierde ningún dato, pero
> cuesta darse cuenta de qué pasó.
>
> Hacelo **después** de tener la app publicada y andando, nunca antes.

### Dónde está — no hay que crear nada

Todo proyecto de Firebase **es** también un proyecto de Google Cloud: se crea
solo, con el mismo nombre. `afar-anestesia` ya existe ahí. Lo que pasa es que la
consola no lo muestra hasta que se lo pedís, y por eso parece que no está.

Entrá con el proyecto ya elegido:

```
https://console.cloud.google.com/apis/credentials?project=afar-anestesia
```

El `?project=afar-anestesia` del final es lo que lo selecciona. Si entrás a
`console.cloud.google.com` a secas, quedás en el selector vacío.

Si aun así no aparece, es la **cuenta de Google**: mirá el avatar de arriba a la
derecha, tiene que ser la misma con la que entrás a Firebase. También podés
tocar la pestaña **«Todos»** del selector de proyectos —no «Recientes»— y buscar
`afar-anestesia`.

### Los pasos

1. En **Credenciales**, abrí la clave llamada
   **«Browser key (auto created by Firebase)»**.
2. En **Restricciones de aplicación** elegí **Sitios web (referentes HTTP)**.
3. Agregá estas **tres** líneas:

   ```
   https://claudioravasi-ai.github.io/*
   http://localhost/*
   http://127.0.0.1/*
   ```

   La tercera hace falta porque `abrir-afar.command` abre la app en
   `http://127.0.0.1:8777`, que para Google es una dirección **distinta** de
   `localhost`. Sin esa línea, la copia local deja de sincronizar.

4. **Guardar** y esperar unos 5 minutos a que tome efecto.
5. Abrí la app en la dirección pública y confirmá que arriba diga **«En línea»**.
   Si dice «Local», volvé la restricción a **«Ninguna»** y la sincronización
   vuelve enseguida.

### Lo que sí deja de andar

La línea que imprime `abrir-afar.command` para ver la app **desde el celular en
la misma red** (`http://192.168.x.x:8777`) va a dejar de sincronizar: esa IP
cambia y no se puede poner en la lista. Para probar desde el teléfono, usá la
dirección pública de GitHub Pages.

## 4. Elegir región y respaldos

- La **región** de la base se elige al crearla y **no se puede cambiar**. Para
  Argentina: `southamerica-east1` o `us-central1`.
- Descargá el **respaldo JSON** con regularidad desde
  *Coordinación → Nube y respaldos*. Contiene datos de salud: guardalo cifrado.

---

# PARTE 3 — Subir a GitHub a mano

Sin terminal, desde la web. Sirve igual para la primera vez que para cada
actualización.

## 1. Reconstruir antes de subir nada

En tu Mac, **siempre** antes de subir:

```bash
cd ~/Desktop/Claude/afar && python3 build.py
```

`index.html` se **arma** a partir de `src/`: si editás `src/` y no reconstruís,
subís la versión vieja. El comando tiene que responder `OK  index.html …`.

## 2. Qué archivos y qué carpetas

### Lo que hace funcionar la app — **obligatorio**

| | Qué es |
|---|---|
| `index.html` | **La app entera**, 1 MB. Es el archivo que importa. |
| `manifest.webmanifest` | Nombre, colores e íconos para instalarla como app |
| `sw.js` | Service worker: la hace andar sin conexión |
| `icons/` (carpeta, 3 PNG) | `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` |
| `manual/` (carpeta, 11 JPG) | Las fotos del manual de uso. **No van adentro de `index.html`**: se cargan por ruta relativa, así que sin esta carpeta el manual se ve con las imágenes rotas |
| `manual-afaar.pdf` | El manual en PDF que **la propia app ofrece descargar** desde la vista Manual. Sin él, ese botón da error 404 |
| `manual-afaar-completo.pdf` | Lo mismo, la versión con el anexo de coordinación. El botón sólo lo ve el coordinador |
| `.nojekyll` | Archivo **vacío**. Evita que GitHub procese la carpeta a su manera |

Con esos ocho la app ya abre y funciona completa.

### El código fuente — **muy recomendable**

| | Por qué conviene |
|---|---|
| `src/` (carpeta, 37 archivos) | Es de donde sale `index.html`. Sin esto no se puede volver a modificar la app desde otra computadora |
| `build.py` | El armador |
| `apps-script/Codigo.gs` | El programa de los correos |
| `README.md`, `PUBLICAR.md`, `ENVIO-DE-MAILS.md`, `reglas-firebase.txt` | La documentación |
| `make-icons.py`, `manual-a-word.py`, `abrir-afar.command` | Utilidades |

### Lo que **no** hay que subir

- `.DS_Store` — basura de macOS.
- `.claude/` — configuración local.
- `respaldos/` y cualquier `afar-respaldo-*.json` — **contienen historias
  clínicas**. No van a un repositorio público, nunca.
- `GUÍA COMPLETA: AFAR en GitHub y Firebase.webarchive` — pesa 1,6 MB y no
  sirve para nada en línea.
- `manual-word/` — es la plantilla y la salida intermedia de
  `manual-a-word.py`. No la usa la app.

## 3. Ver los archivos ocultos en el Finder

`.nojekyll` y `.gitignore` empiezan con punto y el Finder los esconde. En la
ventana del Finder apretá:

**`Cmd` + `Shift` + `.`** (punto)

Aparecen en gris. Con la misma combinación se vuelven a ocultar.

## 4. Subir

1. Entrá a **https://github.com/claudioravasi-ai/afar**.
2. Botón **`Add file`** (arriba a la derecha) → **`Upload files`**.
3. Abrí el Finder en `~/Desktop/Claude/afar` y **arrastrá al navegador**:
   - los archivos sueltos: `index.html`, `manifest.webmanifest`, `sw.js`,
     `.nojekyll`, `manual-afaar.pdf`, `manual-afaar-completo.pdf`, `build.py`
     y los `.md`;
   - **las carpetas enteras** `icons`, `manual`, `src` y `apps-script`.
     Arrastrando la carpeta, GitHub respeta la estructura de adentro. No las
     abras ni subas los archivos sueltos: quedarían todos en la raíz y la app
     no los encontraría.
4. Abajo, en **Commit changes**, escribí qué cambiaste. Por ejemplo:
   `Flujo de cinco pasos, consentimiento como punto 15 y PDF al paciente`.
5. Dejá marcado **«Commit directly to the `main` branch»**.
6. Tocá **Commit changes**.

Los archivos que ya existían se **reemplazan** por los nuevos; los que no
tocaste quedan como estaban.

> **Si subís sólo una corrección chica**, alcanza con `index.html` y el archivo
> de `src/` que cambió. Pero `index.html` **siempre**: es lo único que se
> ejecuta.

## 5. Activar GitHub Pages (una sola vez)

1. En el repositorio: pestaña **Settings**.
2. Menú izquierdo: **Pages**.
3. **Source**: `Deploy from a branch`.
4. **Branch**: `main`, carpeta **`/ (root)`** → **Save**.
5. Esperá 1 o 2 minutos y recargá. Arriba aparece la dirección:

   **`https://claudioravasi-ai.github.io/afar/`**

## 6. Cuánto tarda en verse el cambio

Entre **1 y 2 minutos**. En la pestaña **Actions** del repositorio se ve el
tilde verde cuando terminó de publicar.

A los socios les llega sola al abrir la app: el service worker pide siempre la
última versión y usa la copia guardada sólo si no hay señal. Si a alguien le
quedó una versión vieja pegada, que cierre la app del todo y la vuelva a abrir.

---

# PARTE 4 — Instalar en cada dispositivo

Una vez publicada, abrila desde **`https://claudioravasi-ai.github.io/afar/`**
e instalala. Queda con ícono propio, a pantalla completa y sin barra del
navegador:

- **iPhone / iPad** — abrir en **Safari** (no en Chrome), botón **Compartir**
  → *Agregar a pantalla de inicio*.
- **Android** — en Chrome, menú **⋮** → *Instalar aplicación*.
- **Mac / Windows** — en Chrome o Edge, el ícono **⊕** de la barra de
  direcciones.

Cada socio entra con **su** correo y **su** contraseña. El primer ingreso queda
**pendiente** hasta que la coordinación verifique matrícula y comprobante y lo
apruebe.

---

# PARTE 5 — Comprobar que quedó todo bien

Cinco comprobaciones, en orden. Si alguna falla, el problema está ahí.

1. **La app abre.** Andá a `https://claudioravasi-ai.github.io/afar/`. Tiene
   que aparecer la pantalla de ingreso con el logo.

2. **La base está conectada.** Entrá como socio y mirá arriba a la derecha:
   tiene que decir **«En línea»** con un punto turquesa que late. Si dice
   **«Local»**, revisá la Parte 2 —casi siempre es el proveedor Anónimo sin
   activar—.

3. **El tiempo real anda.** Abrí la app en la computadora y en el teléfono con
   el mismo usuario. Cargá un paciente en una: tiene que aparecer en la otra
   **en unos segundos, sin recargar**.

4. **Los PDF salen.** Hacé una valoración de prueba con un paciente que tenga
   tu propio correo, completá el punto 15 y tocá **Enviar valoración al
   paciente**. Te tienen que llegar **tres archivos PDF separados**. Si avisa
   que el servicio está en una versión vieja, volvé a la Parte 1 paso 3.

5. **Borrá la demostración.** Antes del primer paciente real, tocá **Borrar** en
   el cartel amarillo del inicio. Laura Fernández, Juan Pablo Gómez y sus fichas
   son de ejemplo y no deben quedar mezclados con datos reales.

---

# Antes de usarla con pacientes reales

## Cambiar las claves de coordinación y del contable

`0112` (coordinación) y `2358` (contable) están escritas en el código y
**cualquiera que abra la página puede encontrarlas**. Coordinación ve todas las
historias clínicas; el portal contable, toda la facturación de la asociación.

Editá estas dos líneas de **`src/core.js`**:

```js
const CLAVE_COORDINADOR = '0112';
const CLAVE_CONTABLE    = '2358';
```

Reconstruí con `python3 build.py` y volvé a subir `index.html` y `src/core.js`.
Elegí claves distintas entre sí y no las mandes por WhatsApp.

Aun así siguen siendo visibles para quien inspeccione el código: es una
limitación de cualquier app sin servidor propio.

## Qué protege y qué no

| | Estado |
|---|---|
| Contraseñas de los socios | Hash SHA-256, no en texto plano ✅ |
| Base de datos | Cerrada: exige pase de Firebase ✅ |
| Clave de API | Restringida al dominio (Parte 2, paso 3) ✅ |
| Acceso por intervención | Cada socio ve sólo los pacientes en los que actuó ✅ |
| Aprobación de altas por la coordinación | Sí ✅ |
| Registro de auditoría | Sí ✅ |
| Portal contable sin datos clínicos | Sí, por lista blanca de campos ✅ |
| Claves de coordinación y contable | Visibles en el código ⚠️ |
| Clave del envío de correos | Visible en el código ⚠️ Se corta cambiándola en Apps Script y acá |
| Cifrado de los datos en reposo | No — lo que ofrece Firebase de fábrica |

## Marco legal

Ley 25.326 (datos personales), Leyes 26.529 y 26.742 (derechos del paciente e
historia clínica). Conservación mínima: **diez años** desde la última
actuación. Los respaldos JSON contienen datos de salud: guardalos cifrados y
nunca en un repositorio público.
