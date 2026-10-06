# Bug Reports

All seven intentional bugs were reproduced from the supplied baseline using API-oriented happy-path, negative, edge-case, and security testing.

## Bug A — Payment amount returned as string
**Location:** `src/routes/payment.routes.js`  
**Severity:** Medium  
**Reproduce:** Authenticate, call `GET /api/payments` and inspect `data[0].amount`.  
**Expected:** JSON number such as `25.5`.  
**Actual:** Baseline returned `"25.5"`; the single-payment endpoint had the same issue.  
**Impact:** Consumers need unnecessary parsing and type-sensitive calculations may behave incorrectly.  
**Root Cause:** `toString()` was explicitly applied during response formatting.  
**Fix:** Preserve the numeric value with `Number(...)`.

## Bug B — Missing maximum payment limit
**Location:** `src/routes/payment.routes.js`  
**Severity:** High  
**Reproduce:** Authenticate and send `POST /api/payments` with `amount: 999999`.  
**Expected:** HTTP 400 for amounts above €50,000.  
**Actual:** Baseline accepted the request.  
**Impact:** Financial/business-rule risk and accidental or malicious high-value transactions.  
**Root Cause:** No upper-bound validation.  
**Fix:** Reject numeric amounts above 50,000.

## Bug C — Email validation accepts `user@domain`
**Location:** `src/routes/auth.routes.js`  
**Severity:** Medium  
**Reproduce:** Register with `user@domain`, valid password, and business name.  
**Expected:** HTTP 400 under the assignment's email-validation rule.  
**Actual:** Baseline accepted it.  
**Impact:** Invalid merchant contact data can enter the system.  
**Root Cause:** Regex did not require a TLD.  
**Fix:** Require a domain suffix/TLD.

## Bug D — Webhook signature not verified
**Location:** `src/routes/webhook.routes.js`  
**Severity:** Critical  
**Reproduce:** POST a payment-status webhook using an arbitrary signature.  
**Expected:** HTTP 401 and no payment mutation.  
**Actual:** Baseline processed the payload.  
**Impact:** Attackers could forge payment state changes.  
**Root Cause:** HMAC logic was commented out.  
**Fix:** Compute HMAC-SHA256 and compare with `timingSafeEqual`.

## Bug E — Webhook not idempotent
**Location:** `src/routes/webhook.routes.js`  
**Severity:** High  
**Reproduce:** Send the same signed webhook twice with the same `event_id`.  
**Expected:** First request processes; later delivery is acknowledged without a second business effect.  
**Actual:** Baseline had no processed-event check and did not record event IDs.  
**Impact:** Provider retries can duplicate side effects and produce inconsistent transitions.  
**Root Cause:** Intended idempotency code was commented out.  
**Fix:** Require/check/record `event_id`.

## Bug F — Duplicate pending table orders
**Location:** `src/routes/table-order.routes.js`  
**Severity:** Medium  
**Reproduce:** POST the same merchant/table order twice while the first is pending.  
**Expected:** Second request returns HTTP 409.  
**Actual:** Baseline created another pending order.  
**Impact:** Duplicate restaurant fulfillment/charging risk.  
**Root Cause:** Duplicate lookup was commented out.  
**Fix:** Reject an existing pending order for the same merchant/table.

## Bug G — Duplicate e-invoice submissions
**Location:** `src/routes/einvoice.routes.js`  
**Severity:** Medium  
**Reproduce:** Submit the same invoice twice.  
**Expected:** Second submission returns HTTP 409.  
**Actual:** Baseline generated a second submission ID.  
**Impact:** Tax, reconciliation, and accounting risk.  
**Root Cause:** No submitted/accepted-state guard.  
**Fix:** Block duplicate submissions before external provider submission.
