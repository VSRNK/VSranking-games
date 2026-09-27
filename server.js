const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8080;
const BASE_DIR = __dirname;
const COVERS_DIR = path.join(BASE_DIR, 'covers');
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1c0RMIpkBoRhgdFwdL76WXYa5wXf_dSzQB1owI-w7CNk/export?format=csv';

if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ——— fetchURL con timeout y reintentos de redirección ———
function fetchURL(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ...headers
    };
    const req = https.get(url, { headers: defaultHeaders, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location, headers).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function downloadFile(url, destPath) {
  try {
    const buffer = await fetchURL(url);
    if (buffer && buffer.length > 1000) {
      fs.writeFileSync(destPath, buffer);
      return true;
    }
  } catch (err) {
    console.error(`[Cover Download Error] ${url}:`, err.message);
  }
  return false;
}

// ——— Descarga de carátulas con límite de concurrencia (p-limit estilo ligero) ———
const COVER_CONCURRENCY = 3;
let coverRunning = 0;
const coverQueue = [];

function runCoverQueue() {
  while (coverRunning < COVER_CONCURRENCY && coverQueue.length) {
    const { gameName, slug, resolve } = coverQueue.shift();
    coverRunning++;
    searchAndDownloadCoverInternal(gameName, slug).then(result => {
      coverRunning--;
      resolve(result);
      runCoverQueue();
    });
  }
}

function enqueueCover(gameName, slug) {
  return new Promise(resolve => {
    coverQueue.push({ gameName, slug, resolve });
    runCoverQueue();
  });
}

async function searchAndDownloadCoverInternal(gameName, slug) {
  const destPath = path.join(COVERS_DIR, `${slug}.jpg`);
  if (fs.existsSync(destPath)) {
    return `covers/${slug}.jpg`;
  }

  console.log(`[Auto-Cover] Buscando carátula para "${gameName}"...`);

  // 1. Probar Steam Store Search
  try {
    const steamSearchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=spanish&cc=ES`;
    const data = await fetchURL(steamSearchUrl);
    const json = JSON.parse(data.toString('utf-8'));
    if (json.items && json.items.length > 0) {
      const appId = json.items[0].id;
      const headerUrl = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
      const ok = await downloadFile(headerUrl, destPath);
      if (ok) {
        console.log(`[Auto-Cover] ✓ Descargada carátula de Steam para "${gameName}" (${appId})`);
        return `covers/${slug}.jpg`;
      }
    }
  } catch (err) {
    console.warn(`[Auto-Cover] Falló búsqueda en Steam:`, err.message);
  }

  // 2. Probar Wikipedia Search
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(gameName + ' video game')}&prop=pageimages&pithumbsize=600&format=json`;
    const data = await fetchURL(wikiUrl, { 'User-Agent': 'GameRankingBot/1.0' });
    const json = JSON.parse(data.toString('utf-8'));
    if (json.query && json.query.pages) {
      for (const pid of Object.keys(json.query.pages)) {
        const page = json.query.pages[pid];
        if (page.thumbnail && page.thumbnail.source) {
          const ok = await downloadFile(page.thumbnail.source, destPath);
          if (ok) {
            console.log(`[Auto-Cover] ✓ Descargada carátula de Wikipedia para "${gameName}"`);
            return `covers/${slug}.jpg`;
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[Auto-Cover] Falló búsqueda en Wikipedia:`, err.message);
  }

  console.warn(`[Auto-Cover] ✗ No se encontró imagen automática para "${gameName}"`);
  return null;
}

async function searchAndDownloadCover(gameName, slug) {
  return enqueueCover(gameName, slug);
}

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuote && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

// ——— syncGoogleSheets recibe el texto CSV ya descargado (evita doble fetch) ———
async function syncGoogleSheets(csvText) {
  const text = csvText;
  const lines = text.split(/\r?\n/);

  const hIdx = lines.findIndex(l => l.includes('Juego') && l.includes('Jugador'));
  if (hIdx === -1) {
    throw new Error('Formato de cabecera no válido en Google Sheets');
  }

  const headCols = parseCSVLine(lines[hIdx]);
  // Columnas 1 a 9 son las categorías
  const cats = headCols.slice(1, 10).map(c => c.replace(/^"|"$/g, '').trim());

  const rows = [];
  for (let i = hIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    rows.push(parseCSVLine(lines[i]));
  }

  const rawGames = [];
  for (let i = 0; i < rows.length; i += 2) {
    const r1 = rows[i];
    const r2 = rows[i + 1] || [];
    const name = (r1[0] || '').replace(/^"|"$/g, '').trim();
    if (!name) continue;

    const parseScores = (r) => {
      const vals = [];
      for (let c = 1; c <= 9; c++) {
        const raw = (r[c] || '').replace(/^"|"$/g, '').replace(',', '.').trim();
        if (!raw) {
          vals.push(null);           // casilla vacía → sin puntuar
        } else {
          const num = parseFloat(raw);
          vals.push(isNaN(num) ? null : num); // 0 explícito se queda como 0
        }
      }
      return vals.some(v => v !== null) ? vals : null;
    };

    const p1Name = (r1[11] || 'Sele').replace(/^"|"$/g, '').trim();
    const p2Name = (r2[11] || 'Vande').replace(/^"|"$/g, '').trim();

    rawGames.push({
      name,
      slug: toSlug(name),
      players: [
        { name: p1Name, scores: parseScores(r1) },
        { name: p2Name, scores: parseScores(r2) }
      ]
    });
  }

  // Buscar / verificar carátulas con límite de concurrencia
  const games = await Promise.all(rawGames.map(async (g) => {
    const cover = await searchAndDownloadCover(g.name, g.slug);
    return {
      name: g.name,
      cover: cover,
      players: g.players
    };
  }));

  // Guardar snapshot de respaldo en data.js
  const dataJsContent = `/*\n  Datos sincronizados con Google Sheets. Generado automáticamente por server.js\n*/\nconst CATS = ${JSON.stringify(cats, null, 2)};\nconst GAMES = ${JSON.stringify(games, null, 2)};\n`;
  fs.writeFileSync(path.join(BASE_DIR, 'data.js'), dataJsContent, 'utf-8');

  return { cats, games, updated: new Date().toISOString() };
}

// ——— Caché y sondeo para tiempo real ———
const CHECK_INTERVAL = 6000; // ms: máximo cada 6 s se vuelve a mirar la hoja
let gamesCache = null;       // { cats, games, updated, hash } del último sync
let lastSheetCheck = 0;
let syncInFlight = null;     // promesa en curso para deduplicar sincronizaciones concurrentes

async function fetchSheetCSV() {
  const buffer = await fetchURL(SHEET_CSV_URL);
  return buffer.toString('utf-8');
}

function serveGames(res, changed) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, must-revalidate'
  });
  if (!gamesCache) {
    res.end(JSON.stringify({ success: false, fallback: true, error: 'sin caché todavía' }));
    return;
  }
  const { cats, games, updated, hash } = gamesCache;
  res.end(JSON.stringify({ success: true, changed, games, cats, updated, hash }));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Endpoint API de sincronización con Google Sheets
  if (pathname === '/api/games') {
    try {
      const now = Date.now();
      // Sondeo de tiempo real: entre comprobaciones de la hoja, se responde desde
      // la caché al instante (el cliente pregunta cada ~10 s y apenas cuesta).
      if (gamesCache && now - lastSheetCheck < CHECK_INTERVAL) return serveGames(res, false);

      // Deduplicar: si ya hay una sync en curso, esperar su resultado
      if (syncInFlight) {
        try {
          await syncInFlight;
        } catch {}
        // After waiting, serve from cache
        return serveGames(res, false);
      }

      syncInFlight = (async () => {
        try {
          const text = await fetchSheetCSV();
          lastSheetCheck = Date.now();
          const hash = crypto.createHash('sha1').update(text).digest('hex');
          // La hoja no ha cambiado: misma respuesta, sin reiniciar data.js ni animaciones.
          if (gamesCache && gamesCache.hash === hash) return false;
          console.log(`[API /api/games] Cambios en Google Sheets: sincronizando...`);
          const payload = await syncGoogleSheets(text);
          gamesCache = { ...payload, hash };
          return true;
        } finally {
          syncInFlight = null;
        }
      })();

      const changed = await syncInFlight;
      return serveGames(res, changed);
    } catch (err) {
      console.error(`[API /api/games Error]`, err.message);
      if (gamesCache) return serveGames(res, false);
      // Fallback a data.js si no hay conexión a internet
      const dataJsPath = path.join(BASE_DIR, 'data.js');
      if (fs.existsSync(dataJsPath)) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, fallback: true, error: err.message }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    }
    return;
  }

  // Servidor de archivos estáticos
  let filePath = pathname === '/' ? path.join(BASE_DIR, 'index.html') : path.join(BASE_DIR, pathname);
  filePath = path.normalize(filePath);

  // Path traversal fix: BASE_DIR con separador final
  const baseWithSep = BASE_DIR + path.sep;
  if (!filePath.startsWith(baseWithSep) && filePath !== BASE_DIR) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-string';

    res.writeHead(200, {
      'Content-Type': contentType,
      // HTML/JS/CSS siempre sin caché: un CSS cacheado 1 h era la causa de que
      // los arreglos de styles.css no se vieran tras abrir el .bat.
      'Cache-Control': ext === '.html' || ext === '.js' || ext === '.css' ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

// ——— Error handler en listen para detectar puerto ocupado ———
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor de Ranking de Videojuegos Activo`);
  console.log(`📡 URL Local:        http://localhost:${PORT}`);
  console.log(`🔗 Google Sheets:    Conectado`);
  console.log(`🎨 Auto-carátulas:   Steam & Wikipedia activados`);
  console.log(`======================================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Puerto ${PORT} ocupado. ¿Hay otro server.js corriendo?`);
    console.error(`   Ejecuta:  taskkill /f /im node.exe\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Manejo de promesas no capturadas (red de seguridad)
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});