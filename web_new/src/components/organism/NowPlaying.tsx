import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../atoms/Button';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  currentTitle: string;
  currentArtist?: string;
  position?: number;
  duration?: number;
  volume?: number;
  isLoading?: boolean;
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
  currentArtist, 
  position = 0, 
  duration = 0, 
  volume = 100,
  isLoading = false,
  onSeek,
  onVolumeChange
}) => {
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [dragVolume, setDragVolume] = useState(0);
  const volumeRef = useRef<HTMLDivElement>(null);
  const dragVolumeRef = useRef(0);

  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [dragSeek, setDragSeek] = useState(0);
  const seekRef = useRef<HTMLDivElement>(null);
  const dragSeekRef = useRef(0);

  const getVolumeFromEvent = (clientX: number) => {
    if (!volumeRef.current) return 0;
    const rect = volumeRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    return percentage * 100;
  };

  const getSeekFromEvent = (clientX: number) => {
    if (!seekRef.current || !duration) return 0;
    const rect = seekRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    return percentage * duration;
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const newVol = getVolumeFromEvent(e.clientX);
    setDragVolume(newVol);
    dragVolumeRef.current = newVol;
    setIsDraggingVolume(true);
  };

  const handleSeekMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!duration) return;
    const newTime = getSeekFromEvent(e.clientX);
    setDragSeek(newTime);
    dragSeekRef.current = newTime;
    setIsDraggingSeek(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingVolume) {
        const val = getVolumeFromEvent(e.clientX);
        setDragVolume(val);
        dragVolumeRef.current = val;
      }
      if (isDraggingSeek) {
        const val = getSeekFromEvent(e.clientX);
        setDragSeek(val);
        dragSeekRef.current = val;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingVolume) {
        setIsDraggingVolume(false);
        onVolumeChange?.(dragVolumeRef.current);
      }
      if (isDraggingSeek) {
        setIsDraggingSeek(false);
        onSeek?.(dragSeekRef.current);
      }
    };

    if (isDraggingVolume || isDraggingSeek) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVolume, isDraggingSeek, onVolumeChange, onSeek, duration]);

  const currentVolume = isDraggingVolume ? dragVolume : volume;
  const currentPosition = isDraggingSeek ? dragSeek : position;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spotify-dark-gray border-t border-spotify-light-gray p-3 pb-safe">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        <div className="w-full md:flex-1 min-w-0 flex items-center justify-between md:justify-start">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-spotify-subtext">Now Playing</div>
            <div className="font-medium truncate text-spotify-green text-sm flex items-center gap-2">
              {isLoading && <Loader2 className="w-3 h-3 animate-spin text-spotify-green" />}
              {currentTitle || 'Not Playing'}
            </div>
            {currentArtist && (
              <div className="text-xs text-spotify-subtext truncate">
                {currentArtist}
              </div>
            )}
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
            <span>{formatTime(currentPosition)}</span>
            <div 
              ref={seekRef}
              className="flex-1 relative h-4 cursor-pointer group touch-none flex items-center"
              onMouseDown={handleSeekMouseDown}
            >
               <div className="absolute w-full h-1 bg-gray-600 rounded-full" />
               <div 
                 className={`absolute h-1 rounded-full transition-colors duration-100 ease-linear ${isDraggingSeek ? 'bg-spotify-green' : 'bg-white group-hover:bg-spotify-green'}`}
                 style={{ width: `${duration > 0 ? (currentPosition / duration) * 100 : 0}%` }}
               />
               <div 
                  className={`absolute h-3 w-3 bg-white rounded-full shadow transition-opacity duration-100 ${isDraggingSeek ? 'opacity-100' : 'group-hover:opacity-100 opacity-0'}`}
                  style={{ 
                      left: `${duration > 0 ? (currentPosition / duration) * 100 : 0}%`,
                      transform: 'translateX(-50%)'
                  }}
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
              className="w-24 relative h-4 cursor-pointer group flex items-center"
              onMouseDown={handleVolumeMouseDown}
           >
              <div className="absolute w-full h-1 bg-gray-600 rounded-full" />
              <div 
                className={`absolute h-1 rounded-full transition-colors duration-75 ease-linear ${isDraggingVolume ? 'bg-spotify-green' : 'bg-white group-hover:bg-spotify-green'}`}
                style={{ width: `${currentVolume}%` }}
              />
              <div 
                  className={`absolute h-3 w-3 bg-white rounded-full shadow transition-opacity duration-100 ${isDraggingVolume ? 'opacity-100' : 'group-hover:opacity-100 opacity-0'}`}
                  style={{ 
                      left: `${currentVolume}%`,
                      transform: 'translateX(-50%)'
                  }}
               />
           </div>
        </div>
      </div>
    </div>
  );
};
