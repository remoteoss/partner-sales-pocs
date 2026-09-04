// GP SDK proxy — routes same-origin /v1/* and /v2/* calls from the GP SDK to
// the Remote gateway, attaching the right token per route (getTokenType).
//
// This runs ALONGSIDE the EOR proxy (server/api/proxy.js, mounted at /api/v1).
// The GP SDK is configured with proxy.url = window.location.origin, so it calls
// /v1/... directly (no /api prefix) — no collision with the EOR proxy.
//
//   route                                   token
//   GET  /v1/countries                      client-credentials (partner)
//   GET  /v[12]/countries/:c/address_details client-credentials
//   GET  /v[12]/company-currencies          client-credentials
//   POST /v[12]/companies                   client-credentials
//   /v1/employee/*                          employee-assertion (x-rf-employment-id header)
//   everything else                         company-manager

import { fetchPartnerToken, buildGatewayURL } from './get-token.js';
import { fetchCompanyManagerToken, fetchEmployeeToken } from './jwt-auth.js';

function getTokenType(method, path) {
  const m = method.toUpperCase();
  const pathname = path.split('?')[0].toLowerCase();

  if (m === 'GET' && /^\/v[12]\/countries$/.test(pathname)) return 'client';
  if (m === 'GET' && /^\/v[12]\/countries\/[^/]+\/address_details$/.test(pathname)) return 'client';
  if (m === 'GET' && /^\/v[12]\/company-currencies$/.test(pathname)) return 'client';
  if (m === 'POST' && /^\/v[12]\/companies$/.test(pathname)) return 'client';
  if ((m === 'PUT' || m === 'PATCH') && /^\/v[12]\/companies\/[^/]+$/.test(pathname)) return 'client';

  // Employee self-onboarding endpoints need an employment-scoped assertion.
  if (/^\/v1\/employee\//.test(pathname)) return 'employee';

  return 'company-manager';
}

export function createGpProxyMiddleware() {
  return async (req, res) => {
    try {
      const gatewayUrl = buildGatewayURL();
      // GP calls hit /v1/... and /v2/... directly (no /api prefix to strip).
      const apiPath = req.originalUrl;
      const targetUrl = `${gatewayUrl}${apiPath}`;

      const tokenType = getTokenType(req.method, apiPath);

      let accessToken;
      if (tokenType === 'client') {
        ({ accessToken } = await fetchPartnerToken());
      } else if (tokenType === 'employee') {
        const employmentId = req.headers['x-rf-employment-id'];
        if (!employmentId) {
          return res
            .status(400)
            .json({ error: 'Missing x-rf-employment-id header for employee request' });
        }
        ({ accessToken } = await fetchEmployeeToken(employmentId));
      } else {
        ({ accessToken } = await fetchCompanyManagerToken());
      }

      console.log(`[GP Proxy] ${req.method} ${apiPath} (${tokenType})`);

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
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        res.status(response.status).json(data);
      } else {
        const text = await response.text();
        res.status(response.status).send(text);
      }
    } catch (error) {
      console.error('[GP Proxy] error:', error.message);
      res.status(500).json({ error: error.message || 'GP proxy request failed' });
    }
  };
}
