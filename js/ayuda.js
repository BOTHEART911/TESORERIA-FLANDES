/* ============================================================
   TESORERIA-FLANDES · AYUDA POR VISTA (Insights)
   Ecosistema Flandes · Fase 8

   El mismo patrón de las otras apps: cada vista tiene una GUÍA que habla
   de lo que hay en pantalla y PREGUNTAS RÁPIDAS con la respuesta
   calculada en el teléfono. Nada viaja al servidor ni pasa por una IA:
   los números salen de la lista que ya llegó.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var CTX = function () { return {}; };

  function ctx() { try { return CTX() || {}; } catch (e) { return {}; } }
  function nombre(s) {
    var t = K.piezas.personas ? K.piezas.personas.nombrePropio(s) : String(s || '');
    return t.replace(/ (De|Del|La|Las|Los|Y|E|En) /g, function (m) { return m.toLowerCase(); })
            .replace(/ (De|Del|La|Las|Los|Y|E|En) /g, function (m) { return m.toLowerCase(); });
  }
  function primerNombre(s) { return nombre(String(s || '').trim().split(/\s+/)[0] || ''); }
  function hola() { var y = ctx().yo || {}; return y.nombre ? primerNombre(y.nombre) + ', ' : ''; }
  function pesos(v) { return '$ ' + K.pesos(v || 0).replace(/^\$\s*/, ''); }
  function EG() { return window.EGRESOS || null; }
  function PG() { return window.PAGADAS || null; }
  function SO() { return window.SOLIS || null; }
  function IF() { return window.INFORMES || null; }
  function CF() { return window.CONFIGURACION || null; }
  function pend() { return EG() ? EG()._pendientes().filter(function (c) { return !c.error; }) : []; }
  function emit() { return EG() ? EG()._emitidos().filter(function (c) { return !c.error; }) : []; }

  function parseFecha(s) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(s || ''));
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  }
  function diasDe(f) {
    var d = parseFecha(f); if (!d) return null;
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return Math.round((hoy - d) / 864e5);
  }
  function listaCorta(filas, fmt, max) {
    max = max || 8;
    var t = filas.slice(0, max).map(fmt).join('\n');
    if (filas.length > max) t += '\n… y ' + (filas.length - max) + ' más.';
    return t;
  }

  var GUIAS = {

    inicio: function () {
      var n = EG() && EG()._bandeja() ? EG().contar() : null;
      var t = hola() + 'este es el inicio de Tesorería. ';
      if (n) {
        t += n.pendientes ? 'Hay **' + n.pendientes + ' órdenes de pago** esperando egreso (' + pesos(n.porGirar) + ' por girar)' : 'No hay órdenes de pago esperando egreso';
        t += n.emitidos ? ' y **' + n.emitidos + ' egresos** por marcar pagos. ' : '. ';
        if (n.sinComprobante) t += '**' + n.sinComprobante + '** cuentas pagadas esperan su comprobante. ';
      }
      t += 'Toca una cifra del resumen y la lista se abre ya filtrada.';
      var f = ctx().arranque && ctx().arranque.firmantes;
      if (f && !f.listo && f.faltan) t += ' Ojo: para crear egresos falta ' + f.faltan.join(', ') + '.';
      return {
        guia: t,
        botones: [
          { texto: '¿Cuál orden lleva más días esperando?', responde: function () {
              var c = pend();
              if (!c.length) return '¡Ninguna! No hay órdenes de pago esperando egreso.';
              var o = c.slice().sort(function (a, b) { return (diasDe(b.fechaOrden) || 0) - (diasDe(a.fechaOrden) || 0); });
              return listaCorta(o, function (x) {
                var d = diasDe(x.fechaOrden);
                return '· **' + nombre(x.nombre) + '** — orden ' + (x.orden || '—') + (d !== null ? ', hace ' + d + (d === 1 ? ' día' : ' días') : '') + ', ' + pesos(x.neto);
              }, 6);
            } },
          { texto: '¿Cuánto hay por girar y por pagar?', responde: function () {
              var p = pend(), e = emit();
              var sp = p.reduce(function (s, x) { return s + (Number(x.neto) || 0); }, 0);
              var se = e.reduce(function (s, x) { return s + (x.datos ? Number(x.datos.total) || 0 : Number(x.neto) || 0); }, 0);
              return 'Por hacer egreso: **' + p.length + '** cuentas, **' + pesos(sp) + '**.\nEgresos por pagar: **' + e.length + '**, **' + pesos(se) + '**.';
            } },
          { texto: '¿Cómo cambio mi foto?', responde: function () {
              return 'Toca tu foto (arriba a la derecha del saludo). La firma está en **MI FIRMA Y MI FOTO**.';
            } }
        ]
      };
    },

    pendientes: function () {
      return {
        guia: 'Las cuentas con **orden de pago**. El valor a girar es el **neto de la orden**: el que guardó Contabilidad o, si la orden se hizo con la app anterior, el que calcula el mismo motor (marca ORDEN APP ANTERIOR: compáralo con la orden en papel). ' +
              'Toca **Hacer egreso**; **Orden de pago** la abre en el visor.',
        botones: [
          { texto: '¿Qué estoy viendo?', responde: function () {
              var f = EG() ? EG()._filtradas() : [];
              var s = f.reduce(function (a, x) { return a + (Number(x.neto) || 0); }, 0);
              return 'Estás viendo **' + f.length + '** ' + (f.length === 1 ? 'cuenta' : 'cuentas') + ' que suman **' + pesos(s) + '** a girar.';
            } },
          { texto: '¿Cuáles son de la app anterior?', responde: function () {
              var c = pend().filter(function (x) { return x.netoFuente === 'MOTOR'; });
              if (!c.length) return 'Ninguna: todas las órdenes tienen el neto guardado por Contabilidad.';
              return 'Estas órdenes no guardaron el neto; lo calcula el motor de Contabilidad:\n' + listaCorta(c, function (x) { return '· **' + nombre(x.nombre) + '** — orden ' + (x.orden || '—') + ': ' + pesos(x.neto); }, 8);
            } },
          { texto: '¿A quién le falta la cuenta bancaria?', responde: function () {
              var c = pend().filter(function (x) { return !x.numeroCuenta || !x.banco; });
              return c.length ? listaCorta(c, function (x) { return '· **' + nombre(x.nombre) + '** — contrato ' + x.contrato; }) : 'Todos tienen banco y número de cuenta registrados. ✓';
            } }
        ]
      };
    },

    egreso: function () {
      return {
        guia: 'El egreso de UNA cuenta. Escribe solo los dígitos del **N° de egreso** (1234 → 2026001234), la **fecha** (hoy por defecto), el **valor pagado** y la **fuente** (el banco y la cuenta salen de la configuración). ' +
              'Con dos fuentes, agrega el segundo pago. Si el contrato tiene **embargo**, llega descontado con un check: desmárcalo solo si en este egreso no aplica (y levántalo en la tarjeta del contratista). Si lo girado no es el neto de la orden por otra razón (pago parcial, situación de fondos), escoge el motivo: sale como observación en el PDF. Girar más que la orden no se puede.',
        botones: [
          { texto: '¿Cuadra con la orden?', responde: function () {
              var c = EG() && EG()._actual(); if (!c) return 'Abre una cuenta.';
              var s = EG()._sel(c); if (!s) return 'Todavía no has escrito los pagos.';
              var r = EG()._revisar(c, s, false);
              if (!r.dif) return 'Sí: se giran **' + pesos(r.total) + '**, justo el neto de la orden. ✓';
              return 'Se giran **' + pesos(r.total) + '** y la orden dice **' + pesos(c.neto) + '**: diferencia de ' + pesos(r.dif) + (s.motivo.tipo ? ' (' + s.motivo.tipo + ').' : '. Falta escoger el motivo.');
            } },
          { texto: '¿De dónde sale el neto?', responde: function () {
              var c = EG() && EG()._actual(); if (!c) return 'Abre una cuenta.';
              var l = (c.aplicadas || []).map(function (a) { return '· ' + a.n + ': ' + pesos(a.v); }).join('\n');
              return 'Cobro ' + pesos(c.cobro) + (l ? '\n' + l : '') + '\nNeto **' + pesos(c.neto) + '** — ' + (c.netoFuente === 'ORDEN' ? 'guardado por Contabilidad en la orden.' : 'calculado por el motor de Contabilidad (orden de la app anterior).');
            } },
          { texto: '¿Con qué fuente se le pagó la vez pasada?', responde: function () {
              var c = EG() && EG()._actual(); if (!c) return 'Abre una cuenta.';
              var s = c.sugerida;
              return s && s.f1 ? 'La última vez: **' + s.f1 + '**' + (s.f2 ? ' y **' + s.f2 + '**' : '') + '. Por eso ya viene escogida.' : 'No hay pagos anteriores de este contrato en la hoja PAGOS.';
            } }
        ]
      };
    },

    emitidos: function () {
      return {
        guia: 'Los egresos hechos que esperan el pago. Revisa la **cuenta del contratista** y toca **Marcar cuenta paga**: la cuenta pasa a PAGADA, queda en PAGOS y al contratista le llega el aviso con el egreso (notificación, correo y WhatsApp). ' +
              'Los egresos de la app anterior piden aquí lo que se giró.',
        botones: [
          { texto: '¿Cuánto hay por pagar?', responde: function () {
              var f = EG() ? EG()._filtradasE() : [];
              var s = f.reduce(function (a, x) { return a + (x.datos ? Number(x.datos.total) || 0 : Number(x.neto) || 0); }, 0);
              return '**' + f.length + '** egresos por **' + pesos(s) + '**.';
            } },
          { texto: '¿Cuál es el más antiguo?', responde: function () {
              var e = emit().slice().sort(function (a, b) { return (diasDe(b.fechaEgreso) || 0) - (diasDe(a.fechaEgreso) || 0); });
              if (!e.length) return 'No hay egresos por pagar.';
              var x = e[0], d = diasDe(x.fechaEgreso);
              return '**' + nombre(x.nombre) + '**, egreso ' + (x.egreso || 'sin número') + (d !== null ? ', hace ' + d + (d === 1 ? ' día' : ' días') : '') + '.';
            } },
          { texto: '¿Alguno con diferencia?', responde: function () {
              var e = emit().filter(function (x) { return x.datos && x.datos.diferencia; });
              return e.length ? listaCorta(e, function (x) { return '· **' + nombre(x.nombre) + '** — ' + pesos(x.datos.diferencia) + ' (' + (x.datos.motivo ? x.datos.motivo.tipo : '') + ')'; }) : 'Ninguno: todos giran el neto de su orden.';
            } }
        ]
      };
    },

    pagadas: function () {
      return {
        guia: 'Todas las cuentas pagadas. Arranca en **Sin comprobante**: las que tienen egreso de esta app y todavía no tienen el soporte del banco. **Subir comprobante** acepta PDF o imagen (botón, arrastrar o Ctrl+V). ' +
              '**Abrir egreso** lo muestra y deja descargarlo' + (K.norm((ctx().yo || {}).rol) === 'INVITADO' ? '; al abrirlo queda tu **cierre de cuenta**.' : '.'),
        botones: [
          { texto: '¿Qué estoy viendo?', responde: function () {
              var f = PG() ? PG()._filtradas() : [];
              var s = f.reduce(function (a, x) { return a + (Number(x.valor) || 0); }, 0);
              return '**' + f.length + '** cuentas · ' + pesos(s) + ' · ' + (PG() ? PG()._textoRango().toLowerCase() : '') + '.';
            } },
          { texto: '¿Cuántas faltan por comprobante?', responde: function () {
              var n = PG() && PG()._datos() ? PG().contar() : null;
              return n ? '**' + n.sin + '** con egreso de esta app sin comprobante, ' + n.con + ' con comprobante y ' + n.viejas + ' de la app anterior.' : 'Todavía está cargando.';
            } }
        ]
      };
    },

    solicitudes: function () {
      return {
        guia: 'Lo que los contratistas le preguntan a Tesorería desde su app. Cada pendiente trae **sus cuentas** (orden, egreso y pago) para responder sin buscar. Tu respuesta le llega por WhatsApp y queda quién respondió.',
        botones: [
          { texto: '¿Cuántas faltan?', responde: function () {
              var d = SO() && SO()._datos(); if (!d) return 'Todavía está cargando.';
              var p = d.filter(function (x) { return x.estado === 'PENDIENTE'; });
              return p.length ? '**' + p.length + '** pendientes:\n' + listaCorta(p, function (x) { return '· **' + nombre(x.nombre) + '** (' + x.codigo + ', ' + x.fecha.slice(0, 10) + ')'; }, 6) : 'Ninguna: todas respondidas. ✓';
            } }
        ]
      };
    },

    informes: function () {
      var m = IF() && IF()._meta();
      return {
        guia: (m && m.todas ? 'Todo lo de Tesorería: escoge **egresos, pagos, solicitudes o cierres**, la persona y el periodo.' : 'Lo que has hecho en Tesorería: escoge **egresos, pagos, solicitudes o cierres** y el periodo.') +
              ' Descárgalo en **PDF** (por bloques, para leer) o en **Excel** (una fila por registro).',
        botones: [
          { texto: 'Resúmeme el periodo', responde: function () {
              var f = IF() ? IF()._filas() : []; var F = IF() && IF()._filtro();
              if (!F || !IF()._datos()) return 'Todavía está cargando.';
              if (!f.length) return 'No hay registros en este periodo.';
              return IF().TIPOS[F.tipo].cifras(f).map(function (c) { return '· ' + c[0] + ': **' + c[1] + '**'; }).join('\n');
            } },
          { texto: '¿Por mes?', responde: function () {
              var f = IF() ? IF()._filas() : []; if (!f.length) return 'No hay registros en este periodo.';
              var m2 = {};
              f.forEach(function (x) { var k = String(x.fecha || '').slice(0, 7) || 'sin fecha'; m2[k] = (m2[k] || 0) + 1; });
              return Object.keys(m2).sort().reverse().slice(0, 12).map(function (k) { return '· ' + k.split('-').reverse().join('/') + ': **' + m2[k] + '**'; }).join('\n');
            } }
        ]
      };
    },

    configuracion: function () {
      return {
        guia: 'Las **fuentes de destinación** (banco y N° de cuenta de cada una), las **firmas del egreso** (Aprobó: alcaldesa, Revisó: hacienda, y el sello), las **reglas** de la diferencia y, para ADMIN y PAGO, las **retenciones** de Contabilidad. Cada bloque tiene su botón Guardar.',
        botones: [
          { texto: '¿Qué falta por definir?', responde: function () {
              var c = CF() && CF()._cfg(); if (!c) return 'Todavía está cargando.';
              var f = [];
              if (c.estado && c.estado.faltan && c.estado.faltan.length) f.push('para los egresos: ' + c.estado.faltan.join(', '));
              if (c.reglas && c.reglas.cuentaDiferencia && !c.reglas.cuentaDiferencia.codigo) f.push('el código contable de la diferencia (hoy va solo como observación)');
              (c.retenciones || []).forEach(function (r) { if (!r.codigo) f.push('el código de ' + r.nombre); });
              return f.length ? '· ' + f.join('\n· ') : 'Nada: está todo definido. ✓';
            } },
          { texto: '¿Cuántas fuentes hay?', responde: function () {
              var c = CF() && CF()._cfg(); if (!c) return 'Todavía está cargando.';
              var b = {}; (c.destinaciones || []).forEach(function (d) { b[d.banco] = (b[d.banco] || 0) + 1; });
              return '**' + (c.destinaciones || []).length + '** fuentes:\n' + Object.keys(b).map(function (k) { return '· ' + k + ': ' + b[k]; }).join('\n');
            } }
        ]
      };
    },

    perfil: function () {
      return {
        guia: 'Tu **firma** queda en tu usuario de Tesorería: sube una foto de tu firma en papel blanco, arrástrala o pégala; la app quita el fondo y la recorta. Tu **foto** es la misma en todas las apps de la Alcaldía.',
        botones: [
          { texto: '¿Cómo tomo bien la foto de la firma?', responde: function () {
              return 'Firma con **tinta negra o azul oscura** en una hoja **blanca**, con buena luz y sin sombras. Toma la foto de cerca y derecha. Antes de guardar ves cómo queda.';
            } }
        ]
      };
    }
  };

  /* ══════════════ las vistas de oficina (las de Supervisión 6.3) ══════════════ */
  function CT() { return window.CONTRATISTAS || null; }
  function todas() { return CT() ? CT().todas() : []; }
  function top(filas, campo, n) {
    var m = {};
    filas.forEach(function (f) { var v = f[campo] || 'SIN DATO'; m[v] = (m[v] || 0) + 1; });
    return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }).slice(0, n || 99).map(function (k) { return { k: k, n: m[k] }; });
  }
  function fechaIso(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  function RQ() { return window.REQS || null; }
  function CM() { return window.COMUS || null; }
  function IN() { return window.INFORME || null; }

  GUIAS.contratistas = function () {
    return {
      guia: 'Todos los contratos de la Alcaldía. Empiezas viendo los **activos**; las pastillas cambian a inactivos o todos y suman **adicionados** o **cedidos**. ' +
            'En cada tarjeta: **Detalles** (la ficha), **Informe** (sus cuentas en PDF o Excel), **Requerimiento**, WhatsApp y Drive. Un contratista con dos contratos sale dos veces: cada tarjeta es un contrato.',
      botones: [
        { texto: '¿Qué estoy viendo?', responde: function (f) {
            var c = CT();
            return 'Estás viendo **' + f.length + '** ' + (f.length === 1 ? 'contrato' : 'contratos') + (c ? ': ' + c._filtros() : '') + '.';
          } },
        { texto: '¿Quiénes terminan pronto?', responde: function (f) {
            var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
            var p = f.filter(function (x) { var d = parseFecha(x.fin); return x.estado === 'ACTIVO' && d && (d - hoy) / 864e5 <= 30; });
            if (!p.length) return 'Ningún contrato activo en pantalla termina en los próximos 30 días.';
            return listaCorta(p, function (x) { return '· **' + nombre(x.nombre) + '** — contrato ' + x.contrato + ', termina el ' + x.fin; }, 8);
          } },
        { texto: '¿A quién le faltan fechas?', responde: function (f) {
            var s = f.filter(function (x) { return x.estado === 'ACTIVO' && (!x.inicio || !x.fin); });
            if (!s.length) return 'Todos los activos en pantalla tienen fecha de inicio y de terminación.';
            return 'Sin fecha de inicio o de terminación (sin ellas no salen sus formatos):\n' + listaCorta(s, function (x) { return '· **' + nombre(x.nombre) + '** — contrato ' + x.contrato; });
          } },
        { texto: '¿Los que tienen varios contratos?', responde: function () {
            var m = {};
            todas().forEach(function (x) { (m[x.doc] = m[x.doc] || []).push(x); });
            var v = Object.keys(m).filter(function (d) { return m[d].length > 1; });
            if (!v.length) return 'Nadie tiene más de un contrato.';
            return listaCorta(v, function (d) { return '· **' + nombre(m[d][0].nombre) + '** — ' + m[d].map(function (x) { return x.contrato + ' (' + x.estado.toLowerCase() + ')'; }).join(', '); });
          } }
      ],
      filas: function () { return CT() ? CT()._visibles() : []; },
      filtros: function () { return CT() ? CT()._filtros() : ''; },
      medidas: [
        { titulo: 'Contratos', calcula: function (f) { return f.length; } },
        { titulo: 'Activos', calcula: function (f) { return f.filter(function (x) { return x.estado === 'ACTIVO'; }).length; } },
        { titulo: 'Adicionados', calcula: function (f) { return f.filter(function (x) { return x.adic; }).length; } }
      ]
    };
  };

  GUIAS.contratista = function () {
    return {
      guia: 'La ficha del contrato: lo mismo que ve el contratista en su app, más sus datos personales y de pago. Arriba tienes **Informe** para descargar sus cuentas y **Requerimiento** para pedirle algo.',
      botones: [
        { texto: '¿Qué le falta a este contrato?', responde: function () {
            var d = CT() ? CT()._ficha() : null;
            if (!d) return 'La ficha todavía está cargando.';
            var c = d.contrato || {}, p = d.datos || {}, falta = [];
            if (!c.numProceso) falta.push('N° de proceso SECOP II');
            if (!c.fechaInicio) falta.push('fecha de inicio');
            if (!c.fechaTermino) falta.push('fecha de terminación');
            if (!c.rp) falta.push('RP');
            if (!p.firma) falta.push('firma');
            if (!p.numeroCuenta || !p.banco) falta.push('cuenta bancaria');
            if (!p.eps || !p.arl) falta.push('EPS o ARL');
            return falta.length ? 'Le falta: **' + falta.join(', ') + '**. Lo diligencia el contratista desde su app.' : 'No le falta nada: el contrato y sus datos están completos.';
          } }
      ]
    };
  };

  GUIAS.informe = function () {
    return {
      guia: 'Las cuentas de UN contrato (nunca se mezclan dos contratos de la misma persona). Arriba: valor, cobrado, pagado y saldo. ' +
            '**PDF** es un informe para leer, por bloques (puedes sumarle las actividades de cada obligación). **Excel** trae una fila por cuenta con todas las columnas, las mismas de Supervisión y Tesorería.',
      botones: [
        { texto: '¿Cómo va este contrato?', responde: function () {
            var d = IN() && IN()._datos(); if (!d) return 'Todavía está cargando.';
            var k = K.piezas.informeCuentas.cifras(d);
            return '**' + k.cuentas + '** cuentas' + (k.total ? ' de ' + k.total : '') + ': cobrado **' + pesos(k.cobrado) + '** (' + k.avance + '% del contrato), pagado **' + pesos(k.pagado) + '**, en trámite ' + pesos(k.enTramite) + '. Saldo por ejecutar **' + pesos(k.saldo) + '**.';
          } },
        { texto: '¿Cuál fue la última cuenta?', responde: function () {
            var d = IN() && IN()._datos(); if (!d || !d.cuentas.length) return 'Este contrato todavía no tiene cuentas.';
            var x = d.cuentas[d.cuentas.length - 1];
            return 'La **' + x.informe + (x.total ? ' de ' + x.total : '') + '**: ' + x.estado.toLowerCase() + ', ' + pesos(x.cobro) + (x.radicada ? ', radicada el ' + fechaIso(x.radicada) : '') +
              (x.egreso ? '. Egreso ' + x.egreso + (x.fechaEgreso ? ' del ' + fechaIso(x.fechaEgreso) : '') : '') + '.';
          } },
        { texto: '¿Cuadran los saldos?', responde: function () {
            var d = IN() && IN()._datos(); if (!d || !d.cuentas.length) return 'No hay cuentas.';
            var mal = [];
            d.cuentas.forEach(function (x, i) {
              if (Math.abs((x.saldo - x.cobro) - x.nuevo) > 1) mal.push('cuenta ' + x.informe + ': ' + pesos(x.saldo) + ' − ' + pesos(x.cobro) + ' ≠ ' + pesos(x.nuevo));
              var a = d.cuentas[i - 1];
              if (a && Math.abs(a.nuevo - x.saldo) > 1) mal.push('la ' + a.informe + ' dejó ' + pesos(a.nuevo) + ' y la ' + x.informe + ' arrancó en ' + pesos(x.saldo));
            });
            return mal.length ? '⚠ ' + mal.join('\n⚠ ') : 'Sí: cada saldo menos su cobro da el nuevo saldo y cada cuenta arranca donde terminó la anterior. ✓';
          } }
      ]
    };
  };

  GUIAS.requerimientos = function () {
    return {
      guia: 'En **Contratistas** eliges a quién pedirle algo (todos los contratistas): **Redactar**, o marca varios y redacta una sola vez (máximo 20). ' +
            'Le llega como notificación y por WhatsApp, firmado como Tesorería, y queda en su buzón. En **Historial** lo marcas **atendido** cuando lo resuelva.',
      botones: [
        { texto: '¿Cuántos siguen abiertos?', responde: function () {
            var d = RQ() && RQ()._datos(); if (!d) return 'Todavía está cargando.';
            var ab = d.lista.filter(function (r) { return r.estado !== 'ATENDIDO'; });
            if (!d.lista.length) return 'Todavía no has hecho requerimientos desde Tesorería.';
            return ab.length ? '**' + ab.length + '** abiertos de ' + d.lista.length + '.' : 'Ninguno: los ' + d.lista.length + ' están atendidos. ✓';
          } },
        { texto: '¿A quién no le llegó el aviso?', responde: function () {
            var d = RQ() && RQ()._datos(); if (!d) return 'Todavía está cargando.';
            var m = d.lista.filter(function (r) { return /falló|SIN/.test(r.aviso || ''); });
            return m.length ? listaCorta(m, function (r) { return '· **' + nombre(r.nombre) + '** (' + r.id + '): ' + r.aviso; }, 6) : 'A todos les salió el aviso por algún canal. ✓';
          } }
      ]
    };
  };

  GUIAS.comunicados = function () {
    return {
      guia: 'Toca **Nuevo comunicado**: escribe, adjunta documentos (PDF, fotos, Word, Excel…) y publica. Llega como notificación a los teléfonos de los contratistas. **Retirar** lo quita de su app sin borrarlo.',
      botones: [
        { texto: '¿Cuántos teléfonos lo reciben?', responde: function () {
            var d = CM() && CM()._datos(); if (!d) return 'Todavía está cargando.';
            return (d.telefonos === null || d.telefonos === undefined) ? 'No pude contar los teléfonos ahora.' : '**' + d.telefonos + '** teléfonos de contratistas tienen los avisos activados.';
          } },
        { texto: '¿Qué he publicado yo?', responde: function () {
            var d = CM() && CM()._datos(); if (!d) return 'Todavía está cargando.';
            var m = d.lista.filter(function (c) { return c.mio; });
            return m.length ? listaCorta(m, function (c) { return '· ' + (c.fecha ? fechaIso(c.fecha) + ' · ' : '') + (c.estado === 'RETIRADO' ? '(retirado) ' : '') + '«' + String(c.texto || '').slice(0, 60) + '»'; }, 6)
                            : 'Todavía no has publicado comunicados.';
          } }
      ]
    };
  };


  var TITULOS = { inicio: 'Tu inicio', pendientes: 'Egresos pendientes', egreso: 'El egreso', emitidos: 'Egresos emitidos',
                  pagadas: 'Cuentas pagadas', solicitudes: 'Solicitudes', informes: 'Mis informes',
                  contratistas: 'Contratistas', contratista: 'Ficha del contratista', informe: 'Informe de cuentas',
                  requerimientos: 'Requerimientos', comunicados: 'Comunicados', configuracion: 'Configuración', perfil: 'Mi firma y mi foto' };

  function montar(vista, extra) {
    if (!K.piezas.insights) return;
    var g = GUIAS[vista];
    if (!g) return;
    var base = g();
    var cfg = {
      vista: (extra && extra.vista) || TITULOS[vista] || vista,
      guia: function () { return g().guia; },
      botones: base.botones || [],
      alto: !!base.alto
    };
    if (base.filas) { cfg.filas = base.filas; cfg.medidas = base.medidas; cfg.filtros = base.filtros; }
    K.piezas.insights.montar(cfg);
  }

  window.AYUDA = {
    configurar: function (fn) { if (typeof fn === 'function') CTX = fn; },
    montar: montar,
    tiene: function (v) { return !!GUIAS[v]; },
    _guias: GUIAS
  };
}());
