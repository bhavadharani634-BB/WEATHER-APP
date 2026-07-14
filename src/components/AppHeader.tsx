import React, { useState } from 'react';
import { MapPin, Search, ChevronDown, X } from 'lucide-react';
import { cn } from './SearchBar';

interface AppHeaderProps {
  locationName?: string;
  onSearch: (city: string) => void;
  isLoading: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ locationName, onSearch, isLoading }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setIsSearching(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-6 px-4 relative z-50">
      {!isSearching ? (
        <>
          <div className="flex items-center flex-1">
            {/* Animated Logo */}
            <div className="animate-float mr-4">
              <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-[#FEC700] via-orange-400 to-[#FEC700] shadow-[0_0_20px_rgba(254,199,0,0.5)] border-2 border-white/30 animate-morph hover:scale-110 transition-transform duration-300 cursor-pointer">
                <span className="text-[#20462E] font-black tracking-tighter text-lg">AK</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 cursor-pointer group">
              <MapPin className="h-5 w-5 text-white/70" />
              <h2 className="text-xl font-semibold text-white group-hover:text-white/80 transition-colors line-clamp-1">
                {locationName || "Select Location"}
              </h2>
              <ChevronDown className="h-5 w-5 text-white/70 flex-shrink-0" />
            </div>
          </div>
          <button 
            onClick={() => setIsSearching(true)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors group"
          >
            <Search className="h-6 w-6 text-white group-hover:-rotate-90 transition-transform duration-500" />
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 animate-in slide-in-from-right-4 duration-300 group">
          <div className="relative flex-1 group">
            <input
              type="text"
              autoFocus
              className={cn(
                "liquid-glass-dark block w-full pl-4 pr-10 py-3 rounded-[2rem] leading-5",
                "placeholder-white/50 text-white font-medium transition-all duration-300",
                "focus:outline-none focus:bg-white/10 focus:border-[#FEC700]/70",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
              placeholder="Enter city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!query.trim() || isLoading}
              className="absolute inset-y-0 right-2 flex items-center justify-center p-1"
            >
              <Search className="h-5 w-5 text-[#FEC700] group-hover:-rotate-90 transition-transform duration-500" />
            </button>
          </div>
          <button 
            type="button"
            onClick={() => setIsSearching(false)}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </form>
      )}
    </div>
  );
};
