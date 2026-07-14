import React from 'react';
import type { WeatherData } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';

interface CurrentWeatherProps {
  weather: WeatherData;
}

const getConditionText = (code: number): string => {
  if (code === 0) return 'Clear Sky';
  if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Unknown';
};

export const CurrentWeather: React.FC<CurrentWeatherProps> = ({ weather }) => {
  const { current } = weather;
  const conditionText = getConditionText(current.conditionCode);

  return (
    <div className="w-full relative px-4 mb-8">
      {/* Background glow for the card */}
      <div className="absolute inset-4 bg-gradient-to-br from-[#FEC700]/30 to-transparent blur-2xl rounded-[3rem] z-0"></div>
      
      <div className="liquid-glass liquid-glass-highlight flex flex-col items-center p-8 rounded-[3rem] overflow-hidden">
        
        <div className="flex justify-between w-full items-center mb-2 z-10 relative">
           <WeatherIcon 
            code={current.conditionCode} 
            isDay={current.isDay} 
            className="h-28 w-28 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
          />
          
          <div className="flex flex-col items-end">
            <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tighter drop-shadow-sm leading-none">
              {Math.round(current.temp)}°
            </span>
          </div>
        </div>

        <div className="w-full flex justify-between items-end mt-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white tracking-tight">{conditionText}</span>
            <span className="text-white/70 text-sm font-medium mt-1">
              Feels like {Math.round(current.feelsLike)}°
            </span>
          </div>
          <div className="flex flex-col items-end text-white/90 font-medium">
            <span>H: {Math.round(current.high)}°</span>
            <span>L: {Math.round(current.low)}°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
