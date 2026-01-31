#!/usr/bin/env bash

# Runs all benchmark Docker containers sequentially
# Results are saved to each benchmark's output directory
#
# Usage:
#   ./benchmark/run-all.sh [runs]
#   BENCHMARK_RUNS=100 ./benchmark/run-all.sh
#
# Arguments:
#   runs - Number of benchmark runs (default: 10)
#
# Environment:
#   BENCHMARK_RUNS - Alternative way to set number of runs

set -e

cd "$(dirname "$0")/.."

RUNS=${1:-${BENCHMARK_RUNS:-10}}

echo "Running all benchmarks with $RUNS runs each..."
echo ""

# Function to run benchmark with Docker memory tracking
run_benchmark() {
  local name=$1
  local image=$2
  local dockerfile=$3
  local output_dir=$4

  echo "=== Building $name benchmark ==="
  docker build -t "$image" -f "$dockerfile" .
  echo ""

  echo "=== Running $name benchmark ==="

  # Start container in background
  local container_id
  container_id=$(docker run -d \
    -e BENCHMARK_RUNS="$RUNS" \
    -e SAVE_IMAGES=true \
    -v "$(pwd)/$output_dir:/app/$output_dir" \
    "$image")

  # Track peak memory in background
  local peak_mem=0
  local mem_samples=()
  while docker inspect "$container_id" --format='{{.State.Running}}' 2>/dev/null | grep -q true; do
    # Get memory usage in bytes from docker stats
    local mem
    mem=$(docker stats "$container_id" --no-stream --format '{{.MemUsage}}' 2>/dev/null | awk '{print $1}' | sed 's/MiB//' | sed 's/GiB/*1024/' | bc 2>/dev/null || echo "0")
    if [[ "$mem" != "0" && "$mem" != "" ]]; then
      mem_samples+=("$mem")
      if (( $(echo "$mem > $peak_mem" | bc -l) )); then
        peak_mem=$mem
      fi
    fi
    sleep 0.1
  done

  # Get container logs
  docker logs "$container_id"

  # Calculate average memory
  local avg_mem=0
  if [[ ${#mem_samples[@]} -gt 0 ]]; then
    local sum=0
    for m in "${mem_samples[@]}"; do
      sum=$(echo "$sum + $m" | bc)
    done
    avg_mem=$(echo "scale=2; $sum / ${#mem_samples[@]}" | bc)
  fi

  # Save Docker memory stats
  echo ""
  echo "=== Docker Memory Stats for $name ==="
  echo "  Peak memory: ${peak_mem} MiB"
  echo "  Avg memory: ${avg_mem} MiB"
  echo "  Samples: ${#mem_samples[@]}"

  # Append Docker stats to results.json
  local results_file="$output_dir/results.json"
  if [[ -f "$results_file" ]]; then
    # Use jq if available, otherwise use node
    if command -v jq &> /dev/null; then
      jq --arg peak "$peak_mem" --arg avg "$avg_mem" --arg samples "${#mem_samples[@]}" \
        '. + {dockerMemory: {peakMiB: ($peak | tonumber), avgMiB: ($avg | tonumber), samples: ($samples | tonumber)}}' \
        "$results_file" > "${results_file}.tmp" && mv "${results_file}.tmp" "$results_file"
    else
      node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$results_file', 'utf8'));
        data.dockerMemory = {
          peakMiB: parseFloat('$peak_mem') || 0,
          avgMiB: parseFloat('$avg_mem') || 0,
          samples: parseInt('${#mem_samples[@]}') || 0
        };
        fs.writeFileSync('$results_file', JSON.stringify(data, null, 2));
      "
    fi
    echo "  Docker memory stats added to $results_file"
  fi

  # Cleanup
  docker rm "$container_id" > /dev/null 2>&1 || true
  echo ""
}

# Run all benchmarks
run_benchmark "afpp" "afpp-benchmark" "benchmark/afpp/Dockerfile" "benchmark/afpp/output"
run_benchmark "pdf-parse" "pdf-parse-benchmark" "benchmark/pdf-parse/Dockerfile" "benchmark/pdf-parse/output"
run_benchmark "pdf2pic" "pdf2pic-benchmark" "benchmark/pdf2pic/Dockerfile" "benchmark/pdf2pic/output"

echo "=== All benchmarks completed ==="
echo ""
echo "Results saved to:"
echo "  - benchmark/afpp/output/results.json"
echo "  - benchmark/pdf-parse/output/results.json"
echo "  - benchmark/pdf2pic/output/results.json"
echo ""
echo "Run ./benchmark/generate-report.sh to generate BENCHMARK.md"
