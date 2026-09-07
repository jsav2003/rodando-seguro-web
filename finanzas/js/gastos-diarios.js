/* ==========================================================================
   Modulo de gastos diarios
   --------------------------------------------------------------------------
   PENDIENTE DE IMPLEMENTAR.

   Este archivo es independiente del resto: app.js solo lo conoce por las dos
   funciones que expone abajo, asi que se puede trabajar aqui sin tocar
   ningun otro archivo.

   ---------------------------------------------------------------------------
   CONTRATO (app.js llama exactamente esto y nada mas)

     GastosDiarios.iniciar(alCambiar)
         Se ejecuta una sola vez, al entrar al dashboard.
         Engancha el formulario y la tabla, pinta la lista guardada y llama
         alCambiar() despues de CADA alta o baja para que las tarjetas del
         resumen se recalculen.

     GastosDiarios.total()
         Devuelve un number: la suma de los montos guardados.
         La usa la tarjeta #card-gastos-variables.

   ---------------------------------------------------------------------------
   LO QUE YA ESTA LISTO PARA USAR

   Persistencia (finanzas/js/almacenamiento.js):
     Almacen.leerGastos()        -> arreglo (vacio si no hay nada)
     Almacen.guardarGastos(lista)

   Cada gasto es un objeto con esta forma:
     { id: 1757260980000, concepto: 'Almuerzo', monto: 18000,
       categoria: 'Comida', fecha: '2026-09-07' }

   IDs del HTML (finanzas/index.html):
     #form-gasto-diario   formulario (tiene novalidate)
     #gasto-concepto      input text
     #gasto-monto         input number
     #gasto-categoria     select: Comida | Ocio | Transporte | Varios
     #tabla-gastos        <tbody> de la tabla, con 5 columnas:
                          Concepto | Categoria | Fecha | Monto | Accion

   Clases de CSS ya escritas (finanzas/css/finanzas.css):
     .badge-categoria + .badge-comida / .badge-ocio / .badge-transporte /
     .badge-varios    para el badge de color de cada categoria
     .fila-vacia      para la fila de "aun no hay gastos"

   ---------------------------------------------------------------------------
   POR HACER

   1. renderizarTabla()
      Redibuja #tabla-gastos con la lista. Si esta vacia, una sola fila
      <tr class="fila-vacia"><td colspan="5">Aun no hay gastos registrados.</td></tr>
      Cada fila lleva el boton de eliminar con data-id="<id del gasto>".
      Formatear el monto con la funcion App.formatearMoneda(n).

   2. Alta (submit de #form-gasto-diario)
      preventDefault(). Validar que el concepto no este vacio y que el monto
      sea mayor que cero; marcar los campos malos con classList.add('is-invalid')
      y quitarselo cuando se corrijan. Nada de alert().
      Si esta bien: push con id Date.now() y fecha de hoy (YYYY-MM-DD),
      Almacen.guardarGastos(), renderizarTabla(), alCambiar(), limpiar el
      formulario y devolver el foco a #gasto-concepto.

   3. Eliminar
      Un solo listener sobre #tabla-gastos (delegacion de eventos), no uno por
      fila. Filtrar la lista por el data-id del boton, guardar, renderizar y
      llamar alCambiar().

   Para probar: python -m http.server 8080 en la raiz del repo y abrir
   http://localhost:8080/finanzas/
   ========================================================================== */

window.GastosDiarios = (function () {
    'use strict';

    // Lista en memoria; la fuente de verdad sigue siendo localStorage
    var gastos = [];

    function iniciar(alCambiar) {
        gastos = Almacen.leerGastos();

        // TODO: renderizarTabla(), enganchar el submit y el click de eliminar,
        //       y llamar alCambiar() despues de cada cambio.
        void alCambiar;
    }

    function total() {
        // TODO: sumar los montos. Mientras tanto devuelve 0 para que el
        //       dashboard se pinte sin romperse.
        return gastos.reduce(function (suma, gasto) {
            return suma + Number(gasto.monto || 0);
        }, 0);
    }

    return {
        iniciar: iniciar,
        total: total
    };
})();
