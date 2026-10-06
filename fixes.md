# Fixes

## Fix 1 — Bug A: Payment amount data type

**Files Changed**
- `src/routes/payment.routes.js`

**Code Change**
- Replaced string conversion of payment amounts with numeric values using `Number(...)` in both GET endpoints.

**Why**
Payment amounts are numeric domain values and should be exposed as JSON numbers so API consumers can safely perform calculations.

**Testing**
- `GET /api/payments` asserts `typeof amount === "number"`.
- `GET /api/payments/:id` asserts the same.

## Fix 2 — Bug B: Maximum payment amount

**Files Changed**
- `src/routes/payment.routes.js`

**Code Change**
- Added `MAX_PAYMENT_AMOUNT = 50000`.
- Requests above that limit return HTTP 400.

**Why**
Prevents accidental or malicious high-value transactions beyond the defined business rule.

**Testing**
- A request with `50000.01` is rejected with HTTP 400 and a maximum-limit message.

## Fix 3 — Bug C: Email validation

**Files Changed**
- `src/routes/auth.routes.js`

**Code Change**
- Updated the email regex to require a hostname and TLD.

**Why**
Prevents invalid addresses such as `user@domain` from being persisted.

**Testing**
- `user@domain` is rejected with HTTP 400.
- A normal `user@example.com` address is accepted.

## Fix 4 — Bug D: Webhook signature verification

**Files Changed**
- `src/routes/webhook.routes.js`

**Code Change**
- Added HMAC-SHA256 calculation.
- Validated signature format.
- Compared the provided and expected signatures with `crypto.timingSafeEqual`.

**Why**
Payment state must not be changed by an unauthenticated/spoofed provider request.

**Testing**
- Invalid signature returns HTTP 401.
- Correctly signed webhook returns HTTP 200.

**Production Note**
The exercise secret remains in code to preserve the supplied test contract. A production deployment should use an environment/secret manager and verify the provider's exact raw request body/signature format.

## Fix 5 — Bug E: Webhook idempotency

**Files Changed**
- `src/routes/webhook.routes.js`

**Code Change**
- Require `event_id`.
- Check `db.processed_webhooks` before processing.
- Record the event ID after a successful payment update.

**Why**
Payment providers commonly retry webhook delivery; the same event must not produce repeated business effects.

**Testing**
- The same signed event is posted twice.
- The first request succeeds and the event is recorded once.
- The second request is acknowledged as already processed.

**Production Note**
The in-memory list is intentionally limited to the exercise. Production should use a durable unique idempotency key/store.

## Fix 6 — Bug F: Duplicate pending table orders

**Files Changed**
- `src/routes/table-order.routes.js`

**Code Change**
- Added a lookup for an existing pending order matching merchant and table.
- Return HTTP 409 when one exists.

**Why**
Prevents duplicate fulfillment/charging for the same open table order.

**Testing**
- First order is created successfully.
- Identical second order is rejected with HTTP 409.

## Fix 7 — Bug G: Duplicate e-invoice submissions

**Files Changed**
- `src/routes/einvoice.routes.js`

**Code Change**
- Block invoices already marked `submitted` or `accepted` before generating a new submission ID.

**Why**
Avoids duplicate submissions to a tax authority and the resulting reconciliation/compliance issues.

**Testing**
- First submission succeeds.
- Second submission for the same invoice returns HTTP 409.

## Additional testability hardening

**File Changed**
- `src/server.js`

The Express app is exported without opening a listening port when imported by tests. `npm start` still starts the HTTP/Socket.IO server normally. This prevents port conflicts when the five test files are executed together.
