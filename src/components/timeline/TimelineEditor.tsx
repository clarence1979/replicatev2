import { useState, useEffect } from 'react';
import { TimelineProvider, useTimeline } from '../../contexts/TimelineContext';
import { MediaLibrary } from './MediaLibrary';
import { PreviewCanvas } from './PreviewCanvas';
import { Timeline } from './Timeline';
import { PlaybackControls } from './PlaybackControls';
import { ExportModal } from './ExportModal';
import { MediaLibraryItem, ExportSettings } from '../../types/timeline';
import { getStoredGenerations, cleanupBrokenGenerations } from '../../utils/generationStorage';
import { Film, ArrowLeft } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface TimelineEditorProps {
  onBack?: () => void;
  isMobile?: boolean;
}

function TimelineEditorContent({ onBack, isMobile = false }: TimelineEditorProps) {
  const { state } = useTimeline();
  const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<MediaLibraryItem | null>(null);
  const ffmpegRef = useState(() => new FFmpeg())[0];
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  useEffect(() => {
    fetchGenerations();
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

      ffmpegRef.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });

      ffmpegRef.on('progress', ({ progress, time }) => {
        console.log(`FFmpeg progress: ${(progress * 100).toFixed(2)}% (${time}ms)`);
      });

      await ffmpegRef.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });
      setFfmpegLoaded(true);
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
    }
  };

  const fetchGenerations = async () => {
    const deletedCount = await cleanupBrokenGenerations();
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} broken generation(s) from the database`);
    }

    const { supabase } = await import('../../utils/supabase');

    const generations = await getStoredGenerations();
    const generationItems: MediaLibraryItem[] = generations.map((gen, index) => {
      const type = gen.generation_type as 'image' | 'video' | 'audio';
      let duration: number | undefined;

      if (type === 'video') {
        duration = 10;
      } else if (type === 'audio') {
        duration = 8;
      } else if (type === 'image') {
        duration = 5;
      }

      return {
        id: gen.id || `gen-${index}`,
        url: gen.content_url || '',
        type,
        thumbnail: gen.thumbnail_url || (type === 'image' ? gen.content_url : undefined),
        duration,
        name: gen.model_name || `Generation ${index + 1}`,
        createdAt: new Date(gen.created_at),
      };
    }).filter(item => item.url);

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: uploads } = await supabase
      .from('user_uploads')
      .select('*')
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false });

    const uploadItems: MediaLibraryItem[] = (uploads || []).map((upload) => {
      const type = upload.file_type as 'image' | 'video' | 'audio';
      let duration: number | undefined;

      if (type === 'video') {
        duration = upload.duration || 10;
      } else if (type === 'audio') {
        duration = upload.duration || 8;
      } else if (type === 'image') {
        duration = 5;
      }

      return {
        id: upload.id,
        url: upload.content_url,
        type,
        thumbnail: upload.thumbnail_url || (type === 'image' ? upload.content_url : undefined),
        duration,
        name: upload.file_name,
        createdAt: new Date(upload.created_at),
      };
    });

    setMediaItems([...generationItems, ...uploadItems].sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    ));
  };

  const handleExport = async (settings: ExportSettings) => {
    if (!ffmpegLoaded) {
      throw new Error('FFmpeg is not loaded yet. Please wait and try again.');
    }

    console.log('Exporting with settings:', settings);
    console.log('Timeline state:', state);

    const allClips = state.tracks.flatMap(track => track.clips);

    if (allClips.length === 0) {
      throw new Error('No clips on timeline to export');
    }

    allClips.sort((a, b) => a.startTime - b.startTime);

    const resolution = settings.resolution === '720p' ? { width: 1280, height: 720 }
                     : settings.resolution === '1080p' ? { width: 1920, height: 1080 }
                     : { width: 3840, height: 2160 };

    const videoClips = allClips.filter(c => c.mediaType === 'image' || c.mediaType === 'video');

    if (videoClips.length === 0) {
      throw new Error('No video or image clips to export');
    }

    if (videoClips.length > 20) {
      throw new Error('Too many clips. Please limit to 20 clips or fewer for optimal performance.');
    }

    try {
      const processedFiles: string[] = [];

      for (let i = 0; i < videoClips.length; i++) {
        const clip = videoClips[i];
        const ext = clip.mediaType === 'image' ? 'jpg' : 'mp4';
        const inputFileName = `input${i}.${ext}`;
        const processedFileName = `processed${i}.mp4`;

        console.log(`Fetching ${clip.mediaUrl}`);
        try {
          const fileData = await fetchFile(clip.mediaUrl);
          await ffmpegRef.writeFile(inputFileName, fileData);

          if (clip.mediaType === 'image') {
            await ffmpegRef.exec([
              '-loop', '1',
              '-i', inputFileName,
              '-t', clip.duration.toString(),
              '-vf', `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2:black`,
              '-r', settings.fps.toString(),
              '-c:v', 'libx264',
              '-preset', 'ultrafast',
              '-pix_fmt', 'yuv420p',
              processedFileName
            ]);
          } else {
            await ffmpegRef.exec([
              '-i', inputFileName,
              '-vf', `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2:black`,
              '-r', settings.fps.toString(),
              '-c:v', 'libx264',
              '-preset', 'ultrafast',
              '-pix_fmt', 'yuv420p',
              '-an',
              processedFileName
            ]);
          }

          processedFiles.push(processedFileName);

          try {
            await ffmpegRef.deleteFile(inputFileName);
          } catch (e) {}

        } catch (err) {
          console.error(`Failed to process ${clip.mediaUrl}:`, err);
          throw new Error(`Failed to process media file ${i + 1}. Make sure all clips are accessible.`);
        }
      }

      if (processedFiles.length === 1) {
        const data = await ffmpegRef.readFile(processedFiles[0]);
        const blob = new Blob([data], { type: `video/${settings.format}` });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${Date.now()}.${settings.format}`;
        a.click();

        URL.revokeObjectURL(url);
      } else {
        const concatFileContent = processedFiles.map(f => `file '${f}'`).join('\n');
        await ffmpegRef.writeFile('concat.txt', new TextEncoder().encode(concatFileContent));

        const finalPreset = settings.quality === 'high' ? 'slow' : settings.quality === 'medium' ? 'medium' : 'fast';

        await ffmpegRef.exec([
          '-f', 'concat',
          '-safe', '0',
          '-i', 'concat.txt',
          '-c:v', settings.format === 'mp4' ? 'libx264' : 'libvpx-vp9',
          '-preset', finalPreset,
          '-crf', settings.quality === 'high' ? '18' : settings.quality === 'medium' ? '23' : '28',
          '-pix_fmt', 'yuv420p',
          `output.${settings.format}`
        ]);

        const data = await ffmpegRef.readFile(`output.${settings.format}`);
        const blob = new Blob([data], { type: `video/${settings.format}` });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${Date.now()}.${settings.format}`;
        a.click();

        URL.revokeObjectURL(url);

        try {
          await ffmpegRef.deleteFile('concat.txt');
          await ffmpegRef.deleteFile(`output.${settings.format}`);
        } catch (e) {}
      }

      for (const file of processedFiles) {
        try {
          await ffmpegRef.deleteFile(file);
        } catch (e) {}
      }

      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-6 h-6 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Video Timeline Editor</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Create professional videos by combining your AI-generated media
                </p>
              </div>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Generator
              </button>
            )}
          </div>
        </div>

        {isMobile && (
          <div className="bg-yellow-900 border-l-4 border-yellow-600 text-yellow-200 p-4 mx-4">
            <p className="text-sm">
              <strong>Note:</strong> The Video Timeline Editor is optimized for desktop devices. Some features may be limited on mobile.
            </p>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {!isMobile && (
            <div className="w-80 flex-shrink-0">
              <MediaLibrary
                items={mediaItems}
                onDragStart={setDraggedItem}
                onUpload={fetchGenerations}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <PreviewCanvas />
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-white font-semibold mb-4">Quick Guide</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      1
                    </div>
                    <p>Drag media from the library onto the timeline tracks</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      2
                    </div>
                    <p>Resize clips by dragging their edges to trim</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      3
                    </div>
                    <p>Move clips by dragging them horizontally</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      4
                    </div>
                    <p>Press Delete/Backspace to remove selected clips</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      5
                    </div>
                    <p>Use playback controls to preview your composition</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      6
                    </div>
                    <p>Click Export when ready to render your final video</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h4 className="text-white font-semibold mb-3 text-sm">Track Colors</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-700 rounded border border-blue-600" />
                      <span className="text-gray-300">Video Track (Blue)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-700 rounded border border-green-600" />
                      <span className="text-gray-300">Audio Track (Green)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-700 rounded border border-purple-600" />
                      <span className="text-gray-300">Overlay Track (Purple)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4">
              <PlaybackControls onExport={() => setIsExportModalOpen(true)} />
            </div>

            <div className="flex-1 min-h-[400px]">
              <Timeline />
            </div>
          </div>
        </div>

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
        />
    </div>
  );
}

export function TimelineEditor({ onBack, isMobile }: TimelineEditorProps) {
  return (
    <TimelineProvider>
      <TimelineEditorContent onBack={onBack} isMobile={isMobile} />
    </TimelineProvider>
  );
}
