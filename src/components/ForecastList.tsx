import React, { useState } from 'react';
import type { DailyForecast, MonthlyForecastDay, HourlyForecast } from '../types/weather';
import { ForecastCard } from './ForecastCard';
import { MonthlyForecast } from './MonthlyForecast';
import { CustomizableCalendar } from './CustomizableCalendar';
import { CalendarDays, Radio, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ForecastListProps {
  forecasts: DailyForecast[];
  monthlyForecasts?: MonthlyForecastDay[];
  hourly?: HourlyForecast[];
  locationName?: string;
  onOpenMap?: () => void;
}

type ForecastRange = 'calendar' | '7d' | '14d' | 'monthly';

export const ForecastList: React.FC<ForecastListProps> = ({ 
  forecasts, 
  monthlyForecasts = [],
  hourly = [],
  locationName,
  onOpenMap 
}) => {
  const [range, setRange] = useState<ForecastRange>('calendar');
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  if (!forecasts || forecasts.length === 0) return null;

  const displayedDaily = range === '7d' ? forecasts.slice(0, 7) : forecasts.slice(0, 14);

  return (
    <div className="w-full px-4 mb-24">
      {/* Header & Range Segment Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-[#FEC700]" />
            <h3 className="text-white/90 font-bold text-lg tracking-wide">
              {range === 'calendar' 
                ? 'Customizable Calendar' 
                : range === 'monthly' 
                ? 'Monthly Forecast' 
                : range === '14d' 
                ? '14-Day Extended' 
                : '7-Day Forecast'}
            </h3>
          </div>

          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="sm:hidden flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#FEC700]/20 text-[#FEC700] text-xs font-bold border border-[#FEC700]/30 hover:bg-[#FEC700]/30 transition-colors"
            >
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Radar</span>
            </button>
          )}
        </div>

        {/* Tab Controls & Desktop Radar Button */}
        <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-y-2">
          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl liquid-glass-dark text-xs font-bold text-[#FEC700] border border-[#FEC700]/40 hover:bg-white/10 transition-colors"
              title="Open Doppler Radar Map"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Radar Map</span>
            </button>
          )}

          <div className="liquid-glass-dark p-1 rounded-2xl flex border border-white/10 gap-0.5">
            <button
              onClick={() => setRange('calendar')}
              className={twMerge(
                clsx(
                  "flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300",
                  range === 'calendar'
                    ? "bg-[#FEC700] text-[#20462E] shadow-sm font-bold scale-102"
                    : "text-white/70 hover:text-white"
                )
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setRange('7d')}
              className={twMerge(
                clsx(
                  "px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300",
                  range === '7d'
                    ? "bg-[#FEC700] text-[#20462E] shadow-sm font-bold scale-102"
                    : "text-white/70 hover:text-white"
                )
              )}
            >
              7 Days
            </button>
            
            <button
              onClick={() => setRange('14d')}
              className={twMerge(
                clsx(
                  "px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300",
                  range === '14d'
                    ? "bg-[#FEC700] text-[#20462E] shadow-sm font-bold scale-102"
                    : "text-white/70 hover:text-white"
                )
              )}
            >
              14 Days
            </button>

            <button
              onClick={() => setRange('monthly')}
              className={twMerge(
                clsx(
                  "px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 relative",
                  range === 'monthly'
                    ? "bg-[#FEC700] text-[#20462E] shadow-sm font-bold scale-102"
                    : "text-white/70 hover:text-white"
                )
              )}
            >
              Monthly
              <span className="ml-1 px-1 py-0.2 rounded-full text-[9px] bg-white/20 text-current">
                30d
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {range === 'calendar' ? (
        <CustomizableCalendar 
          forecasts={forecasts} 
          monthlyForecasts={monthlyForecasts}
          hourly={hourly}
          locationName={locationName}
        />
      ) : range === 'monthly' ? (
        <MonthlyForecast forecasts={monthlyForecasts} />
      ) : (
        <div className="flex flex-col space-y-2.5">
          {displayedDaily.map((forecast, index) => (
            <ForecastCard 
              key={`${forecast.date}-${index}`} 
              forecast={forecast} 
              isExpanded={expandedIndex === index}
              onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
