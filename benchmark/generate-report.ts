/* eslint-disable no-console */
/**
 * Generates BENCHMARK.md with comparison tables from all benchmark results
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { BenchmarkResult } from './utils';

const BENCHMARKS = ['afpp', 'pdf-parse', 'pdf2pic'];
const OUTPUT_FILE = join(__dirname, 'BENCHMARK.md');

interface BenchmarkData {
  name: string;
  result: BenchmarkResultWithDocker | null;
}

interface BenchmarkResultWithDocker extends BenchmarkResult {
  dockerMemory?: DockerMemory;
}

interface DockerMemory {
  avgMiB: number;
  peakMiB: number;
  samples: number;
}

function generateMarkdown(benchmarks: BenchmarkData[]): string {
  const hasResults = benchmarks.filter((b) => b.result !== null);

  let md = `# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

`;

  if (hasResults.length === 0) {
    md += `_No benchmark results yet. Run the benchmarks first._

\`\`\`bash
./benchmark/afpp/run.sh
./benchmark/pdf-parse/run.sh
./benchmark/pdf2pic/run.sh
\`\`\`
`;
    return md;
  }

  // Performance comparison table
  md += `### Performance

| Library | Avg | Median | P95 | Min | Max |
|---------|-----|--------|-----|-----|-----|
`;

  for (const { name, result } of benchmarks) {
    if (result) {
      const s = result.summary;
      md += `| ${name} | ${s.avgTimeMs} ms | ${s.medianTimeMs} ms | ${s.p95TimeMs} ms | ${s.minTimeMs} ms | ${s.maxTimeMs} ms |\n`;
    } else {
      md += `| ${name} | - | - | - | - | - |\n`;
    }
  }

  // Memory comparison table (Node.js RSS)
  md += `
### Memory (Node.js RSS)

| Library | Initial RSS | Final RSS | Peak RSS | Growth Rate | Leak Detected |
|---------|-------------|-----------|----------|-------------|---------------|
`;

  for (const { name, result } of benchmarks) {
    if (result) {
      const l = result.leakDetection;
      const leak = l.leakDetected ? 'Yes' : 'No';
      md += `| ${name} | ${l.initialRssMb} MB | ${l.finalRssMb} MB | ${l.peakRssMb} MB | ${l.growthRatePerRun} MB/run | ${leak} |\n`;
    } else {
      md += `| ${name} | - | - | - | - | - |\n`;
    }
  }

  // Docker memory comparison table
  const hasDockerMemory = benchmarks.some((b) => b.result?.dockerMemory);
  if (hasDockerMemory) {
    md += `
### Memory (Docker Container)

| Library | Peak | Avg | Samples |
|---------|------|-----|---------|
`;

    for (const { name, result } of benchmarks) {
      if (result?.dockerMemory) {
        const d = result.dockerMemory;
        md += `| ${name} | ${d.peakMiB} MiB | ${d.avgMiB} MiB | ${d.samples} |\n`;
      } else if (result) {
        md += `| ${name} | - | - | - |\n`;
      } else {
        md += `| ${name} | - | - | - |\n`;
      }
    }
  }

  // Environment info (from first available result)
  const firstResult = hasResults[0]?.result;
  if (firstResult) {
    const env = firstResult.environment;
    const runs = firstResult.config.runs;
    const date = new Date(firstResult.timestamp).toISOString().split('T')[0];

    md += `
## Environment

| Property | Value |
|----------|-------|
| Date | ${date} |
| Runs | ${runs} |
| Node | ${env.node} |
| Platform | ${env.platform}/${env.arch} |
| CPUs | ${env.cpus} |
| Memory | ${env.totalMemoryMb} MB |
`;
  }

  // Detailed results per library
  md += `
## Detailed Results

`;

  for (const { name, result } of benchmarks) {
    md += `### ${name}\n\n`;

    if (!result) {
      md += `_No results yet. Run \`./benchmark/${name}/run.sh\` to generate._\n\n`;
      continue;
    }

    if (result.leakDetection.leakDetected) {
      md += `> **Warning:** ${result.leakDetection.leakSummary}\n\n`;
    }

    const dockerMemoryRows = result.dockerMemory
      ? `| Docker Peak | ${result.dockerMemory.peakMiB} MiB |
| Docker Avg | ${result.dockerMemory.avgMiB} MiB |`
      : '';

    md += `<details>
<summary>Memory details</summary>

| Metric | Value |
|--------|-------|
| Initial RSS | ${result.leakDetection.initialRssMb} MB |
| Final RSS | ${result.leakDetection.finalRssMb} MB |
| Peak RSS | ${result.leakDetection.peakRssMb} MB |
| Total Growth | ${result.leakDetection.totalGrowthMb} MB |
| Growth Rate | ${result.leakDetection.growthRatePerRun} MB/run |
| Early Avg RSS | ${result.leakDetection.earlyAvgRssMb} MB |
| Late Avg RSS | ${result.leakDetection.lateAvgRssMb} MB |
| Late vs Early | ${result.leakDetection.lateVsEarlyDeltaMb} MB |
${dockerMemoryRows}

</details>

`;
  }

  // Notes
  md += `## How to Run

\`\`\`bash
# Run individual benchmarks
./benchmark/afpp/run.sh
./benchmark/pdf-parse/run.sh
./benchmark/pdf2pic/run.sh

# With custom number of runs
BENCHMARK_RUNS=100 ./benchmark/afpp/run.sh

# Regenerate this report
./benchmark/generate-report.sh
\`\`\`

## Notes

- All benchmarks run in Docker containers for consistent environments
- **Node.js RSS**: Memory measured from inside the process using \`process.memoryUsage().rss\`
- **Docker Memory**: Total container memory measured externally via \`docker stats\`
- Leak detection compares early vs late run memory usage
- GC is forced between runs (\`--expose-gc\`) for accurate measurements
`;

  return md;
}

async function loadResults(): Promise<BenchmarkData[]> {
  const results: BenchmarkData[] = [];

  for (const name of BENCHMARKS) {
    const resultPath = join(__dirname, name, 'output', 'results.json');
    try {
      const content = await readFile(resultPath, 'utf-8');
      results.push({ name, result: JSON.parse(content) });
    } catch {
      results.push({ name, result: null });
    }
  }

  return results;
}

async function main() {
  const benchmarks = await loadResults();
  const markdown = generateMarkdown(benchmarks);
  await writeFile(OUTPUT_FILE, markdown);
  console.log(`Generated ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error('Failed to generate report:', error);
  process.exit(1);
});
