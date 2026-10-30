"""Measure SafeRoute's cache latency and refresh timings.

Usage (with the server running and backend/.env filled in):
    python scripts/benchmark.py [--base http://127.0.0.1:5050] [--requests 50]
"""

import argparse
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import sources  # noqa: E402
from config import Settings  # noqa: E402


def timed(fn):
    start = time.perf_counter()
    result = fn()
    return result, time.perf_counter() - start


def endpoint_latency(url: str, n: int) -> tuple[float, float, int, int]:
    session = requests.Session()
    session.get(url, timeout=30).raise_for_status()  # warm the cache
    samples = []
    size = wire = 0
    for _ in range(n):
        res, secs = timed(lambda: session.get(url, timeout=30))
        res.raise_for_status()
        size = len(res.content)                                  # after decompression
        wire = int(res.headers.get("Content-Length", size))      # bytes actually sent
        samples.append(secs * 1000)
    samples.sort()
    return statistics.median(samples), samples[int(len(samples) * 0.95) - 1], size, wire


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:5050")
    parser.add_argument("--requests", type=int, default=50)
    parser.add_argument("--runs", type=int, default=3, help="refresh runs to average")
    args = parser.parse_args()
    s = Settings()

    print(f"Cached endpoints ({args.requests} requests each)")
    for kind in ("fires", "earthquakes"):
        p50, p95, size, wire = endpoint_latency(f"{args.base}/api/hazards/{kind}", args.requests)
        print(f"  /api/hazards/{kind:<12} p50 {p50:6.1f} ms   p95 {p95:6.1f} ms   "
              f"{size / 1024:,.0f} KB JSON, {wire / 1024:,.0f} KB sent")

    fire_job = lambda: sources.fetch_fires(s.firms_map_key, s.firms_days, s.firms_min_frp)  # noqa: E731
    quake_job = lambda: sources.fetch_earthquakes(s.usgs_days)  # noqa: E731

    fires_t, quakes_t, both_t = [], [], []
    for _ in range(args.runs):
        fires_t.append(timed(fire_job)[1])
        quakes_t.append(timed(quake_job)[1])
        with ThreadPoolExecutor(max_workers=2) as pool:
            _, secs = timed(lambda: [f.result() for f in (pool.submit(fire_job), pool.submit(quake_job))])
        both_t.append(secs)

    f, q, b = (statistics.median(x) for x in (fires_t, quakes_t, both_t))
    print(f"\nUpstream refresh (median of {args.runs} runs)")
    print(f"  NASA FIRMS (2 satellites)   {f:5.2f} s")
    print(f"  USGS                        {q:5.2f} s")
    print(f"  Sequential total            {f + q:5.2f} s")
    print(f"  Parallel (as the worker does) {b:5.2f} s   ({(1 - b / (f + q)) * 100:.0f}% faster)")


if __name__ == "__main__":
    main()
