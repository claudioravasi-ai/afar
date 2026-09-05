/* =========================================================================
   PASE DE INVITADO — MOSTRARLE LA APLICACION A OTRO COLEGA POR UNA HORA
   -------------------------------------------------------------------------
   Un socio genera una clave, se la manda por correo a otro anestesiologo, y
   ese colega entra a la aplicacion tal como la ve el que lo invito: sus
   pacientes, sus fichas, sus numeros. La visita dura UNA HORA, avisa a los
   diez minutos del final y despues se cierra sola. La clave sirve UNA sola
   vez: quien quiera volver a entrar tiene que pedir otra.

   QUE PUEDE Y QUE NO PUEDE EL INVITADO
   Puede mirar todo lo que ve el socio que lo invito. No puede guardar, ni
   borrar, ni mandar un solo correo. Eso no se consigue apagando botones uno
   por uno —son cientos y siempre queda alguno— sino cortando en el unico
   lugar por donde pasan todos: escribir(), eliminar() y archivoGuardar() en
   core.js preguntan por soloLectura() antes de tocar nada. Un boton nuevo
   que alguien agregue el año que viene queda tapado sin que haya que
   acordarse de nada.

   LO QUE ESTO NO ES
   No es un cerrojo. Todo corre en el navegador del invitado: con las
   herramientas de desarrollador puede frenar el reloj o quedarse con una
   copia de lo que bajo. Contra un colega al que se le quiere mostrar la
   aplicacion, alcanza y sobra; como control de acceso serio, no. Y ademas
   —esto hay que decirlo— el invitado ve historias clinicas de pacientes que
   no lo autorizaron a el (Ley 25.326): la clave se le manda a un colega de
   confianza y para mirar, no se reparte.

   POR QUE LA CLAVE VIVE EN FIREBASE
   Porque el colega entra desde SU computadora. Una clave guardada en el
   telefono del que invita no existiria del otro lado. Va a `afar/pases`, que
   es una rama que nadie escucha en vivo: no viaja en cada arranque como las
   colecciones, se lee de a una y solo cuando alguien escribe una clave.
   ========================================================================= */

const PASE_MINUTOS      = 60;   /* cuanto dura la visita */
const PASE_AVISO_MIN    = 10;   /* cuando se avisa que se termina */
const PASE_VIDA_HORAS   = 72;   /* cuanto tiempo sirve la clave sin usar */
const PASE_LATIDO_MS    = 10000;

/* Alfabeto sin las letras y numeros que se confunden al dictar por telefono:
   sin O ni 0, sin I ni 1, sin L, sin S ni 5. */
const PASE_ALFABETO = 'ABCDEFGHJKMNPQRTUVWXYZ2346789';

let __paseT = null;         /* el reloj de la visita */
let __paseAvisado = false;  /* ya sono el aviso de los diez minutos */

function refPase(clave){
  return (fbDb && clave) ? fbDb.ref('afar/pases/' + clave) : null;
}

/* ---------------------------------------------------------------- Estado */

function esInvitado(){ return !!(SESION && SESION.invitado); }

/* El unico punto por el que se pregunta «¿puedo escribir?». Devuelve true
   —y avisa— cuando NO se puede. Se llama desde escribir(), eliminar() y
   archivoGuardar(), y tambien desde los botones que mandan correos, que no
   pasan por la base. */
function soloLectura(accion){
  if(!esInvitado()) return false;
  toast('Estás mirando la app con un pase de invitado: no se puede ' +
        (accion || 'guardar cambios') + '.', 'warn');
  return true;
}

function minutosDePase(){
  if(!esInvitado() || !SESION.fin) return 0;
  return (new Date(SESION.fin).getTime() - Date.now()) / 60000;
}

/* --------------------------------------------------------- Generar clave */

function nuevaClavePase(){
  const letra = () => PASE_ALFABETO[Math.floor(Math.random() * PASE_ALFABETO.length)];
  const bloque = n => Array.from({length:n}, letra).join('');
  return 'AFAAR-' + bloque(4) + '-' + bloque(4);
}

/* Los pases que emitio el socio que esta adentro. Se guardan en la nube, no
   en el equipo: el que invita puede haber generado la clave en la compu del
   quirofano y querer revocarla desde el telefono. */
function pasesMios(){
  return new Promise(res => {
    if(!fbDb || !SESION) return res([]);
    fbDb.ref('afar/pases').orderByChild('emisorUid').equalTo(SESION.uid)
      .once('value')
      .then(sn => {
        const v = sn.val() || {};
        res(Object.values(v).sort((a,b) => (a.creado < b.creado ? 1 : -1)));
      })
      .catch(() => res([]));
  });
}

/* Una lectura de Firebase que no se puede quedar colgada. Sin esto, el
   colega que escribe la clave con mala señal se queda mirando «Verificando…»
   para siempre y no tiene idea de por que. */
function leerConTope(ref, ms){
  return Promise.race([
    ref.once('value'),
    new Promise((_, rech) => setTimeout(() => rech(new Error('tardó demasiado')), ms || 12000))
  ]);
}

function crearPase(paraEmail){
  if(!fbDb) return Promise.reject(new Error('sin base'));
  const clave = nuevaClavePase();
  const reg = {
    clave,
    emisorUid: SESION.uid,
    emisorNombre: USUARIO ? ((USUARIO.apellido || '') + ', ' + (USUARIO.nombre || '')) : '',
    para: paraEmail || '',
    minutos: PASE_MINUTOS,
    creado: new Date().toISOString(),
    vence: new Date(Date.now() + PASE_VIDA_HORAS * 3600000).toISOString(),
    usado: false,
    revocado: false
  };
  return identificarseEnLaNube()
    .then(() => refPase(clave).set(reg))
    .then(() => { auditar('pase', 'Generó un pase de invitado'); return reg; });
}

function revocarPase(clave){
  return identificarseEnLaNube()
    .then(() => refPase(clave).update({ revocado:true,
                                        revocadoEn:new Date().toISOString() }))
    .then(() => auditar('pase', 'Revocó un pase de invitado'));
}

/* Estado legible de un pase, para la lista del que invita */
function estadoPase(p){
  if(p.revocado) return { txt:'Anulado', cls:'' };
  if(p.usado){
    const queda = p.fin ? (new Date(p.fin).getTime() - Date.now()) / 60000 : -1;
    if(queda > 0) return { txt:'En uso · faltan ' + Math.ceil(queda) + ' min', cls:'ok' };
    return { txt:'Ya se usó', cls:'' };
  }
  if(p.vence && new Date(p.vence).getTime() < Date.now())
    return { txt:'Venció sin usarse', cls:'warn' };
  return { txt:'Sin usar', cls:'aqua' };
}

/* ------------------------------------------------------------- Canjearla */

/* Devuelve una promesa con { ok:true } o { ok:false, motivo:'…' }.
   Marcar la clave como usada y abrir la sesion son el mismo paso: si se
   quemara antes y despues fallara algo, el colega se quedaria sin pase y sin
   entrar. */
function canjearPase(claveCruda){
  const clave = String(claveCruda || '').trim().toUpperCase().replace(/\s+/g, '');
  if(!/^AFAAR-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(clave))
    return Promise.resolve({ ok:false, motivo:'Esa clave no tiene la forma de un pase. '+
      'Son quince caracteres, así: AFAAR-XXXX-XXXX.' });

  return identificarseEnLaNube().then(() => {
    if(!fbDb)
      return { ok:false, motivo:'Esta copia de la aplicación no está conectada a la base '+
        'compartida, así que no puede validar pases.' };
    return leerConTope(refPase(clave)).then(sn => {
      const p = sn.val();
      if(!p) return { ok:false, motivo:'Esa clave no existe. Revisá que esté copiada entera.' };
      if(p.revocado) return { ok:false, motivo:'El colega que te la mandó anuló este pase.' };
      if(p.usado)    return { ok:false, motivo:'Este pase ya se usó. Cada clave sirve una '+
        'sola vez: pedile otra a tu colega.' };
      if(p.vence && new Date(p.vence).getTime() < Date.now())
        return { ok:false, motivo:'Esta clave venció sin usarse. Pedile otra a tu colega.' };

      /* El invitado puede estar entrando en una computadora que abre la app
         por primera vez: la copia local de los usuarios todavia no bajo. Si
         no esta, se lo pregunta a la base antes de dar por perdido el pase. */
      const local = DB.usuarios[p.emisorUid];
      const traerAnfitrion = local
        ? Promise.resolve(local)
        : leerConTope(fbDb.ref('afar/usuarios/' + p.emisorUid)).then(s2 => s2.val());

      return traerAnfitrion.then(u => {
        if(!u || u.estado !== 'aprobado')
          return { ok:false, motivo:'La cuenta del colega que te invitó ya no está habilitada.' };
        if(!DB.usuarios[p.emisorUid]) DB.usuarios[p.emisorUid] = u;

        const fin = new Date(Date.now() + (p.minutos || PASE_MINUTOS) * 60000).toISOString();
        return refPase(clave).update({
          usado:true, usadoEn:new Date().toISOString(), fin
        }).then(() => {
          SESION = { uid:p.emisorUid, rol:'socio', invitado:true, pase:clave, fin };
          USUARIO = u;
          localStorage.setItem(LS_SES, JSON.stringify(SESION));
          auditar('pase', 'Entró un invitado con un pase de una hora');
          return { ok:true, pase:p };
        });
      });
    });
  }).catch(e => {
    console.warn('pase', e);
    return { ok:false, motivo:'No se pudo validar el pase. Revisá la conexión.' };
  });
}

/* ------------------------------------------------------- Reloj y franja */

function arrancarRelojPase(){
  clearInterval(__paseT);
  if(!esInvitado()) return;
  __paseAvisado = false;
  pintarFranjaInvitado();
  __paseT = setInterval(pulsoPase, PASE_LATIDO_MS);
}
function pararRelojPase(){
  clearInterval(__paseT);
  __paseT = null;
  const f = $('#franjaInvitado');
  if(f){ f.style.display = 'none'; f.innerHTML = ''; }
  document.documentElement.style.setProperty('--franja-h', '0px');
}

/* El corazon de la cuenta regresiva. Compara contra una hora ABSOLUTA, no
   contra un contador que se va restando: si el invitado deja la pestaña de
   fondo, el navegador congela los temporizadores y un contador se atrasaria
   tanto como la siesta. Con una fecha fija, vuelve y ya esta vencido. */
function pulsoPase(){
  if(!esInvitado()) return pararRelojPase();
  const min = minutosDePase();
  pintarFranjaInvitado();
  if(min <= 0) return terminarPase();
  if(min <= PASE_AVISO_MIN && !__paseAvisado){
    __paseAvisado = true;
    avisarFinDePase(Math.max(1, Math.ceil(min)));
  }
}

function pintarFranjaInvitado(){
  const f = $('#franjaInvitado');
  if(!f) return;
  if(!esInvitado()){
    f.style.display = 'none';
    document.documentElement.style.setProperty('--franja-h', '0px');
    return;
  }
  /* La barra de arriba y el cajon lateral se apoyan sobre esta medida, y se
     mide en vez de fijarla: en un telefono angosto el texto de la franja
     pasa a dos renglones y una medida escrita a mano dejaria la barra
     montada encima. Se recalcula al final, con la franja ya dibujada. */
  const medir = () => document.documentElement.style.setProperty(
    '--franja-h', Math.ceil(f.getBoundingClientRect().height) + 'px');
  const min = minutosDePase();
  const seg = Math.max(0, Math.floor(min * 60));
  const mm = String(Math.floor(seg / 60)).padStart(2, '0');
  const ss = String(seg % 60).padStart(2, '0');
  const urgente = min <= PASE_AVISO_MIN;
  f.style.display = '';
  f.classList.toggle('urgente', urgente);
  f.innerHTML = ico('reloj') +
    '<span>Pase de invitado · estás viendo el portal de ' +
      esc(USUARIO ? ((USUARIO.apellido || '') + ', ' + (USUARIO.nombre || '')) : 'un colega') +
      ' · <b>solo lectura</b></span>' +
    '<span class="reloj">' + mm + ':' + ss + '</span>';
  medir();
}

/* El aviso de los diez minutos: sonido y cartel. El sonido puede sonar
   porque el invitado entro con un clic, y ese gesto ya habilito el audio del
   navegador. Si igual lo bloquea, queda el cartel. */
function avisarFinDePase(min){
  if(typeof tocarAlarmaBaja === 'function') tocarAlarmaBaja();
  abrirModal('La visita se termina en ' + min + ' minuto' + (min === 1 ? '' : 's'),
    '<div class="aviso warn">' + ico('reloj') + '<div><b>El pase que estás usando dura una '+
      'hora y ya está por cumplirse.</b> Cuando llegue a cero la aplicación se cierra sola '+
      'y vuelve a la pantalla de acceso.</div></div>'+
    '<p style="line-height:1.65">Si querés seguir mirando, pedile otra clave a ' +
      esc(USUARIO ? ((USUARIO.apellido || '') + ', ' + (USUARIO.nombre || '')) : 'tu colega') +
      '. Cada clave sirve una sola vez, así que la que estás usando no se puede reactivar.</p>'+
    '<p class="mini">No hay nada que guardar antes de salir: durante la visita la aplicación '+
      'no escribió nada.</p>',
    '<button class="btn pri" data-cerrar>Entendido</button>');
}

function terminarPase(){
  pararRelojPase();
  const nombre = USUARIO ? ((USUARIO.apellido || '') + ', ' + (USUARIO.nombre || '')) : 'tu colega';
  cerrarSesion(true);
  abrirModal('Se terminó la hora del pase',
    '<div class="aviso info">' + ico('candado') + '<div><b>La visita duró una hora y se '+
      'cerró sola.</b> La clave que usaste ya no sirve.</div></div>'+
    '<p style="line-height:1.65">Para volver a entrar pedile otra clave a ' + esc(nombre) +
      '. Te la puede mandar por correo desde <b>Ajustes › Compartir mi ingreso</b>.</p>',
    '<button class="btn pri" data-cerrar>Cerrar</button>');
}

/* ======================================================================
   LA VENTANA DEL QUE INVITA — Ajustes › Compartir mi ingreso
   ====================================================================== */

function abrirCompartirIngreso(){
  if(esInvitado())
    return toast('Un invitado no puede invitar a otro.', 'warn');

  abrirModal('Compartir mi ingreso por única vez',
    '<div class="aviso warn">' + ico('alerta') + '<div><b>Leé esto antes de generar una '+
      'clave.</b> Quien la use entra a <b>tu</b> portal y ve <b>tus</b> pacientes y tus '+
      'fichas, que son historias clínicas de gente que no lo autorizó a él (Ley 25.326). '+
      'No puede guardar, borrar ni mandar correos, pero sí puede leer. Mandásela a un colega '+
      'de confianza y para mostrarle la aplicación, no la repartas.</div></div>'+

    '<div class="hist-lista" style="margin-bottom:14px">'+
      '<div class="par"><span class="k">Dura</span><span class="v">Una hora desde que entra, '+
        'con aviso a los ' + PASE_AVISO_MIN + ' minutos del final</span></div>'+
      '<div class="par"><span class="k">Sirve</span><span class="v">Una sola vez. Después hay '+
        'que generar otra</span></div>'+
      '<div class="par"><span class="k">Caduca</span><span class="v">A las ' + PASE_VIDA_HORAS +
        ' horas si nadie la usa</span></div>'+
      '<div class="par"><span class="k">Permite</span><span class="v">Mirar. No guardar, no '+
        'borrar, no enviar</span></div>'+
    '</div>'+

    '<div id="paseCuerpo"><div class="mini">Cargando los pases que emitiste…</div></div>',
    '<button class="btn ghost" data-cerrar>Cerrar</button>'+
    '<button class="btn pri" id="paseNuevo">' + ico('llave') + ' Generar una clave</button>',
    '620px');

  $('#paseNuevo').onclick = generarYMostrarPase;
  pintarListaPases();
}

function pintarListaPases(){
  const c = $('#paseCuerpo');
  if(!c) return;
  if(!(nubeOK && fbDb)){
    c.innerHTML = '<div class="aviso warn">' + ico('nube') + '<div><b>Sin conexión con la '+
      'base compartida.</b> La clave tiene que quedar guardada en la nube para que el colega '+
      'la pueda usar desde su computadora. Conectate y volvé a entrar acá.</div></div>';
    const b = $('#paseNuevo'); if(b) b.disabled = true;
    return;
  }
  pasesMios().then(l => {
    const c2 = $('#paseCuerpo');
    if(!c2) return;
    const vivos = l.slice(0, 8);
    if(!vivos.length){
      c2.innerHTML = '<p class="mini">Todavía no generaste ninguna clave.</p>';
      return;
    }
    c2.innerHTML = '<h4 class="sec-t" style="margin-top:0">Las últimas que generaste</h4>'+
      '<div class="hist-lista">' + vivos.map(p => {
        const e = estadoPase(p);
        const puedeAnular = !p.revocado && !p.usado;
        return '<div class="par">'+
          '<span class="k" style="font-family:var(--mono)">' + esc(p.clave) + '</span>'+
          '<span class="v">' + (p.para ? esc(p.para) + ' · ' : '') +
            '<span class="tag ' + e.cls + '">' + esc(e.txt) + '</span>' +
            (puedeAnular ? ' <button class="btn ghost chico" data-anular="' + esc(p.clave) +
                           '">Anular</button>' : '') +
          '</span></div>';
      }).join('') + '</div>';
    $$('[data-anular]').forEach(b => b.onclick = () => {
      b.disabled = true;
      revocarPase(b.dataset.anular).then(() => {
        toast('Clave anulada.', 'ok');
        pintarListaPases();
      }).catch(() => { b.disabled = false; toast('No se pudo anular.', 'err'); });
    });
  });
}

function generarYMostrarPase(){
  const b = $('#paseNuevo');
  if(b){ b.disabled = true; b.innerHTML = ico('reloj') + ' Generando…'; }
  crearPase('').then(reg => {
    abrirModalEncima(abrirCompartirIngreso, () => mostrarPaseGenerado(reg));
  }).catch(e => {
    console.warn('pase', e);
    if(b){ b.disabled = false; b.innerHTML = ico('llave') + ' Generar una clave'; }
    toast('No se pudo generar la clave. Revisá la conexión.', 'err');
  });
}

function mostrarPaseGenerado(reg){
  abrirModal('Clave lista',
    '<p style="margin:0 0 4px">Esta es la clave. Dura una hora <b>desde que el colega '+
      'entra</b>, no desde ahora, y sirve una sola vez.</p>'+
    '<div class="clave-pase">' + esc(reg.clave) + '</div>'+

    '<div class="btn-row" style="flex-wrap:wrap;margin-bottom:16px">'+
      '<button class="btn ghost" id="paseCopiar">' + ico('copiar') + ' Copiar la clave</button>'+
    '</div>'+

    (envioConfigurado()
      ? '<h4 class="sec-t" style="margin-top:0">Mandársela por correo</h4>'+
        '<div class="campo"><label>Correo del colega</label>'+
          '<input type="email" id="paseMail" inputmode="email" placeholder="colega@correo.com" '+
          'autocomplete="off"></div>'+
        '<div class="campo"><label>Nota (opcional)</label>'+
          '<input type="text" id="paseNota" placeholder="Mirá el paso 3 de la ficha, que es '+
          'el que te decía" autocomplete="off"></div>'+
        '<button class="btn pri full" id="paseEnviar">' + ico('correo') +
          ' Enviar la clave</button>'
      : '<div class="aviso warn">' + ico('alerta') + '<div><b>El envío de correo no está '+
        'configurado.</b> Copiá la clave y mandásela por donde prefieras.</div></div>')+

    '<p class="mini" style="margin-top:14px">También se la podés mandar por los mensajes '+
      'internos de la app, si tu colega ya es socio.</p>',
    '<button class="btn pri" data-cerrar>Listo</button>', '560px');

  const bc = $('#paseCopiar');
  if(bc) bc.onclick = () => {
    if(navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(reg.clave)
        .then(() => toast('Clave copiada.', 'ok'))
        .catch(() => toast('No se pudo copiar. Anotala a mano.', 'err'));
    else toast('Este navegador no deja copiar solo. Anotala a mano.', 'warn');
  };

  const be = $('#paseEnviar');
  if(be) be.onclick = () => {
    const mail = String(($('#paseMail') || {}).value || '').trim().toLowerCase();
    const nota = String(($('#paseNota') || {}).value || '').trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail))
      return toast('Ese correo no parece válido.', 'err');
    be.disabled = true; be.innerHTML = ico('reloj') + ' Enviando…';
    const restaurar = () => { be.disabled = false;
      be.innerHTML = ico('correo') + ' Enviar la clave'; };
    fetch(ENVIO_URL, {
      method:'POST', redirect:'follow',
      body: JSON.stringify({
        clave: ENVIO_CLAVE, para: mail,
        nombre: typeof ENVIO_NOMBRE !== 'undefined' ? ENVIO_NOMBRE : 'AFAAR',
        asunto: 'Te comparto el acceso a AFAAR por una hora',
        html: htmlMailPase(reg, nota)
      })
    })
      .then(r => r.json())
      .then(res => {
        restaurar();
        if(!res || !res.ok) return toast('No se pudo enviar. Revisá el correo.', 'err');
        if(nubeOK && fbDb) refPase(reg.clave).update({ para:mail }).catch(() => {});
        toast('Clave enviada a ' + mail + '.', 'ok');
      })
      .catch(() => { restaurar(); toast('No se pudo enviar. Revisá la conexión.', 'err'); });
  };
}

function htmlMailPase(reg, nota){
  const url = location.origin + location.pathname;
  return ''+
  '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;'+
    'max-width:560px;margin:0 auto;color:#0f2033;line-height:1.6">'+
    '<p style="font-size:20px;font-weight:800;letter-spacing:.12em;margin:0">AFAAR</p>'+
    '<p style="color:#7c8fa3;font-size:12px;margin:2px 0 18px">Asociación Fueguina de '+
      'Anestesia, Analgesia y Reanimación</p>'+
    '<h2 style="font-size:18px;margin:0 0 8px">' + esc(reg.emisorNombre) +
      ' te comparte el acceso por una hora</h2>'+
    (nota ? '<p style="background:#f4f7fb;border-left:3px solid #14b8a6;padding:9px 12px;'+
            'margin:0 0 12px">' + esc(nota) + '</p>' : '')+
    '<p style="margin:0 0 14px">Con esta clave podés entrar a la aplicación y mirarla como '+
      'la ve tu colega. La visita dura <b>una hora</b> desde que entrás, te avisa diez '+
      'minutos antes del final y después se cierra sola.</p>'+
    '<p style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:23px;'+
      'font-weight:700;letter-spacing:.16em;text-align:center;background:#f4f7fb;'+
      'border:1px dashed #c3d2e2;border-radius:14px;padding:15px 10px;margin:0 0 16px">'+
      esc(reg.clave) + '</p>'+
    '<p style="margin:0 0 16px"><a href="' + esc(url) + '" style="background:#1b4e85;'+
      'color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;'+
      'display:inline-block;font-weight:700">Abrir AFAAR</a></p>'+
    '<p style="margin:0 0 14px;font-size:13px;color:#4a6076">En la pantalla de acceso, '+
      'tocá <b>«Entré con una clave de invitado»</b> y pegá la clave.</p>'+
    '<p style="font-size:12.5px;color:#4a6076;background:#fef3c7;border-radius:10px;'+
      'padding:11px 13px;margin:0">Durante la visita vas a ver historias clínicas reales. '+
      'Es una demostración: mirá lo que quieras, la aplicación no te va a dejar guardar ni '+
      'enviar nada. Lo que veas está amparado por el secreto profesional (Ley 17.132) y por '+
      'la Ley 25.326 de protección de datos personales.</p>'+
    '<p style="font-size:11.5px;color:#7c8fa3;border-top:1px solid #dbe4ee;margin-top:18px;'+
      'padding-top:12px">La clave sirve una sola vez. Si se te termina la hora y querés '+
      'volver a entrar, pedile otra a ' + esc(reg.emisorNombre) + '.</p>'+
  '</div>';
}

/* ======================================================================
   LA PANTALLA DEL INVITADO — se entra desde el acceso
   ====================================================================== */

function abrirIngresoInvitado(){
  abrirModal('Entrar con una clave de invitado',
    '<p style="margin:0 0 12px;line-height:1.65">Si un colega socio de la AFAAR te compartió '+
      'una clave, pegala acá. Vas a ver la aplicación como la ve él, durante una hora.</p>'+
    '<div class="campo"><label>Clave</label>'+
      '<input type="text" id="inPase" placeholder="AFAAR-XXXX-XXXX" autocomplete="off" '+
      'autocapitalize="characters" spellcheck="false" '+
      'style="font-family:var(--mono);letter-spacing:.12em;text-transform:uppercase"></div>'+
    '<div class="aviso info">' + ico('info') + '<div>La visita es de <b>solo lectura</b>: '+
      'podés recorrer todo, pero la aplicación no te va a dejar guardar, borrar ni enviar '+
      'nada. Y la clave sirve una sola vez.</div></div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="paseEntrar">' + ico('candado') + ' Entrar</button>');

  const i = $('#inPase');
  if(i){
    i.focus();
    i.onkeydown = e => { if(e.key === 'Enter') $('#paseEntrar').click(); };
  }
  $('#paseEntrar').onclick = () => {
    const b = $('#paseEntrar');
    b.disabled = true; b.innerHTML = ico('reloj') + ' Verificando…';
    canjearPase(($('#inPase') || {}).value).then(r => {
      if(!r.ok){
        b.disabled = false; b.innerHTML = ico('candado') + ' Entrar';
        return toast(r.motivo, 'err');
      }
      cerrarModal();
      arrancarApp();
      setTimeout(() => abrirModal('Bienvenido',
        '<div class="aviso ok">' + ico('check') + '<div><b>Estás adentro por una hora.</b> '+
          'El reloj de arriba te dice cuánto falta y vas a tener un aviso cuando queden ' +
          PASE_AVISO_MIN + ' minutos.</div></div>'+
        '<p style="line-height:1.65">Recorré lo que quieras. Es una visita de <b>solo '+
          'lectura</b>: si tocás guardar en algún lado, la aplicación te lo va a decir en vez '+
          'de escribir.</p>',
        '<button class="btn pri" data-cerrar>Empezar</button>'), 450);
    });
  };
}
