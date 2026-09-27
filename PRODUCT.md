# PRODUCT.md — Verdad de producto

> Registro en formato breve. Narrativa completa y changelog: `README.md`. Reglas operativas: `AGENTS.md`. Contrato visual: `DESIGN.md`.

---

## Qué es

Página de una sola pantalla con tabla de clasificación por videojuegos. Cada juego: 2 filas (Sele, Vande) × 9 categorías (Historia, Jugabilidad, Originalidad, Niveles, Visual, Sonoridad, Dificultad, Extras, Personajes) + Nota (media). Colores semánticos: **oro ≥ 9**, **verde ≥ 5**, **rojo < 5**. Ceros explícitos = 0,0 (cuentan en la media); vacíos/inválidos = «sin puntuar» (no arrastran la media).

---

## Público y escena

- **Sele y Vande** (quienes puntúan): consulta breve y repetida — «¿cuánto le pusimos a X?». Oscuro dominante; móvil secundario.

---

## Plataforma y stack

- **Plataforma:** web (escritorio primero, móvil como tarjeta).
- **Stack:** HTML + CSS + JS vanilla; servidor Node sin dependencias (`server.js`, puerto 8080) que sincroniza desde Google Sheets (CSV), descarga carátulas a `covers/` y sirve la raíz con `no-cache`. Snapshot local `data.js` para modo estático.
- **Arranque:** `iniciar_ranking.bat` → `http://localhost:8080` (guardia de puerto; abre navegador 2 s después).

---

## Restricciones no negociables

1. **Conservar en la interfaz:** tabla líder 2 filas/juego × 9 categorías + Nota; sonidos sintetizados (Web Audio, tecla M); cursor propio; buscador; ordenación; tarjetas móvil.
2. **Título «RANKING» oculto a propósito**; sin navegación entre páginas.
3. **Sin assets remotos nuevos**; fondos en CSS/SVG data-URI (excepción: Google Fonts y CSV de la hoja).
4. **Animación solo `transform`/`opacity`**, dentro de gates `prefers-reduced-motion`, `prefers-reduced-transparency`, `(hover:hover)`.
5. **Fuente de datos:** datos en Google Sheets; `server.js` normaliza `0 → null` (no tocar). `RAKING_GAMES.xlsx` en raíz = solo respaldo histórico.
6. Cualquier cambio debe verse desde `iniciar_ranking.bat`.