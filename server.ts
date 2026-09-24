import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getWeatherData, getRainData, getHazeData, getHealthData } from './server/weatherService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // 1. Weather API Route
  app.get('/api/weather', async (req, res) => {
    try {
      const forceFresh = req.query.refresh === 'true';
      const data = await getWeatherData(forceFresh);
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.json(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      res.status(502).json({
        error: 'Failed to retrieve official Singapore weather observations',
        details: errorMsg,
        upstreamOk: false,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 2. Rain API Route
  app.get('/api/rain', async (req, res) => {
    try {
      const forceFresh = req.query.refresh === 'true';
      const data = await getRainData(forceFresh);
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.json(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      res.status(502).json({
        error: 'Failed to retrieve official Singapore rainfall data',
        details: errorMsg,
        upstreamOk: false,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 3. Haze / PSI API Route
  app.get('/api/haze', async (req, res) => {
    try {
      const forceFresh = req.query.refresh === 'true';
      const data = await getHazeData(forceFresh);
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.json(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      res.status(502).json({
        error: 'Failed to retrieve official Singapore haze and PSI data',
        details: errorMsg,
        upstreamOk: false,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 4. Health Check API Route with on-demand diagnostics
  app.get('/api/health', async (req, res) => {
    try {
      const forceFresh = req.query.refresh === 'true' || req.query.fresh === 'true';
      const data = await getHealthData(forceFresh);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(data.upstreamOk ? 200 : 503).json(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      res.status(503).json({
        status: 'unhealthy',
        keyConfigured: Boolean(process.env.DATA_GOV_SG_API_KEY || process.env.NEA_API_KEY),
        upstreamOk: false,
        upstreamStatus: 503,
        error: 'Health check failed communicating with official weather sources',
        details: errorMsg,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Standard healthz endpoint for load balancers / cloud platforms
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Singapore Weather Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
