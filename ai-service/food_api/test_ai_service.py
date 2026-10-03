"""
AI Service Unified Test Suite Runner.
Executes model-free security and API checks (for CI and local development)
and model-backed inference tests (skipped automatically when ONNX model is absent).
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Import test classes from tests package
from tests.test_api import TestAIServiceAPI
from tests.test_model import TestAIServiceModel

if __name__ == "__main__":
    unittest.main()
