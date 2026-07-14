import React, { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Keep the splash screen for at least 3.5 seconds to show off the video
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onFinish, 800); // Wait for fade out animation to complete
    }, 3500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      className={twMerge(
        clsx(
          "fixed inset-0 z-[100] flex items-center justify-center bg-[#20462E] transition-opacity duration-700 ease-in-out",
          isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
        )
      )}
    >
      {/* 4K Nature Video Background (Using a high quality stock nature video placeholder) */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105 animate-[pulse_10s_ease-in-out_infinite]"
        style={{ filter: 'brightness(0.9) contrast(1.1)' }}
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4" type="video/mp4" />
      </video>

      {/* Overlay to blend video with Forest Green theme and liquid glass feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#20462E]/60 to-black/60 mix-blend-multiply backdrop-blur-[2px]"></div>
      
      {/* Liquid Glass Loading Card */}
      <div className="relative z-10 liquid-glass rounded-[3rem] p-12 flex flex-col items-center max-w-sm w-[85%] text-center animate-in fade-in zoom-in-90 duration-1000 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-white/10 rounded-full backdrop-blur-sm"></div>
          <div className="absolute inset-0 border-4 border-[#FEC700] rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-black tracking-tighter text-3xl animate-pulse">AK</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Weather<span className="text-[#FEC700]">App</span></h1>
        <p className="text-white/70 font-medium text-lg">Immersing into nature...</p>
      </div>
    </div>
  );
};
