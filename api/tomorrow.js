let cache = { data: null, timestamp: 0 };

export default async function handler(req, res) {
  const apiKey = process.env.TOMORROW_API_KEY;
  const { lat = "53.34", lon = "-6.26" } = req.query;

  const now = Date.now();
  if (cache.data && now - cache.timestamp < 5 * 60 * 1000) {
    return res.status(200).json(cache.data);
  }

  try {
    const resp = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${apiKey}`
    );
    const data = await resp.json();

    cache = { data, timestamp: now };
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Tomorrow.io data" });
  }
}
