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
      guardarFicha(true);
      auditar('parte-quirurgico-alta',
        hechos.length + ' archivo(s) en la ficha ' + f.id);
      pintarFicha();
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

function quitarParteQuirurgico(f, id){
  confirmar('Quitar el archivo',
    'Se elimina de la ficha y de la nube. Si ya fue enviado a contaduría, el contador '+
    'lo pierde también. Esta acción no se puede deshacer.',
    () => {
      f.acto = f.acto || {};
      f.acto.parteQuirurgico = partesQuirurgicos(f).filter(x => x.id !== id);
      archivoEliminar(id);
      guardarFicha(true);
      auditar('parte-quirurgico-baja', id);
      pintarFicha();
      toast('Archivo eliminado.', 'ok');
    }, 'Quitar', true);
}

/* --------------------------------------------------- Tarjeta de adjuntos */
function htmlParteQuirurgico(f){
  const l = partesQuirurgicos(f);
  return ''+
  '<div class="card no-print"><h3>'+ico('bisturi')+'Foja quirúrgica / parte quirúrgico</h3>'+
    '<p class="mini">Es el parte que redacta y firma el cirujano. Sacale una foto o subí el '+
      'archivo: entra PDF, JPG, PNG, HEIC del iPhone y Word. Las fotos se achican solas para '+
      'que viajen rápido, sin que se pierda la lectura.</p>'+
    '<div class="btn-row mt8">'+
      '<button class="btn ghost chico" id="pqFoto" data-lectura>'+ico('camara')+' Tomar foto</button>'+
      '<button class="btn ghost chico" id="pqArchivo" data-lectura>'+ico('adjunto')+' Elegir archivo</button>'+
    '</div>'+
    '<div id="pqLista" class="adjuntos mt14">'+ htmlListaAdjuntos(l, true) +'</div>'+
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

function cablearAdjuntos(cont, f){
  $$(cont+' [data-adjver]').forEach(b => b.onclick = () => verAdjunto(b.dataset.adjver));
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

function verAdjunto(id){
  toast('Abriendo el archivo…', 'ok');
  archivoLeer(id).then(a => {
    if(!a) return toast('El archivo no está en este dispositivo y no hay conexión con la nube.', 'err');
    if(esImagen(a.mime)){
      abrirModal(a.nombre,
        '<div class="visor"><img src="'+esc(a.datos)+'" alt="'+esc(a.nombre)+'"></div>'+
        '<div class="mini mt8">'+esc(a.nombre)+' · '+fTam(a.tam)+'</div>',
        '<button class="btn ghost" data-cerrar>Cerrar</button>'+
        '<button class="btn pri" id="vaBajar">'+ico('descargar')+' Descargar</button>', '840px');
      $('#vaBajar').onclick = () => descargar(a.nombre, dataUrlABlob(a.datos));
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
    diagnostico: f.diagnostico || '', caracter: f.caracter || '',

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

/* Al final de la valoracion (paso Preanestesia, despues del punto 14) */
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

/* Al final de la ficha anestesica (paso Firmar) */
function htmlEnvioFicha(f){
  const env = enviosDeFicha(f.id, 'acto')[0];
  const puede = puedeEnviar(f, 'acto');
  const adj = partesQuirurgicos(f);
  return ''+
  '<div class="card envio-card no-print"><h3>'+ico('enviar')+'Envío a contaduría</h3>'+
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
      ? '<button class="btn pri mt8" id="evEnviarActo" data-lectura>'+ico('enviar')+
        (env ? ' Volver a enviar' : ' Enviar ficha y parte quirúrgico')+'</button>'
      : '<div class="aviso info mt8">'+ico('info')+'<div>El acto lo factura '+
        esc(nombreActor(f))+', que es quien lo envía.</div></div>')+
  '</div>';
}
function cablearEnvioFicha(f){
  if($('#evEnviarActo')) $('#evEnviarActo').onclick = () => {
    guardarPasoActual(); abrirEnvioContaduria(fichaActual, 'acto');
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
          '<span>Cuando un anestesiólogo use el botón «Enviar a contaduría», va a aparecer acá.</span></div>');

    $$('#'+pre+'Cuerpo [data-prof]').forEach(b => b.onclick = () => {
      envSel[tipo] = b.dataset.prof; pintarEnvios(tipo);
    });
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
  cablearAdjuntos('#enAdj', null);
  $('#enBajarTodo').onclick = () => bajarTodoElEnvio(e);
  if($('#enMail')) $('#enMail').onclick = () => abrirCorreoAuditoria(e);
}

function textoDeDataUrl(d){
  const i = String(d).indexOf(',');
  const cab = String(d).slice(0, i), cuerpo = String(d).slice(i+1);
  if(!/;base64/.test(cab)) return decodeURIComponent(cuerpo);
  return decodeURIComponent(escape(atob(cuerpo)));
}

/* Descarga escalonada: los navegadores cancelan las descargas simultaneas */
function bajarTodoElEnvio(e){
  const cola = [{ id:e.docId, nombre:e.docNombre, doc:true }].concat(e.adjuntos || []);
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
let __adjuntosSoportados = null;
function soportaAdjuntos(){
  if(__adjuntosSoportados !== null) return Promise.resolve(__adjuntosSoportados);
  if(!envioConfigurado()){ __adjuntosSoportados = false; return Promise.resolve(false); }
  return fetch(ENVIO_URL, { method:'GET', mode:'cors' })
    .then(r => r.json())
    .then(j => { __adjuntosSoportados = !!(j && j.adjuntos); return __adjuntosSoportados; })
    .catch(() => { __adjuntosSoportados = false; return false; });
}

function abrirCorreoAuditoria(e){
  abrirModal('Enviar por correo',
    '<div class="aviso warn">'+ico('alerta')+'<div><b>Estás por enviar documentación clínica '+
      'fuera de la asociación.</b> Hacelo únicamente ante un pedido formal de auditoría médica '+
      'del financiador, y a la casilla que ese pedido indique. El envío queda registrado.</div></div>'+
    campoTxt('coPara','Correo de destino')+
    campoTxt('coAsunto','Asunto',
      TIPOS_ENVIO[e.tipo].t+' — '+e.paciente+' — '+fFecha(e.fecha))+
    campoArea('coMensaje','Mensaje',
      'Se remite la documentación solicitada por auditoría médica correspondiente al acto '+
      'anestésico del '+fFechaLarga(e.fecha)+', paciente '+e.paciente+
      (e.afiliado ? ', afiliado N.º '+e.afiliado : '')+', '+e.financiador+'.')+
    '<div id="coAdjAviso" class="ayuda">Comprobando si el servicio de correo admite adjuntos…</div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="coEnviar">'+ico('correo')+' Enviar</button>', '680px');

  soportaAdjuntos().then(ok => {
    const caja = $('#coAdjAviso');
    if(!caja) return;
    const n = (e.adjuntos || []).length;
    caja.innerHTML = ok
      ? 'Van <b>adjuntos</b> el documento y '+(n || 'ningún')+' archivo del parte quirúrgico.'
      : '<b>El servicio de correo todavía no admite adjuntos.</b> El documento viaja en el '+
        'cuerpo del mensaje, pero '+(n ? 'los '+n+' archivos del parte quirúrgico no' : 'el parte quirúrgico no')+
        ' se adjuntan: descargalos con «Descargar todo» y sumalos desde tu casilla. '+
        'Para que se adjunten solos hay que volver a publicar el programa de Apps Script '+
        '(ver ENVIO-DE-MAILS.md).';
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
          auditar('envio-auditoria', TIPOS_ENVIO[e.tipo].t+' de '+e.paciente+' a '+para);
          toast('Correo enviado a '+para+'.', 'ok');
        } else {
          toast(r.error || 'No se pudo enviar el correo.', 'err');
        }
      })
      .catch(() => { cerrarModal(); toast('No se pudo enviar el correo.', 'err'); });
  };
}

/* Junta el documento y los adjuntos y se los pasa al Apps Script. El
   documento va en el cuerpo Y como adjunto: si el Apps Script todavia no
   soporta adjuntos, el auditor igual recibe la ficha legible. */
function enviarEnvioPorCorreo(e, para, asunto, mensaje){
  const ids = [{ id:e.docId, nombre:e.docNombre || 'documento.doc', mime:'text/html' }]
    .concat((e.adjuntos || []).map(a => ({ id:a.id, nombre:a.nombre, mime:a.mime })));

  let puedeAdjuntar = false;
  return soportaAdjuntos().then(ok => { puedeAdjuntar = ok;
    return Promise.all(ids.map(x => archivoLeer(x.id).then(a => a ? { x, a } : null))); })
    .then(res => {
      const ok = res.filter(Boolean);
      const doc = ok.find(r => r.x.id === e.docId);
      const cuerpoDoc = doc ? textoDeDataUrl(doc.a.datos) : '';
      const soloCuerpo = (cuerpoDoc.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, cuerpoDoc])[1];

      const html =
        '<div style="font-family:Calibri,Arial,sans-serif;font-size:15px;color:#111;line-height:1.6">'+
          '<p>'+esc(mensaje).replace(/\n/g,'<br>')+'</p>'+
          '<p style="font-size:13px;color:#456">Documentación remitida por '+esc(e.profesional)+
          (e.matricula ? ' (M.P. '+esc(matriculaTxt(e.matricula,'M.P.'))+')' : '')+
          ' a través de AFAAR — Asociación Fueguina de Anestesia, Analgesia y Reanimación.</p>'+
          '<hr style="border:0;border-top:1px solid #ccd;margin:22px 0">'+
          '<style>'+CSS_DOC+'</style>'+ soloCuerpo +
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

      const adjuntos = puedeAdjuntar
        ? ok.filter(r => r.x.id !== e.docId).map(r => ({
            nombre: r.a.nombre,
            mime: r.a.mime || 'application/octet-stream',
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
