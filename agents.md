# agents.md — guía operativa para agentes de IA

> Punto de entrada para trabajar sobre este proyecto sin romper nada.
> Documéntate, actúa con cuidado y **verifica por píxeles/consola** los cambios visuales.
> El dueño abre la app desde **`iniciar_ranking.bat`** (puerto 8080): todo cambio en el código debe verse ahí.

## Mapa de documentación

| Archivo | Qué contiene |
| --- | --- |
| `README.md` | Fuente canónica y changelog por versión (`vvNN`). Leer primero. |
| `DESIGN.md` | Contrato visual **PHOSPHOR** (tokens, reglas del fósforo, tipografías). Decisiones duraderas. |
| `PRODUCT.md` | Verdad de producto en formato breve (la consume el skill `impeccable`; no duplicar contenido del README). |
| `agents.md` | (este) Operativa: cómo corre, arquitectura, reglas de edición y verificación. |

> Consolidación 2026-09-25: se retiraron los documentos redundantes (el README de la copia v10) y la carpeta `ranking-web/` (versión vieja obsoleta). `PRODUCT.md` se rehízo en formato breve (el skill `impeccable` lo requiere como contrato). El `RAKING_GAMES.xlsx` original se conserva en la raíz como **respaldo histórico** de datos (ya no alimenta la página; los datos viven en Google Sheets).

## Qué es

Página de una sola pantalla con una **tabla de clasificación** por videojuegos: cada juego tiene **2 filas** (Sele y Vande) × **9 categorías** (Historia, Jugabilidad, Originalidad, Niveles, Visual, Sonoridad, Dificultad, Extras, Personajes) + **Nota** (media). Colores de nota: **oro ≥ 9**, **verde ≥ 5**, **rojo < 5**. Los **vacíos en la hoja = «sin puntuar»** (equivalen a casilla vacía; nunca arrastran la media); **0 explícitos se conservan como 0** y cuentan en la media.

## Cómo se ejecuta

- **Normal:** doble clic en `iniciar_ranking.bat` → arranca `node server.js` en `http://localhost:8080`, hay guardia de puerto (si 8080 ocupado no duplica servidor) y abre el navegador **2 s después** (para que Node ya escuche).
- **Manual:** `node server.js` (misma URL).
- **Estático (sin servidor):** abrir `index.html` con doble clic usa el snapshot local `data.js` (sin sync ni tiempo real).

## Arquitectura actual

- **`server.js`** (Node puro, sin dependencias, puerto 8080):
  - Sirve la raíz; **HTML/CSS/JS siempre `no-cache`** (un CSS cacheado fue la causa histórica de "fallos al iniciar").
  - `GET /api/games`: sincroniza con Google Sheets (CSV de una hoja en línea), descarga carátulas nuevas a `covers/`, escribe `data.js` y responde `{ success, changed, games, cats, updated, hash }`.
  - **Tiempo real:** comprueba la hoja como máximo cada 6 s; compara el **sha1** del CSV; si cambiado → resync completo y `changed: true`, si no → responde de caché (`changed: false`).
  - `parseScores` normaliza **vacíos → `null`**; **0 explícitos se conservan** como `0` y cuentan en la media.
- **`script.js`** (cliente): busca, ordena (cabeceras ciclan mayor→menor→quitar, **máx. 2 categorías** activas que filtran), tarjetas móvil, y el **sondeo**: pregunta `/api/games` cada 10 s y **solo re-renderiza cuando `changed: true`** (badge «En vivo · N juegos · HH:MM:SS» + destello). Pausa si la pestaña está oculta.
- **`data.js`**: snapshot generado por `server.js` (fallback sin servidor / primer pintado).

## Reglas de edición (no negociables)

1. **Conservar:** tablas (2 filas/juego × 9 cat + Nota), sonidos (Web Audio, tecla M), cursor propio, buscador, ordenación, tarjetas móvil.
2. **Animación solo `transform`/`opacity`**, todas dentro de gates `prefers-reduced-motion`, `prefers-reduced-transparency` y `(hover:hover)`.
3. **No añadir assets remotos nuevos**; fondos en CSS/SVG data-URI.
4. **Cache-bust:** al tocar `index.html`, `styles.css` o `script.js`, subir `?v=NN` en los tres enlaces de `index.html` (actual: `v=36`). La `v` es la **misma** en los tres; `verify-served.mjs` la deriva del HTML servido y falla si no coinciden o si baja de la del cambio.
5. **No revertir:** `--gold` claro `#A67C00` / oscuro `#F2B93B` (contraste intencional por tema); **vacíos → `null`, 0 explícitos → `0`** en `server.js`; horizontal centrado vertical de números y píldora ya calibrado (padding asimétrico en `.c`, `vertical-align: -3px` en `.np` escritorio y `0` en móvil); **la hoja y las filas son transparentes** (vv23/vv25) — ninguna regla de estado puede pintar un campo opaco encima; el hover se señala con **capas de opacidad**, nunca con un relleno (`--row-bg` se queda en `transparent`).
6. Los cambios deben verse **desde el `.bat`** (el servidor sirve la raíz; el usuario espera verlos ahí).

## Verificación (hábito obligatorio antes de dar por bueno un cambio visual)

El modelo no ve imágenes: usar **Chrome headless vía CDP** (`--headless=new --remote-debugging-port`), con `--force-device-scale-factor=1`, y comprobar:

- **Geometría real:** `getBoundingClientRect`, offsets subpíxel. Para "centrado de texto" medir con sonda inline en baseline o **decode PNG + centroide de tinta** (nunca fiarse solo de métricas de canvas).
- **Estados:** número de filas, celdas, `zeroCells === 0`, altura de fila antes/después (debe ser idéntica si solo se mueve contenido).
- **Consola:** `Runtime.consoleAPICalled` sin errores.
- **Contrato del sondeo:** dos `GET /api/games` seguidos → `changed: true` y luego `false` (mismo hash).
- **Temas claro y oscuro** (p. ej. la píldora dorada se comprueba por clústers de píxeles).

Patrón probado: levantar un servidor estático temporal (puerto 8090) para medir sin molestar al del usuario, y **dejar 8080 libre** (o al usuario le falla el `.bat`).

## Tareas pendientes conocidas → README.md §9

- Hoja en vivo: borrar ceros sobrantes (limpieza, ya no afecta por el `0 → null`).

## Habilidades / agentes

- Skills instalados en `.agents/skills/` (`agent-browser`, `frontend-design`, `grill-me`, `impeccable`); `skills-lock.json` registra la instalación. Skills se ejecutan con permisos completos: revisar antes de usar.
- Existen configs de otros agentes (`.claude/`, `.codex/`, `.impeccable/`).