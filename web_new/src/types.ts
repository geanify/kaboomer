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

export interface PlayerStatus {
  current_title: string;
  position: number;
  duration: number;
}
