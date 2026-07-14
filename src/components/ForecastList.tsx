import React, { useState } from 'react';
import type { DailyForecast } from '../types/weather';
import { ForecastCard } from './ForecastCard';
import { Map } from 'lucide-react';

interface ForecastListProps {
  forecasts: DailyForecast[];
}

export const ForecastList: React.FC<ForecastListProps> = ({ forecasts }) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  if (!forecasts || forecasts.length === 0) return null;

  return (
    <div className="w-full px-4 mb-24">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-white/90 font-bold text-lg tracking-wide">7-Day Forecast</h3>
        <button className="flex items-center space-x-1 text-white/60 hover:text-white/90 transition-colors text-sm font-medium">
          <Map className="h-4 w-4" />
          <span>Map View</span>
        </button>
      </div>
      
      <div className="flex flex-col space-y-2">
        {forecasts.map((forecast, index) => (
          <ForecastCard 
            key={`${forecast.date}-${index}`} 
            forecast={forecast} 
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
          />
        ))}
      </div>
    </div>
  );
};
