/* =========================================================================
   LAS TRES ETAPAS: 1 PACIENTE · 2 PREQUIRURGICO · 3 QUIROFANO
   -------------------------------------------------------------------------
   El inicio se ordena como ocurre el trabajo, en tres puertas grandes y
   numeradas. Pedido de la asociacion: que la app se entienda de un vistazo,
   tambien para el colega que no quiere aprender una aplicacion nueva.

     1 PACIENTE       quien es y que trae: filiacion, antecedentes,
                      medicacion, alergias. Entra de cuatro maneras: lo carga
                      el anestesiologo, lo completa el paciente en su casa,
                      trae la ficha en papel, o es una urgencia.
     2 PREQUIRURGICO  la valoracion preanestesica con su consentimiento.
                      Concluida, el paciente queda disponible para cualquier
                      socio de la asociacion.
     3 QUIROFANO      el acto anestesico, la recuperacion y la firma.

   Nada de esto reemplaza al recorrido de cinco pasos de la ficha: lo agrupa.
   Paciente es la etapa 1, Preanestesia la 2, y Anestesia, Recuperacion y
   Firmar son la 3. Las reglas de siempre —quien puede tomar un acto, que
   hace falta para firmar— siguen viviendo donde estaban.
   ========================================================================= */

const ETAPAS = [
  { k:'paciente',      n:1, t:'PACIENTE',      corto:'PACIENTE',  nom:'Paciente',
    d:'Datos, antecedentes, medicación y alergias' },
  { k:'prequirurgico', n:2, t:'PREQUIRÚRGICO', corto:'PREQUIR.',  nom:'Prequirúrgico',
    d:'Valoración preanestésica y consentimiento' },
  { k:'quirofano',     n:3, t:'QUIRÓFANO',     corto:'QUIRÓFANO', nom:'Quirófano',
    d:'Acto anestésico, recuperación y firma' }
];

/* A que etapa pertenece cada paso de la ficha */
function etapaDePaso(k){ return k === 'paciente' ? 1 : (k === 'preanestesia' ? 2 : 3); }

function valEt(id){ const e = $('#'+id); return e ? String(e.value || '').trim() : ''; }

/* La ventana de etapa desde la que se abrió la ventana actual: cerrar esta
   (cruz o Cancelar) vuelve ahí. Ver alVolverModal() en core.js. */
let volverA = null;

const porModificado = (a, b) =>
  String(b.modificado || b.creado || '').localeCompare(String(a.modificado || a.creado || ''));

/* Valoraciones mias todavia abiertas: el prequirurgico no termino y el acto
   no existe. Las urgencias que deben la valoracion no van aca: esas estan en
   el quirofano, y su deuda se reclama desde el acto. */
function valoracionesEnCurso(){
  if(!SESION) return [];
  return lista('fichas').filter(f =>
    f.ownerUid === SESION.uid && !(f.firma || {}).firmado &&
    !f.actoPorUid && !f.actorExterno && !motivoSinValoracion(f) &&
    estadoPaso(f, 'preanestesia') !== 'ok').sort(porModificado);
}
function valoracionAbiertaDe(pid){
  return valoracionesEnCurso().find(f => f.pacienteId === pid) || null;
}
/* Actos a mi nombre sin firmar */
function actosEnCurso(){
  if(!SESION) return [];
  return lista('fichas').filter(f => actorFicha(f) === SESION.uid && !(f.firma || {}).firmado)
    .sort(porModificado);
}
/* Valoraciones de cualquier socio esperando quien las anestesie. Primero las
   concluidas: sobre una a medias no se puede tomar el acto. */
function listosParaQuirofano(){
  /* Sólo lo que se puede tomar: valoraciones completas, o urgencias (que se
     toman aunque la valoración esté a medias). Una valoración programada a
     medias de un colega no es un paciente listo: es trabajo de otro. */
  return fichasDisponibles().filter(f => valoracionConcluida(f) ||
      esNoProgramado(caracterActo(f)) || esNoProgramado(f.caracter)).sort((a, b) =>
    (valoracionConcluida(b) ? 1 : 0) - (valoracionConcluida(a) ? 1 : 0) || porModificado(a, b));
}

/* ============================ INICIO ============================ */
function htmlEtapasPanel(){
  const nPre   = typeof precargasPendientes === 'function' ? precargasPendientes().length : 0;
  const nVal   = valoracionesEnCurso().length;
  const nActos = actosEnCurso().length;
  const nListos = listosParaQuirofano().length;
  const cuenta = {
    paciente: nPre ? nPre + ' precargado' + (nPre === 1 ? '' : 's') + ' esperando' : '',
    prequirurgico: nVal ? nVal + (nVal === 1 ? ' valoración' : ' valoraciones') + ' en curso' : '',
    quirofano: [nActos ? nActos + ' en curso' : '',
                nListos ? nListos + ' listo' + (nListos === 1 ? '' : 's') + ' para tomar' : '']
               .filter(Boolean).join(' · ')
  };
  return '<div class="etapas">'+ ETAPAS.map(e =>
    '<button type="button" class="etapa e'+e.n+'" data-etapa="'+e.k+'">'+
      '<span class="num">'+e.n+'</span>'+
      '<span class="tx"><b>'+e.t+'</b><i>'+esc(e.d)+'</i>'+
        (cuenta[e.k] ? '<em>'+esc(cuenta[e.k])+'</em>' : '')+'</span>'+
    '</button>').join('') +'</div>';
}
function cablearEtapasPanel(){
  $$('#vPanel [data-etapa]').forEach(b => b.onclick = () => abrirEtapa(b.dataset.etapa));
}

function abrirEtapa(k){
  if(k === 'paciente') return etapaPaciente();
  if(k === 'prequirurgico') return etapaPrequirurgico();
  return etapaQuirofano();
}

function opEtapa(id, icono, titulo, sub, cls, n){
  return '<button type="button" class="et-op'+(cls ? ' '+cls : '')+'" id="'+id+'">'+ico(icono)+
    '<span class="tx"><b>'+esc(titulo)+'</b><span>'+esc(sub)+'</span></span>'+
    (n ? '<span class="n">'+n+'</span>' : '')+'</button>';
}
const flechaDer = () =>
  ico('flecha').replace('<svg','<svg style="transform:rotate(-90deg);width:15px;height:15px;opacity:.55"');

/* Lista corta de fichas dentro de una etapa. Tocar una la abre en el paso
   que corresponde a esa etapa. */
function htmlListaEtapa(l, paso){
  return '<div class="lista chica">'+ l.map(f => {
    const p = DB.pacientes[f.pacienteId] || {};
    const tag = paso === 'preanestesia'
      ? '<span class="tag warn">'+esc(ROTULO_ESTADO[estadoPaso(f, 'preanestesia')] || '')+'</span>'
      : esActorFicha(f)
        ? '<span class="tag info">En curso</span>'
        : (valoracionConcluida(f)
            ? '<span class="tag ok">Valoración completa</span>'
            : (esNoProgramado(caracterActo(f)) || esNoProgramado(f.caracter))
              ? '<span class="tag danger">Urgencia · se puede tomar</span>'
              : '<span class="tag warn">Valoración a medias</span>');
    return '<div class="item plano" data-etfic="'+esc(f.id)+'" data-etpaso="'+paso+'">'+
      '<div class="txt"><b>'+esc((p.apellido || '—')+', '+(p.nombre || ''))+'</b>'+
        '<span>'+esc(textoProcedimientos(f) || f.cirugia || 'sin cirugía cargada')+
          (fechaDeFicha(f) ? ' · '+esc(fFecha(fechaDeFicha(f))) : '')+'</span>'+
        (paso !== 'preanestesia' && !esAutorFicha(f)
          ? '<span class="quien">valoró '+esc(autorFicha(f))+'</span>' : '')+
      '</div><div class="der">'+tag+'</div></div>';
  }).join('') +'</div>';
}
function cablearListaEtapa(){
  $$('#modal [data-etfic]').forEach(it => it.onclick = () => {
    cerrarModal();
    abrirFichaEnPaso(it.dataset.etfic, it.dataset.etpaso);
  });
}

/* Abre una ficha y la deja en el paso pedido, si ese paso esta habilitado */
function abrirFichaEnPaso(id, paso, extra){
  const seguir = () => {
    if(!fichaActual || fichaActual.id !== id) return;
    if(extra) Object.assign(fichaActual, extra);
    if(paso && pasoHabilitado(fichaActual, paso)) pasoFicha = paso;
    pintarFicha();
  };
  if(DB.fichas[id]){ abrirFicha(id); seguir(); return; }
  asegurarFicha(id).then(ok => {
    if(!ok) return toast('No se encontró la ficha.', 'err');
    abrirFicha(id); seguir();
  });
}

/* ========================== ETAPA 1 · PACIENTE ========================== */
function etapaPaciente(){
  volverA = etapaPaciente;
  abrirModal('Etapa 1 · Paciente',
    '<p class="mini" style="margin:0 0 12px">¿Cómo llega este paciente?</p>'+
    '<div class="et-ops">'+
      opEtapa('e1Ahora', 'mas', 'Lo cargo ahora',
        'Datos filiatorios, antecedentes, medicación y alergias.', 'pri')+
      opEtapa('e1Mail', 'correo', 'Que complete la ficha en su casa',
        'Cargás apellido, nombre, DNI y correo: le llega la ficha por mail.')+
      opEtapa('e1Papel', 'camara', 'Trae la ficha completa en papel',
        'Le sacás foto: se guarda como PDF en su historia y pasás los datos.')+
      opEtapa('e1Urg', 'alerta', 'Urgencia / emergencia',
        'Lo mínimo —nombre, DNI, edad y cobertura— y directo al quirófano.', 'urg')+
    '</div>'+
    '<div class="et-links">'+
      '<button type="button" class="btn ghost chico" id="e1Padron">'+ico('buscar')+' Buscar en el padrón</button>'+
      '<button type="button" class="btn ghost chico" id="e1QR">'+ico('calendario')+
        ' QR para que se anote solo</button>'+
    '</div>', '', '620px');

  const luego = fn => () => { cerrarModal(); setTimeout(fn, 160); };
  $('#e1Ahora').onclick = luego(() => editarPaciente(null, nid => despuesDeCargarPaciente(nid), volverA));
  $('#e1Mail').onclick  = luego(abrirTomaRapida);
  $('#e1Papel').onclick = luego(() => abrirFichaEnPapel());
  $('#e1Urg').onclick   = luego(abrirUrgenciaRapida);
  $('#e1Padron').onclick = () => { cerrarModal(); alcancePac = 'padron'; irA('pacientes'); };
  $('#e1QR').onclick = () => { cerrarModal(); irAPrecargados(); };
}

/* Terminada la etapa 1, lo que sigue: pasar al prequirurgico, pedirle al
   paciente que complete lo suyo, o guardar la hoja en papel. */
function despuesDeCargarPaciente(pid){
  const p = DB.pacientes[pid];
  if(!p) return;
  abrirModal('Etapa 1 lista',
    '<div class="aviso ok">'+ico('check')+'<div><b>'+esc((p.apellido || '')+', '+(p.nombre || ''))+
      '</b> quedó guardado. ¿Cómo seguís?</div></div>'+
    '<div class="et-ops mt14">'+
      opEtapa('dcSig', 'valoracion', 'Siguiente: 2 · Prequirúrgico',
        'Abrir ahora la valoración preanestésica.', 'pri')+
      opEtapa('dcMail', 'correo', 'Enviarle la ficha para que complete en su casa',
        'Lo que cargue lo revisás antes de incorporarlo a su historia.')+
      opEtapa('dcPapel', 'camara', 'Guardar la foto de su ficha en papel',
        'Queda en PDF en su historia.')+
    '</div>',
    '<button class="btn ghost" data-cerrar>Listo por ahora</button>', '600px');
  const luego = fn => () => { cerrarModal(); setTimeout(fn, 160); };
  $('#dcSig').onclick   = luego(() => iniciarValoracionPara(pid));
  $('#dcMail').onclick  = luego(() => enviarFichaDesdeEtapa1(pid));
  $('#dcPapel').onclick = luego(() => papelFotos(pid));
}

/* Una ficha nueva en memoria, sin escribirla todavia */
function nuevaFichaDatos(pid, extra){
  const ahora = new Date().toISOString();
  const p = DB.pacientes[pid] || {};
  return Object.assign({
    id: uid('fic'), ownerUid: SESION.uid, pacienteId: pid,
    fechaValoracion: hoyISO(), fecha: hoyISO(), caracter:'programada',
    institucion: institucionActiva(), obraSocial: p.obraSocial || '',
    nroAfiliado: p.nroAfiliado || '', estado:'borrador',
    v:{}, plan:{}, acto:{}, recup:{}, hon:{}, consent:{}, firma:{},
    creado: ahora, modificado: ahora, modificadoPor: SESION.uid
  }, extra || {});
}

/* El pedido al paciente cuelga de una ficha —asi funciona el portal—. Si el
   paciente ya tiene una valoracion abierta se usa esa; si no, nace una en
   borrador, que es la que despues se continua en la etapa 2. */
function enviarFichaDesdeEtapa1(pid){
  const p = DB.pacientes[pid];
  if(!p) return;
  if(!p.email){
    toast('Falta el correo del paciente: cargalo y volvé a intentar.', 'warn');
    return editarPaciente(pid, () => enviarFichaDesdeEtapa1(pid));
  }
  enviarInvitacionPrecarga({ apellido:p.apellido, nombre:p.nombre, dni:p.dni, email:p.email });
}

/* =========================================================================
   LA FICHA QUE COMPLETA EL PACIENTE, SIN GRABAR NADA ANTES
   -------------------------------------------------------------------------
   Pedido del 13-09-2026: mandarle la ficha al paciente no tiene que dejar
   rastro en ninguna base hasta que él la complete. Por eso no se crea ni el
   paciente ni la ficha ni el pedido: el enlace del mail lleva, codificados,
   los pocos datos que ya se saben. La base se toca recién cuando el paciente
   toca FINALIZADO, y cae en Pacientes → Precargados. Ver precarga.js. */
function b64url(obj){
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function enviarInvitacionPrecarga(d){
  if(typeof soloLectura === 'function' && soloLectura('mandar correos')) return;
  if(!envioConfigurado()) return toast('El envío por mail todavía no está configurado.', 'err');
  if(!d.email || !mailValido(d.email)) return toast('Revisá el correo del paciente.', 'err');
  const u = USUARIO || {};
  const token = tokenPrellenado();
  const inv = { a:d.apellido || '', n:d.nombre || '', dni:String(d.dni || '').replace(/\D/g,''), e:d.email,
                v: fechaMasDias(hoyISO(), PRECARGA_DIAS), p:(u.apellido || '') + ', ' + (u.nombre || '') };
  const enlace = location.origin + location.pathname + '#pre=' + token + '&d=' + b64url(inv);
  toast('Enviando el correo…');
  fetch(ENVIO_URL, { method:'POST', redirect:'follow', body: JSON.stringify({
      clave: ENVIO_CLAVE, para: d.email, responderA: u.email || '',
      nombre: typeof ENVIO_NOMBRE !== 'undefined' ? ENVIO_NOMBRE : 'AFAAR',
      asunto: 'Complete su ficha antes de la consulta prequirúrgica — ' + (d.apellido || '') + ', ' + (d.nombre || ''),
      html: htmlMailInvitacion(d, u, enlace) }) })
    .then(r => r.json())
    .then(res => { if(!res || !res.ok) throw new Error((res && res.error) || 'sin respuesta');
      toast('Enviado a ' + d.email + '. Cuando el paciente la complete, aparece en Pacientes → Precargados.', 'ok'); })
    .catch(e => toast('No se pudo enviar el correo: ' + e.message, 'err'));
}
function htmlMailInvitacion(d, u, enlace){
  const firma = (u.apellido || '') + ', ' + (u.nombre || '');
  return '<div style="font-family:Calibri,Arial,sans-serif;font-size:15px;color:#111;line-height:1.6;max-width:760px;margin:0 auto">'+
    '<p>Estimado/a <b>' + esc(d.nombre || 'paciente') + '</b>,</p>'+
    '<p>Soy el/la médico/a anestesiólogo/a de la AFAAR que va a hacer su valoración prequirúrgica. Para que la consulta '+
      'se dedique a lo importante, le pido que <b>complete su ficha antes de venir</b>: sus datos, las enfermedades que '+
      'tuvo, las operaciones, qué remedios toma y a qué es alérgico.</p>'+
    '<div style="text-align:center;margin:26px 0"><a href="' + esc(enlace) + '" style="display:inline-block;background:#0b2545;'+
      'color:#fff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 30px;border-radius:8px">Completar mi ficha</a>'+
      '<div style="font-size:12px;color:#556;margin-top:10px">Se abre en el teléfono o la computadora. No hace falta instalar nada.</div></div>'+
    '<div style="background:#fff8e6;border:1px solid #e6d08a;border-radius:8px;padding:12px 14px;margin:18px 0">'+
      '<b>Importante.</b> Lo que complete no reemplaza la consulta. <b>No suspenda ni empiece ningún medicamento por su cuenta.</b> '+
      'Sus datos se guardan recién cuando toca FINALIZADO.</div>'+
    '<div style="background:#fdeeee;border:1px solid #e0a8a8;border-radius:8px;padding:12px 14px;margin:18px 0">'+
      '<b>El enlace es personal.</b> No lo reenvíe. Vence en ' + PRECARGA_DIAS + ' días.</div>'+
    '<p>Saludos cordiales,<br><b>' + esc(firma) + '</b><br>' + esc(u.titulo || 'Médico/a Especialista en Anestesiología') +
      '<br>M.P. ' + esc(matriculaTxt(u.matriculaProvincial, 'M.P.')) + '</p>'+
    '<hr style="border:0;border-top:1px solid #ccd;margin:26px 0 14px"><div style="font-size:11.5px;color:#455">'+
      'Ley 25.326 de Protección de Datos Personales · Ley 17.132 del Ejercicio de la Medicina · Ley 26.529 de Derechos del Paciente. '+
      'Si usted no es el destinatario de este correo, elimínelo y avise al remitente.</div></div>';
}

/* Alta minima de un paciente, o reuso del que ya esta en el padron por DNI.
   Devuelve el id, o null si falta algo (y lo dice). */
function guardarPacienteBasico(d, o){
  o = o || {};
  if(typeof soloLectura === 'function' && soloLectura('cargar pacientes')) return null;
  d = Object.assign({}, d);
  Object.keys(d).forEach(k => { if(typeof d[k] === 'string') d[k] = d[k].trim(); });
  if(!d.apellido || !d.nombre){ toast('Apellido y nombre son obligatorios.', 'err'); return null; }
  if(!d.dni){ toast('El DNI es obligatorio.', 'err'); return null; }
  if(o.exigirMail && !d.email){
    toast('Falta el correo electrónico: es por donde le llega la ficha.', 'err'); return null; }
  if(d.email && !mailValido(d.email)){ toast('Revisá el correo electrónico.', 'err'); return null; }

  const ahora = new Date().toISOString();
  const ya = lista('pacientes').find(x => x.dni && norm(x.dni) === norm(d.dni));
  if(ya){
    /* Del que ya existe no se pisa nada: se completa lo que le falta. El
       correo es la excepcion, porque se lo acaban de confirmar al paciente. */
    const p = JSON.parse(JSON.stringify(ya));
    let cambio = false;
    const ponerNac = d.fechaNac && !p.fechaNac;
    Object.keys(d).forEach(k => {
      if(['apellido','nombre','dni','fechaNacEstimada'].indexOf(k) >= 0 || !d[k]) return;
      if(k === 'email' ? p.email !== d.email : !p[k]){ p[k] = d[k]; cambio = true; }
    });
    if(ponerNac && d.fechaNacEstimada) p.fechaNacEstimada = d.fechaNacEstimada;
    if(cambio){ p.modificado = ahora; p.modificadoPor = SESION.uid; escribir('pacientes', p.id, p); }
    auditar('padron-atender', 'Etapa 1 con un paciente del padrón — ' + p.apellido + ', ' + p.nombre);
    return p.id;
  }
  const id = uid('pac');
  const reg = Object.assign({
    antecedentes:[], antQuirurgicos:[], antAnestesicos:[], antFamiliares:[],
    medicacion:[], alergias:[], habitos:{}
  }, d, { id, ownerUid: SESION.uid, creado: ahora, modificado: ahora, modificadoPor: SESION.uid });
  escribir('pacientes', id, reg);
  auditar('paciente-alta', reg.apellido + ', ' + reg.nombre + ' (etapa 1)');
  return id;
}

/* ---------------------- Que complete la ficha en casa ---------------------- */
function abrirTomaRapida(){
  abrirModal('Que complete su ficha en casa',
    '<div class="aviso info">'+ico('correo')+'<div>Con estos cuatro datos le llega por mail un '+
      'enlace para que cargue <b>sus datos, antecedentes, medicación y alergias</b>. Lo que cargue '+
      'no entra solo: lo revisás vos antes de incorporarlo.</div></div>'+
    '<div class="grid c2">'+campoTxt('trApe', 'Apellido *')+campoTxt('trNom', 'Nombre *')+'</div>'+
    '<div class="grid c2">'+campoTxt('trDni', 'DNI *')+
      '<div class="campo"><label>Correo electrónico *</label>'+
        '<input type="email" id="trMail" placeholder="nombre@correo.com" autocomplete="off"></div>'+
    '</div>'+
    '<div id="trAviso"></div>'+
    '<div class="ayuda">No se guarda nada todavía: el paciente queda registrado recién cuando complete su '+
      'ficha, y aparece en <b>Pacientes → Precargados</b>.</div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="trEnviar">'+ico('correo')+' Enviar</button>', '600px');

  alVolverModal(volverA);
  const revisar = () => {
    if(!$('#trAviso')) return;              /* la ventana ya se cerró */
    const d = valEt('trDni');
    const ya = d ? lista('pacientes').find(x => x.dni && norm(x.dni) === norm(d)) : null;
    $('#trAviso').innerHTML = ya
      ? '<div class="aviso warn">'+ico('info')+'<div><b>Ya está en el padrón:</b> '+
        esc((ya.apellido || '')+', '+(ya.nombre || ''))+'. Se usa ese paciente, sin duplicarlo.</div></div>'
      : '';
    if(ya){
      if(!valEt('trApe')) $('#trApe').value = ya.apellido || '';
      if(!valEt('trNom')) $('#trNom').value = ya.nombre || '';
      if(!valEt('trMail') && ya.email) $('#trMail').value = ya.email;
    }
  };
  $('#trDni').oninput = debounce(revisar, 250);
  $('#trEnviar').onclick = () => {
    const d = { apellido: valEt('trApe'), nombre: valEt('trNom'), dni: valEt('trDni'), email: valEt('trMail') };
    if(!d.apellido || !d.nombre || !d.dni) return toast('Cargá apellido, nombre y DNI.', 'err');
    if(!mailValido(d.email)) return toast('Revisá el correo electrónico.', 'err');
    cerrarModal();
    enviarInvitacionPrecarga(d);
  };
  setTimeout(() => { const i = $('#trApe'); if(i) i.focus(); }, 120);
}

/* ------------------------- Urgencia / emergencia -------------------------
   Lo que se pidio: nombre, apellido, DNI, edad y cobertura, y de ahi al
   quirofano. Se suma el peso como opcional porque sin peso el vademecum no
   propone dosis. Si no se sabe quien es, se abre el NN provisional de
   siempre (crearPacienteProvisional en core.js).

   El acto queda tomado a nombre de quien lo abre y la valoracion declarada
   como deuda de urgencia, exactamente como en el camino largo: la ficha no
   se firma hasta completar paciente y valoracion. */
function fechaNacDeEdad(edad){
  const d = new Date();
  d.setFullYear(d.getFullYear() - edad);
  return d.toISOString().slice(0, 10);
}

function abrirUrgenciaRapida(){
  const coberturas = obrasSociales();
  abrirModal('Urgencia / emergencia',
    '<div class="seg" id="urCar">'+
      '<button type="button" data-v="urgencia" class="on">Urgencia · en horas</button>'+
      '<button type="button" data-v="emergencia">Emergencia · sin demora</button>'+
    '</div>'+
    '<div id="urDatos" class="mt14">'+
      '<div class="grid c2">'+campoTxt('urApe', 'Apellido')+campoTxt('urNom', 'Nombre')+'</div>'+
      '<div class="grid c3">'+campoTxt('urDni', 'DNI')+
        campoNum('urEdad', 'Edad (años)', '', 'inputmode="numeric" min="0" max="120"')+
        campoNum('urPeso', 'Peso (kg) · opcional', '', 'inputmode="decimal"')+'</div>'+
      '<div class="campo"><label>Cobertura médica</label><select id="urOS">'+
        '<option value="">Particular / sin cobertura</option>'+
        coberturas.map(o => '<option>'+esc(o)+'</option>').join('')+'</select></div>'+
      '<div id="urAviso"></div>'+
    '</div>'+
    '<label class="chk mt8"><input type="checkbox" id="urNN"> No se sabe quién es: abrir como NN y '+
      'completar después</label>'+
    '<div class="ayuda">La valoración y el resto de los datos quedan <b>pendientes</b>: se completan '+
      'después, y sin ellos la ficha no se firma.</div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn danger grande" id="urIr">'+ico('jeringa')+' Ir al quirófano</button>', '620px');

  alVolverModal(volverA);
  let car = 'urgencia';
  $$('#urCar button').forEach(b => b.onclick = () => {
    $$('#urCar button').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); car = b.dataset.v;
  });
  $('#urNN').onchange = e => {
    $('#urDatos').style.opacity = e.target.checked ? '.35' : '';
    $('#urDatos').style.pointerEvents = e.target.checked ? 'none' : '';
  };
  $('#urDni').oninput = debounce(() => {
    /* El retardo puede vencer con la ventana ya cerrada (se tipeó el DNI y se
       tocó «Ir al quirófano» enseguida): sin esto, error en la consola. */
    if(!$('#urAviso')) return;
    const d = valEt('urDni');
    const ya = d ? lista('pacientes').find(x => x.dni && norm(x.dni) === norm(d)) : null;
    $('#urAviso').innerHTML = ya
      ? '<div class="aviso info">'+ico('info')+'<div><b>Ya está en el padrón:</b> '+
        esc((ya.apellido || '')+', '+(ya.nombre || ''))+'. Se usa ese paciente.</div></div>' : '';
    if(ya){
      if(!valEt('urApe')) $('#urApe').value = ya.apellido || '';
      if(!valEt('urNom')) $('#urNom').value = ya.nombre || '';
    }
  }, 250);

  $('#urIr').onclick = () => {
    if(typeof soloLectura === 'function' && soloLectura('abrir una urgencia')) return;
    let pid = '', os = '';
    if($('#urNN').checked){
      pid = crearPacienteProvisional();
    } else {
      os = $('#urOS').value;
      const d = { apellido: valEt('urApe'), nombre: valEt('urNom'), dni: valEt('urDni'),
                  peso: valEt('urPeso') };
      if(os) d.obraSocial = os;
      if(!d.apellido || !d.nombre || !d.dni)
        return toast('Cargá apellido, nombre y DNI, o marcá «No se sabe quién es».', 'err');
      const e = valEt('urEdad');
      if(e !== '' && Number(e) >= 0 && Number(e) <= 120){
        d.fechaNac = fechaNacDeEdad(Number(e));
        d.fechaNacEstimada = d.fechaNac;
      }
      pid = guardarPacienteBasico(d, {});
      if(!pid) return;
    }
    cerrarModal();
    abrirActoDeUrgencia(pid, car, os);
  };
  setTimeout(() => { const i = $('#urApe'); if(i) i.focus(); }, 120);
}

function abrirActoDeUrgencia(pid, car, obraSocial){
  const ahora = new Date().toISOString();
  const f = nuevaFichaDatos(pid, {
    caracter: car, viaActo: true,
    obraSocial: obraSocial || (DB.pacientes[pid] || {}).obraSocial || '',
    acto: { caracterActo: car, fechaCirugia: hoyISO() },
    asignadoUid: SESION.uid, actoPorUid: SESION.uid,
    actoPorNombre: USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '',
    actoTomado: ahora, actorExterno: ''
  });
  guardarMotivoSinValoracion(f, car, {});
  sincronizarFechas(f);
  escribir('fichas', f.id, f);
  auditar('ficha-tomar-acto', 'Acto propio — ' + nombreCaracter(car) + ' abierta desde la etapa 1');
  solapaActo = 'resumen';
  abrirFichaEnPaso(f.id, 'anestesia');
  toast('Registrá el acto. Los datos que faltan y la valoración quedan pendientes.', 'warn');
}

/* ---------------------------- Elegir paciente ----------------------------
   Buscador del padron con alta minima al pie. Del paciente en el que no se
   intervino se muestra lo mismo que en el padron: identificacion y nada mas. */
function elegirPaciente(titulo, ayuda, onPid, o){
  o = o || {};
  let q = '';
  const filas = () => {
    const w = norm(q).trim().split(/\s+/).filter(Boolean);
    if(!w.length) return '<p class="mini">Escribí el apellido o el DNI.</p>';
    const l = lista('pacientes').filter(p => {
      const c = norm([p.apellido, p.nombre, p.dni, p.hc].join(' '));
      return w.every(x => c.indexOf(x) >= 0);
    }).slice(0, 8);
    if(!l.length) return '<p class="mini">No está en el padrón. Cargalo abajo.</p>';
    return '<div class="lista chica">'+ l.map(p => {
      const ed = edadDe(p.fechaNac);
      return '<div class="item plano" data-epac="'+esc(p.id)+'"><div class="txt"><b>'+
        esc((p.apellido || '')+', '+(p.nombre || ''))+'</b><span>DNI '+esc(p.dni || '—')+
        (ed !== null ? ' · '+ed+' años' : '')+'</span></div><div class="der">'+flechaDer()+'</div></div>';
    }).join('') +'</div>';
  };
  abrirModal(titulo,
    (ayuda ? '<p class="mini" style="margin:0 0 10px">'+ayuda+'</p>' : '')+
    (o.extra || '')+
    '<div class="campo"><label>Buscar en el padrón</label>'+
      '<input type="search" id="epBuscar" placeholder="Apellido, nombre o DNI" autocomplete="off"></div>'+
    '<div id="epLista">'+ filas() +'</div>'+
    '<div class="et-sub">O es un paciente nuevo</div>'+
    '<div class="grid c3">'+campoTxt('epApe', 'Apellido *')+campoTxt('epNom', 'Nombre *')+
      campoTxt('epDni', 'DNI *')+'</div>'+
    (o.conCorreo ? '<div class="campo"><label>Correo electrónico</label>'+
      '<input type="email" id="epMail" placeholder="nombre@correo.com" autocomplete="off"></div>' : ''),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="epCrear">'+ico('mas')+' Cargar nuevo y seguir</button>', '640px');

  alVolverModal(volverA);
  const elegir = pid => {
    const extra = o.leerExtra ? o.leerExtra() : null;
    cerrarModal();
    setTimeout(() => onPid(pid, extra), 160);
  };
  const cablear = () => $$('#epLista [data-epac]').forEach(it => it.onclick = () => {
    const p = DB.pacientes[it.dataset.epac];
    if(p && typeof intervineEn === 'function' && !intervineEn(p))
      auditar('padron-atender', 'Toma un paciente del padrón — ' + (p.apellido || '') + ', ' + (p.nombre || ''));
    elegir(it.dataset.epac);
  });
  $('#epBuscar').oninput = debounce(e => {
    if(!$('#epLista')) return;              /* la ventana ya se cerró */
    q = e.target.value; $('#epLista').innerHTML = filas(); cablear();
  }, 200);
  $('#epCrear').onclick = () => {
    const pid = guardarPacienteBasico({ apellido: valEt('epApe'), nombre: valEt('epNom'),
      dni: valEt('epDni'), email: $('#epMail') ? valEt('epMail') : '' }, {});
    if(pid) elegir(pid);
  };
  setTimeout(() => { const i = $('#epBuscar'); if(i) i.focus(); }, 120);
}

/* ------------------------ La ficha hecha en papel ------------------------
   Cada pagina se fotografia, se achica y al final todas juntas se arman en
   UN PDF, escrito a mano como el de la demostracion (seed-extra.js): no hay
   librerias ni servidor. El PDF va a la rama de archivos pesados y el
   paciente guarda solo la referencia, en `fichasExternas`. */
const PAPEL_MAX_PAGINAS = 12;
let papelPaginas = [];

function abrirFichaEnPapel(pid){
  if(pid) return papelFotos(pid);
  elegirPaciente('Ficha hecha fuera de la app',
    'Elegí el paciente o cargalo con lo mínimo. Después le sacás foto a la hoja.',
    id => papelFotos(id), { conCorreo:true });
}

function papelFotos(pid){
  papelPaginas = [];
  pintarPapel(pid);
}

function pintarPapel(pid){
  const p = DB.pacientes[pid] || {};
  const n = papelPaginas.length;
  abrirModal('Ficha en papel · ' + (p.apellido || '') + ', ' + (p.nombre || ''),
    '<div class="aviso info">'+ico('camara')+'<div>Sacale una foto a <b>cada página</b>, derecha y '+
      'con buena luz. Al terminar se guarda como <b>un solo PDF</b> en su historia, en «Fichas '+
      'realizadas fuera de la app».</div></div>'+
    '<div class="papel-paginas">'+ (n
      ? papelPaginas.map((x, i) => '<div class="papel-pag"><img src="'+x.datos+'" alt="Página '+(i+1)+'">'+
          '<span>'+(i+1)+'</span><button type="button" class="ico-btn danger" data-pdel="'+i+'" '+
          'title="Quitar">'+ico('borrar')+'</button></div>').join('')
      : '<p class="mini">Todavía no hay páginas.</p>') +'</div>'+
    '<div class="btn-row mt14">'+
      '<button type="button" class="btn pri" id="ppFoto">'+ico('camara')+(n ? ' Otra página' : ' Sacar foto')+'</button>'+
      '<button type="button" class="btn ghost" id="ppSubir">'+ico('adjunto')+' Subir fotos o un PDF</button>'+
    '</div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn ok" id="ppGuardar"'+(n ? '' : ' disabled')+'>'+ico('check')+' Guardar PDF'+
      (n ? ' ('+n+' pág.)' : '')+'</button>', '680px');

  alVolverModal(volverA);
  $$('#modal [data-pdel]').forEach(b => b.onclick = () => {
    papelPaginas.splice(Number(b.dataset.pdel), 1); pintarPapel(pid); });
  $('#ppFoto').onclick  = () => pedirArchivos('image/*', true, fs => sumarPaginasPapel(pid, fs));
  $('#ppSubir').onclick = () => pedirArchivos('image/*,application/pdf,.pdf', false,
    fs => sumarPaginasPapel(pid, fs));
  $('#ppGuardar').onclick = () => {
    if(!papelPaginas.length) return;
    const bin = pdfDesdeJpegs(papelPaginas);
    const cant = papelPaginas.length;
    toast('Armando el PDF…');
    guardarFichaExterna(pid, {
      nombre: nombreArchivoPapel(pid), mime:'application/pdf', paginas: cant,
      datos: 'data:application/pdf;base64,' + btoa(bin), tam: bin.length
    }).then(enNube => {
      papelPaginas = [];
      papelGuardado(pid, cant, enNube);
    });
  };
}

function medirImagen(dataUrl){
  return new Promise(res => {
    const im = new Image();
    im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
    im.onerror = () => res({ w:0, h:0 });
    im.src = dataUrl;
  });
}

function sumarPaginasPapel(pid, files){
  const cola = files.slice();
  const siguiente = () => {
    if(!cola.length) return pintarPapel(pid);
    const file = cola.shift();
    /* Un PDF ya escaneado no se re-arma: se guarda tal cual, aparte */
    if(esPDF(file.type, file.name)){
      return leerArchivoCrudo(file).then(datos => guardarFichaExterna(pid, {
        nombre: file.name, mime:'application/pdf', datos,
        tam: Math.round((datos.length - (datos.indexOf(',') + 1)) * 0.75)
      })).then(() => { toast('PDF «' + file.name + '» guardado en su historia.', 'ok'); siguiente(); })
        .catch(e => { toast(e.message || 'No se pudo leer el PDF.', 'err'); siguiente(); });
    }
    if(papelPaginas.length >= PAPEL_MAX_PAGINAS){
      toast('Máximo ' + PAPEL_MAX_PAGINAS + ' páginas por PDF. Guardá este y empezá otro.', 'warn');
      return pintarPapel(pid);
    }
    comprimirImagen(file, 1600, 0.72)
      .then(datos => medirImagen(datos).then(m => {
        if(m.w && m.h) papelPaginas.push({ datos, w: m.w, h: m.h });
      }))
      .catch(e => toast(e.message || 'No se pudo leer la foto.', 'err'))
      .then(siguiente);
  };
  siguiente();
}

/* PDF 1.4 con una imagen JPEG por pagina (filtro DCTDecode). Cada pagina
   mide 595 puntos de ancho —una A4— y el alto sale de la proporcion de la
   foto. Devuelve la cadena binaria. */
function pdfDesdeJpegs(pags){
  const objs = [], kids = [];
  let n = 3;
  pags.forEach((pg, i) => {
    const jpg = atob(pg.datos.slice(pg.datos.indexOf(',') + 1));
    const W = 595, H = Math.max(1, Math.round(595 * pg.h / pg.w));
    const pagN = n++, contN = n++, imgN = n++;
    kids.push(pagN + ' 0 R');
    const cont = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im' + i + ' Do Q';
    objs[pagN] = '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + W + ' ' + H + ']' +
      '/Resources<</XObject<</Im' + i + ' ' + imgN + ' 0 R>>>>/Contents ' + contN + ' 0 R>>';
    objs[contN] = '<</Length ' + cont.length + '>>\nstream\n' + cont + '\nendstream';
    objs[imgN] = '<</Type/XObject/Subtype/Image/Width ' + pg.w + '/Height ' + pg.h +
      '/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ' + jpg.length + '>>\n' +
      'stream\n' + jpg + '\nendstream';
  });
  objs[1] = '<</Type/Catalog/Pages 2 0 R>>';
  objs[2] = '<</Type/Pages/Kids[' + kids.join(' ') + ']/Count ' + pags.length + '>>';
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const off = [];
  for(let i = 1; i < n; i++){ off[i] = pdf.length; pdf += i + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
  const xref = pdf.length;
  pdf += 'xref\n0 ' + n + '\n0000000000 65535 f \n';
  for(let i = 1; i < n; i++) pdf += ('0000000000' + off[i]).slice(-10) + ' 00000 n \n';
  pdf += 'trailer\n<</Size ' + n + '/Root 1 0 R>>\nstartxref\n' + xref + '\n%%EOF';
  return pdf;
}

function nombreArchivoPapel(pid){
  const p = DB.pacientes[pid] || {};
  const limpio = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ,.-]/g, '').trim();
  return 'Ficha fuera de la app - ' + limpio(p.apellido) + ' ' + limpio(p.nombre) + ' - ' + hoyISO() + '.pdf';
}

function guardarFichaExterna(pid, a){
  const p = DB.pacientes[pid];
  if(!p) return Promise.resolve(false);
  const reg = {
    id: uid('arch'), pacienteId: pid, fichaId:'', nombre: a.nombre, mime: a.mime,
    tam: a.tam, datos: a.datos, cuando: new Date().toISOString(), demo: !!p.demo,
    porUid: SESION.uid, porNombre: USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : ''
  };
  return archivoGuardar(reg).then(enNube => {
    const g = JSON.parse(JSON.stringify(DB.pacientes[pid]));
    g.fichasExternas = (g.fichasExternas || []).concat([{
      id: reg.id, nombre: reg.nombre, mime: reg.mime, tam: reg.tam, paginas: a.paginas || 0,
      cuando: reg.cuando, porUid: reg.porUid, porNombre: reg.porNombre, enNube: !!enNube
    }]);
    g.modificado = reg.cuando; g.modificadoPor = SESION.uid;
    escribir('pacientes', pid, g);
    auditar('ficha-externa-alta', reg.nombre);
    return enNube;
  });
}

function papelGuardado(pid, cant, enNube){
  abrirModal('Ficha en papel guardada',
    '<div class="aviso ok">'+ico('check')+'<div><b>PDF de '+cant+' página'+(cant === 1 ? '' : 's')+
      ' guardado</b> en su historia'+(enNube ? '' : ' (en este dispositivo: se sube al volver la conexión)')+
      '.</div></div>'+
    '<div class="et-ops mt14">'+
      opEtapa('pgDatos', 'editar', 'Pasar los datos de la hoja a la app',
        'Filiación, antecedentes, medicación y alergias.', 'pri')+
      opEtapa('pgSig', 'valoracion', 'Siguiente: 2 · Prequirúrgico', 'Abrir la valoración preanestésica.')+
    '</div>',
    '<button class="btn ghost" data-cerrar>Listo por ahora</button>', '600px');
  const luego = fn => () => { cerrarModal(); setTimeout(fn, 160); };
  $('#pgDatos').onclick = luego(() => editarPaciente(pid, () => despuesDeCargarPaciente(pid)));
  $('#pgSig').onclick   = luego(() => iniciarValoracionPara(pid));
}

/* La seccion de la historia del paciente */
function htmlFichasExternas(p){
  const l = (p.fichasExternas || []).slice().reverse();
  const mio = x => esCoordinador() || (SESION && x.porUid === SESION.uid);
  return '<h3 class="sec-t">Fichas realizadas fuera de la app ('+l.length+')</h3>'+
    (l.length
      ? '<div class="adjuntos">'+ l.map(x =>
          '<div class="adj"><span class="ic">'+ico(iconoArchivo(x.mime, x.nombre))+'</span>'+
            '<span class="tx"><b>'+esc(x.nombre)+'</b><i>'+
              (x.paginas ? x.paginas+' pág. · ' : '')+fTam(x.tam)+
              (x.cuando ? ' · '+fFecha(x.cuando.slice(0, 10)) : '')+
              (x.porNombre ? ' · '+esc(x.porNombre) : '')+'</i></span>'+
            '<button type="button" class="btn ghost chico" data-fxver="'+esc(x.id)+'">'+ico('ojo')+'</button>'+
            '<button type="button" class="btn ghost chico" data-fxbaj="'+esc(x.id)+'">'+ico('descargar')+'</button>'+
            (mio(x) ? '<button type="button" class="btn danger chico" data-fxdel="'+esc(x.id)+'">'+
              ico('borrar')+'</button>' : '')+
          '</div>').join('') +'</div>'
      : '<p class="mini">No hay fichas en papel guardadas.</p>')+
    '<div class="btn-row mt8"><button type="button" class="btn ghost chico" id="fxAgregar">'+
      ico('camara')+' Agregar ficha en papel</button></div>';
}

function cablearFichasExternas(pid){
  $$('#modal [data-fxver]').forEach(b => b.onclick = () => verAdjunto(b.dataset.fxver));
  $$('#modal [data-fxbaj]').forEach(b => b.onclick = () => bajarAdjunto(b.dataset.fxbaj));
  $$('#modal [data-fxdel]').forEach(b => b.onclick = () => {
    const id = b.dataset.fxdel;
    confirmar('Quitar la ficha en papel',
      'Se elimina el PDF de su historia y de la nube. No se puede deshacer.', () => {
        const g = JSON.parse(JSON.stringify(DB.pacientes[pid] || {}));
        g.fichasExternas = (g.fichasExternas || []).filter(x => x.id !== id);
        g.modificado = new Date().toISOString(); g.modificadoPor = SESION.uid;
        archivoEliminar(id);
        escribir('pacientes', pid, g);
        auditar('ficha-externa-baja', id);
        setTimeout(() => abrirPaciente(pid), 160);
      }, 'Quitar', true);
  });
  if($('#fxAgregar')) $('#fxAgregar').onclick = () => {
    volverA = () => abrirPaciente(pid);      /* cancelar las fotos vuelve a su historia */
    cerrarModal(); setTimeout(() => papelFotos(pid), 160);
  };
}

/* ======================= ETAPA 2 · PREQUIRURGICO ======================= */
function etapaPrequirurgico(){
  volverA = etapaPrequirurgico;
  const enCurso = valoracionesEnCurso();
  const nPre = typeof precargasPendientes === 'function' ? precargasPendientes().length : 0;
  abrirModal('Etapa 2 · Prequirúrgico',
    '<div class="et-ops">'+
      opEtapa('e2Nueva', 'valoracion', 'Valoración de un paciente',
        'Lo buscás (o lo cargás) y abrís la valoración preanestésica.', 'pri')+
      opEtapa('e2Inter', 'hospital', 'Interconsulta · paciente internado',
        'Con el motivo: si es prequirúrgica va a la valoración; si no, queda como consulta no quirúrgica.')+
      opEtapa('e2Prec', 'calendario', 'Precargados por el paciente',
        'Los que completaron su ficha solos, con el QR del turno.', '', nPre)+
    '</div>'+
    (enCurso.length
      ? '<div class="et-sub">Para continuar ('+enCurso.length+')</div>'+
        htmlListaEtapa(enCurso.slice(0, 8), 'preanestesia')
      : ''), '', '640px');

  $('#e2Nueva').onclick = () => {
    cerrarModal();
    setTimeout(() => elegirPaciente('Valoración preanestésica', '', pid => iniciarValoracionPara(pid)), 160);
  };
  $('#e2Inter').onclick = () => {
    cerrarModal();
    setTimeout(() => elegirPaciente('Interconsulta · paciente internado', '',
      (pid, extra) => {
        if(extra.motivo === 'prequirurgica')
          return iniciarValoracionPara(pid, { interconsulta: { lugar:extra.lugar, fecha:extra.fecha, motivo:'prequirurgica' } });
        /* No quirúrgica: no es una valoración preanestésica y no va a las fichas */
        const p = DB.pacientes[pid];
        if(p && !p.soloConsulta && p.ownerUid === SESION.uid && !lista('fichas').some(f => f.pacienteId === pid) &&
           Date.now() - new Date(p.creado || 0).getTime() < 180000)
          escribir('pacientes', pid, Object.assign({}, p, { soloConsulta:true }));
        abrirConsulta(null, pid, { motivo:extra.motivo, lugar:extra.lugar, fecha:extra.fecha });
      },
      { extra: campoSel('epMotivo', 'Motivo de la interconsulta', MOTIVOS_CONSULTA.map(m => ({ v:m[0], t:m[1] })), 'prequirurgica')+
               campoTxt('epLugar', 'Servicio y cama (ej.: Clínica médica, cama 12)'),
        leerExtra: () => ({ motivo: val('epMotivo'), lugar: valEt('epLugar'), fecha: hoyISO() }) }), 160);
  };
  $('#e2Prec').onclick = () => { cerrarModal(); alcancePac = 'precargas'; irA('pacientes'); };
  cablearListaEtapa();
}

/* Abre la valoracion de un paciente. Si ya tiene una abierta —por ejemplo la
   que nacio al mandarle la ficha por mail— se ofrece seguir esa en vez de
   duplicarla. */
function iniciarValoracionPara(pid, extra){
  const abierta = valoracionAbiertaDe(pid);
  const nueva = () => {
    abrirFicha(null, pid);
    if(!fichaActual) return;
    const inst = institucionActiva();
    if(inst) fichaActual.institucion = inst;
    const p = DB.pacientes[pid] || {};
    if(p.obraSocial && !fichaActual.obraSocial) fichaActual.obraSocial = p.obraSocial;
    fichaActual.viaVal = true;
    if(extra) Object.assign(fichaActual, extra);
    modoFicha = 'valoracion';
    pasoFicha = 'paciente';
    pintarFicha();
  };
  if(!abierta) return nueva();
  abrirModal('Ya tiene una valoración en curso',
    '<p style="margin:0;line-height:1.6">Este paciente tiene una valoración abierta del <b>'+
      esc(fFecha(fechaValoracionDe(abierta)))+'</b>'+
      (estadoPrellenado(abierta) === 'pendiente' ? ', con la ficha enviada por mail esperando respuesta' : '')+
      '. ¿La seguís o empezás otra?</p>',
    '<button class="btn ghost" id="ivOtra">Empezar otra</button>'+
    '<button class="btn pri" id="ivSeguir">Continuar esa</button>');
  $('#ivSeguir').onclick = () => { cerrarModal(); abrirFichaEnPaso(abierta.id, 'paciente', extra); };
  $('#ivOtra').onclick = () => { cerrarModal(); nueva(); };
}

/* ========================= ETAPA 3 · QUIROFANO ========================= */
function etapaQuirofano(){
  volverA = etapaQuirofano;
  let q = '';
  const filtrar = l => {
    const w = norm(q).trim();
    if(!w) return l;
    return l.filter(f => { const p = DB.pacientes[f.pacienteId] || {};
      return norm([p.apellido, p.nombre, p.dni, f.cirugia, textoProcedimientos(f)].join(' ')).indexOf(w) >= 0; });
  };
  const listas = () => {
    const actos = filtrar(actosEnCurso()), listos = filtrar(listosParaQuirofano());
    return (actos.length ? '<div class="et-sub">Mis actos en curso ('+actos.length+')</div>'+htmlListaEtapa(actos, 'anestesia') : '')+
      '<div class="et-sub">Listos para anestesiar ('+listos.length+')</div>'+
      (listos.length ? htmlListaEtapa(listos, 'anestesia')
        : '<p class="mini">'+(q ? 'Ningún paciente coincide con la búsqueda.'
                                : 'No hay valoraciones completas esperando quién las anestesie.')+'</p>');
  };
  abrirModal('Etapa 3 · Quirófano',
    '<div class="et-ops">'+
      opEtapa('e3Urg', 'alerta', 'Urgencia / emergencia',
        'Sin valoración previa: lo mínimo del paciente y directo al registro.', 'urg')+
      opEtapa('e3Ahora', 'jeringa', 'Iniciar la anestesia y completar después',
        'Arranca el registro ya. Los datos del paciente y la valoración se cargan durante la cirugía; la app te lo recuerda.', 'pri')+
    '</div>'+
    '<div class="campo mt14" style="margin-bottom:0"><input type="search" id="e3Buscar" '+
      'placeholder="Buscar paciente por apellido, DNI o cirugía" autocomplete="off"></div>'+
    '<div id="e3Listas">'+ listas() +'</div>'+
    '<div class="et-links"><button type="button" class="btn ghost chico" id="e3Fuera">'+ico('archivo')+
      ' Valorado en papel o reintervención</button></div>', '', '640px');

  $('#e3Urg').onclick = () => { cerrarModal(); setTimeout(abrirUrgenciaRapida, 160); };
  $('#e3Ahora').onclick = () => { cerrarModal(); iniciarAnestesiaCompletarDespues(); };
  $('#e3Buscar').oninput = debounce(e => {
    if(!$('#e3Listas')) return;
    q = e.target.value; $('#e3Listas').innerHTML = listas(); cablearListaEtapa();
  }, 200);
  $('#e3Fuera').onclick = () => { cerrarModal(); setTimeout(quirofanoOtrosCasos, 160); };
  cablearListaEtapa();
}

/* Los dos casos reales que no están en la lista. Reemplazan al recorrido
   viejo de «Nueva ficha anestésica» (tomar el acto → ventana de motivos →
   lista de todas las valoraciones), que repetía lo mismo que esta etapa. */
function quirofanoOtrosCasos(){
  abrirModal('Paciente que no está en la lista',
    '<div class="et-ops">'+
      opEtapa('e3Papel', 'archivo', 'Valorado en papel o en otra institución',
        'Se registra el acto y se adjunta la foto de la valoración. La ficha no se firma hasta pasarla a la app.')+
      opEtapa('e3Reint', 'ficha', 'Reintervención',
        'Paciente internado ya valorado: se trae su valoración anterior para actualizarla.')+
    '</div>', '', '600px');
  alVolverModal(etapaQuirofano);
  volverA = quirofanoOtrosCasos;
  $('#e3Papel').onclick = () => { cerrarModal(); setTimeout(() => elegirPaciente('Valorado en papel o en otra institución', '',
    (pid, extra) => abrirActoConValoracion(pid, 'externa', extra, null),
    { extra: '<div class="grid c2">'+campoTxt('epQuien', 'Quién la hizo (profesional o institución)')+
               campoFecha('epFechaVal', 'Fecha de esa valoración', hoyISO())+'</div>',
      leerExtra: () => ({ quien: valEt('epQuien'), fechaVal: valEt('epFechaVal') }) }), 160); };
  $('#e3Reint').onclick = () => { cerrarModal(); setTimeout(() => elegirPaciente('Reintervención',
    'Elegí el paciente: aparecen sus valoraciones completas.', pid => elegirValoracionAnterior(pid)), 160); };
}

function elegirValoracionAnterior(pid){
  const p = DB.pacientes[pid] || {};
  const l = fichasValoradasDe(pid);
  if(!l.length) return toast((p.apellido || 'El paciente') + ' no tiene ninguna valoración completa para traer.', 'warn');
  abrirModal('¿De qué intervención viene la valoración?',
    '<p class="mini" style="margin:0 0 10px">'+esc((p.apellido || '')+', '+(p.nombre || ''))+
      '. El consentimiento no se copia: se firma el de esta intervención.</p>'+
    '<div class="lista chica">'+ l.map(g => '<div class="item plano" data-orig="'+esc(g.id)+'"><div class="txt"><b>'+
      esc(textoProcedimientos(g) || g.cirugia || 'sin cirugía')+'</b><span>'+esc(fFecha(fechaDeFicha(g)))+
      ' · ASA '+esc(((g.v || {}).scores || {}).asa || '—')+' · valoró '+esc(autorFicha(g))+'</span></div>'+
      '<div class="der">'+flechaDer()+'</div></div>').join('') +'</div>', '', '600px');
  alVolverModal(quirofanoOtrosCasos);
  $$('#modal [data-orig]').forEach(it => it.onclick = () => {
    const g = DB.fichas[it.dataset.orig];
    cerrarModal();
    abrirActoConValoracion(pid, 'reintervencion',
      { fichaOrigen:g.id, origenTxt:(g.cirugia || 'sin cirugía') + ' · ' + fFecha(fechaDeFicha(g)) }, g);
  });
}

/* Abre el acto ya tomado, con la valoración declarada (papel) o traída (reintervención) */
function abrirActoConValoracion(pid, motivo, extra, origen){
  if(typeof soloLectura === 'function' && soloLectura('abrir un acto')) return;
  const ahora = new Date().toISOString();
  const f = nuevaFichaDatos(pid, {
    viaActo:true, acto:{ fechaCirugia: hoyISO() },
    asignadoUid: SESION.uid, actoPorUid: SESION.uid,
    actoPorNombre: USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '',
    actoTomado: ahora, actorExterno:''
  });
  if(origen){
    copiarValoracionDesde(f, origen);
    ['institucion','obraSocial','nroAfiliado','especialidad'].forEach(k => { if(!f[k] && origen[k]) f[k] = origen[k]; });
  }
  guardarMotivoSinValoracion(f, motivo, extra || {});
  sincronizarFechas(f);
  escribir('fichas', f.id, f);
  auditar('ficha-tomar-acto', 'Acto propio — ' + (motivo === 'externa' ? 'valoración en papel' : 'reintervención'));
  solapaActo = 'resumen';
  abrirFichaEnPaso(f.id, 'anestesia');
  toast(motivo === 'externa'
    ? 'Registrá el acto. Adjuntá la foto de la valoración en papel.'
    : 'Valoración traída. Cargá la cirugía de hoy y firmá el consentimiento de esta intervención.', 'ok');
}

/* =========================================================================
   LAS TRES ETAPAS DENTRO DE LA FICHA
   -------------------------------------------------------------------------
   Arriba de la ficha se ven sólo las tres etapas; los pasos de cada una
   aparecen únicamente cuando se está en ella (y sólo Quirófano tiene más de
   uno: Anestesia, Recuperación y Firmar). Las reglas de cada paso —si está
   habilitado, qué le falta— no cambian: se leen de estadoPaso() y
   pasoHabilitado() como siempre.
   ========================================================================= */
function pasosDeEtapa(n){ return PASOS_FICHA.filter(s => etapaDePaso(s.k) === n); }

/* Un solo color por etapa: completa si todos sus pasos lo están, «falta» si
   alguno tiene algo que no se puede omitir, pendiente si no se tocó nada. */
function estadoEtapa(f, n){
  const l = pasosDeEtapa(n).map(s => estadoPaso(f, s.k));
  if(l.every(e => e === 'ok')) return 'ok';
  if(l.every(e => e === 'pend')) return 'pend';
  return l.indexOf('alerta') >= 0 ? 'alerta' : 'medio';
}

function htmlEtapasFicha(f){
  const actual = etapaDePaso(pasoFicha);
  return '<div class="etapas-ficha no-print">'+ ETAPAS.map(e => {
    const est = estadoEtapa(f, e.n);
    const habil = pasosDeEtapa(e.n).some(s => pasoHabilitado(f, s.k));
    const foco = pasosDeEtapa(e.n).some(s => pasoEnFoco(s.k));
    return '<button type="button" class="et-tab e'+e.n+' '+est+(e.n === actual ? ' on' : '')+
      (habil && foco ? '' : ' atenuado')+'" data-etapa-ficha="'+e.n+'"'+
      (habil ? '' : ' data-trabado="1"')+' title="'+esc(e.nom+' — '+(habil
        ? ROTULO_ESTADO[est] : motivoPasoCerrado(f, pasosDeEtapa(e.n)[0].k)))+'">'+
      '<span class="num">'+e.n+'</span>'+
      '<span class="nom"><span class="l">'+esc(e.t)+'</span><span class="c">'+esc(e.corto)+'</span></span>'+
      '<span class="est '+est+'">'+esc(ROTULO_ESTADO[est])+'</span>'+
      /* Debajo de PACIENTE, el estado del pedido por mail al paciente */
      (e.n === 1 ? selloPrellenado(f) : '')+
    '</button>';
  }).join('') +'</div>';
}

/* Ir a una etapa: si ya se está en ella no se mueve; si no, entra por su
   primer paso habilitado (en Quirófano, el primero que no esté completo). */
function irAEtapaFicha(n){
  if(etapaDePaso(pasoFicha) === n) return;
  const f = fichaActual;
  const habil = pasosDeEtapa(n).filter(s => pasoHabilitado(f, s.k));
  if(!habil.length) return toast(motivoPasoCerrado(f, pasosDeEtapa(n)[0].k), 'warn');
  const destino = habil.find(s => estadoPaso(f, s.k) !== 'ok') || habil[0];
  irAPaso(destino.k);
}

/* =========================================================================
   EL CARTEL DE FALTANTES EN UNA URGENCIA
   -------------------------------------------------------------------------
   Pedido de la asociación: en una urgencia o emergencia, el cartel rojo con
   los datos que faltan desviaba la atención justo cuando hay que anestesiar.
     - antes de cargar el inicio de la anestesia: no se muestra;
     - con la anestesia en curso: una sola línea plegada, que se abre si se
       quiere;
     - con el fin de anestesia cargado, en Recuperación o en Firmar: el cartel
       completo de siempre, que es cuando hay que completar.
   Fuera de las urgencias no cambia nada.
   ========================================================================= */
function bannerFaltantesEtapa(f, paso){
  const a = f.acto || {};
  const urgente = esNoProgramado(caracterActo(f)) || esNoProgramado(f.caracter);
  if(!urgente || (f.firma || {}).firmado || paso !== 'anestesia' || a.finAnestesia)
    return bannerFaltantes(f, paso);
  if(!a.inicioAnestesia) return '';
  const n = faltantesDePasosPrevios(f, paso).length;
  if(!n) return '';
  return '<details class="falt-urg no-print"><summary>'+ico('info')+
    '<span>Quedan <b>'+n+' dato'+(n === 1 ? '' : 's')+'</b> del paciente y la valoración para '+
    'completar al terminar.</span></summary>'+ bannerFaltantes(f, paso) +'</details>';
}


/* =========================================================================
   INICIAR LA ANESTESIA Y COMPLETAR DESPUÉS
   -------------------------------------------------------------------------
   Pedido del 13-09-2026: arrancar el registro del acto en el segundo cero y
   cargar los datos del paciente y la valoración mientras transcurre la
   cirugía. Se abre con un paciente provisional y el acto a tu nombre; la
   ficha queda marcada `completarDespues` y, mientras falten los datos
   filiatorios o la valoración, una voz te lo recuerda cada 10 minutos (ver
   revisarActosSinDatos en inicio-extra.js). La firma exige todo, como siempre.
   ========================================================================= */
function iniciarAnestesiaCompletarDespues(){
  if(typeof soloLectura === 'function' && soloLectura('iniciar un acto')) return;
  const pid = crearPacienteProvisional();
  const ahora = new Date().toISOString();
  const f = nuevaFichaDatos(pid, {
    viaActo:true, completarDespues: ahora,
    acto:{ fechaCirugia: hoyISO() },
    asignadoUid: SESION.uid, actoPorUid: SESION.uid,
    actoPorNombre: USUARIO ? (USUARIO.apellido + ', ' + USUARIO.nombre) : '',
    actoTomado: ahora, actorExterno:''
  });
  /* «La cargo ahora»: no declara ninguna excepción, así que no aparece la ventana de motivos */
  guardarMotivoSinValoracion(f, 'ahora', {});
  sincronizarFechas(f);
  escribir('fichas', f.id, f);
  auditar('ficha-tomar-acto', 'Acto iniciado para completar los datos durante la cirugía');
  solapaActo = 'resumen';
  if(typeof CM !== 'undefined') CM.tab = 'plantilla';
  abrirFichaEnPaso(f.id, 'anestesia');
  toast('Acto iniciado. Completá los datos del paciente y la valoración durante la cirugía: te lo voy a recordar.', 'warn');
}
