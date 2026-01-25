# Benchmark Dockerfile for pdf2pic
#
# Build:
#   docker build -t pdf2pic-benchmark -f benchmark/pdf2pic/Dockerfile .
#
# Run:
#   docker run --rm -v $(pwd)/benchmark/pdf2pic/output:/app/benchmark/pdf2pic/output pdf2pic-benchmark
#
# Run with custom number of runs:
#   docker run --rm -v $(pwd)/benchmark/pdf2pic/output:/app/benchmark/pdf2pic/output pdf2pic-benchmark 20

FROM node:22-slim

# Install GraphicsMagick and Ghostscript (required by pdf2pic)
RUN apt-get update && apt-get install -y \
    graphicsmagick \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pdf2pic and tsx
RUN npm init -y && npm install pdf2pic tsx

# Copy test files and benchmark
COPY test ./test
COPY benchmark/pdf2pic ./benchmark/pdf2pic

# Create output directory
RUN mkdir -p benchmark/pdf2pic/output

# Default number of runs
ENV BENCHMARK_RUNS=10

# Run benchmark with optional argument for number of runs
ENTRYPOINT ["npx", "tsx", "benchmark/pdf2pic/run.ts"]
CMD []
