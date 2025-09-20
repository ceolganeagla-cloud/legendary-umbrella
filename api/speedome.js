// /api/speedome
// Proxies YOUR Speedome-style JSON endpoint and NORMALIZES it.
// ENV needed in Vercel: SPEEDOME_URL
// Example env value: https://your-upstream.example.com/wind?lat={lat}&lon={lon}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (!isFinite(lat) || !isFinite(lon)) {
      return res.status(400).json({ error: "lat/lon required" });
    }

    const template = process.env.SPEEDOME_URL;
    if (!template) return res.status(500).json({ error: "SPEEDOME_URL missing" });

    const upstreamUrl = template.replace("{lat}", lat).replace("{lon}", lon);
    const r = await fetch(upstreamUrl);
    if (!r.ok) return res.status(r.status).json({ error: "Speedome upstream failed" });
    const j = await r.json();

    // If upstream already matches the normalized structure, pass through:
    if (j?.current && j?.hourly && j?.daily) {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
      return res.status(200).json(j);
    }

    // Otherwise adapt from common/custom fields. Adjust if your upstream differs.
    const normalized = {
      current: {
        tempC: j.current?.temp_c ?? j.current?.temperature ?? null,
        code: j.current?.code ?? 3,
        windMs: j.current?.wind_ms ?? (j.current?.wind_kph ? j.current.wind_kph / 3.6 : 0),
        precipMm: j.current?.precip_mm ?? 0,
        cloud: j.current?.cloud ?? 0,
        snowMm: j.current?.snow_mm ?? 0,
        sunrise: j.current?.sunrise ?? null,
        sunset:  j.current?.sunset ?? null
      },
      hourly: {
        time: j.hourly?.time ?? [],
        tempC: j.hourly?.temp_c ?? [],
        precipMm: j.hourly?.precip_mm ?? [],
        code: j.hourly?.code ?? []
      },
      daily: {
        time: j.daily?.time ?? [],
        tmaxC: j.daily?.tmax_c ?? [],
        tminC: j.daily?.tmin_c ?? [],
        precipMm: j.daily?.precip_mm ?? [],
        code: j.daily?.code ?? []
      }
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json(normalized);
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}

