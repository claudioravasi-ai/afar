/* =========================================================================
   MODO CAMILLA — la etapa 3 como la maqueta del teléfono
   -------------------------------------------------------------------------
   Pedido de Claudio (13-09-2026): que la pantalla del acto anestésico se vea
   y funcione como el «Modo Camilla» de la propuesta (modo-camilla.html):
   tema oscuro, cuatro pestañas —Plantilla · Preparar · Durante · Cerrar—,
   hitos que guardan la hora con un toque, gráfico con los símbolos de la
   hoja (v TAS, ^ TAD, • FC), los cinco signos con más y menos, «Registrar»,
   y las drogas frecuentes a mano.

   No es otra ficha ni otra base: escribe en el mismo `f.acto` de siempre.
     hitos          -> a.ingreso, a.inicioAnestesia, a.inicioCirugia,
                       a.finCirugia, a.finAnestesia, a.salida
     signos         -> a.controles
     drogas         -> a.drogas (con el vademécum y la dosis confirmada)
     plantilla      -> a.tecnicas, a.tecnicaDetalle, a.dispositivo,
                       a.monitor / a.monitorExtra y a.camilla (tildes y
                       valores de la hoja)
     balance        -> a.balance
     eventos        -> a.sinEventos / a.eventos2
     destino        -> a.destinoReal (lo propone en Recuperación)
   Las reglas de firma son las de siempre. «Registro completo» vuelve a las
   cinco solapas clásicas (vademécum con calculadora, TOF, balance detallado)
   y desde ahí «Modo camilla» regresa: las dos pantallas son la misma ficha.

   Las drogas y dosis de las plantillas son las de la propuesta: son de
   ejemplo y las tiene que validar la asociación. La dosis nunca se registra
   sola: al tocar una droga se abre el vademécum para confirmarla.
   ========================================================================= */

const LS_VISTA_ACTO = 'afar_vista_acto_v1';
function vistaActoEsCamilla(){
  try{ return (localStorage.getItem(LS_VISTA_ACTO) || 'camilla') === 'camilla'; }catch(e){ return true; }
}
function fijarVistaActo(v){ try{ localStorage.setItem(LS_VISTA_ACTO, v); }catch(e){} }

const CM_GRUPOS = [
  ['Control',     ['Equipo anest.','Respirador','Monitores','Alarmas']],
  ['Monitoreo',   ['ECG','Oxímetro','Capnógrafo','TA no inv.','TA inv.','P.V.C.','Termómetro','Relaj. N. musc.']],
  ['Cuidados',    ['Protec. ocular','Protec. decúbitos','Cob. térmica','S. vesical','S. naso gást.']],
  ['Vía aérea',   ['Preox. 3 min','Aire amb.','Cánula nasal','Máscara facial','Masc. laríngea','Int. oro T','Int. naso T','C/manguito']],
  ['Ventilación', ['Espontánea','Asistida','Manual','Mecánica','Reinhalación c/canister']]
];
const CM_BASE = ['Equipo anest.','Monitores','Alarmas','ECG','Oxímetro','TA no inv.'];

const CM_TPL = {
  iot:{ n:'General balanceada con IOT', para:'Cirugía programada del adulto', tec:'General balanceada',
    tecnicas:['general'], va:'Intubación', vt:true,
    on:[...CM_BASE,'Respirador','Capnógrafo','Termómetro','Relaj. N. musc.','Protec. ocular','Protec. decúbitos','Cob. térmica','Preox. 3 min','Int. oro T','C/manguito','Mecánica','Reinhalación c/canister'],
    vals:[['Tubo N°','7,5 c/manguito'],['PEEP · FiO₂','5 · 50 %'],['Vía A','18 G'],['Hidratación','Ringer lactato']],
    dr:[['Midazolam','2 mg'],['Fentanilo','50 µg'],['Propofol','160 mg'],['Rocuronio','10 mg'],['Sevoflurano','2 %'],['Cefazolina','2 g'],['Dexametasona','8 mg'],['Ondansetrón','4 mg'],['Dipirona','2 g'],['Sugammadex','200 mg'],['Efedrina','5 mg'],['Atropina','0,5 mg']] },
  ml:{ n:'General con máscara laríngea', para:'Cirugía corta, sin riesgo de aspiración', tec:'General con máscara laríngea',
    tecnicas:['general'], va:'Máscara laríngea',
    on:[...CM_BASE,'Respirador','Capnógrafo','Protec. ocular','Preox. 3 min','Masc. laríngea','Asistida','Reinhalación c/canister'],
    vals:[['ML N°','4 · 2ª generación'],['Ventilación','Asistida'],['FiO₂','50 %'],['Vía A','20 G'],['Hidratación','Ringer lactato']],
    dr:[['Fentanilo','100 µg'],['Propofol','180 mg'],['Sevoflurano','2 %'],['Dexametasona','8 mg'],['Ondansetrón','4 mg'],['Ketorolac','30 mg'],['Dipirona','2 g'],['Efedrina','5 mg']] },
  tiva:{ n:'TIVA', para:'Endovenosa total, sin inhalatorios', tec:'Endovenosa total (TIVA)',
    tecnicas:['general'], va:'Intubación', vt:true,
    on:[...CM_BASE,'Respirador','Capnógrafo','Termómetro','Relaj. N. musc.','Protec. ocular','Cob. térmica','Preox. 3 min','Int. oro T','C/manguito','Mecánica'],
    vals:[['Tubo N°','7,0 c/manguito'],['Propofol','BIC'],['Remifentanilo','BIC'],['Hidratación','Ringer lactato']],
    dr:[['Propofol','120 mg'],['Remifentanilo','BIC'],['Rocuronio','35 mg'],['Dexametasona','8 mg'],['Ondansetrón','4 mg'],['Dipirona','2 g'],['Morfina','3 mg']] },
  sir:{ n:'Urgencia con secuencia rápida', para:'Estómago lleno, guardia', tec:'General con secuencia rápida',
    tecnicas:['general'], va:'Intubación', vt:true, urgencia:true,
    on:[...CM_BASE,'Respirador','Capnógrafo','Protec. ocular','Preox. 3 min','Int. oro T','C/manguito','Mecánica','Reinhalación c/canister','S. naso gást.'],
    vals:[['Tubo N°','7,5 c/manguito'],['Aspiración','Lista'],['Hidratación','Ringer lactato']],
    dr:[['Fentanilo','100 µg'],['Propofol','140 mg'],['Succinilcolina','100 mg'],['Rocuronio','85 mg'],['Sevoflurano','2 %'],['Cefazolina','2 g'],['Metronidazol','500 mg'],['Dipirona','2 g'],['Efedrina','5 mg']] },
  raqui:{ n:'Raquídea', para:'Cesárea, traumatología, urología', tec:'Regional · intratecal',
    tecnicas:['raquidea'], va:'Punción',
    on:[...CM_BASE,'Cánula nasal','Espontánea','Cob. térmica'],
    vals:[['Aguja N°','25 G'],['Tipo','Punta de lápiz'],['Punción','L3-L4, sentada'],['Hidratación','Cocarga Ringer']],
    dr:[['Bupivacaína 0,5 % hiperb.','10 mg'],['Fentanilo intratecal','20 µg'],['Fenilefrina','100 µg'],['Efedrina','5 mg'],['Oxitocina','5 UI'],['Cefazolina','2 g'],['Ondansetrón','4 mg'],['Dipirona','2 g']] },
  parto:{ n:'Analgesia de parto', para:'Peridural con catéter', tec:'Regional · peridural con catéter',
    tecnicas:['peridural'], va:'Punción',
    on:['Monitores','Alarmas','Oxímetro','TA no inv.','Aire amb.','Espontánea'],
    vals:[['Aguja N°','Tuohy 18 G'],['Catéter N°','20 G · 4 cm en espacio'],['Punción','L2-L3'],['Hidratación','Ringer lactato']],
    dr:[['Lidocaína 2 % (dosis prueba)','3 ml'],['Bupivacaína 0,1 %','10 ml'],['Fentanilo peridural','50 µg'],['Efedrina','5 mg'],['Dipirona','2 g']] },
  sed:{ n:'Sedación / cuidado monitorizado', para:'Endoscopía, procedimientos cortos', tec:'Sedación',
    tecnicas:['sedacion'], va:'Inicio sedación',
    on:[...CM_BASE,'Capnógrafo','Cánula nasal','Espontánea'],
    vals:[['O₂','Cánula 3 l/min'],['Vía A','22 G'],['Profundidad','Moderada'],['Hidratación','Solución fisiológica']],
    dr:[['Propofol','30 mg'],['Fentanilo','50 µg'],['Midazolam','1 mg'],['Dipirona','2 g'],['Atropina','0,5 mg']] },
  bloq:{ n:'Bloqueo ecoguiado + sedación', para:'Miembro superior o inferior', tec:'Regional · plexual',
    tecnicas:['bloqueo'], va:'Punción',
    on:[...CM_BASE,'Capnógrafo','Cánula nasal','Espontánea','Protec. decúbitos'],
    vals:[['Bloqueo','Plexo braquial supraclavicular'],['Aguja','22 G 50 mm ecogénica'],['Guía','Ecografía'],['Hidratación','Ringer lactato']],
    dr:[['Bupivacaína 0,5 %','20 ml'],['Lidocaína 2 %','5 ml'],['Dexametasona perineural','4 mg'],['Midazolam','1 mg'],['Propofol','BIC'],['Cefazolina','2 g'],['Dipirona','2 g']] }
};
/* Las drogas de la maqueta con el nombre que tienen en el vademécum */
const CM_VADE = {
  'Dipirona':'Dipirona / Metamizol', 'Atropina':'Atropina (bradicardia)',
  'Bupivacaína 0,5 % hiperb.':'Bupivacaína hiperbárica 0,5 % — raquídea',
  'Lidocaína 2 % (dosis prueba)':'Lidocaína', 'Lidocaína 2 %':'Lidocaína',
  'Bupivacaína 0,1 %':'Bupivacaína / ropivacaína — peridural', 'Bupivacaína 0,5 %':'Bupivacaína',
  'Dexametasona perineural':'Dexametasona (adyuvante)', 'Fentanilo peridural':'Fentanilo'
};
const CM_DROGAS_BASE = [['Midazolam','2 mg'],['Fentanilo','100 µg'],['Propofol',''],['Rocuronio',''],
  ['Dexametasona','8 mg'],['Ondansetrón','4 mg'],['Efedrina','5 mg'],['Atropina','0,5 mg']];

const CM_HITOS = [['ingreso','→','Ingreso'],['inicioAnestesia','✕','Inicio anestesia'],['va','↧',null],
  ['inicioCirugia','⊙','Inicio operación'],['finCirugia','⊡','Fin operación'],
  ['finAnestesia','⊗','Fin anestesia'],['salida','←','Egreso']];
const CM_POS = ['DD','DV','DLD','DLI','L','T','F'];
const CM_SIGNOS = [['tas','TAS',5,[40,240]],['tad','TAD',5,[20,160]],['fc','FC',2,[20,220]],
  ['spo2','SpO₂',1,[50,100]],['etco2','EtCO₂',1,[10,90]]];
const CM_MON    = { 'ECG':'ECG', 'TA no inv.':'PANI', 'Oxímetro':'SpO₂', 'Capnógrafo':'EtCO₂',
                    'Termómetro':'Temperatura', 'Relaj. N. musc.':'TOF' };
const CM_MON_EX = { 'TA inv.':'PA invasiva', 'P.V.C.':'PVC' };

let CM = { fichaId:'', tab:'', cur:null };

/* ------------------------------------------------------------- estado */
function cmEstado(f){
  const a = f.acto || {};
  if(CM.fichaId !== f.id){
    const c = a.camilla || {};
    CM = { fichaId:f.id, cur:null,
      tab: a.inicioAnestesia ? 'durante' : (c.plantilla ? 'preparar' : 'plantilla') };
  }
  if(!CM.cur){
    const ult = (a.controles || []).slice().reverse().find(c => c.tas || c.fc);
    const p = DB.pacientes[f.pacienteId] || {};
    const n = (typeof vitalesNormalesDe === 'function') ? vitalesNormalesDe(p, f).v : {};
    const de = (k, d) => Number((ult || {})[k]) || Number(n[k]) || d;
    CM.cur = { tas:de('tas',120), tad:de('tad',70), fc:de('fc',75), spo2:de('spo2',98), etco2:de('etco2',35) };
  }
  return CM;
}

/* Cada cambio: se escribe en fichaActual.acto, se repinta y se guarda solo */
function cmCambiar(fn, aviso){
  fichaActual.acto = leerPasoAnestesia();
  const a = fichaActual.acto;
  a.camilla = Object.assign({ checks:[], vals:[], plantilla:'', pos:'DD', hitos:{} }, a.camilla || {});
  fn(a);
  pintarPasoAnestesia(fichaActual);
  autoguardarActo(true);
  if(aviso) toast(aviso, 'ok');
}

function cmAlergia(nombre){
  const p = DB.pacientes[(fichaActual || {}).pacienteId] || {};
  const al = (p.alergias || []).filter(x => x && x !== 'Sin alergias conocidas')
    .concat(p.alergiaDetalle ? [p.alergiaDetalle] : []);
  const n = norm(nombre);
  return al.find(x => norm(x).split(/[^a-z0-9]+/).some(w => w.length >= 5 && n.indexOf(w) >= 0)) || '';
}

function cmFaltantes(f){
  const a = f.acto || {}, r = f.recup || {}, l = [];
  if(pacienteProvisional(f)) l.push('identidad del paciente');
  if(!consentimientoCompleto(f)) l.push('consentimiento');
  if(estadoPaso(f, 'preanestesia') !== 'ok') l.push('valoración');
  if(!a.inicioAnestesia) l.push('inicio de anestesia');
  if(!a.finAnestesia) l.push('fin de anestesia');
  if(!(a.tecnicas || []).length) l.push('técnica');
  if(!(a.drogas || []).length) l.push('drogas');
  if(!(a.controles || []).length) l.push('signos vitales');
  if(!a.sinEventos && !(a.eventos2 || []).length) l.push('eventos adversos (sí / no)');
  return l;
}

/* --------------------------------------------------------- gráfico */
function cmGrafico(a){
  const ahora = tzMin(ahoraHora());
  const ctr = (a.controles || []).map(c => ({ m:tzMin(c.hora), c })).filter(x => x.m !== null);
  const inicio = tzPrimero(tzMin(a.ingreso), tzMin(a.inicioAnestesia),
    ctr.length ? Math.min.apply(null, ctr.map(x => x.m)) : null, Math.max(0, ahora - 45));
  const t0 = Math.floor(inicio / 15) * 15;
  const aj = m => (m !== null && m < t0 - 60) ? m + 1440 : m;
  ctr.forEach(x => { x.m = aj(x.m); });
  ctr.sort((x, y) => x.m - y.m);
  const fin = Math.max(aj(ahora), ctr.length ? ctr[ctr.length - 1].m : 0, aj(tzMin(a.finAnestesia)) || 0);
  const t1 = Math.max(t0 + 120, Math.ceil((fin + 10) / 15) * 15);
  const W = 320, L = 32, R = 6, T = 16, GH = 168, RB = 32, B = 16, H = GH + RB;
  const x = t => L + (t - t0) / (t1 - t0) * (W - L - R);
  const y = v => T + (220 - Math.max(40, Math.min(220, v))) / 180 * (GH - T - B);
  const ink = '#8ea6bd', grid = '#1f3a57', fc = '#2dd4bf', ta = '#fb7185', mono = 'ui-monospace,Menlo,monospace';
  let s = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Gráfico de tensión arterial y frecuencia cardíaca">';
  for(let v = 40; v <= 220; v += 20){
    s += '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="'+grid+'" stroke-width="'+(v%40===0?0.8:0.4)+'"/>';
    if(v % 40 === 0) s += '<text x="'+(L-4)+'" y="'+(y(v)+3)+'" text-anchor="end" font-size="8" fill="'+ink+'" font-family="'+mono+'">'+v+'</text>';
  }
  const cada = (t1 - t0) > 240 ? 60 : 30;
  for(let t = t0; t <= t1; t += 15){
    s += '<line x1="'+x(t)+'" x2="'+x(t)+'" y1="'+T+'" y2="'+(GH-B)+'" stroke="'+grid+'" stroke-width="'+(t%cada===0?0.8:0.4)+'"/>';
    if(t % cada === 0) s += '<text x="'+x(t)+'" y="'+(GH-4)+'" text-anchor="middle" font-size="8" fill="'+ink+'" font-family="'+mono+'">'+tzHora(t)+'</text>';
  }
  [['inicioAnestesia','✕'],['inicioCirugia','⊙'],['finAnestesia','⊗']].forEach(([k, g]) => {
    const t = aj(tzMin(a[k])); if(t === null || t < t0 || t > t1) return;
    s += '<line x1="'+x(t)+'" x2="'+x(t)+'" y1="'+T+'" y2="'+(GH-B)+'" stroke="'+ink+'" stroke-dasharray="2 3" stroke-width="0.8"/>'+
      '<text x="'+x(t)+'" y="'+(T-4)+'" text-anchor="middle" font-size="10" fill="#e6f0f8">'+g+'</text>';
  });
  const linea = (k, col) => {
    const p = ctr.filter(q => Number(q.c[k])).map(q => x(q.m)+','+y(Number(q.c[k])));
    return p.length > 1 ? '<polyline points="'+p.join(' ')+'" fill="none" stroke="'+col+'" stroke-opacity=".35" stroke-width="1"/>' : '';
  };
  s += linea('tas', ta) + linea('tad', ta) + linea('fc', fc);
  const z = 2.6;
  ctr.forEach(q => {
    const X = x(q.m), sa = Number(q.c.tas), da = Number(q.c.tad), f = Number(q.c.fc);
    if(sa) s += '<path d="M'+(X-z)+' '+(y(sa)-z)+' L'+X+' '+(y(sa)+z)+' L'+(X+z)+' '+(y(sa)-z)+'" fill="none" stroke="'+ta+'" stroke-width="1.3"/>';
    if(da) s += '<path d="M'+(X-z)+' '+(y(da)+z)+' L'+X+' '+(y(da)-z)+' L'+(X+z)+' '+(y(da)+z)+'" fill="none" stroke="'+ta+'" stroke-width="1.3"/>';
    if(f)  s += '<circle cx="'+X+'" cy="'+y(f)+'" r="2" fill="'+fc+'"/>';
  });
  const xa = x(aj(ahora));
  if(xa >= L && xa <= W - R) s += '<line x1="'+xa+'" x2="'+xa+'" y1="'+T+'" y2="'+(GH-B)+'" stroke="#2dd4bf" stroke-width="1.2"/>';
  s += '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+(GH+2)+'" y2="'+(GH+2)+'" stroke="'+grid+'" stroke-width="0.8"/>';
  [['SpO₂','spo2',GH+13],['EtCO₂','etco2',GH+28]].forEach(([rot, k, yy]) => {
    s += '<text x="2" y="'+yy+'" font-size="8" fill="'+ink+'" font-family="'+mono+'">'+rot+'</text>';
    const puestos = [];
    ctr.slice().reverse().forEach(q => {
      const v = q.c[k]; if(v === '' || v === undefined || v === null) return;
      const X = x(q.m); if(X < L + 8 || puestos.some(p => Math.abs(p - X) < 17)) return;
      puestos.push(X);
      s += '<text x="'+X+'" y="'+yy+'" text-anchor="middle" font-size="8" fill="#e6f0f8" font-family="'+mono+'">'+esc(v)+'</text>';
    });
  });
  return s + '</svg>';
}

/* --------------------------------------------------------- pantallas */
function cmPlantilla(f){
  const a = f.acto || {}, c = a.camilla || {};
  return '<div class="cm-blk"><div class="cm-lb"><span>Plantilla del acto</span><span>'+Object.keys(CM_TPL).length+'</span></div>'+
    '<div class="cm-tpl-list">'+ Object.keys(CM_TPL).map(k => { const t = CM_TPL[k];
      return '<button type="button" class="cm-tpl'+(c.plantilla===k?' on':'')+'" data-cmtpl="'+k+'">'+
        '<i class="dot"></i><b>'+esc(t.n)+'</b><span>'+esc(t.para)+'</span></button>'; }).join('') +'</div></div>'+
    '<div class="cm-blk"><div class="cm-lb"><span>Además</span></div><div class="cm-chips">'+
      '<button type="button" class="cm-ch'+(c.plantilla===''&&c.sinPlantilla?' on':'')+'" data-cmtpl="">Sin plantilla</button></div></div>'+
    '<p class="cm-nota">Las drogas y dosis de las plantillas son de ejemplo, a validar por la asociación. La dosis se confirma siempre en el vademécum.</p>';
}

function cmVT(f){
  const p = DB.pacientes[f.pacienteId] || {};
  const pi = (p.talla && p.sexo && typeof pesoIdeal === 'function') ? pesoIdeal(p.talla, p.sexo) : 0;
  return pi ? Math.round(pi * 7) + ' ml (7 ml/kg p. ideal) · FR 12' : 'falta talla y sexo';
}

function cmPreparar(f){
  const a = f.acto || {}, c = a.camilla || {};
  const t = CM_TPL[c.plantilla];
  const checks = c.checks || [];
  let h = CM_GRUPOS.map(([g, items]) =>
    '<div class="cm-blk"><div class="cm-lb"><span>'+g+'</span><span>'+items.filter(i => checks.indexOf(i) >= 0).length+'/'+items.length+'</span></div>'+
    '<div class="cm-chips">'+ items.map(i => '<button type="button" class="cm-ch'+(checks.indexOf(i)>=0?' on':'')+'" data-cmchk="'+esc(i)+'">'+esc(i)+'</button>').join('') +'</div></div>').join('');
  const vals = (c.vals || []).slice();
  if(t && t.vt) vals.unshift(['VT · FR', cmVT(f)]);
  h += '<div class="cm-blk"><div class="cm-lb"><span>'+(t && /Regional/.test(t.tec) ? 'Anestesia regional' : 'Valores')+'</span><span>tocar para cambiar</span></div>'+
    '<div class="cm-vals">'+
      '<div class="cm-val"><span>Técnica</span><b>'+esc(a.tecnicaDetalle || (t ? t.tec : '—'))+'</b></div>'+
      vals.map((v, i) => '<button type="button" class="cm-val" data-cmval="'+(t && t.vt ? i - 1 : i)+'"><span>'+esc(v[0])+'</span><b>'+esc(v[1])+'</b></button>').join('')+
    '</div></div>';
  return h;
}

function cmDurante(f){
  const a = f.acto || {}, c = a.camilla || {}, st = cmEstado(f);
  const t = CM_TPL[c.plantilla];
  const hitos = c.hitos || {};
  const horaDe = k => k === 'va' ? hitos.va : a[k];
  let h = '<div class="cm-blk"><div class="cm-lb"><span>Hitos · tocar guarda la hora</span></div><div class="cm-hitos">'+
    CM_HITOS.map(([k, g, n]) => { const v = horaDe(k);
      return '<button type="button" class="cm-hito'+(v?' on':'')+'" data-cmhito="'+k+'"><span class="g">'+g+'</span>'+
        '<span class="n">'+esc(n || (t ? t.va : 'Vía aérea'))+'</span><span class="t">'+esc(v || 'tocar')+'</span></button>'; }).join('')+
    '<button type="button" class="cm-hito on" data-cmpos="1"><span class="g">⤢</span><span class="n">Posición</span>'+
      '<span class="t" style="color:#e6f0f8">'+esc(c.pos || 'DD')+'</span></button></div></div>';
  /* El gráfico se traza AHÍ MISMO con el dedo, el lápiz o el mouse: tocarlo
     lo convierte en la grilla de dibujo. Ver abrirTrazoVitales({en}). */
  h += '<div class="cm-chart" id="cmChart"><div class="cm-chart-toque" data-cmtrazo="1" role="button" '+
    'aria-label="Trazar las curvas sobre el gráfico">'+cmGrafico(a)+'</div>'+
    '<div class="cm-leg"><span><b style="color:#fb7185">v</b> TAS</span>'+
    '<span><b style="color:#fb7185">^</b> TAD</span><span><b style="color:#2dd4bf">•</b> FC</span>'+
    '<span>SpO₂ y EtCO₂ en números</span>'+
    '<button type="button" class="cm-mini" data-cmtrazo="1">✎ Trazar con el dedo</button></div></div>';
  h += '<div class="cm-blk"><div class="cm-lb"><span>Signos · ahora <span id="cmAhora">'+ahoraHora()+'</span></span><span>los 5 juntos</span></div><div class="cm-vit">'+
    CM_SIGNOS.map(([k, n]) => '<div class="cm-v"><span>'+n+'</span><b>'+st.cur[k]+'</b><div class="pm">'+
      '<button type="button" data-cmdv="'+k+'" data-d="-1" aria-label="bajar '+n+'">−</button>'+
      '<button type="button" data-cmdv="'+k+'" data-d="1" aria-label="subir '+n+'">+</button></div></div>').join('')+
    '</div><button type="button" class="cm-reg" id="cmReg">Registrar <span id="cmRegHora">'+ahoraHora()+'</span>'+
    '<small>si no cambió nada, es solo este toque</small></button></div>';
  const dr = t ? t.dr : CM_DROGAS_BASE;
  h += '<div class="cm-blk"><div class="cm-lb"><span>Drogas frecuentes'+(t ? ' · '+esc(t.n) : '')+'</span></div><div class="cm-chips">'+
    dr.map(([n, d]) => '<button type="button" class="cm-ch'+(cmAlergia(n)?' warn':'')+'" data-cmdroga="'+esc(n)+'">'+esc(n)+
      (d ? '<small>'+esc(d)+'</small>' : '')+'</button>').join('')+
    '<button type="button" class="cm-ch" data-cmotra="1">+ Otra</button></div></div>';
  const dl = (a.drogas || []).slice(-5).reverse();
  h += '<div class="cm-blk"><div class="cm-lb"><span>Droga / hora</span><span>'+(a.drogas || []).length+'</span></div><div class="cm-log">'+
    (dl.length ? dl.map(d => '<div><b>'+esc(d.hora || '—')+'</b><span>'+esc(d.n)+' '+esc(d.dosis === undefined ? '' : fDosis(d.dosis))+' '+esc(d.unidad || '')+'</span></div>').join('')
               : '<div><b>—</b><span>Todavía no hay drogas registradas.</span></div>')+
    '</div></div>';
  return h;
}

function cmCerrar(f){
  const a = f.acto || {}, r = f.recup || {}, b = a.balance || {};
  const t = CM_TPL[(a.camilla || {}).plantilla];
  const dur = (x, y) => { const m = minutosEntre(x, y); return m ? duracionTexto(m) : 'falta'; };
  const fl = cmFaltantes(f);
  const pl = (typeof planDeFluidos === 'function') ? planDeFluidos(f) : null;
  const evs = (a.eventos2 || []).length;
  const destino = a.destinoReal || r.destino || '';
  let h = '<div class="cm-res">'+
    '<div><span>Técnica</span><b>'+esc(a.tecnicaDetalle || (t ? t.tec : '—'))+'</b></div>'+
    '<div><span>Anestesia</span><b>'+esc(dur(a.inicioAnestesia, a.finAnestesia))+'</b></div>'+
    '<div><span>Cirugía</span><b>'+esc(dur(a.inicioCirugia, a.finCirugia))+'</b></div>'+
    '<div><span>Drogas registradas</span><b>'+(a.drogas || []).length+'</b></div>'+
    '<div><span>Signos registrados</span><b>'+(a.controles || []).length+'</b></div></div>';
  h += '<div class="cm-blk"><div class="cm-lb"><span>Balance</span><span>'+
    (pl && pl.cristaloides ? 'propuesto: '+Math.round(pl.cristaloides)+' ml' : 'se confirma')+'</span></div>'+
    [['cristaloides','Hidratación · cristaloides',100],['diuresis','Diuresis',50],['sangrado','Pérdida sanguínea',50]].map(([k, n, s]) =>
      '<div class="cm-stp"><span>'+n+'</span><div class="ctl"><button type="button" data-cmst="'+k+'" data-d="-'+s+'" aria-label="menos">−</button>'+
      '<b>'+(Number(b[k]) || 0)+' ml</b><button type="button" data-cmst="'+k+'" data-d="'+s+'" aria-label="más">+</button></div></div>').join('')+'</div>';
  h += '<div class="cm-blk"><div class="cm-lb"><span>Eventos adversos</span>'+(evs ? '<span>'+evs+'</span>' : '')+'</div><div class="cm-chips">'+
    '<button type="button" class="cm-ch'+(a.sinEventos && !evs ? ' on' : '')+'" data-cmev="no"'+(evs ? ' disabled' : '')+'>Sin eventos</button>'+
    '<button type="button" class="cm-ch'+(evs ? ' on' : '')+'" data-cmev="si">'+(evs ? evs+' evento'+(evs===1?'':'s')+' · agregar' : 'Hubo eventos…')+'</button></div></div>';
  /* El destino se elige sólo en Finalizar */
  h += fl.length ? '<div class="cm-falta">Para firmar falta: '+esc(fl.join(' · '))+'</div>'
                 : '<div class="cm-falta listo">Está todo lo del acto. Seguí con la recuperación y la firma.</div>';
  h += '<button type="button" class="cm-firmar" id="cmSeguir">Siguiente: recuperación y firma →</button>';
  return h;
}

function htmlCamilla(f){
  const st = cmEstado(f);
  const a = f.acto || {}, p = DB.pacientes[f.pacienteId] || {};
  const ed = edadDe(p.fechaNac, f.fecha);
  const asa = ((f.v || {}).scores || {}).asa;
  const alergias = (p.alergias || []).filter(x => x && x !== 'Sin alergias conocidas');
  const dat = [ (p.apellido ? p.apellido+', '+(p.nombre||'') : 'Paciente'),
    [p.sexo || '', ed !== null ? ed+' a' : ''].filter(Boolean).join(' '),
    p.peso ? p.peso+' kg' : 'sin peso', asa ? 'ASA '+asa : '' ].filter(Boolean).join(' · ');
  const inst = nombreInstitucion(f.institucion).split('"')[0].trim();
  const tabs = [['plantilla','Plantilla'],['preparar','Preparar'],['durante','Durante'],['cerrar','Cerrar']];
  const cuerpo = st.tab === 'plantilla' ? cmPlantilla(f) : st.tab === 'preparar' ? cmPreparar(f)
               : st.tab === 'cerrar' ? cmCerrar(f) : cmDurante(f);
  return '<div class="camilla">'+
    '<div class="cm-sb"><b id="cmReloj">'+ahoraHora()+'</b><span>'+esc(inst || 'Quirófano')+' · '+(nubeOK ? 'en línea ✓' : 'guarda en el equipo ✓')+'</span></div>'+
    '<div class="cm-head"><div class="cm-cx">'+esc(textoProcedimientos(f) || f.cirugia || 'Cirugía sin cargar')+'</div>'+
      '<div class="cm-dat">'+esc(dat)+'</div><div class="cm-alertas">'+
        alergias.map(x => '<span class="cm-al rojo">Alergia: '+esc(x)+'</span>').join('')+
        (pacienteProvisional(f) ? '<span class="cm-al rojo">NN · completar identidad</span>' : '')+
        (consentimientoCompleto(f) ? '<span class="cm-al ok">Consentimiento ✓</span>' : '<span class="cm-al amb">Falta consentimiento</span>')+
        (estadoPaso(f, 'preanestesia') === 'ok' ? '<span class="cm-al ok">Valoración ✓</span>' : '<span class="cm-al amb">Valoración pendiente</span>')+
        (esNoProgramado(caracterActo(f)) ? '<span class="cm-al rojo">'+esc(nombreCaracter(caracterActo(f)))+'</span>' : '')+
      '</div></div>'+
    '<div class="cm-tabs" role="tablist">'+ tabs.map(([k, n]) =>
      '<button type="button" role="tab" data-cmtab="'+k+'" data-lectura aria-selected="'+(st.tab===k)+'">'+n+'</button>').join('') +'</div>'+
    '<div class="cm-body">'+cuerpo+'</div>'+
  '</div>'+
  '<div class="cm-pie no-print"><button type="button" class="btn ghost chico" id="cmCompleto" data-lectura>'+ico('lista')+
    ' Registro completo (vademécum, TOF, balance y eventos en detalle)</button></div>';
}

/* --------------------------------------------------------- cableado */
function cablearCamilla(f){
  const cont = $('#actoCuerpo');
  if(!cont) return;
  clearInterval(window.__cmReloj);
  window.__cmReloj = setInterval(() => {
    if(!$('#cmReloj')) return clearInterval(window.__cmReloj);
    const h = ahoraHora();
    ['cmReloj','cmAhora','cmRegHora'].forEach(id => { const e = $('#'+id); if(e) e.textContent = h; });
  }, 20000);

  cont.onclick = e => {
    if(TZS && TZS.inline) return;             /* trazando: el lienzo maneja sus toques */
    const toque = e.target.closest('.cm-chart-toque');
    if(toque && !cont.querySelector('.tz-en-linea')) return abrirTrazoVitales({ en:'#cmChart' });
    const b = e.target.closest('button');
    if(!b || b.disabled) return;
    const d = b.dataset;
    if(d.cmtab){ CM.tab = d.cmtab; pintarPasoAnestesia(fichaActual); window.scrollTo({ top: Math.min(window.scrollY, $('#actoCuerpo').offsetTop), behavior:'auto' }); return; }
    if(b.id === 'cmCompleto'){ fijarVistaActo('completo'); pintarPasoAnestesia(fichaActual); return; }

    if('cmtpl' in d){
      const k = d.cmtpl, t = CM_TPL[k];
      return cmCambiar(a => {
        a.camilla.plantilla = k;
        a.camilla.sinPlantilla = !k;
        if(!t) return;
        a.camilla.checks = t.on.slice();
        a.camilla.vals = t.vals.map(v => v.slice());
        a.tecnicas = t.tecnicas.slice();
        a.tecnicaDetalle = t.tec;
        cmSincronizar(a);
        if(t.urgencia && !esNoProgramado(caracterActo(fichaActual))) a.caracterActo = 'urgencia';
        CM.tab = 'preparar';
      }, t ? 'Plantilla «'+t.n+'»: controles, vía aérea y drogas precargados.' : 'Sin plantilla.');
    }
    if(d.cmchk) return cmCambiar(a => {
      const l = a.camilla.checks || (a.camilla.checks = []);
      const i = l.indexOf(d.cmchk);
      if(i >= 0) l.splice(i, 1); else l.push(d.cmchk);
      cmSincronizar(a);
    });
    if(d.cmval !== undefined) return cmEditarValor(Number(d.cmval));
    if(d.cmhito) return cmHito(d.cmhito, b.querySelector('.n').textContent);
    if(d.cmpos) return cmCambiar(a => {
      const i = CM_POS.indexOf(a.camilla.pos || 'DD');
      a.camilla.pos = CM_POS[(i + 1) % CM_POS.length];
    }, null);
    if(d.cmtrazo) return abrirTrazoVitales({ en:'#cmChart' });
    if(d.cmdv){
      const s = CM_SIGNOS.find(x => x[0] === d.cmdv);
      CM.cur[s[0]] = Math.min(s[3][1], Math.max(s[3][0], CM.cur[s[0]] + s[2] * Number(d.d)));
      const v = b.closest('.cm-v'); if(v) v.querySelector('b').textContent = CM.cur[s[0]];
      return;
    }
    if(b.id === 'cmReg') return cmRegistrar();
    if(d.cmdroga) return cmDroga(d.cmdroga);
    if(d.cmotra) return abrirVademecum();
    if(d.cmst) return cmCambiar(a => {
      a.balance = Object.assign({}, a.balance);
      a.balance[d.cmst] = String(Math.max(0, (Number(a.balance[d.cmst]) || 0) + Number(d.d)));
    });
    if(d.cmev === 'no') return cmCambiar(a => { a.sinEventos = true; }, 'Sin eventos adversos.');
    if(d.cmev === 'si') return abrirEvento(null);
    if(d.cmdest) return cmCambiar(a => {
      a.destinoReal = d.cmdest;
      if(fichaActual.recup && !fichaActual.recup.destino) fichaActual.recup.destino = d.cmdest;
    }, 'Destino: '+d.cmdest+'.');
    if(b.id === 'cmSeguir') return avanzarPaso();
  };
}

/* Los tildes de la hoja alimentan los campos que ya usa el resto de la app */
function cmSincronizar(a){
  const ch = a.camilla.checks || [];
  const vMon = Object.keys(CM_MON).map(k => CM_MON[k]);
  const vEx = Object.keys(CM_MON_EX).map(k => CM_MON_EX[k]);
  a.monitor = (a.monitor || []).filter(x => vMon.indexOf(x) < 0)
    .concat(ch.filter(x => CM_MON[x]).map(x => CM_MON[x]));
  a.monitorExtra = (a.monitorExtra || []).filter(x => vEx.indexOf(x) < 0)
    .concat(ch.filter(x => CM_MON_EX[x]).map(x => CM_MON_EX[x]));
  if(ch.indexOf('Int. oro T') >= 0 || ch.indexOf('Int. naso T') >= 0) a.dispositivo = 'tet';
  else if(ch.indexOf('Masc. laríngea') >= 0) a.dispositivo = 'ml';
  else if(ch.indexOf('Cánula nasal') >= 0) a.dispositivo = 'canula';
  else if(ch.indexOf('Máscara facial') >= 0) a.dispositivo = 'ninguno';
}

function cmHito(k, nombre){
  const a = fichaActual.acto || {};
  const actual = k === 'va' ? ((a.camilla || {}).hitos || {}).va : a[k];
  const poner = hora => cmCambiar(x => {
    x.camilla.hitos = Object.assign({}, x.camilla.hitos);
    if(k === 'va') x.camilla.hitos.va = hora; else x[k] = hora;
    if(hora && !x.fechaCirugia) x.fechaCirugia = hoyISO();
  }, hora ? nombre+' · '+hora : 'Hito borrado.');
  if(!actual) return poner(ahoraHora());
  abrirModal(nombre,
    '<div class="campo"><label>Hora</label><div class="hora-campo"><input type="time" id="cmHoraH" value="'+esc(actual)+'">'+
    '<button type="button" class="btn ghost chico" id="cmHoraAhora">Ahora</button></div></div>',
    '<button class="btn danger" id="cmHoraBorrar">'+ico('borrar')+' Borrar</button>'+
    '<button class="btn pri" id="cmHoraOK">'+ico('check')+' Guardar</button>', '420px');
  $('#cmHoraAhora').onclick = () => { $('#cmHoraH').value = ahoraHora(); };
  $('#cmHoraOK').onclick = () => { const h = $('#cmHoraH').value; cerrarModal(); poner(h); };
  $('#cmHoraBorrar').onclick = () => { cerrarModal(); poner(''); };
}

function cmEditarValor(i){
  const c = (fichaActual.acto || {}).camilla || {};
  const v = (c.vals || [])[i];
  if(!v) return toast('Este valor se calcula solo: cargá peso, talla y sexo del paciente.', 'warn');
  abrirModal(v[0], campoTxt('cmValTxt', v[0], v[1]),
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="cmValOK">'+ico('check')+' Guardar</button>', '420px');
  $('#cmValOK').onclick = () => {
    const txt = $('#cmValTxt').value.trim();
    cerrarModal();
    cmCambiar(a => { a.camilla.vals = (a.camilla.vals || []).map((x, j) => j === i ? [x[0], txt] : x); });
  };
}

function cmRegistrar(){
  const hora = ahoraHora();
  const cur = CM.cur;
  cmCambiar(a => {
    a.controles = (a.controles || []).slice();
    const i = a.controles.findIndex(c => c.hora === hora);
    const vals = { tas:String(cur.tas), tad:String(cur.tad), fc:String(cur.fc), spo2:String(cur.spo2), etco2:String(cur.etco2) };
    if(i >= 0){
      const c = Object.assign({}, a.controles[i], vals);
      delete c.preset;
      if(c.trazo) c.trazo = c.trazo.filter(k => !(k in vals));
      a.controles[i] = c;
    } else {
      a.controles.push(Object.assign({ id:uid('ctl'), hora, fr:'', temp:'', tof:'', tofC:'', tofR:'', obs:'' }, vals));
    }
    a.controles.sort((x, y) => (x.hora || '') < (y.hora || '') ? -1 : 1);
    if(!a.fechaCirugia) a.fechaCirugia = hoyISO();
  }, 'Signos registrados · '+hora);
}

/* Toque en una droga: primero la alergia; después, el vademécum con la dosis
   para confirmar. Las que no están en el vademécum (cefazolina, oxitocina…)
   se registran con una ventana corta. */
function cmDroga(nombreChip){
  const al = cmAlergia(nombreChip);
  const seguir = () => {
    const vn = CM_VADE[nombreChip] || nombreChip;
    if(farmacoPorNombre(vn)) return abrirDroga(vn);
    cmDrogaSimple(nombreChip);
  };
  if(!al) return seguir();
  abrirModal('Alergia registrada',
    '<div class="aviso danger">'+ico('alerta')+'<div><b>No se registró: '+esc(nombreChip)+'.</b><br>'+
      'El paciente tiene registrada la alergia <b>'+esc(al)+'</b>.</div></div>',
    '<button class="btn ghost" data-cerrar>No registrar</button>'+
    '<button class="btn danger" id="cmAlIgual">Registrar igual (queda asentado)</button>', '480px');
  $('#cmAlIgual').onclick = () => {
    cerrarModal();
    auditar('droga-con-alergia', nombreChip + ' registrada pese a la alergia «' + al + '»');
    seguir();
  };
}

function cmDrogaSimple(n){
  abrirModal(n,
    '<div class="grid c3">'+campoNum('cmDrDosis', 'Dosis', '', 'inputmode="decimal"')+
      campoSel('cmDrUnidad', 'Unidad', ['mg','mcg','g','UI','mL','%'], 'mg')+
      campoSel('cmDrVia', 'Vía', ['IV','IM','SC','Intratecal','Peridural','Perineural','Inhalatoria','VO','Otra'], 'IV')+'</div>'+
    '<div class="campo"><label>Hora</label><div class="hora-campo"><input type="time" id="cmDrHora" value="'+ahoraHora()+'">'+
      '<button type="button" class="btn ghost chico" id="cmDrAhora">Ahora</button></div></div>',
    '<button class="btn ghost" data-cerrar>Cancelar</button>'+
    '<button class="btn pri" id="cmDrOK">'+ico('check')+' Registrar</button>', '520px');
  $('#cmDrAhora').onclick = () => { $('#cmDrHora').value = ahoraHora(); };
  $('#cmDrOK').onclick = () => {
    const dosis = Number($('#cmDrDosis').value);
    if(!dosis) return toast('Cargá la dosis administrada.', 'err');
    const reg = { id:uid('dro'), n, g:'', dosis, unidad:$('#cmDrUnidad').value, via:$('#cmDrVia').value,
                  hora:$('#cmDrHora').value, nota:'', porUid:SESION.uid };
    cerrarModal();
    cmCambiar(a => {
      a.drogas = (a.drogas || []).concat([reg]).sort((x, y) => (x.hora || '') < (y.hora || '') ? -1 : 1);
    }, n+' registrado.');
  };
}
