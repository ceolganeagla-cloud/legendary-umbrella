// api/opensky.js
// Query: ?n=<north>&s=<south>&e=<east>&w=<west>
// Example: /api/opensky?n=55&s=51&e=-4&w=-9
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { n, s, e, w } = req.query || {};
  if ([n, s, e, w].some(v => v === undefined)) {
    return res.status(400).json({ error: 'Missing bbox: n,s,e,w required' });
  }

  const url = `https://opensky-network.org/api/states/all?lamin=${encodeURIComponent(s)}&lomin=${encodeURIComponent(w)}&lamax=${encodeURIComponent(n)}&lomax=${encodeURIComponent(e)}`;

  try {
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`OpenSky ${r.status} ${r.statusText}`);
    const data = await r.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || 'OpenSky error' });
  }
}
