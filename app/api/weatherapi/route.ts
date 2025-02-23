// app/api/weatherapi/route.ts

import { NextRequest, NextResponse } from "next/server";

// Utility: Convert Kelvin to Celsius (rounded)
function kelvinToCelsius(k: number): number {
  return Math.round(k - 273.15);
}

// Utility: Map OpenWeatherMap icon codes to simple descriptive names
const iconMapping: Record<string, string> = {
  "01d": "sun",
  "01n": "sun",
  "02d": "partly_cloudy",
  "02n": "partly_cloudy",
  "03d": "cloud",
  "03n": "cloud",
  "04d": "cloud",
  "04n": "cloud",
  "09d": "rain",
  "09n": "rain",
  "10d": "rain",
  "10n": "rain",
  "11d": "rain",
  "11n": "rain",
  "13d": "snow",
  "13n": "snow",
  "50d": "mist",
  "50n": "mist",
};

function transformWeatherData(apiData: any) {
  // Get icon from first weather item, if available
  const weatherItem = apiData.weather && apiData.weather[0];
  const currentIconCode = weatherItem ? weatherItem.icon : "01d";
  const currentIcon = iconMapping[currentIconCode] || "sun";

  // Create a dummy forecast based on current data (since the 'weather' endpoint doesn't include forecast data)
  // Here we use main.temp_max and main.temp_min for today's high/low and duplicate it for tomorrow
  const forecast = [
    {
      day: "Today",
      icon: currentIcon,
      highTemp: kelvinToCelsius(apiData.main.temp_max),
      lowTemp: kelvinToCelsius(apiData.main.temp_min),
      precipitation: 0, // The current endpoint doesn't provide precipitation details
    },
  ];

  return {
    current: {
      icon: currentIcon,
      temperature: kelvinToCelsius(apiData.main.temp),
      humidity: apiData.main.humidity,
      windSpeed: apiData.wind.speed, // Note: wind speed is in m/s by default
    },
    forecast,
  };
}

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters: cityName and countryCode, with defaults if not provided
    const { searchParams } = new URL(req.url);
    const cityName = searchParams.get("cityName") || "Kampala";
    const countryCode = searchParams.get("countryCode") || "UG";

    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      throw new Error("OPENWEATHERMAP_API_KEY is not configured");
    }

    // 1. Fetch geographic coordinates using the Geocoding API
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName},${countryCode}&appid=${apiKey}`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch geo data" },
        { status: 500 }
      );
    }
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }
    const { lat, lon } = geoData[0];

    // 2. Fetch current weather data using the Weather endpoint
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch weather data" },
        { status: 500 }
      );
    }
    const weatherData = await weatherRes.json();

    // 3. Transform the OpenWeatherMap data to match the expected structure
    const transformedData = transformWeatherData(weatherData);

    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error("Error in weather API route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
