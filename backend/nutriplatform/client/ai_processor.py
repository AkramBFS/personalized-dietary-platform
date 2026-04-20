import requests
import base64
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


AI_SERVICE_URL = settings.AI_SERVICE_URL


def process_ai_image(image_file) -> dict:
    try:
        image_file.seek(0)

        response = requests.post(
            f"{AI_SERVICE_URL}/segment?visualize=true",
            files={"file": (image_file.name, image_file, image_file.content_type)},
            timeout=30
        )
        response.raise_for_status()

        # ── Fix: explicitly parse JSON ─────────────────────────────────────────
        data = response.json()

        # Verify it's actually a dict
        if not isinstance(data, dict):
            raise Exception(f"Unexpected response from AI service: {type(data)}")

    except requests.exceptions.ConnectionError:
        raise Exception("AI service is not running. Start FastAPI on port 8001.")
    except requests.exceptions.Timeout:
        raise Exception("AI service timed out.")
    except requests.exceptions.HTTPError as e:
        raise Exception(f"AI service HTTP error: {str(e)}")
    except ValueError as e:
        raise Exception(f"AI service returned invalid JSON: {str(e)}")

    ingredients = data.get('ingredients', [])
    nutrition   = data.get('nutrition', {})
    visual_b64  = data.get('visual', None)

    # ── Debug print to see what FastAPI actually returned ──────────────────────
    print("DEBUG AI response keys:", list(data.keys()))
    print("DEBUG ingredients count:", len(ingredients))
    print("DEBUG nutrition type:", type(nutrition))

    # Handle nutrition being a dict or string
    if isinstance(nutrition, str):
        import json
        try:
            nutrition = json.loads(nutrition)
        except Exception:
            nutrition = {}

    nutrition_items = []
    if isinstance(nutrition, dict):
        nutrition_items = nutrition.get('items', [])
    elif isinstance(nutrition, list):
        nutrition_items = nutrition

    ai_raw_prediction = {
        "predictions": [
            {
                "label":       item.get('ingredient', ''),
                "mass_grams":  item.get('estimated_mass_g', 0),
                "confidence":  item.get('confidence', 0),
                "bbox":        item.get('bbox', []),
                "mask_pixels": item.get('mask_pixels', 0),
            }
            for item in ingredients
        ],
        "nutrition_raw":   nutrition_items,
        "num_ingredients": data.get('num_ingredients', 0),
    }

    return {
        "ai_raw_prediction":      ai_raw_prediction,
        "segmented_image_base64": visual_b64,
        "ingredients":            ingredients,
        "nutrition_items":        nutrition_items,
    }


def save_segmented_image(client_id: int, log_id: int, base64_str: str) -> str:
    if not base64_str:
        return None

    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]

    try:
        image_data = base64.b64decode(base64_str)
        file_path  = f'ai_logs/segmented/{client_id}/log_{log_id}_segmented.jpg'
        saved_path = default_storage.save(
            file_path,
            ContentFile(image_data)
        )
        return saved_path
    except Exception as e:
        print(f"Warning: Could not save segmented image: {e}")
        return None


def aggregate_nutrition_from_ai(nutrition_items: list) -> dict:
    total_calories = 0.0
    total_protein  = 0.0
    total_carbs    = 0.0
    total_fats     = 0.0

    if not isinstance(nutrition_items, list):
        return {
            'total_calories': 0,
            'total_protein':  0,
            'total_carbs':    0,
            'total_fats':     0,
        }

    for item in nutrition_items:
        if not isinstance(item, dict):
            continue
        total_calories += float(item.get('calories', 0) or 0)
        total_protein  += float(item.get('protein_g', 0) or 0)
        total_carbs    += float(item.get('carbohydrates_total_g', 0) or 0)
        total_fats     += float(item.get('fat_total_g', 0) or 0)

    return {
        'total_calories': round(total_calories, 2),
        'total_protein':  round(total_protein, 2),
        'total_carbs':    round(total_carbs, 2),
        'total_fats':     round(total_fats, 2),
    }