---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

## Direction contract

- **SCOPE**: index.html (toda la superficie; página única).
- **MODE**: Operate.

**THESIS**: La hoja de puntuaciones como **panel de instrumentos brutalista-suizo monocromo con una única señal de fósforo**. Rechaza el dashboard genérico y el neón ciber: la entrada de datos es silencio en tinta; la señal (verde fósforo) solo aparece en lo que requiere atención (foco, estado activo, nota buena, hover).

**OWN-WORLD**: Tinta cercana al negro con soplo de oliva (`#0A0B09`) + superficie de cristal esmerilado (frosted glass: blur + borde translúcido + brillo interior superior). Un solo acento: **verde fósforo `#C6FF4A`**, con reglas de uso (3-4 puntos visibles, verde decorativo solo en hover/foco/activo, nunca filas enteras). Tipografía: **JetBrains Mono semibold** (títulos de juego y numerales, lectura de marcador), **Space Grotesk** (sans limpia, etiquetas y cabeceras). Texturas: film grain (estático, capa fija), estippling/halftone discreto, **retícula de registro vertical fina + regla de calibración**, ambas alineadas a la columna de contenido y con nombre de clase propio (`.rule`, `.ticks`; ya no chocan con el `.grid` de la tabla). **Sin manchas orgánicas en el fondo** —vv21 retiró el «monolito», que se leía como un círculo. Notas semánticas: oro/verde-fósforo/rojo.

**STORY**: El visitante entiende que es un archivo de puntuaciones de videojuegos; lee la jerarquía a golpe de vista (cristal = superficie de lectura, fósforo = señal), filtra y ordena. El acento exige atención solo cuando hay una acción que tomar.

**FIRST VIEWPORT**: Buscador en píldora de cristal a la derecha (decisión heredada), con punto de señal de fósforo; contador en mono. Debajo, la hoja **sin caja y sin fondo** (vv22: sin borde, ni radio, ni sombra; vv23: tampoco color de campo — la tabla deja ver el grano del fondo), con la rejilla de 1 px y la tabla creciendo hasta el final de la página: cabeceras en Space Grotesk pequeñas, celdas en JetBrains Mono, nombres de juego en JetBrains Mono semibold con máscara píldora de carátula. Lo que estructura la tabla son sus propias líneas (hairline entre filas, `border-bottom` de cabecera), no un panel. **Ninguna regla de estado pinta un campo sobre la hoja**: el hover de fila tampoco (vv25 retiró su relleno opaco; ahora es la marca de 1 px más una luz de 144 px que se desvanece). Fondo: grano + retícula de registro + regla de calibración, estáticos y discretos. Acción primaria: teclear para filtrar.

**FORM**: Código directo (code-led; sin generación de imagen en este entorno, sin página de decisión). La ambición vive en este contrato y en la interacción firma: **el fósforo como vocabulario de estado** — la hoja "respira" (lift + glow de 1 px) al ordenar, y las filas entran con ascenso + fundido + sharpen, todo transform/opacity.

**FINISH**: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
