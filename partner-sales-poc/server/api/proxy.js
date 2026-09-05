import { fetchCustomerToken, fetchPartnerToken, buildGatewayURL } from './get-token.js';
import { fetchSessionToken, hasSessionToken } from './session.js';

// Endpoints that require partner-level (client_credentials) auth.
//
// These are the ONLY calls made before a company (and therefore a user) exists,
// so they are the only ones a client-credentials token can serve. Matching is
// EXACT, not by prefix: a client-credentials token has no user behind it, and
// Tiger resolves its `sub` as a user slug, so any user-scoped endpoint fails
// with "User not found with the given slug: <client_id>" or "Company not found".
//
// This bit us: '/v1/countries' as a PREFIX also captured
// /v1/countries/CAN/employment_basic_information — the Basic Information step's
// schema — which needs a real user token and 404'd with "Company not found".
const PARTNER_PATHS = new Set([
  '/v1/companies', // POST — create a company
  '/v1/companies/schema', // company address-details schema, pre-company
  '/v1/countries', // country list for the picker
]);

// GET /v1/countries/{code}/address_details — also pre-company (company creation
// form). Same shape as the allowance in gp-proxy.js.
const PARTNER_PATH_PATTERNS = [/^\/v1\/countries\/[^/]+\/address_details$/];

/**
 * Determine auth type for an endpoint
 * Returns: 'partner' | 'session' | 'customer'
 *
 * Order matters. Partner endpoints win outright: /v1/companies and
 * /v1/countries are called before any customer context exists, so a session
 * token is meaningless there even when the caller asks for one.
 *
 * Everything else honours the X-Use-Session-Token header. This is what keeps
 * the demo honest: once a company has been created live, the session token
 * points at THAT company, and every employment call must use it. Falling back
 * to the .env customer token would create the employment under a different
 * company with no error — the hire simply would not be where the demo says it
 * is. The remote-flows SDK sets this header at mount time (see
 * RemoteFlowsWrapper.tsx) because its proxy headers are static.
 */
export function getAuthType(path, useSessionToken, sessionAvailable = false) {
  const pathname = path.split('?')[0];

  if (
    PARTNER_PATHS.has(pathname) ||
    PARTNER_PATH_PATTERNS.some((re) => re.test(pathname))
  ) {
    return 'partner';
  }

  // Everything else is user-scoped. Prefer the live company's token whenever we
  // have one: it is the company the demo just created on screen, and using the
  // .env customer token instead would silently act on a different company.
  // We check the server-side session as well as the caller's header, because the
  // SDK's proxy headers are fixed at mount and some flows never set it.
  if (useSessionToken || sessionAvailable) {
    return 'session';
  }

  return 'customer';
}

/**
 * Express middleware to proxy requests to the Remote Gateway
 * Uses appropriate token based on endpoint and context
 */
export function createProxyMiddleware() {
  return async (req, res) => {
    try {
      const gatewayUrl = buildGatewayURL();
      // Remove /api prefix to get the actual API path
      const apiPath = req.originalUrl.replace('/api', '');
      const targetUrl = `${gatewayUrl}${apiPath}`;

      // Check for X-Use-Session-Token header
      const useSessionToken = req.headers['x-use-session-token'] === 'true';
      
      // Determine which token to use
      const authType = getAuthType(apiPath, useSessionToken, hasSessionToken());
      
      let accessToken;
      try {
        if (authType === 'session') {
          const result = await fetchSessionToken();
          accessToken = result.accessToken;
        } else if (authType === 'partner') {
          const result = await fetchPartnerToken();
          accessToken = result.accessToken;
        } else {
          const result = await fetchCustomerToken();
          accessToken = result.accessToken;
        }
      } catch (tokenError) {
        console.error(`[Proxy] Failed to get ${authType} token:`, tokenError.message);
        // Fallback to customer token for session failures.
        // WARNING: the customer token belongs to a DIFFERENT company than the
        // session one. If this fires during an employment flow, the hire lands
        // in the .env company, not the one created on stage. With no
        // VITE_REFRESH_TOKEN in .env.hibob-local (the intended local setup)
        // this fallback fails loudly instead, which is the safer outcome.
        if (authType === 'session') {
          console.warn('[Proxy] Session token failed — falling back to the .env customer token (DIFFERENT COMPANY)');
          const result = await fetchCustomerToken();
          accessToken = result.accessToken;
        } else {
          throw tokenError;
        }
      }

      console.log(`[Proxy] ${req.method} ${apiPath} (${authType} auth)`);

      const requestConfig = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      };

      if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
        requestConfig.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, requestConfig);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        res.status(response.status).json(data);
      } else {
        const text = await response.text();
        res.status(response.status).send(text);
      }
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({
        error: error.message || 'Proxy request failed',
      });
    }
  };
}
