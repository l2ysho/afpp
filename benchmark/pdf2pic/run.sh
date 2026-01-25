#!/usr/bin/env bash

set -e

BENCHMARK_RUNS="${BENCHMARK_RUNS:-10}"

docker build -t pdf2pic-benchmark -f benchmark/pdf2pic/Dockerfile .

docker run --rm \
  -e "BENCHMARK_RUNS=${BENCHMARK_RUNS}" \
  -v "$(pwd)/benchmark/pdf2pic/output:/app/benchmark/pdf2pic/output" \
  pdf2pic-benchmark
