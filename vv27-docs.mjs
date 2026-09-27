import fs from 'node:fs';
const raiz = 'C:/Users/Usuario/Desktop/ranking games/';
const leer = f => fs.readFileSync(raiz + f, 'utf8');
let fail = 0;
const chk = (c, l, x) => { if (!c) fail++; console.log(`  ${c?'PASS':'FAIL'}  ${l}${x!==undefined?'  -> '+x:''}`); };

const rd = leer('README.md'), de = leer('DESIGN.md'), ag = leer('AGENTS.md');

console.log('### la cabecera del README ###');
chk(/^# RANKING/m.test(rd), 'el titulo sigue ahi');
chk(rd.includes('**Ultima actualizacion:**') || /Última actualización:\*\*\s*2026-09-27/.test(rd), 'fecha 2026-09-27');
chk(/Versión:\*\*\s*vv27/.test(rd), 'la cabecera dice vv27', (rd.match(/\*\*Versión:\*\*\s*\S+/)||['?'])[0]);
chk(/versión actual \(vv27\)/.test(rd), 'la linea de version actual dice vv27');

console.log('\n### §8: la entrada vv27, y que §8 sigue siendo newest-first ###');
const iV27 = rd.indexOf('**vv27 — 2026-09-27**');
const iV26 = rd.indexOf('**vv26 — 2026-09-26**');
const iV25 = rd.indexOf('**vv25 — 2026-09-26**');
chk(iV27 > 0, 'existe la entrada vv27 con em-dash y fecha', iV27);
chk(iV27 < iV26 && iV26 < iV25, 'y el registro va newest-first (vv27 antes que vv26 antes que vv25)',
  `vv27=${iV27} vv26=${iV26} vv25=${iV25}`);
const cuerpo = rd.slice(iV27, iV26);
chk(cuerpo.includes('0,7rem') || cuerpo.includes('0.7rem'), 'la entrada cita el aire de 0,7rem');
chk(cuerpo.includes('11,1875'), 'y la cifra medida de 11,1875 px');
chk(cuerpo.includes('15,1875'), 'y la prueba de movil a 15,1875 px');
chk(cuerpo.includes('2,89'), 'y la retractacion de la deriva de 2,89 px');
chk(cuerpo.includes('0,0019'), 'y el ruido de 0,0019 px entre lanzamientos');
chk(cuerpo.includes('9 juegos') || cuerpo.includes('de 8 a 9'), 'y la nota de que la hoja paso de 8 a 9 juegos');
console.log(`  (longitud de la entrada: ${cuerpo.length} caracteres)`);

console.log('\n### §9 ###');
chk(rd.includes('**Hecho en vv27:** ver §8'), 'la linea de vv27 esta en §9');
const iHecho27 = rd.indexOf('**Hecho en vv27:**'), iHecho26 = rd.indexOf('**Hecho en vv26:**');
chk(iHecho27 > iHecho26, 'y va despues de la de vv26 (mismo orden que §8)', `vv27=${iHecho27} vv26=${iHecho26}`);

console.log('\n### DESIGN.md ###');
chk(de.includes('segundo canal de separación'), '§3.3 dice que el aire es un segundo canal');
chk(de.includes('0,7rem de aire entre juegos'), 'y cita los 0,7rem');
chk(de.includes('hairline de 1 px entre filas'), 'y el pelo se conserva (no fue sustituido)');
chk(de.includes('un margen no pinta'), 'y deja claro que no puede ser pintura');

console.log('\n### AGENTS.md regla 4 ###');
chk(ag.includes('actual: `v=35`'), 'la v documentada es 35');
chk(!ag.includes('v=34'), 'no queda ninguna referencia a v=34');

console.log('\n### encoding: los 4 .md leidos como UTF-8 ###');
for (const f of ['README.md','DESIGN.md','AGENTS.md','PRODUCT.md']) {
  const t = leer(f);
  chk(!t.includes('\uFFFD'), `${f} sin U+FFFD`);
  chk(!/â€|Ã©|Ã³|Â/.test(t), `${f} sin mojibake de doble codificacion`);
}
console.log(`\n=== ${fail===0?'TODO VERDE':fail+' FAIL'} ===`);
process.exit(fail===0?0:1);
