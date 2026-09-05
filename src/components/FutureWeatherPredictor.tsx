import React, { useState, useMemo } from 'react';
import type { WeatherData, PredictedWeatherPoint } from '../types/weather';
import { 
  generateFutureTrajectory, 
  predictWeatherForDate 
} from '../services/predictionEngine';
import { WeatherIcon } from './WeatherIcon';
import { 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  Droplets, 
  Wind, 
  CheckCircle2, 
  Activity, 
  Zap,
  Flame,
  Snowflake,
  CloudLightning
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface FutureWeatherPredictorProps {
  weather: WeatherData;
}

type HorizonOption = 7 | 14 | 30 | 90;

export const FutureWeatherPredictor: React.FC<FutureWeatherPredictorProps> = ({ weather }) => {
  const [horizon, setHorizon] = useState<HorizonOption>(14);
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const defaultSelectedDateStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');
  
  const [selectedDateStr, setSelectedDateStr] = useState<string>(defaultSelectedDateStr);

  // Compute trajectory for current horizon
  const trajectory = useMemo(() => {
    return generateFutureTrajectory(weather, horizon);
  }, [weather, horizon]);

  // Compute detailed prediction for selected date
  const selectedPrediction = useMemo(() => {
    return predictWeatherForDate(weather, selectedDateStr);
  }, [weather, selectedDateStr]);

  const handlePointClick = (point: PredictedWeatherPoint) => {
    setSelectedDateStr(point.date);
  };

  const handleQuickOffset = (offsetDays: number) => {
    const newDate = format(addDays(new Date(), offsetDays), 'yyyy-MM-dd');
    setSelectedDateStr(newDate);
  };

  // SVG Chart Geometry calculations
  const chartPoints = trajectory;
  const maxTemps = chartPoints.map((p) => p.upperBound);
  const minTemps = chartPoints.map((p) => p.lowerBound);
  const highestTemp = Math.max(...maxTemps, 30);
  const lowestTemp = Math.min(...minTemps, 5);
  const tempRange = Math.max(highestTemp - lowestTemp, 10);

  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 25;
  const paddingY = 20;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const getX = (index: number) => {
    if (chartPoints.length <= 1) return paddingX;
    return paddingX + (index / (chartPoints.length - 1)) * usableWidth;
  };

  const getY = (temp: number) => {
    return paddingY + usableHeight - ((temp - lowestTemp) / tempRange) * usableHeight;
  };

  // Create SVG path for expected temperature line
  const expectedLinePath = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.expectedTemp).toFixed(1)}`)
    .join(' ');

  // Create SVG path for confidence band polygon
  const upperPathPoints = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.upperBound).toFixed(1)}`)
    .join(' ');
  const lowerPathPoints = [...chartPoints]
    .reverse()
    .map((p, i) => `L ${getX(chartPoints.length - 1 - i).toFixed(1)} ${getY(p.lowerBound).toFixed(1)}`)
    .join(' ');
  const confidenceAreaPath = `${upperPathPoints} ${lowerPathPoints} Z`;

  return (
    <div className="w-full flex flex-col space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="liquid-glass-dark rounded-3xl p-5 sm:p-6 border border-white/10 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#FEC700]/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-[#FEC700] mb-1.5">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Predictive Atmospheric Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Future Weather Prediction
            </h2>
            <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-lg">
              Multi-model ensemble synthesis projecting temperature envelopes, precipitation probability, and activity feasibility for <span className="text-[#FEC700] font-semibold">{weather.location.name}</span>.
            </p>
          </div>
        </div>

        {/* Prediction Horizon Selector */}
        <div className="mt-5 flex flex-wrap gap-2 pt-3 border-t border-white/10">
          {[
            { label: 'Next 7 Days', value: 7 },
            { label: '14 Days Model', value: 14 },
            { label: '30 Days Ensemble', value: 30 },
            { label: '90 Days Seasonal', value: 90 },
          ].map((h) => (
            <button
              key={h.value}
              onClick={() => setHorizon(h.value as HorizonOption)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                horizon === h.value
                  ? 'bg-[#FEC700] text-[#20462E] font-bold shadow-md shadow-[#FEC700]/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/5'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trajectory Graph Card */}
      <div className="liquid-glass-dark rounded-3xl p-5 border border-white/10 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-[#FEC700]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              {horizon}-Day Trajectory & Confidence Envelope
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-white/60">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEC700]"></span>
              <span>Projected Mean</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEC700]/30 border border-[#FEC700]/60"></span>
              <span>90% Confidence Spread</span>
            </span>
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="w-full overflow-x-auto scrollbar-hide py-1">
          <div className="min-w-[420px] w-full">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-44 overflow-visible"
            >
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FEC700" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#20462E" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FEC700" />
                  <stop offset="100%" stopColor="#FFE066" />
                </linearGradient>
              </defs>

              {/* Confidence Band Polygon */}
              <path 
                d={confidenceAreaPath} 
                fill="url(#confidenceGradient)" 
                stroke="rgba(254, 199, 0, 0.3)" 
                strokeDasharray="3 3"
                strokeWidth="1"
              />

              {/* Expected Temperature Line */}
              <path 
                d={expectedLinePath} 
                fill="none" 
                stroke="url(#lineGlow)" 
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points */}
              {chartPoints.map((p, i) => {
                const cx = getX(i);
                const cy = getY(p.expectedTemp);
                const isSelected = p.date === selectedDateStr;

                return (
                  <g 
                    key={p.date} 
                    className="cursor-pointer group"
                    onClick={() => handlePointClick(p)}
                  >
                    {/* Hover hotspot */}
                    <circle cx={cx} cy={cy} r="14" fill="transparent" />
                    
                    {/* Outer ring for selected point */}
                    {isSelected && (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r="8" 
                        fill="none" 
                        stroke="#FEC700" 
                        strokeWidth="2" 
                        className="animate-ping origin-center opacity-75"
                      />
                    )}

                    {/* Point circle */}
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={isSelected ? 5 : 3.5} 
                      fill={isSelected ? '#FEC700' : '#20462E'} 
                      stroke="#FEC700" 
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all duration-200 group-hover:scale-125"
                    />

                    {/* Label periodically or on hover/select */}
                    {(i % Math.ceil(chartPoints.length / 7) === 0 || isSelected) && (
                      <text 
                        x={cx} 
                        y={cy - 10} 
                        textAnchor="middle" 
                        fill={isSelected ? '#FEC700' : 'rgba(255,255,255,0.8)'} 
                        fontSize={isSelected ? '11' : '9'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {Math.round(p.expectedTemp)}°
                      </text>
                    )}

                    {/* Bottom Date Label */}
                    {(i % Math.ceil(chartPoints.length / 7) === 0 || isSelected) && (
                      <text 
                        x={cx} 
                        y={chartHeight - 2} 
                        textAnchor="middle" 
                        fill={isSelected ? '#FEC700' : 'rgba(255,255,255,0.5)'} 
                        fontSize="9"
                      >
                        {p.date.slice(5)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <p className="text-[11px] text-white/50 text-center mt-1">
          💡 Click any point along the curve to analyze that specific future date.
        </p>
      </div>

      {/* Interactive Custom Date Picker & Teleport Controls */}
      <div className="liquid-glass-dark rounded-3xl p-5 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-[#FEC700]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Target Prediction Date
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="date"
              min={tomorrowStr}
              value={selectedDateStr}
              onChange={(e) => e.target.value && setSelectedDateStr(e.target.value)}
              className="bg-black/30 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#FEC700] transition-colors cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: '+3 Days', days: 3 },
            { label: '+7 Days (Next Week)', days: 7 },
            { label: '+14 Days', days: 14 },
            { label: '+30 Days (Next Month)', days: 30 },
            { label: '+60 Days', days: 60 },
          ].map((btn) => (
            <button
              key={btn.days}
              onClick={() => handleQuickOffset(btn.days)}
              className="px-3 py-1 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 rounded-xl text-xs transition-all cursor-pointer"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Target Date Detailed Breakdown Card */}
      {selectedPrediction && (
        <div className="liquid-glass-dark rounded-3xl p-6 border border-white/15 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FEC700]/15 text-[#FEC700] border border-[#FEC700]/30">
                  {selectedPrediction.daysAhead === 0 
                    ? 'Today' 
                    : selectedPrediction.daysAhead === 1 
                    ? 'Tomorrow' 
                    : `In ${selectedPrediction.daysAhead} Days`}
                </span>
                <span className="text-xs text-white/60">
                  {format(addDays(new Date(), selectedPrediction.daysAhead), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">
                Projected Weather Conditions
              </h3>
            </div>

            {/* Confidence Badge */}
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Activity className="h-4 w-4 text-[#FEC700]" />
                <span>Predictive Confidence:</span>
                <span className="text-[#FEC700] font-mono">{selectedPrediction.point.confidenceScore}%</span>
              </div>
              <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-[#FEC700] rounded-full transition-all duration-500"
                  style={{ width: `${selectedPrediction.point.confidenceScore}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-white/50 mt-1">
                Reliability: {selectedPrediction.confidenceRating}
              </span>
            </div>
          </div>

          {/* Core Temperature & Atmospheric Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            
            {/* Primary Temp */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-white/60 font-semibold block">Expected Temp</span>
                <span className="text-3xl font-black text-white tracking-tight">
                  {Math.round(selectedPrediction.point.expectedTemp)}°C
                </span>
                <span className="text-xs text-white/50 block mt-1">
                  Range: {Math.round(selectedPrediction.point.minTemp)}°C – {Math.round(selectedPrediction.point.maxTemp)}°C
                </span>
              </div>
              <div className="w-12 h-12 flex items-center justify-center">
                <WeatherIcon code={selectedPrediction.point.conditionCode} isDay={1} className="w-10 h-10" />
              </div>
            </div>

            {/* Uncertainty Bounds */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-xs text-white/60 font-semibold block mb-1">90% Ensemble Spread</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold text-[#FEC700]">
                  {selectedPrediction.point.lowerBound}°C
                </span>
                <span className="text-xs text-white/40">to</span>
                <span className="text-xl font-bold text-[#FEC700]">
                  {selectedPrediction.point.upperBound}°C
                </span>
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                Accounts for natural atmospheric chaotic divergence.
              </p>
            </div>

            {/* Precipitation & Wind Vector */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-white/70">
                  <Droplets className="h-3.5 w-3.5 text-blue-400" />
                  <span>Rain Probability</span>
                </span>
                <span className="font-bold text-white">
                  {selectedPrediction.point.precipitationProbability}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-white/70">
                  <Wind className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Wind Speed</span>
                </span>
                <span className="font-bold text-white">
                  {Math.round(selectedPrediction.point.windSpeed)} km/h
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-white/70">
                  <Zap className="h-3.5 w-3.5 text-[#FEC700]" />
                  <span>Relative Humidity</span>
                </span>
                <span className="font-bold text-white">
                  {selectedPrediction.point.humidity}%
                </span>
              </div>
            </div>

          </div>

          {/* Atmospheric Anomaly Alert Banner */}
          {selectedPrediction.point.anomalyType !== 'normal' ? (
            <div className="mb-6 p-4 rounded-2xl border border-orange-400/30 bg-orange-500/10 flex items-start space-x-3">
              {selectedPrediction.point.anomalyType === 'heatwave' && <Flame className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />}
              {selectedPrediction.point.anomalyType === 'cold_front' && <Snowflake className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />}
              {selectedPrediction.point.anomalyType === 'heavy_rain' && <CloudLightning className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />}
              {selectedPrediction.point.anomalyType === 'high_wind' && <Wind className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />}
              <div>
                <h4 className="text-sm font-bold text-orange-300 capitalize">
                  Atmospheric Anomaly Warning: {selectedPrediction.point.anomalyType.replace('_', ' ')}
                </h4>
                <p className="text-xs text-white/80 mt-0.5">
                  Models detect conditions deviating significantly from standard regional climatological baseline. Severity: <strong className="capitalize">{selectedPrediction.point.anomalySeverity}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-3.5 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 flex items-center space-x-2.5 text-emerald-300 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Normal Atmospheric Stability — No severe climatological anomalies or storm fronts expected.</span>
            </div>
          )}

          {/* AI Atmospheric Narrative */}
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5 mb-6 text-xs text-white/80 leading-relaxed">
            <span className="font-bold text-[#FEC700] mr-1.5">AI Synoptic Summary:</span>
            {selectedPrediction.narrativeSummary}
          </div>

          {/* Activity Feasibility Matrix */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Activity className="h-4 w-4 text-[#FEC700]" />
              <span>Event & Activity Feasibility Matrix</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedPrediction.activities.map((act) => {
                const badgeColor = 
                  act.rating === 'optimal' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : act.rating === 'good'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : act.rating === 'caution'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30';

                return (
                  <div 
                    key={act.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{act.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${badgeColor}`}>
                        {act.score}% • {act.rating}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-normal">
                      {act.recommendation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
