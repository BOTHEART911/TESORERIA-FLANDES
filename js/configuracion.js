/* ============================================================
   TESORERIA-FLANDES · CONFIGURACIÓN
   Ecosistema Flandes · Fase 8

   UNA llamada ('configuracion') trae todo lo de esta vista:
     · MI FIRMA Y MI FOTO: la firma personal (queda en USUARIOS) y la foto.
     · FUENTES DE DESTINACIÓN: nombre, banco y N° de cuenta (DESTINACIONES).
       Es la lista que se escoge en cada pago del egreso.
     · FIRMAS DEL EGRESO (ADMIN): alcaldesa, secretaria de hacienda, el
       sello y quién va en "Modificó" (vacío = el INVITADO activo).
     · REGLAS DEL EGRESO: motivos de diferencia, fuentes que admiten 0 y la
       cuenta contable de la diferencia (si se deja vacía, la diferencia va
       solo como observación).
     · RETENCIONES (solo con el permiso 'retenciones'): las mismas de
       Contabilidad; el editor es el mismo.
   Guardar es una llamada por bloque ('configGuardar', 'firmaFijaGuardar',
   'firmaGuardar') y la respuesta trae la configuración nueva.
   ============================================================ */
(function () {
  'use strict';

  var K = window.KIT;
  var C = {};
  var CFG = null;
  var SOLO_FIRMA = false;

  var TIPOS_BASE = [{ v: 'COBRO', t: 'El cobro de la cuenta' }, { v: 'TRAMO', t: 'El valor del tramo (contrato o adición)' }, { v: 'IVA', t: 'El IVA incluido en el cobro' }];
  var TIPO_CORTO = {
    'PRESTACION DE SERVICIOS PROFESIONALES': 'Profesionales',
    'PRESTACION DE SERVICIOS DE APOYO A LA GESTION': 'Apoyo a la gestión',
    'PRESTACION DE SERVICIOS': 'Prestación de servicios',
    'CONVENIO DE COOPERACION': 'Convenio de cooperación'
  };

  function O() { return window.OFICINA; }
  function nombre(s) { return K.piezas.personas ? K.piezas.personas.nombrePropio(s) : String(s || ''); }
  function tipoCorto(t) { return TIPO_CORTO[K.norm(t)] || O().titulo(t) || '—'; }
  function copia(x) { return JSON.parse(JSON.stringify(x || null)); }

  /** sub = 'firma' → solo MI FIRMA Y MI FOTO. */
  function vista(sub) {
    SOLO_FIRMA = sub === 'firma';
    var caja = K.nodo('<div class="kit-ancho vista cf tg"></div>');
    C.app.appendChild(caja);
    if (SOLO_FIRMA) O().cabecera(caja, 'lapiz', 'MI FIRMA Y MI FOTO', 'Tu firma y tu foto de perfil (la misma foto en todas las apps de la Alcaldía).');
    else O().cabecera(caja, 'herramienta', 'CONFIGURACIÓN',
      'Las fuentes con las que se paga, las firmas que salen en el comprobante de egreso y sus reglas. Lo que cambies vale desde el próximo egreso.');
    var zona = K.nodo('<div class="cf-zona"></div>');
    caja.appendChild(zona);
    K.piezas.esqueletos.mientras(zona, O().leer('configuracion'), { forma: 'ficha', cuantos: 2, espera: 'Cargando la configuración' })
      .then(function (d) { CFG = d; pintar(zona); })
      ['catch'](function (e) { zona.appendChild(C.errorCaja(e)); });
    K.piezas.creditos.montar(caja);
  }

  function pintar(zona) {
    zona.innerHTML = '';
    zona.appendChild(bloqueFirma());
    if (SOLO_FIRMA) return;
    zona.appendChild(bloqueFuentes());
    zona.appendChild(bloqueFirmantes());
    zona.appendChild(bloqueReglas());
    if (CFG.puedeRetenciones) zona.appendChild(bloqueRetenciones());
  }

  function alGuardar(r, zona) {
    CFG = r.config || CFG;
    if (window.EGRESOS) window.EGRESOS.soltar();   /* la bandeja trae fuentes, reglas y firmas: se vuelve a pedir */
    pintar(zona);
  }

  function guardar(que, valor, boton) {
    var datos = {}; datos[que] = valor;
    var zona = boton.closest('.cf-zona');
    boton.disabled = true;
    return K.piezas.guardado.mientras(K.pedir('configGuardar', datos, { ms: 60000 }), {
      titulo: 'Guardando la configuración', sub: 'Vale desde el próximo egreso.',
      pasos: ['Revisando los valores…', 'Guardando en CONFIG…'], listo: { titulo: 'Configuración guardada', paso: 'Lista para el próximo egreso' }
    }).then(function (r) { alGuardar(r, zona); }, function (e) { boton.disabled = false; K.aviso((e && e.message) || 'No se pudo guardar.', 'malo', 7000); });
  }

  function seccion(icono, titulo, texto) {
    return K.nodo('<section class="kit-tarjeta grupo cf-bloque"><h3 class="grupo__t">' + K.icono(icono, 16) + ' ' + K.esc(titulo) + '</h3>' +
      (texto ? '<p class="formulario__nota">' + texto + '</p>' : '') + '</section>');
  }

  /* ══════════════ MI FIRMA Y MI FOTO ══════════════ */

  function bloqueFirma() {
    var f = (CFG && CFG.firma) || {};
    var s = seccion('lapiz', 'MI FIRMA Y MI FOTO', 'Tu firma personal queda guardada en tu usuario de Tesorería. El comprobante de egreso sale con las firmas fijas de abajo (alcaldesa, hacienda y sello).');
    var yo = (C.yo && C.yo()) || {};
    var fila = K.nodo('<div class="cf-firma"></div>');
    if (K.piezas.perfil) {
      var gf = K.nodo('<div class="cf-foto"></div>');
      gf.appendChild(K.piezas.perfil.cara(yo.nombre || '', C.miFoto ? C.miFoto(200) : '', { tam: 88, fotoActual: function () { return C.miFoto ? C.miFoto(512) : ''; } }));
      var bf = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('camara', 16) + ' Cambiar mi foto</button>');
      bf.addEventListener('click', function () { if (C.abrirFoto) C.abrirFoto(); });
      gf.appendChild(bf);
      fila.appendChild(gf);
    }
    var gd = K.nodo('<div class="cf-firma__zona"></div>');
    var marco = K.nodo('<div class="pf-marco cf-soltar" tabindex="0" aria-label="Firma: arrastra o pega aquí la imagen"></div>');
    function pintarMarco(src) {
      marco.innerHTML = '';
      if (src) { var img = K.nodo('<img class="pf-img" alt="Tu firma">'); img.src = src; marco.appendChild(img); }
      else marco.appendChild(K.nodo('<p class="formulario__nota formulario__nota--fuerte">Todavía no tienes firma cargada.</p>'));
      marco.appendChild(K.nodo('<p class="cf-soltar__t">' + K.icono('arrastrar', 14) + ' Arrastra aquí la foto de tu firma o pégala (Ctrl+V)</p>'));
    }
    pintarMarco(f.mini || '');
    gd.appendChild(marco);
    var inp = K.nodo('<input type="file" accept="image/png,image/jpeg,image/webp" hidden>');
    var elegir = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('camara', 16) + ' ' + (f.mini ? 'Cambiar mi firma' : 'Subir mi firma') + '</button>');
    elegir.addEventListener('click', function () { inp.click(); });
    gd.appendChild(inp); gd.appendChild(elegir);
    var prev = K.nodo('<div class="pf-prev" hidden></div>');
    gd.appendChild(prev);
    function tomar(file) {
      if (!file || !/^image\//.test(file.type)) { K.aviso('Elige una imagen (la foto de la firma).', 'aviso', 4000); return; }
      limpiarFirma(file).then(function (png) { previa(png); }, function (e) { K.aviso((e && e.message) || 'No se pudo leer la imagen.', 'malo', 5000); });
    }
    inp.addEventListener('change', function () { var file = inp.files && inp.files[0]; inp.value = ''; tomar(file); });
    ['dragenter', 'dragover'].forEach(function (ev) { marco.addEventListener(ev, function (e) { e.preventDefault(); marco.classList.add('cf-soltar--sobre'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { marco.addEventListener(ev, function () { marco.classList.remove('cf-soltar--sobre'); }); });
    marco.addEventListener('drop', function (e) { e.preventDefault(); var fl = e.dataTransfer && e.dataTransfer.files; if (fl && fl[0]) tomar(fl[0]); });
    marco.addEventListener('paste', function (e) { pegar(e); });
    s.addEventListener('paste', function (e) { pegar(e); });
    function pegar(e) {
      var it = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < it.length; i++) if (/^image\//.test(it[i].type)) { e.preventDefault(); tomar(it[i].getAsFile()); return; }
    }
    function previa(png) {
      prev.hidden = false; prev.innerHTML = '';
      prev.appendChild(K.nodo('<p class="grupo__t">Así va a quedar</p>'));
      var m = K.nodo('<div class="pf-marco pf-marco--previa"><img class="pf-img" alt="Vista previa de la firma"></div>');
      m.querySelector('img').src = png;
      prev.appendChild(m);
      var a = K.nodo('<div class="ct-acc"></div>');
      var no = K.nodo('<button type="button" class="kit-btn kit-btn--plano">Cancelar</button>');
      var si = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('check', 16) + ' Guardar firma</button>');
      no.addEventListener('click', function () { prev.hidden = true; prev.innerHTML = ''; });
      si.addEventListener('click', function () {
        si.disabled = true; no.disabled = true;
        K.piezas.guardado.mientras(K.pedir('firmaGuardar', { imagen: png }, { ms: 90000 }), {
          titulo: 'Guardando tu firma', sub: 'No cierres la app.',
          pasos: ['Subiendo la firma…', 'Guardándola en tu usuario…', 'Listo'],
          listo: { titulo: 'Firma guardada', paso: 'Queda en tu usuario de Tesorería' }
        }).then(function (r) {
          pintarMarco(png);
          prev.hidden = true; prev.innerHTML = '';
          elegir.innerHTML = K.icono('camara', 16) + ' Cambiar mi firma';
          if (CFG) CFG.firma = { id: r.id, mini: r.mini };
          if (C.alFirma) C.alFirma(r);
        }, function (e) { si.disabled = false; no.disabled = false; K.aviso((e && e.message) || 'No se pudo guardar la firma.', 'malo', 7000); });
      });
      a.appendChild(no); a.appendChild(si);
      prev.appendChild(a);
    }
    fila.appendChild(gd);
    s.appendChild(fila);
    return s;
  }

  /** La foto de la firma → PNG transparente y recortado (igual que en Supervisión). */
  function limpiarFirma(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var escala = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
          var w = Math.max(1, Math.round(img.naturalWidth * escala)), h = Math.max(1, Math.round(img.naturalHeight * escala));
          var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          var cx = cv.getContext('2d');
          cx.drawImage(img, 0, 0, w, h);
          var d = cx.getImageData(0, 0, w, h), p = d.data;
          var x0 = w, y0 = h, x1 = -1, y1 = -1;
          for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
              var i = (y * w + x) * 4;
              var luz = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
              var alfa = luz >= 200 ? 0 : (luz <= 140 ? 255 : Math.round((200 - luz) * 255 / 60));
              p[i + 3] = Math.min(p[i + 3], alfa);
              if (p[i + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            }
          }
          URL.revokeObjectURL(url);
          if (x1 < 0) { rej(new Error('No se ve ningún trazo: toma la foto con más luz y la firma en tinta oscura.')); return; }
          cx.putImageData(d, 0, 0);
          var m = Math.round(Math.max(w, h) * 0.02);
          x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
          var cw = x1 - x0 + 1, ch = y1 - y0 + 1;
          var f = Math.min(1, 900 / cw);
          var out = document.createElement('canvas'); out.width = Math.round(cw * f); out.height = Math.round(ch * f);
          out.getContext('2d').drawImage(cv, x0, y0, cw, ch, 0, 0, out.width, out.height);
          res(out.toDataURL('image/png'));
        } catch (e) { rej(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('No se pudo leer la imagen.')); };
      img.src = url;
    });
  }

  /* ══════════════ RETENCIONES ══════════════ */

  function campo(etq, input, clase) {
    var l = K.nodo('<label class="op-campo' + (clase ? ' ' + clase : '') + '"><span>' + K.esc(etq) + '</span></label>');
    l.appendChild(input);
    return l;
  }
  function entrada(v, extra) { var i = K.nodo('<input' + (extra || '') + '>'); i.value = v === undefined || v === null ? '' : v; return i; }
  function selector(ops, v) {
    var s = K.nodo('<select class="op-select"></select>');
    ops.forEach(function (o) { var x = document.createElement('option'); x.value = o.v; x.textContent = o.t; if (o.v === v) x.selected = true; s.appendChild(x); });
    return s;
  }
  function interruptor(texto, v) {
    var l = K.nodo('<label class="op-check cf-sw"><input type="checkbox"><span></span></label>');
    l.querySelector('span').textContent = texto;
    l.querySelector('input').checked = !!v;
    return l;
  }

  function bloqueRetenciones() {
    var lista = copia((CFG && CFG.retenciones) || []);
    var tipos = (CFG && CFG.tipos) || [];
    var s = seccion('check', 'RETENCIONES Y DESCUENTOS',
      'Son las de <b>Contabilidad</b>: cada fila es un check de la orden de pago y el cambio vale desde la próxima orden. <b>Automática</b>: se aplica siempre y no se desmarca (ReteICA). ' +
      '<b>Solo primera cuenta</b>: únicamente en la primera cuenta del contrato primario, de la 1ª o de la 2ª adición (las estampillas).');
    var zona = K.nodo('<div class="cf-ret"></div>');
    s.appendChild(zona);

    function tarjetaRet(r, idx) {
      var t = K.nodo('<article class="cf-item' + (r.activa === false ? ' cf-item--off' : '') + '"></article>');
      var cab = K.nodo('<div class="cf-item__cab"><b></b><button type="button" class="kit-btn kit-btn--plano op-mini cf-quitar" title="Quitar">' + K.icono('basura', 14) + '</button></div>');
      cab.querySelector('b').textContent = r.nombre || 'Nueva retención';
      cab.querySelector('.cf-quitar').addEventListener('click', function () {
        K.piezas.confirmar.preguntar({ titulo: 'Quitar ' + (r.nombre || 'esta retención'), texto: 'Deja de salir en las órdenes de pago nuevas. Las ya creadas no cambian.', si: 'Quitar', peligro: true })
          .then(function (si) { if (si) { lista.splice(idx, 1); dibujar(); } });
      });
      t.appendChild(cab);
      var g = K.nodo('<div class="cf-item__campos"></div>');
      var nom = entrada(r.nombre, ' maxlength="80"'); nom.addEventListener('input', function () { r.nombre = nom.value; cab.querySelector('b').textContent = nom.value; });
      var cod = entrada(r.codigo, ' inputmode="numeric" maxlength="12" placeholder="Código contable"'); cod.addEventListener('input', function () { r.codigo = cod.value.replace(/\D/g, ''); cod.value = r.codigo; });
      var tip = entrada(r.tipo, ' maxlength="12" placeholder="EST, I.C.A., Fuente"'); tip.addEventListener('input', function () { r.tipo = tip.value; });
      var pct = entrada(String(r.porcentaje === undefined ? '' : r.porcentaje).replace('.', ','), ' inputmode="decimal" maxlength="6"');
      pct.addEventListener('input', function () { r.porcentaje = Number(pct.value.replace(',', '.')) || 0; });
      var base = selector(TIPOS_BASE, r.base || 'COBRO'); base.addEventListener('change', function () { r.base = base.value; });
      g.appendChild(campo('Nombre', nom, 'cf-ancho'));
      g.appendChild(campo('Código', cod));
      g.appendChild(campo('Tipo (columna del PDF)', tip));
      g.appendChild(campo('Porcentaje %', pct));
      g.appendChild(campo('Se calcula sobre', base, 'cf-ancho'));
      t.appendChild(g);
      var sws = K.nodo('<div class="cf-item__sw"></div>');
      [['activa', 'Encendida', r.activa !== false], ['automatica', 'Automática', r.automatica], ['soloPrimeraCuenta', 'Solo primera cuenta del tramo', r.soloPrimeraCuenta],
       ['porDefecto', 'Marcada por defecto', r.porDefecto]].forEach(function (x) {
        var sw = interruptor(x[1], x[2]);
        sw.querySelector('input').addEventListener('change', function (e) { r[x[0]] = e.target.checked; if (x[0] === 'activa') t.classList.toggle('cf-item--off', !e.target.checked); });
        sws.appendChild(sw);
      });
      t.appendChild(sws);
      /* a qué tipos de contrato aplica */
      var zt = K.nodo('<div class="cf-tipos"><span class="kit-exp__et">Aplica a</span></div>');
      var todos = (r.tipos || []).indexOf('*') >= 0;
      var chTodos = interruptor('Todos los tipos', todos);
      zt.appendChild(chTodos);
      var chs = [];
      tipos.forEach(function (tp) {
        var ch = interruptor(tipoCorto(tp), todos || (r.tipos || []).some(function (x) { return K.norm(x) === K.norm(tp); }));
        ch.querySelector('input').disabled = todos;
        ch.querySelector('input').addEventListener('change', function () { r.tipos = chs.filter(function (c) { return c.el.querySelector('input').checked; }).map(function (c) { return c.tipo; }); });
        chs.push({ el: ch, tipo: tp });
        zt.appendChild(ch);
      });
      chTodos.querySelector('input').addEventListener('change', function (e) {
        chs.forEach(function (c) { c.el.querySelector('input').disabled = e.target.checked; c.el.querySelector('input').checked = e.target.checked || c.el.querySelector('input').checked; });
        r.tipos = e.target.checked ? ['*'] : chs.filter(function (c) { return c.el.querySelector('input').checked; }).map(function (c) { return c.tipo; });
      });
      t.appendChild(zt);
      /* a cuál reemplaza */
      var otras = lista.filter(function (x) { return x !== r && x.codigo; });
      if (otras.length) {
        var zr = K.nodo('<div class="cf-tipos"><span class="kit-exp__et">Cuando se marca, quita</span></div>');
        otras.forEach(function (x) {
          var ch = interruptor(x.nombre, (r.excluye || []).indexOf(x.codigo) >= 0);
          ch.querySelector('input').addEventListener('change', function (e) {
            r.excluye = (r.excluye || []).filter(function (k) { return k !== x.codigo; });
            if (e.target.checked) r.excluye.push(x.codigo);
          });
          zr.appendChild(ch);
        });
        t.appendChild(zr);
      }
      if (r.nota) t.appendChild(K.nodo('<p class="op-nota">' + K.icono('info', 13) + ' ' + K.esc(r.nota) + '</p>'));
      return t;
    }

    function dibujar() {
      zona.innerHTML = '';
      lista.forEach(function (r, i) { zona.appendChild(tarjetaRet(r, i)); });
    }
    dibujar();
    var acc = K.nodo('<div class="ct-acc"></div>');
    var mas = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('mas', 16) + ' Agregar retención</button>');
    mas.addEventListener('click', function () {
      lista.push({ codigo: '', nombre: '', tipo: 'Fuente', porcentaje: 0, base: 'COBRO', soloPrimeraCuenta: false, automatica: false, porDefecto: false, activa: true, tipos: ['*'] });
      dibujar();
    });
    var g = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('check', 16) + ' Guardar retenciones</button>');
    g.addEventListener('click', function () {
      var mal = lista.filter(function (r) { return !String(r.nombre || '').trim(); });
      if (mal.length) { K.aviso('Hay una retención sin nombre.', 'aviso', 4000); return; }
      guardar('retenciones', lista, g);
    });
    acc.appendChild(mas); acc.appendChild(g);
    s.appendChild(acc);
    return s;
  }


  /* ══════════════ FUENTES DE DESTINACIÓN ══════════════ */

  function bloqueFuentes() {
    var lista = copia((CFG && CFG.destinaciones) || []);
    var s = seccion('moneda', 'FUENTES DE DESTINACIÓN',
      'Cada fuente con su banco y su N° de cuenta. Es lo que se escoge en cada pago del egreso; el banco y la cuenta salen de aquí en el PDF, en DETALLES DE PAGO y en la hoja PAGOS.');
    var zona = K.nodo('<div class="cf-ret"></div>');
    s.appendChild(zona);
    function dibujar() {
      zona.innerHTML = '';
      lista.forEach(function (x, i) {
        var t = K.nodo('<article class="cf-item cf-item--fila tg-fuente"></article>');
        var n = entrada(x.name, ' maxlength="90"'), b = entrada(x.banco, ' maxlength="60"'), c = entrada(x.numCuenta, ' inputmode="numeric" maxlength="20"');
        n.addEventListener('input', function () { x.name = n.value.toUpperCase(); });
        b.addEventListener('input', function () { x.banco = b.value.toUpperCase(); });
        c.addEventListener('input', function () { x.numCuenta = c.value.replace(/\D/g, ''); c.value = x.numCuenta; });
        var q = K.nodo('<button type="button" class="kit-btn kit-btn--plano op-mini" title="Quitar">' + K.icono('basura', 14) + '</button>');
        q.addEventListener('click', function () {
          K.piezas.confirmar.preguntar({ titulo: 'Quitar ' + (x.name || 'esta fuente'), texto: 'Deja de salir para escoger en los egresos nuevos. Los ya hechos no cambian.', si: 'Quitar', peligro: true })
            .then(function (si) { if (si) { lista.splice(i, 1); dibujar(); } });
        });
        t.appendChild(campo('Fuente', n, 'cf-ancho')); t.appendChild(campo('Banco', b)); t.appendChild(campo('N° de cuenta', c)); t.appendChild(q);
        zona.appendChild(t);
      });
    }
    dibujar();
    var acc = K.nodo('<div class="ct-acc"></div>');
    var mas = K.nodo('<button type="button" class="kit-btn kit-btn--plano">' + K.icono('mas', 16) + ' Agregar fuente</button>');
    mas.addEventListener('click', function () { lista.push({ name: '', banco: '', numCuenta: '' }); dibujar(); var u = zona.querySelectorAll('input'); if (u.length) u[u.length - 3].focus(); });
    var g = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('check', 16) + ' Guardar fuentes</button>');
    g.addEventListener('click', function () {
      var mal = lista.filter(function (x) { return !String(x.name || '').trim() || !String(x.banco || '').trim() || !/^\d{4,20}$/.test(x.numCuenta || ''); });
      if (mal.length) { K.aviso('Cada fuente necesita nombre, banco y N° de cuenta (solo números).', 'aviso', 5000); return; }
      guardar('destinaciones', lista, g);
    });
    acc.appendChild(mas); acc.appendChild(g);
    s.appendChild(acc);
    return s;
  }

  /* ══════════════ FIRMAS DEL EGRESO ══════════════ */

  /** El sello conserva su color: solo se vuelve transparente el fondo casi blanco. */
  function limpiarSello(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var escala = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
          var w = Math.max(1, Math.round(img.naturalWidth * escala)), h = Math.max(1, Math.round(img.naturalHeight * escala));
          var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          var cx = cv.getContext('2d');
          cx.drawImage(img, 0, 0, w, h);
          var d = cx.getImageData(0, 0, w, h), p = d.data;
          for (var i = 0; i < p.length; i += 4) {
            var luz = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
            if (luz >= 235) p[i + 3] = 0;
          }
          cx.putImageData(d, 0, 0);
          URL.revokeObjectURL(url);
          res(cv.toDataURL('image/png'));
        } catch (e) { rej(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('No se pudo leer la imagen.')); };
      img.src = url;
    });
  }

  function bloqueFirmantes() {
    var f = copia((CFG && CFG.firmantes) || {});
    var est = (CFG && CFG.estado) || {};
    var puede = !!(CFG && CFG.puedeFirmas);
    var s = seccion('lapiz', 'FIRMAS DEL EGRESO',
      'Salen en todos los comprobantes de egreso. ' + (puede ? 'Cambia el nombre, el cargo o la imagen de cada una.' : 'Solo ADMIN las cambia.') +
      ' En <b>Modificó</b> va el nombre escrito aquí o, si se deja vacío, el usuario INVITADO activo' + (f.modificoActual ? ' (hoy <b>' + K.esc(nombre(f.modificoActual)) + '</b>)' : '') + '.');
    if (est.faltan && est.faltan.length) s.appendChild(K.nodo('<p class="op-nota op-nota--aviso">' + K.icono('aviso', 14) + ' Para crear egresos falta ' + K.esc(est.faltan.join(', ')) + '.</p>'));
    var rej = K.nodo('<div class="tg-firmas"></div>');
    s.appendChild(rej);
    [['alcaldesa', 'Alcaldesa'], ['hacienda', 'Secretaría de Hacienda'], ['sello', 'Sello de Hacienda']].forEach(function (par) {
      var k = par[0], x = f[k] || {};
      var t = K.nodo('<article class="cf-item tg-firma"><div class="cf-item__cab"><b></b></div><div class="pf-marco tg-firma__img"></div></article>');
      t.querySelector('b').textContent = par[1];
      var marco = t.querySelector('.tg-firma__img');
      function pintarImg(src) { marco.innerHTML = src ? '' : '<p class="formulario__nota formulario__nota--fuerte">Sin imagen</p>'; if (src) { var im = K.nodo('<img class="pf-img" alt="">'); im.src = src; marco.appendChild(im); } }
      pintarImg(x.mini);
      if (k !== 'sello') {
        var n = entrada(x.nombre, ' maxlength="80"'), c = entrada(x.cargo, ' maxlength="60"');
        n.disabled = c.disabled = !puede;
        n.addEventListener('input', function () { x.nombre = n.value; });
        c.addEventListener('input', function () { x.cargo = c.value; });
        var g = K.nodo('<div class="cf-item__campos"></div>');
        g.appendChild(campo('Nombre', n, 'cf-ancho')); g.appendChild(campo('Cargo', c, 'cf-ancho'));
        t.appendChild(g);
      }
      if (puede) {
        var inp = K.nodo('<input type="file" accept="image/png,image/jpeg,image/webp" hidden>');
        var bt = K.nodo('<button type="button" class="kit-btn kit-btn--plano op-mini">' + K.icono('camara', 14) + ' Cambiar imagen</button>');
        bt.addEventListener('click', function () { inp.click(); });
        inp.addEventListener('change', function () {
          var file = inp.files && inp.files[0]; inp.value = '';
          if (!file) return;
          (k === 'sello' ? limpiarSello(file) : limpiarFirma(file)).then(function (png) {
            return K.piezas.confirmar.preguntar({ titulo: 'Cambiar ' + par[1].toLowerCase(), texto: 'Sale así en todos los egresos desde ahora.', si: 'Cambiar', no: 'Cancelar' }).then(function (si) {
              if (!si) return;
              return K.piezas.guardado.mientras(K.pedir('firmaFijaGuardar', { cual: k, imagen: png }, { ms: 90000 }), {
                titulo: 'Guardando la imagen', sub: 'Queda en la carpeta PLANTILLAS.', pasos: ['Subiendo…', 'Guardando en CONFIG…'],
                listo: { titulo: 'Imagen guardada', paso: 'Lista para el próximo egreso' }
              }).then(function (r) { pintarImg(r.mini || png); if (CFG) { CFG.estado = r.estado; CFG.firmantes[k].mini = r.mini; } if (window.EGRESOS) window.EGRESOS.soltar(); });
            });
          })['catch'](function (e) { K.aviso((e && e.message) || 'No se pudo guardar la imagen.', 'malo', 7000); });
        });
        t.appendChild(inp); t.appendChild(bt);
      }
      rej.appendChild(t);
    });
    var mo = entrada(f.modifico || '', ' maxlength="80" placeholder="(vacío = el INVITADO activo)"');
    mo.disabled = !puede;
    mo.addEventListener('input', function () { f.modifico = mo.value; });
    s.appendChild(campo('Modificó', mo, 'cf-ancho'));
    if (puede) {
      var acc = K.nodo('<div class="ct-acc"></div>');
      var g = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('check', 16) + ' Guardar nombres</button>');
      g.addEventListener('click', function () {
        guardar('firmantes', { alcaldesa: { nombre: f.alcaldesa.nombre, cargo: f.alcaldesa.cargo }, hacienda: { nombre: f.hacienda.nombre, cargo: f.hacienda.cargo }, modifico: f.modifico || '' }, g);
      });
      acc.appendChild(g);
      s.appendChild(acc);
    }
    return s;
  }

  /* ══════════════ REGLAS DEL EGRESO ══════════════ */

  function bloqueReglas() {
    var r = copia((CFG && CFG.reglas) || {});
    r.cuentaDiferencia = r.cuentaDiferencia || { codigo: '', nombre: 'Embargos y deducciones' };
    r.motivos = r.motivos || ['OTRO'];
    r.ceroPermitido = r.ceroPermitido || [];
    var s = seccion('info', 'REGLAS DEL EGRESO',
      'Si lo girado no es el neto de la orden de pago, se exige uno de estos <b>motivos</b> y queda como observación en el PDF. ' +
      'Con código en la <b>cuenta de la diferencia</b>, además sale como línea contable (débito a la cuenta del beneficiario y crédito a esa cuenta).');
    var cod = entrada(r.cuentaDiferencia.codigo, ' inputmode="numeric" maxlength="12" placeholder="Sin código: solo observación"');
    var nom = entrada(r.cuentaDiferencia.nombre, ' maxlength="80"');
    cod.addEventListener('input', function () { r.cuentaDiferencia.codigo = cod.value.replace(/\D/g, ''); cod.value = r.cuentaDiferencia.codigo; });
    nom.addEventListener('input', function () { r.cuentaDiferencia.nombre = nom.value; });
    var g1 = K.nodo('<div class="cf-item__campos"></div>');
    g1.appendChild(campo('Cuenta de la diferencia · código', cod)); g1.appendChild(campo('Nombre de la cuenta', nom, 'cf-ancho'));
    s.appendChild(g1);
    var zm = K.nodo('<div class="cf-tipos"><span class="kit-exp__et">Motivos de diferencia</span><div class="cf-chips tg-motivos"></div></div>');
    var chips = zm.querySelector('.tg-motivos');
    function dibujarMotivos() {
      chips.innerHTML = '';
      r.motivos.forEach(function (m, i) {
        var c = K.nodo('<span class="ct-marca tg-chip"></span>');
        c.textContent = m;
        if (K.norm(m) !== 'OTRO') {
          var x = K.nodo('<button type="button" class="tg-chip__x" aria-label="Quitar">' + K.icono('cerrar', 11) + '</button>');
          x.addEventListener('click', function () { r.motivos.splice(i, 1); dibujarMotivos(); });
          c.appendChild(x);
        }
        chips.appendChild(c);
      });
      var nuevo = entrada('', ' maxlength="40" placeholder="Agregar motivo" class="tg-chip__in"');
      nuevo.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var v = nuevo.value.trim().toUpperCase();
        if (v && r.motivos.map(K.norm).indexOf(K.norm(v)) < 0) { r.motivos.splice(Math.max(0, r.motivos.length - 1), 0, v); dibujarMotivos(); }
      });
      chips.appendChild(nuevo);
    }
    dibujarMotivos();
    s.appendChild(zm);
    var zc = K.nodo('<div class="cf-tipos"><span class="kit-exp__et">Fuentes que admiten valor 0 (regalías)</span></div>');
    ((CFG && CFG.destinaciones) || []).forEach(function (d) {
      var ch = interruptor(d.name, r.ceroPermitido.some(function (x) { return K.norm(x) === K.norm(d.name); }));
      ch.querySelector('input').addEventListener('change', function (e) {
        r.ceroPermitido = r.ceroPermitido.filter(function (x) { return K.norm(x) !== K.norm(d.name); });
        if (e.target.checked) r.ceroPermitido.push(d.name);
      });
      zc.appendChild(ch);
    });
    s.appendChild(zc);
    var acc = K.nodo('<div class="ct-acc"></div>');
    var g = K.nodo('<button type="button" class="kit-btn kit-btn--marca">' + K.icono('check', 16) + ' Guardar reglas</button>');
    g.addEventListener('click', function () { guardar('reglas', { cuentaDiferencia: r.cuentaDiferencia, motivos: r.motivos, ceroPermitido: r.ceroPermitido }, g); });
    acc.appendChild(g);
    s.appendChild(acc);
    return s;
  }

  window.CONFIGURACION = {
    configurar: function (c) { C = c || {}; },
    vista: vista,
    _cfg: function () { return CFG; }
  };
}());
