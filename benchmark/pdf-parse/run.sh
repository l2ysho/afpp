#!/usr/bin/env bash

set -e

BENCHMARK_RUNS="${BENCHMARK_RUNS:-10}"
SAVE_IMAGES="${SAVE_IMAGES:-false}"

docker build -t pdf-parse-benchmark -f benchmark/pdf-parse/Dockerfile .

docker run --rm -it --init \
  -e "BENCHMARK_RUNS=${BENCHMARK_RUNS}" \
  -e "SAVE_IMAGES=${SAVE_IMAGES}" \
  -v "$(pwd)/benchmark/pdf-parse/output:/app/benchmark/pdf-parse/output" \
  pdf-parse-benchmark
