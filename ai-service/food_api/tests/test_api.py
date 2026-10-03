import os
import io
import time
import unittest
import asyncio
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys

FOOD_API_DIR = Path(__file__).resolve().parent.parent
if str(FOOD_API_DIR) not in sys.path:
    sys.path.insert(0, str(FOOD_API_DIR))

from PIL import Image
from fastapi.testclient import TestClient

TEST_SECRET = "test-ai-secret-key-12345"
os.environ["AI_SERVICE_SECRET_KEY"] = TEST_SECRET
os.environ["AI_MAX_CONCURRENT_INFERENCES"] = "1"
os.environ["AI_MAX_WAITING"] = "1"
os.environ["AI_ALLOW_MISSING_MODEL"] = "true"

from app import app, MAX_FILE_SIZE, MAX_PIXELS, decode_bounded, AdmissionController


class TestAIServiceAPI(unittest.TestCase):
    """
    Model-free unit and security tests.
    These tests do NOT require best_foodinsseg.onnx and can safely execute in any CI environment.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.valid_headers = {"X-Internal-Secret": TEST_SECRET}

    def test_health_check_unauthenticated_and_minimal(self):
        """Verify /health is public, fast (<20ms), and does not leak internal file paths."""
        t0 = time.perf_counter()
        response = self.client.get("/health")
        latency_ms = (time.perf_counter() - t0) * 1000

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("service"), "food_api")
        # Ensure sensitive system details are not leaked
        self.assertNotIn("model", data)
        self.assertNotIn("classes", data)
        self.assertLess(latency_ms, 20.0)

    def test_request_id_header_propagation(self):
        """Verify X-Request-ID header is propagated or generated."""
        custom_id = "test-req-id-abcdef-1234"
        response = self.client.get("/health", headers={"X-Request-ID": custom_id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("X-Request-ID"), custom_id)

        # Also verify auto-generated ID when none provided
        response_auto = self.client.get("/health")
        self.assertIn("X-Request-ID", response_auto.headers)
        self.assertTrue(len(response_auto.headers["X-Request-ID"]) > 10)

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
            headers={"X-Internal-Secret": "invalid-secret-which-is-wrong"},
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

    def test_removed_segment_estimate_endpoint(self):
        """Verify /segment/estimate alias has been removed (returns 404)."""
        response = self.client.post(
            "/segment/estimate",
            headers=self.valid_headers,
            files={"file": ("test.jpg", b"fake image bytes", "image/jpeg")}
        )
        self.assertEqual(response.status_code, 404)

    def test_multi_secret_key_rotation(self):
        """Verify multiple comma-separated keys are supported for zero-downtime rotation."""
        dual_secrets = "old-secret-123456789,new-secret-987654321"
        with patch.dict(os.environ, {"AI_SERVICE_SECRET_KEYS": dual_secrets}):
            # Test old key
            r1 = self.client.post(
                "/segment",
                headers={"X-Internal-Secret": "old-secret-123456789"},
                files={"file": ("test.jpg", b"fake image bytes", "image/jpeg")}
            )
            # Not 401 (might be 400 or 503 depending on model state)
            self.assertNotEqual(r1.status_code, 401)

            # Test new key
            r2 = self.client.post(
                "/segment",
                headers={"X-Internal-Secret": "new-secret-987654321"},
                files={"file": ("test.jpg", b"fake image bytes", "image/jpeg")}
            )
            self.assertNotEqual(r2.status_code, 401)

    def test_segment_payload_too_large(self):
        """Verify 10MB payload ceiling rejects files > 10MB with 413."""
        oversized_data = b"x" * (MAX_FILE_SIZE + 1024)
        response = self.client.post(
            "/segment",
            headers=self.valid_headers,
            files={"file": ("huge.jpg", oversized_data, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 413)
        self.assertIn("exceeds maximum allowable limit", response.text)

    def test_segment_invalid_image_file(self):
        """Verify 400 is returned if payload is within limit but not a valid image."""
        response = self.client.post(
            "/segment",
            headers=self.valid_headers,
            files={"file": ("corrupt.jpg", b"not-a-valid-image", "image/jpeg")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid image file", response.text)

    def test_decompression_bomb_rejected(self):
        """Verify images exceeding MAX_PIXELS (40M pixels) are rejected with 413."""
        buf = io.BytesIO()
        # 7000 x 7000 = 49,000,000 pixels > 40,000,000 MAX_PIXELS
        img = Image.new("RGB", (7000, 7000), color="black")
        img.save(buf, format="JPEG")
        bomb_bytes = buf.getvalue()

        response = self.client.post(
            "/segment",
            headers=self.valid_headers,
            files={"file": ("bomb.jpg", bomb_bytes, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 413)
        self.assertIn("exceeds allowable limit", response.text)

    def test_decode_bounded_resizes_large_working_dimension(self):
        """Verify decode_bounded downscales images exceeding WORK_MAX_SIDE (1280)."""
        buf = io.BytesIO()
        img = Image.new("RGB", (2000, 1500), color="blue")
        img.save(buf, format="JPEG")
        img_bytes = buf.getvalue()

        bgr = decode_bounded(img_bytes)
        h, w = bgr.shape[:2]
        self.assertLessEqual(max(h, w), 1280)

    def test_admission_controller_rejection(self):
        """
        Verify admission control rejects requests with 503 and Retry-After
        when active concurrency and waiting queue are exhausted.
        """
        controller = AdmissionController(max_concurrent=1, max_waiting=1)

        async def run_test():
            # Acquire slot 1 (active = 1, waiting = 0)
            await controller.__aenter__()

            # Start slot 2 in background (will block and become waiting = 1)
            slot2_entered = asyncio.Event()

            async def enter_slot2():
                async with controller:
                    slot2_entered.set()

            task2 = asyncio.create_task(enter_slot2())
            # Give task2 a chance to enter lock and wait
            await asyncio.sleep(0.01)

            self.assertEqual(controller.active, 1)
            self.assertEqual(controller.waiting, 1)

            # Slot 3 should be rejected with 503 immediately
            with self.assertRaises(Exception) as ctx:
                await controller.__aenter__()
            self.assertEqual(ctx.exception.status_code, 503)
            self.assertEqual(ctx.exception.headers.get("Retry-After"), "3")

            # Release slot 1, slot 2 should proceed
            await controller.__aexit__(None, None, None)
            await task2
            self.assertEqual(controller.active, 0)

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
