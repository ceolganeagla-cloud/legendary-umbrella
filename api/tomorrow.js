export default async function handler(req, res) {
  const { lat, lon } = req.query;
  const key = process.env.TOMORROW_API_KEY; // stored securely in Vercel

  const url = `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&timesteps=1h&apikey=${key}`;
  const r = await fetch(url);
  const j = await r.json();

  // normalize -> same format as Open-Meteo
  const hourly = j.timelines?.hourly || [];
  const daily = j.timelines?.daily || [];
  const now = hourly[0] || {};

  res.status(200).json({
    current: {
      tempC: now.values?.temperature ?? null,
      windMs: now.values?.windSpeed ?? null,
      precipMm: now.values?.precipitationIntensity ?? null,
      cloud: now.values?.cloudCover ?? null,
      sunrise: daily[0]?.values?.sunriseTime ?? null,
      sunset: daily[0]?.values?.sunsetTime ?? null,
    },
    hourly: {
      time: hourly.map(h => h.time),
      tempC: hourly.map(h => h.values?.temperature ?? null),
      precipMm: hourly.map(h => h.values?.precipitationIntensity ?? 0),
      code: hourly.map(h => h.values?.weatherCode ?? 0),
    },
    daily: {
      time: daily.map(d => d.time),
      tmaxC: daily.map(d => d.values?.temperatureMax ?? null),
      tminC: daily.map(d => d.values?.temperatureMin ?? null),
      precipMm: daily.map(d => d.values?.precipitationIntensityAvg ?? 0),
      code: daily.map(d => d.values?.weatherCodeMax ?? 0),
    }
  });
}
