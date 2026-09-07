import requests
from django.conf import settings


CALORIE_NINJAS_URL = 'https://api.calorieninjas.com/v1/nutrition'


def get_nutrition_data(ingredients: list) -> dict:
    if not ingredients:
        return {
            'total_calories': 0.0,
            'total_protein':  0.0,
            'total_carbs':    0.0,
            'total_fats':     0.0,
            'foods':          [],
        }

    headers = {
        'X-Api-Key': settings.CALORIE_NINJAS_KEY,
    }

    # Validate mass_grams first
    for ingredient in ingredients:
        mass_grams = float(ingredient.get('mass_grams', 0))
        if mass_grams <= 0:
            raise ValueError("mass_grams must be strictly positive")

    # Consolidate food names into a single batch query (BE-016)
    valid_items = [item for item in ingredients if item.get('name')]
    batch_query = ", ".join([f"100g {item['name'].strip()}" for item in valid_items])

    results = []
    if batch_query:
        try:
            response = requests.get(
                CALORIE_NINJAS_URL,
                params={'query': batch_query},
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            results = response.json().get('items', [])
        except requests.exceptions.Timeout:
            raise Exception("CalorieNinjas timed out for batch query.")
        except requests.exceptions.ConnectionError:
            raise Exception("Could not reach CalorieNinjas API.")
        except requests.exceptions.HTTPError as e:
            raise Exception(f"CalorieNinjas error: {str(e)}")

    total_calories = 0.0
    total_protein  = 0.0
    total_carbs    = 0.0
    total_fats     = 0.0
    foods          = []

    for ingredient in ingredients:
        name       = ingredient.get('name', '')
        mass_grams = float(ingredient['mass_grams'])
        clean_name = name.strip().lower()

        # Find matching item from results
        matched_item = None
        for item in results:
            item_name = str(item.get('name', '')).strip().lower()
            if item_name == clean_name:
                matched_item = item
                break

        if not matched_item:
            for item in results:
                item_name = str(item.get('name', '')).strip().lower()
                if item_name and (item_name in clean_name or clean_name in item_name):
                    matched_item = item
                    break

        if not matched_item:
            foods.append({
                "name":       name,
                "mass_grams": mass_grams,
                "found":      False,
                "calories":   0,
                "protein_g":  0,
                "carbs_g":    0,
                "fat_g":      0,
            })
            continue

        per100_cal   = float(matched_item.get('calories', 0) or 0)
        per100_prot  = float(matched_item.get('protein_g', 0) or 0)
        per100_carbs = float(matched_item.get('carbohydrates_total_g', 0) or 0)
        per100_fats  = float(matched_item.get('fat_total_g', 0) or 0)

        # Scale to actual mass_grams
        scale        = mass_grams / 100.0
        cal          = round(per100_cal   * scale, 2)
        prot         = round(per100_prot  * scale, 2)
        carbs        = round(per100_carbs * scale, 2)
        fats         = round(per100_fats  * scale, 2)

        total_calories += cal
        total_protein  += prot
        total_carbs    += carbs
        total_fats     += fats

        foods.append({
            "name":       name,
            "mass_grams": mass_grams,
            "found":      True,
            "calories":   cal,
            "protein_g":  prot,
            "carbs_g":    carbs,
            "fat_g":      fats,
        })

    return {
        'total_calories': round(total_calories, 2),
        'total_protein':  round(total_protein, 2),
        'total_carbs':    round(total_carbs, 2),
        'total_fats':     round(total_fats, 2),
        'foods':          foods,
    }