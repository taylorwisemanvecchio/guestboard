"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temperature: number;
  condition: string;
  high: number;
  low: number;
}

export function WeatherWidget({ propertyId }: { propertyId: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/properties/${propertyId}/weather`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWeather(data))
      .catch(() => setWeather(null))
      .finally(() => setLoading(false));
  }, [propertyId]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Weather
      </h3>
      {loading ? (
        <div className="mt-2 h-6 w-24 animate-pulse rounded bg-gray-100" />
      ) : weather ? (
        <>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {weather.temperature}&deg;F &mdash; {weather.condition}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            H: {weather.high}&deg; / L: {weather.low}&deg;
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-gray-400">Unavailable</p>
      )}
    </div>
  );
}
