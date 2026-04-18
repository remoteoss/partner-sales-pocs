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
