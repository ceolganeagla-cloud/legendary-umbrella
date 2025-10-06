// api/ais.js
// Requires Vercel env var: AIS_PROXY_URL=https://<your-ais-feed>
// The feed should return JSON. This handler normalizes a few shapes:
// - Array of objects with lat/lon keys (lat, latitude / lon, longitude) + optional cog/sog/name/mmsi
// - AISHub-like objects: LAT, LON, COG, SOG, SHIPNAME, MMSI
// - GeoJSON FeatureCollection (Point geometries with properties)
function normNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function firstKey(obj, candidates) {
  for (const k of candidates) {
    if (obj[k] != null) return obj[k];
    const lower = Object.keys(obj).find(kk => kk.toLowerCase() === k.toLowerCase());
    if (lower) return obj[lower];
  }
  return undefined;
}
function normalizeArray(arr) {
  const out = [];
  for (const it of arr) {
    if (!it || typeof it !== 'object') continue;
    const lat = normNum(firstKey(it, ['lat','latitude','LAT']));
    const lon = normNum(firstKey(it, ['lon','lng','longitude','LON','LNG']));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const cog  = normNum(firstKey(it, ['cog','COG','heading','hdg']));
    const sog  = normNum(firstKey(it, ['sog','SOG','speed','spd','speedOverGround']));
    const name = firstKey(it, ['name','SHIPNAME','shipname','vessel','callsign']);
    const mmsi = String(firstKey(it, ['mmsi','MMSI'] || '') || '').trim() || undefined;
    out.push({ lat, lon, cog, sog, name, mmsi });
  }
  return out;
}
function normalizeGeoJSON(fc) {
  const out = [];
  const feats = Array.isArray(fc?.features) ? fc.features : [];
  for (const f of feats) {
    if (f?.geometry?.type !== 'Point') continue;
    const [lon, lat] = f.geometry.coordinates || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const p = f.properties || {};
    const cog  = normNum(firstKey(p, ['cog','COG','heading','hdg']));
    const sog  = normNum(firstKey(p, ['sog','SOG','speed','spd']));
    const name = firstKey(p, ['name','SHIPNAME','shipname','vessel','callsign']);
    const mmsi = String(firstKey(p, ['mmsi','MMSI'] || '') || '').trim() || undefined;
    out.push({ lat, lon, cog, sog, name, mmsi });
  }
  return out;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = process.env.AIS_PROXY_URL;
  if (!url) {
    return res.status(501).json({ error: 'AIS_PROXY_URL env var not set on Vercel' });
  }

  try {
    const upstream = await fetch(url, { headers: { accept: 'application/json, text/plain' } });
    if (!upstream.ok) throw new Error(`AIS ${upstream.status} ${upstream.statusText}`);

    // Try JSON first; if text, retry parsing
    let data;
    const text = await upstream.text();
    try { data = JSON.parse(text); } catch { data = text; }

    let normalized = [];
    if (Array.isArray(data)) {
      normalized = normalizeArray(data);
    } else if (data && typeof data === 'object' && Array.isArray(data.features)) {
      normalized = normalizeGeoJSON(data);
    } else {
      // Some feeds nest the array under a property
      const vals = Object.values(data || {}).find(v => Array.isArray(v));
      if (Array.isArray(vals)) normalized = normalizeArray(vals);
    }

    res.status(200).json(normalized);
  } catch (err) {
    res.status(502).json({ error: err.message || 'AIS fetch error' });
  }
}
