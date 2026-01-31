#!/usr/bin/env bash

# Runs all benchmark Docker containers sequentially
# Results are saved to each benchmark's output directory
#
# Usage:
#   ./benchmark/run-all.sh [runs]
#
# Arguments:
#   runs - Number of benchmark runs (default: 10)

set -e

cd "$(dirname "$0")/.."

RUNS=${1:-10}

echo "Running all benchmarks with $RUNS runs each..."
echo ""

# Build and run afpp benchmark
echo "=== Building afpp benchmark ==="
docker build -t afpp-benchmark -f benchmark/afpp/Dockerfile .
echo ""
echo "=== Running afpp benchmark ==="
docker run --rm \
  -e BENCHMARK_RUNS="$RUNS" \
  -e SAVE_IMAGES=true \
  -v "$(pwd)/benchmark/afpp/output:/app/benchmark/afpp/output" \
  afpp-benchmark
echo ""

# Build and run pdf-parse benchmark
echo "=== Building pdf-parse benchmark ==="
docker build -t pdf-parse-benchmark -f benchmark/pdf-parse/Dockerfile .
echo ""
echo "=== Running pdf-parse benchmark ==="
docker run --rm \
  -e BENCHMARK_RUNS="$RUNS" \
  -e SAVE_IMAGES=true \
  -v "$(pwd)/benchmark/pdf-parse/output:/app/benchmark/pdf-parse/output" \
  pdf-parse-benchmark
echo ""

# Build and run pdf2pic benchmark
echo "=== Building pdf2pic benchmark ==="
docker build -t pdf2pic-benchmark -f benchmark/pdf2pic/Dockerfile .
echo ""
echo "=== Running pdf2pic benchmark ==="
docker run --rm \
  -e BENCHMARK_RUNS="$RUNS" \
  -e SAVE_IMAGES=true \
  -v "$(pwd)/benchmark/pdf2pic/output:/app/benchmark/pdf2pic/output" \
  pdf2pic-benchmark
echo ""

echo "=== All benchmarks completed ==="
echo ""
echo "Results saved to:"
echo "  - benchmark/afpp/output/results.json"
echo "  - benchmark/pdf-parse/output/results.json"
echo "  - benchmark/pdf2pic/output/results.json"
echo ""
echo "Run ./benchmark/generate-report.sh to generate BENCHMARK.md"
