# HiBob Embedded EOR demo — internal FAQ and prep

Prep doc for the "Remote x HiBob Embedded EOR Demo," **2026-09-10, 06:30-07:30 Europe/Berlin**.
Organizer Milena Schepan. Remote attendees: Milena, Umbreen Tapal, Pim Altena, Mohit. HiBob:
Adir Nashawi (accepted), Gabriel Levy (tentative), Mona Toutian (no response yet). Keshet
Rosenthal and Micha Zana declined, both OOO.

Milena's framing from the 2026-09-04 thread: this meeting "should not require a deck and be
more demo/solutioning." So lead with the live SDK/magic-link walkthrough, use this doc to answer
whatever comes up around it.

Context: on 2026-09-03 Pim announced HiBob named Remote partner of choice for both Embedded
Global Payroll and Embedded EOR. December 2026 signing target, product build starting January
2027, still subject to scoping and contract. The v1 product shape was confirmed earlier
(2026-08-27, Pim to Mohit): HiBob builds to Remote and embeds the SDK, one-click magic link plus
data sync, same pattern already live with BambooHR and Workday. Tomorrow's demo sits inside that
track, not a separate one.

Answering style, same as every other partner Q&A sheet: lead with what's live today, then
roadmap with real dates if we have them, then a short design note. No invented SLAs or metrics.
If something is genuinely unresolved, say so rather than guessing — several of the answers below
say exactly that.

---

## 0. Quick start — commands to stand up the local stack

Three terminal tabs, in this order (Postgres should already be running as a brew service —
`brew services list | grep postgres`; if not, start it first):

**Tab 1 — Tiger**
```bash
cd ~/cursor/tiger/tiger/apps/tiger
iex -S mix phx.server
```
Once it's up, in the same `iex` prompt, seed the HiBob demo data:
```elixir
Code.eval_file("priv/scripts/setup_hibob_demo.exs")
```

**Tab 2 — Dragon** (pnpm, not yarn — if `pnpm` isn't on PATH, run `mise trust` in this repo first)
```bash
cd ~/cursor/dragon/dragon/apps/employ
pnpm dev
```

**Tab 3 — POC**
```bash
cd ~/cursor/SDK_remote/partner-sales-poc
cp .env.hibob-local .env
npm run dev
```

**Then, before touching anything, run preflight** (same directory as Tab 3):
```bash
./scripts/preflight.sh
```
Checks: Tiger/Dragon/POC actually responding, `.env` has the right partner profile and gateway
with no stray `VITE_REFRESH_TOKEN`, the partner-token exchange returns 200 (proves the Tiger seed
applied), HiBob is registered in Dragon's `partnersConfig` with its assets present, and whether a
stale `server/session.json` will open the demo mid-story instead of at "discovery."

**Once, per browser, seed the HiBob theme** before the magic-link handoff will render co-branded:
visit `http://localhost:3000/?whitelabel_brand=hibob`.

**For a clean run from the top**, clear the stale session first:
```bash
rm ~/cursor/SDK_remote/partner-sales-poc/server/session.json
```

**If Dragon throws a build error** — `Error evaluating Node.js code` / `CssSyntaxError` pointing at
a `.svg` under `public/images/icons/` — that's the known stale-`.next`-cache gotcha (an SVG falls
through to the PostCSS pipeline). Stop Dragon's dev server, then:
```bash
cd ~/cursor/dragon/dragon/apps/employ && rm -rf .next
```
and restart `pnpm dev`. Re-run preflight once Dragon's back up.

Entry point: `http://localhost:3002`. Routes: `/` (dashboard: discovery → activation → hiring),
`/global-hiring` (EOR upsell), `/create-company`, `/hire` (the embedded onboarding SDK itself).

---

## 1. What's actually built and live (Remote side)

Verified against the `partner-sales-poc` repo as of the 2026-09-04 commits (`PARTNER-DEMO-PLAYBOOK.md`,
`PLAN-hibob-eor.md`, `TODOS.md`).

- **Architecture:** a Vite + React SPA plays the role of HiBob's own portal, served by Express on
  `:3002`. Express proxies every `/api/*` and `/v1/*` call to Remote's gateway (Tiger), so the
  browser never talks to Tiger directly. Partner identity is one JSON config file plus a shell
  component — everything else is shared code across all four partner demos built so far (ADP,
  Intuit, isolved, HiBob).
- **Three layers, worth naming explicitly if asked "how much of this did you build vs use
  off-the-shelf":** the partner chrome (this demo repo, built per-partner), Remote's embedded
  flows (the `@remoteoss/remote-flows` SDK, reused as-is), and Remote's own surface via Dragon
  whitelabel (co-branding, reused as-is).
- **Posture: co-brand, not full whitelabel.** Decided from HiBob's own discovery notes — "don't
  hide Remote, admins are single-digit users per account who know and want Remote CX." The logo
  lockup is `[HiBob mark] | [Remote R symbol] [Remote wordmark]`, the same pattern used for
  BambooHR.
- **Brand correction:** the real HiBob brand is dark wine (`#83143D`), not coral — corrected
  after checking the live site rather than guessing. Headings are a serif at weight 800.
- **The one thing to say out loud in the demo, unprompted:** EOR employees never see partner
  branding, regardless of the co-brand decision above. Dragon's whitelabel eligibility logic
  grants co-branding to employers, service providers and Global Payroll employees, and withholds
  it from EOR employees, contractors, freelancers and candidates. So the co-branded HiBob look
  covers the employer's dashboard, hire flow and magic-link handoff — the new hire's own
  onboarding is Remote-branded. This is intended product behavior, not a gap, and it's better
  heard from us than discovered live.
- **Demo scope (three beats):** cost calculator, embedded EOR hiring through the onboarding SDK
  (mounted via the same-origin proxy, no direct browser-to-Tiger calls), and magic-link handoff
  to a co-branded Remote surface for the employer. No persona toggle on this branch — the
  employee side lives entirely on Dragon, reached only via magic link.
- **Auth model, if asked how the token handoff works:** three token types — partner
  (client-credentials, pre-company calls only: create company, company schema, list countries,
  country address details), session (everything after a company exists), and customer (a
  pre-seeded refresh token for a pre-built company, used carefully since a stale one silently
  sends a hire into the wrong company with no visible error).
- **Eng review verdict (2026-09-04 `/plan-eng-review`):** cleared, 14 issues found, 3 accepted
  with mitigation (a stale-session wrong-company hire, a popup-blocker eating the magic-link
  window, and a proxy-path assumption) — none of these are visible to a partner watching, but
  worth knowing so a live hiccup can be recovered gracefully rather than looking like a real bug.

**Known limitations, honest answers if asked:**
- File/document upload isn't wired through the proxy yet — any onboarding step needing a document
  or PDF preview won't work live today.
- The SDK dependency is an unpinned local checkout (branch `pbyr-4044`) as of 2026-09-04, not yet
  a published version — fine for a live demo, not yet a reproducible build for anyone else.
- A real upstream Dragon bug exists (a missing config guard) that could white-screen an employer
  dashboard if a brand were set server-side without a matching Dragon config. Deliberately avoided
  in this build by not touching Tiger's brand enum and relying on URL-param theming instead — not
  expected to surface in the demo, but good to recognize if something looks wrong.

---

## 2. Anticipated questions about Remote's SDK / architecture

**How does HiBob's system actually connect to Remote?**
Two things exist today, worth being precise about which is which. Live today: an employee-data
sync integration Remote built against HiBob's API, which is what the existing 34-customer Global
Payroll cohort runs on — HiBob is the source for a limited set of profile fields, Remote runs
payroll. What's being demoed tomorrow is the next layer: an embedded EOR flow where HiBob's admin
experience mounts Remote's own onboarding SDK for hiring, then hands off anything sensitive to a
co-branded Remote surface via a one-time magic link. Roadmap: a deeper embedded product where
payroll/EOR-required fields get captured once, inside HiBob, with no duplicate entry.

**Where does the data live once it's in the SDK, or after a hire completes?**
In Remote's own systems, not HiBob's schema. The SDK renders forms driven by Remote's own JSON
schemas — country-specific fields and validation — and submissions go straight to Remote's API,
through the demo's Express proxy, never touching a HiBob database. Schema/rule changes are
Remote's to make; the SDK just picks up the latest version automatically, which is the intended
low-maintenance story for HiBob's side.

**Is this the same underlying platform as the GP integration you've already been running with
us?**
Yes — lead with "one Unified API layer at Remote." Contractor Management was built on top of the
EOR APIs without the underlying APIs changing, only the business logic layered on top; the same
pattern holds moving from GP to EOR. HiBob's data-sync/integration effort only changes marginally
even as the specific product changes.

**What's the security model for sensitive actions — approving payroll, funding, payment?**
Those stay inside Remote's own authenticated surface, reached via a magic link: a pre-signed,
one-time-use SSO URL with roughly a 3-minute lifetime, embeddable behind any HiBob-side button
and co-brandable. Step-up 2FA applies to approval/funding actions by design — they never happen
inside an embedded component, only inside Remote's own authenticated context.

**What changes on HiBob's side if a customer needs both EOR and GP?**
Genuinely open as of this doc — one of five questions Milena raised on 2026-07-28 that hasn't
been answered in writing yet. Lead with the Unified API framing above rather than promising a
fully worked answer; flag it as something to work through live in the meeting.

**How does an EOR-hired employee transition later if the customer opens a local entity?**
Also still open from the same July 28 list. Don't invent a mechanism live — acknowledge it's a
real, unresolved question and take the specifics away rather than guessing.

**What's the commercial model — direct, co-sell, or white-label?**
As of the 2026-09-03 partner-of-choice announcement: Remote paper (Remote owns billing,
collections, money movement), HiBob owns GTM with HiBob-dedicated sales, Remote provides
dedicated GTM support, CX/ops stays Remote-owned — the same model already running with BambooHR
and Workday. Branded "HiBob EOR, Powered by Remote." Contract still under negotiation, December
2026 signing target, rough (not committed) intent of GP live by July 2027 with EOR to follow.

**How does this compare to what HiBob just did with Gusto for US payroll?**
Worth having ready since it may come up unprompted. HiBob's native US payroll (early access Sept
2025, GA Jan 2026) is built on Gusto's Embedded Payroll product plus PlanSource for benefits. By
CEO Ronni Zehavi's own account in a September 2025 interview, that pulled in close to 100 people
across payroll engineering and customer success combined, forced a "ship flawlessly, not ship
fast" culture shift, and was the first payroll-adjacent product to pull CFOs into the buying
process. That's real, recent, lived cost for HiBob's org, and this demo may get sized up against
it. The honest contrast: Remote's embed doesn't ask HiBob to own payroll rules, statutory logic,
or the payroll engine — Remote stays the source of truth; HiBob's side is an auth handshake, an
optional UI mount, and webhook consumption. That's structurally lighter than absorbing an entire
payroll engine, but don't claim zero engineering effort — the crawl/walk/run framing already used
with HiBob (magic-link now, deeper embed later) is the honest version of this.

**How does this compare to Deel's approach?**
Deel already runs a public developer platform, "Deel Embedded," explicitly pitched as "sell
hiring, payroll and compliance products." HiBob's team may already be somewhat fluent in the
concept of an embedded EOR SDK through Deel, even though Deel's actual existing HiBob integration
today looks like the same data-sync pattern Remote already has, not Deel's deeper embed product.
Worth knowing they may benchmark us against Deel's public developer story.

---

## 3. Technical deep dive — mounting the SDK when HiBob is Angular and we're React

This is the question most likely to actually get asked live, so it gets its own section rather
than a single Q&A line, with a plain-English box under every technical point. Grounded in the real
SDK code (`~/cursor/SDK_remote/remote-flows`, v1.42.0) and in how HiBob's own live Gusto-powered
payroll product solves the identical problem — not general theory.

### Ground truth on Remote's SDK: it is a React library, full stop, with no fallback today

- `package.json`: `peerDependencies` are `"react": "^18.3.1"` and `"react-dom": "^18.3.1"` — the
  host app must supply React itself, at that version. The build (`tsup.config.ts`) produces ESM
  only, nothing else — no UMD bundle, no web-component build, no iframe-hostable standalone page.

  > 💬 **Plain English.** A "peer dependency" means the SDK doesn't bring its own copy of React —
  > it's built assuming the app using it already has React running, and just plugs into that.
  > Angular apps don't have React running. So there's nothing for it to plug into.
  >
  > On ESM vs. UMD — this is really about *packaging format*, not framework compatibility, and
  > it's worth not overweighting it. ESM ("ECMAScript Modules") is the modern standard way
  > JavaScript files `import` each other; UMD is an older format built so a library could be
  > dropped into any plain webpage via a `<script>` tag, no build tools required, regardless of
  > framework. Modern Angular can load ESM packages fine — so "no UMD build" is not really why
  > this can't run on Angular. Even if Remote *did* ship a UMD build, it wouldn't fix anything —
  > the file would load fine, but it's still React component code inside, and Angular still has
  > no idea what to do with a React component once it's loaded. The real blocker is the next
  > point, not the packaging format.

- The README states it plainly: "A React library that provides components for Remote's embedded
  solution." Every flow (`OnboardingFlow`, `CostCalculatorFlow`, etc.) sits inside a five-level
  nested Context/Provider tree (error boundary, TanStack Query client, form-fields context, flow
  context, theme provider). That means the entire subtree from the mount point down has to be
  real React rendering real JSX — this isn't a self-contained widget you can hand to any host,
  it's a component tree that only works inside a React render tree.

  > 💬 **Plain English.** In React, "Context" is a way for components buried deep inside an app to
  > receive shared information (like "who's logged in" or "what theme are we using") without it
  > being manually passed down through every layer in between — think of it like a radio
  > broadcast that any component "tuned in" can pick up. A "Provider" is the broadcaster. This SDK
  > stacks five of those broadcasters on top of each other before you even get to the actual
  > hiring form. The consequence: you can't just grab the visible piece of UI and stick it into an
  > Angular page — the whole broadcast chain has to be real, live React, all the way down. This is
  > the actual, concrete reason a Web Component wrapper or an iframe (below) are the real ways
  > out — both draw a hard line around "everything inside this box is React, nobody outside needs
  > to understand it," instead of trying to make Angular somehow understand React's internals.

- The only mechanism Remote has today that doesn't require the host to run React at all is the
  **magic link** — a full-page redirect/new-tab handoff to a page Remote hosts and renders
  entirely itself. Confirmed: no web-component or custom-element wrapper exists anywhere in
  Remote's own codebase (checked Dragon and Tiger too).

  > 💬 **Plain English.** A magic link isn't a piece of UI at all — it's literally just a web
  > address (a signed, temporary URL). Clicking it sends the browser to a page that lives
  > entirely on Remote's own servers, the same as clicking any external link. Because none of
  > Remote's code ever has to run inside HiBob's app, there's zero framework question here — it
  > works no matter what HiBob is built with.

### The precedent that actually answers this: Gusto Embedded, which HiBob's live payroll product runs on today

Gusto ships two parallel, explicitly documented delivery paths, precisely because partners don't
all run React:

- **React SDK** (`@gusto/embedded-react-sdk`, public npm/GitHub package) — same shape as Remote's
  SDK. Gusto's own docs say to use this path if you "already use React... or are open to
  introducing React into your stack." Same structural requirement Remote's SDK has.

  > 💬 **Plain English.** Same deal as our own SDK — this is the deepest, most visually seamless
  > option, because the partner's app and Gusto's components are all one continuous piece of
  > React, sharing the same fonts, spacing, and page. The cost is you actually have to be running
  > React somewhere to use it.

- **Gusto Flows** — "ready-to-use UI components... can be iframed into your application," fully
  framework-agnostic, communicating back to the host via `postMessage` events
  (`gusto:flow-finish`, etc.). This is the path a non-React host — Angular, Vue, anything — uses.
  Sessions expire after 1 hour idle / 24 hours total, regenerable.

  > 💬 **Plain English.** Think of an iframe as a picture-in-a-picture window — a fully separate
  > mini-webpage sitting inside a rectangle on your page, the same idea as embedding a YouTube
  > video. What runs inside doesn't know or care what framework the surrounding page uses, because
  > it isn't really "inside" that page's code at all — it's just displayed there. Since the outer
  > page can't directly reach in and read what's happening inside (unlike with real React code
  > sitting in the same tree), the two sides pass short, formal notes back and forth called
  > `postMessage` — basically "hey, I'm done" or "resize me to this height." The 1hr/24hr expiry
  > is just like a login session timing out — the link that generates the iframe's content is
  > only good for a limited window before a fresh one is needed.

- Public sourcing doesn't confirm which path HiBob actually used, but given HiBob's Angular-
  leaning frontend (job-posting signal, not officially confirmed), **the iframe Flows path is the
  structurally likely one** — it's the only Gusto option that doesn't require HiBob to adopt
  React.

### General patterns, for completeness — the real options and what actually breaks

| Approach | Framework requirement | Real failure modes |
|---|---|---|
| iframe embed | None — fully agnostic | Needs `postMessage` for resize/events; auth via URL token or handshake, not shared cookies (third-party cookie blocking in Safari/Chrome is live and worsening); both sides need matching CSP/`X-Frame-Options`; pixel-perfect visual match is harder than in-page |
| Direct React mount into a host DOM node (`ReactDOM.createRoot`) | Host must load a React runtime somewhere on the page | Duplicate-React "Invalid hook call" errors if host has React elsewhere at a different version; CSS bleed both directions unless scoped; Angular's zone.js monkey-patches timers/events for change detection, causing timing/double-render friction with a React tree sitting inside it; ships a second UI runtime |
| Web Component / Custom Element wrapper | None on the host side | The clean cross-framework answer, but nobody has built this wrapper for Remote's SDK yet — it doesn't exist just because React components exist; Shadow DOM (if used) complicates passing rich data and can break portal-based UI (modals/tooltips) |
| Module Federation / micro-frontend | Both sides adopt the tooling | The "proper" enterprise answer, but a real, non-trivial build-pipeline ask of a partner, not an npm-install |

> 💬 **Plain English, row by row.**
>
> **iframe embed** — the same picture-in-a-picture idea from the Gusto Flows box above. The one
> new term is "third-party cookies": lots of HR/payroll products need to know who's logged in on
> both sides of the screen. If the mini-window is hosted on a different domain than the
> surrounding page, browsers increasingly refuse to let it "remember" a login the normal way —
> Safari and Chrome have both gotten stricter about this for privacy reasons. It doesn't make
> iframes impossible, it just means the login handoff has to use a token in the URL rather than a
> saved cookie.
>
> **Direct React mount ("a React island")** — this is "sneak a small React app inside the big
> Angular app." You build a tiny standalone React app and tell it "render yourself into this
> specific empty box on the page," and Angular is happy to leave that box alone. Two things that
> can go wrong: (1) if the Angular page *also* happens to load a different copy of React somewhere
> else on the page — increasingly common as apps mix technologies — you can get confusing "invalid
> hook call" errors, basically two copies of the same tool fighting over one workbench; (2)
> Angular runs a background helper called `zone.js` that watches everything happening on the page
> (clicks, timers, network calls) so it knows when to redraw itself. It wasn't built expecting a
> totally different framework's engine to be running inside the same page, so you sometimes get
> extra or slightly-out-of-sync redraws. Usually not a dealbreaker, just a known rough edge.
>
> **Web Component / Custom Element** — the "built properly for everyone" option. Instead of
> React-specific code, you package the same functionality as a plain, framework-neutral HTML tag —
> literally something like `<remote-hire-flow>` — that any page can use the same way it uses
> `<video>` or `<button>`, regardless of what framework built the surrounding page. The browser
> itself handles it, not React or Angular. The catch: nobody has built this wrapper for Remote's
> SDK yet — turning "a set of React components" into "one clean reusable HTML tag" is real
> engineering work. And if "Shadow DOM" is used (a common technique to stop the wrapped
> component's styling from leaking in or out), passing anything richer than plain text in or out
> gets more constrained — you lean on custom events instead of just handing over a JavaScript
> object the way React components normally would.
>
> **Module Federation / micro-frontend** — the enterprise-grade version of the "React island"
> idea. Instead of both apps being built and shipped together, one app can reach out the moment
> someone loads the page and pull in a chunk of another team's already-built app live, sharing a
> single copy of React between them so you avoid the "two Reacts fighting" problem above. Powerful,
> but both engineering teams have to specifically set their build tools up for this in advance —
> it isn't something you can just hand a partner as a normal package, the way an npm install works.

### Possible solutions, spelled out — what would actually need to be built

**Option A — HiBob adds a React island.** HiBob adds React as a dependency inside one page or
module of their app and mounts Remote's SDK into it directly, the same way this demo repo's own
POC does today. Engineering effort sits almost entirely on HiBob's side — Remote's SDK doesn't
need to change at all. Benefit: the deepest possible visual integration, genuinely one continuous
page rather than a window-within-a-window, closest to how the current demo actually looks and
feels. Cost: it's a real ask of HiBob's engineering team to introduce React into an Angular
codebase, even scoped to one page, and it carries the zone.js/duplicate-React friction described
above.

**Option B — Remote builds an iframe-hostable flow, mirroring Gusto Flows.** Remote builds a
hosted, standalone version of the onboarding flow — similar to what already exists for the magic
link, but designed to sit inside an iframe rather than as a full-page redirect — plus a small
`postMessage` contract so HiBob's page knows things like "flow finished" or "resize to this
height." Engineering effort sits entirely on Remote's side; this doesn't exist yet and would be
new work. Benefit: HiBob needs almost no new capability — any modern web app already knows how to
embed an iframe, so this is the path that asks the least of HiBob's engineering team. Cost:
slightly less visually seamless than a true in-page mount (can still look good, but an iframe is
always a little bit of a picture-in-a-picture), needs the cross-origin/cookie handling described
above, and it's genuinely new build work for Remote, not something we can offer for free today.

**Option C — Remote builds a Web Component wrapper (longer-term, roadmap-level).** More
engineering than Option B, but gives the cleanest long-term partner story — it would work for any
future partner's framework, not just this one. Not a "have it by tomorrow" answer; worth mentioning
only if the conversation goes deep on long-term platform strategy.

**What to actually say in the room.** Tomorrow's meeting is explicitly meant to be
"demo/solutioning," not a commitment — so the useful thing to walk in with is clarity on the fork,
not a pre-decided answer. Ask HiBob directly: is their frontend actually Angular today (we only
have job-posting-level signal, not confirmation), and if so, would they rather absorb a small
React dependency (Option A, their build effort) or have Remote build them an iframe version
(Option B, our build effort — and the one that mirrors what Gusto already proved works for an
Angular-style host)?

---

## 4. Anticipated questions rooted in HiBob's own platform

Researched on the open web 2026-09-09 (HiBob's own docs and marketing, not internal assumptions).
Flagged clearly wherever something couldn't be confirmed — better to say "we don't know, let's
ask" live than guess.

**Does HiBob support mounting a partner's UI inside their own screens, or only a redirect?**
Genuinely open, and worth asking them directly. HiBob's public developer docs
(apidocs.hibob.com) only document OAuth-based data access plus an optional redirect to a
partner's own hosted page during app installation — no public iframe, web-component, or native
embed SDK is documented anywhere. Their own Gusto-powered payroll module clearly renders inside
Bob's own UI shell, so some internal mechanism exists, but it isn't exposed publicly. Good
question to put to HiBob: is "Powered by Remote" meant to visually mount inside Bob itself, the
way Gusto's payroll UI does, or does it work like their existing Marketplace pattern — OAuth plus
redirect out to Remote's own hosted pages? The answer shapes the whole technical design, and it's
better to hear it from them than assume.

**What's HiBob's auth model for partner apps, and does it match what we're planning?**
HiBob's Marketplace/partner model is OAuth 2.0 Authorization Code flow, tied to a per-company
install (a `companyId` claim on both tokens and webhook payloads), managed through a separate
developer portal distinct from the customer-facing app. That's the relevant model — not their
more basic Service-User Basic Auth, which is for a customer's own internal integrations (and
whose older API-Access-Token predecessor was deprecated October 2024). Scopes are granted at
install and automatically cover future data added to that category. One gap worth knowing: HiBob
doesn't push an uninstall webhook — a partner detects revocation only by getting a 401 on the
next token refresh.

**Does HiBob push webhooks we can consume for hires, terminations, time off?**
Yes, and the event catalog is broad — employee created/updated/terminated/joined/activated/
inactivated, the full time-off request lifecycle, task events, workforce-planning events, and
document e-signature completion. Not confirmed: the exact signing/HMAC model and retry/backoff
behavior. The doc pages describing partner webhooks exist but weren't fully retrievable in this
research pass — flag as something to confirm with HiBob's technical team directly rather than
assume a specific signature header.

**What's HiBob's security/data-residency posture, given this is EOR/payroll data?**
Strong and specific, worth citing if it comes up: ISO 27001:2022, ISO 27018:2019 (cloud PII), SOC
2 Type II (available under NDA), hosted primarily in AWS Ireland with Germany as backup and
Frankfurt for disaster recovery, AES-256 at rest with a separate encryption layer specifically
for financial/salary data, role-based access control, MFA-enforced staff access, annual
penetration testing, and a public Bugcrowd bug bounty program. Useful to know HiBob already
handles financial/salary data with dedicated encryption — this isn't new territory for them.

**What's HiBob's own tech stack?**
Best public signal, moderate confidence only (job postings, not an engineering blog — their
Medium engineering blog is blocked to automated access): Angular has been their primary frontend
framework historically, with newer hires also expected to know React or Vue; backend in
Kotlin/Scala/Java on a microservices architecture; AWS as the cloud platform. None of this is
HiBob-published fact — hold it loosely, don't assert it back to them as if confirmed.

**Should we expect HiBob to already understand "embedded EOR" as a concept?**
Likely somewhat, yes, for two reasons. First, they just lived through embedding Gusto for US
payroll — a genuinely deep integration, not just data sync — so "someone else's engine mounted in
our UI" isn't a new idea to them. Second, HiBob's September 2026 $166M Salesforce-led raise
(valuing HiBob at $3.2B) repositions the company as an "open, headless, organizational
intelligence layer" wanting to expose HR context to agents and third-party systems — language
suggesting leadership is currently primed to favor composable/embedded partnerships over
build-everything-native. Good tailwind for the pitch, but also means they may probe hard on how
genuinely composable the Remote embed is, compared to how deeply they built the Gusto one.

**Is there already a public announcement of this specific embedded EOR partnership we should be
careful not to contradict?**
No. Everything public about Remote and HiBob today is the older employee-data-sync integration (a
2022 press release lists Remote among several EOR partners in HiBob's marketplace, plus Remote's
own support docs on the "HiBob Employee Sync Integration"). Treat the new embedded initiative as
not yet publicly announced, and worth confirming with Milena/Pim before saying anything in a
context that could leak externally.

---

## 5. Say "we don't know, let's confirm" rather than guess

- Whether HiBob's own frontend is actually Angular today — only job-posting-level signal, not
  confirmed. This decides which of the two mounting paths (React island vs iframe flow) is even
  on the table, so it's worth asking directly rather than assuming.
- HiBob's exact webhook signing/HMAC model — ask their technical team directly if it comes up.
- Whether HiBob supports OIDC in addition to SAML for customer SSO — only SAML is confirmed
  publicly.
- The real mechanism HiBob uses internally to mount Gusto's payroll UI inside Bob's own screens —
  not publicly documented.
- HiBob's exact engineering headcount for the Gusto build — our internal "~50 engineers" framing
  isn't independently confirmed; the only public number is "~100 people across payroll
  engineering and customer success combined" (CEO interview, not broken down further).
- Whether EOR-alongside-GP integration effort genuinely stays "marginal" once both products are
  live for one customer — open per Milena's July 28 list.
- The 3 contractual sticking points from the original end-of-July decision deadline — never
  itemized internally past the July 7 call.

---

## Sources

Internal:
- `PARTNER-DEMO-PLAYBOOK.md`, `PLAN-hibob-eor.md`, `TODOS.md` (this repo, as of 2026-09-04)
- Vault `wiki/partners/hibob.md` (updated 2026-09-05) and its full source list
- Vault `notion/pages/39ccb4dadab480ed9d0eebd630f9b184.md` — "Embedded Payroll & HRIS Integration
  — Time & Attendance," including HiBob's own time-off API doc links
- Google Calendar, live fetch 2026-09-09 — confirmed demo time and attendee list

External (fetched or searched 2026-09-09):
- hibob.com/about, hibob.com/marketplace, hibob.com/integrations, hibob.com/partner
- apidocs.hibob.com — authorization, OAuth 2.0, rate limiting, managing customer installations,
  add-and-submit-an-app
- hibob.com/privacy/security (Trust Center)
- hibob.com/news — EOR-partner-suite release (2022-10-24), US payroll launch (2025-09-16),
  Salesforce $166M investment (2026-09-01)
- outsail.co/post/hibobs-us-payroll-play (2025-09-17, CEO interview)
- deel.com/solutions/embedded, developer.deel.com/api/embedded/introduction
- `~/cursor/SDK_remote/remote-flows` (v1.42.0) — `package.json`, `tsup.config.ts`, `README.md`,
  `src/RemoteFlowsProvider.tsx` (fetched/read directly for the mounting-mechanics section)
- docs.gusto.com/embedded-payroll — Build options, React SDK, Gusto Flows, Flow events (fetched
  2026-09-09); github.com/Gusto/embedded-react-sdk
