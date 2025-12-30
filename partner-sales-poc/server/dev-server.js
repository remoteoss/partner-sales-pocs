const express = require('express');
const dotenv = require('dotenv');
const { createServer: createViteServer } = require('vite');
const { setupRoutes } = require('./api/routes.js');

dotenv.config();

const startServer = async () => {
  const app = express();
  const port = 3001;

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
  });

  app.use(express.json());

  // Setup API routes
  setupRoutes(app);

  // Use Vite's middleware
  app.use(vite.middlewares);

  // Serve index.html (SPA fallback)
  app.use('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const template = await vite.transformIndexHtml(
        url,
        '<!DOCTYPE html><html><body><div id="app"></div></body></html>'
      );
      res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(port, () => {
    console.log(`🚀 Partner Sales POC running at http://localhost:${port}`);
  });
};

startServer();

