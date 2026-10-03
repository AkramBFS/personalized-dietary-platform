# app.py
# ── Single-model pipeline: YOLOv8l-seg ONNX (trained on FoodInsSeg, 73 classes)
import json
import os
import io
import time
import uuid
import hmac
import base64
import asyncio
from pathlib import Path
from urllib.parse import quote
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from typing import List, Optional

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv()  # fallback to parent/system env

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Security, Depends, status, Request
from fastapi.security import APIKeyHeader
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response

# ── Config & Environment ──────────────────────────────────────
MODEL_PATH_DEFAULT = BASE_DIR / "best_foodinsseg.onnx"
MODEL_PATH = Path(os.getenv("AI_MODEL_PATH", str(MODEL_PATH_DEFAULT)))

CAT_NAMES_PATH_DEFAULT = BASE_DIR / "cat_names.json"
CAT_NAMES_PATH = Path(os.getenv("AI_CAT_NAMES_PATH", str(CAT_NAMES_PATH_DEFAULT)))
if CAT_NAMES_PATH.exists():
    try:
        CAT_NAMES = json.loads(CAT_NAMES_PATH.read_text(encoding="utf-8"))
    except Exception:
        CAT_NAMES = []
else:
    CAT_NAMES = []

INPUT_SIZE = int(os.getenv("AI_INPUT_SIZE", "640"))
CONF_THRESH = float(os.getenv("AI_CONF_THRESH", "0.25"))
IOU_THRESH = float(os.getenv("AI_IOU_THRESH", "0.45"))
PLATE_DIAM_CM = 26.0
THICKNESS_CM = 1.5

# Resource limits & bounds
MAX_FILE_SIZE = int(os.getenv("AI_MAX_FILE_SIZE", str(10 * 1024 * 1024)))  # 10 MB default
MAX_PIXELS = int(os.getenv("AI_MAX_PIXELS", "40000000"))  # 40 Megapixels
WORK_MAX_SIDE = int(os.getenv("AI_WORK_MAX_SIDE", "1280"))  # Max side for intermediate processing

# Admission control limits
MAX_CONCURRENT_INFERENCES = int(os.getenv("AI_MAX_CONCURRENT_INFERENCES", "1"))
MAX_WAITING = int(os.getenv("AI_MAX_WAITING", "1"))
# Explicit thread count (do NOT derive from os.cpu_count(), containers report host cores).
# Default 3 intra-op threads matches the 3-core container quota (cpus: 3 in docker-compose.yml).
ORT_THREADS = max(1, int(os.getenv("AI_ONNX_INTRA_THREADS", os.getenv("AI_ORT_THREADS", "3"))))
ORT_INTER_THREADS = max(1, int(os.getenv("AI_ONNX_INTER_THREADS", "1")))
ALLOW_MISSING_MODEL = os.getenv("AI_ALLOW_MISSING_MODEL", "false").lower() in ("true", "1", "yes")

DENSITY = {
    "rice": 0.85, "chicken duck": 1.05, "steak": 1.05,
    "pork": 1.05, "lamb": 1.05, "fried meat": 1.05,
    "fish": 0.95, "shrimp": 0.90, "shellfish": 0.90,
    "bread": 0.35, "egg": 1.03, "tofu": 1.05,
    "noodles": 0.85, "pasta": 0.85,
    "default": 0.80
}

# ── USDA reference portion sizes (grams) ─────────────────────
PORTION_REFERENCE_G = {
    "rice":         150,
    "chicken duck": 175,
    "steak":        200,
    "pork":         175,
    "lamb":         175,
    "fried meat":   175,
    "fish":         175,
    "shrimp":       120,
    "shellfish":    120,
    "bread":        60,
    "egg":          55,
    "tofu":         150,
    "noodles":      180,
    "pasta":        180,
    "default":      150,
}

FULL_FRAME_MASS_G = 600

COLORS = [
    (255, 56,  56),  (255, 157, 151), (255, 112, 31),
    (255, 178, 29),  (207, 210, 49),  (72,  249, 10),
    (146, 204, 23),  (61,  219, 134), (26,  147, 52),
    (0,   212, 187), (44,  153, 168), (0,   194, 255),
    (52,  69,  147), (100, 115, 255), (0,   24,  236),
    (132, 56,  255), (82,  0,   133), (203, 56,  255),
    (255, 149, 200), (255, 55,  199),
]

# ── Authentication & Secret Management ────────────────────────
internal_header = APIKeyHeader(name="X-Internal-Secret", auto_error=False)


def get_configured_secrets() -> List[str]:
    raw = os.getenv("AI_SERVICE_SECRET_KEYS", "") or os.getenv("AI_SERVICE_SECRET_KEY", "")
    return [s.strip() for s in raw.split(",") if s.strip()]


async def require_internal_token(token: str = Security(internal_header)):
    secrets = get_configured_secrets()
    if not token or not any(hmac.compare_digest(token, s) for s in secrets):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized internal service access"
        )


# ── Admission Controller ─────────────────────────────────────
class AdmissionController:
    """
    Admission controller to prevent thread starvation and unbounded inference queuing.
    Rejects incoming requests with HTTP 503 + Retry-After if concurrency + waiting limits are exceeded.
    """
    def __init__(self, max_concurrent: int = 1, max_waiting: int = 1):
        self.max_concurrent = max(1, max_concurrent)
        self.max_waiting = max(0, max_waiting)
        self.active = 0
        self.waiting = 0
        self._lock = asyncio.Lock()
        self._sem = asyncio.Semaphore(self.max_concurrent)

    async def __aenter__(self):
        async with self._lock:
            if self.active >= self.max_concurrent and self.waiting >= self.max_waiting:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="AI service busy, inference queue full. Please retry shortly.",
                    headers={"Retry-After": "3"}
                )
            self.waiting += 1
        await self._sem.acquire()
        async with self._lock:
            self.waiting -= 1
            self.active += 1
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        async with self._lock:
            self.active -= 1
        self._sem.release()


def load_model(app: FastAPI) -> bool:
    if getattr(app.state, "session", None) is not None:
        return True
    if not MODEL_PATH.exists():
        if ALLOW_MISSING_MODEL:
            return False
        raise RuntimeError(
            f"FATAL: ONNX model file not found at {MODEL_PATH}. "
            "Refusing to run in production without model. "
            "Set AI_ALLOW_MISSING_MODEL=true only in CI/testing."
        )

    print(f"Loading model from {MODEL_PATH}...")
    sess_options = ort.SessionOptions()
    sess_options.intra_op_num_threads = ORT_THREADS
    sess_options.inter_op_num_threads = ORT_INTER_THREADS
    sess_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    try:
        sess_options.add_session_config_entry("session.intra_op.allow_spinning", "0")
    except Exception:
        pass

    available_providers = ort.get_available_providers()
    providers = ["CPUExecutionProvider"]
    if "CUDAExecutionProvider" in available_providers:
        providers.insert(0, "CUDAExecutionProvider")

    try:
        session = ort.InferenceSession(str(MODEL_PATH), sess_options=sess_options, providers=providers)
        app.state.session = session
        app.state.input_name = session.get_inputs()[0].name
        print(f"[INFO] ONNX model successfully loaded:")
        print(f"  Classes : {len(CAT_NAMES)}")
        print(f"  Input   : {app.state.input_name}")
        print(f"  Threads : intra={ORT_THREADS}, inter={ORT_INTER_THREADS}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to load ONNX model: {e}")
        app.state.session = None
        app.state.input_name = None
        return False


# ── Lifespan & App Setup ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    secrets = get_configured_secrets()
    if not secrets or any(len(s) < 16 for s in secrets):
        raise RuntimeError(
            "FATAL: AI service secret key is missing or invalid. "
            "Each secret key must be at least 16 characters long. "
            "Set AI_SERVICE_SECRET_KEY or AI_SERVICE_SECRET_KEYS."
        )

    # Initialize admission controller
    app.state.admission = AdmissionController(
        max_concurrent=MAX_CONCURRENT_INFERENCES,
        max_waiting=MAX_WAITING
    )

    # Load ONNX model if present
    if MODEL_PATH.exists():
        load_model(app)
    elif ALLOW_MISSING_MODEL:
        print(f"[WARN] Test mode enabled (AI_ALLOW_MISSING_MODEL=true). Running without ONNX model at {MODEL_PATH}.")
        app.state.session = None
        app.state.input_name = None
    else:
        raise RuntimeError(
            f"FATAL: ONNX model file not found at {MODEL_PATH}. "
            "Refusing to start AI service without model in production mode. "
            "Set AI_ALLOW_MISSING_MODEL=true only in CI/testing."
        )

    yield

    # Clean shutdown
    app.state.session = None


app = FastAPI(title="FoodInsSeg API", version="2.0", lifespan=lifespan)
app.state.session = None
app.state.input_name = None
app.state.admission = AdmissionController(MAX_CONCURRENT_INFERENCES, MAX_WAITING)


@app.middleware("http")
async def add_request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ── Payload & Image Bounds ───────────────────────────────────
async def read_bounded_image(file: UploadFile) -> bytes:
    contents = await file.read(MAX_FILE_SIZE + 1)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Uploaded image exceeds maximum allowable limit of {MAX_FILE_SIZE // (1024 * 1024)} MB."
        )
    return contents


def decode_bounded(contents: bytes) -> np.ndarray:
    """
    Safely validate and decode image bytes into a BGR numpy array.
    Protects against decompression bombs, memory exhaustion, and invalid files.
    """
    Image.MAX_IMAGE_PIXELS = MAX_PIXELS
    try:
        with Image.open(io.BytesIO(contents)) as img:
            if img.format not in ("JPEG", "PNG", "WEBP", "MPO"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported image format '{img.format}'. Allowed formats: JPEG, PNG, WEBP."
                )

            w, h = img.size
            if (w * h) > MAX_PIXELS:
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail=f"Image pixel count ({w}x{h}={w*h} pixels) exceeds allowable limit of {MAX_PIXELS} pixels."
                )

            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            # Downscale working copy if exceeding WORK_MAX_SIDE (1280)
            w, h = img.size
            if max(w, h) > WORK_MAX_SIDE:
                scale = WORK_MAX_SIDE / float(max(w, h))
                new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
                img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)

            img_rgb = img.convert("RGB")
            arr = np.array(img_rgb)
            return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    except HTTPException:
        raise
    except Image.DecompressionBombError as e:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Image rejected: potential decompression bomb ({e})."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image file: {e}"
        )


# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def preprocess(img_bgr: np.ndarray) -> np.ndarray:
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(img_rgb, (INPUT_SIZE, INPUT_SIZE))
    tensor = resized.astype(np.float32) / 255.0
    tensor = np.expand_dims(tensor.transpose(2, 0, 1), 0)
    return tensor


def nms(boxes, scores, iou_thresh):
    x1, y1, x2, y2 = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0, xx2 - xx1)
        h = np.maximum(0, yy2 - yy1)
        iou = (w * h) / (areas[i] + areas[order[1:]] - w * h + 1e-6)
        order = order[np.where(iou <= iou_thresh)[0] + 1]
    return keep


def estimate_mass(mask_pixels: int, img_hw: tuple, category: str) -> float:
    H, W = img_hw
    total_px = H * W
    fill_ratio = min(mask_pixels / total_px, 0.65)
    raw_mass = fill_ratio * FULL_FRAME_MASS_G
    ref = PORTION_REFERENCE_G.get(category, PORTION_REFERENCE_G["default"])
    mass = max(ref * 0.3, min(raw_mass, ref * 3.5))
    return round(mass, 1)


def postprocess(outputs, orig_hw: tuple, conf_threshold: float = CONF_THRESH) -> list:
    H, W = orig_hw
    nc = len(CAT_NAMES)

    pred = outputs[0][0].T  # (num_anchors, 4+nc+num_masks)
    protos = outputs[1][0]  # (num_masks, proto_h, proto_w)

    num_masks = protos.shape[0]
    proto_h, proto_w = protos.shape[1], protos.shape[2]

    boxes = pred[:, :4]
    scores = pred[:, 4:4 + nc]
    coeffs = pred[:, 4 + nc:4 + nc + num_masks]

    cls_ids = scores.argmax(axis=1)
    confs = scores.max(axis=1)

    keep_mask = confs > conf_threshold
    if not keep_mask.any():
        return []

    boxes = boxes[keep_mask]
    cls_ids = cls_ids[keep_mask]
    confs = confs[keep_mask]
    coeffs = coeffs[keep_mask]

    x1 = boxes[:, 0] - boxes[:, 2] / 2
    y1 = boxes[:, 1] - boxes[:, 3] / 2
    x2 = boxes[:, 0] + boxes[:, 2] / 2
    y2 = boxes[:, 1] + boxes[:, 3] / 2
    xyxy = np.stack([x1, y1, x2, y2], axis=1)

    keep = nms(xyxy, confs, IOU_THRESH)
    xyxy = xyxy[keep]
    cls_ids = cls_ids[keep]
    confs = confs[keep]
    coeffs = coeffs[keep]

    results = []
    for i in range(len(keep)):
        mask_proto = (coeffs[i] @ protos.reshape(num_masks, -1)).reshape(proto_h, proto_w)
        mask_proto = 1.0 / (1.0 + np.exp(-mask_proto))
        mask_full = cv2.resize(mask_proto, (W, H), interpolation=cv2.INTER_LINEAR)
        mask_bin = (mask_full > 0.5).astype(np.uint8)

        bx1 = max(0, int(xyxy[i, 0] / INPUT_SIZE * W))
        by1 = max(0, int(xyxy[i, 1] / INPUT_SIZE * H))
        bx2 = min(W, int(xyxy[i, 2] / INPUT_SIZE * W))
        by2 = min(H, int(xyxy[i, 3] / INPUT_SIZE * H))
        clip = np.zeros_like(mask_bin)
        clip[by1:by2, bx1:bx2] = 1
        mask_bin *= clip

        pixel_count = int(mask_bin.sum())
        category = CAT_NAMES[int(cls_ids[i])] if int(cls_ids[i]) < len(CAT_NAMES) else "food"
        mass_g = estimate_mass(pixel_count, (H, W), category)

        results.append({
            "ingredient": category,
            "confidence": round(float(confs[i]), 3),
            "mask_pixels": pixel_count,
            "estimated_mass_g": mass_g,
            "bbox": [bx1, by1, bx2, by2],
            "mask": mask_bin,
        })

    results.sort(key=lambda x: x["estimated_mass_g"], reverse=True)
    return results


def merge_duplicate_classes(results: list) -> list:
    merged: dict[str, dict] = {}
    for item in results:
        key = item["ingredient"]
        if key not in merged:
            merged[key] = dict(item)
        else:
            merged[key]["mask_pixels"] += item["mask_pixels"]
            merged[key]["estimated_mass_g"] += item["estimated_mass_g"]
            if item["confidence"] > merged[key]["confidence"]:
                merged[key]["bbox"] = item["bbox"]
                merged[key]["confidence"] = item["confidence"]
            if "mask" in merged[key] and "mask" in item:
                merged[key]["mask"] = np.logical_or(merged[key]["mask"], item["mask"]).astype(np.uint8)

    out = list(merged.values())
    out.sort(key=lambda x: x["estimated_mass_g"], reverse=True)
    return out


def execute_onnx_inference(session, input_name: str, img_bgr: np.ndarray, conf_threshold: float = CONF_THRESH) -> list:
    if session is None:
        raise RuntimeError("ONNX inference session is not initialized.")
    orig_hw = img_bgr.shape[:2]
    tensor = preprocess(img_bgr)
    outputs = session.run(None, {input_name: tensor})
    ingredients = postprocess(outputs, orig_hw, conf_threshold)
    return merge_duplicate_classes(ingredients)


def build_nutrition_query(ingredients: list) -> str:
    parts = [f"{int(round(i['estimated_mass_g']))}g {i['ingredient']}" for i in ingredients]
    return " and ".join(parts)


def draw_visualization(img_bgr: np.ndarray, results: list) -> np.ndarray:
    vis = img_bgr.copy()
    for idx, item in enumerate(results):
        color = COLORS[idx % len(COLORS)]
        bx1, by1, bx2, by2 = item["bbox"]
        mask = item["mask"]

        if mask.sum() > 0:
            overlay = vis.copy()
            overlay[mask == 1] = color
            vis = cv2.addWeighted(overlay, 0.45, vis, 0.55, 0)
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(vis, contours, -1, color, 2)

        cv2.rectangle(vis, (bx1, by1), (bx2, by2), color, 2)
        label = f"{item['ingredient']} {item['estimated_mass_g']}g"
        (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        label_y = max(by1, lh + 14)
        cv2.rectangle(vis, (bx1, label_y - lh - 10), (bx1 + lw + 4, label_y), color, -1)
        cv2.putText(vis, label, (bx1 + 2, label_y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
        conf_text = f"{item['confidence']*100:.0f}%"
        cv2.putText(vis, conf_text, (bx2 - 55, by1 + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

    return vis


def clean_results(results: list) -> list:
    return [{k: v for k, v in r.items() if k != "mask"} for r in results]


# ══════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    """Lightweight, public liveness endpoint. Does not expose filesystem paths or trigger inference."""
    return {
        "status": "ok",
        "service": "food_api"
    }


@app.get("/ready")
async def ready(request: Request):
    """Readiness endpoint verifying model load status and admission queue state."""
    session = getattr(request.app.state, "session", None)
    if session is None and MODEL_PATH.exists():
        load_model(request.app)
        session = getattr(request.app.state, "session", None)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "not_ready", "error": "Model not loaded"}
        )
    adm = getattr(request.app.state, "admission", None)
    return {
        "status": "ready",
        "classes": len(CAT_NAMES),
        "input_size": INPUT_SIZE,
        "active_inferences": adm.active if adm else 0,
        "waiting_inferences": adm.waiting if adm else 0,
    }


@app.post("/segment", dependencies=[Depends(require_internal_token)])
async def segment(
    request: Request,
    file: UploadFile = File(...),
    visualize: bool = Query(False, description="Include annotated image as base64")
):
    req_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    t_start = time.perf_counter()

    contents = await read_bounded_image(file)
    img_bgr = decode_bounded(contents)
    t_decode = time.perf_counter()
    decode_ms = round((t_decode - t_start) * 1000, 2)

    session = getattr(request.app.state, "session", None)
    if session is None and MODEL_PATH.exists():
        load_model(request.app)
        session = getattr(request.app.state, "session", None)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded on this AI service instance."
        )

    admission = getattr(request.app.state, "admission", None)
    if admission is None:
        admission = AdmissionController(MAX_CONCURRENT_INFERENCES, MAX_WAITING)
        request.app.state.admission = admission

    async with admission:
        t_infer_start = time.perf_counter()
        input_name = getattr(request.app.state, "input_name", None) or session.get_inputs()[0].name
        ingredients = await run_in_threadpool(
            execute_onnx_inference, session, input_name, img_bgr, CONF_THRESH
        )
        t_infer_end = time.perf_counter()

    infer_ms = round((t_infer_end - t_infer_start) * 1000, 2)
    visualize_ms = 0.0

    response = {
        "num_ingredients": len(ingredients),
        "ingredients": clean_results(ingredients),
        "visual": None,
    }

    if visualize and ingredients:
        t_vis_start = time.perf_counter()
        vis = draw_visualization(img_bgr, ingredients)
        _, buf = cv2.imencode(".jpg", vis, [cv2.IMWRITE_JPEG_QUALITY, 90])
        response["visual"] = "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode()
        visualize_ms = round((time.perf_counter() - t_vis_start) * 1000, 2)

    total_ms = round((time.perf_counter() - t_start) * 1000, 2)

    print(
        json.dumps({
            "event": "ai_segment_complete",
            "request_id": req_id,
            "num_ingredients": len(ingredients),
            "decode_ms": decode_ms,
            "inference_ms": infer_ms,
            "visualize_ms": visualize_ms,
            "total_ms": total_ms
        })
    )

    return response


@app.post("/segment/image", dependencies=[Depends(require_internal_token)])
async def segment_image(request: Request, file: UploadFile = File(...)):
    """Returns the annotated image as a binary JPEG response."""
    contents = await read_bounded_image(file)
    img_bgr = decode_bounded(contents)

    session = getattr(request.app.state, "session", None)
    if session is None and MODEL_PATH.exists():
        load_model(request.app)
        session = getattr(request.app.state, "session", None)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded on this AI service instance."
        )

    admission = getattr(request.app.state, "admission", None)
    if admission is None:
        admission = AdmissionController(MAX_CONCURRENT_INFERENCES, MAX_WAITING)
        request.app.state.admission = admission

    async with admission:
        input_name = getattr(request.app.state, "input_name", None) or session.get_inputs()[0].name
        ingredients = await run_in_threadpool(
            execute_onnx_inference, session, input_name, img_bgr, CONF_THRESH
        )

    vis = draw_visualization(img_bgr, ingredients) if ingredients else img_bgr
    _, buf = cv2.imencode(".jpg", vis, [cv2.IMWRITE_JPEG_QUALITY, 90])

    return Response(
        content=buf.tobytes(),
        media_type="image/jpeg",
        headers={"Content-Disposition": "inline; filename=segmented.jpg"}
    )


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("AI_SERVICE_HOST", "127.0.0.1")
    port = int(os.environ.get("AI_SERVICE_PORT", "8001"))
    uvicorn.run(app, host=host, port=port)