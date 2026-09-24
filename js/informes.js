/* ============================================================
   TESORERIA-FLANDES · MIS INFORMES
   Ecosistema Flandes · Fase 8

   UNA llamada ('informes') y cuatro listas: EGRESOS (hoja EGRESOS),
   PAGOS (hoja PAGOS), SOLICITUDES respondidas y CIERRES DE CUENTA (el
   INVITADO que abrió el egreso). Qué ve cada quien lo decide el CORE:
   EGRESO, PAGO e INVITADO lo suyo; ADMIN (y DEV) todo, y escoge persona.
   Periodo, persona y búsqueda pasan en el teléfono. Se descarga en PDF
   por bloques (para leer) o en Excel (una fila por registro).
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var FILTRO_K = 'informes.filtro.v1';
  var DATA = null, META = null, HORA = null, CARGANDO = null;
  var F = null;

  function O() { return window.OFICINA; }

  /* ══════════════ las cuatro listas ══════════════ */

  var TIPOS = {
    egresos: {
      titulo: 'Egresos', uno: 'egreso', varios: 'egresos', quien: 'elaboro', quienTxt: 'Elaboró',
      texto: function (x) { return [x.contratista, x.contrato, x.egreso, x.orden, x.elaboro, x.estado].join(' '); },
      linea: function (x) { return 'Egreso ' + x.egreso + ' · orden ' + (x.orden || '—') + ' · contrato ' + (x.contrato || '—') + ' · cuenta ' + (x.cuenta || '?'); },
      marca: function (x) { return x.estado || 'SIN ESTADO'; },
      tono: function (x) { return x.pagada ? 'ok' : (x.estado === 'EGRESO' ? 'info' : 'aviso'); },
      extra: function (x) { return x.pagada ? (x.comprobante ? 'Con comprobante' : (x.pdf ? 'Falta comprobante' : '')) : ''; },
      cifras: function (f) {
        return [['Egresos', K.numero(f.length)], ['Pagados', K.numero(f.filter(function (x) { return x.pagada; }).length)],
                ['Por pagar', K.numero(f.filter(function (x) { return !x.pagada; }).length)],
                ['Sin comprobante', K.numero(f.filter(function (x) { return x.pagada && x.pdf && !x.comprobante; }).length)]];
      },
      pdf: [{ campo: function (x) { return O().fecha(x.fecha); }, titulo: 'Fecha' }, { campo: 'egreso', titulo: 'N° egreso' }, { campo: 'orden', titulo: 'N° orden' },
            { campo: 'contratista', titulo: 'Contratista' }, { campo: 'contrato', titulo: 'Contrato' }, { campo: 'cuenta', titulo: 'Cuenta' },
            { campo: 'estado', titulo: 'Estado' }, { campo: function (x) { return x.pagada ? (x.comprobante ? 'Sí' : 'No') : ''; }, titulo: 'Comprobante' },
            { campo: function (x) { return O().nombre(x.elaboro); }, titulo: 'Elaboró' }],
      xls: [{ campo: 'fecha', titulo: 'Fecha egreso', tipo: 'fecha' }, { campo: 'egreso', titulo: 'N° egreso' }, { campo: 'orden', titulo: 'N° orden de pago' },
            { campo: 'contratista', titulo: 'Contratista' }, { campo: 'contrato', titulo: 'Contrato' }, { campo: 'cuenta', titulo: 'Cuenta', tipo: 'numero' },
            { campo: 'estado', titulo: 'Estado de la cuenta' }, { campo: function (x) { return x.pagada ? 'SI' : 'NO'; }, titulo: 'Pagada' },
            { campo: function (x) { return x.comprobante ? 'SI' : 'NO'; }, titulo: 'Comprobante' }, { campo: function (x) { return x.pdf ? 'SI' : 'NO'; }, titulo: 'PDF del egreso' },
            { campo: 'elaboro', titulo: 'Elaboró' }]
    },
    pagos: {
      titulo: 'Pagos', uno: 'pago', varios: 'pagos', quien: 'responsable', quienTxt: 'Pagó',
      texto: function (x) { return [x.contratista, x.contrato, x.pago, x.egreso, x.fuente, x.responsable].join(' '); },
      linea: function (x) { return K.pesos(x.valor) + ' · ' + (x.fuente || '—') + ' · egreso ' + (x.egreso || '—') + ' · contrato ' + (x.contrato || '—') + ' · cuenta ' + (x.cuenta || '?'); },
      marca: function (x) { return x.pago; }, tono: function () { return 'ok'; }, extra: function () { return ''; },
      cifras: function (f) {
        var s = f.reduce(function (a, x) { return a + (Number(x.valor) || 0); }, 0);
        var fu = {}; f.forEach(function (x) { fu[x.fuente] = 1; });
        return [['Pagos', K.numero(f.length)], ['Girado', K.pesos(s)], ['Fuentes', K.numero(Object.keys(fu).length)]];
      },
      pdf: [{ campo: function (x) { return O().fecha(x.fecha); }, titulo: 'Fecha' }, { campo: 'pago', titulo: 'ID pago' }, { campo: 'contratista', titulo: 'Contratista' },
            { campo: 'contrato', titulo: 'Contrato' }, { campo: 'cuenta', titulo: 'Cuenta' }, { campo: 'valor', titulo: 'Valor', tipo: 'pesos' },
            { campo: 'fuente', titulo: 'Fuente' }, { campo: 'egreso', titulo: 'N° egreso' }, { campo: function (x) { return O().nombre(x.responsable); }, titulo: 'Pagó' }],
      xls: [{ campo: 'fecha', titulo: 'Fecha', tipo: 'fecha' }, { campo: 'pago', titulo: 'ID pago' }, { campo: 'contratista', titulo: 'Contratista' },
            { campo: 'contrato', titulo: 'Contrato' }, { campo: 'cuenta', titulo: 'Cuenta', tipo: 'numero' }, { campo: 'valor', titulo: 'Valor pagado', tipo: 'pesos' },
            { campo: 'fuente', titulo: 'Fuente' }, { campo: 'egreso', titulo: 'N° egreso' }, { campo: 'responsable', titulo: 'Responsable' }]
    },
    solicitudes: {
      titulo: 'Solicitudes', uno: 'solicitud', varios: 'solicitudes', quien: 'respondio', quienTxt: 'Respondió',
      texto: function (x) { return [x.contratista, x.contrato, x.codigo, x.tipo, x.respondio, x.estado].join(' '); },
      linea: function (x) { return x.codigo + ' · contrato ' + (x.contrato || '—') + (x.tipo ? ' · ' + x.tipo : '') + (x.respuesta ? ' · respondida el ' + O().fecha(x.respuesta) : ''); },
      marca: function (x) { return x.estado; }, tono: function (x) { return x.estado === 'PENDIENTE' ? 'aviso' : 'ok'; }, extra: function () { return ''; },
      cifras: function (f) {
        return [['Solicitudes', K.numero(f.length)], ['Respondidas', K.numero(f.filter(function (x) { return x.estado !== 'PENDIENTE'; }).length)],
                ['Pendientes', K.numero(f.filter(function (x) { return x.estado === 'PENDIENTE'; }).length)]];
      },
      pdf: [{ campo: function (x) { return O().fecha(x.fecha); }, titulo: 'Fecha' }, { campo: 'codigo', titulo: 'Código' }, { campo: 'contratista', titulo: 'Contratista' },
            { campo: 'contrato', titulo: 'Contrato' }, { campo: 'tipo', titulo: 'Tipo' }, { campo: 'estado', titulo: 'Estado' },
            { campo: function (x) { return O().fecha(x.respuesta); }, titulo: 'Respondida' }, { campo: function (x) { return O().nombre(x.respondio); }, titulo: 'Respondió' }],
      xls: [{ campo: 'fecha', titulo: 'Fecha', tipo: 'fecha' }, { campo: 'codigo', titulo: 'Código' }, { campo: 'contratista', titulo: 'Contratista' },
            { campo: 'contrato', titulo: 'Contrato' }, { campo: 'tipo', titulo: 'Tipo' }, { campo: 'estado', titulo: 'Estado' },
            { campo: 'respuesta', titulo: 'Fecha respuesta', tipo: 'fecha' }, { campo: 'respondio', titulo: 'Respondió' }]
    },
    cierres: {
      titulo: 'Cierres de cuenta', uno: 'cierre', varios: 'cierres', quien: 'invitado', quienTxt: 'Cerró',
      texto: function (x) { return [x.contratista, x.contrato, x.egreso, x.invitado].join(' '); },
      linea: function (x) { return 'Egreso ' + (x.egreso || '—') + ' · contrato ' + (x.contrato || '—') + ' · cuenta ' + (x.cuenta || '?'); },
      marca: function () { return 'CERRADA'; }, tono: function () { return 'ok'; }, extra: function () { return ''; },
      cifras: function (f) {
        var g = {}; f.forEach(function (x) { g[x.contratista + '|' + x.contrato] = 1; });
        return [['Cierres', K.numero(f.length)], ['Contratos', K.numero(Object.keys(g).length)]];
      },
      pdf: [{ campo: function (x) { return O().fecha(x.fecha); }, titulo: 'Fecha' }, { campo: 'contratista', titulo: 'Contratista' }, { campo: 'contrato', titulo: 'Contrato' },
            { campo: 'cuenta', titulo: 'Cuenta' }, { campo: 'egreso', titulo: 'N° egreso' }, { campo: function (x) { return O().nombre(x.invitado); }, titulo: 'Cerró' }],
      xls: [{ campo: 'fecha', titulo: 'Fecha', tipo: 'fecha' }, { campo: 'contratista', titulo: 'Contratista' }, { campo: 'contrato', titulo: 'Contrato' },
            { campo: 'cuenta', titulo: 'Cuenta', tipo: 'numero' }, { campo: 'egreso', titulo: 'N° egreso' }, { campo: 'invitado', titulo: 'Cerró' }, { campo: 'documento', titulo: 'Documento' }]
    }
  };

  function porDefecto() {
    var r = K.norm((C.yo && C.yo().rol) || '');
    return r === 'PAGO' ? 'pagos' : (r === 'INVITADO' ? 'cierres' : 'egresos');
  }

  function leerFiltro() {
    var g = K.guardar.leer(FILTRO_K, null) || {};
    var r = rango(g.atajo || 'mes');
    return { tipo: g.tipo || porDefecto(), atajo: g.atajo || 'mes', desde: g.atajo === 'otro' ? g.desde : r.desde, hasta: g.atajo === 'otro' ? g.hasta : r.hasta, quien: '', busca: '' };
  }
  function guardarFiltro() { K.guardar.escribir(FILTRO_K, { tipo: F.tipo, atajo: F.atajo, desde: F.desde, hasta: F.hasta }); }
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
    META = { todas: !!(d && d.todas), rol: (d && d.rol) || '', yo: (d && d.yo) || '', usuarios: (d && d.usuarios) || [] };
    DATA = {};
    Object.keys(TIPOS).forEach(function (k) {
      var campos = (d && d.campos && d.campos[k]) || [];
      DATA[k] = ((d && d[k]) || []).map(function (a) {
        var o = {};
        campos.forEach(function (c, i) { o[c] = a[i]; });
        o._q = K.norm(o[TIPOS[k].quien] || '');
        o._t = K.norm(TIPOS[k].texto(o));
        return o;
      }).sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    });
    HORA = new Date();
  }

  function cargar(fresco) {
    if (DATA && !fresco) return Promise.resolve(DATA);
    if (CARGANDO && !fresco) return CARGANDO;
    CARGANDO = O().leer('informes', {}).then(function (d) { CARGANDO = null; recibir(d); return DATA; },
      function (e) { CARGANDO = null; throw e; });
    return CARGANDO;
  }

  function pasa(x, sin) {
    sin = sin || {};
    if (F.desde && (!x.fecha || x.fecha < F.desde)) return false;
    if (F.hasta && (!x.fecha || x.fecha > F.hasta)) return false;
    if (!sin.quien && F.quien && x._q !== F.quien) return false;
    var q = K.norm(F.busca || '');
    if (q) { var p = q.split(' ').filter(Boolean); for (var i = 0; i < p.length; i++) if (x._t.indexOf(p[i]) < 0) return false; }
    return true;
  }
  function filas() { return ((DATA && DATA[F.tipo]) || []).filter(function (x) { return pasa(x); }); }
  function textoRango() {
    if (!F.desde && !F.hasta) return 'Todas las fechas';
    return 'Del ' + (F.desde ? O().fecha(F.desde) : 'inicio') + ' al ' + (F.hasta ? O().fecha(F.hasta) : 'hoy');
  }

  /* ══════════════ la vista ══════════════ */

  function vista() {
    if (!F) F = leerFiltro();
    var caja = K.nodo('<div class="kit-ancho vista ct of rp rg tg"></div>');
    C.app.appendChild(caja);
    O().cabecera(caja, 'pdf', 'MIS INFORMES', 'Lo que has hecho en Tesorería: egresos, pagos, solicitudes y cierres. Escoge el periodo y descárgalo en PDF o Excel.');
    var zR = K.nodo('<section class="kit-tarjeta rp-rango"></section>');
    var zT = K.nodo('<div></div>'), zAt = K.nodo('<div></div>');
    zR.appendChild(zT); zR.appendChild(zAt);
    var fechas = K.nodo('<div class="rp-fechas">' +
      '<label><span>Desde</span><input type="date" data-kit-fecha data-desde="2025" data-titulo="Desde"></label>' +
      '<label><span>Hasta</span><input type="date" data-kit-fecha data-desde="2025" data-titulo="Hasta"></label></div>');
    zR.appendChild(fechas);
    caja.appendChild(zR);
    var iD = fechas.querySelectorAll('input')[0], iH = fechas.querySelectorAll('input')[1];
    var b = O().barra({ placeholder: 'Contratista, contrato, N° de egreso o persona', valor: F.busca,
      alBuscar: function (q) { F.busca = q; VER = 50; pintar(); }, alRefrescar: function () { return cargar(true).then(pintar); } });
    caja.appendChild(b.caja);
    var zQ = K.nodo('<div hidden></div>');
    caja.appendChild(zQ);
    var resumen = K.nodo('<section class="kit-tarjeta rp-resumen"></section>');
    caja.appendChild(resumen);
    var descargas = K.nodo('<div class="rp-bajar">' +
      '<button type="button" class="kit-btn kit-btn--marca" data-f="pdf">' + K.icono('pdf', 16) + ' Descargar PDF</button>' +
      '<button type="button" class="kit-btn kit-btn--plano" data-f="xlsx">' + K.icono('hoja', 16) + ' Descargar Excel</button></div>');
    caja.appendChild(descargas);
    var conteo = K.nodo('<p class="ct-conteo" aria-live="polite"></p>');
    caja.appendChild(conteo);
    var lista = K.nodo('<div class="rp-lista"></div>');
    caja.appendChild(lista);
    var mas = K.nodo('<button type="button" class="kit-btn kit-btn--plano ct-mas" hidden>Ver más</button>');
    caja.appendChild(mas);
    var VER = 50, pT, pQ;
    mas.addEventListener('click', function () { VER += 100; pintarLista(); });

    var pAt = K.piezas.pastillas.montar(zAt, { etiqueta: 'Periodo', valor: F.atajo,
      opciones: [{ valor: 'mes', texto: 'Este mes' }, { valor: 'mesPasado', texto: 'Mes pasado' }, { valor: 'anio', texto: 'Este año' }, { valor: 'todo', texto: 'Todo' }, { valor: 'otro', texto: 'Otro rango' }],
      alCambiar: function (v) { F.atajo = v; if (v !== 'otro') { var r = rango(v); F.desde = r.desde; F.hasta = r.hasta; ponerFechas(); } guardarFiltro(); VER = 50; pintar(); } });
    function ponerFechas() { iD.value = F.desde || ''; iH.value = F.hasta || ''; }
    if (K.piezas.fechas) K.piezas.fechas.montar(fechas);
    ponerFechas();
    [iD, iH].forEach(function (inp) {
      inp.addEventListener('change', function () {
        F.desde = iD.value || ''; F.hasta = iH.value || '';
        if (F.desde && F.hasta && F.desde > F.hasta) { var x = F.desde; F.desde = F.hasta; F.hasta = x; ponerFechas(); }
        F.atajo = 'otro'; pAt.poner('otro'); guardarFiltro(); VER = 50; pintar();
      });
    });

    function repintarPastillas() {
      var cs = {};
      Object.keys(TIPOS).forEach(function (k) { cs[k] = DATA[k].filter(function (x) { return pasa(x, { quien: true }); }).length; });
      pT.conteos(cs); O().marcar(zT, F.tipo);
      if (!META.todas) { zQ.hidden = true; F.quien = ''; return; }
      zQ.hidden = false;
      var T = TIPOS[F.tipo];
      var bq = DATA[F.tipo].filter(function (x) { return pasa(x, { quien: true }); });
      var n = {}, nom = {};
      bq.forEach(function (x) { if (x._q) { n[x._q] = (n[x._q] || 0) + 1; nom[x._q] = x[T.quien]; } });
      var ks = Object.keys(nom).sort(function (a, c) { return a.localeCompare(c, 'es'); });
      var cQ = { '': bq.length };
      ks.forEach(function (k) { cQ[k] = n[k]; });
      if (F.quien && !nom[F.quien]) F.quien = '';
      pQ.opciones([{ valor: '', texto: 'Todas las personas' }].concat(ks.map(function (k) { return { valor: k, texto: O().nombre(nom[k]) }; })));
      pQ.conteos(cQ); O().marcar(zQ, F.quien);
      var cq = zQ.firstElementChild; if (cq) cq.setAttribute('aria-label', T.quienTxt);
    }

    function pintarResumen(f) {
      resumen.innerHTML = '';
      resumen.appendChild(K.nodo('<p class="rp-resumen__rango">' + K.icono('reloj', 14) + ' ' + K.esc(textoRango()) +
        (META.todas ? '' : ' · ' + K.esc(O().nombre(META.yo))) + '</p>'));
      resumen.appendChild(K.nodo('<div class="ct-cifras">' + TIPOS[F.tipo].cifras(f).map(function (c, i) {
        return '<div class="ct-cifra' + (i === 1 ? ' rp-cifra--ok' : '') + '"><b>' + K.esc(c[1]) + '</b><span>' + K.esc(c[0]) + '</span></div>';
      }).join('') + '</div>'));
    }

    function fila(x) {
      var T = TIPOS[F.tipo];
      var r = K.nodo('<article class="rp-fila"></article>');
      r.appendChild(K.nodo('<div class="rp-fila__f"><b>' + K.esc(O().fecha(x.fecha).slice(0, 5) || '—') + '</b><small>' + K.esc(String(x.fecha || '').slice(0, 4)) + '</small></div>'));
      var c = K.nodo('<div class="rp-fila__c"></div>');
      c.appendChild(K.nodo('<p class="rp-fila__n">' + K.esc(O().nombre(x.contratista)) + '</p>'));
      c.appendChild(K.nodo('<p class="rp-fila__d">' + K.esc(T.linea(x)) + '</p>'));
      var ex = T.extra(x);
      if (ex) c.appendChild(K.nodo('<p class="rp-fila__r">' + K.icono(ex === 'Falta comprobante' ? 'aviso' : 'check', 12) + ' ' + K.esc(ex) + '</p>'));
      if (META.todas && x[T.quien]) c.appendChild(K.nodo('<p class="rp-fila__m">' + K.esc(T.quienTxt) + ': ' + K.esc(O().nombre(x[T.quien])) + '</p>'));
      r.appendChild(c);
      var tono = T.tono(x);
      r.appendChild(K.nodo('<div class="rg-der"><span class="kit-pastilla ct-t__estado of-estado ' + (tono === 'ok' ? 'of-estado--ok' : 'of-estado--abierto') + '">' + K.esc(T.marca(x)) + '</span></div>'));
      return r;
    }

    function pintarLista() {
      var f = filas();
      lista.innerHTML = '';
      mas.hidden = true;
      if (!f.length) {
        lista.appendChild(O().vacio('No hay ' + TIPOS[F.tipo].varios + ' con estos filtros (' + textoRango().toLowerCase() + ').', function () {
          F.quien = ''; F.busca = ''; b.inp.value = ''; F.atajo = 'todo'; F.desde = ''; F.hasta = ''; pAt.poner('todo'); ponerFechas(); guardarFiltro(); pintar();
        }));
        return;
      }
      f.slice(0, VER).forEach(function (x) { lista.appendChild(fila(x)); });
      if (f.length > VER) { mas.hidden = false; mas.textContent = 'Ver ' + Math.min(100, f.length - VER) + ' más de ' + K.numero(f.length - VER); }
    }

    function pintar() {
      if (!DATA) return;
      repintarPastillas();
      var f = filas();
      pintarResumen(f);
      var T = TIPOS[F.tipo];
      conteo.innerHTML = '<b>' + K.numero(f.length) + '</b> ' + (f.length === 1 ? T.uno : T.varios) +
        (HORA ? '<span class="ct-sello">' + K.icono('reloj', 13) + ' Al día a las ' + K.esc(O().horaCorta(HORA)) + '</span>' : '');
      descargas.querySelectorAll('button').forEach(function (x) { x.disabled = !f.length; });
      pintarLista();
    }

    descargas.querySelectorAll('button').forEach(function (x) { x.addEventListener('click', function () { bajar(x.getAttribute('data-f'), x); }); });

    K.piezas.esqueletos.mientras(lista, cargar(false), { forma: 'tarjetas', cuantos: 4, espera: 'Trayendo tus informes' })
      .then(function () {
        pT = K.piezas.pastillas.montar(zT, { etiqueta: 'Qué', valor: F.tipo,
          opciones: Object.keys(TIPOS).map(function (k) { return { valor: k, texto: TIPOS[k].titulo }; }),
          alCambiar: function (v) { F.tipo = v || porDefecto(); F.quien = ''; guardarFiltro(); VER = 50; pintar(); } });
        pQ = K.piezas.pastillas.montar(zQ, { etiqueta: 'Persona', valor: '', opciones: [{ valor: '', texto: 'Todas las personas' }],
          alCambiar: function (v) { F.quien = v; VER = 50; pintar(); } });
        pintar();
      })['catch'](function (e) { caja.appendChild(C.errorCaja(e)); });
    K.piezas.creditos.montar(caja);
  }

  /* ══════════════ descargar ══════════════ */

  function informe(f) {
    var T = TIPOS[F.tipo];
    var t = [T.titulo, textoRango(), K.numero(f.length) + ' ' + (f.length === 1 ? T.uno : T.varios)];
    if (F.quien && f[0]) t.push(T.quienTxt.toLowerCase() + ' ' + O().nombre(f[0][T.quien]));
    else if (!META.todas && META.yo) t.push(O().nombre(META.yo));
    if (F.busca) t.push('búsqueda: ' + F.busca);
    var op = {
      subtitulo: t.join(' · '),
      bloque: {
        titulo: function (x) { return O().nombre(x.contratista); },
        sub: function (x) { return T.linea(x) + ' · ' + O().fecha(x.fecha); },
        marca: function (x) { return T.marca(x); },
        tono: function (x) { var n = T.tono(x); return n === 'info' ? '' : n; },
        omitir: ['Fecha', 'Contratista']
      },
      resumen: T.cifras(f).map(function (c) { return { etiqueta: c[0], valor: c[1] }; })
    };
    if (META.todas && !F.quien) op.grupo = function (x) { return T.quienTxt + ': ' + (O().nombre(x[T.quien]) || 'sin registro'); };
    return op;
  }

  function bajar(formato, boton) {
    if (!K.piezas.exportar) { K.aviso('La descarga no está disponible en esta versión.', 'aviso'); return; }
    var T = TIPOS[F.tipo];
    var f = filas().slice().sort(function (a, c) { return String(a[T.quien]).localeCompare(String(c[T.quien]), 'es') || String(a.fecha).localeCompare(String(c.fecha)); });
    if (!f.length) return;
    var nombre = (T.titulo + ' Tesoreria ' + (F.desde ? O().fecha(F.desde).replace(/\//g, '-') : '') + (F.hasta && F.hasta !== F.desde ? ' a ' + O().fecha(F.hasta).replace(/\//g, '-') : '')).trim();
    boton.disabled = true; boton.classList.add('kit-ocupado');
    var p = formato === 'pdf' ? K.piezas.exportar.aPDF(nombre, T.pdf, f, informe(f)) : K.piezas.exportar.aExcel(nombre, T.xls, f);
    Promise.resolve(p).then(function (r) {
      K.aviso(r === 'csv' ? 'No cargó Excel: se descargó en CSV (Excel lo abre).' : (r === 'impresion' ? 'Guárdalo como PDF desde la ventana de impresión.' : 'Descargado.'), 'ok', 3500);
    }, function (e) { K.aviso((e && e.message) || 'No se pudo descargar.', 'malo', 6000); })
      .then(function () { boton.disabled = false; boton.classList.remove('kit-ocupado'); });
  }

  window.INFORMES = {
    configurar: function (c) { C = c || {}; },
    vista: vista, cargar: cargar,
    soltar: function () { DATA = null; CARGANDO = null; },
    olvidar: function () { DATA = null; META = null; CARGANDO = null; K.guardar.borrar(FILTRO_K); F = null; },
    _datos: function () { return DATA; }, _meta: function () { return META; }, _filas: filas, _filtro: function () { return F; },
    _informe: informe, _textoRango: textoRango, TIPOS: TIPOS
  };
}());
