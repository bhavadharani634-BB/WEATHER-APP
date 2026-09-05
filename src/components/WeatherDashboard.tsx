import React, { useState } from 'react';
import { AppHeader } from './AppHeader';
import { CurrentWeather } from './CurrentWeather';
import { HourlyForecastList } from './HourlyForecastList';
import { ForecastList } from './ForecastList';
import { FeedbackState } from './FeedbackState';
import { BottomNav } from './BottomNav';
import { RadarMap } from './RadarMap';
import { FutureWeatherPredictor } from './FutureWeatherPredictor';
import { ErrorBoundary } from './ErrorBoundary';
import { useWeather } from '../hooks/useWeather';
import { Bookmark, ShieldAlert, Sparkles, MapPin, Radio, CalendarDays, ArrowLeft, ChevronRight } from 'lucide-react';
import type { GeocodeResult } from '../types/weather';

export const WeatherDashboard: React.FC = () => {
  const { weather, loading, error, searchCity, selectLocation, recentSearches } = useWeather();
  const [activeTab, setActiveTab] = useState('home');
  const [desktopRightView, setDesktopRightView] = useState<'forecast' | 'radar' | 'predict'>('forecast');

  const handleSearch = (city: string) => {
    searchCity(city);
    setActiveTab('home'); // Switch back to home on new search
  };

  const handleSelectLocation = (loc: GeocodeResult) => {
    selectLocation(loc);
    setActiveTab('home');
  };

  const handleOpenRadar = () => {
    setActiveTab('map');
    setDesktopRightView('radar');
  };

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row lg:space-x-8 p-0 lg:p-8">
        
        {/* Left Column (Home Dashboard) */}
        <div className={`w-full lg:w-1/2 flex flex-col max-w-md mx-auto lg:max-w-none ${activeTab === 'home' ? 'block' : 'hidden lg:flex'}`}>
          <AppHeader 
            locationName={weather?.location.name} 
            country={weather?.location.country}
            admin1={weather?.location.admin1}
            onSearch={handleSearch} 
            onSelectLocation={handleSelectLocation}
            isLoading={loading} 
            recentSearches={recentSearches}
          />

          <main className="flex-1 overflow-y-auto scrollbar-hide pb-20 lg:pb-0">
            {loading && !weather && (
              <FeedbackState type="loading" />
            )}
            
            {error && !loading && (
              <FeedbackState 
                type="error" 
                message={error} 
                onRetry={() => searchCity(localStorage.getItem('last_searched_city') || 'London')}
                onSelectCity={handleSearch}
              />
            )}
            
            {!loading && !error && !weather && (
              <FeedbackState 
                type="empty" 
                onSelectCity={handleSearch}
              />
            )}
            
            {weather && !error && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                <CurrentWeather weather={weather} />
                <HourlyForecastList hourly={weather.hourly} />
                
                {/* Air Quality & Environmental Telemetry Card */}
                <div className="w-full px-4 mb-8">
                  <div className="liquid-glass-dark rounded-[2.5rem] p-5 px-6 flex justify-between items-center relative overflow-hidden border border-white/10">
                    <div className="flex flex-col relative z-10">
                       <span className="text-white/80 font-semibold text-sm tracking-wide mb-1">Air Quality Index</span>
                       <div className="flex items-center space-x-2">
                         <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                         <span className="text-white font-medium">Good (Optimal)</span>
                       </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right text-xs text-white/50 hidden sm:block">
                        <span>PM2.5: Low</span>
                      </div>
                      <span className="text-3xl font-bold text-[#FEC700]">42</span>
                    </div>
                  </div>
                </div>

                {/* AI Future Weather Predictor Quick-Launch Card */}
                <div className="w-full px-4 mb-8">
                  <div 
                    onClick={() => {
                      setActiveTab('predict');
                      setDesktopRightView('predict');
                    }}
                    className="liquid-glass-dark rounded-[2.5rem] p-5 px-6 flex justify-between items-center relative overflow-hidden border border-[#FEC700]/30 hover:border-[#FEC700]/60 transition-all cursor-pointer group shadow-lg"
                  >
                    <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#FEC700]/15 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex flex-col relative z-10">
                      <div className="flex items-center space-x-1.5 text-[#FEC700] mb-1">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">Predictive Telemetry</span>
                      </div>
                      <span className="text-white font-bold text-base">AI Future Weather Predictor</span>
                      <span className="text-white/60 text-xs mt-0.5">Forecast any upcoming date with multi-model AI modeling</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-[#FEC700] text-[#20462E] flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                      <ChevronRight className="h-5 w-5 stroke-[2.5]" />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </main>
        </div>

        {/* Right Column Loading Skeleton for Desktop */}
        {loading && !weather && (
          <div className="hidden lg:flex w-full lg:w-1/2 flex-col space-y-4 pt-6 px-4 animate-in fade-in duration-500">
            {/* Desktop Switcher Skeleton */}
            <div className="flex items-center justify-between mb-2">
              <div className="w-64 h-11 rounded-2xl liquid-glass-dark skeleton-shimmer"></div>
            </div>

            {/* Extended Forecast List Skeleton */}
            <div className="liquid-glass-dark rounded-3xl p-6 border border-white/10 space-y-3.5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-36 h-6 rounded-xl skeleton-shimmer"></div>
                <div className="w-32 h-6 rounded-xl skeleton-shimmer"></div>
              </div>

              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div 
                  key={i} 
                  className="p-4 rounded-2xl liquid-glass-dark border border-white/5 flex items-center justify-between skeleton-shimmer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-4 rounded skeleton-shimmer bg-white/20"></div>
                    <div className="w-7 h-7 rounded-full skeleton-shimmer bg-white/25"></div>
                  </div>
                  <div className="w-32 h-2 rounded-full skeleton-shimmer bg-white/10 hidden sm:block"></div>
                  <div className="w-16 h-5 rounded-lg skeleton-shimmer bg-white/25"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Column (Desktop Triple View: Forecasts, Radar Map, OR AI Predictor) */}
        {weather && !error && (
          <div className={`w-full lg:w-1/2 flex flex-col max-w-md mx-auto lg:max-w-none ${activeTab === 'forecast' || activeTab === 'predict' ? 'block' : 'hidden lg:flex'}`}>
            <div className="lg:mt-[1.5rem] flex-1 overflow-y-auto scrollbar-hide pb-20 lg:pb-0 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
              {/* Desktop View Switcher */}
              <div className="hidden lg:flex items-center justify-between mb-4 px-4">
                <div className="liquid-glass-dark p-1 rounded-2xl flex border border-white/15 gap-1">
                  <button
                    onClick={() => setDesktopRightView('forecast')}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      desktopRightView === 'forecast'
                        ? 'bg-[#FEC700] text-[#20462E] shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span>Forecasts (7d/14d/30d)</span>
                  </button>

                  <button
                    onClick={() => setDesktopRightView('radar')}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      desktopRightView === 'radar'
                        ? 'bg-[#FEC700] text-[#20462E] shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Radio className="h-4 w-4 animate-pulse" />
                    <span>Doppler Radar</span>
                  </button>

                  <button
                    onClick={() => setDesktopRightView('predict')}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      desktopRightView === 'predict'
                        ? 'bg-[#FEC700] text-[#20462E] shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-[#FEC700]" />
                    <span>AI Predictor</span>
                  </button>
                </div>
              </div>

              {desktopRightView === 'forecast' ? (
                <ForecastList 
                  forecasts={weather.forecast} 
                  monthlyForecasts={weather.monthlyForecast} 
                  hourly={weather.hourly}
                  locationName={weather.location.name}
                  onOpenMap={handleOpenRadar}
                />
              ) : desktopRightView === 'radar' ? (
                <div className="px-4">
                  <ErrorBoundary fallbackTitle="Doppler Radar Unavailable">
                    <RadarMap
                      latitude={weather.location.latitude}
                      longitude={weather.location.longitude}
                      locationName={weather.location.name}
                      country={weather.location.country}
                    />
                  </ErrorBoundary>
                </div>
              ) : (
                <div className="px-4">
                  <ErrorBoundary fallbackTitle="Future Weather Predictor Unavailable">
                    <FutureWeatherPredictor weather={weather} />
                  </ErrorBoundary>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile AI Weather Predictor Tab View */}
        {activeTab === 'predict' && weather && (
          <div className="w-full max-w-md mx-auto px-4 py-6 pb-24 lg:hidden animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveTab('home')}
                className="flex items-center space-x-1 text-xs text-white/80 hover:text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Dashboard</span>
              </button>
              <span className="text-xs font-semibold text-[#FEC700] bg-[#FEC700]/10 px-3 py-1 rounded-full border border-[#FEC700]/30 flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>AI Predictor</span>
              </span>
            </div>
            <ErrorBoundary fallbackTitle="Future Weather Predictor Unavailable">
              <FutureWeatherPredictor weather={weather} />
            </ErrorBoundary>
          </div>
        )}

        {/* Mobile Radar Map Tab View */}
        {activeTab === 'map' && weather && (
          <div className="w-full max-w-md mx-auto px-4 py-6 pb-24 lg:hidden animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveTab('home')}
                className="flex items-center space-x-1 text-xs text-white/80 hover:text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Dashboard</span>
              </button>
              <span className="text-xs font-semibold text-[#FEC700] bg-[#FEC700]/10 px-3 py-1 rounded-full border border-[#FEC700]/30">
                Live Radar
              </span>
            </div>
            <ErrorBoundary fallbackTitle="Doppler Radar Map Unavailable">
              <RadarMap
                latitude={weather.location.latitude}
                longitude={weather.location.longitude}
                locationName={weather.location.name}
                country={weather.location.country}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Saved Cities Tab View for Mobile */}
        {activeTab === 'saved' && (
          <div className="w-full max-w-md mx-auto px-4 py-8 pb-24 lg:hidden animate-in fade-in duration-300">
            <div className="flex items-center space-x-2 mb-6">
              <Bookmark className="h-6 w-6 text-[#FEC700]" />
              <h2 className="text-2xl font-bold text-white">Saved & Recent Locations</h2>
            </div>
            <div className="flex flex-col space-y-3">
              {recentSearches.map((city) => (
                <div
                  key={city}
                  onClick={() => handleSearch(city)}
                  className="liquid-glass-dark p-4 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-white/15 border border-white/10 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-[#FEC700]" />
                    <span className="text-white font-bold text-lg">{city}</span>
                  </div>
                  <span className="text-xs text-[#FEC700] font-semibold bg-[#FEC700]/10 px-3 py-1 rounded-full border border-[#FEC700]/20">
                    View Weather
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts / Advisory Tab View for Mobile */}
        {activeTab === 'notifications' && (
          <div className="w-full max-w-md mx-auto px-4 py-8 pb-24 lg:hidden animate-in fade-in duration-300">
            <div className="flex items-center space-x-2 mb-6">
              <ShieldAlert className="h-6 w-6 text-[#FEC700]" />
              <h2 className="text-2xl font-bold text-white">Weather Advisories</h2>
            </div>
            <div className="flex flex-col space-y-4">
              <div className="liquid-glass-dark p-5 rounded-3xl border border-white/10">
                <div className="flex items-center space-x-2 text-green-400 mb-2 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Atmospheric Conditions Normal</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  No extreme weather warnings currently in effect for {weather?.location.name || 'your region'}. UV levels and wind speeds remain within comfortable thresholds.
                </p>
              </div>

              {weather && weather.current.temp > 30 && (
                <div className="liquid-glass-dark p-5 rounded-3xl border border-orange-400/30 bg-orange-500/10">
                  <h4 className="text-orange-300 font-bold text-sm mb-1">High Temperature Notice</h4>
                  <p className="text-white/80 text-xs">
                    Temperatures reaching {Math.round(weather.current.temp)}°C. Stay hydrated and avoid prolonged midday sun exposure.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};
