/* =========================================================================
   DATOS FISCALES E INDICES - AFAAR
   Referencia impositiva argentina y motor de indexacion por inflacion.

   IMPORTANTE SOBRE LOS VALORES PRECARGADOS
   ----------------------------------------
   Esta aplicacion no tiene servidor propio ni consulta servicios externos:
   no puede descargar sola el IPC del INDEC ni la tabla vigente de ARCA.
   Por eso los valores vienen PRECARGADOS como referencia y el contador los
   mantiene desde su portal; una vez cargados viajan por Firebase y quedan
   iguales en todos los dispositivos de la asociacion.

   Todo valor precargado se muestra marcado como «a verificar» hasta que el
   contador lo confirma. Las escalas del monotributo se actualizan por
   semestre y el IPC es mensual: hay que cargarlos para que los calculos
   sirvan.
   ========================================================================= */
'use strict';

/* ---------------------------------------------------------------- IPC ----
   Variacion mensual del Indice de Precios al Consumidor, nivel general,
   INDEC, en por ciento. Sirve para indexar saldos impagos y proyectar.
   Fuente a verificar: https://www.indec.gob.ar  (serie IPC nivel general) */
const IPC_PRECARGADO = {
  '2024-01':20.6, '2024-02':13.2, '2024-03':11.0, '2024-04':8.8,
  '2024-05':4.2,  '2024-06':4.6,  '2024-07':4.0,  '2024-08':4.2,
  '2024-09':3.5,  '2024-10':2.7,  '2024-11':2.4,  '2024-12':2.7,
  '2025-01':2.2,  '2025-02':2.4
};
/* Ultimo mes cuyo valor viene precargado. Todo lo posterior lo carga el
   contador desde su portal. */
const IPC_PRECARGADO_HASTA = '2025-02';

/* ------------------------------------------------------- Monotributo ----
   Escala de referencia. `ingresos` es el tope de ingresos brutos anuales
   para LOCACION DE SERVICIOS (la actividad del anestesiologo).
   `impuesto`, `sipa` y `obraSocial` son los componentes mensuales.
   Valores orientativos de la escala vigente a enero de 2025: hay que
   reemplazarlos por la tabla del semestre en curso. */
const MONOTRIBUTO_PRECARGADO = [
  { cat:'A', ingresos:  7813063.45, impuesto:  3000, sipa:  9800, obraSocial: 13800 },
  { cat:'B', ingresos: 11447046.44, impuesto:  5700, sipa: 10800, obraSocial: 13800 },
  { cat:'C', ingresos: 16050091.57, impuesto:  9800, sipa: 11900, obraSocial: 15900 },
  { cat:'D', ingresos: 19926340.10, impuesto: 16000, sipa: 13100, obraSocial: 19200 },
  { cat:'E', ingresos: 23439190.34, impuesto: 24000, sipa: 14400, obraSocial: 24200 },
  { cat:'F', ingresos: 29374695.90, impuesto: 33500, sipa: 15800, obraSocial: 27900 },
  { cat:'G', ingresos: 35128502.31, impuesto: 40000, sipa: 17400, obraSocial: 33000 },
  { cat:'H', ingresos: 53298417.30, impuesto: 95000, sipa: 19200, obraSocial: 40000 },
  { cat:'I', ingresos: 59657887.55, impuesto:145000, sipa: 21100, obraSocial: 48000 },
  { cat:'J', ingresos: 68318880.36, impuesto:180000, sipa: 23200, obraSocial: 55000 },
  { cat:'K', ingresos: 82370281.28, impuesto:230000, sipa: 25500, obraSocial: 63000 }
];
const MONOTRIBUTO_VIGENCIA_PRECARGADA = 'Escala de referencia — enero 2025';

/* --------------------------------------------------- Otros parametros ---
   Alicuotas de referencia para el ejercicio profesional independiente.
   Todas editables por el contador. */
const PARAMS_FISCALES_PRECARGADOS = {
  ivaAlicuota: 21,               /* IVA general, responsable inscripto      */
  ivaSalud: 10.5,                /* alicuota reducida, prestaciones médicas */
  iibbAlicuota: 3.5,             /* Ingresos Brutos — Tierra del Fuego      */
  retencionGanancias: 6,         /* retención de Ganancias sobre honorarios */
  retencionIva: 10.5,            /* retención de IVA de agentes designados  */
  diasPlazoNormal: 30,           /* plazo de pago pactado habitual          */
  diasAlerta: 60,                /* a partir de acá el saldo es moroso      */
  diasIncobrable: 365,           /* a partir de acá se propone incobrable   */
  tasaDescuentoAnual: 0          /* costo de oportunidad anual, opcional    */
};

/* ================== ACCESO A LOS DATOS FISCALES ==================
   Se guardan en la coleccion `fiscal`, que sincroniza por Firebase. */
function ipcTabla(){
  const r = DB.fiscal.ipc;
  return (r && r.valores) ? r.valores : Object.assign({}, IPC_PRECARGADO);
}
function ipcEsPrecargado(){ return !DB.fiscal.ipc; }
function guardarIpc(valores, quien){
  escribir('fiscal', 'ipc', { id:'ipc', valores:valores,
    modificado:new Date().toISOString(), modificadoPor:quien || '' });
}
function ipcMeses(){ return Object.keys(ipcTabla()).sort(); }
function ipcUltimoMes(){ const m = ipcMeses(); return m.length ? m[m.length-1] : ''; }

function monotributoTabla(){
  const r = DB.fiscal.monotributo;
  return (r && r.cats && r.cats.length) ? r.cats : MONOTRIBUTO_PRECARGADO;
}
function monotributoEsPrecargado(){ return !DB.fiscal.monotributo; }
function monotributoVigencia(){
  const r = DB.fiscal.monotributo;
  return (r && r.vigencia) ? r.vigencia : MONOTRIBUTO_VIGENCIA_PRECARGADA;
}
function guardarMonotributo(cats, vigencia, quien){
  escribir('fiscal', 'monotributo', { id:'monotributo', cats:cats, vigencia:vigencia,
    modificado:new Date().toISOString(), modificadoPor:quien || '' });
}

function paramsFiscales(){
  const r = DB.fiscal.params;
  return Object.assign({}, PARAMS_FISCALES_PRECARGADOS, (r && r.v) ? r.v : {});
}
function guardarParamsFiscales(v, quien){
  escribir('fiscal', 'params', { id:'params', v:v,
    modificado:new Date().toISOString(), modificadoPor:quien || '' });
}

/* ==================== MOTOR DE INDEXACION ====================
   Coeficiente acumulado de inflacion entre dos meses (formato 'AAAA-MM').
   Se compone multiplicativamente: (1+i1)(1+i2)... El mes de origen NO se
   cuenta (la deuda nace a fin de ese mes); el de destino si. */
function coeficienteIPC(mesDesde, mesHasta){
  if(!mesDesde || !mesHasta || mesHasta <= mesDesde)
    return { k:1, faltan:0, meses:0 };
  const t = ipcTabla();
  let k = 1, conDato = 0;
  ipcMeses().forEach(m => {
    if(m > mesDesde && m <= mesHasta){
      const v = Number(t[m]);
      if(isFinite(v)){ k *= (1 + v/100); conDato++; }
    }
  });
  /* meses del tramo que no tienen valor cargado en la tabla */
  const total = mesesEntre(mesDesde, mesHasta);
  return { k:k, faltan: Math.max(0, total - conDato), meses: total };
}
/* Cantidad de meses calendario entre dos 'AAAA-MM' */
function mesesEntre(a, b){
  if(!a || !b) return 0;
  const [aa,am] = a.split('-').map(Number);
  const [ba,bm] = b.split('-').map(Number);
  return (ba - aa) * 12 + (bm - am);
}
function sumarMeses(ym, n){
  const [a,m] = ym.split('-').map(Number);
  const t = (a * 12 + (m - 1)) + n;
  return String(Math.floor(t / 12)) + '-' + String((t % 12) + 1).padStart(2, '0');
}

/* Inflacion acumulada de los ultimos n meses cargados, en por ciento */
function inflacionUltimos(n){
  const m = ipcMeses(); if(!m.length) return null;
  const t = ipcTabla();
  const tramo = m.slice(-n);
  let k = 1;
  tramo.forEach(x => { const v = Number(t[x]); if(isFinite(v)) k *= (1 + v/100); });
  return { pct:(k - 1) * 100, meses:tramo.length, desde:tramo[0], hasta:tramo[tramo.length-1] };
}
/* Proyeccion anualizada a partir del promedio de los ultimos n meses.
   Es una extrapolacion, no un pronostico: se rotula como tal en pantalla. */
function proyeccionAnual(n){
  const u = inflacionUltimos(n || 6);
  if(!u || !u.meses) return null;
  const mensualPromedio = Math.pow(1 + u.pct/100, 1/u.meses) - 1;
  return {
    mensual: mensualPromedio * 100,
    anual: (Math.pow(1 + mensualPromedio, 12) - 1) * 100,
    base: u
  };
}
/* Valor de un saldo llevado a hoy, y proyectado a 12 meses */
function indexarSaldo(monto, mesOrigen){
  const hoy = mesDe(hoyISO());
  const c = coeficienteIPC(mesOrigen, hoy);
  const k = c.k, faltan = c.faltan;
  const p = proyeccionAnual(6);
  const kProy = p ? Math.pow(1 + p.mensual/100, 12) : 1;
  return {
    nominal: monto,
    actualizado: monto * k,
    perdida: (monto * k) - monto,     /* poder adquisitivo perdido */
    coeficiente: k,
    mesesSinDato: faltan,
    proyectado12m: monto * k * kProy,
    proyeccionUsada: p
  };
}

/* ================ CATEGORIZACION EN EL MONOTRIBUTO ================
   Devuelve la categoria que corresponde a un nivel de ingresos brutos
   anuales, y cuanto margen queda hasta el tope. */
function categoriaMonotributo(ingresosAnuales){
  const t = monotributoTabla();
  const c = t.find(x => ingresosAnuales <= Number(x.ingresos));
  if(!c) return { cat:'—', excedido:true, tope:Number(t[t.length-1].ingresos),
                  margen:0, usoPct:100, fila:t[t.length-1] };
  const tope = Number(c.ingresos);
  return {
    cat: c.cat, excedido:false, tope: tope,
    margen: tope - ingresosAnuales,
    usoPct: tope ? (ingresosAnuales * 100 / tope) : 0,
    cuotaMensual: Number(c.impuesto||0) + Number(c.sipa||0) + Number(c.obraSocial||0),
    fila: c
  };
}
