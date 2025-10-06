// api/tio-key.js
export default function handler(req, res) {
  // CORS so GitHub Pages can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const key = process.env.TOMORROW_IO_KEY; // set in Vercel → Settings → Environment Variables
  if (!key) {
    res.status(500).json({ error: 'Missing TOMORROW_IO_KEY env var' });
    return;
  }
  res.status(200).json({ key });
}
