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

WORKDIR /app

# Install pdf-parse and tsx
RUN npm init -y && npm install pdf-parse tsx

# Copy test files and benchmark
COPY test ./test
COPY benchmark/pdf-parse ./benchmark/pdf-parse

# Create output directory
RUN mkdir -p benchmark/pdf-parse/output

# Default number of runs
ENV BENCHMARK_RUNS=10

# Run benchmark with optional argument for number of runs
ENTRYPOINT ["npx", "tsx", "benchmark/pdf-parse/run.ts"]
CMD []
