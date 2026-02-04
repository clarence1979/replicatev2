export type TrackType = 'video' | 'audio' | 'overlay';

export interface TimelineClip {
  id: string;
  trackId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  layer: number;
  thumbnail?: string;
  volume?: number;
  opacity?: number;
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  clips: TimelineClip[];
  muted: boolean;
  locked: boolean;
}

export interface TimelineState {
  tracks: Track[];
  currentTime: number;
  duration: number;
  zoom: number;
  isPlaying: boolean;
  selectedClipIds: string[];
  volume: number;
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '4k';
  format: 'mp4' | 'webm';
  fps: 24 | 30 | 60;
  quality: 'low' | 'medium' | 'high';
}

export interface MediaLibraryItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  thumbnail?: string;
  duration?: number;
  name: string;
  createdAt: Date;
}
