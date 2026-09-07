import unittest
from unittest.mock import patch, MagicMock
from io import BytesIO
from django.conf import settings
from client.ai_processor import process_ai_image


class AIProcessorIntegrationTestCase(unittest.TestCase):
    @patch("client.ai_processor.requests.post")
    def test_process_ai_image_passes_internal_secret_header(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "num_ingredients": 1,
            "ingredients": [{"ingredient": "apple", "estimated_mass_g": 150}],
            "nutrition": {"items": [{"name": "apple", "calories": 95}]},
            "visual": "data:image/jpeg;base64,fake"
        }
        mock_post.return_value = mock_response

        fake_file = BytesIO(b"fake image data")
        fake_file.name = "test_apple.jpg"
        fake_file.content_type = "image/jpeg"

        result = process_ai_image(fake_file)

        self.assertIn("ai_raw_prediction", result)
        self.assertEqual(result["ingredients"][0]["ingredient"], "apple")

        mock_post.assert_called_once()
        _, kwargs = mock_post.call_args
        headers = kwargs.get("headers", {})
        self.assertIn("X-Internal-Secret", headers)
        self.assertEqual(headers["X-Internal-Secret"], settings.AI_SERVICE_SECRET_KEY)
