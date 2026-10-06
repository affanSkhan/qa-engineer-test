# EU Pay QA Engineer Assignment — Completed Submission

This repository contains the completed submission for the EU Pay QA Tester Intern assessment.

## Completed
- Reproduced and documented all 7 intentional bugs.
- Fixed all 7 bugs without changing public endpoint paths.
- Added automated regression tests using the Node.js test runner and Supertest.
- Added webhook security/idempotency coverage and a dedicated webhook test plan.

## Run locally
Requires Node.js 20+.

    npm install
    npm test
    npm start

The API runs at http://localhost:3000.

## Submission documents
- bug-reports.md
- fixes.md
- test-plan.md
- README-SUBMISSION.md

## Important implementation notes
Webhook signatures use HMAC-SHA256 and constant-time comparison. Duplicate webhook events, pending table orders, and submitted/accepted e-invoices are guarded before applying their business effect. The Express app can be imported by tests without binding a listening socket.
