# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `AGENTS.md` for the full operating contract (full-stack startup order, ADP WFN visual target, safe-to-modify surface). This file summarizes what a new Claude instance needs to get productive; `AGENTS.md` is authoritative when the two disagree.

## Commands

- `npm run dev` — starts Express + Vite in middleware mode on **port 3002** (via `nodemon server/dev-server.js`). This is the only way to run the app properly; `npm run dev:vite` alone will not provide the `/api/*` proxy or token endpoints.
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — ESLint across the repo
- `npm run preview` — Vite preview of the built bundle

There is no test runner configured.

## Architecture

Single Express process hosts Vite as middleware. The browser loads the SPA from `:3002`, and the same process handles `/api/*` — the SPA never calls the Remote Gateway directly.

```
Browser (:3002 SPA) ─┐
                     ├─► Express (same :3002 process) ─► Remote Gateway (Tiger)
Vite middleware ─────┘        │
                              └─► token cache, session, counter (JSON files)
```

Request flow for an API call:
1. `src/lib/api-client.ts` defines two axios clients. Their request interceptors hit `/api/fetch-partner-token` or `/api/fetch-customer-token` on every request to attach a `Bearer` token.
2. `server/api/get-token.js` exchanges credentials (`VITE_CLIENT_ID`/`VITE_CLIENT_SECRET` for partner, refresh token for customer) against the gateway chosen by `VITE_REMOTE_GATEWAY`.
3. Business calls go to `/api/v1/*`, which `server/api/proxy.js` forwards to the selected Remote Gateway.
4. Gateway URL mapping (`local` / `sandbox` / `partners` / `staging` / `production`) is resolved server-side — don't hardcode hosts in the SPA.

Runtime state lives in `server/session.json` (currently-created company, used to keep the demo stateful across reloads) and `server/counter.json`. These are gitignored in spirit — never commit and never hand-edit; `nodemon.json` already excludes them from the watch.

Two parallel paths for employment onboarding live side-by-side on purpose:
- `src/features/employment/sdk/` — embeds `@remoteoss/remote-flows` (which renders its own `@remoteoss/json-schema-form` forms). Themeable via `partner.config.json` colors but the internal component tree is not ours to edit.
- `src/features/employment/api/` — direct REST calls through `customerApiClient`, showing what a partner would build without the SDK.

Routing is client-side only (`react-router-dom` v7). Express falls back to serving the transformed `index.html` for any non-`/api/*` path (`server/dev-server.js` SPA fallback).

## Partner branding

`partner.config.json` (checked in; currently set to ADP) drives colors/fonts/logo. `src/config/partner.ts` is the typed loader — consume `config` from there rather than reading the JSON directly. The logo at `public/adp-logo.svg` is referenced via `logo.src`.

## Environment

Required in `.env` (see `.env.example`): `VITE_CLIENT_ID`, `VITE_CLIENT_SECRET`, `VITE_REFRESH_TOKEN`, `VITE_REMOTE_GATEWAY`. For the local ADP demo these map to credentials seeded in Tiger by `~/cursor/tiger/tiger/apps/tiger/priv/scripts/setup_adp_demo.exs` — changing them breaks auth against a local Tiger.

## Don't touch without reason

Per `AGENTS.md`, UI work should stay out of:
- `server/**` (auth, token cache, session, proxy)
- `src/lib/api-client.ts` (axios clients + interceptors)
- `src/features/employment/sdk/RemoteFlowsWrapper.tsx` (SDK host)
