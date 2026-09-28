/* ==========================================================================
   Tecnica 2: secuencia de imagenes en un <canvas> 2D
   --------------------------------------------------------------------------
   Los mismos 96 cuadros del clip, como imagenes WebP sueltas. Se precargan
   todas y, en cada frame de animacion, se dibuja en el canvas la que
   corresponde al progreso de scroll:

       indice = round(progreso * (TOTAL - 1))

   No hay decodificador de video de por medio: cada cuadro ya esta listo en
   memoria y drawImage() lo pinta al instante. El costo se paga al inicio
   (descargar todo) en vez de en cada movimiento.
   ========================================================================== */

(function () {
    'use strict';

    var TOTAL = 96;                      // debe coincidir con FRAMES en herramientas/generar_clip.py
    var RUTA = 'assets/frames/f_';

    var seccion = document.getElementById('escena-2');
    var canvas = document.getElementById('canvas-secuencia');
    var ctx = canvas.getContext('2d');
    var barra = document.getElementById('carga-secuencia');
    var textoCarga = document.getElementById('texto-carga');

    var valorProgreso = document.getElementById('v2-progreso');
    var valorPosicion = document.getElementById('v2-posicion');
    var valorDibujos = document.getElementById('v2-dibujos');

    var frames = [];
    var cargados = 0;
    var fallidos = 0;
    var actual = 0;                      // progreso ya suavizado
    var ultimoIndice = -1;               // ultimo cuadro dibujado
    var dibujos = 0;

    function rellenar(n) {
        return ('000' + n).slice(-3);
    }

    function alTerminarUno() {
        barra.value = cargados + fallidos;
        Scroll.escribir(textoCarga, cargados + ' / ' + TOTAL + ' cuadros');

        if (cargados + fallidos === TOTAL) {
            barra.hidden = true;
            if (fallidos > 0) {
                Scroll.escribir(textoCarga, 'faltan ' + fallidos + ' cuadros');
            } else {
                Scroll.escribir(textoCarga, 'secuencia lista');
            }
        }
    }

    // Precarga: el navegador pide todas en paralelo y las deja en cache
    barra.max = TOTAL;
    for (var i = 0; i < TOTAL; i++) {
        (function (indice) {
            var img = new Image();
            img.onload = function () {
                cargados++;
                alTerminarUno();
                // Con el primer cuadro ya se puede mostrar algo
                if (indice === 0) {
                    ctx.drawImage(img, 0, 0);
                }
            };
            img.onerror = function () {
                fallidos++;
                alTerminarUno();
            };
            img.src = RUTA + rellenar(indice) + '.webp';
            frames[indice] = img;
        })(i);
    }

    Scroll.cadaCuadro(seccion, function (objetivo) {
        actual = Scroll.suavizar(actual, objetivo);

        var indice = Math.round(actual * (TOTAL - 1));

        // Solo se redibuja si el cuadro cambio y ya esta descargado
        var img = frames[indice];
        if (indice !== ultimoIndice && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, 0, 0);
            ultimoIndice = indice;
            dibujos++;
        }

        Scroll.escribir(valorProgreso, Math.round(actual * 100) + '%');
        Scroll.escribir(valorPosicion, (indice + 1) + ' / ' + TOTAL);
        Scroll.escribir(valorDibujos, String(dibujos));
    });
})();
