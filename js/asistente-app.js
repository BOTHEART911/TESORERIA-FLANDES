/* ============================================================
   TESORERIA-FLANDES · ADAPTADOR DEL ASISTENTE DE AYUDA
   24/10/2026 · entrega 6 (la pieza es la misma de CONTRATISTA,
   SUPERVISIÓN, CONTRATACIÓN y CONTABILIDAD)

   La pieza kit/asistente.js no sabe nada de esta app. Aquí se le dice:
     · a dónde puede llevar (destino), con qué rótulo y con qué pastilla
       ya puesta (primeras del tramo, orden de la app anterior, con
       embargo, cedidos; pagadas sin comprobante; solicitudes pendientes),
     · qué está cerrado y por qué (puerta): el permiso de la vista
       (llave PERMISOS de CONFIG, igual que el menú y el enrutador),
     · lo más urgente al abrir (urgente): las firmas que faltan para crear
       egresos → órdenes que llevan 5 días o más esperando egreso →
       egresos que llevan 5 días o más sin marcar pagos → solicitudes por
       responder → órdenes esperando egreso → egresos por pagar → cuentas
       pagadas sin comprobante,
     · los datos reales de las respuestas ({{clave}}).

   TODO sale de lo que la app ya trajo: el arranque (con las firmas del
   egreso), la bandeja que el inicio pide para sus burbujas (pendientes,
   emitidos y conteos) y, si la persona ya los abrió, cuentas pagadas,
   solicitudes, mis registros, contratistas, informe, requerimientos y
   configuración. Ningún dato viaja al servidor para responder.

   La base embebida (js/asistente-base.js) es el respaldo para la primera
   apertura y la pantalla de entrada; la del CORE la reemplaza en cuanto
   llega con el arranque (solo cuando cambia su sello).
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  if (!K || !K.piezas.asistente) return;

  var TARDE = 5;   /* días: la lista pinta en rojo la fecha de la orden desde 5 */

  function APP() { return window.TESORERIA_APP || {}; }
  function ar() { try { return (APP().arranque && APP().arranque()) || {}; } catch (e) { return {}; } }
  function yo() { try { return (APP().yo && APP().yo()) || {}; } catch (e) { return {}; } }
  function EG() { return window.EGRESOS || null; }
  function PG() { return window.PAGADAS || null; }
  function SO() { return window.SOLIS || null; }
  function IF() { return window.INFORMES || null; }
  function CF() { return window.CONFIGURACION || null; }
  function CT() { return window.CONTRATISTAS || null; }
  function RQ() { return window.REQS || null; }
  function IN() { return window.INFORME || null; }

  function bandeja() { var e = EG(); try { return e && e._bandeja ? e._bandeja() : null; } catch (x) { return null; } }
  function pend() { var e = EG(); try { return bandeja() ? e._pendientes().filter(function (c) { return !c.error; }) : []; } catch (x) { return []; } }
  function emit() { var e = EG(); try { return bandeja() ? e._emitidos().filter(function (c) { return !c.error; }) : []; } catch (x) { return []; } }
  function conteo(k) { var b = bandeja(); return (b && b.conteos && Number(b.conteos[k])) || 0; }
  function contratos() { var c = CT(); try { return c && c.todas ? c.todas() : []; } catch (e) { return []; } }
  function activos() { return contratos().filter(function (f) { return f.estado === 'ACTIVO'; }); }

  function nombre(s) {
    var t = K.piezas.personas ? K.piezas.personas.nombrePropio(s) : String(s || '');
    return t.replace(/ (De|Del|La|Las|Los|Y|E|En) /g, function (m) { return m.toLowerCase(); })
            .replace(/ (De|Del|La|Las|Los|Y|E|En) /g, function (m) { return m.toLowerCase(); });
  }
  function pesos(v) { return '$ ' + K.pesos(v || 0).replace(/^\$\s*/, ''); }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
  function fecha(f) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(f || ''));
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  }
  function hoy() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function diasDe(f) { var d = fecha(f); return d ? Math.round((hoy() - d) / 864e5) : null; }
  function lista(filas, fmt, max) {
    max = max || 5;
    var t = filas.slice(0, max).map(fmt).join('\n');
    if (filas.length > max) t += '\n… y ' + (filas.length - max) + ' más.';
    return t;
  }
  function hace(d) { return d !== null && d >= 0 ? ', hace ' + plural(d, 'día', 'días') : ''; }
  function aGirar(c) { var q = c.embargo && c.embargo.cuota > 0 ? c.embargo.cuota : 0; return (Number(c.neto) || 0) - q; }
  function girado(c) { return c.datos ? Number(c.datos.total) || 0 : Number(c.neto) || 0; }
  function lineaP(x) { return '· **' + nombre(x.nombre) + '** — orden ' + (x.orden || '—') + hace(diasDe(x.fechaOrden)) + ', ' + pesos(aGirar(x)); }
  function lineaE(x) { return '· **' + nombre(x.nombre) + '** — egreso ' + (x.egreso || (x.datos && x.datos.numero) || 'sin número') + hace(diasDe(x.fechaEgreso || (x.datos && x.datos.fecha))) + ', ' + pesos(girado(x)); }
  function porFecha(c, campo) { return c.slice().sort(function (a, b) { return (diasDe(b[campo]) || 0) - (diasDe(a[campo]) || 0); }); }

  var CARGANDO = 'Los egresos todavía están llegando: pregúntame de nuevo en un momento.';
  var ABRE_CT = 'Abre **CONTRATISTAS** y vuelve a preguntarme: la lista de contratos se trae al entrar ahí.';

  /* ---------- permisos ---------- */

  function puede(perm) { try { return APP().puede ? APP().puede(perm) : true; } catch (e) { return true; } }
  var P_PEND = 'egresosPendientes', P_EMIT = 'egresosEmitidos';

  /* ---------- lo de la bandeja ---------- */

  function firmasFaltan() {
    var f = ar().firmantes || (bandeja() && bandeja().firmantes);
    return f && !f.listo && f.faltan && f.faltan.length ? f : null;
  }
  function atrasadasP() { return porFecha(pend().filter(function (c) { var d = diasDe(c.fechaOrden); return d !== null && d >= TARDE; }), 'fechaOrden'); }
  function fEmi(c) { return c.fechaEgreso || (c.datos && c.datos.fecha) || ''; }
  function atrasadosE() {
    return emit().filter(function (c) { var d = diasDe(fEmi(c)); return d !== null && d >= TARDE; })
      .sort(function (a, b) { return (diasDe(fEmi(b)) || 0) - (diasDe(fEmi(a)) || 0); });
  }
  function solisPend() {
    var d = SO() && SO()._datos && SO()._datos();
    if (d) return d.filter(function (x) { return x.estado === 'PENDIENTE'; }).length;
    return conteo('solicitudes');
  }
  function sinComp() {
    var p = PG() && PG()._datos && PG()._datos() ? PG().contar() : null;
    return p ? p.sin : conteo('sinComprobante');
  }

  /* ---------- lo más urgente al abrir ---------- */

  function urgente() {
    var f = firmasFaltan();
    if (f && puede(P_PEND)) return { texto: 'Para crear egresos falta **' + f.faltan.join(', ') + '**.', accion: puede('configuracion') ? 'ir:configuracion' : 'soporte' };
    if ((puede(P_PEND) || puede(P_EMIT) || puede('cuentasPagadas') || puede('solicitudes')) && !bandeja()) return null;
    var a = puede(P_PEND) ? atrasadasP() : [];
    if (a.length) {
      return { texto: '**' + plural(a.length, 'orden de pago lleva', 'órdenes de pago llevan') + ' ' + TARDE + ' días o más** esperando egreso; la de **' +
        nombre(a[0].nombre) + '** es del ' + a[0].fechaOrden + '.', accion: 'ir:pendientes' };
    }
    var e = puede(P_EMIT) ? atrasadosE() : [];
    if (e.length) {
      return { texto: '**' + plural(e.length, 'egreso lleva', 'egresos llevan') + ' ' + TARDE + ' días o más** sin marcar la cuenta paga; el de **' +
        nombre(e[0].nombre) + '** es del ' + fEmi(e[0]) + '.', accion: 'ir:emitidos' };
    }
    var s = puede('solicitudes') ? solisPend() : 0;
    if (s) return { texto: 'Tienes **' + plural(s, 'solicitud', 'solicitudes') + ' de contratistas** por responder.', accion: 'ir:solPend' };
    var n = puede(P_PEND) ? pend().length : 0;
    if (n) return { texto: 'Tienes **' + plural(n, 'orden de pago esperando', 'órdenes de pago esperando') + ' egreso**.', accion: 'ir:pendientes' };
    n = puede(P_EMIT) ? emit().length : 0;
    if (n) return { texto: 'Hay **' + plural(n, 'egreso esperando', 'egresos esperando') + '** que marques la cuenta paga.', accion: 'ir:emitidos' };
    n = puede('cuentasPagadas') ? sinComp() : 0;
    if (n) return { texto: '**' + plural(n, 'cuenta pagada espera', 'cuentas pagadas esperan') + '** su comprobante.', accion: 'ir:pagSin' };
    return null;
  }

  /* ---------- a dónde puede llevar ---------- */

  /* [rótulo, ruta, filtro, ruta con atajo] */
  var DESTINOS = {
    inicio:         ['Ir al inicio', 'inicio'],
    pendientes:     ['Ver los egresos pendientes', 'pendientes', { m: 'EGRESOS', f: {} }],
    pendPrimeras:   ['Ver las primeras del tramo', 'pendientes', { m: 'EGRESOS', f: { que: 'primera' } }],
    pendMotor:      ['Ver las órdenes de la app anterior', 'pendientes', { m: 'EGRESOS', f: { que: 'motor' } }],
    pendEmbargo:    ['Ver las que tienen embargo', 'pendientes', { m: 'EGRESOS', f: { que: 'embargo' } }],
    pendCesion:     ['Ver los contratos cedidos', 'pendientes', { m: 'EGRESOS', f: { que: 'cesion' } }],
    emitidos:       ['Ver los egresos emitidos', 'emitidos', { m: 'EGRESOS', f: {} }],
    pagSin:         ['Ver las pagadas sin comprobante', 'pagadas', { m: 'PAGADAS', f: { que: 'sin' } }],
    pagadas:        ['Ir a CUENTAS PAGADAS', 'pagadas', { m: 'PAGADAS', f: { que: '' } }],
    solPend:        ['Ver las solicitudes pendientes', 'solicitudes', { m: 'SOLIS', f: { que: 'PENDIENTE' } }],
    registros:      ['Ir a MIS REGISTROS', 'informes'],
    contratistas:   ['Ir a CONTRATISTAS', 'contratistas'],
    activos:        ['Ver los contratos activos', 'contratistas', null, 'contratistas/activos'],
    requerimientos: ['Ir a REQUERIMIENTOS', 'requerimientos'],
    comunicados:    ['Ir a COMUNICADOS', 'comunicados'],
    configuracion:  ['Ir a CONFIGURACIÓN', 'configuracion'],
    perfil:         ['Ir a MI FIRMA Y MI FOTO', 'perfil']
  };
  var NOMBRES = { pendientes: 'los egresos pendientes', pendPrimeras: 'los egresos pendientes', pendMotor: 'los egresos pendientes',
    pendEmbargo: 'los egresos pendientes', pendCesion: 'los egresos pendientes', emitidos: 'los egresos emitidos',
    pagSin: 'CUENTAS PAGADAS', pagadas: 'CUENTAS PAGADAS', solPend: 'SOLICITUDES', registros: 'MIS REGISTROS',
    contratistas: 'CONTRATISTAS', activos: 'CONTRATISTAS', requerimientos: 'REQUERIMIENTOS', comunicados: 'COMUNICADOS',
    configuracion: 'CONFIGURACIÓN', perfil: 'MI FIRMA Y MI FOTO' };

  function rutaActual() { return String(location.hash || '').replace(/^#\/?/, ''); }

  function destino(id) {
    var d = DESTINOS[id];
    if (!d) return null;
    return { etiqueta: d[0], ir: function () {
      if (d[2] && window[d[2].m] && window[d[2].m].filtrar) window[d[2].m].filtrar(d[2].f);
      var r = d[3] || d[1];
      if (rutaActual() === r) { window.dispatchEvent(new HashChangeEvent('hashchange')); return; }
      location.hash = '#/' + r;
    } };
  }

  /** Lo cerrado se explica con el permiso que falta y se ofrece soporte. */
  function puerta(id) {
    var d = DESTINOS[id];
    if (!d || !d[1] || d[1] === 'inicio') return null;
    var perm = APP().permiso ? APP().permiso(d[1]) : d[1];
    if (!puede(perm)) {
      return { texto: 'Tu usuario no tiene permiso para **' + (NOMBRES[id] || id) + '**. Si lo necesitas, pídeselo al administrador.', accion: 'soporte' };
    }
    return null;
  }

  /* ---------- acciones que no son ir a una vista ---------- */

  function vistaTitulo() { try { return (APP().vistaActual && APP().vistaActual()) || ''; } catch (e) { return ''; } }

  function accion(a) {
    switch (a) {
      case 'guia': return { etiqueta: 'Descargar la guía rápida', icono: 'descargar', cierra: false, hacer: function () { if (K.piezas.guia) K.piezas.guia.descargar('TESORERIA'); } };
      case 'soporte': return { etiqueta: 'Contarle a soporte', icono: 'salvavidas', hacer: function (p) {
        if (K.piezas.soporte) K.piezas.soporte.abrir({ vista: vistaTitulo(), texto: p ? 'Le pregunté al asistente: «' + p + '»\n' : '' });
      } };
      case 'foto': return { etiqueta: 'Cambiar mi foto', icono: 'camara', hacer: function () { if (APP().abrirFoto) APP().abrirFoto(); } };
      case 'clave': return { etiqueta: 'Actualizar contraseña', icono: 'llave', hacer: function () { K.piezas.sesion.cambiarClave(); } };
      case 'instalar': return { etiqueta: 'Instalar la app', icono: 'descargar', hacer: function () { if (K.piezas.instalar) K.piezas.instalar.abrir(); } };
      default: return null;
    }
  }

  /* ---------- los datos de las respuestas ---------- */

  function sinPermiso(que) { return 'Tu usuario no hace ' + que + '. Si lo necesitas, pídeselo al administrador.'; }
  function abierta() { var e = EG(); try { return e && e._actual ? e._actual() : null; } catch (x) { return null; } }

  function textoPermisos() {
    var r = K.norm(yo().rol || '');
    if (r === 'DEV') return 'Tu usuario es **DEV**: entra a todo.';
    var rot = { EGRESO: 'EGRESOS', PAGO: 'PAGOS', ADMIN: 'ADMIN', INVITADO: 'INVITADO' }[r] || r || 'de Tesorería';
    var si = [], no = [];
    [[P_PEND, 'crear egresos'], [P_EMIT, 'marcar cuentas pagas'], ['cuentasPagadas', 'cuentas pagadas y comprobantes'],
     ['solicitudes', 'solicitudes'], ['misInformes', 'mis registros'], ['contratistas', 'contratistas e informes'],
     ['embargos', 'embargos'], ['requerimientos', 'requerimientos'], ['comunicados', 'comunicados'], ['configuracion', 'configuración y firma']]
      .forEach(function (p) { (puede(p[0]) ? si : no).push(p[1]); });
    return 'Tu usuario es **' + rot + '** de Tesorería. Puede: ' + (si.join(', ') || 'consultar') + '.' +
      (no.length ? ' No tiene: ' + no.join(', ') + '. Los permisos los da el administrador.' : '');
  }

  function dato(k) {
    var c, n, s, f, d, o;
    switch (k) {
      case 'queMeToca':
        var u = urgente();
        if (u) return u.texto;
        if (!bandeja() && (puede(P_PEND) || puede(P_EMIT) || puede('cuentasPagadas') || puede('solicitudes'))) return CARGANDO;
        return 'Por ahora **nada urgente**: estás al día. ✓';
      case 'porHacer':
        if (!puede(P_PEND)) return sinPermiso('egresos');
        if (!bandeja()) return CARGANDO;
        n = EG().contar();
        if (!n.pendientes) return '**Ninguna**: estás al día, no hay órdenes de pago esperando egreso. ✓';
        return 'Hay **' + plural(n.pendientes, 'orden de pago esperando', 'órdenes de pago esperando') + ' egreso** (' + pesos(n.porGirar) + ' de neto)' +
          (n.primeras ? '; ' + plural(n.primeras, 'es primera', 'son primeras') + ' de su tramo' : '') +
          (n.motor ? '; ' + plural(n.motor, 'es orden', 'son órdenes') + ' de la app anterior' : '') + '. Te llevo a la lista.';
      case 'masAntigua':
        if (!puede(P_PEND)) return sinPermiso('egresos');
        if (!bandeja()) return CARGANDO;
        c = porFecha(pend(), 'fechaOrden');
        if (!c.length) return '¡Ninguna! No hay órdenes de pago esperando egreso. ✓';
        return 'Las que más llevan esperando:\n' + lista(c, lineaP);
      case 'atrasadas':
        if (!puede(P_PEND)) return sinPermiso('egresos');
        if (!bandeja()) return CARGANDO;
        c = atrasadasP();
        if (!c.length) return 'Ninguna: todas las órdenes esperando egreso son de hace menos de ' + TARDE + ' días. ✓';
        return '**' + plural(c.length, 'orden lleva', 'órdenes llevan') + ' ' + TARDE + ' días o más** (en la lista salen en rojo):\n' + lista(c, lineaP, 6);
      case 'porGirar':
        if (!puede(P_PEND)) return sinPermiso('egresos');
        if (!bandeja()) return CARGANDO;
        c = pend(); if (!c.length) return 'No hay órdenes de pago esperando egreso.';
        s = 0; n = 0; c.forEach(function (x) { s += Number(x.neto) || 0; n += aGirar(x); });
        return 'Las ' + plural(c.length, 'orden', 'órdenes') + ' suman **' + pesos(s) + '** de neto' + (n !== s ? '; descontando los embargos se girarían **' + pesos(n) + '**' : '') + '.';
      case 'porPagar':
        if (!puede(P_EMIT)) return sinPermiso('pagos');
        if (!bandeja()) return CARGANDO;
        c = emit();
        if (!c.length) return '**Ninguno**: no hay egresos esperando el pago. ✓';
        s = c.reduce(function (a, x) { return a + girado(x); }, 0);
        return 'Hay **' + plural(c.length, 'egreso', 'egresos') + '** por marcar pagos, **' + pesos(s) + '**. Te llevo a la lista.';
      case 'emiAntiguo':
        if (!puede(P_EMIT)) return sinPermiso('pagos');
        if (!bandeja()) return CARGANDO;
        c = emit().slice().sort(function (a, b) { return (diasDe(fEmi(b)) || 0) - (diasDe(fEmi(a)) || 0); });
        if (!c.length) return 'No hay egresos por pagar. ✓';
        return 'Los que más llevan sin marcar la cuenta paga:\n' + lista(c, lineaE);
      case 'primeras':
        if (!bandeja()) return CARGANDO;
        c = pend().filter(function (x) { return x.primera; });
        if (!c.length) return 'Ninguna cuenta esperando egreso es la primera de su tramo.';
        return 'Son la primera cuenta de su tramo:\n' + lista(c, lineaP, 6);
      case 'motor':
        if (!bandeja()) return CARGANDO;
        c = pend().filter(function (x) { return x.netoFuente === 'MOTOR'; });
        if (!c.length) return 'Ninguna: todas las órdenes tienen el neto guardado por Contabilidad. ✓';
        return 'Estas órdenes se hicieron con la app anterior y no guardaron el neto; lo calcula el mismo motor de Contabilidad (compáralo con la orden en papel):\n' +
          lista(c, function (x) { return '· **' + nombre(x.nombre) + '** — orden ' + (x.orden || '—') + ': ' + pesos(x.neto); }, 6);
      case 'embargos':
        if (!bandeja()) return CARGANDO;
        c = pend().filter(function (x) { return x.embargo && x.embargo.cuota > 0; });
        if (!c.length) return 'Ninguna cuenta esperando egreso tiene embargo. Los embargos se configuran en la tarjeta del contratista.';
        return 'Llegan con la cuota del embargo ya descontada:\n' +
          lista(c, function (x) { return '· **' + nombre(x.nombre) + '** — embargo ' + pesos(x.embargo.cuota) + ', a girar ' + pesos(aGirar(x)); }, 6);
      case 'cesion':
        if (!bandeja()) return CARGANDO;
        c = pend().filter(function (x) { return x.cedido; });
        if (!c.length) return 'Ninguna cuenta esperando egreso es de un contrato cedido.';
        return lista(c, function (x) { return '· **' + nombre(x.nombre) + '** — contrato ' + (x.contrato || '—') + (x.rpCesionUsado ? ' (con RP de cesión)' : ''); }, 6);
      case 'sinBanco':
        if (!bandeja()) return CARGANDO;
        c = pend().concat(emit()).filter(function (x) { return !x.numeroCuenta || !x.banco; });
        if (!c.length) return 'Todos tienen banco y número de cuenta registrados. ✓';
        return 'Sin banco o sin número de cuenta (lo diligencia el contratista desde su app):\n' +
          lista(c, function (x) { return '· **' + nombre(x.nombre) + '** — contrato ' + (x.contrato || '—'); }, 6);
      case 'fuente':
        o = abierta();
        if (!o) return 'La **fuente de destinación** dice de qué cuenta de la Alcaldía sale el giro; el banco y el N° de cuenta salen de **CONFIGURACIÓN**. Abre una cuenta con **Hacer egreso** y te digo cuál se usó la vez pasada.';
        s = o.sugerida;
        return s && s.f1 ? 'La última vez a este contrato se le pagó con **' + s.f1 + '**' + (s.f2 ? ' y **' + s.f2 + '**' : '') + ': por eso ya viene escogida. Cámbiala si este giro sale de otra.'
                         : 'No hay pagos anteriores de este contrato en la hoja PAGOS: escoge la fuente de la que sale este giro.';
      case 'cuadra':
        o = abierta(); if (!o) return 'Abre una cuenta con **Hacer egreso** y te digo si cuadra.';
        s = EG()._sel(o); if (!s) return 'Todavía no has escrito los pagos.';
        var r = EG()._revisar(o, s, false);
        if (r.errores.length) return 'Todavía no: ' + r.errores[0];
        if (!r.dif) return 'Sí: se giran **' + pesos(r.total) + '**' + (r.embargo ? ' (con el embargo de ' + pesos(r.embargo) + ')' : '') + ', justo lo de la orden. ✓';
        return 'Se giran **' + pesos(r.total) + '** y la orden dice **' + pesos(o.neto) + '**: diferencia de ' + pesos(r.dif) + (s.motivo.tipo ? ' (' + s.motivo.tipo + ').' : '. Falta escoger el motivo.');
      case 'neto':
        o = abierta(); if (!o) return 'Abre una cuenta con **Hacer egreso** y te explico su neto.';
        f = (o.aplicadas || []).map(function (a) { return '· ' + a.n + ': ' + pesos(a.v); }).join('\n');
        return 'Cobro ' + pesos(o.cobro) + (f ? '\n' + f : '') + '\nNeto **' + pesos(o.neto) + '** — ' +
          (o.netoFuente === 'ORDEN' ? 'guardado por Contabilidad en la orden.' : 'calculado por el motor de Contabilidad (orden de la app anterior).') +
          (o.embargo && o.embargo.cuota > 0 ? '\nEmbargo ' + pesos(o.embargo.cuota) + ' → a girar **' + pesos(aGirar(o)) + '**.' : '');
      case 'firmas':
        f = firmasFaltan();
        if (!f) return 'Las firmas del egreso están completas: puedes crear egresos. ✓ **Aprobó** (alcaldesa), **Revisó** (Hacienda) y el sello se definen en **CONFIGURACIÓN**; **Elaboró** va con el usuario EGRESO.';
        return 'Para crear egresos falta **' + f.faltan.join(', ') + '**. ' + (puede('configuracion') ? 'Se define en **CONFIGURACIÓN** → firmas del egreso.' : 'Lo resuelve ADMIN en Configuración.');
      case 'conDiferencia':
        if (!bandeja()) return CARGANDO;
        c = emit().filter(function (x) { return x.datos && x.datos.diferencia; });
        if (!c.length) return 'Ninguno: todos los egresos por pagar giran el neto de su orden.';
        return lista(c, function (x) { return '· **' + nombre(x.nombre) + '** — ' + pesos(x.datos.diferencia) + (x.datos.motivo ? ' (' + x.datos.motivo.tipo + ')' : ''); }, 6);
      case 'sinComprobante':
        if (!puede('cuentasPagadas')) return sinPermiso('cuentas pagadas');
        o = PG() && PG()._datos && PG()._datos() ? PG().contar() : null;
        if (o) return '**' + plural(o.sin, 'cuenta pagada', 'cuentas pagadas') + '** con egreso de esta app sin comprobante; ' + o.con + ' con comprobante y ' + o.viejas + ' de la app anterior.';
        if (!bandeja()) return 'Abre **CUENTAS PAGADAS** y vuelve a preguntarme.';
        n = conteo('sinComprobante');
        return n ? '**' + plural(n, 'cuenta pagada espera', 'cuentas pagadas esperan') + '** su comprobante. Te llevo a la lista.' : 'Ninguna: todas las cuentas pagadas en esta app tienen comprobante. ✓';
      case 'solicitudes':
        if (!puede('solicitudes')) return sinPermiso('solicitudes');
        d = SO() && SO()._datos && SO()._datos();
        if (d) {
          c = d.filter(function (x) { return x.estado === 'PENDIENTE'; });
          return c.length ? '**' + plural(c.length, 'solicitud pendiente', 'solicitudes pendientes') + '**:\n' +
            lista(c, function (x) { return '· **' + nombre(x.nombre) + '** (' + x.codigo + ', ' + String(x.fecha || '').slice(0, 10) + ')'; }, 6)
            : 'Ninguna: todas respondidas. ✓';
        }
        if (!bandeja()) return 'Abre **SOLICITUDES** y vuelve a preguntarme.';
        n = conteo('solicitudes');
        return n ? 'Hay **' + plural(n, 'solicitud pendiente', 'solicitudes pendientes') + '**. Te llevo a la lista.' : 'Ninguna: todas respondidas. ✓';
      case 'aplicaGenerica':
        d = SO() && SO()._datos && SO()._datos();
        if (!d) return 'Abre **SOLICITUDES** y vuelve a preguntarme.';
        c = d.filter(function (x) { return x.estado === 'PENDIENTE'; });
        if (!c.length) return 'No hay solicitudes pendientes.';
        return lista(c, function (x) {
          var g = SO()._generica(x);
          return '· **' + nombre(x.nombre) + '** (' + x.codigo + '): ' + (g.error ? 'no aplica' : (g.avisos.length ? 'aplica, con aviso' : 'aplica · orden del ' + g.cuenta.fechaOrden));
        }, 8);
      case 'periodo':
        if (!IF() || !IF()._datos()) return 'Abre **MIS REGISTROS** y vuelve a preguntarme: ahí se traen tus registros.';
        c = IF()._filas(); f = IF()._filtro();
        if (!c.length) return 'No hay registros en el periodo escogido.';
        return IF().TIPOS[f.tipo].cifras(c).map(function (x) { return '· ' + x[0] + ': **' + x[1] + '**'; }).join('\n');
      case 'activos':
        if (!contratos().length) return ABRE_CT;
        return 'Hay **' + plural(activos().length, 'contrato activo', 'contratos activos') + '** de ' + contratos().length + ' registrados.';
      case 'porVencer':
        if (!contratos().length) return ABRE_CT;
        var h = hoy(), en30 = new Date(h.getTime() + 30 * 864e5);
        c = activos().filter(function (x) { var dd = fecha(x.fin); return dd && dd >= h && dd <= en30; })
          .sort(function (a, b) { return fecha(a.fin) - fecha(b.fin); });
        if (!c.length) return 'Ningún contrato activo termina en los próximos 30 días.';
        return '**' + plural(c.length, 'contrato termina', 'contratos terminan') + '** en los próximos 30 días:\n' +
          lista(c, function (x) { return '· **' + nombre(x.nombre) + '** — contrato ' + x.contrato + ', el ' + x.fin; }, 6);
      case 'faltaFicha':
        d = CT() && CT()._ficha ? CT()._ficha() : null;
        if (!d) return 'Abre la ficha de un contrato (**Detalles**) y vuelve a preguntarme.';
        o = d.contrato || {}; s = d.datos || {}; f = [];
        if (!o.numProceso) f.push('N° de proceso SECOP II');
        if (!o.fechaInicio) f.push('fecha de inicio');
        if (!o.fechaTermino) f.push('fecha de terminación');
        if (!o.rp) f.push('RP');
        if (!s.numeroCuenta || !s.banco) f.push('cuenta bancaria');
        if (!s.eps || !s.arl) f.push('EPS o ARL');
        return f.length ? 'Le falta: **' + f.join(', ') + '**. Lo diligencia el contratista desde su app.' : 'No le falta nada: el contrato y sus datos están completos. ✓';
      case 'comoVa':
        d = IN() && IN()._datos();
        if (!d || !K.piezas.informeCuentas) return 'Abre el **Informe** de un contrato y vuelve a preguntarme.';
        o = K.piezas.informeCuentas.cifras(d);
        return '**' + o.cuentas + '** cuentas' + (o.total ? ' de ' + o.total : '') + ': cobrado **' + pesos(o.cobrado) + '** (' + o.avance + '% del contrato), pagado **' + pesos(o.pagado) + '**, en trámite ' + pesos(o.enTramite) + '. Saldo por ejecutar **' + pesos(o.saldo) + '**.';
      case 'saldos':
        d = IN() && IN()._datos();
        if (!d) return 'Abre el **Informe** de un contrato y vuelve a preguntarme.';
        if (!d.cuentas || !d.cuentas.length) return 'Este contrato todavía no tiene cuentas.';
        var mal = [];
        d.cuentas.forEach(function (x, i) {
          if (Math.abs((x.saldo - x.cobro) - x.nuevo) > 1) mal.push('cuenta ' + x.informe + ': ' + pesos(x.saldo) + ' − ' + pesos(x.cobro) + ' ≠ ' + pesos(x.nuevo));
          var a = d.cuentas[i - 1];
          if (a && Math.abs(a.nuevo - x.saldo) > 1) mal.push('la ' + a.informe + ' dejó ' + pesos(a.nuevo) + ' y la ' + x.informe + ' arrancó en ' + pesos(x.saldo));
        });
        return mal.length ? '⚠ ' + mal.join('\n⚠ ') : 'Sí: cada saldo menos su cobro da el nuevo saldo y cada cuenta arranca donde terminó la anterior. ✓';
      case 'reqAbiertos':
        d = RQ() && RQ()._datos();
        if (!d) return 'Abre **REQUERIMIENTOS** y vuelve a preguntarme: ahí se trae el historial.';
        if (!d.lista || !d.lista.length) return 'Todavía no hay requerimientos hechos desde Tesorería.';
        c = d.lista.filter(function (q) { return q.estado !== 'ATENDIDO'; });
        return c.length ? '**' + c.length + '** abiertos de ' + d.lista.length + ':\n' + lista(c, function (q) { return '· **' + nombre(q.nombre) + '**' + (q.fecha ? ' (' + (window.OFICINA && OFICINA.fecha ? OFICINA.fecha(q.fecha) : q.fecha) + ')' : ''); }, 6)
                        : 'Ninguno: los ' + d.lista.length + ' están atendidos. ✓';
      case 'fuentes':
        o = CF() && CF()._cfg();
        if (!o) return 'Abre **CONFIGURACIÓN** y vuelve a preguntarme: ahí se trae la configuración.';
        var b = {}; (o.destinaciones || []).forEach(function (x) { b[x.banco] = (b[x.banco] || 0) + 1; });
        return '**' + plural((o.destinaciones || []).length, 'fuente', 'fuentes') + '**:\n' + Object.keys(b).map(function (q) { return '· ' + q + ': ' + b[q]; }).join('\n');
      case 'faltaConfig':
        o = CF() && CF()._cfg();
        if (!o) return 'Abre **CONFIGURACIÓN** y vuelve a preguntarme: ahí se trae la configuración.';
        f = [];
        if (o.estado && o.estado.faltan && o.estado.faltan.length) f.push('para los egresos: ' + o.estado.faltan.join(', '));
        if (o.reglas && o.reglas.cuentaDiferencia && !o.reglas.cuentaDiferencia.codigo) f.push('el código contable de la diferencia (hoy va solo como observación)');
        (o.retenciones || []).forEach(function (x) { if (!x.codigo) f.push('el código de ' + x.nombre); });
        return f.length ? '· ' + f.join('\n· ') : 'Nada: está todo definido. ✓';
      case 'permisos': return textoPermisos();
      case 'avisosTelefono':
        var e = K.piezas.avisos ? K.piezas.avisos.estado() : '';
        if (e === 'listo') return 'Este teléfono **ya recibe avisos** de Tesorería, aunque tengas la app cerrada.';
        if (e === 'ios-sin-instalar') return 'En iPhone los avisos solo llegan con la app **instalada** en la pantalla de inicio: menú de tu perfil → Instalar la app.';
        if (e === 'bloqueado') return 'Los avisos están **bloqueados** en este navegador: actívalos en los permisos del sitio (el candado junto a la dirección) y vuelve a abrir la app.';
        return 'Los avisos se activan solos al entrar: acepta el permiso de notificaciones cuando el teléfono lo pida.';
      case 'nombre': return nombre(String(yo().nombre || '').split(/\s+/)[0] || '');
      default: return '';
    }
  }

  function vista() {
    try { var cl = (K.piezas.insights.configuracion() || {}).clave; if (cl) return cl; } catch (e) {}
    return rutaActual().split('/')[0] || 'inicio';
  }

  var ADAPTADOR = {
    vista: vista,
    estado: function () { return 'ACTIVO'; },
    dato: dato, urgente: urgente, destino: destino, puerta: puerta, accion: accion
  };

  /* ══════════════ la pantalla de entrada ══════════════ */

  function campo(n) { return document.querySelector('.kit-sesion [name="' + n + '"]'); }
  function resaltar(el) {
    if (!el) return;
    el.classList.add('kit-as-resalta');
    try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    setTimeout(function () { el.classList.remove('kit-as-resalta'); }, 3600);
  }

  var ENTRADA = {
    vista: function () { return 'entrada'; },
    estado: function () { return ''; },
    dato: function () { return ''; },
    urgente: function () { return null; },
    destino: function () { return null; },
    puerta: function () { return null; },
    accion: function (a) {
      if (a === 'olvide') return { etiqueta: 'Mostrarme el botón', icono: 'llave', hacer: function () {
        var d = campo('documento');
        if (d && !String(d.value || '').trim()) { d.focus(); resaltar(d); }
        /* NO se toca: pedir la contraseña lo decide la persona */
        resaltar(document.querySelector('.kit-sesion__olvide'));
      } };
      if (a === 'documento') return { etiqueta: 'Ir a la entrada', icono: 'persona', hacer: function () {
        var d = campo('documento'), cl = campo('clave');
        var el = d && !String(d.value || '').trim() ? d : (cl || d);
        if (el) { el.focus(); resaltar(el); }
      } };
      if (a === 'instalar') return { etiqueta: 'Cómo instalarla', icono: 'descargar', hacer: function () { if (K.piezas.instalar) K.piezas.instalar.abrir(); } };
      return null;
    }
  };

  K.piezas.asistente.configurar({
    app: 'TESORERIA',
    base: window.ASISTENTE_BASE || [],
    adaptador: ADAPTADOR
  });

  window.TESORERIA_ASISTENTE = {
    adaptador: ADAPTADOR,
    entrada: ENTRADA,
    /* para las pruebas */
    _urgente: urgente, _dato: dato, _destinos: DESTINOS
  };
}());
