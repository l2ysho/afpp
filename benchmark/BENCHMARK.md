# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

### Performance

| Library          | Avg       | Median    | P95       | Min       | Max       |
| ---------------- | --------- | --------- | --------- | --------- | --------- |
| afpp@2.4.0       | 164.44 ms | 164.53 ms | 168.88 ms | 161.49 ms | 168.88 ms |
| afpp@2.4.0(auto) | 115.03 ms | 114.85 ms | 119.58 ms | 110.39 ms | 119.58 ms |
| pdf-parse@2.4.5  | 261.37 ms | 261.38 ms | 266.45 ms | 257.49 ms | 266.45 ms |
| pdf2pic@3.2.0    | 143 ms    | 143.27 ms | 146.48 ms | 137.54 ms | 146.48 ms |

### Memory (Node.js RSS)

| Library          | Initial RSS | Final RSS | Peak RSS  | Growth Rate | Leak Detected |
| ---------------- | ----------- | --------- | --------- | ----------- | ------------- |
| afpp@2.4.0       | 158.01 MB   | 165.65 MB | 165.65 MB | 0.18 MB/run | No            |
| afpp@2.4.0(auto) | 200.67 MB   | 202.31 MB | 202.31 MB | 0.15 MB/run | No            |
| pdf-parse@2.4.5  | 180.91 MB   | 187.63 MB | 187.63 MB | 0.41 MB/run | Yes           |
| pdf2pic@3.2.0    | 86.01 MB    | 87.04 MB  | 87.04 MB  | 0.06 MB/run | No            |

### Memory (Docker Container)

| Library          | Peak      | Avg        | Samples |
| ---------------- | --------- | ---------- | ------- |
| afpp@2.4.0       | 209.5 MiB | 200.35 MiB | 2       |
| afpp@2.4.0(auto) | 147.5 MiB | 147.5 MiB  | 1       |
| pdf-parse@2.4.5  | 147.2 MiB | 139.12 MiB | 4       |
| pdf2pic@3.2.0    | 260.4 MiB | 213.4 MiB  | 2       |

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
| Initial RSS   | 158.01 MB   |
| Final RSS     | 165.65 MB   |
| Peak RSS      | 165.65 MB   |
| Total Growth  | 7.64 MB     |
| Growth Rate   | 0.18 MB/run |
| Early Avg RSS | 164.13 MB   |
| Late Avg RSS  | 165.65 MB   |
| Late vs Early | 1.52 MB     |
| Docker Peak   | 209.5 MiB   |
| Docker Avg    | 200.35 MiB  |

</details>

### afpp@2.4.0(auto)

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 200.67 MB   |
| Final RSS     | 202.31 MB   |
| Peak RSS      | 202.31 MB   |
| Total Growth  | 1.64 MB     |
| Growth Rate   | 0.15 MB/run |
| Early Avg RSS | 200.79 MB   |
| Late Avg RSS  | 202.31 MB   |
| Late vs Early | 1.52 MB     |
| Docker Peak   | 147.5 MiB   |
| Docker Avg    | 147.5 MiB   |

</details>

### pdf-parse@2.4.5

> **Warning:** Potential memory leak detected: continuous growth of 0.41 MB/run.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 180.91 MB   |
| Final RSS     | 187.63 MB   |
| Peak RSS      | 187.63 MB   |
| Total Growth  | 6.72 MB     |
| Growth Rate   | 0.41 MB/run |
| Early Avg RSS | 184.34 MB   |
| Late Avg RSS  | 187.63 MB   |
| Late vs Early | 3.29 MB     |
| Docker Peak   | 147.2 MiB   |
| Docker Avg    | 139.12 MiB  |

</details>

### pdf2pic@3.2.0

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 86.01 MB    |
| Final RSS     | 87.04 MB    |
| Peak RSS      | 87.04 MB    |
| Total Growth  | 1.03 MB     |
| Growth Rate   | 0.06 MB/run |
| Early Avg RSS | 86.14 MB    |
| Late Avg RSS  | 87.04 MB    |
| Late vs Early | 0.9 MB      |
| Docker Peak   | 260.4 MiB   |
| Docker Avg    | 213.4 MiB   |

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
