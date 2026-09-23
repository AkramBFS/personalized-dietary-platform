# Historical Secret Scan & Cryptographic Audit Record

**Project**: NutriPlatform (SVMB)  
**Date of Audit**: September 23, 2026  
**Auditor**: Antigravity Automated Security Audit  
**Scope**: Full git history across all 247 commits in all local branches and refs.

---

## 1. Scan Methodology

A full-history commit and tree scan was executed using git rev-list inspection (`scratch/scan_history.py`), analyzing all added lines in every commit diff for high-entropy strings, API keys, private keys, database connection strings, JWTs, and authentication secrets.

---

## 2. Findings & Remediation Inventory

| # | Type | Commit | Author | Date | Location / Snippet | Real Status | Remediation Completed |
|---|------|--------|--------|------|--------------------|-------------|-----------------------|
| 1 | **Committed Virtualenv** | `62d741e` | soheib | Apr 8, 2026 | `backend/nutriplatform/venv/` (7,488 files) | **PURGED** | Scrubbed from git packfiles via `git filter-repo` in commit `59a27d0`. Repository shrunk from 3.35 GB to 157 MB. |
| 2 | **Historical JWT Tokens** | `813f054` | AkramBFS | May 3, 2026 | `docs/api/APIdoc.md` (fixtures for `user_id: 15`) | **REVOKED & BLACKLISTED** | 1. Naturally expired on May 10, 2026.<br>2. Explicitly blacklisted in SimpleJWT database via migration `users.0003_blacklist_historical_tokens` (JTI `60edc91b232c43f2a781229aa1aab868`).<br>3. Regression test verified in `test_historical_committed_tokens_rejected_and_blacklisted`. |
| 3 | **Synthetic CI Secret Key** | `84dea51` | Mohamed Akram Boufas | Sep 21, 2026 | `.github/workflows/ci.yml` (`0123456789abcdef...`) | **NON-PRODUCTION ONLY** | Synthetic 64-character hex placeholder strictly scoped to ephemeral GitHub Actions CI runner jobs. Not valid on production. |
| 4 | **Test Fixture Passwords** | `02717ab`, `aa83820`, `af4fba3` | Mohamed Akram Boufas | Sep 7-21, 2026 | Unit test suites (`*Password123!`) | **SAFE (FIXTURES ONLY)** | Used exclusively in automated tests (`TestCase.setUp`) with in-memory test databases. |
| 5 | **Active Environment Secrets** | Working tree `.env` | Local developer | Current | `CALORIE_NINJAS_KEY`, `GROQ_API_KEY`, etc. | **UNCOMMITTED** | Confirmed strictly untracked. `.gitignore` actively prevents tracking. Never committed to git history. |

---

## 3. Token Blacklist Verification

The historical refresh token surfaced from commit `813f054`:
- **JTI**: `60edc91b232c43f2a781229aa1aab868`
- **Issued At**: `1777821728` (Sun May 3, 2026 15:22:08 UTC)
- **Expires At**: `1778426528` (Sun May 10, 2026 15:22:08 UTC)
- **Database Entry**: Linked to `OutstandingToken` and `BlacklistedToken` via migration `users.0003_blacklist_historical_tokens.py`.
- **Enforcement Test**: Automated test in `users.tests.test_auth_integration.AuthIntegrationTests.test_historical_committed_tokens_rejected_and_blacklisted` asserts that calling `/api/v1/auth/token/refresh/` with this token returns HTTP 401 Unauthorized.
