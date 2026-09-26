/* ============================================================
   TESORERIA-FLANDES · EGRESOS
   Ecosistema Flandes · Fase 8

   Después de la ORDEN DE PAGO (Contabilidad) vienen dos pasos:

   EGRESOS PENDIENTES  (#/pendientes → #/egreso/<fila>/<id>/<cuenta>)
     Las cuentas en ORDEN DE PAGO. El NETO que se gira es el de la orden:
     el que guardó Contabilidad (VALOR NETO GIRADO) o, en las órdenes de
     la app anterior, el que calcula el MISMO motor del CORE. Aquí no hay
     un segundo cálculo: el teléfono solo compara lo que se escribe con
     ese neto. Si se gira menos (embargo, pago parcial, situación de
     fondos) hay que decir el motivo; más que la orden, nunca.
     CREAR EGRESO: una llamada. El CORE vuelve a cuadrar, arma el PDF con
     la plantilla, lo guarda en la carpeta de la cuenta, pasa la cuenta a
     EGRESO y avisa al contratista y al grupo de Tesorería.

   EGRESOS EMITIDOS  (#/emitidos)
     Las cuentas en EGRESO. El check MARCAR CUENTA PAGA es una llamada:
     PAGADA, DETALLES DE PAGO, la fila de PAGOS y el aviso (push, correo y
     WhatsApp) al contratista. Los egresos hechos con la app anterior no
     tienen los pagos guardados: se escriben ahí mismo, como antes.

   8.1 · EMBARGOS: si el contrato tiene embargo configurado (tarjeta del
     contratista), la cuenta llega con la cuota ya descontada y un CHECK.
     Desmarcado, el egreso sale sin descuento y se aconseja levantar el
     embargo. En el comprobante: banco (crédito), 138490002 (crédito,
     el embargo) y el beneficiario en UNA línea (débito del neto).
   8.1 · FIRMAS: Elaboró = quien crea; Modificó = quien rehace.

   UN SOLO VIAJE: 'bandeja' trae las dos listas, las fuentes y las reglas.
   Crear y pagar devuelven la bandeja nueva: no hay una segunda lectura.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var FILTRO_K = 'egresos.filtro.v1';
  var B = null, HORA = null, CARGANDO = null;
  var SEL = {};            /* el formulario de cada cuenta, por fila */
  var ACTUAL = null;       /* la cuenta abierta (Insights) */
  var F = leerFiltro();

  var TRAMO_TXT = { 'PRIMARIO': 'Primario', '1RA ADICION': '1ª adición', '2DA ADICION': '2ª adición' };

  function O() { return window.OFICINA; }
  function leerFiltro() {
    var g = K.guardar.leer(FILTRO_K, null) || {};
    return { que: g.que || '', sec: g.sec || '', busca: '', eque: g.eque || '' };
  }
  function guardarFiltro() { K.guardar.escribir(FILTRO_K, { que: F.que, sec: F.sec, eque: F.eque }); }
  function nombre(s) { return O().nombre(s); }
  function titulo(s) { return O().titulo(s); }
  function pesos(v) { return K.pesos(v || 0); }
  function norm(s) { return K.norm(s || ''); }
  function hoyTxt() { var d = new Date(); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }
  function isoATxt(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  function txtAIso(t) { var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(t || '')); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; }
  function diasDesde(ddmmyyyy) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(ddmmyyyy || ''));
    if (!m) return null;
    var d = new Date(+m[3], +m[2] - 1, +m[1]);
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return Math.round((hoy - d) / 864e5);
  }

  /* ══════════════ los datos: UN viaje ══════════════ */

  function recibir(d) {
    B = d || { pendientes: [], emitidos: [], destinaciones: [], reglas: {}, conteos: {} };
    [B.pendientes || [], B.emitidos || []].forEach(function (l) {
      l.forEach(function (c) { c._t = norm([c.nombre, c.doc, c.contrato, c.sec, c.orden, c.egreso, c.informe, c.id].join(' ')); });
    });
    HORA = new Date();
    if (C.alCambiar) C.alCambiar(contar());
  }

  function cargar(fresco) {
    if (B && !fresco) return Promise.resolve(B);
    if (CARGANDO && !fresco) return CARGANDO;
    CARGANDO = O().leer('bandeja', { fresco: !!fresco }).then(function (d) { CARGANDO = null; recibir(d); return B; },
      function (e) { CARGANDO = null; throw e; });
    return CARGANDO;
  }

  function pendientes() { return (B && B.pendientes) || []; }
  function emitidos() { return (B && B.emitidos) || []; }
  function fuentes() { return (B && B.destinaciones) || []; }
  function reglas() { return (B && B.reglas) || { motivos: [], ceroPermitido: [] }; }
  function firmantes() { return (B && B.firmantes) || null; }
  function vigencia() { return (B && B.vigencia) || new Date().getFullYear(); }

  function contar() {
    var p = pendientes().filter(function (c) { return !c.error; });
    return {
      pendientes: p.length,
      primeras: p.filter(function (c) { return c.primera; }).length,
      cesion: p.filter(function (c) { return c.cedido; }).length,
      motor: p.filter(function (c) { return c.netoFuente === 'MOTOR'; }).length,
      emitidos: emitidos().filter(function (c) { return !c.error; }).length,
      sinComprobante: (B && B.conteos && B.conteos.sinComprobante) || 0,
      solicitudes: (B && B.conteos && B.conteos.solicitudes) || 0,
      porGirar: p.reduce(function (s, c) { return s + (Number(c.neto) || 0); }, 0)
    };
  }

  function olvidar() { B = null; SEL = {}; CARGANDO = null; K.guardar.borrar(FILTRO_K); F = leerFiltro(); }

  function fuenteDe(nom) { var n = norm(nom); return fuentes().filter(function (f) { return norm(f.name) === n; })[0] || null; }
  function ceroOk(nom) { return (reglas().ceroPermitido || []).some(function (x) { return norm(x) === norm(nom); }); }

  /** El N° de egreso con la vigencia: 1234 → 2026001234 (igual que el CORE). */
  function numeroEgreso(dig) {
    var d = String(dig || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length === 10 && d.indexOf(String(vigencia())) === 0) return d;
    if (d.length > 6) return '';
    return String(vigencia()) + ('000000' + d).slice(-6);
  }

  /* ══════════════ el formulario de cada cuenta ══════════════ */

  function selDe(c, rehacer) {
    var k = c.fila + (rehacer ? 'R' : '');
    if (SEL[k]) return SEL[k];
    var d = c.datos || null;
    var sug = c.sugerida || {};
    var s = { numero: '', fecha: hoyTxt(), pagos: [{ valor: c.neto || 0, fuente: sug.f1 || '' }], motivo: { tipo: '', texto: '' },
              embargo: { aplicar: !!(c.embargo && c.embargo.cuota > 0) } };
    if (sug.f2 && fuenteDe(sug.f2)) s.pagos.push({ valor: 0, fuente: sug.f2 });
    s.pagos[0].valor = Math.max(0, (c.neto || 0) - embargoDe(c, s));
    if (rehacer && d) {
      s.numero = String(d.numero || '').slice(4).replace(/^0+/, '');
      s.fecha = d.fecha || s.fecha;
      s.pagos = (d.pagos || []).map(function (p) { return { valor: p.valor, fuente: p.fuente }; });
      if (d.motivo) s.motivo = { tipo: d.motivo.tipo || '', texto: d.motivo.texto || '' };
      if (d.embargo) s.embargo.aplicar = d.embargo.valor > 0;
    }
    if (!fuenteDe(s.pagos[0].fuente)) s.pagos[0].fuente = '';
    SEL[k] = s;
    return s;
  }

  /** 8.1 · La cuota del embargo que se descuenta en este egreso (0 si no hay o se desmarcó). */
  function embargoDe(c, s) {
    return (c && c.embargo && c.embargo.cuota > 0 && s && s.embargo && s.embargo.aplicar) ? Math.round(c.embargo.cuota) : 0;
  }

  /** Lo que el CORE va a exigir, dicho antes de viajar. */
  function revisar(c, s, legado) {
    var total = 0, errores = [];
    s.pagos.forEach(function (p, i) {
      var v = Math.round(Number(p.valor) || 0);
      total += v;
      if (!p.fuente) errores.push('Escoge la FUENTE del pago ' + (i + 1) + '.');
      else if (!fuenteDe(p.fuente)) errores.push('La fuente del pago ' + (i + 1) + ' ya no está en la configuración.');
      if (!(v > 0) && !(p.fuente && ceroOk(p.fuente))) errores.push('Escribe el VALOR PAGADO ' + (i + 1) + '.');
    });
    var emb = legado ? 0 : embargoDe(c, s);
    var dif = Math.round((c.neto || 0) - emb - total);
    var fuenteNeto = legado ? 'MOTOR' : c.netoFuente;
    if (dif < 0 && fuenteNeto === 'ORDEN') errores.push('No se puede girar más que la orden de pago (' + pesos(c.neto) + ').');
    if (dif !== 0 && !s.motivo.tipo) errores.push('Lo girado no es el neto de la orden: escoge el motivo de la diferencia.');
    if (dif !== 0 && s.motivo.tipo === 'OTRO' && String(s.motivo.texto || '').trim().length < 5) errores.push('Explica el motivo de la diferencia.');
    return { total: total, dif: dif, embargo: emb, errores: errores };
  }

  /* ══════════════ filtro de la lista de pendientes ══════════════ */

  function pasa(c, sin) {
    sin = sin || {};
    if (c.error) return !F.que && !F.sec;
    if (!sin.que && F.que === 'primera' && !c.primera) return false;
    if (!sin.que && F.que === 'resto' && c.primera) return false;
    if (!sin.que && F.que === 'cesion' && !c.cedido) return false;
    if (!sin.que && F.que === 'motor' && c.netoFuente !== 'MOTOR') return false;
    if (!sin.que && F.que === 'embargo' && !(c.embargo && c.embargo.cuota > 0)) return false;
    if (!sin.sec && F.sec && c.sec !== F.sec) return false;
    var q = norm(F.busca);
    if (q) {
      var p = q.split(' ').filter(Boolean);
      for (var i = 0; i < p.length; i++) if ((c._t || '').indexOf(p[i]) < 0) return false;
    }
    return true;
  }

  function avisoFirmas(caja) {
    var f = firmantes();
    if (!f || f.listo) return;
    var a = K.nodo('<section class="kit-tarjeta op-firmas">' + K.icono('lapiz', 18) +
      '<div><p><b>Antes de crear egresos falta ' + K.esc((f.faltan || []).join(', ')) + '.</b> Lo resuelve ADMIN en Configuración.</p></div></section>');
    caja.appendChild(a);
  }

  function marcasDe(c) {
    var m = [];
    if (c.prioridad) m.push('<span class="ct-marca op-marca--prio">' + K.icono('corazon', 11) + ' PRIORIDAD</span>');
    m.push('<span class="ct-marca' + (c.primera ? ' op-marca--primera' : '') + '">' +
      (c.primera ? K.icono('bombilla', 11) + ' PRIMERA · ' : '') + K.esc((TRAMO_TXT[c.tramo] || c.tramo || '').toUpperCase()) +
      (c.primera ? '' : ' · CUENTA ' + K.esc(c.nTramo || '')) + '</span>');
    if (c.cedido) m.push('<span class="ct-marca op-marca--rp">' + K.icono('llave', 11) + ' CEDIDO' + (c.rpCesionUsado ? ' · RP CESIÓN' : '') + '</span>');
    if (c.netoFuente === 'MOTOR') m.push('<span class="ct-marca tg-marca--motor" title="Orden hecha con la app anterior: el neto lo calcula el motor de Contabilidad">' + K.icono('info', 11) + ' ORDEN APP ANTERIOR</span>');
    if (c.ultimo) m.push('<span class="ct-marca">ÚLTIMA CUENTA</span>');
    if (c.embargo && c.embargo.cuota > 0) m.push('<span class="ct-marca tg-marca--emb">' + K.icono('candado', 11) + ' EMBARGO · ' + K.esc(pesos(c.embargo.cuota)) + '</span>');
    return m.join('');
  }

  function cabTarjeta(c, tam) {
    var cab = K.nodo('<div class="ct-t__cab"></div>');
    if (K.piezas.personas) cab.appendChild(K.piezas.personas.avatar(c.nombre, { tam: tam || 48, foto: c.img || '' }));
    cab.appendChild(K.nodo('<div class="ct-t__quien"><h3 class="ct-t__n">' + K.esc(nombre(c.nombre)) + '</h3>' +
      '<p class="ct-t__doc">CC/NIT ' + K.esc(c.doc) + '</p></div>'));
    cab.appendChild(K.nodo('<span class="rv-t__cuenta"><b>' + K.esc(c.informe) + '</b><small>de ' + K.esc(c.total || '—') + '</small></span>'));
    return cab;
  }

  function tarjetaError(c) {
    return K.nodo('<article class="kit-tarjeta ct-t op-t op-t--error"><h3 class="ct-t__n">' + K.esc(nombre(c.nombre) || 'Cuenta ' + c.informe) +
      '</h3><p class="op-aviso">' + K.icono('aviso', 14) + ' No se pudo armar esta cuenta: ' + K.esc(c.error) + '</p></article>');
  }

  /* ══════════════ EGRESOS PENDIENTES ══════════════ */

  function listaPendientes() {
    var caja = K.nodo('<div class="kit-ancho vista ct op tg"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'moneda', 'EGRESOS PENDIENTES',
      'Las cuentas con orden de pago. Toca <b>Hacer egreso</b>: el valor a girar es el neto de la orden de pago, escoges la fuente y sale el comprobante de egreso en PDF.');
    var zFirmas = K.nodo('<div></div>');
    caja.appendChild(zFirmas);
    var barra = O().barra({
      placeholder: 'Nombre, documento, contrato o N° de orden', valor: F.busca,
      alBuscar: function (q) { F.busca = q; pintar(); },
      alRefrescar: function () { return cargar(true).then(function () { zFirmas.innerHTML = ''; avisoFirmas(zFirmas); pintar(); }); }
    });
    caja.appendChild(barra.caja);
    var zQue = K.nodo('<div></div>'), zSec = K.nodo('<div></div>');
    caja.appendChild(zQue); caja.appendChild(zSec);
    var conteo = K.nodo('<p class="ct-conteo" aria-live="polite"></p>');
    caja.appendChild(conteo);
    var rej = K.nodo('<div class="kit-rejilla ct-lista"></div>');
    caja.appendChild(rej);
    var pQue, pSec;

    function montar() {
      pQue = K.piezas.pastillas.montar(zQue, {
        etiqueta: 'Qué cuentas',
        opciones: [{ valor: '', texto: 'Todas' }, { valor: 'primera', texto: 'Primeras del tramo', tono: 'aviso' }, { valor: 'resto', texto: 'Las demás' },
                   { valor: 'cesion', texto: 'Contratos cedidos' }, { valor: 'motor', texto: 'Orden de la app anterior' },
                   { valor: 'embargo', texto: 'Con embargo', tono: 'aviso' }],
        valor: F.que, alCambiar: function (v) { F.que = v; guardarFiltro(); pintar(); }
      });
      pSec = K.piezas.pastillas.montar(zSec, { etiqueta: 'Secretaría', opciones: [{ valor: '', texto: 'Todas las secretarías' }], valor: F.sec,
        alCambiar: function (v) { F.sec = v; guardarFiltro(); pintar(); } });
    }

    function repintarPastillas() {
      var bQ = pendientes().filter(function (c) { return !c.error && pasa(c, { que: true }); });
      pQue.conteos({ '': bQ.length, primera: bQ.filter(function (c) { return c.primera; }).length, resto: bQ.filter(function (c) { return !c.primera; }).length,
        cesion: bQ.filter(function (c) { return c.cedido; }).length, motor: bQ.filter(function (c) { return c.netoFuente === 'MOTOR'; }).length,
        embargo: bQ.filter(function (c) { return c.embargo && c.embargo.cuota > 0; }).length });
      O().marcar(zQue, F.que);
      var bS = pendientes().filter(function (c) { return !c.error && pasa(c, { sec: true }); });
      var m = {};
      bS.forEach(function (c) { if (c.sec) m[c.sec] = (m[c.sec] || 0) + 1; });
      var ks = Object.keys(m).sort(function (a, b) { return a.localeCompare(b, 'es'); });
      var cs = { '': bS.length };
      ks.forEach(function (k) { cs[k] = m[k]; });
      pSec.opciones([{ valor: '', texto: 'Todas las secretarías' }].concat(ks.map(function (k) { return { valor: k, texto: titulo(k) }; })));
      pSec.conteos(cs); O().marcar(zSec, F.sec);
      zSec.hidden = ks.length < 2 && !F.sec;
    }

    function pintar() {
      repintarPastillas();
      var filas = pendientes().filter(function (c) { return pasa(c); });
      var tot = pendientes().length;
      var suma = filas.reduce(function (s, c) { return s + (Number(c.neto) || 0); }, 0);
      conteo.innerHTML = '<b>' + K.numero(filas.length) + '</b> ' + (filas.length === 1 ? 'cuenta' : 'cuentas') +
        (filas.length !== tot ? ' <span>de ' + tot + '</span>' : '') + (filas.length ? ' · ' + K.esc(pesos(suma)) + ' por girar' : '') +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O().horaCorta(HORA)) + '</span>' : '');
      rej.innerHTML = '';
      if (!tot) {
        rej.appendChild(K.nodo('<div class="kit-tarjeta ct-vacio op-aldia">' + K.icono('check', 30) +
          '<p><b>¡Estás al día!</b><br>No hay órdenes de pago esperando egreso. Toca Refrescar para mirar de nuevo.</p></div>'));
        return;
      }
      if (!filas.length) {
        rej.appendChild(O().vacio('No hay cuentas con estos filtros.', function () { F.que = ''; F.sec = ''; F.busca = ''; barra.inp.value = ''; guardarFiltro(); pintar(); }));
        return;
      }
      filas.forEach(function (c) { rej.appendChild(c.error ? tarjetaError(c) : tarjetaPendiente(c)); });
    }

    K.piezas.esqueletos.mientras(rej, cargar(false), { forma: 'tarjetas', cuantos: 4, espera: 'Cargando los egresos pendientes' })
      .then(function () { avisoFirmas(zFirmas); montar(); pintar(); })
      ['catch'](function (e) { caja.appendChild(C.errorCaja(e)); });
    K.piezas.creditos.montar(caja);
  }

  function tarjetaPendiente(c) {
    var t = K.nodo('<article class="kit-tarjeta ct-t op-t' + (c.primera ? ' op-t--primera' : '') + '"></article>');
    t.appendChild(cabTarjeta(c));
    var dias = diasDesde(c.fechaOrden);
    t.appendChild(K.nodo(
      '<dl class="ct-t__datos">' +
      '<div><dt>Contrato</dt><dd>' + K.esc(c.contrato || '—') + '</dd></div>' +
      '<div><dt>Secretaría</dt><dd>' + K.esc(titulo(c.sec) || '—') + '</dd></div>' +
      '<div><dt>Orden de pago</dt><dd>' + K.esc(c.orden || '—') + '</dd></div>' +
      '<div><dt>Fecha de la orden</dt><dd' + (dias !== null && dias >= 5 ? ' class="rv-t__tarde"' : '') + '>' + K.esc(c.fechaOrden || '—') +
      (dias !== null ? ' <small>· hace ' + dias + (dias === 1 ? ' día' : ' días') + '</small>' : '') + '</dd></div>' +
      '<div><dt>Cobra</dt><dd>' + K.esc(pesos(c.cobro)) + '</dd></div>' +
      '<div><dt>Banco del contratista</dt><dd>' + K.esc(c.banco || '—') + (c.numeroCuenta ? ' <small>' + K.esc(c.tipoCuenta || '') + ' ' + K.esc(c.numeroCuenta) + '</small>' : '') + '</dd></div>' +
      '</dl>'));
    var cuota = c.embargo && c.embargo.cuota > 0 ? c.embargo.cuota : 0;
    t.appendChild(K.nodo('<div class="op-neto"><span>Descuentos <b>' + K.esc(pesos(c.retenido)) + '</b>' +
      (cuota ? ' · Embargo <b>' + K.esc(pesos(cuota)) + '</b>' : '') + '</span>' +
      '<span class="op-neto__v">A girar <b>' + K.esc(pesos((c.neto || 0) - cuota)) + '</b></span></div>'));
    t.appendChild(K.nodo('<div class="ct-t__marcas">' + marcasDe(c) + '</div>'));
    var a = K.nodo('<div class="ct-acc"></div>');
    if (C.puede('egresosPendientes')) {
      var hacer = K.nodo('<button type="button" class="kit-btn kit-btn--marca ct-acc__ver">' + K.icono('moneda', 16) + ' Hacer egreso</button>');
      hacer.addEventListener('click', function () { K.vibrar(8); C.irA('egreso/' + c.fila + '/' + encodeURIComponent(c.id) + '/' + c.informe); });
      a.appendChild(hacer);
    }
    var ver = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('ojo', 16) + ' Orden de pago</button>');
    ver.addEventListener('click', function () { verOrden(c); });
    a.appendChild(ver);
    t.appendChild(a);
    return t;
  }

  /* ══════════════ documentos ══════════════ */

  function verOrden(c) {
    /* 25/09 · el botón dice ORDEN DE PAGO: si no hay orden enlazada no se
       muestra otro documento en su lugar (antes abría el informe de
       supervisión y parecía que la orden era ese). */
    if (!c.tOrden) {
      K.aviso('La orden ' + (c.orden || '') + ' se hizo con la app anterior y su PDF no quedó enlazado en la hoja. Está en la carpeta de la cuenta ' + c.informe + '.', 'aviso', 6500);
      return;
    }
    var docs = [{ titulo: 'Orden de pago ' + (c.orden || ''), t: c.tOrden, nombre: 'OP_' + c.informe + '_' + c.contrato + '.pdf' }];
    if (c.tInforme) docs.push({ titulo: 'Informe de supervisión · cuenta ' + c.informe, t: c.tInforme, nombre: 'INFORME_' + c.informe + '.pdf' });
    O().verDocs(docs, 0);
  }

  function verEgreso(c) {
    if (c._pdf) {
      K.piezas.visor.abrir([{ titulo: 'Egreso ' + (c.egreso || ''), tipo: 'pdf',
        cargar: function () { return Promise.resolve({ bytes: c._pdf.bytes, mime: 'application/pdf', tipo: 'pdf', nombre: c._pdf.nombre }); } }]);
      return;
    }
    if (c.tEgreso) { O().verDocs([{ titulo: 'Egreso ' + (c.egreso || ''), t: c.tEgreso, nombre: 'EG_' + c.informe + '_' + c.contrato + '.pdf' }], 0); return; }
    K.aviso('Este egreso se hizo con la app anterior: no tiene PDF.', 'aviso', 4000);
  }

  function bytesDe(b64) {
    var bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  function bajarPdf(bytes, nom) {
    try {
      var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      var a = document.createElement('a');
      a.href = url; a.download = nom || 'egreso.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    } catch (e) {}
  }

  /* ══════════════ el egreso de UNA cuenta ══════════════ */

  function llaveDe(sub) {
    var p = String(sub || '').split('/');
    return { fila: parseInt(p[0], 10) || 0, id: decodeURIComponent(p[1] || ''), informe: parseInt(p[2], 10) || 0, rehacer: p[3] === 'rehacer' };
  }

  function buscar(q) {
    var l = q.rehacer ? emitidos() : pendientes();
    return l.filter(function (c) { return c.fila === q.fila && (!q.id || norm(c.id) === norm(q.id)); })[0] || null;
  }

  function detalle(sub) {
    var q = llaveDe(sub);
    var caja = K.nodo('<div class="kit-ancho vista op-det tg"></div>');
    C.app.appendChild(caja);
    var zona = K.nodo('<div></div>');
    caja.appendChild(zona);
    K.piezas.esqueletos.mientras(zona, cargar(false), { forma: 'ficha', cuantos: 1, espera: 'Cargando la orden de pago' })
      .then(function () {
        var c = buscar(q);
        ACTUAL = c || null;
        if (!c) {
          zona.appendChild(K.nodo('<div class="kit-tarjeta ct-vacio"><p>' + (q.rehacer
            ? 'Esta cuenta ya no está en EGRESO (puede que ya esté pagada). Vuelve a la lista.'
            : 'Esta cuenta ya no está esperando egreso (puede que otra persona ya lo hizo). Vuelve a la lista.') + '</p></div>'));
          return;
        }
        pintarDetalle(zona, c, q.rehacer);
      })
      ['catch'](function (e) { zona.appendChild(C.errorCaja(e)); });
    K.piezas.creditos.montar(caja);
  }

  function selectFuente(actual, alCambiar) {
    var sel = K.nodo('<select class="op-select" aria-label="Fuente de destinación"><option value="">Escoge la fuente…</option></select>');
    fuentes().forEach(function (f) {
      var o = document.createElement('option');
      o.value = f.name; o.textContent = f.name + ' · ' + f.banco + ' ' + f.numCuenta;
      if (norm(f.name) === norm(actual)) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { alCambiar(sel.value); });
    return sel;
  }

  /** El bloque de pagos (1 o 2), el total y el motivo. Lo usa el egreso y el pago de un egreso viejo. */
  function formularioPagos(c, s, zona, legado, alCambiar) {
    zona.innerHTML = '';
    s.pagos.forEach(function (p, i) {
      var g = K.nodo('<div class="tg-pago"><p class="tg-pago__t">' + K.icono('moneda', 14) + ' Pago ' + (i + 1) + '</p></div>');
      var fv = K.nodo('<label class="op-campo"><span>VALOR PAGADO' + (s.pagos.length > 1 ? ' ' + (i + 1) : '') + '</span></label>');
      var inp = K.nodo('<input class="tg-valor" inputmode="numeric" autocomplete="off">');
      inp.value = p.valor ? K.numero(p.valor) : '';
      fv.appendChild(inp);
      var armado = false;
      K.pesosEnVivo(inp, function (v) { p.valor = Number(v) || 0; if (armado) alCambiar(true); });
      armado = true;
      g.appendChild(fv);
      var ff = K.nodo('<label class="op-campo"><span>FUENTE DE DESTINACIÓN</span></label>');
      ff.appendChild(selectFuente(p.fuente, function (v) { p.fuente = v; alCambiar(); }));
      g.appendChild(ff);
      var fu = fuenteDe(p.fuente);
      g.appendChild(K.nodo('<p class="tg-banco">' + (fu
        ? K.icono('moneda', 13) + ' <b>BANCO</b> ' + K.esc(fu.banco) + ' · <b>N° CUENTA</b> ' + K.esc(fu.numCuenta)
        : K.icono('info', 13) + ' El banco y el N° de cuenta salen de la fuente.') + '</p>'));
      if (i === 1) {
        var q = K.nodo('<button type="button" class="kit-btn kit-btn--plano op-mini">' + K.icono('basura', 14) + ' Quitar el pago 2</button>');
        q.addEventListener('click', function () { s.pagos.splice(1, 1); alCambiar(); });
        g.appendChild(q);
      }
      zona.appendChild(g);
    });
    if (s.pagos.length < 2) {
      var mas = K.nodo('<button type="button" class="kit-btn kit-btn--plano op-mini">' + K.icono('mas', 14) + ' Agregar un segundo pago (otra fuente)</button>');
      mas.addEventListener('click', function () {
        var r = revisar(c, s, legado);
        s.pagos.push({ valor: Math.max(0, r.dif), fuente: '' });
        alCambiar();
      });
      zona.appendChild(mas);
    }
  }

  function pintarMotivo(c, s, zona, r) {
    zona.innerHTML = '';
    if (r.dif === 0) { s.motivo = { tipo: '', texto: '' }; return; }
    var t = K.nodo('<div class="tg-motivo"><p class="op-nota op-nota--aviso">' + K.icono('aviso', 14) + '<span>' +
      (r.dif > 0 ? 'Se gira menos que la orden de pago.' : 'Se gira más que la orden de pago.') +
      ' Escoge el motivo: queda escrito en el egreso como observación.</span></p></div>');
    var fm = K.nodo('<label class="op-campo"><span>MOTIVO DE LA DIFERENCIA</span></label>');
    var sel = K.nodo('<select class="op-select"><option value="">Escoge el motivo…</option></select>');
    (reglas().motivos || []).forEach(function (m) {
      var o = document.createElement('option'); o.value = m; o.textContent = m; if (norm(m) === norm(s.motivo.tipo)) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener('change', function () { s.motivo.tipo = sel.value; });
    fm.appendChild(sel);
    t.appendChild(fm);
    var fx = K.nodo('<label class="op-campo"><span>Detalle <small>(juzgado, oficio, cuántas partes…)</small></span></label>');
    var tx = K.nodo('<input maxlength="300" autocomplete="off">');
    tx.value = s.motivo.texto || '';
    tx.addEventListener('input', function () { s.motivo.texto = tx.value; });
    fx.appendChild(tx);
    t.appendChild(fx);
    zona.appendChild(t);
  }

  function pintarDetalle(zona, c, rehacer) {
    zona.innerHTML = '';
    var s = selDe(c, rehacer);

    /* ---- quién, la cuenta y a dónde se le paga ---- */
    var ficha = K.nodo('<section class="kit-tarjeta op-ficha"></section>');
    var cab = cabTarjeta(c, 60);
    cab.querySelector('.ct-t__n').classList.add('op-ficha__n');
    ficha.appendChild(cab);
    ficha.appendChild(K.nodo('<div class="ct-t__marcas">' + marcasDe(c) + '</div>'));
    var dl = K.nodo(
      '<dl class="ct-t__datos op-datos">' +
      '<div><dt>Contrato</dt><dd>' + K.esc(c.contrato) + '</dd></div>' +
      '<div><dt>Secretaría</dt><dd>' + K.esc(titulo(c.sec) || '—') + '</dd></div>' +
      '<div><dt>Supervisor(a)</dt><dd>' + K.esc(nombre(c.sup) || '—') + '</dd></div>' +
      '<div><dt>Teléfono</dt><dd>' + K.esc(c.telefono || '—') + '</dd></div>' +
      '<div class="tg-benef"><dt>Cuenta del contratista</dt><dd>' + K.esc(c.banco || 'Sin banco registrado') +
      (c.numeroCuenta ? ' · ' + K.esc(c.tipoCuenta || '') + ' <button type="button" class="op-copiar" title="Copiar">' + K.esc(c.numeroCuenta) + ' ' + K.icono('copiar', 12) + '</button>' : '') + '</dd></div>' +
      '</dl>');
    var cp = dl.querySelector('.op-copiar');
    if (cp) cp.addEventListener('click', function () { try { navigator.clipboard.writeText(c.numeroCuenta); K.aviso('N° de cuenta copiado.', 'ok', 1600); } catch (e) {} });
    ficha.appendChild(dl);
    var accF = K.nodo('<div class="ct-acc"></div>');
    var vo = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('ojo', 16) + ' Abrir orden de pago</button>');
    vo.addEventListener('click', function () { verOrden(c); });
    accF.appendChild(vo);
    if (rehacer && (c.tEgreso || c._pdf)) {
      var ve = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('documento', 16) + ' Egreso actual</button>');
      ve.addEventListener('click', function () { verEgreso(c); });
      accF.appendChild(ve);
    }
    ficha.appendChild(accF);
    zona.appendChild(ficha);

    var rej = K.nodo('<div class="op-rej"></div>');
    zona.appendChild(rej);
    var col1 = K.nodo('<div class="op-col"></div>'), col2 = K.nodo('<div class="op-col"></div>');
    rej.appendChild(col1); rej.appendChild(col2);

    /* ---- la orden de pago: el neto que manda ---- */
    var ord = K.nodo('<section class="kit-tarjeta grupo op-grupo"><h3 class="grupo__t">' + K.icono('documento', 16) + ' Orden de pago ' + K.esc(c.orden || '') + '</h3>' +
      '<dl class="op-valores">' +
      '<div><dt>Fecha de la orden</dt><dd>' + K.esc(c.fechaOrden || '—') + '</dd></div>' +
      '<div><dt>Cobra</dt><dd>' + K.esc(pesos(c.cobro)) + '</dd></div>' +
      (c.aplicadas || []).map(function (a) { return '<div><dt>' + K.esc(a.n) + '</dt><dd>− ' + K.esc(pesos(a.v)) + '</dd></div>'; }).join('') +
      '<div class="op-valores__cobro"><dt>Neto a girar</dt><dd>' + K.esc(pesos(c.neto)) + '</dd></div>' +
      '</dl>' +
      (c.netoFuente === 'MOTOR'
        ? '<p class="op-nota op-nota--aviso">' + K.icono('info', 14) + ' Esta orden se hizo con la app anterior y no guardó el neto: lo calcula el mismo motor de Contabilidad' +
          (c.inferido ? ' con lo que se le descontó la vez pasada' : '') + '. Compáralo con la orden en papel.</p>'
        : '<p class="op-nota">' + K.icono('check', 14) + ' El neto es el que guardó Contabilidad al crear la orden.</p>') +
      '</section>');
    col1.appendChild(ord);
    col1.appendChild(K.nodo('<section class="kit-tarjeta grupo op-grupo"><h3 class="grupo__t">' + K.icono('hoja', 16) + ' Presupuesto</h3>' +
      '<dl class="op-valores"><div><dt>Disponibilidad (CDP)</dt><dd>' + K.esc(c.cdp || '—') + '</dd></div>' +
      '<div><dt>Registro (RP)</dt><dd class="op-rp">' + K.esc(c.rp || '—') + '</dd></div>' +
      '<div><dt>Cuenta del beneficiario</dt><dd>' + K.esc(c.credito ? c.credito.codigo + ' · ' + c.credito.nombre : '—') + '</dd></div></dl></section>'));

    /* ---- el egreso ---- */
    var form = K.nodo('<section class="kit-tarjeta grupo op-grupo tg-form"><h3 class="grupo__t">' + K.icono('moneda', 16) + (rehacer ? ' Rehacer el egreso' : ' El egreso') + '</h3></section>');
    var num = K.nodo('<label class="op-campo op-num"><span>NÚMERO DE EGRESO <small>los dígitos finales</small></span>' +
      '<div class="op-num__fila"><input inputmode="numeric" maxlength="10" placeholder="Ej: 1234"><b class="op-num__ver"></b></div></label>');
    var iN = num.querySelector('input'), ver = num.querySelector('.op-num__ver');
    iN.value = s.numero || '';
    function pintarNum() {
      s.numero = iN.value.replace(/\D/g, '');
      if (iN.value !== s.numero) iN.value = s.numero;
      var n = numeroEgreso(s.numero);
      ver.textContent = n ? '→ ' + n : (s.numero ? 'Máximo 6 dígitos' : '→ ' + vigencia() + '000000');
      ver.classList.toggle('op-num__ver--malo', !!s.numero && !n);
    }
    iN.addEventListener('input', pintarNum);
    pintarNum();
    form.appendChild(num);
    var fF = K.nodo('<label class="op-campo"><span>FECHA DE EGRESO</span><input type="date" data-kit-fecha data-titulo="Fecha de egreso"></label>');
    var iF = fF.querySelector('input');
    iF.setAttribute('data-desde', String(vigencia() - 1));
    form.appendChild(fF);
    var zEmb = K.nodo('<div></div>');
    form.appendChild(zEmb);
    var zPagos = K.nodo('<div class="tg-pagos"></div>');
    form.appendChild(zPagos);
    var zTotal = K.nodo('<div class="kit-tarjeta op-total tg-total"></div>');
    form.appendChild(zTotal);
    var zMot = K.nodo('<div></div>');
    form.appendChild(zMot);
    col2.appendChild(form);

    var mov = K.nodo('<section class="kit-tarjeta grupo op-grupo"><h3 class="grupo__t">' + K.icono('hoja', 16) + ' Así sale en el comprobante de egreso</h3><div class="op-mov"></div></section>');
    zona.appendChild(mov);
    var fin = K.nodo('<section class="kit-tarjeta op-fin"></section>');
    zona.appendChild(fin);

    /* 8.1 · el embargo: llega marcado; desmarcarlo lo levanta SOLO en este egreso */
    function pintarEmbargo() {
      zEmb.innerHTML = '';
      var e = c.embargo;
      if (!e || !(e.cuota > 0)) return;
      var caja = K.nodo('<div class="tg-emb' + (s.embargo.aplicar ? '' : ' tg-emb--off') + '"></div>');
      var ch = K.nodo('<label class="op-check"><input type="checkbox"><span><b>Descontar embargo ' + K.esc(pesos(e.cuota)) + '</b>' +
        '<small>Va a ' + K.esc((e.cuenta && e.cuenta.codigo) || '138490002') + ' ' + K.esc((e.cuenta && e.cuenta.nombre) || 'RESPONSABILIDADES CONTRATISTAS') +
        (e.tope ? ' · tope ' + K.esc(pesos(e.tope)) + ', van ' + K.esc(pesos(e.descontado)) + ', faltan ' + K.esc(pesos(e.restante)) : ' · sin tope') + '</small></span></label>');
      var inp = ch.querySelector('input');
      inp.checked = !!s.embargo.aplicar;
      inp.addEventListener('change', function () {
        var antes = embargoDe(c, s);
        s.embargo.aplicar = inp.checked;
        var ahora = embargoDe(c, s);
        /* con un solo pago, el valor se ajusta solo */
        if (s.pagos.length === 1) s.pagos[0].valor = Math.max(0, (Number(s.pagos[0].valor) || 0) + antes - ahora);
        pintarEmbargo();
        refrescar();
      });
      caja.appendChild(ch);
      if (e.nota) caja.appendChild(K.nodo('<p class="op-nota">' + K.icono('info', 13) + ' ' + K.esc(e.nota) + '</p>'));
      if (!s.embargo.aplicar) {
        var av = K.nodo('<p class="op-nota op-nota--aviso">' + K.icono('aviso', 14) + '<span>Este egreso sale <b>sin</b> el descuento. Si el embargo ya no aplica, ' +
          '<b>levántalo</b> en la tarjeta del contratista para que no vuelva a salir en las próximas cuentas.</span></p>');
        caja.appendChild(av);
        if (C.puede('embargos')) {
          var ir = K.nodo('<button type="button" class="kit-btn kit-btn--plano op-mini">' + K.icono('candado', 14) + ' Levantar el embargo</button>');
          ir.addEventListener('click', function () { C.irA('contratista/' + encodeURIComponent(c.id)); });
          caja.appendChild(ir);
        }
      }
      zEmb.appendChild(caja);
    }

    function refrescar(soloCifras) {
      if (!soloCifras) formularioPagos(c, s, zPagos, false, refrescar);
      var r = revisar(c, s, false);
      zTotal.innerHTML = '';
      /* K.nodo devuelve UN elemento: las filas van dentro de un envoltorio */
      zTotal.appendChild(K.nodo('<div class="tg-total__filas"><div class="op-total__fila"><span>Neto de la orden</span><b>' + K.esc(pesos(c.neto)) + '</b></div>' +
        (r.embargo ? '<div class="op-total__fila"><span>Embargo</span><b>− ' + K.esc(pesos(r.embargo)) + '</b></div>' : '') +
        '<div class="op-total__fila op-total__neto"><span>Total girado</span><b>' + K.esc(pesos(r.total)) + '</b></div>' +
        (r.dif ? '<div class="op-total__fila tg-dif"><span>Diferencia</span><b>' + K.esc(pesos(r.dif)) + '</b></div>' : '') + '</div>'));
      if (!soloCifras || (r.dif !== 0) !== !!zMot.firstChild) pintarMotivo(c, s, zMot, r);
      pintarMov(r);
    }

    function pintarMov(r) {
      var cred = c.credito || { codigo: '', nombre: '' };
      var l = [];
      /* 8.1 · igual que el CORE (FC8_lineas_): bancos, embargo, diferencia y el beneficiario en UNA línea */
      var debito = 0;
      s.pagos.forEach(function (p) { var f = fuenteDe(p.fuente) || {}; var v = Number(p.valor) || 0; l.push([f.numCuenta || '—', 'BANCO ' + (f.banco || '—') + ' - ' + (p.fuente || '—'), 0, v]); debito += v; });
      if (r.embargo) {
        var ce = (c.embargo && c.embargo.cuenta) || { codigo: '138490002', nombre: 'RESPONSABILIDADES CONTRATISTAS' };
        l.push([ce.codigo, ce.nombre, 0, r.embargo]); debito += r.embargo;
      }
      var cd = reglas().cuentaDiferencia || {};
      if (r.dif > 0 && String(cd.codigo || '').trim() && s.motivo.tipo) {
        l.push([cd.codigo, (cd.nombre || 'Diferencia') + ' (' + s.motivo.tipo + ')', 0, r.dif]); debito += r.dif;
      }
      l.push([cred.codigo, cred.nombre, debito, 0]);
      var deb = 0, cre = 0;
      l.forEach(function (x) { deb += x[2]; cre += x[3]; });
      var pres = s.pagos.length < 2 ? [[c.cdp, c.rp, c.cobro]] : [[c.cdp, c.rp, c.cobro - (Number(s.pagos[1].valor) || 0)], [c.cdp, c.rp, Number(s.pagos[1].valor) || 0]];
      mov.querySelector('.op-mov').innerHTML =
        '<p class="tg-mov__t">Imputación presupuestal</p>' +
        '<div class="op-tabla tg-tabla3" role="table"><div class="op-tabla__f op-tabla__cab" role="row"><span>CDP</span><span>RP</span><span>Valor</span></div>' +
        pres.map(function (p) { return '<div class="op-tabla__f" role="row"><span>' + K.esc(p[0] || '—') + '</span><span>' + K.esc(p[1] || '—') + '</span><span>' + K.esc(K.numero(p[2])) + '</span></div>'; }).join('') +
        '<div class="op-tabla__f op-tabla__tot" role="row"><span></span><span>Total</span><span>' + K.esc(K.numero(c.cobro)) + '</span></div></div>' +
        '<p class="tg-mov__t">Movimiento financiero y contable</p>' +
        '<div class="op-tabla tg-tabla4" role="table"><div class="op-tabla__f op-tabla__cab" role="row"><span>Cuenta</span><span>Nombre</span><span>Débito</span><span>Crédito</span></div>' +
        l.map(function (x) { return '<div class="op-tabla__f" role="row"><span>' + K.esc(x[0]) + '</span><span>' + K.esc(x[1]) + '</span><span>' + K.esc(K.numero(x[2])) + '</span><span>' + K.esc(K.numero(x[3])) + '</span></div>'; }).join('') +
        '<div class="op-tabla__f op-tabla__tot" role="row"><span></span><span>Totales</span><span>' + K.esc(K.numero(deb)) + '</span><span>' + K.esc(K.numero(cre)) + '</span></div></div>' +
        (r.dif > 0 && !String(cd.codigo || '').trim() ? '<p class="op-nota">' + K.icono('info', 13) + ' La diferencia va solo como observación: la cuenta contable de la diferencia no está configurada.</p>' : '') +
        '<p class="op-nota">Valor del cheque: <b>' + K.esc(pesos(r.total)) + '</b>.</p>';
    }

    /* ---- los botones ---- */
    var f = firmantes() || {};
    if (!f.listo && f.faltan) fin.appendChild(K.nodo('<p class="op-nota op-nota--aviso">' + K.icono('lapiz', 14) + ' Falta ' + K.esc(f.faltan.join(', ')) + ' para crear el egreso.</p>'));
    else fin.appendChild(K.nodo('<p class="op-nota">' + K.icono('lapiz', 14) + ' Aprobó: <b>' + K.esc(nombre(f.alcaldesa && f.alcaldesa.nombre)) + '</b> · Revisó: <b>' +
      K.esc(nombre(f.hacienda && f.hacienda.nombre)) + '</b>. ' + (rehacer
        ? 'Elaboró: <b>' + K.esc(nombre((c.datos && c.datos.elaboro) || '—')) + '</b> · Modificó: tú.'
        : 'Elaboró: tú (Modificó queda vacío).') + '</p>'));
    var acc = K.nodo('<div class="op-fin__acc"></div>');
    var crearB = K.nodo('<button type="button" class="kit-btn kit-btn--marca op-crear">' + K.icono('documento', 18) + (rehacer ? ' Rehacer egreso' : ' Crear egreso') + '</button>');
    crearB.addEventListener('click', function () { crear(c, s, rehacer, crearB, iF); });
    acc.appendChild(crearB);
    fin.appendChild(acc);
    fin.appendChild(K.nodo('<p class="op-nota">' + (rehacer
      ? '<b>Rehacer</b> cambia el PDF y los datos del egreso sin volver a avisar al contratista. La cuenta sigue en EGRESO.'
      : '<b>Crear egreso</b> arma el PDF, lo guarda en la carpeta de la cuenta, la pasa a EGRESO y le avisa al contratista y al grupo de Tesorería.') + '</p>'));

    if (K.piezas.fechas) K.piezas.fechas.montar(fF);
    iF.value = txtAIso(s.fecha);
    iF.addEventListener('change', function () { s.fecha = isoATxt(iF.value) || hoyTxt(); });
    pintarEmbargo();
    refrescar();
    if (C.alDetalle) C.alDetalle(c);
  }

  /* ══════════════ las acciones (una llamada cada una) ══════════════ */

  function crear(c, s, rehacer, boton, iF) {
    s.fecha = isoATxt(iF.value) || s.fecha || hoyTxt();
    var numero = numeroEgreso(s.numero);
    var f = firmantes() || {};
    if (!numero) { K.aviso('Escribe el NÚMERO DE EGRESO (los dígitos finales, hasta 6).', 'aviso', 4500); var i = document.querySelector('.op-num input'); if (i) i.focus(); return; }
    if (!f.listo) { K.piezas.confirmar.avisar({ titulo: 'Faltan firmas', texto: 'Antes de crear egresos falta ' + (f.faltan || []).join(', ') + '. Lo resuelve ADMIN en Configuración.' }); return; }
    var r = revisar(c, s, false);
    if (r.errores.length) { K.aviso(r.errores[0], 'aviso', 6000); return; }
    var lista = [['Contratista', nombre(c.nombre) + ' · cuenta ' + c.informe + ' de ' + (c.total || '—')], ['Orden de pago', (c.orden || '—') + ' · neto ' + pesos(c.neto)]];
    s.pagos.forEach(function (p, i) { var fu = fuenteDe(p.fuente) || {}; lista.push(['Pago ' + (i + 1), pesos(p.valor) + ' · ' + p.fuente + ' · ' + fu.banco + ' ' + fu.numCuenta]); });
    if (r.embargo) lista.push(['Embargo', pesos(r.embargo) + ' a ' + ((c.embargo.cuenta && c.embargo.cuenta.codigo) || '138490002')]);
    else if (c.embargo && c.embargo.cuota > 0) lista.push(['Embargo', 'NO se descuenta en este egreso']);
    lista.push(['Total girado', pesos(r.total)]);
    if (r.dif) lista.push(['Diferencia', pesos(r.dif) + ' · ' + s.motivo.tipo]);
    lista.push(['Fecha', s.fecha]);
    K.piezas.confirmar.preguntar({ titulo: (rehacer ? 'Rehacer el egreso ' : 'Crear el egreso ') + numero, lista: lista, si: rehacer ? 'Rehacer egreso' : 'Crear egreso', no: 'Revisar' })
      .then(function (si) {
        if (!si) return;
        boton.disabled = true;
        var datos = { fila: c.fila, id: c.id, informe: c.informe, numero: numero, fecha: s.fecha, rehacer: !!rehacer,
                      pagos: s.pagos.map(function (p) { return { valor: Math.round(Number(p.valor) || 0), fuente: p.fuente }; }),
                      motivo: r.dif ? { tipo: s.motivo.tipo, texto: s.motivo.texto } : null,
                      embargo: { aplicar: !!(s.embargo && s.embargo.aplicar) } };
        return K.piezas.guardado.mientras(K.pedir('crearEgreso', datos, { ms: 150000 }), {
          titulo: rehacer ? 'Rehaciendo el egreso' : 'Creando el egreso', sub: 'No cierres esta ventana hasta que termine.',
          pasos: ['Cuadrando con la orden de pago…', 'Llenando la plantilla…', 'Guardando el PDF en la carpeta de la cuenta…', rehacer ? 'Casi listo…' : 'Avisando al contratista y a Tesorería…'],
          listo: { titulo: 'Egreso ' + numero + (rehacer ? ' rehecho' : ' creado'), paso: 'Cuenta en EGRESOS EMITIDOS' }
        }).then(function (res) {
          delete SEL[c.fila]; delete SEL[c.fila + 'R'];
          var bytes = bytesDe(res.pdf);
          if (res.bandeja) recibir(res.bandeja);
          var nueva = emitidos().filter(function (x) { return x.fila === c.fila; })[0];
          if (nueva) nueva._pdf = { bytes: bytes, nombre: res.nombre };
          bajarPdf(bytes, res.nombre);
          var malos = [];
          if (res.aviso && !res.aviso.ok) malos.push('al contratista (' + (res.aviso.error || 'no salió') + ')');
          if (res.grupo && !res.grupo.ok) malos.push('al grupo de Tesorería (' + (res.grupo.error || 'no salió') + ')');
          if (malos.length) K.aviso('El egreso quedó creado, pero no se pudo avisar ' + malos.join(' ni ') + '.', 'aviso', 9000);
          else if (res.embargo && res.embargo.levantado) K.aviso('Egreso sin el descuento del embargo. Si ya no aplica, levántalo en la tarjeta del contratista.', 'aviso', 9000);
          else if (res.embargo && res.embargo.cumple) K.aviso('Con este egreso el embargo llegó a su tope: ya no se descuenta más.', 'ok', 7000);
          C.irA('emitidos');
          setTimeout(function () { verEgreso(nueva || { egreso: numero, _pdf: { bytes: bytes, nombre: res.nombre } }); }, 450);
        });
      })['catch'](function (e) { K.aviso((e && e.message) || 'No se pudo crear el egreso.', 'malo', 9000); })
      .then(function () { boton.disabled = false; });
  }

  /* ══════════════ EGRESOS EMITIDOS ══════════════ */

  function pasaE(c) {
    if (F.eque === 'nuevos' && !c.datos) return false;
    if (F.eque === 'viejos' && c.datos) return false;
    var q = norm(F.busca);
    if (q) {
      var p = q.split(' ').filter(Boolean);
      for (var i = 0; i < p.length; i++) if ((c._t || '').indexOf(p[i]) < 0) return false;
    }
    return true;
  }

  function listaEmitidos() {
    var caja = K.nodo('<div class="kit-ancho vista ct op tg"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'enviar', 'EGRESOS EMITIDOS',
      'Las cuentas con egreso hecho y el pago por marcar. Revisa a qué cuenta del contratista se gira y toca <b>Marcar cuenta paga</b>: le llega el aviso con el egreso.');
    var barra = O().barra({
      placeholder: 'Nombre, documento, contrato o N° de egreso', valor: F.busca,
      alBuscar: function (q) { F.busca = q; pintar(); },
      alRefrescar: function () { return cargar(true).then(pintar); }
    });
    caja.appendChild(barra.caja);
    var zQ = K.nodo('<div></div>');
    caja.appendChild(zQ);
    var conteo = K.nodo('<p class="ct-conteo" aria-live="polite"></p>');
    caja.appendChild(conteo);
    var rej = K.nodo('<div class="kit-rejilla ct-lista"></div>');
    caja.appendChild(rej);
    var pQ;

    function pintar() {
      var todos = emitidos();
      if (pQ) {
        pQ.conteos({ '': todos.length, nuevos: todos.filter(function (c) { return c.datos; }).length, viejos: todos.filter(function (c) { return !c.datos && !c.error; }).length });
        O().marcar(zQ, F.eque);
      }
      var filas = todos.filter(function (c) { return c.error ? !F.eque : pasaE(c); });
      var suma = filas.reduce(function (s, c) { return s + (c.datos ? Number(c.datos.total) || 0 : Number(c.neto) || 0); }, 0);
      conteo.innerHTML = '<b>' + K.numero(filas.length) + '</b> ' + (filas.length === 1 ? 'egreso' : 'egresos') +
        (filas.length ? ' · ' + K.esc(pesos(suma)) + ' por pagar' : '') +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O().horaCorta(HORA)) + '</span>' : '');
      rej.innerHTML = '';
      if (!todos.length) {
        rej.appendChild(K.nodo('<div class="kit-tarjeta ct-vacio op-aldia">' + K.icono('check', 30) +
          '<p><b>¡Estás al día!</b><br>No hay egresos esperando el pago.</p></div>'));
        return;
      }
      if (!filas.length) { rej.appendChild(O().vacio('No hay egresos con estos filtros.', function () { F.eque = ''; F.busca = ''; barra.inp.value = ''; guardarFiltro(); pintar(); })); return; }
      filas.forEach(function (c) { rej.appendChild(c.error ? tarjetaError(c) : tarjetaEmitido(c, pintar)); });
    }

    K.piezas.esqueletos.mientras(rej, cargar(false), { forma: 'tarjetas', cuantos: 3, espera: 'Cargando los egresos emitidos' })
      .then(function () {
        pQ = K.piezas.pastillas.montar(zQ, { etiqueta: 'Qué egresos', valor: F.eque,
          opciones: [{ valor: '', texto: 'Todos' }, { valor: 'nuevos', texto: 'Hechos en esta app', tono: 'ok' }, { valor: 'viejos', texto: 'De la app anterior' }],
          alCambiar: function (v) { F.eque = v; guardarFiltro(); pintar(); } });
        pintar();
      })
      ['catch'](function (e) { caja.appendChild(C.errorCaja(e)); });
    K.piezas.creditos.montar(caja);
  }

  function tarjetaEmitido(c, repintar) {
    var d = c.datos;
    var t = K.nodo('<article class="kit-tarjeta ct-t op-t tg-em"></article>');
    t.appendChild(cabTarjeta(c));
    t.appendChild(K.nodo(
      '<dl class="ct-t__datos">' +
      '<div><dt>N° de egreso</dt><dd><b>' + K.esc(c.egreso || (d && d.numero) || 'sin número') + '</b></dd></div>' +
      '<div><dt>Fecha de egreso</dt><dd>' + K.esc(c.fechaEgreso || (d && d.fecha) || '—') + '</dd></div>' +
      '<div><dt>Contrato</dt><dd>' + K.esc(c.contrato || '—') + '</dd></div>' +
      '<div><dt>Orden de pago</dt><dd>' + K.esc(c.orden || '—') + '</dd></div>' +
      '</dl>'));
    /* a quién se le gira */
    t.appendChild(K.nodo('<div class="tg-benef-caja">' + K.icono('persona', 14) + ' <span><b>Cuenta del contratista:</b> ' +
      K.esc(c.banco || 'sin banco registrado') + (c.numeroCuenta ? ' · ' + K.esc(c.tipoCuenta || '') + ' <b>' + K.esc(c.numeroCuenta) + '</b>' : '') + '</span></div>'));
    var zPago = K.nodo('<div class="tg-pagos-em"></div>');
    t.appendChild(zPago);
    var s = null;
    if (d) {
      zPago.appendChild(K.nodo('<p class="tg-pagos-em__t">Se gira <b>' + K.esc(pesos(d.total)) + '</b>' +
        (d.diferencia ? ' <span class="ct-marca op-marca--prio">' + K.esc(d.motivo ? d.motivo.tipo : 'DIFERENCIA') + ' · orden ' + K.esc(pesos(d.neto)) + '</span>' : '') + '</p>'));
      (d.pagos || []).forEach(function (p) {
        zPago.appendChild(K.nodo('<p class="tg-banco">' + K.icono('moneda', 13) + ' ' + K.esc(pesos(p.valor)) + ' · ' + K.esc(p.fuente) + ' · ' + K.esc(p.banco) + ' ' + K.esc(p.numCuenta) + '</p>'));
      });
      if (d.embargo && d.embargo.valor > 0) zPago.appendChild(K.nodo('<p class="tg-banco">' + K.icono('candado', 13) + ' Embargo ' + K.esc(pesos(d.embargo.valor)) + ' · ' + K.esc(d.embargo.cuenta ? d.embargo.cuenta.codigo : '') + '</p>'));
      else if (d.embargo && d.embargo.levantado) zPago.appendChild(K.nodo('<p class="op-nota op-nota--aviso">' + K.icono('aviso', 13) + ' Salió sin el descuento del embargo.</p>'));
      if (d.motivo && d.motivo.texto) zPago.appendChild(K.nodo('<p class="op-nota">' + K.icono('info', 13) + ' ' + K.esc(d.motivo.texto) + '</p>'));
    } else if (C.puede('egresosEmitidos')) {
      /* egreso de la app anterior: los pagos se escriben aquí, como antes */
      zPago.appendChild(K.nodo('<p class="op-nota op-nota--aviso">' + K.icono('info', 14) + ' Egreso hecho con la app anterior: escribe lo que se giró. El neto de la orden es <b>' + K.esc(pesos(c.neto)) + '</b>.</p>'));
      s = selDe(c, false);
      var zp = K.nodo('<div></div>'), zt = K.nodo('<p class="tg-pagos-em__t"></p>'), zm = K.nodo('<div></div>');
      zPago.appendChild(zp); zPago.appendChild(zt); zPago.appendChild(zm);
      var cambio = function (soloCifras) {
        if (!soloCifras) formularioPagos(c, s, zp, true, cambio);
        var r = revisar(c, s, true);
        zt.innerHTML = 'Total girado <b>' + K.esc(pesos(r.total)) + '</b>' + (r.dif ? ' · diferencia ' + K.esc(pesos(r.dif)) : '');
        if (!soloCifras || (r.dif !== 0) !== !!zm.firstChild) pintarMotivo(c, s, zm, r);
      };
      cambio();
    } else {
      zPago.appendChild(K.nodo('<p class="tg-pagos-em__t">Neto de la orden <b>' + K.esc(pesos(c.neto)) + '</b></p>'));
    }
    var a = K.nodo('<div class="ct-acc"></div>');
    var ve = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('documento', 16) + ' Abrir egreso</button>');
    ve.disabled = !(c.tEgreso || c._pdf);
    if (ve.disabled) ve.title = 'Egreso de la app anterior: no tiene PDF';
    ve.addEventListener('click', function () { verEgreso(c); });
    a.appendChild(ve);
    var vo = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('ojo', 16) + ' Orden de pago</button>');
    vo.addEventListener('click', function () { verOrden(c); });
    a.appendChild(vo);
    if (d && C.puede('egresosPendientes')) {
      var rh = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('girar', 16) + ' Rehacer</button>');
      rh.addEventListener('click', function () { C.irA('egreso/' + c.fila + '/' + encodeURIComponent(c.id) + '/' + c.informe + '/rehacer'); });
      a.appendChild(rh);
    }
    t.appendChild(a);
    if (C.puede('egresosEmitidos')) {
      var paga = K.nodo('<label class="op-check tg-paga"><input type="checkbox"><span><b>Marcar cuenta paga</b><small>La pasa a PAGADA, la apunta en PAGOS y le avisa al contratista (notificación, correo y WhatsApp).</small></span></label>');
      var ch = paga.querySelector('input');
      ch.addEventListener('change', function () {
        if (!ch.checked) return;
        pagar(c, s, ch, repintar);
      });
      t.appendChild(paga);
    }
    return t;
  }

  function pagar(c, s, ch, repintar) {
    var d = c.datos;
    var datos = { fila: c.fila, id: c.id, informe: c.informe };
    var total = d ? d.total : 0;
    if (!d) {
      var r = revisar(c, s, true);
      if (r.errores.length) { ch.checked = false; K.aviso(r.errores[0], 'aviso', 6000); return; }
      datos.pagos = s.pagos.map(function (p) { return { valor: Math.round(Number(p.valor) || 0), fuente: p.fuente }; });
      datos.motivo = r.dif ? { tipo: s.motivo.tipo, texto: s.motivo.texto } : null;
      total = r.total;
    }
    K.piezas.confirmar.preguntar({
      titulo: 'Marcar la cuenta paga',
      lista: [['Contratista', nombre(c.nombre) + ' · cuenta ' + c.informe + ' de ' + (c.total || '—')], ['Egreso', c.egreso || (d && d.numero) || 'sin número'],
              ['Valor pagado', pesos(total)], ['Se le giró a', (c.banco || '—') + ' ' + (c.numeroCuenta || '')]],
      si: 'Sí, está paga', no: 'Todavía no'
    }).then(function (si) {
      if (!si) { ch.checked = false; return; }
      ch.disabled = true;
      return K.piezas.guardado.mientras(K.pedir('pagar', datos, { ms: 90000 }), {
        titulo: 'Marcando la cuenta paga', sub: 'Estamos guardando el pago y avisando al contratista.',
        pasos: ['Pasando a PAGADA…', 'Apuntando en PAGOS…', 'Avisando al contratista…'],
        listo: { titulo: 'Cuenta pagada', paso: 'Contratista avisado' }
      }).then(function (res) {
        delete SEL[c.fila];
        if (res.bandeja) recibir(res.bandeja);
        if (window.PAGADAS) window.PAGADAS.soltar();
        if (res.aviso && !res.aviso.ok) K.aviso('La cuenta quedó PAGADA, pero no se pudo avisar al contratista (' + (res.aviso.error || 'no salió') + ').', 'aviso', 9000);
        else K.aviso('Listo: cuenta PAGADA y contratista avisado.', 'ok', 3500);
        repintar();
      });
    })['catch'](function (e) { ch.checked = false; ch.disabled = false; K.aviso((e && e.message) || 'No se pudo marcar el pago.', 'malo', 8000); });
  }

  window.EGRESOS = {
    configurar: function (o) { C = o || {}; },
    pendientes: listaPendientes, emitidos: listaEmitidos, detalle: detalle,
    cargar: cargar, contar: contar, olvidar: olvidar,
    soltar: function () { B = null; CARGANDO = null; SEL = {}; },
    filtrar: function (f) { F.que = (f && f.que) || ''; F.sec = ''; F.busca = ''; F.eque = (f && f.eque) || ''; guardarFiltro(); },
    _pendientes: pendientes, _emitidos: emitidos, _bandeja: function () { return B; },
    _filtradas: function () { return pendientes().filter(function (c) { return pasa(c); }); },
    _filtradasE: function () { return emitidos().filter(function (c) { return c.error ? !F.eque : pasaE(c); }); },
    _actual: function () { return ACTUAL; }, _sel: function (c) { return c ? SEL[c.fila] || SEL[c.fila + 'R'] || null : null; },
    _revisar: revisar, _numero: numeroEgreso, _fuente: fuenteDe, _embargo: embargoDe,
    TRAMO_TXT: TRAMO_TXT
  };
}());
