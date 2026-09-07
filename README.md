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
js/tema.js        Modo oscuro/claro. Compartido con finanzas/
js/main.js        Métricas de sesión y panel de almacenamiento
finanzas/         Parcial: SPA de caracterización financiera (ver abajo)
assets/img/       Imágenes optimizadas que usa la página
assets/docs/      Documentos
```

Las imágenes se guardan optimizadas (`banner.jpg`, `ekomart.jpg`, `finanzas.jpg`):
redimensionadas y convertidas a JPEG progresivo. Las dos primeras pasaron de
2,1 MB a 362 KB entre ambas. Los archivos originales quedan en
`assets/img/_originales/`, que está en `.gitignore` para no cargar el repositorio
con imágenes sin comprimir.

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
- [Caracterización Financiera](https://jsav2003.github.io/rodando-seguro-web/finanzas/) — SPA de finanzas personales
- Rodando Seguro — sitio del taller de bicicletas de Don Carlos (en desarrollo)
