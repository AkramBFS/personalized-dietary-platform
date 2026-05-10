1) client dashboard community integrated but not fully out of mock probably using fallback (post preview and post history still not working)
Post history endpoint: GET /client/posts/mine/
response shape (check if interface and html render matches):
{
    "status": "success",
    "data": [
        {
            "id": 6,
            "author_username": "john",
            "content": "I am.",
            "image_url": null,
            "status": "draft",
            "is_approved": false,
            "created_at": "2026-05-09T15:43:20.036160Z",
            "comments": []
        }
    ]
}
Make sure post deletion is present and works: DELETE /client/posts/{id}/

2) nutritionist dashboard patient list has no pfp fetch integrated, patient info lacks a fetch for plan details, darfting a custom plan for a pateint requires patient to have had a consultation with the current nutritionist

3) a seasonal plans section needs to be implemented with the meal plans page

4) the nutritionist dashboard meal plans section's create public Plan's dropdown should not include an option for personalized plans

5) shared dashbaord layout's sidebar component needs responsive design, (currently comes out with invisible backrgound when triggered with the button (click to show sidebar) on smaller width screens)

6) nutritionist dashboard has a static greeting that needs to greet the dr. with their name and the nutritionist profile menu on the dashboard header and navrbar needs to show the nutrtionist's name "Dr.xxxx" instead of just static "Nutritionist"

7) nutritionist registration needs a pfp image upload similair to regular user registration

8) Admin dashboard overview ((dashboards)/admin/page.tsx) needs to have it's statistics linked and integrated to the new endpoints
GET http://127.0.0.1:8000/api/v1/lookup/admin/dashboard/
Authorization: Bearer <admin_token>
 {
    "status": "success",
    "data": {
        "users": {
            "total": 15,
            "clients": 10,
            "nutritionists": 4,
            "admins": 1
        },
        "pending_approvals": 3,
        "pending_plans": 2,
        "unresolved_inquiries": 5
    }
}

9) Admin dashboard plan management live marketplace and pending plans bugged, an approved plan should be showing in the live marketplace section and NOT in the pending plans sections)
