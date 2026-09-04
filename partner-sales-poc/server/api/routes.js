import { getPartnerToken, getCustomerToken } from './get-token.js';
import { createProxyMiddleware } from './proxy.js';
import { getCounter, incrementCounter, resetCounter } from './counter.js';
import { getSession, saveSession, clearSession, getSessionToken } from './session.js';

export function setupRoutes(app) {
  // Token endpoints. Still used by src/lib/api-client.ts for the direct-REST
  // path (CreateEmploymentAPI); the SDK does NOT use these — see below.
  app.get('/api/fetch-partner-token', getPartnerToken);
  app.get('/api/fetch-customer-token', getCustomerToken);

  // Session endpoints (for newly created company)
  app.get('/api/session', getSession);
  app.post('/api/session', saveSession);
  app.delete('/api/session', clearSession);
  app.get('/api/session/token', getSessionToken);

  // Counter endpoints
  app.get('/api/counter', getCounter);
  app.post('/api/counter/increment', incrementCounter);
  app.post('/api/counter/reset', resetCounter);

  // Proxy REST API requests to the Remote Gateway.
  app.use('/api/v1', createProxyMiddleware());

  // Same-origin proxy for the remote-flows SDK.
  //
  // The SDK is mounted with `proxy: { url: window.location.origin }` (see
  // RemoteFlowsWrapper.tsx), so it calls /v1/... with no /api prefix. Routing
  // it through here instead of letting it call the gateway directly keeps the
  // browser same-origin (no CORS) and keeps the access token server-side,
  // which is the rule in AGENTS.md.
  //
  // The SAME middleware serves both mounts. That works because proxy.js does
  // `req.originalUrl.replace('/api', '')` to strip the prefix, which is a
  // no-op on a path that starts with /v1. Careful: `.replace` removes the
  // FIRST occurrence anywhere in the string, so a future route containing the
  // literal '/api' (e.g. /v1/companies/x/api-keys) would be silently mangled
  // here. If such a path appears, make the strip anchored instead.
  app.use('/v1', createProxyMiddleware());
}
