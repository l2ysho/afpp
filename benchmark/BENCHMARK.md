# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

### Performance

| Library          | Avg       | Median    | P95       | Min       | Max       |
| ---------------- | --------- | --------- | --------- | --------- | --------- |
| afpp@2.4.0       | 158.38 ms | 157.51 ms | 163.48 ms | 155.31 ms | 163.48 ms |
| afpp@2.4.0(auto) | 104.86 ms | 103.77 ms | 112.56 ms | 100.88 ms | 112.56 ms |
| pdf-parse@2.4.5  | 246.65 ms | 246.9 ms  | 251.13 ms | 240.5 ms  | 251.13 ms |
| pdf2pic@3.2.0    | 118.67 ms | 117.56 ms | 133.62 ms | 115.12 ms | 133.62 ms |

### Memory (Node.js RSS)

| Library          | Initial RSS | Final RSS | Peak RSS  | Growth Rate | Leak Detected |
| ---------------- | ----------- | --------- | --------- | ----------- | ------------- |
| afpp@2.4.0       | 157.67 MB   | 165.08 MB | 165.08 MB | 0.14 MB/run | No            |
| afpp@2.4.0(auto) | 199.16 MB   | 203.59 MB | 203.59 MB | 0.51 MB/run | Yes           |
| pdf-parse@2.4.5  | 180.77 MB   | 186.62 MB | 186.68 MB | 0.2 MB/run  | Yes           |
| pdf2pic@3.2.0    | 86.41 MB    | 87.32 MB  | 87.32 MB  | 0.07 MB/run | No            |

### Memory (Docker Container)

| Library          | Peak      | Avg        | Samples |
| ---------------- | --------- | ---------- | ------- |
| afpp@2.4.0       | 209.6 MiB | 198.4 MiB  | 2       |
| afpp@2.4.0(auto) | 145.7 MiB | 145.7 MiB  | 1       |
| pdf-parse@2.4.5  | 146.7 MiB | 140.96 MiB | 3       |
| pdf2pic@3.2.0    | 234.6 MiB | 224.95 MiB | 2       |

## Environment

| Property | Value       |
| -------- | ----------- |
| Date     | 2026-02-24  |
| Runs     | 10          |
| Node     | v22.22.0    |
| Platform | linux/arm64 |
| CPUs     | 10          |
| Memory   | 7995 MB     |

## Detailed Results

### afpp@2.4.0

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 157.67 MB   |
| Final RSS     | 165.08 MB   |
| Peak RSS      | 165.08 MB   |
| Total Growth  | 7.41 MB     |
| Growth Rate   | 0.14 MB/run |
| Early Avg RSS | 163.42 MB   |
| Late Avg RSS  | 165.08 MB   |
| Late vs Early | 1.66 MB     |
| Docker Peak   | 209.6 MiB   |
| Docker Avg    | 198.4 MiB   |

</details>

### afpp@2.4.0(auto)

> **Warning:** Potential memory leak detected: continuous growth of 0.51 MB/run.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 199.16 MB   |
| Final RSS     | 203.59 MB   |
| Peak RSS      | 203.59 MB   |
| Total Growth  | 4.43 MB     |
| Growth Rate   | 0.51 MB/run |
| Early Avg RSS | 199.43 MB   |
| Late Avg RSS  | 203.59 MB   |
| Late vs Early | 4.16 MB     |
| Docker Peak   | 145.7 MiB   |
| Docker Avg    | 145.7 MiB   |

</details>

### pdf-parse@2.4.5

> **Warning:** Potential memory leak detected: continuous growth of 0.2 MB/run.

<details>
<summary>Memory details</summary>

| Metric        | Value      |
| ------------- | ---------- |
| Initial RSS   | 180.77 MB  |
| Final RSS     | 186.62 MB  |
| Peak RSS      | 186.68 MB  |
| Total Growth  | 5.85 MB    |
| Growth Rate   | 0.2 MB/run |
| Early Avg RSS | 184.57 MB  |
| Late Avg RSS  | 186.62 MB  |
| Late vs Early | 2.05 MB    |
| Docker Peak   | 146.7 MiB  |
| Docker Avg    | 140.96 MiB |

</details>

### pdf2pic@3.2.0

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 86.41 MB    |
| Final RSS     | 87.32 MB    |
| Peak RSS      | 87.32 MB    |
| Total Growth  | 0.91 MB     |
| Growth Rate   | 0.07 MB/run |
| Early Avg RSS | 86.54 MB    |
| Late Avg RSS  | 87.32 MB    |
| Late vs Early | 0.78 MB     |
| Docker Peak   | 234.6 MiB   |
| Docker Avg    | 224.95 MiB  |

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
