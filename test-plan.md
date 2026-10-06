# Webhook Payment Flow — Test Plan

## 1. Test Scope

**In scope:** End-to-end testing of `POST /api/webhooks/payment-status`: signature verification, payload validation, idempotency, payment lookup, state mutation, and database integration.

**Out of scope:** UI testing, performance/load testing, production infrastructure, external-provider certification, and durable PostgreSQL/Redis behavior because the exercise uses an in-memory database.

## 2. Test Environment
- API: `http://localhost:3000`
- Clients: curl/Postman and Node.js Supertest
- Database: in-memory, reset/seed on process initialization
- Node.js: 20+
- Signature: HMAC-SHA256 with the exercise secret

## 3. Test Scenarios
| ID | Scenario | Expected |
|---|---|---|
| WH-01 | Valid webhook + correct signature | 200; payment updated |
| WH-02 | Invalid signature | 401; no state change |
| WH-03 | Same event_id twice | Second delivery acknowledged; no second side effect |
| WH-04 | Non-existent payment | 404 |
| WH-05 | Event before payment creation | 404; no mutation |
| WH-06 | Multiple statuses for same payment | State follows accepted business rules |
| WH-07 | Missing required fields | 400 |
| WH-08 | Malformed JSON | 4xx; no state mutation |
| WH-09 | Concurrent duplicate deliveries | One business mutation |
| WH-10 | Injection-like payment_id | Treated as opaque identifier |
| WH-11 | Timing-sensitive signature comparison | Constant-time comparison path |
| WH-12 | Replay of known event_id | No repeated mutation |

## 4. Security Tests
- HMAC verification: valid signature succeeds; altered payload/signature fails.
- Replay protection: repeated event IDs do not repeat business side effects.
- Injection: values such as `1' OR '1'='1` are treated as identifiers.
- XSS payloads: markup/script-like status values must not execute; downstream consumers must encode untrusted text.

## 5. Edge Cases
Very large payment IDs; null/empty event IDs; Unicode statuses; future timestamps; missing signature; malformed signature; replay after restart (documented limitation of in-memory store).

## 6. Integration Tests
- Webhook → Payment → Database: state changes only after successful checks.
- Webhook → Socket.IO: current implementation has no payment-status socket emission; cover when that contract exists.
- Failure → Retry: no queue/retry engine exists; provider retries depend on idempotency.

## 7. Risk Assessment
| Risk | Detection | Mitigation |
|---|---|---|
| Forged webhook | Signature tests + monitoring | HMAC verification, secret rotation |
| Duplicate delivery | Duplicate-event tests | Durable idempotency store |
| Concurrent race | Concurrency tests | Atomic insert/unique DB constraint |
| Replay | Replay tests | Durable event store + age/nonce policy |
| Secret leakage | Secret scanning | Environment/secret manager |
| Oversized payloads | Negative tests | Body-size limits + schema validation + rate limiting |

## Exit Criteria
All P0 scenarios pass, invalid signatures never mutate state, duplicate events are idempotent, and `npm test` passes.