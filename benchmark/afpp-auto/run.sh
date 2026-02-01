#!/usr/bin/env bash

# Runs AFPP auto concurrency benchmark in Docker
#
# Usage:
#   ./benchmark/afpp-auto/run.sh [runs]
#
# Arguments:
#   runs - Number of benchmark runs (default: 10)
#
# Environment:
#   BENCHMARK_RUNS - Alternative way to set number of runs
#   SAVE_IMAGES - Set to "true" to save result images

set -e

cd "$(dirname "$0")/../.."

RUNS=${1:-${BENCHMARK_RUNS:-10}}

echo "Building afpp-auto benchmark Docker image..."
docker build -t afpp-auto-benchmark -f benchmark/afpp-auto/Dockerfile .

echo "Running benchmark with $RUNS runs..."
docker run --rm \
  -e BENCHMARK_RUNS="$RUNS" \
  -e SAVE_IMAGES="${SAVE_IMAGES:-false}" \
  -v "$(pwd)/benchmark/afpp-auto/output:/app/benchmark/afpp-auto/output" \
  afpp-auto-benchmark

echo "Results saved to benchmark/afpp-auto/output/"
