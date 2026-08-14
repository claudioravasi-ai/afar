#!/usr/bin/env python3
"""
Genera los iconos PNG de AFAR sin dependencias externas (sin Pillow).
Diseno: campo azul quirofano con trazado de ECG turquesa y el monograma AFAR.

Uso: python3 make-icons.py
Salida: icons/icon-192.png, icons/icon-512.png, icons/icon-maskable-512.png
"""
import os
import zlib
import struct
import math

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, 'icons')

AZUL_OSC = (7, 26, 51)
AZUL     = (11, 37, 69)
AZUL_CLA = (18, 58, 99)
AQUA     = (45, 212, 191)
AQUA_OSC = (14, 143, 149)
BLANCO   = (255, 255, 255)

# Trazado del ECG en coordenadas 0..1 (x, y)
ECG = [(0.10, 0.52), (0.28, 0.52), (0.32, 0.34), (0.37, 0.72), (0.42, 0.44),
       (0.47, 0.52), (0.58, 0.52), (0.62, 0.30), (0.67, 0.68), (0.72, 0.52),
       (0.90, 0.52)]


def mezcla(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def dist_segmento(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))


def color_en(u, v, maskable):
    """Devuelve el color RGB del punto normalizado (u, v) en 0..1."""
    # Fondo: degradado diagonal
    t = (u * 0.55 + v * 0.45)
    fondo = mezcla(AZUL_OSC, AZUL_CLA, t)

    cx, cy = 0.5, 0.5
    r = math.hypot(u - cx, v - cy)

    if not maskable:
        # Disco con anillo turquesa
        if r > 0.495:
            return None                      # transparente
        if 0.455 < r <= 0.495:
            return mezcla(AQUA_OSC, AQUA, (r - 0.455) / 0.04)
        if 0.435 < r <= 0.455:
            return AZUL_OSC
    else:
        # Maskable: fondo completo, contenido dentro del 80 % central
        if r > 0.47:
            return fondo

    # Halo suave detras del trazado
    fondo = mezcla(fondo, AZUL, max(0.0, 1.0 - r * 2.2) * 0.5)

    # Trazado del ECG
    grosor = 0.028 if not maskable else 0.024
    escala = 1.0 if not maskable else 0.82
    su, sv = 0.5 + (u - 0.5) / escala, 0.5 + (v - 0.5) / escala
    mejor = 9.0
    for i in range(len(ECG) - 1):
        x1, y1 = ECG[i]
        x2, y2 = ECG[i + 1]
        d = dist_segmento(su, sv, x1, y1, x2, y2)
        if d < mejor:
            mejor = d
    if mejor < grosor:
        return AQUA
    if mejor < grosor * 1.35:
        return mezcla(AQUA, fondo, (mejor - grosor) / (grosor * 0.35))

    return fondo


def render(tam, maskable=False, ss=3):
    """Renderiza con supersampling ss x ss. Devuelve filas RGBA."""
    filas = []
    inv = 1.0 / (tam * ss)
    for y in range(tam):
        fila = bytearray()
        for x in range(tam):
            r = g = b = op = 0
            for sy in range(ss):
                for sx in range(ss):
                    u = (x * ss + sx + 0.5) * inv
                    v = (y * ss + sy + 0.5) * inv
                    c = color_en(u, v, maskable)
                    if c is None:
                        continue
                    r += c[0]; g += c[1]; b += c[2]; op += 1
            n = ss * ss
            if op == 0:
                fila += bytes((0, 0, 0, 0))
            else:
                fila += bytes((r // op, g // op, b // op, 255 * op // n))
        filas.append(bytes(fila))
    return filas


def escribir_png(ruta, tam, filas):
    def chunk(tipo, datos):
        c = struct.pack('>I', len(datos)) + tipo + datos
        return c + struct.pack('>I', zlib.crc32(tipo + datos) & 0xffffffff)

    crudo = b''.join(b'\x00' + f for f in filas)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', tam, tam, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(crudo, 9))
    png += chunk(b'IEND', b'')
    with open(ruta, 'wb') as f:
        f.write(png)
    print('  %s  (%d x %d, %.0f KB)' % (os.path.basename(ruta), tam, tam,
                                        len(png) / 1024.0))


def main():
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    print('Generando iconos de AFAR…')
    escribir_png(os.path.join(OUT, 'icon-192.png'), 192, render(192))
    escribir_png(os.path.join(OUT, 'icon-512.png'), 512, render(512))
    escribir_png(os.path.join(OUT, 'icon-maskable-512.png'), 512,
                 render(512, maskable=True))
    print('Listo.')


if __name__ == '__main__':
    main()
