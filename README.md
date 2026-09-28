# Portafolio — Desarrollo de Aplicaciones Web

Portafolio del curso. Incluye, como página propia en `modo-oscuro/`, el
ejercicio de la Semana 5: **modo oscuro / claro** persistente usando HTML,
CSS y JavaScript, con manejo de `localStorage` y `sessionStorage`.

## Cómo ejecutar

No requiere instalación ni dependencias. Desde la raíz del proyecto:

```bash
python -m http.server 8080
```

Luego abrir <http://localhost:8080>.

También puede abrirse el `index.html` directamente en el navegador, pero se
recomienda el servidor local para que el almacenamiento se comporte igual que
en producción.

> Bootstrap 5.2.3 se carga desde CDN, así que hace falta conexión a internet.

## Cómo funciona el cambio de tema

La demo vive en `modo-oscuro/` (enlazada desde la tarjeta "Modo oscuro / claro"
del portafolio). El portafolio en sí (`index.html`) no lleva el interruptor:
siempre se muestra en el tema claro por defecto.

El interruptor es el atributo `data-tema` del elemento `<html>`:

```html
<html data-tema="claro">   <!-- usa los valores de :root -->
<html data-tema="oscuro">  <!-- usa los valores redefinidos -->
```

En `css/styles.css` los colores están definidos como variables CSS. El modo
oscuro **solo redefine los tokens**, no repite las reglas:

```css
:root                { --color-fondo: #ffffff; --color-texto: #212529; }
[data-tema="oscuro"] { --color-fondo: #121212; --color-texto: #e9ecef; }
```

Bootstrap 5.2.3 no incluye modo oscuro nativo (los *color modes* llegaron en la
5.3), por lo que el tema está escrito a mano.

## localStorage vs sessionStorage

| Almacenamiento | Clave | Qué guarda | Cuánto dura |
|---|---|---|---|
| `localStorage` | `tema` | La preferencia elegida (`claro` / `oscuro`) | Persiste al cerrar el navegador |
| `sessionStorage` | `temaInicial` | Tema con el que se abrió la pestaña | Solo mientras la pestaña esté abierta |
| `sessionStorage` | `cambiosTema` | Número de cambios de tema en esta visita | Solo mientras la pestaña esté abierta |

La sección **Estado del almacenamiento** de `modo-oscuro/` muestra los tres
valores en vivo. Para ver la diferencia entre ambos: cambia el tema varias
veces y abre la página en una pestaña nueva — el tema se mantiene
(`localStorage`) pero el contador vuelve a cero (`sessionStorage`).

El botón *Restablecer preferencia* borra la clave de `localStorage` y la página
vuelve a seguir el tema del sistema operativo (`prefers-color-scheme`).

### Detalle: evitar el destello blanco

Si el tema se aplicara solo desde `js/tema.js`, al recargar en modo oscuro se
vería un flash blanco antes de que cargue el script. Por eso `modo-oscuro/index.html`
y `finanzas/index.html` llevan un pequeño script inline en el `<head>` que lee
`localStorage` y aplica `data-tema` antes del primer pintado. Es el único
JavaScript inline de cada página.

Todos los accesos al almacenamiento están dentro de `try/catch`: en modo
incógnito el navegador puede bloquearlos, y la página debe seguir funcionando.

## Estructura

```
index.html          Portafolio: navbar, hero, tarjetas de trabajos, footer
css/styles.css      Variables de tema y estilos propios, compartidos por todo el sitio
js/tema.js          Modo oscuro/claro. Compartido por modo-oscuro/ y finanzas/
modo-oscuro/        Ejercicio de la Semana 5: interruptor de tema y panel de storage (ver abajo)
finanzas/           Parcial: SPA de caracterización financiera (ver abajo)
scroll-inmersivo/   Demo comparativa de tres técnicas de scroll inmersivo (ver abajo)
assets/img/         Imágenes optimizadas que usa la página
assets/docs/        Documentos
```

### Ejercicio: Modo oscuro / claro

```
modo-oscuro/
├── index.html   Explicación del ejercicio, interruptor de tema y panel de storage
└── js/main.js   Métricas de sesión y panel de almacenamiento, propios de esta página
```

Reutiliza `../css/styles.css` y `../js/tema.js` del portafolio. También se
llega desde la tarjeta "Modo oscuro / claro" del portafolio.

Las imágenes se guardan optimizadas (`banner.jpg`, `ekomart.jpg`, `finanzas.jpg`):
redimensionadas y convertidas a JPEG progresivo. Las dos primeras pasaron de
2,1 MB a 362 KB entre ambas. Los archivos originales quedan en
`assets/img/_originales/`, que está en `.gitignore` para no cargar el repositorio
con imágenes sin comprimir.

## Demo: Scroll inmersivo

Una sola página en `scroll-inmersivo/` con tres secciones, una por técnica. Las
tres cuentan lo mismo (una bicicleta rodando al atardecer) para que la
comparación sea de la técnica y no del contenido. Cada escena lleva un medidor
que muestra en vivo cuánto trabajo hace.

| # | Técnica | Cómo se mueve la escena | Peso extra |
|---|---|---|---|
| 1 | Video HTML5 | `video.currentTime = progreso × duración`; el video nunca se reproduce | ~0,9 MB |
| 2 | Secuencia en `<canvas>` | `drawImage()` del cuadro `round(progreso × 95)`, con los 96 cuadros precargados | ~1,4 MB |
| 3 | DOM / CSS | `position: fixed` + `IntersectionObserver` + `transform`; JS solo escribe la variable `--p` | ~0 |

Las tres calculan el progreso igual (`js/comun.js`): 0 cuando el borde superior
de la sección toca el tope de la ventana y 1 cuando su borde inferior toca el
fondo. Las tres suavizan el valor con una interpolación, y dejan de trabajar
cuando su sección no se ve. Con `prefers-reduced-motion` se desactiva el
suavizado.

**Detalles que importan**

- **Video:** está codificado con un keyframe por cuadro (`-g 1`). Con un GOP
  normal cada seek obliga a decodificar desde el keyframe anterior y el scrub se
  entrecorta. Es la razón por la que un video "de scroll" pesa más que uno normal.
- **Canvas:** el costo se paga al inicio (descargar 96 imágenes) y no en cada
  movimiento; por eso lleva barra de carga.
- **DOM/CSS:** la capa fija vive dentro de su sección y pasa por tres estados
  (`antes` → `fijo` → `despues`) según dos observadores. Antes y después va en
  `position: absolute`, anclada a su borde, para no tapar el resto de la página.

**Material generado.** El clip no es un video externo: lo dibuja
`scroll-inmersivo/herramientas/generar_clip.py` y de ahí salen el mp4 y los
frames, así que ambas técnicas usan exactamente las mismas imágenes.

```bash
pip install pillow imageio-ffmpeg
python scroll-inmersivo/herramientas/generar_clip.py
```

Si se cambia `FRAMES` en el script, hay que cambiar también `TOTAL` en
`js/canvas-secuencia.js` y el `max` de la barra de carga en el HTML.

```
scroll-inmersivo/
├── index.html              Introducción, las tres escenas y la comparativa
├── css/scroll.css          Escenas, medidor y capa fija, sobre ../css/styles.css
├── js/
│   ├── comun.js            Progreso, suavizado y bucle que solo corre si la escena se ve
│   ├── video-scroll.js     Técnica 1
│   ├── canvas-secuencia.js Técnica 2
│   └── dom-fixed.js        Técnica 3
├── assets/                 video.mp4 y frames/f_000.webp … f_095.webp
└── herramientas/generar_clip.py
```

Reutiliza `../css/styles.css` y `../js/tema.js`, así que el modo oscuro también
funciona aquí. Se abre desde la tarjeta "Scroll inmersivo" del portafolio o en
<http://localhost:8080/scroll-inmersivo/> con el servidor local.

## Parcial: Caracterización Financiera y Presupuesto

SPA de finanzas personales en `finanzas/`.

**Entregables**

| | |
|---|---|
| Repositorio | <https://github.com/jsav2003/rodando-seguro-web> |
| Aplicación desplegada | <https://jsav2003.github.io/rodando-seguro-web/finanzas/> |

También se llega desde la tarjeta "Finanzas Personales" del portafolio.

**Autoría**

Trabajo en parejas. El reparto quedó por archivos, así que el historial de git
muestra quién hizo qué:

| Autor | Parte |
|---|---|
| [@jsav2003](https://github.com/jsav2003) | Estructura de la SPA, estilos, capa de persistencia (`almacenamiento.js`), caracterización inicial y dashboard (`app.js`) |
| [@mafegiraldoduque](https://github.com/mafegiraldoduque) | Módulo de gastos diarios: alta, tabla dinámica y eliminación (`gastos-diarios.js`) |

**Cómo funciona**

Al abrirla por primera vez solo se ve el formulario de caracterización: ingreso
mensual principal, ingresos adicionales y los gastos fijos. Un gasto se puede
marcar como compartido e indicar el reparto de dos maneras — **% de aporte
personal** o **cantidad de personas** — y la app calcula lo que realmente se
paga, mostrándolo en vivo mientras se escribe.

Al guardar, la vista cambia al dashboard: cuatro tarjetas de resumen (ingresos
totales, gastos fijos ajustados, capacidad de ahorro y gastos variables), el
desglose de los gastos fijos y el registro de gastos diarios con su tabla.

El botón *Resetear / Reconfigurar* borra los datos y devuelve al formulario. La
confirmación es un modal de Bootstrap, no un `confirm()` nativo.

**Alerta de exceso y gastos a crédito**

Cada gasto diario se puede marcar como pagado con crédito. Un gasto a crédito no
salió del ingreso de este mes, así que **no descuenta del efectivo disponible** y
en cambio se acumula en la franja *Deuda en crédito*.

Con eso, "pasarse del ingreso mensual" queda como una sola condición:

```
gastos fijos + gastos diarios en efectivo > ingresos totales   ⟺   disponible < 0
```

Cuando se cumple, aparece una alerta que dice por cuánto te pasaste y sugiere
marcar como crédito lo que hayas pagado con tarjeta. Marcarlo apaga la alerta y
hace crecer la deuda, que es justamente la decisión que la app quiere hacer
visible. La alerta también salta al entrar al dashboard si los gastos fijos por
sí solos ya superan el ingreso.

Los gastos guardados antes de esta versión no tienen el campo `credito`; se leen
como `false` y cuentan como efectivo, así que no hace falta migrar nada.

**Persistencia**

Dos claves independientes en `localStorage`, escritas con `JSON.stringify()` y
leídas con `JSON.parse()` en `DOMContentLoaded`:

| Clave | Contenido |
|---|---|
| `finanzas.perfil` | Objeto con `ingresos` y el arreglo `gastosFijos`. **Su ausencia es la que decide** si la app abre en el wizard o en el dashboard |
| `finanzas.gastosDiarios` | Arreglo de gastos cotidianos |

Separarlas permite borrar los gastos sin perder la configuración. Todos los
accesos van envueltos en `try/catch` y un JSON corrupto se ignora en vez de
tumbar la app.

**Estructura**

```
finanzas/
├── index.html              Las dos vistas de la SPA
├── css/finanzas.css        Estilos propios, sobre las variables de ../css/styles.css
└── js/
    ├── almacenamiento.js   Única capa que toca localStorage
    ├── app.js              Caracterización, dashboard y control de flujo
    └── gastos-diarios.js   Registro diario: alta, tabla y eliminación
```

La app reutiliza `../css/styles.css` y `../js/tema.js` del portafolio, así que
el modo oscuro funciona sin duplicar una sola regla y la preferencia de tema
viaja entre las dos páginas.

**Para trabajar en local**

```bash
python -m http.server 8080
```

Y abrir <http://localhost:8080/finanzas/>.

## Trabajos enlazados

- [Immersive Landing Page Design](https://www.figma.com/make/F8ZqIShRKfXpooKJKKJQv5/Immersive-Landing-Page-Design?code-node-id=0-6&p=f&fullscreen=1) — diseño en Figma Make
- Modo oscuro / claro — ejercicio de la Semana 5, en `modo-oscuro/`
- [Caracterización Financiera](https://jsav2003.github.io/rodando-seguro-web/finanzas/) — SPA de finanzas personales
- Scroll inmersivo — comparativa de tres técnicas, en `scroll-inmersivo/`
