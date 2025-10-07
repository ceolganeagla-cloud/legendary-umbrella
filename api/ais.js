// /api/ais.js
// Normalises many AIS formats to: [{ lat, lon, cog?, sog?, name?, mmsi? }, ...]
export default async function handler(req, res) {
  try {
    const upstream = process.env.AIS_PROXY_URL;
    if (!upstream) return res.status(500).json({ error: 'Missing AIS_PROXY_URL' });

    const r = await fetch(upstream, { cache: 'no-store' });
    if (!r.ok) return res.status(r.status).json({ error: `AIS ${r.status}` });

    const data = await r.json();
    let out = [];

    if (Array.isArray(data) && data.every(v => 'lat' in v && 'lon' in v)) {
      out = data;
    } else if (Array.isArray(data?.rows)) {
      out = data.rows.map(v => ({
        lat: +v.LAT || +v.lat, lon: +v.LON || +v.lon,
        cog: Number(v.COG ?? v.cog), sog: Number(v.SOG ?? v.sog),
        name: v.SHIPNAME || v.name, mmsi: v.MMSI || v.mmsi
      }));
    } else if (Array.isArray(data?.features)) {
      out = data.features.map(f => {
        const c = f.geometry?.coordinates || [f.lon, f.lat];
        const p = f.properties || {};
        return {
          lon: +c[0], lat: +c[1],
          cog: Number(p.cog ?? p.heading), sog: Number(p.sog ?? p.speed),
          name: p.name || p.callsign, mmsi: p.mmsi
        };
      });
    } else if (Array.isArray(data?.data)) {
      out = data.data.map(v => ({
        lat: +v.lat, lon: +v.lon,
        sog: Number(v.sog), cog: Number(v.cog),
        name: v.name, mmsi: v.mmsi
      }));
    }

    out = (out || []).filter(v => Number.isFinite(v.lat) && Number.isFinite(v.lon));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
