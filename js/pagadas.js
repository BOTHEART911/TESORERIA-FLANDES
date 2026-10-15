/* ============================================================
   TESORERIA-FLANDES · CUENTAS PAGADAS
   Ecosistema Flandes · Fase 8

   Todas las cuentas en PAGADA, en UNA llamada ('pagadas', compacta: los
   nombres de secretaría y de quién pagó van como índice). Filtrar,
   buscar y contar pasa en el teléfono.

   Por defecto se abren las que tienen egreso de esta app y todavía NO
   tienen el comprobante de pago: es lo que queda por hacer.
     · SUBIR COMPROBANTE: PDF o imagen, con el botón, arrastrándolo o
       pegándolo (Ctrl+V). Una llamada; queda en la carpeta de la cuenta.
     · ABRIR EGRESO: en el visor, con descarga. Cuando lo abre el
       INVITADO queda el "cierre de cuenta" en REGISTRO DE DESCARGAS (el
       CORE lo apunta una sola vez por persona y cuenta).
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var FILTRO_K = 'pagadas.filtro.v1';
  var DATA = null, META = null, HORA = null, CARGANDO = null;
  var F = leerFiltro();

  function O() { return window.OFICINA; }
  function leerFiltro() {
    var g = K.guardar.leer(FILTRO_K, null) || {};
    var r = rango(g.atajo || 'todo');
    return { que: g.que === undefined ? 'sin' : g.que, atajo: g.atajo || 'todo', desde: g.atajo === 'otro' ? g.desde : r.desde, hasta: g.atajo === 'otro' ? g.hasta : r.hasta,
             sec: g.sec || '', busca: '' };
  }
  function guardarFiltro() { K.guardar.escribir(FILTRO_K, { que: F.que, atajo: F.atajo, desde: F.desde, hasta: F.hasta, sec: F.sec }); }
  function rango(atajo) {
    var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    var d = new Date(hoy), h = new Date(hoy);
    if (atajo === 'mes') d.setDate(1);
    else if (atajo === 'mesPasado') { d = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1, 12); h = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 12); }
    else if (atajo === 'anio') d = new Date(hoy.getFullYear(), 0, 1, 12);
    else return { desde: '', hasta: '' };
    return { desde: window.OFICINA.isoDe(d), hasta: window.OFICINA.isoDe(h) };
  }

  function recibir(d) {
    var campos = (d && d.campos) || [];
    META = { secretarias: (d && d.secretarias) || [], gente: (d && d.gente) || [], total: (d && d.total) || 0 };
    DATA = ((d && d.filas) || []).map(function (a) {
      var o = {};
      campos.forEach(function (c, i) { o[c] = a[i]; });
      o.secTxt = o.sec >= 0 ? META.secretarias[o.sec] || '' : '';
      o.pagoPorTxt = o.pagoPor >= 0 ? META.gente[o.pagoPor] || '' : '';
      o.fecha = o.fechaPago || o.fechaEgreso || '';
      o._t = K.norm([o.nombre, o.doc, o.contrato, o.egreso, o.orden, o.secTxt, o.id].join(' '));
      return o;
    });
    HORA = new Date();
    if (C.alPagadas) C.alPagadas(contar());
  }

  function cargar(fresco) {
    if (DATA && !fresco) return Promise.resolve(DATA);
    if (CARGANDO && !fresco) return CARGANDO;
    CARGANDO = O().leer('pagadas', {}).then(function (d) { CARGANDO = null; recibir(d); return DATA; },
      function (e) { CARGANDO = null; throw e; });
    return CARGANDO;
  }

  function contar() {
    var n = { total: 0, sin: 0, con: 0, viejas: 0 };
    (DATA || []).forEach(function (x) { n.total++; if (x.comprobante) n.con++; else if (x.pdf) n.sin++; else n.viejas++; });
    return n;
  }

  function pasa(x, sin) {
    sin = sin || {};
    if (!sin.que) {
      if (F.que === 'sin' && (!x.pdf || x.comprobante)) return false;
      if (F.que === 'con' && !x.comprobante) return false;
      if (F.que === 'viejas' && (x.pdf || x.comprobante)) return false;
    }
    if (F.desde && (!x.fecha || x.fecha < F.desde)) return false;
    if (F.hasta && (!x.fecha || x.fecha > F.hasta)) return false;
    if (!sin.sec && F.sec && x.secTxt !== F.sec) return false;
    var q = K.norm(F.busca || '');
    if (q) {
      var p = q.split(' ').filter(Boolean);
      for (var i = 0; i < p.length; i++) if (x._t.indexOf(p[i]) < 0) return false;
    }
    return true;
  }
  function filtradas() { return (DATA || []).filter(function (x) { return pasa(x); }); }

  function textoRango() {
    if (!F.desde && !F.hasta) return 'Todas las fechas';
    return 'Del ' + (F.desde ? O().fecha(F.desde) : 'inicio') + ' al ' + (F.hasta ? O().fecha(F.hasta) : 'hoy');
  }

  /* ══════════════ la vista ══════════════ */

  function vista() {
    var caja = K.nodo('<div class="kit-ancho vista ct of rp tg"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'check', 'CUENTAS PAGADAS',
      'Las cuentas ya pagadas. Empiezas viendo las que tienen egreso de esta app y <b>todavía no tienen comprobante</b>: súbelo con el botón, arrastrándolo o pegándolo.');
    var zR = K.nodo('<section class="kit-tarjeta rp-rango"></section>');
    var zQue = K.nodo('<div></div>'), zAt = K.nodo('<div></div>');
    zR.appendChild(zQue); zR.appendChild(zAt);
    var fechas = K.nodo('<div class="rp-fechas">' +
      '<label><span>Desde</span><input type="date" data-kit-fecha data-desde="2025" data-titulo="Desde"></label>' +
      '<label><span>Hasta</span><input type="date" data-kit-fecha data-desde="2025" data-titulo="Hasta"></label></div>');
    zR.appendChild(fechas);
    caja.appendChild(zR);
    var iD = fechas.querySelectorAll('input')[0], iH = fechas.querySelectorAll('input')[1];
    var b = O().barra({
      placeholder: 'Contratista, documento, contrato o N° de egreso', valor: F.busca,
      alBuscar: function (q) { F.busca = q; VER = 40; pintar(); },
      alRefrescar: function () { return cargar(true).then(pintar); }
    });
    caja.appendChild(b.caja);
    var zS = K.nodo('<div></div>');
    caja.appendChild(zS);
    var conteo = K.nodo('<p class="ct-conteo" aria-live="polite"></p>');
    caja.appendChild(conteo);
    var lista = K.nodo('<div class="kit-rejilla ct-lista"></div>');
    caja.appendChild(lista);
    var mas = K.nodo('<button type="button" class="kit-btn kit-btn--plano ct-mas" hidden>Ver más</button>');
    caja.appendChild(mas);
    var VER = 40;
    mas.addEventListener('click', function () { VER += 60; pintarLista(); });

    var pQue = K.piezas.pastillas.montar(zQue, {
      etiqueta: 'Comprobante', valor: F.que,
      opciones: [{ valor: 'sin', texto: 'Sin comprobante', tono: 'aviso' }, { valor: 'con', texto: 'Con comprobante', tono: 'ok' },
                 { valor: 'viejas', texto: 'De la app anterior' }, { valor: '', texto: 'Todas' }],
      alCambiar: function (v) { F.que = v; guardarFiltro(); VER = 40; pintar(); }
    });
    var pAt = K.piezas.pastillas.montar(zAt, {
      etiqueta: 'Fecha de pago', valor: F.atajo,
      opciones: [{ valor: 'mes', texto: 'Este mes' }, { valor: 'mesPasado', texto: 'Mes pasado' }, { valor: 'anio', texto: 'Este año' },
                 { valor: 'todo', texto: 'Todas' }, { valor: 'otro', texto: 'Otro rango' }],
      alCambiar: function (v) {
        F.atajo = v;
        if (v !== 'otro') { var r = rango(v); F.desde = r.desde; F.hasta = r.hasta; ponerFechas(); }
        guardarFiltro(); VER = 40; pintar();
      }
    });
    function ponerFechas() { iD.value = F.desde || ''; iH.value = F.hasta || ''; }
    if (K.piezas.fechas) K.piezas.fechas.montar(fechas);
    ponerFechas();
    [iD, iH].forEach(function (inp) {
      inp.addEventListener('change', function () {
        F.desde = iD.value || ''; F.hasta = iH.value || '';
        if (F.desde && F.hasta && F.desde > F.hasta) { var x = F.desde; F.desde = F.hasta; F.hasta = x; ponerFechas(); }
        F.atajo = 'otro'; pAt.poner('otro'); guardarFiltro(); VER = 40; pintar();
      });
    });
    var pS = K.piezas.pastillas.montar(zS, { etiqueta: 'Secretaría', valor: F.sec, opciones: [{ valor: '', texto: 'Todas las secretarías' }],
      alCambiar: function (v) { F.sec = v; guardarFiltro(); VER = 40; pintar(); } });

    function repintarPastillas() {
      var bq = DATA.filter(function (x) { return pasa(x, { que: true }); });
      pQue.conteos({ sin: bq.filter(function (x) { return x.pdf && !x.comprobante; }).length, con: bq.filter(function (x) { return x.comprobante; }).length,
        viejas: bq.filter(function (x) { return !x.pdf && !x.comprobante; }).length, '': bq.length });
      O().marcar(zQue, F.que);
      var bS = DATA.filter(function (x) { return pasa(x, { sec: true }); });
      var m = {};
      bS.forEach(function (x) { if (x.secTxt) m[x.secTxt] = (m[x.secTxt] || 0) + 1; });
      var ss = Object.keys(m).sort(function (a, c) { return a.localeCompare(c, 'es'); });
      var cS = { '': bS.length };
      ss.forEach(function (k) { cS[k] = m[k]; });
      pS.opciones([{ valor: '', texto: 'Todas las secretarías' }].concat(ss.map(function (k) { return { valor: k, texto: O().titulo(k) }; })));
      pS.conteos(cS); O().marcar(zS, F.sec);
      zS.hidden = ss.length <= 1 && !F.sec;
    }

    function pintarLista() {
      var filas = filtradas();
      lista.innerHTML = '';
      mas.hidden = true;
      if (!DATA.length) { lista.appendChild(O().vacio('Todavía no hay cuentas pagadas.')); return; }
      if (!filas.length) {
        lista.appendChild(O().vacio(F.que === 'sin' && !F.busca && !F.sec && F.atajo === 'todo'
          ? '¡Al día! Todas las cuentas pagadas con egreso de esta app tienen su comprobante.'
          : 'No hay cuentas con estos filtros.', function () {
          F.que = ''; F.sec = ''; F.busca = ''; b.inp.value = ''; F.atajo = 'todo'; F.desde = ''; F.hasta = ''; pQue.poner(''); pAt.poner('todo'); ponerFechas(); guardarFiltro(); pintar();
        }));
        return;
      }
      filas.slice(0, VER).forEach(function (x) { lista.appendChild(tarjeta(x, pintar)); });
      if (filas.length > VER) { mas.hidden = false; mas.textContent = 'Ver ' + Math.min(60, filas.length - VER) + ' más de ' + K.numero(filas.length - VER); }
    }

    function pintar() {
      if (!DATA) return;
      repintarPastillas();
      var filas = filtradas();
      var suma = filas.reduce(function (s, x) { return s + (Number(x.valor) || 0); }, 0);
      conteo.innerHTML = '<b>' + K.numero(filas.length) + '</b> ' + (filas.length === 1 ? 'cuenta' : 'cuentas') + ' · ' + K.esc(K.pesos(suma)) +
        ' <span>· ' + K.esc(textoRango().toLowerCase()) + '</span>' +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O().horaCorta(HORA)) + '</span>' : '');
      pintarLista();
    }

    K.piezas.esqueletos.mientras(lista, cargar(false), { forma: 'tarjetas', cuantos: 4, espera: 'Cargando las cuentas pagadas' })
      .then(pintar)['catch'](function (e) { caja.appendChild(C.errorCaja(e)); });
    K.piezas.creditos.montar(caja);
  }

  function tarjeta(x, repintar) {
    var t = K.nodo('<article class="kit-tarjeta ct-t op-t tg-pg' + (x.pdf && !x.comprobante ? ' tg-pg--falta' : '') + '"></article>');
    var cab = K.nodo('<div class="ct-t__cab"></div>');
    if (K.piezas.personas) cab.appendChild(K.piezas.personas.avatar(x.nombre, { tam: 44, foto: x.img || '' }));
    cab.appendChild(K.nodo('<div class="ct-t__quien"><h3 class="ct-t__n">' + K.esc(O().nombre(x.nombre)) + '</h3>' +
      '<p class="ct-t__doc">CC/NIT ' + K.esc(x.doc) + ' · contrato ' + K.esc(x.contrato || '—') + '</p></div>'));
    cab.appendChild(K.nodo('<span class="rv-t__cuenta"><b>' + K.esc(x.informe) + '</b><small>de ' + K.esc(x.total || '—') + '</small></span>'));
    t.appendChild(cab);
    t.appendChild(K.nodo('<dl class="ct-t__datos">' +
      '<div><dt>Egreso</dt><dd>' + K.esc(x.egreso || '—') + (x.fechaEgreso ? ' <small>' + K.esc(O().fecha(x.fechaEgreso)) + '</small>' : '') + '</dd></div>' +
      '<div><dt>Pagada</dt><dd>' + K.esc(x.fechaPago ? O().fecha(x.fechaPago) : '—') + '</dd></div>' +
      '<div><dt>Valor pagado</dt><dd><b>' + K.esc(x.valor ? K.pesos(x.valor) : '—') + '</b></dd></div>' +
      '<div><dt>Pagó</dt><dd>' + K.esc(O().nombre(x.pagoPorTxt) || '—') + '</dd></div>' +
      '</dl>'));
    var marcas = [];
    marcas.push(x.comprobante ? '<span class="ct-marca op-marca--ok">' + K.icono('check', 11) + ' COMPROBANTE</span>'
      : (x.pdf ? '<span class="ct-marca op-marca--prio">' + K.icono('aviso', 11) + ' FALTA COMPROBANTE</span>' : '<span class="ct-marca">APP ANTERIOR</span>'));
    if (x.cerrada) marcas.push('<span class="ct-marca op-marca--ok">' + K.icono('candado', 11) + ' CIERRE DE CUENTA</span>');
    if (x.secTxt) marcas.push('<span class="ct-marca">' + K.esc(O().titulo(x.secTxt)) + '</span>');
    t.appendChild(K.nodo('<div class="ct-t__marcas">' + marcas.join('') + '</div>'));
    var a = K.nodo('<div class="ct-acc"></div>');
    var llave = { fila: x.fila, id: x.id, informe: x.informe };
    if (x.pdf) {
      var ve = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('documento', 16) + ' Abrir egreso</button>');
      ve.addEventListener('click', function () { abrir(x, 'egreso', repintar); });
      a.appendChild(ve);
    }
    if (x.comprobante) {
      var vc = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('ojo', 16) + (x.comprobante === 2 ? ' Comprobante (2)' : ' Comprobante') + '</button>');
      vc.addEventListener('click', function () { abrir(x, 'comprobante'); });
      a.appendChild(vc);
    }
    if (C.puede('subirComprobante')) {
      var sc = K.nodo('<button type="button" class="kit-btn ' + (x.comprobante ? 'kit-btn--plano' : 'kit-btn--marca') + '">' + K.icono('clip', 16) + (x.comprobante ? ' Cambiar comprobante' : ' Subir comprobante') + '</button>');
      sc.addEventListener('click', function () { subir(x, llave, repintar); });
      a.appendChild(sc);
    }
    t.appendChild(a);
    return t;
  }

  function abrir(x, que, repintar) {
    var titulos = { egreso: 'Egreso ' + (x.egreso || ''), comprobante: 'Comprobante de pago · cuenta ' + x.informe, orden: 'Orden de pago ' + (x.orden || '') };
    var nombres = { egreso: 'EG_' + x.informe + '_' + x.contrato + '.pdf', comprobante: 'COMPROBANTE_' + x.informe + '_' + x.contrato, orden: 'OP_' + x.informe + '.pdf' };
    /* 15/10 · el comprobante puede traer dos imágenes: las dos van al visor */
    var docs = [{ titulo: titulos[que], n: 1 }];
    if (que === 'comprobante' && x.comprobante === 2) {
      docs = [{ titulo: titulos[que] + ' · imagen 1', n: 1 }, { titulo: titulos[que] + ' · imagen 2', n: 2 }];
    }
    K.piezas.visor.abrir(docs.map(function (d) {
      return { titulo: d.titulo, cargar: function () {
        var datos = { fila: x.fila, id: x.id, informe: x.informe, que: que };
        if (que === 'comprobante') datos.n = d.n;
        return O().docPorAccion('documento', datos, nombres[que] + (d.n === 2 ? '_2' : ''), function (r) {
          if (r && r.cierre && r.cierre.nuevo) { x.cerrada = 1; K.aviso('Cierre de cuenta registrado.', 'ok', 2500); if (repintar) repintar(); }
        });
      } };
    }));
  }

  /* 15/10 · DOS imágenes: la 1 obligatoria y la 2 opcional (Oss). Al
     cambiar, la que se deje vacía se conserva; la 2 se puede quitar. */
  function subir(x, llave, repintar) {
    var acepta = 'image/png,image/jpeg,image/webp,application/pdf';
    var cuerpo = K.nodo('<div class="tg-subir"><p class="formulario__nota">Cuenta <b>' + K.esc(x.informe) + '</b> de <b>' + K.esc(O().nombre(x.nombre)) +
      '</b> · egreso ' + K.esc(x.egreso || '—') + ' · ' + K.esc(K.pesos(x.valor)) + '</p>' +
      '<p class="tg-subir__rot"><b>Imagen 1</b> · ' + (x.comprobante ? 'déjala vacía para conservar la actual' : 'obligatoria') + '</p><div class="tg-subir__zona" data-n="1"></div>' +
      '<p class="tg-subir__rot"><b>Imagen 2</b> · opcional' + (x.comprobante === 2 ? ', déjala vacía para conservar la actual' : '') + '</p><div class="tg-subir__zona" data-n="2"></div>' +
      (x.comprobante === 2 ? '<label class="tg-subir__quitar"><input type="checkbox"> Quitar la imagen 2 actual</label>' : '') +
      '<p class="formulario__nota">JPG, PNG, WEBP o PDF, hasta 8 MB cada una. Toca la casilla y pega con Ctrl+V si la tienes copiada.</p></div>');
    var adj1 = K.piezas.adjuntos.montar(cuerpo.querySelector('[data-n="1"]'), { acepta: acepta, varios: false, maximoMB: 8, maximo: 1 });
    var adj2 = K.piezas.adjuntos.montar(cuerpo.querySelector('[data-n="2"]'), { acepta: acepta, varios: false, maximoMB: 8, maximo: 1 });
    var quitar = cuerpo.querySelector('.tg-subir__quitar input');
    var m = O().modal({
      titulo: x.comprobante ? 'Cambiar el comprobante' : 'Subir el comprobante de pago', cuerpo: cuerpo,
      botones: [{ texto: 'Cancelar', al: function () { m.cerrar(); } }, { texto: 'Guardar comprobante', icono: 'check', marca: true, al: guardar }],
      alCerrar: function () { try { adj1.desmontar(); adj2.desmontar(); } catch (e) {} }
    });
    var enviando = false;
    function guardar() {
      if (enviando) return;
      var f1 = adj1.archivos(), f2 = adj2.archivos(), q2 = !!(quitar && quitar.checked);
      if (!f1.length && !x.comprobante) { K.aviso('La imagen 1 del comprobante es obligatoria.', 'aviso', 3500); return; }
      if (!f1.length && !f2.length && !q2) { K.aviso('Adjunta al menos una imagen para cambiar el comprobante.', 'aviso', 3500); return; }
      enviando = true;
      m.botones[1].disabled = true;
      Promise.all([f1.length ? adj1.aBase64() : Promise.resolve([]), f2.length ? adj2.aBase64() : Promise.resolve([])]).then(function (ls) {
        var datos = { fila: llave.fila, id: llave.id, informe: llave.informe };
        if (ls[0][0]) datos.archivo = 'data:' + ls[0][0].tipo + ';base64,' + ls[0][0].datos;
        if (ls[1][0]) datos.archivo2 = 'data:' + ls[1][0].tipo + ';base64,' + ls[1][0].datos;
        if (q2 && !ls[1][0]) datos.quitar2 = true;
        return K.piezas.guardado.mientras(K.pedir('comprobante', datos, { ms: 120000 }), {
          titulo: 'Subiendo el comprobante', sub: 'Queda en la carpeta de la cuenta.',
          pasos: ['Subiendo las imágenes…', 'Guardándolas en la carpeta de la cuenta…', 'Casi listo…'],
          listo: { titulo: 'Comprobante guardado', paso: 'En la carpeta de la cuenta' }
        });
      }).then(function (r) {
        /* CORE anterior al 15/10: no conoce la imagen 2 (no devuelve 'imagenes') */
        if (r && r.imagenes === undefined && f2.length) K.aviso('Se guardó la imagen 1. La imagen 2 se podrá subir cuando se publique la versión nueva del servidor.', 'aviso', 8000);
        x.comprobante = r && r.imagenes ? r.imagenes : (x.comprobante || 1);
        O().olvidarDocs();
        if (C.alPagadas) C.alPagadas(contar());
        m.cerrar();
        repintar();
      }, function (e) { enviando = false; m.botones[1].disabled = false; K.aviso((e && e.message) || 'No se pudo subir el comprobante.', 'malo', 7000); });
    }
  }

  window.PAGADAS = {
    configurar: function (c) { C = c || {}; },
    vista: vista, cargar: cargar, contar: contar,
    soltar: function () { DATA = null; CARGANDO = null; },
    olvidar: function () { DATA = null; META = null; CARGANDO = null; K.guardar.borrar(FILTRO_K); F = leerFiltro(); },
    filtrar: function (f) { F.que = f && f.que !== undefined ? f.que : 'sin'; F.atajo = 'todo'; F.desde = ''; F.hasta = ''; F.sec = ''; F.busca = ''; guardarFiltro(); },
    _datos: function () { return DATA; }, _filtradas: filtradas, _filtro: function () { return F; }, _textoRango: textoRango
  };
}());
