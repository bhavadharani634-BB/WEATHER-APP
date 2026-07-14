export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    conditionCode: number;
    isDay: number;
    high: number;
    low: number;
    conditionText?: string;
  };
  hourly: HourlyForecast[];
  forecast: DailyForecast[];
  location: {
    name: string;
    country: string;
  };
}

export interface HourlyForecast {
  time: string;
  temp: number;
  conditionCode: number;
  isDay: number;
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  conditionCode: number;
  precipitationProbability: number;
  windSpeed: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
}

export interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}
