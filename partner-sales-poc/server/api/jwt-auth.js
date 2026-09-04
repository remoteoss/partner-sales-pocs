// GP (Global Payroll) auth — JWT-bearer assertion minting.
//
// The GP SDK flows (PayrollAdminOnboardingFlow / PayrollEmployeeOnboardingFlow)
// authenticate via the OAuth2 jwt-bearer grant, NOT the client-credentials /
// refresh-token flow the EOR path uses. Two subjects, same client secret:
//   admin    → urn:remote-api:company-manager:user:<VITE_USER_ID>
//   employee → urn:remote-api:employee:employment:<employmentId>
//
// We sign HS256 with node:crypto so no extra npm dependency is needed. The FE
// never holds these tokens — the GP proxy attaches them server-side.
//
//   FE (authType='none')  ──/v1/*──►  gp-proxy  ──getTokenType──►  this module
//                                                                   └─► gateway /auth/oauth2/token

import crypto from 'node:crypto';
import { buildGatewayURL } from './get-token.js';

const SCOPES = 'all:write';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

// HS256-signed JWT. Payload shape verified against the sandbox gateway.
function signJwt(payload, secret) {
  const encHeader = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encPayload = b64url(JSON.stringify(payload));
  const signingInput = `${encHeader}.${encPayload}`;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');
  return `${signingInput}.${sig}`;
}

function buildAssertion(sub) {
  const { VITE_CLIENT_ID, VITE_CLIENT_SECRET } = process.env;
  const gatewayUrl = buildGatewayURL();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: VITE_CLIENT_ID,
    sub,
    aud: `${gatewayUrl}/auth`,
    exp: now + 5 * 60,
    scope: SCOPES,
    iat: now,
  };
  return signJwt(payload, VITE_CLIENT_SECRET);
}

async function exchangeAssertion(assertion) {
  const { VITE_CLIENT_ID, VITE_CLIENT_SECRET } = process.env;
  const gatewayUrl = buildGatewayURL();
  const basic = Buffer.from(
    `${VITE_CLIENT_ID}:${VITE_CLIENT_SECRET}`,
  ).toString('base64');

  const response = await fetch(`${gatewayUrl}/auth/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function fetchCompanyManagerToken() {
  const { VITE_CLIENT_ID, VITE_CLIENT_SECRET, VITE_USER_ID } = process.env;
  if (!VITE_CLIENT_ID || !VITE_CLIENT_SECRET || !VITE_USER_ID) {
    throw new Error(
      'Missing VITE_CLIENT_ID, VITE_CLIENT_SECRET, or VITE_USER_ID for company-manager token',
    );
  }
  return exchangeAssertion(
    buildAssertion(`urn:remote-api:company-manager:user:${VITE_USER_ID}`),
  );
}

export async function fetchEmployeeToken(employmentId) {
  const { VITE_CLIENT_ID, VITE_CLIENT_SECRET } = process.env;
  if (!VITE_CLIENT_ID || !VITE_CLIENT_SECRET || !employmentId) {
    throw new Error('Missing credentials or employmentId for employee token');
  }
  return exchangeAssertion(
    buildAssertion(`urn:remote-api:employee:employment:${employmentId}`),
  );
}

// Route handlers. Gated off in production — demo-only impersonation.
export async function getCompanyManagerToken(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  try {
    const { accessToken, expiresIn } = await fetchCompanyManagerToken();
    return res.status(200).json({ access_token: accessToken, expires_in: expiresIn });
  } catch (error) {
    console.error('Error fetching company-manager token:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve company-manager token' });
  }
}

export async function getEmployeeToken(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  try {
    const { accessToken, expiresIn } = await fetchEmployeeToken(
      req.params.employmentId,
    );
    return res.status(200).json({ access_token: accessToken, expires_in: expiresIn });
  } catch (error) {
    console.error('Error fetching employee token:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
