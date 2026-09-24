# TESORERIA-FLANDES

App de Tesorería de la Alcaldía de Flandes. Front estático (GitHub Pages) sobre FLANDES_CORE (app `TESORERIA`). Mismo kit 7.2, estilos, cielo, cohete, esqueletos, Insights, foto de perfil, modo oscuro y firma que las otras apps.

Roles: **EGRESO** (hace los egresos), **PAGO** (marca las cuentas pagas), **ADMIN** (todo, firmas del egreso y retenciones) e **INVITADO** (cuentas pagadas: al abrir el egreso deja el cierre de cuenta). El DEV entra a todo.

## Fase 8 · qué hay aquí
- **Inicio**: el login trae el arranque; la bandeja se pide una sola vez (burbujas y resumen: egresos por hacer, primeras del tramo, órdenes de la app anterior, por pagar, sin comprobante, solicitudes).
- **Egresos pendientes** (`js/egresos.js`): cuentas en ORDEN DE PAGO. El valor a girar es el **neto de la orden** (el que guardó Contabilidad; en órdenes de la app anterior, el que calcula el mismo motor). N° de egreso con los dígitos finales, fecha con la rueda (hoy por defecto), uno o dos pagos con su fuente (banco y cuenta salen de la configuración) y motivo si lo girado no es el neto. **Crear egreso**: una llamada; PDF con la plantilla COMPROBANTE DE EGRESO V1 en la carpeta de la cuenta, estado EGRESO, aviso al contratista y al grupo de Tesorería.
- **Egresos emitidos**: a quién se gira, los pagos, abrir egreso, rehacer, y **Marcar cuenta paga** (PAGADA, DETALLES DE PAGO, hoja PAGOS y aviso push + correo + WhatsApp). Los egresos de la app anterior piden los pagos ahí mismo.
- **Cuentas pagadas** (`js/pagadas.js`): por defecto las que no tienen comprobante; subir comprobante (botón, arrastrar o pegar), abrir egreso con descarga.
- **Solicitudes** (`js/solicitudes.js`), **Mis informes** (`js/informes.js`, PDF por bloques y Excel), **Contratistas**, **Informe de cuentas**, **Requerimientos**, **Comunicados**, **Configuración** (fuentes, firmas del egreso, reglas, retenciones) y **Mi firma y mi foto**.
- Soporte en el menú del perfil. Insights en todas las vistas.
