/**
 * Genera las subpáginas HTML para cada juego en la carpeta juego/
 * Se ejecuta con: node generate-game-pages.js
 */

import fs from 'fs';
import path from 'path';

function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractGamesFromDataJs() {
  const content = fs.readFileSync('data.js', 'utf-8');
  
  // Buscar el array GAMES usando regex (window.GAMES o const GAMES)
  const gamesMatch = content.match(/window\.GAMES\s*=\s*(\[[\s\S]*?\]);/) || content.match(/const GAMES\s*=\s*(\[[\s\S]*?\]);/);
  if (!gamesMatch) {
    throw new Error('No se encontró el array GAMES en data.js');
  }
  
  // Evaluar el array de forma segura
  // Nota: esto funciona porque data.js es generado por nosotros
  const gamesArray = eval('(' + gamesMatch[1] + ')');
  return gamesArray;
}

function generateGamePage(game) {
  const slug = toSlug(game.name);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${game.name}</title>
<meta name="description" content="Detalle de ${game.name} - Puntuaciones de Sele y Vande">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#0A0B09" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#EDEFE6" media="(prefers-color-scheme: light)">
<link rel="icon" href="../data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230A0B09'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%23C6FF4A'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css?v=54">
</head>
<body class="game-page">
<a href="../index.html" class="back-btn">← Volver</a>
<h1 class="game-title">${escapeHtml(game.name)}</h1>
<script src="../data.js?v=54"></script>
<script type="module" src="../script.js?v=54"></script>
</body>
</html>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"")
    .replace(/'/g, "'");
}

function main() {
  const GAMES = extractGamesFromDataJs();
  
  if (!fs.existsSync('juego')) {
    fs.mkdirSync('juego');
  }

  let generated = 0;
  for (const game of GAMES) {
    if (!game.name) continue;
    const slug = toSlug(game.name);
    const filePath = path.join('juego', slug + '.html');
    const html = generateGamePage(game);
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log('Generado:', filePath);
    generated++;
  }

  console.log(`\nTotal: ${generated} subpáginas generadas en juego/`);
}

main();