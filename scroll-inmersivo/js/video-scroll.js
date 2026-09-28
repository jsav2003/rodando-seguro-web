/* ==========================================================================
   Tecnica 1: video HTML5 controlado por scroll
   --------------------------------------------------------------------------
   El <video> nunca se reproduce (no hay play()). En cada frame de animacion
   se calcula el progreso de scroll y se asigna a video.currentTime:

       currentTime = progreso * duracion

   El navegador hace un "seek" a ese instante y muestra el cuadro. El video se
   codifico con un keyframe en cada cuadro (-g 1), porque con el GOP normal
   cada seek obliga a decodificar desde el keyframe anterior y se entrecorta.
   ========================================================================== */

(function () {
    'use strict';

    var seccion = document.getElementById('escena-1');
    var video = document.getElementById('video-scroll');
    var CUADRO = 1 / 24;                 // duracion de un cuadro (el clip va a 24 fps)

    var valorProgreso = document.getElementById('v1-progreso');
    var valorPosicion = document.getElementById('v1-posicion');
    var valorSeeks = document.getElementById('v1-seeks');

    var actual = 0;                      // progreso ya suavizado
    var seeks = 0;                       // veces que se movio currentTime

    video.addEventListener('error', function () {
        Scroll.escribir(valorPosicion, 'no se pudo cargar');
    });

    Scroll.cadaCuadro(seccion, function (objetivo) {
        // Hasta tener los metadatos no se conoce la duracion
        if (!video.duration) {
            return;
        }

        actual = Scroll.suavizar(actual, objetivo);

        // Se resta un cuadro para no pedir el instante exacto del final
        var instante = actual * (video.duration - CUADRO);

        // Pedir otro seek con uno en curso solo acumula trabajo: se espera.
        // El umbral evita seeks por diferencias que ni se ven.
        if (!video.seeking && Math.abs(instante - video.currentTime) > CUADRO / 2) {
            video.currentTime = instante;
            seeks++;
        }

        Scroll.escribir(valorProgreso, Math.round(actual * 100) + '%');
        Scroll.escribir(valorPosicion, video.currentTime.toFixed(2) + ' s');
        Scroll.escribir(valorSeeks, String(seeks));
    });
})();
