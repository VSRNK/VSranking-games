# RANKING

Página web de una sola pantalla para consultar puntuaciones de videojuegos. Dos personas (Sele y Vande) puntúan cada juego de 0 a 10 en nueve categorías; la página muestra la tabla con ambas puntuaciones, la media por persona y colores semánticos.

**URL pública:** https://VSRNK.github.io/VSranking-games/

---

## Qué hace

- Busca juegos por nombre (ignora mayúsculas y tildes).
- Muestra dos filas por juego: Sele y Vande, con sus 9 categorías y la nota final.
- Filtra y ordena por categoría: clic en la cabecera → mayor → menor → desactivado. Máximo dos categorías activas simultáneas.
- Colores de la nota: **oro** (≥ 9), **verde** (≥ 5), **rojo** (< 5). Un 0,0 cuenta en la media; un guion (—) significa «sin puntuar».
- Sonidos sutiles (Web Audio): nota al pasar sobre el buscador, clic suave, tecla **M** para silenciar.
- Cursor propio en escritorio, tarjetas en móvil.
- Actualización en vivo: la página sondea la hoja de Google Sheets cada 10 segundos y se actualiza sola si hay cambios.

---

## Cómo ejecutar en local

### Con servidor (tiempo real + carátulas)
```bash
iniciar_ranking.bat
```
Arranca `node server.js` en `http://localhost:8080`, sincroniza con Google Sheets, descarga carátulas y abre el navegador.

### Solo estático (sin servidor)
Doble clic en `index.html`. Usa el snapshot `data.js` (sin sync ni carátulas nuevas).

---

## Estructura del proyecto

```
├── index.html       # Estructura de la página
├── styles.css       # Estilos (paleta, tipografías, grid, animaciones, cursor)
├── script.js        # Lógica cliente (búsqueda, ordenación, sondeo, sonidos, cursor)
├── parser.js        # Parser compartido Google Sheets CSV → datos (Node + navegador)
├── server.js        # Servidor Node (puerto 8080): sync Google Sheets, carátulas, snapshot
├── data.js          # Snapshot generado por server.js (fallback sin servidor)
├── covers/          # Carátulas descargadas (Steam / Wikipedia)
├── iniciar_ranking.bat  # Lanza servidor + navegador
├── DESIGN.md        # Contrato visual PHOSPHOR (tokens, reglas, tipografías)
├── AGENTS.md        # Guía operativa para agentes (arquitectura, reglas, verificación)
├── PRODUCT.md       # Verdad de producto en formato breve
```

---

## Datos

La fuente de verdad es una **hoja de Google Sheets** (pública para lectura). `server.js` la lee vía CSV, parsea con `parser.js`, descarga carátulas y genera `data.js`.

Formato de la hoja:
- Cabeceras: Juego, Historia, Jugabilidad, Originalidad, Niveles, Visual, Sonoridad, Dificultad, Extras, Personajes, Nota, Jugador
- Cada juego ocupa 2 filas (Sele arriba, Vande abajo).
- Vacío = «sin puntuar» (no cuenta en la media). 0 explícito = 0 (cuenta en la media).

---

## Despliegue (GitHub Pages)

El repositorio está configurado para GitHub Pages (branch `main`, root). Cualquier push a `main` actualiza la web en 1-2 minutos.

**Para añadir un juego:**
1. Edita la hoja de Google Sheets.
2. Ejecuta `iniciar_ranking.bat` en local (descarga la carátula).
3. Commit y push del archivo nuevo en `covers/`.
4. La web pública se actualiza sola.

---

## Reglas de edición (resumen)

1. **Conservar:** tabla 2×9 + Nota, sonidos, cursor, buscador, ordenación, tarjetas móvil.
2. **Animación:** solo `transform`/`opacity`, dentro de gates `prefers-reduced-motion`, `prefers-reduced-transparency`, `(hover:hover)`.
3. **Sin assets remotos nuevos**; fondos en CSS/SVG data-URI.
4. **Cache-bust:** al tocar `index.html`, `styles.css` o `script.js`, subir `?v=NN` en los tres enlaces (misma versión en los tres).
5. **No revertir:** `--gold` claro `#A67C00` / oscuro `#F2B93B`; vacíos → `null`, 0 → `0`; hoja y filas transparentes; hover por capas de opacidad.
6. **Verificar** desde `iniciar_ranking.bat` (puerto 8080).

---

## Changelog

### vv27b — 2026-09-27
- Aire simétrico entre juegos (`margin-bottom: 0.7rem` en `.game`).
- Cache-bust `v=37`.

### vv27 — 2026-09-27
- Aire entre juegos (`0.7rem` via `.game + .game { margin-top }`).
- Cache-bust `v=35`.

### vv26 — 2026-09-26
- Eliminada animación por letra del botón Google Sheet (rompía el espacio).
- Cache-bust `v=34`.

### vv25 — 2026-09-26
- Hover de fila: fuera relleno opaco, entra resplandor de 144 px desde la marca de fósforo.
- Cache-bust `v=33`.

### vv24 — 2026-09-26
- Stats: Top 1, Top 2 y Menos nota muestran solo el nombre (sin nota).
- Cache-bust `v=32`.

### vv23 — 2026-09-26
- Tabla sin fondo ni caja (`transparent`); la página scrollea.
- Cache-bust `v=31`.

### vv22 — 2026-09-26
- Tabla fuera de la caja; scroll de página en lugar de scroll interno.
- Cache-bust `v=30`.

### vv21 — 2026-09-26
- Limpieza de fondo (fuera monolito, entra retícula + regla).
- Fix: segundo filtro no ordenaba (cache por slug colisionaba).
- Cache-bust `v=29`.

### vv20 — 2026-09-25
- Limpieza repositorio, server.js robusto, cliente resiliente.
- Cache-bust `v=20`.

### vv16 — 2026-09-25 (versión raíz)
- Fix: máscara verde tapaba la tabla.
- Títulos en JetBrains Mono.
- Scroll interno blindado.
- Nota dorada visible.
- `.bat` robusto (guardián de puerto, no-cache, 2s delay).
- Tiempo real: sondeo 10s + diff SHA-1.
- Cache-bust `v=20`.

---

## Licencia

Uso personal. No hay licencia de código abierto.