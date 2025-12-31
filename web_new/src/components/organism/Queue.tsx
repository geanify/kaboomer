import React from 'react';
import type { PlaylistItem } from '../../types';
import { Play, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '../atoms/Button';

interface QueueProps {
  items: PlaylistItem[];
  onPlay?: (index: number) => void;
  onClear?: () => void;
}

export const Queue: React.FC<QueueProps> = ({ items, onPlay, onClear }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2 mb-24 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Queue</h2>
        {onClear && items.length > 0 && (
          <Button 
            variant="icon" 
            onClick={onClear} 
            className="text-spotify-subtext hover:text-white"
            title="Clear Queue"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>
      {items.map((item, index) => (
        <div 
          key={index}
          onClick={() => onPlay && onPlay(index)}
          className={`flex items-center gap-4 p-3 rounded-md cursor-pointer group ${
            item.current ? 'bg-spotify-light-gray text-spotify-green' : 'hover:bg-spotify-light-gray'
          }`}
        >
          <div className="w-6 md:w-8 text-center text-sm text-spotify-subtext flex justify-center group-hover:text-white">
            {item.status === 'downloading' ? (
                <Loader2 className="w-4 h-4 animate-spin text-spotify-green" />
            ) : item.status === 'error' ? (
                <div title="Error downloading">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
            ) : item.current ? (
                <Play className="w-4 h-4 fill-current" />
            ) : (
                <span className="md:group-hover:hidden">{index + 1}</span>
            )}
            {!item.current && item.status !== 'downloading' && item.status !== 'error' && (
                <Play className="w-4 h-4 fill-white hidden md:group-hover:block" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate text-sm md:text-base">
              {item.title || item.filename}
            </h3>
            {/* Disabled artist display in queue for now per request scope, but field exists if needed */}
            {item.status === 'error' && (
                <p className="text-xs text-red-500 mt-1">Download failed</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
