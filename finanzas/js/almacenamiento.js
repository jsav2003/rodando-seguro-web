/* ==========================================================================
   Capa de persistencia (localStorage)
   --------------------------------------------------------------------------
   Todo lo que toca localStorage vive aqui y en ningun otro lado. El resto de
   la app pide y entrega objetos JavaScript; no sabe que existe el navegador.

   Se guardan dos claves independientes:

     finanzas.perfil        objeto con la caracterizacion (ingresos + gastos
                            fijos). Su AUSENCIA es la que decide si la app
                            abre en el wizard o en el dashboard.
     finanzas.gastosDiarios arreglo con los gastos cotidianos.

   Separarlas permite borrar los gastos sin perder la configuracion, y hace
   que el control de flujo sea una sola pregunta: hay perfil o no.

   Ejemplo de lo que queda guardado:

     finanzas.perfil
     {
       "ingresos": { "principal": 3200000, "adicionales": 400000 },
       "gastosFijos": [
         { "id": 1, "concepto": "Arriendo", "monto": 1400000,
           "compartido": true, "modo": "personas", "personas": 2,
           "porcentaje": 50, "montoReal": 700000 }
       ],
       "creadoEn": "2026-09-07T14:03:00.000Z"
     }

     finanzas.gastosDiarios
     [ { "id": 1757260980000, "concepto": "Almuerzo", "monto": 18000,
         "categoria": "Comida", "fecha": "2026-09-07" } ]
   ========================================================================== */

window.Almacen = (function () {
    'use strict';

    var CLAVE_PERFIL = 'finanzas.perfil';
    var CLAVE_GASTOS = 'finanzas.gastosDiarios';

    /* ======================================================================
       Acceso crudo, siempre envuelto
       En modo incognito o con el storage bloqueado, getItem/setItem lanzan
       excepcion. La app debe seguir usable aunque no pueda guardar.
       ====================================================================== */

    function leerCrudo(clave) {
        try {
            return localStorage.getItem(clave);
        } catch (e) {
            return null;
        }
    }

    function escribirCrudo(clave, texto) {
        try {
            localStorage.setItem(clave, texto);
            return true;
        } catch (e) {
            console.warn('[Almacen] No se pudo guardar', clave, e);
            return false;
        }
    }

    /* ======================================================================
       Perfil de caracterizacion
       ====================================================================== */

    // Devuelve el objeto guardado o null si no hay nada (o esta corrupto)
    function leerPerfil() {
        var texto = leerCrudo(CLAVE_PERFIL);
        if (!texto) {
            return null;
        }
        try {
            var perfil = JSON.parse(texto);
            // Un JSON valido pero con otra forma tampoco sirve
            if (!perfil || !perfil.ingresos || !Array.isArray(perfil.gastosFijos)) {
                return null;
            }
            return perfil;
        } catch (e) {
            console.warn('[Almacen] Perfil corrupto, se ignora:', e);
            return null;
        }
    }

    function guardarPerfil(perfil) {
        return escribirCrudo(CLAVE_PERFIL, JSON.stringify(perfil));
    }

    /* ======================================================================
       Gastos diarios
       ====================================================================== */

    // Siempre devuelve un arreglo: quien lo consume no tiene que preguntar
    function leerGastos() {
        var texto = leerCrudo(CLAVE_GASTOS);
        if (!texto) {
            return [];
        }
        try {
            var lista = JSON.parse(texto);
            return Array.isArray(lista) ? lista : [];
        } catch (e) {
            console.warn('[Almacen] Lista de gastos corrupta, se ignora:', e);
            return [];
        }
    }

    function guardarGastos(lista) {
        return escribirCrudo(CLAVE_GASTOS, JSON.stringify(lista));
    }

    /* ======================================================================
       Reseteo
       ====================================================================== */

    function borrarTodo() {
        try {
            localStorage.removeItem(CLAVE_PERFIL);
            localStorage.removeItem(CLAVE_GASTOS);
        } catch (e) {
            /* sin storage disponible: no hay nada que borrar */
        }
    }

    return {
        CLAVE_PERFIL: CLAVE_PERFIL,
        CLAVE_GASTOS: CLAVE_GASTOS,
        leerPerfil: leerPerfil,
        guardarPerfil: guardarPerfil,
        leerGastos: leerGastos,
        guardarGastos: guardarGastos,
        borrarTodo: borrarTodo
    };
})();
