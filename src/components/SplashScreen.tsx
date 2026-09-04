import React, { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { Sun, Cloud } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if already shown in this session
    if (sessionStorage.getItem('splash_shown')) {
      onFinish();
      return;
    }

    // Snappy 1.8s introduction
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      sessionStorage.setItem('splash_shown', 'true');
      setTimeout(onFinish, 600);
    }, 1800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    sessionStorage.setItem('splash_shown', 'true');
    setTimeout(onFinish, 300);
  };

  return (
    <div 
      onClick={handleSkip}
      className={twMerge(
        clsx(
          "fixed inset-0 z-[100] flex items-center justify-center bg-[#20462E] transition-opacity duration-700 ease-in-out cursor-pointer",
          isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
        )
      )}
    >
      {/* 4K Nature Video Background */}
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
      <div className="relative z-10 liquid-glass rounded-[3rem] p-10 sm:p-12 flex flex-col items-center max-w-sm w-[85%] text-center animate-in fade-in zoom-in-90 duration-1000 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        <div className="relative w-28 h-28 mb-7 flex items-center justify-center">
          {/* Subtle outer glow backdrop */}
          <div className="absolute inset-0 bg-[#FEC700]/15 rounded-full blur-xl animate-pulse"></div>

          {/* Rotating glass ring */}
          <div className="absolute inset-0 border-4 border-white/10 rounded-full backdrop-blur-sm"></div>
          <div className="absolute inset-0 border-4 border-[#FEC700] rounded-full border-t-transparent animate-spin" style={{ animationDuration: '2s' }}></div>
          
          {/* Glowing Sun and Cloud Icon */}
          <div className="relative flex items-center justify-center">
            <Sun className="h-14 w-14 text-[#FEC700] animate-[spin_14s_linear_infinite] drop-shadow-[0_0_18px_rgba(254,199,0,0.9)] -translate-x-1.5 -translate-y-1.5" />
            <Cloud className="absolute h-12 w-12 text-white fill-white/95 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] translate-x-2.5 translate-y-1.5 animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
          Anoma<span className="text-[#FEC700]">Sense</span>
        </h1>
        <p className="text-white/75 font-medium text-base tracking-wide">Atmospheric Intelligence & Radar</p>
      </div>
    </div>
  );
};
