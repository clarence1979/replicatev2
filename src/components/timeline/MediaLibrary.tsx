import { useState, useMemo, useRef } from 'react';
import { Image as ImageIcon, Video, Music, Search, Filter, Upload, Trash2 } from 'lucide-react';
import { MediaLibraryItem } from '../../types/timeline';

interface MediaLibraryProps {
  items: MediaLibraryItem[];
  onDragStart: (item: MediaLibraryItem) => void;
  onUpload?: () => void;
}

export function MediaLibrary({ items, onDragStart, onUpload }: MediaLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [items, searchTerm, filterType]);

  const handleDragStart = (e: React.DragEvent, item: MediaLibraryItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(item);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { supabase } = await import('../../utils/supabase');

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('replicate-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('replicate-images')
          .getPublicUrl(fileName);

        let fileType: 'image' | 'video' | 'audio' = 'image';
        if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type.startsWith('audio/')) fileType = 'audio';

        let thumbnailUrl: string | null = null;
        if (fileType === 'video') {
          thumbnailUrl = await generateVideoThumbnail(file);
        }

        const { error: dbError } = await supabase
          .from('user_uploads')
          .insert({
            file_name: file.name,
            file_type: fileType,
            content_url: publicUrl,
            file_size: file.size,
            thumbnail_url: thumbnailUrl,
          });

        if (dbError) {
          console.error('Database error:', dbError);
        }
      }

      if (onUpload) onUpload();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generateVideoThumbnail = async (file: File): Promise<string | null> => {
    return new Promise(async (resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
          video.currentTime = Math.min(1, video.duration / 2);
        };

        video.onseeked = async () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              canvas.toBlob(async (blob) => {
                if (blob) {
                  const { supabase } = await import('../../utils/supabase');
                  const thumbnailFileName = `thumbnail-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

                  const { error: uploadError } = await supabase.storage
                    .from('replicate-images')
                    .upload(thumbnailFileName, blob);

                  if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                      .from('replicate-images')
                      .getPublicUrl(thumbnailFileName);
                    resolve(publicUrl);
                  } else {
                    console.error('Thumbnail upload error:', uploadError);
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              }, 'image/jpeg', 0.7);
            } else {
              resolve(null);
            }
          } catch (err) {
            console.error('Error generating thumbnail:', err);
            resolve(null);
          }
        };

        video.onerror = () => {
          resolve(null);
        };

        video.src = URL.createObjectURL(file);
      } catch (err) {
        console.error('Error in generateVideoThumbnail:', err);
        resolve(null);
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      await uploadFiles(files);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files) {
      await uploadFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDelete = async (item: MediaLibraryItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { supabase } = await import('../../utils/supabase');

      const urlPath = new URL(item.url).pathname;
      const fileName = urlPath.split('/').pop();

      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('replicate-images')
          .remove([fileName]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      }

      if (item.thumbnail) {
        const thumbnailPath = new URL(item.thumbnail).pathname;
        const thumbnailFileName = thumbnailPath.split('/').pop();

        if (thumbnailFileName) {
          await supabase.storage
            .from('replicate-images')
            .remove([thumbnailFileName]);
        }
      }

      const { error: dbError } = await supabase
        .from('user_uploads')
        .delete()
        .eq('id', item.id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
      }

      if (onUpload) onUpload();
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gray-900 border-r border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Media Library
          </h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              filterType === 'image'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              filterType === 'video'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              filterType === 'audio'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Audio
          </button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto p-3 space-y-2 transition-colors ${
          isDragOver ? 'bg-blue-900/20 border-2 border-blue-500 border-dashed' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-900/30 backdrop-blur-sm z-10 pointer-events-none">
            <div className="text-center">
              <Upload className="w-16 h-16 text-blue-400 mx-auto mb-3" />
              <p className="text-white text-lg font-semibold">Drop files here to upload</p>
              <p className="text-gray-300 text-sm mt-1">Supports images, videos, and audio</p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-blue-400 animate-pulse" />
              <div>
                <p className="text-white text-sm font-medium">Uploading files...</p>
                <p className="text-gray-400 text-xs">Please wait while your files are being uploaded</p>
              </div>
            </div>
          </div>
        )}

        {filteredItems.length === 0 && !uploading ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            {items.length === 0 ? (
              <div>
                <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="font-medium">No media yet</p>
                <p className="text-xs mt-2">Drag files here or click Upload</p>
              </div>
            ) : (
              'No matching media found'
            )}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              className="bg-gray-800 rounded-lg p-2 cursor-move hover:bg-gray-750 transition-colors border border-gray-700 hover:border-blue-500 group relative"
            >
              <div className="aspect-video bg-gray-900 rounded mb-2 flex items-center justify-center overflow-hidden relative">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                ) : item.type === 'audio' ? (
                  <Music className="w-8 h-8 text-gray-600" />
                ) : (
                  <div className="w-8 h-8 text-gray-600">{getIcon(item.type)}</div>
                )}
                <button
                  onClick={(e) => handleDelete(item, e)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete media"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-medium truncate">{item.name}</div>
                  {item.duration && (
                    <div className="text-xs text-gray-400">
                      {Math.floor(item.duration)}s
                    </div>
                  )}
                </div>
                <div className="text-gray-400 flex-shrink-0">
                  {getIcon(item.type)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
