#!/usr/bin/env bash

set -e

BENCHMARK_RUNS="${BENCHMARK_RUNS:-10}"
SAVE_IMAGES="${SAVE_IMAGES:-false}"

docker build -t pdf2pic-benchmark -f benchmark/pdf2pic/Dockerfile .

docker run --rm -it --init \
  -e "BENCHMARK_RUNS=${BENCHMARK_RUNS}" \
  -e "SAVE_IMAGES=${SAVE_IMAGES}" \
  -v "$(pwd)/benchmark/pdf2pic/output:/app/benchmark/pdf2pic/output" \
  pdf2pic-benchmark
