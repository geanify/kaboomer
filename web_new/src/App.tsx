import { useEffect, useState } from 'react';
import { SearchBar } from './components/molecules/SearchBar';
import { SearchResults } from './components/organism/SearchResults';
import { NowPlaying } from './components/organism/NowPlaying';
import { Queue } from './components/organism/Queue';
import type { SearchResult, PlaylistItem } from './types';

function App() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [queue, setQueue] = useState<PlaylistItem[]>([]);
  const [currentTitle, setCurrentTitle] = useState('');
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  const search = async (query: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const play = async (track: SearchResult) => {
    try {
      await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: track.url, title: track.title, id: track.id }),
      });
      // Clear results after playing (optional)
      // setSearchResults([]);
      updateStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const addToQueue = async (track: SearchResult) => {
    try {
      await fetch('/api/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: track.url, title: track.title, id: track.id }),
      });
      updateStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const playBatch = async (tracks: SearchResult[]) => {
    try {
      await fetch('/api/play_batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tracks.map(t => ({ url: t.url, title: t.title, id: t.id }))),
      });
      updateStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const addToQueueBatch = async (tracks: SearchResult[]) => {
    try {
      await fetch('/api/queue/add_batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tracks.map(t => ({ url: t.url, title: t.title, id: t.id }))),
      });
      updateStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const control = async (action: string, value?: number) => {
    try {
      await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
      setTimeout(updateStatus, 500);
    } catch (err) {
      console.error(err);
    }
  };

  const playQueueItem = async (index: number) => {
    try {
      await fetch('/api/queue/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      updateStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async () => {
    try {
      const statusRes = await fetch('/api/status');
      const statusData = await statusRes.json();
      setCurrentTitle(statusData.current_title);
      setPosition(statusData.position || 0);
      setDuration(statusData.duration || 0);
      setIsLoading(statusData.is_loading || false);
      if (typeof statusData.volume === 'number') {
        setVolume(statusData.volume);
      }

      const queueRes = await fetch('/api/queue');
      const queueData = await queueRes.json();
      if (Array.isArray(queueData)) {
          setQueue(queueData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-spotify-black p-4 md:p-8">
      <header className="mb-4 md:mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-spotify-green mb-1 md:mb-2">Kaboomer</h1>
        <p className="text-spotify-subtext text-sm md:text-base">Your private audio sanctuary</p>
      </header>

      <main className="max-w-4xl mx-auto pb-32">
        <SearchBar onSearch={search} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 md:mt-8">
            <div>
                <SearchResults 
                  results={searchResults} 
                  onPlay={play} 
                  onAddToQueue={addToQueue}
                  onPlayAll={() => playBatch(searchResults)}
                  onAddToQueueAll={() => addToQueueBatch(searchResults)}
                />
            </div>
            <div>
                <Queue items={queue} onPlay={playQueueItem} />
            </div>
        </div>
      </main>

      <NowPlaying 
        currentTitle={currentTitle}
        isPlaying={!!currentTitle}
        position={position}
        duration={duration}
        volume={volume}
        isLoading={isLoading}
        onPrev={() => control('prev')}
        onNext={() => control('next')}
        onTogglePlay={() => control('pause')}
        onSeek={(time) => control('seek', time)}
        onVolumeChange={(vol) => control('volume', vol)}
      />
    </div>
  );
}

export default App;
