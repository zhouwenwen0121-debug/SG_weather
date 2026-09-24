import { getHazeData } from '../server/weatherService.js';

export default async function handler(req, res) {
  try {
    const forceFresh = req.query?.refresh === 'true';
    const data = await getHazeData(forceFresh);
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({
      error: 'Failed to retrieve official Singapore haze and PSI data',
      upstreamOk: false,
      timestamp: new Date().toISOString(),
    });
  }
}
