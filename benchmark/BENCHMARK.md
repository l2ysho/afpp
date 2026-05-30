# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

### Performance

| Library          | Avg       | Median    | P95       | Min       | Max       |
| ---------------- | --------- | --------- | --------- | --------- | --------- |
| afpp@3.0.0       | 304.05 ms | 302.62 ms | 320.69 ms | 291.62 ms | 320.69 ms |
| afpp@3.0.0(auto) | 180.37 ms | 177.02 ms | 205.45 ms | 169.48 ms | 205.45 ms |
| pdf-parse@2.4.5  | 257.51 ms | 255.73 ms | 266.97 ms | 252.12 ms | 266.97 ms |
| pdf2pic@3.2.0    | 135.65 ms | 133.27 ms | 156.5 ms  | 124.34 ms | 156.5 ms  |

### Memory (Node.js RSS)

| Library          | Initial RSS | Final RSS | Peak RSS  | Growth Rate | Leak Detected |
| ---------------- | ----------- | --------- | --------- | ----------- | ------------- |
| afpp@3.0.0       | 167.71 MB   | 176.14 MB | 176.14 MB | 0.26 MB/run | Yes           |
| afpp@3.0.0(auto) | 208.68 MB   | 212.21 MB | 212.21 MB | 0.24 MB/run | Yes           |
| pdf-parse@2.4.5  | 181.82 MB   | 185.68 MB | 185.68 MB | 0.05 MB/run | No            |
| pdf2pic@3.2.0    | 79.27 MB    | 80.93 MB  | 80.93 MB  | 0.18 MB/run | No            |

### Memory (Docker Container)

| Library          | Peak      | Avg        | Samples |
| ---------------- | --------- | ---------- | ------- |
| afpp@3.0.0       | 125.1 MiB | 112.53 MiB | 5       |
| afpp@3.0.0(auto) | 159.1 MiB | 150.2 MiB  | 3       |
| pdf-parse@2.4.5  | 133.2 MiB | 125.67 MiB | 4       |
| pdf2pic@3.2.0    | 88.08 MiB | 63.59 MiB  | 2       |

## Environment

| Property | Value       |
| -------- | ----------- |
| Date     | 2026-05-30  |
| Runs     | 10          |
| Node     | v22.22.3    |
| Platform | linux/arm64 |
| CPUs     | 10          |
| Memory   | 7994 MB     |

## Detailed Results

### afpp@3.0.0

> **Warning:** Potential memory leak detected: continuous growth of 0.26 MB/run.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 167.71 MB   |
| Final RSS     | 176.14 MB   |
| Peak RSS      | 176.14 MB   |
| Total Growth  | 8.43 MB     |
| Growth Rate   | 0.26 MB/run |
| Early Avg RSS | 173.35 MB   |
| Late Avg RSS  | 176.14 MB   |
| Late vs Early | 2.79 MB     |
| Docker Peak   | 125.1 MiB   |
| Docker Avg    | 112.53 MiB  |

</details>

### afpp@3.0.0(auto)

> **Warning:** Potential memory leak detected: continuous growth of 0.24 MB/run.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 208.68 MB   |
| Final RSS     | 212.21 MB   |
| Peak RSS      | 212.21 MB   |
| Total Growth  | 3.53 MB     |
| Growth Rate   | 0.24 MB/run |
| Early Avg RSS | 208.68 MB   |
| Late Avg RSS  | 212.21 MB   |
| Late vs Early | 3.53 MB     |
| Docker Peak   | 159.1 MiB   |
| Docker Avg    | 150.2 MiB   |

</details>

### pdf-parse@2.4.5

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 181.82 MB   |
| Final RSS     | 185.68 MB   |
| Peak RSS      | 185.68 MB   |
| Total Growth  | 3.86 MB     |
| Growth Rate   | 0.05 MB/run |
| Early Avg RSS | 185.11 MB   |
| Late Avg RSS  | 185.68 MB   |
| Late vs Early | 0.57 MB     |
| Docker Peak   | 133.2 MiB   |
| Docker Avg    | 125.67 MiB  |

</details>

### pdf2pic@3.2.0

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 79.27 MB    |
| Final RSS     | 80.93 MB    |
| Peak RSS      | 80.93 MB    |
| Total Growth  | 1.66 MB     |
| Growth Rate   | 0.18 MB/run |
| Early Avg RSS | 79.27 MB    |
| Late Avg RSS  | 80.93 MB    |
| Late vs Early | 1.66 MB     |
| Docker Peak   | 88.08 MiB   |
| Docker Avg    | 63.59 MiB   |

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
