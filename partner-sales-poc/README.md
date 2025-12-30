# Partner Sales POC

A demo application for showcasing Remote's embedded solution capabilities to potential partners.

## Features

- **Create Company** - Register a new company using the Remote API
- **Create Employment (SDK)** - Onboard employees using `@remoteoss/remote-flows`
- **Create Employment (API)** - Onboard employees using direct REST API calls

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and add your Remote API credentials:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
VITE_CLIENT_ID=your_client_id
VITE_CLIENT_SECRET=your_client_secret
VITE_REFRESH_TOKEN=your_refresh_token
VITE_REMOTE_GATEWAY=partners
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

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

## Gateway Environments

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
