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
   03/11: RESPUESTAS RÁPIDAS EDITABLES. Los textos llegan en la misma lista
   (d.respuestas, CONFIG RESPUESTAS_TESORERIA, Tesoreria1103.gs) con
   marcadores {nombre}, {contrato}… y se editan en CONFIGURACIÓN. Botones:
   "Respuesta genérica tiempo", "Respuesta genérica descuentos" y las que
   se agreguen. Cada una abre la vista previa (editable) para COPIAR o
   RESPONDER con ese texto. Sin d.respuestas (CORE viejo) queda solo la de
   tiempo con el texto de siempre: front y CORE se suben en cualquier orden.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var DATA = null, HORA = null, CARGANDO = null, COPIA = false, RESP = null;
  var TOPE_WA = 3000;   /* FC8_responder corta en 3.000 caracteres */
  var F = { que: 'PENDIENTE', busca: '' };

  function O() { return window.OFICINA; }

  function recibir(d) {
    DATA = ((d && d.solicitudes) || []).map(function (x) {
      x._t = K.norm([x.nombre, x.contrato, x.codigo, x.sec, x.solicitud, x.respuesta].join(' '));
      return x;
    });
    HORA = new Date();
    COPIA = !!(d && d.copiaRespuesta);   /* 23/10 · bandera del CORE (Tesoreria1023.gs) */
    RESP = d && d.respuestas && typeof d.respuestas === 'object' ? d.respuestas : null;   /* 03/11 · Tesoreria1103.gs */
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
    /* 23/10 · respuesta genérica de pago: solo si el CORE ya trae los datos (bandera).
       03/11 · una por cada respuesta rápida de CONFIG (tiempo, descuentos y las que vengan) */
    if (COPIA && C.puede('solicitudes') && K.norm(((C.yo && C.yo()) || {}).rol || '') !== 'INVITADO') {
      llavesRespuesta().forEach(function (k) {
        var r = (RESP && RESP[k]) || { titulo: 'Respuesta genérica tiempo' };
        var cp = K.nodo('<button type="button" class="kit-btn kit-btn--plano tg-sol__copiar"></button>');
        cp.innerHTML = K.icono(ICONO_RESP[k] || 'copiar', 16) + ' ' + K.esc(r.titulo || k);
        cp.addEventListener('click', function () { abrirRespuesta(x, k, repintar); });
        a.appendChild(cp);
      });
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

  /* 03/11 · el texto de siempre, solo si el CORE todavía no manda las plantillas */
  var TIEMPO_RESPALDO = [
    'Respuesta a la solicitud {codigo}', '',
    'Cordial saludo, {saludo} {nombre}.', '',
    'En atención a su consulta sobre el estado del pago del Contrato de Prestación de Servicios Profesionales No. {contrato} de {anio}, la Tesorería Municipal le precisa lo siguiente:', '',
    '1. ESTADO DEL TRÁMITE',
    'Su cuenta ya surtió las etapas de revisión, aprobación y causación contable, y cuenta con orden de pago emitida el {fechaOrden}. Se encuentra en la última fase del trámite: el giro de los recursos.', '',
    '2. LA ORDEN DE PAGO NO FIJA LA FECHA DEL PAGO',
    'La emisión de la orden de pago y el mensaje con que se le notificó no constituyen una fecha de desembolso ni generan un plazo para efectuarlo. La oportunidad del giro está determinada por:', '',
    'a) Condiciones contractuales: la cláusula sexta (forma de pago) pacta pagos mensuales, mes vencido, previa presentación de los requisitos allí enumerados, entre ellos el comprobante de egreso (numeral 6). A su vez, la cláusula cuarta, en las obligaciones del Municipio, establece que el pago se efectúa en la forma y plazos estipulados (numeral 4) y una vez cumplidos los trámites administrativos y fiscales vigentes (numeral 6). El contrato no fija un término en días para el desembolso a partir de la orden de pago.',
    'b) Condiciones presupuestales: de acuerdo con la cláusula séptima, el contrato se imputa a la vigencia fiscal {anio}, con fuente en ingresos corrientes de libre destinación. La ejecución del gasto está sujeta al Programa Anual Mensualizado de Caja (PAC), que fija el monto máximo mensual de fondos disponibles para pagos, según el artículo 73 del Decreto 111 de 1996 (Estatuto Orgánico del Presupuesto), aplicable a las entidades territoriales por virtud del artículo 353 de la Constitución Política y del artículo 109 del mismo decreto.',
    'c) Flujo de caja: la disponibilidad efectiva de recursos en la tesorería municipal.',
    'd) Procedimientos internos de la Tesorería: la programación de los giros, que se aplica en igualdad de condiciones a todos los contratistas del municipio.', '',
    '3. EL COMPROBANTE DE EGRESO',
    'El comprobante de egreso es un registro interno previo al giro y no se notifica al contratista. Puede verse en la aplicación CONTRATISTA, en ESTADO DE CUENTA. Como lo indica la aplicación al iniciar una solicitud a Tesorería, las consultas sobre el pago proceden una vez el egreso esté registrado.', '',
    '4. NOTIFICACIÓN DEL PAGO',
    'Una vez se efectúe el pago, usted recibirá la notificación por WhatsApp y por correo electrónico. Si después de esa notificación el valor no se refleja en su cuenta bancaria, con gusto revisaremos el caso.', '',
    'A la fecha, su cuenta no presenta novedades ni requerimientos pendientes de su parte. Le agradecemos tener presente lo anterior.', '',
    'Atentamente,', '', 'Tesorería Municipal', 'Alcaldía de Flandes'
  ].join('\n');

  var ICONO_RESP = { TIEMPO: 'reloj', DESCUENTOS: 'moneda' };

  /** Las respuestas a mostrar: TIEMPO y DESCUENTOS primero, luego las que se hayan agregado. */
  function llavesRespuesta() {
    if (!RESP) return ['TIEMPO'];
    var ks = Object.keys(RESP).filter(function (k) { return RESP[k] && RESP[k].texto; });
    var orden = ['TIEMPO', 'DESCUENTOS'];
    return orden.filter(function (k) { return ks.indexOf(k) >= 0; }).concat(ks.filter(function (k) { return orden.indexOf(k) < 0; }));
  }
  function plantilla(k) {
    if (RESP && RESP[k] && RESP[k].texto) return RESP[k];
    return k === 'TIEMPO' ? { titulo: 'Respuesta genérica tiempo', texto: TIEMPO_RESPALDO } : null;
  }

  function pct(p) { return String(Math.round(Number(p) * 1000) / 1000).replace('.', ','); }
  function esEst(a) { return K.norm(a.t) === 'EST' || /ESTAMPILLA/.test(K.norm(a.n)); }

  /** Pone los marcadores {x}. Los que no tienen valor se quedan a la vista para que se noten. */
  function llenar(texto, vals) {
    return String(texto || '').replace(/\{(\w+)\}/g, function (m, k) { return vals[k] !== undefined && vals[k] !== '' ? String(vals[k]) : m; });
  }

  /** Los valores comunes de una solicitud y su cuenta. */
  function valores(x, c) {
    var nombre = String(x.nombre || '').trim().toUpperCase();
    var v = {
      codigo: x.codigo || '', saludo: esEmpresa(nombre) ? 'señores' : 'señor(a)', nombre: nombre,
      contrato: x.contrato || '', anio: x.anio || '', cuenta: c ? c.informe : '', orden: c && c.orden ? c.orden : '',
      fechaOrden: c ? fechaLarga(c.fechaOrden) : '', cobro: c && c.cobro ? K.pesos(c.cobro) : ''
    };
    var d = c && c.desc;
    if (d && d.a) {
      var tot = 0;
      v.detalleDescuentos = d.a.map(function (a) { tot += a.v; return '• ' + a.n + ': ' + pct(a.p) + ' % sobre ' + K.pesos(a.b) + ' = ' + K.pesos(a.v); }).join('\n');
      v.totalDescuentos = K.pesos(tot);
      v.neto = K.pesos(d.neto || ((c.cobro || d.cobro || 0) - tot));
      if (!v.cobro && d.cobro) v.cobro = K.pesos(d.cobro);
      v.tramo = tramo(x, c);
    }
    return v;
  }

  /** "del contrato inicial ($16.000.000)" / "de la adición ($X)", según si una cuenta anterior ya pagó estampillas. */
  function tramo(x, c) {
    var est = (c.desc && c.desc.a || []).filter(esEst);
    if (!est.length) return 'del contrato o de la adición';
    var antes = (x.cuentas || []).some(function (k) { return +k.informe < +c.informe && k.desc && (k.desc.a || []).some(esEst); });
    return (antes ? 'de la adición (' : 'del contrato inicial (') + K.pesos(est[0].b) + ')';
  }

  /** { texto, titulo, cuenta, avisos[] } o { error } — sin tocar el servidor. */
  function armar(x, k) {
    var pl = plantilla(k);
    if (!pl) return { error: 'Esa respuesta ya no está en la configuración.' };
    var c = cuentaDe(x);
    var avisos = (x.novedades || []).slice();
    if (k === 'TIEMPO') {
      if (!c) return { error: 'Esta solicitud no tiene una cuenta con orden de pago: la respuesta genérica no aplica.' };
      if (!c.orden) return { error: 'La cuenta ' + c.informe + ' todavía no tiene orden de pago: la respuesta genérica no aplica.' };
      if (!fechaLarga(c.fechaOrden)) return { error: 'La orden de pago ' + c.orden + ' no tiene fecha registrada: revísala antes de responder.' };
      if (c.estado === 'PAGADA') avisos.push('La cuenta ' + c.informe + ' ya está PAGADA' + (c.detallePago ? ' (' + c.detallePago + ')' : '') + '.');
      else if (c.estado && c.estado !== 'ORDEN DE PAGO' && c.estado !== 'EGRESO') avisos.push('La cuenta ' + c.informe + ' está en ' + c.estado + '.');
      var conOrden = (x.cuentas || []).filter(function (q) { return q.orden && q.estado !== 'PAGADA'; });
      if (!x.informe && conOrden.length > 1) avisos.push('Tiene ' + conOrden.length + ' cuentas con orden sin pagar: se usó la cuenta ' + c.informe + ' (orden del ' + c.fechaOrden + ').');
    } else if (k === 'DESCUENTOS') {
      if (!c || !c.orden) return { error: (c ? 'La cuenta ' + c.informe : 'Esta solicitud') + ' todavía no tiene orden de pago: los descuentos aún no están liquidados.' };
      if (!c.desc || !c.desc.a || !c.desc.a.length) return { error: 'La orden de pago ' + c.orden + ' no trae el detalle de descuentos (se hizo por fuera de la app): revísala antes de responder.' };
      if (!c.desc.a.some(esEst)) {
        var con = (x.cuentas || []).filter(function (q) { return q.desc && (q.desc.a || []).some(esEst); }).map(function (q) { return q.informe; });
        avisos.push('La cuenta ' + c.informe + ' no lleva estampillas' + (con.length ? ' (se descontaron en la cuenta ' + con.join(' y ') + ')' : '') + '. Ajusta el texto si pregunta por ellas.');
      }
      var otras = (x.cuentas || []).filter(function (q) { return q.orden; });
      if (!x.informe && otras.length > 1) avisos.push('Tiene ' + otras.length + ' cuentas con orden: se usó la cuenta ' + c.informe + ' (OP ' + c.orden + ').');
    }
    var texto = llenar(pl.texto, valores(x, c));
    var faltan = (texto.match(/\{\w+\}/g) || []).filter(function (m, i, l) { return l.indexOf(m) === i; });
    if (faltan.length) avisos.push('Quedaron sin llenar: ' + faltan.join(', ') + '. Complétalos antes de enviar.');
    return { texto: texto, titulo: pl.titulo || k, cuenta: c, avisos: avisos };
  }

  /** Compatibilidad (ayuda y asistente): la de tiempo como antes. */
  function generica(x) { return armar(x, 'TIEMPO'); }

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

  /* 03/11 · vista previa editable: COPIAR o RESPONDER con ese texto (un toque más, nunca envía sola) */
  function abrirRespuesta(x, k, repintar) {
    var g = armar(x, k);
    if (g.error) { K.aviso(g.error, 'aviso', 6000); return; }
    var cuerpo = K.nodo('<div class="tg-resp"><ul class="tg-sol__avisos"></ul>' +
      '<label class="op-campo"><span>Texto (puedes ajustarlo antes de copiar o enviar)</span><textarea rows="14"></textarea></label>' +
      '<p class="formulario__nota tg-resp__cuenta" aria-live="polite"></p></div>');
    var ul = cuerpo.querySelector('ul');
    if (!g.avisos.length) ul.hidden = true;
    g.avisos.forEach(function (t) { ul.appendChild(K.nodo('<li>' + K.icono('aviso', 14) + ' <span>' + K.esc(t) + '</span></li>')); });
    var ta = cuerpo.querySelector('textarea');
    ta.value = g.texto;
    var nota = cuerpo.querySelector('.tg-resp__cuenta');
    var pend = x.estado === 'PENDIENTE';
    var bts = [{ texto: 'Copiar', icono: 'copiar', marca: !pend, al: copiar }];
    if (pend) bts.push({ texto: 'Responder', icono: 'enviar', marca: true, al: enviar });
    var m = O().modal({ titulo: g.titulo + ' · ' + (x.codigo || ''), cuerpo: cuerpo, ancha: true, botones: bts });
    function contar() {
      var n = ta.value.trim().length, largo = n > TOPE_WA;
      nota.innerHTML = K.icono(largo ? 'aviso' : 'info', 13) + ' ' + K.numero(n) + ' caracteres' +
        (largo ? ' · pasa de ' + K.numero(TOPE_WA) + ': por WhatsApp no cabe completo. Cópialo y envíalo por otro medio, o acórtalo.' : '');
      nota.classList.toggle('formulario__nota--fuerte', largo);
      if (m.botones[1]) m.botones[1].disabled = largo || n < 5;
    }
    ta.addEventListener('input', contar);
    contar();
    function copiar() {
      alPortapapeles(ta.value.trim()).then(function () { if (K.vibrar) K.vibrar(8); K.aviso('Respuesta copiada', 'ok', 2200); m.cerrar(); },
        function () { K.aviso('No se pudo copiar en este navegador.', 'malo', 5000); });
    }
    function enviar() { m.cerrar(); responder(x, repintar, ta.value.trim()); }
  }

  function responder(x, repintar, previo) {
    var cuerpo = K.nodo('<div><p class="formulario__nota">A <b>' + K.esc(O().nombre(x.nombre)) + '</b> le llega por WhatsApp:</p>' +
      '<blockquote class="tg-sol__txt">Atendiendo a tu solicitud: ' + K.esc(x.solicitud) + '</blockquote>' +
      '<label class="op-campo"><span>Nos permitimos responder</span><textarea rows="5" maxlength="3000"></textarea></label></div>');
    var ta = cuerpo.querySelector('textarea');
    if (previo) { ta.value = previo; ta.rows = 12; }   /* 03/11 · viene de una respuesta rápida */
    var m = O().modal({
      titulo: 'Responder ' + x.codigo, cuerpo: cuerpo, ancha: !!previo,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Responder', icono: 'enviar', marca: true, al: enviar }]
    });
    setTimeout(function () { ta.focus(); }, 200);
    function enviar() {
      if (m.botones[1].disabled) return;   /* escudo desde el primer toque */
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
    _armar: armar, _llaves: llavesRespuesta,
    /* 03/11 · Configuración guarda los textos: se parchan aquí sin volver a pedir la lista */
    ponerRespuestas: function (r) { if (r && typeof r === 'object') RESP = r; },
    _datos: function () { return DATA; }, _filtradas: function () { return (DATA || []).filter(function (x) { return pasa(x); }); }
  };
}());
