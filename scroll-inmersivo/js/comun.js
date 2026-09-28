/* ==========================================================================
   Utilidades compartidas por las tres tecnicas de scroll inmersivo
   --------------------------------------------------------------------------
   Las tres demos hacen lo mismo en el fondo: convertir la posicion de scroll
   dentro de una seccion alta en un numero de 0 a 1 y usarlo para mover algo.
   Lo unico que cambia entre ellas es QUE se mueve (video, canvas o CSS).

   Este archivo tiene la parte comun para que la comparacion sea justa: las
   tres calculan el progreso igual, lo suavizan igual y dejan de trabajar
   cuando su seccion no se ve.
   ========================================================================== */

window.Scroll = (function () {
    'use strict';

    // Quien pidio menos movimiento en su sistema no recibe el suavizado
    var sinMovimiento = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function limitar(v) {
        return Math.min(1, Math.max(0, v));
    }

    // Cuanto se ha recorrido de la seccion: 0 cuando su borde superior toca el
    // tope de la ventana, 1 cuando su borde inferior toca el fondo. Entre los
    // dos, el contenido "pegado" (sticky o fixed) permanece en pantalla.
    function progreso(seccion) {
        var caja = seccion.getBoundingClientRect();
        var recorrido = caja.height - window.innerHeight;
        return recorrido > 0 ? limitar(-caja.top / recorrido) : 0;
    }

    // Interpolacion lineal hacia el objetivo. Sin ella, un salto de rueda del
    // raton se ve como un corte; con ella, el valor "alcanza" al scroll.
    function suavizar(actual, objetivo) {
        if (sinMovimiento) {
            return objetivo;
        }
        var diferencia = objetivo - actual;
        return Math.abs(diferencia) < 0.0005 ? objetivo : actual + diferencia * 0.12;
    }

    // Ejecuta `cuadro(progreso)` en cada frame de animacion, pero SOLO mientras
    // la seccion esta cerca de la pantalla. Fuera de ella no se gasta CPU.
    function cadaCuadro(seccion, cuadro) {
        var visible = false;
        var pedido = 0;

        function bucle() {
            cuadro(progreso(seccion));
            pedido = visible ? window.requestAnimationFrame(bucle) : 0;
        }

        new IntersectionObserver(function (entradas) {
            visible = entradas[0].isIntersecting;
            if (visible && !pedido) {
                bucle();
            }
        }, { rootMargin: '50% 0px 50% 0px' }).observe(seccion);
    }

    // Escribe en el DOM solo si el texto cambio: evita trabajo de layout inutil
    function escribir(elemento, texto) {
        if (elemento && elemento.textContent !== texto) {
            elemento.textContent = texto;
        }
    }

    return {
        sinMovimiento: sinMovimiento,
        progreso: progreso,
        suavizar: suavizar,
        cadaCuadro: cadaCuadro,
        escribir: escribir
    };
})();
