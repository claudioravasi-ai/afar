#!/usr/bin/env python3
"""
Ensambla AFAAR by Yanina Andino en un unico index.html autocontenido.

Uso:   python3 build.py
Salida: index.html  (abrible con doble clic o servido por http)
"""
import os
import sys
import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'src')

CSS_FILES = [
    'styles.css',
]

JS_FILES = [
    'data-catalogos.js',
    'data-cie10.js',
    'data-cie10-extra.js',
    'data-cirugias.js',
    'data-cirugias-extra.js',
    'data-nomenclador.js',
    'data-guias.js',
    'data-fiscal.js',
    'firebase-config.js',
    'email-config.js',
    'core.js',
    'seed.js',
    'seed-extra.js',
    'ui-auth.js',
    'ui-pacientes.js',
    'ui-valoracion.js',
    'ui-ficha.js',
    'ui-stats.js',
    'ui-facturacion.js',
    'ui-coordinador.js',
    'ui-contable.js',
    'ui-mensajes.js',
    'ui-prestadores.js',
    'ui-avisos.js',
    'ui-guias.js',
    'export.js',
    'email-paciente.js',
    'app.js',
]


def read(name):
    path = os.path.join(SRC, name)
    if not os.path.exists(path):
        print('  !! falta %s (se omite)' % name)
        return ''
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def main():
    stamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    version = datetime.datetime.now().strftime('%Y.%m.%d.%H%M')

    body = read('body.html')
    if not body:
        print('ERROR: src/body.html es obligatorio')
        sys.exit(1)

    css = '\n'.join('/* ==== %s ==== */\n%s' % (f, read(f)) for f in CSS_FILES)
    js_parts = []
    for f in JS_FILES:
        code = read(f)
        if code:
            js_parts.append('/* ================ %s ================ */\n%s' % (f, code))
    js = '\n'.join(js_parts)

    html = """<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5">
<meta name="theme-color" content="#0b2545">
<meta name="description" content="AFAAR by Yanina Andino - Asociacion Fueguina de Analgesia, Anestesia y Reanimacion. Valoracion anestesica prequirurgica, fichas, estadisticas y facturacion.">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="AFAAR">
<meta name="mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">
<title>AFAAR by Yanina Andino</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<link rel="icon" href="icons/icon-192.png">
<script>window.AFAR_BUILD = "%(version)s";</script>
<style>
%(css)s
</style>
</head>
<body>
%(body)s
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js"></script>
<script>
%(js)s
</script>
</body>
</html>
""" % {'css': css, 'body': body, 'js': js, 'version': version}

    out = os.path.join(BASE, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)

    kb = os.path.getsize(out) / 1024.0
    print('OK  index.html  %.0f KB  (build %s, %s)' % (kb, version, stamp))


if __name__ == '__main__':
    main()
