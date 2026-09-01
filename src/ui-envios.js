/* =========================================================================
   ENVIO A CONTADURIA — VALORACION PRE-ANESTESICA Y FICHA ANESTESICA
   -------------------------------------------------------------------------
   Que resuelve
     Cada anestesiologo, al terminar la valoracion prequirurgica o la ficha
     anestesica, se la manda al contador de la asociacion con un boton. El
     contador no recibe un mail: le aparece en dos bandejas de su portal,
     ordenadas por profesional, con el honorario del acto discriminado y con
     el parte quirurgico adjunto. Desde ahi lo descarga o lo reenvia cuando
     una auditoria medica de una obra social lo pide.

   Por que esta separado del tablero economico
     El tablero del contador trabaja con prestaciones ANONIMIZADAS
     (prestacionesContables() en core.js) y esa regla no se toca. Estas dos
     bandejas son una excepcion deliberada y acotada: el que decide ceder la
     documentacion clinica es el profesional tratante, ficha por ficha, con
     una finalidad concreta —facturar y responder auditorias— y el envio
     queda asentado en la auditoria de la app con quien, que y cuando.
     Por eso NO hay ningun envio automatico: siempre lo dispara una persona.

   Donde viven los archivos
     Las fotos y los PDF no entran en las colecciones normales: irian a
     localStorage en todos los dispositivos y lo llenarian. Van a la rama
     afar/archivos, que nadie escucha en vivo, y se leen de a uno.
     Ver «ARCHIVOS PESADOS» en core.js.
   ========================================================================= */

/* Tipos de archivo que acepta la carga del parte quirurgico */
const PQ_ACEPTA = 'application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.tif,.tiff,.doc,.docx';
const PQ_TOPE   = 9000000;      /* 9 MB por archivo que no sea imagen */

/* =========================================================================
   1. CARGA DE LA FOJA / PARTE QUIRURGICO
   ========================================================================= */

/* El input de archivo se crea al vuelo y no se deja en el DOM: si estuviera
   dentro de #fiCuerpo, bloquearCuerpo() lo desactivaria en una ficha firmada
   y el parte quirurgico —que casi siempre llega DESPUES de firmar— no se
   podria adjuntar nunca. */
function pedirArchivos(acepta, capturar, onArchivos){
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = acepta;
  inp.multiple = true;
  if(capturar) inp.setAttribute('capture', 'environment');
  inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.onchange = () => {
    const fs = Array.from(inp.files || []);
    document.body.removeChild(inp);
    if(fs.length) onArchivos(fs);
  };
  inp.click();
}

function leerArchivoCrudo(file, tope){
  return new Promise((res, rej) => {
    if(file.size > (tope || PQ_TOPE))
      return rej(new Error('«'+file.name+'» pesa '+fTam(file.size)+'. El máximo es '+
        fTam(tope || PQ_TOPE)+'. Si es un PDF escaneado, volvé a exportarlo en menor calidad.'));
    const fr = new FileReader();
    fr.onload  = () => res(fr.result);
    fr.onerror = () => rej(new Error('No se pudo leer «'+file.name+'».'));
    fr.readAsDataURL(file);
  });
}

/* Sube uno o varios archivos y los engancha a la ficha */
function cargarParteQuirurgico(f, files){
  const cola = files.slice();
  const hechos = [];
  toast('Procesando '+cola.length+' archivo'+(cola.length===1?'':'s')+'…', 'ok');

  const siguiente = () => {
    if(!cola.length){
      if(!hechos.length) return;
      f.acto = f.acto || {};
      f.acto.parteQuirurgico = partesQuirurgicos(f).concat(hechos);
      guardarFicha(true, true);
      auditar('parte-quirurgico-alta',
        hechos.length + ' archivo(s) en la ficha ' + f.id);
      refrescarAdjuntos();
      toast(hechos.length+' archivo'+(hechos.length===1?'':'s')+' adjunto'+
        (hechos.length===1?'':'s')+(nubeOK ? ' y sincronizado.' : ' en este dispositivo.'), 'ok');
      return;
    }
    const file = cola.shift();
    const esImg = /^image\//.test(file.type) || /\.(jpe?g|png|webp|gif|tiff?|heic|heif)$/i.test(file.name);
    const prom = esImg
      ? comprimirImagen(file, 1800, 0.74).catch(() => leerArchivoCrudo(file))
      : leerArchivoCrudo(file);

    prom.then(dataUrl => {
      const id = uid('arch');
      const mime = esImg ? 'image/jpeg' : (file.type || 'application/octet-stream');
      const reg = {
        id, fichaId:f.id, nombre:file.name, mime,
        /* Un adjunto de una ficha de demostración se queda en el dispositivo,
           igual que la ficha: la base compartida no se ensucia con pruebas. */
        demo: !!f.demo,
        tam: Math.round((dataUrl.length - (dataUrl.indexOf(',')+1)) * 0.75),
        datos: dataUrl, cuando: new Date().toISOString(),
        porUid: SESION ? SESION.uid : '', porNombre: USUARIO ? (USUARIO.apellido+', '+USUARIO.nombre) : ''
      };
      return archivoGuardar(reg).then(enNube => {
        hechos.push({ id, nombre:file.name, mime, tam:reg.tam, cuando:reg.cuando,
                      porUid:reg.porUid, porNombre:reg.porNombre, enNube: !!enNube });
        siguiente();
      });
    }).catch(e => {
      toast(e.message || 'No se pudo adjuntar el archivo.', 'err');
      siguiente();
    });
  };
  siguiente();
}

/* =========================================================================
   FOTO DE LA VALORACION HECHA EN PAPEL
   -------------------------------------------------------------------------
   Mismo camino que el parte quirurgico, y por la misma razon: la rama
   afar/archivos no la escucha nadie en vivo. La foto no viaja con la ficha ni
   se guarda entera en el dispositivo -en el equipo queda una cache chica con
   lo ultimo abierto, que se poda sola-, y se trae de la nube recien cuando
   alguien la abre. Para la app y para Firebase pesa lo mismo que un renglon
   de texto: lo unico que la ficha guarda es el id del archivo.

   Se comprime mas fuerte que el parte quirurgico. Una hoja manuscrita se lee
   perfecto con el lado mayor en 1400 px, y asi una foto de 4 MB del telefono
   queda en unos 180 KB.
   ========================================================================= */
function cargarValoracionExterna(f, files){
  const cola = files.slice();
  const hechos = [];
  toast('Procesando '+cola.length+' archivo'+(cola.length===1?'':'s')+'…', 'ok');

  const siguiente = () => {
    if(!cola.length){
      if(!hechos.length) return;
      f.sinValoracion = Object.assign({ motivo:'externa', adjuntos:[] }, f.sinValoracion || {});
      f.sinValoracion.adjuntos = adjuntosValoracion(f).concat(hechos);
      guardarFicha(true, true);
      auditar('valoracion-externa-adjunto', hechos.length + ' archivo(s) en la ficha ' + f.id);
      refrescarValoracionExterna();
      toast(hechos.length+' archivo'+(hechos.length===1?'':'s')+' adjunto'+
        (hechos.length===1?'':'s')+(nubeOK ? ' y sincronizado.' : ' en este dispositivo.'), 'ok');
      return;
    }
    const file = cola.shift();
    const esImg = /^image\//.test(file.type) ||
                  /\.(jpe?g|png|webp|gif|tiff?|heic|heif)$/i.test(file.name);
    const prom = esImg ? comprimirImagen(file, 1400, 0.70).catch(() => leerArchivoCrudo(file))
                       : leerArchivoCrudo(file);
    prom.then(dataUrl => {
      const id = uid('arch');
      const mime = esImg ? 'image/jpeg' : (file.type || 'application/octet-stream');
      const reg = {
        id, fichaId:f.id, nombre:file.name, mime, demo: !!f.demo,
        tam: Math.round((dataUrl.length - (dataUrl.indexOf(',')+1)) * 0.75),
        datos: dataUrl, cuando: new Date().toISOString(),
        porUid: SESION ? SESION.uid : '',
        porNombre: USUARIO ? (USUARIO.apellido+', '+USUARIO.nombre) : ''
      };
      return archivoGuardar(reg).then(enNube => {
        hechos.push({ id, nombre:file.name, mime, tam:reg.tam, cuando:reg.cuando,
                      porUid:reg.porUid, porNombre:reg.porNombre, enNube: !!enNube });
        siguiente();
      });
    }).catch(e => {
      toast(e.message || 'No se pudo adjuntar el archivo.', 'err');
      siguiente();
    });
  };
  siguiente();
}

function quitarValoracionExterna(f, id){
  confirmar('Quitar el archivo',
    'Se elimina de la ficha y de la nube. Esta acción no se puede deshacer.',
    () => {
      f.sinValoracion = f.sinValoracion || {};
      f.sinValoracion.adjuntos = adjuntosValoracion(f).filter(x => x.id !== id);
      archivoEliminar(id);
      guardarFicha(true, true);
      auditar('valoracion-externa-baja', id);
      refrescarValoracionExterna();
      toast('Archivo eliminado.', 'ok');
    }, 'Quitar', true);
}

/* La tarjeta que encabeza el paso Preanestesia cuando se declaro un motivo */
function htmlValoracionExterna(f){
  const s = deudaValoracion(f);
  if(!s) return '';
  const m = MOTIVOS_SIN_VALORACION.find(x => x.id === s.motivo) || {};
  const l = adjuntosValoracion(f);
  const puede = esAutorFicha(f) || esActorFicha(f) || esCoordinador();
  return ''+
  '<div class="card no-print" id="svCard" style="border:1.5px solid var(--warn)">'+
    '<h3>'+ico('alerta')+'Valoración prequirúrgica pendiente</h3>'+
    '<div class="aviso warn" style="margin-top:0">'+ico('info')+'<div>'+
      '<b>'+esc(m.n)+'.</b> Declarado por '+esc(s.porNombre || '—')+
      (s.cuando ? ' el '+fFecha(s.cuando.slice(0,10)) : '')+'.'+
      (s.quien ? '<br>La hizo <b>'+esc(s.quien)+'</b>'+
        (s.fechaVal ? ' el '+fFecha(s.fechaVal) : '')+'.' : '')+
      (s.origenTxt ? '<br>Viene de la ficha de <b>'+esc(s.origenTxt)+'</b>.' : '')+
      (s.tipo ? '<br>Tipo: <b>'+esc(s.tipo)+'</b>.' : '')+
      (s.nota ? '<br>'+esc(s.nota) : '')+
      '<br>Esta ficha <b>no se puede firmar</b> hasta que estos once puntos estén completos, y '+
      'una vez terminado el acto se te va a recordar cada diez minutos.'+
    '</div></div>'+

    /* Reintervencion. Dos cosas distintas conviven aca:
       - traer (o volver a traer) la valoracion de aquella ficha;
       - firmar el consentimiento NUEVO, que es lo unico que no se importa.
       El consentimiento se apoya en la valoracion anterior pero es de ESTA
       cirugia: otro procedimiento, otro riesgo, otra firma. La Ley 26.529 lo
       pide para la intervencion que se va a hacer, no para la que ya se hizo. */
    (s.motivo === 'reintervencion' && puede
      ? (() => {
          const hayOrigen = s.fichaOrigen && DB.fichas[s.fichaOrigen];
          const listoParaFirmar = !!(f.cirugia && f.diagnostico);
          const yaFirmado = consentimientoCompleto(f);
          /* Ya no hay «volver a traer»: la valoracion se importa al elegir la
             intervencion, en el paso anterior. Repetir el boton invita a
             pisar lo que uno acaba de corregir a mano. */
          return '<div class="btn-row mt8">'+
            (yaFirmado ? '' :
              '<button class="btn pri chico" id="svConsent"'+(listoParaFirmar?'':' disabled')+'>'+
                ico('firma')+' Completar y firmar el consentimiento de esta intervención</button>')+
            (hayOrigen
              ? '<button class="btn ghost chico" id="svVerOrigen">'+ico('ojo')+
                  ' Ver aquella ficha</button>'
              : '')+
          '</div>'+
          (yaFirmado
            ? '<div class="aviso ok mt8">'+ico('check')+'<div>El consentimiento de esta '+
              'intervención ya está otorgado.</div></div>'
            : listoParaFirmar
              ? '<p class="mini mt8">Se traen antecedentes, examen, laboratorio, escalas y plan. '+
                'El <b>consentimiento no se copia</b>: aquel era de otro procedimiento y de otro '+
                'riesgo. Este se apoya en la misma valoración pero lleva el diagnóstico de ahora '+
                '—<b>'+esc(f.cirugia)+'</b>— y lo firman el paciente y el anestesiólogo. Si es '+
                'urgencia o emergencia, se documenta la salida del artículo 9.</p>'
              : '<div class="aviso warn mt8">'+ico('alerta')+'<div><b>Falta la cirugía y el '+
                'diagnóstico de esta intervención.</b> Cargalos en el paso <b>Paciente</b>: el '+
                'consentimiento tiene que decir de qué procedimiento es.</div></div>');
        })()
      : '')+
    (s.motivo === 'externa'
      ? '<p class="mini">Adjuntá acá la valoración que se hizo en papel: sacale una foto con el '+
        'teléfono o subí el archivo si ya está escaneada. Entra <b>PDF</b>, JPG, PNG, HEIC del '+
        'iPhone y Word.<br>Las fotos se achican solas y <b>no viajan con la ficha</b> —se guardan '+
        'aparte y se traen recién cuando alguien las abre—, así que no pesan ni en la aplicación '+
        'ni en la base.</p>'+
        (puede ? '<div class="btn-row mt8">'+
          '<button class="btn pri chico" id="svFoto" data-lectura'+(f.pacienteId?'':' disabled')+'>'+
            ico('camara')+' Tomar foto de la hoja</button>'+
          '<button class="btn ghost chico" id="svArchivo" data-lectura'+
            (f.pacienteId?'':' disabled')+'>'+ico('adjunto')+
            ' Subir PDF o archivo</button></div>' : '')+
        /* Sin paciente la ficha no se guarda, asi que el archivo se subiria a
           una ficha que no existe y la referencia se perderia al recargar. La
           foto es un respaldo del papel, no una fuente de datos: la
           aplicacion no puede leer el nombre de una imagen. */
        (f.pacienteId ? '' :
          '<div class="aviso warn mt8">'+ico('alerta')+'<div><b>Elegí primero el paciente.</b><br>'+
          'El archivo se guarda dentro de la ficha, y la ficha todavía no tiene a quién pertenece. '+
          'La foto es el respaldo del papel: el nombre hay que elegirlo del padrón para que la '+
          'ficha se pueda buscar, facturar e informar.</div></div>')+
        '<div id="svLista" class="adjuntos mt14">'+ htmlListaAdjuntos(l, puede) +'</div>'
      : '')+
  '</div>';
}

function cablearValoracionExterna(f){
  const s = sinValoracion(f) || {};
  if($('#svVerOrigen')) $('#svVerOrigen').onclick = () => verFichaSoloLectura(s.fichaOrigen);
  /* Atajo directo al punto 11, sin vueltas: abre el consentimiento ya
     desplegado y con el paciente y la cirugía de esta ficha adentro. */
  if($('#svConsent')) $('#svConsent').onclick = () => abrirConsentimientoModal(f);
  if($('#svFoto')) $('#svFoto').onclick = () =>
    pedirArchivos('image/*', true, fs => cargarValoracionExterna(f, fs));
  if($('#svArchivo')) $('#svArchivo').onclick = () =>
    pedirArchivos(PQ_ACEPTA, false, fs => cargarValoracionExterna(f, fs));
  $$('#svLista [data-adjver]').forEach(b => b.onclick = () => verAdjunto(b.dataset.adjver));
  $$('#svLista [data-adjbaj]').forEach(b => b.onclick = () => bajarAdjunto(b.dataset.adjbaj));
  $$('#svLista [data-adjdel]').forEach(b =>
    b.onclick = () => quitarValoracionExterna(f, b.dataset.adjdel));
}

/* Repinta solo su tarjeta, sin rehacer el paso: mismo criterio que los
   partes quirurgicos, para no devolver el telefono al principio. */
function refrescarValoracionExterna(){
  const f = fichaActual;
  if(!f) return;
  const c = $('#svCard');
  if(!c) return;
  const y = window.scrollY || 0;
  const m = $('main'); const my = m ? m.scrollTop : 0;
  c.outerHTML = htmlValoracionExterna(f);
  cablearValoracionExterna(f);
  if(m && my) m.scrollTop = my;
  if(y) window.scrollTo({ top:y, behavior:'auto' });
}

/* =========================================================================
   VER UNA FICHA ANTERIOR SIN SALIR DE LA QUE SE ESTA CARGANDO
   -------------------------------------------------------------------------
   Antes «Ver aquella ficha» navegaba: uno se iba de la ficha que estaba
   cargando para leer otra, y volver era su problema. Ahora se abre el
   documento en una ventana, de solo lectura, y se cierra.

   Va dentro de un iframe a proposito: el documento trae su propio CSS de
   impresion -reglas sobre body, tablas y tipografia- que fuera del marco se
   derramaria sobre la aplicacion entera.
   ========================================================================= */
function verFichaSoloLectura(fichaId){
  const g = DB.fichas[fichaId];
  if(!g) return toast('Aquella ficha ya no está disponible.', 'err');
  const p = DB.pacientes[g.pacienteId] || {};
  abrirModal('Ficha anterior — sólo lectura',
    '<div class="aviso info">'+ico('candado')+'<div><b>'+
      esc((p.apellido||'—')+', '+(p.nombre||''))+'</b> · '+esc(g.cirugia || 'sin cirugía')+' · '+
      esc(fFecha(fechaDeFicha(g) || g.fecha))+'<br>'+
      'Se muestra tal como quedó. Nada de lo que veas acá se puede editar desde esta ventana.'+
    '</div></div>'+
    '<iframe id="verFichaDoc" title="Ficha anterior" style="width:100%;height:60vh;border:1px '+
      'solid var(--borde);border-radius:10px;background:#fff"></iframe>',
    '<button class="btn pri" data-cerrar>Cerrar</button>', '900px');
  const marco = $('#verFichaDoc');
  if(marco) marco.srcdoc = '<!DOCTYPE html><html lang="es-AR"><head><meta charset="utf-8">'+
    '<style>'+CSS_DOC+'body{padding:16px}</style></head><body>'+
    documentoFicha(g, {})+'</body></html>';
}

function quitarParteQuirurgico(f, id){
  confirmar('Quitar el archivo',
    'Se elimina de la ficha y de la nube. Si ya fue enviado a contaduría, el contador '+
    'lo pierde también. Esta acción no se puede deshacer.',
    () => {
      f.acto = f.acto || {};
      f.acto.parteQuirurgico = partesQuirurgicos(f).filter(x => x.id !== id);
      archivoEliminar(id);
      guardarFicha(true, true);
      auditar('parte-quirurgico-baja', id);
      refrescarAdjuntos();
      toast('Archivo eliminado.', 'ok');
    }, 'Quitar', true);
}

/* --------------------------------------------------- Tarjeta de adjuntos */
/* puedeSubir: el parte quirurgico es del acto. Si el acto es de otro colega,
   la tarjeta se ve —hace falta para leerla— pero sin los botones de carga. */
function htmlParteQuirurgico(f, puedeSubir){
  const l = partesQuirurgicos(f);
  return ''+
  '<div class="card no-print" id="pqCard"><h3>'+ico('bisturi')+'Foja quirúrgica / parte quirúrgico</h3>'+
    '<p class="mini">Es el parte que redacta y firma el cirujano. Sacale una foto o subí el '+
      'archivo: entra PDF, JPG, PNG, HEIC del iPhone y Word. Las fotos se achican solas para '+
      'que viajen rápido, sin que se pierda la lectura.</p>'+
    (puedeSubir === false ? '' : '<div class="btn-row mt8">'+
      '<button class="btn ghost chico" id="pqFoto" data-lectura>'+ico('camara')+' Tomar foto</button>'+
      '<button class="btn ghost chico" id="pqArchivo" data-lectura>'+ico('adjunto')+' Elegir archivo</button>'+
    '</div>')+
    '<div id="pqLista" class="adjuntos mt14">'+
      htmlListaAdjuntos(l, puedeSubir !== false) +'</div>'+
    (l.length && !nubeOK
      ? '<div class="aviso warn mt8">'+ico('alerta')+'<div><b>Sin conexión con la nube.</b> '+
        'Los archivos quedaron guardados en este dispositivo. Se suben solos cuando vuelva la '+
        'conexión, pero hasta entonces el contador no los ve.</div></div>' : '')+
  '</div>';
}

function htmlListaAdjuntos(l, conBorrar){
  if(!l.length) return '<div class="mini">Todavía no hay ningún parte quirúrgico adjunto.</div>';
  return l.map(x =>
    '<div class="adj" data-adj="'+esc(x.id)+'">'+
      '<span class="ic">'+ico(iconoArchivo(x.mime, x.nombre))+'</span>'+
      '<span class="tx"><b>'+esc(x.nombre)+'</b>'+
        '<i>'+fTam(x.tam)+(x.cuando ? ' · '+fFecha(x.cuando.slice(0,10)) : '')+
        (x.porNombre ? ' · '+esc(x.porNombre) : '')+'</i></span>'+
      '<button type="button" class="btn ghost chico" data-adjver="'+esc(x.id)+'" data-lectura>'+
        ico('ojo')+'</button>'+
      '<button type="button" class="btn ghost chico" data-adjbaj="'+esc(x.id)+'" data-lectura>'+
        ico('descargar')+'</button>'+
      (conBorrar ? '<button type="button" class="btn danger chico" data-adjdel="'+esc(x.id)+'">'+
        ico('borrar')+'</button>' : '')+
    '</div>').join('');
}

/* volver: si los adjuntos se listan DENTRO de un modal (el detalle del
   envio del contador), es la funcion que vuelve a pintar ese modal cuando
   se cierra el visor de la foto. Sin esto el visor pisa al detalle. */
function cablearAdjuntos(cont, f, volver){
  $$(cont+' [data-adjver]').forEach(b => b.onclick = () => verAdjunto(b.dataset.adjver, volver));
  $$(cont+' [data-adjbaj]').forEach(b => b.onclick = () => bajarAdjunto(b.dataset.adjbaj));
  if(f) $$(cont+' [data-adjdel]').forEach(b =>
    b.onclick = () => quitarParteQuirurgico(f, b.dataset.adjdel));
}

function cablearParteQuirurgico(f){
  if($('#pqFoto')) $('#pqFoto').onclick = () =>
    pedirArchivos('image/*', true, fs => cargarParteQuirurgico(f, fs));
  if($('#pqArchivo')) $('#pqArchivo').onclick = () =>
    pedirArchivos(PQ_ACEPTA, false, fs => cargarParteQuirurgico(f, fs));
  cablearAdjuntos('#pqLista', f);
}

/* Repinta SOLO lo que cambia al adjuntar o quitar un parte: su tarjeta y la
   del envío a contaduría, que muestra cuántos adjuntos van.

   Antes esto llamaba a pintarFicha(), que rehace #vFicha entero —encabezado,
   barra de pasos y cuerpo—. En el teléfono eso devuelve la página al
   principio y corre la barra de pasos, que scrollea en horizontal, otra vez
   hasta «Paciente»: el anestesiólogo terminaba de sacarle la foto al parte y
   la app parecía haberlo sacado del paso «Firmar». */
function refrescarAdjuntos(){
  const f = fichaActual;
  if(!f) return;
  /* Reemplazar una tarjeta la saca del documento por un instante: la página
     se acorta, el navegador recorta el scroll y el teléfono queda arriba de
     todo. Se anota dónde estaba el usuario y se lo devuelve ahí. */
  const m = $('main');
  const y = window.scrollY || window.pageYOffset || 0;
  const my = m ? m.scrollTop : 0;

  const puede = puedeEditarSeccion(DB.fichas[f.id] || f, 'acto');
  const pq = $('#pqCard');
  if(pq){ pq.outerHTML = htmlParteQuirurgico(f, puede); cablearParteQuirurgico(f); }
  const ev = $('#evActoCard');
  if(ev){ ev.outerHTML = htmlEnvioFicha(f); cablearEnvioFicha(f); }

  if(m && my) m.scrollTop = my;
  if(y) window.scrollTo(0, y);
}

/* ------------------------------------------------------- Ver y descargar */
function dataUrlABlob(dataUrl){
  const i = String(dataUrl).indexOf(',');
  const cab = String(dataUrl).slice(0, i);
  const mime = (cab.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const cuerpo = String(dataUrl).slice(i + 1);
  if(!/;base64/.test(cab)) return new Blob([decodeURIComponent(cuerpo)], { type:mime });
  const bin = atob(cuerpo);
  const buf = new Uint8Array(bin.length);
  for(let k = 0; k < bin.length; k++) buf[k] = bin.charCodeAt(k);
  return new Blob([buf], { type:mime });
}

function verAdjunto(id, volver){
  toast('Abriendo el archivo…', 'ok');
  archivoLeer(id).then(a => {
    if(!a) return toast('El archivo no está en este dispositivo y no hay conexión con la nube.', 'err');
    if(esImagen(a.mime)){
      abrirModalEncima(volver, () => {
        abrirModal(a.nombre,
          '<div class="visor"><img src="'+esc(a.datos)+'" alt="'+esc(a.nombre)+'"></div>'+
          '<div class="mini mt8">'+esc(a.nombre)+' · '+fTam(a.tam)+'</div>',
          '<button class="btn ghost" data-cerrar>'+(volver ? 'Volver' : 'Cerrar')+'</button>'+
          '<button class="btn pri" id="vaBajar">'+ico('descargar')+' Descargar</button>', '840px');
        $('#vaBajar').onclick = () => descargar(a.nombre, dataUrlABlob(a.datos));
      });
      return;
    }
    /* PDF, Word y demas: se abren en una pestaña con su propio visor */
    const url = URL.createObjectURL(dataUrlABlob(a.datos));
    const w = window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    if(!w){ descargar(a.nombre, dataUrlABlob(a.datos));
            toast('El navegador bloqueó la ventana: se descargó el archivo.', 'warn'); }
  });
}

function bajarAdjunto(id){
  archivoLeer(id).then(a => {
    if(!a) return toast('El archivo no está disponible sin conexión.', 'err');
    descargar(a.nombre, dataUrlABlob(a.datos));
  });
}

/* =========================================================================
   2. ENVIO A CONTADURIA
   ========================================================================= */

/* Quien puede enviar cada cosa: la consulta prequirurgica es de quien firmo
   la valoracion; el acto, de quien lo realizo. La coordinacion puede en los
   dos casos, porque es la que resuelve los atrasos de facturacion. */
function puedeEnviar(f, tipo){
  if(esCoordinador()) return true;
  if(!SESION) return false;
  return titularDeEnvio(f, tipo) === SESION.uid;
}

function faltantesDeEnvio(f, tipo){
  const l = [];
  if(!f.pacienteId) l.push('el paciente');
  if(!f.institucion) l.push('la institución');
  if(!f.obraSocial) l.push('el financiador');
  if(!f.cirugia) l.push('la cirugía');
  const h = honorarioDeEnvio(f, tipo);
  if(!h.modalidad) l.push('la modalidad de honorarios');
  if(tipo === 'acto'){
    if(!(f.acto || {}).inicioCirugia) l.push('el horario del acto');
    if(!(f.firma || {}).firmado) l.push('la firma de la ficha');
  }
  return l;
}

function abrirEnvioContaduria(f, tipo){
  if(!puedeEnviar(f, tipo))
    return toast('Este envío lo hace '+esc(nombreUsuario(titularDeEnvio(f, tipo)))+
                 ', que es quien factura el acto.', 'err');

  const t = TIPOS_ENVIO[tipo];
  const p = DB.pacientes[f.pacienteId] || {};
  const h = honorarioDeEnvio(f, tipo);
  const adj = tipo === 'acto' ? partesQuirurgicos(f) : [];
  const faltan = faltantesDeEnvio(f, tipo);
  const previos = enviosDeFicha(f.id, tipo);

  abrirModal('Envío a contaduría — '+t.t,
    '<div id="envCuerpo">'+

    (previos.length
      ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Ya lo enviaste '+previos.length+' vez'+
        (previos.length===1?'':'ces')+'.</b> El último fue el '+
        fFechaLarga((previos[0].enviado||'').slice(0,10))+'. Si volvés a enviar, contaduría '+
        'recibe una versión nueva y conserva la anterior en el historial.</div></div>' : '')+

    (faltan.length
      ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Falta cargar '+esc(faltan.join(', '))+
        '.</b> Podés enviarlo igual, pero al contador le va a llegar incompleto y no va a poder '+
        'facturarlo sin volver a pedírtelo.</div></div>'
      : '<div class="aviso ok">'+ico('check')+'<div>El envío está completo.</div></div>')+

    (nubeOK ? ''
      : '<div class="aviso danger">'+ico('alerta')+'<div><b>Sin conexión con la nube.</b> '+
        'El envío se guarda en este dispositivo y viaja recién cuando haya señal. '+
        'Hasta entonces el contador no lo ve.</div></div>')+

    '<div class="card"><h3>'+ico(t.ico)+'Qué se envía</h3>'+
      '<div class="resumen">'+
        filaEnv('Documento', t.t)+
        filaEnv('Paciente', esc((p.apellido||'—')+', '+(p.nombre||''))+
                (p.dni ? ' · DNI '+esc(p.dni) : ''))+
        filaEnv('Fecha del acto', fFecha(f.fecha) + (f.hora ? ' · '+esc(f.hora)+' h' : ''))+
        filaEnv('Institución', esc(nombreInstitucion(f.institucion)))+
        filaEnv('Financiador', esc(f.obraSocial || 'Sin cobertura')+
                (f.nroAfiliado ? ' · afiliado '+esc(f.nroAfiliado) : ''))+
        filaEnv('Cirugía', esc(f.cirugia || '—'))+
        /* El caracter va DELANTE del honorario, no escondido en el documento:
           es de donde sale el adicional de urgencia, y es lo primero que
           mira una auditoria que discute el recargo. */
        (function(){
          const car = tipo === 'acto' ? caracterActo(f) : caracterValoracion(f);
          const txt = esc(nombreCaracter(car).toUpperCase());
          return filaEnv('Carácter '+(tipo === 'acto' ? 'del acto' : 'de la consulta'),
            esNoProgramado(car) ? '<span class="warn">'+txt+' · con adicional</span>' : txt);
        })()+
        (tipo === 'acto'
          ? filaEnv('Parte quirúrgico', adj.length
              ? adj.length+' archivo'+(adj.length===1?'':'s')
              : '<span class="warn">sin adjuntar</span>')
          : '')+
      '</div>'+
    '</div>'+

    '<div class="card"><h3>'+ico('dinero')+'Honorario que se factura</h3>'+
      htmlHonorarioDiscriminado(h, titularDeEnvio(f, tipo))+
      (h.factura ? '' : '<div class="aviso warn mt8">'+ico('alerta')+
        '<div>Con esta modalidad el acto <b>no genera honorario facturable</b>. El envío sirve '+
        'igual como respaldo documental ante una auditoría.</div></div>')+
    '</div>'+

    (tipo === 'acto' && !adj.length
      ? '<div class="aviso warn">'+ico('alerta')+'<div><b>No hay parte quirúrgico adjunto.</b> '+
        'Muchas auditorías lo piden junto con la ficha anestésica. Podés adjuntarlo ahora desde '+
        'la ficha y volver a enviar.</div></div>' : '')+

    campoArea('envNota','Nota para contaduría (opcional)', '',
      'Por ejemplo: reintegro, coseguro, expediente de auditoría, aclaración del adicional')+

    '<div class="aviso info">'+ico('candado')+'<div><b>Qué implica este envío.</b> '+
      'Le estás cediendo al contador de la asociación documentación clínica de un paciente, con '+
      'la finalidad de facturar el acto y responder auditorías médicas de los financiadores '+
      '(Ley 25.326, art. 11, y Ley 26.529). El envío queda registrado a tu nombre, con fecha y '+
      'hora, en la auditoría de la aplicación.</div></div>'+

    '</div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="envConfirmar">'+ico('enviar')+' Enviar a contaduría</button>', '820px');

  $('#envConfirmar').onclick = () => {
    const nota = val('envNota');
    cerrarModal();
    registrarEnvio(f, tipo, nota);
  };
}

function filaEnv(l, v){
  return '<div class="res-fila"><span>'+esc(l)+'</span><b>'+v+'</b></div>';
}

function htmlHonorarioDiscriminado(h, uidTitular){
  const filas = [];
  if(h.modalidad === 'abierto' && h.ua)
    filas.push(['Base — '+h.ua+' UA × '+fMoneda(h.valorUnidad), fMoneda(h.base)]);
  else if(h.base)
    filas.push(['Base — '+esc(h.modalidadNombre), fMoneda(h.base)]);
  (h.adicionales || []).forEach(a =>
    filas.push([esc(a.n)+' (+'+a.pct+' %)', fMoneda(a.monto)]));

  return '<div class="tabla-wrap"><table>'+
    '<tr><th>Concepto</th><th class="num">Importe</th></tr>'+
    '<tr><td colspan="2"><b>'+esc(h.concepto)+'</b> — '+esc(nombreUsuario(uidTitular))+'</td></tr>'+
    filas.map(r => '<tr><td>'+r[0]+'</td><td class="num">'+r[1]+'</td></tr>').join('')+
    '<tr style="font-weight:800"><td>TOTAL</td><td class="num">'+fMoneda(h.total)+'</td></tr>'+
    '<tr><td>Modalidad</td><td class="num">'+esc(h.modalidadNombre)+'</td></tr>'+
    '<tr><td>Estado administrativo</td><td class="num">'+esc(h.estado)+
      (h.comprobante ? ' · comprob. '+esc(h.comprobante) : '')+'</td></tr>'+
    (h.cobrado ? '<tr><td>Cobrado</td><td class="num">'+fMoneda(h.cobrado)+'</td></tr>' : '')+
    '</table></div>';
}

/* --------------------------------------------------- Registro del envio */
/* Arma el registro del envio y su documento, sin escribir nada. Lo usan el
   boton «Enviar a contaduria» y la siembra de la demostracion, para que los
   ejemplos que ve el contador tengan exactamente la misma forma que un envio
   de verdad y no haya dos versiones del mismo objeto dando vueltas. */
function armarEnvio(f, tipo, extra){
  const o = extra || {};
  const t = TIPOS_ENVIO[tipo];
  const p = DB.pacientes[f.pacienteId] || {};
  const uidTit = titularDeEnvio(f, tipo);
  const prof = DB.usuarios[uidTit] || USUARIO || {};
  const id = o.id || uid('env');
  const docId = 'doc_' + id;

  const cuerpo = documentoFicha(f, { parte: tipo });
  const docHtml = '<!DOCTYPE html><html lang="es-AR"><head><meta charset="utf-8">'+
    '<title>'+esc(t.t)+'</title><style>@page{size:A4;margin:1.6cm}'+CSS_DOC+'</style></head>'+
    '<body>'+cuerpo+'</body></html>';

  const nombreDoc = (tipo === 'valoracion' ? 'Valoracion-' : 'Ficha-')+
    (p.apellido || 'paciente').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]+/g,'')+'-'+(f.fecha || hoyISO())+'.doc';

  const envio = {
    id, tipo, fichaId: f.id,
    uid: uidTit,
    profesional: nombreUsuario(uidTit),
    matricula: prof.matriculaProvincial || '',
    matriculaNacional: prof.matriculaNacional || '',
    email: prof.email || '',
    enviado: o.enviado || new Date().toISOString(),
    enviadoPor: o.enviadoPor || (SESION ? SESION.uid : ''),
    enviadoPorNombre: o.enviadoPorNombre ||
      (USUARIO ? (USUARIO.apellido+', '+USUARIO.nombre) : ''),

    fecha: f.fecha || '', mes: mesDe(f.fecha || ''), hora: f.hora || '',
    paciente: (p.apellido||'')+', '+(p.nombre||''),
    dni: p.dni || '', hc: p.hc || '',
    edad: edadDe(p.fechaNac, f.fecha),
    sexo: p.sexo || '',
    institucionId: f.institucion || '',
    institucion: nombreInstitucion(f.institucion),
    financiador: f.obraSocial || 'Sin cobertura',
    afiliado: f.nroAfiliado || '',
    cirugia: f.cirugia || '', cirugiaCod: f.cirugiaCod || '',
    diagnostico: f.diagnostico || '',
    /* El acto se factura por el caracter del acto; la valoracion, por el suyo. */
    caracter: tipo === 'acto' ? caracterActo(f) : caracterValoracion(f),

    honorario: honorarioDeEnvio(f, tipo),
    docId, docNombre: nombreDoc,
    adjuntos: (tipo === 'acto' ? partesQuirurgicos(f) : []).map(x =>
      ({ id:x.id, nombre:x.nombre, mime:x.mime, tam:x.tam })),
    nota: o.nota || '',
    enNube: false,
    visto: !!o.visto,
    demo: !!f.demo          /* los envíos de la demo no viajan a la nube */
  };
  if(o.visto){ envio.vistoCuando = o.vistoCuando || envio.enviado; envio.vistoPor = 'contable'; }

  return { envio, docHtml, docId, nombreDoc };
}

function registrarEnvio(f, tipo, nota){
  const t = TIPOS_ENVIO[tipo];
  const armado = armarEnvio(f, tipo, { nota });
  const envio = armado.envio;
  const id = envio.id;

  toast('Preparando el envío…', 'ok');

  archivoGuardar({
    id: armado.docId, fichaId: f.id, nombre: armado.nombreDoc, mime:'text/html', demo: !!f.demo,
    tam: armado.docHtml.length,
    datos: 'data:text/html;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(armado.docHtml))),
    cuando: new Date().toISOString()
  }).then(enNube => {

    envio.enNube = !!enNube;
    escribir('envios', id, envio);
    auditar('envio-contaduria',
      t.t + ' de ' + envio.paciente + ' (' + fFecha(envio.fecha) + ') a contaduría');

    /* La ficha guarda la constancia, para que se vea en el listado */
    f.enviosContaduria = Object.assign({}, f.enviosContaduria || {});
    f.enviosContaduria[tipo] = { id, cuando: envio.enviado, por: envio.enviadoPor };
    guardarFicha(true);
    pintarFicha();

    toast(enNube
      ? t.t + ' enviada a contaduría.'
      : 'Envío guardado. Viaja a contaduría cuando haya conexión.', enNube ? 'ok' : 'warn');
  });
}

/* =========================================================================
   3. TARJETAS DENTRO DE LA FICHA
   ========================================================================= */

/* Al final de la valoracion (paso Preanestesia, despues del punto 10) */
function htmlEnvioValoracion(f){
  const env = enviosDeFicha(f.id, 'valoracion')[0];
  const puede = puedeEnviar(f, 'valoracion');
  return ''+
  '<div class="card envio-card no-print"><h3>'+ico('enviar')+'Envío a contaduría</h3>'+
    '<p class="mini">Le manda al contador de la asociación esta valoración pre-anestésica con '+
      'el honorario de la consulta prequirúrgica discriminado, para que la facture y la tenga '+
      'disponible si una auditoría médica la pide.</p>'+
    (env
      ? '<div class="aviso ok mt8">'+ico('check')+'<div><b>Enviada</b> el '+
        fFechaLarga((env.enviado||'').slice(0,10))+' a las '+esc((env.enviado||'').slice(11,16))+' h'+
        (env.visto ? ' · <b>vista por contaduría</b>' : ' · todavía sin abrir')+'.</div></div>'
      : '')+
    (puede
      ? '<button class="btn pri mt8" id="evEnviarVal" data-lectura>'+ico('enviar')+
        (env ? ' Volver a enviar' : ' Enviar a contaduría')+'</button>'
      : '<div class="aviso info mt8">'+ico('info')+'<div>La consulta prequirúrgica la factura '+
        esc(autorFicha(f))+', que es quien la envía.</div></div>')+
  '</div>';
}
function cablearEnvioValoracion(f){
  if($('#evEnviarVal')) $('#evEnviarVal').onclick = () => {
    guardarPasoActual(); abrirEnvioContaduria(fichaActual, 'valoracion');
  };
}

/* =========================================================================
   ENVIAR EL ACTO SOLO, O LOS DOS JUNTOS
   -------------------------------------------------------------------------
   Al firmar la ficha, lo que hay para mandar puede ser una cosa o dos:

     - Sólo el acto. Es lo normal cuando la valoración la hizo un colega y ya
       la mandó él, o cuando se mandó el día de la consulta.
     - El acto Y la valoración. Es lo normal cuando los dos actos son de la
       misma persona y el prequirúrgico nunca llegó a contaduría.

   «Los dos» NO es un envío que contenga dos cosas: son DOS envíos, uno por
   bandeja, cada uno con su honorario discriminado y su propio titular. Al
   contador le llegan separados porque separados se facturan, aunque los haya
   hecho el mismo profesional. Eso no se toca.
   ========================================================================= */
function abrirEnvioAmbos(f){
  if(!puedeEnviar(f, 'acto') || !puedeEnviar(f, 'valoracion'))
    return toast('Los dos envíos tienen que ser tuyos para mandarlos juntos.', 'err');

  const p = DB.pacientes[f.pacienteId] || {};
  const hv = honorarioDeEnvio(f, 'valoracion');
  const ha = honorarioDeEnvio(f, 'acto');
  const faltanV = faltantesDeEnvio(f, 'valoracion');
  const faltanA = faltantesDeEnvio(f, 'acto');
  const previoV = enviosDeFicha(f.id, 'valoracion')[0];

  abrirModal('Envío a contaduría — valoración y acto',
    '<div class="aviso info">'+ico('enviar')+'<div><b>Van como dos envíos, no como uno.</b> '+
      'La consulta prequirúrgica entra en la bandeja de valoraciones y el acto en la de fichas, '+
      'cada uno con su honorario discriminado. Es como se facturan, aunque los dos sean '+
      'tuyos.</div></div>'+

    (previoV ? '<div class="aviso warn">'+ico('alerta')+'<div>La valoración <b>ya se envió</b> el '+
      fFechaLarga((previoV.enviado||'').slice(0,10))+'. Si seguís, contaduría recibe una versión '+
      'nueva y conserva la anterior.</div></div>' : '')+

    '<div class="card"><h3>'+ico('paciente')+'Paciente</h3><div class="resumen">'+
      filaEnv('Paciente', esc((p.apellido||'—')+', '+(p.nombre||''))+
              (p.dni ? ' · DNI '+esc(p.dni) : ''))+
      filaEnv('Cirugía', esc(f.cirugia || '—'))+
      filaEnv('Financiador', esc(f.obraSocial || 'Sin cobertura'))+
    '</div></div>'+

    '<div class="card"><h3>'+ico('valoracion')+'1 · Consulta prequirúrgica</h3>'+
      htmlHonorarioDiscriminado(hv, titularDeEnvio(f, 'valoracion'))+
      (faltanV.length ? '<div class="aviso warn mt8">'+ico('alerta')+'<div>Falta cargar '+
        esc(faltanV.join(', '))+'.</div></div>' : '')+
    '</div>'+

    '<div class="card"><h3>'+ico('jeringa')+'2 · Acto anestésico</h3>'+
      htmlHonorarioDiscriminado(ha, titularDeEnvio(f, 'acto'))+
      (faltanA.length ? '<div class="aviso warn mt8">'+ico('alerta')+'<div>Falta cargar '+
        esc(faltanA.join(', '))+'.</div></div>' : '')+
      (partesQuirurgicos(f).length ? '' : '<div class="aviso warn mt8">'+ico('alerta')+
        '<div>Sin parte quirúrgico adjunto.</div></div>')+
    '</div>'+

    campoArea('envNota','Nota para contaduría (opcional)', '',
      'Se copia en los dos envíos')+

    '<div class="aviso info">'+ico('candado')+'<div>Le estás cediendo al contador de la '+
      'asociación documentación clínica de un paciente, con la finalidad de facturar y responder '+
      'auditorías médicas (Ley 25.326, art. 11, y Ley 26.529). Los dos envíos quedan registrados '+
      'a tu nombre en la auditoría.</div></div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="envAmbos">'+ico('enviar')+' Enviar los dos</button>', '820px');

  $('#envAmbos').onclick = () => {
    const nota = val('envNota');
    cerrarModal();
    registrarEnvio(f, 'valoracion', nota);
    /* El segundo va con un respiro: registrarEnvio guarda un archivo y
       repinta la ficha, y los dos a la vez se pisaban el repintado. */
    setTimeout(() => registrarEnvio(f, 'acto', nota), 900);
  };
}

/* Al final de la ficha anestesica (paso Firmar) */
function htmlEnvioFicha(f){
  const env = enviosDeFicha(f.id, 'acto')[0];
  const puede = puedeEnviar(f, 'acto');
  const adj = partesQuirurgicos(f);
  return ''+
  '<div class="card envio-card no-print" id="evActoCard"><h3>'+ico('enviar')+'Envío a contaduría</h3>'+
    '<p class="mini">Manda la ficha anestésica y el parte quirúrgico juntos, con el honorario '+
      'del acto discriminado renglón por renglón: base, adicionales del nomenclador y total.</p>'+
    (env
      ? '<div class="aviso ok mt8">'+ico('check')+'<div><b>Enviada</b> el '+
        fFechaLarga((env.enviado||'').slice(0,10))+' a las '+esc((env.enviado||'').slice(11,16))+' h '+
        'con '+(env.adjuntos||[]).length+' adjunto'+((env.adjuntos||[]).length===1?'':'s')+
        (env.visto ? ' · <b>vista por contaduría</b>' : ' · todavía sin abrir')+'.'+
        ((env.adjuntos||[]).length !== adj.length
          ? '<br>Desde entonces cambiaron los adjuntos: volvé a enviar para que los reciba.' : '')+
        '</div></div>'
      : '')+
    (puede
      ? (function(){
          /* El segundo botón sólo aparece cuando la valoración también es
             mía: si es de un colega, la manda él y ofrecerlo sería ofrecer
             un envío que va a rebotar. */
          const tambienVal = puedeEnviar(f, 'valoracion');
          const envV = enviosDeFicha(f.id, 'valoracion')[0];
          return '<div class="btn-row mt8">'+
            '<button class="btn pri" id="evEnviarActo" data-lectura>'+ico('enviar')+
              (env ? ' Volver a enviar el acto' : ' Enviar sólo el acto')+'</button>'+
            (tambienVal
              ? '<button class="btn ghost" id="evEnviarAmbos" data-lectura>'+ico('enviar')+
                ' Enviar valoración + acto</button>'
              : '')+
          '</div>'+
          (tambienVal
            ? '<div class="ayuda">Los dos actos son tuyos. «Valoración + acto» manda <b>dos '+
              'envíos separados</b>, uno a cada bandeja, con su honorario discriminado en cada '+
              'uno: es como se facturan.'+
              (envV ? ' La valoración ya se envió una vez.' : '')+'</div>'
            : '<div class="ayuda">La consulta prequirúrgica la envía '+esc(autorFicha(f))+
              ', que es quien la factura.</div>');
        })()
      : '<div class="aviso info mt8">'+ico('info')+'<div>El acto lo factura '+
        esc(nombreActor(f))+', que es quien lo envía.</div></div>')+
  '</div>';
}
function cablearEnvioFicha(f){
  if($('#evEnviarActo')) $('#evEnviarActo').onclick = () => {
    guardarPasoActual(); abrirEnvioContaduria(fichaActual, 'acto');
  };
  if($('#evEnviarAmbos')) $('#evEnviarAmbos').onclick = () => {
    guardarPasoActual(); abrirEnvioAmbos(fichaActual);
  };
}

/* =========================================================================
   4. BANDEJAS DEL CONTADOR
   ========================================================================= */
let envSel  = { valoracion:'', acto:'' };     /* profesional abierto */
let envTxt  = { valoracion:'', acto:'' };     /* buscador */
let envMes  = { valoracion:'', acto:'' };     /* filtro por mes */

function vistaEnviosValoracion(){ vistaEnvios('valoracion', '#vEnvValoracion'); }
function vistaEnviosFicha(){      vistaEnvios('acto',       '#vEnvFicha'); }

/* Las dos bandejas viven a la vez en el documento —son dos <section> que se
   muestran y se ocultan—, así que NO pueden compartir los id de sus partes:
   $('#enCuerpo') devolvía siempre el de la primera y la segunda pintaba en un
   contenedor oculto. Cada una lleva su propio prefijo. */
function preEnvios(tipo){ return tipo === 'valoracion' ? 'enV' : 'enA'; }

function vistaEnvios(tipo, sel){
  const cont = $(sel);
  const t = TIPOS_ENVIO[tipo];
  const pre = preEnvios(tipo);
  const meses = Array.from(new Set(enviosDe(tipo).map(e => e.mes).filter(Boolean)))
    .sort().reverse();

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>'+esc(t.t)+'</h1>'+
    '<p>Documentación que cada anestesiólogo envió a contaduría</p></div></div>'+

  '<div class="aviso info">'+ico('candado')+'<div><b>Documentación clínica cedida por el '+
    'profesional tratante.</b> Cada envío lo dispuso el anestesiólogo que firma el acto, para '+
    'facturarlo y para responder auditorías médicas de los financiadores. Usala sólo con esa '+
    'finalidad y no la reenvíes a terceros ajenos a la auditoría (Ley 25.326 y Ley 26.529).</div></div>'+

  '<div class="filtros">'+
    '<div class="campo"><label>Buscar</label>'+
      '<input type="search" id="'+pre+'Buscar" placeholder="Profesional, paciente, cirugía, financiador…" '+
      'value="'+esc(envTxt[tipo])+'"></div>'+
    '<div class="campo"><label>Mes del acto</label><select id="'+pre+'Mes">'+
      '<option value="">Todos</option>'+
      meses.map(m => '<option value="'+esc(m)+'"'+(envMes[tipo]===m?' selected':'')+'>'+
        esc(nombreMes(m))+'</option>').join('')+
    '</select></div>'+
  '</div>'+

  '<div id="'+pre+'Cuerpo"></div>';

  $('#'+pre+'Buscar').oninput = debounce(e => { envTxt[tipo] = e.target.value; pintarEnvios(tipo); }, 250);
  $('#'+pre+'Mes').onchange   = e => { envMes[tipo] = e.target.value; pintarEnvios(tipo); };
  pintarEnvios(tipo);
}

function enviosFiltrados(tipo){
  const q = norm(envTxt[tipo] || '');
  const m = envMes[tipo] || '';
  return enviosDe(tipo).filter(e => {
    if(m && e.mes !== m) return false;
    if(!q) return true;
    return norm([e.profesional, e.paciente, e.dni, e.cirugia, e.financiador,
                 e.institucion, e.diagnostico].join(' ')).indexOf(q) >= 0;
  });
}

function pintarEnvios(tipo){
  const pre = preEnvios(tipo);
  const c = $('#'+pre+'Cuerpo');
  if(!c) return;                       /* la bandeja todavía no se pintó */
  const l = enviosFiltrados(tipo);
  const abierto = envSel[tipo];

  /* ---------------------------- lista de profesionales ---------------- */
  if(!abierto){
    const g = {};
    l.forEach(e => {
      const k = e.uid || 'sin';
      if(!g[k]) g[k] = { uid:e.uid, nombre:e.profesional || nombreUsuario(e.uid),
                         matricula:e.matricula || '', n:0, total:0, ultimo:'', sinVer:0 };
      g[k].n++; g[k].total += Number((e.honorario||{}).total || 0);
      if((e.enviado||'') > g[k].ultimo) g[k].ultimo = e.enviado || '';
      if(!e.visto) g[k].sinVer++;
    });
    const profs = Object.values(g).sort((a,b) => (a.nombre||'').localeCompare(b.nombre||'', 'es'));
    const totalGeneral = l.reduce((a,e) => a + Number((e.honorario||{}).total || 0), 0);
    const sinVer = l.filter(e => !e.visto).length;

    c.innerHTML =
      '<div class="grid c3 mb8">'+
        kpi('Envíos', l.length, 'azul', ico('bandeja'), profs.length+' profesional'+(profs.length===1?'':'es'))+
        kpi('Sin abrir', sinVer, sinVer?'warn':'ok', ico('campana'), 'documentación nueva')+
        kpi('Honorarios', fMoneda(totalGeneral), 'ok', ico('dinero'), 'suma de lo enviado')+
      '</div>'+
      (profs.length
        ? '<div class="lista">'+ profs.map(x =>
            '<div class="item" data-prof="'+esc(x.uid)+'">'+
              '<div class="avatar">'+esc(iniciales(...(x.nombre||', ').split(', ').reverse()))+'</div>'+
              '<div class="txt"><b>'+esc(x.nombre)+'</b>'+
                '<span>'+(x.matricula ? 'M.P. '+esc(matriculaTxt(x.matricula,'M.P.'))+' · ' : '')+
                x.n+' envío'+(x.n===1?'':'s')+
                (x.ultimo ? ' · último '+fFecha(x.ultimo.slice(0,10)) : '')+'</span></div>'+
              '<div class="der">'+
                (x.sinVer ? '<span class="tag warn">'+x.sinVer+' sin abrir</span>' : '')+
                '<span class="tag ok">'+fMoneda(x.total)+'</span>'+
              '</div></div>').join('') +'</div>'
        : '<div class="vacio">'+ico('bandeja')+'<b>No hay envíos todavía</b>'+
          '<span>Cuando un anestesiólogo use el botón «Enviar a contaduría», va a aparecer acá.</span>'+
          /* Los ejemplos viven sólo en el dispositivo, así que el contador no
             los hereda de la nube: tiene que poder cargarlos desde su propia
             bandeja. Sólo se ofrece si la base YA tiene demostración cargada;
             en una instalación real el botón no existe. */
          (hayDemo() && faltanEnviosDemo()
            ? '<button class="btn ghost chico mt14" id="'+pre+'Demo">'+ico('mas')+
              ' Cargar envíos de ejemplo</button>'+
              '<div class="ayuda" style="max-width:420px;margin:8px auto 0">Diecisiete envíos de '+
              'demostración, con su parte quirúrgico. Quedan sólo en este dispositivo: no se '+
              'suben a la base compartida.</div>'
            : '')+
          '</div>');

    $$('#'+pre+'Cuerpo [data-prof]').forEach(b => b.onclick = () => {
      envSel[tipo] = b.dataset.prof; pintarEnvios(tipo);
    });
    if($('#'+pre+'Demo')) $('#'+pre+'Demo').onclick = () => {
      sembrarEnviosDemo();
      auditar('demo-envios', 'Envíos de demostración cargados en este dispositivo');
      pintarEnvios('valoracion'); pintarEnvios('acto');
      toast('Envíos de ejemplo cargados.', 'ok');
    };
    return;
  }

  /* ---------------------------- envios de un profesional -------------- */
  const suyos = l.filter(e => (e.uid || 'sin') === abierto);
  const nombre = suyos.length ? suyos[0].profesional : nombreUsuario(abierto);
  const total = suyos.reduce((a,e) => a + Number((e.honorario||{}).total || 0), 0);

  c.innerHTML =
    '<button class="btn ghost chico mb8" id="'+pre+'Volver">'+ico('atras')+' Todos los profesionales</button>'+
    '<div class="card"><h3>'+ico('usuario')+esc(nombre)+'</h3>'+
      '<div class="grid c3">'+
        kpi('Envíos', suyos.length, 'azul', ico('bandeja'), '')+
        kpi('Honorarios', fMoneda(total), 'ok', ico('dinero'), 'suma de los envíos listados')+
        kpi('Sin abrir', suyos.filter(e => !e.visto).length, 'warn', ico('campana'), '')+
      '</div>'+
      '<div class="btn-row mt8">'+
        '<button class="btn ghost chico" id="'+pre+'Excel">'+ico('excel')+' Planilla de estos envíos</button>'+
      '</div>'+
    '</div>'+
    '<div class="lista">'+ suyos.map(e =>
      '<div class="item'+(e.visto?'':' nuevo')+'" data-env="'+esc(e.id)+'">'+
        '<div class="avatar" style="flex-direction:column;line-height:1.15;font-size:10px">'+
          '<b style="font-size:10px">'+esc(fFecha(e.fecha).slice(0,5))+'</b>'+
          '<span>'+esc(String(e.fecha||'').slice(0,4))+'</span></div>'+
        '<div class="txt"><b>'+esc(e.paciente || '—')+(e.dni ? ' · DNI '+esc(e.dni) : '')+'</b>'+
          '<span>'+esc(e.cirugia || '—')+' · '+esc(e.financiador)+' · '+
          esc(String(e.institucion||'').split('"')[0].trim())+'</span></div>'+
        '<div class="der">'+
          ((e.adjuntos||[]).length ? '<span class="tag">'+ico('adjunto')+(e.adjuntos||[]).length+'</span>' : '')+
          (e.visto ? '' : '<span class="tag warn">nuevo</span>')+
          '<span class="tag ok">'+fMoneda((e.honorario||{}).total || 0)+'</span>'+
        '</div></div>').join('') +'</div>';

  $('#'+pre+'Volver').onclick = () => { envSel[tipo] = ''; pintarEnvios(tipo); };
  $('#'+pre+'Excel').onclick  = () => exportarEnviosExcel(suyos, nombre, tipo);
  $$('#'+pre+'Cuerpo [data-env]').forEach(b => b.onclick = () => abrirEnvio(b.dataset.env, tipo));
}

/* ------------------------------------------------------ Detalle del envio */
function abrirEnvio(id, tipo){
  const e = DB.envios[id];
  if(!e) return toast('El envío ya no está.', 'err');
  const h = e.honorario || {};

  abrirModal(TIPOS_ENVIO[e.tipo].t,
    '<div class="card"><h3>'+ico('paciente')+'Datos del acto</h3>'+
      '<div class="resumen">'+
        filaEnv('Profesional', esc(e.profesional)+
          (e.matricula ? ' · M.P. '+esc(matriculaTxt(e.matricula,'M.P.')) : ''))+
        filaEnv('Paciente', esc(e.paciente)+(e.dni ? ' · DNI '+esc(e.dni) : '')+
          (e.edad !== null && e.edad !== undefined && e.edad !== '' ? ' · '+e.edad+' años' : ''))+
        filaEnv('Fecha del acto', fFechaLarga(e.fecha)+(e.hora ? ' · '+esc(e.hora)+' h' : ''))+
        filaEnv('Institución', esc(e.institucion))+
        filaEnv('Financiador', esc(e.financiador)+(e.afiliado ? ' · afiliado '+esc(e.afiliado) : ''))+
        filaEnv('Cirugía', esc(e.cirugia)+(e.cirugiaCod ? ' ('+esc(e.cirugiaCod)+')' : ''))+
        filaEnv('Diagnóstico', esc(e.diagnostico || '—'))+
        filaEnv('Carácter', esc((e.caracter||'programada').toUpperCase()))+
        filaEnv('Enviado', fFechaLarga((e.enviado||'').slice(0,10))+' · '+
          esc((e.enviado||'').slice(11,16))+' h'+
          (e.enviadoPorNombre && e.enviadoPorNombre !== e.profesional
            ? ' por '+esc(e.enviadoPorNombre) : ''))+
      '</div>'+
      (e.nota ? '<div class="aviso info mt8">'+ico('correo')+'<div><b>Nota del profesional.</b> '+
        esc(e.nota)+'</div></div>' : '')+
    '</div>'+

    '<div class="card"><h3>'+ico('dinero')+'Honorario discriminado</h3>'+
      htmlHonorarioDiscriminado(h, e.uid)+
    '</div>'+

    '<div class="card"><h3>'+ico('archivo')+'Documento</h3>'+
      '<div class="adjuntos"><div class="adj">'+
        '<span class="ic">'+ico('word')+'</span>'+
        '<span class="tx"><b>'+esc(e.docNombre || 'Documento')+'</b>'+
        '<i>'+esc(TIPOS_ENVIO[e.tipo].t)+'</i></span>'+
        '<button type="button" class="btn ghost chico" id="enDocVer">'+ico('ojo')+'</button>'+
        '<button type="button" class="btn ghost chico" id="enDocImp">'+ico('imprimir')+'</button>'+
        '<button type="button" class="btn ghost chico" id="enDocBaj">'+ico('descargar')+'</button>'+
      '</div></div>'+
    '</div>'+

    ((e.adjuntos||[]).length
      ? '<div class="card"><h3>'+ico('bisturi')+'Parte quirúrgico</h3>'+
        '<div class="adjuntos" id="enAdj">'+ htmlListaAdjuntos(e.adjuntos, false) +'</div></div>'
      : (e.tipo === 'acto'
         ? '<div class="aviso warn">'+ico('alerta')+'<div>Este envío llegó <b>sin parte '+
           'quirúrgico</b>. Si la auditoría lo pide, pedíselo al profesional desde Mensajes.</div></div>'
         : ''))+

    '<div class="btn-row mt14">'+
      '<button class="btn ghost" id="enBajarTodo">'+ico('descargar')+' Descargar todo</button>'+
      (envioConfigurado()
        ? '<button class="btn pri" id="enMail">'+ico('correo')+' Enviar por correo</button>' : '')+
    '</div>'+
    (envioConfigurado() ? ''
      : '<div class="ayuda mt8">El envío de correos no está configurado en esta instalación. '+
        'Descargá los archivos y adjuntalos desde tu casilla habitual.</div>'),

    '<button class="btn ghost" data-cerrar>Cerrar</button>', '880px');

  /* Queda marcado como visto en cuanto el contador lo abre */
  if(!e.visto && esContable()){
    const n = Object.assign({}, e, { visto:true, vistoCuando:new Date().toISOString(),
                                     vistoPor: SESION.uid });
    escribir('envios', e.id, n);
  }

  $('#enDocVer').onclick = () => archivoLeer(e.docId).then(a => {
    if(!a) return toast('El documento no está disponible.', 'err');
    const w = window.open('', '_blank');
    if(!w) return toast('El navegador bloqueó la ventana.', 'err');
    w.document.write(textoDeDataUrl(a.datos)); w.document.close();
  });
  $('#enDocImp').onclick = () => archivoLeer(e.docId).then(a => {
    if(!a) return toast('El documento no está disponible.', 'err');
    const html = textoDeDataUrl(a.datos);
    const cuerpo = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [,html])[1];
    imprimir(cuerpo);
  });
  $('#enDocBaj').onclick = () => archivoLeer(e.docId).then(a => {
    if(!a) return toast('El documento no está disponible.', 'err');
    descargar(e.docNombre || 'documento.doc', '﻿' + textoDeDataUrl(a.datos),
      'application/msword;charset=utf-8');
  });
  cablearAdjuntos('#enAdj', null, () => abrirEnvio(id, tipo));
  $('#enBajarTodo').onclick = () => bajarTodoElEnvio(e);
  if($('#enMail')) $('#enMail').onclick = () => abrirCorreoAuditoria(e);
}

function textoDeDataUrl(d){
  const i = String(d).indexOf(',');
  const cab = String(d).slice(0, i), cuerpo = String(d).slice(i+1);
  if(!/;base64/.test(cab)) return decodeURIComponent(cuerpo);
  return decodeURIComponent(escape(atob(cuerpo)));
}

/* Descarga escalonada: los navegadores cancelan las descargas simultaneas.
   Baja el expediente entero —valoracion, ficha anestesica y parte quirurgico—
   porque es lo mismo que hay que mandarle a la auditoria, y el contador lo
   usa justamente para adjuntarlo a mano cuando el correo no lleva adjuntos. */
function bajarTodoElEnvio(e){
  const x = expedienteAuditoria(e);
  const cola = []
    .concat(x.val  ? [{ id:x.val.docId,  nombre:x.val.docNombre,  doc:true }] : [])
    .concat(x.acto ? [{ id:x.acto.docId, nombre:x.acto.docNombre, doc:true }] : [])
    .concat(x.adjuntos);
  if(!cola.length) cola.push({ id:e.docId, nombre:e.docNombre, doc:true });
  toast('Descargando '+cola.length+' archivo'+(cola.length===1?'':'s')+'…', 'ok');
  const uno = i => {
    if(i >= cola.length) return;
    const x = cola[i];
    archivoLeer(x.id).then(a => {
      if(a){
        if(x.doc) descargar(x.nombre || 'documento.doc', '﻿' + textoDeDataUrl(a.datos),
                            'application/msword;charset=utf-8');
        else descargar(a.nombre, dataUrlABlob(a.datos));
      }
      setTimeout(() => uno(i+1), 700);
    });
  };
  uno(0);
}

/* =========================================================================
   5. REENVIO POR CORREO A LA AUDITORIA DE LA OBRA SOCIAL
   ========================================================================= */
/* ¿El Apps Script publicado admite adjuntos?
   La versión 1 sólo mandaba el cuerpo del mail. Se le pregunta una sola vez
   por sesión: si contesta que sí, los archivos van adjuntos; si contesta que
   no —o si no contesta—, el mail sale igual con el documento en el cuerpo y
   se le avisa al contador que los adjuntos los tiene que agregar a mano.
   Sin esto, la app mandaría megabytes de fotos que el script viejo tira. */
function soportaAdjuntos(){
  return versionDelServicio().then(j => !!(j && j.adjuntos));
}

/* Los PDF del paciente los arma el conversor de Google, no la app. Eso lo
   agrego la version 3 del programa de Apps Script: si el coordinador todavia
   no lo republico, el pedido saldria igual y el paciente recibiria un correo
   SIN un solo documento. Peor que fallar. Se pregunta antes. */
function soportaDocumentosPdf(){
  return versionDelServicio().then(j => !!(j && j.documentosPdf));
}

/* Una sola consulta al servicio, cacheada: dice que sabe hacer la version
   publicada. No revela la clave ni ningun dato. */
let __versionServicio = null;
function versionDelServicio(){
  if(__versionServicio) return __versionServicio;
  if(!envioConfigurado()) return Promise.resolve(null);
  __versionServicio = fetch(ENVIO_URL, { method:'GET', mode:'cors' })
    .then(r => r.json())
    .catch(() => null);
  return __versionServicio;
}

/* Las tres piezas que pide una auditoria medica -----------------------------
   La auditoria del financiador no evalua un papel suelto: pide la valoracion
   pre-anestesica (que justifica el riesgo y el ASA), la ficha anestesica
   (que documenta el acto) y el parte quirurgico (que prueba la cirugia). En
   la app viven en DOS envios distintos del mismo profesional —uno por
   bandeja— unidos por fichaId, y el parte quirurgico viaja dentro del envio
   del acto. Se juntan aca para que el contador mande el expediente entero de
   una sola vez y no tres mails sueltos.

   Solo se toma lo que el profesional YA cedio a contaduria. Si falta una
   pieza no se genera de la ficha: la cesion de documentacion clinica la
   decide el tratante, envio por envio (ver el encabezado de este archivo). */
function expedienteAuditoria(e){
  const hermanos = e.fichaId ? enviosDeFicha(e.fichaId) : [];
  const ultimo = t => hermanos.filter(x => x.tipo === t)[0] || (e.tipo === t ? e : null);
  const val  = ultimo('valoracion');
  const acto = ultimo('acto');
  return { val, acto, adjuntos: (acto && acto.adjuntos) || [] };
}

/* Nombre legible de lo que falta, para avisarle al contador antes de mandar */
function faltantesExpediente(x){
  const f = [];
  if(!x.val)  f.push('la valoración pre-anestésica');
  if(!x.acto) f.push('la ficha anestésica');
  if(!x.adjuntos.length) f.push('el parte quirúrgico');
  return f;
}

function abrirCorreoAuditoria(e){
  const x = expedienteAuditoria(e);
  const faltan = faltantesExpediente(x);
  const pieza = (hay, txt) => hay ? '<b class="ok">'+esc(txt)+'</b>' : '<b class="warn">falta</b>';

  abrirModal('Enviar por correo',
    '<div class="aviso warn">'+ico('alerta')+'<div><b>Estás por enviar documentación clínica '+
      'fuera de la asociación.</b> Hacelo únicamente ante un pedido formal de auditoría médica '+
      'del financiador, y a la casilla que ese pedido indique. El envío queda registrado.</div></div>'+

    '<div class="card"><h3>'+ico('archivo')+'Qué se remite</h3>'+
      '<p class="mini mb8">La auditoría recibe el expediente completo del acto, no una pieza '+
        'suelta: los tres documentos van en el cuerpo del mensaje y también adjuntos.</p>'+
      '<div class="resumen">'+
        filaEnv('Valoración pre-anestésica', pieza(!!x.val, 'incluida'))+
        filaEnv('Ficha anestésica', pieza(!!x.acto, 'incluida'))+
        filaEnv('Parte quirúrgico', x.adjuntos.length
          ? '<b class="ok">'+x.adjuntos.length+' archivo'+(x.adjuntos.length===1?'':'s')+'</b>'
          : '<b class="warn">falta</b>')+
      '</div>'+
      (faltan.length
        ? '<div class="aviso warn mt8">'+ico('alerta')+'<div><b>No está '+esc(faltan.join(' ni '))+
          '.</b> El profesional todavía no lo envió a contaduría, así que la app no lo tiene. '+
          'Podés mandar lo que hay —el mail aclara qué no se remite— o pedírselo desde Mensajes '+
          'y enviar después el expediente completo.</div></div>'
        : '')+
    '</div>'+

    campoTxt('coPara','Correo de destino')+
    campoTxt('coAsunto','Asunto',
      'Documentación anestésica — '+e.paciente+' — '+fFecha(e.fecha))+
    campoArea('coMensaje','Mensaje',
      'Se remite la documentación solicitada por auditoría médica correspondiente al acto '+
      'anestésico del '+fFechaLarga(e.fecha)+', paciente '+e.paciente+
      (e.afiliado ? ', afiliado N.º '+e.afiliado : '')+', '+e.financiador+
      ': valoración pre-anestésica, ficha anestésica y parte quirúrgico.')+
    '<div id="coAdjAviso" class="ayuda">Comprobando si el servicio de correo admite adjuntos…</div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="coEnviar">'+ico('correo')+' Enviar</button>', '680px');

  soportaAdjuntos().then(ok => {
    const caja = $('#coAdjAviso');
    if(!caja) return;
    const nDoc = (x.val ? 1 : 0) + (x.acto ? 1 : 0);
    const nPq  = x.adjuntos.length;
    if(ok){
      caja.className = 'ayuda';
      caja.innerHTML = 'Van <b>adjuntos</b> '+nDoc+' documento'+(nDoc===1?'':'s')+' y '+
        (nPq || 'ningún')+' archivo'+(nPq===1?'':'s')+' del parte quirúrgico, además del '+
        'texto en el cuerpo.';
      return;
    }
    /* Sin adjuntos el parte quirurgico —fotos y PDF— NO puede viajar de
       ninguna forma: no es texto, no entra en el cuerpo del mensaje. El
       aviso va destacado porque el contador tiene que enterarse ANTES de
       mandar, no cuando la auditoria le reclama lo que falta. */
    caja.className = 'aviso danger';
    caja.innerHTML = ico('alerta')+'<div><b>El parte quirúrgico NO va a viajar en este '+
      'correo.</b> El servicio de correo de la asociación todavía está publicado en su '+
      'versión vieja, que no admite archivos adjuntos. La valoración y la ficha anestésica '+
      'sí llegan completas, en el cuerpo del mensaje, porque son texto; '+
      (nPq ? 'los '+nPq+' archivos del parte quirúrgico' : 'el parte quirúrgico')+
      ' no, porque son fotos o PDF.<br><br>Mientras tanto: cerrá esto, usá <b>«Descargar '+
      'todo»</b> y adjuntalos a mano desde tu casilla. La solución definitiva la hace el '+
      'coordinador en una sola vez: volver a publicar el programa de Apps Script '+
      '(ENVIO-DE-MAILS.md, «Actualización: adjuntos»).</div>';
  });

  $('#coEnviar').onclick = () => {
    const para = val('coPara').trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(para))
      return toast('Revisá la dirección de correo.', 'err');
    const btn = $('#coEnviar');
    btn.disabled = true; btn.textContent = 'Enviando…';
    enviarEnvioPorCorreo(e, para, val('coAsunto'), val('coMensaje'))
      .then(r => {
        cerrarModal();
        if(r.ok){
          auditar('envio-auditoria', 'Expediente de '+e.paciente+' a '+para+' ('+
            [x.val ? 'valoración' : '', x.acto ? 'ficha anestésica' : '',
             x.adjuntos.length ? x.adjuntos.length+' archivo'+(x.adjuntos.length===1?'':'s')+
             ' del parte quirúrgico' : ''].filter(Boolean).join(', ')+')');
          toast('Correo enviado a '+para+'.', 'ok');
        } else {
          toast(r.error || 'No se pudo enviar el correo.', 'err');
        }
      })
      .catch(() => { cerrarModal(); toast('No se pudo enviar el correo.', 'err'); });
  };
}

/* Junta las TRES piezas del expediente y se las pasa al Apps Script.
   Los documentos van en el cuerpo Y como adjunto: si el Apps Script todavia
   no soporta adjuntos, el auditor igual recibe todo legible en el mail. */
function enviarEnvioPorCorreo(e, para, asunto, mensaje){
  const x = expedienteAuditoria(e);

  /* Orden con el que la auditoria espera leerlo: antes, durante, despues */
  const docs = [];
  if(x.val)  docs.push({ env:x.val,  id:x.val.docId,
                         nombre:x.val.docNombre  || 'Valoracion-prequirurgica.doc' });
  if(x.acto) docs.push({ env:x.acto, id:x.acto.docId,
                         nombre:x.acto.docNombre || 'Ficha-anestesica.doc' });
  if(!docs.length) docs.push({ env:e, id:e.docId, nombre:e.docNombre || 'documento.doc' });

  const ids = docs.map(d => ({ id:d.id, nombre:d.nombre, mime:'application/msword', doc:true }))
    .concat(x.adjuntos.map(a => ({ id:a.id, nombre:a.nombre, mime:a.mime })));

  const faltan = faltantesExpediente(x);

  let puedeAdjuntar = false;
  return soportaAdjuntos().then(ok => { puedeAdjuntar = ok;
    return Promise.all(ids.map(x2 => archivoLeer(x2.id).then(a => a ? { x:x2, a } : null))); })
    .then(res => {
      const ok = res.filter(Boolean);

      /* Cada documento, con su titulo, uno abajo del otro en el cuerpo */
      const cuerpos = docs.map(d => {
        const r = ok.find(y => y.x.id === d.id);
        if(!r) return '';
        const txt = textoDeDataUrl(r.a.datos);
        const solo = (txt.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, txt])[1];
        return '<h2 style="font-family:Calibri,Arial,sans-serif;font-size:16px;color:#0b2545;'+
               'margin:26px 0 10px">'+esc(TIPOS_ENVIO[d.env.tipo].t)+'</h2>'+ solo;
      }).filter(Boolean).join(
        '<hr style="border:0;border-top:1px solid #ccd;margin:22px 0">');

      const nPq = x.adjuntos.length;
      const detallePq = nPq
        ? '<p style="font-size:13px;color:#456">El parte quirúrgico se remite adjunto: '+
          x.adjuntos.map(a => esc(a.nombre)).join(', ')+'.</p>'
        : '';
      const detalleFalta = faltan.length
        ? '<p style="font-size:13px;color:#8a5a00">No se remite '+esc(faltan.join(' ni '))+
          ': no obra en poder de la asociación.</p>'
        : '';

      const html =
        '<div style="font-family:Calibri,Arial,sans-serif;font-size:15px;color:#111;line-height:1.6">'+
          '<p>'+esc(mensaje).replace(/\n/g,'<br>')+'</p>'+
          detallePq + detalleFalta +
          '<p style="font-size:13px;color:#456">Documentación remitida por '+esc(e.profesional)+
          (e.matricula ? ' (M.P. '+esc(matriculaTxt(e.matricula,'M.P.'))+')' : '')+
          ' a través de AFAAR — Asociación Fueguina de Anestesia, Analgesia y Reanimación.</p>'+
          '<hr style="border:0;border-top:1px solid #ccd;margin:22px 0">'+
          '<style>'+CSS_DOC+'</style>'+ cuerpos +
          '<hr style="border:0;border-top:1px solid #ccd;margin:22px 0">'+
          '<div style="font-size:11.5px;color:#455;line-height:1.55">'+
            '<b style="color:#0b2545">AVISO DE CONFIDENCIALIDAD</b><br>'+
            'Este mensaje contiene datos sensibles de salud amparados por la Ley 25.326 de '+
            'Protección de los Datos Personales y por el secreto profesional del art. 11 de la '+
            'Ley 17.132. Se remite exclusivamente en respuesta a un requerimiento de auditoría '+
            'médica y para esa única finalidad. Si usted no es el destinatario, notifíquelo al '+
            'remitente y elimínelo sin conservar copia ni difundirlo.'+
          '</div>'+
        '</div>';

      /* Los documentos son HTML guardado como .doc —igual que en «Descargar
         todo»—, asi que se adjuntan con el nombre y el mime de Word. */
      const adjuntos = puedeAdjuntar
        ? ok.map(r => ({
            nombre: r.x.doc ? r.x.nombre : r.a.nombre,
            mime: r.x.doc ? 'application/msword' : (r.a.mime || 'application/octet-stream'),
            datos: String(r.a.datos).slice(String(r.a.datos).indexOf(',') + 1)
          }))
        : [];

      /* El Apps Script rechaza cuerpos de más de 900 KB. Antes que perder el
         envío entero, se manda sin el documento incrustado: los adjuntos ya
         lo llevan. */
      const cuerpoFinal = html.length > 820000
        ? html.slice(0, html.indexOf('<hr')) +
          '<p style="font-size:13px;color:#456">La documentación completa va adjunta a este mensaje.</p>'
        : html;

      return fetch(ENVIO_URL, {
        method:'POST', mode:'cors',
        headers:{ 'Content-Type':'text/plain;charset=utf-8' },
        body: JSON.stringify({
          clave: ENVIO_CLAVE, para, asunto,
          html: cuerpoFinal, nombre: ENVIO_NOMBRE,
          responderA: e.email || '',
          fichaId: e.fichaId, profesional: e.profesional,
          adjuntos
        })
      }).then(r => r.json()).catch(() => ({ ok:false, error:'No hubo respuesta del servicio de correo.' }));
    });
}

/* =========================================================================
   6. PLANILLA DE LOS ENVIOS DE UN PROFESIONAL
   ========================================================================= */
function exportarEnviosExcel(l, nombre, tipo){
  const cab = ['Fecha','Paciente','DNI','Institución','Financiador','Afiliado','Cirugía',
               'Concepto','Modalidad','UA','Valor unidad','Adicionales %','Total','Estado',
               'Comprobante','Adjuntos','Enviado'];
  const filas = l.map(e => {
    const h = e.honorario || {};
    return [fFecha(e.fecha), e.paciente, e.dni, e.institucion, e.financiador, e.afiliado,
            e.cirugia, h.concepto, h.modalidadNombre, h.ua || '', h.valorUnidad || '',
            h.pctAdicional || 0, h.total || 0, h.estado, h.comprobante,
            (e.adjuntos||[]).length, fFecha((e.enviado||'').slice(0,10))];
  });
  const total = l.reduce((a,e) => a + Number((e.honorario||{}).total || 0), 0);
  exportarTablaExcel('Envios-'+String(nombre).replace(/[^A-Za-z0-9]+/g,'')+'-'+tipo,
    TIPOS_ENVIO[tipo].t+' — '+nombre, cab, filas,
    [['TOTAL','','','','','','','','','','','', total,'','','','']]);
}

/* Envoltorio sobre tablaExcel() de export.js, que arma el .xls y lo baja */
function exportarTablaExcel(archivo, titulo, cab, filas, resumen){
  const html = tablaExcel(titulo, cab, filas, resumen);
  descargar(archivo + '.xls', '﻿' + html, 'application/vnd.ms-excel;charset=utf-8');
  auditar('export-excel', archivo);
  toast('Planilla descargada.', 'ok');
}
