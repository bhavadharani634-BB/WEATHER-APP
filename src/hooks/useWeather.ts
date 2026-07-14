import { useState, useEffect, useCallback } from 'react';
import type { WeatherData } from '../types/weather';
import { fetchCoordinates, fetchWeatherByCoords } from '../services/weatherApi';

interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  searchCity: (city: string) => Promise<void>;
}

const STORAGE_KEY = 'last_searched_city';
const DEFAULT_CITY = 'London';

export const useWeather = (): UseWeatherReturn => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const searchCity = useCallback(async (city: string) => {
    if (!city.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const coords = await fetchCoordinates(city);
      const weatherData = await fetchWeatherByCoords(
        coords.latitude,
        coords.longitude,
        coords.name,
        coords.country
      );
      
      setWeather(weatherData);
      localStorage.setItem(STORAGE_KEY, city);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message === 'City not found' 
          ? `We couldn't find "${city}". Please try another search.`
          : 'Failed to fetch weather data. Please try again later.');
      } else {
        setError('An unexpected error occurred.');
      }
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const lastCity = localStorage.getItem(STORAGE_KEY) || DEFAULT_CITY;
    searchCity(lastCity);
  }, [searchCity]);

  return { weather, loading, error, searchCity };
};
