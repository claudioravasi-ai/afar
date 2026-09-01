/* =========================================================================
   LA FICHA QUE COMPLETA EL PACIENTE EN SU CASA
   =========================================================================
   QUE RESUELVE

   La entrevista prequirurgica se va en interrogatorio: apellido, documento,
   domicilio, obra social, que enfermedades tuvo, que operaciones, que toma,
   a que es alergico, si fuma. Media hora de consulta gastada en transcribir
   datos que el paciente sabe de memoria y que podria haber escrito tranquilo
   en su casa, con la caja de los remedios sobre la mesa.

   Ahora el anestesiologo puede mandarle la ficha en blanco por mail. El
   paciente entra con un enlace, completa dos secciones, toca FINALIZADO, y
   lo que escribio le llega al anestesiologo para que lo revise antes de la
   consulta.

   LO QUE EL PACIENTE VE Y LO QUE NO

   Ve dos pantallas y nada mas: sus datos de filiacion y las preguntas de
   salud que puede contestar el mismo. No ve la aplicacion, no ve otras
   fichas, no ve otros pacientes, no hay barra lateral ni menu: en modo
   paciente la app entera queda oculta y solo se dibuja el portal.

   No ve NI PUEDE VER: el examen fisico, la via aerea, las escalas de riesgo,
   el ASA, el plan anestesico, el consentimiento, ningun honorario y ninguna
   otra ficha. Nada de eso lo contesta un paciente y nada de eso le compete.

   LO QUE ESCRIBE NO PISA LA HISTORIA CLINICA

   Esto es lo mas importante del archivo. Lo que el paciente carga NO entra
   solo en su historia: llega como una PROPUESTA que el anestesiologo revisa
   campo por campo y decide si incorpora. Una historia clinica la escribe un
   profesional; el paciente aporta, no redacta. Ademas evita el problema
   obvio: el paciente que se confunde y dice que no toma anticoagulantes.

   POR DONDE VIAJA

   Por un nodo aparte de la base, `afar-prellenado/<token>`, que NO cuelga del
   arbol clinico `afar`. El token son 32 caracteres al azar y va en el enlace
   del mail: quien lo tiene puede escribir en ESE pedido y en ninguno mas.
   El navegador del paciente nunca toca la historia clinica de nadie.

   El pedido vence a los 30 dias y, una vez finalizado, no se puede volver a
   escribir: si el paciente quiere corregir algo, el anestesiologo manda un
   pedido nuevo.

   LAS REGLAS DE LA BASE QUE ESTO NECESITA
   Estan escritas en reglas-firebase.txt, en la seccion del prellenado. Sin
   pegarlas en la consola de Firebase, el portal no puede guardar y avisa.
   ========================================================================= */

const PRELLENADO_RAIZ  = 'afar-prellenado';
const PRELLENADO_DIAS  = 30;

let portalPedido = null;      /* el pedido que el paciente esta completando */
let portalPaso   = 'datos';   /* 'datos' | 'salud' | 'fin' */
let portalSel    = { antecedentes:[], quirurgicos:[], anestesicos:[], familiares:[],
                     medicacion:[], alergias:[] };

/* ------------------------------------------------------------- Utilidades */
function tokenPrellenado(){
  const a = 'abcdefghijkmnopqrstuvwxyz0123456789';
  let t = '';
  for(let i = 0; i < 32; i++) t += a[Math.floor(Math.random() * a.length)];
  return t;
}

function urlPortalPaciente(token){
  return location.origin + location.pathname + '#p=' + token;
}

function refPrellenado(token){
  return (fbDb && token) ? fbDb.ref(PRELLENADO_RAIZ + '/' + token) : null;
}

function tokenDeLaUrl(){
  const m = String(location.hash || '').match(/^#p=([a-z0-9]{20,64})$/i);
  return m ? m[1] : '';
}

/* =========================================================================
   LADO ANESTESIOLOGO
   ========================================================================= */

/* Estado del pedido de esta ficha, para el sello del paso Paciente */
function estadoPrellenado(f){
  const pr = (f && f.prellenado) || null;
  if(!pr || !pr.token) return 'no';
  if(pr.estado === 'incorporado') return 'incorporado';
  if(pr.estado === 'finalizado')  return 'finalizado';
  if(pr.vence && pr.vence < hoyISO()) return 'vencido';
  return 'pendiente';
}

/* El sello que se ve debajo de PACIENTE en el recorrido de la ficha */
function selloPrellenado(f){
  const e = estadoPrellenado(f);
  if(e === 'no') return '';
  const t = { pendiente:  ['warn',  'Pendiente: se envió ficha por mail'],
              finalizado: ['ok',    'El paciente completó la ficha'],
              incorporado:['ok',    'Ficha del paciente incorporada'],
              vencido:    ['danger','El enlace enviado al paciente venció'] }[e];
  return '<div class="sello-prellenado ' + t[0] + '">' + ico(
    e === 'pendiente' ? 'reloj' : (e === 'vencido' ? 'alerta' : 'check')) +
    esc(t[1]) + '</div>';
}

/* --------------------------------------------------- Crear y mandar */
function enviarFichaEnBlancoAlPaciente(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const prof = DB.usuarios[f.ownerUid] || USUARIO || {};

  if(!f.pacienteId) return toast('La ficha todavía no tiene paciente.', 'err');
  if(!p.email)      return toast('El paciente no tiene correo cargado. Es obligatorio: '+
                                 'cargalo en sus datos de filiación.', 'err');
  if(!envioConfigurado())
    return toast('El envío por mail todavía no está configurado. Ver ENVIO-DE-MAILS.md', 'err');
  if(!fbDb || !nubeOK)
    return toast('Para que la ficha del paciente vuelva sola hace falta la base compartida '+
                 'en línea. Reintentá cuando el indicador diga «En línea».', 'err');

  const ya = estadoPrellenado(f);
  const rehacer = (ya === 'pendiente' || ya === 'finalizado' || ya === 'incorporado');

  confirmar('Enviarle la ficha al paciente para que la complete',
    (rehacer
      ? '<div class="aviso warn">' + ico('alerta') + '<div><b>Ya hay un pedido para esta ficha.</b> '+
        'Si mandás otro, el enlace anterior deja de servir y lo que el paciente haya cargado con '+
        'ése se pierde.</div></div>'
      : '')+
    'Se le manda a <b>' + esc(p.email) + '</b> un correo con un <b>enlace personal</b> para que '+
    'complete su ficha <b>dentro de la aplicación</b>, desde el teléfono o la computadora. No '+
    'tiene que instalar nada ni crear ninguna cuenta.<br><br>'+
    'El enlace le abre <b>únicamente</b> sus datos de filiación y las preguntas de salud que '+
    'puede contestar él. No da acceso a ninguna otra parte de la aplicación, ni a la valoración, '+
    'ni a ninguna otra ficha.<br><br>'+
    'Lo que escriba viaja derecho a esta ficha: no hay papel ni transcripción en el medio.<br><br>'+
    'Lo que complete <b>no entra solo en su historia</b>: te llega para que lo revises y decidas '+
    'qué incorporar.<br><br>'+
    'El enlace vence en <b>' + PRELLENADO_DIAS + ' días</b>.',
    async () => {
      const token = tokenPrellenado();
      const vence = fechaMasDias(hoyISO(), PRELLENADO_DIAS);
      const pedido = {
        token, fichaId: f.id, pacienteId: f.pacienteId,
        creado: new Date().toISOString(), vence, estado: 'pendiente',
        institucion: nombreInstitucion(f.institucion) || '',
        cirugia: textoProcedimientos(f) || f.cirugia || '',
        profesional: { nombre: (prof.apellido || '') + ', ' + (prof.nombre || ''),
                       matricula: matriculaTxt(prof.matriculaProvincial, 'M.P.') || '',
                       email: prof.email || '' },
        /* Lo poco que ya se sabe, para que no lo tipee de nuevo */
        datos: { apellido: p.apellido || '', nombre: p.nombre || '', dni: p.dni || '',
                 email: p.email || '' }
      };

      toast('Creando el pedido y enviando el correo…');
      try{
        await refPrellenado(token).set(pedido);
      }catch(e){
        console.warn('prellenado', e);
        return toast('La base rechazó el pedido. Faltan las reglas del prellenado: '+
                     'ver reglas-firebase.txt.', 'err');
      }

      const enlace = urlPortalPaciente(token);
      try{
        const r = await fetch(ENVIO_URL, {
          method: 'POST', redirect: 'follow',
          body: JSON.stringify({
            clave: ENVIO_CLAVE, para: p.email,
            responderA: prof.email || '',
            nombre: typeof ENVIO_NOMBRE !== 'undefined' ? ENVIO_NOMBRE : 'AFAAR',
            asunto: 'Complete su ficha antes de la consulta prequirúrgica — ' +
                    (p.apellido || '') + ', ' + (p.nombre || ''),
            html: htmlMailFichaEnBlanco(f, prof, enlace),
            /* Sin adjuntos a proposito: el paciente completa DENTRO de la
               app, con el enlace. Un PDF en blanco lo obligaria a imprimir,
               escribir a mano y que alguien lo transcriba, que es exactamente
               el trabajo que esta funcion viene a sacar del medio. */
            fichaId: f.id,
            profesional: (prof.apellido || '') + ', ' + (prof.nombre || '')
          })
        });
        const res = await r.json();
        if(!res || !res.ok) throw new Error((res && res.error) || 'sin respuesta');
      }catch(e){
        try{ await refPrellenado(token).remove(); }catch(e2){}
        return toast('No se pudo enviar el correo: ' + e.message, 'err');
      }

      f.prellenado = { token, estado:'pendiente', enviado:new Date().toISOString(),
                       vence, a:p.email };
      guardarPedidoEnLaFicha(f);
      auditar('prellenado-enviado',
        'Ficha en blanco enviada a ' + p.email + ' (ficha ' + f.id + ')');
      toast('Enviado a ' + p.email + '. El paso Paciente queda marcado como pendiente.', 'ok');
      pintarFicha();
      escucharPrellenado(f);
    });
}

/* El pedido vive en la ficha, no en una coleccion aparte: es un estado de
   ESA ficha. Se escribe directo para no arrastrar todo el guardado del paso,
   que valida cosas que aca no vienen al caso. */
function guardarPedidoEnLaFicha(f){
  const g = DB.fichas[f.id];
  if(g) g.prellenado = f.prellenado;
  escribir('fichas', f.id, g || f);
}

/* Suma dias a una fecha ISO. El opuesto de fechaMenosDias() de periop.js. */
function fechaMasDias(iso, n){
  if(!iso) return '';
  const d = new Date(String(iso).slice(0,10) + 'T12:00:00');
  if(isNaN(d)) return '';
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0,10);
}

/* --------------------- Escuchar la vuelta del paciente --------------- */
let escuchaPrellenado = null;
function escucharPrellenado(f){
  if(escuchaPrellenado){ try{ escuchaPrellenado.off(); }catch(e){} escuchaPrellenado = null; }
  const pr = (f && f.prellenado) || null;
  if(!pr || !pr.token || !fbDb) return;
  if(pr.estado === 'incorporado') return;

  const ref = refPrellenado(pr.token);
  escuchaPrellenado = ref;
  ref.on('value', sn => {
    const d = sn.val();
    if(!d) return;
    if(d.estado === 'finalizado' && f.prellenado.estado !== 'finalizado'){
      f.prellenado.estado = 'finalizado';
      f.prellenado.finalizado = d.finalizado || new Date().toISOString();
      guardarPedidoEnLaFicha(f);
      toast('El paciente completó su ficha. Revisala antes de la consulta.', 'ok');
      if(fichaActual && fichaActual.id === f.id) pintarFicha();
    }
  });
}

/* ------------------------ Revisar e incorporar ----------------------- */
function revisarPrellenado(f){
  const pr = (f && f.prellenado) || {};
  if(!pr.token) return;
  toast('Buscando lo que cargó el paciente…');
  refPrellenado(pr.token).once('value').then(sn => {
    const d = sn.val();
    if(!d || d.estado !== 'finalizado')
      return toast('El paciente todavía no finalizó su ficha.', 'warn');
    abrirRevisionPrellenado(f, d);
  }).catch(() => toast('No se pudo leer la respuesta del paciente.', 'err'));
}

function abrirRevisionPrellenado(f, d){
  const p = DB.pacientes[f.pacienteId] || {};
  abrirRevisionDatosPaciente(p, d, marcados => {
    const n = incorporarDatosDePaciente(p, d, marcados);
    f.prellenado = Object.assign({}, f.prellenado, {
      estado:'incorporado', incorporado:new Date().toISOString() });
    guardarPedidoEnLaFicha(f);
    auditar('prellenado-incorporado',
      n + ' dato(s) aportados por el paciente incorporados a su historia (ficha ' + f.id + ')');
    cerrarModal();
    toast(n ? (n + ' dato' + (n===1?'':'s') + ' incorporado' + (n===1?'':'s') +
               ' a la historia del paciente.')
            : 'No se incorporó nada.', n ? 'ok' : 'warn');
    pintarFicha();
  });
}

/* =========================================================================
   LA REVISION, COMPARTIDA POR LOS DOS CAMINOS DE ENTRADA
   -------------------------------------------------------------------------
   La usan el portal por invitacion y la precarga abierta de precarga.js. Es
   la pantalla donde un profesional decide, campo por campo, que entra a la
   historia clinica. Es el unico lugar por el que pasan los datos que escribio
   un paciente, y por eso vale la pena que sea uno solo: si hubiera dos, en
   algun momento una de las dos deja de preguntar algo.

   `p`   el paciente destino (puede ser uno nuevo, todavia sin guardar)
   `d`   { datos, salud, finalizado }
   `alConfirmar(marcados)`  que hacer con lo tildado
   ========================================================================= */
function abrirRevisionDatosPaciente(p, d, alConfirmar){
  p = p || {};
  const dat = d.datos || {}, sal = d.salud || {};

  /* Cada campo con su valor actual y el que propone el paciente. Se marcan
     solo los que CAMBIAN algo: mostrar cincuenta filas iguales es ruido. */
  const campos = [
    ['apellido','Apellido'], ['nombre','Nombre'], ['dni','DNI'],
    ['fechaNac','Fecha de nacimiento'], ['sexo','Sexo'],
    ['peso','Peso (kg)'], ['talla','Talla (cm)'],
    ['telefono','Teléfono'], ['email','Correo'], ['grupoSanguineo','Grupo y factor'],
    ['domicilio','Domicilio'], ['localidad','Localidad'],
    ['contactoEmergencia','Contacto de emergencia'], ['ocupacion','Ocupación']
  ].filter(c => dat[c[0]] && String(dat[c[0]]).trim() &&
                String(dat[c[0]]).trim() !== String(p[c[0]] || '').trim());

  const listas = [
    ['antecedentes','Antecedentes de salud', sal.antecedentes],
    ['quirurgicos','Cirugías anteriores',    sal.quirurgicos],
    ['anestesicos','Con anestesias previas', sal.anestesicos],
    ['familiares','En la familia',           sal.familiares],
    ['medicacion','Medicación que toma',     (sal.medicacion || []).map(m => m.n || m)],
    ['alergias','Alergias',                  sal.alergias]
  ].filter(x => (x[2] || []).length);

  const textos = [
    ['antecedentesOtros','Otras cosas de su salud', sal.antecedentesOtros],
    ['medicacionOtros','Otra medicación',           sal.medicacionOtros],
    ['alergiaDetalle','Detalle de las alergias',    sal.alergiaDetalle]
  ].filter(x => x[2]);

  const hab = sal.habitos || {};
  const hayHab = hab.tabaco || hab.alcohol || hab.drogas || hab.actividad;

  const chk = (id, etq, cuerpo) =>
    '<label class="chk" style="width:100%;align-items:flex-start;border-radius:9px;margin-bottom:6px">'+
      '<input type="checkbox" class="prellChk" data-k="' + esc(id) + '" checked>'+
      '<span style="min-width:0"><b>' + esc(etq) + '</b><br>'+
      '<span class="mini" style="font-weight:400">' + cuerpo + '</span></span></label>';

  abrirModal('Lo que cargó ' + esc(p.nombre || p.apellido || 'el paciente'),
    '<div class="aviso warn">' + ico('alerta') + '<div><b>Esto lo escribió el paciente, no un '+
      'profesional.</b> Leelo y destildá lo que no corresponda: sólo se incorpora a la historia '+
      'clínica lo que dejes marcado. Nada se guarda sin que lo confirmes.</div></div>'+

    (d.finalizado ? '<div class="mini mb8">Completada el ' + fFecha(d.finalizado.slice(0,10)) +
      '.</div>' : '')+

    (campos.length
      ? '<h4 class="mini strong mt14">Datos de filiación</h4>'+
        campos.map(c => chk('dato:' + c[0], c[1],
          (p[c[0]] ? '<s style="opacity:.6">' + esc(p[c[0]]) + '</s> → ' : '') +
          '<b>' + esc(dat[c[0]]) + '</b>')).join('')
      : '')+

    (listas.length
      ? '<h4 class="mini strong mt14">Su salud</h4>'+
        listas.map(l => chk('lista:' + l[0], l[1], esc((l[2] || []).join(' · ')))).join('')
      : '')+

    (textos.length
      ? textos.map(t => chk('texto:' + t[0], t[1], esc(t[2]))).join('')
      : '')+

    (hayHab
      ? chk('habitos:', 'Hábitos', esc([
          hab.tabaco && 'Tabaco: ' + hab.tabaco,
          hab.alcohol && 'Alcohol: ' + hab.alcohol,
          hab.drogas && 'Sustancias: ' + hab.drogas,
          hab.actividad && 'Actividad: ' + hab.actividad
        ].filter(Boolean).join(' · ')))
      : '')+

    (!campos.length && !listas.length && !textos.length && !hayHab
      ? '<div class="aviso info">' + ico('info') + '<div>El paciente no agregó nada que no '+
        'estuviera ya en su historia.</div></div>' : ''),

    '<button class="btn ghost" data-cerrar>Cerrar</button>'+
    '<button class="btn pri" id="prellOK">' + ico('check') + ' Incorporar lo marcado</button>');

  $('#prellOK').onclick = () =>
    alConfirmar($$('#modal .prellChk:checked').map(i => i.dataset.k));
}

/* Vuelca en `p` lo que el profesional dejo tildado. Devuelve cuantos datos
   entraron. NO guarda la ficha ni cierra el modal: eso es de cada llamador. */
function incorporarDatosDePaciente(p, d, marcados){
  const dat = d.datos || {}, sal = d.salud || {};
  let n = 0;

  marcados.forEach(k => {
    const [tipo, campo] = k.split(':');
    if(tipo === 'dato'){ p[campo] = dat[campo]; n++; }
    else if(tipo === 'texto'){
      p[campo] = [p[campo], sal[campo]].filter(Boolean).join('\n');
      n++;
    }
    else if(tipo === 'habitos'){
      p.habitos = Object.assign({}, p.habitos || {}, sal.habitos || {});
      n++;
    }
    else if(tipo === 'lista'){
      if(campo === 'antecedentes'){
        p.antecedentes = p.antecedentes || [];
        (sal.antecedentes || []).forEach(nom => {
          if(p.antecedentes.some(a => (a.n || a) === nom)) return;
          const cat = patologiaPorNombre(nom);
          p.antecedentes.push({ n:nom, sis: cat ? cat.sis : 'Referido por el paciente' });
          n++;
        });
      } else if(campo === 'medicacion'){
        p.medicacion = p.medicacion || [];
        (sal.medicacion || []).forEach(m => {
          const nom = m.n || m;
          if(p.medicacion.some(x => x.n === nom)) return;
          const cat = FARMACOS_PERIOP.find(x => x.n === nom);
          p.medicacion.push({ n:nom, g: cat ? cat.g : 'Otros',
                              accion: cat ? cat.accion : 'evaluar',
                              nota: cat ? cat.nota : '',
                              dosis: (m && m.dosis) || '',
                              porque: 'Referido por el paciente' });
          n++;
        });
      } else if(campo === 'quirurgicos'){
        /* En la historia los quirúrgicos son {n, anio}. El paciente no carga
           el año —no se lo preguntamos, casi nunca lo recuerda con precisión
           y un año equivocado es peor que ninguno—, así que entra vacío y lo
           completa el profesional si hace falta. */
        p.antQuirurgicos = p.antQuirurgicos || [];
        (sal.quirurgicos || []).forEach(x => {
          if(p.antQuirurgicos.some(q => (q.n || q) === x)) return;
          p.antQuirurgicos.push({ n:x, anio:'' }); n++;
        });
      } else {
        const destino = { anestesicos:'antAnestesicos',
                          familiares:'antFamiliares', alergias:'alergias' }[campo];
        p[destino] = p[destino] || [];
        (sal[campo] || []).forEach(x => {
          if(p[destino].indexOf(x) < 0){ p[destino].push(x); n++; }
        });
      }
    }
  });

  p.modificado = new Date().toISOString();
  p.modificadoPor = SESION.uid;
  escribir('pacientes', p.id, p);
  return n;
}

/* =========================================================================
   LADO PACIENTE — EL PORTAL
   -------------------------------------------------------------------------
   Se dibuja sobre #portalPaciente y esconde la aplicacion entera. No hay
   sesion, no hay barra lateral, no hay menu y no hay forma de navegar a otra
   parte: lo unico que existe en la pantalla son las dos secciones del
   pedido. El lenguaje es el del paciente, no el de la historia clinica:
   «operaciones que se hizo», no «antecedentes quirurgicos».
   ========================================================================= */

function esModoPaciente(){ return !!tokenDeLaUrl(); }

function arrancarPortalPaciente(){
  const token = tokenDeLaUrl();
  const cont = $('#portalPaciente');
  const auth = $('#pantallaAuth'), app = $('#app');
  if(auth) auth.style.display = 'none';
  if(app)  app.style.display  = 'none';
  cont.style.display = 'block';

  cont.innerHTML = portalCascara(
    '<div class="portal-cargando">' + ico('nube') + ' Buscando su ficha…</div>');

  if(!fbDb) return portalError('Esta página necesita conexión con el servidor de la '+
    'asociación y no la encuentra. Probá de nuevo en unos minutos.');

  identificarseEnLaNube()
    .then(() => refPrellenado(token).once('value'))
    .then(sn => {
      const d = sn.val();
      if(!d) return portalError('Este enlace no es válido o ya fue dado de baja. '+
        'Escribile a tu anestesiólogo/a para que te mande uno nuevo.');
      if(d.vence && d.vence < hoyISO()) return portalError('Este enlace venció el ' +
        fFecha(d.vence) + '. Pedile a tu anestesiólogo/a que te mande uno nuevo.');
      if(d.estado === 'finalizado' || d.estado === 'incorporado'){
        portalPedido = d; portalPaso = 'fin'; pintarPortal(); return;
      }
      portalPedido = d;
      const s = d.salud || {};
      portalSel = {
        antecedentes: (s.antecedentes || []).slice(),
        quirurgicos:  (s.quirurgicos  || []).slice(),
        anestesicos:  (s.anestesicos  || []).slice(),
        familiares:   (s.familiares   || []).slice(),
        medicacion:   (s.medicacion   || []).slice(),
        alergias:     (s.alergias     || []).slice()
      };
      portalPaso = 'datos';
      pintarPortal();
    })
    .catch(e => {
      console.warn('portal', e);
      portalError('No se pudo abrir tu ficha. Puede ser un problema de conexión. '+
        'Probá de nuevo; si sigue igual, avisale a tu anestesiólogo/a.');
    });
}

function portalCascara(cuerpo, pie){
  const d = portalPedido || {};
  return ''+
  '<div class="portal">'+
    '<header class="portal-top">'+
      '<img src="' + (typeof LOGO_AFAAR === 'string' ? LOGO_AFAAR : '') + '" alt="" class="portal-logo">'+
      '<div><div class="marca">AFAAR</div>'+
        '<div class="sub">Asociación Fueguina de Anestesia, Analgesia y Reanimación</div></div>'+
    '</header>'+
    '<main class="portal-cuerpo">' + cuerpo + '</main>'+
    (pie ? '<div class="portal-pie">' + pie + '</div>' : '')+
    '<footer class="portal-legal">'+
      'Sus datos de salud reciben tratamiento confidencial y se usan únicamente con fines '+
      'asistenciales (Ley 25.326 de Protección de Datos Personales y Ley 17.132 del Ejercicio '+
      'de la Medicina). Sólo los ve el profesional que le envió este enlace.'+
      (d.profesional && d.profesional.nombre
        ? '<br>Le escribió: <b>' + esc(d.profesional.nombre) + '</b>' +
          (d.profesional.matricula ? ' · ' + esc(d.profesional.matricula) : '') : '')+
    '</footer>'+
  '</div>';
}

function portalError(msg){
  $('#portalPaciente').innerHTML = portalCascara(
    '<div class="aviso danger">' + ico('alerta') + '<div>' + esc(msg) + '</div></div>');
}

function pintarPortal(){
  const cont = $('#portalPaciente');
  if(portalPaso === 'fin')        cont.innerHTML = portalCascara(htmlPortalFin());
  else if(portalPaso === 'salud'){ cont.innerHTML = portalCascara(htmlPortalSalud(), piePortal());
                                   cablearPortalSalud(); }
  else                            { cont.innerHTML = portalCascara(htmlPortalDatos(), piePortal());
                                   cablearPortalDatos(); }
  window.scrollTo(0, 0);
}

function piePortal(){
  const enDatos = portalPaso === 'datos';
  return '<div class="portal-nav">'+
    (enDatos ? '<span></span>'
             : '<button class="btn ghost" id="ptAtras">' + ico('atras') + ' Volver</button>')+
    (enDatos
      ? '<button class="btn pri grande" id="ptSiguiente">Siguiente ' +
          ico('flecha').replace('<svg', '<svg style="transform:rotate(-90deg)"') + '</button>'
      : '<button class="btn pri grande" id="ptFinalizar">' + ico('check') + ' FINALIZADO</button>')+
  '</div>';
}

/* ------------------------------------------------- Paso 1: filiatorios */
function htmlPortalDatos(){
  return '<div class="portal-pasos"><span class="on">1 · Sus datos</span>'+
    '<span>2 · Su salud</span></div>'+

  '<h1>Complete su ficha antes de la consulta</h1>'+
  '<p class="portal-intro">Su anestesiólogo/a le pide que complete esta ficha en su casa, con '+
    'tiempo. Así la consulta prequirúrgica se dedica a lo importante y no a copiar datos.'+
    (portalPedido && portalPedido.cirugia
      ? '<br><br>Es para su <b>' + esc(portalPedido.cirugia) + '</b>' +
        (portalPedido.institucion ? ' en <b>' + esc(portalPedido.institucion) + '</b>' : '') + '.'
      : '')+
    '<br><br>Lo que escriba <b>no reemplaza la consulta</b>: el profesional lo revisa con usted '+
    'antes de la cirugía. Si duda de algo, déjelo vacío y pregúntelo en la consulta.</p>'+

  htmlFormDatosPaciente((portalPedido && portalPedido.datos) || {});
}

/* =========================================================================
   EL FORMULARIO DEL PACIENTE, COMPARTIDO
   -------------------------------------------------------------------------
   Estas cuatro funciones las usan LOS DOS caminos de entrada: el portal por
   invitacion de este archivo y la precarga abierta de precarga.js. Es el
   mismo formulario y tiene que seguir siendo el mismo: si se duplicara, en
   tres meses una de las dos copias pregunta algo que la otra no y los datos
   dejan de ser comparables.

   Trabajan sobre los ids `pt*`, asi que leerFormDatosPaciente() y
   leerFormSaludPaciente() leen lo que haya en pantalla sin importar quien lo
   dibujo.
   ========================================================================= */
function htmlFormDatosPaciente(d){
  d = d || {};
  return ''+
  '<div class="card plano"><h3>' + ico('paciente') + 'Quién es usted</h3>'+
    '<div class="grid c2">'+
      campoTxt('ptApellido','Apellido', d.apellido)+
      campoTxt('ptNombre','Nombre', d.nombre)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('ptDni','DNI', d.dni)+
      campoFecha('ptNac','Fecha de nacimiento', d.fechaNac)+
    '</div>'+
    '<div class="grid c2">'+
      campoSel('ptSexo','Sexo', ['','F','M','X'], d.sexo)+
      campoSel('ptGrupo','Grupo y factor (si lo sabe)',
        ['','0+','0-','A+','A-','B+','B-','AB+','AB-'], d.grupoSanguineo)+
    '</div>'+
    '<div class="grid c2">'+
      campoNum('ptPeso','Peso (kg)', d.peso, 'inputmode="decimal"')+
      campoNum('ptTalla','Talla (cm)', d.talla, 'inputmode="decimal"')+
    '</div>'+
  '</div>'+

  '<div class="card plano"><h3>' + ico('correo') + 'Cómo ubicarlo</h3>'+
    '<div class="grid c2">'+
      campoTxt('ptTel','Teléfono', d.telefono)+
      campoTxt('ptEmail','Correo electrónico', d.email)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('ptDom','Domicilio', d.domicilio)+
      campoSel('ptLocalidad','Localidad',
        ['','Ushuaia','Río Grande','Tolhuin','Otra localidad de TDF','Fuera de la provincia'],
        d.localidad)+
    '</div>'+
    campoTxt('ptEmergencia','Persona a avisar en una emergencia (nombre y teléfono)',
      d.contactoEmergencia)+
    campoTxt('ptOcupacion','Ocupación', d.ocupacion)+
  '</div>';
}

/* Lo que hay escrito ahora mismo en el formulario de filiacion */
function leerFormDatosPaciente(){
  const g = id => { const e = $('#' + id); return e ? e.value.trim() : ''; };
  return {
    apellido:g('ptApellido'), nombre:g('ptNombre'), dni:g('ptDni'),
    fechaNac:g('ptNac'), sexo:g('ptSexo'), grupoSanguineo:g('ptGrupo'),
    peso:g('ptPeso'), talla:g('ptTalla'), telefono:g('ptTel'), email:g('ptEmail'),
    domicilio:g('ptDom'), localidad:g('ptLocalidad'),
    contactoEmergencia:g('ptEmergencia'), ocupacion:g('ptOcupacion')
  };
}

function cablearPortalDatos(){
  $('#ptSiguiente').onclick = () => {
    leerPortalDatos();
    if(!portalPedido.datos.apellido || !portalPedido.datos.nombre)
      return toast('Falta su apellido y su nombre.', 'err');
    if(!portalPedido.datos.dni) return toast('Falta su DNI.', 'err');
    guardarBorradorPortal();
    portalPaso = 'salud';
    pintarPortal();
  };
}

function leerPortalDatos(){
  portalPedido.datos = Object.assign({}, portalPedido.datos || {}, leerFormDatosPaciente());
}

/* ------------------------------------------------------ Paso 2: salud */

/* Los antecedentes anestesicos del catalogo estan escritos para el
   anestesiologo -«deficit de pseudocolinesterasa»- y el paciente no los puede
   contestar. Estos son los mismos hechos, preguntados como se preguntan. */
const PORTAL_ANESTESICOS = [
  'Nunca me operaron ni me hicieron anestesia',
  'Me operaron y no tuve ningún problema con la anestesia',
  'Tardé mucho en despertarme',
  'Me costó mucho respirar al despertar',
  'Tuve muchas náuseas o vómitos después',
  'Me dijeron que fue difícil colocarme el tubo para respirar',
  'Me desperté durante la operación',
  'Tuve una reacción alérgica durante una anestesia',
  'Me dio mucha fiebre durante o después de la anestesia',
  'Tuve dolor de cabeza fuerte después de una anestesia de la columna',
  'Me costó mucho que me encontraran una vena',
  'Estuve internado en terapia intensiva después de una operación'
];

const PORTAL_FAMILIARES = [
  'Alguien de mi familia tuvo un problema grave con la anestesia',
  'Alguien de mi familia tuvo fiebre muy alta durante una anestesia',
  'En mi familia hay problemas de coagulación o sangrado',
  'En mi familia hay enfermedades del corazón antes de los 55 años',
  'En mi familia hay enfermedades musculares',
  'En mi familia hay diabetes',
  'Nada de esto / no lo sé'
];

function htmlPortalSalud(){
  return '<div class="portal-pasos"><span class="hecho">1 · Sus datos</span>'+
    '<span class="on">2 · Su salud</span></div>'+
    htmlFormSaludPaciente((portalPedido && portalPedido.salud) || {}, portalSel);
}

/* El cuestionario de salud. `sel` es el objeto de selecciones que el llamador
   mantiene: {antecedentes, quirurgicos, anestesicos, familiares, medicacion,
   alergias}. Se muta en el lugar, para que el que lo pasa vea los cambios. */
function htmlFormSaludPaciente(s, sel){
  s = s || {};
  const h = s.habitos || {};
  const pat = (typeof PATOLOGIAS_CHIP !== 'undefined' ? PATOLOGIAS_CHIP : [])
    .map(x => x.n);

  const bloqueChips = (clave, lista) =>
    '<div class="chips portal-chips" data-sel="' + clave + '">' + lista.map(x =>
      '<button type="button" class="chip' + (sel[clave].indexOf(x) >= 0 ? ' on' : '') +
      '" data-v="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>';

  return ''+
  '<h1>Su salud</h1>'+
  '<p class="portal-intro">Toque todo lo que le corresponda. Si algo no aparece en las listas, '+
    'escríbalo en el recuadro que hay debajo de cada una. <b>Si no está seguro, no lo marque y '+
    'pregúntelo en la consulta.</b></p>'+

  '<div class="card plano"><h3>' + ico('lista') + '¿Tiene o tuvo alguna de estas enfermedades?</h3>'+
    '<div class="ayuda">Éstas son las más frecuentes. Si la suya no está, búsquela abajo.</div>'+
    bloqueChips('antecedentes', pat)+
    '<div class="campo mt14"><label>Buscar otra enfermedad</label><div class="buscador">'+
      '<input type="search" id="ptAntBuscar" placeholder="Ej.: hipotiroidismo, migraña, artritis…" '+
        'autocomplete="off">'+
      '<div class="res" id="ptAntRes"></div></div></div>'+
    '<div id="ptAntSel"></div>'+
    campoArea('ptAntOtros','Otra enfermedad, o algo que quiera aclarar',
      s.antecedentesOtros, 'Escriba acá lo que no encontró en la lista')+
  '</div>'+

  '<div class="card plano"><h3>' + ico('jeringa') + '¿Qué operaciones se hizo?</h3>'+
    bloqueChips('quirurgicos',
      (typeof CIRUGIAS_PREVIAS !== 'undefined' ? CIRUGIAS_PREVIAS : []))+
  '</div>'+

  '<div class="card plano"><h3>' + ico('aire') + '¿Cómo le fue con anestesias anteriores?</h3>'+
    bloqueChips('anestesicos', PORTAL_ANESTESICOS)+
  '</div>'+

  '<div class="card plano"><h3>' + ico('pacientes') + 'En su familia</h3>'+
    bloqueChips('familiares', PORTAL_FAMILIARES)+
  '</div>'+

  '<div class="card plano"><h3>' + ico('gota') + '¿Qué medicamentos toma?</h3>'+
    '<div class="ayuda">Busque el nombre del remedio. Si no lo encuentra, escríbalo igual y '+
      'toque «Agregar». Conviene tener las cajas a mano.</div>'+
    '<div class="campo"><div class="buscador">'+
      '<input type="search" id="ptMedBuscar" placeholder="Ej.: aspirina, metformina, enalapril…" '+
        'autocomplete="off">'+
      '<div class="res" id="ptMedRes"></div></div></div>'+
    '<div id="ptMedLista"></div>'+
    campoArea('ptMedOtros','Otros remedios, gotas, inyecciones, hierbas o suplementos',
      s.medicacionOtros, 'Incluya vitaminas, hierbas y todo lo que tome sin receta')+
  '</div>'+

  '<div class="card plano"><h3>' + ico('alerta') + '¿Es alérgico a algo?</h3>'+
    bloqueChips('alergias',
      (typeof ALERGENOS !== 'undefined' ? ALERGENOS : []).filter(x => x !== 'Otra'))+
    campoArea('ptAleDet','¿Qué le pasó y con qué?', s.alergiaDetalle,
      'Ej.: con la penicilina me salió un sarpullido en 2019')+
  '</div>'+

  '<div class="card plano"><h3>' + ico('hoja') + 'Sus hábitos</h3>'+
    '<div class="grid c2">'+
      campoSel('ptTabaco','¿Fuma?', ['','No fumador','Ex fumador','Fumador activo'], h.tabaco)+
      campoSel('ptAlcohol','¿Toma alcohol?',
        ['','No consume','Social','Consumo de riesgo','Dependencia'], h.alcohol)+
    '</div>'+
    '<div class="grid c2">'+
      campoSel('ptDrogas','¿Consume otras sustancias?',
        ['','No consume','Cannabis','Cocaína','Opioides','Múltiples','Prefiere no informar'],
        h.drogas)+
      campoSel('ptActividad','¿Hace actividad física?',
        ['','Sedentario','Actividad leve','Actividad moderada','Deportista'], h.actividad)+
    '</div>'+
    '<div class="ayuda">Esto no se comparte con nadie más que con su anestesiólogo/a, y es '+
      'información que cambia cómo se maneja su anestesia. Contestar con la verdad es lo que '+
      'lo protege.</div>'+
  '</div>';
}

function cablearPortalSalud(){
  cablearFormSaludPaciente(portalSel);
  $('#ptAtras').onclick = () => { leerPortalSalud(); guardarBorradorPortal();
                                  portalPaso = 'datos'; pintarPortal(); };
  $('#ptFinalizar').onclick = finalizarPortal;
}

/* Cablea los chips y los dos buscadores del cuestionario de salud sobre el
   objeto de selecciones que le pasen. No cablea la navegacion: esa la pone
   cada camino de entrada, que tiene sus propios botones. */
function cablearFormSaludPaciente(sel){
  /* chips de seleccion multiple */
  $$('.portal-chips').forEach(cont => {
    const clave = cont.dataset.sel;
    $$('[data-v]', cont).forEach(b => b.onclick = () => {
      const v = b.dataset.v;
      const i = sel[clave].indexOf(v);
      if(i >= 0) sel[clave].splice(i, 1); else sel[clave].push(v);
      b.classList.toggle('on', i < 0);
    });
  });

  /* buscador de enfermedades: los catorce chips son las frecuentes, pero el
     paciente con hipotiroidismo tiene que poder decirlo sin escribirlo en el
     recuadro libre, donde despues no lo lee ninguna escala. */
  montarBuscador({
    input: $('#ptAntBuscar'), caja: $('#ptAntRes'), manual: true,
    fuente: () => todasPatologias().map(x => ({
      etiqueta:x.n, sub:x.sis, busca: norm(x.n + ' ' + x.sis + ' ' + (x.chip || '')), dato:x })),
    onElegir: x => {
      if(sel.antecedentes.indexOf(x.dato.n) < 0) sel.antecedentes.push(x.dato.n);
      pintarAntPortal(sel);
    },
    onManual: txt => {
      if(!txt) return;
      if(sel.antecedentes.indexOf(txt) < 0) sel.antecedentes.push(txt);
      pintarAntPortal(sel);
    }
  });
  pintarAntPortal(sel);

  /* buscador de medicacion, con el mismo catalogo que usa el profesional */
  montarBuscador({
    input: $('#ptMedBuscar'), caja: $('#ptMedRes'), manual: true,
    fuente: () => FARMACOS_PERIOP
      .filter(x => x.n !== 'Otro fármaco no listado')
      .map(x => ({ etiqueta:x.n, sub:x.g, busca: norm(x.n + ' ' + x.g + ' ' + (x.sin || '')),
                   dato:x })),
    onElegir: x => {
      if(!sel.medicacion.some(m => (m.n || m) === x.dato.n))
        sel.medicacion.push({ n:x.dato.n, dosis:'' });
      pintarMedPortal(sel);
    },
    onManual: txt => {
      if(!txt) return;
      if(!sel.medicacion.some(m => (m.n || m) === txt))
        sel.medicacion.push({ n:txt, dosis:'' });
      pintarMedPortal(sel);
    }
  });
  pintarMedPortal(sel);
}

/* Lo que se eligio por el buscador -no por los chips-, para poder sacarlo.
   Los chips se despintan tocandolos otra vez; esto no tiene chip. */
function pintarAntPortal(sel){
  sel = sel || portalSel;
  const c = $('#ptAntSel'); if(!c) return;
  const chips = new Set((typeof PATOLOGIAS_CHIP !== 'undefined' ? PATOLOGIAS_CHIP : [])
    .map(x => x.n));
  const extra = sel.antecedentes.filter(x => !chips.has(x));
  c.innerHTML = extra.length
    ? '<div class="seleccionados mt8">' + extra.map(x =>
        '<span class="pill"><span>' + esc(x) + '</span>'+
        '<button type="button" data-ant="' + esc(x) + '">×</button></span>').join('') + '</div>'
    : '';
  $$('#ptAntSel [data-ant]').forEach(b => b.onclick = () => {
    const i = sel.antecedentes.indexOf(b.dataset.ant);
    if(i >= 0) sel.antecedentes.splice(i, 1);
    pintarAntPortal(sel);
  });
}

function pintarMedPortal(sel){
  sel = sel || portalSel;
  const c = $('#ptMedLista'); if(!c) return;
  if(!sel.medicacion.length){
    c.innerHTML = '<p class="mini">Todavía no agregó ningún remedio.</p>'; return;
  }
  c.innerHTML = sel.medicacion.map((m, i) =>
    '<div class="med-card">'+
      '<div class="med-head"><b>' + esc(m.n || m) + '</b>'+
        '<button class="btn ghost chico" data-mq="' + i + '">' + ico('borrar') + '</button></div>'+
      '<div class="campo" style="margin:8px 0 0"><label>¿Cuánto y cuántas veces por día?</label>'+
        '<input type="text" data-md="' + i + '" value="' + esc(m.dosis || '') + '" '+
          'placeholder="Ej.: 1 comprimido a la mañana"></div>'+
    '</div>').join('');
  $$('#ptMedLista [data-mq]').forEach(b => b.onclick = () => {
    sel.medicacion.splice(Number(b.dataset.mq), 1); pintarMedPortal(sel); });
  $$('#ptMedLista [data-md]').forEach(i => i.oninput = () =>
    sel.medicacion[Number(i.dataset.md)].dosis = i.value);
}

function leerPortalSalud(){
  portalPedido.salud = leerFormSaludPaciente(portalSel);
}

/* Lo que hay contestado ahora mismo en el cuestionario de salud */
function leerFormSaludPaciente(sel){
  const g = id => { const e = $('#' + id); return e ? e.value.trim() : ''; };
  return {
    antecedentes: sel.antecedentes.slice(),
    quirurgicos:  sel.quirurgicos.slice(),
    anestesicos:  sel.anestesicos.slice(),
    familiares:   sel.familiares.slice(),
    medicacion:   sel.medicacion.slice(),
    alergias:     sel.alergias.slice(),
    antecedentesOtros: g('ptAntOtros'),
    medicacionOtros:   g('ptMedOtros'),
    alergiaDetalle:    g('ptAleDet'),
    habitos: { tabaco:g('ptTabaco'), alcohol:g('ptAlcohol'),
               drogas:g('ptDrogas'), actividad:g('ptActividad') }
  };
}

/* El borrador se guarda al pasar de pantalla: si el paciente cierra el
   telefono a la mitad, al volver con el mismo enlace encuentra lo cargado. */
function guardarBorradorPortal(){
  if(!portalPedido || !fbDb) return Promise.resolve();
  return refPrellenado(portalPedido.token)
    .update({ datos: portalPedido.datos || {},
              salud: portalPedido.salud || {},
              tocado: new Date().toISOString() })
    .catch(e => console.warn('borrador', e));
}

function finalizarPortal(){
  leerPortalSalud();
  confirmar('Enviar su ficha',
    '<p>Se le envía a <b>' + esc((portalPedido.profesional || {}).nombre || 'su anestesiólogo/a') +
    '</b> lo que completó.</p>'+
    '<p>Después de enviarla <b>no va a poder modificarla</b> desde este enlace. Si se olvidó de '+
    'algo o se equivocó, dígaselo en la consulta: siempre hay tiempo de corregirlo antes de la '+
    'cirugía.</p>'+
    '<p>Revise sobre todo <b>los remedios que toma y las alergias</b>: son los dos datos que más '+
    'cambian el manejo de su anestesia.</p>',
    () => {
      toast('Enviando…');
      refPrellenado(portalPedido.token)
        .update({ datos: portalPedido.datos || {}, salud: portalPedido.salud || {},
                  estado:'finalizado', finalizado:new Date().toISOString() })
        .then(() => { portalPaso = 'fin'; pintarPortal(); })
        .catch(e => {
          console.warn('finalizar', e);
          toast('No se pudo enviar. Revisá la conexión y probá otra vez.', 'err');
        });
    }, 'Enviar mi ficha');
}

function htmlPortalFin(){
  const d = portalPedido || {};
  return ''+
  '<div class="portal-fin">' + ico('check') +
    '<h1>FINALIZADO</h1>'+
    '<p>Su ficha le llegó a <b>' + esc((d.profesional || {}).nombre || 'su anestesiólogo/a') +
      '</b>. La va a revisar con usted en la consulta prequirúrgica.</p>'+
    '<p class="mini">Ya puede cerrar esta página. Este enlace queda cerrado: si necesita '+
      'corregir algo, hágaselo saber al profesional y le va a mandar uno nuevo.</p>'+
    '<div class="aviso warn" style="text-align:left;margin-top:18px">' + ico('alerta') +
      '<div><b>No suspenda ni empiece ningún medicamento por su cuenta.</b> Las indicaciones '+
      'sobre qué tomar y qué dejar de tomar antes de la cirugía se las da el anestesiólogo/a '+
      'después de la consulta.</div></div>'+
  '</div>';
}
