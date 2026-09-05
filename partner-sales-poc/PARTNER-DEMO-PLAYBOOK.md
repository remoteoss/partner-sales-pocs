# Partner demo playbook

How to stand up a new partner-branded Remote demo, written after building four of
them (ADP, Intuit, isolved, HiBob) and learned mostly from the parts that broke.

Read this before starting a fifth. It is ordered by what actually costs time,
not by what feels logical.

---

## 0. What this repo is

A Vite + React SPA that impersonates a partner's HR portal, served by Express on
`:3002`. Express also proxies `/api/*` and `/v1/*` to a Remote gateway, so the
browser never talks to the gateway directly. Partner identity is one JSON file
plus a shell component; everything else is shared.

```
Browser (:3002 SPA) ─┐
                     ├─► Express (same :3002) ─► Remote Gateway (Tiger)
Vite middleware ─────┘        └─ attaches partner | session | customer token
```

A demo has three moving parts, and they are worth thinking about separately:

| Part | Lives in | Cost to add a partner |
|---|---|---|
| Partner chrome (their app) | this repo | ~1 day |
| Remote's embedded flows | `@remoteoss/remote-flows` SDK | hours, if the data exists |
| Remote's own surface, branded | Dragon whitelabel | ~half a day |

---

## 1. Decide the posture before you write anything

Not every partner should look the same, and this is a product decision, not a
styling one.

**Whitelabel** — Remote's identity is replaced. `SidebarLogo.jsx` and
`PlatformEmployLogo.tsx` swap `PartnerLogo.Full` in for Remote's marks, so Remote
disappears from the partner's customers entirely. Workday and ADP run this way.

**Co-brand** — partner and Remote appear together as peers. BambooHR runs this
way; `bhr-logo-combined.svg` is the reference asset.

Ask the partner team which one, and get a reason. For HiBob the answer was in
discovery notes: *"don't hide Remote — admins are single-digit users per account
who know and want Remote CX."* That one sentence decided the whole logo approach.

Also know this, because it surprises people late: **EOR employees never see
partner branding.** `partner-whitelabel/helpers.ts::isEligibleForWhitelabel`
grants it to employers, service providers and Global Payroll employees, and
withholds it from EOR employees, contractors, freelancers and candidates. So an
EOR demo can co-brand the employer's jump into Remote, but the new hire's own
onboarding is Remote-branded by design. Say that out loud in the demo rather than
letting someone discover it.

---

## 2. Get the brand right in fifteen minutes

Do not guess colours. I guessed coral for HiBob; the real brand is dark wine.
Wrong-but-close branding is worse than obviously-placeholder branding.

```bash
B=~/.claude/skills/gstack/browse/dist/browse
$B goto https://partner.com

# Published colour tokens, with their own names
$B js "(() => { const s=getComputedStyle(document.documentElement); const o={};
  for (const p of Array.from(s)) if (/--.*color/i.test(p)) { const v=s.getPropertyValue(p).trim();
  if (/^#/.test(v)) o[p]=v; } return JSON.stringify(o); })()"

# Fonts (check headings separately — they are often a different family entirely)
$B js "(() => { const b=getComputedStyle(document.body), h=document.querySelector('h1,h2');
  return JSON.stringify({body:b.fontFamily, heading:h&&getComputedStyle(h).fontFamily}); })()"

# Logo
$B js "document.querySelector('svg.custom-logo, header svg, [class*=logo] svg').outerHTML"
```

CSS custom properties give you the partner's *named* tokens (`--dark-wine`,
`--gray-2`), which is far better than sampling pixels. Check the heading font
separately — HiBob's headings are a serif at weight 800, which a body-font-only
check would have missed.

Commercial fonts (Gotham, Sentinel) can't be redistributed. Put the real name
first in the stack and a free stand-in behind it, so licensed machines get the
real thing:

```json
"family": "Montserrat, 'Gotham SSm A', system-ui, sans-serif",
"headingFamily": "'Zilla Slab', 'Sentinel SSm A', Georgia, serif"
```

**Check contrast on the 600 step.** Norma uses it for primary button fills. HiBob's
`#83143D` is ~9.9:1 on white and needed nothing; the coral I invented was ~3.0:1
and would have needed the ramp darkened. Compute it, don't assume.

---

## 3. Adding the partner to this repo

1. `partner.config.<name>.json` — colours, fonts, logo path, `chrome` key.
2. Register in `src/config/partner.ts` (`PROFILES`, `PartnerProfile`, `ChromeKind`).
3. Shell component in `src/components/layout/<Name>Shell.tsx`, wired in `Layout.tsx`.
4. `.env.<name>-local` with `VITE_PARTNER_PROFILE`, `VITE_CLIENT_ID/SECRET`,
   `VITE_REMOTE_GATEWAY=local`. **No `VITE_REFRESH_TOKEN`** — see §5.
5. Add the profile to `src/config/__tests__/partner.test.ts`. It is three lines and
   it catches the chrome/colour mistakes that are invisible until they're on screen.
6. `index.html` — set the static `<title>` and favicon to the partner. `App.tsx`
   rewrites both at runtime, but the tab shows the static value while React mounts,
   and a competitor's name flashing during a screen-share is a bad look.

---

## 4. Dragon co-branding

Register once, in `src/domains/shared/integrations/partner-whitelabel/`. The
`domains/integrations/partner-whitelabel/` copy is a re-export shim — ignore it.

- `<partner>/colors.ts` — brand ramp 25..900 anchored at 600, plus the re-derived
  `brand*` semantic tokens. Copy `adp/colors.ts`; the comment there explains why
  they must be re-derived (Norma computes them once at module load).
- `<partner>/index.tsx` — logo mapping and favicon.
- One line in `config.tsx` (`WHITELABEL_PARTNERS` + `partnersConfig`).

**Logo asset contract, learned the hard way:**

| Slot | Rendered at | Contents |
|---|---|---|
| `Full` / `FullInverted` | 180×70 box, `max-width/height: 100%` | the lockup |
| `Square` / `Symbol` | 32×32 | partner mark only — no room for two |

The `Full` asset **must** set `width` + `viewBox` and **no `height`**. An explicit
height pins the rendered box, so it overflows and clips mid-wordmark instead of
scaling. `bhr-logo-combined.svg` gets this right; copy its attribute shape.

Co-branded lockup arrangement, matching BambooHR:

```
[partner mark] │ [Remote R symbol] [remote wordmark]
```

Build it from Dragon's own `public/images/remote-logo.svg` (the R) and
`remote-name-logo.svg` (the wordmark) so the marks are authentic. The R matters —
without it the Remote half reads as a caption rather than a peer brand. Ship a
separate inverted variant if the partner's chrome is dark.

Optional: `showOnboardingIllustration: true` puts Remote's globe back in the
add-new-hire sidebar. That panel is a fixed 37.5% / 480px column and reads as a
big empty slab without it. Whitelabel partners should leave it off.

**Verify against the real slot, not by eye:**

```bash
# render the lockup inside a 180x70 box before believing it fits
$B viewport 240x230 --scale 3 && $B goto file:///tmp/slot-preview.html && $B screenshot /tmp/out.png
```

---

## 5. Auth, and the mistake everyone makes

Three token types, and picking wrong fails in ways that don't look like auth errors.

| Token | For | Symptom when wrong |
|---|---|---|
| partner (client credentials) | pre-company calls only | `User not found with the given slug: <client_id>` or `Company not found` |
| session (created company) | everything after company creation | — |
| customer (`.env` refresh token) | a pre-seeded company | hire silently lands in the wrong company |

A partner token has **no user behind it** — Tiger resolves its `sub` as a user
slug. So it only works for genuinely pre-company endpoints:

```
/v1/companies            (exact, POST create)
/v1/companies/schema
/v1/countries            (exact, the list)
/v1/countries/{code}/address_details
```

Match these **exactly, never by prefix**. Prefix-matching `/v1/countries` also
captures `/v1/countries/{code}/employment_basic_information` — the Basic
Information step's schema — which needs a real user and 404s. That one cost an
afternoon. There is a regression test for it in `server/api/__tests__/proxy.test.ts`;
keep it.

Everything else prefers the session token. Do **not** put a `VITE_REFRESH_TOKEN`
in a local env file: it points at a different company than the one created on
stage, so the demo creates a company and then hires into a different one, with no
error anywhere.

The SDK reaches the backend through the Express proxy
(`proxy: { url: window.location.origin }`), never `environment`. Same-origin, no
CORS, token stays server-side. `createProxyMiddleware()` works unmodified at both
`/api/v1` and `/v1`.

---

## 6. Local stack bring-up

Order matters: Postgres → Tiger → Dragon → POC. Dragon before the POC, or Dragon
falls back onto the POC's `:3002`.

```bash
# Tiger
cd ~/cursor/tiger/tiger/apps/tiger && iex -S mix phx.server
#   in iex:  Code.eval_file("priv/scripts/setup_<partner>_demo.exs")

# Dragon (pnpm, not yarn)
cd ~/cursor/dragon/dragon/apps/employ && pnpm dev

# POC
cd ~/cursor/SDK_remote/partner-sales-poc && cp .env.<partner>-local .env && npm run dev
```

Things that will bite you, in the order they bit me:

- **mise trust.** `pnpm` won't be on PATH until you `mise trust` the Dragon repo.
  Untrusted configs are silently ignored.
- **Toolchain drift.** Tiger pins Erlang/Elixir in `mise.toml` and they move.
  `mise install erlang@X elixir@Y` explicitly, not plain `mise install` — an
  unresolvable entry (`aqua:remoteoss/dexter`) makes mise refuse to run *any* tool.
- **Migrations with manual backfills.** `mix ecto.migrate` fails and prints the
  exact module to run. Run `<Module>.change(%{}, nil)` via `mix run`, then migrate
  again. **Never `mix ecto.reset`** — it drops your database.
- **Stale `.next`.** After any dependency churn in Dragon, clear it before chasing
  build errors. A stale cache made SVGs fall through to the PostCSS pipeline and
  produced a `CssSyntaxError` in a file nobody had touched.
- **Tiger 500s are opaque.** The API returns bare `"Internal Server Error"` and dev
  logs are console-only. To get the real stacktrace, call the handler in-process:
  a `mix run` script invoking the same module the controller calls, wrapped in
  `try/rescue` printing `Exception.format`. This found two root causes in one shot each.

---

## 7. Demo data will be stale

Seeded reference data carries dates and ages out. Benefit groups have
`coverage_start_date` / `coverage_end_date`; `BuildBenefitOfferContext` filters on
a lifecycle status derived from them. If a country is flagged
`country_with_benefits` but has zero groups in coverage, Tiger **raises** and the
benefits endpoint 500s.

Countries *not* flagged degrade gracefully to an acknowledgement form — which is
why Canada looked fine while Portugal exploded. Before a demo:

```sql
SELECT c.code, bg.name, bg.coverage_start_date, bg.coverage_end_date
FROM benefit_groups bg JOIN countries c ON c.id = bg.country_id;
```

Extend anything expired. Better: fold the extension into the partner seed script
so it self-heals.

---

## 8. Before you present

Write a `scripts/preflight.sh` per demo and run it every time. It should assert
the things that fail silently, not the things you can see:

- all four services responding
- right `VITE_PARTNER_PROFILE`, right gateway, **no** `VITE_REFRESH_TOKEN`
- a token exchange returns 200 (proves the Tiger seed applied)
- the partner is registered in Dragon's `partnersConfig`
- no stale `server/session.json` (or the demo opens mid-story)

This caught real problems on its first run. It is worth more than the unit tests.

---

## 9. Effort, honestly

| Phase | Time |
|---|---|
| Branch + partner config + shell | half a day |
| Tiger seed script | 1-2 hours |
| Dragon theme + lockup | half a day |
| Embedded SDK wiring + restyle | 1-2 days |
| Local stack fights | **half a day to a day, every time** |
| Transcript + rehearsal | half a day |

That stack-fights row is not padding. Four of the five hardest problems in the
HiBob build were environmental — toolchain pins, package manager migration,
pending migrations, expired seed data — and none were visible from the plan.

---

## 10. Reference

- `AGENTS.md` — architecture contract, what not to touch
- `PLAN-hibob-eor.md` — worked example with the full decision log
- `demo-transcript-hibob-gp.md` — transcript shape that works
- `TODOS.md` — known deferred issues, including two real upstream bugs
