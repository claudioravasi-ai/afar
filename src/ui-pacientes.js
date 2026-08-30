/* =========================================================================
   PACIENTES - historia clinica del paciente
   Datos filiatorios, antecedentes patologicos, quirurgicos, anestesicos y
   familiares, medicacion habitual, alergias y habitos.
   El padron es comun a la asociacion: lo que se carga aca lo hereda cada
   ficha anestesica, para no volver a preguntar lo mismo en el consultorio.
   ========================================================================= */

let filtroPac = '';
let pacEdit = null;          /* borrador del paciente en edicion */
let solapaPac = 'fil';
let alcancePac = 'mios';     /* mios | padron */

/* =========================================================================
   QUE PACIENTES VE CADA ANESTESIOLOGO
   -------------------------------------------------------------------------
   El listado arranca en MIS PACIENTES: aquellos en los que intervine, por la
   valoracion prequirurgica, por el acto anestesico o por los dos. La historia
   clinica de un paciente en el que nunca intervine no es asunto mio.

   El PADRON completo sigue existiendo y sigue siendo consultable, porque sin
   el la app se llena de pacientes duplicados: antes de cargar a alguien hay
   que poder averiguar si ya esta. Pero en esa solapa solo se ven los datos
   que hacen falta para reconocerlo —apellido, nombre y documento—; los
   antecedentes, las alergias y las fichas quedan fuera hasta que se
   intervenga. El selector de paciente del paso 1 tambien ve el padron
   entero, por la misma razon.
   ========================================================================= */
function pacientesMios(){
  if(esCoordinador()) return misPacientes();
  const ids = {};
  misFichas().forEach(f => { if(f.pacienteId) ids[f.pacienteId] = true; });
  return misPacientes().filter(p => ids[p.id]);
}
function intervineEn(p){
  if(esCoordinador()) return true;
  return misFichas().some(f => f.pacienteId === p.id);
}

function vistaPacientes(){
  const cont = $('#vPacientes');
  const padron = misPacientes();
  const propios = pacientesMios();
  const todos = (alcancePac === 'padron' ? padron : propios).sort((a,b) =>
    (a.apellido+a.nombre).localeCompare(b.apellido+b.nombre, 'es'));
  const q = norm(filtroPac).trim();
  /* cada palabra tipeada debe aparecer en algún dato del paciente, así
     "perez maria" y "maria perez" encuentran lo mismo, y el DNI se puede
     buscar entero o por sus últimos dígitos */
  const palabras = q ? q.split(/\s+/) : [];
  const l = palabras.length
    ? todos.filter(p => {
        const campos = norm([p.apellido, p.nombre, p.dni, p.hc, p.obraSocial,
                             p.nroAfiliado, p.localidad].join(' '));
        return palabras.every(w => campos.indexOf(w) >= 0);
      })
    : todos;

  const enPadron = alcancePac === 'padron';

  cont.innerHTML = ''+
  '<div class="vista-head"><div><h1>Pacientes</h1>'+
    '<p>'+todos.length+' paciente'+(todos.length===1?'':'s')+
    (enPadron ? ' en el padrón de la asociación' : ' en los que interviniste')+
    (q ? ' · '+l.length+' coinciden con la búsqueda' : '')+'.</p></div>'+
    '<div class="acciones"><button class="btn pri" id="btnNuevoPac">'+ico('mas')+' Nuevo paciente</button></div></div>'+

  (esCoordinador() ? '' :
    '<div class="seg mb8" id="pacAlcance">'+
      [['mios','Mis pacientes', propios.length],
       ['padron','Padrón de la asociación', padron.length]].map(a =>
        '<button type="button" data-v="'+a[0]+'"'+(alcancePac===a[0]?' class="on"':'')+'>'+
        a[1]+'<span class="badge">'+a[2]+'</span></button>').join('')+
    '</div>')+

  '<div class="campo"><div style="position:relative">'+
    '<input type="search" id="pacBuscar" placeholder="Buscar por apellido, nombre, DNI o HC…" value="'+esc(filtroPac)+'" style="padding-left:38px" autocomplete="off">'+
    '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--texto-3)">'+ico('buscar')+'</span>'+
  '</div></div>'+

  (enPadron
    ? '<div class="aviso info">'+ico('candado')+'<div><b>Padrón completo de la asociación.</b> '+
      'De los pacientes en los que <b>no</b> interviniste ves lo necesario para reconocerlos '+
      '—apellido, nombre, documento, edad, sexo y localidad— y nada de su historia clínica.<br>'+
      '<b>Tocá cualquiera para atenderlo:</b> se abre una ficha nueva con sus datos ya cargados, '+
      'sin volver a tipearlos y sin duplicarlo. Desde ese momento su historia queda a tu '+
      'alcance, porque pasás a ser uno de los que intervienen.</div></div>'
    : (todos.length ? '<div class="aviso info">'+ico('pacientes')+'<div>'+
      'Pacientes en los que interviniste, por la valoración prequirúrgica, por el acto '+
      'anestésico o por los dos. Los antecedentes que cargues los hereda cada ficha '+
      'nueva.</div></div>' : ''))+

  (l.length ? '<div class="lista">'+ l.map(p => {
      const mio = intervineEn(p);
      const fichas = mio ? misFichas().filter(f => f.pacienteId === p.id) : [];
      const mias = fichas.filter(esAutorFicha).length;
      const ed = edadDe(p.fechaNac);
      const nAnt = (p.antecedentes || []).length;
      const alergias = (p.alergias || []).filter(a => a !== 'Sin alergias conocidas');
      return '<div class="item'+(mio?'':' atenuado')+'" data-pac="'+p.id+'">'+
        '<div class="avatar">'+esc(iniciales(p.nombre,p.apellido))+'</div>'+
        '<div class="txt"><b>'+esc(p.apellido)+', '+esc(p.nombre)+'</b>'+
          '<span>DNI '+esc(p.dni||'—')+
          /* Del paciente ajeno sale la identificación y nada más: la edad, la
             cobertura, los antecedentes y las alergias son historia clínica. */
          (mio ? (ed!==null?' · '+ed+' años':'')+' · '+esc(p.obraSocial||'Sin cobertura')+
                 (nAnt ? ' · '+nAnt+' antecedente'+(nAnt===1?'':'s') : '')
          /* Del paciente ajeno salen los datos que sirven para RECONOCERLO y
             no duplicarlo: edad, sexo y localidad son identificacion, no
             historia clinica. Sin la edad, dos «Pérez, María» son
             indistinguibles y el padron no cumple la unica funcion que
             tiene. Lo clinico —antecedentes, alergias, cobertura, fichas—
             sigue cerrado. */
               : (ed!==null?' · '+ed+' años':'')+
                 ({F:' · femenino',M:' · masculino',X:' · X'}[p.sexo] || '')+
                 (p.localidad ? ' · '+esc(p.localidad) : ''))+'</span></div>'+
        '<div class="der">'+
          (mio
            ? (alergias.length ? '<span class="tag danger" title="'+esc(alergias.join(' · '))+'">Alergias</span> ' : '')+
              '<span class="tag'+(fichas.length?' aqua':'')+'">'+fichas.length+' ficha'+(fichas.length===1?'':'s')+'</span>'+
              (fichas.length && mias < fichas.length
                ? '<div class="mini mt8">'+(mias||'ninguna')+' tuya'+(mias===1?'':'s')+'</div>' : '')
            : '<span class="tag">'+ico('candado')+'</span>')+
        '</div></div>';
    }).join('') +'</div>'
    : '<div class="vacio">'+ico('pacientes')+'<b>'+
      (q ? 'Sin resultados' : enPadron ? 'El padrón está vacío' : 'Todavía no interviniste en ningún paciente')+'</b>'+
      '<span>'+(q ? 'Probá con otro apellido o DNI'+(enPadron?'.':', o buscá en el padrón de la asociación.')
                  : enPadron ? 'Tocá «Nuevo paciente» para empezar.'
                  : 'Los pacientes aparecen acá cuando les hacés la valoración prequirúrgica o el acto anestésico.')+
      '</span></div>');

  $('#btnNuevoPac').onclick = () => editarPaciente(null);
  $$('#pacAlcance button').forEach(b => b.onclick = () => {
    alcancePac = b.dataset.v; vistaPacientes(); });
  $('#pacBuscar').oninput = debounce(e => { filtroPac = e.target.value; vistaPacientes();
    const i = $('#pacBuscar'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }, 260);
  $$('#vPacientes .item').forEach(it => {
    it.onclick = () => {
      const p = DB.pacientes[it.dataset.pac];
      /* Antes esto era un toast que decia «no se abre» y nada mas: el padron
         te avisaba que el paciente existia y ahi te dejaba. Ahora abre la
         ficha de identificacion, que es de donde se lo puede atender. */
      if(!intervineEn(p)) return abrirPacienteDelPadron(it.dataset.pac);
      abrirPaciente(it.dataset.pac);
    };
  });
}

/* =========================================================================
   PACIENTE DEL PADRON EN EL QUE NO INTERVINE
   -------------------------------------------------------------------------
   El padron existe para no duplicar pacientes. Pero decir «este paciente ya
   existe» y no dejar hacer nada con esa informacion no resuelve nada: el
   anestesiologo terminaba cargandolo de nuevo igual, que es exactamente lo
   que el padron venia a evitar.

   Lo que hay que separar son dos cosas que no son lo mismo:

     IDENTIFICACION   apellido, nombre, documento, fecha de nacimiento, sexo
                      y localidad. Son datos personales, no datos de salud.
                      Sirven para reconocer a la persona y para no cargarla
                      dos veces, y se muestran.

     HISTORIA CLINICA antecedentes, medicacion, alergias, cobertura y fichas.
                      Son datos sensibles (Ley 25.326, art. 2 y 8) y solo los
                      ve quien interviene en ese paciente. No se muestran.

   Y despues hay que dar la puerta legitima: ATENDERLO. Al abrir una ficha
   con ese paciente uno pasa a ser interviniente, y ahi el acceso a su
   historia deja de ser curiosidad y pasa a tener causa. Queda auditado.

   La otra puerta es preguntarle al colega que si intervino. Por eso se
   nombra al profesional —no lo que hizo— y hay un boton para escribirle por
   la mensajeria interna.
   ========================================================================= */
function colegasQueIntervinieron(pid){
  const uids = {};
  lista('fichas').forEach(f => {
    if(f.pacienteId !== pid) return;
    if(f.ownerUid) uids[f.ownerUid] = true;
    const a = actorFicha(f);
    if(a) uids[a] = true;
  });
  if(SESION) delete uids[SESION.uid];
  return Object.keys(uids);
}

function abrirPacienteDelPadron(id){
  const p = DB.pacientes[id];
  if(!p) return toast('No se encontró el paciente.', 'err');
  const ed = edadDe(p.fechaNac);
  const colegas = colegasQueIntervinieron(id);

  const dato = (et, v) => '<div class="res-fila"><span>'+esc(et)+'</span><b>'+
    esc(v || '—')+'</b></div>';

  abrirModal('Paciente del padrón',
    '<div class="aviso info">'+ico('candado')+'<div><b>No interviniste en este paciente.</b><br>'+
      'Ves sus datos de identificación, que son los que hacen falta para reconocerlo y no '+
      'cargarlo dos veces. Sus antecedentes, alergias, medicación y fichas son historia clínica '+
      'y no se abren hasta que lo atiendas.</div></div>'+

    '<div class="card plano"><h3>'+ico('paciente')+'Identificación</h3>'+
      dato('Apellido y nombre', (p.apellido||'')+', '+(p.nombre||''))+
      dato('Documento', p.dni)+
      dato('N.º de historia clínica', p.hc)+
      dato('Fecha de nacimiento', p.fechaNac ? fFecha(p.fechaNac) : '')+
      dato('Edad', ed !== null ? ed+' años' : '')+
      dato('Sexo', {F:'Femenino',M:'Masculino',X:'X / No binario'}[p.sexo] || '')+
      dato('Localidad', p.localidad)+
    '</div>'+

    (colegas.length
      ? '<div class="aviso ok">'+ico('pacientes')+'<div><b>Ya fue atendido en la asociación por '+
        esc(colegas.map(nombreUsuario).join(', '))+'.</b><br>'+
        'Si necesitás sus antecedentes antes de atenderlo, podés pedírselos por la mensajería '+
        'interna.</div></div>'
      : '<div class="aviso warn">'+ico('info')+'<div>Está cargado en el padrón pero todavía '+
        'no tiene ninguna intervención registrada.</div></div>')+

    '<div class="aviso info">'+ico('valoracion')+'<div><b>Para acceder a su historia, atendelo.</b><br>'+
      'Se abre una ficha nueva con este paciente ya seleccionado: no lo cargás de nuevo y no se '+
      'duplica. Desde ahí ves y completás su historia, como en cualquier paciente tuyo.</div></div>',

    '<button class="btn ghost" data-cerrar>Cerrar</button>'+
    (colegas.length
      ? '<button class="btn ghost" id="ppMensaje">'+ico('correo')+' Pedir antecedentes</button>'
      : '')+
    '<button class="btn pri" id="ppAtender">'+ico('mas')+' Atender a este paciente</button>');

  $('#ppAtender').onclick = () => {
    cerrarModal();
    /* Queda asentado quien abrio la historia de un paciente que no era suyo y
       por que: es el respaldo del acceso. */
    auditar('padron-atender',
      'Abre ficha desde el padrón — ' + (p.apellido||'') + ', ' + (p.nombre||''));
    abrirFicha(null, id);
  };
  if($('#ppMensaje')) $('#ppMensaje').onclick = () => {
    cerrarModal();
    componerHilo(colegas[0],
      'Antecedentes de ' + (p.apellido||'') + ', ' + (p.nombre||'') +
      ' — DNI ' + (p.dni||''));
  };
}

/* =========================================================================
   ALTA / EDICION - historia completa en cuatro solapas
   ========================================================================= */
function editarPaciente(id, alGuardar){
  const base = id ? JSON.parse(JSON.stringify(DB.pacientes[id] || {})) : {};
  pacEdit = Object.assign({
    antecedentes:[], antQuirurgicos:[], antAnestesicos:[], antFamiliares:[],
    medicacion:[], alergias:[], habitos:{}
  }, base);
  pacEdit.__id = id || null;
  pacEdit.__alGuardar = alGuardar || null;
  solapaPac = 'fil';
  pintarEditorPaciente();
}

const SOLAPAS_PAC = [
  ['fil','paciente','Filiatorios'],
  ['ant','lista','Antecedentes'],
  ['med','jeringa','Medicación'],
  ['ale','alerta','Alergias y hábitos']
];

function pintarEditorPaciente(){
  const p = pacEdit;
  const nAnt = (p.antecedentes||[]).length;
  const nMed = (p.medicacion||[]).length;
  const nAle = (p.alergias||[]).filter(a => a !== 'Sin alergias conocidas').length;
  const cuenta = { ant:nAnt, med:nMed, ale:nAle };

  abrirModal(p.__id ? 'Historia del paciente' : 'Nuevo paciente',
    '<div class="pac-solapas">'+ SOLAPAS_PAC.map(s =>
      '<button type="button" class="'+(solapaPac===s[0]?'on':'')+'" data-psolapa="'+s[0]+'">'+
        ico(s[1]).replace('<svg','<svg style="width:14px;height:14px;vertical-align:-2px;margin-right:5px"')+
        esc(s[2])+(cuenta[s[0]] ? '<span class="badge">'+cuenta[s[0]]+'</span>' : '')+
      '</button>').join('') +'</div>'+
    '<div id="pacCuerpo"></div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="paGuardar">'+ico('check')+' Guardar</button>', '980px');

  $$('#modal [data-psolapa]').forEach(b => b.onclick = () => {
    leerSolapaPaciente(); solapaPac = b.dataset.psolapa; pintarEditorPaciente();
  });

  const c = $('#pacCuerpo');
  if(solapaPac === 'fil'){ c.innerHTML = htmlPacFiliatorios(p); cablearPacFiliatorios(); }
  else if(solapaPac === 'ant'){ c.innerHTML = htmlPacAntecedentes(p); cablearPacAntecedentes(); }
  else if(solapaPac === 'med'){ c.innerHTML = htmlPacMedicacion(p); cablearPacMedicacion(); }
  else { c.innerHTML = htmlPacAlergias(p); cablearPacAlergias(); }

  $('#paGuardar').onclick = guardarPacienteEditado;
}

/* ------------------------------------------------ Solapa 1: filiatorios */
function htmlPacFiliatorios(p){
  return ''+
  '<div class="card plano"><h3>'+ico('paciente')+'Identificación del paciente</h3>'+
    '<div class="grid c2">'+
      campoTxt('paApellido','Apellido *', p.apellido)+
      campoTxt('paNombre','Nombre *', p.nombre)+
    '</div>'+
    '<div class="grid c3">'+
      campoTxt('paDni','DNI *', p.dni)+
      campoTxt('paHC','N.º de historia clínica', p.hc)+
      campoFecha('paNac','Fecha de nacimiento', p.fechaNac)+
    '</div>'+
    '<div id="paAvisoDni"></div>'+
    '<div class="grid c4">'+
      campoSel('paSexo','Sexo', [{v:'',t:'—'},{v:'F',t:'Femenino'},{v:'M',t:'Masculino'},{v:'X',t:'X / No binario'}], p.sexo)+
      campoNum('paPeso','Peso (kg)', p.peso, 'inputmode="decimal"')+
      campoNum('paTalla','Talla (cm)', p.talla, 'inputmode="decimal"')+
      campoTxt('paEdadCalc','Edad', '', true)+
    '</div>'+
    '<div id="paIMC"></div>'+
  '</div>'+

  /* La cobertura NO se pide aca. Vive en «Datos de la cirugia» del paso 1 de
     la ficha, que es donde ademas se puede agregar un financiador nuevo y
     donde el numero de autorizacion tiene sentido: la obra social es de la
     intervencion, no del paciente -el mismo paciente se opera una vez por su
     obra social y la siguiente como particular-. Lo que se elija alli vuelve
     a la historia del paciente para que la proxima ficha lo proponga solo.
     Ver htmlPasoPaciente() en ui-ficha.js. */
  (p.obraSocial
    ? '<div class="aviso info">'+ico('dinero')+'<div><b>Cobertura: '+esc(p.obraSocial)+
      (p.nroAfiliado ? ' — N.º '+esc(p.nroAfiliado) : '')+'.</b><br>'+
      'Es la última que se usó. La cobertura se elige en cada ficha, en <b>Datos de la '+
      'cirugía</b>: ahí se puede cambiar, agregar otro financiador y cargar el número de '+
      'autorización.</div></div>'
    : '<div class="aviso info">'+ico('dinero')+'<div><b>La cobertura se carga en la ficha.</b><br>'+
      'En <b>Datos de la cirugía</b> del paso 1 elegís el financiador de esa intervención, '+
      'agregás otro si hace falta y cargás el número de afiliado o de autorización.</div></div>')+

  '<div class="card plano"><h3>'+ico('correo')+'Contacto y domicilio</h3>'+
    '<div class="grid c2">'+
      campoTxt('paTel','Teléfono', p.telefono)+
      campoSel('paGrupo','Grupo y factor',
        ['','0+','0-','A+','A-','B+','B-','AB+','AB-'], p.grupoSanguineo)+
    '</div>'+
    '<div class="campo"><label>Correo electrónico</label>'+
      '<input type="email" id="paEmail" value="'+esc(p.email||'')+'" '+
        'placeholder="nombre@correo.com" autocomplete="off">'+
      '<div class="ayuda">A esta dirección se le envía la copia de la valoración '+
      'prequirúrgica y del consentimiento informado.</div></div>'+
    '<div class="grid c2">'+
      campoTxt('paDom','Domicilio', p.domicilio)+
      campoSel('paLocalidad','Localidad',
        ['','Ushuaia','Río Grande','Tolhuin','Otra localidad de TDF','Fuera de la provincia'], p.localidad)+
    '</div>'+
    '<div class="grid c2">'+
      campoTxt('paEmergencia','Contacto de emergencia (nombre y teléfono)', p.contactoEmergencia)+
      campoTxt('paOcupacion','Ocupación', p.ocupacion)+
    '</div>'+
    campoArea('paObs','Observaciones generales', p.observaciones,
      'Datos relevantes que quieras tener a mano cada vez que abras este paciente')+
  '</div>';
}

function cablearPacFiliatorios(){
  /* Peso y talla: sólo el IMC. Nada más se calcula acá. */
  const recalc = () => {
    const imc = calcIMC($('#paPeso').value, $('#paTalla').value);
    $('#paIMC').innerHTML = imc
      ? '<div class="imc-box '+claseIMC(imc)+'">'+
          '<span class="lbl">IMC</span>'+
          '<span class="val">'+fNum(imc,1)+'</span>'+
          '<span class="um">kg/m²</span>'+
          '<span class="tag '+claseIMC(imc)+'">'+esc(clasificaIMC(imc))+'</span>'+
        '</div>'
      : '';
    const ed = edadDe($('#paNac').value);
    $('#paEdadCalc').value = ed !== null ? ed + ' años' : '—';
  };
  $('#paPeso').oninput = recalc;
  $('#paTalla').oninput = recalc;
  $('#paNac').onchange = recalc;
  recalc();

  const id = pacEdit.__id;
  const revisarDni = () => {
    const d = $('#paDni').value.trim();
    const ya = d ? lista('pacientes').find(x => x.id !== id && norm(x.dni) === norm(d)) : null;
    $('#paAvisoDni').innerHTML = ya
      ? '<div class="aviso warn">'+ico('alerta')+'<div><b>Ya hay un paciente con ese DNI:</b> '+
        esc(ya.apellido+', '+ya.nombre)+'.<br><button class="btn warn chico mt8" id="paIrExistente">'+
        'Abrir el que ya existe</button></div></div>'
      : '';
    if($('#paIrExistente')) $('#paIrExistente').onclick = () => {
      cerrarModal(); setTimeout(() => abrirPaciente(ya.id), 180);
    };
  };
  $('#paDni').oninput = debounce(revisarDni, 250);
  revisarDni();
}

function claseIMC(imc){
  if(imc === null) return '';
  if(imc < 18.5) return 'warn';
  if(imc < 25) return 'ok';
  if(imc < 30) return 'warn';
  return 'danger';
}

/* ----------------------------------------------- Solapa 2: antecedentes */
function htmlPacAntecedentes(p){
  const sinAnt = !!p.sinAntecedentes;
  const sistemas = Object.keys(ANTECEDENTES_SISTEMAS);
  return ''+
  '<div class="card plano"><h3>'+ico('lista')+'Antecedentes patológicos</h3>'+

    '<label class="toggle-verde'+(sinAnt?' on':'')+'" id="paSinAntL">'+
      '<input type="checkbox" id="paSinAnt"'+(sinAnt?' checked':'')+'>'+
      ico('check')+' Sin antecedentes relevantes</label>'+

    '<div id="paAntBloque"'+(sinAnt?' class="atenuado"':'')+'>'+
      '<label class="mini strong mt14" style="display:block">Antecedentes relevantes</label>'+
      '<div class="chips" id="paChips">'+ PATOLOGIAS_CHIP.map(x =>
        '<button type="button" class="chip'+(tieneAntecedente(p, x.n)?' on':'')+'" data-chip="'+esc(x.n)+'">'+
          esc(x.chip)+'</button>').join('')+
        '<button type="button" class="chip mas" id="paChipOtro">'+ico('mas')+' Otros</button>'+
      '</div>'+

      '<div class="campo mt14"><label>Buscar en el catálogo de antecedentes</label>'+
        '<div class="buscador"><input type="search" id="paAntBuscar" '+
          'placeholder="Ej.: hipertensión, asma, epilepsia…" autocomplete="off">'+
        '<div class="res" id="paAntRes"></div></div>'+
        '<div class="ayuda">Escribí al menos 2 letras. Si el antecedente no figura, lo agregás '+
        'manualmente desde el mismo buscador.</div></div>'+

      '<div class="seleccionados" id="paAntSel"></div>'+
      '<div id="paAntMeds"></div>'+

      '<details class="acc mt14"><summary><span class="n">'+ico('corazon')+'</span>'+
        'Revisión por sistemas<span class="flecha">'+ico('flecha')+'</span></summary>'+
        '<div class="cuerpo">'+ sistemas.map(s =>
          '<div class="mt8"><div class="mini strong" style="margin-bottom:5px">'+esc(s)+'</div>'+
          '<div class="chks">'+ ANTECEDENTES_SISTEMAS[s].map(n =>
            '<label class="chk'+(tieneAntecedente(p,n)?' sel':'')+'">'+
            '<input type="checkbox" class="pa-sis" value="'+esc(n)+'"'+
            (tieneAntecedente(p,n)?' checked':'')+'>'+esc(n)+'</label>').join('')+
          '</div></div>').join('') +'</div></details>'+

      campoArea('paAntOtros','Otros antecedentes y detalles', p.antecedentesOtros,
        'Cronología, tratamientos, internaciones, estudios previos…')+
    '</div>'+
  '</div>'+

  '<div class="card plano"><h3>'+ico('bisturi')+'Antecedentes quirúrgicos</h3>'+
    '<div class="chips" id="paQxChips">'+ CIRUGIAS_PREVIAS.map(n =>
      '<button type="button" class="chip'+((p.antQuirurgicos||[]).some(q => q.n===n)?' on':'')+
      '" data-qx="'+esc(n)+'">'+esc(n)+'</button>').join('') +'</div>'+
    '<div class="campo mt14"><label>Agregar otra cirugía</label>'+
      '<div style="display:flex;gap:8px">'+
        '<input type="text" id="paQxOtra" placeholder="Nombre de la cirugía" style="flex:1">'+
        '<input type="text" id="paQxAnio" placeholder="Año" style="width:90px" inputmode="numeric">'+
        '<button type="button" class="btn ghost chico" id="paQxAdd">'+ico('mas')+'</button>'+
      '</div></div>'+
    '<div id="paQxSel"></div>'+
  '</div>'+

  '<div class="card plano"><h3>'+ico('jeringa')+'Antecedentes anestésicos</h3>'+
    chksHTML('paAntAnest', ANTECEDENTES_ANESTESICOS, p.antAnestesicos)+
    campoArea('paAntAnestDet','Detalle de eventos anestésicos previos', p.antAnestDetalle,
      'Fecha, procedimiento, institución, qué ocurrió y cómo se resolvió')+
    '<div class="aviso danger" id="paAlertaHM" style="display:none">'+ico('fuego')+
      '<div><b>Antecedente de hipertermia maligna.</b> Planificar técnica libre de gatillantes '+
      '(TIVA), máquina purgada o con filtros de carbón activado, dantrolene disponible y '+
      'monitoreo de temperatura y EtCO₂.</div></div>'+
  '</div>'+

  '<div class="card plano"><h3>'+ico('pacientes')+'Antecedentes familiares</h3>'+
    chksHTML('paAntFam', ANTECEDENTES_FAMILIARES, p.antFamiliares)+
    campoArea('paAntFamDet','Detalle de los antecedentes familiares', p.antFamDetalle)+
  '</div>';
}

function tieneAntecedente(p, n){
  return (p.antecedentes || []).some(a => (a.n || a) === n);
}

function cablearPacAntecedentes(){
  const p = pacEdit;

  const refrescar = () => {
    pintarAntSeleccionados();
    pintarMedsSugeridas();
    $$('#paChips [data-chip]').forEach(b =>
      b.classList.toggle('on', tieneAntecedente(p, b.dataset.chip)));
    $$('.pa-sis').forEach(i => {
      const on = tieneAntecedente(p, i.value);
      i.checked = on;
      i.closest('.chk').classList.toggle('sel', on);
    });
  };

  const alternar = n => {
    const i = (p.antecedentes || []).findIndex(a => (a.n || a) === n);
    if(i >= 0) p.antecedentes.splice(i, 1);
    else {
      const cat = patologiaPorNombre(n);
      p.antecedentes.push({ n:n, sis: cat ? cat.sis : 'Otros' });
    }
    refrescar();
  };

  $$('#paChips [data-chip]').forEach(b => b.onclick = () => alternar(b.dataset.chip));
  $('#paChipOtro').onclick = () => { const i = $('#paAntBuscar'); if(i) i.focus(); };
  $$('.pa-sis').forEach(i => i.onclick = e => { e.preventDefault(); alternar(i.value); });

  montarBuscador({
    input: $('#paAntBuscar'), caja: $('#paAntRes'), manual: true,
    fuente: () => todasPatologias().map(x => ({
      etiqueta:x.n, sub:x.sis, busca: norm(x.n+' '+x.sis+' '+(x.chip||'')), dato:x })),
    onElegir: x => { if(!tieneAntecedente(p, x.dato.n)) alternar(x.dato.n); else refrescar(); },
    onManual: txt => {
      if(!txt) return;
      agregarExtra('pat', { n:txt, sis:'Agregado manualmente' });
      if(!tieneAntecedente(p, txt)){ p.antecedentes.push({ n:txt, sis:'Agregado manualmente' }); }
      refrescar();
      toast('Antecedente agregado al catálogo de la asociación.', 'ok');
    }
  });

  /* «Sin antecedentes relevantes» atenúa el bloque pero no borra nada:
     si el paciente después resulta tener algo, no se perdió lo cargado. */
  const sinAnt = () => {
    const on = $('#paSinAnt').checked;
    $('#paSinAntL').classList.toggle('on', on);
    $('#paAntBloque').classList.toggle('atenuado', on);
  };
  $('#paSinAnt').onchange = sinAnt;

  /* cirugías previas */
  const pintarQx = () => {
    const l = p.antQuirurgicos || [];
    $('#paQxSel').innerHTML = l.length
      ? '<div class="seleccionados">'+ l.map((q,i) =>
          '<span class="pill"><span>'+esc(q.n)+(q.anio?' ('+esc(q.anio)+')':'')+'</span>'+
          '<button data-qxq="'+i+'">&times;</button></span>').join('') +'</div>'
      : '<span class="mini">Sin cirugías previas cargadas.</span>';
    $$('#paQxSel [data-qxq]').forEach(b => b.onclick = () => {
      p.antQuirurgicos.splice(Number(b.dataset.qxq), 1); pintarQx();
      $$('#paQxChips [data-qx]').forEach(c =>
        c.classList.toggle('on', (p.antQuirurgicos||[]).some(q => q.n === c.dataset.qx)));
    });
  };
  $$('#paQxChips [data-qx]').forEach(b => b.onclick = () => {
    const n = b.dataset.qx;
    const i = (p.antQuirurgicos||[]).findIndex(q => q.n === n);
    if(i >= 0) p.antQuirurgicos.splice(i, 1); else p.antQuirurgicos.push({ n:n, anio:'' });
    b.classList.toggle('on', i < 0); pintarQx();
  });
  $('#paQxAdd').onclick = () => {
    const n = $('#paQxOtra').value.trim(); if(!n) return;
    p.antQuirurgicos.push({ n:n, anio:$('#paQxAnio').value.trim() });
    $('#paQxOtra').value = ''; $('#paQxAnio').value = ''; pintarQx();
  };
  pintarQx();

  cablearChks('paAntAnest'); cablearChks('paAntFam');
  const revisarHM = () => {
    const marcado = $$('#paAntAnest input:checked').some(i => i.value.indexOf('Hipertermia maligna') >= 0)
      || $$('#paAntFam input:checked').some(i => i.value.indexOf('Hipertermia maligna') >= 0);
    $('#paAlertaHM').style.display = marcado ? '' : 'none';
  };
  $('#paAntAnest').addEventListener('change', revisarHM);
  $('#paAntFam').addEventListener('change', revisarHM);
  revisarHM();

  refrescar();
}

function pintarAntSeleccionados(){
  const p = pacEdit;
  const c = $('#paAntSel'); if(!c) return;
  const l = p.antecedentes || [];
  c.innerHTML = l.length
    ? l.map((a,i) => '<span class="pill"><span>'+esc(a.n)+'</span>'+
        '<b class="comp">'+esc(a.sis||'')+'</b><button data-ant="'+i+'">&times;</button></span>').join('')
    : '<span class="mini">Sin antecedentes cargados.</span>';
  $$('#paAntSel [data-ant]').forEach(b => b.onclick = () => {
    p.antecedentes.splice(Number(b.dataset.ant), 1);
    pintarAntSeleccionados(); pintarMedsSugeridas();
    $$('#paChips [data-chip]').forEach(x =>
      x.classList.toggle('on', tieneAntecedente(p, x.dataset.chip)));
    $$('.pa-sis').forEach(i => {
      const on = tieneAntecedente(p, i.value);
      i.checked = on; i.closest('.chk').classList.toggle('sel', on);
    });
  });
}

/* Al cargar una patología se ofrece la medicación que habitualmente toma
   ese paciente, con la conducta perioperatoria de cada fármaco. No se
   agrega sola: hay que tocarla. */
function pintarMedsSugeridas(){
  const p = pacEdit;
  const c = $('#paAntMeds'); if(!c) return;
  const sug = medicacionSugerida(p.antecedentes)
    .filter(m => !(p.medicacion || []).some(x => x.n === m.n));
  if(!sug.length){ c.innerHTML = ''; return; }
  c.innerHTML = '<div class="aviso info mt14">'+ico('jeringa')+'<div>'+
    '<b>Medicación habitual asociada a estos antecedentes.</b> Tocá la que el paciente '+
    'realmente toma; cada una viene con su conducta perioperatoria.<div class="chips mt8">'+
    sug.map((m,i) => '<button type="button" class="chip" data-sug="'+i+'">'+ico('mas')+
      esc(m.n)+'</button>').join('')+
    '<button type="button" class="chip on" id="paSugTodas">Agregar todas</button>'+
    '</div></div></div>';
  const agregar = m => {
    if((p.medicacion||[]).some(x => x.n === m.n)) return;
    p.medicacion.push({ n:m.n, g:m.g, accion:m.accion, nota:m.nota, dosis:'', porque:m.porque });
  };
  $$('#paAntMeds [data-sug]').forEach(b => b.onclick = () => {
    agregar(sug[Number(b.dataset.sug)]); pintarMedsSugeridas();
    toast('Agregada a la medicación habitual.', 'ok');
  });
  $('#paSugTodas').onclick = () => { sug.forEach(agregar); pintarMedsSugeridas();
    toast(sug.length+' fármacos agregados a la medicación.', 'ok'); };
}

/* ------------------------------------------------- Solapa 3: medicacion */
function htmlPacMedicacion(p){
  return ''+
  '<div class="card plano"><h3>'+ico('jeringa')+'Medicación habitual</h3>'+
    '<div class="campo"><label>Buscar fármaco</label>'+
      '<div class="buscador"><input type="search" id="paMedBuscar" '+
        'placeholder="Ej.: aspirina, metformina, enalapril…" autocomplete="off">'+
      '<div class="res" id="paMedRes"></div></div>'+
      '<div class="ayuda">Cada fármaco trae la conducta perioperatoria sugerida según las guías '+
      'vigentes; podés modificarla.</div></div>'+
    '<div id="paMedSug"></div>'+
    '<div id="paMedLista" class="mt8"></div>'+
    campoArea('paMedOtros','Otra medicación o aclaraciones', p.medicacionOtros)+
  '</div>';
}

function cablearPacMedicacion(){
  const p = pacEdit;
  montarBuscador({
    input: $('#paMedBuscar'), caja: $('#paMedRes'), manual: true,
    fuente: () => FARMACOS_PERIOP.map(x => ({
      etiqueta:x.n, sub:x.g+' · '+({continuar:'Continuar',suspender:'Suspender',evaluar:'Evaluar'}[x.accion]),
      busca: norm(x.n+' '+x.g), dato:x })),
    onElegir: x => { if(!p.medicacion.some(m => m.n === x.dato.n))
        p.medicacion.push({ n:x.dato.n, g:x.dato.g, accion:x.dato.accion, nota:x.dato.nota, dosis:'' });
      pintarMedPaciente(); },
    onManual: txt => { if(!txt) return;
      p.medicacion.push({ n:txt, g:'Otro', accion:'evaluar', nota:'', dosis:'' }); pintarMedPaciente(); }
  });
  pintarMedPaciente();

  /* también acá se ofrece lo que sugieren los antecedentes ya cargados */
  const sug = medicacionSugerida(p.antecedentes).filter(m => !p.medicacion.some(x => x.n === m.n));
  const c = $('#paMedSug');
  if(sug.length){
    c.innerHTML = '<div class="aviso info">'+ico('info')+'<div>'+
      '<b>Sugerida por los antecedentes cargados.</b><div class="chips mt8">'+
      sug.map((m,i) => '<button type="button" class="chip" data-msug="'+i+'">'+ico('mas')+esc(m.n)+
        '</button>').join('')+'</div></div></div>';
    $$('#paMedSug [data-msug]').forEach(b => b.onclick = () => {
      const m = sug[Number(b.dataset.msug)];
      p.medicacion.push({ n:m.n, g:m.g, accion:m.accion, nota:m.nota, dosis:'', porque:m.porque });
      cablearPacMedicacion();
    });
  } else c.innerHTML = '';
}

function pintarMedPaciente(){
  const p = pacEdit;
  const cont = $('#paMedLista'); if(!cont) return;
  if(!p.medicacion.length){
    cont.innerHTML = '<p class="mini">Sin medicación cargada.</p>'; return;
  }
  const color = { continuar:'ok', suspender:'danger', evaluar:'warn' };
  const txt = { continuar:'CONTINUAR', suspender:'SUSPENDER', evaluar:'EVALUAR' };
  cont.innerHTML = p.medicacion.map((m,i) =>
    '<div class="med-card">'+
      '<div class="med-head">'+
        '<b>'+esc(m.n)+'</b>'+
        '<span class="tag '+color[m.accion]+'">'+txt[m.accion]+'</span>'+
        '<button class="btn ghost chico" data-mquitar="'+i+'">'+ico('borrar')+'</button>'+
      '</div>'+
      (m.porque ? '<div class="mini">Por su antecedente de '+esc(m.porque)+'</div>' : '')+
      '<div class="grid c2 mt8">'+
        '<div class="campo" style="margin:0"><label>Dosis y frecuencia</label>'+
          '<input type="text" data-mdosis="'+i+'" value="'+esc(m.dosis||'')+'" placeholder="Ej.: 10 mg/día"></div>'+
        '<div class="campo" style="margin:0"><label>Conducta perioperatoria</label>'+
          '<select data-maccion="'+i+'">'+
          ['continuar','suspender','evaluar'].map(a =>
            '<option value="'+a+'"'+(m.accion===a?' selected':'')+'>'+txt[a]+'</option>').join('')+
        '</select></div>'+
      '</div>'+
      (m.nota ? '<div class="med-nota">'+esc(m.nota)+'</div>' : '')+
    '</div>').join('');
  $$('#paMedLista [data-mquitar]').forEach(b => b.onclick = () => {
    p.medicacion.splice(Number(b.dataset.mquitar), 1); pintarMedPaciente(); });
  $$('#paMedLista [data-mdosis]').forEach(i => i.oninput = () =>
    p.medicacion[Number(i.dataset.mdosis)].dosis = i.value);
  $$('#paMedLista [data-maccion]').forEach(s => s.onchange = () => {
    p.medicacion[Number(s.dataset.maccion)].accion = s.value; pintarMedPaciente(); });
}

/* -------------------------------------------- Solapa 4: alergias y habitos */
function htmlPacAlergias(p){
  const h = p.habitos || {};
  const sinAle = (p.alergias||[]).indexOf('Sin alergias conocidas') >= 0;
  return ''+
  '<div class="card plano"><h3>'+ico('alerta')+'Alergias e intolerancias</h3>'+
    '<label class="toggle-verde'+(sinAle?' on':'')+'" id="paSinAleL">'+
      '<input type="checkbox" id="paSinAle"'+(sinAle?' checked':'')+'>'+
      ico('check')+' Sin alergias conocidas</label>'+
    '<div id="paAleBloque"'+(sinAle?' class="atenuado"':'')+' style="margin-top:12px">'+
      chksHTML('paAlerg', ALERGENOS, p.alergias)+
      campoArea('paAlergDet','Detalle de la reacción', p.alergiaDetalle,
        'Tipo de reacción, gravedad, fecha, estudio alergológico realizado')+
    '</div>'+
  '</div>'+

  '<div class="card plano"><h3>'+ico('hoja')+'Hábitos y estilo de vida</h3>'+
    '<div class="grid c2">'+
      campoSel('paTabaco','Tabaquismo', ['','No fumador','Ex fumador','Fumador activo'], h.tabaco)+
      campoTxt('paTabacoCant','Carga tabáquica (paquetes/año)', h.tabacoCant)+
    '</div>'+
    '<div class="grid c2">'+
      campoSel('paAlcohol','Alcohol', ['','No consume','Social','Consumo de riesgo','Dependencia'], h.alcohol)+
      campoSel('paDrogas','Otras sustancias',
        ['','No consume','Cannabis','Cocaína','Opioides','Múltiples','Prefiere no informar'], h.drogas)+
    '</div>'+
    campoSel('paActividad','Actividad física',
      ['','Sedentario','Actividad leve','Actividad moderada','Deportista'], h.actividad)+
  '</div>';
}

function cablearPacAlergias(){
  cablearChks('paAlerg');
  const sinAle = () => {
    const on = $('#paSinAle').checked;
    $('#paSinAleL').classList.toggle('on', on);
    $('#paAleBloque').classList.toggle('atenuado', on);
  };
  $('#paSinAle').onchange = sinAle;
}

/* ------------------------------------------------------------ Guardado */
function leerSolapaPaciente(){
  const p = pacEdit;
  const g = i => { const e = $('#'+i); return e ? e.value.trim() : undefined; };
  if(solapaPac === 'fil'){
    if($('#paApellido')){
      p.apellido = g('paApellido'); p.nombre = g('paNombre'); p.dni = g('paDni');
      p.hc = g('paHC'); p.fechaNac = g('paNac'); p.sexo = $('#paSexo').value;
      p.peso = g('paPeso'); p.talla = g('paTalla');
      /* obraSocial y nroAfiliado ya no se editan aca: los escribe la ficha */
      p.telefono = g('paTel'); p.grupoSanguineo = $('#paGrupo').value;
      p.email = g('paEmail'); p.domicilio = g('paDom'); p.localidad = $('#paLocalidad').value;
      p.contactoEmergencia = g('paEmergencia'); p.ocupacion = g('paOcupacion');
      p.observaciones = g('paObs');
    }
  } else if(solapaPac === 'ant'){
    if($('#paSinAnt')){
      p.sinAntecedentes = $('#paSinAnt').checked;
      p.antecedentesOtros = g('paAntOtros');
      p.antAnestesicos = leerChks('paAntAnest'); p.antAnestDetalle = g('paAntAnestDet');
      p.antFamiliares = leerChks('paAntFam');   p.antFamDetalle = g('paAntFamDet');
    }
  } else if(solapaPac === 'med'){
    if($('#paMedOtros')) p.medicacionOtros = g('paMedOtros');
  } else {
    if($('#paAlerg')){
      const sel = leerChks('paAlerg');
      p.alergias = $('#paSinAle').checked
        ? ['Sin alergias conocidas'].concat(sel.filter(x => x !== 'Sin alergias conocidas'))
        : sel.filter(x => x !== 'Sin alergias conocidas');
      p.alergiaDetalle = g('paAlergDet');
      p.habitos = { tabaco:$('#paTabaco').value, tabacoCant:g('paTabacoCant'),
                    alcohol:$('#paAlcohol').value, drogas:$('#paDrogas').value,
                    actividad:$('#paActividad').value };
    }
  }
}

function guardarPacienteEditado(){
  leerSolapaPaciente();
  const p = pacEdit;
  const id = p.__id;
  if(!p.apellido || !p.nombre){
    solapaPac = 'fil'; pintarEditorPaciente();
    return toast('Apellido y nombre son obligatorios.', 'err');
  }
  if(!p.dni){
    solapaPac = 'fil'; pintarEditorPaciente();
    return toast('El DNI es obligatorio.', 'err');
  }
  const dup = lista('pacientes').find(x => x.id !== id && norm(x.dni) === norm(p.dni));
  if(dup && !id) return toast('Ya existe un paciente con ese DNI: '+dup.apellido+', '+dup.nombre, 'err');

  const nid = id || uid('pac');
  const alGuardar = p.__alGuardar;
  delete p.__id; delete p.__alGuardar;
  const reg = Object.assign({}, p, {
    id:nid, ownerUid: p.ownerUid || SESION.uid,
    creado: p.creado || new Date().toISOString(),
    modificado: new Date().toISOString(), modificadoPor: SESION.uid
  });
  escribir('pacientes', nid, reg);
  auditar(id?'paciente-editar':'paciente-alta', reg.apellido+', '+reg.nombre);
  cerrarModal();
  toast(id ? 'Historia del paciente actualizada.' : 'Paciente creado.', 'ok');
  if(vistaActual === 'pacientes') vistaPacientes();
  if(alGuardar) alGuardar(nid);
  else if(!id) setTimeout(() => abrirPaciente(nid), 200);
}

/* =========================================================================
   DETALLE DEL PACIENTE
   ========================================================================= */
function abrirPaciente(id){
  const p = DB.pacientes[id]; if(!p) return;
  const fichas = fichasVisibles().filter(f => f.pacienteId === id)
    .sort((a,b) => (fechaDeFicha(b)||'') < (fechaDeFicha(a)||'') ? -1 : 1);
  const ed = edadDe(p.fechaNac);
  const imc = calcIMC(p.peso, p.talla);
  const ant = p.antecedentes || [];
  const alergias = (p.alergias || []).filter(a => a !== 'Sin alergias conocidas');
  const meds = p.medicacion || [];
  const h = p.habitos || {};

  const bloqueLista = (titulo, items, vacio) =>
    '<h3 class="sec-t">'+esc(titulo)+'</h3>'+
    (items.length
      ? '<div class="seleccionados">'+items.map(x => '<span class="pill"><span>'+esc(x)+'</span></span>').join('')+'</div>'
      : '<p class="mini">'+esc(vacio)+'</p>');

  const cuerpo = ''+
  '<div class="pac-cabecera">'+
    '<div class="avatar grande">'+esc(iniciales(p.nombre,p.apellido))+'</div>'+
    '<div><div class="pac-nombre">'+esc(p.apellido)+', '+esc(p.nombre)+'</div>'+
    '<div class="mini">DNI '+esc(p.dni||'—')+(p.hc?' · HC '+esc(p.hc):'')+
      (ed!==null?' · '+ed+' años':'')+
      (p.sexo?' · '+({F:'Femenino',M:'Masculino',X:'X'}[p.sexo]||''):'')+'</div></div>'+
  '</div>'+

  (alergias.length ? '<div class="aviso danger">'+ico('alerta')+'<div><b>Alergias: </b>'+
    esc(alergias.join(' · '))+(p.alergiaDetalle ? '<br><span class="mini">'+esc(p.alergiaDetalle)+'</span>' : '')+
    '</div></div>' : '')+

  '<div class="grid c3 mb8">'+
    kpiMini('Peso', p.peso ? p.peso+' kg' : '—')+
    kpiMini('Talla', p.talla ? p.talla+' cm' : '—')+
    kpiMini('IMC', imc ? fNum(imc,1) : '—')+
  '</div>'+
  (imc ? '<p class="mini mb8" style="text-align:center">'+esc(clasificaIMC(imc))+'</p>' : '')+

  '<div class="card plano" style="margin-bottom:12px">'+
    fila('Obra social', (p.obraSocial||'Sin cobertura') + (p.nroAfiliado ? ' — N.º '+p.nroAfiliado : ''))+
    fila('Grupo y factor', p.grupoSanguineo || '—')+
    fila('Teléfono', p.telefono || '—')+
    fila('Correo electrónico', p.email || '—')+
    fila('Domicilio', [p.domicilio, p.localidad].filter(Boolean).join(', ') || '—')+
    fila('Ocupación', p.ocupacion || '—')+
    fila('Contacto de emergencia', p.contactoEmergencia || '—')+
    (p.observaciones ? fila('Observaciones', p.observaciones) : '')+
    fila('Cargado por', nombreUsuario(p.ownerUid) +
      (p.modificadoPor && p.modificadoPor !== p.ownerUid
        ? ' · última edición: ' + nombreUsuario(p.modificadoPor) : ''))+
  '</div>'+

  '<h3 class="sec-t">Antecedentes patológicos</h3>'+
  (p.sinAntecedentes && !ant.length
    ? '<div class="aviso ok">'+ico('check')+'<div>Sin antecedentes relevantes.</div></div>'
    : (ant.length
      ? '<div class="seleccionados">'+ant.map(a =>
          '<span class="pill"><span>'+esc(a.n)+'</span><b class="comp">'+esc(a.sis||'')+'</b></span>').join('')+'</div>'
      : '<p class="mini">Sin antecedentes cargados.</p>'))+
  (p.antecedentesOtros ? '<p class="mini mt8">'+esc(p.antecedentesOtros)+'</p>' : '')+

  '<h3 class="sec-t">Medicación habitual</h3>'+
  (meds.length
    ? '<div class="lista chica">'+meds.map(m => {
        const color = { continuar:'ok', suspender:'danger', evaluar:'warn' }[m.accion] || '';
        const txt = { continuar:'CONTINUAR', suspender:'SUSPENDER', evaluar:'EVALUAR' }[m.accion] || '';
        return '<div class="item plano"><div class="txt"><b>'+esc(m.n)+'</b>'+
          '<span>'+esc([m.g, m.dosis].filter(Boolean).join(' · '))+'</span></div>'+
          '<div class="der"><span class="tag '+color+'">'+txt+'</span></div></div>';
      }).join('')+'</div>'
    : '<p class="mini">Sin medicación cargada.</p>')+
  (p.medicacionOtros ? '<p class="mini mt8">'+esc(p.medicacionOtros)+'</p>' : '')+

  bloqueLista('Antecedentes quirúrgicos',
    (p.antQuirurgicos||[]).map(q => q.n + (q.anio ? ' ('+q.anio+')' : '')),
    'Sin cirugías previas cargadas.')+

  bloqueLista('Antecedentes anestésicos', p.antAnestesicos || [], 'Sin antecedentes anestésicos.')+
  (p.antAnestDetalle ? '<p class="mini mt8">'+esc(p.antAnestDetalle)+'</p>' : '')+

  bloqueLista('Antecedentes familiares', p.antFamiliares || [], 'Sin antecedentes familiares.')+
  (p.antFamDetalle ? '<p class="mini mt8">'+esc(p.antFamDetalle)+'</p>' : '')+

  '<h3 class="sec-t">Hábitos</h3>'+
  '<div class="card plano">'+
    fila('Tabaquismo', (h.tabaco || '—') + (h.tabacoCant ? ' — '+h.tabacoCant+' paq/año' : ''))+
    fila('Alcohol', h.alcohol || '—')+
    fila('Otras sustancias', h.drogas || '—')+
    fila('Actividad física', h.actividad || '—')+
  '</div>'+

  '<h3 class="sec-t">Fichas anestésicas ('+fichas.length+')</h3>'+
  (nubeOK && !periodoCargado('2000-01-01')
    ? '<div class="aviso info mb8">'+ico('nube')+'<div>Se listan las fichas de los últimos 90 días '+
      'y las que ya se trajeron. <button type="button" class="btn ghost chico mt8" id="pdHistorial">'+
      ico('descargar')+' Traer el historial completo</button></div></div>' : '')+
  (fichas.length ? '<div class="lista">'+ fichas.map(f =>
      '<div class="item" data-ficha="'+f.id+'">'+
        '<div class="avatar" style="background:'+(esNoProgramado(caracterActo(f))?'var(--danger-bg);color:var(--danger)':'var(--aqua-200);color:var(--aqua-600)')+'">'+
          ico('ficha')+'</div>'+
        '<div class="txt"><b>'+
          (fichas.length > 1
            ? '<span class="tag aqua" style="margin-right:6px">'+
              esc(ordinalFem(numeroDeIntervencion(f)))+'</span>' : '')+
          esc(f.cirugia||'Sin cirugía cargada')+'</b>'+
          '<span>'+(fechaCirugiaDe(f)
            ? 'cirugía '+fFecha(fechaCirugiaDe(f))
            : 'valoración '+fFecha(fechaValoracionDe(f)))+
          ' · '+esc(nombreInstitucion(f.institucion).split('"')[0].trim())+'</span>'+
          '<span class="quien">'+
            (esAutorFicha(f) ? 'Valoración tuya' : 'Valoración de '+esc(autorFicha(f)))+
            ' · '+(esActorFicha(f) ? 'acto tuyo'
                 : actoLibre(f) ? 'acto sin tomar' : 'acto de '+esc(nombreActor(f)))+
          '</span></div>'+
        '<div class="der">'+etiquetaEstadoFicha(f)+'</div>'+
      '</div>').join('') +'</div>'
    : '<p class="mini">Todavía no hay fichas para este paciente.</p>');

  abrirModal('Paciente', cuerpo,
    '<button class="btn ghost" id="pdEditar">'+ico('editar')+' Editar historia</button>'+
    '<button class="btn pri" id="pdNuevaFicha">'+ico('mas')+' Nueva ficha</button>', '980px');

  if($('#pdHistorial')) $('#pdHistorial').onclick = () => {
    toast('Trayendo el historial…');
    cargarFichasDesde('2000-01-01').then(ok => {
      cerrarModal();
      if(ok) setTimeout(() => abrirPaciente(id), 150);
      else toast('No se pudo traer el historial. Revisá la conexión.', 'err');
    });
  };
  $('#pdEditar').onclick = () => { cerrarModal(); setTimeout(() => editarPaciente(id), 180); };
  $('#pdNuevaFicha').onclick = () => { cerrarModal(); setTimeout(() => abrirFicha(null, id), 180); };
  $$('#modal .item[data-ficha]').forEach(it => {
    it.onclick = () => { const fid = it.dataset.ficha; cerrarModal(); setTimeout(() => abrirFicha(fid), 180); };
  });
}

function kpiMini(l, v){
  return '<div class="kpi"><div class="lbl">'+esc(l)+'</div><div class="val" style="font-size:19px">'+esc(v)+'</div></div>';
}
function fila(l, v){
  return '<div class="doc-par" style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--borde);font-size:13px">'+
    '<b style="min-width:135px;color:var(--texto-2);font-weight:650">'+esc(l)+'</b>'+
    '<span style="flex:1">'+esc(v)+'</span></div>';
}
/* Los tres estados de una ficha, con el matiz que hace falta para distinguir
   la que ya se firmó de la que quedó a mitad de camino. «Realizada» es
   ambigua: puede ser una valoración cerrada esperando la cirugía o un acto
   registrado sin firmar. Se dice cuál de las dos es. */
function etiquetaEstadoFicha(f){
  if(f.estado === 'cerrada')   return '<span class="tag ok">'+ico('check')+'Finalizada</span>';
  if(f.estado === 'realizada'){
    if(!fechaCirugiaDe(f))     return '<span class="tag info">Valoración cerrada</span>';
    return (f.acto||{}).finAnestesia
      ? '<span class="tag warn">Falta firmar</span>'
      : '<span class="tag info">Realizada</span>';
  }
  return '<span class="tag warn">Borrador</span>';
}
