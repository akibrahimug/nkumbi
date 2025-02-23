"use client";
import Link from "next/link";
import { ArrowLeft, Sun, Cloud, CloudRain, Wind, Droplets } from "lucide-react";
import { useState, useEffect } from "react";
import { WeatherSkeleton } from "../components/skeletons/WeatherSkeleton";

type WeatherData = {
  current: {
    icon: "sun" | "cloud" | "rain";
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    day: string;
    icon: "sun" | "cloud" | "rain";
    highTemp: number;
    lowTemp: number;
    precipitation: number;
  }>;
  error?: string;
};

const iconMap = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
};

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weatherapi?cityName=Kampala&countryCode=UG")
      .then((res) => res.json())
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setWeather(null);
        setLoading(false);
      });
  }, []);

  const CurrentIcon = iconMap[weather?.current.icon || "sun"];

  return loading ? (
    <WeatherSkeleton />
  ) : (
    <div className="min-h-screen bg-[#F4F1DE] text-[#5E503F]">
      <header className="bg-[#2C5F2D] text-white p-4 flex items-center">
        <Link href="/" className="mr-4">
          <ArrowLeft />
        </Link>
        <h1 className="text-2xl font-bold">Weather Forecast</h1>
      </header>
      <main className="p-4 space-y-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current Weather</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CurrentIcon className="w-16 h-16 text-[#FFA62B] mr-4" />
              <div>
                <p className="text-4xl font-bold">
                  {weather.current.temperature}°C
                </p>
                <p className="text-lg">
                  {weather.current.icon === "sun"
                    ? "Sunny"
                    : weather.current.icon === "cloud"
                    ? "Cloudy"
                    : "Rainy"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end">
                <Droplets className="w-5 h-5 mr-1" />
                Humidity: {weather.current.humidity}%
              </p>
              <p className="flex items-center justify-end mt-2">
                <Wind className="w-5 h-5 mr-1" />
                Wind: {weather.current.windSpeed} km/h
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">5-Day Forecast</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {weather.forecast.map((day) => {
              const Icon = iconMap[day.icon];
              return (
                <div
                  key={day.day}
                  className="text-center p-4 bg-gray-50 rounded-lg"
                >
                  <p className="font-semibold">{day.day}</p>
                  <Icon className="w-10 h-10 mx-auto my-2 text-[#FFA62B]" />
                  <p className="font-bold">
                    {day.highTemp}°C / {day.lowTemp}°C
                  </p>
                  <p className="text-sm">Precipitation: {day.precipitation}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
