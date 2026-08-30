#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Regenera el manual en Word a partir del manual de la aplicacion.

    python3 manual-a-word.py

Lee  : src/data-manual.js   (la fuente de verdad, la que ve el usuario en la app)
Sale : dos Word en ~/Desktop/AFAAR/

    AFAAR - Manual de uso (socios).docx                       14 capitulos
    AFAAR - Manual de uso, alcances y capacidad (ampliado).docx  15 capitulos

Son dos porque el manual tiene dos alcances, igual que la pantalla: los
capitulos marcados coord:true los ve solamente la coordinacion. El de los
socios no lleva el anexo de administracion de la base.

Los PDF que sirve la app —manual-afaar.pdf y manual-afaar-completo.pdf— salen
de estos dos Word con «Guardar como PDF». El script avisa cuando quedaron
mas viejos que el manual.

POR QUE EXISTE ESTE SCRIPT
--------------------------------------------------------------------------
Antes el sentido era el contrario: se escribia el Word y de ahi se generaba
data-manual.js. Desde que el manual se corrige dentro de la aplicacion —que
es donde se lo lee— el Word quedaba desfasado a los pocos dias, y un manual
desactualizado es peor que no tenerlo: dice como funcionaba la app hace un
mes y nadie sabe cual de los dos vale.

Ahora la fuente de verdad es UNA SOLA: src/data-manual.js. El Word es una
salida, igual que index.html es la salida de build.py.

    src/data-manual.js  ->  manual-a-word.py  ->  el .docx del escritorio
                        ->  build.py          ->  index.html

CONSECUENCIA QUE HAY QUE TENER PRESENTE: lo que se edite a mano en el Word
se pierde en la proxima corrida. Si hay que corregir el manual, se corrige
en src/data-manual.js.

El formato (tipografias, estilos, pie de pagina, margenes) sale de las
partes guardadas en manual-word/plantilla/, extraidas del Word original,
asi que el documento sigue saliendo igual al que ya estaba en uso.
"""
import io, json, os, re, struct, sys, zipfile, datetime

BASE = os.path.dirname(os.path.abspath(__file__))
PLANTILLA = os.path.join(BASE, 'manual-word', 'plantilla')
FUENTE = os.path.join(BASE, 'src', 'data-manual.js')
CARPETA = os.path.expanduser('~/Desktop/AFAAR')

# El manual tiene DOS versiones y no son intercambiables. Los capitulos con
# coord:true —hoy el anexo «Donde esta cada cosa»— los ve unicamente la
# coordinacion: es la misma regla que aplica capitulosManual() dentro de la
# app (src/ui-manual.js), asi que el Word y la pantalla dicen lo mismo para
# cada perfil. Repartir a los socios el manual completo seria darles el anexo
# de administracion de la base, que no es asunto suyo.
SALIDAS = [
    { 'coord': False,
      'docx': 'AFAAR - Manual de uso (socios).docx',
      'pdf':  'manual-afaar.pdf',
      'rotulo': 'Versión para los socios' },
    { 'coord': True,
      'docx': 'AFAAR - Manual de uso, alcances y capacidad (ampliado).docx',
      'pdf':  'manual-afaar-completo.pdf',
      'rotulo': 'Versión completa — coordinación' },
]

EMU_POR_CM = 360000
ANCHO_IMG_CM = 15.0          # ancho util de la pagina con los margenes actuales


# --------------------------------------------------------------- utilidades
def esc(t):
    return (str(t).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def leer_manual():
    s = io.open(FUENTE, encoding='utf-8').read()
    i = s.index('const MANUAL = ')
    j = s.rindex(';')
    return json.loads(s[i + len('const MANUAL = '):j])


def version_app():
    """La version que estampa build.py en index.html, para que el Word diga
       a que version de la aplicacion corresponde."""
    idx = os.path.join(BASE, 'index.html')
    if os.path.exists(idx):
        s = io.open(idx, encoding='utf-8').read(4000)
        m = re.search(r'AFAR_BUILD = "([^"]+)"', s)
        if m:
            return m.group(1)
    return datetime.datetime.now().strftime('%Y.%m.%d.%H%M')


def medida_jpeg(path):
    """Ancho y alto de un JPEG, leyendo los marcadores SOF. Sin dependencias."""
    with open(path, 'rb') as f:
        if f.read(2) != b'\xff\xd8':
            return None
        while True:
            b = f.read(1)
            while b and b != b'\xff':
                b = f.read(1)
            while b == b'\xff':
                b = f.read(1)
            if not b:
                return None
            m = b[0]
            if m in (0xD8, 0xD9) or 0xD0 <= m <= 0xD7:
                continue
            datos = f.read(2)
            if len(datos) < 2:
                return None
            largo = struct.unpack('>H', datos)[0]
            if 0xC0 <= m <= 0xCF and m not in (0xC4, 0xC8, 0xCC):
                d = f.read(5)
                alto, ancho = struct.unpack('>HH', d[1:5])
                return ancho, alto
            f.seek(largo - 2, 1)


# ------------------------------------------------- HTML del manual -> OOXML
# El manual usa <b>, <i> y <code> dentro del texto. Se convierten en runs.
PARTIR = re.compile(r'(<b>|</b>|<i>|</i>|<code>|</code>|<br\s*/?>)', re.I)


def runs(texto, base_negrita=False):
    """Convierte el HTML simple del manual en runs de Word."""
    out, negrita, cursiva, mono = [], base_negrita, False, False
    for trozo in PARTIR.split(str(texto or '')):
        t = trozo.lower()
        if t == '<b>':      negrita = True;  continue
        if t == '</b>':     negrita = base_negrita; continue
        if t == '<i>':      cursiva = True;  continue
        if t == '</i>':     cursiva = False; continue
        if t == '<code>':   mono = True;     continue
        if t == '</code>':  mono = False;    continue
        if t.startswith('<br'):
            out.append('<w:r><w:br/></w:r>'); continue
        if not trozo:
            continue
        # cualquier otra etiqueta que se haya colado, fuera
        trozo = re.sub(r'<[^>]+>', '', trozo)
        if not trozo:
            continue
        pr = ''
        if negrita: pr += '<w:b/>'
        if cursiva: pr += '<w:i/>'
        if mono:    pr += '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/>'
        out.append('<w:r>' + ('<w:rPr>' + pr + '</w:rPr>' if pr else '') +
                   '<w:t xml:space="preserve">' + esc(trozo) + '</w:t></w:r>')
    return ''.join(out)


def parrafo(texto, estilo=None, negrita=False, espacio=None):
    pr = ''
    if estilo:  pr += '<w:pStyle w:val="%s"/>' % estilo
    if espacio: pr += '<w:spacing w:after="%d"/>' % espacio
    return ('<w:p>' + ('<w:pPr>' + pr + '</w:pPr>' if pr else '') +
            runs(texto, negrita) + '</w:p>')


def item(texto, numerado):
    """Vinieta o numeracion, con la numeracion de numbering.xml de la plantilla."""
    n = 1 if numerado else 0
    return ('<w:p><w:pPr><w:pStyle w:val="ListaAF"/>'
            '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="%d"/></w:numPr>'
            '</w:pPr>' % (n + 1)) + runs(texto) + '</w:p>'


def celda(texto, ancho, cabecera=False):
    relleno = '<w:shd w:val="clear" w:fill="EDF1F7"/>' if cabecera else ''
    return ('<w:tc><w:tcPr><w:tcW w:w="%d" w:type="dxa"/>%s'
            '<w:tcMar><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/>'
            '<w:left w:w="110" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar>'
            '</w:tcPr><w:p><w:pPr><w:pStyle w:val="%s"/></w:pPr>%s</w:p></w:tc>'
            % (ancho, relleno, 'TablaCab' if cabecera else 'TablaTxt',
               runs(texto, cabecera)))


def tabla(bloque):
    cab = bloque.get('head') or []
    filas = bloque.get('rows') or []
    ncol = max([len(cab)] + [len(f) for f in filas]) or 1
    ancho = 9072 // ncol
    grid = ''.join('<w:gridCol w:w="%d"/>' % ancho for _ in range(ncol))
    o = ('<w:tbl><w:tblPr><w:tblW w:w="9072" w:type="dxa"/><w:tblBorders>'
         '<w:top w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
         '<w:left w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
         '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
         '<w:right w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
         '<w:insideH w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
         '<w:insideV w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
         '</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>'
         '<w:tblGrid>' + grid + '</w:tblGrid>')
    if cab:
        o += '<w:tr><w:trPr><w:tblHeader/></w:trPr>' + \
             ''.join(celda(c, ancho, True) for c in cab) + '</w:tr>'
    for f in filas:
        f = list(f) + [''] * (ncol - len(f))
        o += '<w:tr>' + ''.join(celda(c, ancho) for c in f) + '</w:tr>'
    return o + '</w:tbl>' + parrafo('', espacio=0)


COLOR_AVISO = {'ok': 'E8F5EC', 'warn': 'FDF3DC', 'danger': 'FBE6E6', 'info': 'EDF1F7'}


def aviso(bloque):
    """Los recuadros de la app: en el Word, una tabla de una celda con fondo."""
    fondo = COLOR_AVISO.get(bloque.get('clase'), 'EDF1F7')
    dentro = ''
    if bloque.get('tit'):
        dentro += ('<w:p><w:pPr><w:pStyle w:val="TablaTxt"/><w:spacing w:after="60"/></w:pPr>'
                   + runs(bloque['tit'], True) + '</w:p>')
    cuerpo = bloque.get('cuerpo') or []
    for i, l in enumerate(cuerpo):
        dentro += ('<w:p><w:pPr><w:pStyle w:val="TablaTxt"/>'
                   '<w:spacing w:after="%d"/></w:pPr>%s</w:p>'
                   % (0 if i == len(cuerpo) - 1 else 60, runs(l)))
    if not dentro:
        dentro = '<w:p><w:pPr><w:pStyle w:val="TablaTxt"/></w:pPr></w:p>'
    return ('<w:tbl><w:tblPr><w:tblW w:w="9072" w:type="dxa"/><w:tblBorders>'
            '<w:top w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
            '<w:left w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
            '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
            '<w:right w:val="single" w:sz="6" w:space="0" w:color="D6DCE5"/>'
            '<w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>'
            '<w:tblLayout w:type="fixed"/></w:tblPr>'
            '<w:tblGrid><w:gridCol w:w="9072"/></w:tblGrid><w:tr><w:tc>'
            '<w:tcPr><w:tcW w:w="9072" w:type="dxa"/><w:shd w:val="clear" w:fill="' + fondo + '"/>'
            '<w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/>'
            '<w:left w:w="180" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar>'
            '</w:tcPr>' + dentro + '</w:tc></w:tr></w:tbl>' + parrafo('', espacio=0))


def imagen(rid, cx, cy, n):
    return ('<w:p><w:pPr><w:spacing w:before="120" w:after="160"/>'
            '<w:jc w:val="center"/></w:pPr><w:r><w:drawing>'
            '<wp:inline distT="0" distB="0" distL="0" distR="0" '
            'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
            '<wp:extent cx="%d" cy="%d"/><wp:docPr id="%d" name="Imagen %d"/>'
            '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
            '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
            '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
            '<pic:nvPicPr><pic:cNvPr id="%d" name="Imagen %d"/><pic:cNvPicPr/></pic:nvPicPr>'
            '<pic:blipFill><a:blip r:embed="%s"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
            '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="%d" cy="%d"/></a:xfrm>'
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
            '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
            % (cx, cy, n, n, n, n, rid, cx, cy))


# ------------------------------------------------------------------- armado
def armar(manual, salida, ver, hoy):
    """Escribe UN .docx con los capitulos que recibe."""
    cuerpo = []
    cuerpo.append(parrafo('AFAAR', 'Title'))
    cuerpo.append(parrafo('Manual de uso, alcances y capacidad', 'Subtitulo'))
    cuerpo.append(parrafo(salida['rotulo'], 'Mini'))
    cuerpo.append(aviso({'clase': 'info', 'tit':
        '<b>' + salida['rotulo'] + '</b>  ·  <b>Versión de la aplicación:</b> ' + ver +
        '  ·  <b>Generado:</b> ' + hoy,
        'cuerpo': [
            ('Contiene los mismos capítulos que ve la coordinación dentro de la aplicación, '
             'incluido el anexo de administración de la base.') if salida['coord'] else
            ('Contiene los mismos capítulos que ve un socio dentro de la aplicación. El anexo '
             'de administración de la base es de uso exclusivo de la coordinación y no figura acá.'),
            'Este documento se genera automáticamente desde el manual que vive dentro de la '
            'aplicación (<code>src/data-manual.js</code>), con <code>manual-a-word.py</code>. '
            'Los dos dicen exactamente lo mismo.',
            '<b>No editar este archivo a mano</b>: lo que se escriba acá se pierde en la próxima '
            'generación. Las correcciones van en el manual de la aplicación.']}))

    imgs = []
    n_img = 0

    for c in manual:
        titulo = ((c.get('n') + ' · ') if c.get('n') else '') + c.get('tit', '')
        cuerpo.append(parrafo(titulo, 'Heading1'))
        if c.get('coord'):
            cuerpo.append(parrafo('Capítulo visible únicamente para la coordinación.', 'Mini'))
        pendientes_li = []

        def volcar_li():
            for b in pendientes_li:
                cuerpo.append(item(b.get('txt', ''), b.get('num')))
            del pendientes_li[:]

        for b in c.get('b', []):
            t = b.get('t')
            if t == 'li':
                pendientes_li.append(b); continue
            volcar_li()
            if t == 'h2':      cuerpo.append(parrafo(b.get('txt', ''), 'Heading2'))
            elif t == 'h3':    cuerpo.append(parrafo(b.get('txt', ''), 'Heading3'))
            elif t == 'p':     cuerpo.append(parrafo(b.get('txt', '')))
            elif t == 'tabla': cuerpo.append(tabla(b))
            elif t == 'aviso': cuerpo.append(aviso(b))
            elif t == 'img':
                ruta = os.path.join(BASE, b.get('src', ''))
                if not os.path.exists(ruta):
                    print('  !! falta la imagen %s (se omite)' % b.get('src')); continue
                med = medida_jpeg(ruta)
                if not med:
                    print('  !! no pude leer %s (se omite)' % b.get('src')); continue
                w, h = med
                cx = int(ANCHO_IMG_CM * EMU_POR_CM)
                cy = int(cx * h / float(w))
                n_img += 1
                rid = 'rIdImg%d' % n_img
                imgs.append((ruta, rid, n_img))
                cuerpo.append(imagen(rid, cx, cy, n_img))
        volcar_li()

    doc = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
           '<w:document '
           'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
           'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
           '<w:body>' + ''.join(cuerpo) +
           '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
           '<w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" '
           'w:header="708" w:footer="708" w:gutter="0"/>'
           '<w:footerReference w:type="default" r:id="rIdFooter"/></w:sectPr>'
           '</w:body></w:document>')

    rels = io.open(os.path.join(PLANTILLA, 'word___rels__document.xml.rels'),
                   encoding='utf-8').read()
    extra = ''.join(
        '<Relationship Id="%s" Type="http://schemas.openxmlformats.org/officeDocument/'
        '2006/relationships/image" Target="media/img%d.jpg"/>' % (rid, n)
        for (_, rid, n) in imgs)
    rels = rels.replace('</Relationships>', extra + '</Relationships>')

    ctypes = io.open(os.path.join(PLANTILLA, '[Content_Types].xml'), encoding='utf-8').read()
    if imgs and 'Extension="jpg"' not in ctypes:
        ctypes = ctypes.replace('<Default Extension="xml"',
            '<Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="xml"')

    destino = os.path.join(CARPETA, salida['docx'])
    tmp = destino + '.tmp'
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', ctypes)
        z.writestr('_rels/.rels',
                   io.open(os.path.join(PLANTILLA, '_rels__.rels'), encoding='utf-8').read())
        z.writestr('word/document.xml', doc)
        z.writestr('word/_rels/document.xml.rels', rels)
        for nombre, arch in [('word/styles.xml', 'word__styles.xml'),
                             ('word/numbering.xml', 'word__numbering.xml'),
                             ('word/footer1.xml', 'word__footer1.xml'),
                             ('docProps/core.xml', 'docProps__core.xml')]:
            z.writestr(nombre, io.open(os.path.join(PLANTILLA, arch), encoding='utf-8').read())
        for (ruta, _rid, n) in imgs:
            z.write(ruta, 'word/media/img%d.jpg' % n)
    os.replace(tmp, destino)
    return destino, len(manual), len(imgs)


def main():
    if not os.path.isdir(PLANTILLA):
        sys.exit('ERROR: falta manual-word/plantilla/. Ver el encabezado de este archivo.')
    if not os.path.isdir(CARPETA):
        sys.exit('ERROR: no existe la carpeta %s' % CARPETA)

    todos = leer_manual()
    ver = version_app()
    hoy = datetime.datetime.now().strftime('%d/%m/%Y')

    for salida in SALIDAS:
        bloqueo = os.path.join(CARPETA, '~$' + salida['docx'][2:])
        if os.path.exists(bloqueo):
            print('  !! «%s» parece abierto en Word. Cerralo si la escritura falla.'
                  % salida['docx'])
        caps = todos if salida['coord'] else [c for c in todos if not c.get('coord')]
        destino, n, ni = armar(caps, salida, ver, hoy)
        print('OK  %s' % salida['docx'])
        print('    %d capítulos · %d imágenes · %.0f KB'
              % (n, ni, os.path.getsize(destino) / 1024.0))

        # El PDF que sirve la app sale de este Word. No se puede convertir sin
        # Word abierto, asi que lo unico honesto es avisar cuando quedo viejo.
        pdf = os.path.join(BASE, salida['pdf'])
        if os.path.exists(pdf) and os.path.getmtime(pdf) < os.path.getmtime(destino):
            print('    PENDIENTE: %s quedó más viejo que este Word.' % salida['pdf'])
            print('               Abrilo en Word y «Guardar como PDF» sobre %s'
                  % os.path.join(BASE, salida['pdf']))

    print('\nVersión de la aplicación: %s' % ver)


if __name__ == '__main__':
    main()
