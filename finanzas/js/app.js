/* ==========================================================================
   Finanzas Personales - caracterizacion, dashboard y control de flujo
   --------------------------------------------------------------------------
   La app es una SPA: un solo index.html con dos <section> que se alternan.
   Cual se muestra lo decide una sola pregunta, al arrancar:

       Almacen.leerPerfil()  ->  null ?  wizard  :  dashboard

   El registro de gastos diarios NO esta aqui: vive en js/gastos-diarios.js y
   se consume por su contrato (iniciar / total).
   ========================================================================== */

window.App = (function () {
    'use strict';

    /* ======================================================================
       Utilidades
       ====================================================================== */

    var formateador = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });

    // Expuesta porque gastos-diarios.js tambien pinta montos en su tabla
    function formatearMoneda(numero) {
        return formateador.format(Number(numero) || 0);
    }

    // Lee un input numerico tolerando el vacio
    function numeroDe(input) {
        var valor = parseFloat(input.value);
        return isNaN(valor) ? 0 : valor;
    }

    function marcar(input, esInvalido) {
        input.classList.toggle('is-invalid', esInvalido);
        return !esInvalido;
    }

    /* ======================================================================
       Reglas de negocio
       Funciones puras: reciben datos y devuelven numeros, no tocan el DOM.
       ====================================================================== */

    // Que porcentaje del gasto asume esta persona
    function porcentajeDe(gasto) {
        if (!gasto.compartido) {
            return 100;
        }
        if (gasto.modo === 'personas') {
            var personas = Number(gasto.personas) || 1;
            return 100 / personas;
        }
        return Number(gasto.porcentaje) || 0;
    }

    // Lo que realmente sale del bolsillo
    function montoRealDe(gasto) {
        return Math.round(Number(gasto.monto) * porcentajeDe(gasto) / 100);
    }

    function totalIngresos(perfil) {
        return Number(perfil.ingresos.principal) + Number(perfil.ingresos.adicionales || 0);
    }

    function totalGastosFijos(perfil) {
        return perfil.gastosFijos.reduce(function (suma, gasto) {
            return suma + Number(gasto.montoReal);
        }, 0);
    }

    /* ======================================================================
       Referencias al DOM
       ====================================================================== */

    var vistaCaracterizacion = document.getElementById('vista-caracterizacion');
    var vistaDashboard = document.getElementById('vista-dashboard');
    var itemReset = document.getElementById('item-reset');

    var formCaracterizacion = document.getElementById('form-caracterizacion');
    var inputPrincipal = document.getElementById('ingreso-principal');
    var inputAdicionales = document.getElementById('ingresos-adicionales');
    var listaGastosFijos = document.getElementById('lista-gastos-fijos');
    var btnAgregarGastoFijo = document.getElementById('btn-agregar-gasto-fijo');
    var errorGastosFijos = document.getElementById('error-gastos-fijos');
    var plantillaGasto = document.getElementById('tpl-gasto-fijo');

    var cardIngresos = document.getElementById('card-ingresos');
    var cardGastosFijos = document.getElementById('card-gastos-fijos');
    var cardBalance = document.getElementById('card-balance');
    var cardGastosVariables = document.getElementById('card-gastos-variables');
    var notaIngresos = document.getElementById('nota-ingresos');
    var notaGastosFijos = document.getElementById('nota-gastos-fijos');
    var notaBalance = document.getElementById('nota-balance');
    var notaGastosVariables = document.getElementById('nota-gastos-variables');
    var tablaFijos = document.getElementById('tabla-fijos');

    var modalReset = document.getElementById('modal-reset');
    var btnConfirmarReset = document.getElementById('btn-confirmar-reset');

    // Contador para dar ids unicos a los switches clonados de la plantilla
    var contadorFilas = 0;

    // Perfil que se esta mostrando en el dashboard
    var perfilActivo = null;

    /* ======================================================================
       Vistas
       ====================================================================== */

    function mostrarCaracterizacion() {
        vistaDashboard.classList.add('d-none');
        vistaCaracterizacion.classList.remove('d-none');
        itemReset.classList.add('d-none');
    }

    function mostrarDashboard(perfil) {
        perfilActivo = perfil;

        vistaCaracterizacion.classList.add('d-none');
        vistaDashboard.classList.remove('d-none');
        itemReset.classList.remove('d-none');

        renderizarDetalleFijos();
        // El modulo de gastos diarios avisa por callback cada vez que cambia
        // algo, para que las tarjetas se recalculen solas.
        GastosDiarios.iniciar(renderizarResumen);
        renderizarResumen();
    }

    /* ======================================================================
       Wizard: filas de gastos fijos
       ====================================================================== */

    // Sincroniza la etiqueta y los limites del input segun el modo de reparto
    function ajustarModo(fila) {
        var modo = fila.querySelector('.modo-division').value;
        var etiqueta = fila.querySelector('.etiqueta-division');
        var valor = fila.querySelector('.valor-division');

        if (modo === 'personas') {
            etiqueta.textContent = 'Entre cuantas personas';
            valor.min = 2;
            valor.max = 50;
            if (numeroDe(valor) > 50 || numeroDe(valor) < 2) {
                valor.value = 2;
            }
        } else {
            etiqueta.textContent = 'Tu aporte (%)';
            valor.min = 1;
            valor.max = 100;
            if (numeroDe(valor) > 100 || numeroDe(valor) < 1) {
                valor.value = 50;
            }
        }
    }

    // Vista previa de lo que se paga realmente, mientras se escribe
    function actualizarPrevia(fila) {
        var gasto = {
            monto: numeroDe(fila.querySelector('.campo-monto')),
            compartido: fila.querySelector('.chk-compartido').checked,
            modo: fila.querySelector('.modo-division').value,
            porcentaje: numeroDe(fila.querySelector('.valor-division')),
            personas: numeroDe(fila.querySelector('.valor-division'))
        };
        fila.querySelector('.monto-real').textContent = formatearMoneda(montoRealDe(gasto));
    }

    function agregarFilaGastoFijo() {
        contadorFilas += 1;

        var fila = plantillaGasto.content.firstElementChild.cloneNode(true);

        // El switch y su <label> necesitan un id unico para asociarse
        var idSwitch = 'compartido-' + contadorFilas;
        fila.querySelector('.chk-compartido').id = idSwitch;
        fila.querySelector('.lbl-compartido').setAttribute('for', idSwitch);

        var chk = fila.querySelector('.chk-compartido');
        var bloque = fila.querySelector('.bloque-compartido');

        chk.addEventListener('change', function () {
            bloque.classList.toggle('d-none', !chk.checked);
            actualizarPrevia(fila);
        });

        fila.querySelector('.modo-division').addEventListener('change', function () {
            ajustarModo(fila);
            actualizarPrevia(fila);
        });

        fila.querySelector('.valor-division').addEventListener('input', function () {
            actualizarPrevia(fila);
        });

        fila.querySelector('.campo-monto').addEventListener('input', function () {
            actualizarPrevia(fila);
        });

        fila.querySelector('.btn-quitar-gasto').addEventListener('click', function () {
            fila.remove();
        });

        listaGastosFijos.appendChild(fila);
        return fila;
    }

    // Valida una fila y, si esta bien, devuelve el objeto del gasto
    function recogerFila(fila, indice) {
        var inputConcepto = fila.querySelector('.campo-concepto');
        var inputMonto = fila.querySelector('.campo-monto');
        var inputValor = fila.querySelector('.valor-division');
        var compartido = fila.querySelector('.chk-compartido').checked;
        var modo = fila.querySelector('.modo-division').value;

        var concepto = inputConcepto.value.trim();
        var monto = numeroDe(inputMonto);
        var division = numeroDe(inputValor);

        var ok = marcar(inputConcepto, concepto === '');
        ok = marcar(inputMonto, monto <= 0) && ok;

        if (compartido) {
            var fueraDeRango = modo === 'personas'
                ? (division < 2 || division > 50)
                : (division < 1 || division > 100);
            ok = marcar(inputValor, fueraDeRango) && ok;
        } else {
            marcar(inputValor, false);
        }

        if (!ok) {
            return null;
        }

        var gasto = {
            id: indice + 1,
            concepto: concepto,
            monto: monto,
            compartido: compartido,
            modo: compartido ? modo : null,
            personas: compartido && modo === 'personas' ? division : null,
            porcentaje: 100
        };

        if (compartido) {
            gasto.porcentaje = modo === 'personas'
                ? Math.round((100 / division) * 100) / 100
                : division;
        }

        gasto.montoReal = montoRealDe(gasto);
        return gasto;
    }

    /* ======================================================================
       Wizard: guardar la configuracion
       ====================================================================== */

    function guardarConfiguracion(evento) {
        evento.preventDefault();

        var principal = numeroDe(inputPrincipal);
        var adicionales = numeroDe(inputAdicionales);

        var ok = marcar(inputPrincipal, principal <= 0);
        ok = marcar(inputAdicionales, adicionales < 0) && ok;

        var filas = listaGastosFijos.querySelectorAll('.fila-gasto-fijo');
        errorGastosFijos.classList.toggle('d-none', filas.length > 0);
        if (filas.length === 0) {
            ok = false;
        }

        var gastosFijos = [];
        for (var i = 0; i < filas.length; i++) {
            var gasto = recogerFila(filas[i], i);
            if (gasto === null) {
                ok = false;
            } else {
                gastosFijos.push(gasto);
            }
        }

        if (!ok) {
            // El primer campo con problema recibe el foco
            var primerError = formCaracterizacion.querySelector('.is-invalid');
            if (primerError) {
                primerError.focus();
            }
            return;
        }

        var perfil = {
            ingresos: {
                principal: principal,
                adicionales: adicionales
            },
            gastosFijos: gastosFijos,
            creadoEn: new Date().toISOString()
        };

        Almacen.guardarPerfil(perfil);
        mostrarDashboard(perfil);
    }

    /* ======================================================================
       Dashboard: panel de resumen
       ====================================================================== */

    function renderizarResumen() {
        if (!perfilActivo) {
            return;
        }

        var ingresos = totalIngresos(perfilActivo);
        var fijos = totalGastosFijos(perfilActivo);
        var balance = ingresos - fijos;
        var variables = GastosDiarios.total();
        var disponible = balance - variables;

        cardIngresos.textContent = formatearMoneda(ingresos);
        notaIngresos.textContent = perfilActivo.ingresos.adicionales > 0
            ? 'Principal + ' + formatearMoneda(perfilActivo.ingresos.adicionales) + ' adicionales'
            : 'Sin ingresos adicionales';

        cardGastosFijos.textContent = formatearMoneda(fijos);
        var declarado = perfilActivo.gastosFijos.reduce(function (suma, gasto) {
            return suma + Number(gasto.monto);
        }, 0);
        notaGastosFijos.textContent = declarado !== fijos
            ? formatearMoneda(declarado) + ' declarados, ajustado por compartidos'
            : perfilActivo.gastosFijos.length + ' gasto(s) fijo(s)';

        cardBalance.textContent = formatearMoneda(balance);
        cardBalance.classList.toggle('valor-positivo', balance >= 0);
        cardBalance.classList.toggle('valor-negativo', balance < 0);
        notaBalance.textContent = 'Disponible hoy: ' + formatearMoneda(disponible);

        cardGastosVariables.textContent = formatearMoneda(variables);
        notaGastosVariables.textContent = ingresos > 0
            ? Math.round(variables / ingresos * 100) + '% de tus ingresos'
            : '';
    }

    // Desglose de los gastos fijos: cuanto vale y cuanto asume el usuario
    function renderizarDetalleFijos() {
        var html = '';

        perfilActivo.gastosFijos.forEach(function (gasto) {
            var reparto = 'Completo';
            if (gasto.compartido) {
                reparto = gasto.modo === 'personas'
                    ? 'Entre ' + gasto.personas + ' personas'
                    : gasto.porcentaje + '% tuyo';
            }

            html += '<tr>' +
                '<td>' + gasto.concepto + '</td>' +
                '<td class="text-end">' + formatearMoneda(gasto.monto) + '</td>' +
                '<td>' + reparto + '</td>' +
                '<td class="text-end">' + formatearMoneda(gasto.montoReal) + '</td>' +
                '</tr>';
        });

        tablaFijos.innerHTML = html;
    }

    /* ======================================================================
       Reseteo
       ====================================================================== */

    /* El boton de confirmar lleva data-bs-dismiss, asi que Bootstrap se
       encarga de cerrar el modal y retirar el backdrop. Aqui solo se marca la
       intencion y el borrado se ejecuta en hidden.bs.modal, ya con el modal
       fuera: cerrarlo a mano desde el handler dejaba el backdrop pegado y la
       pagina sin scroll. La bandera distingue "confirmar" de "cancelar", que
       disparan el mismo evento. */
    var resetConfirmado = false;

    function resetear() {
        Almacen.borrarTodo();
        perfilActivo = null;

        // El wizard vuelve a quedar en blanco, con una fila lista
        formCaracterizacion.reset();
        formCaracterizacion.querySelectorAll('.is-invalid').forEach(function (campo) {
            campo.classList.remove('is-invalid');
        });
        listaGastosFijos.innerHTML = '';
        agregarFilaGastoFijo();
        errorGastosFijos.classList.add('d-none');

        mostrarCaracterizacion();
    }

    /* ======================================================================
       Eventos
       ====================================================================== */

    formCaracterizacion.addEventListener('submit', guardarConfiguracion);
    btnAgregarGastoFijo.addEventListener('click', agregarFilaGastoFijo);

    btnConfirmarReset.addEventListener('click', function () {
        resetConfirmado = true;
    });

    modalReset.addEventListener('hidden.bs.modal', function () {
        if (resetConfirmado) {
            resetConfirmado = false;
            resetear();
        }
    });

    /* ======================================================================
       Arranque
       ====================================================================== */

    document.addEventListener('DOMContentLoaded', function () {
        var perfil = Almacen.leerPerfil();

        if (perfil) {
            mostrarDashboard(perfil);
            console.log('[Finanzas] Perfil encontrado, abriendo dashboard');
        } else {
            agregarFilaGastoFijo();
            mostrarCaracterizacion();
            console.log('[Finanzas] Sin perfil guardado, abriendo caracterizacion');
        }
    });

    return {
        formatearMoneda: formatearMoneda,
        porcentajeDe: porcentajeDe,
        montoRealDe: montoRealDe
    };
})();
