1)meal plan navigation and marking day as done need to be checked, instead of the next button handling the marking as done the client should be able to navigate the next days without marking as done, the mark as done button should be seperate, 
Meal plan details show up with day NaN and breakfast lunch and dinner show up empty and missing the snacks and instrutctions and meal notes, suspected wrong interface fields in client/service.ts and wrong details card forms in (dashboards)/client/meal-plans/page.tsx , should be fixed to fetch render proper fields
example endpoint response for GET client/user-plans/{id}/content/
{
    "status": "success",
    "data": {
        "day_index": 2,
        "breakfast": {
            "name": "shakshuka",
            "notes": "eggs bacon gritts sausage",
            "calories": 200,
            "ingredients": []
        },
        "lunch": {
            "name": "tinga ",
            "notes": "dir brk",
            "calories": 20,
            "ingredients": []
        },
        "dinner": {
            "name": "l3cha rak fahm",
            "notes": "et3cha mt3rfch t3cha tani ana nkhdmlk l3cha ta3k? a7chm chwi",
            "calories": 200,
            "ingredients": []
        },
        "snacks": {
            "name": "dbr rask",
            "notes": "dbr rask",
            "calories": 20,
            "ingredients": []
        },
        "instructions": "tb3"
    }
}

2)explicit disclaimer about AI approximation needs to be added in calorie tracker UI (modal and card where you upload images)

3) Implement meal plan reviews and consultation reviews where the user can submit a review for a plan they have purchased in their dashboard and for a consultation they have had with a nutritionist in their dashboard after the consultation is finished, using the same endpoints,  the only difference is the item_type:

POST /reviews/ — Submit a review for a plan or consultation — Client Auth
Field	Type	Required	Description
item_type	string	Yes	plan or consultation
item_id	integer	Yes	ID of the reviewed item
rating	integer	Yes	1–5 stars
comment	string	No	Optional written review


4)Update nutritionist consultation management ui and API calls:

6.3 Consultations
GET /nutritionist/consultations/ — List all consultations — Nutritionist Auth
Field	Type	Required	Description
status	string	No	Filter: scheduled, finished, cancelled, notified
type	string	No	Filter: advice_only, plan_included, custom_plan_session

PATCH /nutritionist/consultations/{id}/zoom-link/ — Add Zoom link before the call — Nutritionist Auth
Field	Type	Required	Description
zoom_link	string	Yes	Valid Zoom or meeting URL
ℹ  Adding a zoom link triggers a notification to the client. Best practice: add link 5–10 minutes before the call.

PATCH /nutritionist/consultations/{id}/status/ — Update consultation status — Nutritionist Auth
Field	Type	Required	Description
status	string	Yes	notified, finished, or cancelled

in the nutritionist consultation page the nutritionist should have a ui button to mark a consultation as done and another button to add a zoom link for a consultation after a consultation is scheduled, this button should be disabled if the consultation is finished or cancelled or not scheduled, and when clicked it should open a modal to add the zoom link, and then a notification should be sent to the client with the zoom link. this zoom link should be shown in the client dashboard consultation card if the consultation is scheduled and the zoom link is added by the nutritionist.

5) integrate subsctiption purchase endpoint:
POST /lookup/client/subscriptions/purchase/

Field	Type	Required	Description
plan_type	string	Yes	monthly or yearly
amount_paid	float	Yes	Simulated payment amount
transaction_number	string	Yes	Simulated unique transaction reference
ℹ  Payment is simulated. Backend generates a receipt and sets subscription status to active. End date is calculated automatically based on plan_type.

example request:
{
        "plan_type": "monthly",
        "transaction_number": "2",
        "amount_paid": 25.99
}

example response:
{
    "status": "success",
    "data": {
        "id": 4,
        "plan_type": "monthly",
        "amount_paid": 25.99,
        "transaction_number": "2",
        "start_date": "2026-05-08T17:39:59.116495Z",
        "end_date": "2026-06-07T17:39:59.106496Z",
        "status": "active"
    }
}

//already fixed certification images opening a 404 no found nextjs router url
//prepended the backend origin and the /media/ prefix to the image path to ensure the browser requests the file from the Django server instead of the Next.js router, in /(dashboards)/admin/approvals/page.tsx may be relevant to similar image loading issues. 

6)Fix all pfp for profile pages and profile menu's in navbar component and user and nutritionist profile menus in dashboard layout header images returning 404 not found.

7) fix invoice details view modal layout