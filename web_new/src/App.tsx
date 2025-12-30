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

  const search = async (query: string) => {
    try {
      if (query.startsWith('http')) {
        await play({ url: query, title: 'Direct URL' } as any);
        return;
      }
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
        body: JSON.stringify({ url: track.url, title: track.title }),
      });
      // Clear results after playing (optional)
      // setSearchResults([]);
      updateStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const control = async (action: string) => {
    try {
      await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setTimeout(updateStatus, 500);
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
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-spotify-green mb-2">Kaboomer</h1>
        <p className="text-spotify-subtext">Your private audio sanctuary</p>
      </header>

      <main className="max-w-4xl mx-auto">
        <SearchBar onSearch={search} />
        
        <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
                <SearchResults results={searchResults} onPlay={play} />
            </div>
            <div>
                <Queue items={queue} />
            </div>
        </div>
      </main>

      <NowPlaying 
        currentTitle={currentTitle}
        isPlaying={!!currentTitle}
        position={position}
        duration={duration}
        onPrev={() => control('prev')}
        onNext={() => control('next')}
        onTogglePlay={() => control('pause')}
      />
    </div>
  );
}

export default App;
