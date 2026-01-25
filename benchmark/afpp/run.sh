#!/usr/bin/env bash

set -e

BENCHMARK_RUNS="${BENCHMARK_RUNS:-10}"

docker build -t afpp-benchmark -f benchmark/afpp/Dockerfile .

docker run --rm \
  -e "BENCHMARK_RUNS=${BENCHMARK_RUNS}" \
  -v "$(pwd)/benchmark/afpp/output:/app/benchmark/afpp/output" \
  afpp-benchmark
