const ENVIRONMENTS = {
  local: 'http://localhost:4000/api/eor',
  partners: 'https://gateway.partners.remote-sandbox.com',
  production: 'https://gateway.remote.com',
  sandbox: 'https://gateway.remote-sandbox.com',
  staging: 'https://gateway.niceremote.com',
};

function buildGatewayURL() {
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
async function fetchPartnerToken() {
  const { VITE_CLIENT_ID, VITE_CLIENT_SECRET } = process.env;

  if (!VITE_CLIENT_ID || !VITE_CLIENT_SECRET) {
    throw new Error('Missing VITE_CLIENT_ID or VITE_CLIENT_SECRET');
  }

  const gatewayUrl = buildGatewayURL();
  const encodedCredentials = Buffer.from(
    `${VITE_CLIENT_ID}:${VITE_CLIENT_SECRET}`
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
async function fetchCustomerToken() {
  const { VITE_CLIENT_ID, VITE_CLIENT_SECRET, VITE_REFRESH_TOKEN, VITE_REMOTE_GATEWAY } = process.env;

  if (!VITE_CLIENT_ID || (!VITE_CLIENT_SECRET && VITE_REMOTE_GATEWAY !== 'local') || !VITE_REFRESH_TOKEN) {
    throw new Error('Missing required credentials for customer token');
  }

  const gatewayUrl = buildGatewayURL();
  const encodedCredentials = Buffer.from(
    `${VITE_CLIENT_ID}:${VITE_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${gatewayUrl}/auth/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: VITE_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// Express route handlers
async function getPartnerToken(req, res) {
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

async function getCustomerToken(req, res) {
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

module.exports = { 
  getPartnerToken, 
  getCustomerToken, 
  fetchPartnerToken, 
  fetchCustomerToken,
  buildGatewayURL 
};

