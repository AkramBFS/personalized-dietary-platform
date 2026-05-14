6. Nutritionist APIs
NEW  All endpoints in this section require the nutritionist account to have approval_status=approved. Any request from a nutritionist with approval_status=pending or approval_status=rejected returns 403 with code ACCOUNT_PENDING_APPROVAL or ACCOUNT_REJECTED.

6.1 Profile Management
GET /nutritionist/profile/ — Get own nutritionist profile — Nutritionist Auth
PATCH /nutritionist/profile/ — Update nutritionist profile — Nutritionist Auth
Field	Type	Required	Description
bio	string	No	Updated bio
years_experience	integer	No	Updated experience
consultation_price	float	No	Updated price per consultation
language_ids	array[integer]	No	Replace all spoken languages
profile_photo	file	No	New profile photo (multipart)

6.2 Schedule Management
GET /nutritionist/schedule/ — Get weekly availability and holidays — Nutritionist Auth
PUT /nutritionist/schedule/availability/ — Replace full weekly availability — Nutritionist Auth
Field	Type	Required	Description
availability	array	Yes	Array of {day_of_week (0-6), start_time (HH:MM), end_time (HH:MM)}

POST /nutritionist/schedule/holidays/ — Add a holiday date — Nutritionist Auth
Field	Type	Required	Description
holiday_date	date	Yes	Date to block off (YYYY-MM-DD)
DELETE /nutritionist/schedule/holidays/{id}/ — Remove a holiday — Nutritionist Auth

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

6.4 Patient Management
GET /nutritionist/patients/ — List all patients — Nutritionist Auth
Field	Type	Description
id	integer	nutritionist_patients record ID
client.client_id	integer	Client ID
client.user.username	string	Patient username
patient_type	string	from custom plan or free consultation
first_consultation_date	timestamp	Date of first interaction

GET /nutritionist/patients/{client_id}/ — Get patient health profile — Nutritionist Auth
Field	Type	Description
client.age	integer	Patient age
client.weight	float	Patient weight (kg)
client.height	float	Patient height (cm)
client.bmi	float	Calculated BMI
client.bmr	float	Calculated BMR
client.health_history	string	Medical and health background notes
client.goal.name	string	Patient's health goal
notes	array	Nutritionist's private clinical notes for this patient

POST /nutritionist/patients/{client_id}/notes/ — Add clinical note for patient — Nutritionist Auth
Field	Type	Required	Description
note_content	string	Yes	Clinical note text (private to nutritionist)

6.5 Plan Management
GET /nutritionist/plans/ — List own plans — Nutritionist Auth
Field	Type	Description
id	integer	Plan ID
title	string	Plan title
plan_type	string	private-custom or public-predefined
status	string	pending, approved, rejected, deleted
rating_avg	float	Average client rating
price	float	Plan price in USD
created_at	timestamp	Creation date

POST /nutritionist/plans/ — Create a new plan — Nutritionist Auth
Field	Type	Required	Description
title	string	Yes	Plan title
description	string	Yes	Plan overview text
plan_type	string	Yes	private-custom or public-predefined
target_client_id	integer	No	Required if plan_type is private-custom
price	float	Yes	Price in USD (0 for free)
duration_days	integer	Yes	Total number of days in the plan
free_consultations_per_week	integer	No	Default 0
content_json	json	Yes	Structured daily meal data (see schema below)
cover_image	file	No	Cover image (multipart)
ℹ  content_json structure: array of day objects, each containing: {day_index, breakfast, lunch, dinner, snacks, instructions}. Each meal contains: {name, ingredients: [{name, amount, unit}], calories, notes}.
⚠  Public plans (public-predefined) enter a pending status and await admin approval before appearing in the marketplace. Private plans for a specific client are immediately active.
PATCH /nutritionist/plans/{id}/ — Update a plan — Nutritionist Auth
DELETE /nutritionist/plans/{id}/ — Soft-delete a plan — Nutritionist Auth

6.6 Earnings
GET /nutritionist/earnings/ — Get earnings summary and transaction history — Nutritionist Auth
Field	Type	Description
total_gross	float	Total revenue before platform commission
total_commission	float	Platform fee deducted
total_net	float	Nutritionist take-home earnings
transactions	array	Paginated list of invoice records
transactions[].transaction_number	string	Unique transaction reference
transactions[].total_paid	float	What the client paid
transactions[].net_earnings	float	Nutritionist's share
transactions[].item_type	string	plan, consultation_advice, or consultation_custom
transactions[].created_at	timestamp	Transaction date
