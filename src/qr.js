/* =========================================================================
   CODIGO QR
   -------------------------------------------------------------------------
   Genera el codigo QR de la direccion del portal sin salir de la aplicacion.
   Es el mismo generador que usa ASHA, copiado tal cual: no depende de nada
   de la aplicacion que lo hospeda.

   POR QUE ESCRITO A MANO Y NO CON UNA LIBRERIA
   Un QR armado por un servicio de internet obliga a mandarle la direccion a
   ese servicio, deja de funcionar el dia que el servicio cierra y no anda si
   la computadora del consultorio esta sin internet. Trescientas lineas de
   una sola vez evitan las tres cosas para siempre.

   POR QUE SE GENERA Y NO SE GUARDA UNA IMAGEN
   Porque la direccion del portal depende de donde este publicada la
   aplicacion. Un PNG pegado a mano queda apuntando a la direccion vieja el
   dia que se mude el hosting, y nadie se entera hasta que un paciente
   escanea y no llega a ningun lado. Generado, siempre apunta al lugar
   correcto.

   Implementa la norma ISO/IEC 18004 en modo BYTE, con seleccion automatica
   de version y de mascara. La correccion de errores va en nivel Q (25%): un
   cartel pegado en un mostrador se ensucia, se arruga y se despega de una
   esquina, y con Q sigue leyendose.
   ========================================================================= */
'use strict';

/* Correccion de errores: 0=L (7%), 1=M (15%), 2=Q (25%), 3=H (30%). */
const QR_L = 0, QR_M = 1, QR_Q = 2, QR_H = 3;

/* Los cinco bits con que cada nivel se anuncia dentro del propio codigo.
   No siguen el orden L-M-Q-H: asi los fija la norma. */
const QR_BITS_NIVEL = [1, 0, 3, 2];

/* Palabras de correccion por bloque, por version (1 a 40) y por nivel. */
const QR_CORRECCION_POR_BLOQUE = [
  [-1, 7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
  [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]
];

/* Cantidad de bloques en que se parte el dato, por version y nivel. */
const QR_BLOQUES = [
  [-1,1,1,1,1,1,2,2,2,2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
  [-1,1,1,1,2,2,4,4,4,5, 5, 5, 8, 9, 9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
  [-1,1,1,2,2,4,4,6,6,8, 8, 8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
  [-1,1,1,2,4,4,4,5,5,8, 9, 9,10,12,12,17,16,18,21,20,23,23,26,28,32,34,35,38,40,43,45,48,51,53,56,59,62,65,68,71,74]
];

/* ------------------------------------------------------ aritmetica GF(256) */

function qrMultiplicar(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function qrDivisorRS(grado) {
  const r = new Array(grado).fill(0);
  r[grado - 1] = 1;
  let raiz = 1;
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = qrMultiplicar(r[j], raiz);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    raiz = qrMultiplicar(raiz, 0x02);
  }
  return r;
}

function qrRestoRS(datos, divisor) {
  const r = new Array(divisor.length).fill(0);
  for (const b of datos) {
    const factor = b ^ r.shift();
    r.push(0);
    for (let i = 0; i < divisor.length; i++) r[i] ^= qrMultiplicar(divisor[i], factor);
  }
  return r;
}

/* ------------------------------------------------------------- geometria  */

/* Modulos crudos de datos y correccion que entran en una version. */
function qrModulosCrudos(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (ver >= 7) r -= 36;
  }
  return r;
}

/* Palabras de datos utiles: lo crudo menos lo que se lleva la correccion. */
function qrPalabrasDeDatos(ver, nivel) {
  return Math.floor(qrModulosCrudos(ver) / 8) -
         QR_CORRECCION_POR_BLOQUE[nivel][ver] * QR_BLOQUES[nivel][ver];
}

function qrPosicionesAlineacion(ver) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const paso = (ver === 32) ? 26
             : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const r = [6];
  for (let pos = ver * 4 + 17 - 7; r.length < n; pos -= paso) r.splice(1, 0, pos);
  return r;
}

/* --------------------------------------------------------------- el texto */

function qrBytes(texto) {
  const s = unescape(encodeURIComponent(String(texto)));
  const r = [];
  for (let i = 0; i < s.length; i++) r.push(s.charCodeAt(i) & 0xFF);
  return r;
}

/* Bits del contador de caracteres en modo byte: 8 hasta la version 9, 16 de
   ahi en adelante. */
function qrBitsContador(ver) { return ver <= 9 ? 8 : 16; }

function qrVersionPara(largo, nivel) {
  for (let ver = 1; ver <= 40; ver++) {
    const capacidad = qrPalabrasDeDatos(ver, nivel) * 8;
    if (4 + qrBitsContador(ver) + largo * 8 <= capacidad) return ver;
  }
  return 0;
}

/* --------------------------------------------------------- datos + correccion */

function qrArmarPalabras(bytes, ver, nivel) {
  const bits = [];
  const meter = (valor, cuantos) => {
    for (let i = cuantos - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
  };

  meter(4, 4);                            // modo byte
  meter(bytes.length, qrBitsContador(ver));
  for (const b of bytes) meter(b, 8);

  const capacidad = qrPalabrasDeDatos(ver, nivel) * 8;
  meter(0, Math.min(4, capacidad - bits.length));       // terminador
  meter(0, (8 - bits.length % 8) % 8);                  // hasta cerrar el byte
  for (let relleno = 0xEC; bits.length < capacidad; relleno ^= 0xEC ^ 0x11)
    meter(relleno, 8);

  const datos = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    datos.push(b);
  }

  /* Reparto en bloques e intercalado. El intercalado no es un capricho: si
     una mancha borra veinte modulos seguidos, repartidos entre bloques cada
     bloque pierde poco y todos se recuperan; juntos, un bloque se pierde
     entero. */
  const nBloques = QR_BLOQUES[nivel][ver];
  const largoCorr = QR_CORRECCION_POR_BLOQUE[nivel][ver];
  const crudas = Math.floor(qrModulosCrudos(ver) / 8);
  const cortos = nBloques - crudas % nBloques;
  const largoCorto = Math.floor(crudas / nBloques);

  const divisor = qrDivisorRS(largoCorr);
  const bloques = [];
  for (let i = 0, k = 0; i < nBloques; i++) {
    const cuantos = largoCorto - largoCorr + (i < cortos ? 0 : 1);
    const trozo = datos.slice(k, k + cuantos);
    k += cuantos;
    const corr = qrRestoRS(trozo, divisor);
    if (i < cortos) trozo.push(0);        // relleno para igualar largos
    bloques.push(trozo.concat(corr));
  }

  const salida = [];
  for (let i = 0; i < bloques[0].length; i++) {
    for (let j = 0; j < bloques.length; j++) {
      if (i !== largoCorto - largoCorr || j >= cortos) salida.push(bloques[j][i]);
    }
  }
  return salida;
}

/* ------------------------------------------------------------- la matriz  */

function qrMatriz(texto, nivel) {
  const niv = nivel == null ? QR_Q : nivel;
  const bytes = qrBytes(texto);
  const ver = qrVersionPara(bytes.length, niv);
  if (!ver) return null;                  // no entra ni en la version 40

  const lado = ver * 4 + 17;
  const M = [], F = [];                   // modulos y "esto es estructura"
  for (let y = 0; y < lado; y++) {
    M.push(new Array(lado).fill(false));
    F.push(new Array(lado).fill(false));
  }
  const bit = (v, i) => ((v >>> i) & 1) !== 0;
  const fijo = (x, y, oscuro) => {
    if (x < 0 || y < 0 || x >= lado || y >= lado) return;
    M[y][x] = oscuro; F[y][x] = true;
  };

  /* --- patrones de estructura --- */
  for (let i = 0; i < lado; i++) { fijo(6, i, i % 2 === 0); fijo(i, 6, i % 2 === 0); }

  const ojo = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      fijo(cx + dx, cy + dy, d !== 2 && d !== 4);
    }
  };
  ojo(3, 3); ojo(lado - 4, 3); ojo(3, lado - 4);

  const alin = qrPosicionesAlineacion(ver);
  for (let i = 0; i < alin.length; i++) for (let j = 0; j < alin.length; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === alin.length - 1) ||
        (i === alin.length - 1 && j === 0)) continue;   // debajo de los ojos
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
      fijo(alin[i] + dx, alin[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }

  const formato = mascara => {
    const d = QR_BITS_NIVEL[niv] << 3 | mascara;
    let resto = d;
    for (let i = 0; i < 10; i++) resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
    const b = ((d << 10) | resto) ^ 0x5412;
    for (let i = 0; i <= 5; i++) fijo(8, i, bit(b, i));
    fijo(8, 7, bit(b, 6)); fijo(8, 8, bit(b, 7)); fijo(7, 8, bit(b, 8));
    for (let i = 9; i < 15; i++) fijo(14 - i, 8, bit(b, i));
    for (let i = 0; i < 8; i++) fijo(lado - 1 - i, 8, bit(b, i));
    for (let i = 8; i < 15; i++) fijo(8, lado - 15 + i, bit(b, i));
    fijo(8, lado - 8, true);              // el modulo siempre oscuro
  };
  formato(0);

  if (ver >= 7) {
    let resto = ver;
    for (let i = 0; i < 12; i++) resto = (resto << 1) ^ ((resto >>> 11) * 0x1F25);
    const b = ver << 12 | resto;
    for (let i = 0; i < 18; i++) {
      const v = bit(b, i), a = lado - 11 + i % 3, c = Math.floor(i / 3);
      fijo(a, c, v); fijo(c, a, v);
    }
  }

  /* --- los datos, en zigzag de abajo a la derecha hacia arriba --- */
  const palabras = qrArmarPalabras(bytes, ver, niv);
  let i = 0;
  for (let der = lado - 1; der >= 1; der -= 2) {
    if (der === 6) der = 5;               // la columna 6 es de sincronismo
    for (let v = 0; v < lado; v++) {
      for (let j = 0; j < 2; j++) {
        const x = der - j;
        const subiendo = ((der + 1) & 2) === 0;
        const y = subiendo ? lado - 1 - v : v;
        if (!F[y][x] && i < palabras.length * 8) {
          M[y][x] = bit(palabras[i >>> 3], 7 - (i & 7));
          i++;
        }
      }
    }
  }

  /* --- mascara: se prueban las ocho y gana la que menos penaliza --- */
  const reglas = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x, y) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
    (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
    (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0
  ];
  const aplicar = m => {
    for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++)
      if (!F[y][x] && reglas[m](x, y)) M[y][x] = !M[y][x];
  };

  let mejor = 0, mejorPena = Infinity;
  for (let m = 0; m < 8; m++) {
    aplicar(m); formato(m);
    const pena = qrPenalizacion(M, lado);
    if (pena < mejorPena) { mejorPena = pena; mejor = m; }
    aplicar(m);                           // deshacer: XOR es su propia inversa
  }
  aplicar(mejor); formato(mejor);

  return {lado, modulos: M, version: ver, nivel: niv};
}

/* Cuanto "molesta" un dibujo a un lector: rachas largas, cuadrados de un
   solo color, falsos ojos y desequilibrio entre claro y oscuro. */
function qrPenalizacion(M, lado) {
  let r = 0;
  const sumarHistoria = (largo, h) => {
    if (h[0] === 0) largo += lado;
    h.pop(); h.unshift(largo);
  };
  const contarOjos = h => {
    const n = h[1];
    const nucleo = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
    return (nucleo && h[0] >= n * 4 && h[6] >= n ? 1 : 0) +
           (nucleo && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
  };
  const cerrar = (color, largo, h) => {
    if (color) { sumarHistoria(largo, h); largo = 0; }
    sumarHistoria(largo + lado, h);
    return contarOjos(h);
  };

  for (let y = 0; y < lado; y++) {
    let color = false, largo = 0, h = [0,0,0,0,0,0,0];
    for (let x = 0; x < lado; x++) {
      if (M[y][x] === color) { largo++; if (largo === 5) r += 3; else if (largo > 5) r++; }
      else {
        sumarHistoria(largo, h);
        if (!color) r += contarOjos(h) * 40;
        color = M[y][x]; largo = 1;
      }
    }
    r += cerrar(color, largo, h) * 40;
  }
  for (let x = 0; x < lado; x++) {
    let color = false, largo = 0, h = [0,0,0,0,0,0,0];
    for (let y = 0; y < lado; y++) {
      if (M[y][x] === color) { largo++; if (largo === 5) r += 3; else if (largo > 5) r++; }
      else {
        sumarHistoria(largo, h);
        if (!color) r += contarOjos(h) * 40;
        color = M[y][x]; largo = 1;
      }
    }
    r += cerrar(color, largo, h) * 40;
  }
  for (let y = 0; y < lado - 1; y++) for (let x = 0; x < lado - 1; x++) {
    const c = M[y][x];
    if (c === M[y][x+1] && c === M[y+1][x] && c === M[y+1][x+1]) r += 3;
  }
  let oscuros = 0;
  for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) if (M[y][x]) oscuros++;
  const total = lado * lado;
  r += (Math.ceil(Math.abs(oscuros * 20 - total * 10) / total) - 1) * 10;
  return r;
}

/* =========================================================================
   DIBUJARLO
   ========================================================================= */

/* SVG: es lo que se ve en pantalla y lo que se imprime. Vectorial, asi que
   el cartel del mostrador sale nitido a cualquier tamaño. */
function qrSVG(texto, opciones) {
  const o = opciones || {};
  const q = qrMatriz(texto, o.nivel);
  if (!q) return '';
  const borde = o.borde == null ? 4 : o.borde;   // zona muda: la norma pide 4
  const total = q.lado + borde * 2;
  const partes = [];
  for (let y = 0; y < q.lado; y++) {
    for (let x = 0; x < q.lado; x++) {
      if (q.modulos[y][x]) partes.push('M' + (x + borde) + ' ' + (y + borde) + 'h1v1h-1z');
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" ' +
    'shape-rendering="crispEdges" role="img" aria-label="Código QR"' +
    (o.ancho ? ' width="' + o.ancho + '" height="' + o.ancho + '"' : '') +
    ' style="' + (o.estilo || 'width:100%;height:auto;display:block') + '">' +
    '<rect width="' + total + '" height="' + total + '" fill="' + (o.fondo || '#ffffff') + '"/>' +
    '<path d="' + partes.join('') + '" fill="' + (o.tinta || '#000000') + '"/></svg>';
}

/* Tabla HTML: es la unica forma de meter un QR en un correo que se vea en
   todos los clientes. Gmail borra las imagenes incrustadas como datos, y una
   imagen alojada afuera obligaria a alojarla en algun lado. Una tabla de
   celditas de color no depende de nada.

   ESTA ESCRITA PARA PESAR POCO, Y ESO MANDA SOBRE TODO LO DEMAS.
   Gmail recorta cualquier mensaje que pase de unos 100 KB y muestra un
   "mensaje recortado" con el resto escondido detras de un enlace: un QR
   partido al medio no lo lee nadie. La primera version de esta funcion
   pesaba 142 KB ella sola. Por eso aca no hay una sola etiqueta de mas:

     · las celdas contiguas del mismo color se unen con colspan;
     · el ancho de cada columna se declara UNA vez, en una fila guia de
       altura cero, y despues manda table-layout:fixed;
     · el tamaño de letra minusculo va en la tabla y se hereda, en vez de
       repetirse en cada una de las quinientas celdas.

   Queda en unos 20 KB, que es lo que hay que gastar para que el codigo
   llegue entero. */
function qrTablaHTML(texto, opciones) {
  const o = opciones || {};
  const q = qrMatriz(texto, o.nivel);
  if (!q) return '';
  const px = o.modulo || 5;
  const borde = o.borde == null ? 2 : o.borde;
  const tinta = o.tinta || '#000';
  const fondo = o.fondo || '#fff';
  const lado = q.lado + borde * 2;
  const oscuro = (x, y) => {
    const cx = x - borde, cy = y - borde;
    return cx >= 0 && cy >= 0 && cx < q.lado && cy < q.lado && q.modulos[cy][cx];
  };

  const F = [];
  F.push('<table role="presentation" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;empty-cells:show;table-layout:fixed;' +
    'font-size:1px;line-height:' + px + 'px;width:' + (lado * px) + 'px;' +
    'background:' + fondo + '">');

  /* Fila guia: define el ancho de cada columna y no se ve. */
  F.push('<tr style="height:0">');
  for (let x = 0; x < lado; x++)
    F.push('<td width="' + px + '" style="width:' + px + 'px;height:0"></td>');
  F.push('</tr>');

  for (let y = 0; y < lado; y++) {
    F.push('<tr height="' + px + '" style="height:' + px + 'px">');
    let x = 0;
    while (x < lado) {
      const c = oscuro(x, y);
      let n = 1;
      while (x + n < lado && oscuro(x + n, y) === c) n++;
      F.push('<td' + (n > 1 ? ' colspan="' + n + '"' : '') +
             ' bgcolor="' + (c ? tinta : fondo) + '">&#8203;</td>');
      x += n;
    }
    F.push('</tr>');
  }
  F.push('</table>');
  return F.join('');
}

/* PNG, para descargarlo y pegarlo en un cartel hecho en otro programa. */
function qrPNG(texto, opciones, alListo) {
  const o = opciones || {};
  const q = qrMatriz(texto, o.nivel);
  if (!q) return alListo(null);
  const px = o.modulo || 12;
  const borde = o.borde == null ? 4 : o.borde;
  const lado = (q.lado + borde * 2) * px;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = lado;
  const g = lienzo.getContext('2d');
  g.fillStyle = o.fondo || '#ffffff';
  g.fillRect(0, 0, lado, lado);
  g.fillStyle = o.tinta || '#000000';
  for (let y = 0; y < q.lado; y++) for (let x = 0; x < q.lado; x++)
    if (q.modulos[y][x]) g.fillRect((x + borde) * px, (y + borde) * px, px, px);
  alListo(lienzo.toDataURL('image/png'));
}
