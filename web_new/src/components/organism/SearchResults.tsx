import React from 'react';
import type { SearchResult } from '../../types';
import { TrackItem } from '../molecules/TrackItem';
import { Button } from '../atoms/Button';
import { Play, Plus } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  onPlay: (track: SearchResult) => void;
  onAddToQueue?: (track: SearchResult) => void;
  onPlayAll?: () => void;
  onAddToQueueAll?: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, onPlay, onAddToQueue, onPlayAll, onAddToQueueAll }) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-2 mb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Results</h2>
        <div className="flex gap-2">
           {onPlayAll && (
               <Button variant="secondary" onClick={onPlayAll} className="flex items-center gap-2 text-sm px-3 py-1">
                   <Play className="w-4 h-4" /> Play All
               </Button>
           )}
           {onAddToQueueAll && (
               <Button variant="secondary" onClick={onAddToQueueAll} className="flex items-center gap-2 text-sm px-3 py-1">
                   <Plus className="w-4 h-4" /> Add All
               </Button>
           )}
        </div>
      </div>
      {results.map((track) => (
        <TrackItem key={track.id} track={track} onPlay={onPlay} onAddToQueue={onAddToQueue} />
      ))}
    </div>
  );
};

