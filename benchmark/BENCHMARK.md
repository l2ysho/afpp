# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

### Performance

| Library          | Avg       | Median    | P95       | Min       | Max       |
| ---------------- | --------- | --------- | --------- | --------- | --------- |
| afpp@2.4.0       | 160.73 ms | 154.16 ms | 202.8 ms  | 152.21 ms | 202.8 ms  |
| afpp@2.4.0(auto) | 103.76 ms | 103.39 ms | 111.29 ms | 98.12 ms  | 111.29 ms |
| pdf-parse@2.4.5  | 248.58 ms | 245.66 ms | 264.77 ms | 240.92 ms | 264.77 ms |
| pdf2pic@3.2.0    | 121.35 ms | 121.71 ms | 131.2 ms  | 113.33 ms | 131.2 ms  |

### Memory (Node.js RSS)

| Library          | Initial RSS | Final RSS | Peak RSS  | Growth Rate | Leak Detected |
| ---------------- | ----------- | --------- | --------- | ----------- | ------------- |
| afpp@2.4.0       | 158.46 MB   | 166.27 MB | 166.27 MB | 0.2 MB/run  | No            |
| afpp@2.4.0(auto) | 199.38 MB   | 201.9 MB  | 201.9 MB  | 0.24 MB/run | Yes           |
| pdf-parse@2.4.5  | 180.85 MB   | 186 MB    | 186 MB    | 0.16 MB/run | No            |
| pdf2pic@3.2.0    | 86.14 MB    | 87.16 MB  | 87.16 MB  | 0.07 MB/run | No            |

### Memory (Docker Container)

| Library          | Peak      | Avg        | Samples |
| ---------------- | --------- | ---------- | ------- |
| afpp@2.4.0       | 109 MiB   | 101.52 MiB | 2       |
| afpp@2.4.0(auto) | 143.7 MiB | 143.7 MiB  | 1       |
| pdf-parse@2.4.5  | 147.1 MiB | 130.75 MiB | 4       |
| pdf2pic@3.2.0    | 178.5 MiB | 148.15 MiB | 2       |

## Environment

| Property | Value       |
| -------- | ----------- |
| Date     | 2026-02-01  |
| Runs     | 10          |
| Node     | v22.22.0    |
| Platform | linux/arm64 |
| CPUs     | 10          |
| Memory   | 7995 MB     |

## Detailed Results

### afpp@2.4.0

<details>
<summary>Memory details</summary>

| Metric        | Value      |
| ------------- | ---------- |
| Initial RSS   | 158.46 MB  |
| Final RSS     | 166.27 MB  |
| Peak RSS      | 166.27 MB  |
| Total Growth  | 7.81 MB    |
| Growth Rate   | 0.2 MB/run |
| Early Avg RSS | 164.6 MB   |
| Late Avg RSS  | 166.27 MB  |
| Late vs Early | 1.67 MB    |
| Docker Peak   | 109 MiB    |
| Docker Avg    | 101.52 MiB |

</details>

### afpp@2.4.0(auto)

> **Warning:** Potential memory leak detected: continuous growth of 0.24 MB/run.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 199.38 MB   |
| Final RSS     | 201.9 MB    |
| Peak RSS      | 201.9 MB    |
| Total Growth  | 2.52 MB     |
| Growth Rate   | 0.24 MB/run |
| Early Avg RSS | 199.5 MB    |
| Late Avg RSS  | 201.9 MB    |
| Late vs Early | 2.4 MB      |
| Docker Peak   | 143.7 MiB   |
| Docker Avg    | 143.7 MiB   |

</details>

### pdf-parse@2.4.5

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 180.85 MB   |
| Final RSS     | 186 MB      |
| Peak RSS      | 186 MB      |
| Total Growth  | 5.15 MB     |
| Growth Rate   | 0.16 MB/run |
| Early Avg RSS | 184.27 MB   |
| Late Avg RSS  | 186 MB      |
| Late vs Early | 1.73 MB     |
| Docker Peak   | 147.1 MiB   |
| Docker Avg    | 130.75 MiB  |

</details>

### pdf2pic@3.2.0

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 86.14 MB    |
| Final RSS     | 87.16 MB    |
| Peak RSS      | 87.16 MB    |
| Total Growth  | 1.02 MB     |
| Growth Rate   | 0.07 MB/run |
| Early Avg RSS | 86.27 MB    |
| Late Avg RSS  | 87.16 MB    |
| Late vs Early | 0.89 MB     |
| Docker Peak   | 178.5 MiB   |
| Docker Avg    | 148.15 MiB  |

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
