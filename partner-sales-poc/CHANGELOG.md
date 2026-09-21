# Changelog

## 2026-08-19 — Demo unblocked end to end

Company creation and the employment flows now work. Three problems were stacked
in sequence, so each fix revealed the next one. Two security issues turned up
along the way.

**The original blocker wasn't code.** The integration lacked entitlements for the
two actions company creation requests. Fixed with two toggles, no code change:

| Setting | Grants |
|---------|--------|
| Generate tokens on company creation | `get_oauth_access_tokens` |
| Allow set password on company creation | `send_create_password_email` |

Enabling the first also means company creation returns a refresh token, which is
what makes the employment flows possible at all.

---

## Errors you can actually read now

**Company creation errors were unreadable.**
`src/features/company/hooks.ts`

- Before: `Error creating company: [object Object],[object Object]`
- After: `HTTP 422 - send_create_password_email is not allowed...`

Remote returns validation errors as an array of objects; passing that array to
`new Error()` stringified it and threw away the content. The new `formatApiError`
flattens arrays and nested objects into `field: message` form, includes the HTTP
status, and falls back to JSON for shapes it doesn't recognise. This is what
revealed the entitlements problem.

**Token errors now say which file the token came from.**
`server/api/get-token.js`

An `invalid_refresh_token` used to leave you guessing between `.env` and
`server/session.json`. The error now names the source.

---

## Auth routing fixes

**Employment flows couldn't use the token company creation produced.**
`server/api/get-token.js`

`fetchCustomerToken` read `REMOTE_REFRESH_TOKEN` from `.env` and nothing else, so
a freshly minted, valid token sat unused in `server/session.json` while requests
failed with `invalid_refresh_token`. It now prefers the session token and falls
back to `.env`.

- Side effect: `REMOTE_REFRESH_TOKEN` is now **optional**
- Better error when neither exists: "create a company first" instead of "missing credentials"

**Country form schemas were sent with the wrong token.**
`server/api/proxy.js`

`/v1/countries` was matched by prefix, so
`/v1/countries/CAN/employment_basic_information` was sent with the *partner*
token and returned 404. Those schemas contain company-scoped data (selectable
managers, departments) and need the customer token. The country list stays
partner-level; everything beneath it is now customer-level.

---

## Security

**Credentials are no longer served to the browser.** *(highest impact)*

`VITE_CLIENT_ID`, `VITE_CLIENT_SECRET`, and `VITE_REFRESH_TOKEN` carried Vite's
`VITE_` prefix, which tells Vite to expose a value to client code — and any
module touching `import.meta.env` receives the *entire* env object. Verified
before the fix: the client secret and refresh token appeared verbatim in
JavaScript served from `localhost:3001`.

Renamed to `REMOTE_CLIENT_ID`, `REMOTE_CLIENT_SECRET`, `REMOTE_REFRESH_TOKEN`.
They're only read server-side, so the prefix bought nothing. Verified after:

```js
import.meta.env = {"BASE_URL":"/","DEV":true,...,"VITE_REMOTE_GATEWAY":"sandbox"}
```

**Tokens masked in the Create Company success panel.**
`src/features/company/CreateCompany.tsx`

The panel showed live `access_token` and `refresh_token` values on screen. Now
`<redacted - N chars>`. Display-only — the real tokens are written to
`session.json` before the panel renders, so nothing downstream is affected.

**`.env.*` is now ignored**, with a `!.env.example` negation, so
per-environment files can't be committed by accident.
`.gitignore`

**`server/session.json` is no longer tracked.** It was committed in the base
template and is rewritten on every company creation, so it carried whichever
refresh token was current straight into the repo — two distinct ones across
the branches. A `.gitignore` entry does not untrack an already-tracked file,
so this also does `git rm --cached`. Neither removes the tokens from history.

Low severity, and worth being precise about why: these are sandbox tokens,
and the refresh flow also requires `REMOTE_CLIENT_ID` / `REMOTE_CLIENT_SECRET`,
which were never committed on any branch. A refresh token alone cannot mint an
access token. The real value here is that the file stops re-committing a fresh
token on every run.

---

## Quality of life

**The gateway is logged on boot.**
`server/dev-server.js`

```
🚀 Partner Sales POC running at http://localhost:3001
   gateway: https://gateway.remote-sandbox.com  (VITE_REMOTE_GATEWAY=sandbox)
```

`VITE_REMOTE_GATEWAY` silently defaults to `partners` when unset, so you could
previously run against the wrong environment without knowing.

**`README.md` documents the three real prerequisites**, none of which were
written down before: Node 20.19+, the client credentials, and the integration
settings. Plus the order of operations (company before employment) and why no
refresh token needs to be supplied.

---

## Still open

| Issue | Impact |
|-------|--------|
| **`npm run build` fails, for two stacked reasons** | Blocks deploying. Both pre-existing; `npm run dev` is unaffected because Vite doesn't typecheck |
| &nbsp;&nbsp;1. `tsconfig.json` references `tsconfig.node.json`, which sets `noEmit: true` and never sets `composite: true`, so `tsc -b` aborts with TS6306/TS6310 before checking a single file | This is the error you see first, and it masks the one below |
| &nbsp;&nbsp;2. Behind it, **20 type errors across 8 files** — `JsonSchemaForm.tsx`, `Button.tsx`, `Card.tsx`, `Tabs.tsx`, `CreateCompany.tsx`, `CreateEmploymentAPI.tsx`, `OnboardingSDK.tsx`, `RemoteFlowsWrapper.tsx` | Visible via `tsc -p tsconfig.app.json --noEmit`. Fixing the tsconfig alone will not make `build` pass |
| **`npm run lint` fails** — 11 errors on a fresh `npm install`, across `CreateCompany.tsx`, `JsonSchemaForm.tsx`, `FormFields.tsx` and `OnboardingSDK.tsx` (refs accessed during render, unused vars) | Pre-existing on `main`. Would fail CI if lint were wired into one. The count moves with the resolved eslint-plugin versions — an older `node_modules` reports more — so compare against `main` in the same tree rather than against this number |
| **The rotated refresh token is discarded** — `/auth/oauth2/token` returns `refresh_token` alongside `access_token`, but `fetchCustomerToken` and `fetchSessionToken` both destructure only `access_token` and `expires_in`, and nothing writes the returned value back to `session.json` | Latent. Remote's partner docs don't state whether refresh tokens rotate on redemption; today they evidently don't, and each demo mints a fresh one by creating a company. If rotation is ever enabled, the second refresh fails with `invalid_refresh_token` and the stored token goes stale with no code path to update it |
| **Dead auth code in `src/lib/api-client.ts`** — both interceptors fetch a token and set `Authorization`, which `proxy.js` then overwrites | A wasted round trip per request, access tokens pulled into the browser for nothing, and misleading when debugging |
| **`get-token.js` returns generic 500s** — both handlers catch the real gateway status and body, log them server-side only | Auth failures are invisible from the browser. Same class of bug as the `[object Object]` one |
| **`VITE_COMPANY_ID` is read but never defined** — referenced in `OnboardingSDK.tsx` | Low. Silent `undefined` fallback |
| **Gateway URL map duplicated** in `get-token.js` and inside the `remote-flows` SDK | They agree today; nothing keeps them in sync |

---

## Note on origins

Every issue above existed in the repo beforehand. They surfaced in sequence
because each was hidden behind the previous one: entitlements blocked company
creation, an invalid refresh token blocked the customer token, and the proxy's
prefix match blocked the schema call.
