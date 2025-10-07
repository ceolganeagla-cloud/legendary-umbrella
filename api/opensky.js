// /api/opensky.js
export const config = { runtime: 'edge' };

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const { searchParams } = new URL(req.url);
    const n = searchParams.get('n');
    const s = searchParams.get('s');
    const e = searchParams.get('e');
    const w = searchParams.get('w');

    if (![n, s, e, w].every(Boolean)) {
      return json({ error: 'Missing bbox params n,s,e,w' }, 400);
    }

    const base = 'https://opensky-network.org/api/states/all';
    const url = `${base}?lamin=${s}&lomin=${w}&lamax=${n}&lomax=${e}`;

    const headers = {};
    const user = process.env.OPEN_SKY_USER || '';
    const pass = process.env.OPEN_SKY_PASS || '';
    if (user && pass) {
      headers['Authorization'] = 'Basic ' + btoa(`${user}:${pass}`);
    }

    const resp = await fetch(url, { headers, cache: 'no-store' });
    if (!resp.ok) {
      return json({ error: `OpenSky ${resp.status}` }, resp.status);
    }

    const data = await resp.json();
    return json(data, 200);
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
