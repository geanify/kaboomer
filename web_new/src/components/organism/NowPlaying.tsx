import React from 'react';
import { Button } from '../atoms/Button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  currentTitle: string;
  position?: number;
  duration?: number;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const NowPlaying: React.FC<PlayerControlsProps> = ({ isPlaying, onPrev, onNext, onTogglePlay, currentTitle, position = 0, duration = 0 }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spotify-dark-gray border-t border-spotify-light-gray p-3">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-spotify-subtext">Now Playing</div>
          <div className="font-medium truncate text-spotify-green text-sm">{currentTitle || 'Not Playing'}</div>
        </div>
        
        <div className="flex-1 flex flex-col items-center max-w-md">
          <div className="flex items-center gap-4 mb-1">
            <Button variant="icon" onClick={onPrev}>
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button variant="icon" onClick={onTogglePlay} className="p-2 bg-white rounded-full text-black hover:bg-gray-200 hover:scale-105 transition-transform">
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-1" />}
            </Button>
            <Button variant="icon" onClick={onNext}>
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="w-full flex items-center gap-2 text-xs text-spotify-subtext font-mono">
            <span>{formatTime(position)}</span>
            <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                 style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
               />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="flex-1 hidden md:block">
           {/* Volume or other controls could go here */}
        </div>
      </div>
    </div>
  );
};

