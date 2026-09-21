import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ENVIRONMENTS = {
  local: 'http://localhost:4000/api/eor',
  partners: 'https://gateway.partners.remote-sandbox.com',
  production: 'https://gateway.remote.com',
  sandbox: 'https://gateway.remote-sandbox.com',
  staging: 'https://gateway.niceremote.com',
};

const SESSION_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../session.json'
);

/**
 * Read the refresh token written by company creation, if there is one.
 *
 * Read directly rather than importing from session.js, which already imports
 * buildGatewayURL from this module — going the other way would create a cycle.
 * Returns null when there is no session, so callers can fall back to .env.
 */
function readSessionRefreshToken() {
  try {
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    return session.refresh_token || null;
  } catch {
    return null;
  }
}

export function buildGatewayURL() {
  const env = process.env.VITE_REMOTE_GATEWAY || 'partners';
  return ENVIRONMENTS[env] || ENVIRONMENTS.partners;
}

// Cache for tokens
let partnerTokenCache = null;
let customerTokenCache = null;

/**
 * Fetch partner-level token (client credentials flow)
 * Used for company creation
 */
export async function fetchPartnerToken() {
  const { REMOTE_CLIENT_ID, REMOTE_CLIENT_SECRET } = process.env;

  if (!REMOTE_CLIENT_ID || !REMOTE_CLIENT_SECRET) {
    throw new Error('Missing REMOTE_CLIENT_ID or REMOTE_CLIENT_SECRET');
  }

  const gatewayUrl = buildGatewayURL();
  const encodedCredentials = Buffer.from(
    `${REMOTE_CLIENT_ID}:${REMOTE_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${gatewayUrl}/auth/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

/**
 * Fetch customer-level token (refresh token flow)
 * Used for employment creation and other customer operations
 */
export async function fetchCustomerToken() {
  const { REMOTE_CLIENT_ID, REMOTE_CLIENT_SECRET, REMOTE_REFRESH_TOKEN, VITE_REMOTE_GATEWAY } = process.env;

  // Prefer the refresh token minted by company creation. It belongs to a company
  // that definitely consented, whereas REMOTE_REFRESH_TOKEN is a manually pasted
  // value that is easy to get wrong and goes stale. Fall back to .env so an
  // already-consented company can still be targeted without creating one.
  const sessionRefreshToken = readSessionRefreshToken();
  // Treat the unedited template value as absent - otherwise the placeholder is
  // truthy, gets sent to the gateway, and returns a misleading
  // invalid_refresh_token instead of "create a company first".
  const envRefreshToken =
    REMOTE_REFRESH_TOKEN && !REMOTE_REFRESH_TOKEN.startsWith('your_') ? REMOTE_REFRESH_TOKEN : null;
  const refreshToken = sessionRefreshToken || envRefreshToken;
  const tokenSource = sessionRefreshToken ? 'server/session.json' : '.env REMOTE_REFRESH_TOKEN';

  if (!REMOTE_CLIENT_ID || (!REMOTE_CLIENT_SECRET && VITE_REMOTE_GATEWAY !== 'local')) {
    throw new Error('Missing REMOTE_CLIENT_ID or REMOTE_CLIENT_SECRET');
  }
  if (!refreshToken) {
    throw new Error(
      'No refresh token available. Create a company first (which mints one into ' +
        'server/session.json), or set REMOTE_REFRESH_TOKEN for an already-consented company.'
    );
  }

  const gatewayUrl = buildGatewayURL();
  const encodedCredentials = Buffer.from(
    `${REMOTE_CLIENT_ID}:${REMOTE_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${gatewayUrl}/auth/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Name the source, so an invalid_refresh_token points at the right file.
    throw new Error(`HTTP ${response.status} (refresh token from ${tokenSource}): ${errorText}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// Express route handlers
export async function getPartnerToken(req, res) {
  try {
    if (partnerTokenCache && partnerTokenCache.expiresAt > Date.now()) {
      return res.status(200).json({
        access_token: partnerTokenCache.accessToken,
        expires_in: Math.floor((partnerTokenCache.expiresAt - Date.now()) / 1000),
      });
    }

    const { accessToken, expiresIn } = await fetchPartnerToken();
    partnerTokenCache = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000 - 60000, // Expire 1 min early
    };

    return res.status(200).json({
      access_token: accessToken,
      expires_in: expiresIn,
    });
  } catch (error) {
    console.error('Error fetching partner token:', error);
    return res.status(500).json({ error: 'Failed to retrieve partner token' });
  }
}

export async function getCustomerToken(req, res) {
  try {
    if (customerTokenCache && customerTokenCache.expiresAt > Date.now()) {
      return res.status(200).json({
        access_token: customerTokenCache.accessToken,
        expires_in: Math.floor((customerTokenCache.expiresAt - Date.now()) / 1000),
      });
    }

    const { accessToken, expiresIn } = await fetchCustomerToken();
    customerTokenCache = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000 - 60000,
    };

    return res.status(200).json({
      access_token: accessToken,
      expires_in: expiresIn,
    });
  } catch (error) {
    console.error('Error fetching customer token:', error);
    return res.status(500).json({ error: 'Failed to retrieve customer token' });
  }
}
