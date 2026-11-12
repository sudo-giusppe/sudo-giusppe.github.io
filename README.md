# giuseppe barraza — notas de matemática y sistemas

Blog personal de matemática, sistemas computacionales y código. Construido con
Astro y Motion, sin frameworks de UI ni rastreadores.

## Stack

- **Astro 3** — sitio estático, sin hidratación de islas.
- **Editor local** — `npm run admin` levanta un servidor Node en
  `127.0.0.1:4321/admin` para escribir las notas. No forma parte de la build
  pública: el sitio desplegado no tiene ruta `/admin`.
- **Bilingüe** — español en `/` e inglés en `/en/…`. El botón EN/ES del
  header alterna entre traducciones; las notas viven en
  `src/content/posts` (es) y `src/content/posts-en` (en) con el mismo slug.
- **CV en JSON** — la página «acerca» se genera desde `src/data/cv.json`, con
  textos por idioma. El mismo archivo se sincroniza con un gist privado de
  GitHub (`npm run cv:pull` / `npm run cv:push`).
- **Motion** (`motion`) — animaciones con su API vanilla: revelado de secciones,
  entrada escalonada de las filas del archivo, mensajes de la sala y el trazo
  animado del gráfico de portada.
- **Canvas nativo** — cada vista dibuja una variante distinta de la hormiga de
  Langton celda a celda, sin librerías de animación ni imágenes.
- **CSS propio** — sistema de diseño en `src/styles/global.css`. Paleta papel y
  tinta, tipografía serif para prosa y mono para metadatos.
- **Tipografías locales** — Source Serif 4 e IBM Plex Mono en `public/fonts/`
  (SIL Open Font License; ver las licencias junto a los archivos).
- **MathML nativo** — las fórmulas se escriben con `<math>` y las renderiza el
  navegador. No hay dependencias de KaTeX ni MathJax.

## Contenido

- **La hormiga de Langton** (`/blog/langtons-ant`) — autómatas celulares,
  emergencia y la autopista de período 104.
- **Algoritmos genéticos** (`/blog/genetic-algorithms`) — selección, cruce,
  mutación y convergencia sobre una función multimodal.

## Estructura

```text
/
├── cv.config.json              # id del gist que guarda el CV
├── public/
│   ├── fonts/                  # tipografías y licencias
│   ├── images/                 # traza de la hormiga y subidas del editor
│   └── favicon.svg
├── scripts/
│   ├── admin/
│   │   ├── server.mjs          # servidor local, API y estáticos
│   │   ├── auth.mjs            # scrypt, sesiones y límite de intentos
│   │   ├── posts.mjs           # lectura/escritura de las notas
│   │   ├── markdown.mjs        # vista previa con marked
│   │   └── public/             # interfaz del editor
│   └── cv/sync.mjs             # pull/push del CV contra el gist
├── src/
│   ├── components/             # Header, Footer, Plot, AntField, CvSections, etc.
│   ├── content/
│   │   ├── config.ts           # esquema del frontmatter (posts y posts-en)
│   │   ├── posts/*.md          # una nota por archivo (español)
│   │   └── posts-en/*.md       # traducciones, mismo slug que el original
│   ├── i18n/
│   │   └── ui.ts               # textos de la interfaz por idioma
│   ├── data/
│   │   ├── posts.ts            # consultas sobre la colección
│   │   ├── cv.json             # datos del CV (es/en)
│   │   ├── cv.ts               # tipos y acceso al CV
│   │   └── fields.json         # variantes del campo de fondo
│   ├── layouts/
│   │   ├── Layout.astro        # shell global, tema, revelados
│   │   └── PostLayout.astro    # shell de artículo, migas, paginación
│   ├── pages/
│   │   ├── index.astro         # portada
│   │   ├── blog.astro          # archivo filtrable
│   │   ├── about.astro         # CV generado desde data/cv.json
│   │   ├── forum.astro         # sala de demostración (estado en memoria)
│   │   ├── 404.astro
│   │   ├── blog/[slug].astro   # nota generada desde content
│   │   └── en/                 # espejo en inglés (/en/…)
│   └── styles/global.css
└── astro.config.mjs
```

## Comandos

| Comando           | Acción                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Instala dependencias                        |
| `npm run dev`     | Servidor de desarrollo en `localhost:3000`  |
| `npm run admin`   | Editor local en `127.0.0.1:4321/admin`      |
| `npm run admin:password -- --reset` | Rota la clave del editor       |
| `npm run cv:pull` | Baja el CV desde el gist a `src/data/cv.json` |
| `npm run cv:push` | Publica `src/data/cv.json` en el gist       |
| `npm run build`   | Genera el sitio estático en `./dist/`       |
| `npm run preview` | Previsualiza la build local                 |

## Campos de fondo

Cada vista dibuja una variante distinta de la hormiga de Langton sobre la misma
cuadrícula toroidal. Las variantes viven en `src/data/fields.json` y se eligen con
`<AntField variant="…" />`:

| Vista                    | Variante   | Comportamiento              |
| :----------------------- | :--------- | :-------------------------- |
| Inicio                   | `classic`  | RL, dos estados             |
| Archivo                  | `mirror`   | LR, espejo de la clásica    |
| Acerca                   | `turmite`  | RLR, tres estados           |
| Discusión                | `colony`   | tres hormigas RL            |
| 404                      | `turmite2` | RLL, tres estados           |
| La hormiga de Langton    | `highway`  | RL, precalentado            |
| Algoritmos genéticos     | `duet`     | RL + LR, dos hormigas       |

Las notas usan `intensity="quiet"` para que el patrón no compita con el texto.

## CV y gist

La página «acerca» (`/about` y `/en/about`) se genera desde
`src/data/cv.json`. Cada campo de texto acepta un string (igual en ambos
idiomas) o un objeto `{ "es": …, "en": … }`.

El JSON también vive en un gist secreto de GitHub, que actúa como base de datos
editable desde la web, el móvil o `gh`:

```sh
npm run cv:pull   # gist -> src/data/cv.json
npm run cv:push   # src/data/cv.json -> gist
```

El id está en `cv.config.json`. La build **no** consulta GitHub: siempre lee el
JSON local, así que el despliegue es reproducible y no necesita token. Para
publicar un cambio, edita el gist, ejecuta `npm run cv:pull`, y haz commit del
JSON actualizado. Requiere `gh auth login` con scope `gist`.

## Editor local (`/admin`)

```sh
npm run admin
```

La primera vez genera una clave aleatoria de 160 bits y la imprime **una sola
vez**; guárdala en tu gestor de contraseñas. En `.env` (ignorado por git) solo
queda el hash scrypt. Si la pierdes:

```sh
npm run admin:password -- --reset
```

El editor permite:

- Crear, editar, renombrar y eliminar notas (se mueven a `.admin/trash/`),
  en español o en inglés (colecciones `posts` y `posts-en`).
- Todos los campos de la colección: título, resumen, fecha, categoría,
  minutos, idioma, variante de fondo y estado de borrador.
- Escribir en Markdown con barra de formato y vista previa en vivo con los
  estilos reales del blog.
- Insertar tablas, figuras, notas, bloques de código y MathML.
- Subir imágenes a `public/images/` (PNG, JPEG, GIF, WebP o AVIF, hasta 8 MB).
- Calcular la duración de lectura y generar el identificador desde el título.
- `⌘S` / `Ctrl+S` para guardar y `Tab` para indentar.

Al guardar se escribe un archivo `.md` en `src/content/posts/` con frontmatter
y cuerpo Markdown. En desarrollo el sitio se actualiza al recargar; para
publicar, haz commit y build.

### Seguridad

- El servidor escucha **solo en `127.0.0.1`**. No está incluido en `dist/`: la
  build pública no tiene `/admin`.
- La clave se guarda como hash **scrypt** (N=131072, r=8, p=1), nunca en claro.
- Sesión en memoria con cookie `HttpOnly`, `SameSite=Strict` y token CSRF
  independiente.
- Se validan `Host` y `Origin` (evita DNS rebinding y CSRF), hay CSP estricta y
  límite de intentos: tras 5 fallos el acceso se bloquea con espera creciente.
- La vista previa corre en un iframe sin scripts.
- No expongas el puerto a la red. Si de verdad necesitas un proxy inverso,
  usa HTTPS y configura `ADMIN_PUBLIC_URL`; no lo sirvas por HTTP remoto.

## Despliegue

Cada push a `main` compila el sitio y lo publica en GitHub Pages con
`.github/workflows/deploy.yml`:

https://sudo-giusppe.github.io

El editor `/admin` no se despliega: la build solo genera el sitio público.
El CSS, las fuentes y las imágenes usan rutas absolutas, así que el sitio vive
en la raíz del dominio (`<usuario>.github.io`) y no necesita `base` en Astro.

## Añadir una nota

1. Ejecuta `npm run admin` y entra en `http://127.0.0.1:4321/admin`.
2. Rellena los campos y guarda. Se crea `src/content/posts/<slug>.md` con
   frontmatter validado por `src/content/config.ts` y el cuerpo en Markdown.
3. También puedes crear el `.md` a mano; el archivo, la portada, las categorías
   y la paginación anterior/siguiente se actualizan solos.
4. Haz commit y build. Las notas con `draft: true` no se generan.

## Decisiones de diseño

- Una sola columna de lectura (~43 rem), márgenes amplios y reglas de un píxel.
- Jerarquía editorial: numerales de sección (`§ 1`), metadatos en mono,
  subtítulos con serif y sin tarjetas ni sombras.
- Tema claro/oscuro persistido en `localStorage`; el tema se aplica antes del
  primer pintado para evitar destellos.
- Movimiento discreto y con respeto a `prefers-reduced-motion`. El contenido
  nunca depende de JavaScript para ser visible.
- Acerca combina un encabezado breve con el CV completo: experiencia,
  proyectos, formación, certificaciones y habilidades. Los datos viven en un
  JSON bilingüe y el diseño sigue la misma jerarquía editorial que las notas.
  El fondo es una variante de la hormiga de Langton en vivo sobre una cuadrícula
  toroidal: se precalienta, cambia de semilla en cada visita y se puede pausar.
  Con movimiento reducido queda como imagen fija. El resto de las vistas usa
  variantes distintas para que cada página tenga su propio patrón.
- Los patrones de interacción (enlace magnético, filtros suaves) están
  inspirados en KokonutUI y reimplementados con Motion vanilla para no añadir
  React ni Tailwind al sitio.
- Sin analítica ni peticiones a terceros. El sitio público no usa cookies; la
  sesión del editor local es una cookie técnica `HttpOnly` que nunca se
  despliega.
