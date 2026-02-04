import { useEffect, useRef, useState } from 'react';
import { useTimeline } from '../../contexts/TimelineContext';
import { Maximize2, Minimize2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, setIsPlaying, setCurrentTime } = useTimeline();
  const mediaCache = useRef<Map<string, HTMLImageElement | HTMLVideoElement>>(new Map());
  const [loadedMedia, setLoadedMedia] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastSyncTimeRef = useRef<number>(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const handleSkipBack = () => {
    setCurrentTime(Math.max(0, state.currentTime - 1));
  };

  const handleSkipForward = () => {
    setCurrentTime(Math.min(state.duration, state.currentTime + 1));
  };

  const handlePlayPause = () => {
    setIsPlaying(!state.isPlaying);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  useEffect(() => {
    const allClips = state.tracks.flatMap(track => track.clips);

    allClips.forEach(clip => {
      if (!mediaCache.current.has(clip.mediaUrl)) {
        if (clip.mediaType === 'video') {
          const video = document.createElement('video');
          video.src = clip.mediaUrl;
          video.crossOrigin = 'anonymous';
          video.preload = 'auto';
          video.muted = false;
          video.playsInline = true;
          video.autoplay = false;
          video.volume = state.volume;

          video.onloadeddata = () => {
            setLoadedMedia(prev => new Set(prev).add(clip.mediaUrl));
          };

          video.onerror = (e) => {
            console.error('Video loading error:', clip.mediaUrl, e, video.error);
          };

          video.load();
          mediaCache.current.set(clip.mediaUrl, video);
        } else if (clip.mediaType === 'image') {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            setLoadedMedia(prev => new Set(prev).add(clip.mediaUrl));
          };
          img.onerror = (e) => {
            console.error('Image loading error:', clip.mediaUrl, e);
          };
          img.src = clip.mediaUrl;
          mediaCache.current.set(clip.mediaUrl, img);
        }
      }
    });
  }, [state.tracks, state.volume]);

  useEffect(() => {
    const now = Date.now();
    const shouldSync = now - lastSyncTimeRef.current > 50;

    if (shouldSync) {
      lastSyncTimeRef.current = now;
    }

    const activeClips = state.tracks
      .flatMap(track => track.clips)
      .filter(clip => {
        const clipEndTime = clip.startTime + clip.duration;
        return state.currentTime >= clip.startTime && state.currentTime < clipEndTime;
      })
      .filter(clip => clip.mediaType === 'video');

    mediaCache.current.forEach((media, url) => {
      if (media instanceof HTMLVideoElement) {
        const activeClip = activeClips.find(clip => clip.mediaUrl === url);

        if (activeClip && state.isPlaying) {
          const clipTime = state.currentTime - activeClip.startTime;
          const targetTime = Math.max(0, Math.min(clipTime, media.duration || 0));

          if (shouldSync && Math.abs(media.currentTime - targetTime) > 0.25) {
            media.currentTime = targetTime;
          }

          if (media.paused) {
            const playPromise = media.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                if (err.name !== 'AbortError') {
                  console.error('Error playing video:', err);
                }
              });
            }
          }
        } else if (!media.paused) {
          media.pause();
        }
      }
    });
  }, [state.isPlaying, state.tracks, state.currentTime]);

  useEffect(() => {
    if (state.isPlaying) return;

    const activeClips = state.tracks
      .flatMap(track => track.clips)
      .filter(clip => {
        const clipEndTime = clip.startTime + clip.duration;
        return state.currentTime >= clip.startTime && state.currentTime < clipEndTime;
      })
      .filter(clip => clip.mediaType === 'video');

    mediaCache.current.forEach((media, url) => {
      if (media instanceof HTMLVideoElement) {
        const activeClip = activeClips.find(clip => clip.mediaUrl === url);

        if (activeClip) {
          const clipTime = state.currentTime - activeClip.startTime;
          const targetTime = Math.max(0, Math.min(clipTime, media.duration || 0));
          if (Math.abs(media.currentTime - targetTime) > 0.05) {
            media.currentTime = targetTime;
          }
        }
      }
    });
  }, [state.currentTime, state.tracks, state.isPlaying]);

  useEffect(() => {
    mediaCache.current.forEach((media) => {
      if (media instanceof HTMLVideoElement) {
        media.volume = state.volume;
      }
    });
  }, [state.volume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number | null = null;

    const render = () => {
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentClips = state.tracks
        .flatMap(track => track.clips)
        .filter(clip => {
          const clipEndTime = clip.startTime + clip.duration;
          return state.currentTime >= clip.startTime && state.currentTime < clipEndTime;
        })
        .sort((a, b) => {
          const order = { video: 0, image: 1, audio: 2 };
          return (order[a.mediaType] || 3) - (order[b.mediaType] || 3);
        });

      if (currentClips.length === 0) {
        ctx.fillStyle = '#4B5563';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `No clips at ${Math.floor(state.currentTime)}s`,
          canvas.width / 2,
          canvas.height / 2
        );
      } else {
        currentClips.forEach(clip => {
          const media = mediaCache.current.get(clip.mediaUrl);
          if (!media) return;

          try {
            if (media instanceof HTMLVideoElement) {
              if (media.readyState >= 2 && media.videoWidth > 0) {
                ctx.drawImage(media, 0, 0, canvas.width, canvas.height);
              } else {
                ctx.fillStyle = '#374151';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Loading video...', canvas.width / 2, canvas.height / 2);
              }
            } else if (media instanceof HTMLImageElement && media.complete) {
              ctx.drawImage(media, 0, 0, canvas.width, canvas.height);
            }
          } catch (err) {
            console.error('Error drawing media:', err);
          }
        });
      }

      ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(
        `${Math.floor(state.currentTime)}s`,
        20,
        20
      );

      if (state.isPlaying) {
        animationId = requestAnimationFrame(render);
      }
    };

    if (state.isPlaying) {
      render();
    } else {
      render();
    }

    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [state.currentTime, state.duration, state.tracks, state.isPlaying, loadedMedia]);

  const previewContent = (
    <>
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <span className="text-white text-sm font-medium">Preview</span>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className={`bg-gray-950 flex items-center justify-center ${isFullscreen ? 'flex-1' : 'aspect-video p-4'}`}>
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain"
        />
      </div>
    </>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {previewContent}

        <div className="bg-gray-900 border-t border-gray-700 px-6 py-4">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSkipBack}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                title="Skip backward"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
                title={state.isPlaying ? 'Pause' : 'Play'}
              >
                {state.isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7" />
                )}
              </button>

              <button
                onClick={handleSkipForward}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                title="Skip forward"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            <div className="text-white font-mono text-lg bg-gray-800 px-4 py-2 rounded">
              {formatTime(state.currentTime)} / {formatTime(state.duration)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {previewContent}
    </div>
  );
}
