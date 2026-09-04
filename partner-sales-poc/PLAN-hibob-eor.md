# Plan — HiBob EOR demo (`hibob-eor`)

Reviewed by `/plan-eng-review` on 2026-09-04. Decisions D1–D14 are folded in below.

**Shape:** separate EOR-only branch · local Tiger · three beats — cost calculator, embedded EOR
hiring, magic-link handoff to a Remote surface co-branded as HiBob for the **employer**.

**Employee-side co-branding is a non-goal.** The new hire completes EOR onboarding on Remote, with
Remote branding. That is the intended product behaviour, not a gap: Dragon's
`partner-whitelabel/helpers.ts:26-32` grants whitelabel to employers and Global Payroll employees
and withholds it from EOR employees by design. Only the employer's jump to Remote is themed.

---

## What already exists

| Sub-problem | Existing code | Posture |
|---|---|---|
| HiBob chrome | `HiBobShell.tsx` (uncommitted on `hibob-gp`) | reuse |
| Embedded EOR onboarding | `OnboardingSDK.tsx` — 562 lines, unrouted, **never executed** | reuse, but see Phase 1 |
| Cost calculator | `CostCalculatorDrawer.tsx` — unrouted | reuse |
| Company creation + magic link | `features/company/hooks.ts`, `server/api/{proxy,session,get-token}.js` | reuse unchanged |
| Company/token precedence | `OnboardingSDK.tsx:508-511` — URL > session > env | **keep**, do not rewrite |
| SDK-through-proxy transport | `gp-proxy.js` + `GpRemoteFlows.tsx:19-27` on `hibob-gp` | prior art, mirror it |
| Dragon co-branding | `partner-whitelabel/adp/{colors.ts,index.tsx}` + `config.tsx` | copy as template |
| Tiger seed | `setup_adp_demo.exs` | copy as template |
| Test runner | vitest wired (`package.json:12`, `vite.config.ts:31-35`), `partner.test.ts` | extend |

Two corrections to the pre-review draft, both verified:

- Dragon's second whitelabel directory is a **re-export shim**, not a fork. `domains/integrations/partner-whitelabel/config.tsx` is three lines pointing at `shared/`. Register `hibob` once, in `shared/`.
- The SDK does know `local` (`Environment = 'local' | 'partners' | ...`, `ENVIRONMENTS.local = "http://localhost:4000/api/eor"`). `RemoteFlowsWrapper.tsx:37` casts it away with `as 'partners' | 'sandbox' | 'production'`.

---

## Phase 0 — protect what exists (half day)

The whole HiBob GP demo is uncommitted on `hibob-gp`. Nothing else happens first.

1. Commit the GP work on `hibob-gp`. **Stage the untracked partner configs too** —
   `partner.config.{adp,intuit,isolved,hibob}.json` are all untracked; without them step 2 has
   nothing to copy. Exclude `server/session.json`, `server/counter.json`, `tsconfig*.tsbuildinfo`.
2. Branch `hibob-eor` off `adp-wfn-redesign`, then carry across from `hibob-gp`:

   | File | Why it must come |
   |---|---|
   | `partner.config.{hibob,adp,intuit,isolved}.json` | `partner.ts:1-4` imports all four |
   | *deletion of* `partner.config.json` | the old single-config file the ADP branch imports |
   | `src/config/partner.ts` | adds `chrome` / `productName` / `legalEntity`, absent on ADP |
   | `src/index.css` | declares the CSS vars the `App.tsx` theming effect writes into |
   | `src/App.tsx`, `src/components/layout/{Layout,HiBobShell}.tsx` | chrome switch + shell |
   | `public/hibob-logo.svg`, `public/remote-symbol.svg` | assets |
   | `package.json` **and** `vite.config.ts` **together** | the `file:../remote-flows` swap is what forces `dedupe` (`:15`), `fs.allow` (`:23-25`), `optimizeDeps.exclude` (`:29`). Split them and you get "invalid hook call" — see the comment at `vite.config.ts:12-14` |
   | `package-lock.json` | matches the above |

3. `.env.hibob-local` — `VITE_PARTNER_PROFILE=hibob`, `VITE_REMOTE_GATEWAY=local`,
   `VITE_CLIENT_ID=hibob-local-demo`, `VITE_CLIENT_SECRET=hibob-local-secret`.
   **No `VITE_REFRESH_TOKEN`** — matches `.env.adp-local:4`, and the POC gets one from company
   creation. See D12.

## Phase 1 — SPIKE (1 day, gate)

Two unknowns, in this order. Timebox: one day. If either is unresolved at the end, take the
fallback rather than extending.

**1a. Does `OnboardingSDK.tsx` run on the linked SDK at all?** (D11)

`OnboardingSDK.tsx` was written against `^1.4.3`. `../remote-flows` is `1.42.0`. In between, the
flow stopped using a fixed step list and started building steps at runtime, and two new steps
appeared. Concretely:

- `OnboardingSDK.tsx:22-28` hardcodes 5 labels read by index at `:404`.
- `hooks.tsx:64,67` — `engagement_agreement_details` and `employment_agreement_preview` are real
  step names. The switch at `OnboardingSDK.tsx:276` has no case for either, so the default at
  `:394` renders the literal string **"Unknown step: engagement_agreement_details"** on screen.

Fix: **delete the `STEPS` array.** The SDK emits its own step set — drive the rail off that, so a
future SDK bump cannot silently mislabel a form. Do this before any styling.

**1b. Does local Tiger have the EOR reference data the flow needs?**

Transport risk is low — `hibob-gp` already runs this package against `gateway=local` through a
same-origin proxy. The real risk is data: countries with EOR availability, benefit offers, JSON
schema versions, contract templates, credit-risk config. `setup_adp_demo.exs` seeds roles,
integration, credentials and cohort settings — **none of that**.

**Exit criteria:** a German or Portuguese hire reaches the invitation step against local Tiger with
no "Unknown step" and no empty required form.

**Fallback ladder (D4):** stay on local Tiger and seed or switch country. The "SDK on sandbox,
company creation on local" idea is struck — `get-token.js:9-11` resolves one gateway per process,
and the created company would not exist in the other backend. Second fallback if the data hole is
deep: drop the embedded beat and hire via magic-link into co-branded Dragon, the path the ADP demo
already proved.

## Phase 2 — Tiger seed (1–2 h)

One new file, `priv/scripts/setup_hibob_demo.exs`, copied from `setup_adp_demo.exs`:

- Roles `HiBob Integration Partner` (`:integration`) / `HiBob Employer Partner` (`:employer`)
- Integration **`hibob_embedded`** — not `hibob`. `:hibob` already exists as a real HRIS
  integration name in `Tiger.Integrations.Integration.Name:9`, and find-or-create on `"hibob"`
  would collide with it. `EOR.Integrations.Integration` validates names as free-form snake_case
  (`integration.ex:140`), so no enum change is needed.
- Credentials `hibob-local-demo` / `hibob-local-secret`
- Settings: `default_e2e_settings` + `create_company_cohort: true`

**No Tiger enum edits.** (D13) The four-site `:hibob` brand work is dropped. `user.ex:707-715`
returns `:none` for any brand outside `[:workday, :bamboohr, :adp]`, and Dragon's
`usePartner.tsx:19` only takes the account brand when it is not `'none'` — so unmodified Tiger
falls through to the URL-parameter path in Phase 3. Adding `:hibob` server-side would be actively
worse: `usePartner.tsx:19` assigns without an `in partnersConfig` guard (unlike `:22` and `:43`),
so a Tiger/Dragon desync throws at `:71` and white-screens the employer's dashboard. Captured as
TODOS.md item 5.

## Phase 3 — Dragon co-branding (half day)

1. Add `partner-whitelabel/hibob/{colors.ts,index.tsx}`; register `HIBOB: 'hibob'` in
   `WHITELABEL_PARTNERS` and `partnersConfig` in `shared/.../config.tsx`. One site.
2. Assets under `public/images/partners/hibob/`: primary, reversed, symbol SVGs + favicon set.
3. Activate via `?whitelabel_brand=hibob` — `usePartner.tsx:26-51` accepts it in dev and persists
   to sessionStorage. Pre-seed once by visiting `localhost:3000/?whitelabel_brand=hibob` before the
   demo, or append it to the magic-link `path`.

**Coral fails AA on buttons.** `#FF4E64` on white is ~3.0:1; ADP's `#D0271D` is ~5.3:1. Darken the
600 ramp step (≈`#C0233B`) for white button text and keep `#FF4E64` as the brand accent — the same
move ADP's ramp makes.

## Phase 4 — the POC app (2–3 days)

All inside `HiBobShell`, left nav **"Global Hiring · Powered by Remote"**. No persona toggle — the
employee side is Dragon.

| Route | Beat | Source |
|---|---|---|
| `/` | HiBob dashboard, 3 states: discovery → activation → hiring | restyle `HomePage.tsx` |
| drawer on `/` | cost calculator, opening beat | route `CostCalculatorDrawer.tsx` |
| `/global-hiring` | EOR upsell | restyle `NewHirePage.tsx` |
| `/create-company` | live company creation against local Tiger | works today |
| `/hire` | embedded EOR onboarding SDK | `OnboardingSDK.tsx`, post-Phase-1 |
| success screen | magic-link handoff into co-branded Dragon | `useMagicLink` |

`HomePage.tsx:55-62` currently binds the hiring-state CTA to `onboard()`, the magic link. With
`/hire` added, two beats compete for one button — split them explicitly: `/hire` is "hire inside
HiBob", the magic link is "the employer's own Remote surface, themed as HiBob."

**Transport and auth (D3, D12):**

- Mount the SDK with `proxy: { url: window.location.origin }`, not `environment`. Same-origin, no
  CORS, token stays server-side. Matches `AGENTS.md`: the frontend never calls Tiger directly.
- `app.use('/v1', createProxyMiddleware())` in `routes.js`. The existing middleware works
  unmodified — `proxy.js:43` does `req.originalUrl.replace('/api','')`, a no-op on a `/v1` path.
  Add a comment saying so; nothing asserts it, and a future path containing `/api` corrupts
  silently. `/v1` is free on this branch because GP is stripped.
- Keep the company/token precedence at `OnboardingSDK.tsx:508-511`. Pass `useSessionToken` to the
  proxy as a **static header set at mount** — `:503` blocks render until the session has loaded, so
  there is no mid-flow remount. Reset Demo must clear `session.json`, or a stale session outranks
  env.
- Cost calculator needs no special routing: with company creation supplying the token, the customer
  path works. `proxy.js:5-8` already sends `/v1/companies` and `/v1/countries` to the partner token.

**Restyle pass on `OnboardingSDK.tsx`:** convert inline `style={{ config.colors.* }}` at `:35,62,422`
to the CSS vars and Tailwind tokens the shell uses. One theming system, not two.

**`AGENTS.md` needs updating** — it freezes `RemoteFlowsWrapper.tsx` (`:26`) and `server/` (`:23`),
and both change here. Say so rather than leaving the contract stale.

## Phase 5 — tests, rehearsal, narrative (half day)

Tests (D9) — vitest, node env, no new dependencies:

- `loadPartnerConfig('hibob')` returns hibob chrome + coral. `partner.test.ts:54` lists
  `['wfn','quickbooks','isolved']` and `:60` iterates `['intuit','adp','isolved']` — `hibob` is
  absent from both and is the one profile with no coverage.
- `getAuthType()` routing: `/v1/companies` → partner, `/v1/countries` → partner, else customer.
- No test for step-label mapping — Phase 1 deletes that code rather than freezing it.

**`scripts/preflight.sh`** — worth more than the unit tests: assert Tiger is up, the seed applied,
`hibob` is in `partnersConfig`, and a token exchange returns 200. Run it before every demo.

Rehearsal checklist doubles as the run-sheet. Full test plan:
`~/.gstack/projects/remoteoss-partner-sales-pocs/mohit.mahindroo-hibob-eor-eng-review-test-plan-20260904-150847.md`

`demo-transcript-hibob-eor.md`, same 6-section / ~15-min shape as the GP transcript.

**Re-apply note (D7).** Tiger and Dragon changes stay uncommitted, so record exactly what to
re-apply after a pull: Tiger `priv/scripts/setup_hibob_demo.exs` (new file only), Dragon
`partner-whitelabel/hibob/` + one line in `shared/.../config.tsx` + assets under
`public/images/partners/hibob/`.

---

## NOT in scope

| Deferred | Why |
|---|---|
| Employee-side co-branding | Intended product behaviour; the EOR hire sees Remote. Not a gap to paper over |
| Tiger brand-enum edits (`:hibob`) | Unnecessary — Tiger already falls through to `:none` — and applying them creates a white-screen path (D13) |
| Dragon `usePartner.tsx:19` guard | Real bug, but belongs upstream in Dragon, not a demo branch. TODOS.md item 5 |
| jsdom + testing-library, E2E suite | Fifteen of 21 gaps need a component stack this repo does not have; rehearsal covers what a human would catch (D9) |
| Token cache hoist | Accepted latency; local Tiger is same-machine. TODOS.md item 3 (D10) |
| Proxy header forwarding | Blocks document upload / PDF preview if an onboarding step needs one. TODOS.md item 4 |
| Pinning `remote-flows` | Blocked on `pbyr-4044` landing. TODOS.md item 6 |
| Branches/PRs in Tiger and Dragon | Explicitly chosen as local-only edits (D7) |

## Failure modes

| Codepath | Realistic failure | Test? | Error handling? | Visible? |
|---|---|---|---|---|
| SDK step switch | SDK emits a step the switch lacks | Phase 1 deletes the cause | default case | **Yes** — renders "Unknown step: …" on screen |
| `/v1` proxy mount | future path containing `/api` mangled by `.replace` | no | none | No — **silent**, wrong URL |
| Token precedence | stale `session.json` outranks env | no | none | No — **silent, wrong company** |
| Cost calculator | token/endpoint rejected | no | SDK error boundary | Yes — "Something went wrong" |
| Magic link | expired session token | no | inline banner (`HomePage`) | Yes |
| Magic link | popup blocker eats `window.open` | no | none | No — **silent no-op** |
| Dragon theme | `?whitelabel_brand` not seeded | preflight covers | falls back to Remote | Yes — wrong colours |
| Local Tiger data | country has no benefit offers | Phase 1 gate | SDK error boundary | Yes |

**Critical gaps** (no test, no error handling, silent): the stale-session wrong-company hire, the
popup-blocked magic link, and the `/v1` mount assumption. The first two are covered in the
rehearsal checklist; the third gets a comment. **3 critical gaps, accepted with mitigations.**

## Parallelization

| Step | Modules | Depends on |
|---|---|---|
| Phase 0 branch + carry-over | repo root, `src/config`, `src/components/layout` | — |
| Phase 1 spike | `src/features/employment/sdk`, `server/api` | Phase 0 |
| Phase 2 Tiger seed | tiger `priv/scripts` | — |
| Phase 3 Dragon theme | dragon `partner-whitelabel`, `public/images` | — |
| Phase 4 POC UI | `src/pages`, `src/features`, `src/components` | Phase 1 |
| Phase 5 tests + docs | `src/**/__tests__`, `scripts`, repo root | Phase 4 |

```
Lane A: Phase 0 → Phase 1 → Phase 4 → Phase 5   (sequential, shared src/)
Lane B: Phase 2 Tiger seed                      (independent repo)
Lane C: Phase 3 Dragon theme                    (independent repo)
```

Launch A, B and C in parallel. B must finish before A's Phase 1 can run (the spike needs the seeded
integration). No module overlap between lanes — no conflict flags.

## Implementation Tasks

Synthesized from this review's findings. Each derives from a specific finding above.

- [ ] **T1 (P1, human: ~4h / CC: ~30min)** — `src/features/employment/sdk` — Delete the hardcoded `STEPS` array; drive the step rail off the SDK's own step set
  - Surfaced by: D11 / outside voice 2 — `OnboardingSDK.tsx:22-28,276,394` vs `hooks.tsx:64,67`
  - Files: `src/features/employment/sdk/OnboardingSDK.tsx`
  - Verify: walk the flow against local Tiger; no "Unknown step" string appears
- [ ] **T2 (P1, human: ~1d / CC: ~1h)** — Phase 1 spike — Run `OnboardingSDK` end-to-end against local Tiger; confirm reference data exists for the demo country
  - Surfaced by: D4 / outside voice 3 — `setup_adp_demo.exs` seeds no EOR reference data
  - Files: `priv/scripts/setup_hibob_demo.exs` (tiger), `src/features/employment/sdk/`
  - Verify: a hire reaches the invitation step with no empty required form
- [ ] **T3 (P1, human: ~2h / CC: ~20min)** — `server/api` + `src/features/employment/sdk` — Mount the SDK on `proxy: {url: origin}`; `app.use('/v1', createProxyMiddleware())`; comment the `.replace('/api','')` no-op
  - Surfaced by: D3 — `RemoteFlowsWrapper.tsx:37-38` vs `AGENTS.md` proxy rule
  - Files: `server/api/routes.js`, `src/features/employment/sdk/RemoteFlowsWrapper.tsx`
  - Verify: network tab shows only same-origin `/v1/*` calls; no request to `:4000` from the browser
- [ ] **T4 (P1, human: ~1h / CC: ~10min)** — `src/features/employment/sdk` — Pass `useSessionToken` to the proxy as a mount-time header; keep the precedence at `:508-511`
  - Surfaced by: D12 / outside voice 1 — hire must land in the company created on stage
  - Files: `src/features/employment/sdk/{OnboardingSDK,RemoteFlowsWrapper}.tsx`
  - Verify: create a company, hire, confirm the employment exists under that company id
- [ ] **T5 (P2, human: ~2h / CC: ~15min)** — Phase 0 — Commit the GP work including the four untracked `partner.config.*.json`; carry `package.json` and `vite.config.ts` together
  - Surfaced by: outside voice 5 — carry-over list did not build
  - Files: repo root, `src/config/partner.ts`, `src/index.css`
  - Verify: `npm run build` on the new branch; app boots with HiBob chrome
- [ ] **T6 (P2, human: ~3h / CC: ~30min)** — dragon `partner-whitelabel` — Add the `hibob` theme; darken the 600 ramp step to pass AA on buttons
  - Surfaced by: Phase 3 — `#FF4E64` is ~3.0:1 on white
  - Files: `partner-whitelabel/hibob/{colors.ts,index.tsx}`, `shared/.../config.tsx`, `public/images/partners/hibob/`
  - Verify: employer magic-link session renders HiBob coral + logo; contrast checker passes on the primary button
- [ ] **T7 (P2, human: ~2h / CC: ~20min)** — `src/config`, `server/api` — Add vitest coverage for `loadPartnerConfig('hibob')` and `getAuthType()` routing
  - Surfaced by: D9 — `hibob` absent from `partner.test.ts:54,60`
  - Files: `src/config/__tests__/partner.test.ts`, new `server/api/__tests__/`
  - Verify: `npm test`
- [ ] **T8 (P2, human: ~2h / CC: ~20min)** — `scripts` — `preflight.sh`: Tiger up, seed applied, `hibob` in `partnersConfig`, token exchange 200
  - Surfaced by: outside voice 8 — the checklist is the real safety net
  - Files: `scripts/preflight.sh`
  - Verify: run it with Tiger stopped; it fails loudly
- [ ] **T9 (P3, human: ~1h / CC: ~10min)** — `src/features/employment/sdk` — Convert inline `style={{}}` theming to CSS vars during the restyle
  - Surfaced by: Section 2 — `OnboardingSDK.tsx:35,62,422`
  - Files: `src/features/employment/sdk/OnboardingSDK.tsx`
  - Verify: no `config.colors` references remain in that file
- [ ] **T10 (P3, human: ~30min / CC: ~5min)** — repo root — Update `AGENTS.md`: `RemoteFlowsWrapper.tsx` and `routes.js` are no longer frozen
  - Surfaced by: outside voice 6 — `AGENTS.md:23,26`
  - Files: `AGENTS.md`
  - Verify: read it back

## Rough shape

Phase 0 half day · **Phase 1 one day (gate, timeboxed)** · Phases 2+3 one day, parallel ·
Phase 4 two to three days · Phase 5 half day. **~5 days**, with Phase 1 as go/no-go. Dropping the
Tiger enum work (D13) removed roughly a day; folding the step-model rebuild into Phase 1 (D11)
added back roughly half.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | not installed |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 14 issues, 3 critical gaps (mitigated) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**OUTSIDE VOICE:** Claude subagent (Codex not installed). 8 findings; 4 verified against source by
the reviewer. 3 created genuine cross-model tension (SDK version drift, token/company mismatch,
Tiger enum crash path) — all 3 resolved in the outside voice's favour by the user. 2 accepted
outright as mechanical corrections (Phase 0 carry-over list, frozen-file acknowledgement).

**CROSS-MODEL:** Overlap on the step-label coupling in `OnboardingSDK.tsx` — the review found the
index-vs-name symptom, the outside voice found the version-drift cause. Divergence on the token
source: the review proposed new server-side precedence, the outside voice showed the precedence
already exists at `:508-511`. Outside voice was right.

**VERDICT:** ENG CLEARED — ready to implement, gated on the Phase 1 spike.

NO UNRESOLVED DECISIONS
