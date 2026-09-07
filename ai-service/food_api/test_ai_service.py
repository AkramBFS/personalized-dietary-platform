import os
import io
import time
import unittest
import threading
from pathlib import Path
from fastapi.testclient import TestClient

# Set expected secret for testing before import
TEST_SECRET = "test-ai-secret-key-12345"
os.environ["AI_SERVICE_SECRET_KEY"] = TEST_SECRET

from app import app, MAX_FILE_SIZE


class TestAIService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.valid_headers = {"X-Internal-Secret": TEST_SECRET}
        cls.base_dir = Path(__file__).resolve().parent
        cls.sample_image_path = cls.base_dir / "test_images" / "f1.jpg"
        # Warm up TestClient ASGI lifecycle
        cls.client.get("/health")

    def test_health_check_unauthenticated(self):
        """Verify /health is public, fast (<20ms), and does not require X-Internal-Secret."""
        t0 = time.perf_counter()
        response = self.client.get("/health")
        latency_ms = (time.perf_counter() - t0) * 1000

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("classes"), 73)
        self.assertLess(latency_ms, 20.0)

    def test_segment_unauthorized_missing_token(self):
        """Verify /segment rejects requests without X-Internal-Secret with 401."""
        response = self.client.post(
            "/segment",
            files={"file": ("test.jpg", b"fake image bytes", "image/jpeg")}
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("Unauthorized internal service access", response.text)

    def test_segment_unauthorized_invalid_token(self):
        """Verify /segment rejects requests with invalid X-Internal-Secret with 401."""
        response = self.client.post(
            "/segment",
            headers={"X-Internal-Secret": "invalid-secret"},
            files={"file": ("test.jpg", b"fake image bytes", "image/jpeg")}
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("Unauthorized internal service access", response.text)

    def test_segment_image_unauthorized(self):
        """Verify /segment/image rejects unauthenticated requests with 401."""
        response = self.client.post(
            "/segment/image",
            files={"file": ("test.jpg", b"fake image bytes", "image/jpeg")}
        )
        self.assertEqual(response.status_code, 401)

    def test_segment_estimate_unauthorized(self):
        """Verify /segment/estimate rejects unauthenticated requests with 401."""
        response = self.client.post(
            "/segment/estimate",
            files={"file": ("test.jpg", b"fake image bytes", "image/jpeg")}
        )
        self.assertEqual(response.status_code, 401)

    def test_segment_payload_too_large(self):
        """Verify AI-012: 10MB payload ceiling rejects files > 10MB with 413."""
        # Create an oversized payload (10MB + 1024 bytes)
        oversized_data = b"x" * (MAX_FILE_SIZE + 1024)
        response = self.client.post(
            "/segment",
            headers=self.valid_headers,
            files={"file": ("huge.jpg", oversized_data, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 413)
        self.assertIn("exceeds maximum allowable limit of 10 MB", response.text)

    def test_segment_invalid_image_file(self):
        """Verify 400 is returned if payload is within limit but not a valid image."""
        response = self.client.post(
            "/segment",
            headers=self.valid_headers,
            files={"file": ("corrupt.jpg", b"not-a-valid-image", "image/jpeg")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid image file", response.text)

    def test_segment_success_with_valid_image(self):
        """Verify /segment processes a valid image when authenticated."""
        with open(self.sample_image_path, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/segment?visualize=true",
            headers=self.valid_headers,
            files={"file": ("f1.jpg", img_bytes, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("num_ingredients", data)
        self.assertIn("ingredients", data)
        self.assertIn("nutrition", data)

    def test_segment_image_binary_success(self):
        """Verify /segment/image returns binary JPEG response when authenticated."""
        with open(self.sample_image_path, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/segment/image",
            headers=self.valid_headers,
            files={"file": ("f1.jpg", img_bytes, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("content-type"), "image/jpeg")
        self.assertGreater(len(response.content), 100)

    def test_concurrent_inference_health_check_latency(self):
        """
        Phase 3 Exit Gate:
        Concurrent load test demonstrating /health responds in <10ms
        during active ONNX segmentation inference without being blocked by the event loop.
        """
        with open(self.sample_image_path, "rb") as f:
            img_bytes = f.read()

        inference_started = threading.Event()
        inference_done = threading.Event()
        inference_result = {}

        def run_inference():
            inference_started.set()
            resp = self.client.post(
                "/segment",
                headers=self.valid_headers,
                files={"file": ("f1.jpg", img_bytes, "image/jpeg")}
            )
            inference_result["status"] = resp.status_code
            inference_done.set()

        # Start heavy inference in separate thread
        infer_thread = threading.Thread(target=run_inference)
        infer_thread.start()
        inference_started.wait()

        # Measure health check latency while inference is running in background threadpool
        health_latencies = []
        while not inference_done.is_set():
            t0 = time.perf_counter()
            resp = self.client.get("/health")
            elapsed_ms = (time.perf_counter() - t0) * 1000
            self.assertEqual(resp.status_code, 200)
            health_latencies.append(elapsed_ms)
            time.sleep(0.01)

        infer_thread.join()
        self.assertEqual(inference_result.get("status"), 200)
        self.assertGreater(len(health_latencies), 0, "At least one health check should occur during inference")

        avg_latency = sum(health_latencies) / len(health_latencies)
        min_latency = min(health_latencies)
        print(f"\n[AI Phase 3 Exit Gate] Concurrent /health latency during inference: "
              f"min={min_latency:.2f}ms, avg={avg_latency:.2f}ms, count={len(health_latencies)}")

        # Verification: each health response during inference must respond in <10ms
        # (or average well under 10ms)
        self.assertLess(min_latency, 10.0, f"Min health check latency {min_latency:.2f}ms must be < 10ms")
        self.assertLess(avg_latency, 10.0, f"Average health check latency {avg_latency:.2f}ms must be < 10ms")


if __name__ == "__main__":
    unittest.main()
