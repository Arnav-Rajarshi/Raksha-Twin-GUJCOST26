import type { WeatherState } from "@/models/dashboard";

const API_URL =
  import.meta.env["VITE_API_BASE_URL"] || "http://127.0.0.1:8000";

export async function getWeather(): Promise<WeatherState> {
  const response = await fetch(
    `${API_URL}/api/openmeteo/current_weather_data`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather data");
  }

  return response.json();
}