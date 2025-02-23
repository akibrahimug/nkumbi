"use client";
import Link from "next/link";
import { ArrowLeft, Sun, Cloud, CloudRain, Thermometer } from "lucide-react";
import { useState, useEffect } from "react";

type WeatherData = {
  today: {
    icon: "sun" | "cloud" | "rain";
    temperature: number;
  };
  forecast: Array<{
    day: string;
    icon: "sun" | "cloud" | "rain";
    temperature: number;
  }>;
};

const iconMap = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    fetch("/api/weatherapi?cityName=Kampala&countryCode=UG")
      .then((res) => res.json())
      .then((data) => {
        // Check if the API returned "current" and "forecast" properties.
        // If so, transform it to match our WeatherData interface.
        if (data.current) {
          const transformed: WeatherData = {
            today: {
              icon: data.current.icon,
              temperature: data.current.temperature,
            },
            forecast: data.forecast.map((day: any) => ({
              day: day.day,
              icon: day.icon,
              // Use average of highTemp and lowTemp as the representative temperature.
              temperature: Math.round((day.highTemp + day.lowTemp) / 2),
            })),
          };
          setWeather(transformed);
        } else {
          // Otherwise, assume data is already in the correct shape (with a 'today' key)
          setWeather(data);
        }
        setLastRefreshed(new Date());
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setWeather(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        Loading weather data...
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        Error: No weather data available.
      </div>
    );
  }

  const TodayIcon = iconMap[weather.today.icon || "sun"];

  return (
    <Link
      href="/weather"
      className="block bg-white p-4 rounded-lg shadow transition-all duration-200 ease-in-out hover:shadow-md active:bg-gray-50"
    >
      <header className="flex items-center mb-4">
        <ArrowLeft className="mr-2" />
        <h2 className="text-lg font-semibold">Today's Weather</h2>
      </header>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <TodayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#FFA62B] mr-2" />
            <span className="text-2xl sm:text-3xl font-bold">
              {weather.today.temperature}°C
            </span>
          </div>
          <Thermometer className="w-5 h-5 sm:w-6 sm:h-6 text-[#2C5F2D]" />
        </div>
        <div className="space-y-2 mb-4">
          {weather.forecast.map((day) => {
            const Icon = iconMap[day.icon];
            return (
              <div
                key={day.day}
                className="flex items-center justify-between bg-gray-50 p-2 rounded"
              >
                <span className="text-sm sm:text-base">{day.day}</span>
                <div className="flex items-center">
                  <Icon className="w-4 h-4 mr-1" />
                  <span className="text-sm sm:text-base">
                    {day.temperature}°C
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
