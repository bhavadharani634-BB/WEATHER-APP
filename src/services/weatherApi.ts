import axios from 'axios';
import type { GeocodeResult, WeatherData, DailyForecast, HourlyForecast, MonthlyForecastDay } from '../types/weather';

const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const ENSEMBLE_API_URL = 'https://ensemble-api.open-meteo.com/v1/ensemble';

/**
 * Live search city suggestions with rich geo-details (admin1, country, lat/lon)
 */
export const searchCities = async (query: string, count = 6): Promise<GeocodeResult[]> => {
  if (!query || query.trim().length < 2) return [];

  try {
    const response = await axios.get(GEO_API_URL, {
      params: {
        name: query.trim(),
        count,
        language: 'en',
        format: 'json',
      },
    });

    return response.data.results || [];
  } catch {
    return [];
  }
};

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
  country: string,
  admin1?: string
): Promise<WeatherData> => {
  // Fetch high-resolution forecast and 30-day monthly ensemble in parallel
  const [standardResult, ensembleResult] = await Promise.allSettled([
    axios.get(WEATHER_API_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
        hourly: 'temperature_2m,weather_code,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset',
        timezone: 'auto',
        forecast_days: 14,
      },
    }),
    axios.get(ENSEMBLE_API_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max',
        timezone: 'auto',
        forecast_days: 30,
      },
    }),
  ]);

  if (standardResult.status === 'rejected') {
    throw new Error('Failed to fetch primary weather data.');
  }

  const data = standardResult.value.data;

  // Process daily forecast (up to 14 days)
  const forecast: DailyForecast[] = [];
  const daysCount = data.daily?.time?.length || 0;
  for (let i = 0; i < daysCount; i++) {
    if (data.daily.time[i]) {
      forecast.push({
        date: data.daily.time[i],
        maxTemp: data.daily.temperature_2m_max[i],
        minTemp: data.daily.temperature_2m_min[i],
        conditionCode: data.daily.weather_code[i],
        precipitationProbability: data.daily.precipitation_probability_max?.[i] ?? 0,
        windSpeed: data.daily.wind_speed_10m_max?.[i] ?? 0,
        uvIndex: data.daily.uv_index_max?.[i] ?? 0,
        sunrise: data.daily.sunrise?.[i] ?? '',
        sunset: data.daily.sunset?.[i] ?? '',
      });
    }
  }

  // Process hourly forecast (all available hours)
  const hourly: HourlyForecast[] = [];
  const hourlyCount = data.hourly?.time?.length || 0;
  for (let i = 0; i < hourlyCount; i++) {
    if (data.hourly?.time?.[i]) {
      hourly.push({
        time: data.hourly.time[i],
        temp: data.hourly.temperature_2m[i],
        conditionCode: data.hourly.weather_code[i],
        isDay: data.hourly.is_day[i],
      });
    }
  }

  // Process 30-Day Monthly Forecast from ensemble
  const monthlyForecast: MonthlyForecastDay[] = [];
  if (ensembleResult.status === 'fulfilled' && ensembleResult.value.data?.daily?.time) {
    const ensembleDaily = ensembleResult.value.data.daily;
    for (let i = 0; i < ensembleDaily.time.length; i++) {
      monthlyForecast.push({
        date: ensembleDaily.time[i],
        maxTemp: ensembleDaily.temperature_2m_max[i],
        minTemp: ensembleDaily.temperature_2m_min[i],
        conditionCode: ensembleDaily.weather_code[i],
        precipitationSum: ensembleDaily.precipitation_sum?.[i] ?? 0,
        windSpeed: ensembleDaily.wind_speed_10m_max?.[i] ?? 0,
      });
    }
  } else {
    // Fallback: Map available daily forecast if ensemble is unavailable
    forecast.forEach((day) => {
      monthlyForecast.push({
        date: day.date,
        maxTemp: day.maxTemp,
        minTemp: day.minTemp,
        conditionCode: day.conditionCode,
        precipitationSum: day.precipitationProbability > 0 ? (day.precipitationProbability / 20) : 0,
        windSpeed: day.windSpeed,
      });
    });
  }

  return {
    location: {
      name: locationName,
      country: country,
      admin1: admin1,
      latitude: lat,
      longitude: lon,
    },
    current: {
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      conditionCode: data.current.weather_code,
      isDay: data.current.is_day,
      high: data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m,
      low: data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m,
    },
    hourly,
    forecast,
    monthlyForecast,
  };
};
