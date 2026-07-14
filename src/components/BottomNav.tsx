import React from 'react';
import { Home, CalendarDays, Bookmark, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'forecast', icon: CalendarDays, label: 'Forecast' },
    { id: 'saved', icon: Bookmark, label: 'Saved' },
    { id: 'notifications', icon: Bell, label: 'Alerts' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe">
      <div className="liquid-glass-dark border-b-0 border-l-0 border-r-0 rounded-t-3xl flex justify-around items-center px-6 py-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center space-y-1"
            >
              <Icon 
                className={twMerge(
                  clsx(
                    "h-6 w-6 transition-colors duration-300",
                    isActive ? "text-[#FEC700]" : "text-white/50 hover:text-white/70"
                  )
                )} 
              />
              <span 
                className={twMerge(
                  clsx(
                    "text-[10px] font-medium transition-colors duration-300",
                    isActive ? "text-[#FEC700]" : "text-white/50"
                  )
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
