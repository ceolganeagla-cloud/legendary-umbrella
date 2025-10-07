// /api/ais.js
export const config = { runtime: 'edge' };

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
};

// Set this in Vercel → Project → Settings → Environment Variables
// e.g. https://your-ais-proxy.example.com/feed.json
const UPSTREAM = process.env.AIS_PROXY_URL || '';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    if (!UPSTREAM) {
      // No upstream configured; return empty list but not an error
      return json([]);
    }

    const r = await fetch(UPSTREAM, { cache: 'no-store' });
    if (!r.ok) return json({ error: `AIS upstream ${r.status}` }, r.status);

    const raw = await r.json();
    const norm = normalize(raw);
    return json(norm);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }

  function json(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
    });
  }
}

/** Normalize a few common AIS shapes to:
 *   { lat:number, lon:number, sog?:number, cog?:number, name?:string, mmsi?:string }
 */
function normalize(input) {
  if (!input) return [];

  // If it's already an array of objects with lat/lon
  if (Array.isArray(input) && input.length && ('lat' in input[0]) && ('lon' in input[0])) {
    return input.map(v => ({
      lat: +v.lat, lon: +v.lon,
      sog: num(v.sog ?? v.speed ?? v.sog_kn ?? v.SOG),
      cog: num(v.cog ?? v.course ?? v.COG),
      name: str(v.name ?? v.vessel_name ?? v.shipname),
      mmsi: str(v.mmsi ?? v.MMSI),
    })).filter(ok);
  }

  // If wrapped { data: [...] }
  if (Array.isArray(input?.data)) {
    return normalize(input.data);
  }

  // If it's a dict keyed by MMSI
  if (typeof input === 'object' && !Array.isArray(input)) {
    return Object.values(input).map(v => ({
      lat: num(v.lat ?? v.latitude), lon: num(v.lon ?? v.longitude),
      sog: num(v.sog ?? v.speed), cog: num(v.cog ?? v.course),
      name: str(v.name), mmsi: str(v.mmsi),
    })).filter(ok);
  }

  return [];
  function num(x){ const n=Number(x); return Number.isFinite(n)? n : undefined; }
  function str(x){ return (x==null)? undefined : String(x); }
  function ok(v){ return Number.isFinite(v.lat) && Number.isFinite(v.lon); }
}
