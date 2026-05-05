# **7. Admin APIs**

## **7.1 User Account Management**

**GET api/v1/lookup/admin/users/** --- List all users --- Admin Auth

**Field** **Type** **Required** **Description**

---

role string No Filter by role: client, nutritionist, high_admin
is_active boolean No Filter active/banned users
search string No Search by username or email

**GET api/v1/lookup/admin/users/{id}/** --- Get full user detail --- Admin Auth

**PATCH api/v1/lookup/admin/users/{id}/ban/** --- Ban or unban a user --- Admin Auth

**Field** **Type** **Required** **Description**

---

is_banned boolean Yes True to ban, false to unban (sets is_active on users table)

**DELETE api/v1/lookup/admin/users/{id}/delete/** --- Permanently delete user account ---
Admin Auth

> **⚠** _This is irreversible. All associated data (plans,
> consultations, logs) will be cascade-deleted per FK constraints._

## **7.2 Nutritionist Approval (NEW)**

> **NEW** _This is a new section added to support the nutritionist
> approval workflow. When a nutritionist registers, their account starts
> with approval_status=pending. The admin must review their
> certification and either approve or reject the account before they can
> access the platform._

**GET api/v1/lookup/nutritionists/pending/** --- List all nutritionists pending
approval --- Admin Auth

**Field** **Type** **Description**

---

id integer User ID
username string Username
email string Email address
nutritionist.nutritionist_id integer Nutritionist profile ID
nutritionist.specialization.name string Area of specialization
nutritionist.years_experience integer Years of experience
nutritionist.certification_ref string Certification reference number
nutritionist.cert_image_url string URL to uploaded certification document
nutritionist.approval_status string Always pending in this list
created_at timestamp Registration date

**GET api/v1/lookup/nutritionists/{id}/** --- Get full nutritionist detail for
review --- Admin Auth

Returns the same fields as the pending list plus the full profile
including bio, languages, country, and consultation_price.

**POST api/v1/lookup/nutritionists/{id}/approve/** --- Approve a nutritionist
account --- Admin Auth

No request body required.

**Response --- 200 OK**

**Field** **Type** **Description**

---

user.id integer User ID
nutritionist.approval_status string approved
message string Confirmation message

> **ℹ** _On approval: sets approval_status=approved on the
> NutritionistProfile, sets user.is_active=true, and sends a
> notification to the nutritionist informing them their account is
> approved and they can now log in._

**POST api/v1/lookup/nutritionists/{id}/reject/** --- Reject a nutritionist
account --- Admin Auth

**Field** **Type** **Required** **Description**

---

rejection_reason string Yes Clear explanation sent to the nutritionist

**Response --- 200 OK**

**Field** **Type** **Description**

---

user.id integer User ID
nutritionist.approval_status string rejected
nutritionist.rejection_reason string The reason stored on the profile
message string Confirmation message

> **ℹ** _On rejection: sets approval_status=rejected, stores
> rejection_reason on NutritionistProfile, sets user.is_active=false,
> and sends a notification to the nutritionist with the rejection
> reason._
>
> **⚠** _A rejected nutritionist cannot log in. They may re-register
> with a new account or contact admin support._

**POST api/v1/lookup/nutritionists/{id}/re-review/** --- Move a rejected
nutritionist back to pending --- Admin Auth

No request body required. Allows admin to reconsider a previously
rejected account.

**Field** **Type** **Description**

---

nutritionist.approval_status string pending
message string Confirmation message

## **7.3 Plan Moderation**

**GET api/v1/lookup/admin/plans/** --- List all plans pending moderation --- Admin
Auth

**Field** **Type** **Required** **Description**

---

status string No Filter: pending, approved, rejected, deleted

**GET api/v1/lookup/admin/plans/{id}/** --- Get plan detail for review --- Admin Auth

**POST api/v1/lookup/admin/plans/{id}/approve/** --- Approve a plan for marketplace
--- Admin Auth

**POST api/v1/lookup/admin/plans/{id}/reject/** --- Reject a plan with reason ---
Admin Auth

**Field** **Type** **Required** **Description**

---

rejection_reason string Yes Clear explanation for the nutritionist

**POST api/v1/lookup/admin/plans/{id}/archive/** --- Soft-delete / archive a plan ---
Admin Auth

> **ℹ** _All moderation actions create a plan_moderation_logs entry and
> trigger a notification to the plan\'s creator._

## **7.4 Post Moderation**

**GET api/v1/lookup/admin/posts/** --- List posts pending approval --- Admin Auth

**PATCH api/v1/lookup/admin/posts/{id}/approve/** --- Approve a post (sets
is_approved=true) --- Admin Auth

**PATCH api/v1/lookup/admin/posts/{id}/reject/** --- Reject and hide a post --- Admin
Auth

**DELETE api/v1/lookup/admin/posts/{id}/** --- Delete a post permanently --- Admin
Auth

## **7.5 Blog Management**

**GET api/v1/blog/** --- List all published blog articles --- No Auth required

**GET api/v1/blog/{id}/** --- Get single blog article --- No Auth required

**POST api/v1/lookup/admin/blog/** --- Create a new blog article --- Admin Auth

**Field** **Type** **Required** **Description**

---

title string Yes Article title
content string Yes Full article body (HTML or Markdown)

**PATCH api/v1/lookup/admin/blog/{id}/** --- Edit an existing article --- Admin Auth

**DELETE api/v1/lookup/admin/blog/{id}/delete/** --- Delete a blog article --- Admin Auth

## **7.6 User Inquiries (Support Tickets)**

**GET api/v1/lookup/admin/inquiries/** --- List all feedback tickets --- Admin Auth

**Field** **Type** **Required** **Description**

---

status string No Filter: open or resolved

**GET api/v1/lookup/admin/inquiries/{id}/** --- Get inquiry detail --- Admin Auth

**PATCH api/v1/lookup/admin/inquiries/{id}/respond/** --- Submit admin response and
mark resolved --- Admin Auth

**Field** **Type** **Required** **Description**

---

admin_response string Yes Admin\'s reply message
status string No resolved to close the ticket (default: resolved)

> **ℹ** _Responding to an inquiry triggers a notification to the client
> who submitted the feedback._