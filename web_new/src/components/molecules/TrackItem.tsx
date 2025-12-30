import React from 'react';
import type { SearchResult } from '../../types';

interface TrackItemProps {
  track: SearchResult;
  onPlay: (track: SearchResult) => void;
}

export const TrackItem: React.FC<TrackItemProps> = ({ track, onPlay }) => {
  return (
    <div 
      onClick={() => onPlay(track)}
      className="flex items-center gap-4 p-2 rounded-md hover:bg-spotify-light-gray cursor-pointer group"
    >
      <img src={track.thumbnail} alt={track.title} className="w-12 h-12 object-cover rounded" />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate text-white group-hover:text-spotify-green">{track.title}</h3>
        <p className="text-sm text-spotify-subtext truncate">{track.uploader}</p>
      </div>
      <div className="text-sm text-spotify-subtext">
        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};

