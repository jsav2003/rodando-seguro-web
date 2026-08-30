# Portafolio — Desarrollo de Aplicaciones Web

Portafolio del curso con implementación de **modo oscuro / claro** persistente
usando HTML, CSS y JavaScript, con manejo de `localStorage` y `sessionStorage`.

Entrega de la Semana 5.

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

La sección **Estado del almacenamiento** de la página muestra los tres valores en
vivo. Para ver la diferencia entre ambos: cambia el tema varias veces y abre la
página en una pestaña nueva — el tema se mantiene (`localStorage`) pero el
contador vuelve a cero (`sessionStorage`).

El botón *Restablecer preferencia* borra la clave de `localStorage` y la página
vuelve a seguir el tema del sistema operativo (`prefers-color-scheme`).

### Detalle: evitar el destello blanco

Si el tema se aplicara solo desde `js/main.js`, al recargar en modo oscuro se
vería un flash blanco antes de que cargue el script. Por eso hay un pequeño
script inline en el `<head>` que lee `localStorage` y aplica `data-tema` antes
del primer pintado. Es el único JavaScript dentro del HTML.

Todos los accesos al almacenamiento están dentro de `try/catch`: en modo
incógnito el navegador puede bloquearlos, y la página debe seguir funcionando.

## Estructura

```
index.html        Página principal (navbar, hero, tarjetas, panel de storage, footer)
css/styles.css    Variables de tema y estilos propios
js/main.js        Lógica del cambio de tema y del almacenamiento
assets/img/       Imágenes optimizadas que usa la página
assets/docs/      Documentos
```

Las imágenes se guardan optimizadas (`banner.jpg`, `ekomart.jpg`): redimensionadas
y convertidas a JPEG progresivo, pasando de 2,1 MB a 362 KB entre las dos. Los
archivos originales quedan en `assets/img/_originales/`, que está en `.gitignore`
para no cargar el repositorio con imágenes sin comprimir.

## Trabajos enlazados

- [Immersive Landing Page Design](https://www.figma.com/make/F8ZqIShRKfXpooKJKKJQv5/Immersive-Landing-Page-Design?code-node-id=0-6&p=f&fullscreen=1) — diseño en Figma Make
- Rodando Seguro — sitio del taller de bicicletas de Don Carlos (en desarrollo)
