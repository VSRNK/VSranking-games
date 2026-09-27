# RANKING — buscador de puntuaciones de videojuegos

> **Última actualización:** 2026-09-27 · **Versión:** vv27b
> Este archivo se actualiza con cada cambio: el registro está al final (§8) y el estado del proyecto en §9.
> **Para agentes de IA:** la guía operativa (arquitectura, reglas de edición y verificación) está en [`AGENTS.md`](AGENTS.md); el contrato visual en [`DESIGN.md`](DESIGN.md).

---

## 1. ¿De qué va esto? (resumen para compartir)

**RANKING** es una página web de una sola pantalla, minimalista y monocroma, que sirve para **buscar un videojuego por su nombre y ver sus puntuaciones**. Los datos salen de una hoja de cálculo (hoy en **Google Sheets**, que en su origen era `RAKING_GAMES.xlsx`) en la que **dos personas, Sele y Vande, puntúan cada juego de 0 a 10 en nueve categorías** (Historia, Jugabilidad, Originalidad, Niveles, Visual, Sonoridad, Dificultad, Extras y Personajes). La página calcula la **Nota** de cada persona como la media de sus nueve puntuaciones.

Al escribir en el buscador, la lista se filtra en tiempo real. Cada juego aparece como **dos filas** (una para Sele, otra para Vande) con sus nueve categorías y su nota final, en un estilo de tabla de clasificación (*leaderboard*).

La **versión actual (vv27b)** es HTML + CSS + JS + un servidor Node (`server.js`) que **sincroniza los datos con Google Sheets en tiempo real** — con la página abierta vía `iniciar_ranking.bat`, la tabla se actualiza sola cuando cambias la hoja, sin recargar — y descarga las **carátulas** automáticamente a `covers/`. Abrir `index.html` con doble clic usa el snapshot local `data.js` (sin servidor ni sync).

**English TL;DR:** *A static (plain HTML/CSS/JS), monochrome, minimalist web page to search video games by name and view how two people (Sele and Vande) rated each one across nine categories, with an auto-computed average score. Data is synced live from a Google Sheet by a small local Node server (with an embedded snapshot as fallback); filtering is live as you type. Styled as a leaderboard, with subtle animations, a custom cursor and soft synthesized UI sounds.*

## 2. Cómo se usa

- **Buscar:** escribe en el campo de arriba a la derecha. Ignora mayúsculas y tildes ("sifu" encuentra "Sifu"). `Esc` limpia la búsqueda.
- **Leer los datos:** cada juego tiene dos filas (Sele / Vande). Las columnas son las nueve categorías y la **Nota** final.
- **Filtrar por categorías:** clic en la cabecera de una columna. La primera vez pone arriba las notas más altas de esa categoría (▼), la segunda las más bajas (▲) y la tercera desactiva el filtro. Como máximo se pueden tener **2 categorías activas a la vez** (si se elige una tercera, se libera la más antigua). Las activas **filtran**: solo se listan los juegos con esas categorías puntuadas, y con dos la lista se ordena por la **combinación de ambas** (cada una aporta su valor; la que está en ▲ lo resta), así que al añadir la segunda la lista siempre cambia.
- **Colores de la nota:** 🟡 **oro** si es 9 o más · 🟢 **verde** de 5 a menos de 9 · 🔴 **rojo** por debajo de 5. Un **0,0** se muestra explícitamente y cuenta en la media; un **guion (—)** significa que esa persona aún no ha puntuado ese juego (casilla vacía o inválida).
- **Sonido:** al pasar sobre un juego **no suena nada**; suena una nota suave al pasar sobre el buscador y un pequeño "plin-plin" al hacer clic (o al tocar, en móvil). Se puede silenciar o reactivar con la tecla **M**, cuando el foco no esté en el buscador (se recuerda entre visitas).
- **Pantallas pequeñas:** en móvil (≤ 40 rem) cada juego se muestra como **tarjeta** —nombre arriba, las 9 categorías en cuadrícula 3×3 con su etiqueta y la nota destacada— sin desplazamiento horizontal; en anchos intermedios la tabla se desplaza en horizontal con el nombre y el jugador (Sele / Vande) fijos a la izquierda, con la cabecera "Juego".

## 3. Datos (la hoja de cálculo)

- Archivo: `RAKING_GAMES.xlsx`, primera pestaña ("Base de Datos").
- **Cabeceras** en la fila 3: columnas B–J = las 9 categorías, K = Nota, L = jugador.
- **115 huecos** de juego (filas 4–233), cada uno en **2 filas**: Sele arriba, Vande abajo. El nombre del juego está en la columna A de la primera fila (celdas combinadas).
- La **Nota** de la hoja es una fórmula (media de B–J, ignorando celdas vacías). La página la **recalcula** con el mismo criterio y no depende del valor guardado en el archivo.
- La hoja se lee desde **Google Sheets** a través de `server.js`. `RAKING_GAMES.xlsx` se conserva en la raíz como **respaldo histórico** de los datos originales (ya no alimenta la página).
- Estado actual (versión raíz, según el último sync con Google Sheets): **8 juegos** — God of War: Chains of Olympus, Sifu, Kingdom Hearts Birth by Sleep, Doom (2016), Rv There Yet, The forest, God of War (2018) y LEGO Batman: The Video Game. Las dos puntuaciones completas solo en *The forest* y *Rv There Yet*; Sifu, Doom (2016), God of War (2018) y LEGO Batman solo tienen las de Sele; God of War: Chains of Olympus solo las de Vande; Kingdom Hearts Birth by Sleep no tiene ninguna. En la hoja, *Rv There Yet* tiene **0 explícito** en Extras y Personajes y *God of War: Chains of Olympus* en Extras: `server.js` conserva los 0 como valores reales (cuentan en la media) y trata vacíos como «sin puntuar». Los huecos vacíos de la plantilla no se muestran.

## 4. Diseño y comportamiento

**Estructura.** Sin barra superior. En la versión raíz el título "RANKING" no se muestra a propósito. El buscador minimalista, alineado a la derecha, con un contador ("8 juegos" / "2 de 8" / "6 de 8 juegos" al filtrar por categorías). Bajo el buscador, la lista.

**La tabla no va en una caja ni tiene fondo (vv22/vv23).** La hoja —la zona con la tabla— **no tiene borde, ni radio, ni sombra, ni color de campo**: la tabla deja ver el grano del fondo y **la página scrollea**, creciendo la tabla con su contenido hasta el final; lo único que scrollea por dentro es la **horizontal** de las columnas (la rejilla tiene `min-width: 88rem` a partir de 1200 px). Lo que estructura la tabla son sus propias líneas: el hairline de 1 px entre filas y el `border-bottom` de la cabecera. Antes (vv14/vv16) la tabla se encerraba en un panel opaco y scrolleaba dentro de la pantalla sin mover la página: eso se revirtió a propósito en vv22 (la caja) y vv23 (el fondo). Con listas cortas la hoja sigue llenando la pantalla hasta el borde inferior.

**El hover tampoco pinta la fila (vv25).** Al pasar el ratón por un juego **no aparece ningún fondo**: la fila sigue dejando ver el grano. Lo que se enciende es la **marca de fósforo de 1 px** del borde izquierdo y una **luz que sale de ella y se desvanece en 144 px** (el 10 % de la fila), más el desplazamiento de 3 px del nombre y el crecimiento de la carátula. Antes se pintaba la fila con un relleno opaco que tapaba la transparencia de la tabla; ahora el resplandor es una capa con opacidad, como manda `DESIGN.md` §3.

**Filtro por categorías.** Cada cabecera de columna es un botón que cicla **más nota arriba (▼) → el que menos (▲) → se quita**. **Máximo 2 categorías activas** a la vez (una tercera libera la más antigua). Las activas **filtran** — solo quedan los juegos con esas categorías puntuadas y, con dos, la ordenación usa la **combinación de ambas** (cada una aporta su valor; ▲ lo resta), así que añadir la segunda siempre se nota en la lista.

**Tipografías** (Google Fonts): *JetBrains Mono* para los **títulos de los juegos** (semibold, como un marcador, pegado a los datos) y las celdas numéricas; *Space Grotesk* para etiquetas y cabeceras en mayúsculas. La serif editorial (Bodoni Moda) se retiró en vv16 por no encajar con la estética de marcador.

**Paleta.** Monocroma (negro, gris oscuro, gris claro y blanco) con un único acento de **verde fósforo** — luz ambiental tenue, estados de foco/activo, nota buena y el **resplandor del hover de fila** (una luz de 144 px que se desvanece, nunca la fila entera); los colores de la nota (oro, verde, rojo) siguen siendo la otra excepción. Variante clara (fondo blanco, misma paleta invertida) según el tema del navegador.

**Buscador.** Solo una línea. En reposo, un destello suave la recorre; al enfocar, se despliega en blanco desde el centro. El texto de ayuda va rotando despacio entre "Buscar juego" y los nombres de los juegos.

**Animaciones.**
- Al buscar, los juegos que aparecen entran con fundido y un ligero ascenso (280 ms, escalonado 40 ms); los que dejan de coincidir se desvanecen en 140 ms. Los que siguen visibles no se tocan (sin parpadeos). Son **transiciones CSS** (clase `.out`), así que si la búsqueda cambia a mitad de movimiento se reajustan desde donde estén en vez de reiniciarse.
- Las notas finales **cuentan de 0 a su valor** cuando el juego aparece (~0,6 s).
- Las notas de **oro** tienen un destello discreto que las cruza cada pocos segundos.
- Todo se desactiva con la opción del sistema *reducir movimiento*.

**Cursor propio** (solo con ratón). Un punto pequeño más un anillo fino que lo sigue con suavidad. El anillo crece al pasar sobre un juego, se convierte en una barra vertical (tipo cursor de texto) sobre el buscador, se encoge al pulsar y deja una onda muy leve al hacer clic. Desaparece al salir de la ventana. En pantallas táctiles se usa el cursor normal.

**Sonido.** Sintetizado en el navegador con Web Audio (sin archivos externos), con timbre de kalimba / caja de música (senoidal cálida más un parcial agudo que se apaga enseguida), filtro paso bajo y un eco muy ligero. Al pasar sobre los **juegos no suena nada**. Sobre el **buscador** suena una nota suave de escala pentatónica. Al **hacer clic** suenan dos notas ascendentes (una quinta) con un toque grave muy suave. En móvil el sonido va con el toque, no con el inicio de un desplazamiento. Volumen bajo (hover ≈ −26 dBFS, clic ≈ −20 dBFS). Por las políticas de los navegadores, el audio no se activa hasta el primer clic o pulsación de tecla.

**Accesibilidad.** Etiqueta para el buscador, estructura de tabla con roles ARIA, contador con anuncio de cambios, respeto de *prefers-reduced-motion* (solo fundidos, sin desplazamientos) y foco visible en el buscador; el efecto de hover solo se aplica con ratón.

## 5. Contenido de la carpeta

```
ranking/ (raíz — versión de trabajo, vv20)
  index.html         Estructura de la página (enlaces con ?v=NN: subir el número al tocar CSS/JS)
  styles.css         Todos los estilos (paleta, tipografías, rejilla, tarjetas móvil, animaciones, cursor)
  script.js          Toda la lógica (búsqueda, ordenación, filtro por categorías, sondeo en vivo, ?q=, atajo /, animaciones, cursor, sonidos)
  data.js            Datos sincronizados con Google Sheets (GENERADO por server.js; snapshot local)
  server.js          Servidor Node (puerto 8080): sincroniza con Google Sheets y descarga carátulas
  covers/            Carátulas descargadas automáticamente (Steam / Wikipedia)
  iniciar_ranking.bat  Lanza el servidor y abre http://localhost:8080 (guardia de puerto; navegador 2 s después)
  README.md          Este archivo (fuente canónica + changelog)
  AGENTS.md          Guía operativa para agentes de IA (arquitectura, reglas de edición y verificación)
  DESIGN.md          Contrato visual PHOSPHOR (decisiones duraderas)
  PRODUCT.md         Verdad de producto en formato breve (la consume el skill `impeccable`)
  RAKING_GAMES.xlsx  Respaldo histórico de los datos originales
```

**Cómo abrirla en local:** doble clic en `iniciar_ranking.bat` (arranca `node server.js` y abre `http://localhost:8080`, con datos y carátulas sincronizados con Google Sheets). También sirve abrir `index.html` con doble clic: usa el snapshot de `data.js` y la sincronización queda desactivada. Necesita conexión para las tipografías de Google Fonts; sin ella se ven con tipografías de respaldo.

## 6. Cómo actualizar los datos

**Versión raíz (la de trabajo):** los datos viven en la hoja de **Google Sheets** que lee `server.js`. Al abrir la página (vía `iniciar_ranking.bat`) el servidor sincroniza `/api/games`, descarga las carátulas que falten (Steam / Wikipedia) y regenera `data.js` como snapshot. Los cambios de diseño se hacen en `styles.css`, los de comportamiento en `script.js` y los de estructura en `index.html`. **`data.js` se sobrescribe** en cada sincronización: no se edita a mano.

> La **exportación estática anterior** (carpeta `ranking-web/`, versión v10 con `build.py` y `dist/ranking.html`) se eliminó el 2026-09-25 por quedar obsoleta. El `RAKING_GAMES.xlsx` original se conserva en la raíz como respaldo.

## 7. Notas técnicas (para quien continúe el trabajo, persona o IA)

- **Una sola forma de la página.** El proyecto actual es la raíz servida por `server.js`; los archivos separados (`index.html` + `styles.css` + `script.js` + `data.js`) son la fuente. Única dependencia externa: Google Fonts y la llamada de sync a Google Sheets (CSV). Los sonidos se sintetizan con Web Audio (sin archivos), las carátulas se descargan a `covers/` y no hay ningún otro asset remoto.
- **Rejilla de bloques, no tabla.** La lista usa `display: grid`, no `<table>`. Con celdas de tabla, la celda del nombre (que ocupa dos filas) tapaba parte de las líneas separadoras de 1 px, y las líneas se veían más finas a mitad de recorrido o distintas entre juegos. Ahora cada línea entre juegos es el borde de un único bloque a todo el ancho, y la línea fina entre Sele y Vande es un único pseudo-elemento. **No volver a tablas ni a bordes por celda.**
- **Render incremental.** Las filas de los juegos se crean una sola vez; al buscar solo se muestran/ocultan. Solo se animan las que aparecen de nuevo.
- **Nota.** Se recalcula en el cliente (media de las categorías con valor); el color se decide con la nota redondeada a dos decimales (`notaClass()`).
- **Brillo dorado.** El degradado (260 % de ancho) solo se desplaza entre 100 % y 0 %, para que siempre cubra el texto (fuera de ese rango el texto desaparecía), y hay un `background-color` de respaldo.
- **Pruebas hechas.** Navegador headless (Chromium) con densidades de píxel reales de 100 % a 200 % para medir el grosor de las líneas, capturas de estados del cursor y del destello, y renderizado offline de los sonidos para comprobar niveles (sin saturación; hover ≈ −26 dBFS, clic ≈ −20 dBFS). No se ha podido *escuchar* el sonido, solo medirlo.
- **Columnas fijas.** Por debajo de 40 rem (donde la tabla se desplaza en horizontal) el nombre, el jugador y sus cabeceras son `position: sticky`, con fondo propio translúcido (`--raise` al 74 % el nombre y al 82 % el jugador y las cabeceras) para que los números no se lean por debajo al scrollear; la línea fina entre jugadores pasa a ser el borde superior de la celda del jugador en ese tramo. Por encima de 40 rem no hay ninguna celda sticky: la tabla cabe entera. *(Documentado aquí por medición: el texto anterior decía «fondo opaco (`--row-bg`)», pero `--row-bg` es `transparent` y lo que se usa es `color-mix(--raise)`. La opacidad viene de la propia celda, no de la hoja, así que sigue funcionando con la tabla transparente desde vv23.)*
- **Animación.** Una sola curva (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`) y duraciones por debajo de 300 ms; el cursor se suaviza por tiempo (no por fotograma), igual a 60 que a 144 Hz. Los juegos entran y salen con transiciones, con un temporizador de respaldo por si la pestaña está en segundo plano.
- **Marcador de pruebas.** El comentario `/*TEST_HOOK*/` en el JS es inerte; solo sirve para exponer las funciones de sonido en las pruebas.

## 8. Registro de cambios

**vv27b — 2026-09-27**
- **El aire también debajo del último juego.** vv27 puso el aire **arriba** de cada juego (`.game + .game { margin-top: 0.7rem }`) y **nada debajo**, así que la fila inferior quedaba pegada al final de la hoja: se veía más espacio arriba que abajo. Se añade `margin-bottom: 0.7rem` al bloque `.game` de escritorio, **conservando** el `margin-top`. Los mismos rems, como pediste.
- **Por qué los 8 huecos entre juegos NO se duplican.** Los márgenes de hermanos contiguos colapsan a `max()`. Con `0,7rem` arriba y `0,7rem` abajo el hueco se queda en `max(0,7; 0,7) = 0,7rem`. Medido: los 8 huecos **idéntico por uno** al estado anterior (`11,1875 → 11,1875 px`, dispersión 0). El colapso es lo que hace que el cambio salga barato.
- **Lo único que aparece es el hueco que faltaba.** El aire bajo el último juego crece **+11,1875 px exactos** (`14,3906 → 25,5781`), que es el `0,7rem`; y la hoja crece lo mismo, `1106,6719 → 1117,8594`.
  | | vv27 (solo arriba) | vv27b (simétrico) |
  |---|---|---|
  | 8 huecos entre juegos | `11,1875` px (los 8) | **`11,1875` px (los 8) ← sin cambio** |
  | aire bajo el último juego | `14,3906` px | **`25,5781` px (+11,1875)** |
  | alto de la hoja | `1106,6719` px | `1117,8594` px (**+11,1875**) |
  | alto de cada juego | `100,1875` px | `100,1875` px ← *idéntico* |
  | primer juego | `margin-top: 0` | `margin-top: 0` ← la cabecera no se aparta |
  | margen superior acumulado | `89,6` px | `89,6` px ← *sin cambio* |
- **El suelo de `14,39 px` que aparece en esa tabla no es mío.** Es el `padding-bottom: 14,4px` de `.grid` (con `8,8px` arriba), preexistente e intacto: vale **lo mismo** con y sin el margen. Seinvestigó aparte (`vv27b-suelo.mjs`) en vez de dejar la cifra sin explicar; por eso la comprobación mide el **delta**, no el valor absoluto.
- **Móvil: no se toca, a propósito.** Las tarjetas ya llevan `margin-bottom: 0.95rem` en su `@media`, que gana por orden de fuente (`max(15,2; 11,2) = 15,2`), y hay un `:game:last-child { margin-bottom: 0 }` que una versión anterior puso **a propósito** para que la última tarjeta no dejara aire colgando. A 390 px el bloque de móvil entero es **idéntico campo por campo** a vv27. Si algún día también quieres aire bajo la última tarjeta móvil, es borrar esa línea.
- **Se rectifica un motivo de vv27, no un defecto.** La entrada de vv27 defendía `+` en vez de `margin-bottom` argumentando, entre otras cosas, que «no queda aire colgando tras el último juego». Eso era exactamente lo que faltaba, y es justo lo que pediste cambiar. El otro motivo que se dio —que con filtros (`.game[hidden]` es `display:none`) el hueco cae siempre entre los juegos **visibles**— **sigue en pie** y ahora vale para las dos mitades.
- **Guards.** `test-regression.mjs` (29 → **33 PASS**) y `verify-served.mjs` invierten la guarda de vv27 que exigía que el bloque `.game` **no** llevara margen: ahora comprueban el **reparto** —`margin-bottom: 0,7rem` en la base, `margin-top` **solo** en el hermano, y `margin-bottom` ausente del hermano (si estuviera, el hueco sería `1,4rem` y no `0,7rem`)—, más que móvil conserve sus `0,95rem` y su `:last-child` a 0. El bloque se localiza por su declaración única `--row-bg: transparent`, porque `.game {` aparece cinco veces en el CSS y un `/\.game\s*\{[^}]*margin-top/` a pelo leería la segunda mitad de `.game + .game`.
- Verificación: 3 estados medidos en navegador (sin aire / solo arriba / simétrico) con **39 comprobaciones en verde**, consola limpia en los tres, y las dos suites del proyecto más `test-zero-scores` (8/8) y `p3c-verifica` sin un rojo.
- Cache-bust `v=36` (subido en los tres enlaces, como manda la regla 4).

**vv27 — 2026-09-27**
- **Aire entre juegos en la tabla.** Los nueve juegos iban pegados uno contra otro: `.game` no tenía **ningún** margen, y lo único que separaba una fila de la siguiente era el `border-bottom` de 1 px en `--line-faint` (≈4 % de opacidad), demasiado débil para reencontrar tu fila al cruzar doce columnas. Entra `0,7rem` de espacio: **una regla**, `.game + .game { margin-top: 0.7rem; }`.
  - **El separador es espacio, no pintura.** Podría haberse resuelto con una banda de fondo, y está **prohibido**: la hoja es transparente por contrato desde vv23/vv25 y `AGENTS.md` regla 5 veta que ninguna regla de estado pinte un campo opaco encima. Un margen no puede pintar nada, así que el **grano del mundo sigue viéndose a través del hueco**. Verificado en el CSSOM: `.game` y `.sheet` siguen en `rgba(0,0,0,0)` y el pelo de 1 px (`rgba(233,235,226,0.08)`) se conserva intacto.
  - **El pelo no se quita.** `DESIGN.md` §3.3 dice que lo que estructura la tabla son sus propias líneas. El aire pasa a ser un **segundo canal de separación**, al lado del pelo débil, no en lugar de él.
  - **Medido, con la página asentada** (1440×900, 9 juegos → 8 huecos):
    | | antes | después |
    |---|---|---|
    | hueco entre juegos | **`0` px exactos** (los 8) | **`11,1875` px** (los 8; dispersión 0,0002 px) |
    | alto de la hoja | `1017,1719` px | `1106,6719` px (**+89,5** = 8 × 11,1875) |
    | alto de cada juego | `100,1875` px | `100,1875` px ← *idéntico* |
    | primer juego / último | — | `margin-top: 0` / `margin-bottom: 0` |
  - **El alto de la fila no se toca**, que es la invariante: los `11,2 px` caen **entre** cajas, nunca dentro de ellas.
  - **`+` y no `margin-bottom`, por dos motivos.** ~~No queda aire colgando tras el último juego~~ —*motivo.rectificado en **vv27b**: ese aire era justo lo que faltaba, y ahora se añade con `margin-bottom: 0,7rem` en el propio `.game`; el `+` se conserva para el `margin-top` porque el **primer** juego no debe empujar a la cabecera*. El otro motivo **sigue en pie** para las dos mitades: con filtros activos (`.game[hidden]` es `display:none`) el hueco cae siempre entre los juegos **visibles**, ni se acumula ni se pierde.
  - **`0,7rem` va deliberadamente POR DEBAJO del `0,95rem` de móvil**, para que el colapso de márgenes hermanos (que resuelve a `max()`) no mueva las tarjetas. Probado, no razonado: en 390 px el hueco entre tarjetas es **`15,1875` px antes y `15,1875` px después**, porque `max(15,2, 11,2) = 15,2`. Móvil intacto.
  - **Nada por encima de la cabecera se mueve.** Medido en una sola sesión alternando la regla: los **`y` de los 14 elementos de la página son idénticos**; `head.y = 312,375` en los dos estados, el primer juego se queda en `357,6719`, y solo el último baja, exactamente los `89,5 px` añadidos. La página scrollea (contrato de vv22), nada se comprime.
  - **El brillo de hover no se derrama en el hueco.** `::after` va de `top: 0` a `bottom: 0` **de la caja**, así que se detiene en el borde y la banda de aire queda limpia; la marca de 1 px se retira `8,8 px` (`0,55rem`) de cada borde. Ambos dentro.
  - **Animaciones: 3 antes, 3 después, ninguna en un juego.** Las que quedan en reposo son dos barridos **ambiente infinitos** —la línea del buscador, 7 s, y el brillo dorado de la Nota, 4,5 s, ambos momentos firmados en `DESIGN.md` §Movimiento— más `sheetIn`, una transición ya terminada. Mi margen no añade ninguna.
- **Lo que se conserva:** tablas (2 filas × 9 categorías + Nota), sonidos (tecla M), cursor propio, buscador, ordenación, tarjetas de móvil, y el sondeo de tiempo real sin tocar.
- **Guards nuevos en las dos suites que el proyecto mantiene.** `test-regression.mjs` (20 → **29 PASS**) y `verify-served.mjs` vigilan ahora que la regla **exista** (al revés que con la onda de vv26, que se protege por ausencia), que el bloque `.game` de escritorio **no** lleve margen —*guarda **invertida en vv27b**, que sí lleva `margin-bottom: 0,7rem`; ahora se vigila el reparto*—, que `--row-bg` siga siendo `transparent` y `.sheet` transparente, que el pelo de 1 px siga ahí, y que móvil conserve sus `0,95rem`.
- **Otra cosa, distinta de vv27: cinco guardas tenían el número de juegos escrito a mano.** La hoja pasó de 8 a 9 juegos (añadiste *God of War Ragnarök*), y `verify-served`, `p3c-verifica`, `vv22-probe`, `vv22-final` y `vv23c-movil` seguían exigiendo `8 juegos / 160 celdas`: 18 rojos que **ya estaban antes de vv27** y no tienen nada que ver con el margen. Se derivan ahora de la **fuente** (`/api/games`), nunca del DOM —sacarla del DOM haría la comprobación vacía—, y `verify-served` añadió un cruzamiento nuevo: el snapshot `data.js` que carga el navegador y la API deben coincidir en la cuenta, que es lo que impide que el primer pintado vaya con datos viejos.
- **Dos correcciones a mediciones propias, porque salirían en el changelog como defectos y no lo son:**
  - Se llegó a reportar que antes de vv27 los huecos eran una «deriva subpíxel» de hasta `2,89 px`, y que eso era parte de por qué las filas parecían pegadas. **Es falso**: con la página asentada los 8 huecos eran `0` exactos. Aquella cifra era la sonda midiendo antes de que el layout terminara.
  - Comparar dos lanzamientos de Chrome da `0,0019 px` de ruido en las métricas de fuente. Eso no es desplazamiento, y seseparar «ruido de arranque» de «efecto del margen» es exactamente lo que hace falta: la comprobación fuerte (y exacta) de que nada se mueve está en una **sola sesión alternando la regla**, donde las cifras salen idénticas bit a bit.
- Cache-bust `v=35` (subido en los tres enlaces, como manda la regla 4).

**vv26 — 2026-09-26**
- **Fuera la onda por letra del botón «Google Sheet».** El texto del enlace tenía **cada uno de sus 12 caracteres** dentro de un `<span class="wave">`, con `animation: wave 8s ease-in-out infinite` y **12 retardos escalonados de 200 ms** (`0` → `2200 ms`): las letras subían y bajaban 2 px en `translateY`, una detrás de otra. Se elimina la animación **y su markup**, que solo existía para escalonar el movimiento: 12 contenedores para pintar una palabra.
  - **La prueba de que no queda ni una animación viva** no es leer `animation-name` (que ya decía `none`, porque los `@keyframes` viven en los hijos, no en el padre): es `getAnimations({subtree: true})` sobre el enlace, que pasó de **12 `wave` a 0**, más **0 nodos `.wave`** en el DOM.
  - **De paso se arregló un bug latente que llevaba años en pantalla.** El `<span class="wave"> </span>`, el espacio entre «Google» y «Sheet», **medía 0 px**: los `.wave` son *items flex*, se blockifican, y en un bloque con `white-space: nowrap` los espacios al principio y al final de línea se eliminan. El botón pintaba **`GoogleSheet`, sin espacio**. Medido span a span:
    | | ancho |
    |---|---|
    | ancho del texto viejo (12 spans) | `80,922` px |
    | suma de los 12 spans | `80,922` px |
    | **ancho del span del espacio** | **`0` px** |
    | ancho de «GoogleSheet» sin espacio, misma tipografía | `80,656` px ← *coincide* |
    | ancho del texto nuevo (texto plano) | `83,953` px |
    | ancho de «Google Sheet» **con** espacio, misma tipografía | `83,953` px ← *idéntico* |
  - **El +3,03 px cuadra exactamente**, y no es redondeo: `3,297` del espacio recuperado `− 0,266` de redondeo subpíxel que ya no acumulan las 12 cajas = `3,031` px, que es el delta medido. La cuenta cierra con decimales.
  - **Radio de impacto: cero.** Medido con **A/B inyectando el markup y el CSS viejos exactos** en la página viva (la reproducción da `132,922` px, los mismos `132,922` del antes): la barra de búsqueda **no cambia de ancho**, el campo de búsqueda es **idéntico** (`450 / 960` → `450 / 960`), ni la `x` del botón ni las alturas. El botón crece 3,03 px **hacia dentro**, en un hueco que ya existía. Nada se desplaza.
  - **Lo que se conserva:** el enlace, su `aria-label="Editar en Google Sheets"`, el icono, el botón de cristal con `:hover` / `:active` / `:focus-visible`, y que en móvil (≤479 px) siga viéndose **solo el icono** (`display: none`, botón de `44 px`).
  - **El brillo de hover se queda**, que es lo que se decidió: pasa de las 12 letras al texto entero (`0 0 6px #fff, 0 0 12px #fff`), así que ahora hay **una** sombra en vez de doce, con el mismo aspecto. Sigue siendo `text-shadow` con `transition`, no `box-shadow`, como manda `DESIGN.md` §Movimiento.
  - **Los guards de las suites se invirtieron, no se borraron.** `verify-served.mjs` y `test-regression.mjs` exigían que la wave **existiera** (12 spans, `.wave:nth-child(11)` y `(12)`, la regla `.wave`): al eliminarla se pusieron en rojo, correctamente. Ahora vigilan **que no vuelva** (0 spans, sin `@keyframes wave`, sin retardos por letra) y que el brillo de hover siga ahí. `test-regression.mjs` pasó de 20 a **23 PASS** por los guards nuevos.

**vv25 — 2026-09-26**
- **Fuera el fondo del hover de fila; entra un resplandor.** Al pasar el ratón por un juego, la fila se pintaba con un **relleno opaco** (`--row-bg: var(--hover)` = `#13150e`), que es justo lo que rompía la transparencia de la tabla (vv23). Se elimina esa regla y, en su lugar, la luz entra **desde la marca de fósforo de 1 px** que ya existía y se desvanece: un `::after` de **144 px** con `linear-gradient(90deg, rgba(198,255,74,.10), rgba(198,255,74,.035) 38%, transparent 78%)`, **encendido con `opacity`**, no con `box-shadow` — como manda `DESIGN.md` §3.
  - **La prueba no es «se ve bien»: es que el grano de fondo sigue ahí.** Si la fila se pinta con una placa opaca, el film grain que hay detrás **desaparece** (desviación → 0); si sigue transparente, el grano sobrevive. Medido con **A/B inyectando el CSS viejo en la página viva**, 9 muestras de 14×14 px dentro de la fila apuntada:
    | | fondo de la fila | grano (9 muestras) | zonas sin grano |
    |---|---|---|---|
    | Sin hover | `rgba(0,0,0,0)` | `[.010 .006 .004 .005 .004 .004 .004 .003 .003]` | 0 de 9 |
    | **Hover nuevo (vv25)** | `rgba(0,0,0,0)` | `[.033 .005 .009 .004 .010 .004 .004 .003 .003]` | **0 de 9** |
    | Hover viejo (A/B) | `rgb(19,21,14)` | `[.034 .004 .008 .004 .011 .000 .000 .000 .000]` | **4 de 9** |
    - La placa no tapaba solo las celdas sino también **los huecos entre columnas**; con el resplandor, las 9 muestras conservan grano.
  - **El resplandor es local, no un lavado de fila** (que `DESIGN.md` §3 prohíbe explícitamente: *«nunca filas enteras ni fondos de bloque»*). Medido: el extremo derecho de la misma fila cambia **0,0003** de luminancia y la fila de abajo **0**. Cubierto = 144 px de 1385,6 = **el 10,4 %** de la fila.
  - **Legibilidad: sale ganando.** Contraste del nombre del juego (p97−p10, medido por píxeles): **7,54** sin hover → **7,18** con el resplandor nuevo → **6,61** con la placa vieja. El resplandor cuesta **−0,37** de contraste; la placa costaba **−0,94** (porque `#13150e` es *más claro* que `--bg`, el mismo motivo por el que en vv23 el campo real salió más oscuro al volverse transparente).
  - **Lo que se conserva del hover** (nada se pierde, solo se quita el relleno): la marca de 1 px se enciende a `opacity 0.55`, el nombre se desplaza 3 px y la carátula crece a 1,06. Los tres son `transform`/`opacity` y viven dentro de `@media (hover: hover) and (pointer: fine)`.
  - **Sin regresión de accesibilidad:** el relleno era exclusivo de puntero, y las celdas con *roving tabindex* no tienen `outline: none` (los dos `outline: none` del archivo están en el buscador y en `.col-sort`, y ambos se compensan con su `:focus-visible`/`:focus-within`). El foco de teclado conserva el anillo por defecto del navegador.
  - **Móvil intacto:** a 390 px cada juego es una **tarjeta** con su propio fondo (`radio 18px`, borde 1 px, gradiente propio) y sin hover táctil; el cambio no la toca. Medido.
  - El token `--hover` **no se retira**: lo sigue usando `.sheet-link:hover`.

**vv24 — 2026-09-26**
- **Las tres cajas de tops ya no enseñan la nota; solo el nombre.** `Top 1`, `Top 2` y `Menos nota` renderizaban `nombre + nota` (`God of War (2018) 7,00`). Ahora enseñan **solo el nombre**. `Promedio global` **no se toca**: es el único número de la banda y sigue mostrando su media (`6,17`).
  - **El año entre paréntesis se queda, y es deliberado.** `God of War (2018)` y `Doom (2016)` llevan dígitos, pero son **parte del título del juego**, no una puntuación. Lo que se quita es la nota (el decimal con coma: `2,00`), que es lo que se comprueba en el test.
  - **Medido en 4 anchos (1440 / 1280 / 900 / 390):** las 4 cajas se mantienen, las tres de tops **sin decimal de nota**, `Promedio global` conserva el suyo, las 4 con la **misma altura** (68,7 px en escritorio: la de texto largo ya no desborda) y el centrado horizontal intacto (**0 px** de desviación). Consola limpia.
  - **Efecto colateral que se arregla de paso:** el desbordamiento de texto que arrastraba «Menos nota» a 2 líneas y estiraba la banda de 68,7 a 93,3 px. Con el nombre solo, la caja actual cabe en 1 línea.
  - **Lo que NO se ha tocado (preexistente, no es de este cambio):** las cajas **no siguen la búsqueda por texto**, solo los **filtros de columna**. `renderStats(currentGames)` recibe la lista de `filteredGames()`, que en `script.js:138-140` solo lee `filters`; el texto del buscador se aplica después en `render()`. Buscar «sifu» deja 1 fila visible y las cajas siguen describiendo los 8 juegos. Es el comportamiento de siempre: este cambio solo borró interpolaciones de la plantilla, ni `computeStats` ni su llamada se han tocado.

**vv23 — 2026-09-26**
- **La tabla se queda sin fondo.** `.sheet` pasa de `background: var(--raise)` a `transparent`. Las filas ya eran transparentes (`--row-bg: transparent`), así que ese era **el único campo opaco** que quedaba: lo que se ve ahora tras la tabla es el fondo del mundo (grano) y la estructura la ponen sus propias líneas — el hairline de 1 px entre filas y el `border-bottom` de la cabecera.
  - **Medido por píxeles contra la variante opaca, en la misma página** (6 franjas repartidas por los 932 px de tabla, 70 celdas con dígitos reales):
    - El campo que entra es **más oscuro**, no más claro: mediana **−3,5** de luminancia (−2,5 a −6,5 según la franja). La razón es que `--raise` (`#10120c`) era **más claro** que `--bg` (`#0a0b09`), que es lo que queda al descubierto.
    - El contraste de las cifras **mejora**: 91,4 → **94,9** (p98−p50 dentro de la celda). La celda más afectada no pierde nada (delta 0,00). No hay coste de legibilidad; hay ganancia.
    - La variación local que entra es **6,50/255 = 2,55 %**, por debajo del techo de ambiente de `< 9 %` que ya fija `DESIGN.md` §3.
    - **La retícula NO entra.** Es lo que más temía, porque el panel se hizo opaco en vv14 justo para que ninguna línea del fondo se viera desajustada tras la tabla. Medido: el delta de luminancia en las columnas de la retícula (cada 56 px) es **idéntico** al de fuera de ellas (0,93/0,93 arriba, 2,57/2,57 medio, 5,57/5,57 abajo) — lo que se cuela es grano, no la rejilla. La máscara de `.rule` ya la desvanecía antes de que llegara a las notas.
    - Las hairlines de fila **siguen separando**: 6 líneas detectadas por encima de +1,2 de luminancia en la banda medida.
  - **Intacto en 390 / 768 / 1440:** sin caja, sin scroll horizontal de página, hoja sin scroll vertical, 8 juegos / 160 celdas / 4 stats, consola limpia. En móvil y tablet las celdas `sticky` (nombre, jugador y sus cabeceras) **conservan su fondo propio** (`--raise` al 74-82 %), así que siguen leyéndose al scrollear en horizontal; en escritorio no hay ninguna celda sticky (esas reglas viven en `@media (max-width: 40rem)`) porque la tabla cabe entera.
  - Es la **segunda reversión consciente** de la vv23: en vv14 el panel pasó a opaco *a propósito* para que el fondo no se viera tras la tabla. Se anula porque el campo sólido no encajaba con una tabla sin caja.

**vv22 — 2026-09-26**
- **La tabla pierde la caja y se desata de la pantalla.** La hoja se queda **sin borde, sin radio y sin sombra** (medido: `border 1px→0px`, `border-radius 22px→0px`, `box-shadow → none`) y **la página pasa a scrollear**: `main` vuelve a `min-height: 100dvh` (se retira el `height: 100dvh` de vv14/vv16) y la hoja crece con su contenido. Antes, con 8 juegos, la tabla **escondía 362 px de tabla dentro del panel** (`.sheet` medía 547,8 px de alto con `scrollHeight` 893) y el scroll era de la hoja; ahora esa misma tabla mide 932 px y los 362 px son **scroll de página**. Se conservan las líneas internas de la tabla y el scroll horizontal de columnas. *(El fondo opaco de la hoja se retiró después, en vv23.)*
  - **Es una reversión consciente, no un descuido.** vv14 y vv16 justificaron `height: 100dvh` *a propósito* para que la página nunca scrolleara («el scroll interno se blindó de verdad»). Ese criterio se revierte aquí a petición: la tabla tiene que leerse entera aunque el scroll sea de la página. Queda registrado para que nadie lo «arregle» de vuelta.
  - **`flex: 1 0 auto` en `.sheet` es lo que hace falta, medido.** Con listas cortas la hoja tiene que seguir llegando al fondo de la pantalla: filtrando a *Sifu* la hoja mide 571,8 px y su borde inferior cae exactamente en el borde inferior de la ventana (`900 == 900`). Con `0 0 auto` la misma lista dejaba **119 px de página desnuda** debajo. Por eso no es `flex: 1` a secas (que se encoge) ni `0 0 auto`.
  - **El `padding-bottom` de 1,5 rem pasa a 3 rem** y el de `main` a 0: el remate final del contenido lo lleva ahora la hoja, para que la tinta llegue hasta abajo. La suma de los dos paddings es la misma, así que el alto total no cambia.
  - **El destello en vivo deja de ser un anillo.** `liveFlash` pintaba `box-shadow: inset 0 0 0 1px` (un rectángulo redondeado de 22 px); sin caja, ese mismo rectángulo habría sido un **contorno verde duro de 908 px de alto** en cada actualización. Ahora es una **línea de fósforo de 2 px en el borde superior** de la tabla: misma señal, sin recuperar la caja.
  - **La retícula NO se ha movido** (era el riesgo real: al aparecer el scrollbar, `main` se estrecha 15 px y todo se recentra 7,5 px). Medido A/B contra el CSS anterior inyectado en la página viva: `rule`, `ticks` y `main` dan `left = 0` **idéntico antes y después** en 390/1280/1440, y los 20 px de separación con el borde de la hoja son los del `padding-inline` de `main` (12 px en móvil) — los mismos de antes. La regla sigue anclada al *border-box* de `main`, que es lo que dice su fórmula `calc(50% - min(46rem, 50%))`.
  - **Verificado por geometría, no a ojo** (Chrome headless + CDP, 5 viewports: 390/900/1280/1440/1920): 8 juegos, 160 celdas y 4 stats intactos en todos; `overflow` vertical de la hoja **0** en todos; **cero scroll horizontal de página** en todos (la rejilla sigue con `min-width: 88rem` y su scrollbar propio, que hace falta de 1200 a 1408 px); consola limpia. Sin cambios en 0 resultados (`script.js` ya ocultaba la hoja) ni en el filtro (1 juego visible, la hoja sigue llenando la pantalla).
- **Test de cache-bust FAIL → arreglado.** `verify-served.mjs` llevaba `?v=29` escrito a mano, así que fallaba en cada subida de versión. Ahora **deriva la versión del HTML servido** y comprueba lo que de verdad importa: que los tres enlaces llevan `?v=` y que **comparten la misma** (y que es ≥ la del cambio).

**vv21 — 2026-09-26**
- **Fuera el «círculo» del fondo; dentro la estructura.** La mancha de la esquina superior derecha era `.monolith` — un `conic-gradient` dentro de un `border-radius` asimétrico, con `right: -4rem` y opacidad 0,5. Medido por píxeles (Chrome headless + CDP, decodificando el PNG y comparando cada capa contra un fondo limpio) era, con diferencia, **la capa más circular**: excentricidad **1,14** y bbox visible 271×236 (aspecto 1,15) — prácticamente un disco. Las otras cuatro dan excentricidad 3,1–3,4 (lavados o líneas), así que la culpa era solo suya. Se retira del HTML y del CSS.
- **Lo sustituyen dos capas de estructura, no otro objeto** (elección de A+B sobre tres: orgánica, calibre, o ambas):
  - **`.rule` — retícula de registro.** Columnas de 1 px cada 56 px **alineadas exactamente con la columna de contenido** (`left: calc(50% - min(46rem, 50%)); width: min(92rem, 100%)`, el mismo criterio que `main`), con los dos bordes de columna un pelo más marcados. Se desvanece por encima de la hoja: nunca compite con la tabla.
  - **`.ticks` — regla de calibración.** Un calibre arriba en la misma columna: tick corto cada 14 px, largo cada 70 px, más **3 marcas en fósforo** (los dos extremos y el centro) a 2 px. Los dos patrones de tick van en el fondo del propio elemento con dos `background-size` distintos, para dejar `::after` libre: las marcas tienen que quedar **por encima** de los ticks, o el tick largo opaco las tapa.
  - **Reordenadas las capas del fondo** (`sheen, grain, stipple, rule, ticks`): la luz ambiente estaba la última y pintaba encima, midiendo G=85/61/101 en las marcas — la de la derecha **se perdía dentro del lavado** (pico G=89). Con la luz abajo y las marcas al 0,55 de `--green` quedan en G=94/136/143, por encima del lavado, y son exactamente 3 racimos de 2 px.
  - Verificado por píxeles sobre fondo plano (con el `.sheen` oculto, que si no su gradiente empinado falsea el destendizado) y sobre el render real: ticks largos de residuo **27 uniforme en los 21 múltiplos de 70** (dispersión 0), cortos 15, huecos 0; retícula con 26/26 columnas en la rejilla de 56 px y **bordes de columna exactamente el doble** que las interiores (15,8 vs 7,9 = `--line` vs `--line-faint`); ambas capas con `fill` 0,01 (líneas puras) frente al 0,68 del monolito; alineación con `main` exacta (±0 px) en escritorio, tablet y móvil; la regla no invade el buscador (termina en y=12, el campo empieza en y=55-63); sin errores de consola.
- **Arreglado el «segundo filtro no hace nada».** `server.js` construía `slug` pero **no lo enviaba** en la respuesta (se quedaba solo en el servidor para nombrar carátulas), y el cliente usaba `g.slug` como clave de un cache de puntuaciones. Todas las claves acababan en `undefined:0:Sele`: los 8 juegos **colisionaban en la misma entrada**, así que `getGameScore` devolvía el mismo valor para todos (5,50 / 7,50 / 4,50 en todas las categorías) y ordenar por una categoría no reordenaba nada. Además el cache solo se rellenaba tras el sync del servidor, de modo que en la carga inicial devolvía `null` y **la tabla se vaciaba al añadir el segundo filtro**. El cache se elimina —`p.scores[idx]` ya es O(1), el Map solo añadía concatenación de cadenas— y los nombres normalizados van ahora en un `WeakMap` **por objeto**, que no puede colisionar.
- **Arreglado media hoja de CSS muerta.** Una llave `{` sin cerrar (un `.sheet {` duplicado) dejaba **572 líneas inválidas** a partir de ahí: sin ella se perdían `.sheet-link`, `#toast`, `.wave`, `.stats` y compañía. Por eso el botón de Google Sheets salía sin estilo y el aviso «Sonido activado · M» aparecía como texto plano y estático en un lateral — no era un elemento propio, era **el toast sin CSS**. Balanceado 233/233.
- **4 cajas de stats centradas en vertical.** Eran un flex column sin `align-items` ni `justify-content`, así que el contenido se pegaba al borde superior y el hueco sobrante caía entero abajo (medido: 24,6 px arriba / 0 abajo). Ahora `align-items: center` + `justify-content: center` → **12,31 px arriba / 12,33 px abajo** (delta vertical máximo 0,02 px en escritorio, 0,00 px en tablet y móvil).
- **Panel de stats:** «Más puntuado» sustituido por **«Menos nota»** (el juego con la nota media más baja) y los cuatro valores en un único verde `--green`, sin variations de oro/rojo.
- **Fuera el conmutador de tema:** la página es **solo oscura**. Se retiran el botón, el CSS de `.tool-btn`, los bloques `[data-theme]`/`prefers-color-scheme: light` y toda la lógica JS de tema.
- **Navegación por teclado en la tabla:** flechas, `Home`, `End`, `Enter`, `Espacio` y `Esc` con *roving tabindex* (`aria-row`/`aria-cell` ya presentes), y `M` sigue silenciando los sonidos.
- **Cache-bust `?v=29`** en los tres enlaces de `index.html`.
- **Limpieza:** 10 scripts de verificación sueltos borrados de la raíz (`fix_*`, `verify*`, `check_served.js`, `served.js`, `script_served.js`, `test-server.js`); la raíz queda en 13 ficheros.

**vv16 — 2026-09-25** *(versión raíz)*
- **Arreglado el «verde que tapa la tabla».** La regla del patrón del héroe era `.grid` a secas (`height: 200px; opacity: 0.55` + máscara que desvanece a transparente a partir del 90 %) y la tabla usa la misma clase `.grid` para su estructura: el navegador fusionaba ambas reglas y **la tabla heredaba una opacidad del 55 % y una máscara que dejaba visible solo la primera fila** (~1 juego; el resto era el fondo de la hoja, verde oliva en el tema claro). Ahora el patrón está acotado a `.bg .grid`, así que la tabla se ve completa. Era el mismo origen que las «líneas desajustadas» de vv13.
- **Los títulos de los juegos cambian de tipografía.** Se retira la serif editorial en itálica (Bodoni Moda), que no pegaba con la estética de marcador, y los nombres pasan a **JetBrains Mono semibold** — la misma mono que las celdas, para que toda la tabla se lea como un marcador (coherente con la señal de fósforo).
- **El scroll interno se blindó de verdad.** `main` solo tenía `min-height: 100dvh`; al quitar la máscara la tabla mostraba todo su contenido (8 juegos ≈ 870 px), estiraba `main` más allá de la pantalla y **volvía a scrollear la página** en vez de la tabla. Ahora `main` usa `height: 100dvh`, de modo que la hoja rellena lo que queda bajo el buscador y **scrollea por dentro** aunque la tabla esté llena. *(Reverso en vv22: `height: 100dvh` se retiró y la tabla volvió a crecer con la página.)*
- **La nota dorada (9+) por fin se ve.** El número salía literalmente en el mismo dorado que su caja: la línea `background-color: var(--gold)` del bloque de brillo pintaba **toda la cápsula de dorado opaco** (el `background-clip: text` solo recorta las capas de imagen, no el color de fondo), así que el número se fundía con el recuadro. Quitada esa línea → el número queda en dorado sobre la **píldora tenue al 10 %**, y el brillo dorado se conserva. Comprobado por píxeles en claro y oscuro (antes un único color dominante en la cápsula; ahora los dígitos se distinguen claramente del fondo).
- **El arranque por el `.bat` deja de parecer un desastre.** Tres causas del «montón de fallos» al iniciar: (1) un `server.js` zombie de una sesión anterior seguía escuchando en el 8080 — el del `.bat` moría con «puerto ocupado» y el navegador abría la página que servía ese proceso viejo; (2) el servidor cacheaba el CSS una hora entera (`max-age=3600`) y el navegador seguía usando el `styles.css` antiguo (la máscara verde, los títulos serif…); (3) la hoja en línea de Google seguía con **ceros en categorías sin puntuar** que arrastraban las medias. Ahora: el `.bat` detecta el puerto 8080 ocupado y no duplica el servidor; CSS/JS/HTML se sirven **siempre sin caché** (más `?v=20` en `index.html`); `server.js` trata **vacíos como «sin puntuar»** (igual que una casilla vacía) y **conserva los 0 explícitos** como valores reales; y el `.bat` abre el navegador **2 segundos después** de lanzar Node, así la primera carga ya encuentra el servidor escuchando.
- **La tabla se actualiza en tiempo real (sin recargar).** Con la página abierta vía `.bat`, `server.js` comprueba la hoja de Google cada ~6 s y la página la sondea cada 10 s: solo cuando la hoja **cambió de verdad** se re-renderiza la tabla (con un **destello sutil** y, si aplica, la nota vuelve a contar), y bajo el buscador aparece el badge **«En vivo · N juegos · HH:MM:SS»** con un punto de fósforo que parpadea al actualizarse. Si la hoja no cambió, la respuesta llega desde la caché del servidor y la página no toca nada (cero parpadeos). Todo respeta `prefers-reduced-motion` y se apaga si la pestaña no está visible.
- **La píldora de la Nota queda centrada de verdad.** La cápsula del número salía ~2 px por encima del centro de su celda (medido en las 9 notas): en las **tablas de escritorio** `vertical-align: -3px` la deja a +0,25 px del centro y en las **tarjetas móviles** se resetea a 0 (a -0,23 px), todo sin tocar el *pop* de la nota al terminar de contar.
- **Los números de las categorías quedan centrados de verdad.** Medidos por píxeles (centroide de tinta de los dígitos): iban ~3,3 px por encima del centro de su celda en escritorio. Se bajan con **padding asimétrico** — el total de padding es el mismo, así que la altura de la fila no cambia — dejándolos a −0,3 px del centro; la píldora de la Nota (ya calibrada) mantiene su propio padding. En móvil cada celda es etiqueta + número y el conjunto ya quedaba centrado: no se toca.
- **Documentación consolidada.** Se retiran los documentos redundantes (el README de la copia v10) y la carpeta `ranking-web/` (versión antigua obsoleta). El `RAKING_GAMES.xlsx` original se conserva en la raíz como respaldo. `PRODUCT.md` se rehace en **formato breve** (verdad de producto, sin duplicar el README) porque lo consume el skill `impeccable` (hooks en `.claude/` y `.codex/`). Queda la documentación en cuatro capas: `README.md` (canónico + changelog), `DESIGN.md` (contrato visual), `AGENTS.md` (guía operativa) y `PRODUCT.md` (verdad de producto).

**vv20 — 2026-09-25** *(versión raíz)*
- **Limpieza del repositorio:** eliminados 9 scripts de arreglo puntual (`fix-*.js`, `fix-*.mjs`, `fix-*.ps1`, `test-server.ps1`) con rutas absolutas hardcodeadas que ya no servían.
- **server.js robusto:** 5 correcciones críticas — (1) handler de `unhandledRejection` y `server.on('error')` para detectar puerto ocupado; (2) `fetchURL` con timeout de 15 s y reintentos de redirección; (3) fix de path traversal en archivos estáticos (`BASE_DIR + path.sep`); (4) deduplicación de sincronizaciones concurrentes con `syncInFlight`; (5) `syncGoogleSheets` recibe el CSV ya descargado (evita doble fetch).
- **Cliente resiliente:** (1) sondeo `setInterval` arranca **fuera** del `try/catch` → sigue vivo aunque falle el primer fetch; (2) `history.replaceState` protegido con `try/catch` (funciona en `file://`); (3) cache de scores por juego/categoría/jugador + `strip` names precomputado en `filteredGames()` (evita recálculos en cada render); (4) límite de concurrencia 3 para descarga de carátulas (cola estilo `p-limit`).
- **Código muerto eliminado:** `TEST_HOOK`, parámetro `highlight` en `cell`, `highlight` q-param en URL, `still` duplicado (ya existe `reduceMotion`), `lastHash` duplicado, `q` params muertos.
- **test-zero-scores.mjs** reescrito para testear `parseScores` real de `server.js` (extrae y evalúa la función).
- **Brillo dorado (nota ≥ 9) rehecho (opción a):** un solo *sweep* (`::before` con gradiente banda) recortado por `overflow:hidden` en `.np`; ciclo ~4,5 s con pausa larga; sin `mix-blend-mode` ni halo separado → nada de corte ni parpadeo; visible en tema claro y oscuro; altura de fila y `vertical-align: -3px` intactos.
- **Cache-bust `?v=20`** en los tres enlaces de `index.html`.

**vv15 — 2026-09-25** *(versión raíz)*
- **Filtro por categorías corregido y con límite de 2.** Antes las cabeceras se apilaban como niveles de prioridad y al añadir una segunda categoría no pasaba nada visible (solo desempataba, y sin empates la lista no cambiaba). Ahora cada cabecera cicla **más nota arriba (▼) → el que menos (▲) → se quita**, con **máximo 2 categorías a la vez**: si se pulsa una tercera se libera la más antigua. Las activas **filtran** — solo se listan los juegos con esas categorías puntuadas (el contador pasa a "n de 8 juegos") — y con dos activas la ordenación usa la **combinación de ambas** (cada una aporta su valor; la que está en ▲ lo resta), por lo que añadir la segunda categoría **siempre modifica la lista**. El filtro se conserva al sincronizar con Google Sheets (los datos de refresco pasan también por el mismo filtro).

**vv14 — 2026-09-25** *(versión raíz)*
- **La tabla tiene scroll propio:** `main` pasa a ocupar toda la pantalla (flex en columna con `min-height: 100dvh`) y la hoja rellena el resto del espacio; el buscador queda fijo y es la **tabla la que scrollea por dentro** (vertical, además de su scroll horizontal nativo de columnas) en vez de mover toda la página. *(En vv22 la hoja pierde la caja y el scroll vertical pasa a ser el de la página.)*
- **Hoja opaca:** el panel de la hoja pasa de semitransparente (94 %) a **fondo sólido**, eliminando de raíz cualquier línea o patrón del fondo que se viera desajustado tras la tabla. *(vv23 lo deja transparente: medido, la retícula no llegaba a verse y el contraste de las cifras mejora.)*
- **Lote de animaciones nuevas** (solo `transform`/`opacity`, todas respetan `prefers-reduced-motion`): entrada de la hoja al cargar (`sheetIn`, 0,7 s), la flecha de la columna activa entra con un *pop* (`sortPop`) y la píldora de la Nota hace un *pop* al terminar de contar (`notaPop`). Con ratón (solo `(hover: hover)`): el nombre del juego se desplaza 3 px, la carátula crece a 1,06 y la cabecera activa sube 1 px al pasar el cursor, con transiciones suaves.

**vv13 — 2026-09-25** *(versión raíz — rediseño «PHOSPHOR»)*
- **Rediseño completo del mundo visual:** dirección propia **PHOSPHOR** frente a las referencias — brutalismo suizo monocromo con un único acento de **verde fósforo `#C6FF4A`** (luz ambiental tenue, estados de foco/activo, nota buena, hover de fila) y superficies de **cristal esmerilado** (frosted glass suave: translucidez, borde fino, brillo interior y blur solo donde es barato: buscador y celda del nombre).
- **Nuevo sistema tipográfico:** **Bodoni Moda** (serif editorial, nombres de juego en itálica), **Space Grotesk** (etiquetas y cabeceras en mayúsculas) y **JetBrains Mono** (celdas y datos tabulares). Se deja de usar Michroma.
- **Texturas y estructura:** film grain estático + estippling + retícula de registro de 1 px tras el buscador + regla de calibración. Fondo del mundo en capa fija (`pointer-events: none`) — grano nunca dentro de contenedores con scroll. *(Actualizado en vv21: el monolito se sustituyó por la retícula de registro y la regla de calibración.)*
- **Carátulas como máscaras píldora:** miniatura de la portada junto al nombre del juego (desktop y tarjetas móvil), con la carátula borrosa de fondo conservada.
- **Fósforo como vocabulario de estado:** la fila respira al pasar el ratón (señal de 1 px a la izquierda + fondo elevado), el anillo del cursor enciende en fósforo sobre las filas, la columna activa muestra su flecha en fósforo, el punto de señal del buscador se enciende al enfocar.
- **Superficies del navegador tematizadas:** caret, selección, scrollbars y anillo de foco desde la paleta.
- Tablas (2 filas por juego × 9 categorías + Nota), sonidos (Web Audio, tecla M), cursor propio, buscador a la derecha, multiordenación, tarjetas móvil, `?q=` y `/` **se conservan intactos como comportamiento**. Movimiento solo `transform`/`opacity` (`prefers-reduced-motion` y `prefers-reduced-transparency` respetados).
- **Lote de correcciones (mismo vv13):** el panel de la hoja pasa a ser casi opaco (94 %) — los patrones y la luz de fondo ya no se ven dentro de la tabla; la rejilla, el estippling y la luz ambiental quedan confinados a la zona del héroe (se desvanecen por encima de la hoja); la Nota final pasa a una **píldora pequeña pegada al número** (fondo muy tenue, tintes al 8–10 %, brillo dorado conservado) con el mismo padding que el resto de celdas, así que queda **alineada verticalmente** con los números de su fila.

**vv12 — 2026-09-25** *(versión raíz)*
- **Ordenación multicriterio:** ahora se pueden ordenar varias columnas a la vez. Cada clic sobre una cabecera la alterna mayor→menor→quitar, y el orden de prioridad es el de activación (la primera manda y los empates se resuelven con la siguiente). Las cabeceras activas muestran ▼/▲.
- **Se elimina la etiqueta «sin puntuar»** que vv11 añadía a los juegos sin ninguna nota: ahora un juego sin notas se reconoce por sus guiones (—) en las dos filas.

**vv11 — 2026-09-25** *(versión raíz)*
- **Datos:** los ceros de *Rv There Yet* (Extras y Personajes) y de *God of War: Chains of Olympus* (Extras) se conservan como **0 explícito** y cuentan en la media; las celdas vacías pasan a «sin puntuar» (no arrastran la media). Pendiente de vaciar en la hoja en línea las categorías que deban ser «sin puntuar» (ver §9).
- **Móvil:** en pantallas pequeñas (≤ 40 rem) la lista pasa a **tarjetas por juego**: nombre arriba, las 9 categorías en cuadrícula 3×3 con su etiqueta, nota destacada abajo y sin desplazamiento horizontal.
- **Etiqueta discreta «sin puntuar»** en los juegos sin ninguna nota.
- **Enlace compartible:** la búsqueda se refleja en `?q=` (se aplica también al abrir el enlace).
- **Atajo `/`:** enfoca el buscador (no cuando el foco ya esté en un campo).
- Ordenar por columnas (incluida la Nota, media conjunta de Sele y Vande) y la actualización automática con Google Sheets ya estaban en la versión raíz.
- El título «RANKING» sigue sin mostrarse a propósito, como se decidió hace tiempo.

**v10 — 2026-09-21**
- Al pasar el ratón por los **juegos ya no suena nada**. Sonidos nuevos con timbre de kalimba: nota suave sobre el buscador y "plin-plin" ascendente al hacer clic.
- **Revisión general** de la página (ver §9). Correcciones: texto de ayuda del buscador invisible con el foco (escritorio); en móvil, nombre transparente que se solapaba con los números y jugador que desaparecía al desplazar; clic con sonido al empezar a desplazar en táctil; hover "pegado" en táctil; cabeceras de columna más legibles (10,5 → 11,5 px).
- Animación: transiciones en lugar de keyframes para los juegos (se reajustan si se interrumpen), curva única y duraciones ≤ 300 ms, cursor suavizado por tiempo.
- El proyecto se entrega como **carpeta descargable** con archivos separados (HTML, CSS, JS, datos) además de la versión de un solo archivo.

**v9 — 2026-09-20**
- Cursor propio minimalista (punto + anillo con seguimiento suave, estados de hover/texto/pulsado, onda al clic).
- Sonidos suaves de hover y de clic sintetizados; tecla **M** para silenciar, con aviso breve.
- Este README y la carpeta compartible (`src/`, hoja de cálculo).

**v8**
- Las notas finales cuentan de 0 a su valor al aparecer.
- Destello dorado en notas de 9 o más. Se corrigió un fallo por el que el número desaparecía a trozos durante el destello.

**v7**
- Corregidas las líneas separadoras desiguales (rediseño como rejilla de bloques; ver §7).
- Notas de 9 o más en **oro**.

**v6**
- Los resultados aparecen y desaparecen con animación suave (cascada al entrar, fundido rápido al salir, sin reiniciar lo que ya estaba).

**v5**
- "RANKING" más pequeño y pegado a la izquierda.

**v4**
- Buscador alineado a la derecha.
- Sin resaltado blanco del texto buscado.
- Nota en verde (5 o más) y rojo (menos de 5).

**v3**
- Animación del buscador: destello en la línea en reposo, despliegue al enfocar y texto de ayuda rotativo.

**v2**
- Los juegos pasan de cajas con tablas a **lista tipo leaderboard** (imagen de referencia): nombre del juego a la izquierda, dos filas (Sele y Vande) con las categorías y la nota.
- "RANKING" sube en la página.

**v1**
- Primera versión: buscador en tiempo real, "RANKING" centrado arriba sin barra superior, buscador minimalista centrado, resultados en cajas con tabla y barras, paleta monocroma y tipografías elegidas (JetBrains Mono / Spline Sans Mono y Michroma).

## 9. Estado y pendientes

**Hecho:** búsqueda en vivo · diseño monocromo con variante clara · lista tipo leaderboard · notas con color (verde/rojo/oro) · animaciones de búsqueda, de notas y de oro · cursor propio · sonidos con tecla M · README · carpeta descargable con archivos separados · revisión general (v10) · **versión raíz (vv12):** carátulas automáticas, ordenación multicriterio y sync con Google Sheets (la de una columna ya estaba), tarjetas móvil, enlace `?q=` y atajo `/`; la etiqueta «sin puntuar» se eliminó a propósito.

**Revisión v10 — arreglado:** ver v10 en §8.

**Hecho en vv11:** ver §8.

**Hecho en vv13:** rediseño visual completo «PHOSPHOR» (ver §8): saneamiento de entorno y skills previo; el código de datos, servidor y carátulas no se toca. Incluye el lote de correcciones posteriores al rediseño: hoja casi opaca, patrones del fondo solo en el héroe y píldora de Nota pequeña y alineada con los números.

**Hecho en vv14:** ver §8 — la tabla scrollea por dentro (sin mover la página), la hoja pasa a fondo sólido y llega un lote de animaciones nuevas (hoja, flecha de columna y píldora de Nota), todo con `prefers-reduced-motion` respetado y movimientos solo `transform`/`opacity`. *(vv22 revierte el scroll interno y vv23 retira el fondo sólido.)*

**Hecho en vv15:** ver §8 — filtro por categorías con **límite de 2**, ciclo ▼→▲→quitar por cabecera y la **segunda categoría ya modifica la lista** (filtra los juegos sin esa categoría y ordena por la combinación de ambas).

**Hecho en vv16:** ver §8 — corregido el «verde que tapa la tabla» (la máscara/opacidad del patrón del héroe se colaba en la tabla por compartir la clase `.grid`), títulos de juego en **JetBrains Mono semibold** (adiós a la serif itálica) y `main` con altura real para que la tabla **siempre** scrollee por dentro y la página no se mueva *(vv22 lo revierte)*; **tiempo real** con Google Sheets (badge «En vivo», sondeo cada 10 s, re-render solo si cambia); la píldora de la Nota y los **números de las categorías centrados por píxel**; y **documentación consolidada** (README/DESIGN/AGENTS + PRODUCT breve).

**Hecho en vv12:** ver §8.

**Hecho en vv20:** ver §8 — limpieza de scripts `fix-*`, server.js robusto (unhandledRejection, timeout, path traversal, deduplicación sync, doble fetch), cliente resiliente (polling fuera de try, replaceState guardado, cache de scores, límite concurrencia carátulas), código muerto eliminado (TEST_HOOK, q-param highlight, still duplicado, lastHash duplicado), test-zero-scores real, brillo dorado sweep único, cache-bust v=20.

**Hecho en vv22:** ver §8 — **la hoja pierde la caja** (sin borde, radio ni sombra) y **la tabla se desata de la pantalla**: `main` vuelve a `min-height: 100dvh` y el scroll pasa a ser el de la página, de modo que con 8 juegos se ven los 362 px que antes quedaban escondidos dentro del panel. Es la **reversión consciente** del scroll interno de vv14/vv16. `flex: 1 0 auto` en `.sheet` para que las listas cortas sigan llenando la pantalla; el destello en vivo pasa de anillo a línea de fósforo de 2 px en el borde superior.

**Hecho en vv23:** ver §8 — **la tabla pierde también el fondo** (`.sheet` a `transparent`); lo que la estructura son sus propias líneas. Reversión consciente del panel opaco de vv14, y medido sin coste: la retícula no llega a verse, el contraste de las cifras sube y la variación que entra se queda en el 2,55 %.

**Hecho en vv24:** ver §8 — las tres cajas de tops (`Top 1`, `Top 2`, `Menos nota`) enseñan **solo el nombre**, sin la nota; `Promedio global` conserva su número por ser el único dato numérico de la banda. De paso se va el desbordamiento de texto que estiraba la banda de 68,7 a 93,3 px.

**Hecho en vv25:** ver §8 — **fuera el relleno opaco del hover de fila**. La fila ya no se pinta al pasar el ratón: se enciende la marca de fósforo de 1 px y su luz, que se desvanece en 144 px. Probado por píxeles con A/B contra el CSS viejo: el grano de fondo sobrevive en las 9 de 9 muestras (la placa lo apagaba en 4 de 9) y el contraste del nombre sale ganando (7,18 con resplandor frente a 6,61 con la placa).

**Hecho en vv26:** ver §8 — **fuera la onda por letra del botón «Google Sheet»**. El enlace ya no baila: el texto es una sola tirada, sin los 12 `<span class="wave">` que solo existían para escalonar el movimiento. El brillo de hover se conserva (ahora una sombra sobre el texto entero, no doce). De paso se corrigió un bug que llevaba años visible: el espacio entre «Google» y «Sheet» medía 0 px y el botón pintaba `GoogleSheet`. Nada más en la página se mueve: barra y campo de búsqueda idénticos.

**Hecho en vv27 + vv27b:** ver §8 — **aire entre juegos** en la tabla (`0,7rem` entre cada juego; antes el hueco era de `0` px exactos y lo único que separaba filas era un pelo de 1 px al 4 % de opacidad). El separador es **espacio, no pintura**, así que la transparencia de la hoja (vv23/vv25) y el grano se respetan, y el pelo no se quita: el aire es un segundo canal. El aire es **simétrico** desde vv27b (`margin-top` en el hermano + `margin-bottom` en cada juego), de modo que los 8 huecos siguen en `11,1875 px` — el colapso a `max()` impide que se dupliquen — y lo único que aparece es el `+11,1875 px` que faltaba bajo el último juego. Medido: la hoja crece `+100,6875 px` respecto a antes de vv27 y **el alto de cada fila no cambia**. En móvil las tarjetas **no se mueven** (`max(15,2, 11,2) = 15,2`, comprobado a 390 px). Además, cinco guardas tenían `8 juegos` escrito a mano y la hoja ya tiene 9: ahora la cuenta se deriva de la fuente.

**Revisión v10 — pendientes en la versión raíz:**
- **Google Sheets (limpieza opcional):** los ceros explícitos de *Rv There Yet* (Extras y Personajes) y de *God of War: Chains of Olympus* (Extras) cuentan en la media; las celdas vacías son «sin puntuar». Si se desea que esas categorías no cuenten, basta con vaciar las celdas en la hoja. El borrado en la hoja queda como decisión de contenido, no de lógica.
- **Datos:** rellenar más juegos en la hoja (solo hay 8 de 115 huecos; hacen falta las notas reales de Sele y Vande).
- **Sonido:** escuchar y afinar los sonidos con oído humano (hasta ahora solo se han medido).
- **Documentación:** la lista de tareas conocidas y el estado de la versión se mantienen en `README.md` (§9) y en `AGENTS.md` (guía operativa).
- Cursor de bloque parpadeante tras «RANKING»: **no procede** en la raíz, donde el título se eliminó a propósito.
