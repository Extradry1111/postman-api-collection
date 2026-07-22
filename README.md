# Automation Exercise — Postman/Newman API Collection

A Postman collection covering the [automationexercise.com](https://automationexercise.com)
REST API — the same target API as the
[Playwright automation framework](../qa-automation-framework) in this portfolio,
tested through a different tool.

## Why this exists alongside a code-based API test suite

Most teams don't pick one API testing approach and stop — Postman/Newman
remains extremely common for quick manual exploration, ad-hoc smoke checks
during incident response, and handing off a "here's how to verify this API"
artifact to someone non-technical (a PM, a support engineer) who will never
open a TypeScript file but can absolutely run a Postman collection.

Showing both — a coded framework AND a Postman collection, against the same
API — demonstrates comfort with both ends of that spectrum rather than just
one tool in isolation.

## What's covered

14 requests across 4 folders, run in a specific order (numbered folder
prefixes enforce this in Newman/Collection Runner):

| Folder | Requests |
|---|---|
| `01 - Account Setup` | Create Account (generates a unique test user via pre-request script) |
| `02 - Products & Brands` | Get Products, wrong-verb negative, Get Brands, wrong-verb negative, Search (valid + missing-parameter negative) |
| `03 - Account Verification` | Verify Login (valid, invalid, missing-parameter negative, wrong-verb negative), Get User Detail, Update Account |
| `04 - Cleanup` | Delete Account (runs last, so repeated runs don't pile up test accounts on the shared target) |

31 assertions total across the 14 requests — every request has both a status
check and a body/contract check, and every "happy path" endpoint has a
paired negative test (wrong HTTP verb or missing required parameter).

## Design decisions

**Why a pre-request script to generate the test user, instead of a fixed
fixture account?**
Same reasoning as the Playwright suite: `/createAccount` rejects an email
that's already registered, so a hardcoded fixture would work once and then
fail every subsequent run. The `Create Account` request's pre-request script
generates a unique `dynamic_email`/`dynamic_name`/`dynamic_password` and
stores them as collection variables, which every later request in the run
references via `{{dynamic_email}}` etc.

**Why does `Delete Account` run last, in its own folder?**
So a full collection run is self-cleaning — it doesn't leave orphaned test
accounts behind on automationexercise.com's shared, public database, no
matter how many times this collection gets run in CI or locally.

**Why is the "wrong HTTP verb" quirk asserted so explicitly?**
automationexercise.com's API returns HTTP 200 even for disallowed verbs and
malformed requests — the real error only shows up as `responseCode` inside
the JSON body. See
[`../qa-automation-framework/docs/SAMPLE_BUG_REPORT.md`](../qa-automation-framework/docs/SAMPLE_BUG_REPORT.md)
for the full write-up. Every test that hits this quirk has an inline comment
explaining it, so a future maintainer doesn't "fix" the assertion into a
standard HTTP-status check and silently break the test.

## Environments

| Environment | `base_url` | Use case |
|---|---|---|
| `production.postman_environment.json` | `https://automationexercise.com/api` | The real target — what CI runs against |
| `local-mock.postman_environment.json` | `http://localhost:3000/api` | A minimal local mock server (see below) |

## About the local mock server

`mock-server/server.js` is a ~100-line Node script that replicates just
enough of the real API's behavior (status codes, response shapes, the
wrong-verb/missing-parameter quirks) to validate that the collection's
*mechanics* work end-to-end — variable chaining across requests,
pre-request scripts, assertions — without depending on network access to
the live site.

**This mock server is a development/validation aid, not part of the
portfolio deliverable itself.** The collection is written to run against
the real API by default (see the `production` environment); the mock exists
so the collection's correctness could be verified in a sandboxed environment
with no outbound internet access. In normal use — locally or in the GitHub
Actions workflow in this repo — the collection runs against the live
automationexercise.com API.

A full run against the mock server: **14/14 requests, 31/31 assertions
passing.** See `reports/local-mock-run-report.html` for the captured report
from that validation run.

## Running It

### Option A — Postman GUI
1. Import `collections/AutomationExercise.postman_collection.json`
2. Import `environments/production.postman_environment.json`
3. Select the "Production" environment (top-right dropdown)
4. Click **Run** on the collection (Collection Runner) — keep folders in
   their numbered order

### Option B — Newman (CLI / CI)
```bash
git clone <your-repo-url>
cd postman-api-collection
npm install

npm test              # run against the live API, CLI output only
npm run test:report   # same, plus an HTML report in reports/run-report.html
```

### Option C — validate against the local mock (no internet required)
```bash
npm install
npm run mock-server &      # starts the mock on :3000
npm run test:local-mock    # runs the collection against it
```

## CI

`.github/workflows/newman-ci.yml` runs the collection against the live API
on every push/PR to `main`, nightly on a schedule, and on demand. The HTML
report is uploaded as a build artifact on every run, pass or fail.

## Project Structure

```
postman-api-collection/
├── README.md
├── package.json
├── collections/
│   └── AutomationExercise.postman_collection.json
├── environments/
│   ├── production.postman_environment.json
│   └── local-mock.postman_environment.json
├── mock-server/
│   └── server.js                 # local validation aid, see note above
├── reports/
│   └── local-mock-run-report.html  # sample report from a mock-server validation run
└── .github/workflows/
    └── newman-ci.yml
```
