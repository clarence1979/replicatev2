import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { TimelineState, Track, TimelineClip, TrackType } from '../types/timeline';

interface TimelineContextType {
  state: TimelineState;
  addTrack: (type: TrackType) => void;
  removeTrack: (trackId: string) => void;
  addClip: (trackId: string, clip: Omit<TimelineClip, 'id' | 'trackId'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  setVolume: (volume: number) => void;
  selectClip: (clipId: string, multi?: boolean) => void;
  clearSelection: () => void;
  splitClipAtTime: (clipId: string, time: number) => void;
  duplicateClip: (clipId: string) => void;
  resetTimeline: () => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

const initialState: TimelineState = {
  tracks: [
    { id: 'video-1', type: 'video', name: 'Video Track 1', clips: [], muted: false, locked: false },
    { id: 'audio-1', type: 'audio', name: 'Audio Track 1', clips: [], muted: false, locked: false },
    { id: 'overlay-1', type: 'overlay', name: 'Overlay Track 1', clips: [], muted: false, locked: false },
  ],
  currentTime: 0,
  duration: 60,
  zoom: 1,
  isPlaying: false,
  selectedClipIds: [],
  volume: 1,
};

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimelineState>(initialState);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!state.isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setState(prev => {
        const newTime = prev.currentTime + deltaTime;

        if (newTime >= prev.duration) {
          return { ...prev, currentTime: 0, isPlaying: false };
        }

        return { ...prev, currentTime: newTime };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying]);

  const addTrack = useCallback((type: TrackType) => {
    const trackNumber = state.tracks.filter(t => t.type === type).length + 1;
    const newTrack: Track = {
      id: `${type}-${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${trackNumber}`,
      clips: [],
      muted: false,
      locked: false,
    };
    setState(prev => ({ ...prev, tracks: [...prev.tracks, newTrack] }));
  }, [state.tracks]);

  const removeTrack = useCallback((trackId: string) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId),
    }));
  }, []);

  const addClip = useCallback((trackId: string, clip: Omit<TimelineClip, 'id' | 'trackId'>) => {
    const newClip: TimelineClip = {
      ...clip,
      id: `clip-${Date.now()}-${Math.random()}`,
      trackId,
    };

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      ),
      duration: Math.max(prev.duration, newClip.startTime + newClip.duration),
    }));
  }, []);

  const removeClip = useCallback((clipId: string) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(c => c.id !== clipId),
      })),
      selectedClipIds: prev.selectedClipIds.filter(id => id !== clipId),
    }));
  }, []);

  const updateClip = useCallback((clipId: string, updates: Partial<TimelineClip>) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        ),
      })),
    }));
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, prev.duration)) }));
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setState(prev => ({ ...prev, isPlaying: playing }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(zoom, 10)) }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume: Math.max(0, Math.min(volume, 1)) }));
  }, []);

  const selectClip = useCallback((clipId: string, multi = false) => {
    setState(prev => ({
      ...prev,
      selectedClipIds: multi
        ? prev.selectedClipIds.includes(clipId)
          ? prev.selectedClipIds.filter(id => id !== clipId)
          : [...prev.selectedClipIds, clipId]
        : [clipId],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedClipIds: [] }));
  }, []);

  const splitClipAtTime = useCallback((clipId: string, time: number) => {
    setState(prev => {
      let clipToSplit: TimelineClip | null = null;
      let trackId: string | null = null;

      for (const track of prev.tracks) {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clipToSplit = clip;
          trackId = track.id;
          break;
        }
      }

      if (!clipToSplit || !trackId) return prev;

      const splitPoint = time - clipToSplit.startTime;
      if (splitPoint <= 0 || splitPoint >= clipToSplit.duration) return prev;

      const firstClip: TimelineClip = {
        ...clipToSplit,
        id: `clip-${Date.now()}-1`,
        duration: splitPoint,
        trimEnd: clipToSplit.trimStart + splitPoint,
      };

      const secondClip: TimelineClip = {
        ...clipToSplit,
        id: `clip-${Date.now()}-2`,
        startTime: clipToSplit.startTime + splitPoint,
        duration: clipToSplit.duration - splitPoint,
        trimStart: clipToSplit.trimStart + splitPoint,
      };

      return {
        ...prev,
        tracks: prev.tracks.map(track =>
          track.id === trackId
            ? {
                ...track,
                clips: [
                  ...track.clips.filter(c => c.id !== clipId),
                  firstClip,
                  secondClip,
                ],
              }
            : track
        ),
      };
    });
  }, []);

  const duplicateClip = useCallback((clipId: string) => {
    setState(prev => {
      let clipToDuplicate: TimelineClip | null = null;
      let trackId: string | null = null;

      for (const track of prev.tracks) {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clipToDuplicate = clip;
          trackId = track.id;
          break;
        }
      }

      if (!clipToDuplicate || !trackId) return prev;

      const duplicatedClip: TimelineClip = {
        ...clipToDuplicate,
        id: `clip-${Date.now()}-dup`,
        startTime: clipToDuplicate.startTime + clipToDuplicate.duration,
      };

      return {
        ...prev,
        tracks: prev.tracks.map(track =>
          track.id === trackId
            ? { ...track, clips: [...track.clips, duplicatedClip] }
            : track
        ),
        duration: Math.max(prev.duration, duplicatedClip.startTime + duplicatedClip.duration),
      };
    });
  }, []);

  const resetTimeline = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <TimelineContext.Provider
      value={{
        state,
        addTrack,
        removeTrack,
        addClip,
        removeClip,
        updateClip,
        setCurrentTime,
        setIsPlaying,
        setZoom,
        setVolume,
        selectClip,
        clearSelection,
        splitClipAtTime,
        duplicateClip,
        resetTimeline,
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within TimelineProvider');
  }
  return context;
}
