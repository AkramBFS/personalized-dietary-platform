# app.py
import json
import os
import cv2
import numpy as np
import onnxruntime as ort
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse, Response, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from PIL import Image, ImageDraw, ImageFont
import io
import httpx
from urllib.parse import quote
import base64

# ── Config ─────────────────────────────────────────────────────────────────
MODEL_PATH    = Path("best_foodinsseg.onnx")
CAT_NAMES     = json.loads(Path("cat_names.json").read_text())
INPUT_SIZE    = 640
CONF_THRESH   = 0.25
IOU_THRESH    = 0.45
PLATE_DIAM_CM = 26.0
THICKNESS_CM  = 1.5

DENSITY = {
    "rice": 0.85, "chicken": 1.05, "beef": 1.05,
    "fish": 0.95, "bread": 0.35,  "egg": 1.03,
    "default": 0.80
}

# CalorieNinjas API config
CALORIENINJAS_BASE_URL = "https://api.calorieninjas.com/v1/nutrition"
CALORIENINJAS_API_KEY = os.getenv("CALORIENINJAS_API_KEY", "")

# Colors for visualization (BGR format for OpenCV)
COLORS = [
    (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0),
    (255, 0, 255), (0, 255, 255), (128, 0, 255), (255, 128, 0)
]

# ── Load ONNX model ─────────────────────────────────────────────────────────
session = ort.InferenceSession(
    str(MODEL_PATH),
    providers=["CPUExecutionProvider"]
)
input_name = session.get_inputs()[0].name
print(f"✓ Model loaded | {len(CAT_NAMES)} classes")

app = FastAPI(title="FoodInsSeg + CalorieNinjas API", version="1.0")

# ── Static files & templates ─────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ── Helpers ─────────────────────────────────────────────────────────────────
def preprocess(img_bgr: np.ndarray):
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
    px_per_cm = (W * 0.8) / PLATE_DIAM_CM
    area_cm2 = mask_pixels / (px_per_cm ** 2)
    volume_cm3 = area_cm2 * THICKNESS_CM
    density = DENSITY.get(category, DENSITY["default"])
    return round(volume_cm3 * density, 1)

def postprocess(outputs, orig_hw):
    H, W = orig_hw
    pred = outputs[0][0].T
    protos = outputs[1][0]

    boxes = pred[:, :4]
    scores = pred[:, 4:4+len(CAT_NAMES)]
    coeffs = pred[:, 4+len(CAT_NAMES):]

    cls_ids = scores.argmax(axis=1)
    confidences = scores.max(axis=1)

    mask_conf = confidences > CONF_THRESH
    boxes, cls_ids, confidences, coeffs = (
        boxes[mask_conf], cls_ids[mask_conf],
        confidences[mask_conf], coeffs[mask_conf]
    )

    if len(boxes) == 0:
        return []

    x1 = (boxes[:, 0] - boxes[:, 2] / 2)
    y1 = (boxes[:, 1] - boxes[:, 3] / 2)
    x2 = (boxes[:, 0] + boxes[:, 2] / 2)
    y2 = (boxes[:, 1] + boxes[:, 3] / 2)
    xyxy = np.stack([x1, y1, x2, y2], axis=1)

    keep = nms(xyxy, confidences, IOU_THRESH)
    xyxy = xyxy[keep]
    cls_ids = cls_ids[keep]
    confs = confidences[keep]
    coeffs = coeffs[keep]

    results = []
    proto_h, proto_w = protos.shape[1], protos.shape[2]

    for i in range(len(keep)):
        mask = (coeffs[i] @ protos.reshape(32, -1)).reshape(proto_h, proto_w)
        mask = 1 / (1 + np.exp(-mask))
        mask = cv2.resize(mask, (W, H))
        mask = (mask > 0.5).astype(np.uint8)

        bx1 = int(xyxy[i, 0] / INPUT_SIZE * W)
        by1 = int(xyxy[i, 1] / INPUT_SIZE * H)
        bx2 = int(xyxy[i, 2] / INPUT_SIZE * W)
        by2 = int(xyxy[i, 3] / INPUT_SIZE * H)
        mask[:by1, :] = 0
        mask[by2:, :] = 0
        mask[:, :bx1] = 0
        mask[:, bx2:] = 0

        pixel_count = int(mask.sum())
        category = CAT_NAMES[int(cls_ids[i])]
        mass_g = estimate_mass(pixel_count, (H, W), category)

        results.append({
            "ingredient": category,
            "confidence": round(float(confs[i]), 3),
            "mask_pixels": pixel_count,
            "estimated_mass_g": mass_g,
            "bbox": [bx1, by1, bx2, by2],
            "mask": mask  # Keep mask for visualization
        })

    results.sort(key=lambda x: x["estimated_mass_g"], reverse=True)
    return results

def draw_visualization(img_bgr: np.ndarray, results: list) -> np.ndarray:
    """Draw bounding boxes, masks, and labels on the image."""
    vis = img_bgr.copy()
    
    for idx, item in enumerate(results):
        color = COLORS[idx % len(COLORS)]
        bx1, by1, bx2, by2 = item["bbox"]
        mask = item["mask"]
        label = f"{item['ingredient']} {item['estimated_mass_g']}g"
        conf = item["confidence"]
        
        # Draw semi-transparent mask overlay
        mask_overlay = vis.copy()
        mask_overlay[mask == 1] = color
        vis = cv2.addWeighted(mask_overlay, 0.4, vis, 0.6, 0)
        
        # Draw bounding box
        cv2.rectangle(vis, (bx1, by1), (bx2, by2), color, 2)
        
        # Draw label background
        label_size, baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        cv2.rectangle(vis, (bx1, by1 - label_size[1] - 10), 
                     (bx1 + label_size[0], by1), color, -1)
        
        # Draw label text (white)
        cv2.putText(vis, label, (bx1, by1 - 5), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        # Draw confidence badge
        conf_text = f"{conf*100:.0f}%"
        cv2.putText(vis, conf_text, (bx2 - 50, by1 + 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    
    return vis

async def fetch_nutrition_from_calorieninjas(ingredients: list) -> dict:
    if not CALORIENINJAS_API_KEY:
        return {"error": "CALORIENINJAS_API_KEY not set"}
    
    query_parts = [f"{ing['estimated_mass_g']}g {ing['ingredient']}" for ing in ingredients]
    query = " ".join(query_parts)
    encoded_query = quote(query)
    url = f"{CALORIENINJAS_BASE_URL}?query={encoded_query}"
    headers = {"X-Api-Key": CALORIENINJAS_API_KEY}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return {"items": response.json()}
            else:
                return {"error": f"API Error {response.status_code}: {response.text}"}
    except Exception as e:
        return {"error": f"Request failed: {str(e)}"}

# ── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def frontend(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": str(MODEL_PATH),
        "classes": len(CAT_NAMES),
        "nutrition_api": "CalorieNinjas" if CALORIENINJAS_API_KEY else "Not configured"
    }

@app.post("/segment")
async def segment(
    file: UploadFile = File(...),
    visualize: bool = Query(False, description="Return annotated image as base64")
):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    orig_hw = img_bgr.shape[:2]
    tensor = preprocess(img_bgr)
    outputs = session.run(None, {input_name: tensor})
    ingredients = postprocess(outputs, orig_hw)

    nutrition_data = {}
    if ingredients and CALORIENINJAS_API_KEY:
        nutrition_data = await fetch_nutrition_from_calorieninjas(ingredients)

    # Remove mask arrays from response (not JSON serializable)
    ingredients_clean = [
        {k: v for k, v in ing.items() if k != "mask"} 
        for ing in ingredients
    ]

    result = {
        "num_ingredients": len(ingredients),
        "ingredients": ingredients_clean,
        "nutrition": nutrition_data,
    }

    # Add visual output if requested
    if visualize:
        vis_img = draw_visualization(img_bgr, ingredients)
        _, buffer = cv2.imencode(".jpg", vis_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        img_base64 = base64.b64encode(buffer.tobytes()).decode("utf-8")
        result["visual"] = f"data:image/jpeg;base64,{img_base64}"
    
    return result

@app.post("/segment/image")
async def segment_image(file: UploadFile = File(...)):
    """Endpoint that returns ONLY the annotated image (binary JPEG response)."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    orig_hw = img_bgr.shape[:2]
    tensor = preprocess(img_bgr)
    outputs = session.run(None, {input_name: tensor})
    ingredients = postprocess(outputs, orig_hw)
    
    vis_img = draw_visualization(img_bgr, ingredients)
    
    # Encode to JPEG
    _, buffer = cv2.imencode(".jpg", vis_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    
    return Response(
        content=buffer.tobytes(),
        media_type="image/jpeg",
        headers={"Content-Disposition": "inline; filename=segmented.jpg"}
    )

@app.post("/segment/save")
async def segment_save(
    file: UploadFile = File(...),
    output_path: str = Query("output/segmented.jpg", description="Where to save the annotated image")
):
    """Endpoint that saves the annotated image to disk and returns JSON + path."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    orig_hw = img_bgr.shape[:2]
    tensor = preprocess(img_bgr)
    outputs = session.run(None, {input_name: tensor})
    ingredients = postprocess(outputs, orig_hw)
    
    vis_img = draw_visualization(img_bgr, ingredients)
    
    # Create output directory if needed
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(output_path, vis_img)
    
    ingredients_clean = [
        {k: v for k, v in ing.items() if k != "mask"} 
        for ing in ingredients
    ]
    
    return {
        "saved_to": output_path,
        "num_ingredients": len(ingredients),
        "ingredients": ingredients_clean,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)