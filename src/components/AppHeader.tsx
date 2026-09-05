import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, ChevronDown, X, History, Loader2, Globe, Sun, Cloud } from 'lucide-react';
import { searchCities } from '../services/weatherApi';
import type { GeocodeResult } from '../types/weather';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

interface AppHeaderProps {
  locationName?: string;
  country?: string;
  admin1?: string;
  onSearch: (city: string) => void;
  onSelectLocation?: (location: GeocodeResult) => void;
  isLoading: boolean;
  recentSearches?: string[];
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  locationName, 
  country,
  admin1,
  onSearch, 
  onSelectLocation,
  isLoading, 
  recentSearches = []
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search suggestions
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    setIsSuggesting(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchCities(query.trim(), 6);
        setSuggestions(results);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };

    if (isSearching) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearching]);

  // Focus input when search mode activates
  useEffect(() => {
    if (isSearching && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearching]);

  const handleSelect = (loc: GeocodeResult) => {
    if (onSelectLocation) {
      onSelectLocation(loc);
    } else {
      onSearch(loc.name);
    }
    setIsSearching(false);
    setQuery('');
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      handleSelect(suggestions[highlightedIndex]);
      return;
    }

    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setIsSearching(false);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsSearching(false);
    }
  };

  const displaySubtitle = [admin1, country].filter(Boolean).join(', ');

  return (
    <div className="flex items-center justify-between py-6 px-4 relative z-50" ref={searchContainerRef}>
      {!isSearching ? (
        <>
          <div className="flex items-center flex-1">
            {/* Animated Brand Logo with Sun and Cloud */}
            <div className="animate-float mr-3 sm:mr-4">
              <div 
                className="relative flex items-center justify-center w-11 h-11 bg-gradient-to-br from-[#FEC700]/90 via-emerald-600/70 to-[#20462E] shadow-[0_0_18px_rgba(254,199,0,0.5)] border border-white/30 rounded-2xl hover:scale-110 transition-transform duration-300 cursor-pointer overflow-hidden p-1 backdrop-blur-md"
                title="AnomaSense Weather Intelligence"
              >
                <Sun className="h-6 w-6 text-[#FEC700] absolute -top-0.5 -right-0.5 animate-[spin_12s_linear_infinite] drop-shadow-[0_0_8px_rgba(254,199,0,0.8)]" />
                <Cloud className="h-6 w-6 text-white fill-white/95 relative z-10 -bottom-0.5 -left-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
              </div>
            </div>
            
            <div 
              onClick={() => setIsSearching(true)}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <MapPin className="h-5 w-5 text-[#FEC700] shrink-0 drop-shadow-[0_0_8px_rgba(254,199,0,0.6)]" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FEC700] bg-[#FEC700]/10 px-2 py-0.5 rounded-full border border-[#FEC700]/25">
                    AnomaSense
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <h2 className="text-xl font-bold text-white group-hover:text-[#FEC700] transition-colors line-clamp-1">
                    {locationName || "Select Location"}
                  </h2>
                  <ChevronDown className="h-4 w-4 text-white/70 group-hover:translate-y-0.5 transition-transform shrink-0" />
                </div>
                <span className="text-white/60 text-xs font-medium line-clamp-1">
                  {displaySubtitle ? `${displaySubtitle} • ` : ''}{format(new Date(), 'EEE, d MMM yyyy')}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsSearching(true)}
            className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-300 group border border-white/10 bg-white/5"
            title="Search Cities"
          >
            <Search className="h-5 w-5 text-white group-hover:text-[#FEC700] group-hover:scale-110 transition-all duration-300" />
          </button>
        </>
      ) : (
        <div className="w-full relative animate-in fade-in slide-in-from-top-2 duration-300">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                {isSuggesting ? (
                  <Loader2 className="h-4 w-4 text-[#FEC700] animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-white/50" />
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                className={cn(
                  "liquid-glass-dark block w-full pl-10 pr-10 py-3 rounded-[2rem] leading-5 text-sm",
                  "placeholder-white/50 text-white font-medium transition-all duration-300",
                  "focus:outline-none focus:bg-white/10 focus:border-[#FEC700]/70 border border-white/20",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
                placeholder="Search city, region, or country..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />

              {query && (
                <button 
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-white/50 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button 
              type="button"
              onClick={() => {
                setIsSearching(false);
                setQuery('');
                setSuggestions([]);
              }}
              className="p-2 text-white/70 hover:text-white transition-colors text-xs font-semibold px-3 py-2 rounded-2xl hover:bg-white/10"
            >
              Cancel
            </button>
          </form>

          {/* Autocomplete & Suggestions Dropdown Menu */}
          <div className="absolute top-full mt-2 left-0 right-0 z-50 liquid-glass-dark rounded-3xl p-3 shadow-2xl border border-white/20 backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            {/* When query has suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-col space-y-1">
                <div className="px-3 py-1 text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center justify-between">
                  <span>Locations Found</span>
                  <span>{suggestions.length} results</span>
                </div>
                {suggestions.map((loc, idx) => {
                  const isHighlighted = highlightedIndex === idx;
                  const regionText = [loc.admin1, loc.country].filter(Boolean).join(', ');

                  return (
                    <div
                      key={`${loc.id}-${loc.latitude}-${loc.longitude}`}
                      onClick={() => handleSelect(loc)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all duration-150",
                        isHighlighted 
                          ? "bg-[#FEC700] text-[#20462E] font-bold" 
                          : "hover:bg-white/10 text-white"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className={cn("h-4 w-4 shrink-0", isHighlighted ? "text-[#20462E]" : "text-[#FEC700]")} />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold leading-tight">{loc.name}</span>
                          <span className={cn("text-xs font-normal", isHighlighted ? "text-[#20462E]/80" : "text-white/60")}>
                            {regionText}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {loc.country_code && (
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md",
                            isHighlighted ? "bg-[#20462E]/20 text-[#20462E]" : "bg-white/10 text-white/80"
                          )}>
                            {loc.country_code}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* When typing but no results found */}
            {query.trim().length >= 2 && !isSuggesting && suggestions.length === 0 && (
              <div className="p-4 text-center text-sm text-white/60">
                No matching cities found for &quot;{query}&quot;. Press enter to try custom search.
              </div>
            )}

            {/* When input is empty: Show Recent & Popular Locations */}
            {query.trim().length < 2 && (
              <div className="flex flex-col space-y-3 p-1">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-1.5 px-2 mb-2 text-xs font-semibold text-white/60">
                      <History className="h-3.5 w-3.5 text-[#FEC700]" />
                      <span>Recent Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {recentSearches.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            onSearch(city);
                            setIsSearching(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-medium text-white transition-colors"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-1.5 px-2 mb-2 text-xs font-semibold text-white/60">
                    <Globe className="h-3.5 w-3.5 text-[#FEC700]" />
                    <span>Popular Cities</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {['Tokyo', 'Paris', 'New York', 'Dubai', 'Sydney', 'Mumbai'].map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          onSearch(city);
                          setIsSearching(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-colors"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
