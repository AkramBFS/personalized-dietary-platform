# app.py
# ── Single-model pipeline: YOLOv8l-seg ONNX (trained on FoodInsSeg, 73 classes)
import json
import os
from dotenv import load_dotenv  # reads .env file into os.environ

load_dotenv()  # call this before any os.getenv() so the key is available

import cv2
import numpy as np
import onnxruntime as ort
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import Response, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
import httpx
from urllib.parse import quote
import base64

# ── Config ────────────────────────────────────────────────────
MODEL_PATH    = Path("best_foodinsseg.onnx")
CAT_NAMES     = json.loads(Path("cat_names.json").read_text())
INPUT_SIZE    = 640
CONF_THRESH   = 0.25
IOU_THRESH    = 0.45
PLATE_DIAM_CM = 26.0
THICKNESS_CM  = 1.5


DENSITY = {
    "rice": 0.85, "chicken duck": 1.05, "steak": 1.05,
    "pork": 1.05, "lamb": 1.05, "fried meat": 1.05,
    "fish": 0.95, "shrimp": 0.90, "shellfish": 0.90,
    "bread": 0.35, "egg": 1.03, "tofu": 1.05,
    "noodles": 0.85, "pasta": 0.85,
    "default": 0.80
}

# ── USDA reference portion sizes (grams) ─────────────────────
# Used to clamp mass estimates to a realistic range per food type.
# A detection can be 0.3x–3.5x the reference (very small to large portion).
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

# ── Full-plate reference mass (grams) ────────────────────────
# A single food item that fills the *entire* frame ≈ this mass.
# Calibrated for typical restaurant/plate photos shot ~40–60 cm away.
FULL_FRAME_MASS_G = 600

CALORIENINJAS_BASE_URL = "https://api.calorieninjas.com/v1/nutrition"
CALORIENINJAS_API_KEY  = os.getenv("CALORIENINJAS_API_KEY", "")

COLORS = [
    (255, 56,  56),  (255, 157, 151), (255, 112, 31),
    (255, 178, 29),  (207, 210, 49),  (72,  249, 10),
    (146, 204, 23),  (61,  219, 134), (26,  147, 52),
    (0,   212, 187), (44,  153, 168), (0,   194, 255),
    (52,  69,  147), (100, 115, 255), (0,   24,  236),
    (132, 56,  255), (82,  0,   133), (203, 56,  255),
    (255, 149, 200), (255, 55,  199),
]

# ── Load ONNX model ───────────────────────────────────────────
print("Loading model...")
session    = ort.InferenceSession(
    str(MODEL_PATH),
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
)
input_name = session.get_inputs()[0].name

print(f"✓ Model loaded")
print(f"  Classes  : {len(CAT_NAMES)}")
print(f"  Input    : {input_name}")
for o in session.get_outputs():
    print(f"  Output   : {o.name} {o.shape}")

app = FastAPI(title="FoodInsSeg API", version="2.0")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def preprocess(img_bgr: np.ndarray) -> np.ndarray:
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(img_rgb, (INPUT_SIZE, INPUT_SIZE))
    tensor  = resized.astype(np.float32) / 255.0
    tensor  = np.expand_dims(tensor.transpose(2, 0, 1), 0)
    return tensor


def nms(boxes, scores, iou_thresh):
    x1, y1, x2, y2 = boxes[:,0], boxes[:,1], boxes[:,2], boxes[:,3]
    areas  = (x2 - x1) * (y2 - y1)
    order  = scores.argsort()[::-1]
    keep   = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w   = np.maximum(0, xx2 - xx1)
        h   = np.maximum(0, yy2 - yy1)
        iou = (w * h) / (areas[i] + areas[order[1:]] - w * h + 1e-6)
        order = order[np.where(iou <= iou_thresh)[0] + 1]
    return keep


def estimate_mass(mask_pixels: int, img_hw: tuple, category: str) -> float:
    """
    Estimate food mass in grams from segmentation mask area.

    Strategy
    --------
    We compute the fraction of the total image area covered by this mask,
    then scale it against a calibrated full-frame reference mass (FULL_FRAME_MASS_G).
    The result is clamped to [0.3×, 3.5×] the USDA reference portion for the
    food category, preventing absurd values on very high- or low-resolution images.

    Why not the old plate-diameter formula?
    The old formula assumed the plate always fills 80 % of the image width
    (px_per_cm = W * 0.8 / PLATE_DIAM_CM). On a 3024×3024 phone photo this
    produces px_per_cm ≈ 93, which makes even a medium steak balloon to ~380 g
    before the CalorieNinjas decimal bug multiplies it by 10.
    """
    H, W        = img_hw
    total_px    = H * W

    # Fraction of the frame this food occupies. Hard-cap at 0.65:
    # even a single item shot very close up rarely covers more than that.
    fill_ratio  = min(mask_pixels / total_px, 0.65)

    raw_mass    = fill_ratio * FULL_FRAME_MASS_G

    # Clamp to a sensible range for this food type
    ref         = PORTION_REFERENCE_G.get(category, PORTION_REFERENCE_G["default"])
    mass        = max(ref * 0.3, min(raw_mass, ref * 3.5))

    return round(mass, 1)


def postprocess(outputs, orig_hw: tuple) -> list:
    """
    Decode YOLOv8l-seg ONNX outputs.
    Auto-detects number of mask coefficients from output shapes.
    output0: (1, 4+nc+num_masks, num_anchors)
    output1: (1, num_masks, proto_h, proto_w)
    """
    H, W   = orig_hw
    nc     = len(CAT_NAMES)

    pred   = outputs[0][0].T   # (num_anchors, 4+nc+num_masks)
    protos = outputs[1][0]     # (num_masks, proto_h, proto_w)

    # ── Auto-detect num_masks from proto shape ────────────────
    num_masks        = protos.shape[0]
    proto_h, proto_w = protos.shape[1], protos.shape[2]

    print(f"[debug] pred shape   : {pred.shape}")
    print(f"[debug] protos shape : {protos.shape}")
    print(f"[debug] num_masks    : {num_masks}  nc={nc}")

    # Slice correctly using detected num_masks
    boxes  = pred[:, :4]                       # cx, cy, w, h
    scores = pred[:, 4:4+nc]                   # class scores
    coeffs = pred[:, 4+nc:4+nc+num_masks]      # mask coefficients

    print(f"[debug] coeffs shape : {coeffs.shape}")

    cls_ids = scores.argmax(axis=1)
    confs   = scores.max(axis=1)

    # Confidence filter
    keep_mask = confs > CONF_THRESH
    if not keep_mask.any():
        return []

    boxes   = boxes[keep_mask]
    cls_ids = cls_ids[keep_mask]
    confs   = confs[keep_mask]
    coeffs  = coeffs[keep_mask]

    # cx,cy,w,h → x1,y1,x2,y2
    x1 = boxes[:, 0] - boxes[:, 2] / 2
    y1 = boxes[:, 1] - boxes[:, 3] / 2
    x2 = boxes[:, 0] + boxes[:, 2] / 2
    y2 = boxes[:, 1] + boxes[:, 3] / 2
    xyxy = np.stack([x1, y1, x2, y2], axis=1)

    keep    = nms(xyxy, confs, IOU_THRESH)
    xyxy    = xyxy[keep]
    cls_ids = cls_ids[keep]
    confs   = confs[keep]
    coeffs  = coeffs[keep]

    results = []
    for i in range(len(keep)):
        # coeffs[i]: (num_masks,)  protos: (num_masks, proto_h*proto_w)
        mask_proto = (coeffs[i] @ protos.reshape(num_masks, -1)
                      ).reshape(proto_h, proto_w)
        mask_proto = 1.0 / (1.0 + np.exp(-mask_proto))  # sigmoid
        mask_full  = cv2.resize(mask_proto, (W, H),
                                interpolation=cv2.INTER_LINEAR)
        mask_bin   = (mask_full > 0.5).astype(np.uint8)

        # Clip mask to predicted box
        bx1 = max(0, int(xyxy[i, 0] / INPUT_SIZE * W))
        by1 = max(0, int(xyxy[i, 1] / INPUT_SIZE * H))
        bx2 = min(W, int(xyxy[i, 2] / INPUT_SIZE * W))
        by2 = min(H, int(xyxy[i, 3] / INPUT_SIZE * H))
        clip               = np.zeros_like(mask_bin)
        clip[by1:by2, bx1:bx2] = 1
        mask_bin          *= clip

        pixel_count = int(mask_bin.sum())
        category    = CAT_NAMES[int(cls_ids[i])]
        mass_g      = estimate_mass(pixel_count, (H, W), category)

        results.append({
            "ingredient"      : category,
            "confidence"      : round(float(confs[i]), 3),
            "mask_pixels"     : pixel_count,
            "estimated_mass_g": mass_g,
            "bbox"            : [bx1, by1, bx2, by2],
            "mask"            : mask_bin,
        })

    results.sort(key=lambda x: x["estimated_mass_g"], reverse=True)
    return results


def merge_duplicate_classes(results: list) -> list:
    """
    Merge detections of the same food class into a single entry.

    When the model fires twice on the same food (e.g. two overlapping
    "steak" detections), sending both masses separately to CalorieNinjas
    causes inflated totals AND the NLP parser sometimes fuses adjacent
    same-name tokens.  We keep the highest-confidence detection as the
    representative entry and sum the pixel counts / masses.
    """
    merged: dict[str, dict] = {}
    for item in results:
        key = item["ingredient"]
        if key not in merged:
            merged[key] = dict(item)          # copy; mask handled separately
        else:
            # Accumulate pixels and mass; keep the better bounding box (higher conf)
            merged[key]["mask_pixels"]      += item["mask_pixels"]
            merged[key]["estimated_mass_g"] += item["estimated_mass_g"]
            if item["confidence"] > merged[key]["confidence"]:
                merged[key]["bbox"]       = item["bbox"]
                merged[key]["confidence"] = item["confidence"]
            # Merge binary masks via logical OR if both are present
            if "mask" in merged[key] and "mask" in item:
                merged[key]["mask"] = np.logical_or(
                    merged[key]["mask"], item["mask"]
                ).astype(np.uint8)

    out = list(merged.values())
    out.sort(key=lambda x: x["estimated_mass_g"], reverse=True)
    return out


def build_nutrition_query(ingredients: list) -> str:
    """
    Build the CalorieNinjas query string correctly.

    Two bugs fixed here:
    1. Floating-point mass with a trailing zero (e.g. "381.0g") is misread
       by CalorieNinjas as 10× the intended value (3810g).  Always send
       integer grams: int(mass) → "381g".
    2. Sending the same ingredient name twice in one query string causes
       the NLP parser to sometimes merge the two tokens into one giant
       serving.  merge_duplicate_classes() already collapses duplicates
       before we get here, but we also join with " and " instead of a
       plain space for extra clarity.
    """
    parts = [f"{int(round(i['estimated_mass_g']))}g {i['ingredient']}"
             for i in ingredients]
    return " and ".join(parts)


def draw_visualization(img_bgr: np.ndarray, results: list) -> np.ndarray:
    vis = img_bgr.copy()

    for idx, item in enumerate(results):
        color            = COLORS[idx % len(COLORS)]
        bx1,by1,bx2,by2 = item["bbox"]
        mask             = item["mask"]

        # Semi-transparent mask overlay
        if mask.sum() > 0:
            overlay          = vis.copy()
            overlay[mask==1] = color
            vis = cv2.addWeighted(overlay, 0.45, vis, 0.55, 0)

        # Mask contour
        if mask.sum() > 0:
            contours, _ = cv2.findContours(
                mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            cv2.drawContours(vis, contours, -1, color, 2)

        # Bounding box
        cv2.rectangle(vis, (bx1, by1), (bx2, by2), color, 2)

        # Label
        label       = f"{item['ingredient']} {item['estimated_mass_g']}g"
        (lw, lh), _ = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2
        )
        label_y = max(by1, lh + 14)
        cv2.rectangle(vis,
                      (bx1, label_y - lh - 10),
                      (bx1 + lw + 4, label_y),
                      color, -1)
        cv2.putText(vis, label, (bx1 + 2, label_y - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                    (255, 255, 255), 2)

        # Confidence badge
        conf_text = f"{item['confidence']*100:.0f}%"
        cv2.putText(vis, conf_text, (bx2 - 55, by1 + 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4,
                    (255, 255, 255), 1)

    return vis


def clean_results(results: list) -> list:
    return [{k: v for k, v in r.items() if k != "mask"} for r in results]


async def fetch_nutrition(ingredients: list) -> dict:
    if not CALORIENINJAS_API_KEY:
        return {"error": "CALORIENINJAS_API_KEY not set"}

    query   = build_nutrition_query(ingredients)   # ← uses the fixed builder
    url     = f"{CALORIENINJAS_BASE_URL}?query={quote(query)}"
    headers = {"X-Api-Key": CALORIENINJAS_API_KEY}

    print(f"[nutrition] query: {query!r}")         # helpful for debugging

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, headers=headers)
            return r.json() if r.status_code == 200 else \
                   {"error": f"API {r.status_code}: {r.text}"}
    except Exception as e:
        return {"error": str(e)}


# ══════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.get("/", response_class=HTMLResponse)
async def frontend(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/health")
async def health():
    return {
        "status"      : "ok",
        "model"       : str(MODEL_PATH),
        "classes"     : len(CAT_NAMES),
        "input_size"  : INPUT_SIZE,
        "nutrition_api": "CalorieNinjas"
                         if CALORIENINJAS_API_KEY else "Not configured",
    }


@app.post("/segment")
async def segment(
    file: UploadFile = File(...),
    visualize: bool  = Query(False,
                             description="Include annotated image as base64")
):
    contents = await file.read()
    nparr    = np.frombuffer(contents, np.uint8)
    img_bgr  = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise HTTPException(400, "Invalid image file")

    orig_hw     = img_bgr.shape[:2]
    tensor      = preprocess(img_bgr)
    outputs     = session.run(None, {input_name: tensor})
    ingredients = postprocess(outputs, orig_hw)
    ingredients = merge_duplicate_classes(ingredients)   # ← dedup before nutrition

    nutrition_data = {}
    if ingredients and CALORIENINJAS_API_KEY:
        nutrition_data = await fetch_nutrition(ingredients)

    response = {
        "num_ingredients": len(ingredients),
        "ingredients"    : clean_results(ingredients),
        "nutrition"      : nutrition_data,
    }

    if visualize and ingredients:
        vis    = draw_visualization(img_bgr, ingredients)
        _, buf = cv2.imencode(".jpg", vis,
                              [cv2.IMWRITE_JPEG_QUALITY, 90])
        response["visual"] = "data:image/jpeg;base64," + \
                              base64.b64encode(buf.tobytes()).decode()

    return response


@app.post("/segment/image")
async def segment_image(file: UploadFile = File(...)):
    """Returns the annotated image as a binary JPEG response."""
    contents = await file.read()
    nparr    = np.frombuffer(contents, np.uint8)
    img_bgr  = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise HTTPException(400, "Invalid image file")

    orig_hw     = img_bgr.shape[:2]
    tensor      = preprocess(img_bgr)
    outputs     = session.run(None, {input_name: tensor})
    ingredients = postprocess(outputs, orig_hw)
    ingredients = merge_duplicate_classes(ingredients)   # ← dedup

    vis    = draw_visualization(img_bgr, ingredients) \
             if ingredients else img_bgr
    _, buf = cv2.imencode(".jpg", vis,
                          [cv2.IMWRITE_JPEG_QUALITY, 90])

    return Response(
        content    = buf.tobytes(),
        media_type = "image/jpeg",
        headers    = {"Content-Disposition":
                      "inline; filename=segmented.jpg"}
    )


@app.post("/segment/save")
async def segment_save(
    file: UploadFile = File(...),
    output_path: str = Query("output/segmented.jpg")
):
    """Saves the annotated image to disk and returns JSON + path."""
    contents = await file.read()
    nparr    = np.frombuffer(contents, np.uint8)
    img_bgr  = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise HTTPException(400, "Invalid image file")

    orig_hw     = img_bgr.shape[:2]
    tensor      = preprocess(img_bgr)
    outputs     = session.run(None, {input_name: tensor})
    ingredients = postprocess(outputs, orig_hw)
    ingredients = merge_duplicate_classes(ingredients)   # ← dedup

    vis = draw_visualization(img_bgr, ingredients) \
          if ingredients else img_bgr

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(output_path, vis)

    return {
        "saved_to"       : output_path,
        "num_ingredients": len(ingredients),
        "ingredients"    : clean_results(ingredients),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)