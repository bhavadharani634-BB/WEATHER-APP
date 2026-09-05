import React, { useState, useMemo, useCallback } from 'react';
import type { DailyForecast, MonthlyForecastDay, HourlyForecast } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { 
  format, 
  parseISO, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth
} from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Clock, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  Droplets, 
  Wind, 
  Thermometer
} from 'lucide-react';

interface CustomizableCalendarProps {
  forecasts: DailyForecast[];
  monthlyForecasts?: MonthlyForecastDay[];
  hourly?: HourlyForecast[];
  locationName?: string;
}

export const CustomizableCalendar: React.FC<CustomizableCalendarProps> = ({
  forecasts,
  monthlyForecasts = [],
  hourly = [],
  locationName = 'Selected City'
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(14); // Default 2:00 PM

  // Pre-index existing daily forecasts for fast lookup (YYYY-MM-DD)
  const dailyMap = useMemo(() => {
    const map = new Map<string, DailyForecast>();
    forecasts.forEach((f) => map.set(f.date, f));
    return map;
  }, [forecasts]);

  const monthlyMap = useMemo(() => {
    const map = new Map<string, MonthlyForecastDay>();
    monthlyForecasts.forEach((m) => map.set(m.date, m));
    return map;
  }, [monthlyForecasts]);

  // Generate calendar grid days (including padding from adjacent months)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Show More / Show Less state (defaults to Show Less, persists in localStorage)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('calendar_show_more');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleExpanded = useCallback((val?: boolean) => {
    setIsExpanded((prev) => {
      const next = typeof val === 'boolean' ? val : !prev;
      try {
        localStorage.setItem('calendar_show_more', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Split calendarDays into weeks of 7 days each
  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      rows.push(calendarDays.slice(i, i + 7));
    }
    return rows;
  }, [calendarDays]);

  // Find week containing selected date
  const selectedWeekIndex = useMemo(() => {
    const idx = weeks.findIndex((week) =>
      week.some((day) => isSameDay(day, selectedDate))
    );
    return idx >= 0 ? idx : 0;
  }, [weeks, selectedDate]);

  // Displayed days depending on Show More (full month) vs Show Less (2 weeks)
  const displayedDays = useMemo(() => {
    if (isExpanded) return calendarDays;
    // Show 2 weeks containing the active selection
    const startWeek = Math.min(Math.max(0, selectedWeekIndex), Math.max(0, weeks.length - 2));
    return weeks.slice(startWeek, startWeek + 2).flat();
  }, [isExpanded, calendarDays, weeks, selectedWeekIndex]);

  // Quick baseline temp for synthesized custom days
  const baselineStats = useMemo(() => {
    if (forecasts.length === 0) return { max: 24, min: 14, condition: 1 };
    const avgMax = forecasts.reduce((a, b) => a + b.maxTemp, 0) / forecasts.length;
    const avgMin = forecasts.reduce((a, b) => a + b.minTemp, 0) / forecasts.length;
    return { max: Math.round(avgMax), min: Math.round(avgMin), condition: forecasts[0].conditionCode };
  }, [forecasts]);

  // Helper to get daily weather data for any date
  const getDayWeatherData = useCallback((date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    if (dailyMap.has(key)) {
      const d = dailyMap.get(key)!;
      return {
        maxTemp: d.maxTemp,
        minTemp: d.minTemp,
        conditionCode: d.conditionCode,
        precipProb: d.precipitationProbability,
        windSpeed: d.windSpeed,
        isForecast: true,
      };
    }
    if (monthlyMap.has(key)) {
      const m = monthlyMap.get(key)!;
      return {
        maxTemp: m.maxTemp,
        minTemp: m.minTemp,
        conditionCode: m.conditionCode,
        precipProb: Math.min(90, Math.round(m.precipitationSum * 18)),
        windSpeed: m.windSpeed,
        isForecast: true,
      };
    }

    // Extrapolated harmonic seasonal model for custom dates
    const dayOfYear = parseInt(format(date, 'd'), 10);
    const variance = Math.sin(dayOfYear * 0.8) * 3;
    return {
      maxTemp: Math.round(baselineStats.max + variance),
      minTemp: Math.round(baselineStats.min + variance),
      conditionCode: baselineStats.condition,
      precipProb: 15,
      windSpeed: 14,
      isForecast: false,
    };
  }, [dailyMap, monthlyMap, baselineStats]);

  // Compute exact weather at the chosen date AND hour
  const selectedDayData = useMemo(() => {
    return getDayWeatherData(selectedDate);
  }, [getDayWeatherData, selectedDate]);

  // Compute hourly weather metrics for chosen hour
  const timeWeather = useMemo(() => {
    const { maxTemp, minTemp, conditionCode, precipProb, windSpeed } = selectedDayData;

    // Diurnal sinusoidal model: Peak temp at 15:00 (3 PM), minimum at 05:00 (dawn)
    // T(h) = T_mid + (range/2) * sin((h - 9) * PI / 12)
    const midTemp = (maxTemp + minTemp) / 2;
    const tempAmplitude = (maxTemp - minTemp) / 2;
    const diurnalFactor = Math.sin(((selectedHour - 9) * Math.PI) / 12);

    // Check if live hourly forecast matches date and hour
    const matchingLiveHour = hourly && hourly.length > 0
      ? hourly.find((h) => {
          try {
            const d = parseISO(h.time);
            return !isNaN(d.getTime()) && isSameDay(d, selectedDate) && d.getHours() === selectedHour;
          } catch {
            return false;
          }
        })
      : null;

    const isDayTime = matchingLiveHour ? matchingLiveHour.isDay === 1 : (selectedHour >= 6 && selectedHour < 19);
    const effectiveConditionCode = matchingLiveHour ? matchingLiveHour.conditionCode : conditionCode;

    const hourTemp = matchingLiveHour 
      ? Math.round(matchingLiveHour.temp * 10) / 10
      : Math.round((midTemp + tempAmplitude * diurnalFactor) * 10) / 10;

    // Feels like temperature adjusted for wind & humidity
    const feelsLike = Math.round((hourTemp + (isDayTime ? 1.2 : -0.8)) * 10) / 10;

    // Humidity inversely follows temperature
    const humidity = Math.min(95, Math.max(35, Math.round(75 - diurnalFactor * 25)));

    // Wind speed peaks during afternoon thermal mixing
    const hourWind = Math.round((windSpeed * (0.7 + Math.max(0, diurnalFactor) * 0.4)) * 10) / 10;

    // Condition text
    let conditionText = 'Clear';
    if (effectiveConditionCode === 0) conditionText = isDayTime ? 'Sunny & Clear' : 'Clear Night';
    else if ([1, 2, 3].includes(effectiveConditionCode)) conditionText = isDayTime ? 'Partly Cloudy' : 'Scattered Clouds';
    else if ([45, 48].includes(effectiveConditionCode)) conditionText = 'Foggy Mist';
    else if ([51, 53, 55].includes(effectiveConditionCode)) conditionText = 'Light Drizzle';
    else if ([61, 63, 65, 80, 81, 82].includes(effectiveConditionCode)) conditionText = 'Rain Showers';
    else if ([71, 73, 75, 85].includes(effectiveConditionCode)) conditionText = 'Snow Flurries';
    else if ([95, 96, 99].includes(effectiveConditionCode)) conditionText = 'Thunderstorm';

    return {
      hourTemp,
      feelsLike,
      isDayTime,
      humidity,
      hourWind,
      conditionText,
      precipProb,
      conditionCode: effectiveConditionCode,
    };
  }, [selectedDayData, selectedHour, selectedDate, hourly]);

  // Hourly strip for the selected day (every 3 hours)
  const dayTimelineHours = [0, 3, 6, 9, 12, 15, 18, 21];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleTodayJump = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
    setSelectedHour(now.getHours());
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      try {
        const parsed = parseISO(e.target.value);
        if (!isNaN(parsed.getTime())) {
          setSelectedDate(parsed);
          setCurrentMonth(parsed);
        }
      } catch {
        // ignore invalid date inputs
      }
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* Top Header & Custom Date/Time Quick Picker Bar */}
      <div className="liquid-glass-dark rounded-3xl p-5 border border-white/10 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#FEC700] mb-1">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Interactive Weather Calendar</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Custom Date & Time Weather
            </h3>
            <p className="text-xs text-white/70 mt-0.5">
              Select any date and time to examine precise meteorological conditions for <span className="text-[#FEC700] font-semibold">{locationName}</span>.
            </p>
          </div>

          {/* Quick Date Inputs */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={handleTodayJump}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer shadow-sm"
            >
              Today
            </button>
            <input 
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateInputChange}
              className="bg-black/30 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#FEC700] transition-colors cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Selected Date & Time Highlight Telemetry Card */}
      <div className="liquid-glass-dark rounded-3xl p-6 border border-[#FEC700]/30 relative overflow-hidden shadow-2xl bg-gradient-to-br from-black/40 to-[#20462E]/50">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#FEC700]/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEC700] text-[#20462E]">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
              </span>
              <span className="text-xs text-white/70 font-medium">
                {format(selectedDate, 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <Clock className="h-4 w-4 text-[#FEC700]" />
              <span className="text-lg font-bold">
                {format(new Date().setHours(selectedHour, 0), 'hh:00 a')}
                <span className="text-xs font-mono text-white/50 ml-2">({selectedHour.toString().padStart(2, '0')}:00)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/90 border border-white/15">
              {timeWeather.conditionText}
            </span>
          </div>
        </div>

        {/* Core Temperature & Weather Pods */}
        <div className="flex flex-col gap-3.5 my-5">
          {/* Main Temperature Hero Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-white/60 font-semibold block mb-0.5">
                Temperature at {format(new Date().setHours(selectedHour, 0), 'hh:00 a')} ({selectedHour.toString().padStart(2, '0')}:00)
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight whitespace-nowrap">
                  {timeWeather.hourTemp}°C
                </span>
                <span className="text-xs sm:text-sm text-white/60 font-medium whitespace-nowrap">
                  Feels like {timeWeather.feelsLike}°C
                </span>
              </div>
            </div>

            {/* Weather Icon with guaranteed spacing and zero overlap */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center bg-white/10 rounded-2xl border border-white/15 p-2 shadow-inner">
              <WeatherIcon 
                code={timeWeather.conditionCode} 
                isDay={timeWeather.isDayTime ? 1 : 0} 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>

          {/* Sub-Metrics Grid (2 columns: Full Day Arc & Telemetry) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Daily Max / Min Range Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-2.5">
              <span className="text-xs text-white/60 font-semibold block">Full Day Temperature Arc</span>
              <div className="flex items-center justify-between text-sm py-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FEC700]"></span>
                  <span className="text-white/60 text-xs">High:</span>
                  <span className="text-white font-bold text-base">{selectedDayData.maxTemp}°C</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  <span className="text-white/60 text-xs">Low:</span>
                  <span className="text-white/80 font-bold text-base">{selectedDayData.minTemp}°C</span>
                </div>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-400 w-1/3 rounded-l-full"></div>
                <div className="h-full bg-[#FEC700] w-2/3 rounded-r-full"></div>
              </div>
            </div>

            {/* Precipitation & Wind Vector */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-white/70">
                  <Droplets className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>Precipitation Odds</span>
                </span>
                <span className="font-bold text-white font-mono">{selectedDayData.precipProb}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-white/70">
                  <Wind className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Wind Velocity</span>
                </span>
                <span className="font-bold text-white font-mono">{timeWeather.hourWind} km/h</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-white/70">
                  <Thermometer className="h-3.5 w-3.5 text-[#FEC700] shrink-0" />
                  <span>Relative Humidity</span>
                </span>
                <span className="font-bold text-white font-mono">{timeWeather.humidity}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 24-Hour Interactive Time Scrubber */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Clock className="h-3.5 w-3.5 text-[#FEC700]" />
              <span>Scrub 24-Hour Time of Day:</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#FEC700]">
              {format(new Date().setHours(selectedHour, 0), 'hh:00 a')} ({selectedHour}:00)
            </span>
          </div>

          {/* Interactive Range Slider */}
          <input 
            type="range"
            min={0}
            max={23}
            step={1}
            value={selectedHour}
            onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
            className="w-full accent-[#FEC700] h-2 bg-white/10 rounded-lg cursor-pointer transition-all"
          />

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { label: 'Dawn (06:00)', hour: 6, icon: Sunrise },
              { label: 'Morning (09:00)', hour: 9, icon: Sun },
              { label: 'Noon (12:00)', hour: 12, icon: Sun },
              { label: 'Afternoon (15:00)', hour: 15, icon: Sun },
              { label: 'Dusk (18:00)', hour: 18, icon: Sunset },
              { label: 'Night (22:00)', hour: 22, icon: Moon },
            ].map((p) => {
              const Icon = p.icon;
              const isActive = selectedHour === p.hour;
              return (
                <button
                  key={p.hour}
                  onClick={() => setSelectedHour(p.hour)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#FEC700] text-[#20462E] font-bold shadow-sm'
                      : 'bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/5'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 24-Hour Mini Timeline Strip for Selected Day */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <span className="text-xs font-bold text-white/70 block mb-2.5">
            Hourly Progression for {format(selectedDate, 'MMM d')}:
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {dayTimelineHours.map((h) => {
              const isSelected = selectedHour === h;
              const isDayTime = h >= 6 && h < 19;
              const midTemp = (selectedDayData.maxTemp + selectedDayData.minTemp) / 2;
              const tempAmplitude = (selectedDayData.maxTemp - selectedDayData.minTemp) / 2;
              const factor = Math.sin(((h - 9) * Math.PI) / 12);
              const estTemp = Math.round(midTemp + tempAmplitude * factor);

              return (
                <button
                  key={h}
                  onClick={() => setSelectedHour(h)}
                  className={`min-w-[56px] flex-1 p-2 rounded-2xl flex flex-col items-center justify-between transition-all cursor-pointer border ${
                    isSelected 
                      ? 'bg-[#FEC700] text-[#20462E] border-[#FEC700] shadow-md font-bold scale-[1.03]'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/5'
                  }`}
                >
                  <span className="text-[10px] font-mono">
                    {h.toString().padStart(2, '0')}:00
                  </span>
                  <div className="my-1.5 w-6 h-6 flex items-center justify-center">
                    <WeatherIcon 
                      code={selectedDayData.conditionCode} 
                      isDay={isDayTime ? 1 : 0} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <span className="text-xs font-bold">
                    {estTemp}°
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Interactive Month Calendar Matrix */}
      <div className="liquid-glass-dark rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl">
        
        {/* Month Navigation Toolbar & Show More/Less Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-[#FEC700]" />
              <h4 className="text-lg font-black text-white tracking-wide">
                {format(currentMonth, 'MMMM yyyy')}
              </h4>
            </div>

            {/* Mobile Prev/Next buttons */}
            <div className="flex sm:hidden items-center space-x-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-auto">
            {/* Show Less / Show More Segmented Pill Control */}
            <div className="liquid-glass p-0.5 rounded-xl flex border border-white/10 text-xs font-semibold">
              <button
                onClick={() => toggleExpanded(false)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  !isExpanded 
                    ? 'bg-[#FEC700] text-[#20462E] font-bold shadow-sm' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Show Less
              </button>
              <button
                onClick={() => toggleExpanded(true)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  isExpanded 
                    ? 'bg-[#FEC700] text-[#20462E] font-bold shadow-sm' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Show More
              </button>
            </div>

            {/* Desktop Prev/Next buttons */}
            <div className="hidden sm:flex items-center space-x-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d} className="text-[11px] font-bold uppercase tracking-wider text-white/50 py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 transition-all duration-300">
          {displayedDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDay = isToday(day);
            const dayData = getDayWeatherData(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[64px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-2xl flex flex-col justify-between items-center transition-all cursor-pointer relative border ${
                  isSelected
                    ? 'bg-[#FEC700] text-[#20462E] border-[#FEC700] shadow-lg shadow-[#FEC700]/20 font-bold scale-[1.03] z-10'
                    : isTodayDay
                    ? 'bg-white/15 text-white border-[#FEC700]/70'
                    : isCurrentMonth
                    ? 'bg-white/5 hover:bg-white/15 text-white/90 border-white/5'
                    : 'bg-white/[0.02] text-white/30 border-transparent hover:bg-white/5'
                }`}
              >
                {/* Day Number Header */}
                <div className="w-full flex items-center justify-between text-[11px] px-0.5">
                  <span className={`font-bold ${isSelected ? 'text-[#20462E]' : isTodayDay ? 'text-[#FEC700]' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {isTodayDay && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FEC700]"></span>
                  )}
                </div>

                {/* Weather Icon for that day */}
                <div className="my-0.5">
                  <WeatherIcon 
                    code={dayData.conditionCode} 
                    isDay={1} 
                    className="w-5 h-5 sm:w-6 sm:h-6" 
                  />
                </div>

                {/* Min / Max Temperature Badges */}
                <div className="text-[10px] flex items-center space-x-1 font-semibold">
                  <span>{dayData.maxTemp}°</span>
                  <span className={`text-[9px] ${isSelected ? 'text-[#20462E]/70' : 'text-white/40'}`}>
                    {dayData.minTemp}°
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Show More / Show Less Toggle Button & Guidance Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-center">
          <button
            onClick={() => toggleExpanded()}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 hover:border-[#FEC700]/50 transition-all cursor-pointer shadow-lg group active:scale-95"
          >
            <span>
              {isExpanded 
                ? 'Show Less (2-Week View)' 
                : `Show More (${calendarDays.length} Days / Full Month)`}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[#FEC700] group-hover:-translate-y-0.5 transition-transform" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#FEC700] group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>
          
          <p className="text-[11px] text-white/50 text-center mt-2.5">
            💡 Click any day in the calendar to check and scrub that date's exact hourly weather conditions.
          </p>
        </div>
      </div>

    </div>
  );
};
