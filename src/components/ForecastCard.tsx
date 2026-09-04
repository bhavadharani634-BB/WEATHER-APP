import React from 'react';
import type { DailyForecast } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { format, parseISO, isToday } from 'date-fns';
import { Droplets, Wind, Sun, Sunrise } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ForecastCardProps {
  forecast: DailyForecast;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ forecast, isExpanded, onToggle }) => {
  const dateObj = parseISO(forecast.date);
  const dayName = isToday(dateObj) ? 'Today' : format(dateObj, 'EEE');
  const dateSub = format(dateObj, 'MMM d, yyyy');
  
  return (
    <div 
      className={twMerge(
        clsx(
          "liquid-glass-dark flex flex-col rounded-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isExpanded ? "shadow-[0_12px_40px_0_rgba(0,0,0,0.4)] bg-white/10" : "hover:bg-white/5 cursor-pointer"
        )
      )}
    >
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex flex-col w-24">
          <span className="text-white font-semibold text-sm">{dayName}</span>
          <span className="text-white/50 text-[10px]">{dateSub}</span>
        </div>
        <div className="flex-1 flex justify-center">
          <WeatherIcon code={forecast.conditionCode} className="h-6 w-6 text-[#FEC700]" />
        </div>
        <div className="flex items-center space-x-3 w-24 justify-end">
          <span className="text-white font-bold">{Math.round(forecast.maxTemp)}°</span>
          <span className="text-white/50 font-medium">/ {Math.round(forecast.minTemp)}°</span>
        </div>
      </div>
      
      {/* Expanded Details */}
      <div 
        className={twMerge(
          clsx(
            "grid grid-cols-2 gap-4 px-4 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isExpanded ? "py-4 max-h-48 opacity-100 border-t border-white/10" : "max-h-0 opacity-0 py-0"
          )
        )}
      >
        <div className="flex items-center space-x-2 text-sm text-white/80">
          <Droplets className="h-4 w-4 text-[#FEC700]" />
          <span>{forecast.precipitationProbability}% Precip</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-white/80">
          <Wind className="h-4 w-4 text-[#FEC700]" />
          <span>{forecast.windSpeed} km/h</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-white/80">
          <Sun className="h-4 w-4 text-[#FEC700]" />
          <span>UV Index: {forecast.uvIndex}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-white/80">
          <Sunrise className="h-4 w-4 text-[#FEC700]" />
          <span>{format(parseISO(forecast.sunrise), 'h:mm a')}</span>
        </div>
      </div>
    </div>
  );
};
