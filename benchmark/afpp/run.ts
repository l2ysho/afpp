/* eslint-disable no-console */
/**
 * Benchmark script for AFPP - pdf2image
 *
 * Measures time and RSS memory usage for PDF image rendering.
 * Results are saved to benchmark/output/results.json
 *
 * Usage:
 *   npx tsx benchmark/run.ts [runs]
 *
 * Arguments:
 *   runs - Number of benchmark runs (default: 10)
 *
 * Environment:
 *   BENCHMARK_RUNS - Alternative way to set number of runs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// @ts-expect-error afpp is installed in docker
import { pdf2image } from 'afpp';

const OUTPUT_DIR = join(__dirname, 'output');
const PDF_PATH = join(__dirname, '../../test/example.pdf');

interface BenchmarkResult {
  config: {
    pdfPath: string;
    runs: number;
  };
  environment: {
    arch: string;
    cpus: number;
    node: string;
    platform: string;
    totalMemoryMb: number;
  };
  results: RunResult[];
  summary: OperationSummary;
  timestamp: string;
}

interface OperationSummary {
  avgRssDeltaMb: number;
  avgTimeMs: number;
  maxTimeMs: number;
  minTimeMs: number;
}

interface RunResult {
  rssAfterMb: number;
  rssBeforeMb: number;
  rssDeltaMb: number;
  run: number;
  timeMs: number;
}

function getRssMb(): number {
  return process.memoryUsage().rss / 1024 / 1024;
}

async function main() {
  const runs = parseInt(
    process.argv[2] || process.env.BENCHMARK_RUNS || '10',
    10,
  );

  if (isNaN(runs) || runs < 1) {
    console.error('Invalid number of runs. Must be a positive integer.');
    process.exit(1);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const result = await runBenchmark(runs);

  console.log('\n=== Summary ===');
  console.log(`  Avg time: ${result.summary.avgTimeMs}ms`);
  console.log(`  Min time: ${result.summary.minTimeMs}ms`);
  console.log(`  Max time: ${result.summary.maxTimeMs}ms`);
  console.log(`  Avg RSS delta: ${result.summary.avgRssDeltaMb}MB`);

  const outputPath = join(OUTPUT_DIR, 'results.json');
  await writeFile(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nResults saved to ${outputPath}`);
}

async function runBenchmark(runs: number): Promise<BenchmarkResult> {
  const os = await import('node:os');

  const results: RunResult[] = [];

  console.log(`Starting pdf2image benchmark with ${runs} runs...\n`);

  // Warmup run
  console.log('Warmup run...');
  await pdf2image(PDF_PATH, { imageEncoding: 'png', scale: 1 });
  console.log('Warmup complete.\n');

  // Force GC if available
  if (global.gc) {
    global.gc();
  }

  for (let i = 1; i <= runs; i++) {
    const rssBeforeMb = getRssMb();
    const start = performance.now();
    await pdf2image(PDF_PATH, { concurency: 8, scale: 1 });
    const timeMs = performance.now() - start;
    const rssAfterMb = getRssMb();

    results.push({
      rssAfterMb: Math.round(rssAfterMb * 100) / 100,
      rssBeforeMb: Math.round(rssBeforeMb * 100) / 100,
      rssDeltaMb: Math.round((rssAfterMb - rssBeforeMb) * 100) / 100,
      run: i,
      timeMs: Math.round(timeMs * 100) / 100,
    });

    console.log(`Run ${i}/${runs}: ${timeMs.toFixed(2)}ms`);

    // Force GC between runs if available
    if (global.gc) {
      global.gc();
    }
  }

  const times = results.map((r) => r.timeMs);
  const rssDeltas = results.map((r) => r.rssDeltaMb);

  const summary: OperationSummary = {
    avgRssDeltaMb:
      Math.round(
        (rssDeltas.reduce((a, b) => a + b, 0) / rssDeltas.length) * 100,
      ) / 100,
    avgTimeMs:
      Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 100) / 100,
    maxTimeMs: Math.max(...times),
    minTimeMs: Math.min(...times),
  };

  return {
    config: {
      pdfPath: PDF_PATH,
      runs,
    },
    environment: {
      arch: process.arch,
      cpus: os.cpus().length,
      node: process.version,
      platform: process.platform,
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    },
    results,
    summary,
    timestamp: new Date().toISOString(),
  };
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
