export default async function handler(req, res) {
  const apiKey = process.env.TOMORROW_API_KEY;
  const { lat = "53.34", lon = "-6.26" } = req.query; // default Dublin

  try {
    const resp = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${apiKey}`
    );
    const data = await resp.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Tomorrow.io data" });
  }
}
