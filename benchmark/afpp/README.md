# AFPP Benchmark

Performance benchmarks for AFPP `pdf2image` measuring time and memory (RSS) usage.

## Running in Docker

Build the Docker image:

```bash
docker build -t afpp-benchmark -f benchmark/afpp/Dockerfile .
```

Run the benchmark:

```bash
docker run --rm -v $(pwd)/benchmark/afpp/output:/app/benchmark/afpp/output afpp-benchmark
```

With custom number of runs:

```bash
docker run --rm -v $(pwd)/benchmark/afpp/output:/app/benchmark/afpp/output afpp-benchmark 20
```

## Output

Results are saved to `benchmark/output/results.json` with the following structure:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": {
    "node": "v22.14.0",
    "platform": "linux",
    "arch": "x64",
    "cpus": 8,
    "totalMemoryMb": 16384
  },
  "config": {
    "runs": 10,
    "pdfPath": "/app/test/example.pdf"
  },
  "results": [
    {
      "run": 1,
      "timeMs": 123.45,
      "rssBeforeMb": 100.0,
      "rssAfterMb": 105.0,
      "rssDeltaMb": 5.0
    }
  ],
  "summary": {
    "avgTimeMs": 120.0,
    "minTimeMs": 110.0,
    "maxTimeMs": 130.0,
    "avgRssDeltaMb": 5.0
  }
}
```

## Metrics

- **timeMs**: Execution time in milliseconds
- **rssBeforeMb**: Resident Set Size before operation (MB)
- **rssAfterMb**: Resident Set Size after operation (MB)
- **rssDeltaMb**: Memory change during operation (MB)
