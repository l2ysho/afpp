# Benchmark Results

Comparison of PDF processing libraries performance and memory usage.

## Quick Comparison

### Performance

| Library   | Avg       | Median    | P95       | Min       | Max       |
| --------- | --------- | --------- | --------- | --------- | --------- |
| afpp      | 156.76 ms | 155.97 ms | 161.48 ms | 153.71 ms | 161.48 ms |
| pdf-parse | 250.94 ms | 248 ms    | 266.24 ms | 244.77 ms | 266.24 ms |
| pdf2pic   | 281.69 ms | 281.47 ms | 287.3 ms  | 274.69 ms | 287.3 ms  |

### Memory

| Library   | Initial RSS | Final RSS | Peak RSS  | Growth Rate | Leak Detected |
| --------- | ----------- | --------- | --------- | ----------- | ------------- |
| afpp      | 127.3 MB    | 158.14 MB | 158.14 MB | 2.63 MB/run | Yes           |
| pdf-parse | 142.39 MB   | 185.04 MB | 185.2 MB  | 3.19 MB/run | Yes           |
| pdf2pic   | 107.57 MB   | 111.52 MB | 111.58 MB | 0.11 MB/run | Yes           |

## Environment

| Property | Value       |
| -------- | ----------- |
| Date     | 2026-01-30  |
| Runs     | 10          |
| Node     | v22.22.0    |
| Platform | linux/arm64 |
| CPUs     | 10          |
| Memory   | 7995 MB     |

## Detailed Results

### afpp

> **Warning:** Potential memory leak detected: continuous growth of 2.63 MB/run, late runs use 23.64 MB more than early runs.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 127.3 MB    |
| Final RSS     | 158.14 MB   |
| Peak RSS      | 158.14 MB   |
| Total Growth  | 30.84 MB    |
| Growth Rate   | 2.63 MB/run |
| Early Avg RSS | 134.5 MB    |
| Late Avg RSS  | 158.14 MB   |
| Late vs Early | 23.64 MB    |

</details>

### pdf-parse

> **Warning:** Potential memory leak detected: continuous growth of 3.19 MB/run, late runs use 27.28 MB more than early runs.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 142.39 MB   |
| Final RSS     | 185.04 MB   |
| Peak RSS      | 185.2 MB    |
| Total Growth  | 42.65 MB    |
| Growth Rate   | 3.19 MB/run |
| Early Avg RSS | 157.76 MB   |
| Late Avg RSS  | 185.04 MB   |
| Late vs Early | 27.28 MB    |

</details>

### pdf2pic

> **Warning:** Potential memory leak detected: continuous growth of 0.11 MB/run.

<details>
<summary>Memory details</summary>

| Metric        | Value       |
| ------------- | ----------- |
| Initial RSS   | 107.57 MB   |
| Final RSS     | 111.52 MB   |
| Peak RSS      | 111.58 MB   |
| Total Growth  | 3.95 MB     |
| Growth Rate   | 0.11 MB/run |
| Early Avg RSS | 109.58 MB   |
| Late Avg RSS  | 111.52 MB   |
| Late vs Early | 1.94 MB     |

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
- Memory measurements use RSS (Resident Set Size)
- Leak detection compares early vs late run memory usage
- GC is forced between runs (`--expose-gc`) for accurate measurements
