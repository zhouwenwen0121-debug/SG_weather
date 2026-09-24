import { getHealthData } from '../server/weatherService.js';

export default async function handler(req, res) {
  try {
    const data = await getHealthData();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(data.upstreamOk ? 200 : 503).json(data);
  } catch (err) {
    return res.status(503).json({
      keyConfigured: Boolean(process.env.DATA_GOV_SG_API_KEY || process.env.NEA_API_KEY),
      upstreamOk: false,
      upstreamStatus: 503,
      error: 'Health check failed to communicate with upstream data.gov.sg services',
      timestamp: new Date().toISOString(),
    });
  }
}
