/* ==========================================================================
   Tecnica 3: DOM y CSS avanzado (position: fixed + IntersectionObserver +
   transform)
   --------------------------------------------------------------------------
   No hay video ni canvas: la escena es HTML/SVG. El reparto de trabajo es:

   IntersectionObserver  Decide CUANDO la escena esta pegada a la pantalla
                         (fixed), y cuando se suelta arriba o abajo de la
                         seccion. Tambien revela cada paso de texto.
   JavaScript            Solo escribe UN numero: la variable CSS --p (0 a 1).
   CSS                   Hace todo el movimiento con transform, que el
                         navegador anima en la GPU sin recalcular el layout:
                         translateX(calc(var(--p) * ...)) y rotate(...).
   ========================================================================== */

(function () {
    'use strict';

    var seccion = document.getElementById('escena-3');
    var capa = document.getElementById('capa-fija');
    var pasos = seccion.querySelectorAll('.paso');

    var valorProgreso = document.getElementById('v3-progreso');
    var valorCapa = document.getElementById('v3-capa');
    var valorActualizaciones = document.getElementById('v3-actualizaciones');

    var actual = 0;                      // progreso ya suavizado
    var ultimo = -1;                     // ultimo valor escrito en --p
    var actualizaciones = 0;

    /* ======================================================================
       1. La capa se pega y se suelta
       La escena vive dentro de la seccion. Mientras la seccion cubre toda la
       ventana va en position: fixed; antes y despues se queda anclada a su
       borde con position: absolute, en el mismo lugar donde estaba fija, asi
       que el cambio no se nota. Sin esto, la capa fija taparia el resto de
       la pagina.

       Dos observadores vigilan una franja de 1% en el borde superior y otra
       en el inferior de la ventana. Cuando la seccion entra o sale de
       cualquiera de las dos, se recalcula el estado.
       ====================================================================== */

    function ubicarCapa() {
        var caja = seccion.getBoundingClientRect();
        var estado = 'fijo';

        if (caja.top > 0) {
            estado = 'antes';            // la seccion aun no llega al tope
        } else if (caja.bottom < window.innerHeight) {
            estado = 'despues';          // el fondo de la seccion ya subio
        }

        if (capa.getAttribute('data-estado') !== estado) {
            capa.setAttribute('data-estado', estado);
        }
        Scroll.escribir(valorCapa, estado);
    }

    new IntersectionObserver(ubicarCapa, { rootMargin: '0px 0px -99% 0px' }).observe(seccion);
    new IntersectionObserver(ubicarCapa, { rootMargin: '-99% 0px 0px 0px' }).observe(seccion);
    window.addEventListener('resize', ubicarCapa);
    ubicarCapa();

    /* ======================================================================
       2. Los pasos de texto aparecen al entrar en pantalla
       ====================================================================== */

    var observadorPasos = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            entrada.target.classList.toggle('visible', entrada.isIntersecting);
        });
    }, { threshold: 0.5 });

    for (var i = 0; i < pasos.length; i++) {
        observadorPasos.observe(pasos[i]);
    }

    /* ======================================================================
       3. El progreso se entrega a CSS como una variable
       ====================================================================== */

    Scroll.cadaCuadro(seccion, function (objetivo) {
        actual = Scroll.suavizar(actual, objetivo);

        if (Math.abs(actual - ultimo) > 0.0001) {
            capa.style.setProperty('--p', actual.toFixed(4));
            ultimo = actual;
            actualizaciones++;
        }

        Scroll.escribir(valorProgreso, Math.round(actual * 100) + '%');
        Scroll.escribir(valorActualizaciones, String(actualizaciones));
    });
})();
