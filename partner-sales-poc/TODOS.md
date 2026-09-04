# TODOs

Deferred work captured during `/plan-eng-review` on 2026-04-17 for the `adp-wfn-redesign` branch.

## 1. Set up a test runner (vitest + react-testing-library)

**Why:** The current repo has no test runner, so every regression surface on this branch — redirects, session gating, modal open/close, magic-link error banner, Reset Demo round-trip — is manual-only. The first demo regression caused by a redirect or session-gate bug will cost more to debug than the ~1hr setup.

**Notes:**
- This is a Vite project, so vitest shares the transform pipeline. No separate Babel/TS config required.
- Start with coverage for `useOnboardEmployee`, `StartNewHireModal`, and the `<Navigate>` redirects on `/new-hire` and `/create-company`.

**Depends on:** nothing. Orthogonal to the active redesign work.

## 2. Proactive session-expiry detection

**Why:** After Tiger restarts or a `refresh_token` rotates, `server/session.json` still has `company_id` so the UI shows the activated state, but every magic-link click fails. The current inline red banner on `HomePage` handles this reactively; proactive detection would prompt Reset Demo on page load when a throwaway token fetch returns 401.

**Notes:**
- MVP for the demo is the reactive banner, which is landing in this PR.
- Proactive approach: on app mount, if `session.company_id` is set, fire a cheap authenticated probe (e.g., `/api/v1/company` or a dedicated health endpoint). On 401, clear the session and show a toast: "Demo session expired — click Reset Demo to start fresh."

**Depends on:** this PR landing first (inline banner is the MVP).

---

Added during `/plan-eng-review` on 2026-09-04 for the `hibob-eor` plan.

## 3. Token cache lives in the route handlers, not the fetch functions

**Why:** `get-token.js:92-114` and `:116-139` cache access tokens inside the Express route handlers that serve `/api/fetch-*-token`. The proxy does not go through those handlers — `proxy.js:55-69` calls the raw `fetchPartnerToken()` / `fetchCustomerToken()` directly, which have no cache. Every proxied request therefore performs an OAuth token exchange against the gateway before the real call. Harmless while the proxy served a handful of REST calls; it compounds once the remote-flows SDK routes through the proxy, because the SDK makes many calls per step.

**Notes:**
- Fix is to hoist the cache down into `fetchPartnerToken` / `fetchCustomerToken` so proxy and handlers share it. The two handlers then lose their duplicated cache blocks — net less code than today.
- Deliberately deferred on 2026-09-04: latency against a local Tiger on the same machine is likely imperceptible, and `server/` is frozen from a UI perspective per `AGENTS.md`.

**Depends on:** nothing.

## 4. Proxy forwards no request headers and assumes JSON

**Why:** `proxy.js:79-88` hardcodes `Content-Type: application/json` and re-serializes `req.body` from `express.json()`. No other request headers are forwarded. Any endpoint that is not JSON — document upload, employment-agreement PDF preview — cannot pass through the proxy. `gp-proxy.js` has the identical limitation; the GP demo simply never exercised those paths. This becomes blocking the moment an embedded flow needs a file upload.

**Notes:**
- Both proxies need the same fix, which is an argument for extracting one shared forwarder rather than patching each.
- Preserve `content-type` from the incoming request and stream the body rather than re-serializing.

**Depends on:** nothing. Worth doing before any flow that uploads documents.

## 5. Dragon `usePartner.tsx:19` assigns the account brand without a config guard

**Why:** In `dragon/apps/employ/src/domains/shared/integrations/partner-whitelabel/usePartner.tsx`, line 19 does `if (accountPartner && accountPartner !== 'none') { partner = accountPartner }` with no `in partnersConfig` check. The cookie path at line 22 and the URL-param path at line 43 both guard. If an account reports a brand Dragon's config does not have, `partnersConfig[partner].label` at line 71 throws and the dashboard white-screens rather than falling back to Remote branding.

**Notes:**
- Not hypothetical: verified during the HiBob EOR plan review. It is why the `hibob-eor` plan dropped the Tiger brand-enum work — adding `:hibob` server-side while Dragon's config lacked it would have hit exactly this.
- Affects every whitelabel partner, not just HiBob. Belongs upstream in Dragon, not in a demo branch.
- Fix mirrors line 22: `else if (accountPartner && accountPartner !== 'none' && accountPartner in partnersConfig)`.

**Depends on:** nothing. This is someone else's repo — needs an owner in the Dragon whitelabel area.

## 6. `@remoteoss/remote-flows` is an unpinned local checkout

**Why:** `package.json:19` is `"@remoteoss/remote-flows": "file:../remote-flows"`, a sibling working copy outside this repo. As of 2026-09-04 that checkout is on branch `pbyr-4044` at commit `5bef538c` with a dirty working tree. The demo's most important dependency is therefore unreproducible: a colleague cloning this repo gets whatever happens to be in their sibling directory, or nothing.

**Notes:**
- Minimum: record branch + commit in the README so the demo can be reconstructed.
- Better: pin to a published version once the branch lands. Note that `OnboardingSDK.tsx` was written against `^1.4.3` while the checkout is `1.42.0` — the step model changed between them, so any pin needs the step-rail rewrite that the `hibob-eor` plan folds into Phase 1.
- `vite.config.ts:15,23-25,29` (`dedupe`, `fs.allow`, `optimizeDeps.exclude`) exist only because of the `file:` dependency. Removing the `file:` link means removing those too.

**Depends on:** the `pbyr-4044` branch landing, for the pinned version.
