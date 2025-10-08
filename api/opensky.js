export default async function handler(req, res) {
  const { n, s, e, w } = req.query;
  const url = `https://opensky-network.org/api/states/all?lamin=${s}&lamax=${n}&lomin=${w}&lomax=${e}`;
  try {
    const r = await fetch(url, { headers: { 'cache-control': 'no-store' }});
    if (!r.ok) return res.status(r.status).json({ error: 'OpenSky error' });
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
} 
