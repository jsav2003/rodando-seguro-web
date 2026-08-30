/* ==========================================================================
   Modo oscuro / claro con localStorage y sessionStorage
   --------------------------------------------------------------------------
   Diferencia entre los dos almacenamientos:

   localStorage    Persiste aunque se cierre el navegador. Se usa para la
                   PREFERENCIA de tema, que debe recordarse entre visitas.

   sessionStorage  Vive solo mientras la pestana este abierta y es propio de
                   cada pestana. Se usa para las METRICAS de la visita actual:
                   con que tema se entro y cuantas veces se cambio.
   ========================================================================== */

(function () {
    'use strict';

    // --- Claves de almacenamiento ----------------------------------------
    var CLAVE_TEMA = 'tema';           // localStorage
    var CLAVE_TEMA_INICIAL = 'temaInicial';    // sessionStorage
    var CLAVE_CAMBIOS = 'cambiosTema';    // sessionStorage

    var TEMA_CLARO = 'claro';
    var TEMA_OSCURO = 'oscuro';

    // --- Referencias al DOM ------------------------------------------------
    var raiz = document.documentElement;
    var btnTema = document.getElementById('btn-tema');
    var iconoTema = document.getElementById('icono-tema');
    var textoTema = document.getElementById('texto-tema');
    var btnRestablecer = document.getElementById('btn-restablecer');
    var mensajeRestablecer = document.getElementById('mensaje-restablecer');
    var valorTema = document.getElementById('valor-tema');
    var valorTemaInicial = document.getElementById('valor-tema-inicial');
    var valorCambios = document.getElementById('valor-cambios');

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
        btnTema.setAttribute('aria-pressed', String(esOscuro));
        // En modo oscuro el boton ofrece volver al claro, y viceversa
        iconoTema.innerHTML = esOscuro ? '&#9728;&#65039;' : '&#127769;';
        textoTema.textContent = esOscuro ? 'Modo claro' : 'Modo oscuro';
    }

    /* ======================================================================
       Metricas de la sesion (sessionStorage)
       ====================================================================== */

    function iniciarSesion(tema) {
        // Solo la primera carga de la pestana escribe el tema inicial
        if (leer(sessionStorage, CLAVE_TEMA_INICIAL) === null) {
            escribir(sessionStorage, CLAVE_TEMA_INICIAL, tema);
            escribir(sessionStorage, CLAVE_CAMBIOS, '0');
        }
    }

    function contarCambio() {
        var actual = parseInt(leer(sessionStorage, CLAVE_CAMBIOS), 10);
        if (isNaN(actual)) {
            actual = 0;
        }
        escribir(sessionStorage, CLAVE_CAMBIOS, String(actual + 1));
    }

    /* ======================================================================
       Panel informativo
       ====================================================================== */

    function renderizarPanel() {
        var temaEnLocal = leer(localStorage, CLAVE_TEMA);
        var inicial = leer(sessionStorage, CLAVE_TEMA_INICIAL);
        var cambios = leer(sessionStorage, CLAVE_CAMBIOS);

        // Si aun no hay preferencia guardada se aclara de donde sale el tema
        valorTema.textContent = temaEnLocal ? temaEnLocal : '(sin guardar - segun el sistema)';
        valorTemaInicial.textContent = inicial ? inicial : '-';
        valorCambios.textContent = cambios !== null ? cambios : '0';
    }

    /* ======================================================================
       Eventos
       ====================================================================== */

    btnTema.addEventListener('click', function () {
        var nuevoTema = temaActual() === TEMA_OSCURO ? TEMA_CLARO : TEMA_OSCURO;

        aplicarTema(nuevoTema);
        escribir(localStorage, CLAVE_TEMA, nuevoTema); // preferencia persistente
        contarCambio();                                // metrica de la sesion
        renderizarPanel();
    });

    btnRestablecer.addEventListener('click', function () {
        borrar(localStorage, CLAVE_TEMA);

        // Sin preferencia guardada, la pagina vuelve a seguir al sistema
        aplicarTema(temaDelSistema());
        renderizarPanel();

        mensajeRestablecer.textContent =
            'Preferencia borrada de localStorage. Ahora se usa el tema del sistema.';
    });

    /* ======================================================================
       Arranque
       ====================================================================== */

    var temaInicial = obtenerTemaGuardado();

    // El script inline del <head> ya aplico el atributo para evitar el
    // destello blanco; aqui se repite para dejar el boton en su estado correcto.
    aplicarTema(temaInicial);
    iniciarSesion(temaInicial);
    renderizarPanel();

    console.log('[Tema] Iniciado en modo:', temaInicial);
})();
