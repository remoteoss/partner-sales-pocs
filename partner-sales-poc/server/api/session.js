import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildGatewayURL } from './get-token.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.resolve(__dirname, '../session.json');

function readSession() {
  try {
    const data = fs.readFileSync(SESSION_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { company_id: null, user_id: null, refresh_token: null, country_code: null, created_at: null };
  }
}

function writeSession(session) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}

// GET /api/session - Get current session
export function getSession(req, res) {
  try {
    const session = readSession();
    res.status(200).json(session);
  } catch (err) {
    console.error('Error reading session:', err);
    res.status(500).json({ error: 'Failed to read session' });
  }
}

// POST /api/session - Save new session from company creation
export function saveSession(req, res) {
  try {
    const { company_id, user_id, refresh_token, country_code } = req.body;
    
    if (!company_id || !user_id || !refresh_token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = {
      company_id,
      user_id,
      refresh_token,
      country_code: country_code || null,
      created_at: new Date().toISOString(),
    };
    
    writeSession(session);
    console.log(`[Session] Saved session for company ${company_id} (${country_code})`);
    res.status(200).json(session);
  } catch (err) {
    console.error('Error saving session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
}

// DELETE /api/session - Clear session
export function clearSession(req, res) {
  try {
    const emptySession = { company_id: null, user_id: null, refresh_token: null, country_code: null, created_at: null };
    writeSession(emptySession);
    res.status(200).json(emptySession);
  } catch (err) {
    console.error('Error clearing session:', err);
    res.status(500).json({ error: 'Failed to clear session' });
  }
}

// Fetch access token using session's refresh token
export async function fetchSessionToken() {
  const session = readSession();
  
  if (!session.refresh_token) {
    throw new Error('No session refresh token available');
  }

  const { VITE_CLIENT_ID, VITE_CLIENT_SECRET } = process.env;
  
  if (!VITE_CLIENT_ID || !VITE_CLIENT_SECRET) {
    throw new Error('Missing client credentials');
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
      refresh_token: session.refresh_token,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// GET /api/session/token - Get access token from session's refresh token
export async function getSessionToken(req, res) {
  try {
    const { accessToken, expiresIn } = await fetchSessionToken();
    res.status(200).json({ access_token: accessToken, expires_in: expiresIn });
  } catch (err) {
    console.error('Error fetching session token:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch session token' });
  }
}

// Check if session has a valid refresh token
export function hasSessionToken() {
  const session = readSession();
  return !!session.refresh_token;
}

