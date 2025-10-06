// api/tio-key.js
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.TOMORROW_IO_KEY;
  if (!key) return res.status(500).json({ error: 'Missing TOMORROW_IO_KEY env var' });

  res.status(200).json({ key });
}
