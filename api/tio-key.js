// /api/tio-key.js
export const config = { runtime: 'edge' };

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const key = process.env.TOMORROW_IO_KEY || '';
  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing TOMORROW_IO_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json', ...CORS },
    });
  }
  return new Response(JSON.stringify({ key }), {
    headers: { 'content-type': 'application/json', ...CORS },
  });
}
