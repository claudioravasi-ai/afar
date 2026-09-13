/* =========================================================================
   ENVÍO A CONTADURÍA DESDE AJUSTES, POR LOTE
   -------------------------------------------------------------------------
   El botón salió de la ficha (ensuciaba la pantalla). Ahora cada
   anestesiólogo manda a contaduría, desde Ajustes, las valoraciones
   prequirúrgicas o los actos anestésicos que quiera, eligiendo por paciente
   o por fechas. Las dos bandejas del contador siguen igual y se alimentan de
   acá. Sigue siendo una cesión que dispara una persona, con aviso legal y
   registro en la auditoría.
   ========================================================================= */
let loteSel = {};
function abrirEnvioLote(){
  if(typeof soloLectura === 'function' && soloLectura('enviar a contaduría')) return;
  const st = { tipo:'acto', desde: hoyISO().slice(0,8) + '01', hasta: hoyISO(), q:'' };
  loteSel = {};
  const elegibles = () => (esCoordinador() ? lista('fichas') : misFichas())
    .filter(f => puedeEnviar(f, st.tipo) && (st.tipo === 'acto' ? hayActo(f) : hayValoracion(f)))
    .map(f => ({ f, d: st.tipo === 'acto' ? fechaCirugiaDe(f) : fechaValoracionDe(f) }))
    .filter(x => x.d && x.d >= st.desde && x.d <= st.hasta)
    .filter(x => { if(!st.q) return true; const p = DB.pacientes[x.f.pacienteId] || {};
      return norm([p.apellido, p.nombre, p.dni, x.f.cirugia].join(' ')).indexOf(norm(st.q)) >= 0; })
    .sort((a, b) => a.d < b.d ? 1 : -1);
  const pintar = () => {
    const l = elegibles();
    l.forEach(x => { if(!(x.f.id in loteSel)) loteSel[x.f.id] = !enviosDeFicha(x.f.id, st.tipo).length; });
    const n = l.filter(x => loteSel[x.f.id]).length;
    abrirModal('Enviar a contaduría',
      '<div class="seg" id="elTipo">'+
        '<button type="button" data-v="valoracion"'+(st.tipo==='valoracion'?' class="on"':'')+'>Valoraciones prequirúrgicas</button>'+
        '<button type="button" data-v="acto"'+(st.tipo==='acto'?' class="on"':'')+'>Actos anestésicos</button></div>'+
      '<div class="grid c3 mt8">'+campoFecha('elDesde', 'Desde', st.desde)+campoFecha('elHasta', 'Hasta', st.hasta)+
        '<div class="campo"><label>Paciente</label><input type="search" id="elQ" value="'+esc(st.q)+'" placeholder="Apellido o DNI"></div></div>'+
      '<div class="btn-row mb8"><button type="button" class="btn ghost chico" id="elTodas">Marcar todas</button>'+
        '<button type="button" class="btn ghost chico" id="elNinguna">Ninguna</button></div>'+
      (l.length ? '<div class="lista chica">'+ l.map(x => { const p = DB.pacientes[x.f.pacienteId] || {};
          const ya = enviosDeFicha(x.f.id, st.tipo).length, falta = faltantesDeEnvio(x.f, st.tipo);
          return '<label class="item plano" style="cursor:pointer"><input type="checkbox" data-el="'+esc(x.f.id)+'"'+
            (loteSel[x.f.id] ? ' checked' : '')+' style="width:18px;height:18px;margin-right:10px">'+
            '<div class="txt"><b>'+esc((p.apellido||'—')+', '+(p.nombre||''))+'</b><span>'+esc(fFecha(x.d))+' · '+
            esc(textoProcedimientos(x.f) || x.f.cirugia || 'sin cirugía')+'</span>'+
            (falta.length ? '<span class="quien">Falta: '+esc(falta.join(', '))+'</span>' : '')+'</div>'+
            '<div class="der">'+(ya ? '<span class="tag ok">ya enviada</span>' : '')+'</div></label>'; }).join('') +'</div>'
        : '<div class="vacio chico">'+ico('bandeja')+'<b>No hay nada para enviar en esas fechas</b></div>')+
      '<div class="aviso info mt14">'+ico('candado')+'<div>Le cedés al contador de la asociación documentación '+
        'clínica, para facturar y responder auditorías (Ley 25.326, art. 11, y Ley 26.529). Queda registrado a tu '+
        'nombre en la auditoría.</div></div>',
      '<button class="btn ghost" data-cerrar>Cancelar</button>'+
      '<button class="btn pri" id="elEnviar"'+(n ? '' : ' disabled')+'>'+ico('enviar')+' Enviar '+n+'</button>', '760px');
    $$('#elTipo button').forEach(b => b.onclick = () => { st.tipo = b.dataset.v; loteSel = {}; pintar(); });
    $('#elDesde').onchange = e => { st.desde = e.target.value; pintar(); };
    $('#elHasta').onchange = e => { st.hasta = e.target.value; pintar(); };
    $('#elQ').oninput = debounce(e => { st.q = e.target.value; pintar(); const i = $('#elQ'); if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300);
    $('#elTodas').onclick = () => { l.forEach(x => loteSel[x.f.id] = true); pintar(); };
    $('#elNinguna').onclick = () => { l.forEach(x => loteSel[x.f.id] = false); pintar(); };
    $$('#modal [data-el]').forEach(c => c.onchange = () => { loteSel[c.dataset.el] = c.checked;
      const k = l.filter(x => loteSel[x.f.id]).length, b = $('#elEnviar');
      b.disabled = !k; b.innerHTML = ico('enviar')+' Enviar '+k; });
    $('#elEnviar').onclick = () => {
      const cola = l.filter(x => loteSel[x.f.id]).map(x => x.f);
      cerrarModal();
      toast('Enviando ' + cola.length + ' a contaduría…', 'ok');
      let hechos = 0;
      const sig = () => {
        if(!cola.length) return toast(hechos + ' enviado' + (hechos === 1 ? '' : 's') + ' a contaduría.', 'ok');
        registrarEnvioLote(cola.shift(), st.tipo).then(() => { hechos++; sig(); }).catch(() => sig());
      };
      sig();
    };
  };
  pintar();
}

/* Igual que registrarEnvio() de ui-envios.js, pero sin depender de la ficha
   abierta en pantalla. */
function registrarEnvioLote(f, tipo){
  const armado = armarEnvio(f, tipo, { nota:'' });
  const envio = armado.envio;
  return archivoGuardar({
    id: armado.docId, fichaId: f.id, nombre: armado.nombreDoc, mime:'text/html', demo: !!f.demo,
    tam: armado.docHtml.length,
    datos: 'data:text/html;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(armado.docHtml))),
    cuando: new Date().toISOString()
  }).then(enNube => {
    envio.enNube = !!enNube;
    escribir('envios', envio.id, envio);
    auditar('envio-contaduria', TIPOS_ENVIO[tipo].t + ' de ' + envio.paciente + ' (' + fFecha(envio.fecha) + ') a contaduría, desde Ajustes');
    const g = JSON.parse(JSON.stringify(DB.fichas[f.id] || f));
    g.enviosContaduria = Object.assign({}, g.enviosContaduria || {});
    g.enviosContaduria[tipo] = { id:envio.id, cuando:envio.enviado, por:envio.enviadoPor };
    escribir('fichas', g.id, g);
  });
}
