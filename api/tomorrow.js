export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { lat, lon, units = "metric" } = req.query || {};
    if (!lat || !lon) return res.status(400).json({ error: "lat & lon required" });

    const key = process.env.TOMORROW_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing TOMORROW_API_KEY" });

    const url = new URL("https://api.tomorrow.io/v4/weather/realtime");
    url.searchParams.set("location", `${lat},${lon}`);
    url.searchParams.set("units", units);
    url.searchParams.set("apikey", key);

    const r = await fetch(url.toString(), { cache: "no-store" });
    const data = await r.json();
    return res.status(r.ok ? 200 : r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "proxy_failed", detail: String(err) });
  }
}
