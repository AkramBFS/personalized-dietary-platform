import os
import io
import time
import unittest
import threading
from pathlib import Path
import sys

FOOD_API_DIR = Path(__file__).resolve().parent.parent
if str(FOOD_API_DIR) not in sys.path:
    sys.path.insert(0, str(FOOD_API_DIR))

from fastapi.testclient import TestClient
from app import app, MODEL_PATH

TEST_SECRET = "test-ai-secret-key-12345"
os.environ["AI_SERVICE_SECRET_KEY"] = TEST_SECRET


@unittest.skipUnless(MODEL_PATH.exists(), f"ONNX model file not found at {MODEL_PATH}; skipping model-backed tests.")
class TestAIServiceModel(unittest.TestCase):
    """
    Model-backed tests requiring the real ONNX model (best_foodinsseg.onnx).
    Runs in local environments and skipped automatically in CI.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.valid_headers = {"X-Internal-Secret": TEST_SECRET}
        cls.base_dir = FOOD_API_DIR
        cls.sample_image_path = cls.base_dir / "test_images" / "f1.jpg"
        # Trigger startup / lifespan
        cls.client.get("/health")

    def test_ready_endpoint_with_model(self):
        """Verify /ready returns 200 and operational stats when model is loaded."""
        response = self.client.get("/ready")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ready")
        self.assertEqual(data.get("classes"), 73)
        self.assertIn("active_inferences", data)
        self.assertIn("waiting_inferences", data)

    def test_segment_success_with_valid_image(self):
        """Verify /segment processes a valid food image and produces structured nutrition/detection data."""
        self.assertTrue(self.sample_image_path.exists(), f"Sample image {self.sample_image_path} missing")
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
        self.assertNotIn("nutrition", data, "Nutrition should be decoupled from AI service")
        self.assertIn("visual", data)
        self.assertTrue(data["visual"].startswith("data:image/jpeg;base64,"))

        # Validate ingredient structure
        if data["ingredients"]:
            first = data["ingredients"][0]
            self.assertIn("ingredient", first)
            self.assertIn("confidence", first)
            self.assertIn("estimated_mass_g", first)
            self.assertIn("bbox", first)
            self.assertNotIn("mask", first, "Binary mask array should be cleaned from JSON response")

    def test_segment_image_binary_success(self):
        """Verify /segment/image returns raw annotated binary JPEG response."""
        with open(self.sample_image_path, "rb") as f:
            img_bytes = f.read()

        response = self.client.post(
            "/segment/image",
            headers=self.valid_headers,
            files={"file": ("f1.jpg", img_bytes, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("content-type"), "image/jpeg")
        self.assertGreater(len(response.content), 1000)

    def test_concurrent_inference_health_check_latency(self):
        """
        Phase 3 Exit Gate:
        Concurrent load test demonstrating /health responds without being blocked
        during heavy CPU ONNX segmentation inference.
        """
        with open(self.sample_image_path, "rb") as f:
            img_bytes = f.read()

        inference_started = threading.Event()
        inference_done = threading.Event()
        inference_result = {}

        def run_inference():
            # Create a thread-local TestClient to avoid event-loop thread collision in httpx/anyio
            thread_client = TestClient(app)
            inference_started.set()
            resp = thread_client.post(
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
        print(f"\n[AI Concurrency Gate] Concurrent /health latency during inference: "
              f"min={min_latency:.2f}ms, avg={avg_latency:.2f}ms, count={len(health_latencies)}")

        # Verification: health checks respond smoothly under concurrent inference
        self.assertLess(min_latency, 25.0, f"Min health check latency {min_latency:.2f}ms must be < 25ms")
        self.assertLess(avg_latency, 60.0, f"Average health check latency {avg_latency:.2f}ms must be < 60ms")


if __name__ == "__main__":
    unittest.main()
