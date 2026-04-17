# AGENTS.md — Partner Sales POC

## What this is
A Vite + React demo app that impersonates an ADP-branded partner portal. It talks to a local Tiger (Remote.com backend) and issues magic links into a local Dragon (Remote.com frontend). Used to demo "what ADP customers see" vs default Remote UI.

## Architecture — DO NOT BREAK

```
POC (:3002 — Express + Vite middleware) → Tiger (:4000) → Dragon (:3000)
```

- **POC frontend** (`src/`): Vite SPA, served by Express in middleware mode. Never calls Tiger directly — always goes through the local Express proxy
- **POC server** (`server/`): Express app on port 3002. Handles partner auth (client creds), token cache, session persistence, and proxies to Tiger. Same process as Vite
- **Tiger** (separate repo at `~/cursor/tiger/tiger/apps/tiger`): Elixir/Phoenix backend, runs on :4000
- **Dragon** (separate repo at `~/cursor/dragon/dragon/apps/employ`): Next.js frontend, runs on :3000 (falls back to :3002 if taken — start Dragon BEFORE POC to avoid the port fight)

### Critical connection points — TOUCHING THESE BREAKS THE DEMO

| File | Why it matters |
|------|---------------|
| `.env` | `VITE_CLIENT_ID=adp-local-demo`, `VITE_CLIENT_SECRET=adp-local-secret`, `VITE_REMOTE_GATEWAY=local` — these map to creds seeded in Tiger by `apps/tiger/priv/scripts/setup_adp_demo.exs`. Changing them breaks auth |
| `server/dev-server.js` | Wires Express + Vite middleware on :3002. UI work shouldn't touch |
| `server/api/*.js` | Token/session/proxy logic. UI work shouldn't touch |
| `server/session.json`, `server/counter.json` | Runtime state files. Never commit, never hand-edit |
| `src/lib/api-client.ts` | Axios client + interceptors. UI work shouldn't touch unless adding headers |
| `src/features/employment/sdk/RemoteFlowsWrapper.tsx` | Hosts `@remoteoss/remote-flows` SDK. SDK owns its own UI; we theme around it |

### SDK caveat
Employment onboarding + cost calculator flows use the `@remoteoss/remote-flows` npm package. That SDK renders its own forms via `@remoteoss/json-schema-form`. You can theme via `partner.config.json` colors and Tailwind utilities, but the internal component structure is not ours to change.

## Starting the full stack locally

Order matters: Postgres → Tiger → Dragon → POC.

```bash
# 1. Postgres (if not already running)
~/.local/bin/mise exec -- pg_ctl start -D ~/.local/share/mise/installs/postgres/system/data -l /tmp/postgres.log

# 2. Tiger backend (:4000)
cd ~/cursor/tiger/tiger/apps/tiger && iex -S mix phx.server
# First time on a fresh DB? Also run:
#   mix ecto.reset
#   then in IEx: Code.eval_file("priv/scripts/setup_adp_demo.exs")

# 3. Dragon frontend (:3000)
cd ~/cursor/dragon/dragon/apps/employ && yarn dev

# 4. POC (this repo, :3002)
cd ~/cursor/SDK_remote/partner-sales-poc && yarn dev
```

Dragon login (after magic-link redirect lands on /login): `owner@ableton.com` / `123456789000Aa`

## What this UI redesign is about

Make the POC look like a real ADP Workforce Now (WFN) screen. ADP WFN is ADP's mid-market HCM product. Visual characteristics to target:

- **Color**: ADP red (`#D0271D`) primary, white backgrounds, grey secondary text (already in `partner.config.json`)
- **Header/navbar**: Dense top nav with sections like `HOME / PEOPLE / PROCESS / REPORTS / MYSELF`
- **Typography**: Conservative sans-serif, tight line-height, enterprise feel — not modern/airy
- **Density**: Information-dense, table-heavy, small padding — not whitespace-heavy like Remote's UI
- **Tabs**: Underlined red tabs are very ADP
- **Left rail**: ADP often has a collapsible left nav with icons + labels

**Ask the user for ADP WFN screenshots or a Figma link before starting** — guessing from memory produces wrong output.

## Safe-to-modify surface area

UI work should be scoped to:

- `src/components/ui/*` — Button, Card, Tabs, Loading, etc.
- `src/components/layout/*` — Header, Layout
- `src/components/form/*` — FormFields, JsonSchemaForm wrapper
- `src/pages/*` — HomePage, CreateCompanyPage, CreateEmploymentPage
- `src/features/company/CreateCompany.tsx`
- `src/features/employment/api/CreateEmploymentAPI.tsx`
- `src/index.css` — Tailwind v4 config
- `partner.config.json` — branding tokens (colors, fonts, logo)
- `public/adp-logo.svg` — logo asset

## Things that are NOT this repo's problem

- **Whitelabel branding inside Dragon** (the `whitelabel.brand: "adp"` field on `/api/v1/account`) — that drives Dragon's theming, lives in `~/cursor/dragon/dragon/apps/employ/` under `partner-whitelabel/`. This POC is a standalone partner portal and styles itself via `partner.config.json`
- **Tiger setup script** — lives in tiger repo at `apps/tiger/priv/scripts/setup_adp_demo.exs`
- **Server-side auth/session/proxy** — `server/` code is frozen from a UI perspective

## Verification before calling UI work done

1. `yarn dev` starts without errors, POC loads at http://localhost:3002
2. Home page, Create Company page, Create Employment page all render
3. Create a company via the POC → Tiger returns 200 → company exists (check `server/session.json` populated, or verify in Tiger via Rivendell)
4. Generate magic link → redirects to Dragon at :3000 → Dragon loads (Dragon's branding is separate from POC's)
5. Cost calculator drawer opens and renders the SDK form
6. No console errors, no network 401/500s

## References

- ADP domain docs: `~/cursor/adp-integration/` (has its own CLAUDE.md)
- Tiger-side setup that wired this POC up: `~/cursor/tiger/tiger/apps/tiger/priv/scripts/setup_adp_demo.exs`
- Dragon whitelabel patterns (for reference only): `~/cursor/dragon/dragon/apps/employ/partner-whitelabel/`
