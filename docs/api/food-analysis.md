# Food Analysis API

## POST /food-analyses

Upload a food image and receive an approximate calorie estimation.

### Request
- multipart/form-data
- image file

### Response
```json
{
  "id": "uuid",
  "status": "completed",
  "items": [],
  "totalCalories": 0
}
Notes
Results are approximate

Accuracy depends on image quality