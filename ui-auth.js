/* =========================================================================
   AUTENTICACION - ingreso, registro de socios y perfil profesional
   ========================================================================= */

let pasoRegistro = 1;
let borradorRegistro = {};

function pintarAuth(){
  const c = $('#authCuerpo');
  const tab = $('.auth-tabs button.on').dataset.tab;
  if(tab === 'ingresar')        c.innerHTML = htmlIngresar();
  else if(tab === 'registro')   c.innerHTML = htmlRegistro();
  else if(tab === 'contable')   c.innerHTML = htmlContable();
  else                          c.innerHTML = htmlCoordinador();
  cablearAuth(tab);
}

/* ------------------------------------------------------------ Ingresar */
function htmlIngresar(){
  return ''+
  '<div class="campo"><label>Correo electrónico</label>'+
    '<input type="email" id="inEmail" autocomplete="username" inputmode="email" placeholder="nombre@correo.com"></div>'+
  '<div class="campo"><label>Contraseña</label>'+
    '<input type="password" id="inClave" autocomplete="current-password" placeholder="••••••••"></div>'+
  '<button class="btn pri full grande" id="btnIngresar">'+ico('candado')+' Ingresar al portal</button>'+
  '<p class="mini txt-c mt14" style="line-height:1.6">El ingreso de cada socio debe estar aprobado por el anestesiólogo coordinador de la AFAAR.</p>';
}

/* ------------------------------------------------------------ Registro */
function htmlRegistro(){
  if(pasoRegistro === 1){
    return ''+
    '<div class="aviso info">'+ico('info')+'<div><b>Paso 1 de 2 · Credenciales</b><br>'+
      'Creá tu usuario personal. En el paso siguiente completás tus datos profesionales.</div></div>'+
    '<div class="campo"><label>Correo electrónico <span class="req">*</span></label>'+
      '<input type="email" id="rgEmail" inputmode="email" autocomplete="email" placeholder="nombre@correo.com" value="'+esc(borradorRegistro.email||'')+'"></div>'+
    '<div class="campo"><label>Contraseña <span class="req">*</span></label>'+
      '<input type="password" id="rgClave" autocomplete="new-password" placeholder="Mínimo 6 caracteres">'+
      '<div class="ayuda">Usá una contraseña que no utilices en otros servicios.</div></div>'+
    '<div class="campo"><label>Repetir contraseña <span class="req">*</span></label>'+
      '<input type="password" id="rgClave2" autocomplete="new-password" placeholder="••••••••"></div>'+
    '<button class="btn pri full grande" id="btnPaso2">Continuar '+ico('flecha').replace('<svg','<svg style="transform:rotate(-90deg)"')+'</button>';
  }
  const insts = instituciones();
  return ''+
  '<div class="aviso info">'+ico('info')+'<div><b>Paso 2 de 2 · Datos profesionales</b><br>'+
    'Estos datos figuran en el encabezado de cada ficha anestésica que emitas.</div></div>'+
  '<div class="grid c2">'+
    '<div class="campo"><label>Apellido <span class="req">*</span></label><input type="text" id="rgApellido" autocomplete="family-name"></div>'+
    '<div class="campo"><label>Nombre <span class="req">*</span></label><input type="text" id="rgNombre" autocomplete="given-name"></div>'+
  '</div>'+
  '<div class="grid c2">'+
    '<div class="campo"><label>DNI <span class="req">*</span></label><input type="text" id="rgDni" inputmode="numeric"></div>'+
    '<div class="campo"><label>Fecha de nacimiento</label><input type="date" id="rgNac"></div>'+
  '</div>'+
  '<div class="grid c2">'+
    '<div class="campo"><label>Matrícula nacional</label><input type="text" id="rgMatNac" placeholder="M.N. 00000"></div>'+
    '<div class="campo"><label>Matrícula provincial <span class="req">*</span></label><input type="text" id="rgMatProv" placeholder="M.P. 0000"></div>'+
  '</div>'+
  '<div class="campo"><label>Título / especialidad</label>'+
    '<input type="text" id="rgTitulo" value="Médico Especialista en Anestesiología" ></div>'+
  '<div class="grid c2">'+
    '<div class="campo"><label>Teléfono de contacto</label><input type="tel" id="rgTel" inputmode="tel"></div>'+
    '<div class="campo"><label>CUIT</label><input type="text" id="rgCuit" inputmode="numeric" placeholder="20-00000000-0"></div>'+
  '</div>'+
  '<div class="campo"><label>Condición frente al IVA</label>'+
    '<select id="rgIva">'+
      ['Monotributista','Responsable Inscripto','Exento','Consumidor Final']
        .map(o => '<option>'+o+'</option>').join('')+
    '</select></div>'+
  '<div class="campo"><label>Lugares de trabajo <span class="req">*</span></label>'+
    '<div class="chks" id="rgInsts">'+
      insts.map(i => '<label class="chk"><input type="checkbox" value="'+esc(i.id)+'">'+
        esc(i.nombre.split('"')[0].trim())+'</label>').join('')+
    '</div></div>'+
  '<div class="btn-row"><button class="btn ghost" id="btnPaso1">'+ico('atras')+' Atrás</button>'+
  '<button class="btn pri" style="flex:1" id="btnRegistrar">'+ico('check')+' Enviar solicitud</button></div>';
}

/* --------------------------------------------------------- Coordinador */
function htmlCoordinador(){
  return ''+
  '<div class="aviso warn">'+ico('escudo')+'<div><b>Acceso reservado</b><br>'+
    'Portal del anestesiólogo coordinador de la AFAAR. Credencial única y privada.</div></div>'+
  '<div class="campo"><label>Credencial de coordinación</label>'+
    '<input type="password" id="inCoord" inputmode="numeric" placeholder="••••" autocomplete="off"></div>'+
  '<button class="btn aqua full grande" id="btnCoord">'+ico('escudo')+' Ingresar como coordinador</button>';
}

/* ------------------------------------------------------------- Contable */
function htmlContable(){
  return ''+
  '<div class="aviso warn">'+ico('dinero')+'<div><b>Acceso exclusivo del contador</b><br>'+
    'Portal económico de la AFAAR. Sin acceso a historias clínicas ni a datos de pacientes.</div></div>'+
  '<div class="campo"><label>Clave del contable</label>'+
    '<input type="password" id="inCont" inputmode="numeric" placeholder="••••" autocomplete="off"></div>'+
  '<button class="btn pri full grande" id="btnCont">'+ico('dinero')+' Ingresar como contable</button>'+
  '<p class="mini txt-c mt14" style="line-height:1.6">Este acceso ve importes, financiadores, '+
    'instituciones y profesionales. No ve pacientes, cirugías ni diagnósticos.</p>';
}

/* ------------------------------------------------------------ Cableado */
function cablearAuth(tab){
  if(tab === 'contable'){
    $('#btnCont').onclick = intentarContable;
    $('#inCont').onkeydown = e => { if(e.key === 'Enter') intentarContable(); };
  }
  if(tab === 'ingresar'){
    $('#btnIngresar').onclick = intentarIngreso;
    $('#inClave').onkeydown = e => { if(e.key === 'Enter') intentarIngreso(); };
  }
  if(tab === 'coordinador'){
    $('#btnCoord').onclick = intentarCoordinador;
    $('#inCoord').onkeydown = e => { if(e.key === 'Enter') intentarCoordinador(); };
  }
  if(tab === 'registro'){
    if(pasoRegistro === 1){
      $('#btnPaso2').onclick = () => {
        const em = $('#rgEmail').value.trim().toLowerCase();
        const c1 = $('#rgClave').value, c2 = $('#rgClave2').value;
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast('Correo electrónico inválido.', 'err');
        if(lista('usuarios').some(u => u.email === em)) return toast('Ya existe una cuenta con ese correo.', 'err');
        if(c1.length < 6) return toast('La contraseña debe tener al menos 6 caracteres.', 'err');
        if(c1 !== c2) return toast('Las contraseñas no coinciden.', 'err');
        borradorRegistro = { email: em, clave: c1 };
        pasoRegistro = 2; pintarAuth();
      };
    } else {
      $('#btnPaso1').onclick = () => { pasoRegistro = 1; pintarAuth(); };
      $('#btnRegistrar').onclick = enviarRegistro;
      $$('#rgInsts .chk').forEach(l => {
        l.onclick = () => setTimeout(() => l.classList.toggle('sel', l.querySelector('input').checked), 0);
      });
    }
  }
}

/* ------------------------------------------------------------- Acciones */
function intentarIngreso(){
  const em = $('#inEmail').value.trim().toLowerCase();
  const cl = $('#inClave').value;
  if(!em || !cl) return toast('Completá correo y contraseña.', 'err');
  const u = lista('usuarios').find(x => x.email === em);
  if(!u) return toast('No encontramos una cuenta con ese correo.', 'err');
  if(hashClave(cl, u.salt) !== u.passHash) return toast('Contraseña incorrecta.', 'err');
  if(u.estado === 'pendiente')
    return abrirModal('Solicitud en revisión',
      '<div class="aviso warn">'+ico('reloj')+'<div>Tu solicitud de acceso fue enviada el '+
      fFecha(u.creado)+' y está esperando la aprobación del anestesiólogo coordinador de la AFAAR. '+
      'Vas a poder ingresar apenas sea aprobada.</div></div>',
      '<button class="btn pri" data-cerrar>Entendido</button>');
  if(u.estado === 'rechazado')
    return abrirModal('Solicitud no aprobada',
      '<div class="aviso danger">'+ico('equis')+'<div><b>Motivo informado por el coordinador:</b><br>'+
      esc(u.motivoRechazo || 'Sin detalle.')+'</div></div>'+
      '<p class="mini">Comunicate con la comisión directiva de la AFAAR para regularizar tu situación.</p>',
      '<button class="btn pri" data-cerrar>Cerrar</button>');
  if(u.estado === 'suspendido')
    return toast('Tu cuenta está suspendida. Contactá al coordinador.', 'err');
  abrirSesion(u.uid, 'socio');
}

function intentarCoordinador(){
  const c = $('#inCoord').value.trim();
  if(c !== CLAVE_COORDINADOR) return toast('Credencial de coordinación incorrecta.', 'err');
  /* Migración de instalaciones anteriores: corrección del nombre */
  const yaExiste = DB.usuarios['coordinador'];
  if(yaExiste && yaExiste.nombre === 'Yanino'){
    yaExiste.nombre = 'Yanina';
    if(yaExiste.titulo === 'Anestesiólogo Coordinador — AFAAR') yaExiste.titulo = 'Coordinación — AFAAR';
    escribir('usuarios', 'coordinador', yaExiste);
  }
  if(!yaExiste){
    escribir('usuarios', 'coordinador', {
      uid:'coordinador', rol:'coordinador', estado:'aprobado',
      email:'coordinacion@afar.org.ar', nombre:'Yanina', apellido:'Andino',
      titulo:'Coordinación — AFAAR', matriculaProvincial:'—',
      instituciones:[], creado:new Date().toISOString(), salt:'coord', passHash:''
    });
  }
  abrirSesion('coordinador', 'coordinador');
}

function intentarContable(){
  const c = $('#inCont').value.trim();
  if(c !== CLAVE_CONTABLE) return toast('Clave del contable incorrecta.', 'err');
  if(!DB.usuarios['contable']){
    escribir('usuarios', 'contable', {
      uid:'contable', rol:'contable', estado:'aprobado',
      email:'contable@afar.org.ar', nombre:'Contable', apellido:'AFAAR',
      titulo:'Contador de la Asociación', matriculaProvincial:'—',
      instituciones:[], creado:new Date().toISOString(), salt:'cont', passHash:''
    });
  }
  abrirSesion('contable', 'contable');
}

async function enviarRegistro(){
  const g = id => ($('#'+id) ? $('#'+id).value.trim() : '');
  const insts = $$('#rgInsts input:checked').map(i => i.value);
  if(!g('rgApellido') || !g('rgNombre')) return toast('Completá apellido y nombre.', 'err');
  if(!g('rgDni')) return toast('Completá el DNI.', 'err');
  if(!g('rgMatProv') && !g('rgMatNac')) return toast('Cargá al menos una matrícula.', 'err');
  if(!insts.length) return toast('Seleccioná al menos un lugar de trabajo.', 'err');

  const u = uid('usr');
  const salt = Math.random().toString(36).slice(2,12);
  escribir('usuarios', u, {
    uid:u, rol:'socio', estado:'pendiente',
    email: borradorRegistro.email,
    salt, passHash: hashClave(borradorRegistro.clave, salt),
    apellido:g('rgApellido'), nombre:g('rgNombre'), dni:g('rgDni'), fechaNac:g('rgNac'),
    matriculaNacional:g('rgMatNac'), matriculaProvincial:g('rgMatProv'),
    titulo:g('rgTitulo') || 'Médico Especialista en Anestesiología',
    telefono:g('rgTel'), cuit:g('rgCuit'), condicionIva:g('rgIva'),
    instituciones: insts,
    firmaDataUrl:'', creado:new Date().toISOString()
  });
  borradorRegistro = {}; pasoRegistro = 1;
  abrirModal('Solicitud enviada',
    '<div class="aviso ok">'+ico('check')+'<div><b>Recibimos tu solicitud.</b><br>'+
    'El anestesiólogo coordinador de la AFAAR va a revisar tu matrícula. '+
    'Cuando la apruebe vas a poder ingresar con el correo y la contraseña que acabás de crear.</div></div>',
    '<button class="btn pri" data-cerrar>Entendido</button>');
  $$('.auth-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === 'ingresar'));
  pintarAuth();
}

/* --------------------------------------------------------- Sesion ------ */
function abrirSesion(u, rol){
  SESION = { uid:u, rol };
  USUARIO = DB.usuarios[u];
  localStorage.setItem(LS_SES, JSON.stringify(SESION));
  auditar('ingreso', 'Ingreso al portal ' + rol);
  arrancarApp();
}
function cerrarSesion(){
  auditar('salida', 'Cierre de sesión');
  SESION = null; USUARIO = null;
  localStorage.removeItem(LS_SES);
  $('#app').classList.remove('on');
  $('#pantallaAuth').style.display = '';
  pasoRegistro = 1; borradorRegistro = {};
  $$('.auth-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === 'ingresar'));
  pintarAuth();
}
function restaurarSesion(){
  try{
    const s = JSON.parse(localStorage.getItem(LS_SES) || 'null');
    if(!s) return false;
    const u = DB.usuarios[s.uid];
    if(!u) return false;
    if(s.rol !== u.rol) return false;      /* el rol no se altera desde el dispositivo */
    if(s.rol === 'socio' && u.estado !== 'aprobado') return false;
    SESION = s; USUARIO = u;
    return true;
  }catch(e){ return false; }
}

/* ============================== MI PERFIL ============================== */
function vistaPerfil(){
  const u = USUARIO || {};
  const insts = instituciones();
  const cont = $('#vPerfil');
  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Mi perfil profesional</h1>'+
    '<p>Estos datos encabezan cada ficha anestésica y cada resumen de facturación.</p></div></div>'+

  '<div class="card"><h3>'+ico('usuario')+'Identificación</h3>'+
    '<div class="grid c2">'+
      campoTxt('pfApellido','Apellido', u.apellido)+
      campoTxt('pfNombre','Nombre', u.nombre)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('pfDni','DNI', u.dni)+
      campoFecha('pfNac','Fecha de nacimiento', u.fechaNac)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('pfMatNac','Matrícula nacional', u.matriculaNacional)+
      campoTxt('pfMatProv','Matrícula provincial', u.matriculaProvincial)+
    '</div>'+
    campoTxt('pfTitulo','Título / especialidad', u.titulo)+
    '<div class="grid c2">'+
      campoTxt('pfTel','Teléfono', u.telefono)+
      campoTxt('pfEmail','Correo electrónico', u.email, true)+
    '</div>'+
  '</div>'+

  '<div class="card"><h3>'+ico('dinero')+'Datos de facturación</h3>'+
    '<div class="grid c2">'+
      campoTxt('pfCuit','CUIT', u.cuit)+
      '<div class="campo"><label>Condición frente al IVA</label><select id="pfIva">'+
        ['Monotributista','Responsable Inscripto','Exento','Consumidor Final']
          .map(o => '<option'+(u.condicionIva===o?' selected':'')+'>'+o+'</option>').join('')+
      '</select></div>'+
    '</div>'+
    campoTxt('pfDomicilio','Domicilio fiscal', u.domicilio)+
  '</div>'+

  '<div class="card"><h3>'+ico('hospital')+'Lugares de trabajo</h3>'+
    '<div class="chks" id="pfInsts">'+
      insts.map(i => '<label class="chk'+((u.instituciones||[]).indexOf(i.id)>=0?' sel':'')+'">'+
        '<input type="checkbox" value="'+esc(i.id)+'"'+((u.instituciones||[]).indexOf(i.id)>=0?' checked':'')+'>'+
        esc(i.nombre.split('"')[0].trim())+'</label>').join('')+
    '</div></div>'+

  '<div class="card"><h3>'+ico('firma')+'Firma y sello digital</h3>'+
    '<p class="mini mb8">Se inserta al pie de las fichas anestésicas y consentimientos que emitas.</p>'+
    '<div class="firma-box"><canvas id="pfFirma"></canvas><div class="hint">Firmá con el dedo o el mouse</div></div>'+
    '<div class="btn-row mt8"><button class="btn ghost chico" id="pfFirmaLimpiar">'+ico('borrar')+' Borrar firma</button></div>'+
  '</div>'+

  /* El comprobante de socio ya no se pide. Los socios que lo cargaron antes
     lo siguen viendo y pueden descargarlo; no se ofrece cargar uno nuevo. */
  (u.comprobante ?
    '<div class="card"><h3>'+ico('adjunto')+'Comprobante de socio AFAAR</h3>'+
      '<div class="aviso ok">'+ico('check')+'<div>'+esc(u.comprobante.nombre)+' — verificado por el coordinador el '+
        fFecha(u.aprobadoEn)+'</div></div>'+
      '<button class="btn ghost chico" id="pfVerComp">'+ico('ojo')+' Ver comprobante</button>'+
    '</div>' : '')+

  '<div class="card"><h3>'+ico('candado')+'Seguridad</h3>'+
    '<div class="grid c2">'+
      '<div class="campo"><label>Contraseña actual</label><input type="password" id="pfC0" autocomplete="current-password"></div>'+
      '<div class="campo"><label>Nueva contraseña</label><input type="password" id="pfC1" autocomplete="new-password"></div>'+
    '</div>'+
    '<button class="btn ghost" id="pfCambiarClave">'+ico('candado')+' Cambiar contraseña</button>'+
  '</div>'+

  '<div class="btn-row mt14"><button class="btn pri grande" id="pfGuardar">'+ico('check')+' Guardar cambios</button>'+
  '<button class="btn ghost grande" id="pfSalir">'+ico('salir')+' Cerrar sesión</button></div>'+
  '<p class="mini txt-c mt20">AFAAR by Yanina Andino · versión '+esc(window.AFAR_BUILD||'')+'</p>';

  $$('#pfInsts .chk').forEach(l => {
    l.onclick = () => setTimeout(() => l.classList.toggle('sel', l.querySelector('input').checked), 0);
  });
  const firma = montarFirma($('#pfFirma'), d => { borradorFirma = d; });
  let borradorFirma = u.firmaDataUrl || '';
  if(u.firmaDataUrl) setTimeout(() => firma.cargar(u.firmaDataUrl), 120);
  $('#pfFirmaLimpiar').onclick = () => { firma.limpiar(); borradorFirma = ''; };

  if($('#pfVerComp')) $('#pfVerComp').onclick = () => verComprobante(u);
  $('#pfCambiarClave').onclick = () => {
    const c0 = $('#pfC0').value, c1 = $('#pfC1').value;
    if(hashClave(c0, u.salt) !== u.passHash) return toast('La contraseña actual no coincide.', 'err');
    if(c1.length < 6) return toast('La nueva contraseña debe tener 6 caracteres o más.', 'err');
    u.salt = Math.random().toString(36).slice(2,12);
    u.passHash = hashClave(c1, u.salt);
    escribir('usuarios', u.uid, u);
    auditar('clave', 'Cambio de contraseña');
    $('#pfC0').value = ''; $('#pfC1').value = '';
    toast('Contraseña actualizada.', 'ok');
  };
  $('#pfGuardar').onclick = () => {
    const g = id => $('#'+id).value.trim();
    Object.assign(u, {
      apellido:g('pfApellido'), nombre:g('pfNombre'), dni:g('pfDni'), fechaNac:g('pfNac'),
      matriculaNacional:g('pfMatNac'), matriculaProvincial:g('pfMatProv'), titulo:g('pfTitulo'),
      telefono:g('pfTel'), cuit:g('pfCuit'), condicionIva:$('#pfIva').value, domicilio:g('pfDomicilio'),
      instituciones: $$('#pfInsts input:checked').map(i => i.value),
      firmaDataUrl: borradorFirma
    });
    escribir('usuarios', u.uid, u);
    USUARIO = u;
    auditar('perfil', 'Actualización de datos de perfil');
    pintarEncabezado();
    toast('Perfil actualizado.', 'ok');
  };
  $('#pfSalir').onclick = () => confirmar('Cerrar sesión',
    '¿Querés salir del portal? Los datos quedan guardados.', cerrarSesion, 'Cerrar sesión');
}

function verComprobante(u){
  const c = u.comprobante;
  if(!c) return toast('Sin comprobante.', 'err');
  const cuerpo = (c.tipo || '').indexOf('pdf') >= 0
    ? '<div class="aviso info">'+ico('archivo')+'<div>'+esc(c.nombre)+' (PDF). Descargalo para verlo.</div></div>'
    : '<img src="'+c.dataUrl+'" style="width:100%;border-radius:10px" alt="Comprobante">';
  abrirModal('Comprobante de socio — ' + (u.apellido||'') + ', ' + (u.nombre||''), cuerpo,
    '<button class="btn ghost" data-cerrar>Cerrar</button>'+
    '<button class="btn pri" id="mdDesc">'+ico('descargar')+' Descargar</button>');
  $('#mdDesc').onclick = () => {
    const a = document.createElement('a');
    a.href = c.dataUrl; a.download = c.nombre || 'comprobante'; a.click();
  };
}

/* ------------------------------------------------- Helpers de formulario */
function campoTxt(id, lbl, val, ro){
  return '<div class="campo"><label>'+esc(lbl)+'</label><input type="text" id="'+id+'" value="'+
         esc(val||'')+'"'+(ro?' disabled':'')+'></div>';
}
function campoFecha(id, lbl, val){
  return '<div class="campo"><label>'+esc(lbl)+'</label><input type="date" id="'+id+'" value="'+esc(val||'')+'"></div>';
}
function campoNum(id, lbl, val, extra){
  return '<div class="campo"><label>'+esc(lbl)+'</label><input type="number" step="any" id="'+id+'" value="'+
         esc(val===undefined||val===null?'':val)+'" '+(extra||'')+'></div>';
}
function campoSel(id, lbl, ops, val){
  return '<div class="campo"><label>'+esc(lbl)+'</label><select id="'+id+'">'+
    ops.map(o => {
      const v = (typeof o === 'object') ? o.v : o, t = (typeof o === 'object') ? o.t : o;
      return '<option value="'+esc(v)+'"'+(String(val)===String(v)?' selected':'')+'>'+esc(t)+'</option>';
    }).join('')+'</select></div>';
}
/* Selector de mes y año con dos desplegables.
   Reemplaza a <input type="month">, que Safaari en Mac no soporta: ahí el campo
   quedaba como una caja de texto vacía, sin ninguna opción. Además, para elegir
   un período de facturación dos listas son más rápidas que un calendario.
   El valor se lee con leerMesAnio(id) y devuelve 'AAAA-MM'. */
function campoMesAnio(id, lbl, val){
  const v = String(val || mesDe(hoyISO()));
  const anio = v.slice(0,4), mes = v.slice(5,7);
  const anios = aniosDisponibles();
  if(anio && anios.indexOf(Number(anio)) < 0) anios.push(Number(anio));
  anios.sort((a,b) => a - b);
  return '<div class="campo campo-mes"><label>'+esc(lbl)+'</label>'+
    '<div class="mes-anio">'+
      '<select id="'+id+'M">'+
        MESES_NOMBRES.map((n,i) => {
          const mm = String(i+1).padStart(2,'0');
          return '<option value="'+mm+'"'+(mm===mes?' selected':'')+'>'+esc(n)+'</option>';
        }).join('')+
      '</select>'+
      '<select id="'+id+'A">'+
        anios.map(a => '<option value="'+a+'"'+(String(a)===anio?' selected':'')+'>'+a+'</option>').join('')+
      '</select>'+
    '</div></div>';
}
function leerMesAnio(id){
  const m = $('#'+id+'M'), a = $('#'+id+'A');
  return (m && a) ? (a.value + '-' + m.value) : '';
}
function cablearMesAnio(id, alCambiar){
  ['M','A'].forEach(s => {
    const e = $('#'+id+s);
    if(e) e.onchange = () => alCambiar(leerMesAnio(id));
  });
}

function campoArea(id, lbl, val, ph){
  return '<div class="campo"><label>'+esc(lbl)+'</label><textarea id="'+id+'" placeholder="'+
         esc(ph||'')+'">'+esc(val||'')+'</textarea></div>';
}
function chksHTML(id, ops, sel){
  sel = sel || [];
  return '<div class="chks" id="'+id+'">'+ ops.map(o =>
    '<label class="chk'+(sel.indexOf(o)>=0?' sel':'')+'"><input type="checkbox" value="'+esc(o)+'"'+
    (sel.indexOf(o)>=0?' checked':'')+'>'+esc(o)+'</label>').join('') +'</div>';
}
function cablearChks(id){
  $$('#'+id+' .chk').forEach(l => {
    l.onclick = () => setTimeout(() => l.classList.toggle('sel', l.querySelector('input').checked), 0);
  });
}
function leerChks(id){ return $$('#'+id+' input:checked').map(i => i.value); }
