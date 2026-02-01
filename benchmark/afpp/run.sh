#!/usr/bin/env bash

set -e

BENCHMARK_RUNS="${BENCHMARK_RUNS:-10}"
SAVE_IMAGES="${SAVE_IMAGES:-false}"

docker build -t afpp-benchmark -f benchmark/afpp/Dockerfile .

docker run --rm -it --init \
  -e "BENCHMARK_RUNS=${BENCHMARK_RUNS}" \
  -e "SAVE_IMAGES=${SAVE_IMAGES}" \
  -v "$(pwd)/benchmark/afpp/output:/app/benchmark/afpp/output" \
  afpp-benchmark
