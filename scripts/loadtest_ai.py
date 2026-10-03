#!/usr/bin/env python3
"""
scripts/loadtest_ai.py

Concurrency and load testing harness for the AI calorie-estimation pipeline.
Tests concurrent image submissions while simultaneously probing server latency
to measure thread starvation, queueing delay, and error rates.
"""

import argparse
import io
import os
import sys
import time
import threading
import statistics
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

def parse_args():
    parser = argparse.ArgumentParser(description="NutriPlatform AI Pipeline Load Tester")
    parser.add_argument("--backend-url", default="http://127.0.0.1:8000", help="Base URL of Django backend")
    parser.add_argument("--ai-url", default="http://127.0.0.1:8001", help="Base URL of FastAPI AI service")
    parser.add_argument("--concurrency", type=int, default=20, help="Number of concurrent uploads")
    parser.add_argument("--probe-interval", type=float, default=0.2, help="Seconds between probe pings (default 0.2 = 5Hz)")
    parser.add_argument("--image", default="ai-service/food_api/test_images/f1.jpg", help="Path to sample meal image")
    parser.add_argument("--probe-path", default="/api/v1/health/live/", help="Path of health probe endpoint")
    parser.add_argument("--tokens-file", default=None, help="Path to JSON file with pre-generated tokens")
    parser.add_argument("--password", default="LoadTest123!", help="Password for loadtest users")
    parser.add_argument("--timeout", type=float, default=70.0, help="Timeout in seconds for submit requests")
    return parser.parse_args()

def login_user(backend_url, email, password):
    url = f"{backend_url.rstrip('/')}/api/v1/auth/login/"
    resp = requests.post(
        url,
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        token = (
            data.get("access")
            or data.get("data", {}).get("access")
            or data.get("data", {}).get("tokens", {}).get("access")
        )
        if token:
            return token
    raise RuntimeError(f"Failed to login user {email}: HTTP {resp.status_code} - {resp.text}")

def probe_single_ping(url, probe_results, timeout=5.0):
    t0 = time.perf_counter()
    status_code = None
    error_msg = None
    try:
        r = requests.get(url, timeout=timeout)
        status_code = r.status_code
    except Exception as e:
        error_msg = str(e)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    probe_results.append({
        "latency_ms": elapsed_ms,
        "status_code": status_code,
        "error": error_msg
    })


def run_probe_dispatcher(backend_url, probe_path, stop_event, probe_results, interval=0.2, timeout=5.0):
    url = f"{backend_url.rstrip('/')}{probe_path}"
    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = []
        next_tick = time.perf_counter()
        while not stop_event.is_set():
            futures.append(executor.submit(probe_single_ping, url, probe_results, timeout))
            next_tick += interval
            sleep_time = max(0.0, next_tick - time.perf_counter())
            time.sleep(sleep_time)
        # Wait for all launched in-flight probes to finish
        for f in futures:
            try:
                f.result()
            except Exception:
                pass

def submit_ai_image(backend_url, token, image_bytes, filename, timeout):
    url = f"{backend_url.rstrip('/')}/api/v1/client/calorie-tracker/ai/"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Requested-With": "XMLHttpRequest"
    }
    files = {
        "image": (filename, io.BytesIO(image_bytes), "image/jpeg")
    }
    data = {"meal_type": "lunch"}

    t0 = time.perf_counter()
    status_code = None
    resp_data = None
    error_msg = None
    try:
        r = requests.post(url, headers=headers, files=files, data=data, timeout=timeout)
        status_code = r.status_code
        try:
            resp_data = r.json()
        except Exception:
            resp_data = r.text
    except Exception as e:
        error_msg = str(e)

    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return {
        "latency_ms": elapsed_ms,
        "status_code": status_code,
        "response": resp_data,
        "error": error_msg
    }

def calculate_percentiles(latencies):
    if not latencies:
        return {"min": 0, "p50": 0, "p95": 0, "max": 0, "avg": 0}
    s = sorted(latencies)
    return {
        "min": s[0],
        "p50": statistics.median(s),
        "p95": s[int(len(s) * 0.95) - 1] if len(s) >= 20 else s[-1],
        "max": s[-1],
        "avg": statistics.mean(s)
    }

def main():
    args = parse_args()
    print("=" * 70)
    print("  NutriPlatform AI Calorie Pipeline Load Test")
    print(f"  Backend: {args.backend_url}")
    print(f"  Concurrency: {args.concurrency} concurrent submissions")
    print(f"  Image: {args.image}")
    print("=" * 70)

    # 1. Verify sample image
    image_path = Path(args.image)
    if not image_path.exists():
        print(f"[ERROR] Sample image not found at {args.image}")
        sys.exit(1)
    image_bytes = image_path.read_bytes()
    print(f"[OK] Sample image loaded: {len(image_bytes)} bytes")

    # 2. Login users or load pre-generated tokens
    tokens = []
    if args.tokens_file and os.path.exists(args.tokens_file):
        import json
        with open(args.tokens_file, "r", encoding="utf-8") as f:
            tdata = json.load(f)
            tokens = tdata.get("tokens", [])
        print(f"[OK] Loaded {len(tokens)} pre-generated tokens from {args.tokens_file}.")
        if len(tokens) < args.concurrency:
            print(f"[ERROR] Tokens file has {len(tokens)} tokens, but concurrency is {args.concurrency}.")
            sys.exit(1)
        tokens = tokens[:args.concurrency]
    else:
        print(f"[INFO] Logging in {args.concurrency} loadtest users...")
        for i in range(1, args.concurrency + 1):
            email = f"loadtest_user_{i}@nutriplatform.local"
            try:
                t = login_user(args.backend_url, email, args.password)
                tokens.append(t)
            except Exception as e:
                print(f"[ERROR] Could not log in {email}: {e}")
                print("Tip: Run `python manage.py seed_loadtest_users --count 20 --export-tokens tokens.json` first.")
                sys.exit(1)
        print(f"[OK] Successfully obtained tokens for {len(tokens)} users.")

    # 3. Start background probe
    probe_results = []
    stop_probe = threading.Event()
    probe_thread = threading.Thread(
        target=run_probe_dispatcher,
        args=(args.backend_url, args.probe_path, stop_probe, probe_results, args.probe_interval, 5.0)
    )
    probe_thread.start()
    print(f"[INFO] Liveness probe started at 5Hz on {args.probe_path}...")

    # 4. Trigger concurrent submissions
    print(f"[INFO] Starting concurrent submit of {args.concurrency} requests...")
    t_start = time.perf_counter()

    submit_results = []
    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [
            executor.submit(
                submit_ai_image,
                args.backend_url,
                tokens[i],
                image_bytes,
                image_path.name,
                args.timeout
            )
            for i in range(args.concurrency)
        ]
        for f in as_completed(futures):
            submit_results.append(f.result())

    wall_time_sec = time.perf_counter() - t_start
    stop_probe.set()
    probe_thread.join()

    # 5. Summarize Results
    submit_latencies = [r["latency_ms"] for r in submit_results]
    submit_stats = calculate_percentiles(submit_latencies)
    status_counts = {}
    errors_count = 0
    for r in submit_results:
        sc = r["status_code"] or "Timeout/Error"
        status_counts[sc] = status_counts.get(sc, 0) + 1
        if r["error"]:
            errors_count += 1

    probe_latencies = [p["latency_ms"] for p in probe_results]
    probe_stats = calculate_percentiles(probe_latencies)
    probe_errors = sum(1 for p in probe_results if p["error"] or p["status_code"] != 200)

    print("\n" + "=" * 70)
    print("  LOAD TEST RESULTS SUMMARY")
    print("=" * 70)
    print(f"Wall Time: {wall_time_sec:.2f} seconds")
    print("\n[AI Image Submission]")
    print(f"  Count: {len(submit_results)}")
    print(f"  Status Codes: {status_counts}")
    print(f"  Errors/Timeouts: {errors_count}")
    print(f"  Min Latency: {submit_stats['min']:.1f} ms")
    print(f"  p50 Latency: {submit_stats['p50']:.1f} ms ({submit_stats['p50']/1000:.2f} s)")
    print(f"  p95 Latency: {submit_stats['p95']:.1f} ms ({submit_stats['p95']/1000:.2f} s)")
    print(f"  Max Latency: {submit_stats['max']:.1f} ms ({submit_stats['max']/1000:.2f} s)")
    print(f"  Avg Latency: {submit_stats['avg']:.1f} ms ({submit_stats['avg']/1000:.2f} s)")

    print("\n[Background Liveness Probe Under Concurrent Load]")
    print(f"  Total Probe Requests: {len(probe_results)}")
    print(f"  Probe Errors: {probe_errors}")
    print(f"  Min Latency: {probe_stats['min']:.1f} ms")
    print(f"  p50 Latency: {probe_stats['p50']:.1f} ms")
    print(f"  p95 Latency: {probe_stats['p95']:.1f} ms")
    print(f"  Max Latency: {probe_stats['max']:.1f} ms")
    print(f"  Avg Latency: {probe_stats['avg']:.1f} ms")
    print("=" * 70)

if __name__ == "__main__":
    main()
