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
  local stats_file="/tmp/docker_stats_$$.txt"

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

  # Collect docker stats in background using polling
  # We poll every 0.5s with --no-stream to get proper line output
  (
    while docker inspect "$container_id" --format='{{.State.Running}}' 2>/dev/null | grep -q true; do
      docker stats "$container_id" --no-stream --format '{{.MemUsage}}' 2>/dev/null >> "$stats_file"
      sleep 0.5
    done
  ) &
  local stats_pid=$!

  # Follow container logs in real-time (blocks until container exits)
  docker logs -f "$container_id"

  # Stop stats collection
  kill $stats_pid 2>/dev/null || true
  wait $stats_pid 2>/dev/null || true

  # Parse stats file to calculate peak and average
  local peak_mem=0
  local sum=0
  local count=0

  while IFS= read -r line; do
    # Extract memory value (e.g., "150.1MiB / 7.953GiB" -> "150.1")
    local mem
    mem=$(echo "$line" | awk '{print $1}' | sed 's/MiB//' | sed 's/GiB/*1024/' | bc 2>/dev/null || echo "")
    if [[ -n "$mem" && "$mem" != "0" ]]; then
      count=$((count + 1))
      sum=$(echo "$sum + $mem" | bc)
      if (( $(echo "$mem > $peak_mem" | bc -l) )); then
        peak_mem=$mem
      fi
    fi
  done < "$stats_file"

  # Calculate average
  local avg_mem=0
  if [[ $count -gt 0 ]]; then
    avg_mem=$(echo "scale=2; $sum / $count" | bc)
  fi

  # Cleanup stats file
  rm -f "$stats_file"

  # Save Docker memory stats
  echo ""
  echo "=== Docker Memory Stats for $name ==="
  echo "  Peak memory: ${peak_mem} MiB"
  echo "  Avg memory: ${avg_mem} MiB"
  echo "  Samples: ${count}"

  # Append Docker stats to results.json
  local results_file="$output_dir/results.json"
  if [[ -f "$results_file" ]]; then
    # Use jq if available, otherwise use node
    if command -v jq &> /dev/null; then
      jq --arg peak "$peak_mem" --arg avg "$avg_mem" --arg samples "$count" \
        '. + {dockerMemory: {peakMiB: ($peak | tonumber), avgMiB: ($avg | tonumber), samples: ($samples | tonumber)}}' \
        "$results_file" > "${results_file}.tmp" && mv "${results_file}.tmp" "$results_file"
    else
      node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$results_file', 'utf8'));
        data.dockerMemory = {
          peakMiB: parseFloat('$peak_mem') || 0,
          avgMiB: parseFloat('$avg_mem') || 0,
          samples: parseInt('$count') || 0
        };
        fs.writeFileSync('$results_file', JSON.stringify(data, null, 2));
      "
    fi
    echo "  Docker memory stats added to $results_file"
  fi

  # Cleanup container
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
