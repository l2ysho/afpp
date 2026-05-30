# Benchmark Dockerfile for pdf-parse
#
# Build:
#   docker build -t pdf-parse-benchmark -f benchmark/pdf-parse/Dockerfile .
#
# Run:
#   docker run --rm -v $(pwd)/benchmark/pdf-parse/output:/app/benchmark/pdf-parse/output pdf-parse-benchmark
#
# Run with custom number of runs:
#   docker run --rm -v $(pwd)/benchmark/pdf-parse/output:/app/benchmark/pdf-parse/output pdf-parse-benchmark 20

FROM node:22-slim

RUN corepack enable

WORKDIR /app

# Install pdf-parse (type=module required for ESM benchmark scripts)
RUN echo '{"name":"benchmark","version":"1.0.0","type":"module"}' > package.json && \
    pnpm add pdf-parse

# Copy test files and benchmark
COPY test ./test
COPY benchmark/utils.ts ./benchmark/utils.ts
COPY benchmark/pdf-parse ./benchmark/pdf-parse

# Create output directory
RUN mkdir -p benchmark/pdf-parse/output

# Default number of runs
ENV BENCHMARK_RUNS=10

# Enable GC exposure and native TypeScript support for lower memory overhead
ENV NODE_OPTIONS="--expose-gc --experimental-strip-types --disable-warning=ExperimentalWarning"

# Run benchmark with optional argument for number of runs
ENTRYPOINT ["node", "benchmark/pdf-parse/run.ts"]
CMD []
