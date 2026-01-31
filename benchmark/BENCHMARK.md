# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

### Performance

| Library   | Avg       | Median    | P95       | Min       | Max       |
| --------- | --------- | --------- | --------- | --------- | --------- |
| afpp      | 153.06 ms | 150.82 ms | 163.42 ms | 145.89 ms | 185.32 ms |
| pdf-parse | 250.38 ms | 243.8 ms  | 284.98 ms | 238.25 ms | 465.93 ms |
| pdf2pic   | 119.53 ms | 118.58 ms | 128.05 ms | 111.94 ms | 141.16 ms |

### Memory (Node.js RSS)

| Library   | Initial RSS | Final RSS | Peak RSS  | Growth Rate | Leak Detected |
| --------- | ----------- | --------- | --------- | ----------- | ------------- |
| afpp      | 126.37 MB   | 179.92 MB | 179.92 MB | 0.29 MB/run | Yes           |
| pdf-parse | 139.89 MB   | 190.52 MB | 191.47 MB | 0.13 MB/run | Yes           |
| pdf2pic   | 85.66 MB    | 87.7 MB   | 87.7 MB   | 0.01 MB/run | No            |

### Memory (Docker Container)

| Library   | Peak      | Avg        | Samples |
| --------- | --------- | ---------- | ------- |
| afpp      | 229 MiB   | 219.28 MiB | 8       |
| pdf-parse | 139.3 MiB | 134.2 MiB  | 12      |
| pdf2pic   | 258.8 MiB | 200.2 MiB  | 6       |

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

> **Warning:** Potential memory leak detected: continuous growth of 0.29 MB/run, late runs use 31.79 MB more than early runs, total growth of 53.55 MB.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 126.37 MB   |
| Final RSS     | 179.92 MB   |
| Peak RSS      | 179.92 MB   |
| Total Growth  | 53.55 MB    |
| Growth Rate   | 0.29 MB/run |
| Early Avg RSS | 147.66 MB   |
| Late Avg RSS  | 179.44 MB   |
| Late vs Early | 31.79 MB    |
| Docker Peak   | 229 MiB     |
| Docker Avg    | 219.28 MiB  |

</details>

### pdf-parse

> **Warning:** Potential memory leak detected: continuous growth of 0.13 MB/run, late runs use 15.06 MB more than early runs, total growth of 50.63 MB.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 139.89 MB   |
| Final RSS     | 190.52 MB   |
| Peak RSS      | 191.47 MB   |
| Total Growth  | 50.63 MB    |
| Growth Rate   | 0.13 MB/run |
| Early Avg RSS | 176.22 MB   |
| Late Avg RSS  | 191.28 MB   |
| Late vs Early | 15.06 MB    |
| Docker Peak   | 139.3 MiB   |
| Docker Avg    | 134.2 MiB   |

</details>

### pdf2pic

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 85.66 MB    |
| Final RSS     | 87.7 MB     |
| Peak RSS      | 87.7 MB     |
| Total Growth  | 2.04 MB     |
| Growth Rate   | 0.01 MB/run |
| Early Avg RSS | 86.64 MB    |
| Late Avg RSS  | 87.7 MB     |
| Late vs Early | 1.06 MB     |
| Docker Peak   | 258.8 MiB   |
| Docker Avg    | 200.2 MiB   |

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
