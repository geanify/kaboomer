import React from 'react';
import { Button } from '../atoms/Button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  currentTitle: string;
}

export const NowPlaying: React.FC<PlayerControlsProps> = ({ isPlaying, onPrev, onNext, onTogglePlay, currentTitle }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spotify-dark-gray border-t border-spotify-light-gray p-4">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <div className="text-sm text-spotify-subtext">Now Playing</div>
          <div className="font-medium truncate text-spotify-green">{currentTitle || 'Not Playing'}</div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="icon" onClick={onPrev}>
            <SkipBack className="w-6 h-6" />
          </Button>
          <Button variant="icon" onClick={onTogglePlay} className="p-3 bg-white rounded-full text-black hover:bg-gray-200 hover:scale-105 transition-transform">
            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
          </Button>
          <Button variant="icon" onClick={onNext}>
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>
        
        <div className="flex-1 hidden md:block">
           {/* Volume or other controls could go here */}
        </div>
      </div>
    </div>
  );
};

