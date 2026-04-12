import { WeatherData } from "@/types";

const cache = new Map<string, { data: WeatherData; fetchedAt: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function getWeather(
  lat: number,
  lng: number
): Promise<WeatherData | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cache.get(key);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
    );

    if (!res.ok) return null;

    const json = await res.json();
    const data: WeatherData = {
      temp: Math.round(json.main.temp),
      feelsLike: Math.round(json.main.feels_like),
      description: json.weather[0].description,
      icon: json.weather[0].icon,
      humidity: json.main.humidity,
      windSpeed: Math.round(json.wind.speed),
    };

    cache.set(key, { data, fetchedAt: Date.now() });
    return data;
  } catch {
    return null;
  }
}
