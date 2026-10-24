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
   23/10: COPIAR RESPUESTA GENÉRICA (consulta por el pago antes del giro),
   armada aquí con lo que ya trae la lista; ver generica().
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var DATA = null, HORA = null, CARGANDO = null, COPIA = false;
  var F = { que: 'PENDIENTE', busca: '' };

  function O() { return window.OFICINA; }

  function recibir(d) {
    DATA = ((d && d.solicitudes) || []).map(function (x) {
      x._t = K.norm([x.nombre, x.contrato, x.codigo, x.sec, x.solicitud, x.respuesta].join(' '));
      return x;
    });
    HORA = new Date();
    COPIA = !!(d && d.copiaRespuesta);   /* 23/10 · bandera del CORE (Tesoreria1023.gs) */
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
    /* 23/10 · respuesta genérica de pago: solo si el CORE ya trae los datos (bandera) */
    if (COPIA && C.puede('solicitudes') && K.norm(((C.yo && C.yo()) || {}).rol || '') !== 'INVITADO') {
      var cp = K.nodo('<button type="button" class="kit-btn kit-btn--plano tg-sol__copiar">' + K.icono('copiar', 16) + ' Copiar respuesta genérica</button>');
      cp.addEventListener('click', function () { copiarGenerica(x); });
      a.appendChild(cp);
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

  /* ============================================================
     23/10 · RESPUESTA GENÉRICA DE PAGO
     Consulta por el pago de una cuenta que ya tiene orden de pago y aún
     no se gira. Se arma aquí con lo que ya trae la lista (sin viaje):
     nombre, contrato y año, y la fecha de la orden de pago de SU cuenta.
     Sin orden de pago no se copia. Con novedades (requerimiento abierto,
     embargo) o con la cuenta ya PAGADA se avisa antes de copiar, porque
     el texto dice que no hay novedades ni requerimientos pendientes.
     ============================================================ */
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function fechaLarga(f) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(f || ''));
    if (!m || +m[2] < 1 || +m[2] > 12) return '';
    return (+m[1]) + ' de ' + MESES[+m[2] - 1] + ' de ' + m[3];
  }

  /** La cuenta por la que se pregunta: la del informe de la solicitud; si no dice, la última con orden sin pagar. */
  function cuentaDe(x) {
    var cs = x.cuentas || [];
    if (x.informe) {
      for (var i = 0; i < cs.length; i++) if (+cs[i].informe === +x.informe) return cs[i];
    }
    var con = cs.filter(function (c) { return c.orden; });
    var sinPagar = con.filter(function (c) { return c.estado !== 'PAGADA'; });
    var l = sinPagar.length ? sinPagar : con;
    return l.length ? l[l.length - 1] : null;
  }

  function esEmpresa(n) { return /\b(S\.?\s?A\.?\s?S|LTDA|S\.\s?A\.?|E\.\s?U|SAS|FUNDACI[OÓ]N|CORPORACI[OÓ]N|ASOCIACI[OÓ]N|COOPERATIVA|CONSORCIO|UNI[OÓ]N TEMPORAL)\b/i.test(String(n || '')); }

  /** { texto, cuenta, avisos[] } o { error } — sin tocar el servidor. */
  function generica(x) {
    var c = cuentaDe(x);
    if (!c) return { error: 'Esta solicitud no tiene una cuenta con orden de pago: la respuesta genérica no aplica.' };
    if (!c.orden) return { error: 'La cuenta ' + c.informe + ' todavía no tiene orden de pago: la respuesta genérica no aplica.' };
    var fecha = fechaLarga(c.fechaOrden);
    if (!fecha) return { error: 'La orden de pago ' + c.orden + ' no tiene fecha registrada: revísala antes de responder.' };
    var nombre = String(x.nombre || '').trim().toUpperCase();
    var anio = x.anio || '';
    var avisos = (x.novedades || []).slice();
    if (c.estado === 'PAGADA') avisos.push('La cuenta ' + c.informe + ' ya está PAGADA' + (c.detallePago ? ' (' + c.detallePago + ')' : '') + '.');
    else if (c.estado && c.estado !== 'ORDEN DE PAGO' && c.estado !== 'EGRESO') avisos.push('La cuenta ' + c.informe + ' está en ' + c.estado + '.');
    var conOrden = (x.cuentas || []).filter(function (k) { return k.orden && k.estado !== 'PAGADA'; });
    if (!x.informe && conOrden.length > 1) avisos.push('Tiene ' + conOrden.length + ' cuentas con orden sin pagar: se usó la cuenta ' + c.informe + ' (orden del ' + c.fechaOrden + ').');
    var T = [
      'Respuesta a la solicitud ' + (x.codigo || ''),
      '',
      'Cordial saludo, ' + (esEmpresa(nombre) ? 'señores' : 'señor(a)') + ' ' + nombre + '.',
      '',
      'En atención a su consulta sobre el estado del pago del Contrato de Prestación de Servicios Profesionales No. ' + (x.contrato || '') + ' de ' + anio + ', la Tesorería Municipal le precisa lo siguiente:',
      '',
      '1. ESTADO DEL TRÁMITE',
      'Su cuenta ya surtió las etapas de revisión, aprobación y causación contable, y cuenta con orden de pago emitida el ' + fecha + '. Se encuentra en la última fase del trámite: el giro de los recursos.',
      '',
      '2. LA ORDEN DE PAGO NO FIJA LA FECHA DEL PAGO',
      'La emisión de la orden de pago y el mensaje con que se le notificó no constituyen una fecha de desembolso ni generan un plazo para efectuarlo. La oportunidad del giro está determinada por:',
      '',
      'a) Condiciones contractuales: la cláusula sexta (forma de pago) pacta pagos mensuales, mes vencido, previa presentación de los requisitos allí enumerados, entre ellos el comprobante de egreso (numeral 6). A su vez, la cláusula cuarta, en las obligaciones del Municipio, establece que el pago se efectúa en la forma y plazos estipulados (numeral 4) y una vez cumplidos los trámites administrativos y fiscales vigentes (numeral 6). El contrato no fija un término en días para el desembolso a partir de la orden de pago.',
      'b) Condiciones presupuestales: de acuerdo con la cláusula séptima, el contrato se imputa a la vigencia fiscal ' + anio + ', con fuente en ingresos corrientes de libre destinación. La ejecución del gasto está sujeta al Programa Anual Mensualizado de Caja (PAC), que fija el monto máximo mensual de fondos disponibles para pagos, según el artículo 73 del Decreto 111 de 1996 (Estatuto Orgánico del Presupuesto), aplicable a las entidades territoriales por virtud del artículo 353 de la Constitución Política y del artículo 109 del mismo decreto.',
      'c) Flujo de caja: la disponibilidad efectiva de recursos en la tesorería municipal.',
      'd) Procedimientos internos de la Tesorería: la programación de los giros, que se aplica en igualdad de condiciones a todos los contratistas del municipio.',
      '',
      '3. EL COMPROBANTE DE EGRESO',
      'El comprobante de egreso es un registro interno previo al giro y no se notifica al contratista. Puede verse en la aplicación CONTRATISTA, en ESTADO DE CUENTA. Como lo indica la aplicación al iniciar una solicitud a Tesorería, las consultas sobre el pago proceden una vez el egreso esté registrado.',
      '',
      '4. NOTIFICACIÓN DEL PAGO',
      'Una vez se efectúe el pago, usted recibirá la notificación por WhatsApp y por correo electrónico. Si después de esa notificación el valor no se refleja en su cuenta bancaria, con gusto revisaremos el caso.',
      '',
      'A la fecha, su cuenta no presenta novedades ni requerimientos pendientes de su parte. Le agradecemos tener presente lo anterior.',
      '',
      'Atentamente,',
      '',
      'Tesorería Municipal',
      'Alcaldía de Flandes'
    ];
    return { texto: T.join('\n'), cuenta: c, avisos: avisos };
  }

  function alPortapapeles(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto)['catch'](function () { return aMano(texto); });
    return aMano(texto);
  }
  function aMano(texto) {
    return new Promise(function (ok, mal) {
      var ta = document.createElement('textarea');
      ta.value = texto; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var hecho = false; try { hecho = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      if (hecho) ok(); else mal(new Error('El navegador no dejó copiar.'));
    });
  }

  function copiarGenerica(x) {
    var g = generica(x);
    if (g.error) { K.aviso(g.error, 'aviso', 6000); return; }
    var copiar = function () {
      return alPortapapeles(g.texto).then(function () { if (K.vibrar) K.vibrar(8); K.aviso('Respuesta copiada', 'ok', 2200); },
        function () { K.aviso('No se pudo copiar en este navegador.', 'malo', 5000); });
    };
    if (!g.avisos.length) { copiar(); return; }
    var cuerpo = K.nodo('<div><p class="formulario__nota">Antes de copiar, revisa:</p><ul class="tg-sol__avisos"></ul>' +
      '<p class="formulario__nota">La respuesta dice que <b>su cuenta no presenta novedades ni requerimientos pendientes</b>. Si no es así, ajusta el texto al pegarlo.</p></div>');
    var ul = cuerpo.querySelector('ul');
    g.avisos.forEach(function (t) { ul.appendChild(K.nodo('<li>' + K.icono('aviso', 14) + ' <span>' + K.esc(t) + '</span></li>')); });
    var m = O().modal({
      titulo: 'Respuesta genérica · ' + (x.codigo || ''), cuerpo: cuerpo,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Copiar igual', icono: 'copiar', marca: true, al: function () { m.cerrar(); copiar(); } }]
    });
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
    /* 24/10 · el asistente lleva a la lista con la pastilla ya puesta */
    filtrar: function (f) { F.que = f && f.que !== undefined ? f.que : 'PENDIENTE'; F.busca = ''; },
    _generica: generica,
    _datos: function () { return DATA; }, _filtradas: function () { return (DATA || []).filter(function (x) { return pasa(x); }); }
  };
}());
