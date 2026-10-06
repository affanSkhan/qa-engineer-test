# Bug Reports

Testing covered happy paths, negative inputs, edge cases, security cases, duplicate deliveries, and webhook/payment integration behavior. All seven intentional bugs were reproduced against the baseline implementation.

## Bug A: Payment amount serialized as a string

**Location:** `src/routes/payment.routes.js` (payment list/detail response mapping)  
**Severity:** Medium  
**Component:** Payment API

**How to Reproduce**
1. Start the API with `npm start`.
2. Login using `POST /api/auth/login` with `merchant@test.com` / `Test123!`.
3. Call `GET /api/payments` using the returned Bearer token.
4. Inspect `data[0].amount`.

**Expected Behavior:** `amount` is a JSON number, e.g. `25.5`.

**Actual Behavior:** The baseline returned `"25.5"`; `GET /api/payments/:id` had the same behavior.

**Impact:** API clients need unnecessary parsing and numeric calculations can become type-sensitive.

**Root Cause:** The baseline response mapper called `toString()` on numeric amounts.

**Suggested Fix:** Preserve the numeric value instead of converting it to a string.

## Bug B: Missing maximum payment amount

**Location:** `src/routes/payment.routes.js` (POST validation)  
**Severity:** High  
**Component:** Payment API

**How to Reproduce**
1. Login to obtain a JWT.
2. Send `POST /api/payments` with `amount: 999999`, currency `EUR`, and a valid customer email.
3. Observe the response.

**Expected Behavior:** Values over €50,000 are rejected with HTTP 400.

**Actual Behavior:** The baseline accepted the transaction.

**Impact:** Creates financial/business-rule exposure to accidental or malicious high-value transactions.

**Root Cause:** Positive-number validation existed, but no upper bound was enforced.

**Suggested Fix:** Define a transaction ceiling and reject any numeric amount above €50,000.

## Bug C: Email validator accepts hostnames without TLD

**Location:** `src/routes/auth.routes.js` (email regex)  
**Severity:** Medium  
**Component:** Auth API

**How to Reproduce**
1. Send `POST /api/auth/register`.
2. Use `email: "user@domain"` with a valid password and business name.
3. Observe that the baseline registration succeeds.

**Expected Behavior:** The assignment's email rule requires a hostname with a TLD, so `user@domain` should be rejected.

**Actual Behavior:** The baseline regex accepted the address.

**Impact:** Invalid merchant contact data can be persisted and later used by authentication/contact integrations.

**Root Cause:** The regex required text around `@` but did not require a dot/TLD.

**Suggested Fix:** Require a hostname suffix/TLD in the email validation regex.

## Bug D: Payment webhook accepts spoofed signatures

**Location:** `src/routes/webhook.routes.js` (payment-status handler)  
**Severity:** Critical  
**Component:** Webhooks

**How to Reproduce**
1. Send `POST /api/webhooks/payment-status`.
2. Set `x-webhook-signature` to an arbitrary value.
3. Provide a real payment ID and status.
4. Observe that the baseline updates the payment.

**Expected Behavior:** Requests with invalid/missing signatures are rejected with HTTP 401 and must not change payment state.

**Actual Behavior:** The baseline did not verify the supplied signature.

**Impact:** An attacker could forge provider events and manipulate payment state.

**Root Cause:** The HMAC calculation/comparison was present only as commented-out guidance.

**Suggested Fix:** Calculate HMAC-SHA256 and compare signatures using constant-time comparison.

## Bug E: Payment webhook is not idempotent

**Location:** `src/routes/webhook.routes.js` (payment-status handler)  
**Severity:** High  
**Component:** Webhooks

**How to Reproduce**
1. Send the same signed webhook payload twice with the same `event_id`.
2. Observe both baseline requests are accepted as new processing attempts.

**Expected Behavior:** The first event is processed; subsequent deliveries of the same `event_id` are acknowledged without repeating the business effect.

**Actual Behavior:** The baseline did not check or record processed event IDs.

**Impact:** Provider retries can duplicate side effects and make payment state transitions unreliable.

**Root Cause:** The intended idempotency check and event recording were commented out.

**Suggested Fix:** Require `event_id`, check a durable processed-event store, and record the ID only after successful processing.

## Bug F: Duplicate pending table orders are allowed

**Location:** `src/routes/table-order.routes.js` (POST handler)  
**Severity:** Medium  
**Component:** Table Orders

**How to Reproduce**
1. Create a pending order for the same merchant and table.
2. Repeat the request while the first order is pending.
3. Observe that the baseline creates another order.

**Expected Behavior:** The second request returns HTTP 409.

**Actual Behavior:** Multiple pending orders could exist for the same merchant/table.

**Impact:** Staff can process duplicate orders or charges for the same table.

**Root Cause:** The baseline duplicate-order lookup was commented out.

**Suggested Fix:** Query for an existing pending order for the same merchant/table before insertion.

## Bug G: Duplicate e-invoice submissions are allowed

**Location:** `src/routes/einvoice.routes.js` (POST /submit)  
**Severity:** Medium  
**Component:** E-Invoicing

**How to Reproduce**
1. Submit an invoice once with a valid 14-digit SIRET.
2. Submit the same `invoice_id` again.
3. Observe that the baseline creates a new submission ID.

**Expected Behavior:** An invoice already in submitted/accepted state returns HTTP 409 rather than being submitted again.

**Actual Behavior:** The baseline allowed another submission.

**Impact:** Duplicate tax submissions create reconciliation, compliance, and accounting risk.

**Root Cause:** There was no submitted/accepted-state guard.

**Suggested Fix:** Reject duplicate submission attempts before generating a new provider submission ID.
