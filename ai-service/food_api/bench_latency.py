#!/usr/bin/env python3
"""
ai-service/food_api/bench_latency.py

Micro-benchmark for local ONNX inference, preprocessing, bounded decoding,
and concurrent /health response latency.
"""

import os
import sys
import time
import statistics
import threading
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app import MODEL_PATH, decode_bounded, execute_onnx_inference, app
from fastapi.testclient import TestClient

def main():
    print("=" * 60)
    print("  FoodInsSeg ONNX Inference Latency Benchmark")
    print(f"  Model Path: {MODEL_PATH}")
    print("=" * 60)

    if not MODEL_PATH.exists():
        print(f"[SKIP] Model file not found at {MODEL_PATH}. Skipping local benchmark.")
        sys.exit(0)

    sample_img_path = BASE_DIR / "test_images" / "f1.jpg"
    if not sample_img_path.exists():
        print(f"[ERROR] Sample image not found at {sample_img_path}")
        sys.exit(1)

    raw_bytes = sample_img_path.read_bytes()
    print(f"[OK] Sample image loaded: {len(raw_bytes)} bytes")

    # 1. Benchmark Bounded Image Decode
    decode_times = []
    for _ in range(20):
        t0 = time.perf_counter()
        img_bgr = decode_bounded(raw_bytes)
        decode_times.append((time.perf_counter() - t0) * 1000.0)

    print("\n[Bounded Image Decoding Latency (20 runs)]")
    print(f"  Min: {min(decode_times):.2f} ms")
    print(f"  p50: {statistics.median(decode_times):.2f} ms")
    print(f"  Avg: {statistics.mean(decode_times):.2f} ms")
    print(f"  Max: {max(decode_times):.2f} ms")

    # 2. Benchmark ONNX Inference & Postprocessing
    client = TestClient(app)
    with client:
        session = getattr(app.state, "session", None)
        input_name = getattr(app.state, "input_name", None)
        if session is None:
            print("[ERROR] Session failed to initialize.")
            sys.exit(1)

        # Warmup
        print("\n[Warming up ONNX session...]")
        for _ in range(2):
            execute_onnx_inference(session, input_name, img_bgr)

        # Measured runs
        infer_times = []
        num_runs = 10
        print(f"[Running {num_runs} inference passes...]")
        for i in range(num_runs):
            t0 = time.perf_counter()
            results = execute_onnx_inference(session, input_name, img_bgr)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            infer_times.append(elapsed_ms)
            print(f"  Run {i+1}: {elapsed_ms:.1f} ms ({len(results)} ingredients detected)")

        print("\n[Inference + Postprocessing Latency Summary]")
        print(f"  Min: {min(infer_times):.1f} ms")
        print(f"  p50: {statistics.median(infer_times):.1f} ms")
        print(f"  Avg: {statistics.mean(infer_times):.1f} ms")
        print(f"  Max: {max(infer_times):.1f} ms")

        # 3. Concurrent Health Latency
        print("\n[Measuring /health latency during concurrent inference...]")
        infer_active = threading.Event()
        infer_done = threading.Event()
        health_latencies = []

        def worker():
            infer_active.set()
            for _ in range(5):
                execute_onnx_inference(session, input_name, img_bgr)
            infer_done.set()

        t = threading.Thread(target=worker)
        t.start()
        infer_active.wait()

        while not infer_done.is_set():
            t0 = time.perf_counter()
            r = client.get("/health")
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            health_latencies.append(elapsed_ms)
            time.sleep(0.01)

        t.join()
        if health_latencies:
            print(f"  Probes: {len(health_latencies)}")
            print(f"  Min:    {min(health_latencies):.2f} ms")
            print(f"  p50:    {statistics.median(health_latencies):.2f} ms")
            print(f"  Avg:    {statistics.mean(health_latencies):.2f} ms")
            print(f"  Max:    {max(health_latencies):.2f} ms")

    print("\n" + "=" * 60)
    print("  Benchmark Complete")
    print("=" * 60)

if __name__ == "__main__":
    main()
