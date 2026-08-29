/**
 * Writes a shields.io endpoint badge from the Stryker JSON report.
 * Usage: node .github/scripts/mutation-badge.mjs <report.json> <badge.json>
 * See https://shields.io/badges/endpoint-badge
 */
import { readFile, writeFile } from 'node:fs/promises';

/** @typedef {{ status: string }} Mutant */
/** @typedef {{ files: Record<string, { mutants: Mutant[] }> }} Report */

// Same thresholds as `thresholds` in stryker.config.mjs.
const HIGH = 80;
const LOW = 60;

const KILLED = ['Killed', 'Timeout'];
const COUNTED = [...KILLED, 'Survived', 'NoCoverage'];

const [, , reportPath, badgePath] = process.argv;

/** @type {Report} */
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const mutants = Object.values(report.files).flatMap((file) => file.mutants);
const counted = mutants.filter((mutant) => COUNTED.includes(mutant.status));
const killed = counted.filter((mutant) => KILLED.includes(mutant.status));

const score =
  counted.length === 0 ? undefined : (killed.length / counted.length) * 100;

const color = () => {
  if (score === undefined) return 'lightgrey';
  if (score >= HIGH) return 'brightgreen';
  if (score >= LOW) return 'yellow';
  return 'red';
};

const badge = {
  schemaVersion: 1,
  label: 'Mutation score',
  message: score === undefined ? 'unknown' : `${score.toFixed(1)}%`,
  color: color(),
};

await writeFile(badgePath, `${JSON.stringify(badge, null, 2)}\n`);
process.stdout.write(`${badge.message}\n`);
