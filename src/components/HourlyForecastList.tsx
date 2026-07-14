import React from 'react';
import type { HourlyForecast } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { format, parseISO } from 'date-fns';

interface HourlyForecastListProps {
  hourly: HourlyForecast[];
}

export const HourlyForecastList: React.FC<HourlyForecastListProps> = ({ hourly }) => {
  if (!hourly || hourly.length === 0) return null;

  return (
    <div className="w-full px-4 mb-8">
      <div className="liquid-glass-dark rounded-[2.5rem] p-5 overflow-hidden">
        <h3 className="text-white/80 font-semibold mb-4 text-sm tracking-wide px-2 relative z-10">Hourly Forecast</h3>
        
        <div className="flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide space-x-6">
          {hourly.map((hour, index) => {
            const timeObj = parseISO(hour.time);
            const timeLabel = index === 0 ? 'Now' : format(timeObj, 'h a');
            
            return (
              <div key={hour.time} className="flex flex-col items-center space-y-3 min-w-[3rem]">
                <span className="text-white/80 text-sm font-medium">{timeLabel}</span>
                <WeatherIcon 
                  code={hour.conditionCode} 
                  isDay={hour.isDay} 
                  className="h-7 w-7 text-[#FEC700]" 
                />
                <span className="text-white font-bold text-lg">{Math.round(hour.temp)}°</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
