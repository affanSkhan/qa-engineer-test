# Fixes

## 1. Bug A — Numeric payment amounts
Changed both payment GET responses to return numeric amounts instead of strings. Regression tests cover list and detail endpoints.

## 2. Bug B — €50,000 maximum
Added `MAX_PAYMENT_AMOUNT` and numeric upper-bound validation. Requests above the ceiling return HTTP 400.

## 3. Bug C — Email TLD validation
Updated email validation so a hostname and TLD are required. Tests cover invalid and valid addresses.

## 4. Bug D — HMAC webhook verification
Implemented HMAC-SHA256 verification, format validation, and constant-time comparison using `crypto.timingSafeEqual`. Production should load secrets from environment/secret-management infrastructure.

## 5. Bug E — Webhook idempotency
Require `event_id`, check `db.processed_webhooks`, and record successful events. Replays are acknowledged without repeating the mutation.

## 6. Bug F — Pending table-order duplicate prevention
Added a merchant/table/status lookup before insertion and return HTTP 409 for an existing pending order.

## 7. Bug G — Duplicate e-invoice prevention
Added a guard for `submitted` and `accepted` invoices before generating a new submission ID.

All changes preserve existing endpoint paths and response contracts as much as possible.