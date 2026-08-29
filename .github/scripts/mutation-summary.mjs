/**
 * Turns the Stryker JSON report into a Markdown table for the GitHub Actions job
 * summary. Usage: node .github/scripts/mutation-summary.mjs <report.json>
 */
import { readFile } from 'node:fs/promises';

/** @typedef {{ status: string }} Mutant */
/** @typedef {{ files: Record<string, { mutants: Mutant[] }> }} Report */

const KILLED = ['Killed', 'Timeout'];
const COUNTED = [...KILLED, 'Survived', 'NoCoverage'];

/** @param {Mutant[]} mutants */
const score = (mutants) => {
  const counted = mutants.filter((mutant) => COUNTED.includes(mutant.status));
  if (counted.length === 0) return 'n/a';
  const killed = counted.filter((mutant) => KILLED.includes(mutant.status));
  return `${((killed.length / counted.length) * 100).toFixed(2)} %`;
};

/**
 * @param {Mutant[]} mutants
 * @param {string} status
 */
const count = (mutants, status) =>
  mutants.filter((mutant) => mutant.status === status).length;

/**
 * @param {string} name
 * @param {Mutant[]} mutants
 */
const row = (name, mutants) =>
  `| ${name} | ${score(mutants)} | ${mutants.length} | ${count(mutants, 'Killed')} | ${count(mutants, 'Timeout')} | ${count(mutants, 'Survived')} | ${count(mutants, 'NoCoverage')} |`;

const [, , reportPath] = process.argv;
/** @type {Report} */
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const files = Object.entries(report.files);

const lines = [
  '## Mutation testing',
  '',
  '| File | Score | Mutants | Killed | Timeout | Survived | No coverage |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  row(
    '**All files**',
    files.flatMap(([, file]) => file.mutants),
  ),
  ...files.map(([name, file]) => row(name, file.mutants)),
  '',
  'Download the `mutation-report` artifact for the annotated source.',
  '',
];

process.stdout.write(lines.join('\n'));
