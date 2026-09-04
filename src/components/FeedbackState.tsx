import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Cloud, 
  Radio, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  MapPin, 
  Wind, 
  Droplets, 
  Compass, 
  Sparkles 
} from 'lucide-react';

interface FeedbackStateProps {
  type: 'loading' | 'error' | 'empty';
  message?: string;
  onRetry?: () => void;
  onSelectCity?: (city: string) => void;
}

const LOADING_STATUSES = [
  'Calibrating Doppler Radar Telemetry...',
  'Scanning Multi-Layer Atmospheric Pressure...',
  'Synchronizing 30-Day Ensemble Forecast...',
  'Retrieving Satellite Cloud Density...',
  'Aligning Environmental Micro-Telemetry...',
];

export const FeedbackState: React.FC<FeedbackStateProps> = ({ 
  type, 
  message, 
  onRetry, 
  onSelectCity 
}) => {
  const [statusIndex, setStatusIndex] = useState(0);

  // Cycle through engaging atmospheric radar telemetry status messages
  useEffect(() => {
    if (type !== 'loading') return;

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 1600);

    return () => clearInterval(interval);
  }, [type]);

  if (type === 'loading') {
    return (
      <div className="w-full flex flex-col space-y-6 px-4 animate-in fade-in duration-500">
        
        {/* State-of-the-Art Atmospheric Radar Scanning Banner */}
        <div className="liquid-glass-dark rounded-[2.5rem] p-5 sm:p-6 border border-white/15 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FEC700]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-3">
              {/* Spinning Sun & Cloud Radar Orb */}
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FEC700]/80 via-emerald-600/60 to-[#20462E] p-1 border border-white/30 flex items-center justify-center shadow-[0_0_20px_rgba(254,199,0,0.4)] overflow-hidden shrink-0">
                <Sun className="h-6 w-6 text-[#FEC700] absolute -top-0.5 -right-0.5 animate-[spin_8s_linear_infinite] drop-shadow-[0_0_8px_rgba(254,199,0,0.8)]" />
                <Cloud className="h-6 w-6 text-white fill-white/95 relative z-10 -bottom-0.5 -left-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FEC700]">
                    AnomaSense
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">
                    Atmospheric Telemetry
                  </span>
                </div>
                <h4 className="text-white font-bold text-sm sm:text-base tracking-wide mt-0.5 flex items-center gap-1.5">
                  <span>Syncing Live Weather</span>
                  <Radio className="h-3.5 w-3.5 text-[#FEC700] animate-pulse" />
                </h4>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-1 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60">
              <Sparkles className="h-3.5 w-3.5 text-[#FEC700]" />
              <span>Real-Time Feed</span>
            </div>
          </div>

          {/* Cycling Status Label */}
          <div className="h-6 flex items-center">
            <p className="text-xs sm:text-sm text-white/80 font-medium transition-all duration-300">
              {LOADING_STATUSES[statusIndex]}
            </p>
          </div>

          {/* Animated Sweeping Gradient Radar Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3 relative">
            <div 
              className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-[#FEC700] to-transparent rounded-full animate-[shimmer_1.4s_infinite_ease-in-out]"
            ></div>
          </div>
        </div>

        {/* Shimmering Hero Weather Card Skeleton */}
        <div className="liquid-glass rounded-[3rem] p-7 sm:p-8 flex flex-col relative overflow-hidden border border-white/20 shadow-2xl">
          {/* Top Row: Date Pill & Time Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="w-36 h-6 rounded-xl skeleton-shimmer"></div>
            <div className="w-20 h-6 rounded-xl skeleton-shimmer"></div>
          </div>

          {/* Center Weather Display Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl skeleton-shimmer flex items-center justify-center">
              <Cloud className="h-12 w-12 text-white/20 animate-pulse" />
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="w-32 sm:w-36 h-16 sm:h-20 rounded-2xl skeleton-shimmer"></div>
              <div className="w-20 h-4 rounded-lg skeleton-shimmer"></div>
            </div>
          </div>

          {/* Condition Text & High/Low Skeletons */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-44 h-7 rounded-xl skeleton-shimmer"></div>
            <div className="w-24 h-6 rounded-xl skeleton-shimmer"></div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/10 mb-6"></div>

          {/* 4 Bottom Telemetry Metrics Skeletons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Droplets, label: 'Humidity' },
              { icon: Wind, label: 'Wind' },
              { icon: Compass, label: 'Pressure' },
              { icon: Sun, label: 'UV Index' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="liquid-glass-dark rounded-2xl p-3 flex flex-col items-center space-y-2 border border-white/10 skeleton-shimmer"
              >
                <item.icon className="h-4 w-4 text-white/30" />
                <div className="w-12 h-3 rounded skeleton-shimmer bg-white/10"></div>
                <div className="w-16 h-4 rounded skeleton-shimmer bg-white/20"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Forecast Carousel Skeleton */}
        <div className="liquid-glass-dark rounded-3xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-5 rounded-lg skeleton-shimmer"></div>
            <div className="w-16 h-4 rounded-lg skeleton-shimmer"></div>
          </div>
          <div className="flex space-x-3 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="w-18 sm:w-20 h-28 rounded-2xl liquid-glass-dark p-3 flex flex-col items-center justify-between border border-white/5 skeleton-shimmer shrink-0"
              >
                <div className="w-8 h-3 rounded skeleton-shimmer bg-white/15"></div>
                <div className="w-7 h-7 rounded-full skeleton-shimmer bg-white/20"></div>
                <div className="w-10 h-4 rounded skeleton-shimmer bg-white/15"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Air Quality Telemetry Card Skeleton */}
        <div className="liquid-glass-dark rounded-[2.5rem] p-5 px-6 flex justify-between items-center border border-white/10 skeleton-shimmer">
          <div className="space-y-2">
            <div className="w-28 h-4 rounded skeleton-shimmer bg-white/20"></div>
            <div className="w-36 h-5 rounded-lg skeleton-shimmer bg-white/15"></div>
          </div>
          <div className="w-14 h-10 rounded-xl skeleton-shimmer bg-white/20"></div>
        </div>

      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="w-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-400">
        <div className="liquid-glass-dark rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full border border-amber-500/30 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-amber-500/5 backdrop-blur-sm pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-5 shadow-[0_0_24px_rgba(245,158,11,0.4)]">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="flex items-center space-x-1.5 mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                Connection Notice
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Unable to Load Weather
            </h3>

            <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6">
              {message || 'The meteorological service did not respond. Please check your network or try another search.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-6">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-[#FEC700] text-[#20462E] font-bold text-xs flex items-center justify-center space-x-2 hover:scale-102 transition-transform cursor-pointer shadow-lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry Location</span>
                </button>
              )}
            </div>

            {/* Quick-Pick Popular Cities Recovery */}
            {onSelectCity && (
              <div className="w-full border-t border-white/10 pt-5">
                <span className="text-[11px] font-semibold text-white/50 block mb-2.5">
                  Or explore popular forecast hubs:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {['London', 'New York', 'Tokyo', 'Paris', 'Dubai'].map((city) => (
                    <button
                      key={city}
                      onClick={() => onSelectCity(city)}
                      className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 text-xs font-semibold transition-all cursor-pointer"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // type === 'empty'
  return (
    <div className="w-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-400">
      <div className="liquid-glass-dark rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full border border-white/15 shadow-2xl relative">
        <div className="w-16 h-16 rounded-3xl bg-[#FEC700]/15 border border-[#FEC700]/30 flex items-center justify-center text-[#FEC700] mb-5 mx-auto">
          <Search className="h-8 w-8" />
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FEC700] block mb-1">
          AnomaSense Weather
        </span>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Choose a Destination
        </h3>

        <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6">
          Search for any city worldwide using the predictive search bar above to view real-time forecasts, 30-day ensembles, and Doppler radar.
        </p>

        {onSelectCity && (
          <div className="w-full border-t border-white/10 pt-5">
            <span className="text-[11px] font-semibold text-white/50 block mb-2.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['London', 'New York', 'Tokyo', 'Paris', 'Sydney'].map((city) => (
                <button
                  key={city}
                  onClick={() => onSelectCity(city)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 text-xs font-semibold transition-all cursor-pointer"
                >
                  <MapPin className="h-3 w-3 text-[#FEC700]" />
                  <span>{city}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
