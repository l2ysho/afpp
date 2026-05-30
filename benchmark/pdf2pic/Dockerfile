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

RUN corepack enable

WORKDIR /app

# Install pdf2pic (type=module required for ESM benchmark scripts)
RUN echo '{"name":"benchmark","version":"1.0.0","type":"module"}' > package.json && \
    pnpm add pdf2pic

# Copy test files and benchmark
COPY test ./test
COPY benchmark/utils.ts ./benchmark/utils.ts
COPY benchmark/pdf2pic ./benchmark/pdf2pic

# Create output directory
RUN mkdir -p benchmark/pdf2pic/output

# Default number of runs
ENV BENCHMARK_RUNS=10

# Enable GC exposure and native TypeScript support for lower memory overhead
ENV NODE_OPTIONS="--expose-gc --experimental-strip-types --disable-warning=ExperimentalWarning"

# Run benchmark with optional argument for number of runs
ENTRYPOINT ["node", "benchmark/pdf2pic/run.ts"]
CMD []
