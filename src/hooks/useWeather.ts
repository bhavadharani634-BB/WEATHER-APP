import { useState, useEffect, useCallback } from 'react';
import type { WeatherData, GeocodeResult } from '../types/weather';
import { fetchCoordinates, fetchWeatherByCoords } from '../services/weatherApi';

interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  searchCity: (city: string) => Promise<void>;
  selectLocation: (location: GeocodeResult) => Promise<void>;
  recentSearches: string[];
}

const STORAGE_KEY = 'last_searched_city';
const RECENT_SEARCHES_KEY = 'recent_weather_searches';
const DEFAULT_CITY = 'London';

export const useWeather = (): UseWeatherReturn => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : ['London', 'New York', 'Tokyo', 'Paris'];
    } catch {
      return ['London', 'New York', 'Tokyo', 'Paris'];
    }
  });

  const saveToRecent = useCallback((cityName: string) => {
    if (!cityName) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== cityName.toLowerCase());
      const updated = [cityName, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore localstorage errors
      }
      return updated;
    });
  }, []);

  const selectLocation = useCallback(async (loc: GeocodeResult) => {
    setLoading(true);
    setError(null);
    try {
      const weatherData = await fetchWeatherByCoords(
        loc.latitude,
        loc.longitude,
        loc.name,
        loc.country,
        loc.admin1
      );
      setWeather(weatherData);
      localStorage.setItem(STORAGE_KEY, loc.name);
      saveToRecent(loc.name);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch weather data. Please try again later.');
      } else {
        setError('An unexpected error occurred.');
      }
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, [saveToRecent]);

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
        coords.country,
        coords.admin1
      );
      
      setWeather(weatherData);
      localStorage.setItem(STORAGE_KEY, coords.name);
      saveToRecent(coords.name);
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
  }, [saveToRecent]);

  useEffect(() => {
    const lastCity = localStorage.getItem(STORAGE_KEY) || DEFAULT_CITY;
    searchCity(lastCity);
  }, [searchCity]);

  return { weather, loading, error, searchCity, selectLocation, recentSearches };
};
