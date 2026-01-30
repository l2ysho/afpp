/* eslint-disable no-console */
/**
 * Shared benchmark utilities
 *
 * Provides common functionality for running benchmarks with proper
 * memory leak detection and performance measurement.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';

export interface BenchmarkCallbacks<T> {
  /** The operation to benchmark */
  operation: () => Promise<T>;
  /** Optional callback to save output from warmup run */
  saveOutput?: (result: T) => Promise<void>;
  /** Optional warmup operation (defaults to operation) */
  warmup?: () => Promise<T>;
}

export interface BenchmarkConfig {
  /** Name of the benchmark */
  name: string;
  /** Directory to save output files */
  outputDir: string;
  /** Number of benchmark runs */
  runs: number;
  /** Whether to save sample output from warmup */
  saveOutput?: boolean;
}

export interface BenchmarkResult {
  config: {
    name: string;
    runs: number;
  };
  environment: {
    arch: string;
    cpus: number;
    node: string;
    platform: string;
    totalMemoryMb: number;
  };
  leakDetection: LeakDetectionResult;
  results: RunResult[];
  summary: OperationSummary;
  timestamp: string;
}

export interface LeakDetectionResult {
  /** Average RSS of first 10% of runs */
  earlyAvgRssMb: number;
  /** Final RSS after all runs */
  finalRssMb: number;
  /** Linear regression slope of RSS over runs (MB per run) */
  growthRatePerRun: number;
  /** Initial RSS before first run */
  initialRssMb: number;
  /** Average RSS of last 10% of runs */
  lateAvgRssMb: number;
  /** Difference between late and early average RSS */
  lateVsEarlyDeltaMb: number;
  /** Whether a potential memory leak was detected */
  leakDetected: boolean;
  /** Human-readable leak assessment */
  leakSummary: string;
  /** Peak RSS observed across all runs */
  peakRssMb: number;
  /** Total RSS growth from start to end */
  totalGrowthMb: number;
}

export interface OperationSummary {
  avgTimeMs: number;
  maxTimeMs: number;
  medianTimeMs: number;
  minTimeMs: number;
  p95TimeMs: number;
}

export interface RunResult {
  rssAfterMb: number;
  rssBeforeMb: number;
  rssDeltaMb: number;
  run: number;
  timeMs: number;
}

/**
 * Force garbage collection if available
 */
export function forceGC(): void {
  if (global.gc) {
    global.gc();
  }
}

/**
 * Get current RSS memory in MB
 */
export function getRssMb(): number {
  return process.memoryUsage().rss / 1024 / 1024;
}

/**
 * Parse benchmark runs from CLI args or environment
 */
export function parseRuns(defaultRuns = 10): number {
  const runs = parseInt(
    process.argv[2] || process.env.BENCHMARK_RUNS || String(defaultRuns),
    10,
  );

  if (isNaN(runs) || runs < 1) {
    console.error('Invalid number of runs. Must be a positive integer.');
    process.exit(1);
  }

  return runs;
}

/**
 * Print benchmark summary to console
 */
export function printSummary(result: BenchmarkResult): void {
  console.log('\n=== Performance Summary ===');
  console.log(`  Avg time: ${result.summary.avgTimeMs}ms`);
  console.log(`  Median time: ${result.summary.medianTimeMs}ms`);
  console.log(`  Min time: ${result.summary.minTimeMs}ms`);
  console.log(`  Max time: ${result.summary.maxTimeMs}ms`);
  console.log(`  P95 time: ${result.summary.p95TimeMs}ms`);

  console.log('\n=== Memory Leak Detection ===');
  console.log(`  Initial RSS: ${result.leakDetection.initialRssMb}MB`);
  console.log(`  Final RSS: ${result.leakDetection.finalRssMb}MB`);
  console.log(`  Peak RSS: ${result.leakDetection.peakRssMb}MB`);
  console.log(`  Total growth: ${result.leakDetection.totalGrowthMb}MB`);
  console.log(`  Growth rate: ${result.leakDetection.growthRatePerRun}MB/run`);
  console.log(`  Early avg RSS: ${result.leakDetection.earlyAvgRssMb}MB`);
  console.log(`  Late avg RSS: ${result.leakDetection.lateAvgRssMb}MB`);
  console.log(
    `  Late vs Early delta: ${result.leakDetection.lateVsEarlyDeltaMb}MB`,
  );
  console.log(`\n  ${result.leakDetection.leakSummary}`);
}

/**
 * Round a number to 2 decimal places
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Run a benchmark with the given configuration and callbacks
 */
export async function runBenchmark<T>(
  config: BenchmarkConfig,
  callbacks: BenchmarkCallbacks<T>,
): Promise<BenchmarkResult> {
  const { name, outputDir, runs, saveOutput } = config;
  const { operation, saveOutput: saveOutputFn, warmup } = callbacks;

  await mkdir(outputDir, { recursive: true });

  const results: RunResult[] = [];
  let interrupted = false;

  // Handle SIGINT/SIGTERM to return partial results
  const signalHandler = () => {
    if (interrupted) {
      // Second signal, force exit
      console.log('\nForce exit.');
      process.exit(1);
    }
    interrupted = true;
    console.log('\n\nInterrupted. Processing partial results...');
  };
  process.on('SIGINT', signalHandler);
  process.on('SIGTERM', signalHandler);

  try {
    console.log(`Starting ${name} benchmark with ${runs} runs...\n`);

    // Warmup run
    console.log('Warmup run...');
    const warmupResult = await (warmup ?? operation)();
    console.log('Warmup complete.\n');

    // Optionally save sample output from warmup
    if (saveOutput && saveOutputFn) {
      console.log('Saving sample output...');
      await saveOutputFn(warmupResult);
      console.log('Sample output saved.\n');
    }

    // Force GC before starting
    forceGC();

    for (let i = 1; i <= runs && !interrupted; i++) {
      const rssBeforeMb = getRssMb();
      const start = performance.now();
      await operation();
      const timeMs = performance.now() - start;
      const rssAfterMb = getRssMb();

      results.push({
        rssAfterMb: round2(rssAfterMb),
        rssBeforeMb: round2(rssBeforeMb),
        rssDeltaMb: round2(rssAfterMb - rssBeforeMb),
        run: i,
        timeMs: round2(timeMs),
      });

      console.log(`Run ${i}/${runs}: ${timeMs.toFixed(2)}ms`);

      // Force GC between runs
      forceGC();
    }
  } finally {
    process.off('SIGINT', signalHandler);
    process.off('SIGTERM', signalHandler);
  }

  if (results.length === 0) {
    console.error('No results collected. Exiting.');
    process.exit(1);
  }

  const completedRuns = results.length;
  const summary = calculateSummary(results);
  const leakDetection = analyzeLeaks(results);

  return {
    config: {
      name,
      runs: completedRuns,
    },
    environment: getEnvironment(),
    leakDetection,
    results,
    summary,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Save benchmark results to JSON file
 */
export async function saveResults(
  result: BenchmarkResult,
  outputDir: string,
): Promise<void> {
  const outputPath = join(outputDir, 'results.json');
  await writeFile(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nResults saved to ${outputPath}`);
}

/**
 * Check if sample output should be saved
 */
export function shouldSaveOutput(): boolean {
  return process.env.SAVE_IMAGES === 'true';
}

/**
 * Analyze results for memory leak detection
 */
function analyzeLeaks(results: RunResult[]): LeakDetectionResult {
  const rssValues = results.map((r) => r.rssAfterMb);
  const n = results.length;

  // Calculate early vs late averages (first/last 10%, minimum 1 sample)
  const sampleSize = Math.max(1, Math.floor(n * 0.1));
  const earlyRss = rssValues.slice(0, sampleSize);
  const lateRss = rssValues.slice(-sampleSize);

  const initialRssMb = results[0].rssBeforeMb;
  const finalRssMb = results[n - 1].rssAfterMb;
  const peakRssMb = Math.max(...rssValues);
  const totalGrowthMb = finalRssMb - initialRssMb;

  const earlyAvgRssMb = average(earlyRss);
  const lateAvgRssMb = average(lateRss);
  const lateVsEarlyDeltaMb = lateAvgRssMb - earlyAvgRssMb;

  const growthRatePerRun = linearRegressionSlope(rssValues);

  // Leak detection heuristics:
  // 1. Significant growth rate (> 0.1 MB per run on average)
  // 2. Late runs using significantly more memory than early runs (> 10 MB difference)
  // 3. Total growth is significant (> 50 MB for long runs)
  const significantGrowthRate = growthRatePerRun > 0.1;
  const significantLateGrowth = lateVsEarlyDeltaMb > 10;
  const significantTotalGrowth = totalGrowthMb > 50 && n >= 100;

  const leakDetected =
    significantGrowthRate || significantLateGrowth || significantTotalGrowth;

  let leakSummary: string;
  if (!leakDetected) {
    leakSummary = 'No memory leak detected. Memory usage is stable.';
  } else {
    const reasons: string[] = [];
    if (significantGrowthRate) {
      reasons.push(`continuous growth of ${round2(growthRatePerRun)} MB/run`);
    }
    if (significantLateGrowth) {
      reasons.push(
        `late runs use ${round2(lateVsEarlyDeltaMb)} MB more than early runs`,
      );
    }
    if (significantTotalGrowth) {
      reasons.push(`total growth of ${round2(totalGrowthMb)} MB`);
    }
    leakSummary = `Potential memory leak detected: ${reasons.join(', ')}.`;
  }

  return {
    earlyAvgRssMb: round2(earlyAvgRssMb),
    finalRssMb: round2(finalRssMb),
    growthRatePerRun: round2(growthRatePerRun),
    initialRssMb: round2(initialRssMb),
    lateAvgRssMb: round2(lateAvgRssMb),
    lateVsEarlyDeltaMb: round2(lateVsEarlyDeltaMb),
    leakDetected,
    leakSummary,
    peakRssMb: round2(peakRssMb),
    totalGrowthMb: round2(totalGrowthMb),
  };
}

/**
 * Calculate average of an array of numbers
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate performance summary from results
 */
function calculateSummary(results: RunResult[]): OperationSummary {
  const times = results.map((r) => r.timeMs);

  return {
    avgTimeMs: round2(average(times)),
    maxTimeMs: round2(Math.max(...times)),
    medianTimeMs: round2(median(times)),
    minTimeMs: round2(Math.min(...times)),
    p95TimeMs: round2(percentile(times, 95)),
  };
}

/**
 * Get environment information
 */
function getEnvironment() {
  return {
    arch: process.arch,
    cpus: os.cpus().length,
    node: process.version,
    platform: process.platform,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
  };
}

/**
 * Calculate linear regression slope
 * Returns the slope (rate of change per unit x)
 */
function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  // x values are just indices: 0, 1, 2, ...
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * Calculate median of an array of numbers
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate percentile of an array of numbers
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
