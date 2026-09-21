# Partner Sales POC

A demo application for showcasing Remote's embedded solution capabilities to potential partners.

## Features

- **Create Company** - Register a new company using the Remote API
- **Create Employment (SDK)** - Onboard employees using `@remoteoss/remote-flows`
- **Create Employment (API)** - Onboard employees using direct REST API calls

## Prerequisites

### 1. Node.js

**Node.js 20.19+ or 22.12+** is required (Vite 7 will not run on older versions).

Check what you have:

```bash
node -v && npm -v
```

If either command errors, install the current LTS release from
[nodejs.org](https://nodejs.org) — set the install-method dropdown to
**Prebuilt Installer** to get the macOS `.pkg`, which needs no Homebrew or nvm.
**Open a new terminal window afterwards**, or the old one will still report
`npm: command not found`.

### 2. Remote partner credentials

You need a `CLIENT_ID` and `CLIENT_SECRET` for your integration. These are
issued by Remote (delivered via 1Password) — see
[Quick Start Guide for Partners](https://developer.remote.com/docs/getting-started-1).

**You do not need to supply a refresh token.** Refresh tokens don't exist until
a company grants consent. This app obtains one automatically: creating a company
returns tokens in the response payload, which the app writes to
`server/session.json` for the employment flows to use.

### 3. Integration settings

Company creation requests two actions, `get_oauth_access_tokens` and
`send_create_password_email`. If your integration isn't entitled to them, the
API returns **HTTP 422** with `is not allowed` messages and company creation
fails entirely.

Enable these in your integration settings:

| Setting | Why |
|---------|-----|
| **Generate tokens on company creation** | Provides `get_oauth_access_tokens`. Without it there is no way to obtain a refresh token, so all employment flows are blocked. |
| **Allow set password on company creation** | Provides `send_create_password_email`. |
| **Allow employment creation before company active** | A newly created sandbox company isn't active yet; employment creation is otherwise refused. |
| **Automatically activate company admin** | Skips email verification, which you don't want to wait on during a demo. |
| **Can generate magic links** | Only needed if demoing `/v1/magic-link`. |

Leave **Disallow client credentials access** switched **off** — it's phrased as a
negative, and enabling it blocks the machine-to-machine flow this app depends on.

## Quick Start

**1. Configure credentials.** Create `.env` from the template and fill in your
values:

```bash
cp .env.example .env
```

```env
REMOTE_CLIENT_ID=your_client_id
REMOTE_CLIENT_SECRET=your_client_secret
REMOTE_REFRESH_TOKEN=your_refresh_token
VITE_REMOTE_GATEWAY=partners
```

Note the prefixes. The three credentials deliberately **do not** use Vite's
`VITE_` prefix, because that prefix exposes a value to browser code — see
[Security note](#security-note). Only `VITE_REMOTE_GATEWAY` carries it, since
the SDK needs the environment name client-side and it isn't sensitive.

`REMOTE_REFRESH_TOKEN` is **optional** — leave it as the placeholder. Creating a
company mints a real refresh token into `server/session.json`, and
`fetchCustomerToken` prefers that over `.env`. Only set it if you're targeting a
company that consented previously.

`.env` is gitignored; `.env.example` is **not**, so keep real credentials out
of it. `VITE_REMOTE_GATEWAY` must be one of `local`, `sandbox`, `partners`,
`staging`, or `production` (see [Gateway Environments](#gateway-environments)).

**2. Install dependencies.**

```bash
npm install
```

**3. Start the server.**

```bash
npm run dev
```

On boot it prints the port and the gateway it resolved:

```
🚀 Partner Sales POC running at http://localhost:3001
   gateway: https://gateway.remote-sandbox.com  (VITE_REMOTE_GATEWAY=sandbox)
```

Then open [http://localhost:3001](http://localhost:3001).

**4. Create a company first.** Company creation uses the partner token and
populates `server/session.json` with a customer refresh token. The employment
flows depend on that session, so run them in that order.

## Security note
<a id="security-note"></a>

**Never give a secret a `VITE_` prefix.** That prefix instructs Vite to expose
the value to client code, and any module touching `import.meta.env` receives the
*entire* env object — not just the key it asked for.

The credentials previously used it, which meant the client secret and refresh
token were served to the browser and readable in devtools.
`RemoteFlowsWrapper.tsx` reads `import.meta.env.VITE_REMOTE_GATEWAY`, and that
alone was enough to leak everything else alongside it.

Fixed by renaming them to `REMOTE_CLIENT_ID`, `REMOTE_CLIENT_SECRET`, and
`REMOTE_REFRESH_TOKEN`. They're read exclusively server-side via `process.env`,
so dropping the prefix costs nothing. Vite now injects only:

```js
import.meta.env = {"BASE_URL":"/","DEV":true,"MODE":"development","PROD":false,"SSR":false,"VITE_REMOTE_GATEWAY":"sandbox"}
```

If you add a credential later, do not name it `VITE_*`.

The success panel on Create Company renders the raw API response so partners can
see the payload shape. Credential values in it (`access_token`, `refresh_token`,
`id_token`) are masked as `<redacted - N chars>` by `redactCredentials` in
`CreateCompany.tsx`.

That masking is **display-only and safe**: `createCompany` extracts the real
tokens and writes them to `server/session.json` before the panel renders, and
every downstream flow reads them from there via `/api/session/token` and
`/api/fetch-customer-token`. Nothing reads the rendered JSON, so the redaction
cannot affect functionality.

The success panel on Create Company renders the raw API response so partners can
see the payload shape. Credential values in it (`access_token`, `refresh_token`,
`id_token`) are masked as `<redacted - N chars>` by `redactCredentials` in
`CreateCompany.tsx`.

That masking is **display-only and safe**: `createCompany` extracts the real
tokens and writes them to `server/session.json` before the panel renders, and
every downstream flow reads them from there via `/api/session/token` and
`/api/fetch-customer-token`. Nothing reads the rendered JSON, so the redaction
cannot affect functionality.

## Troubleshooting

- **`npm: command not found`** — Node isn't installed or isn't on this shell's
  PATH. See [Prerequisites](#prerequisites). With nvm, run `nvm use --lts`.
- **`Cannot find module @rollup/rollup-darwin-arm64`** (or a similar esbuild
  error) — `node_modules` was installed on a different OS or architecture. Fix
  with `rm -rf node_modules package-lock.json && npm install`.
- **Connection refused on localhost:3001** — the server isn't running. Check
  its terminal for a crash above the startup banner; if the `gateway:` line
  never appeared, it died before listening.
- **`EADDRINUSE` / port 3001 busy** — find the other process with
  `lsof -nP -iTCP:3001 -sTCP:LISTEN`.
- **`HTTP 422 - ... is not allowed`** on company creation — your integration
  lacks the required actions. See [Integration settings](#3-integration-settings).
- **Employment flows fail while company creation works** — company creation
  uses the partner token (`client_credentials`); employment uses the customer
  token (`refresh_token`) and `server/session.json`. A stale `session.json`
  points at a company that may no longer exist in the sandbox. Delete it and
  create a fresh company to regenerate it.

## Partner Branding

Customize the demo for different partners by editing `partner.config.json`:

```json
{
  "company": {
    "name": "Partner Name",
    "website": "https://partner.com"
  },
  "logo": {
    "src": "/logo.svg",
    "alt": "Partner Logo"
  },
  "colors": {
    "primary": "#0061FF",
    "secondary": "#8d969e",
    ...
  },
  "fonts": {
    "family": "Inter, system-ui, sans-serif"
  }
}
```

Replace `public/logo.svg` with the partner's logo.

## Project Structure

```
partner-sales-poc/
├── partner.config.json      # Partner branding configuration
├── public/
│   └── logo.svg             # Partner logo
├── server/
│   ├── dev-server.js        # Express + Vite dev server
│   ├── session.json         # Runtime session state (gitignored)
│   └── api/
│       ├── routes.js        # API route setup
│       ├── get-token.js     # OAuth token management
│       └── proxy.js         # API proxy middleware
└── src/
    ├── config/
    │   └── partner.ts       # Typed config loader
    ├── lib/
    │   └── api-client.ts    # Axios API clients
    ├── components/
    │   ├── layout/          # Header, Layout
    │   └── ui/              # Button, Card, Tabs, Loading
    ├── features/
    │   ├── company/         # Create Company (API)
    │   └── employment/
    │       ├── sdk/         # SDK OnboardingFlow
    │       └── api/         # Direct API approach
    └── pages/
        ├── HomePage.tsx
        ├── CreateCompanyPage.tsx
        └── CreateEmploymentPage.tsx
```

## API Endpoints

The dev server proxies requests to the Remote Gateway:

| Endpoint | Description |
|----------|-------------|
| `GET /api/fetch-partner-token` | Get partner-level access token (client credentials) |
| `GET /api/fetch-customer-token` | Get customer-level access token (refresh token) |
| `* /api/v1/*` | Proxy to Remote API |

Auth selection happens in `server/api/proxy.js`: `/v1/companies` and
`/v1/countries` use the partner token, `/v1/magic-link` can use the session
token, and everything else defaults to the customer token.

## Gateway Environments
<a id="gateway-environments"></a>

| Environment | Gateway URL |
|-------------|-------------|
| `partners` | https://gateway.partners.remote-sandbox.com |
| `sandbox` | https://gateway.remote-sandbox.com |
| `production` | https://gateway.remote.com |
| `staging` | https://gateway.niceremote.com |

## Technologies

- **React 18** + TypeScript
- **Vite** for development/build
- **Express** for API proxy server
- **@remoteoss/remote-flows** - SDK components
- **@remoteoss/json-schema-form** - Dynamic form generation
- **@tanstack/react-query** - Data fetching
- **Tailwind CSS** - Styling
- **Formik + Yup** - Form handling

## License

Private - Remote.com Internal Use
