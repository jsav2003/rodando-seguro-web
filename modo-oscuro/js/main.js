/* ==========================================================================
   Panel de almacenamiento del portafolio
   --------------------------------------------------------------------------
   La logica del TEMA vive en js/tema.js, que es compartido con la app de
   finanzas. Aqui queda solo lo que es propio de esta pagina: las metricas
   de la visita y el panel que las muestra.

   Diferencia entre los dos almacenamientos:

   localStorage    Persiste aunque se cierre el navegador. Se usa para la
                   PREFERENCIA de tema, que debe recordarse entre visitas.
                   La maneja js/tema.js.

   sessionStorage  Vive solo mientras la pestana este abierta y es propio de
                   cada pestana. Se usa para las METRICAS de la visita actual:
                   con que tema se entro y cuantas veces se cambio.
   ========================================================================== */

(function () {
    'use strict';

    // Helpers de storage y constantes del tema, reutilizados desde el modulo
    var leer = Tema.leer;
    var escribir = Tema.escribir;
    var borrar = Tema.borrar;

    // --- Claves de almacenamiento ----------------------------------------
    var CLAVE_TEMA_INICIAL = 'temaInicial';    // sessionStorage
    var CLAVE_CAMBIOS = 'cambiosTema';    // sessionStorage

    // --- Referencias al DOM ------------------------------------------------
    var btnRestablecer = document.getElementById('btn-restablecer');
    var mensajeRestablecer = document.getElementById('mensaje-restablecer');
    var valorTema = document.getElementById('valor-tema');
    var valorTemaInicial = document.getElementById('valor-tema-inicial');
    var valorCambios = document.getElementById('valor-cambios');

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
        var temaEnLocal = leer(localStorage, Tema.CLAVE_TEMA);
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

    // js/tema.js ya aplico el tema y guardo la preferencia; aqui solo se
    // cuenta el cambio y se repinta el panel.
    Tema.alCambiar(function () {
        contarCambio();
        renderizarPanel();
    });

    btnRestablecer.addEventListener('click', function () {
        borrar(localStorage, Tema.CLAVE_TEMA);

        // Sin preferencia guardada, la pagina vuelve a seguir al sistema
        Tema.aplicarTema(Tema.temaDelSistema());
        renderizarPanel();

        mensajeRestablecer.textContent =
            'Preferencia borrada de localStorage. Ahora se usa el tema del sistema.';
    });

    /* ======================================================================
       Arranque
       ====================================================================== */

    iniciarSesion(Tema.inicial);
    renderizarPanel();

    console.log('[Tema] Iniciado en modo:', Tema.inicial);
})();
