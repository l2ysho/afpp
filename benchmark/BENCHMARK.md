# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

### Performance

| Library   | Avg       | Median    | P95       | Min       | Max        |
| --------- | --------- | --------- | --------- | --------- | ---------- |
| afpp      | 110.69 ms | 109.09 ms | 119.67 ms | 102.76 ms | 148.62 ms  |
| pdf-parse | 286.3 ms  | 283.49 ms | 295.99 ms | 265.31 ms | 356.83 ms  |
| pdf2pic   | 158.5 ms  | 128.44 ms | 169.21 ms | 115.78 ms | 1719.32 ms |

### Memory (Node.js RSS)

| Library   | Initial RSS | Final RSS | Peak RSS  | Growth Rate | Leak Detected |
| --------- | ----------- | --------- | --------- | ----------- | ------------- |
| afpp      | 125.86 MB   | 185.71 MB | 185.71 MB | 0.2 MB/run  | Yes           |
| pdf-parse | 141.63 MB   | 191.51 MB | 192.67 MB | 0.11 MB/run | Yes           |
| pdf2pic   | 85.81 MB    | 86.32 MB  | 86.32 MB  | 0 MB/run    | No            |

### Memory (Docker Container)

| Library   | Peak      | Avg        | Samples |
| --------- | --------- | ---------- | ------- |
| afpp      | 233.4 MiB | 195.75 MiB | 7       |
| pdf-parse | 140.8 MiB | 135.42 MiB | 15      |
| pdf2pic   | 219.3 MiB | 163.2 MiB  | 8       |

## Environment

| Property | Value       |
| -------- | ----------- |
| Date     | 2026-01-31  |
| Runs     | 100         |
| Node     | v22.22.0    |
| Platform | linux/arm64 |
| CPUs     | 10          |
| Memory   | 7995 MB     |

## Detailed Results

### afpp

> **Warning:** Potential memory leak detected: continuous growth of 0.2 MB/run, late runs use 19.33 MB more than early runs, total growth of 59.85 MB.

<details>
<summary>Memory details</summary>

| Metric        | Value      |
| ------------- | ---------- |
| Initial RSS   | 125.86 MB  |
| Final RSS     | 185.71 MB  |
| Peak RSS      | 185.71 MB  |
| Total Growth  | 59.85 MB   |
| Growth Rate   | 0.2 MB/run |
| Early Avg RSS | 165.69 MB  |
| Late Avg RSS  | 185.02 MB  |
| Late vs Early | 19.33 MB   |
| Docker Peak   | 233.4 MiB  |
| Docker Avg    | 195.75 MiB |

</details>

### pdf-parse

> **Warning:** Potential memory leak detected: continuous growth of 0.11 MB/run, late runs use 13.2 MB more than early runs.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 141.63 MB   |
| Final RSS     | 191.51 MB   |
| Peak RSS      | 192.67 MB   |
| Total Growth  | 49.88 MB    |
| Growth Rate   | 0.11 MB/run |
| Early Avg RSS | 179.22 MB   |
| Late Avg RSS  | 192.41 MB   |
| Late vs Early | 13.2 MB     |
| Docker Peak   | 140.8 MiB   |
| Docker Avg    | 135.42 MiB  |

</details>

### pdf2pic

<details>
<summary>Memory details</summary>

| Metric        | Value     |
| ------------- | --------- |
| Initial RSS   | 85.81 MB  |
| Final RSS     | 86.32 MB  |
| Peak RSS      | 86.32 MB  |
| Total Growth  | 0.51 MB   |
| Growth Rate   | 0 MB/run  |
| Early Avg RSS | 86.12 MB  |
| Late Avg RSS  | 86.25 MB  |
| Late vs Early | 0.13 MB   |
| Docker Peak   | 219.3 MiB |
| Docker Avg    | 163.2 MiB |

</details>

## How to Run

```bash
# Run individual benchmarks
./benchmark/afpp/run.sh
./benchmark/pdf-parse/run.sh
./benchmark/pdf2pic/run.sh

# With custom number of runs
BENCHMARK_RUNS=100 ./benchmark/afpp/run.sh

# Regenerate this report
./benchmark/generate-report.sh
```

## Notes

- All benchmarks run in Docker containers for consistent environments
- **Node.js RSS**: Memory measured from inside the process using `process.memoryUsage().rss`
- **Docker Memory**: Total container memory measured externally via `docker stats`
- Leak detection compares early vs late run memory usage
- GC is forced between runs (`--expose-gc`) for accurate measurements
