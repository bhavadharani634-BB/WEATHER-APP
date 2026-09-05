import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../utils/cn';


interface SearchBarProps {
  onSearch: (city: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-[#20462E]/70 group-focus-within:text-[#20462E]" />
      </div>
      <input
        type="text"
        className={cn(
          "block w-full pl-10 pr-3 py-3 border border-transparent rounded-xl leading-5 bg-white/90 backdrop-blur-sm",
          "placeholder-[#20462E]/50 text-[#20462E] font-medium shadow-lg transition-all duration-300",
          "focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FEC700] focus:border-transparent",
          isLoading && "opacity-70 cursor-not-allowed"
        )}
        placeholder="Search for a city..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isLoading}
      />
      <button 
        type="submit" 
        disabled={!query.trim() || isLoading}
        className={cn(
          "absolute inset-y-1.5 right-1.5 px-4 py-1.5 bg-gradient-to-r from-[#FEC700] to-[#ffd740]",
          "text-[#20462E] font-bold rounded-lg shadow-sm transition-transform duration-200",
          "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
        )}
      >
        Search
      </button>
    </form>
  );
};
