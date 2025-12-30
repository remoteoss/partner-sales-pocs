const { fetchCustomerToken, buildGatewayURL } = require('./get-token.js');

/**
 * Express middleware to proxy requests to the Remote Gateway
 */
function createProxyMiddleware() {
  return async (req, res) => {
    try {
      const gatewayUrl = buildGatewayURL();
      const targetUrl = `${gatewayUrl}${req.originalUrl.replace('/api', '')}`;

      const { accessToken } = await fetchCustomerToken();

      const requestConfig = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          host: new URL(gatewayUrl).host,
        },
      };

      if (req.method !== 'GET' && req.body) {
        requestConfig.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, requestConfig);
      const data = await response.json();

      res.status(response.status).json(data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(error.response?.status || 500).json({
        error: error.message || 'Proxy request failed',
      });
    }
  };
}

module.exports = { createProxyMiddleware };

