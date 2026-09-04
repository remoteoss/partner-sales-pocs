import { fetchCustomerToken, fetchPartnerToken, buildGatewayURL } from './get-token.js';
import { fetchSessionToken, hasSessionToken } from './session.js';

// Endpoints that require partner-level (client_credentials) auth
const PARTNER_ENDPOINTS = [
  '/v1/companies',
  '/v1/countries',
];

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
export function getAuthType(path, useSessionToken) {
  if (PARTNER_ENDPOINTS.some(endpoint => path.startsWith(endpoint))) {
    return 'partner';
  }

  if (useSessionToken) {
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
      const authType = getAuthType(apiPath, useSessionToken);
      
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
