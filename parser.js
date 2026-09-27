/**
 * Parser compartido Google Sheets → datos de la app.
 * Usado tanto por server.js (Node) como por script.js (navegador).
 * Contrato: vacío → null, 0 explícito → 0.
 */

export function parseCSVLine(text) {
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

export function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseScores(row) {
  const vals = [];
  for (let c = 1; c <= 9; c++) {
    const raw = (row[c] || '').replace(/^"|"$/g, '').replace(',', '.').trim();
    if (!raw) {
      vals.push(null);           // casilla vacía → sin puntuar
    } else {
      const num = parseFloat(raw);
      vals.push(isNaN(num) ? null : num); // 0 explícito se queda como 0
    }
  }
  return vals.some(v => v !== null) ? vals : null;
}

export function parseGoogleSheetsCSV(csvText) {
  const lines = csvText.split(/\r?\n/);

  const hIdx = lines.findIndex(l => l.includes('Juego') && l.includes('Jugador'));
  if (hIdx === -1) {
    throw new Error('Formato de cabecera no válido en Google Sheets');
  }

  const headCols = parseCSVLine(lines[hIdx]);
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

  return { cats, rawGames };
}