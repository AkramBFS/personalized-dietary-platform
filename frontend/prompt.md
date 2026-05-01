Final AI Integration Blueprint & Feature Contract

(Frontend–Backend Integration, Defensive Programming, and API Compliance)

1. Mission Statement (Authoritative)

The AI agent’s responsibility is full, correct, and crash-proof integration between the existing frontend UI and the NUTRI PLATFORM REST API, using the official API documentation (APIdoc.md) and project specifications as the source of truth.

The agent MUST:
Integrate all already-built UI components with live backend data
Use only existing API endpoints
Fix broken, incomplete, or unsafe integrations
Apply strict defensive programming to prevent runtime crashes
Produce a long, detailed, written integration plan before touching code
The agent MUST NOT:
Alter frontend architecture
Create new UI components
Guess API schemas
Introduce unsafe rendering logic
Silently drop required fields 2. Non-Negotiable Global Constraint
Frontend Architecture Lock

The frontend architecture is complete and frozen.

The AI agent acts strictly as integration glue between:

Existing UI components
Existing backend endpoints

If an API feature cannot be wired because a required UI component does not exist:

The agent MUST flag it as an
Incomplete Integration Point

The agent must never invent UI to compensate.

3. Universal “App-Killer” Defense Protocol (Highest Priority)

The most critical failure to eliminate:

TypeError: map is not a function
→ Causes blank screens by unmounting the React tree

This is an application-killing runtime error.

Mandatory Three-Layer Safety Pattern (ENFORCE)

This pattern must be applied to every list-based API integration, without exception.

Layer 1 — Service / Extraction Layer

Never pass raw API responses to components.

All API services must normalize data into safe arrays.

Required extraction pattern:
const list = response.data?.results ?? response.data ?? [];
return Array.isArray(list) ? list : [];

This MUST handle:

Paginated responses { count, results }
Flat arrays
null, undefined, or malformed responses
404 / empty responses

Forbidden:

return response.data;
Layer 2 — State Initialization Layer

All list state must initialize as arrays, never undefined.

Bad:

const [items, setItems] = useState();

Required:

const [items, setItems] = useState<any[]>([]);

This rule applies to:

Lookups
Tables
Dropdowns
Lists
AI results
Plans
Logs
Patients
Any iterable UI
Layer 3 — Defensive Rendering Layer

Components must never assume iterability.

{Array.isArray(items) && items.map(item => (
<Component key={item.id} />
))}

Forbidden:

items.map(...) 4. Lookup System Integration (HIGH PRIORITY)
File: lookup.ts

This file is the single source of truth for all dropdown and lookup data.

Global Rules
Lookups do not support pagination
Lookups must be:
Fetched on application load
Cached
Normalized
Lookups must never return:
null
undefined
objects
raw API responses
Required Lookups

Base Path: /api/v1/lookup/

Lookup Endpoint Required Mapping
Countries GET /countries { id, name }
Goals GET /goals { id, name }
Specializations GET /specializations { id, name }
Languages GET /languages { id, name }
Activity Levels GET /activity-levels { id, name }
Diets GET /diets { id, name }
Known Issues (Must Be Fixed)
Language lookup is broken
Unsafe assumptions about response shape
Missing diet and activity-level support
Required Service Pattern
export async function getLanguages() {
const res = await api.get('/lookup/languages');
const list = res.data?.results ?? res.data ?? [];
return Array.isArray(list) ? list : [];
}

Each lookup must:

Use its own function
Normalize output
Return an array always 5. Authentication & Registration Workflows
5.1 Login (POST /auth/login/)
Already functional
Agent must:
Verify payload shape matches APIdoc.md
Confirm JWT storage and reuse
Intercept backend error codes
Error Handling
403 ACCOUNT_PENDING_APPROVAL
403 ACCOUNT_REJECTED

These must:

Prevent dashboard access
Route user to correct informational UI
Success Routing

On 200 OK, immediately route based on role:

client → /dashboard/client
nutritionist → /dashboard/nutritionist
admin → /dashboard/admin
5.2 Client Registration (POST /auth/register/client/)
Mandatory Payload Fields
username
email
password
age
weight
height
gender
country_id
goal_id

Field names are case-sensitive.

Critical Rule

Do NOT compute BMI or BMR on the frontend

The backend computes and returns these automatically.

5.3 Nutritionist Registration (POST /auth/register/nutritionist/)
Multipart Requirement
Must use multipart/form-data
Must include cert_image
Approval State Logic
Endpoint does not return JWT
User must be redirected to:
“Pending Review” screen
Error Code
CERT_REQUIRED → show file upload error if buffer is empty 6. Client-Side Core & Premium Features
6.1 AI Calorie Tracker (Premium Only)
Access Control
Check is_premium flag
If false:
Show 403 NOT_PREMIUM UI state
Do NOT call API
Async Workflow
POST /client/calorie-tracker/ai/
(submit meal image)
Poll every 3 seconds:
GET /client/calorie-tracker/ai/{log_id}/
When status = pending_user_review:
Enable confirmation UI
Allow user to PATCH final mass estimates
6.2 Meal Plan Navigation
Content Fetching
GET /client/user-plans/{id}/content/?day={index}
Progress Update
PATCH /client/user-plans/{id}/advance/

Only trigger PATCH when user explicitly clicks
“Mark as Done”

7. Nutritionist & Admin Features
   7.1 Nutritionist Patient Management
   Health Data Access
   GET /nutritionist/patients/{client_id}/

Includes:

BMI
BMR
Health history
Private Clinical Notes
POST /nutritionist/patients/{client_id}/notes/

Notes are private to the nutritionist.

7.2 Admin Nutritionist Approval Workflow
Pending Queue
GET /admin/nutritionists/pending/
Approve
POST /admin/nutritionists/{id}/approve/

→ Sets is_active = true

Reject
POST /admin/nutritionists/{id}/reject/
Requires rejection_reason (string) 8. Common Backend Error Code Handling

The frontend must explicitly handle these codes:

Error Code Required UI Reaction
SLOT_UNAVAILABLE Show “Slot already booked”
PLAN_NOT_APPROVED Hide “Purchase” button
CERT_REQUIRED Block nutritionist submission
NOT_PREMIUM Lock premium feature UI 9. Mandatory Implementation Plan Output

Before writing code, the agent must produce a written plan containing:

9.1 File-by-File Integration Map

For each relevant file:

Purpose
APIs used
Input / output data shape
Failure modes
Defensive measures applied
9.2 API → UI Mapping Table

For every endpoint:

Endpoint
Method
Payload
Response shape
Consuming component(s)
9.3 Error-Handling Strategy
Loading states
Empty states
Failed request behavior
Graceful degradation paths
9.4 Explicit Risk Callouts

Every risk must be labeled as one of:

Potential App-Killer
Unsafe Assumption
Incomplete Integration Point 10. Source of Truth & Conflict Resolution

Priority order:

APIdoc.md
Backend behavior
Frontend assumptions

Frontend assumptions must always yield.

11. Success Criteria

Integration is considered complete when:

No runtime crashes occur
No unsafe .map() usage exists
Registration works end-to-end
Lookup system is stable and cached
Premium gating is enforced
All use cases are implemented or explicitly flagged
