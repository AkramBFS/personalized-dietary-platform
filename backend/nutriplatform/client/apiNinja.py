import requests
from django.conf import settings


CALORIE_NINJAS_URL = 'https://api.calorieninjas.com/v1/nutrition'


def get_nutrition_data(ingredients: list) -> dict:
    headers = {
        'X-Api-Key': settings.CALORIE_NINJAS_KEY,
    }

    total_calories = 0.0
    total_protein  = 0.0
    total_carbs    = 0.0
    total_fats     = 0.0
    foods          = []

    for ingredient in ingredients:
        name       = ingredient['name']
        mass_grams = float(ingredient['mass_grams'])

        # Query without quantity — get per 100g data, then scale manually
        query = f"100g {name}"

        try:
            response = requests.get(
                CALORIE_NINJAS_URL,
                params={'query': query},
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            results = response.json().get('items', [])

        except requests.exceptions.Timeout:
            raise Exception(f"CalorieNinjas timed out for '{name}'.")
        except requests.exceptions.ConnectionError:
            raise Exception("Could not reach CalorieNinjas API.")
        except requests.exceptions.HTTPError as e:
            raise Exception(f"CalorieNinjas error: {str(e)}")

        if not results:
            foods.append({
                "name":      name,
                "mass_grams": mass_grams,
                "found":     False,
                "calories":  0,
                "protein_g": 0,
                "carbs_g":   0,
                "fat_g":     0,
            })
            continue

        # Get per-100g values from API response
        item         = results[0]
        per100_cal   = float(item.get('calories', 0) or 0)
        per100_prot  = float(item.get('protein_g', 0) or 0)
        per100_carbs = float(item.get('carbohydrates_total_g', 0) or 0)
        per100_fats  = float(item.get('fat_total_g', 0) or 0)

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
            "name":      name,
            "mass_grams": mass_grams,
            "found":     True,
            "calories":  cal,
            "protein_g": prot,
            "carbs_g":   carbs,
            "fat_g":     fats,
        })

    return {
        'total_calories': round(total_calories, 2),
        'total_protein':  round(total_protein, 2),
        'total_carbs':    round(total_carbs, 2),
        'total_fats':     round(total_fats, 2),
        'foods':          foods,
    }