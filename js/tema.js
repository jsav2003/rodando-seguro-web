/* ==========================================================================
   Tema claro / oscuro - modulo compartido
   --------------------------------------------------------------------------
   Lo usan las paginas del sitio que tienen boton de tema:

     modo-oscuro/index.html   demo del ejercicio (ademas lleva su panel de storage)
     finanzas/index.html      SPA de finanzas personales

   El portafolio (index.html) no tiene boton de tema y no carga este script.

   Por eso aqui solo vive lo del TEMA. Las metricas de la visita
   (temaInicial, cambiosTema) son propias de modo-oscuro/ y se quedan en
   modo-oscuro/js/main.js, que se suscribe con Tema.alCambiar().

   Todas las referencias al DOM llevan guarda de nulidad: la pagina de
   finanzas no tiene panel de storage y no por eso debe romperse.
   ========================================================================== */

window.Tema = (function () {
    'use strict';

    var CLAVE_TEMA = 'tema';      // localStorage
    var TEMA_CLARO = 'claro';
    var TEMA_OSCURO = 'oscuro';

    var raiz = document.documentElement;
    var btnTema = document.getElementById('btn-tema');
    var iconoTema = document.getElementById('icono-tema');
    var textoTema = document.getElementById('texto-tema');

    // Callbacks que quieren enterarse de cada cambio de tema
    var suscriptores = [];

    /* ======================================================================
       Acceso seguro al almacenamiento
       En modo incognito o con las cookies bloqueadas, leer o escribir puede
       lanzar una excepcion. Se envuelve todo para que la pagina siga
       funcionando aunque no se pueda guardar nada.
       ====================================================================== */

    function leer(almacen, clave) {
        try {
            return almacen.getItem(clave);
        } catch (e) {
            return null;
        }
    }

    function escribir(almacen, clave, valor) {
        try {
            almacen.setItem(clave, valor);
            return true;
        } catch (e) {
            return false;
        }
    }

    function borrar(almacen, clave) {
        try {
            almacen.removeItem(clave);
        } catch (e) {
            /* sin storage disponible: no hay nada que borrar */
        }
    }

    /* ======================================================================
       Tema
       ====================================================================== */

    // Tema que prefiere el sistema operativo del usuario
    function temaDelSistema() {
        return window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches ? TEMA_OSCURO : TEMA_CLARO;
    }

    // Prioridad: lo guardado en localStorage > preferencia del sistema
    function obtenerTemaGuardado() {
        var guardado = leer(localStorage, CLAVE_TEMA);
        if (guardado === TEMA_CLARO || guardado === TEMA_OSCURO) {
            return guardado;
        }
        return temaDelSistema();
    }

    // Tema que se esta mostrando ahora mismo
    function temaActual() {
        return raiz.getAttribute('data-tema') === TEMA_OSCURO ? TEMA_OSCURO : TEMA_CLARO;
    }

    // Pinta el tema y sincroniza el boton con el estado real
    function aplicarTema(tema) {
        raiz.setAttribute('data-tema', tema);

        var esOscuro = tema === TEMA_OSCURO;

        // En modo oscuro el boton ofrece volver al claro, y viceversa
        if (btnTema) {
            btnTema.setAttribute('aria-pressed', String(esOscuro));
        }
        if (iconoTema) {
            iconoTema.innerHTML = esOscuro ? '&#9728;&#65039;' : '&#127769;';
        }
        if (textoTema) {
            textoTema.textContent = esOscuro ? 'Modo claro' : 'Modo oscuro';
        }
    }

    // Registra un callback que se ejecuta despues de cada cambio de tema
    function alCambiar(fn) {
        if (typeof fn === 'function') {
            suscriptores.push(fn);
        }
    }

    function avisar(tema) {
        for (var i = 0; i < suscriptores.length; i++) {
            suscriptores[i](tema);
        }
    }

    /* ======================================================================
       Arranque
       ====================================================================== */

    var inicial = obtenerTemaGuardado();

    // El script inline del <head> ya aplico el atributo para evitar el
    // destello blanco; aqui se repite para dejar el boton en su estado correcto.
    aplicarTema(inicial);

    if (btnTema) {
        btnTema.addEventListener('click', function () {
            var nuevoTema = temaActual() === TEMA_OSCURO ? TEMA_CLARO : TEMA_OSCURO;

            aplicarTema(nuevoTema);
            escribir(localStorage, CLAVE_TEMA, nuevoTema); // preferencia persistente
            avisar(nuevoTema);
        });
    }

    return {
        CLAVE_TEMA: CLAVE_TEMA,
        TEMA_CLARO: TEMA_CLARO,
        TEMA_OSCURO: TEMA_OSCURO,
        leer: leer,
        escribir: escribir,
        borrar: borrar,
        temaDelSistema: temaDelSistema,
        obtenerTemaGuardado: obtenerTemaGuardado,
        temaActual: temaActual,
        aplicarTema: aplicarTema,
        alCambiar: alCambiar,
        inicial: inicial
    };
})();
