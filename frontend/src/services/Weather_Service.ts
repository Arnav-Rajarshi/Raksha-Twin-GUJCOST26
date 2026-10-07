import type { WeatherState } from "@/models/dashboard";
import { apiFetch } from "./apiClient";

export async function getWeather(): Promise<WeatherState> {
  return apiFetch<WeatherState>("/api/openmeteo/current_weather_data");
}