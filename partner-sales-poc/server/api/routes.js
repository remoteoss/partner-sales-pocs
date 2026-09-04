import { getPartnerToken, getCustomerToken } from './get-token.js';
import { createProxyMiddleware } from './proxy.js';
import { getCounter, incrementCounter, resetCounter } from './counter.js';
import { getSession, saveSession, clearSession, getSessionToken } from './session.js';
import { getCompanyManagerToken, getEmployeeToken } from './jwt-auth.js';
import { createGpProxyMiddleware } from './gp-proxy.js';

export function setupRoutes(app) {
  // Token endpoints (EOR)
  app.get('/api/fetch-partner-token', getPartnerToken);
  app.get('/api/fetch-customer-token', getCustomerToken);

  // Token endpoints (GP — JWT-bearer assertion)
  app.get('/api/fetch-company-manager', getCompanyManagerToken);
  app.get('/api/fetch-employee-token/:employmentId', getEmployeeToken);

  // Session endpoints (for newly created company)
  app.get('/api/session', getSession);
  app.post('/api/session', saveSession);
  app.delete('/api/session', clearSession);
  app.get('/api/session/token', getSessionToken);

  // Counter endpoints
  app.get('/api/counter', getCounter);
  app.post('/api/counter/increment', incrementCounter);
  app.post('/api/counter/reset', resetCounter);

  // Proxy EOR API requests to Remote Gateway
  app.use('/api/v1', createProxyMiddleware());

  // Proxy GP SDK requests. The GP SDK calls same-origin /v1/* and /v2/*
  // (proxy.url = origin, no /api prefix), so these mount separately from the
  // EOR /api/v1 proxy above and never collide.
  app.use('/v1', createGpProxyMiddleware());
  app.use('/v2', createGpProxyMiddleware());
}
