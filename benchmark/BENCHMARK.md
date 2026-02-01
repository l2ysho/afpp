# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

### Performance

| Library   | Avg       | Median    | P95       | Min       | Max       |
| --------- | --------- | --------- | --------- | --------- | --------- |
| afpp      | 150.39 ms | 148.51 ms | 159.54 ms | 145.31 ms | 159.54 ms |
| afpp-auto | -         | -         | -         | -         | -         |
| pdf-parse | 250.15 ms | 245.4 ms  | 275.7 ms  | 239.85 ms | 275.7 ms  |
| pdf2pic   | 130.39 ms | 128.69 ms | 168.57 ms | 113.18 ms | 168.57 ms |

### Memory (Node.js RSS)

| Library   | Initial RSS | Final RSS | Peak RSS  | Growth Rate | Leak Detected |
| --------- | ----------- | --------- | --------- | ----------- | ------------- |
| afpp      | 163.11 MB   | 168.64 MB | 168.64 MB | 0.17 MB/run | No            |
| afpp-auto | -           | -         | -         | -           | -             |
| pdf-parse | 181.35 MB   | 188.41 MB | 188.41 MB | 0.34 MB/run | Yes           |
| pdf2pic   | 86.05 MB    | 86.95 MB  | 86.95 MB  | 0.06 MB/run | No            |

### Memory (Docker Container)

| Library   | Peak      | Avg        | Samples |
| --------- | --------- | ---------- | ------- |
| afpp      | 211.5 MiB | 200.65 MiB | 2       |
| afpp-auto | -         | -          | -       |
| pdf-parse | 148.1 MiB | 139.96 MiB | 3       |
| pdf2pic   | 259 MiB   | 222.05 MiB | 2       |

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

### afpp

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 163.11 MB   |
| Final RSS     | 168.64 MB   |
| Peak RSS      | 168.64 MB   |
| Total Growth  | 5.53 MB     |
| Growth Rate   | 0.17 MB/run |
| Early Avg RSS | 166.99 MB   |
| Late Avg RSS  | 168.64 MB   |
| Late vs Early | 1.65 MB     |
| Docker Peak   | 211.5 MiB   |
| Docker Avg    | 200.65 MiB  |

</details>

### afpp-auto

_No results yet. Run `./benchmark/afpp-auto/run.sh` to generate._

### pdf-parse

> **Warning:** Potential memory leak detected: continuous growth of 0.34 MB/run.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 181.35 MB   |
| Final RSS     | 188.41 MB   |
| Peak RSS      | 188.41 MB   |
| Total Growth  | 7.06 MB     |
| Growth Rate   | 0.34 MB/run |
| Early Avg RSS | 184.92 MB   |
| Late Avg RSS  | 188.41 MB   |
| Late vs Early | 3.49 MB     |
| Docker Peak   | 148.1 MiB   |
| Docker Avg    | 139.96 MiB  |

</details>

### pdf2pic

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 86.05 MB    |
| Final RSS     | 86.95 MB    |
| Peak RSS      | 86.95 MB    |
| Total Growth  | 0.9 MB      |
| Growth Rate   | 0.06 MB/run |
| Early Avg RSS | 86.18 MB    |
| Late Avg RSS  | 86.95 MB    |
| Late vs Early | 0.77 MB     |
| Docker Peak   | 259 MiB     |
| Docker Avg    | 222.05 MiB  |

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
