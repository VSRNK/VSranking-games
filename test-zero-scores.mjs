/**
 * Regression test: explicit zeros must be retained and counted in averages,
 * while empty/invalid cells become null and are excluded.
 * Run with: node test-zero-scores.mjs
 * 
 * This test extracts and evaluates the actual `parseScores` function from server.js
 * to ensure we're testing the real production code, not a duplicate.
 */

import fs from 'fs';
import path from 'path';

// Extract parseScores from server.js by evaluating the relevant code section
const serverCode = fs.readFileSync(path.join(process.cwd(), 'server.js'), 'utf-8');

// Find the parseScores function definition in server.js - more precise regex
const parseScoresMatch = serverCode.match(/const parseScores = \(r\) => \{[\s\S]*?return vals\.some\(v => v !== null\) \? vals : null;\s*\}/);
if (!parseScoresMatch) {
  console.error('✗ Could not extract parseScores from server.js');
  process.exit(1);
}

const fnSource = parseScoresMatch[0];
console.log('Extracted function source:');
console.log(fnSource.substring(0, 100) + '...\n');

// Create the function by evaluating it in a clean context
const parseScores = new Function('return ' + fnSource.replace('const parseScores = ', ''))();

console.log('Testing parseScores extracted from server.js\n');

// Test cases
const tests = [
  {
    name: "explicit zeros retained",
    row: {1:"10",2:"0",3:"8",4:"",5:"7",6:"",7:"9",8:"0",9:"6"},
    expect: [10, 0, 8, null, 7, null, 9, 0, 6],
  },
  {
    name: "empty strings become null (returns null for all-null row)",
    row: {1:"",2:"",3:"",4:"",5:"",6:"",7:"",8:"",9:""},
    expect: null,
  },
  {
    name: "invalid values become null (returns null for all-null row)",
    row: {1:"abc",2:"x",3:"",4:"",5:"",6:"",7:"",8:"",9:""},
    expect: null,
  },
  {
    name: "mixed zeros and empties",
    row: {1:"0",2:"",3:"5",4:"",5:"0",6:"",7:"0",8:"",9:"0"},
    expect: [0, null, 5, null, 0, null, 0, null, 0],
  },
  {
    name: "comma decimal separator handled",
    row: {1:"7,5",2:"0",3:"",4:"",5:"",6:"",7:"",8:"",9:""},
    expect: [7.5, 0, null, null, null, null, null, null, null],
  },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const out = parseScores(t.row);
  const ok = JSON.stringify(out) === JSON.stringify(t.expect);
  if (ok) {
    console.log(`✓ ${t.name}`);
    passed++;
  } else {
    console.log(`✗ ${t.name}`);
    console.log(`  Expected: ${JSON.stringify(t.expect)}`);
    console.log(`  Got:      ${JSON.stringify(out)}`);
    failed++;
  }
}

// average() test (from script.js logic, kept here for integration check)
const average = (scores) => {
  if (!scores || scores.length === 0) return null;
  const valid = scores.filter(v => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

const avgTests = [
  { name: "average excludes null", scores: [10, null, 8, 0, 6], expect: 6 },
  { name: "average includes explicit zero", scores: [10, 0, 8, 6], expect: 6 },
  { name: "all null returns null", scores: [null, null, null], expect: null },
];

console.log('\n--- average() integration tests ---');

for (const t of avgTests) {
  const out = average(t.scores);
  const ok = out === t.expect;
  if (ok) {
    console.log(`✓ average: ${t.name}`);
    passed++;
  } else {
    console.log(`✗ average: ${t.name} -> got ${out}, expected ${t.expect}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);