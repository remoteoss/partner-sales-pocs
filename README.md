# partner-sales-pocs

Embedded partnerships sales technical demos — how to embed Remote workflows.

Internal sandbox demos only. Nothing here is customer-facing or production code.

## Layout

| Path / branch | What it is |
|---|---|
| `partner-sales-poc/` on `main` | The base template. New demos branch from here. See its [README](partner-sales-poc/README.md) to run it, and its [CHANGELOG](partner-sales-poc/CHANGELOG.md) for known-open issues. |
| `hibob-eor` | White-label HiBob EOR / Global Payroll demo |
| `adp-wfn-redesign` | ADP Workforce Now demo |
| `malt` | Malt demo |

Branding on the demo branches is mock-up work built from publicly available
brand resources. It is not officially endorsed by those companies.

---

## ⚠️ Read this before merging `main` into a demo branch

`hibob-eor`, `adp-wfn-redesign`, and `malt` all branched from `main` **before**
the credential rename and the `session.json` removal. Merging `main` down
without care produces a branch that builds fine and then fails at runtime.

There are no tests and no CI in this repo. Nothing will catch a bad merge for
you — verify by hand.

**1. The credential env vars were renamed.** `VITE_CLIENT_ID`,
`VITE_CLIENT_SECRET` and `VITE_REFRESH_TOKEN` became `REMOTE_CLIENT_ID`,
`REMOTE_CLIENT_SECRET` and `REMOTE_REFRESH_TOKEN`, because the `VITE_` prefix
was publishing the client secret to browser JavaScript. Only
`VITE_REMOTE_GATEWAY` keeps its prefix.

The demo branches still read the old names — `hibob-eor` in 9 code files,
`adp-wfn-redesign` in 4, `malt` in 3. A merge will **not** flag these: env
access isn't typechecked, so a half-migrated branch compiles and then fails
when it tries to authenticate. Grep after merging:

```bash
grep -rn "VITE_CLIENT_ID\|VITE_CLIENT_SECRET\|VITE_REFRESH_TOKEN" partner-sales-poc \
  --exclude-dir=node_modules --exclude="*.md"
```

The `--exclude="*.md"` matters: the CHANGELOG and this file both discuss the
old names in prose, and without it you get false positives forever.

That must come back empty. Also rename the three variables in your local
`.env`, which is not in version control and will not be migrated for you.

**2. `server/session.json` is no longer tracked, and every demo branch
modifies it.** You will get a `modify/delete` conflict on all three.

**Resolve it as a delete —** `git rm partner-sales-poc/server/session.json`.
Git's default leaves the branch's version in the tree, and accepting that
re-commits a refresh token into a public repo. The file is runtime state: the
app writes it on company creation and recreates it when missing, so deleting
it breaks nothing.

**3. Expect content conflicts** in `proxy.js` and `CreateCompany.tsx`
(`hibob-eor`), and `CreateCompany.tsx` (`adp-wfn-redesign`). Both sides are
real changes — keep the demo's behaviour *and* the fix from `main`, rather
than taking one side wholesale.

**4. Smoke-test before you demo.** `npm run dev`, confirm the gateway line at
boot points where you expect, then run a company creation and one employment
flow all the way through.

Note `npm run build` and `npm run lint` both fail on `main` already, for
reasons unrelated to any of this — see the CHANGELOG's "Still open" table.
Don't read those failures as a broken merge.
