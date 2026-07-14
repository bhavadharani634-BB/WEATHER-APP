import React from 'react';
import { Loader2, AlertCircle, CloudOff } from 'lucide-react';

interface FeedbackStateProps {
  type: 'loading' | 'error' | 'empty';
  message?: string;
}

export const FeedbackState: React.FC<FeedbackStateProps> = ({ type, message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
      {type === 'loading' && (
        <div className="flex flex-col items-center space-y-6 animate-pulse">
          <div className="relative">
            <div className="absolute inset-0 bg-[#FEC700] rounded-full blur-xl opacity-20"></div>
            <Loader2 className="h-16 w-16 text-[#FEC700] animate-spin relative z-10" />
          </div>
          <p className="text-xl font-medium text-white/80">Fetching weather data...</p>
        </div>
      )}

      {type === 'error' && (
        <div className="flex flex-col items-center space-y-4 max-w-md mx-auto bg-red-500/10 border border-red-500/20 p-8 rounded-3xl backdrop-blur-sm">
          <AlertCircle className="h-12 w-12 text-[#FEC700]" />
          <h3 className="text-xl font-bold text-white">Oops! Something went wrong</h3>
          <p className="text-white/70">{message || 'Failed to fetch data'}</p>
        </div>
      )}

      {type === 'empty' && (
        <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
          <CloudOff className="h-16 w-16 text-white/30" />
          <h3 className="text-xl font-bold text-white/50">No location selected</h3>
          <p className="text-white/40">Search for a city above to see its weather forecast.</p>
        </div>
      )}
    </div>
  );
};
