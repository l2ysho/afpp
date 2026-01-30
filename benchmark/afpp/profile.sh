#!/usr/bin/env bash

set -e

docker build -t afpp-benchmark -f benchmark/afpp/Dockerfile .

docker run --rm -it --init \
  -v "$(pwd)/benchmark/afpp/output:/app/benchmark/afpp/output" \
  --entrypoint node \
  afpp-benchmark \
  --expose-gc \
  --max-old-space-size=512 \
  node_modules/.bin/tsx \
  benchmark/afpp/profile.ts
