/* ==========================================================================
   Modulo de gastos diarios
   --------------------------------------------------------------------------
    Implementa el listado, alta, validacion y eliminacion de gastos diarios.

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
         Devuelve un number: la suma de TODOS los montos guardados.
         La usa la tarjeta #card-gastos-variables.

     GastosDiarios.totalEfectivo()
         Solo los que NO se pagaron con credito. Es lo que de verdad salio del
         ingreso del mes, asi que es lo que define el disponible y si salta la
         alerta de exceso.

     GastosDiarios.totalCredito()
         Solo los pagados con credito. Alimenta la franja de deuda.

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

    La tabla usa nodos DOM para que el concepto escrito por el usuario nunca se
    interprete como HTML. Los cambios se guardan mediante Almacen y notifican
    al dashboard con el callback recibido en iniciar().
   ========================================================================== */

window.GastosDiarios = (function () {
    'use strict';

    // Lista en memoria; la fuente de verdad sigue siendo localStorage
    var gastos = [];

    var formulario = document.getElementById('form-gasto-diario');
    var inputConcepto = document.getElementById('gasto-concepto');
    var inputMonto = document.getElementById('gasto-monto');
    var inputCategoria = document.getElementById('gasto-categoria');
    var inputCredito = document.getElementById('gasto-credito');
    var tabla = document.getElementById('tabla-gastos');

    // Los gastos guardados antes de que existiera el credito no traen el campo.
    // Se lee siempre por aqui para que cuenten como efectivo.
    function esCredito(gasto) {
        return !!gasto.credito;
    }

    function claseCategoria(categoria) {
        return {
            Comida: 'badge-comida',
            Ocio: 'badge-ocio',
            Transporte: 'badge-transporte',
            Varios: 'badge-varios'
        }[categoria] || 'badge-varios';
    }

    function crearCelda(texto) {
        var celda = document.createElement('td');
        celda.textContent = texto;
        return celda;
    }

    function renderizarTabla() {
        tabla.replaceChildren();

        if (gastos.length === 0) {
            var filaVacia = document.createElement('tr');
            filaVacia.className = 'fila-vacia';
            var celdaVacia = crearCelda('Aun no hay gastos registrados.');
            celdaVacia.colSpan = 5;
            filaVacia.appendChild(celdaVacia);
            tabla.appendChild(filaVacia);
            return;
        }

        gastos.forEach(function (gasto) {
            var fila = document.createElement('tr');
            var badge = document.createElement('span');
            var boton = document.createElement('button');

          fila.appendChild(crearCelda(gasto.concepto));
          badge.className = 'badge-categoria ' + claseCategoria(gasto.categoria);
          badge.textContent = gasto.categoria;
          var celdaCategoria = document.createElement('td');
          celdaCategoria.appendChild(badge);
          // Segundo badge solo para los que se pagaron con credito
          if (esCredito(gasto)) {
              var badgeCredito = document.createElement('span');
              badgeCredito.className = 'badge-categoria badge-credito ms-1';
              badgeCredito.textContent = 'Credito';
              celdaCategoria.appendChild(badgeCredito);
          }
          fila.appendChild(celdaCategoria);
          fila.appendChild(crearCelda(gasto.fecha));
          fila.appendChild(crearCelda(App.formatearMoneda(gasto.monto)));

            boton.type = 'button';
            boton.className = 'btn btn-sm btn-outline-danger';
            boton.dataset.id = String(gasto.id);
            boton.textContent = 'Eliminar';
            var celdaAccion = document.createElement('td');
            celdaAccion.appendChild(boton);
            fila.appendChild(celdaAccion);
            tabla.appendChild(fila);
        });
    }

    function fechaDeHoy() {
        var hoy = new Date();
        var mes = String(hoy.getMonth() + 1).padStart(2, '0');
        var dia = String(hoy.getDate()).padStart(2, '0');
        return hoy.getFullYear() + '-' + mes + '-' + dia;
    }

    function iniciar(alCambiar) {
        gastos = Almacen.leerGastos();
        renderizarTabla();

        formulario.addEventListener('submit', function (evento) {
            evento.preventDefault();

          var concepto = inputConcepto.value.trim();
          var monto = parseFloat(inputMonto.value);
          var conceptoInvalido = concepto === '';
          var montoInvalido = isNaN(monto) || monto <= 0;

          inputConcepto.classList.toggle('is-invalid', conceptoInvalido);
          inputMonto.classList.toggle('is-invalid', montoInvalido);

            if (conceptoInvalido || montoInvalido) {
                return;
            }

            gastos.push({
                id: Date.now(),
                concepto: concepto,
                monto: monto,
                categoria: inputCategoria.value,
                fecha: fechaDeHoy(),
                credito: inputCredito.checked
            });
            Almacen.guardarGastos(gastos);
            renderizarTabla();
            alCambiar();
            formulario.reset();
            inputConcepto.focus();
        });

        inputConcepto.addEventListener('input', function () {
            inputConcepto.classList.toggle('is-invalid', inputConcepto.value.trim() === '');
        });
        inputMonto.addEventListener('input', function () {
            var monto = parseFloat(inputMonto.value);
            inputMonto.classList.toggle('is-invalid', isNaN(monto) || monto <= 0);
        });

        tabla.addEventListener('click', function (evento) {
            var boton = evento.target.closest('button[data-id]');
            if (!boton || !tabla.contains(boton)) {
                return;
            }

            gastos = gastos.filter(function (gasto) {
                return String(gasto.id) !== boton.dataset.id;
            });
            Almacen.guardarGastos(gastos);
            renderizarTabla();
            alCambiar();
        });
    }

    // Suma los montos que cumplan el filtro. Sin filtro, suma todo.
    function sumar(filtro) {
        return gastos.reduce(function (suma, gasto) {
            if (filtro && !filtro(gasto)) {
                return suma;
            }
            return suma + Number(gasto.monto || 0);
        }, 0);
    }

    // Todo lo registrado. Alimenta la tarjeta "Gastos variables del mes".
    function total() {
        return sumar(null);
    }

    // Lo que salio del ingreso de este mes. Es lo que define el disponible
    // y, con el, si se paso o no del ingreso mensual.
    function totalEfectivo() {
        return sumar(function (gasto) {
            return !esCredito(gasto);
        });
    }

    // Lo que quedo debiendo
    function totalCredito() {
        return sumar(esCredito);
    }

    return {
        iniciar: iniciar,
        total: total,
        totalEfectivo: totalEfectivo,
        totalCredito: totalCredito
    };
})();
