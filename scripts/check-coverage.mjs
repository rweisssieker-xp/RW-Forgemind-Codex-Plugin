import { readFile } from 'node:fs/promises';

const [file, minimumText] = process.argv.slice(2);
const minimum = Number(minimumText);
if (!file || !Number.isFinite(minimum)) throw new Error('Usage: node scripts/check-coverage.mjs <lcov-file> <minimum-percent>');

const report = await readFile(file, 'utf8');
let found = 0;
let hit = 0;
for (const line of report.split(/\r?\n/)) {
  if (line.startsWith('LF:')) found += Number(line.slice(3));
  if (line.startsWith('LH:')) hit += Number(line.slice(3));
}
const coverage = found ? (hit / found) * 100 : 0;
if (coverage < minimum) throw new Error(`Line coverage ${coverage.toFixed(2)}% is below the required ${minimum.toFixed(2)}%.`);
console.log(`coverage: ${coverage.toFixed(2)}% (minimum ${minimum.toFixed(2)}%)`);
