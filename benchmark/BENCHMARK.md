# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

### Performance

| Library   | Avg       | Median    | P95       | Min       | Max       |
| --------- | --------- | --------- | --------- | --------- | --------- |
| afpp      | 175.1 ms  | 174.05 ms | 181.26 ms | 169.79 ms | 201.37 ms |
| pdf-parse | 288.86 ms | 286.82 ms | 300.66 ms | 272.52 ms | 356.98 ms |
| pdf2pic   | 140.54 ms | 139.51 ms | 149.91 ms | 133.62 ms | 154.97 ms |

### Memory (Node.js RSS)

| Library   | Initial RSS | Final RSS | Peak RSS  | Growth Rate | Leak Detected |
| --------- | ----------- | --------- | --------- | ----------- | ------------- |
| afpp      | 163.64 MB   | 183.84 MB | 183.84 MB | 0.16 MB/run | Yes           |
| pdf-parse | 182.26 MB   | 194.2 MB  | 194.2 MB  | 0.05 MB/run | No            |
| pdf2pic   | 85.13 MB    | 86.93 MB  | 86.93 MB  | 0.01 MB/run | No            |

### Memory (Docker Container)

| Library   | Peak      | Avg        | Samples |
| --------- | --------- | ---------- | ------- |
| afpp      | 212.3 MiB | 141.29 MiB | 10      |
| pdf-parse | 152.5 MiB | 144.55 MiB | 17      |
| pdf2pic   | 270.3 MiB | 198.71 MiB | 8       |

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

> **Warning:** Potential memory leak detected: continuous growth of 0.16 MB/run, late runs use 15.86 MB more than early runs.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 163.64 MB   |
| Final RSS     | 183.84 MB   |
| Peak RSS      | 183.84 MB   |
| Total Growth  | 20.2 MB     |
| Growth Rate   | 0.16 MB/run |
| Early Avg RSS | 167.52 MB   |
| Late Avg RSS  | 183.39 MB   |
| Late vs Early | 15.86 MB    |
| Docker Peak   | 212.3 MiB   |
| Docker Avg    | 141.29 MiB  |

</details>

### pdf-parse

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 182.26 MB   |
| Final RSS     | 194.2 MB    |
| Peak RSS      | 194.2 MB    |
| Total Growth  | 11.94 MB    |
| Growth Rate   | 0.05 MB/run |
| Early Avg RSS | 187.28 MB   |
| Late Avg RSS  | 192.63 MB   |
| Late vs Early | 5.35 MB     |
| Docker Peak   | 152.5 MiB   |
| Docker Avg    | 144.55 MiB  |

</details>

### pdf2pic

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 85.13 MB    |
| Final RSS     | 86.93 MB    |
| Peak RSS      | 86.93 MB    |
| Total Growth  | 1.8 MB      |
| Growth Rate   | 0.01 MB/run |
| Early Avg RSS | 85.95 MB    |
| Late Avg RSS  | 86.91 MB    |
| Late vs Early | 0.95 MB     |
| Docker Peak   | 270.3 MiB   |
| Docker Avg    | 198.71 MiB  |

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
