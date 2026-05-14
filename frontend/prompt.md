This GET request retrieves a list of scheduled consultations for the authenticated client.

Endpoint & Method
URL: http://127.0.0.1:8000/api/v1/client/consultations/
Method: GET
Headers:
Authorization: Uses a credential (Redacted) to identify the client.
CORS: Configured for local development, allowing the http://localhost:3000 origin.
Content: Requests and receives application/json.
Response
Status: 200 OK
Payload: Returns a success status and an array containing one consultation record. It details a scheduled appointment with nutritionist "7lib croissant" (ID: 8) on 2026-05-14 from 09:00 to 10:00.

   {
    "status": "success",
    "data": [
        {
            "id": 1,
            "nutritionist_id": 8,
            "nutritionist_username": "7lib croissant",
            "appointment_date": "2026-05-14",
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "status": "scheduled",
            "consultation_type": "advice_only",
            "zoom_link": null,
            "price_paid": 1000.0,
            "is_free_from_plan": false,
            "created_at": "2026-05-14T17:57:14.304426Z"
        }
    ]
}

Issue: The ui on the page shows : "No past or upcoming consultations found." Despite endpoint returning the above response. Investigate the issue, if the issue is not immediately apparent, add console.log() lines in correct placements for debug and finish and allow me to get back to you on what they show on the console.  Make sure the zoom link can be returned as null in the response and that it handles it by showing "zoom link yet to be provided" or use better wording in the card ui.
While you're at it, find the right place ui wise to add a "Book consultation" CTA for the user to go to /consultations if they don't have a scheduled consultation. 