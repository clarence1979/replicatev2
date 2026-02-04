import { Play, Pause, SkipBack, SkipForward, Volume2, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useTimeline } from '../../contexts/TimelineContext';

interface PlaybackControlsProps {
  onExport: () => void;
}

export function PlaybackControls({ onExport }: PlaybackControlsProps) {
  const { state, setIsPlaying, setCurrentTime, setZoom, setVolume } = useTimeline();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const getActualEndTime = () => {
    let maxEndTime = 0;
    for (const track of state.tracks) {
      for (const clip of track.clips) {
        const clipEnd = clip.startTime + clip.duration;
        if (clipEnd > maxEndTime) {
          maxEndTime = clipEnd;
        }
      }
    }
    return maxEndTime || state.duration;
  };

  const handleJumpToStart = () => {
    setCurrentTime(0);
  };

  const handleJumpToEnd = () => {
    setCurrentTime(getActualEndTime());
  };

  const handlePlayPause = () => {
    setIsPlaying(!state.isPlaying);
  };

  const handleZoomIn = () => {
    setZoom(state.zoom * 1.2);
  };

  const handleZoomOut = () => {
    setZoom(state.zoom / 1.2);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value) / 100);
  };

  return (
    <div className="bg-gray-900 border-t border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleJumpToStart}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
              title="Jump to start"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
              title={state.isPlaying ? 'Pause' : 'Play'}
            >
              {state.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={handleJumpToEnd}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
              title="Jump to end"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="text-white font-mono text-sm bg-gray-800 px-3 py-1 rounded">
            {formatTime(state.currentTime)} / {formatTime(getActualEndTime())}
          </div>

          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(state.volume * 100)}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${state.volume * 100}%, #374151 ${state.volume * 100}%, #374151 100%)`
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-white text-sm font-mono w-16 text-center">
              {Math.round(state.zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
