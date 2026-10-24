/* TESORERIA-FLANDES · BASE SEMBRADA DEL ASISTENTE (24/10/2026)
   Respaldo embebido: la usa el asistente la primera vez y en la entrada.
   La de verdad vive en el CORE (hoja ASISTENTE_TEMAS) y se edita en ADMIN;
   cuando cambia, llega con el arranque y reemplaza esta en el teléfono.
   Generado desde la semilla: no se edita a mano. */
window.ASISTENTE_BASE = [
{
"id": "TS-INICIO",
"app": "TESORERIA",
"vista": "",
"titulo": "Ir al inicio",
"frases": [
"ir al inicio",
"volver al inicio",
"pantalla principal",
"menu principal",
"regresar al menu"
],
"respuesta": "Te llevo a tu **inicio**: ahí están los bloques de la app y el resumen de Tesorería.",
"accion": "ir:inicio",
"estado": "",
"activo": true,
"orden": 1
},
{
"id": "TS-QUE-ME-TOCA",
"app": "TESORERIA",
"vista": "inicio,pendientes,emitidos",
"titulo": "¿Qué tengo pendiente?",
"frases": [
"que tengo pendiente",
"que me toca hacer",
"que tengo que hacer hoy",
"que me falta",
"que hago primero",
"tengo algo pendiente",
"que es lo mas urgente",
"por donde empiezo hoy"
],
"respuesta": "{{queMeToca}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 2
},
{
"id": "TS-POR-HACER",
"app": "TESORERIA",
"vista": "inicio,pendientes",
"titulo": "¿Cuántos egresos tengo por hacer?",
"frases": [
"cuantos egresos tengo por hacer",
"egresos pendientes",
"ordenes de pago pendientes",
"ordenes de pago esperando egreso",
"cuentas en orden de pago",
"que ordenes me llegaron",
"hacer egresos",
"cuentas por girar"
],
"respuesta": "{{porHacer}}",
"accion": "ir:pendientes",
"estado": "",
"activo": true,
"orden": 3
},
{
"id": "TS-MAS-ANTIGUA",
"app": "TESORERIA",
"vista": "inicio,pendientes",
"titulo": "¿Cuál orden lleva más días esperando?",
"frases": [
"cual lleva mas dias esperando",
"la orden mas antigua",
"la mas vieja",
"cual esta esperando hace mas tiempo",
"quien lleva mas tiempo esperando egreso",
"ordenes mas viejas"
],
"respuesta": "{{masAntigua}}",
"accion": "ir:pendientes",
"estado": "",
"activo": true,
"orden": 4
},
{
"id": "TS-ATRASADAS",
"app": "TESORERIA",
"vista": "inicio,pendientes",
"titulo": "¿Cuáles van atrasadas?",
"frases": [
"cuales van atrasadas",
"ordenes atrasadas",
"egresos atrasados",
"cuales estan en rojo",
"cuales llevan mas de cinco dias",
"que esta vencido",
"cuentas demoradas"
],
"respuesta": "{{atrasadas}}",
"accion": "ir:pendientes",
"estado": "",
"activo": true,
"orden": 5
},
{
"id": "TS-POR-GIRAR",
"app": "TESORERIA",
"vista": "inicio,pendientes",
"titulo": "¿Cuánto hay por girar?",
"frases": [
"cuanto hay por girar",
"cuanta plata hay que girar",
"total por girar",
"valor a girar",
"suma de los netos",
"cuanto se va a pagar"
],
"respuesta": "{{porGirar}}",
"accion": "ir:pendientes",
"estado": "",
"activo": true,
"orden": 6
},
{
"id": "TS-POR-PAGAR",
"app": "TESORERIA",
"vista": "inicio,emitidos",
"titulo": "¿Cuántos egresos faltan por marcar pagos?",
"frases": [
"egresos por pagar",
"cuantos egresos faltan por pagar",
"egresos emitidos",
"cuentas por marcar pagas",
"que falta por pagar",
"egresos esperando el pago",
"cuanto hay por pagar"
],
"respuesta": "{{porPagar}}",
"accion": "ir:emitidos",
"estado": "",
"activo": true,
"orden": 7
},
{
"id": "TS-EMI-ANTIGUO",
"app": "TESORERIA",
"vista": "emitidos",
"titulo": "¿Cuál egreso lleva más días sin pagar?",
"frases": [
"egreso mas antiguo",
"cual egreso lleva mas dias",
"egresos atrasados sin pagar",
"cual egreso esta demorado",
"egreso mas viejo"
],
"respuesta": "{{emiAntiguo}}",
"accion": "ir:emitidos",
"estado": "",
"activo": true,
"orden": 8
},
{
"id": "TS-PRIMERAS",
"app": "TESORERIA",
"vista": "inicio,pendientes,egreso",
"titulo": "¿Cuáles son primeras del tramo?",
"frases": [
"primeras del tramo",
"primera cuenta del tramo",
"cuales son primeras",
"cuentas con estampillas",
"primera cuenta del contrato"
],
"respuesta": "{{primeras}}",
"accion": "ir:pendPrimeras",
"estado": "",
"activo": true,
"orden": 9
},
{
"id": "TS-APP-ANTERIOR",
"app": "TESORERIA",
"vista": "pendientes,egreso",
"titulo": "¿Cuáles órdenes son de la app anterior?",
"frases": [
"ordenes de la app anterior",
"orden app anterior",
"ordenes viejas",
"neto calculado por el motor",
"por que dice orden app anterior",
"orden en papel"
],
"respuesta": "{{motor}}",
"accion": "ir:pendMotor",
"estado": "",
"activo": true,
"orden": 10
},
{
"id": "TS-EMBARGOS",
"app": "TESORERIA",
"vista": "inicio,pendientes,egreso,contratistas,contratista",
"titulo": "¿Cuáles tienen embargo?",
"frases": [
"cuales tienen embargo",
"cuentas con embargo",
"contratistas embargados",
"embargos pendientes",
"descuento de embargo",
"quien tiene embargo"
],
"respuesta": "{{embargos}}",
"accion": "ir:pendEmbargo",
"estado": "",
"activo": true,
"orden": 11
},
{
"id": "TS-CESION",
"app": "TESORERIA",
"vista": "pendientes,egreso",
"titulo": "¿Cuáles son de contratos cedidos?",
"frases": [
"contratos cedidos",
"cuentas cedidas",
"cesion de contrato",
"rp de cesion",
"cuales son cedidas"
],
"respuesta": "{{cesion}}",
"accion": "ir:pendCesion",
"estado": "",
"activo": true,
"orden": 12
},
{
"id": "TS-SIN-BANCO",
"app": "TESORERIA",
"vista": "pendientes,egreso,emitidos",
"titulo": "¿A quién le falta la cuenta bancaria?",
"frases": [
"a quien le falta la cuenta bancaria",
"sin cuenta bancaria",
"no tiene banco",
"falta numero de cuenta",
"contratista sin banco",
"cuenta bancaria del contratista"
],
"respuesta": "{{sinBanco}}",
"accion": "ir:pendientes",
"estado": "",
"activo": true,
"orden": 13
},
{
"id": "TS-LISTA-COMO",
"app": "TESORERIA",
"vista": "pendientes",
"titulo": "¿Cómo funciona la lista de pendientes?",
"frases": [
"como funciona la lista",
"que son los egresos pendientes",
"que significan las pastillas",
"que es esta lista",
"por que sale en rojo",
"filtros de pendientes"
],
"respuesta": "Aquí están las cuentas con **orden de pago** de Contabilidad, esperando su egreso. Las pastillas filtran **primeras del tramo**, **las demás**, **contratos cedidos**, **orden de la app anterior** y **con embargo**, y la de secretaría. La **fecha de la orden** sale en rojo desde 5 días. Los filtros y la búsqueda no gastan datos: todo pasa en tu teléfono.",
"accion": "ir:pendientes",
"estado": "",
"activo": true,
"orden": 14
},
{
"id": "TS-HACER-EGRESO",
"app": "TESORERIA",
"vista": "inicio,pendientes,egreso",
"titulo": "¿Cómo hago un egreso?",
"frases": [
"como hago un egreso",
"crear egreso",
"hacer el egreso",
"como pago una cuenta",
"girarle a un contratista",
"pasos del egreso",
"comprobante de egreso"
],
"respuesta": "En **EGRESOS PENDIENTES** toca **Hacer egreso** en la cuenta. Escribe el **N° de egreso** (solo los dígitos finales), revisa la **fecha**, el **valor pagado** (llega con el neto de la orden) y escoge la **fuente**; el banco y la cuenta salen de la fuente. Abajo ves cómo queda el comprobante. Termina con **Crear egreso**.",
"accion": "ir:pendientes",
"estado": "",
"activo": true,
"orden": 15
},
{
"id": "TS-NUMERO",
"app": "TESORERIA",
"vista": "egreso",
"titulo": "¿Qué escribo en el N° de egreso?",
"frases": [
"que escribo en el numero de egreso",
"numero de egreso",
"consecutivo del egreso",
"como pongo el numero",
"cuantos digitos lleva"
],
"respuesta": "Escribe solo los **dígitos finales** (hasta 6): la app completa el año. Por ejemplo, **1234** queda como **2026001234**.",
"accion": "",
"estado": "",
"activo": true,
"orden": 16
},
{
"id": "TS-FECHA",
"app": "TESORERIA",
"vista": "egreso",
"titulo": "¿Qué fecha lleva el egreso?",
"frases": [
"fecha del egreso",
"cambiar la fecha del egreso",
"egreso con otra fecha",
"que fecha pongo"
],
"respuesta": "La **fecha de egreso** llega con la de hoy. Si el giro fue otro día, cámbiala en el calendario antes de crear el egreso: es la que sale en el PDF.",
"accion": "",
"estado": "",
"activo": true,
"orden": 17
},
{
"id": "TS-FUENTE",
"app": "TESORERIA",
"vista": "egreso",
"titulo": "¿Qué fuente escojo?",
"frases": [
"que fuente escojo",
"fuente de destinacion",
"con que fuente se pago la vez pasada",
"de que cuenta sale la plata",
"banco de la alcaldia",
"cuenta bancaria de la fuente"
],
"respuesta": "{{fuente}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 18
},
{
"id": "TS-DOS-PAGOS",
"app": "TESORERIA",
"vista": "egreso,emitidos",
"titulo": "Pagar con dos fuentes",
"frases": [
"dos fuentes",
"segundo pago",
"pagar con dos cuentas",
"dividir el pago",
"agregar otro pago"
],
"respuesta": "Toca **Agregar un segundo pago (otra fuente)**: llega con lo que falta para el neto. Cada pago lleva su **valor** y su **fuente**; el total girado es la suma. Para quitarlo, **Quitar el pago 2**.",
"accion": "",
"estado": "",
"activo": true,
"orden": 19
},
{
"id": "TS-DIFERENCIA",
"app": "TESORERIA",
"vista": "egreso,emitidos",
"titulo": "Girar distinto al neto (motivo)",
"frases": [
"girar menos",
"pago parcial",
"motivo de la diferencia",
"no cuadra con la orden",
"situacion de fondos",
"girar mas que la orden",
"diferencia en el egreso"
],
"respuesta": "Si lo girado no es el neto de la orden (pago parcial, situación de fondos…), escoge el **motivo de la diferencia** y escribe el detalle: sale como **observación** en el egreso. **Girar más que la orden no se puede.**",
"accion": "",
"estado": "",
"activo": true,
"orden": 20
},
{
"id": "TS-CUADRA",
"app": "TESORERIA",
"vista": "egreso",
"titulo": "¿Cuadra con la orden?",
"frases": [
"cuadra con la orden",
"esta bien lo que voy a girar",
"revisa mi egreso",
"cuadra el egreso",
"hay diferencia"
],
"respuesta": "{{cuadra}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 21
},
{
"id": "TS-NETO",
"app": "TESORERIA",
"vista": "egreso",
"titulo": "¿De dónde sale el neto?",
"frases": [
"de donde sale el neto",
"por que ese valor",
"descuentos de la orden",
"neto de la orden",
"cuanto se le descontó",
"explicame el valor a girar"
],
"respuesta": "{{neto}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 22
},
{
"id": "TS-EMBARGO-CHECK",
"app": "TESORERIA",
"vista": "egreso",
"titulo": "El check del embargo",
"frases": [
"check del embargo",
"descontar embargo",
"quitar el embargo de este egreso",
"no descontar el embargo",
"como funciona el embargo en el egreso"
],
"respuesta": "Si el contrato tiene **embargo**, la cuenta llega con la cuota ya descontada y el check marcado; va a la cuenta 138490002. Desmárcalo solo si en **este** egreso no aplica: sale sin el descuento. Si el embargo ya no aplica nunca, **levántalo** en la tarjeta del contratista.",
"accion": "",
"estado": "",
"activo": true,
"orden": 23
},
{
"id": "TS-LEVANTAR-EMBARGO",
"app": "TESORERIA",
"vista": "egreso,contratistas,contratista",
"titulo": "Configurar o levantar un embargo",
"frases": [
"levantar el embargo",
"configurar un embargo",
"poner un embargo",
"quitar embargo",
"tope del embargo",
"cuota del embargo"
],
"respuesta": "Los embargos se configuran en **CONTRATISTAS**, en la tarjeta del contrato: cuota, tope y nota. Desde ahí también se **levantan** o se quitan; lo ya descontado en egresos no cambia.",
"accion": "ir:contratistas",
"estado": "",
"activo": true,
"orden": 24
},
{
"id": "TS-CREAR",
"app": "TESORERIA",
"vista": "egreso",
"titulo": "¿Qué hace Crear egreso?",
"frases": [
"que hace crear egreso",
"que pasa al crear el egreso",
"a quien le avisa",
"donde queda el pdf del egreso",
"se le avisa al contratista"
],
"respuesta": "**Crear egreso** vuelve a cuadrar con la orden en el servidor, arma el **PDF**, lo guarda en la **carpeta de la cuenta**, la pasa a **EGRESO** y le avisa al **grupo de Tesorería**. Al contratista se le avisa cuando marques la **cuenta paga**.",
"accion": "",
"estado": "",
"activo": true,
"orden": 25
},
{
"id": "TS-REHACER",
"app": "TESORERIA",
"vista": "emitidos,egreso",
"titulo": "Rehacer un egreso",
"frases": [
"rehacer egreso",
"corregir un egreso",
"me equivoque en el egreso",
"cambiar el egreso",
"modificar egreso"
],
"respuesta": "En **EGRESOS EMITIDOS** toca **Rehacer** en la tarjeta: cambia el PDF y los datos del egreso **sin volver a avisar**, y la cuenta sigue en EGRESO. Solo aparece en los egresos hechos con esta app.",
"accion": "ir:emitidos",
"estado": "",
"activo": true,
"orden": 26
},
{
"id": "TS-SIN-CONTRATO",
"app": "TESORERIA",
"vista": "egreso,perfil",
"titulo": "¿Qué nombre sale si no tengo contrato?",
"frases": [
"sin contrato",
"que nombre sale",
"usuario egreso",
"usuario pagos",
"no tengo contrato que firma sale"
],
"respuesta": "Si el administrador te marcó **SIN CONTRATO**, hacia afuera (el contratista, su WhatsApp y los documentos) el egreso sale como **Usuario Egreso** y el pago como **Usuario Pagos**. Por dentro queda tu nombre real.",
"accion": "",
"estado": "",
"activo": true,
"orden": 27
},
{
"id": "TS-VER-ORDEN",
"app": "TESORERIA",
"vista": "pendientes,egreso,emitidos",
"titulo": "Ver la orden de pago y el egreso",
"frases": [
"ver la orden de pago",
"abrir orden de pago",
"ver el egreso",
"abrir egreso",
"descargar el egreso",
"informe de supervision"
],
"respuesta": "Toca **Orden de pago** en la tarjeta (o **Abrir orden de pago** en el egreso): se abre en el visor con el informe de supervisión. **Abrir egreso** muestra el comprobante y deja descargarlo. Las órdenes de la app anterior no tienen el PDF enlazado: están en la carpeta de la cuenta.",
"accion": "",
"estado": "",
"activo": true,
"orden": 28
},
{
"id": "TS-FIRMAS",
"app": "TESORERIA",
"vista": "inicio,egreso,configuracion",
"titulo": "¿Por qué no puedo crear egresos? (firmas)",
"frases": [
"no puedo crear egresos",
"faltan firmas",
"firmas del egreso",
"quien aprueba el egreso",
"aprobo reviso elaboro",
"firma de la alcaldesa",
"sello del egreso"
],
"respuesta": "{{firmas}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 29
},
{
"id": "TS-MARCAR-PAGA",
"app": "TESORERIA",
"vista": "inicio,emitidos",
"titulo": "¿Cómo marco una cuenta paga?",
"frases": [
"marcar cuenta paga",
"como registro el pago",
"ya se pago",
"pasar a pagada",
"avisar al contratista que se pago",
"cuenta pagada"
],
"respuesta": "En **EGRESOS EMITIDOS** revisa la **cuenta del contratista** y marca **Marcar cuenta paga**: la cuenta pasa a **PAGADA**, queda en PAGOS y al contratista le llega el aviso con el egreso (notificación, correo y WhatsApp).",
"accion": "ir:emitidos",
"estado": "",
"activo": true,
"orden": 30
},
{
"id": "TS-EGRESO-VIEJO",
"app": "TESORERIA",
"vista": "emitidos",
"titulo": "Egresos de la app anterior",
"frases": [
"egreso de la app anterior",
"egreso viejo",
"por que me pide lo que se giro",
"egreso sin pdf"
],
"respuesta": "Los egresos hechos con la app anterior no tienen los pagos guardados: en su tarjeta escribes **lo que se giró** (valor y fuente) antes de marcarla paga. No tienen PDF.",
"accion": "",
"estado": "",
"activo": true,
"orden": 31
},
{
"id": "TS-DIF-EMITIDOS",
"app": "TESORERIA",
"vista": "emitidos",
"titulo": "¿Algún egreso con diferencia?",
"frases": [
"egresos con diferencia",
"alguno con diferencia",
"pagos parciales",
"egresos que no giran el neto"
],
"respuesta": "{{conDiferencia}}",
"accion": "ir:emitidos",
"estado": "",
"activo": true,
"orden": 32
},
{
"id": "TS-COMPROBANTE",
"app": "TESORERIA",
"vista": "inicio,pagadas",
"titulo": "¿Cómo subo el comprobante de pago?",
"frases": [
"subir comprobante",
"comprobante de pago",
"soporte del banco",
"cambiar comprobante",
"dos imagenes del comprobante",
"adjuntar el soporte"
],
"respuesta": "En **CUENTAS PAGADAS** toca **Subir comprobante**: la **Imagen 1** es obligatoria y la **Imagen 2** opcional (PDF o imagen, con el botón, arrastrando o con Ctrl+V; hasta 8 MB cada una). Al cambiarlo, la imagen que dejes vacía se conserva. Termina con **Guardar comprobante**.",
"accion": "ir:pagSin",
"estado": "",
"activo": true,
"orden": 33
},
{
"id": "TS-SIN-COMPROBANTE",
"app": "TESORERIA",
"vista": "inicio,pagadas",
"titulo": "¿Cuántas faltan por comprobante?",
"frases": [
"cuantas faltan por comprobante",
"sin comprobante",
"cuentas pagadas sin soporte",
"que comprobantes faltan"
],
"respuesta": "{{sinComprobante}}",
"accion": "ir:pagSin",
"estado": "",
"activo": true,
"orden": 34
},
{
"id": "TS-QUIEN-VE",
"app": "TESORERIA",
"vista": "pagadas",
"titulo": "¿Quién ve el comprobante?",
"frases": [
"quien ve el comprobante",
"el comprobante es publico",
"enlace del comprobante",
"el contratista ve el comprobante"
],
"respuesta": "El comprobante ya no tiene enlace público. Lo ve **Tesorería** desde **Comprobante** en CUENTAS PAGADAS y el **contratista** en **MI CUENTA DRIVE** de su app.",
"accion": "",
"estado": "",
"activo": true,
"orden": 35
},
{
"id": "TS-CIERRE",
"app": "TESORERIA",
"vista": "pagadas,informes",
"titulo": "¿Qué es el cierre de cuenta?",
"frases": [
"cierre de cuenta",
"cerrar cuenta",
"que pasa al abrir el egreso",
"invitado abre el egreso"
],
"respuesta": "Cuando el usuario **INVITADO** abre el egreso de una cuenta pagada, queda su **cierre de cuenta** (una sola vez por persona y cuenta). Los cierres se descargan en **MIS REGISTROS**.",
"accion": "",
"estado": "",
"activo": true,
"orden": 36
},
{
"id": "TS-SOLICITUDES",
"app": "TESORERIA",
"vista": "inicio,solicitudes",
"titulo": "¿Cuántas solicitudes faltan por responder?",
"frases": [
"solicitudes pendientes",
"cuantas solicitudes faltan",
"que me preguntan los contratistas",
"solicitudes de contratistas",
"consultas por responder",
"responder solicitudes"
],
"respuesta": "{{solicitudes}}",
"accion": "ir:solPend",
"estado": "",
"activo": true,
"orden": 37
},
{
"id": "TS-RESPONDER",
"app": "TESORERIA",
"vista": "solicitudes",
"titulo": "¿Cómo respondo una solicitud?",
"frases": [
"como respondo una solicitud",
"responder al contratista",
"contestar solicitud",
"a donde le llega la respuesta"
],
"respuesta": "En **SOLICITUDES** cada una trae el estado de las cuentas de su contrato (orden, egreso y pago). Toca **Responder**, escribe y envía: la solicitud pasa a **RESPONDIDA**, queda quién respondió y al contratista le llega por **WhatsApp**.",
"accion": "ir:solPend",
"estado": "",
"activo": true,
"orden": 38
},
{
"id": "TS-GENERICA",
"app": "TESORERIA",
"vista": "solicitudes",
"titulo": "¿Qué copia la respuesta genérica?",
"frases": [
"respuesta generica",
"copiar respuesta generica",
"cuando me pagan",
"respuesta formal del pago",
"texto para cuando preguntan por el pago"
],
"respuesta": "**Copiar respuesta genérica** copia la respuesta formal de la Tesorería a la consulta por el pago **antes del giro**, con el **nombre**, el **contrato y año** y la **fecha de la orden de pago**. Sin orden de pago no copia. Si hay un requerimiento abierto, un embargo o la cuenta ya está pagada, te avisa antes.",
"accion": "",
"estado": "",
"activo": true,
"orden": 39
},
{
"id": "TS-APLICA-GENERICA",
"app": "TESORERIA",
"vista": "solicitudes",
"titulo": "¿A quién le aplica la respuesta genérica?",
"frases": [
"a quien le aplica",
"a quien le sirve la respuesta generica",
"cuales tienen orden de pago"
],
"respuesta": "{{aplicaGenerica}}",
"accion": "ir:solPend",
"estado": "",
"activo": true,
"orden": 40
},
{
"id": "TS-REGISTROS",
"app": "TESORERIA",
"vista": "inicio,informes",
"titulo": "Descargar lo que he hecho",
"frases": [
"descargar lo que hice",
"mis registros",
"mis informes",
"descargar mis egresos",
"reporte de pagos",
"excel de egresos",
"pdf de lo que hice",
"informe gerencial"
],
"respuesta": "En **MIS REGISTROS** escoges **egresos, pagos, solicitudes o cierres** y el periodo (ADMIN también escoge la persona), y lo descargas en **PDF** (por bloques) o **Excel** (una fila por registro).",
"accion": "ir:registros",
"estado": "",
"activo": true,
"orden": 41
},
{
"id": "TS-PERIODO",
"app": "TESORERIA",
"vista": "informes",
"titulo": "Resúmeme el periodo",
"frases": [
"resumeme el periodo",
"resumen del periodo",
"cuantos egresos hice",
"cuantos pagos hice",
"totales del periodo"
],
"respuesta": "{{periodo}}",
"accion": "ir:registros",
"estado": "",
"activo": true,
"orden": 42
},
{
"id": "TS-CONTRATISTAS",
"app": "TESORERIA",
"vista": "inicio,contratistas",
"titulo": "Buscar un contratista",
"frases": [
"buscar un contratista",
"lista de contratistas",
"ver contratistas",
"ficha del contratista",
"datos del contratista",
"whatsapp del contratista",
"drive del contratista"
],
"respuesta": "En **CONTRATISTAS** están todos los contratos de la Alcaldía (empieza en los **activos**). Busca por nombre, documento o contrato; en cada tarjeta tienes **Detalles**, **Informe**, **Requerimiento**, WhatsApp y Drive.",
"accion": "ir:contratistas",
"estado": "",
"activo": true,
"orden": 43
},
{
"id": "TS-ACTIVOS",
"app": "TESORERIA",
"vista": "inicio,contratistas",
"titulo": "¿Cuántos contratos activos hay?",
"frases": [
"cuantos contratos activos hay",
"contratos activos",
"cuantos contratistas hay",
"total de contratos"
],
"respuesta": "{{activos}}",
"accion": "ir:activos",
"estado": "",
"activo": true,
"orden": 44
},
{
"id": "TS-POR-VENCER",
"app": "TESORERIA",
"vista": "contratistas",
"titulo": "¿Cuáles terminan pronto?",
"frases": [
"cuales terminan pronto",
"contratos por vencer",
"quien termina este mes",
"contratos que se acaban",
"proximos a terminar"
],
"respuesta": "{{porVencer}}",
"accion": "ir:activos",
"estado": "",
"activo": true,
"orden": 45
},
{
"id": "TS-FALTA-FICHA",
"app": "TESORERIA",
"vista": "contratista",
"titulo": "¿Qué le falta a este contrato?",
"frases": [
"que le falta a este contrato",
"datos incompletos",
"le falta algo",
"que no ha llenado"
],
"respuesta": "{{faltaFicha}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 46
},
{
"id": "TS-INFORME",
"app": "TESORERIA",
"vista": "inicio,contratistas,contratista,informe",
"titulo": "Descargar el informe de cuentas de un contratista",
"frases": [
"informe de cuentas",
"descargar informe del contratista",
"cuentas de un contratista",
"excel del contratista",
"pdf de las cuentas",
"historial de cuentas"
],
"respuesta": "En **CONTRATISTAS** toca **Informe** en la tarjeta del contrato: ves valor, cobrado, pagado y saldo, y descargas en **PDF** (para leer) o **Excel** (una fila por cuenta). Cada contrato va por separado.",
"accion": "ir:contratistas",
"estado": "",
"activo": true,
"orden": 47
},
{
"id": "TS-COMO-VA",
"app": "TESORERIA",
"vista": "informe",
"titulo": "¿Cómo va este contrato?",
"frases": [
"como va este contrato",
"cuanto ha cobrado",
"cuanto le han pagado",
"saldo del contrato",
"avance del contrato"
],
"respuesta": "{{comoVa}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 48
},
{
"id": "TS-SALDOS",
"app": "TESORERIA",
"vista": "informe",
"titulo": "¿Cuadran los saldos?",
"frases": [
"cuadran los saldos",
"saldos del contrato",
"revisar saldos",
"el saldo esta bien",
"errores en los saldos"
],
"respuesta": "{{saldos}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 49
},
{
"id": "TS-REQUERIMIENTO",
"app": "TESORERIA",
"vista": "inicio,requerimientos,contratistas,contratista",
"titulo": "Pedirle algo a un contratista",
"frases": [
"pedirle algo a un contratista",
"hacer un requerimiento",
"requerir al contratista",
"pedir documentos",
"mandar un mensaje a varios"
],
"respuesta": "En **REQUERIMIENTOS** eliges a quién (o marcas varios, máximo 20) y redactas una vez. Le llega como notificación y por WhatsApp, firmado como Tesorería, y queda en su buzón. En **Historial** lo marcas **atendido**.",
"accion": "ir:requerimientos",
"estado": "",
"activo": true,
"orden": 50
},
{
"id": "TS-REQ-ABIERTOS",
"app": "TESORERIA",
"vista": "requerimientos",
"titulo": "¿Cuántos requerimientos siguen abiertos?",
"frases": [
"requerimientos abiertos",
"cuantos requerimientos faltan",
"requerimientos sin atender",
"requerimientos pendientes"
],
"respuesta": "{{reqAbiertos}}",
"accion": "ir:requerimientos",
"estado": "",
"activo": true,
"orden": 51
},
{
"id": "TS-COMUNICADO",
"app": "TESORERIA",
"vista": "inicio,comunicados",
"titulo": "Publicar un comunicado",
"frases": [
"publicar un comunicado",
"nuevo comunicado",
"avisar a todos los contratistas",
"mandar un aviso",
"retirar comunicado"
],
"respuesta": "En **COMUNICADOS** toca **Nuevo comunicado**: escribe, adjunta documentos (PDF, fotos, Word, Excel…) y publica. Llega como notificación a los teléfonos de los contratistas. **Retirar** lo quita de su app sin borrarlo.",
"accion": "ir:comunicados",
"estado": "",
"activo": true,
"orden": 52
},
{
"id": "TS-CONFIG",
"app": "TESORERIA",
"vista": "inicio,configuracion",
"titulo": "Configuración de Tesorería",
"frases": [
"configuracion",
"fuentes de destinacion",
"agregar una fuente",
"cuentas bancarias de la alcaldia",
"reglas del egreso",
"motivos de diferencia",
"cuenta de la diferencia"
],
"respuesta": "En **CONFIGURACIÓN** están las **fuentes de destinación** (banco y N° de cuenta de cada una), las **firmas del egreso** (Aprobó y Revisó, y el sello), las **reglas** de la diferencia y, con su permiso, las **retenciones** de Contabilidad. Cada bloque tiene su botón **Guardar**.",
"accion": "ir:configuracion",
"estado": "",
"activo": true,
"orden": 53
},
{
"id": "TS-FUENTES",
"app": "TESORERIA",
"vista": "configuracion",
"titulo": "¿Cuántas fuentes hay?",
"frases": [
"cuantas fuentes hay",
"lista de fuentes",
"fuentes por banco",
"que bancos hay"
],
"respuesta": "{{fuentes}}",
"accion": "ir:configuracion",
"estado": "",
"activo": true,
"orden": 54
},
{
"id": "TS-CONFIG-FALTA",
"app": "TESORERIA",
"vista": "configuracion",
"titulo": "¿Qué falta por definir?",
"frases": [
"que falta por definir",
"que falta configurar",
"configuracion incompleta",
"falta algo en la configuracion"
],
"respuesta": "{{faltaConfig}}",
"accion": "ir:configuracion",
"estado": "",
"activo": true,
"orden": 55
},
{
"id": "TS-FIRMA-FOTO",
"app": "TESORERIA",
"vista": "perfil",
"titulo": "¿Cómo tomo bien la foto de la firma?",
"frases": [
"foto de la firma",
"subir mi firma",
"como tomo la firma",
"firma con fondo",
"mi firma sale mal"
],
"respuesta": "Firma con **tinta negra o azul oscura** en una hoja **blanca**, con buena luz y sin sombras. Toma la foto de cerca y derecha; la app quita el fondo y la recorta. Antes de guardar ves cómo queda.",
"accion": "ir:perfil",
"estado": "",
"activo": true,
"orden": 56
},
{
"id": "TS-PERMISOS",
"app": "TESORERIA",
"vista": "inicio",
"titulo": "¿Qué puede hacer mi usuario?",
"frases": [
"que puede hacer mi usuario",
"mis permisos",
"por que no veo",
"no me aparece",
"que rol tengo",
"no tengo acceso a esa vista"
],
"respuesta": "{{permisos}}",
"accion": "soporte",
"estado": "",
"activo": true,
"orden": 57
},
{
"id": "TS-FOTO",
"app": "TESORERIA",
"vista": "",
"titulo": "Cambiar mi foto",
"frases": [
"cambiar mi foto",
"foto de perfil",
"poner mi foto",
"actualizar foto"
],
"respuesta": "Toca tu foto (o tus iniciales) en el saludo, o el menú de tu perfil → **Foto de perfil**. Es la misma en todas las apps de la Alcaldía.",
"accion": "foto",
"estado": "",
"activo": true,
"orden": 58
},
{
"id": "TS-CLAVE",
"app": "TESORERIA",
"vista": "",
"titulo": "Cambiar mi contraseña",
"frases": [
"cambiar mi contraseña",
"actualizar contraseña",
"nueva clave",
"cambiar clave"
],
"respuesta": "Desde el menú de tu perfil → **Actualizar contraseña**.",
"accion": "clave",
"estado": "",
"activo": true,
"orden": 59
},
{
"id": "TS-INSTALAR",
"app": "TESORERIA",
"vista": "",
"titulo": "Instalar la app",
"frases": [
"instalar la app",
"poner la app en el celular",
"descargar la app",
"acceso directo"
],
"respuesta": "Puedes instalarla en tu teléfono o computador para abrirla como una app más.",
"accion": "instalar",
"estado": "",
"activo": true,
"orden": 60
},
{
"id": "TS-AVISOS",
"app": "TESORERIA",
"vista": "",
"titulo": "¿Me llegan los avisos al teléfono?",
"frases": [
"me llegan los avisos",
"notificaciones",
"no me llegan avisos",
"activar notificaciones"
],
"respuesta": "{{avisosTelefono}}",
"accion": "",
"estado": "",
"activo": true,
"orden": 61
},
{
"id": "TS-GUIA",
"app": "TESORERIA",
"vista": "",
"titulo": "Guía rápida en PDF",
"frases": [
"guia rapida",
"manual de la app",
"guia en pdf",
"como se usa la app",
"tutorial"
],
"respuesta": "Aquí tienes la **guía rápida** de Tesorería en PDF.",
"accion": "guia",
"estado": "",
"activo": true,
"orden": 62
},
{
"id": "TS-SOPORTE",
"app": "TESORERIA",
"vista": "",
"titulo": "Hablar con soporte",
"frases": [
"hablar con soporte",
"reportar un error",
"algo no funciona",
"necesito ayuda de una persona",
"la app falla",
"contactar soporte"
],
"respuesta": "Cuéntale a **soporte** qué pasó: llega al equipo de desarrollo y te responden en la app.",
"accion": "soporte",
"estado": "",
"activo": true,
"orden": 63
},
{
"id": "TSE-OLVIDE",
"app": "TESORERIA",
"vista": "entrada",
"titulo": "Olvidé mi contraseña",
"frases": [
"olvide mi contraseña",
"no recuerdo la clave",
"recuperar contraseña",
"perdi la clave",
"no me acuerdo la contraseña"
],
"respuesta": "Escribe tu **documento** y toca **Olvidé mi contraseña**: te llega una nueva por WhatsApp.",
"accion": "olvide",
"estado": "",
"activo": true,
"orden": 64
},
{
"id": "TSE-ENTRAR",
"app": "TESORERIA",
"vista": "entrada",
"titulo": "¿Cómo entro?",
"frases": [
"como entro",
"como ingreso",
"iniciar sesion",
"no puedo entrar",
"que usuario pongo"
],
"respuesta": "Entra con tu **documento** (sin puntos) y tu **contraseña**. Si no la tienes o no te funciona, usa **Olvidé mi contraseña**.",
"accion": "documento",
"estado": "",
"activo": true,
"orden": 65
},
{
"id": "TSE-ACCESO",
"app": "TESORERIA",
"vista": "entrada",
"titulo": "No tengo acceso a Tesorería",
"frases": [
"no tengo acceso",
"no tengo usuario",
"crear usuario",
"quien me da acceso",
"pedir acceso a tesoreria"
],
"respuesta": "Los usuarios de Tesorería (egresos, pagos, administración e invitados) los crea el **administrador** del ecosistema. Pídeselo a tu jefe o al administrador.",
"accion": "",
"estado": "",
"activo": true,
"orden": 66
},
{
"id": "TSE-INSTALAR",
"app": "TESORERIA",
"vista": "entrada",
"titulo": "Instalar la app",
"frases": [
"instalar la app",
"poner la app en el celular",
"descargar la app",
"acceso directo"
],
"respuesta": "Puedes instalarla en tu teléfono o computador para abrirla como una app más.",
"accion": "instalar",
"estado": "",
"activo": true,
"orden": 67
},
{
"id": "TSE-QUE-ES",
"app": "TESORERIA",
"vista": "entrada",
"titulo": "¿Para qué sirve esta app?",
"frases": [
"para que sirve",
"que es esta app",
"que hago aqui",
"que es tesoreria"
],
"respuesta": "**Tesorería** es la app de la oficina de Tesorería: hacer el **comprobante de egreso** de las órdenes de pago, marcar las cuentas **pagadas** con su comprobante, responder las **solicitudes** de los contratistas y consultar sus cuentas.",
"accion": "",
"estado": "",
"activo": true,
"orden": 68
}
];
