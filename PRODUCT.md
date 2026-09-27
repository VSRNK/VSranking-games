# PRODUCT.md — verdad de producto

> Registro de producto en formato breve, actualizado a **vv16** (2026-09-25). Lo consumen las herramientas de diseño (skill `impeccable`, con hooks en `.claude/` y `.codex/`) y los humanos.
> Narrativa completa y changelog: `README.md`. Reglas operativas para agentes: `AGENTS.md`. Contrato visual: `DESIGN.md`.

## Qué es

Página de una sola pantalla con una **tabla de clasificación** por videojuegos: cada juego tiene **2 filas** (Sele y Vande) × **9 categorías** (Historia, Jugabilidad, Originalidad, Niveles, Visual, Sonoridad, Dificultad, Extras, Personajes) + **Nota** (media de las nueve). Colores semánticos de la nota: **oro ≥ 9**, **fósforo ≥ 5**, **rojo < 5**. Los **ceros explícitos en la hoja cuentan como 0,0 y arrastran la media**; las casillas vacías o inválidas = «sin puntuar» (equivalen a casilla vacía; nunca arrastran la media).

## Público y escena

- **Sele y Vande** (las dos personas que puntúan): consulta breve y repetida — «¿cuánto le pusimos a X?». Oscuro dominante; móvil secundario.
- Resumen para compartir e inglés: `README.md` §1.

## Plataforma y stack

- **Plataforma:** web (escritorio primero, móvil como tarjeta).
- **Stack:** HTML + CSS + JS vanilla; servidor Node sin dependencias (`server.js`, puerto 8080) que sincroniza los datos desde **Google Sheets** (CSV), descarga carátulas a `covers/` y sirve la raíz con `no-cache`. Snapshot local `data.js` para el modo estático.
- **Arranque:** `iniciar_ranking.bat` → `http://localhost:8080` (guardia de puerto; abre el navegador 2 s después).

## Restricciones no negociables

1. **Conservar en la interfaz:** tabla líder con 2 filas/juego × 9 categorías + Nota; sonidos sintetizados (Web Audio, tecla M); cursor propio; buscador; ordenación; tarjetas móvil.
2. **Título «RANKING» oculto a propósito**; sin navegación entre páginas.
3. **Sin assets remotos nuevos**; fondos en CSS/SVG data-URI (única excepción: Google Fonts y el CSV de la hoja en línea).
4. **Animación solo `transform`/`opacity`**, dentro de las gates `prefers-reduced-motion`, `prefers-reduced-transparency` y `(hover:hover)`.
5. **Fuente de datos:** los datos viven en Google Sheets; `server.js` normaliza `0 → null` (no tocar). El `RAKING_GAMES.xlsx` de la raíz es solo respaldo histórico.
6. Cualquier cambio debe verse desde `iniciar_ranking.bat` (el servidor sirve la raíz; es donde el dueño mira).