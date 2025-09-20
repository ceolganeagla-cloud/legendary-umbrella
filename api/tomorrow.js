
// /api/tomorrow
// Proxies Tomorrow.io Timelines v4 and NORMALIZES to your app's shape.
// ENV needed in Vercel: TOMORROW_API_KEY

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

    const apiKey = process.env.TOMORROW_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "TOMORROW_API_KEY missing" });

    const fields = [
      "temperature",
      "precipitationIntensity",
      "cloudCover",
      "windSpeed",
      "weatherCode",
      "snowIntensity",
      "sunriseTime",
      "sunsetTime",
      "temperatureMax",
      "temperatureMin"
    ].join(",");

    const url =
      `https://api.tomorrow.io/v4/timelines?location=${lat},${lon}` +
      `&fields=${fields}&timesteps=current,hourly,daily&units=metric&apikey=${encodeURIComponent(apiKey)}`;

    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: `Tomorrow.io ${r.status}` });
    const j = await r.json();

    const getT = (ts) => (j?.data?.timelines || []).find(t => t.timestep === ts)?.intervals || [];
    const curInt = getT("current")[0]?.values || {};
    const hr = getT("hourly");
    const dy = getT("daily");

    const normalized = {
      current: {
        tempC: curInt.temperature ?? null,
        code: curInt.weatherCode ?? 3,
        windMs: (curInt.windSpeed ?? 0) / 3.6, // kph -> m/s
        precipMm: curInt.precipitationIntensity ?? 0,
        cloud: curInt.cloudCover ?? 0,
        snowMm: curInt.snowIntensity ?? 0,
        sunrise: dy[0]?.values?.sunriseTime ?? null,
        sunset:  dy[0]?.values?.sunsetTime ?? null
      },
      hourly: {
        time: hr.map(i => i.startTime),
        tempC: hr.map(i => i.values.temperature),
        precipMm: hr.map(i => i.values.precipitationIntensity ?? 0),
        code: hr.map(i => i.values.weatherCode ?? 3)
      },
      daily: {
        time: dy.map(i => i.startTime),
        tmaxC: dy.map(i => i.values.temperatureMax),
        tminC: dy.map(i => i.values.temperatureMin),
        precipMm: dy.map(i => i.values.precipitationIntensity ?? 0),
        code: dy.map(i => i.values.weatherCode ?? 3)
      }
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json(normalized);
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
