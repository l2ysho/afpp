# Benchmark Dockerfile for AFPP
#
# Build:
#   docker build -t afpp-benchmark -f benchmark/Dockerfile .
#
# Run:
#   docker run --rm -v $(pwd)/benchmark/afpp/output:/app/benchmark/afpp/output afpp-benchmark
#
# Run with custom number of runs:
#   docker run --rm -v $(pwd)/benchmark/afpp/output:/app/benchmark/afpp/output afpp-benchmark 20

FROM node:22-slim

WORKDIR /app

# Install afpp from npm
RUN npm init -y && npm install afpp tsx

# Copy test files and benchmark
COPY test ./test
COPY benchmark/afpp ./benchmark/afpp

# Create output directory
RUN mkdir -p benchmark/afpp/output

# Default number of runs
ENV BENCHMARK_RUNS=10

# Run benchmark with optional argument for number of runs
ENTRYPOINT ["npx", "tsx", "benchmark/afpp/run.ts"]
CMD []
