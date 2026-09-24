/* ============================================================
   TESORERIA-FLANDES · APP
   Ecosistema Flandes · Fase 8

   La misma cara de las otras apps: franja con cielo, tu foto, los
   accesos por bloques y abajo el resumen de lo que queda por hacer (se
   toca y abre la lista ya filtrada).

   Roles (hoja USUARIOS, app TESORERIA) y lo que ve cada uno lo decide
   PERMISOS en CONFIG:
     · EGRESO ... egresos pendientes (crear el egreso) y emitidos
     · PAGO ..... egresos emitidos (marcar la cuenta paga)
     · ADMIN .... todo, y las firmas del egreso y las retenciones
     · INVITADO . cuentas pagadas (abrir el egreso = cierre de cuenta),
                  solicitudes y sus informes
     · DEV ...... todo
   Vistas:
     · EGRESOS PENDIENTES / EMITIDOS (egresos.js) .. egresosPendientes / egresosEmitidos
     · CUENTAS PAGADAS (pagadas.js) ................ cuentasPagadas / subirComprobante
     · SOLICITUDES (solicitudes.js) ................ solicitudes
     · MIS INFORMES (informes.js) .................. misInformes
     · CONTRATISTAS y su INFORME ................... contratistas
     · REQUERIMIENTOS y COMUNICADOS ................ requerimientos / comunicados
     · CONFIGURACIÓN y MI FIRMA Y MI FOTO .......... configuracion
     · Soporte en el menú del perfil.

   UN SOLO LLAMADO por pantalla o acción:
     · Entrar: el login trae el arranque ('inicio') en el mismo viaje.
     · El inicio pide 'bandeja' UNA vez (burbujas y resumen); al abrir
       pendientes o emitidos ya está en el teléfono.
     · Cada vista: su lectura, una vez. Cada botón: una llamada.

   Reglas de siempre
     · Todo dato de la hoja pasa por K.esc antes de entrar al HTML.
     · La app no conoce ninguna URL: todo sale de marca.js.
     · Qué ve cada quien lo decide el CORE: esconder un botón es cortesía,
       no protección.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var M = window.MARCA || {};
  var app = K.id('app');

  var YO = null;          /* quién entró */
  var ARRANQUE = null;    /* lo que trajo 'inicio' */

  var MODULOS = ['EGRESOS', 'PAGADAS', 'SOLIS', 'INFORMES', 'CONFIGURACION', 'CONTRATISTAS', 'REQS', 'COMUS', 'INFORME'];

  /* ══════════════ el arranque, en UNA sola llamada ══════════════ */

  function leer(accion, datos, veces) {
    return K.pedir(accion, datos || {}, { ms: 60000 })['catch'](function (e) {
      var red = e && (e.codigo === 'RESPUESTA_NO_JSON' || e.codigo === 'SIN_RED' || e.codigo === 'TIEMPO');
      if (red && (veces || 0) < 1) return leer(accion, datos, (veces || 0) + 1);
      throw e;
    });
  }

  /* el login trae el arranque (pre.arranque) en el mismo viaje */
  function arranque(conEsqueleto, pre) {
    var yaVino = pre && pre.arranque ? pre.arranque : null;
    var quitar = (!yaVino && conEsqueleto && K.piezas.esqueletos && app)
      ? K.piezas.esqueletos.poner(app, { forma: 'ficha', cuantos: 1, sitio: 'reemplaza', espera: 'Cargando Tesorería' })
      : function () {};

    return (yaVino ? Promise.resolve(yaVino) : leer('inicio')).then(function (d) {
      ARRANQUE = d;
      YO = d.yo || YO;
      if (d.personas && K.piezas.personas) K.piezas.personas.cargar(d.personas);
      if (d.push && K.piezas.avisos && K.piezas.avisos.configurar) K.piezas.avisos.configurar(d.push);
      if (d.config && K.piezas.creditos && K.piezas.creditos.configurar) K.piezas.creditos.configurar(d.config);
      quitar();
      return d;
    }, function (e) {
      quitar();
      throw e;
    });
  }

  K.listo(function () {
    registrarSW();
    if (K.piezas.instalar) K.piezas.instalar.vigilar();
    if (K.piezas.version) K.piezas.version.vigilar();

    var puerta = K.piezas.bienvenida
      ? K.piezas.bienvenida.abrir({
          titulo: 'Tesorería',
          sub: M.MUNICIPIO || 'Alcaldía de Flandes',
          imagen: M.APP_ICON || 'img/icono-512.png'
        })
      : Promise.resolve('saltada');

    puerta.then(function () {
      K.piezas.sesion.entrar({
        titulo: 'TESORERÍA',
        sub: 'Ingresa con tu documento y contraseña',
        imagen: M.APP_ICON || 'img/icono-512.png',
        arranqueEnLogin: true,
        comprobar: function (login) { return arranque(true, login).then(function (d) { return d.yo; }); },
        alEntrar: arrancar
      });
    });
  });

  function registrarSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js')['catch'](function () {});
  }

  function arrancar(yo) {
    YO = yo || {};
    montarBanner();

    if (K.piezas.avisos) {
      K.piezas.avisos.autoActivar();
      K.piezas.avisos.alLlegar(function (a) {
        K.aviso(a.titulo ? (a.titulo + ': ' + a.cuerpo) : a.cuerpo, 'info', 6000);
      });
    }

    if (window.AYUDA) {
      window.AYUDA.configurar(function () {
        return { yo: YO, arranque: ARRANQUE, vista: vistaActual() };
      });
    }

    var c = { app: app, puede: puede, irA: irA, errorCaja: errorCaja,
              esDev: function () { return K.norm((YO && YO.rol) || '') === 'DEV'; },
              yo: function () { return YO || {}; },
              alcance: function () { return {}; },
              config: function () { return (ARRANQUE && ARRANQUE.config) || {}; },
              miFoto: miFoto, abrirFoto: abrirFoto,
              alFirma: function (r) { if (YO && r) YO.firma = r.id; },
              /* los números del inicio siguen a la bandeja sin otro viaje */
              alCambiar: function (n) { if (ARRANQUE) ARRANQUE.bandeja = n; } };
    MODULOS.forEach(function (m) { if (window[m]) window[m].configurar(c); });

    K.cuando('kit:foto', function (r) {
      YO.imagen = r.url || '';
      K.piezas.banner.perfil({ foto: r.foto || '' });
      var cara = document.querySelector('.saludo .kit-perfil-cara');
      if (cara && K.piezas.perfil) cara.parentNode.replaceChild(caraPerfil(), cara);
    });

    window.addEventListener('hashchange', enrutar);
    enrutar();
  }

  /* ══════════════ permisos ══════════════ */
  function puede(vista) {
    var r = K.norm((YO && YO.rol) || '');
    if (r === 'DEV') return true;
    var v = (YO && YO.vistas) || [];
    for (var i = 0; i < v.length; i++) if (K.norm(v[i]) === K.norm(vista)) return true;
    return false;
  }

  function miFoto(ancho) {
    return K.miniDrive ? K.miniDrive(YO.imagen || '', ancho || 200) : (YO.imagen || '');
  }

  function abrirFoto() {
    if (!K.piezas.perfil) return;
    K.piezas.perfil.abrir({ nombre: YO.nombre || '', foto: miFoto(512) });
  }

  function caraPerfil() {
    return K.piezas.perfil.cara(YO.nombre || '', miFoto(200), {
      tam: 66, fotoActual: function () { return miFoto(512); }
    });
  }

  function montarBanner() {
    var menu = [{ texto: 'Foto de perfil', al: abrirFoto }];
    if (puede('misInformes')) menu.push({ texto: 'Mis informes', al: function () { irA('informes'); } });
    if (puede('configuracion')) {
      menu.push({ texto: 'Mi firma y mi foto', al: function () { irA('perfil'); } });
      menu.push({ texto: 'Configuración', al: function () { irA('configuracion'); } });
    }
    menu.push({ texto: 'Actualizar contraseña', al: function () { K.piezas.sesion.cambiarClave(); } });
    menu.push({ texto: 'Instalar la app', al: function () { K.piezas.instalar.abrir(); } });
    /* soporte en TODAS las apps: hoja SOPORTE + grupo de desarrollo */
    menu.push({ texto: 'Soporte', al: function () { if (K.piezas.soporte) K.piezas.soporte.abrir({ vista: vistaActual() }); } });
    menu.push({ texto: 'Cerrar sesión', al: salir, peligro: true });
    K.piezas.banner.montar({
      titulo: 'Tesorería',
      nombre: YO.nombre || '',
      rol: rolLegible(YO.rol),
      foto: miFoto(200),
      menu: menu
    });
    if (K.piezas.cielo) K.piezas.cielo.soloFondo(document.querySelector('.kit-banner'));
  }

  function rolLegible(r) {
    var n = K.norm(r || '');
    if (n === 'EGRESO') return 'EGRESOS · Tesorería';
    if (n === 'PAGO') return 'PAGOS · Tesorería';
    if (n === 'ADMIN') return 'ADMIN · Tesorería';
    if (n === 'INVITADO') return 'INVITADO · Tesorería';
    if (n === 'DEV') return 'DEV · Desarrollo';
    return r || 'Tesorería';
  }

  function salir() {
    if (K.piezas.avisos) K.piezas.avisos.olvidar();
    if (K.piezas.insights) K.piezas.insights.quitar();
    MODULOS.forEach(function (m) { if (window[m] && window[m].olvidar) window[m].olvidar(); });
    if (window.OFICINA && window.OFICINA.olvidarDocs) window.OFICINA.olvidarDocs();
    K.piezas.sesion.salir();
    location.hash = '';
  }

  /* ══════════════ vistas ══════════════ */

  var VISTAS = {
    inicio: vistaInicio,
    pendientes: function () { window.EGRESOS.pendientes(); },
    egreso: function (sub) { window.EGRESOS.detalle(sub); },
    emitidos: function () { window.EGRESOS.emitidos(); },
    pagadas: function () { window.PAGADAS.vista(); },
    solicitudes: function () { window.SOLIS.vista(); },
    informes: function () { window.INFORMES.vista(); },
    contratistas: function (sub) { window.CONTRATISTAS.lista(sub); },
    contratista: function (sub) { window.CONTRATISTAS.detalle(sub); },
    informe: function (sub) { window.INFORME.vista(sub); },
    requerimientos: function () { window.REQS.vista(); },
    comunicados: function () { window.COMUS.vista(); },
    configuracion: function () { window.CONFIGURACION.vista(); },
    perfil: function () { window.CONFIGURACION.vista('firma'); }
  };

  var titulos = {
    inicio: 'Tesorería',
    pendientes: 'EGRESOS PENDIENTES',
    egreso: 'EGRESO',
    emitidos: 'EGRESOS EMITIDOS',
    pagadas: 'CUENTAS PAGADAS',
    solicitudes: 'SOLICITUDES',
    informes: 'MIS INFORMES',
    contratistas: 'CONTRATISTAS',
    contratista: 'CONTRATISTA',
    informe: 'INFORME DE CUENTAS',
    requerimientos: 'REQUERIMIENTOS',
    comunicados: 'COMUNICADOS',
    configuracion: 'CONFIGURACIÓN',
    perfil: 'MI FIRMA Y MI FOTO'
  };

  var PERMISO = { pendientes: 'egresosPendientes', egreso: 'egresosPendientes', emitidos: 'egresosEmitidos', pagadas: 'cuentasPagadas',
                  solicitudes: 'solicitudes', informes: 'misInformes',
                  contratistas: 'contratistas', contratista: 'contratistas', informe: 'contratistas',
                  requerimientos: 'requerimientos', comunicados: 'comunicados',
                  configuracion: 'configuracion', perfil: 'configuracion' };

  function irA(v) { location.hash = '#/' + v; }

  function vistaActual() {
    var v = String(location.hash || '').replace(/^#\/?/, '').split('/')[0] || 'inicio';
    return titulos[v] || v;
  }

  function enrutar() {
    var partes = String(location.hash || '').replace(/^#\/?/, '').split('/');
    var v = partes[0] || 'inicio';
    if (!VISTAS[v]) v = 'inicio';
    /* rehacer un egreso pide crear egresos; el resto, el permiso de su vista */
    if (v !== 'inicio' && !puede(PERMISO[v] || v)) v = 'inicio';

    K.piezas.banner.vista(titulos[v]);
    var resto = partes.slice(1).join('/');
    K.piezas.banner.atras(v === 'inicio' ? null : function () {
      if (v === 'egreso') irA(partes[4] === 'rehacer' ? 'emitidos' : 'pendientes');
      else if (v === 'contratista' || v === 'informe') irA('contratistas');
      else irA('inicio');
    });

    app.innerHTML = '';
    if (window.AYUDA) window.AYUDA.montar(v);
    window.scrollTo(0, 0);
    VISTAS[v](resto);
  }

  /* ---------- inicio ---------- */

  function vistaInicio() {
    var caja = K.nodo('<div class="kit-ancho vista"></div>');
    var saludo = K.nodo(
      '<section class="saludo">' +
      '  <div class="saludo__txt">' +
      '    <p class="saludo__hola">' + K.esc(saludoDelDia()) + ',</p>' +
      '    <h2 class="saludo__nombre">' + K.esc(nombreCorto(YO.nombre)) + '</h2>' +
      '    <p class="saludo__doc">' + K.esc(rolLegible(YO.rol)) + ' · ' + K.esc(fechaHumana(new Date())) + '</p>' +
      '  </div>' +
      '</section>'
    );
    if (K.piezas.perfil && K.piezas.personas) saludo.appendChild(caraPerfil());
    if (K.piezas.cielo) K.piezas.cielo.poner(saludo, { burbujas: 3 });
    caja.appendChild(saludo);

    /* las firmas del egreso (llegan con el arranque, sin otro viaje) */
    var fi = ARRANQUE && ARRANQUE.firmantes;
    if (fi && !fi.listo && fi.faltan && fi.faltan.length && puede('egresosPendientes')) {
      var av = K.nodo('<section class="kit-tarjeta rv-aviso op-firmas">' + K.icono('lapiz', 18) +
        '<span>Para crear egresos falta ' + K.esc(fi.faltan.join(', ')) + '.</span></section>');
      if (puede('configuracion')) {
        var bf = K.nodo('<button type="button" class="kit-btn kit-btn--marca op-mini">Configuración</button>');
        bf.addEventListener('click', function () { irA('configuracion'); });
        av.appendChild(bf);
      }
      caja.appendChild(av);
    }

    function bloque(titulo, tarjetas) {
      var s = K.nodo('<section class="bloque" aria-label="' + K.esc(titulo) + '">' +
        '<h3 class="bloque__t">' + K.esc(titulo) + '</h3></section>');
      var r = K.nodo('<div class="kit-rejilla kit-rejilla--auto accesos"></div>');
      tarjetas.forEach(function (t) { r.appendChild(t); });
      s.appendChild(r);
      caja.appendChild(s);
      return s;
    }

    var acc = {};
    var tEg = [];
    if (puede('egresosPendientes')) tEg.push(acc.pendientes = accesoIcono('EGRESOS PENDIENTES', 'Las órdenes de pago listas: el neto de la orden, la fuente y el comprobante de egreso en PDF', 'moneda',
      function () { abrir('pendientes', {}); }, 'pendientes'));
    if (puede('egresosEmitidos')) tEg.push(acc.emitidos = accesoIcono('EGRESOS EMITIDOS', 'Los egresos hechos: revisa a quién se gira y marca la cuenta paga', 'enviar',
      function () { abrir('emitidos', {}); }, 'emitidos'));
    if (puede('cuentasPagadas')) tEg.push(acc.pagadas = accesoIcono('CUENTAS PAGADAS', 'Todas las cuentas pagadas: sube el comprobante y abre el egreso', 'check',
      function () { if (window.PAGADAS) window.PAGADAS.filtrar({ que: 'sin' }); irA('pagadas'); }, 'pagadas'));
    if (tEg.length) bloque('EGRESOS Y PAGOS', tEg);

    var tGente = [];
    if (puede('solicitudes')) tGente.push(acc.solicitudes = accesoIcono('SOLICITUDES', 'Lo que los contratistas le preguntan a Tesorería; la respuesta les llega por WhatsApp', 'comentario',
      function () { irA('solicitudes'); }, 'solicitudes'));
    if (puede('contratistas')) {
      tGente.push(acceso('CONTRATISTAS', 'Todos los contratos: ficha, adiciones, cesiones, WhatsApp y Drive',
        'img/contratista.webp', function () { irA('contratistas'); }));
      tGente.push(acceso('DESCARGAR INFORME', 'Las cuentas de un contratista en PDF (informe) o Excel (todas las columnas)',
        'img/datos_de_procesos.webp', function () { K.aviso('Toca Informe en la tarjeta del contratista.', 'info', 3500); irA('contratistas'); }));
    }
    if (puede('requerimientos')) tGente.push(acceso('REQUERIMIENTOS', 'Pídele algo a uno o a varios contratistas y sigue si ya lo atendieron',
      'img/notificacion.webp', function () { irA('requerimientos'); }));
    if (tGente.length) bloque('CONTRATISTAS', tGente);

    var tOf = [];
    if (puede('misInformes')) tOf.push(acceso('MIS INFORMES', 'Egresos, pagos, solicitudes y cierres por periodo, en PDF o Excel',
      'img/pdf.webp', function () { irA('informes'); }));
    if (puede('comunicados')) tOf.push(acceso('COMUNICADOS', 'Publica avisos con documentos: llegan como notificación al teléfono de los contratistas',
      'img/chat.webp', function () { irA('comunicados'); }));
    if (puede('configuracion')) {
      tOf.push(accesoIcono('CONFIGURACIÓN', 'Fuentes y cuentas bancarias, firmas del egreso y sus reglas', 'herramienta', function () { irA('configuracion'); }));
      tOf.push(acceso('MI FIRMA Y MI FOTO', 'Tu firma y tu foto de perfil',
        'img/imagen.webp', function () { irA('perfil'); }));
    }
    if (tOf.length) bloque('OFICINA', tOf);

    var destino = K.nodo('<section class="resumen"></section>');
    var conBandeja = !!(acc.pendientes || acc.emitidos || acc.pagadas || acc.solicitudes);
    if (acc.pendientes || acc.emitidos) {
      var sRes = K.nodo('<section class="bloque" aria-label="Resumen"><h3 class="bloque__t">RESUMEN DE TESORERÍA</h3></section>');
      sRes.appendChild(destino);
      caja.appendChild(sRes);
    }

    app.appendChild(caja);
    K.piezas.creditos.montar(caja);

    if (conBandeja && window.EGRESOS) {
      var p = window.EGRESOS.cargar(false);
      (acc.pendientes || acc.emitidos ? K.piezas.esqueletos.mientras(destino, p, { forma: 'ficha', cuantos: 1, espera: 'Cargando los egresos' }) : p)
        .then(function () {
          var n = window.EGRESOS.contar();
          burbujas(acc, n);
          if (acc.pendientes || acc.emitidos) pintarResumen(destino, n, acc);
        })
        ['catch'](function (e) { destino.appendChild(errorCaja(e)); });
    }
  }

  function burbujas(acc, n) {
    burbuja(acc.pendientes, n.pendientes, 'por hacer', 'Estás al día: no hay órdenes de pago esperando egreso');
    burbuja(acc.emitidos, n.emitidos, 'por pagar', 'Estás al día: no hay egresos por pagar');
    burbuja(acc.pagadas, n.sinComprobante, 'sin comprobante', 'Todas las cuentas pagadas en esta app tienen comprobante');
    burbuja(acc.solicitudes, n.solicitudes, 'pendientes', 'Sin solicitudes pendientes');
  }

  function burbuja(acc, n, que, vacio) {
    if (!acc) return;
    var bb = acc.querySelector('.acceso__burbuja');
    if (bb) bb.parentNode.removeChild(bb);
    var p = acc.querySelector('.acceso__p');
    if (!acc.__texto && p) acc.__texto = p.textContent;
    if (n) { acc.insertAdjacentHTML('beforeend', '<b class="acceso__burbuja rv-burbuja" aria-label="' + n + ' ' + que + '">' + (n > 99 ? '99+' : n) + '</b>'); if (p) p.textContent = acc.__texto; }
    else if (p) p.textContent = vacio;
  }

  function abrir(v, f) {
    if (window.EGRESOS && window.EGRESOS.filtrar) window.EGRESOS.filtrar(f || {});
    irA(v);
  }

  function pintarResumen(destino, n, acc) {
    destino.innerHTML = '';
    var caja = K.nodo('<div class="kit-tarjeta resumen__caja ct-resumen"></div>');
    var ref = K.nodo('<button type="button" class="kit-btn kit-btn--plano ct-recargar ct-recargar--mini" aria-label="Refrescar las cifras">' +
      K.icono('recargar', 16) + '<span>Refrescar</span></button>');
    ref.addEventListener('click', function () {
      ref.disabled = true; ref.classList.add('kit-ocupado');
      window.EGRESOS.cargar(true).then(function () {
        var m = window.EGRESOS.contar();
        pintarResumen(destino, m, acc);
        burbujas(acc, m);
        K.aviso('Cifras al día.', 'ok', 2000);
      }, function (e) { K.aviso((e && e.message) || 'No se pudo refrescar.', 'malo', 5000); ref.disabled = false; ref.classList.remove('kit-ocupado'); });
    });
    caja.appendChild(ref);
    var cifras = K.nodo('<div class="ct-cifras sp-cifras"></div>');
    var lista = [];
    if (acc.pendientes) {
      lista.push(['pendientes', {}, n.pendientes, 'Egresos por hacer']);
      lista.push(['pendientes', { que: 'primera' }, n.primeras, 'Primeras del tramo']);
      lista.push(['pendientes', { que: 'motor' }, n.motor, 'Orden de la app anterior']);
    }
    if (acc.emitidos) lista.push(['emitidos', {}, n.emitidos, 'Por marcar pagas']);
    if (acc.pagadas) lista.push(['pagadas', null, n.sinComprobante, 'Sin comprobante']);
    lista.forEach(function (c) {
      var b = K.nodo('<button type="button" class="ct-cifra"><b>' + K.numero(c[2] || 0) + '</b><span>' + K.esc(c[3]) + '</span></button>');
      b.addEventListener('click', function () {
        K.vibrar(6);
        if (c[0] === 'pagadas') { if (window.PAGADAS) window.PAGADAS.filtrar({ que: 'sin' }); irA('pagadas'); }
        else abrir(c[0], c[1]);
      });
      cifras.appendChild(b);
    });
    caja.appendChild(cifras);
    caja.appendChild(K.nodo('<p class="ct-resumen__t sp-total">' + (acc.pendientes
      ? K.numero(n.pendientes || 0) + ' órdenes de pago esperando egreso · ' + K.esc(K.pesos(n.porGirar || 0)) + ' por girar'
      : K.numero(n.emitidos || 0) + ' egresos esperando el pago') + '</p>'));
    destino.appendChild(caja);
  }

  function acceso(titulo, texto, medio, al) {
    var b = K.nodo(
      '<button type="button" class="kit-tarjeta acceso">' +
      '  <img class="acceso__img" src="' + K.esc(K.medio(medio)) + '" alt="" loading="lazy">' +
      '  <span class="acceso__txt">' +
      '    <span class="acceso__t">' + K.esc(titulo) + '</span>' +
      '    <span class="acceso__p">' + K.esc(texto) + '</span>' +
      '  </span>' +
      '</button>'
    );
    b.addEventListener('click', function () { K.vibrar(8); al(); });
    return b;
  }

  /** Sin imagen en ALCALDIA-MEDIOS para Configuración: el icono del kit, del mismo tamaño. */
  function accesoIcono(titulo, texto, icono, al, clave) {
    var b = K.nodo(
      '<button type="button" class="kit-tarjeta acceso">' +
      '  <span class="acceso__img acceso__img--icono" aria-hidden="true">' + K.icono(icono, 40) + '</span>' +
      '  <span class="acceso__txt">' +
      '    <span class="acceso__t">' + K.esc(titulo) + '</span>' +
      '    <span class="acceso__p">' + K.esc(texto) + '</span>' +
      '  </span>' +
      '</button>'
    );
    if (clave) b.setAttribute('data-clave', clave);
    b.addEventListener('click', function () { K.vibrar(8); al(); });
    return b;
  }

  /* ══════════════ auxiliares ══════════════ */

  function saludoDelDia() {
    var h = new Date().getHours();
    return h < 12 ? 'Buenos días' : (h < 19 ? 'Buenas tardes' : 'Buenas noches');
  }

  function fechaHumana(d) {
    var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
                 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()];
  }

  function nombreCorto(n) {
    var p = String(n || '').trim().split(/\s+/);
    if (!p[0]) return '';
    return p.length > 1 ? (p[0] + ' ' + p[1]) : p[0];
  }

  function errorCaja(e, alReintentar) {
    var msg = (e && e.message) ? e.message : 'No se pudo cargar.';
    var c = K.nodo(
      '<section class="kit-tarjeta error">' +
      '  <p class="error__t">' + K.esc(msg) + '</p>' +
      '  <button type="button" class="kit-btn kit-btn--plano">Reintentar</button>' +
      '</section>'
    );
    c.querySelector('button').addEventListener('click', function () {
      if (alReintentar) alReintentar(); else enrutar();
    });
    return c;
  }
}());
