# pdf-parse Benchmark

Performance benchmarks for [pdf-parse](https://www.npmjs.com/package/pdf-parse) measuring time and memory (RSS) usage.

## Running in Docker

Build the Docker image:

```bash
docker build -t pdf-parse-benchmark -f benchmark/pdf-parse/Dockerfile .
```

Run the benchmark:

```bash
docker run --rm -v $(pwd)/benchmark/pdf-parse/output:/app/benchmark/pdf-parse/output pdf-parse-benchmark
```

With custom number of runs:

```bash
docker run --rm -v $(pwd)/benchmark/pdf-parse/output:/app/benchmark/pdf-parse/output pdf-parse-benchmark 20
```

## Output

Results are saved to `benchmark/pdf-parse/output/results.json` with the following structure:

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
