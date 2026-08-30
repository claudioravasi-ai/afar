/* =========================================================================
   MANUAL DE USO DENTRO DE LA APLICACION
   -------------------------------------------------------------------------
   El manual existe tambien en PDF, pero un PDF de 46 paginas A4 en un
   telefono se lee con zoom y arrastre. Aca el mismo texto se lee como se lee
   la app: capitulos plegables, tipografia de pantalla y buscador.

   El contenido sale de data-manual.js, que se genera desde el Word. Si el
   manual cambia, se regenera ese archivo: no se edita a mano.

   El capitulo marcado `coord` -el anexo de infraestructura- lo ve unicamente
   la coordinacion. Es el mismo criterio que el manual explica: mientras el
   punto debil de seguridad siga abierto, cuanta menos gente conozca la
   direccion de la consola, mejor.
   ========================================================================= */

const MANUAL_PDF = {
  general: { archivo:'./manual-afaar.pdf',
             descarga:'AFAAR - Manual de uso.pdf', tam:'1,6 MB' },
  coord:   { archivo:'./manual-afaar-completo.pdf',
             descarga:'AFAAR - Manual completo (coordinacion).pdf', tam:'1,6 MB' }
};

let manualFiltro = '';
let manualAbierto = '';

function capitulosManual(){
  return MANUAL.filter(c => !c.coord || esCoordinador());
}

/* Texto plano de un capitulo, para que el buscador mire tambien el cuerpo */
function textoDeCapitulo(c){
  const partes = [c.tit];
  (c.b || []).forEach(x => {
    if(x.t === 'aviso'){ partes.push(x.tit); (x.cuerpo||[]).forEach(l => partes.push(l)); }
    else if(x.t === 'tabla'){
      (x.head||[]).forEach(h => partes.push(h));
      (x.rows||[]).forEach(r => r.forEach(cel => partes.push(cel)));
    } else if(x.txt) partes.push(x.txt);
  });
  return partes.join(' ').replace(/<[^>]+>/g, ' ');
}

/* Resalta lo buscado sin romper el HTML: solo fuera de las etiquetas */
function resaltar(html, q){
  if(!q) return html;
  const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  return html.split(/(<[^>]+>)/).map(t =>
    t.startsWith('<') ? t : t.replace(re, '<mark>$1</mark>')).join('');
}

function htmlBloquesManual(c, q){
  const R = t => resaltar(t, q);
  let lista = [], out = '';
  const cerrarLista = () => {
    if(!lista.length) return;
    const tag = lista[0].num ? 'ol' : 'ul';
    out += '<'+tag+' class="man-lista">'+lista.map(i => '<li>'+R(i.txt)+'</li>').join('')+'</'+tag+'>';
    lista = [];
  };
  (c.b || []).forEach(x => {
    if(x.t === 'li'){ lista.push(x); return; }
    cerrarLista();
    if(x.t === 'h2')      out += '<h3 class="man-h2">'+R(x.txt)+'</h3>';
    else if(x.t === 'h3') out += '<h4 class="man-h3">'+R(x.txt)+'</h4>';
    else if(x.t === 'p')  out += '<p class="man-p">'+R(x.txt)+'</p>';
    else if(x.t === 'img')
      /* carga diferida: quien no baja hasta la foto no la descarga */
      out += '<img class="man-img" src="'+esc(x.src)+'" loading="lazy" alt="Captura de la aplicación">';
    else if(x.t === 'aviso')
      out += '<div class="aviso '+esc({cab:'info'}[x.clase] || x.clase)+' man-aviso">'+
             ico(x.clase === 'danger' ? 'alerta' : x.clase === 'ok' ? 'check' : 'info')+
             '<div><b>'+R(x.tit)+'</b>'+
             (x.cuerpo||[]).map(l => '<br>'+R(l)).join('')+'</div></div>';
    else if(x.t === 'tabla')
      out += '<div class="tabla-wrap man-tabla"><table><thead><tr>'+
             (x.head||[]).map(h => '<th>'+R(h)+'</th>').join('')+'</tr></thead><tbody>'+
             (x.rows||[]).map(r => '<tr>'+r.map(cel => '<td>'+R(cel)+'</td>').join('')+'</tr>').join('')+
             '</tbody></table></div>';
  });
  cerrarLista();
  return out;
}

function vistaManual(){
  const cont = $('#vManual');
  const q = norm(manualFiltro);
  const todos = capitulosManual();
  const l = q ? todos.filter(c => norm(textoDeCapitulo(c)).indexOf(q) >= 0) : todos;
  const pdf = MANUAL_PDF.general;
  const pdfCoord = esCoordinador() ? MANUAL_PDF.coord : null;

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Manual de uso</h1>'+
    '<p>Alcances, limitaciones y capacidad de la aplicación · '+esc(todos.length)+' capítulos</p></div></div>'+

  '<div class="campo"><div style="position:relative">'+
    '<input type="search" id="manBuscar" placeholder="Buscar en el manual: consentimiento, urgencia, honorarios…" '+
      'value="'+esc(manualFiltro)+'" style="padding-left:38px">'+
    '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--texto-3)">'+
      ico('buscar')+'</span></div></div>'+

  (q ? '<p class="mini mb8">'+l.length+' capítulo'+(l.length===1?'':'s')+' con «'+esc(manualFiltro)+'».</p>' : '')+

  (l.length ? l.map(c =>
    '<details class="acc man-cap"'+(manualAbierto === c.tit || q ? ' open' : '')+
      ' data-cap="'+esc(c.tit)+'">'+
      '<summary><span class="n">'+ico(c.ico)+'</span>'+
        (c.n ? '<b style="margin-right:6px;opacity:.55">'+esc(c.n)+'</b>' : '')+esc(c.tit)+
        (c.coord ? '<span class="est">Coordinación</span>' : '')+
        '<span class="flecha">'+ico('flecha')+'</span></summary>'+
      '<div class="cuerpo">'+htmlBloquesManual(c, manualFiltro)+'</div>'+
    '</details>').join('')
   : '<div class="vacio">'+ico('buscar')+'<b>Sin resultados</b>'+
     '<span>Probá con otra palabra: «consentimiento», «carácter», «honorarios».</span></div>')+

  '<div class="card mt20"><h3>'+ico('descargar')+'Descargar para imprimir o archivar</h3>'+
    '<p class="mini">El mismo manual en PDF. Sirve para imprimirlo o guardarlo; para leerlo, '+
      'esta pantalla se ve mejor en el teléfono.</p>'+
    '<div class="btn-row mt8">'+
      '<a class="btn ghost chico" href="'+pdf.archivo+'" download="'+esc(pdf.descarga)+'">'+
        ico('imprimir')+' Manual de uso · '+pdf.tam+'</a>'+
      (pdfCoord
        ? '<a class="btn ghost chico" href="'+pdfCoord.archivo+'" download="'+esc(pdfCoord.descarga)+'">'+
          ico('candado')+' Versión completa con el anexo · '+pdfCoord.tam+'</a>' : '')+
    '</div>'+
    (esCoordinador()
      ? '<div class="aviso warn mt8">'+ico('alerta')+'<div>La <b>versión completa</b> incluye el anexo '+
        'con la dirección de la consola de Firebase y el mapa de la base. Es material de '+
        'coordinación: no la repartas con el manual general.</div></div>' : '')+
  '</div>'+

  '<p class="mini txt-c mt20">AFAAR — Asociación Fueguina de Anestesia, Analgesia y Reanimación<br>'+
    'Este manual acompaña a la versión '+esc(window.AFAR_BUILD || '—')+' de la aplicación.</p>';

  $('#manBuscar').oninput = debounce(e => {
    manualFiltro = e.target.value;
    vistaManual();
    const i = $('#manBuscar');
    if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }, 260);
  /* Se recuerda qué capítulo quedó abierto: al buscar y volver, sigue ahí.
     Y al abrirlo se cargan SUS fotos: dentro de un <details> cerrado la carga
     diferida no se dispara sola, así que quedarían en blanco. Nada se
     descarga hasta que alguien abre el capítulo que las contiene. */
  const cargarFotos = d => $$('#'+d.id+' .man-img').forEach(i => i.removeAttribute('loading'));
  $$('#vManual .man-cap').forEach((d, k) => {
    d.id = d.id || 'mancap' + k;
    if(d.open) cargarFotos(d);
    d.addEventListener('toggle', () => {
      if(d.open){ manualAbierto = d.dataset.cap; cargarFotos(d); }
      else if(manualAbierto === d.dataset.cap) manualAbierto = '';
    });
  });
}
