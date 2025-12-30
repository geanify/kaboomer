import React from 'react';
import type { SearchResult } from '../../types';
import { Plus, Play } from 'lucide-react';
import { Button } from '../atoms/Button';

interface TrackItemProps {
  track: SearchResult;
  onPlay: (track: SearchResult) => void;
  onAddToQueue?: (track: SearchResult) => void;
}

export const TrackItem: React.FC<TrackItemProps> = ({ track, onPlay, onAddToQueue }) => {
  return (
    <div 
      className="flex items-center gap-4 p-2 rounded-md hover:bg-spotify-light-gray group relative"
    >
      <div className="relative cursor-pointer min-w-[3rem]" onClick={() => onPlay(track)}>
        <img src={track.thumbnail} alt={track.title} className="w-12 h-12 object-cover rounded group-hover:opacity-50 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
           <Play className="w-6 h-6 fill-white text-white" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(track)}>
        <h3 className="font-medium truncate text-white group-hover:text-spotify-green text-sm md:text-base">{track.title}</h3>
        <p className="text-xs md:text-sm text-spotify-subtext truncate">{track.uploader}</p>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
          <div className="text-xs md:text-sm text-spotify-subtext whitespace-nowrap">
            {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
          </div>
          {onAddToQueue && (
            <Button 
                variant="icon" 
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToQueue(track);
                }}
                className="md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-700 rounded-full"
                title="Add to Queue"
            >
                <Plus className="w-5 h-5 text-gray-400 hover:text-white" />
            </Button>
          )}
      </div>
    </div>
  );
};

