import React, { useState, useRef } from 'react';
import { Button } from '../atoms/Button';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  currentTitle: string;
  position?: number;
  duration?: number;
  volume?: number;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const NowPlaying: React.FC<PlayerControlsProps> = ({ 
  isPlaying, 
  onPrev, 
  onNext, 
  onTogglePlay, 
  currentTitle, 
  position = 0, 
  duration = 0, 
  volume = 100,
  onSeek,
  onVolumeChange
}) => {
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    onSeek(percentage * duration);
  };

  const handleVolumeInteract = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onVolumeChange || !volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    onVolumeChange(percentage * 100);
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingVolume(true);
    handleVolumeInteract(e);
  };

  const handleVolumeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingVolume) {
      handleVolumeInteract(e);
    }
  };

  const handleVolumeMouseUp = () => {
    setIsDraggingVolume(false);
  };

  React.useEffect(() => {
    if (isDraggingVolume) {
      window.addEventListener('mouseup', handleVolumeMouseUp);
      window.addEventListener('mousemove', handleVolumeMouseUp); // Using this to catch drag end outside
    }
    return () => {
      window.removeEventListener('mouseup', handleVolumeMouseUp);
      window.removeEventListener('mousemove', handleVolumeMouseUp);
    };
  }, [isDraggingVolume]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spotify-dark-gray border-t border-spotify-light-gray p-3 pb-safe">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        <div className="w-full md:flex-1 min-w-0 flex items-center justify-between md:justify-start">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-spotify-subtext">Now Playing</div>
            <div className="font-medium truncate text-spotify-green text-sm">{currentTitle || 'Not Playing'}</div>
          </div>
          <div className="md:hidden flex items-center gap-3">
             <Button variant="icon" onClick={onPrev} className="text-white">
                <SkipBack className="w-5 h-5" />
             </Button>
             <Button variant="icon" onClick={onTogglePlay} className="p-2 bg-white rounded-full text-black">
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-1" />}
             </Button>
             <Button variant="icon" onClick={onNext} className="text-white">
                <SkipForward className="w-5 h-5" />
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
        
        <div className="flex-1 hidden md:flex items-center justify-end gap-2">
           <Button variant="icon" onClick={() => onVolumeChange?.(volume === 0 ? 100 : 0)}>
             {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
           </Button>
           <div 
              ref={volumeRef}
              className="w-24 h-1 bg-gray-600 rounded-full cursor-pointer group relative"
              onMouseDown={handleVolumeMouseDown}
              onMouseMove={handleVolumeMouseMove}
              onClick={handleVolumeInteract}
           >
              <div 
                className="h-full bg-white rounded-full transition-all duration-75 ease-linear group-hover:bg-spotify-green"
                style={{ width: `${volume}%` }}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

