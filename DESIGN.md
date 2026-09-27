# DESIGN.md — PHOSPHOR

> Mundo visual del RANKING (definido en vv13, actualizado en vv16 en tipografía). Lo que queda escrito aquí son decisiones **duraderas**.
> El contrato de dirección vivo está en `.impeccable/surfaces/index-html.md`; el piso de calidad en `.impeccable/design.json`.

## Dirección

**Brutalismo suizo monocromo con una sola señal: verde fósforo.** La hoja de puntuaciones se lee como un *panel de instrumentos*: la entrada de datos es silencio en tinta; el fósforo solo aparece donde hay señal (foco, estado activo, nota buena, fila bajo el ratón, cursor sobre objetos interactivos). Cristal esmerilado como superficie de lectura y de control (buscador y celda de juego).

## Identidad

- **Mundo:** tinta con soplo de oliva (`#0A0B09`) + cristal esmerilado (translucidez + borde fino + brillo interior superior). Texturas: film grain estático en capa fija, estippling, **retícula de registro de 1 px** y **regla de calibración** — ambas alineadas a la columna de contenido y con nombre de clase propio (`.rule`, `.ticks`). Sin imágenes de fondo: todo es CSS/SVG data-URI. *(vv29: el «monolito» —mancha orgánica con `conic-gradient`— se retiró; se leía como un círculo. Lo sustituyen estructura, no otro objeto.)*
- **Voz tipográfica:** **JetBrains Mono semibold** para los **nombres de los juegos** — el título es un dato de marcador, pegado a la estética de tabla — y para las celdas numéricas; **Space Grotesk** para etiquetas y cabeceras en mayúsculas. Desde **vv16** se retiró la serif editorial (Bodoni Moda, el contrapunto didone del brutalismo) y se ahondó en la mono tabular, que no compite con la señal de fósforo.
- **Conservado a propósito (funciones del producto, no del diseño):** tablas/líderboard con 2 filas por juego y 9 categorías + Nota, sonidos sintetizados (tecla M), cursor propio, buscador a la derecha, multiordenación, carátulas borrosas de fondo y tarjetas móvil.

## Tokens (tinta / noche)

| Rol | Valor |
| --- | --- |
| Fondo `--bg` | `#0A0B09` |
| Superficie `--raise` | `#10120C` |
| Hover `--hover` | `#13150E` |
| Línea `--line` | `#2A2D25` |
| Silenciado `--muted` | `#8A8F80` |
| Suave `--soft` | `#C4C9BC` |
| Frente `--fg` | `#E9EBE2` |
| **Fósforo `--green`** | **`#C6FF4A`** |
| Fósforo tenue `--green-dim` | `rgba(198,255,74,0.3)` |
| Oro `--gold` | `#F2B93B` |
| Rojo `--bad` | `#FF5C4D` |
| Cristal `--glass-bg/brd/hi` | `rgba(16,18,12,0.58)` / `rgba(233,235,226,0.1)` / `rgba(255,255,255,0.05)` |

Variante clara: tokens invertidos con los mismos roles (fósforo profundo `#78A413` para texto, `#F2B93B`→oro profundo `#A67C00`, rojo `#C2403A`). «Buena» = fósforo; «mala» = rojo; «9+» = oro (semántica heredada).

## Reglas del fósforo (anti-abuso)

1. Máximo 3–4 puntos verdes visibles a la vez (forzado por el sistema: fila activa + columna activa + punto de señal + nota buena).
2. Verde **decorativo** solo en hover/foco/activo/estado; nunca filas enteras ni fondos de bloque. *(vv25: el hover de fila dejó de ser un relleno opaco —`--row-bg: var(--hover)`, que era justo una fila entera de bloque— y pasó a ser la marca de 1 px más una **luz de 144 px que se desvanece**, encendida con `opacity`. Medido: cubre el 10,4 % de la fila, el extremo derecho de la misma fila no cambia (0,0003 de luminancia) y el grano de fondo sigue vivo en las 9 de 9 muestras, donde la placa vieja lo apagaba en 6 de 9.)*
3. Fondos ambientales de fósforo a opacidad muy baja (< 0,09 en luz ambiental). Las **3 marcas de la regla de calibración** son la excepción: van al 0,55 de `--green` porque son señal de puntería, no ambiente, y por ser 3 no gastan la cuota de 3-4 puntos verdes. Ese 0,55 está medido, no elegido a ojo: el `.sheen` llega a G=89 en su pico y al 0,30 las marcas daban G=85/61/101 — la de la derecha se perdía dentro del lavado.
4. La nota «buena» usa fósforo porque es **dato semántico**, no decoración.

## Movimiento

- Solo `transform` y `opacity` (cero reflows → sin tirones); `glow` = capa con opacidad, nunca animar box-shadow.
- Curva única `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`; duraciones ≤ 300 ms en estados; cascada de entrada con retardo por índice; interrupciones seguras (transiciones).
- Momento firmado: el **destello + despliegue fósforo** de la línea del buscador; los demás (entrada de filas, contar notas, brillo dorado) son funciones heredadas.
- **vv26: fuera la onda por letra.** El botón «Google Sheet» movía sus 12 letras una detrás de otra (`wave 8s` + 12 retardos de 200 ms). Se retiró el movimiento **y** el markup: un `<span>` por carácter solo servía para escalonar la animación, y además **rompía el texto** — al ser items flex se blockifican, y en un bloque con `nowrap` el espacio al final de línea se elimina, así que el espacio entre «Google» y «Sheet» medía 0 px y el botón pintaba `GoogleSheet`. **Regla: si una animación por letra desaparece, el texto se deja plano; no se conserva el andamiaje.** El brillo de hover se mantiene como una única `text-shadow` sobre el texto entero.
- `prefers-reduced-motion`: solo fundido, sin desplazamiento, sin destello, sin secundario. `prefers-reduced-transparency`: cristal → fondo sólido.

## Jerarquía de superficies

1. Capa de fondo fija (luz/grano/estippling/retícula/regla), `z-index:-1`, `pointer-events:none`. **El orden del DOM importa**: la luz ambiente va la primera y la estructura (retícula, regla) la última, o el `.sheen` se come los pelos de 1px y las marcas de fósforo. Las capas viven **solo** en la banda del héroe: se desvanecen por encima de la hoja, nunca compiten con la tabla.
2. Buscador en píldora de cristal (blur 18px, saturación 1.5, punto de señal).
3. Hoja **sin caja y sin fondo** (vv22/vv23): ni borde, ni radio, ni sombra, ni color de campo — la tabla deja ver el fondo del mundo (grano) y la página es la que scrollea; dentro de la hoja solo queda el horizontal de columnas. Lo que estructura la tabla son sus propias líneas: hairline de 1 px entre filas y `border-bottom` en la cabecera. Y, al lado de esas líneas, **espacio**: desde vv27 hay `0,7rem` de aire entre juegos, porque un pelo al 4 % de opacidad no basta para reencontrar la fila al cruzar doce columnas; desde vv27b el aire es **simétrico** (`0,7rem` debajo de cada juego y `0,7rem` encima de cada uno menos el primero, de modo que también respira el último y la cabecera no se aparta). El aire es un **segundo canal de separación, no un sustituto del pelo**, y por construcción no puede ser pintura: un margen no pinta, de modo que el grano se sigue viendo a través del hueco (medido: 0,7rem por debajo del `0,95rem` de las tarjetas de móvil, para que el colapso de márgenes a `max()` no las mueva; y medido también que los huecos **entre** juegos no se duplican al añadir el lado de abajo, que es justo lo que evita el colapso). Medido: al transparentarla el campo queda **más oscuro** (mediana −3,5 de luminancia, porque `--raise` era más claro que `--bg`), el contraste de las cifras **sube** (91,4 → 94,9) y la variación que entra es **2,55 %**, por debajo del techo de ambiente del §3. El blur sigue vetado en el contenedor con scroll: solo en el buscador y en la celda de nombre, que son áreas pequeñas. **La transparencia es un contrato, no un estado pasajero: ninguna regla de estado (hover, activo, foco) puede pintar un campo opaco sobre la hoja** — es lo que hizo vv25 al retirar el relleno del hover.
4. Nota final en chip tintado por semántica; cabeceras en mayúsculas con flecha de estado en fósforo.
5. Cursor propio por encima de todo; anillo en fósforo sobre filas interactivas.

## Aceptado / rechazado

**Aceptado:** grano, retícula de registro y regla de calibración (texturas ancladas en el brief), carátulas como máscaras píldora, chip de cuenta en píldora, scrollbar/caret/selección tematizados, favicon de fósforo, `overflow-wrap:anywhere` en nombres largos.
**Rechazado:** verde como fondo de bloques, glows de neón, degradados en texto (salvo el brillo dorado heredado), cursor oculto en táctil, animaciones de blur/box-shadow, texto «RANKING» visible, imágenes remotas nuevas, **manchas orgánicas en el fondo** (forma cerrada con degradado: se leen como círculo y compiten con la retícula; vv29).

> **Trampa de clases, resuelta en vv29.** La tabla usa `.grid` para su estructura. Mientras el patrón del héroe se llamó igual, el navegador fusionó ambas reglas y la tabla heredaba `opacity` y `mask-image` (solo se veía la primera fila; ver `README.md` vv13). Las capas del fondo usan ahora nombre propio —`.rule` y `.ticks`, siempre prefijadas con `.bg`— así que el choque ya no es posible.