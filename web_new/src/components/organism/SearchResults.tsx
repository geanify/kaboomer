import React from 'react';
import type { SearchResult } from '../../types';
import { TrackItem } from '../molecules/TrackItem';

interface SearchResultsProps {
  results: SearchResult[];
  onPlay: (track: SearchResult) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, onPlay }) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-2 mb-24">
      <h2 className="text-xl font-bold mb-4">Results</h2>
      {results.map((track) => (
        <TrackItem key={track.id} track={track} onPlay={onPlay} />
      ))}
    </div>
  );
};

