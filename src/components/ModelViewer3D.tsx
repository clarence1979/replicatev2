import { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, RotateCw } from 'lucide-react';
import { convertGlbToStl } from '../utils/glbToStl';
import { proxyMeshyAssetUrl } from '../utils/meshyApi';
import { useMobileDetection } from '../hooks/useMobileDetection';

interface ModelViewer3DProps {
  modelUrl: string;
  index?: number;
}

export function ModelViewer3D({ modelUrl, index }: ModelViewer3DProps) {
  const { isMobile, isTouch } = useMobileDetection();
  const proxiedModelUrl = proxyMeshyAssetUrl(modelUrl);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
    script.onload = () => setLoading(false);
    script.onerror = () => setError('Failed to load 3D viewer');

    if (!document.querySelector('script[src*="model-viewer"]')) {
      document.head.appendChild(script);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDownloadMenu && !(event.target as Element).closest('.download-menu-container')) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleDownloadStl = async () => {
    try {
      setConverting(true);
      setShowDownloadMenu(false);
      const stlBlob = await convertGlbToStl(proxiedModelUrl);
      const url = URL.createObjectURL(stlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `model-${index || 0}.stl`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error converting to STL:', error);
      alert('Failed to convert model to STL format. The model may not be compatible.');
    } finally {
      setConverting(false);
    }
  };

  const handleReset = () => {
    const viewer = viewerRef.current?.querySelector('model-viewer') as any;
    if (viewer) {
      viewer.resetTurntableRotation();
      viewer.cameraOrbit = '0deg 75deg 105%';
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative group bg-gray-100 rounded-lg overflow-hidden" style={{ height: isMobile ? '350px' : '500px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div ref={viewerRef} className="w-full h-full">
          <model-viewer
            src={proxiedModelUrl}
            alt="3D Model"
            camera-controls
            auto-rotate={!isMobile}
            shadow-intensity="1"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className={`absolute top-2 right-2 flex gap-2 ${isTouch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <button
            onClick={handleReset}
            className={`${isMobile ? 'p-3' : 'p-2'} bg-white rounded-lg shadow-lg hover:bg-gray-50 active:bg-gray-100`}
            title="Reset view"
          >
            <RotateCw className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-gray-700`} />
          </button>
          <button
            onClick={() => {
              const viewer = viewerRef.current?.querySelector('model-viewer') as any;
              if (viewer) {
                viewer.requestFullscreen();
              }
            }}
            className={`${isMobile ? 'p-3' : 'p-2'} bg-white rounded-lg shadow-lg hover:bg-gray-50 active:bg-gray-100`}
            title="Fullscreen"
          >
            <Maximize2 className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-gray-700`} />
          </button>
          <div className="relative download-menu-container">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={converting}
              className={`${isMobile ? 'p-3' : 'p-2'} bg-white rounded-lg shadow-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Download"
            >
              {converting ? (
                <div className={`animate-spin rounded-full ${isMobile ? 'h-6 w-6' : 'h-5 w-5'} border-b-2 border-gray-700`}></div>
              ) : (
                <Download className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-gray-700`} />
              )}
            </button>
            {showDownloadMenu && (
              <div className={`absolute right-0 mt-2 ${isMobile ? 'w-56' : 'w-48'} bg-white rounded-lg shadow-xl border border-gray-200 z-10`}>
                <button
                  onClick={() => {
                    handleDownload(proxiedModelUrl, `model-${index || 0}.glb`);
                    setShowDownloadMenu(false);
                  }}
                  className={`w-full text-left ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm'} hover:bg-gray-100 active:bg-gray-200 rounded-t-lg text-gray-700`}
                >
                  Download as GLB
                </button>
                <button
                  onClick={handleDownloadStl}
                  className={`w-full text-left ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm'} hover:bg-gray-100 active:bg-gray-200 rounded-b-lg text-gray-700`}
                >
                  Download as STL
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
        <div className="flex items-center gap-2">
          <span className="font-medium">3D Model</span>
          <span className="text-gray-400">•</span>
          <span>{isTouch ? 'Touch and drag to rotate' : 'Click and drag to rotate'}</span>
        </div>
      </div>
    </div>
  );
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}
