# Improvement roadmap

Ranked for what this project actually is: an internal demo tool, run locally in
front of prospective partners, never deployed. Priority is therefore **what
breaks or obscures a live demo**, then **what slows down building the next
one** — not production-readiness.

Every file and line reference below was verified against `main` on 2026-09-21.
Line numbers drift; treat them as starting points.

| # | Item | Effort |
|---|------|--------|
| 1 | [Make failures legible](#1-make-failures-legible) | S |
| 2 | [Same-origin `/v1` proxy, and delete the dead interceptors](#2-same-origin-v1-proxy-and-delete-the-dead-interceptors) | M |
| 3 | [Pre-demo check script](#3-pre-demo-check-script) | S |
| 4 | [Multi-profile partner config](#4-multi-profile-partner-config) | M |
| 5 | [Fix the build](#5-fix-the-build) | L |
| 6 | [CI](#6-ci) | S |
| 7 | [Hygiene tail](#7-hygiene-tail) | varies |

**If you only do one thing, do 1 and 2 together.** They are adjacent in the
code, they address the two failure modes that actually cost time, and 2 removes
more code than it adds.

---

## 1. Make failures legible

**Problem.** `server/api/get-token.js:156-158` and `:181-183` catch the real
gateway status and body, log them server-side, and return a bare 500:

```js
} catch (error) {
  console.error('Error fetching customer token:', error);
  return res.status(500).json({ error: 'Failed to retrieve customer token' });
}
```

From the browser an auth failure is indistinguishable from any other 500. This
is the same defect class as the `[object Object]` bug already fixed in
`src/features/company/hooks.ts` — that fix was applied to one call site and not
generalised.

It costs real time. During the 2026-09-21 session a step failed with
`Something went wrong. Please try again later. :` while the API had returned
`"is required: run the job title eligibility check first and submit its id"` —
a complete, actionable instruction, discarded before it reached the screen.

**Do.** Propagate the gateway's status and body through both handlers rather
than flattening to 500. Reuse the `formatApiError` shape from `hooks.ts` so
errors read the same everywhere. Keep secrets out: pass the status, the error
code and the message, never the token or the request headers.

**Verify.** Point `REMOTE_CLIENT_SECRET` at a wrong value, call
`/api/fetch-customer-token`, and confirm the browser receives the gateway's
actual status and message instead of `Failed to retrieve customer token`.

---

## 2. Same-origin `/v1` proxy, and delete the dead interceptors

Two problems, one change.

**Problem A — the interceptors are pure waste.** `src/lib/api-client.ts:11` and
`:33` each fetch an access token into the browser and set an `Authorization`
header, which `server/api/proxy.js` then overwrites with its own token. The
result is an extra round trip on every request and access tokens sitting in
browser memory for no reason.

**Problem B — the SDK is a black box.** `RemoteFlowsWrapper.tsx:43-45` gives
`RemoteFlowsProvider` only `auth` and `environment`, no `proxy`. The SDK
therefore calls the gateway **directly** from the browser with an access token
it fetched itself. None of that traffic appears in the proxy log, which made
debugging the onboarding flow substantially harder — a field appeared on screen
that the server had no record of requesting.

**Do.** Mount the existing proxy middleware at `/v1` alongside `/api/v1` in
`server/api/routes.js:23`, and pass `proxy: { url: window.location.origin }` to
the provider so the SDK calls same-origin. Then delete both interceptor blocks
from `api-client.ts` — the proxy has attached the correct token all along.

`hibob-eor` already does this; its `routes.js` carries a useful warning worth
keeping: `proxy.js` strips the prefix with `req.originalUrl.replace('/api', '')`,
which removes the **first** occurrence anywhere in the string. A future path
containing the literal `/api` (say `/v1/companies/x/api-keys`) would be silently
mangled. Anchor the strip when you make this change.

**Verify.** Run an SDK onboarding and confirm every call now appears in the
proxy log with an auth type. Then check the browser devtools network tab shows
no requests going to `gateway.remote-sandbox.com` directly, and no access token
in any client-side response.

---

## 3. Pre-demo check script

**Problem.** The failure modes that ruin a demo are all invisible until you are
already presenting: wrong gateway, missing entitlement, stale credentials, a
token exchange that no longer works. `VITE_REMOTE_GATEWAY` silently defaults to
`partners` when unset, so an entire demo can run against the wrong environment.

**Do.** A `scripts/preflight.sh` that exits non-zero on the first hard failure:
confirm `.env` exists and has both credentials, print the resolved gateway and
require confirmation it is the intended one, perform a real client-credentials
token exchange, and confirm `server/session.json` is either absent or holds a
token that still redeems.

`hibob-eor` has a version of this, but it is wired to that demo's local Tiger
and Dragon services and hardcodes `VITE_PARTNER_PROFILE=hibob`. Take the shape,
not the contents.

**Verify.** Run it with a deliberately wrong secret and confirm it fails loudly
and says which check failed.

---

## 4. Multi-profile partner config

**Problem.** `src/config/partner.ts:1` imports a single hardcoded
`partner.config.json`, so standing up a new white-label demo means editing
source rather than adding configuration.

**Do.** Select a profile by env var — `partner.config.<name>.json` chosen via
`VITE_PARTNER_PROFILE` — so a new demo becomes "drop in a config file and a
logo". `hibob-eor` implements exactly this pattern in its `partner.ts`; adapt
the mechanism but **not** its contents, which hardcode Intuit, ADP, isolved and
HiBob and their exact brand colours.

Given that "branch from `main` and white-label it" is the entire workflow, this
is the largest lever on the recurring task.

**Verify.** Two profiles, switched by env var alone, with no source edits
between them. Add a unit test alongside `server/api/__tests__/proxy.test.ts`
asserting each profile loads and carries a complete colour set.

---

## 5. Fix the build

**Problem.** `npm run build` fails for two stacked reasons — see the CHANGELOG's
"Still open" table. The tsconfig project-reference error masks 20 real type
errors across 8 files.

**Ranked below the items above deliberately.** Nothing here is deployed, and
`npm run dev` does not typecheck, so a red build costs nothing day to day. Its
value is unlocking typechecking and CI, not shipping.

**Do.** Either give `tsconfig.node.json` `composite: true` and let `tsc -b`
work, or drop project references in favour of two explicit invocations — the
approach `hibob-eor` takes:

```json
"build": "tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit && vite build"
```

Then work through the 20 errors. **11 of them are mechanical** and can be
cleared in one pass:

| Code | Count | What it is |
|------|-------|------------|
| TS1484 | 9 | `verbatimModuleSyntax` — needs `import type` |
| TS6133 | 2 | declared but never read |
| TS2345 | 5 | argument type mismatch |
| TS2322 | 2 | assignment type mismatch |
| TS2551 / TS2339 | 2 | property does not exist |

The remaining 9 are genuine mismatches, concentrated in `JsonSchemaForm.tsx`
against `@remoteoss/json-schema-form`'s `SchemaValue` and `FieldConfig` types,
and they need actual thought rather than a find-and-replace.

**Verify.** `npm run build` exits 0.

---

## 6. CI

**Problem.** `main` has a test suite as of 2026-09-21 and nothing runs it. Tests
nobody runs stop being true.

**Do this only after 5.** A workflow that runs `npm ci && npm test` on pull
requests, extended to `lint` and `build` once those are green. Wiring it while
they fail trains everyone to ignore a red tick, which is worse than no CI.

**Verify.** Open a PR with a deliberately broken assertion and confirm it fails.

---

## 7. Hygiene tail

Real, but none of it will cost you a demo.

- **11 lint errors** on a fresh install, across `CreateCompany.tsx`,
  `JsonSchemaForm.tsx`, `FormFields.tsx`, `OnboardingSDK.tsx`. Mostly refs read
  during render and unused vars. The count moves with resolved plugin versions —
  compare against `main` in the same tree, not against this number.
- **`VITE_COMPANY_ID` is read but never defined** —
  `OnboardingSDK.tsx:474`, with `:553` telling the user to add it to `.env`. It
  is in no `.env.example`. Either document it or remove both references.
- **The gateway URL map is duplicated** between `server/api/get-token.js` and
  the `remote-flows` SDK. They agree today; nothing keeps them in sync.
- **The rotated refresh token is discarded.** `/auth/oauth2/token` returns a
  `refresh_token` alongside the access token, and nothing writes it back to
  `session.json`. Latent: Remote's docs do not state whether tokens rotate on
  redemption, and today they evidently do not. If that changes, the second
  refresh fails with `invalid_refresh_token` and there is no code path to
  recover.
- **Two sandbox refresh tokens remain in git history**, on `main` and the three
  demo branches. Inert without `REMOTE_CLIENT_SECRET`, which was never
  committed, and both point at sandbox. Rotating costs little; history rewriting
  is not worth it.
- **The demo branches still read the old `VITE_CLIENT_*` names** and will
  conflict on `server/session.json`. Only matters if someone merges `main` down
  — see the repo-root README.

---

## Not on this list, and why

**Reporting the SDK's swallowed error messages upstream.** When a step fails,
the SDK renders `Something went wrong. Please try again later.` and drops the
API's actual message. That is a genuine defect in `@remoteoss/remote-flows`, not
in this project, and item 1 above does not fix it — item 1 covers *our* handlers.
Worth raising with that team; it cannot be fixed here.

**Porting more from `hibob-eor`.** What remains there is partner-specific: the
HiBob and QuickBooks shells, demo-state controls, branded pages. The
generally-useful parts — `getAuthType` and its tests — are already on `main` as
of 2026-09-21.
