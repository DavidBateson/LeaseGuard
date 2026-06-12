import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { reportId } = req.query;
  if (!reportId) {
    return res.status(400).json({ error: 'Report ID required' });
  }
  try {
    const report = await redis.get(`report:${reportId}`);
    if (!report) {
      return res.status(404).json({ error: 'Report not found or expired' });
    }
    return res.status(200).json({ report });
  } catch (error) {
    return res.status(500).json({ error: 'Could not retrieve report' });
  }
}
