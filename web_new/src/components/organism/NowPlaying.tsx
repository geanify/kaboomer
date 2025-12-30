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
  onSeek?: (time: number) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const NowPlaying: React.FC<PlayerControlsProps> = ({ isPlaying, onPrev, onNext, onTogglePlay, currentTitle, position = 0, duration = 0, onSeek }) => {
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    onSeek(percentage * duration);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spotify-dark-gray border-t border-spotify-light-gray p-3 pb-safe">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        <div className="w-full md:flex-1 min-w-0 flex items-center justify-between md:justify-start">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-spotify-subtext">Now Playing</div>
            <div className="font-medium truncate text-spotify-green text-sm">{currentTitle || 'Not Playing'}</div>
          </div>
          <div className="md:hidden flex items-center gap-3">
             <Button variant="icon" onClick={onTogglePlay} className="p-2 bg-white rounded-full text-black">
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-1" />}
             </Button>
          </div>
        </div>
        
        <div className="w-full md:flex-1 flex flex-col items-center max-w-md">
          <div className="hidden md:flex items-center gap-4 mb-1">
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
            <div 
              className="flex-1 h-2 md:h-1 bg-gray-600 rounded-full cursor-pointer group relative touch-none"
              onClick={handleSeek}
            >
               <div className="absolute -top-2 -bottom-2 w-full opacity-0 cursor-pointer" /> {/* Larger touch target */}
               <div 
                 className="h-full bg-white rounded-full transition-all duration-100 ease-linear group-hover:bg-spotify-green"
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

