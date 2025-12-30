const { getPartnerToken, getCustomerToken } = require('./get-token.js');
const { createProxyMiddleware } = require('./proxy.js');

function setupRoutes(app) {
  // Token endpoints
  app.get('/api/fetch-partner-token', getPartnerToken);
  app.get('/api/fetch-customer-token', getCustomerToken);
  
  // Proxy API requests to Remote Gateway
  app.use('/api/v1', createProxyMiddleware());
}

module.exports = { setupRoutes };

