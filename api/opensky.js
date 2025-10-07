// /api/opensky.js
// Proxies OpenSky bbox planes. Use OPEN_SKY_USER / OPEN_SKY_PASS (recommended)
export default async function handler(req, res) {
  try {
    const { n, s, e, w } = req.query;
    if ([n, s, e, w].some(v => v === undefined))
      return res.status(400).json({ error: 'Missing bbox n,s,e,w' });

    const user = process.env.OPEN_SKY_USER || '';
    const pass = process.env.OPEN_SKY_PASS || '';
    const url  = `https://opensky-network.org/api/states/all?lamin=${s}&lomin=${w}&lamax=${n}&lomax=${e}`;

    const headers = user ? { Authorization: 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64') } : {};
    const r = await fetch(url, { headers });

    if (!r.ok) return res.status(r.status).json({ error: `OpenSky ${r.status}` });
    const j = await r.json();

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(j); // { time, states:[...] }
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
