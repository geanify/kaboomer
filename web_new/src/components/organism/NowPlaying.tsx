import React from 'react';
import { Button } from '../atoms/Button';

interface PlayerControlsProps {
  isPlaying: boolean; // Just a visual state for now, backend controls logic
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  currentTitle: string;
}

export const NowPlaying: React.FC<PlayerControlsProps> = ({ onPrev, onNext, onTogglePlay, currentTitle }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spotify-dark-gray border-t border-spotify-light-gray p-4">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <div className="text-sm text-spotify-subtext">Now Playing</div>
          <div className="font-medium truncate text-spotify-green">{currentTitle || 'Not Playing'}</div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="icon" onClick={onPrev}>⏮</Button>
          <Button variant="icon" onClick={onTogglePlay} className="text-3xl">⏯</Button>
          <Button variant="icon" onClick={onNext}>⏭</Button>
        </div>
        
        <div className="flex-1 hidden md:block">
           {/* Volume or other controls could go here */}
        </div>
      </div>
    </div>
  );
};

