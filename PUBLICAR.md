# Poner AFAAR en línea — paso a paso

Dos etapas independientes:

1. **Firebase** — la base de datos compartida entre todos los dispositivos.
2. **GitHub Pages** — la dirección web pública desde donde se abre la app.

Podés hacerlas en cualquier orden. Si sólo hacés GitHub, la app funciona pero
cada dispositivo guarda sus propios datos por separado.

---

# PARTE 1 — Firebase (base de datos compartida)

Tiempo: unos 10 minutos. Gratis en el plan Spark.

## 1. Crear el proyecto

1. Entrá a **https://console.firebase.google.com** con una cuenta de Google.
   Conviene una cuenta institucional de la AFAAR, no una personal.
2. Tocá **«Crear un proyecto»**.
3. Nombre: **`afar-anestesia`**. Aceptá los términos y tocá **Continuar**.
4. En «Google Analytics» tocá el interruptor para **desactivarlo** y luego
   **Crear proyecto**. Esperá unos segundos y tocá **Continuar**.

## 2. Crear la base de datos

1. En el menú de la izquierda: **Compilación (Build) → Realtime Database**.
   ⚠️ *Realtime Database*, **no** Firestore. Son productos distintos y la app
   usa el primero.
2. Tocá **«Crear base de datos»**.
3. Ubicación: elegí **`us-central1`** (o `southamerica-east1` si aparece).
   Esto no se puede cambiar después.
4. Reglas de seguridad: elegí **«Comenzar en modo de prueba»** y tocá
   **Habilitar**.
5. Vas a ver una URL arriba, parecida a
   `https://afar-anestesia-default-rtdb.firebaseio.com`. Esa es la base.

## 3. Registrar la aplicación web

1. Tocá el engranaje ⚙ arriba a la izquierda → **Configuración del proyecto**.
2. Bajá hasta «Tus apps» y tocá el ícono **`</>`** (web).
3. Sobrenombre de la app: **`AFAAR`**. **No** marques «Firebase Hosting».
   Tocá **Registrar app**.
4. Aparece un bloque de código con esta forma:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "afar-anestesia.firebaseapp.com",
  databaseURL: "https://afar-anestesia-default-rtdb.firebaseio.com",
  projectId: "afar-anestesia",
  storageBucket: "afar-anestesia.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123"
};
```

5. **Copialo entero**, desde `const firebaseConfig` hasta el `};`.

   ⚠️ Si en el bloque **no aparece la línea `databaseURL`**, es porque creaste
   la app antes que la base de datos. Volvé al paso 2, creá la Realtime
   Database, y después recargá esta pantalla: la línea aparece sola.

## 4. Pegarlo en la app

1. Abrí AFAAR (podés estar con cualquier usuario).
2. Tocá el indicador **«Local»** que está arriba a la derecha, al lado de la luna.
3. Ingresá la **credencial de coordinación (`0112`)** y tocá **Desbloquear**.
   Sin esa clave sólo se ve el estado; nadie más puede tocar la base de datos.
4. Pegá el bloque en el cuadro grande y tocá **Conectar**.
5. La app se recarga y arriba, donde decía «Local», ahora dice **«En línea»**
   con un punto turquesa que late.

Cada vez que alguien conecte, cambie o desconecte la base queda un asiento en
Firebase con el nombre, la fecha, la hora y el dispositivo. Se ve en
*Coordinación → Auditoría*, y el último cambio aparece en el mismo diálogo de
sincronización.

Listo: desde ese momento, todo lo que cargue cualquier socio desde cualquier
dispositivo aparece en el resto al instante.

## 5. Cerrar la base antes de usarla con pacientes reales

**Esto es importante y no es opcional.** El «modo de prueba» deja que
cualquiera que conozca la dirección de la base lea y escriba **todas las
historias clínicas**, y además caduca a los 30 días (cuando caduca, la app
deja de sincronizar).

1. En Firebase: **Realtime Database → pestaña «Reglas»**.
2. Borrá lo que hay y pegá esto:

```json
{
  "rules": {
    "afar": {
      ".read": true,
      ".write": true,
      ".indexOn": ["fecha", "ownerUid"]
    }
  }
}
```

3. Tocá **Publicar**.

Esto quita la fecha de vencimiento, pero **sigue siendo una base abierta**: la
protección real es que nadie conozca la URL. Para datos de pacientes reales eso
no alcanza. La solución correcta es exigir autenticación de Firebase; requiere
agregarle a la app el inicio de sesión de Firebase, que hoy no tiene porque
elegimos login propio. Si querés dar ese paso, avisame y lo implemento.

**Mientras tanto, mínimo indispensable:**
- No publiques ni compartas la URL de la base.
- Cambiá la clave `0112` por otra que sólo conozca la coordinación
  (te digo abajo cómo).
- Descargá el respaldo JSON con regularidad.

---

# PARTE 2 — GitHub Pages (dirección web pública)

Tiempo: unos 10 minutos. Gratis.

Ya dejé la carpeta lista como repositorio de git, con el primer commit hecho.
Sólo falta subirla.

## 1. Crear la cuenta y el repositorio

1. Si no tenés cuenta: **https://github.com/signup**.
2. Ya con la sesión abierta, entrá a **https://github.com/new**.
3. Completá:
   - **Repository name:** `afaar`
   - **Public** ← *tiene que ser público*: GitHub Pages gratis sólo funciona
     con repositorios públicos.
   - **No** marques «Add a README file» ni ninguna otra casilla.
4. Tocá **Create repository**.

## 2. Subir la app

GitHub te muestra una pantalla con comandos. Ignorala y usá estos, cambiando
`TU-USUARIO` por tu nombre de usuario de GitHub:

```bash
cd ~/Desktop/Claude/afar && git branch -M main && git remote add origin https://github.com/TU-USUARIO/afar.git && git push -u origin main
```

Te va a pedir usuario y contraseña. **La contraseña de GitHub no sirve**: hay
que usar un *token*.

**Cómo sacar el token** (una sola vez):
1. Entrá a **https://github.com/settings/tokens/new**
2. Note: `afaar`
3. Expiration: **No expiration**
4. Marcá la casilla **`repo`** (la primera de la lista, con todas sus
   subcasillas).
5. Abajo de todo: **Generate token**.
6. Copiá el texto que empieza con `ghp_...`. **No se vuelve a mostrar.**
   Guardalo en tu gestor de contraseñas.
7. Cuando la terminal pida *Username* poné tu usuario; cuando pida *Password*
   pegá el token.

En Mac, el token queda guardado en el Llavero y no te lo vuelve a pedir.

## 3. Activar GitHub Pages

1. En tu repositorio: pestaña **Settings** (arriba a la derecha).
2. Menú izquierdo: **Pages**.
3. En «Build and deployment» → **Source**: elegí **Deploy from a branch**.
4. En **Branch**: elegí **`main`**, carpeta **`/ (root)`**, y tocá **Save**.
5. Esperá 1 o 2 minutos y recargá esa página. Arriba va a aparecer:

   **`https://TU-USUARIO.github.io/afar/`**

Esa es la dirección de la app. Funciona desde cualquier computadora, tablet o
teléfono del mundo.

## 4. Instalarla como aplicación

Al abrirla por HTTPS ya es una PWA instalable:

- **iPhone / iPad (Safaari):** botón Compartir → *Agregar a pantalla de inicio*.
- **Android (Chrome):** menú ⋮ → *Instalar aplicación*.
- **Mac / Windows (Chrome o Edge):** el ícono de instalar ⊕ en la barra de
  direcciones.

Queda con su ícono propio, pantalla completa y sin barra del navegador.

## 5. Actualizarla más adelante

Cada vez que se toque algo del código:

```bash
cd ~/Desktop/Claude/afar && python3 build.py && git add -A && git commit -m "Cambios" && git push
```

En 1 o 2 minutos la versión nueva está en línea. El service worker está
configurado para pedir siempre la última versión, así que a los socios les
llega sola al abrirla.

---

# Antes de usarla con pacientes reales

## Cambiar las claves de coordinación y del contable

Las claves `0112` (coordinación) y `2358` (contable) están escritas en el
código y **cualquiera que abra la página puede encontrarlas**. Con la app
publicada en internet, eso significa que cualquiera podría entrar al portal de
coordinación —que ve todas las historias clínicas— o al portal contable —que ve
toda la facturación de la asociación—.

Para cambiarlas, editá estas dos líneas de `src/core.js`:

```
const CLAVE_COORDINADOR = '0112';
const CLAVE_CONTABLE    = '2358';
```

Poné las claves nuevas entre las comillas, reconstruí con `python3 build.py` y
subí el cambio. Aun así seguirán siendo visibles para quien inspeccione el
código: es una limitación de cualquier app sin servidor propio.

**Elegí claves distintas entre sí y no las compartas por WhatsApp.** El portal
contable no expone datos de pacientes, pero sí el detalle económico completo de
cada anestesiólogo.

## Qué protege y qué no protege esta app

| | Estado |
|---|---|
| Contraseñas de los socios | Guardadas con hash SHA-256, no en texto plano ✅ |
| Separación de datos entre socios | Cada uno ve sólo lo suyo ✅ |
| Aprobación de altas por la coordinación | Sí ✅ |
| Registro de auditoría | Sí ✅ |
| Portal contable sin datos clínicos | Sí, por lista blanca de campos ✅ |
| Confidencialidad de los hilos internos | Sólo los participantes ✅ |
| Claves de coordinación y contable | Visibles en el código ⚠️ |
| Base de datos | Abierta a quien conozca la URL ⚠️ |
| Cifrado de los datos en reposo | No |

Es adecuada para uso interno y ordenado de la asociación. Para uso asistencial
formal con datos identificatorios de pacientes, hay que agregar autenticación
de Firebase y cerrar las reglas de la base. Decime y lo hago.

## Marco legal

Ley 25.326 (datos personales), Ley 26.529 y 26.742 (derechos del paciente e
historia clínica). Conservación mínima: diez años desde la última actuación.
Los respaldos JSON contienen datos de salud: guardalos cifrados.
