
import { useState } from 'react';
import { WeatherDashboard } from './components/WeatherDashboard';
import { SplashScreen } from './components/SplashScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div 
        className={`min-h-screen bg-gradient-forest selection:bg-[#FEC700] selection:text-[#20462E] overflow-x-hidden lg:h-screen lg:overflow-hidden relative font-sans transition-opacity duration-1000 ${showSplash ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Dynamic Background Glows (Liquid Blobs) */}
        <div className="liquid-blob top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#FEC700]" style={{ animationDelay: '0s' }}></div>
        <div className="liquid-blob bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/40" style={{ animationDelay: '5s' }}></div>
        <div className="liquid-blob top-[40%] left-[20%] w-[40%] h-[40%] bg-[#2d6341]" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 w-full h-full">
          <ErrorBoundary fallbackTitle="Dashboard Error">
            <WeatherDashboard />
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
}

export default App;
