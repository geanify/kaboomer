export interface SearchResult {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  url: string;
  thumbnail: string;
}

export interface PlaylistItem {
  filename: string;
  title?: string;
  current?: boolean;
  playing?: boolean;
}

