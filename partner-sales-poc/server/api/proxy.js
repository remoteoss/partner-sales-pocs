import { fetchCustomerToken, fetchPartnerToken, buildGatewayURL } from './get-token.js';
import { fetchSessionToken, hasSessionToken } from './session.js';

// Endpoints that require partner-level (client_credentials) auth
const PARTNER_ENDPOINTS = [
  '/v1/companies',
  '/v1/countries',
];

// Endpoints that can use session token (newly created company)
const SESSION_TOKEN_ENDPOINTS = [
  '/v1/magic-link',
];

/**
 * Determine auth type for an endpoint
 * Returns: 'partner' | 'session' | 'customer'
 */
function getAuthType(path, useSessionToken) {
  // Check if endpoint supports session token and session is available
  if (useSessionToken && SESSION_TOKEN_ENDPOINTS.some(endpoint => path.startsWith(endpoint))) {
    return 'session';
  }
  
  // Partner endpoints
  if (PARTNER_ENDPOINTS.some(endpoint => path.startsWith(endpoint))) {
    return 'partner';
  }
  
  // Default to customer token
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
