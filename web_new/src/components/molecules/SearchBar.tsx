import React from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl mx-auto">
      <Input 
        placeholder="Search for songs or paste URL..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button type="submit">Search</Button>
    </form>
  );
};



