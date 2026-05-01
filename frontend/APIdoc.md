**NUTRI PLATFORM**

REST API Documentation

For Django REST Backend ↔ React/Next.js Frontend Collaboration

Version 1.1 \| April 2026

**Updated: Nutritionist Account Approval Workflow**

# **1. Overview & Conventions**

**Base URL**

> https://api.nutriplatform.com/api/v1/

**Authentication**

The API uses JWT (JSON Web Token) authentication. After login, the
client stores the access token and includes it in every protected
request.

> Authorization: Bearer \<access_token\>
>
> **ℹ** *Tokens expire after 60 minutes. Use the refresh endpoint to
> obtain a new access token without re-logging in.*

**User Roles**

Every account has exactly one role, set at registration. Role-based
access control (RBAC) is enforced on the backend.

  **Role**       **Value in DB**   **Access Level**
  -------------- ----------------- ---------------------------------------------------------------------------------------
  Client         client            Personal dashboard, meal plans, calorie tracking, consultations, community posts
  Nutritionist   nutritionist      Patient management, plan creation, schedule, earnings (requires admin approval first)
  Admin          high_admin        Full platform control: users, plans, posts, blog, inquiries, nutritionist approvals

**Response Format**

All responses return JSON. Successful responses follow this envelope:

> { \"status\": \"success\", \"data\": { \... } }

Error responses:

> { \"status\": \"error\", \"message\": \"\...\", \"errors\": { \... } }

**HTTP Status Codes**

  **HTTP Status**   **Meaning**
  ----------------- ----------------------------------------------------------------
  200               OK --- Request succeeded, data returned
  201               Created --- Resource successfully created
  204               No Content --- Successful DELETE or action with no body
  400               Bad Request --- Validation failed or malformed request body
  401               Unauthorized --- Missing or invalid JWT token
  403               Forbidden --- Authenticated but not authorized for this action
  404               Not Found --- Resource does not exist
  409               Conflict --- Duplicate resource (e.g., unique email)
  422               Unprocessable Entity --- Business logic violation
  500               Internal Server Error --- Unexpected backend failure

**Pagination**

List endpoints support pagination via query parameters:

> GET /api/v1/plans/?page=2&page_size=10

  **Field**   **Type**         **Description**
  ----------- ---------------- -------------------------------------------------
  count       integer          Total number of items across all pages
  next        string \| null   URL of the next page, or null if last page
  previous    string \| null   URL of the previous page, or null if first page
  results     array            Array of objects for the current page

# **2. Authentication**

## **2.1 Register --- Client**

**POST /auth/register/client/** --- Create a new client account

**Request Body**

  **Field**        **Type**   **Required**   **Description**
  ---------------- ---------- -------------- --------------------------------------------------
  username         string     Yes            Unique username, max 150 chars
  email            string     Yes            Valid email address, must be unique
  password         string     Yes            Min 8 characters
  age              integer    Yes            Client age in years
  weight           float      Yes            Weight in kilograms
  height           float      Yes            Height in centimeters
  gender           string     Yes            male or female
  country_id       integer    Yes            FK to countries table
  goal_id          integer    Yes            FK to goals table
  health_history   string     No             Free text: PCOS, diabetes, metabolic issues etc.
  profile_photo    file       No             Profile image upload (multipart)

**Response --- 201 Created**

  **Field**          **Type**   **Description**
  ------------------ ---------- ----------------------------------------------
  user.id            integer    Newly created user ID
  user.username      string     Username
  user.email         string     Email address
  user.role          string     Always client
  tokens.access      string     JWT access token (60 min)
  tokens.refresh     string     JWT refresh token (7 days)
  client.client_id   integer    Client profile ID
  client.bmi         float      Calculated BMI (weight / height²)
  client.bmr         float      Calculated BMR using Mifflin-St Jeor formula

> **ℹ** *BMI and BMR are calculated server-side from the submitted
> weight, height, age, and gender. Do not compute these on the
> frontend.*

## **2.2 Register --- Nutritionist**

**POST /auth/register/nutritionist/** --- Create a new nutritionist
account (pending approval)

> **NEW** *After registration, the nutritionist account is created with
> is_approved=false and approval_status=pending. The account cannot
> access protected nutritionist endpoints until an admin approves it.
> JWT tokens are NOT issued at registration --- they are issued only
> after approval.*

**Request Body**

  **Field**            **Type**           **Required**   **Description**
  -------------------- ------------------ -------------- ----------------------------------------------
  username             string             Yes            Unique username
  email                string             Yes            Valid unique email
  password             string             Yes            Min 8 characters
  country_id           integer            Yes            Country of practice
  specialization_id    integer            Yes            FK to specializations table
  years_experience     integer            Yes            Total years of professional experience
  consultation_price   float              Yes            Price per consultation session in USD
  bio                  string             No             Professional biography text
  certification_ref    string             Yes            Official certification reference number
  cert_image           file               Yes            Certification document image (multipart)
  language_ids         array\[integer\]   Yes            List of language IDs the nutritionist speaks

**Response --- 201 Created**

  **Field**                      **Type**   **Description**
  ------------------------------ ---------- -----------------------------------------------------------------------------------------------
  user.id                        integer    User ID
  user.role                      string     Always nutritionist
  nutritionist.nutritionist_id   integer    Nutritionist profile ID
  nutritionist.approval_status   string     Always pending at registration
  nutritionist.rating            float      Initial rating (0.0)
  message                        string     Human-readable message: \'Your account is under review. You will be notified once approved.\'

> **⚠** *No JWT tokens are returned on registration. The nutritionist
> cannot log in or access any protected endpoint until the admin
> approves the account.*

## **2.3 Login**

**POST /auth/login/** --- Authenticate any user (all roles)

**Request Body**

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- -------------------------------------
  username    string     Yes            Username (admins use username only)
  password    string     Yes            Account password

**Response --- 200 OK**

  **Field**              **Type**   **Description**
  ---------------------- ---------- ---------------------------------------------------------------------------
  tokens.access          string     JWT access token
  tokens.refresh         string     JWT refresh token
  user.id                integer    User ID
  user.role              string     client, nutritionist, or high_admin
  user.is_active         boolean    False if account is banned
  user.approval_status   string     For nutritionists: pending \| approved \| rejected. Null for other roles.

> **NEW** *If a nutritionist attempts to log in while
> approval_status=pending or approval_status=rejected, the backend
> returns 403 with error code ACCOUNT_PENDING_APPROVAL or
> ACCOUNT_REJECTED. No tokens are issued.*
>
> **ℹ** *Frontend should read user.role immediately after login and
> redirect to the appropriate dashboard: /dashboard/client,
> /dashboard/nutritionist, or /dashboard/admin.*

## **2.4 Token Refresh**

**POST /auth/token/refresh/** --- Obtain new access token using refresh
token

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- -------------------------
  refresh     string     Yes            Valid JWT refresh token

**Response --- 200 OK**

  **Field**   **Type**   **Description**
  ----------- ---------- ----------------------
  access      string     New JWT access token

## **2.5 Logout**

**POST /auth/logout/** --- Blacklist the refresh token --- requires Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- -----------------------------
  refresh     string     Yes            Refresh token to invalidate

Response --- 204 No Content

# **3. Lookup / Reference Data**

These endpoints provide static dropdown data. Call them once on app load
and cache in state.\
No pagination for these lookups

\

**GET /lookup/countries/** --- List all countries

**GET /lookup/goals/** --- List all health goals

**GET /lookup/specializations/** --- List all nutritionist
specializations

**GET /lookup/languages/** --- List all supported languages

GET http://127.0.0.1:8000/api/v1/lookup/activity-levels/

GET http://127.0.0.1:8000/api/v1/lookup/diets/

PATCH http://127.0.0.1:8000/api/v1/client/profile/

Authorization: Bearer \<client_token\>

Content-Type: application/json

{

\"activity_level\": \"moderate\",

\"diet\": \"vegan\"

}

**Response shape (same for all)**

  **Field**   **Type**   **Description**
  ----------- ---------- ----------------------
  id          integer    Record primary key
  name        string     Human-readable label

# **4. Client APIs**

## **4.1 Profile**

**GET /client/profile/** --- Get authenticated client\'s full profile
--- Client Auth

**PATCH /client/profile/** --- Update client profile fields --- Client
Auth

**Editable Fields (PATCH)**

  **Field**        **Type**   **Required**   **Description**
  ---------------- ---------- -------------- ------------------------------------------------
  age              integer    No             Updated age
  weight           float      No             Updated weight; triggers BMI/BMR recalculation
  height           float      No             Updated height; triggers BMI/BMR recalculation
  health_history   string     No             Updated health history text
  goal_id          integer    No             Updated health goal
  country_id       integer    No             Updated country
  profile_photo    file       No             New profile image (multipart)

> **ℹ** *Weight or height changes trigger automatic server-side
> recalculation of bmi and bmr. The frontend should refresh the profile
> after a successful PATCH.*

## **4.2 Progress Monitor**

**GET /client/progress/** --- Get daily progress logs --- Client Auth

**Query Parameters**

  **Field**    **Type**   **Required**   **Description**
  ------------ ---------- -------------- -----------------------------------------------------
  start_date   date       No             Filter from date (YYYY-MM-DD). Default: 30 days ago
  end_date     date       No             Filter to date (YYYY-MM-DD). Default: today

**Response**

  **Field**                 **Type**   **Description**
  ------------------------- ---------- ------------------------------------------
  id                        integer    Log entry ID
  log_date                  date       Date of this log entry
  total_calories_consumed   float      Sum of all calories logged that day
  total_protein_consumed    float      Total protein in grams
  total_carbs_consumed      float      Total carbohydrates in grams
  total_fats_consumed       float      Total fats in grams
  target_calories           float      Client-defined daily calorie target
  target_protein            float      Client-defined protein target
  target_carbs              float      Client-defined carbs target
  target_fats               float      Client-defined fats target
  is_goal_achieved          boolean    True if consumed values meet all targets
  notes                     string     Optional personal notes for that day

**PATCH /client/progress/targets/** --- Set daily macro targets ---
Client Auth

  **Field**         **Type**   **Required**   **Description**
  ----------------- ---------- -------------- -----------------------------
  target_calories   float      Yes            Daily calorie goal
  target_protein    float      Yes            Daily protein goal (g)
  target_carbs      float      Yes            Daily carbohydrate goal (g)
  target_fats       float      Yes            Daily fat goal (g)

## **4.3 AI Calorie Tracker (Premium)**

> **⚠** *This endpoint is only accessible to clients with an active
> premium subscription. Return 403 with code NOT_PREMIUM for non-premium
> users.*

**POST /client/calorie-tracker/ai/** --- Submit meal photo for AI
analysis --- Premium Client Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- ---------------------------------------------
  image       file       Yes            Meal photo (multipart/form-data, max 10 MB)
  meal_type   string     Yes            breakfast, lunch, dinner, or snack

**Response --- 202 Accepted (async processing)**

  **Field**             **Type**   **Description**
  --------------------- ---------- ----------------------------------------------
  log_id                integer    Created ai_calorie_log ID to poll for status
  status                string     processing --- AI is working
  segmented_image_url   string     URL of annotated image once ready

> **ℹ** *Poll GET /client/calorie-tracker/ai/{log_id}/ until status
> becomes pending_user_review or failed.*

**GET /client/calorie-tracker/ai/{log_id}/** --- Poll AI log status ---
Premium Client Auth

  **Field**             **Type**   **Description**
  --------------------- ---------- -----------------------------------------------------------
  status                string     processing \| pending_user_review \| saved \| failed
  ai_raw_prediction     json       Bounding boxes, labels, confidence scores, mass estimates
  segmented_image_url   string     URL of AI-segmented image

**PATCH /client/calorie-tracker/ai/{log_id}/confirm/** --- Submit user
corrections and save --- Premium Client Auth

  **Field**        **Type**   **Required**   **Description**
  ---------------- ---------- -------------- --------------------------------------------------------
  user_final_log   json       Yes            Array of {label, mass_grams} objects after user review
  meal_type        string     Yes            Confirm or override meal_type

> **ℹ** *On save, the backend recalculates total macros, updates the
> daily_progress_metrics row for today, and sets status to saved.*

## **4.4 Manual Calorie Tracker**

**POST /client/calorie-tracker/manual/** --- Log a manually entered meal
--- Client Auth

  **Field**     **Type**   **Required**   **Description**
  ------------- ---------- -------------- --------------------------------------------
  meal_type     string     Yes            breakfast, lunch, dinner, or snack
  ingredients   array      Yes            Array of {name: string, mass_grams: float}

> **ℹ** *Backend calls Nutritionix API to fetch nutritional data per
> ingredient, aggregates macros, and increments daily_progress_metrics.*

**GET /client/calorie-tracker/logs/** --- List today\'s calorie log
entries --- Client Auth

  **Field**    **Type**   **Required**   **Description**
  ------------ ---------- -------------- --------------------------------------------
  date         date       No             Specific date (YYYY-MM-DD). Default: today
  entry_type   string     No             ai_vision or manual_input

## **4.5 My Meal Plans**

**GET /client/user-plans/** --- List subscribed plans with progress ---
Client Auth

  **Field**                 **Type**    **Description**
  ------------------------- ----------- --------------------------------------------------------
  id                        integer     user_plan record ID
  plan.id                   integer     Plan ID
  plan.title                string      Plan title
  plan.cover_image_url      string      Cover image URL
  plan.duration_days        integer     Total duration in days
  current_day_index         integer     Which day client is on (0-indexed)
  progress_percent          float       Calculated: (current_day_index / duration_days) \* 100
  status                    string      active or completed
  free_consultations_used   integer     Free consultations consumed from this plan
  purchased_at              timestamp   When the plan was purchased

**GET /client/user-plans/{id}/content/** --- Get full plan content for a
specific day --- Client Auth

+-----------+---------------+--------------+
| **Field** | **Type**      | **Required** |
+===========+========+======+==============+
| day       | integer       | No           |
+-----------+--------+------+--------------+
| **Field**          | **Type**            |
+--------------------+---------------------+
| day_index          | integer             |
+--------------------+---------------------+
| breakfast          | object              |
+--------------------+---------------------+
| lunch              | object              |
+--------------------+---------------------+
| dinner             | object              |
+--------------------+---------------------+
| snacks             | array               |
+--------------------+---------------------+
| instructions       | string              |
+--------------------+---------------------+

**PATCH /client/user-plans/{id}/advance/** --- Advance to the next day
--- Client Auth

## **4.6 Consultations**

**GET /client/consultations/** --- List all client consultations ---
Client Auth

**POST /client/consultations/book/** --- Book a consultation --- Client
Auth

  **Field**           **Type**   **Required**   **Description**
  ------------------- ---------- -------------- -------------------------------------------------
  nutritionist_id     integer    Yes            Target nutritionist
  appointment_date    date       Yes            Chosen date (YYYY-MM-DD)
  start_time          time       Yes            Start time (HH:MM)
  end_time            time       Yes            End time (HH:MM)
  consultation_type   string     Yes            advice_only or plan_included
  user_plan_id        integer    No             Required if using free consultation from a plan
  is_free_from_plan   boolean    No             True if covered by plan free consultations

> **⚠** *Backend must validate the slot against
> nutritionist_availability and nutritionist_holidays before creating
> the consultation.*

  **Field**                 **Type**         **Description**
  ------------------------- ---------------- -------------------------------------------------
  id                        integer          New consultation ID
  status                    string           scheduled
  price_paid                float            Amount charged (0 if free from plan)
  nutritionist_commission   float            Nutritionist\'s cut after platform fee
  zoom_link                 string \| null   null until nutritionist adds it before the call

## **4.7 Premium Subscriptions**

**GET /client/subscriptions/** --- Get current subscription status ---
Client Auth

**POST /client/subscriptions/purchase/** --- Purchase premium
subscription (simulated) --- Client Auth

  **Field**            **Type**   **Required**   **Description**
  -------------------- ---------- -------------- ----------------------------------------
  plan_type            string     Yes            monthly or yearly
  amount_paid          float      Yes            Simulated payment amount
  transaction_number   string     Yes            Simulated unique transaction reference

> **ℹ** *Payment is simulated. Backend generates a receipt and sets
> subscription status to active. End date is calculated automatically
> based on plan_type.*

## **4.8 Community Posts**

**GET /posts/** --- List approved posts (public) --- No Auth required

**POST /client/posts/** --- Create a new post --- Client Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- ---------------------------------------
  content     string     Yes            Post text body
  image       file       No             Optional image attachment (multipart)

> **ℹ** *New posts are created with status=draft and is_approved=false.
> They enter the admin moderation queue.*

**GET /client/posts/mine/** --- List own posts (all statuses) --- Client
Auth

**DELETE /client/posts/{id}/** --- Delete own post --- Client Auth

**POST /posts/{id}/comments/** --- Add comment to a post --- Auth
Required

## **4.9 Notifications**

**GET /notifications/** --- List all notifications for authenticated
user --- Auth Required

**PATCH /notifications/{id}/read/** --- Mark a notification as read ---
Auth Required

**PATCH /notifications/read-all/** --- Mark all notifications as read
--- Auth Required

  **Field**         **Type**    **Description**
  ----------------- ----------- -------------------------------------------------------------
  id                integer     Notification ID
  title             string      Short notification title
  message           string      Full notification message
  target_type       string      Resource type (consultation, plan, inquiry, approval, etc.)
  target_id         integer     ID of the linked resource
  is_read           boolean     Whether the user has read it
  created_at        timestamp   When the notification was created
  sender.username   string      Who triggered the notification

## **4.10 Feedback to Admin**

**POST /client/feedback/** --- Submit a support inquiry --- Client Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- ----------------------------
  subject     string     Yes            Brief topic of the inquiry
  message     string     Yes            Full message body

**GET /client/feedback/** --- List own submitted inquiries --- Client
Auth

# **5. Marketplace (Public Plans & Consultations)**

These endpoints power the public storefront. A logged-in client account
is required to purchase, but browsing is public.

## **5.1 Browse Plans**

**GET /marketplace/plans/** --- List all approved public plans --- No
Auth required

  **Field**           **Type**   **Required**   **Description**
  ------------------- ---------- -------------- --------------------------------------------
  page                integer    No             Page number
  page_size           integer    No             Items per page (default 10, max 50)
  specialization_id   integer    No             Filter by nutritionist specialization
  min_price           float      No             Minimum price filter
  max_price           float      No             Maximum price filter
  sort                string     No             rating_desc, price_asc, price_desc, newest

**GET /marketplace/plans/{id}/** --- Get single plan detail --- No Auth
required

**POST /marketplace/plans/{id}/purchase/** --- Purchase a plan ---
Client Auth

  **Field**            **Type**   **Required**   **Description**
  -------------------- ---------- -------------- -----------------------------------------
  transaction_number   string     Yes            Simulated payment transaction reference
  amount_paid          float      Yes            Amount charged

> **ℹ** *On purchase: creates user_plan, creates invoice, adds client to
> nutritionist_patients if not already present, and triggers
> notifications to the nutritionist.*

## **5.2 Nutritionist Directory**

**GET /marketplace/nutritionists/** --- List all approved & active
nutritionists --- No Auth required

> **NEW** *Only nutritionists with approval_status=approved appear in
> the marketplace directory. Pending or rejected nutritionists are
> hidden from public listing.*

  **Field**           **Type**   **Required**   **Description**
  ------------------- ---------- -------------- ---------------------------
  country_id          integer    No             Filter by country
  specialization_id   integer    No             Filter by specialization
  language_id         integer    No             Filter by spoken language
  sort                string     No             rating_desc or price_asc

**GET /marketplace/nutritionists/{id}/** --- Get nutritionist public
profile --- No Auth required

**GET /marketplace/nutritionists/{id}/availability/** --- Get available
slots for a date --- No Auth required

+-----------+-----------------+--------------+
| **Field** | **Type**        | **Required** |
+===========+==========+======+==============+
| date      | date            | Yes          |
+-----------+----------+------+--------------+
| **Field**            | **Type**            |
+----------------------+---------------------+
| available_slots      | array               |
+----------------------+---------------------+
| is_holiday           | boolean             |
+----------------------+---------------------+

## **5.3 Plan Ratings**

**POST /marketplace/plans/{id}/rate/** --- Rate a plan (1--5 stars) ---
Client Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- -------------------------
  rating      integer    Yes            Star rating from 1 to 5

> **⚠** *Client must have an active or completed user_plan for this
> plan. One rating per client per plan (enforced by unique index).*

## **5.4 Service Reviews**

**POST /reviews/** --- Submit a review for a plan or consultation ---
Client Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- -------------------------
  item_type   string     Yes            plan or consultation
  item_id     integer    Yes            ID of the reviewed item
  rating      integer    Yes            1--5 stars
  comment     string     No             Optional written review

# **6. Nutritionist APIs**

> **NEW** *All endpoints in this section require the nutritionist
> account to have approval_status=approved. Any request from a
> nutritionist with approval_status=pending or approval_status=rejected
> returns 403 with code ACCOUNT_PENDING_APPROVAL or ACCOUNT_REJECTED.*

## **6.1 Profile Management**

**GET /nutritionist/profile/** --- Get own nutritionist profile ---
Nutritionist Auth

**PATCH /nutritionist/profile/** --- Update nutritionist profile ---
Nutritionist Auth

  **Field**            **Type**           **Required**   **Description**
  -------------------- ------------------ -------------- --------------------------------
  bio                  string             No             Updated bio
  years_experience     integer            No             Updated experience
  consultation_price   float              No             Updated price per consultation
  language_ids         array\[integer\]   No             Replace all spoken languages
  profile_photo        file               No             New profile photo (multipart)

## **6.2 Schedule Management**

**GET /nutritionist/schedule/** --- Get weekly availability and holidays
--- Nutritionist Auth

**PUT /nutritionist/schedule/availability/** --- Replace full weekly
availability --- Nutritionist Auth

  **Field**      **Type**   **Required**   **Description**
  -------------- ---------- -------------- --------------------------------------------------------------------
  availability   array      Yes            Array of {day_of_week (0-6), start_time (HH:MM), end_time (HH:MM)}

**POST /nutritionist/schedule/holidays/** --- Add a holiday date ---
Nutritionist Auth

  **Field**      **Type**   **Required**   **Description**
  -------------- ---------- -------------- --------------------------------
  holiday_date   date       Yes            Date to block off (YYYY-MM-DD)

**DELETE /nutritionist/schedule/holidays/{id}/** --- Remove a holiday
--- Nutritionist Auth

## **6.3 Consultations**

**GET /nutritionist/consultations/** --- List all consultations ---
Nutritionist Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- ---------------------------------------------------------
  status      string     No             Filter: scheduled, finished, cancelled, notified
  type        string     No             Filter: advice_only, plan_included, custom_plan_session

**PATCH /nutritionist/consultations/{id}/zoom-link/** --- Add Zoom link
before the call --- Nutritionist Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- ---------------------------
  zoom_link   string     Yes            Valid Zoom or meeting URL

> **ℹ** *Adding a zoom link triggers a notification to the client. Best
> practice: add link 5--10 minutes before the call.*

**PATCH /nutritionist/consultations/{id}/status/** --- Update
consultation status --- Nutritionist Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- ----------------------------------
  status      string     Yes            notified, finished, or cancelled

## **6.4 Patient Management**

**GET /nutritionist/patients/** --- List all patients --- Nutritionist
Auth

  **Field**                 **Type**    **Description**
  ------------------------- ----------- ---------------------------------------
  id                        integer     nutritionist_patients record ID
  client.client_id          integer     Client ID
  client.user.username      string      Patient username
  patient_type              string      from custom plan or free consultation
  first_consultation_date   timestamp   Date of first interaction

**GET /nutritionist/patients/{client_id}/** --- Get patient health
profile --- Nutritionist Auth

  **Field**               **Type**   **Description**
  ----------------------- ---------- ---------------------------------------------------------
  client.age              integer    Patient age
  client.weight           float      Patient weight (kg)
  client.height           float      Patient height (cm)
  client.bmi              float      Calculated BMI
  client.bmr              float      Calculated BMR
  client.health_history   string     Medical and health background notes
  client.goal.name        string     Patient\'s health goal
  notes                   array      Nutritionist\'s private clinical notes for this patient

**POST /nutritionist/patients/{client_id}/notes/** --- Add clinical note
for patient --- Nutritionist Auth

  **Field**      **Type**   **Required**   **Description**
  -------------- ---------- -------------- ----------------------------------------------
  note_content   string     Yes            Clinical note text (private to nutritionist)

## **6.5 Plan Management**

**GET /nutritionist/plans/** --- List own plans --- Nutritionist Auth

  **Field**    **Type**    **Description**
  ------------ ----------- --------------------------------------
  id           integer     Plan ID
  title        string      Plan title
  plan_type    string      private-custom or public-predefined
  status       string      pending, approved, rejected, deleted
  rating_avg   float       Average client rating
  price        float       Plan price in USD
  created_at   timestamp   Creation date

**POST /nutritionist/plans/** --- Create a new plan --- Nutritionist
Auth

  **Field**                     **Type**   **Required**   **Description**
  ----------------------------- ---------- -------------- -----------------------------------------------
  title                         string     Yes            Plan title
  description                   string     Yes            Plan overview text
  plan_type                     string     Yes            private-custom or public-predefined
  target_client_id              integer    No             Required if plan_type is private-custom
  price                         float      Yes            Price in USD (0 for free)
  duration_days                 integer    Yes            Total number of days in the plan
  free_consultations_per_week   integer    No             Default 0
  content_json                  json       Yes            Structured daily meal data (see schema below)
  cover_image                   file       No             Cover image (multipart)

> **ℹ** *content_json structure: array of day objects, each containing:
> {day_index, breakfast, lunch, dinner, snacks, instructions}. Each meal
> contains: {name, ingredients: \[{name, amount, unit}\], calories,
> notes}.*
>
> **⚠** *Public plans (public-predefined) enter a pending status and
> await admin approval before appearing in the marketplace. Private
> plans for a specific client are immediately active.*

**PATCH /nutritionist/plans/{id}/** --- Update a plan --- Nutritionist
Auth

**DELETE /nutritionist/plans/{id}/** --- Soft-delete a plan ---
Nutritionist Auth

## **6.6 Earnings**

**GET /nutritionist/earnings/** --- Get earnings summary and transaction
history --- Nutritionist Auth

  **Field**                             **Type**    **Description**
  ------------------------------------- ----------- ---------------------------------------------------
  total_gross                           float       Total revenue before platform commission
  total_commission                      float       Platform fee deducted
  total_net                             float       Nutritionist take-home earnings
  transactions                          array       Paginated list of invoice records
  transactions\[\].transaction_number   string      Unique transaction reference
  transactions\[\].total_paid           float       What the client paid
  transactions\[\].net_earnings         float       Nutritionist\'s share
  transactions\[\].item_type            string      plan, consultation_advice, or consultation_custom
  transactions\[\].created_at           timestamp   Transaction date

# **7. Admin APIs**

## **7.1 User Account Management**

**GET /admin/users/** --- List all users --- Admin Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- --------------------------------------------------
  role        string     No             Filter by role: client, nutritionist, high_admin
  is_active   boolean    No             Filter active/banned users
  search      string     No             Search by username or email

**GET /admin/users/{id}/** --- Get full user detail --- Admin Auth

**PATCH /admin/users/{id}/ban/** --- Ban or unban a user --- Admin Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- -------------------------------------------------------------
  is_banned   boolean    Yes            True to ban, false to unban (sets is_active on users table)

**DELETE /admin/users/{id}/** --- Permanently delete user account ---
Admin Auth

> **⚠** *This is irreversible. All associated data (plans,
> consultations, logs) will be cascade-deleted per FK constraints.*

## **7.2 Nutritionist Approval (NEW)**

> **NEW** *This is a new section added to support the nutritionist
> approval workflow. When a nutritionist registers, their account starts
> with approval_status=pending. The admin must review their
> certification and either approve or reject the account before they can
> access the platform.*

**GET /admin/nutritionists/pending/** --- List all nutritionists pending
approval --- Admin Auth

  **Field**                          **Type**    **Description**
  ---------------------------------- ----------- ----------------------------------------
  id                                 integer     User ID
  username                           string      Username
  email                              string      Email address
  nutritionist.nutritionist_id       integer     Nutritionist profile ID
  nutritionist.specialization.name   string      Area of specialization
  nutritionist.years_experience      integer     Years of experience
  nutritionist.certification_ref     string      Certification reference number
  nutritionist.cert_image_url        string      URL to uploaded certification document
  nutritionist.approval_status       string      Always pending in this list
  created_at                         timestamp   Registration date

**GET /admin/nutritionists/{id}/** --- Get full nutritionist detail for
review --- Admin Auth

Returns the same fields as the pending list plus the full profile
including bio, languages, country, and consultation_price.

**POST /admin/nutritionists/{id}/approve/** --- Approve a nutritionist
account --- Admin Auth

No request body required.

**Response --- 200 OK**

  **Field**                      **Type**   **Description**
  ------------------------------ ---------- ----------------------
  user.id                        integer    User ID
  nutritionist.approval_status   string     approved
  message                        string     Confirmation message

> **ℹ** *On approval: sets approval_status=approved on the
> NutritionistProfile, sets user.is_active=true, and sends a
> notification to the nutritionist informing them their account is
> approved and they can now log in.*

**POST /admin/nutritionists/{id}/reject/** --- Reject a nutritionist
account --- Admin Auth

  **Field**          **Type**   **Required**   **Description**
  ------------------ ---------- -------------- --------------------------------------------
  rejection_reason   string     Yes            Clear explanation sent to the nutritionist

**Response --- 200 OK**

  **Field**                       **Type**   **Description**
  ------------------------------- ---------- ----------------------------------
  user.id                         integer    User ID
  nutritionist.approval_status    string     rejected
  nutritionist.rejection_reason   string     The reason stored on the profile
  message                         string     Confirmation message

> **ℹ** *On rejection: sets approval_status=rejected, stores
> rejection_reason on NutritionistProfile, sets user.is_active=false,
> and sends a notification to the nutritionist with the rejection
> reason.*
>
> **⚠** *A rejected nutritionist cannot log in. They may re-register
> with a new account or contact admin support.*

**POST /admin/nutritionists/{id}/re-review/** --- Move a rejected
nutritionist back to pending --- Admin Auth

No request body required. Allows admin to reconsider a previously
rejected account.

  **Field**                      **Type**   **Description**
  ------------------------------ ---------- ----------------------
  nutritionist.approval_status   string     pending
  message                        string     Confirmation message

## **7.3 Plan Moderation**

**GET /admin/plans/** --- List all plans pending moderation --- Admin
Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- ----------------------------------------------
  status      string     No             Filter: pending, approved, rejected, deleted

**GET /admin/plans/{id}/** --- Get plan detail for review --- Admin Auth

**POST /admin/plans/{id}/approve/** --- Approve a plan for marketplace
--- Admin Auth

**POST /admin/plans/{id}/reject/** --- Reject a plan with reason ---
Admin Auth

  **Field**          **Type**   **Required**   **Description**
  ------------------ ---------- -------------- ----------------------------------------
  rejection_reason   string     Yes            Clear explanation for the nutritionist

**POST /admin/plans/{id}/archive/** --- Soft-delete / archive a plan ---
Admin Auth

> **ℹ** *All moderation actions create a plan_moderation_logs entry and
> trigger a notification to the plan\'s creator.*

## **7.4 Post Moderation**

**GET /admin/posts/** --- List posts pending approval --- Admin Auth

**PATCH /admin/posts/{id}/approve/** --- Approve a post (sets
is_approved=true) --- Admin Auth

**PATCH /admin/posts/{id}/reject/** --- Reject and hide a post --- Admin
Auth

**DELETE /admin/posts/{id}/** --- Delete a post permanently --- Admin
Auth

## **7.5 Blog Management**

**GET /blog/** --- List all published blog articles --- No Auth required

**GET /blog/{id}/** --- Get single blog article --- No Auth required

**POST /admin/blog/** --- Create a new blog article --- Admin Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- --------------------------------------
  title       string     Yes            Article title
  content     string     Yes            Full article body (HTML or Markdown)

**PATCH /admin/blog/{id}/** --- Edit an existing article --- Admin Auth

**DELETE /admin/blog/{id}/** --- Delete a blog article --- Admin Auth

## **7.6 User Inquiries (Support Tickets)**

**GET /admin/inquiries/** --- List all feedback tickets --- Admin Auth

  **Field**   **Type**   **Required**   **Description**
  ----------- ---------- -------------- --------------------------
  status      string     No             Filter: open or resolved

**GET /admin/inquiries/{id}/** --- Get inquiry detail --- Admin Auth

**PATCH /admin/inquiries/{id}/respond/** --- Submit admin response and
mark resolved --- Admin Auth

  **Field**        **Type**   **Required**   **Description**
  ---------------- ---------- -------------- --------------------------------------------------
  admin_response   string     Yes            Admin\'s reply message
  status           string     No             resolved to close the ticket (default: resolved)

> **ℹ** *Responding to an inquiry triggers a notification to the client
> who submitted the feedback.*

# **8. Invoices**

**GET /client/invoices/** --- List client\'s invoices --- Client Auth

**GET /nutritionist/invoices/** --- List nutritionist\'s invoices ---
Nutritionist Auth

**GET /invoices/{id}/** --- Get single invoice --- Auth Required (owner
or admin)

  **Field**                    **Type**    **Description**
  ---------------------------- ----------- ---------------------------------------------------
  id                           integer     Invoice ID
  transaction_number           string      Unique transaction reference (unique constraint)
  total_paid                   float       Total amount paid by client
  commission_rate              float       Platform commission percentage applied
  net_earnings                 float       Nutritionist net earnings after commission
  item_type                    string      plan, consultation_advice, or consultation_custom
  created_at                   timestamp   Invoice creation timestamp
  client.username              string      Client who paid
  nutritionist.user.username   string      Nutritionist who received payment

# **9. Error Reference**

**Validation Error (400)**

> { \"status\": \"error\", \"message\": \"Validation failed\",
> \"errors\": { \"email\": \[\"This field must be unique.\"\],
> \"weight\": \[\"A valid number is required.\"\] } }

**Authentication Error (401)**

> { \"status\": \"error\", \"message\": \"Authentication credentials
> were not provided.\" }

**Permission Error (403)**

> { \"status\": \"error\", \"message\": \"You do not have permission to
> perform this action.\" }

**Not Found (404)**

> { \"status\": \"error\", \"message\": \"Not found.\" }

**Business Logic Error (422)**

> { \"status\": \"error\", \"message\": \"This time slot is already
> booked.\", \"code\": \"SLOT_UNAVAILABLE\" }

**Common Error Codes**

  **Code**                   **Description**
  -------------------------- -------------------------------------------------------------------------
  SLOT_UNAVAILABLE           Consultation time slot conflicts with existing booking or holiday
  NOT_PREMIUM                Feature requires active premium subscription
  PLAN_NOT_APPROVED          Plan is not approved for marketplace purchase
  ALREADY_PURCHASED          Client already owns this plan
  ACCOUNT_BANNED             User account has been banned by admin
  DUPLICATE_RATING           Client has already rated this plan
  CERT_REQUIRED              Nutritionist certification document must be uploaded
  FREE_CONSULT_EXHAUSTED     No free consultations remaining from this plan
  ACCOUNT_PENDING_APPROVAL   Nutritionist account is awaiting admin approval --- login not permitted
  ACCOUNT_REJECTED           Nutritionist account was rejected by admin --- login not permitted

> **NEW** *Two new error codes added: ACCOUNT_PENDING_APPROVAL and
> ACCOUNT_REJECTED are returned as 403 responses when a nutritionist
> attempts to log in before being approved.*

# **10. Frontend Implementation Notes**

## **10.1 Authentication Flow**

On login, store tokens in memory or httpOnly cookies. Never store in
localStorage.

- Step 1: POST /auth/login/ → receive tokens + user.role
- Step 2: Store tokens. Read user.role.
- Step 3: Redirect: client → /dashboard/client \| nutritionist →
  /dashboard/nutritionist \| high_admin → /dashboard/admin
- Step 4: Set up an Axios/fetch interceptor to inject Authorization:
  Bearer \<token\> on every request
- Step 5: On 401 responses, call POST /auth/token/refresh/
  automatically. If refresh fails, redirect to login.

## **10.2 Nutritionist Approval Flow (NEW)**

> **NEW** *This section is new and describes how both the frontend and
> backend should handle the nutritionist approval lifecycle.*

**Registration response (no tokens)**

After POST /auth/register/nutritionist/, the frontend should NOT attempt
to store tokens (none are returned). Instead, display a confirmation
screen:

> \"Your account has been submitted for review. You will receive an
> email notification once approved.\"

**Login attempt before approval**

If a nutritionist tries to log in and receives a 403 with code
ACCOUNT_PENDING_APPROVAL, show a friendly message:

> \"Your account is still under review. Please wait for admin
> approval.\"

If code is ACCOUNT_REJECTED, show:

> \"Your account registration was rejected. Reason: \[rejection_reason
> from response\]. Please contact support.\"

**Admin approval dashboard**

The admin dashboard should include a dedicated section for pending
nutritionists. Each card shows: name, specialization, years of
experience, certification reference, and a link to the cert_image_url
for manual review. Two action buttons: Approve and Reject (with a
required rejection reason text field).

**Notification to nutritionist**

On approval or rejection, the backend sends a notification. The
nutritionist sees this notification the next time they attempt to check
their status or log in.

## **10.3 Premium Feature Gating**

Check is_premium on the client profile. If false, show upgrade prompt
instead of the AI tracker. Do not rely on the frontend check alone ---
the backend will return 403.

## **10.4 AI Tracker Polling**

After POST /client/calorie-tracker/ai/, poll GET
/client/calorie-tracker/ai/{log_id}/ every 3 seconds until status is no
longer processing. Show a loading spinner with the segmented image
preview once available.

## **10.5 Plan Content Navigation**

My Meal Plan page lists user_plans as cards showing progress_percent.
Clicking a card loads GET
/client/user-plans/{id}/content/?day={current_day_index}. The user can
navigate to any day freely (not locked to real-time calendar). Call
PATCH /client/user-plans/{id}/advance/ only when the user explicitly
marks a day as done.

## **10.6 Consultation Booking Flow**

- Step 1: Browse nutritionists via GET /marketplace/nutritionists/
- Step 2: Select date, fetch GET
  /marketplace/nutritionists/{id}/availability/?date=YYYY-MM-DD
- Step 3: Show available slots as buttons
- Step 4: Submit booking via POST /client/consultations/book/
- Step 5: Redirect to payment if not free, then confirm booking

## **10.7 Notification Badge**

Call GET /notifications/ on dashboard load and poll every 30 seconds (or
use WebSocket). Show unread count as a badge. Count: filter is_read ===
false.

## **10.8 Lookup Data Caching**

Fetch /lookup/countries/, /lookup/goals/, /lookup/specializations/,
/lookup/languages/ once on app initialization and store in global state
(Redux/Context). These change rarely and do not need re-fetching.
