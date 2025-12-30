import React from 'react';
import type { PlaylistItem } from '../../types';
import { Play } from 'lucide-react';

interface QueueProps {
  items: PlaylistItem[];
}

export const Queue: React.FC<QueueProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2 mb-24 mt-8">
      <h2 className="text-xl font-bold mb-4">Queue</h2>
      {items.map((item, index) => (
        <div 
          key={index}
          className={`flex items-center gap-4 p-3 rounded-md ${
            item.current ? 'bg-spotify-light-gray text-spotify-green' : 'hover:bg-spotify-light-gray'
          }`}
        >
          <div className="w-8 text-center text-sm text-spotify-subtext flex justify-center">
            {item.current ? <Play className="w-4 h-4 fill-current" /> : index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">
              {item.title || item.filename}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
};

