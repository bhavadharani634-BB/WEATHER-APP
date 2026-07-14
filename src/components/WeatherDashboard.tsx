import React, { useState } from 'react';
import { AppHeader } from './AppHeader';
import { CurrentWeather } from './CurrentWeather';
import { HourlyForecastList } from './HourlyForecastList';
import { ForecastList } from './ForecastList';
import { FeedbackState } from './FeedbackState';
import { BottomNav } from './BottomNav';
import { useWeather } from '../hooks/useWeather';

export const WeatherDashboard: React.FC = () => {
  const { weather, loading, error, searchCity } = useWeather();
  const [activeTab, setActiveTab] = useState('home');

  const handleSearch = (city: string) => {
    searchCity(city);
    setActiveTab('home'); // Switch back to home on new search
  };

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row lg:space-x-8 p-0 lg:p-8">
        
        {/* Left Column (Home Dashboard) */}
        <div className={`w-full lg:w-1/2 flex flex-col max-w-md mx-auto lg:max-w-none ${activeTab === 'home' ? 'block' : 'hidden lg:flex'}`}>
          <AppHeader 
            locationName={weather?.location.name} 
            onSearch={handleSearch} 
            isLoading={loading} 
          />

          <main className="flex-1 overflow-y-auto scrollbar-hide pb-20 lg:pb-0">
            {loading && !weather && (
              <FeedbackState type="loading" />
            )}
            
            {error && !loading && (
              <FeedbackState type="error" message={error} />
            )}
            
            {!loading && !error && !weather && (
              <FeedbackState type="empty" />
            )}
            
            {weather && !error && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                <CurrentWeather weather={weather} />
                <HourlyForecastList hourly={weather.hourly} />
                
                {/* Air Quality Stub - As requested by the image, we can just stub it for now to match layout */}
                <div className="w-full px-4 mb-8">
                  <div className="liquid-glass-dark rounded-[2.5rem] p-5 px-6 flex justify-between items-center relative overflow-hidden">
                    <div className="flex flex-col relative z-10">
                       <span className="text-white/80 font-semibold text-sm tracking-wide mb-1">Air Quality Index</span>
                       <div className="flex items-center space-x-2">
                         <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                         <span className="text-white font-medium">Good</span>
                       </div>
                    </div>
                    <span className="text-3xl font-bold text-white">42</span>
                  </div>
                </div>

              </div>
            )}
          </main>
        </div>

        {/* Right Column (7-Day Forecast) */}
        {weather && !error && (
          <div className={`w-full lg:w-1/2 flex flex-col max-w-md mx-auto lg:max-w-none ${activeTab === 'forecast' ? 'block' : 'hidden lg:flex'}`}>
            <div className="lg:mt-[5.5rem] flex-1 overflow-y-auto scrollbar-hide pb-20 lg:pb-0 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
              <ForecastList forecasts={weather.forecast} />
            </div>
          </div>
        )}

      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};
