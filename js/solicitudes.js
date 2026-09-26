/* ============================================================
   TESORERIA-FLANDES · SOLICITUDES
   Ecosistema Flandes · Fase 8

   Lo que el contratista pregunta desde SOLICITUD TESORERIA (hoja
   TESORERIA). UNA llamada ('solicitudes'): cada pendiente viene con el
   estado de las cuentas de su contrato (orden, egreso, fecha y detalle
   del pago), para responder sin ir a buscar a la hoja.
   RESPONDER es una llamada: la solicitud pasa a RESPONDIDA, queda quién
   respondió y al contratista le llega por WhatsApp con el texto de
   siempre ("Atendiendo a tu solicitud… Nos permitimos responder…").
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var DATA = null, HORA = null, CARGANDO = null;
  var F = { que: 'PENDIENTE', busca: '' };

  function O() { return window.OFICINA; }

  function recibir(d) {
    DATA = ((d && d.solicitudes) || []).map(function (x) {
      x._t = K.norm([x.nombre, x.contrato, x.codigo, x.sec, x.solicitud, x.respuesta].join(' '));
      return x;
    });
    HORA = new Date();
    if (C.alSolicitudes) C.alSolicitudes(contar());
  }

  function cargar(fresco) {
    if (DATA && !fresco) return Promise.resolve(DATA);
    if (CARGANDO && !fresco) return CARGANDO;
    CARGANDO = O().leer('solicitudes', {}).then(function (d) { CARGANDO = null; recibir(d); return DATA; },
      function (e) { CARGANDO = null; throw e; });
    return CARGANDO;
  }

  function contar() {
    var n = { total: 0, pendientes: 0, respondidas: 0 };
    (DATA || []).forEach(function (x) { n.total++; if (x.estado === 'PENDIENTE') n.pendientes++; else n.respondidas++; });
    return n;
  }

  function pasa(x, sinQue) {
    if (!sinQue && F.que && (F.que === 'PENDIENTE' ? x.estado !== 'PENDIENTE' : x.estado === 'PENDIENTE')) return false;
    var q = K.norm(F.busca || '');
    if (q) { var p = q.split(' ').filter(Boolean); for (var i = 0; i < p.length; i++) if (x._t.indexOf(p[i]) < 0) return false; }
    return true;
  }

  function vista() {
    var caja = K.nodo('<div class="kit-ancho vista ct of tg"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'comentario', 'SOLICITUDES',
      'Lo que los contratistas le preguntan a Tesorería. Cada una trae en qué va cada cuenta de su contrato. Tu respuesta le llega por WhatsApp.');
    var b = O().barra({ placeholder: 'Contratista, contrato o código', valor: F.busca,
      alBuscar: function (q) { F.busca = q; pintar(); }, alRefrescar: function () { return cargar(true).then(pintar); } });
    caja.appendChild(b.caja);
    var zQ = K.nodo('<div></div>');
    caja.appendChild(zQ);
    var conteo = K.nodo('<p class="ct-conteo" aria-live="polite"></p>');
    caja.appendChild(conteo);
    var lista = K.nodo('<div class="kit-rejilla ct-lista tg-sols"></div>');
    caja.appendChild(lista);
    var pQ;

    function pintar() {
      if (!DATA) return;
      var bq = DATA.filter(function (x) { return pasa(x, true); });
      pQ.conteos({ PENDIENTE: bq.filter(function (x) { return x.estado === 'PENDIENTE'; }).length, RESPONDIDA: bq.filter(function (x) { return x.estado !== 'PENDIENTE'; }).length, '': bq.length });
      O().marcar(zQ, F.que);
      var filas = DATA.filter(function (x) { return pasa(x); });
      conteo.innerHTML = '<b>' + K.numero(filas.length) + '</b> ' + (filas.length === 1 ? 'solicitud' : 'solicitudes') +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O().horaCorta(HORA)) + '</span>' : '');
      lista.innerHTML = '';
      if (!filas.length) {
        lista.appendChild(F.que === 'PENDIENTE' && !F.busca
          ? K.nodo('<div class="kit-tarjeta ct-vacio op-aldia">' + K.icono('check', 30) + '<p><b>¡Al día!</b><br>No hay solicitudes pendientes.</p></div>')
          : O().vacio('No hay solicitudes con estos filtros.', function () { F.que = ''; F.busca = ''; b.inp.value = ''; pintar(); }));
        return;
      }
      filas.forEach(function (x) { lista.appendChild(tarjeta(x, pintar)); });
    }

    K.piezas.esqueletos.mientras(lista, cargar(false), { forma: 'tarjetas', cuantos: 2, espera: 'Cargando las solicitudes' })
      .then(function () {
        pQ = K.piezas.pastillas.montar(zQ, { etiqueta: 'Estado', valor: F.que,
          opciones: [{ valor: 'PENDIENTE', texto: 'Pendientes', tono: 'aviso' }, { valor: 'RESPONDIDA', texto: 'Respondidas', tono: 'ok' }, { valor: '', texto: 'Todas' }],
          alCambiar: function (v) { F.que = v; pintar(); } });
        pintar();
      })['catch'](function (e) { caja.appendChild(C.errorCaja(e)); });
    K.piezas.creditos.montar(caja);
  }

  function tarjeta(x, repintar) {
    var pend = x.estado === 'PENDIENTE';
    var t = K.nodo('<article class="kit-tarjeta ct-t tg-sol' + (pend ? ' tg-sol--pend' : '') + '"></article>');
    var cab = K.nodo('<div class="ct-t__cab"></div>');
    if (K.piezas.personas) cab.appendChild(K.piezas.personas.avatar(x.nombre, { tam: 44, foto: x.img || '' }));
    cab.appendChild(K.nodo('<div class="ct-t__quien"><h3 class="ct-t__n">' + K.esc(O().nombre(x.nombre)) + '</h3>' +
      '<p class="ct-t__doc">Contrato ' + K.esc(x.contrato || '—') + ' · ' + K.esc(O().titulo(x.sec) || '—') + '</p></div>'));
    cab.appendChild(K.nodo('<span class="kit-pastilla ct-t__estado of-estado ' + (pend ? 'of-estado--abierto' : 'of-estado--ok') + '">' + K.esc(x.estado) + '</span>'));
    t.appendChild(cab);
    t.appendChild(K.nodo('<p class="tg-sol__meta">' + K.icono('reloj', 12) + ' ' + K.esc(x.codigo) + ' · ' + K.esc(x.fecha) +
      (x.fechaIso ? ' <small>(' + K.esc(O().cuando(x.fechaIso)) + ')</small>' : '') + (x.tipo ? ' · ' + K.esc(x.tipo) : '') + (x.informe ? ' · cuenta ' + K.esc(x.informe) : '') + '</p>'));
    t.appendChild(K.nodo('<blockquote class="tg-sol__txt">' + O().conEnlaces(x.solicitud) + '</blockquote>'));
    if (x.cuentas && x.cuentas.length) {
      var det = K.nodo('<details class="tg-sol__cuentas"><summary>' + K.icono('hoja', 13) + ' Sus cuentas (' + x.cuentas.length + ')</summary><div class="tg-sol__tabla"></div></details>');
      var tb = det.querySelector('.tg-sol__tabla');
      x.cuentas.forEach(function (c) {
        tb.appendChild(K.nodo('<div class="tg-sol__fila"><b>' + K.esc(c.informe) + '</b><span class="ct-marca' + (c.estado === 'PAGADA' ? ' op-marca--ok' : '') + '">' + K.esc(c.estado || '—') + '</span>' +
          '<span>' + K.esc(K.pesos(c.cobro)) + '</span><span>' + (c.orden ? 'OP ' + K.esc(c.orden) : '') + (c.egreso ? ' · EG ' + K.esc(c.egreso) + (c.fechaEgreso ? ' (' + K.esc(c.fechaEgreso) + ')' : '') : '') + '</span>' +
          (c.detallePago ? '<small>' + K.esc(c.detallePago) + '</small>' : '') + '</div>'));
      });
      t.appendChild(det);
    }
    if (!pend) {
      t.appendChild(K.nodo('<div class="tg-sol__resp">' + K.icono('responder', 14) + ' <div><p>' + O().conEnlaces(x.respuesta || '—') + '</p><small>' +
        K.esc(x.fechaRespuesta || '') + (x.respondio ? ' · ' + K.esc(O().nombre(x.respondio)) : '') + '</small></div></div>'));
    }
    var a = K.nodo('<div class="ct-acc"></div>');
    if (x.telefono) {
      var w = K.nodo('<a class="kit-btn kit-btn--plano" target="_blank" rel="noopener">' + K.icono('whatsapp', 16) + ' WhatsApp</a>');
      w.href = 'https://wa.me/57' + String(x.telefono).replace(/\D/g, '').slice(-10);
      a.appendChild(w);
    }
    /* 25/09 · INVITADO solo consulta: no responde (el CORE también lo niega) */
    if (pend && C.puede('solicitudes') && K.norm(((C.yo && C.yo()) || {}).rol || '') !== 'INVITADO') {
      var r = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('responder', 16) + ' Responder</button>');
      r.addEventListener('click', function () { responder(x, repintar); });
      a.appendChild(r);
    }
    t.appendChild(a);
    return t;
  }

  function responder(x, repintar) {
    var cuerpo = K.nodo('<div><p class="formulario__nota">A <b>' + K.esc(O().nombre(x.nombre)) + '</b> le llega por WhatsApp:</p>' +
      '<blockquote class="tg-sol__txt">Atendiendo a tu solicitud: ' + K.esc(x.solicitud) + '</blockquote>' +
      '<label class="op-campo"><span>Nos permitimos responder</span><textarea rows="5" maxlength="3000"></textarea></label></div>');
    var ta = cuerpo.querySelector('textarea');
    var m = O().modal({
      titulo: 'Responder ' + x.codigo, cuerpo: cuerpo,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Responder', icono: 'enviar', marca: true, al: enviar }]
    });
    setTimeout(function () { ta.focus(); }, 200);
    function enviar() {
      var txt = ta.value.trim();
      if (txt.length < 5) { K.aviso('Escribe la respuesta.', 'aviso', 3000); return; }
      m.botones[1].disabled = true;
      K.piezas.guardado.mientras(K.pedir('responder', { fila: x.fila, codigo: x.codigo, respuesta: txt }, { ms: 60000 }), {
        titulo: 'Respondiendo', sub: 'Le avisamos al contratista por WhatsApp.', pasos: ['Guardando la respuesta…', 'Enviando el WhatsApp…'],
        listo: { titulo: 'Solicitud respondida', paso: 'Contratista avisado' }
      }).then(function (r) {
        if (r.lista) recibir(r.lista);
        if (r.aviso && !r.aviso.ok) K.aviso('Quedó RESPONDIDA, pero el WhatsApp no salió (' + (r.aviso.error || 'sin detalle') + ').', 'aviso', 8000);
        m.cerrar();
        repintar();
      }, function (e) { m.botones[1].disabled = false; K.aviso((e && e.message) || 'No se pudo responder.', 'malo', 7000); });
    }
  }

  window.SOLIS = {
    configurar: function (c) { C = c || {}; },
    vista: vista, cargar: cargar, contar: contar,
    soltar: function () { DATA = null; CARGANDO = null; },
    olvidar: function () { DATA = null; CARGANDO = null; F = { que: 'PENDIENTE', busca: '' }; },
    _datos: function () { return DATA; }, _filtradas: function () { return (DATA || []).filter(function (x) { return pasa(x); }); }
  };
}());
