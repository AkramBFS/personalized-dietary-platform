1) plan marketplace integration, plan marketplace has no working filter, no search, no working sort by price, no working pagination, everything is just ui.
The ui is good and needs only to be functional, if there us some current ui that disagrees with the API response fields, you should update the ui to match the API response fields, if there is some extra ui that is not needed, you should as me what do about it in your implementation plan.

You will be implementing the plan marketplace integration with the following API details. Check the mentioned files for any additional information on the already used aproaches for API integration in this project.

API details for the API request implementation:
Browse Plans
GET /marketplace/plans/ — List all approved public plans — No Auth required
Field	Type	Required	Description
page	integer	No	Page number
page_size	integer	No	Items per page (default 10, max 50)
specialization_id	integer	No	Filter by nutritionist specialization
min_price	float	No	Minimum price filter
max_price	float	No	Maximum price filter
sort	string	No	rating_desc, price_asc, price_desc, newest

example response:
{
    "status": "success",
    "data": {
        "count": 3,
        "page": 1,
        "results": [
            {
                "id": 4,
                "title": "Morrocan dish plan (test)",
                "description": "A beginner-friendly keto adaptation week.",
                "plan_type": "public-predefined",
                "status": "approved",
                "price": 60.0,
                "duration_days": 7,
                "free_consultations_per_week": 0,
                "rating_avg": 0.0,
                "cover_image_url": "default_plan_cover.jpg",
                "nutritionist_id": 6,
                "nutritionist_username": "Nutritest",
                "specialization_name": "Sports Nutrition",
                "created_at": "2026-05-05T21:09:39.352835Z"
            },
            {
                "id": 3,
                "title": "Fat Loss Plan",
                "description": "خطة غذائية لخسارة الوزن",
                "plan_type": "public-predefined",
                "status": "approved",
                "price": 49.99,
                "duration_days": 30,
                "free_consultations_per_week": 1,
                "rating_avg": 5.0,
                "cover_image_url": "plans/covers/3_téléchargement_0oNCoX9.jpg",
                "nutritionist_id": 3,
                "nutritionist_username": "nutri95",
                "specialization_name": "Weight Management",
                "created_at": "2026-04-14T15:31:10.255242Z"
            },
            {
                "id": 2,
                "title": "Fat Loss Plan",
                "description": "خطة غذائية لخسارة الوزن",
                "plan_type": "public-predefined",
                "status": "approved",
                "price": 49.99,
                "duration_days": 30,
                "free_consultations_per_week": 1,
                "rating_avg": 0.0,
                "cover_image_url": "plans/covers/3_téléchargement_zYGMGMm.jpg",
                "nutritionist_id": 3,
                "nutritionist_username": "nutri95",
                "specialization_name": "Weight Management",
                "created_at": "2026-04-14T15:20:51.422529Z"
            }
        ]
    }
}



GET /marketplace/plans/{id}/ — Get single plan detail — No Auth required

example response:
{
    "status": "success",
    "data": {
        "id": 4,
        "title": "Morrocan dish plan (test)",
        "description": "A beginner-friendly keto adaptation week.",
        "plan_type": "public-predefined",
        "status": "approved",
        "price": 60.0,
        "duration_days": 7,
        "free_consultations_per_week": 0,
        "rating_avg": 0.0,
        "cover_image_url": "default_plan_cover.jpg",
        "content_json": [
            {
                "lunch": {
                    "name": "",
                    "notes": "",
                    "calories": 0,
                    "ingredients": []
                },
                "dinner": {
                    "name": "",
                    "notes": "",
                    "calories": 0,
                    "ingredients": []
                },
                "snacks": {
                    "name": "",
                    "notes": "",
                    "calories": 0,
                    "ingredients": []
                },
                "breakfast": {
                    "name": "Shakshuka",
                    "notes": "",
                    "calories": 500,
                    "ingredients": [
                        {
                            "name": "Eggs",
                            "unit": "1",
                            "amount": "4"
                        }
                    ]
                },
                "day_index": 0,
                "instructions": ""
            }
        ],
        "nutritionist_id": 6,
        "nutritionist_username": "Nutritest",
        "specialization_name": "Sports Nutrition",
        "country_name": "Morocco",
        "created_at": "2026-05-05T21:09:39.352835Z"
    }
}

POST /marketplace/plans/{id}/purchase/ — Purchase a plan — Client Auth
Field	Type	Required	Description
transaction_number	string	Yes	Simulated payment transaction reference
amount_paid	float	Yes	Amount charged
ℹ  On purchase: creates user_plan, creates invoice, adds client to nutritionist_patients if not already present, and triggers notifications to the nutritionist.

example response when sending post request with empty body:
{
    "status": "error",
    "message": "Validation failed",
    "errors": {
        "transaction_number": [
            "This field is required."
        ],
        "amount_paid": [
            "This field is required."
        ]
    }
}

example correct request body:
{
        "transaction_number": "1",
        "amount_paid": 25.99
        
    }
example response:
{
    "status": "success",
    "data": {
        "user_plan": {
            "id": 2,
            "plan": 4,
            "plan_title": "Morrocan dish plan (test)",
            "plan_cover": "default_plan_cover.jpg",
            "plan_duration": 7,
            "current_day_index": 0,
            "status": "active",
            "free_consultations_used": 0,
            "purchased_at": "2026-05-08T11:24:37.243699Z"
        },
        "transaction_number": "1",
        "net_earnings": 20.79
    }
}


The plan marketplace should split the regular and seasonal plans each into their own sections, seasonal plans will not have any filter, search or sort, and the regular plans will have all of them. The current page has the ui for all of this, but the load more button is misplaced and should be for the regular plans section not the seasonal plans one (also still mock and needs some type of implementation involving the plan pagination). The seasonal plans section will be displaying no more than 6 plans at most so it should have the corresponding layout (Use your own judgement for the layout modofication). The regular plans should be shown first, then the seasonal plans. There singleplanmarketplacecomponent should be refactored to use the fields the API provides for a single plan's details, and should be capable of displaying seasonal and regular plan details when the user clicks on it. Since the current logic uses slugs you need a solution that turns the marketplace plans' titles into slugs to use since the API will be the one providing the plan titles. You should also load the nutritionist's information  using the GET /marketplace/nutritionists/{id}/ — Get nutritionist public profile — No Auth required which should already be present in the current codebase as an interace and get function. Display the nutritionist's information in the singlemarketplanceplancompoenent. The component's ui should be modified as little as possible so don't completely change it, except for layout which I will leave to your judgement completely.