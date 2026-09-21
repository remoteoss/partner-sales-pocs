import { fetchCustomerToken, fetchPartnerToken, buildGatewayURL } from './get-token.js';
import { fetchSessionToken, hasSessionToken } from './session.js';

// Endpoints that take a partner-level (client_credentials) token.
//
// These are the ONLY calls made before a company — and therefore a user —
// exists, so they are the only ones a client-credentials token can serve. That
// token has no user behind it: the API resolves its `sub` as a user slug, so
// any user-scoped endpoint fails with "User not found with the given slug:
// <client_id>" or "Company not found".
//
// Matching is EXACT, never by prefix. Prefix matching on '/v1/countries' also
// captured /v1/countries/{code}/employment_basic_information — the Basic
// Information step's schema, which needs a real user token — and it 404'd.
const PARTNER_PATHS = new Set([
  '/v1/companies', // POST - create a company
  '/v1/companies/schema', // company address-details schema, pre-company
  '/v1/countries', // country list for the picker
]);

// Pre-company too, but parameterised so they can't live in the Set above.
// /v1/countries/{code}/address_details backs the company creation form.
const PARTNER_PATH_PATTERNS = [/^\/v1\/countries\/[^/]+\/address_details$/];

/**
 * Determine auth type for an endpoint.
 * Returns: 'partner' | 'session' | 'customer'
 *
 * Order matters. Partner paths win outright: they are called before any
 * customer context exists, so a session token is meaningless there even when
 * the caller asks for one.
 *
 * Everything else is user-scoped and prefers the live session company. We check
 * the server-side session as well as the caller's header because the
 * remote-flows SDK fixes its proxy headers at mount time and some flows never
 * set it. Without that fallback an employment call lands in the .env company
 * instead of the one just created on screen — silently, with no error, so the
 * hire simply isn't where the demo says it is.
 */
export function getAuthType(path, useSessionToken, sessionAvailable = false) {
  const pathname = path.split('?')[0];

  if (PARTNER_PATHS.has(pathname) || PARTNER_PATH_PATTERNS.some((re) => re.test(pathname))) {
    return 'partner';
  }

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
      
      // Determine which token to use. hasSessionToken() is passed so a live
      // company created on screen wins even when the caller sets no header.
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
        // Fallback to customer token for session failures
        if (authType === 'session') {
          console.log('[Proxy] Falling back to customer token');
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
