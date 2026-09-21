# partner-sales-pocs

Embedded partnerships sales technical demos — how to embed Remote workflows.
Internal sandbox demos only; nothing here is customer-facing or production code.

`main` holds the base template in `partner-sales-poc/`. **Start every new demo
from `main`**, not from another demo branch.

---

## Build and run a demo

**Prereqs:** Node 20.19+ (Vite 7 won't run on older) and a `CLIENT_ID` /
`CLIENT_SECRET` for your Remote integration.

```bash
git clone https://github.com/remoteoss/partner-sales-pocs.git
cd partner-sales-pocs/partner-sales-poc
git checkout -b <partner>-demo

npm install
cp .env.example .env        # fill in the two credentials — see below
npm run dev                 # http://localhost:3001
```

Your `.env`:

```env
REMOTE_CLIENT_ID=...          # required
REMOTE_CLIENT_SECRET=...      # required
REMOTE_REFRESH_TOKEN=         # leave empty — creating a company mints one
VITE_REMOTE_GATEWAY=sandbox   # local | sandbox | partners | staging | production
```

Check the gateway line printed at boot before you demo anything:

```
🚀 Partner Sales POC running at http://localhost:3001
   gateway: https://gateway.remote-sandbox.com  (VITE_REMOTE_GATEWAY=sandbox)
```

**Then, in this order:** create a company first, then run an employment flow.
Company creation is what produces the token every other flow needs.

> **Company creation failing with HTTP 422?** Your integration is missing
> entitlements. This is the most common blocker and it is not a code bug —
> fix it in your integration settings, listed in the
> [project README](partner-sales-poc/README.md#3-integration-settings).

---

## White-label it

| Change | Where |
|---|---|
| Name, website, logo path, 10-colour palette, fonts | `partner.config.json` — one file, drives the whole UI |
| Logo asset | `public/` — then point `logo.src` at it |
| Page title, favicon, Google Fonts link | `index.html` |
| Port (to run demos side by side) | `server/dev-server.js`, `const port = 3001` |

For fonts, put the real family first with a fallback behind it —
`"Gotham, Montserrat, sans-serif"` — so it renders on licensed machines and
degrades sensibly elsewhere.

**Never put a credential behind the `VITE_` prefix.** It publishes the value
into browser JavaScript. Only `VITE_REMOTE_GATEWAY` uses it, and it isn't
sensitive.

---

## Before you build something new, check `hibob-eor`

It solved problems the base template doesn't cover: a cost-calculator drawer,
magic-link white-labelling, multi-state demo flows, and
`server/api/__tests__/proxy.test.ts` — a `getAuthType` test documenting which
endpoints need which token.

That test's version of the function is more complete than `main`'s. `main` is
correct for the endpoints it actually calls, but a demo reaching further —
`/v1/countries/{code}/address_details`, or `/v1/companies/{id}/...`
sub-resources — will hit the 404 mid-demo that branch already fixed.

---

## Known gotchas

| | |
|---|---|
| `npm run build` fails | Pre-existing on `main` (tsconfig project references). Doesn't affect `npm run dev`. |
| `npm run lint` fails | Pre-existing on `main`, 16 errors. |
| No tests, no CI | `main` has neither. `hibob-eor` is the exception — vitest, two test files. Copy that pattern if you add tests. |

Neither failure is something you broke. Details in the
[CHANGELOG](partner-sales-poc/CHANGELOG.md) "Still open" table.

---

## Merging `main` into an old demo branch

Rarely needed — branch fresh from `main` instead. If you must, `hibob-eor`,
`adp-wfn-redesign` and `malt` all predate two changes and will conflict:

1. **Credentials were renamed** `VITE_CLIENT_*` → `REMOTE_CLIENT_*`. Those
   branches still read the old names in 9, 4 and 3 code files. Nothing flags
   it — env access isn't typechecked, so it compiles and then fails to
   authenticate. Verify after merging (keep `--exclude="*.md"`, or docs
   mentioning the old names match forever):

   ```bash
   grep -rn "VITE_CLIENT_ID\|VITE_CLIENT_SECRET\|VITE_REFRESH_TOKEN" \
     partner-sales-poc --exclude-dir=node_modules --exclude="*.md"
   ```

   Rename them in your local `.env` too — it isn't version-controlled.

2. **`server/session.json` is no longer tracked** and all three modify it, so
   you'll get a `modify/delete` conflict. **Resolve it as a delete.** Git's
   default keeps the branch's copy, which re-commits a refresh token into a
   public repo. The app recreates the file on company creation.

Expect content conflicts in `proxy.js` and `CreateCompany.tsx` too. Both sides
are real — keep the demo's behaviour *and* the fix from `main`.

---

Demo-branch branding is mock-up work built from publicly available brand
resources. It is not officially endorsed by those companies.
