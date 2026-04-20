import json


def safe_json(value):
    """
    Safely return JSON field whether stored as dict, list, or string.
    Prevents TypeError when PostgreSQL returns already-parsed JSON.
    """
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    return value