# Benchmark Dockerfile for AFPP with auto concurrency
#
# Build:
#   docker build -t afpp-auto-benchmark -f benchmark/afpp-auto/Dockerfile .
#
# Run:
#   docker run --rm -v $(pwd)/benchmark/afpp-auto/output:/app/benchmark/afpp-auto/output afpp-auto-benchmark
#
# Run with custom number of runs:
#   docker run --rm -v $(pwd)/benchmark/afpp-auto/output:/app/benchmark/afpp-auto/output afpp-auto-benchmark 20

FROM node:22-slim

RUN corepack enable

WORKDIR /app

# Install afpp (type=module required for ESM benchmark scripts)
RUN echo '{"name":"benchmark","version":"1.0.0","type":"module"}' > package.json && \
    pnpm add afpp

# Copy test files and benchmark
COPY test ./test
COPY benchmark/utils.ts ./benchmark/utils.ts
COPY benchmark/afpp-auto ./benchmark/afpp-auto

# Create output directory
RUN mkdir -p benchmark/afpp-auto/output

# Default number of runs
ENV BENCHMARK_RUNS=10

# Enable GC exposure and native TypeScript support for lower memory overhead
ENV NODE_OPTIONS="--expose-gc --experimental-strip-types --disable-warning=ExperimentalWarning"

# Run benchmark with optional argument for number of runs
ENTRYPOINT ["node", "benchmark/afpp-auto/run.ts"]
CMD []
