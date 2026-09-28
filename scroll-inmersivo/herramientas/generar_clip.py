"""
Genera el material de la demo de scroll inmersivo: un clip sintetico de una
bicicleta rodando, en dos formatos que salen de los MISMOS frames:

    assets/video.mp4          para la tecnica 1 (video controlado por scroll)
    assets/frames/f_000.webp  para la tecnica 2 (secuencia en canvas)

Asi la comparativa es justa: cambia la tecnica, no el contenido.

El clip es ciclico (el ultimo frame enlaza con el primero) y todo se dibuja
en funcion de t en [0, 1), sin estado entre frames.

Uso, desde la raiz del proyecto:

    pip install pillow imageio-ffmpeg
    python scroll-inmersivo/herramientas/generar_clip.py

ffmpeg se toma del PATH y, si no esta, del binario que trae imageio-ffmpeg.
"""

import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

# --- Parametros del clip ---------------------------------------------------
ANCHO, ALTO = 960, 540
SS = 2                      # supersampling: se dibuja al doble y se reduce
FRAMES = 96
FPS = 24
CALIDAD_WEBP = 78

# --- Paleta (mismos tonos que el sitio: acento azul, fondos oscuros) --------
CIELO_ARRIBA = (26, 39, 82)
CIELO_ABAJO = (255, 170, 110)
SOL = (255, 226, 160)
COLINA_LEJOS = (78, 76, 128)
COLINA_MEDIA = (52, 58, 104)
ASFALTO = (38, 40, 46)
BORDE = (58, 62, 70)
LINEA = (240, 240, 235)
POSTE = (24, 26, 34)
CUADRO = (13, 110, 253)
LLANTA = (18, 18, 22)
RAYO = (200, 205, 215)
PIEL = (232, 190, 160)
ROPA = (240, 240, 245)
PANTALON = (28, 30, 40)

RAIZ = Path(__file__).resolve().parent.parent
SALIDA_FRAMES = RAIZ / "assets" / "frames"
SALIDA_VIDEO = RAIZ / "assets" / "video.mp4"


def s(v):
    """Pasa una coordenada del lienzo final al lienzo de supersampling."""
    return v * SS


def cielo(dib, w, h):
    horizonte = int(h * 0.68)
    for y in range(horizonte):
        k = y / horizonte
        c = tuple(int(CIELO_ARRIBA[i] + (CIELO_ABAJO[i] - CIELO_ARRIBA[i]) * k) for i in range(3))
        dib.line([(0, y), (w, y)], fill=c)


def colinas(dib, w, h, t, base, amp, vueltas, color, fases):
    """Silueta ondulada que se desplaza `vueltas` anchos de pantalla por ciclo.

    Los periodos dividen exactamente el ancho, asi que al terminar el ciclo la
    silueta cae justo donde empezo.
    """
    desplaza = t * w * vueltas
    puntos = [(0, h)]
    for x in range(0, w + 8, 8):
        u = (x + desplaza) / w * 2 * math.pi
        y = base + amp * (math.sin(u * fases[0]) * 0.6 + math.sin(u * fases[1] + 1.3) * 0.4)
        puntos.append((x, y))
    puntos.append((w, h))
    dib.polygon(puntos, fill=color)


def rueda(dib, cx, cy, r, ang, grosor):
    dib.ellipse([cx - r, cy - r, cx + r, cy + r], outline=LLANTA, width=grosor)
    for i in range(16):
        a = ang + i * math.pi / 8
        dib.line([(cx, cy), (cx + math.cos(a) * (r - grosor), cy + math.sin(a) * (r - grosor))],
                 fill=RAYO, width=max(2, grosor // 5))
    dib.ellipse([cx - r * .09, cy - r * .09, cx + r * .09, cy + r * .09], fill=RAYO)


def pierna(dib, cadera, pedal, largo_muslo, largo_pierna, ancho):
    """Dos huesos con la rodilla hacia adelante (cinematica inversa)."""
    dx, dy = pedal[0] - cadera[0], pedal[1] - cadera[1]
    d = min(math.hypot(dx, dy), largo_muslo + largo_pierna - 1)
    a = math.atan2(dy, dx)
    cos_b = (largo_muslo ** 2 + d ** 2 - largo_pierna ** 2) / (2 * largo_muslo * d)
    b = math.acos(max(-1, min(1, cos_b)))
    rodilla = (cadera[0] + math.cos(a - b) * largo_muslo, cadera[1] + math.sin(a - b) * largo_muslo)
    dib.line([cadera, rodilla, pedal], fill=PANTALON, width=ancho, joint="curve")


def bicicleta(dib, t, gy, x0):
    r = s(78)
    base = s(250)                      # distancia entre ejes
    tr = (x0, gy - r)                  # eje trasero
    de = (x0 + base, gy - r)           # eje delantero
    pedalier = (x0 + base * .46, gy - r * .35)
    asiento = (x0 + base * .30, gy - r * 2.05)
    manillar = (x0 + base * .86, gy - r * 2.15)
    grosor = s(5)

    ang_rueda = t * 2 * math.pi * 3    # 3 vueltas por ciclo; el suelo se mueve igual
    rueda(dib, tr[0], tr[1], r, ang_rueda, s(9))
    rueda(dib, de[0], de[1], r, ang_rueda, s(9))

    # Cuadro
    dib.line([tr, pedalier, asiento, tr], fill=CUADRO, width=grosor, joint="curve")
    dib.line([asiento, (x0 + base * .80, gy - r * 2.0), pedalier], fill=CUADRO, width=grosor, joint="curve")
    dib.line([(x0 + base * .80, gy - r * 2.0), de], fill=CUADRO, width=grosor)
    dib.line([(x0 + base * .80, gy - r * 2.0), manillar], fill=CUADRO, width=grosor)
    dib.line([(asiento[0] - s(14), asiento[1] - s(5)), (asiento[0] + s(14), asiento[1] - s(5))],
             fill=LLANTA, width=s(7))

    # Bielas y pedales (cada pedal a media vuelta del otro)
    ang_biela = t * 2 * math.pi * 6
    larga = s(30)
    pedales = []
    for desfase in (0, math.pi):
        a = ang_biela + desfase
        p = (pedalier[0] + math.cos(a) * larga, pedalier[1] + math.sin(a) * larga)
        dib.line([pedalier, p], fill=RAYO, width=s(5))
        pedales.append(p)

    # Ciclista
    cadera = (asiento[0] + s(4), asiento[1] - s(12))
    hombro = (cadera[0] + s(78), cadera[1] - s(92))
    cabeza = (hombro[0] + s(16), hombro[1] - s(30))
    pierna(dib, cadera, pedales[1], s(74), s(78), s(15))
    dib.line([cadera, hombro], fill=ROPA, width=s(30))
    dib.line([hombro, (manillar[0] - s(6), manillar[1] - s(4))], fill=PIEL, width=s(10))
    dib.ellipse([cabeza[0] - s(19), cabeza[1] - s(19), cabeza[0] + s(19), cabeza[1] + s(19)], fill=PIEL)
    dib.pieslice([cabeza[0] - s(22), cabeza[1] - s(24), cabeza[0] + s(22), cabeza[1] + s(16)],
                 180, 360, fill=CUADRO)   # casco: la parte segura de "rodando seguro"
    pierna(dib, cadera, pedales[0], s(74), s(78), s(15))


def dibujar(i):
    t = i / FRAMES
    w, h = s(ANCHO), s(ALTO)
    img = Image.new("RGB", (w, h))
    dib = ImageDraw.Draw(img)

    cielo(dib, w, h)
    dib.ellipse([w * .70, h * .20, w * .70 + s(120), h * .20 + s(120)], fill=SOL)

    horizonte = int(h * 0.68)
    colinas(dib, w, horizonte + 4, t, horizonte - s(70), s(46), 1, COLINA_LEJOS, (2, 3))
    colinas(dib, w, horizonte + 4, t, horizonte - s(24), s(30), 2, COLINA_MEDIA, (3, 5))

    # Calzada
    dib.rectangle([0, horizonte, w, h], fill=ASFALTO)
    dib.rectangle([0, horizonte, w, horizonte + s(8)], fill=BORDE)
    gy = int(h * 0.90)                       # linea donde apoyan las ruedas

    # El suelo recorre exactamente lo que rueda la llanta: 3 vueltas por ciclo
    circunferencia = 2 * math.pi * s(78)
    recorrido = 3 * circunferencia
    periodo = recorrido / 10                 # 10 marcas por ciclo -> enlaza sin salto
    corrimiento = t * recorrido

    # Postes al borde de la calzada
    n = int(w / periodo) + 3
    for k in range(-1, n):
        x = k * periodo * 2 - (corrimiento % (periodo * 2))
        dib.rectangle([x, horizonte - s(58), x + s(9), horizonte + s(6)], fill=POSTE)
    # Linea central discontinua
    ymarca = horizonte + (gy - horizonte) * 0.35
    for k in range(-1, n):
        x = k * periodo - (corrimiento % periodo)
        dib.rectangle([x, ymarca, x + periodo * .5, ymarca + s(7)], fill=LINEA)

    bicicleta(dib, t, gy, s(330))

    return img.resize((ANCHO, ALTO), Image.LANCZOS)


def buscar_ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("No encuentro ffmpeg. Instala uno o `pip install imageio-ffmpeg`.")


def main():
    SALIDA_FRAMES.mkdir(parents=True, exist_ok=True)
    for viejo in SALIDA_FRAMES.glob("f_*.webp"):
        viejo.unlink()

    with tempfile.TemporaryDirectory() as tmp:
        for i in range(FRAMES):
            img = dibujar(i)
            img.save(SALIDA_FRAMES / f"f_{i:03d}.webp", "WEBP", quality=CALIDAD_WEBP, method=6)
            img.save(Path(tmp) / f"f_{i:03d}.png")
        print(f"{FRAMES} frames listos en {SALIDA_FRAMES}")

        # -g 1: cada cuadro es un keyframe. Sin esto, saltar a un instante
        # arbitrario obliga al navegador a decodificar desde el keyframe
        # anterior y el scrub se entrecorta.
        subprocess.run([
            buscar_ffmpeg(), "-y", "-loglevel", "error",
            "-framerate", str(FPS), "-i", str(Path(tmp) / "f_%03d.png"),
            "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-g", "1",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            str(SALIDA_VIDEO),
        ], check=True)
    print(f"Video listo en {SALIDA_VIDEO}")

    peso_frames = sum(f.stat().st_size for f in SALIDA_FRAMES.glob("f_*.webp"))
    print(f"Peso: video {SALIDA_VIDEO.stat().st_size / 1024:.0f} KB, "
          f"frames {peso_frames / 1024:.0f} KB")


if __name__ == "__main__":
    main()
