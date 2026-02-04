import { useRef, useState, useEffect } from 'react';
import { useTimeline } from '../../contexts/TimelineContext';
import { TimelineClip as TimelineClipType, MediaLibraryItem } from '../../types/timeline';
import { TimelineClip } from './TimelineClip';
import { Lock, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react';

const PIXELS_PER_SECOND = 50;
const TRACK_HEIGHT = 80;
const RULER_HEIGHT = 40;

const getTimeInterval = (zoom: number) => {
  if (zoom >= 4) return 1;
  if (zoom >= 2) return 2;
  if (zoom >= 1) return 5;
  if (zoom >= 0.5) return 10;
  if (zoom >= 0.25) return 20;
  return 30;
};

export function Timeline() {
  const { state, addClip, updateClip, setCurrentTime, clearSelection, setZoom } = useTimeline();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const pixelsPerSecond = PIXELS_PER_SECOND * state.zoom;
  const timelineWidth = state.duration * pixelsPerSecond;
  const timeInterval = getTimeInterval(state.zoom);

  const handleZoomIn = () => {
    setZoom(state.zoom * 1.5);
  };

  const handleZoomOut = () => {
    setZoom(state.zoom / 1.5);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / pixelsPerSecond;
    setCurrentTime(time);
    clearSelection();
  };

  const handleDrop = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    const item: MediaLibraryItem = JSON.parse(data);
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const track = state.tracks.find(t => t.id === trackId);
    if (!track) return;

    let startTime = 0;
    if (track.clips.length > 0) {
      const lastClip = track.clips.reduce((max, clip) =>
        (clip.startTime + clip.duration > max.startTime + max.duration) ? clip : max
      );
      startTime = lastClip.startTime + lastClip.duration;
    }

    addClip(trackId, {
      mediaUrl: item.url,
      mediaType: item.type,
      startTime,
      duration: item.duration || 5,
      trimStart: 0,
      trimEnd: item.duration || 5,
      layer: 0,
      thumbnail: item.thumbnail,
      volume: 1,
      opacity: 1,
    });

    setCurrentTime(startTime);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handlePlayheadDragStart = () => {
    setIsDraggingPlayhead(true);
  };

  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = Math.max(0, x / pixelsPerSecond);
      setCurrentTime(time);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, pixelsPerSecond, setCurrentTime]);

  const getTrackColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-900/30 border-blue-700';
      case 'audio':
        return 'bg-green-900/30 border-green-700';
      case 'overlay':
        return 'bg-purple-900/30 border-purple-700';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
      <div className="flex">
        <div className="w-40 flex-shrink-0 bg-gray-950 border-r border-gray-700">
          <div className="h-10 border-b border-gray-700 flex items-center justify-center gap-2 px-2">
            <button
              onClick={handleZoomOut}
              disabled={state.zoom <= 0.1}
              className="p-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-400 font-medium min-w-[45px] text-center">
              {Math.round(state.zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={state.zoom >= 10}
              className="p-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <div
            className="h-10 bg-gray-950 border-b border-gray-700 relative"
            style={{ width: `${timelineWidth}px` }}
          >
            {Array.from({ length: Math.ceil(state.duration / timeInterval) + 1 }).map((_, i) => {
              const time = i * timeInterval;
              const x = time * pixelsPerSecond;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-gray-700"
                  style={{ left: `${x}px` }}
                >
                  <span className="text-xs text-gray-400 ml-1 mt-1 inline-block">
                    {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 cursor-ew-resize z-10"
              style={{ left: `${state.currentTime * pixelsPerSecond}px` }}
              onMouseDown={handlePlayheadDragStart}
            >
              <div className="w-3 h-3 bg-red-500 -ml-1.5 -mt-0.5 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-auto" ref={timelineRef}>
        <div className="w-40 flex-shrink-0 bg-gray-950 border-r border-gray-700">
          {state.tracks.map((track) => (
            <div
              key={track.id}
              className="h-20 border-b border-gray-700 px-3 py-2 flex flex-col justify-center"
            >
              <div className="text-white text-xs font-medium truncate mb-1">
                {track.name}
              </div>
              <div className="flex gap-1">
                <button
                  className={`p-1 rounded transition-colors ${
                    track.muted
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  title={track.muted ? 'Unmute' : 'Mute'}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <button
                  className={`p-1 rounded transition-colors ${
                    track.locked
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  title={track.locked ? 'Unlock' : 'Lock'}
                >
                  <Lock className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 relative" onClick={handleTimelineClick}>
          {state.tracks.map((track) => (
            <div
              key={track.id}
              className={`h-20 border-b relative ${getTrackColor(track.type)}`}
              style={{ width: `${timelineWidth}px` }}
              onDrop={(e) => handleDrop(e, track.id)}
              onDragOver={handleDragOver}
            >
              {track.clips.map((clip) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  pixelsPerSecond={pixelsPerSecond}
                  trackHeight={TRACK_HEIGHT}
                  isSelected={state.selectedClipIds.includes(clip.id)}
                />
              ))}

              {Array.from({ length: Math.ceil(state.duration) + 1 }).map((_, i) => {
                const x = i * pixelsPerSecond;
                return (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-gray-800/50"
                    style={{ left: `${x}px` }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
