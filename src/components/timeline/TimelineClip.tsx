import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Video, Music } from 'lucide-react';
import { TimelineClip as TimelineClipType } from '../../types/timeline';
import { useTimeline } from '../../contexts/TimelineContext';

interface TimelineClipProps {
  clip: TimelineClipType;
  pixelsPerSecond: number;
  trackHeight: number;
  isSelected: boolean;
}

export function TimelineClip({ clip, pixelsPerSecond, trackHeight, isSelected }: TimelineClipProps) {
  const { updateClip, selectClip, removeClip } = useTimeline();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const initialStartTime = useRef(0);
  const initialDuration = useRef(0);

  const width = clip.duration * pixelsPerSecond;
  const left = clip.startTime * pixelsPerSecond;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    selectClip(clip.id, e.shiftKey);

    const rect = clipRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left;
    const edgeThreshold = 10;

    if (offsetX < edgeThreshold) {
      setIsResizing('left');
      dragStartX.current = e.clientX;
      initialStartTime.current = clip.startTime;
      initialDuration.current = clip.duration;
    } else if (offsetX > rect.width - edgeThreshold) {
      setIsResizing('right');
      dragStartX.current = e.clientX;
      initialDuration.current = clip.duration;
    } else {
      setIsDragging(true);
      dragStartX.current = e.clientX;
      initialStartTime.current = clip.startTime;
    }
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX.current;
      const deltaTime = deltaX / pixelsPerSecond;

      if (isDragging) {
        const newStartTime = Math.max(0, initialStartTime.current + deltaTime);
        updateClip(clip.id, { startTime: newStartTime });
      } else if (isResizing === 'left') {
        const newStartTime = Math.max(0, initialStartTime.current + deltaTime);
        const newDuration = initialDuration.current - deltaTime;
        if (newDuration > 0.1) {
          updateClip(clip.id, {
            startTime: newStartTime,
            duration: newDuration,
            trimStart: clip.trimStart + deltaTime,
          });
        }
      } else if (isResizing === 'right') {
        const newDuration = Math.max(0.1, initialDuration.current + deltaTime);
        updateClip(clip.id, {
          duration: newDuration,
          trimEnd: clip.trimStart + newDuration,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, clip.id, pixelsPerSecond, updateClip, clip.trimStart]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
      removeClip(clip.id);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected]);

  const getIcon = () => {
    switch (clip.mediaType) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (clip.mediaType) {
      case 'video':
        return isSelected ? 'bg-blue-600 border-blue-400' : 'bg-blue-700 border-blue-600';
      case 'audio':
        return isSelected ? 'bg-green-600 border-green-400' : 'bg-green-700 border-green-600';
      default:
        return isSelected ? 'bg-purple-600 border-purple-400' : 'bg-purple-700 border-purple-600';
    }
  };

  return (
    <div
      ref={clipRef}
      className={`absolute top-1 bottom-1 rounded border-2 cursor-move overflow-hidden ${getColor()} ${
        isDragging || isResizing ? 'opacity-70' : ''
      }`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="h-full p-1.5 flex items-center gap-1.5 text-white text-xs font-medium">
        {getIcon()}
        <span className="truncate flex-1">
          {clip.mediaUrl.split('/').pop()?.substring(0, 20) || 'Clip'}
        </span>
      </div>

      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      />
    </div>
  );
}
