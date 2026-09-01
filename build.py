#!/usr/bin/env python3
"""
Ensambla AFAAR en un unico index.html autocontenido.

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
    'data-logo.js',
    'data-catalogos.js',
    'data-antecedentes.js',
    'data-vademecum.js',
    'data-cirugias.js',
    'data-cirugias-extra.js',
    'data-nomenclador.js',
    'data-guias.js',
    'data-fiscal.js',
    'data-manual.js',
    'firebase-config.js',
    'email-config.js',
    'core.js',
    'seed.js',
    'seed-extra.js',
    'ui-auth.js',
    'ui-pacientes.js',
    'valoracion-auto.js',
    'periop.js',
    'acto-auto.js',
    'ui-valoracion.js',
    'ui-ficha.js',
    'ui-intra.js',
    'ui-stats.js',
    'ui-facturacion.js',
    'ui-coordinador.js',
    'ui-contable.js',
    'ui-mensajes.js',
    'ui-prestadores.js',
    'ui-avisos.js',
    'ui-guias.js',
    'ui-manual.js',
    'export.js',
    'email-paciente.js',
    'paciente-portal.js',
    'ui-envios.js',
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
<meta name="description" content="AFAAR - Asociacion Fueguina de Anestesia, Analgesia y Reanimacion. Valoracion anestesica prequirurgica, fichas, estadisticas y facturacion.">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="AFAAR">
<meta name="mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">
<title>AFAAR</title>
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
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
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

    regenerar_manual_word()


def regenerar_manual_word():
    """Rehace los DOS manuales en Word del escritorio si el de la app cambio.

    El manual vive en src/data-manual.js y se lee dentro de la aplicacion. La
    copia en Word que se usa para imprimir y para circular por mail quedaba
    desfasada a los pocos dias, y un manual desactualizado es peor que no
    tenerlo: dice como funcionaba la app hace un mes y nadie sabe cual de los
    dos vale.

    Se rehace SOLO si data-manual.js es mas nuevo que el .docx, para no
    reescribir un archivo que puede estar abierto en Word sin motivo.
    """
    fuente = os.path.join(SRC, 'data-manual.js')
    carpeta = os.path.expanduser('~/Desktop/AFAAR')
    # Son DOS: el de los socios y el completo de coordinacion. Ver SALIDAS en
    # manual-a-word.py: los capitulos con coord:true no van en el de socios.
    docs = [os.path.join(carpeta, 'AFAAR - Manual de uso (socios).docx'),
            os.path.join(carpeta, 'AFAAR - Manual de uso, alcances y capacidad (ampliado).docx')]
    script = os.path.join(BASE, 'manual-a-word.py')
    if not (os.path.exists(fuente) and os.path.exists(script)):
        return
    if not os.path.isdir(carpeta):
        return                      # otra computadora, sin la carpeta del escritorio
    if all(os.path.exists(d) and os.path.getmtime(d) >= os.path.getmtime(fuente)
           for d in docs):
        return                      # los dos Word ya estan al dia
    try:
        import subprocess
        r = subprocess.run([sys.executable, script], capture_output=True, text=True)
        for l in (r.stdout or '').strip().splitlines():
            print('    ' + l)
        if r.returncode != 0:
            print('    !! el manual en Word no se pudo regenerar:')
            print('       ' + (r.stderr or '').strip().splitlines()[-1:][0] if r.stderr else '')
    except Exception as e:
        print('    !! el manual en Word no se pudo regenerar: %s' % e)


if __name__ == '__main__':
    main()
