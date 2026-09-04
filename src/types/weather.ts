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
  monthlyForecast: MonthlyForecastDay[];
  location: {
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
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

export interface MonthlyForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  conditionCode: number;
  precipitationSum: number;
  windSpeed: number;
}

export interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  admin2?: string;
  country_code?: string;
  population?: number;
}

