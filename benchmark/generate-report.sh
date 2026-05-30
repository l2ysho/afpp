#!/usr/bin/env bash

# Generates BENCHMARK.md by combining all benchmark results into comparison tables
# Run after executing benchmarks to update the main report

set -e

cd "$(dirname "$0")"

# Use Node.js to generate the report (handles JSON parsing)
pnpm exec tsx generate-report.ts

echo "Generated BENCHMARK.md"
