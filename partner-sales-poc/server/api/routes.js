import { getPartnerToken, getCustomerToken } from './get-token.js';
import { createProxyMiddleware } from './proxy.js';
import { getCounter, incrementCounter, resetCounter } from './counter.js';
import { getSession, saveSession, clearSession, getSessionToken } from './session.js';

export function setupRoutes(app) {
  // Token endpoints
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
  
  // Proxy API requests to Remote Gateway
  app.use('/api/v1', createProxyMiddleware());
}
