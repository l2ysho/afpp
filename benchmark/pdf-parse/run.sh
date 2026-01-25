#!/usr/bin/env bash

set -e

BENCHMARK_RUNS="${BENCHMARK_RUNS:-10}"

docker build -t pdf-parse-benchmark -f benchmark/pdf-parse/Dockerfile .

docker run --rm \
  -e "BENCHMARK_RUNS=${BENCHMARK_RUNS}" \
  -v "$(pwd)/benchmark/pdf-parse/output:/app/benchmark/pdf-parse/output" \
  pdf-parse-benchmark
