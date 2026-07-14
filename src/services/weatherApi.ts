import axios from 'axios';
import type { GeocodeResult, WeatherData, DailyForecast, HourlyForecast } from '../types/weather';

const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

export const fetchCoordinates = async (city: string): Promise<GeocodeResult> => {
  const response = await axios.get(GEO_API_URL, {
    params: {
      name: city,
      count: 1,
      language: 'en',
      format: 'json',
    },
  });

  if (!response.data.results || response.data.results.length === 0) {
    throw new Error('City not found');
  }

  return response.data.results[0];
};

export const fetchWeatherByCoords = async (
  lat: number,
  lon: number,
  locationName: string,
  country: string
): Promise<WeatherData> => {
  const response = await axios.get(WEATHER_API_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,weather_code,is_day',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset',
      timezone: 'auto',
      forecast_days: 7,
      forecast_hours: 24,
    },
  });

  const data = response.data;

  // Process daily forecast
  const forecast: DailyForecast[] = [];
  for (let i = 0; i < 7; i++) {
    if (data.daily.time[i]) {
      forecast.push({
        date: data.daily.time[i],
        maxTemp: data.daily.temperature_2m_max[i],
        minTemp: data.daily.temperature_2m_min[i],
        conditionCode: data.daily.weather_code[i],
        precipitationProbability: data.daily.precipitation_probability_max[i] || 0,
        windSpeed: data.daily.wind_speed_10m_max[i] || 0,
        uvIndex: data.daily.uv_index_max[i] || 0,
        sunrise: data.daily.sunrise[i],
        sunset: data.daily.sunset[i],
      });
    }
  }

  // Process hourly forecast
  const hourly: HourlyForecast[] = [];
  for (let i = 0; i < 24; i++) {
    if (data.hourly.time[i]) {
      hourly.push({
        time: data.hourly.time[i],
        temp: data.hourly.temperature_2m[i],
        conditionCode: data.hourly.weather_code[i],
        isDay: data.hourly.is_day[i],
      });
    }
  }

  return {
    location: {
      name: locationName,
      country: country,
    },
    current: {
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      conditionCode: data.current.weather_code,
      isDay: data.current.is_day,
      high: data.daily.temperature_2m_max[0],
      low: data.daily.temperature_2m_min[0],
    },
    hourly,
    forecast,
  };
};
