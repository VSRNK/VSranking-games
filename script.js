import { parseGoogleSheetsCSV } from './parser.js';

const $q = document.getElementById('q');
const $results = document.getElementById('results');
const $count = document.getElementById('count');
const $sheetLink = document.querySelector('.sheet-link');
const $stats = document.getElementById('stats');

// URL del CSV de Google Sheets (gviz endpoint)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1c0RMIpkBoRhgdFwdL76WXYa5wXf_dSzQB1owI-w7CNk/export?format=csv';

// Búsqueda compartida: el ?q= de la URL se captura al inicio (un render inicial lo reemplazaría)
const urlQ = new URLSearchParams(location.search).get('q') || '';

const fmt = (n, d) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = s => s.replace(/[&<>\"]/g, c => ({'&':'\u0026\u0061\u006D\u0070\u003B','<':'\u0026\u006C\u0074\u003B','>':'\u0026\u0067\u0074\u003B','"':'\u0026\u0071\u0075\u006F\u0074\u003B',"'":"\u0026\u0023\u0033\u0039\u003B" }[c]));
const strip = s => Array.from(s).map(ch => ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()).join('');

function average(scores) {
  if (!scores) return null;
  const v = scores.filter(x => x !== null && x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

const highlight = name => esc(name);

const cell = (v, cat) => (v === null || v === undefined)
  ? '<div class="c dash" role="cell" data-cat="' + esc(cat) + '">—</div>'
  : '<div class="c" role="cell" data-cat="' + esc(cat) + '">' + fmt(v, 1) + '</div>';

const notaCell = n => n === null
  ? '<div class="c nota dash" role="cell">—</div>'
  : '<div class="c nota ' + notaClass(n) + '" role="cell" data-v="' + n + '"><span class="np">' + fmt(n, 2) + '</span></div>';

// 9 o más: oro · 5 o más: verde · menos de 5: rojo
function notaClass(n) {
  const r = Math.round(n * 100) / 100;
  return r >= 9 ? 'gold' : r >= 5 ? 'good' : 'bad';
}

let currentCats = typeof CATS !== 'undefined' ? CATS : [];
let baseGames = typeof GAMES !== 'undefined' ? GAMES.slice() : [];
let currentGames = baseGames.slice();
const filters = []; // [{ col: number(0..8) | "nota", dir: "desc" | "asc" }]

// Nombres normalizados para ordenar y buscar, memorizados POR OBJETO.
// Antes se cacheaban por `g.slug`, pero la API de server.js no envía `slug`
// (se descarta al serializar): todas las claves quedaban en `undefined`,
// colisionaban y `getGameScore` devolvía el mismo valor para todos los juegos
// (el 2º filtro no ordenaba nada). Un WeakMap por objeto no puede colisionar.
const nameStripCache = new WeakMap();
function stripName(g) {
  let s = nameStripCache.get(g);
  if (s === undefined) {
    s = strip(g.name);
    nameStripCache.set(g, s);
  }
  return s;
}

// ——— Estadísticas rápidas ———
function computeStats(games) {
  if (!games.length) return null;
  // Promedio global (media de notas de todos los jugadores de todos los juegos)
  let totalScore = 0, totalCount = 0;
  let topGame = null, topScore = -1;
  let top2Game = null, top2Score = -1;
  let bottomGame = null, bottomScore = 11; // nota máxima es 10

  for (const g of games) {
    const playerAverages = g.players.map(p => average(p.scores)).filter(v => v !== null);
    if (!playerAverages.length) continue;
    const gameAvg = playerAverages.reduce((a, b) => a + b, 0) / playerAverages.length;
    totalScore += gameAvg * playerAverages.length;
    totalCount += playerAverages.length;

    if (gameAvg > topScore) {
      top2Score = topScore; top2Game = topGame;
      topScore = gameAvg; topGame = g;
    } else if (gameAvg > top2Score) {
      top2Score = gameAvg; top2Game = g;
    }

    if (gameAvg < bottomScore) {
      bottomScore = gameAvg; bottomGame = g;
    }
  }

  const globalAvg = totalCount ? totalScore / totalCount : null;
  return {
    globalAvg,
    topGame: topGame ? { name: topGame.name, score: topScore } : null,
    top2Game: top2Game ? { name: top2Game.name, score: top2Score } : null,
    bottomGame: bottomGame ? { name: bottomGame.name, score: bottomScore } : null
  };
}

function renderStats(games) {
  if (!$stats) return;
  const stats = computeStats(games);
  if (!stats) { $stats.innerHTML = ''; return; }

  const fmt2 = n => n === null ? '—' : fmt(n, 2);

  $stats.innerHTML = `
    <div class="stat">
      <span class="stat-label">Promedio global</span>
      <span class="stat-value green">${fmt2(stats.globalAvg)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Top 1</span>
      <span class="stat-value green">${esc(stats.topGame?.name || '—')}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Top 2</span>
      <span class="stat-value green">${esc(stats.top2Game?.name || '—')}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Menos nota</span>
      <span class="stat-value green">${esc(stats.bottomGame?.name || '—')}</span>
    </div>
  `;
}

function getGameScore(g, col) {
  if (col === 'nota') {
    const pAvg = g.players.map(p => average(p.scores)).filter(v => v !== null);
    return pAvg.length ? pAvg.reduce((a, b) => a + b, 0) / pAvg.length : null;
  }
  const idx = typeof col === 'number' ? col : parseInt(col, 10);
  if (!(idx >= 0)) return null;
  // Lectura directa: p.scores[idx] ya es O(1). Los 0 explícitos cuentan;
  // solo null/undefined (casilla vacía) se descartan.
  const vals = [];
  for (const p of g.players) {
    if (!p.scores) continue;
    const v = p.scores[idx];
    if (v !== null && v !== undefined) vals.push(v);
  }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function filteredGames() {
  if (!filters.length) return baseGames.slice();
  const list = baseGames.filter(g => filters.every(f => getGameScore(g, f.col) !== null));
  const metric = g => filters.reduce((s, f) => {
    const v = getGameScore(g, f.col);
    return s + (f.dir === 'desc' ? v : -v);
  }, 0);
  list.sort((a, b) => {
    const diff = metric(b) - metric(a);
    if (diff !== 0) return diff;
    const an = stripName(a);
    const bn = stripName(b);
    return an < bn ? -1 : an > bn ? 1 : 0;
  });
  return list;
}

function gameHTML(g, q) {
  const coverStyle = g.cover ? ' style="background-image: url(\'' + esc(g.cover) + '\')"' : '';
  const thumb = g.cover
    ? '<img class="cover-thumb" src="' + esc(g.cover) + '" alt="" loading="lazy" decoding="async" aria-hidden="true">'
    : '';
  const rows = g.players.map((p, i) =>
    '<div class="row' + (i ? ' second' : '') + '" role="row">' +
      (i === 0 ? '<div class="name" role="rowheader">' +
        '<div class="name-bg"' + coverStyle + ' aria-hidden="true"></div>' +
        thumb +
        '<span class="name-text">' + highlight(g.name, q) + '</span>' +
      '</div>' : '') +
      '<div class="player" role="cell">' + esc(p.name) + '</div>' +
      currentCats.map((c, j) => cell(p.scores ? p.scores[j] : null, c)).join('') +
      notaCell(average(p.scores)) +
    '</div>'
  ).join('');
  return '<div class="game" role="rowgroup">' + rows + '</div>';
}

function tableHTML(list, q) {
  const catHeaders = currentCats.map((c, i) => {
    const f = filters.find(f => f.col === String(i));
    const isColActive = !!f;
    const icon = isColActive ? (f.dir === 'desc' ? '<span class="sort-icon">▼</span>' : '<span class="sort-icon">▲</span>') : '';
    const dirAttr = isColActive ? ' data-dir="' + f.dir + '"' : '';
    return '<button class="col-sort' + (isColActive ? ' active' : '') + '" data-col="' + i + '"' + dirAttr + ' role="columnheader" title="' + esc(c) + ': clic para filtrar">' + esc(c) + (icon ? ' ' + icon : '') + '</button>';
  }).join('');

  const notaF = filters.find(f => f.col === 'nota');
  const isNotaActive = !!notaF;
  const notaIcon = isNotaActive ? (notaF.dir === 'desc' ? '<span class="sort-icon">▼</span>' : '<span class="sort-icon">▲</span>') : '';
  const notaDirAttr = isNotaActive ? ' data-dir="' + notaF.dir + '"' : '';
  const notaHeader = '<button class="col-sort' + (isNotaActive ? ' active' : '') + '" data-col="nota"' + notaDirAttr + ' role="columnheader" title="Nota media: clic para filtrar">Nota' + (notaIcon ? ' ' + notaIcon : '') + '</button>';

  return '<div class="grid" role="table" aria-label="Ranking de juegos">' +
    '<div class="head" role="row"><div role="columnheader">Juego</div>' +
    '<div role="columnheader"><span class="sr-only">Jugador</span></div>' +
    catHeaders +
    notaHeader +
    '</div>' +
    list.map(g => gameHTML(g, q)).join('') +
    '</div>';
}

const $sheet = document.getElementById('sheet');
const $none = document.getElementById('none');
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

let ROWS = [];
let NAMES = [];

function buildTable(list, cats) {
  if (cats) currentCats = cats;
  if (list) currentGames = list;
  $sheet.innerHTML = tableHTML(currentGames);
  ROWS = Array.from($sheet.querySelectorAll('.game'));
  NAMES = currentGames.map(g => strip(g.name));

  ROWS.forEach(r => {
    r.hidden = true;
    r.classList.add('out');
    r.addEventListener('transitionend', e => {
      if (e.target === r && e.propertyName === 'opacity' && r.classList.contains('out')) finishHide(r);
    });
  });

  // Click en carátula (pequeña o grande) → navega a subpágina del juego
  function goToGame(idx) {
    const game = currentGames[idx];
    if (!game) return;
    const slug = game.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    window.location.href = 'juego/' + slug + '.html';
  }

  // Carátula pequeña (thumbnail)
  const thumbs = $sheet.querySelectorAll('.cover-thumb');
  thumbs.forEach((thumb, idx) => {
    thumb.style.cursor = 'pointer';
    thumb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToGame(idx);
    });
  });

  // Nombre del juego (carátula grande de fondo)
  const names = $sheet.querySelectorAll('.name');
  names.forEach((nameEl, idx) => {
    nameEl.style.cursor = 'pointer';
    nameEl.addEventListener('click', (e) => {
      // No navegar si el click fue en un enlace o botón dentro
      if (e.target.closest('a, button')) return;
      e.preventDefault();
      e.stopPropagation();
      goToGame(idx);
    });
  });

  setupRovingTabindex();
  render();
}

// ——— Navegación por teclado en la tabla (roving tabindex) ———
let focusedRowIndex = -1;
let focusedCellIndex = -1;

function getVisibleRows() {
  return ROWS.filter(r => !r.hidden && !r.classList.contains('out'));
}

function getFocusableCells(row) {
  // Celdas visibles en la primera fila del jugador (Sele)
  const firstRow = row.querySelector('.row:not(.second)');
  if (!firstRow) return [];
  return Array.from(firstRow.querySelectorAll('[role="cell"], [role="rowheader"]'))
    .filter(c => !c.hidden && c.offsetParent !== null);
}

function setupRovingTabindex() {
  const visibleRows = getVisibleRows();
  visibleRows.forEach((r, i) => {
    const cells = getFocusableCells(r);
    cells.forEach((c, j) => {
      c.tabIndex = (i === 0 && j === 0) ? 0 : -1;
    });
  });
  focusedRowIndex = -1;
  focusedCellIndex = -1;
}

function focusCell(rowIdx, cellIdx) {
  const visibleRows = getVisibleRows();
  if (rowIdx < 0 || rowIdx >= visibleRows.length) return;
  const cells = getFocusableCells(visibleRows[rowIdx]);
  if (cellIdx < 0 || cellIdx >= cells.length) return;
  cells.forEach(c => c.tabIndex = -1);
  cells[cellIdx].tabIndex = 0;
  cells[cellIdx].focus({ preventScroll: true });
  focusedRowIndex = rowIdx;
  focusedCellIndex = cellIdx;
}

function handleTableKeydown(e) {
  const visibleRows = getVisibleRows();
  if (!visibleRows.length) return;

  // Si el foco está en un botón de cabecera, dejar que el navegador maneje Tab/Enter
  const active = document.activeElement;
  const isHeaderBtn = active && active.closest && active.closest('button.col-sort');
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (isHeaderBtn) {
        // Desde cabecera, ir a primera fila
        focusCell(0, 0);
      } else if (focusedRowIndex >= 0) {
        focusCell(Math.min(focusedRowIndex + 1, visibleRows.length - 1), focusedCellIndex);
      } else {
        focusCell(0, 0);
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (focusedRowIndex > 0) {
        focusCell(focusedRowIndex - 1, focusedCellIndex);
      } else if (focusedRowIndex === 0) {
        // Subir a la cabecera - enfocar primer botón de ordenación
        const firstHeaderBtn = $sheet.querySelector('button.col-sort');
        if (firstHeaderBtn) firstHeaderBtn.focus();
        focusedRowIndex = -1;
        focusedCellIndex = -1;
      }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (focusedRowIndex >= 0) {
        const cells = getFocusableCells(visibleRows[focusedRowIndex]);
        focusCell(focusedRowIndex, Math.min(focusedCellIndex + 1, cells.length - 1));
      }
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (focusedRowIndex >= 0) {
        const cells = getFocusableCells(visibleRows[focusedRowIndex]);
        focusCell(focusedRowIndex, Math.max(focusedCellIndex - 1, 0));
      }
      break;
    case 'Home':
      e.preventDefault();
      if (focusedRowIndex >= 0) focusCell(focusedRowIndex, 0);
      break;
    case 'End':
      e.preventDefault();
      if (focusedRowIndex >= 0) {
        const cells = getFocusableCells(visibleRows[focusedRowIndex]);
        focusCell(focusedRowIndex, cells.length - 1);
      }
      break;
    case 'Enter':
    case ' ':
      if (isHeaderBtn) {
        e.preventDefault();
        active.click();
      }
      break;
    case 'Escape':
      // Salir de la tabla al buscador
      $q.focus();
      focusedRowIndex = -1;
      focusedCellIndex = -1;
      break;
  }
}

// Actualizar roving tabindex cuando cambian las filas visibles (en render)
const originalRender = render;
render = function() {
  originalRender.apply(this, arguments);
  setupRovingTabindex();
};

$sheet.addEventListener('keydown', handleTableKeydown);

$sheet.addEventListener('click', e => {
  const btn = e.target.closest('button.col-sort');
  if (!btn) return;
  const col = btn.dataset.col;

  // Ciclo de cada cabecera: 1er clic más nota arriba (▼) → 2º el que menos (▲) → 3º se quita.
  // Máximo 2 categorías a la vez: si ya hay 2 y se elige otra, se libera la más antigua.
  const i = filters.findIndex(f => f.col === col);
  if (i === -1) {
    if (filters.length >= 2) filters.shift();
    filters.push({ col, dir: 'desc' });
  } else if (filters[i].dir === 'desc') {
    filters[i].dir = 'asc';
  } else {
    filters.splice(i, 1);
  }

  currentGames = filteredGames();
  buildTable(currentGames, currentCats);
});

buildTable(currentGames, currentCats);
function finishHide(r) {
  clearTimeout(r._t);
  r.hidden = true;
  settleNotas(r);
}

// La nota final sube de 0 hasta su valor cuando el juego aparece
function countUp(el, delay) {
  const v = parseFloat(el.dataset.v);
  const dur = 600;
  const t0 = performance.now() + delay;
  const token = el._count = {};
  const out = el.querySelector('.np') || el;
  if (!reduceMotion) { out.classList.remove('pop'); void out.offsetWidth; }
  out.textContent = fmt(0, 2);
  (function tick(now) {
    if (el._count !== token) return;
    const t = Math.min(1, Math.max(0, (now - t0) / dur));
    out.textContent = fmt(v * (1 - Math.pow(1 - t, 3)), 2);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else if (!reduceMotion) {
      out.classList.add('pop');
    }
  })(performance.now());
}
function settleNotas(r) {
  r.querySelectorAll('.nota[data-v]').forEach(el => {
    el._count = null;
    (el.querySelector('.np') || el).textContent = fmt(parseFloat(el.dataset.v), 2);
  });
}

function showRow(r, delay) {
  clearTimeout(r._t);
  if (r.hidden) {                       // aparece de nuevo: parte de invisible y cuenta las notas
    r.hidden = false;
    r.classList.add('out');
    void r.offsetWidth;                 // fija el estado inicial antes de animar
    if (!reduceMotion) {
      r.querySelectorAll('.nota[data-v]').forEach((el, i) => countUp(el, delay + 120 + i * 80));
    }
  }
  r.style.setProperty('--d', (reduceMotion ? 0 : delay) + 'ms');
  r.classList.remove('out');
}
function hideRow(r) {
  r.style.setProperty('--d', '0ms');
  r.classList.add('out');
  // por si la pestaña está en segundo plano y la transición no llega a ejecutarse
  clearTimeout(r._t);
  r._t = setTimeout(() => { if (r.classList.contains('out')) finishHide(r); }, 350);
}

function render() {
  const raw = $q.value.trim();
  const q = strip(raw);

  // URL compartible: mantiene la búsqueda en ?q= para poder pasar el enlace
  const params = new URLSearchParams();
  if (raw) params.set('q', raw);
  const qs = params.toString();
  // Guardar replaceState para después de verificar que history existe
  try {
    history.replaceState(null, '', qs ? location.pathname + '?' + qs : location.pathname);
  } catch (e) {
    // ignore en contextos sin history (p.ej. file://)
  }

  const match = NAMES.map(n => !q || n.includes(q));
  const total = match.filter(Boolean).length;

  $count.textContent = q
    ? total + ' de ' + currentGames.length
    : filters.length
      ? currentGames.length + ' de ' + baseGames.length + ' juegos'
      : currentGames.length + (currentGames.length === 1 ? ' juego' : ' juegos');

  if (!total) {
    ROWS.forEach(r => { r.classList.add('out'); finishHide(r); });
    $sheet.hidden = true;
    $none.textContent = 'Ningún juego coincide con «' + raw + '».';
    $none.hidden = false;
    renderStats([]); // vacía stats
    return;
  }
  $none.hidden = true;
  $sheet.hidden = false;

  const leaving = ROWS.filter((r, i) => !match[i] && !r.hidden && !r.classList.contains('out'));
  leaving.forEach(hideRow);

  const base = leaving.length && !reduceMotion ? 110 : 0;
  let k = 0;
  ROWS.forEach((r, i) => {
    if (match[i] && (r.hidden || r.classList.contains('out'))) {
      showRow(r, base + Math.min(k++, 6) * 40);
    }
  });

  renderStats(currentGames);
}

// Texto de ayuda: "Buscar juego" y, despacio, los nombres de los juegos
const $ph = document.getElementById('ph');
let hints = ['Buscar juego'].concat(currentGames.map(g => g.name));
// Eliminado: `still` duplicado (ya existe `reduceMotion` arriba)
let hint = 0;
function nextHint() {
  if (document.hidden) return;
  $ph.classList.add('out');
  setTimeout(() => {
    hint = (hint + 1) % hints.length;
    $ph.textContent = hints[hint];
    $ph.style.transition = 'none';
    $ph.classList.remove('out');
    $ph.classList.add('pre');
    void $ph.offsetWidth;
    $ph.style.transition = '';
    $ph.classList.remove('pre');
  }, 400);
}
if (!reduceMotion && hints.length > 1) setInterval(nextHint, 3600);

$q.addEventListener('input', render);
$q.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $q.value) { $q.value = ''; render(); }
});
// Atajo /: enfoca el buscador (salvo que ya se esté escribiendo en un campo)
document.addEventListener('keydown', e => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  const a = document.activeElement;
  if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return;
  e.preventDefault();
  $q.focus();
});
// Búsqueda compartida: si la URL trae ?q=, se aplica al cargar
if (urlQ) { $q.value = urlQ; render(); }
render();
if (window.matchMedia && matchMedia('(pointer: fine)').matches) $q.focus();

// Sincronización en tiempo real con Google Sheets (gviz CSV directo).
// La página pregunta cada 10 s; solo re-renderiza cuando la hoja cambió de verdad (hash diff).
const $syncText = document.getElementById('sync-text');
let lastHash = null;
let pollStarted = false;
const nowTime = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

let flashTimer = 0;
function flashSheet() {
  if (reduceMotion) return;
  const s = document.getElementById('sheet');
  if (!s) return;
  s.classList.remove('live');
  void s.offsetWidth;
  s.classList.add('live');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { s.classList.remove('live'); }, 1300);
}

function syncText(msg, live) {
  if (!$syncText) return;
  $syncText.textContent = msg;
  const line = $syncText.closest('.sync-line');
  if (line) {
    line.classList.toggle('on', !!msg);
    line.classList.toggle('live', !!live);
  }
}

function applyData(games, cats, hash) {
  baseGames = games.slice();
  currentCats = cats;
  currentGames = filteredGames();
  buildTable(currentGames, currentCats);
  hints = ['Buscar juego'].concat(games.map(g => g.name));
  syncText('En vivo · ' + games.length + ' juegos · ' + nowTime(), true);
  flashSheet();
  renderStats(currentGames);
  lastHash = hash;
}

async function syncWithSheet() {
  if (document.hidden) return;
  try {
    syncText('Conectando…');
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const csvText = await res.text();
    const hash = await sha1(csvText);
    if (lastHash && hash === lastHash) {
      syncText('En vivo · ' + baseGames.length + ' juegos · ' + nowTime(), true);
      return;
    }
    const { cats, rawGames } = parseGoogleSheetsCSV(csvText);
    // Preservar carátulas existentes (de data.js o sync previo)
    const coverMap = new Map(baseGames.map(g => [g.name, g.cover]));
    const games = rawGames.map(g => ({
      name: g.name,
      cover: coverMap.get(g.name) || null,
      players: g.players
    }));
    applyData(games, cats, hash);
  } catch (err) {
    console.warn('Sync fallback to local cache:', err);
    syncText('Caché local (' + currentGames.length + ' juegos)');
  }
  // Start polling AFTER the first attempt (success or failure), not inside try
  if (!pollStarted) {
    pollStarted = true;
    setInterval(syncWithSheet, 10000);
  }
}

// SHA-1 para hash del CSV (Web Crypto API)
async function sha1(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

syncWithSheet();

/* ——— Cursor propio y sonidos suaves ——— */
(function () {
  const root = document.documentElement;
  const calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const finePointer = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);

  /* Sonido: Web Audio sintetizado. Tecla M para silenciar. */
  let ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem('ranking-muted') === '1'; } catch (e) {}

  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 4000; lp.Q.value = 0.5;
    master.connect(lp); lp.connect(ctx.destination);
    return ctx;
  }

  function tone(freq, o) {
    const c = audio();
    if (!c || muted || c.state !== 'running') return;
    o = o || {};
    const dur = o.dur || 0.12, gain = o.gain || 0.04, attack = o.attack || 0.004;
    const t = c.currentTime + (o.when || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + dur * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  // Hover: nota breve y suave, pentatónica mayor
  const PENTA = [659.25, 783.99, 880.00, 987.77, 1174.66];
  let lastNote = -1;
  function hoverSound(when) {
    let i; do { i = Math.floor(Math.random() * PENTA.length); } while (i === lastNote);
    lastNote = i;
    tone(PENTA[i], { dur: 0.08, gain: 0.03, attack: 0.002, when: when });
  }

  // Click: "pop" suave y redondo, dos tonos cercanos
  function clickSound(when) {
    const w = when || 0;
    tone(880.00, { dur: 0.1, gain: 0.05, attack: 0.003, when: w });
    tone(1108.73, { dur: 0.14, gain: 0.035, attack: 0.003, when: w + 0.02 });
    tone(220.00, { dur: 0.05, gain: 0.025, glide: 160, when: w });
  }
  // TEST_HOOK eliminado (código muerto)

  function unlock() { const c = audio(); if (c && c.state === 'suspended') c.resume(); }

  const $toast = document.getElementById('toast');
  let toastTimer = 0;
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 1600);
  }

  addEventListener('keydown', e => {
    unlock();
    if (!e.key || e.key.toLowerCase() !== 'm' || e.ctrlKey || e.metaKey || e.altKey) return;
    const a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return;
    muted = !muted;
    try { localStorage.setItem('ranking-muted', muted ? '1' : '0'); } catch (err) {}
    toast(muted ? 'Sonido desactivado · M' : 'Sonido activado · M');
    if (!muted) clickSound();
  });

  function ripple(x, y) {
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = x + 'px'; r.style.top = y + 'px';
    document.body.appendChild(r);
    const done = () => r.remove();
    r.addEventListener('animationend', done);
    setTimeout(done, 800);
  }

  function playClick() {
    const c = audio();
    if (c && c.state !== 'running') c.resume().then(() => clickSound()).catch(() => {});
    else clickSound();
  }
  let lastType = 'mouse';
  addEventListener('pointerdown', e => {
    lastType = e.pointerType;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    root.classList.add('cur-down');
    if (e.pointerType === 'mouse') {
      if (finePointer && !calm) ripple(e.clientX, e.clientY);
      playClick();                       // ratón: al pulsar, para que responda al instante
    }
  }, { passive: true });
  // táctil: solo cuando es un toque de verdad (un desplazamiento no genera "click")
  addEventListener('click', () => { if (lastType !== 'mouse') playClick(); });
  const release = () => root.classList.remove('cur-down');
  addEventListener('pointerup', release, { passive: true });
  addEventListener('pointercancel', release, { passive: true });
  addEventListener('blur', release);

  // Hover sound también en botón Google Sheet (listener directo, más fiable)
  if ($sheetLink) {
    $sheetLink.addEventListener('mouseenter', () => {
      hoverSound();
    }, { passive: true });
  }

  // Estado del cursor según lo que hay debajo; el sonido de hover es solo para el buscador
  let lastField = null;
  addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const t = e.target && e.target.closest ? e.target : null;
    const field = t && t.closest('.field');
    const game = !field && t && t.closest('.game');
    root.classList.toggle('cur-text', !!field);
    root.classList.toggle('cur-hover', !!game);
    if (field && field !== lastField) hoverSound();
    lastField = field;
  }, { passive: true });

  if (!finePointer) return;
  root.classList.add('has-cur');
  const dot = document.getElementById('cd'), ring = document.getElementById('cr');
  let x = 0, y = 0, rx = 0, ry = 0, seen = false, raf = 0;
  let last = 0;
  function frame(now) {
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    const k = calm ? 1 : 1 - Math.exp(-dt / 60);   // suavizado por tiempo, igual a 60 o 144 Hz
    rx += (x - rx) * k; ry += (y - ry) * k;
    ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) raf = requestAnimationFrame(frame);
    else { raf = 0; last = 0; }
  }
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    if (!seen) { seen = true; rx = x; ry = y; dot.classList.add('on'); ring.classList.add('on'); }
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  root.addEventListener('mouseleave', () => { dot.classList.remove('on'); ring.classList.remove('on'); });
  root.addEventListener('mouseenter', () => { if (seen) { dot.classList.add('on'); ring.classList.add('on'); } });
})();