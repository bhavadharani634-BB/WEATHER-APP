import React, { useState } from 'react';
import type { MonthlyForecastDay } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { format, parseISO, isToday } from 'date-fns';
import { Calendar, List, Droplets, Wind, Thermometer, Flame, Snowflake } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface MonthlyForecastProps {
  forecasts: MonthlyForecastDay[];
}

const getConditionLabel = (code: number): string => {
  if (code === 0) return 'Clear';
  if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Overcast';
};

export const MonthlyForecast: React.FC<MonthlyForecastProps> = ({ forecasts }) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="liquid-glass-dark rounded-3xl p-8 text-center text-white/70">
        No monthly forecast data available.
      </div>
    );
  }

  // Calculate monthly stats
  const totalDays = forecasts.length;
  const avgMax = Math.round(forecasts.reduce((acc, curr) => acc + curr.maxTemp, 0) / totalDays);
  const avgMin = Math.round(forecasts.reduce((acc, curr) => acc + curr.minTemp, 0) / totalDays);
  const rainyDays = forecasts.filter((d) => d.precipitationSum > 0.5).length;
  
  // Warmest & coolest days
  const warmestDay = [...forecasts].sort((a, b) => b.maxTemp - a.maxTemp)[0];
  const coolestDay = [...forecasts].sort((a, b) => a.minTemp - b.minTemp)[0];

  const selectedDay = forecasts[selectedDayIndex] || forecasts[0];
  const selectedDateObj = parseISO(selectedDay.date);

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Monthly Meteorological Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="liquid-glass-dark p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 text-white/70 text-xs font-medium">
            <Thermometer className="h-3.5 w-3.5 text-[#FEC700]" />
            <span>Avg Temp</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-xl font-bold text-white">{avgMax}°</span>
            <span className="text-xs text-white/50">/ {avgMin}°</span>
          </div>
        </div>

        <div className="liquid-glass-dark p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 text-white/70 text-xs font-medium">
            <Droplets className="h-3.5 w-3.5 text-[#FEC700]" />
            <span>Rain Days</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-xl font-bold text-white">{rainyDays}</span>
            <span className="text-xs text-white/50">of {totalDays}d</span>
          </div>
        </div>

        <div className="liquid-glass-dark p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 text-white/70 text-xs font-medium">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span>Warmest</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-xl font-bold text-white">{Math.round(warmestDay.maxTemp)}°</span>
            <span className="text-xs text-white/50">{format(parseISO(warmestDay.date), 'MMM d')}</span>
          </div>
        </div>

        <div className="liquid-glass-dark p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 text-white/70 text-xs font-medium">
            <Snowflake className="h-3.5 w-3.5 text-blue-300" />
            <span>Coolest</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-xl font-bold text-white">{Math.round(coolestDay.minTemp)}°</span>
            <span className="text-xs text-white/50">{format(parseISO(coolestDay.date), 'MMM d')}</span>
          </div>
        </div>
      </div>

      {/* View Switcher & Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-xs uppercase tracking-wider text-white/60 font-semibold">
          30-Day Outlook
        </span>
        <div className="liquid-glass-dark p-1 rounded-xl flex space-x-1 border border-white/10">
          <button
            onClick={() => setViewMode('calendar')}
            className={twMerge(
              clsx(
                "flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200",
                viewMode === 'calendar'
                  ? "bg-[#FEC700] text-[#20462E] font-bold shadow-sm"
                  : "text-white/70 hover:text-white"
              )
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={twMerge(
              clsx(
                "flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200",
                viewMode === 'list'
                  ? "bg-[#FEC700] text-[#20462E] font-bold shadow-sm"
                  : "text-white/70 hover:text-white"
              )
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Selected Day Spotlight Preview */}
      <div className="liquid-glass-dark border border-[#FEC700]/30 rounded-3xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
            <WeatherIcon code={selectedDay.conditionCode} className="h-7 w-7 text-[#FEC700]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-white font-bold text-base">
                {isToday(selectedDateObj) ? 'Today' : format(selectedDateObj, 'EEEE, MMM d')}
              </h4>
              {isToday(selectedDateObj) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEC700] text-[#20462E]">
                  NOW
                </span>
              )}
            </div>
            <p className="text-white/70 text-xs font-medium">
              {getConditionLabel(selectedDay.conditionCode)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-bold text-white">
              {Math.round(selectedDay.maxTemp)}° <span className="text-white/50 text-sm font-medium">/ {Math.round(selectedDay.minTemp)}°</span>
            </div>
            <div className="text-[11px] text-white/60 flex items-center justify-end space-x-2">
              <span>{selectedDay.precipitationSum > 0 ? `${selectedDay.precipitationSum.toFixed(1)}mm rain` : 'No rain'}</span>
              <span>•</span>
              <span>{Math.round(selectedDay.windSpeed)} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid View */}
      {viewMode === 'calendar' ? (
        <div className="liquid-glass-dark rounded-3xl p-4 border border-white/10">
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {forecasts.map((day, idx) => {
              const date = parseISO(day.date);
              const isSelected = selectedDayIndex === idx;
              const isCurrentDay = isToday(date);

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={twMerge(
                    clsx(
                      "flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all duration-200 text-center relative",
                      isSelected
                        ? "bg-[#FEC700] text-[#20462E] border-[#FEC700] shadow-md scale-105 z-10 font-bold"
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-white"
                    )
                  )}
                >
                  {isCurrentDay && (
                    <span className={clsx(
                      "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-[#20462E]",
                      isSelected ? "bg-[#20462E]" : "bg-[#FEC700]"
                    )} />
                  )}
                  <span className={clsx("text-[10px] uppercase font-semibold", isSelected ? "text-[#20462E]/80" : "text-white/60")}>
                    {format(date, 'EEE')}
                  </span>
                  <span className={clsx("text-xs font-extrabold my-0.5", isSelected ? "text-[#20462E]" : "text-white")}>
                    {format(date, 'd')}
                  </span>
                  <div className="my-1">
                    <WeatherIcon 
                      code={day.conditionCode} 
                      className={clsx("h-5 w-5", isSelected ? "text-[#20462E]" : "text-[#FEC700]")} 
                    />
                  </div>
                  <span className={clsx("text-[11px] font-bold", isSelected ? "text-[#20462E]" : "text-white")}>
                    {Math.round(day.maxTemp)}°
                  </span>
                  <span className={clsx("text-[9px]", isSelected ? "text-[#20462E]/70" : "text-white/40")}>
                    {Math.round(day.minTemp)}°
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Detailed List View */
        <div className="flex flex-col space-y-2">
          {forecasts.map((day, idx) => {
            const date = parseISO(day.date);
            const isSelected = selectedDayIndex === idx;

            return (
              <div
                key={day.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={twMerge(
                  clsx(
                    "liquid-glass-dark rounded-2xl p-3 px-4 flex items-center justify-between cursor-pointer transition-all duration-200 border",
                    isSelected
                      ? "bg-white/15 border-[#FEC700]/50 shadow-md"
                      : "border-white/5 hover:bg-white/10"
                  )
                )}
              >
                <div className="flex items-center space-x-3 w-28">
                  <div className="flex flex-col">
                    <span className="text-white font-semibold text-sm">
                      {isToday(date) ? 'Today' : format(date, 'EEE, MMM d')}
                    </span>
                    <span className="text-white/50 text-[11px]">
                      {getConditionLabel(day.conditionCode)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex justify-center items-center">
                  <WeatherIcon code={day.conditionCode} className="h-6 w-6 text-[#FEC700]" />
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div className="flex flex-col text-xs text-white/70">
                    <div className="flex items-center space-x-1 justify-end">
                      <Droplets className="h-3 w-3 text-[#FEC700]" />
                      <span>{day.precipitationSum > 0 ? `${day.precipitationSum.toFixed(1)}mm` : '0mm'}</span>
                    </div>
                    <div className="flex items-center space-x-1 justify-end mt-0.5 text-white/50 text-[10px]">
                      <Wind className="h-3 w-3 text-[#FEC700]" />
                      <span>{Math.round(day.windSpeed)} km/h</span>
                    </div>
                  </div>

                  <div className="w-16 text-right">
                    <span className="text-white font-bold text-sm">{Math.round(day.maxTemp)}°</span>
                    <span className="text-white/50 font-medium text-xs"> / {Math.round(day.minTemp)}°</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
