/* oxlint-disable no-console */
/**
 * Memory profiling script for AFPP
 *
 * Tracks native memory to identify leaks outside V8 heap.
 *
 * Usage:
 *   node --expose-gc benchmark/afpp/profile.ts
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// @ts-expect-error afpp is installed in docker
import { pdf2image } from 'afpp';

const OUTPUT_DIR = join(__dirname, 'output');
const PDF_PATH = join(__dirname, '../../test/example.pdf');

function forceGC() {
  if (global.gc) {
    global.gc();
    global.gc();
    global.gc();
  } else {
    console.warn('GC not exposed. Run with --expose-gc flag.');
  }
}

function getMemoryMB() {
  const mem = process.memoryUsage();
  return {
    arrayBuffers: Math.round(mem.arrayBuffers / 1024 / 1024),
    external: Math.round(mem.external / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    rss: Math.round(mem.rss / 1024 / 1024),
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const runs = 50;

  console.log('=== Native Memory Profiling ===\n');
  console.log(
    'Legend: RSS=total, Heap=V8, External=C++ objects, ArrayBuf=buffers, Native=RSS-Heap\n',
  );

  printMemory('Initial');

  // Warmup
  console.log('\nWarmup...');
  await pdf2image(PDF_PATH, { scale: 0.1 });
  forceGC();
  printMemory('After warmup');

  // Baseline
  forceGC();
  const baseline = getMemoryMB();
  console.log('\n--- Baseline set ---\n');

  // Run iterations and track memory
  console.log(`Running ${runs} iterations...\n`);

  for (let i = 1; i <= runs; i++) {
    await pdf2image(PDF_PATH, { scale: 0.1 });

    if (i % 10 === 0) {
      forceGC();
      printMemory(`Run ${i}`);
    }
  }

  // Final
  console.log('\n--- Final ---\n');
  forceGC();
  // Wait a bit for any async cleanup
  await new Promise((r) => setTimeout(r, 1000));
  forceGC();
  printMemory('Final');

  const final = getMemoryMB();
  console.log('\n=== Growth Summary ===');
  console.log(`RSS growth:         ${final.rss - baseline.rss}MB`);
  console.log(`Heap growth:        ${final.heapUsed - baseline.heapUsed}MB`);
  console.log(`External growth:    ${final.external - baseline.external}MB`);
  console.log(
    `ArrayBuffer growth: ${final.arrayBuffers - baseline.arrayBuffers}MB`,
  );
  console.log(
    `Native growth:      ${final.rss - final.heapTotal - (baseline.rss - baseline.heapTotal)}MB`,
  );

  console.log('\n=== Analysis ===');
  const nativeGrowth =
    final.rss - final.heapTotal - (baseline.rss - baseline.heapTotal);
  if (nativeGrowth > 10) {
    console.log('Native memory is growing - leak is in native code:');
    console.log('  - @napi-rs/canvas (Skia)');
    console.log('  - pdfjs-dist native workers');
    console.log('  - Node.js Buffer allocations');
  } else if (final.heapUsed - baseline.heapUsed > 10) {
    console.log('JS Heap is growing - leak is in JavaScript:');
    console.log('  - Use heap snapshots to investigate');
  } else if (final.external - baseline.external > 10) {
    console.log('External memory is growing - leak in C++ bound objects:');
    console.log('  - Canvas objects not being freed');
    console.log('  - Buffer objects held by native code');
  } else {
    console.log('No significant memory growth detected.');
  }
}

function printMemory(label: string) {
  const mem = getMemoryMB();
  // Native memory = RSS - heapTotal (approximate)
  const native = mem.rss - mem.heapTotal;
  console.log(
    `${label.padEnd(20)} | RSS: ${String(mem.rss).padStart(4)}MB | Heap: ${String(mem.heapUsed).padStart(4)}/${String(mem.heapTotal).padStart(4)}MB | External: ${String(mem.external).padStart(4)}MB | ArrayBuf: ${String(mem.arrayBuffers).padStart(4)}MB | Native~: ${String(native).padStart(4)}MB`,
  );
}

main().catch((error) => {
  console.error('Profiling failed:', error);
  process.exit(1);
});
