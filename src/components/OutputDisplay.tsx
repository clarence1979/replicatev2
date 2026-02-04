import { Download, Copy, Check, Image as ImageIcon, Video, FileText, Music, Box, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Prediction } from '../types/replicate';
import { ModelViewer3D } from './ModelViewer3D';
import { convertGlbToStl } from '../utils/glbToStl';

interface OutputDisplayProps {
  prediction: Prediction;
}

export function OutputDisplay({ prediction }: OutputDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [convertingStl, setConvertingStl] = useState(false);

  if (!prediction.output) {
    return null;
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleDownloadStl = async (glbUrl: string, filename: string) => {
    try {
      setConvertingStl(true);
      const stlBlob = await convertGlbToStl(glbUrl);
      const url = URL.createObjectURL(stlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error converting to STL:', error);
      alert('Failed to convert model to STL format. The model may not be compatible.');
    } finally {
      setConvertingStl(false);
    }
  };

  const renderOutput = () => {
    const output = prediction.output;

    if (Array.isArray(output)) {
      return (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">
            Outputs ({output.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {output.map((item, index) => (
              <div key={index}>{renderSingleOutput(item, index)}</div>
            ))}
          </div>
        </div>
      );
    }

    return renderSingleOutput(output);
  };

  const renderSingleOutput = (output: any, index?: number) => {
    if (typeof output === 'string') {
      if (isImageUrl(output)) {
        return (
          <div className="space-y-2">
            <div className="relative group">
              <img
                src={output}
                alt={`Output ${index !== undefined ? index + 1 : ''}`}
                className="w-full rounded-lg border border-gray-200"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(output, `output-${index || 0}.png`)}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <a
                href={output}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 truncate"
              >
                {output}
              </a>
            </div>
          </div>
        );
      }

      if (isVideoUrl(output)) {
        return (
          <div className="space-y-2">
            <video
              src={output}
              controls
              className="w-full rounded-lg border border-gray-200"
            />
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-gray-500" />
              <a
                href={output}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 truncate"
              >
                {output}
              </a>
              <button
                onClick={() => handleDownload(output, `output-${index || 0}.mp4`)}
                className="ml-auto p-1.5 text-gray-600 hover:text-gray-800"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      if (isAudioUrl(output)) {
        const extension = output.match(/\.(mp3|wav|ogg|m4a)$/i)?.[1] || 'mp3';
        return (
          <div className="space-y-2">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <audio src={output} controls className="w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-gray-500" />
              <a
                href={output}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 truncate flex-1"
              >
                {output}
              </a>
              <button
                onClick={() => handleDownload(output, `audio-${index || 0}.${extension}`)}
                className="ml-auto p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Download audio"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      if (is3DModelUrl(output)) {
        return (
          <div className="space-y-2">
            <ModelViewer3D modelUrl={output} index={index} />
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-gray-500" />
              <a
                href={output}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 truncate flex-1"
              >
                {output}
              </a>
              <button
                onClick={() => handleDownloadStl(output, `model-${index || 0}.stl`)}
                disabled={convertingStl}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download as STL"
              >
                {convertingStl ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                ) : (
                  <span className="text-xs font-medium">STL</span>
                )}
              </button>
            </div>
          </div>
        );
      }

      if (output.length > 200) {
        return (
          <div className="space-y-2">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {output}
              </pre>
            </div>
            <button
              onClick={() => handleCopy(output)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span className="text-gray-800">{output}</span>
        </div>
      );
    }

    // Handle objects with 3D model files (e.g., Trellis output)
    if (typeof output === 'object' && output !== null) {
      if (output.model_file && is3DModelUrl(output.model_file)) {
        return (
          <div className="space-y-4">
            <ModelViewer3D modelUrl={output.model_file} index={index} />
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Box className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-700 flex-1">3D Model File</span>
              <button
                onClick={() => handleDownloadStl(output.model_file, `model-${index || 0}.stl`)}
                disabled={convertingStl}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {convertingStl ? 'Converting...' : 'Download STL'}
              </button>
            </div>

            {/* Show additional outputs if available */}
            {(output.color_video || output.gaussian_ply || output.normal_video || output.no_background_images) && (
              <div className="grid grid-cols-1 gap-4">
                {output.color_video && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Color Video</h4>
                    <video
                      src={output.color_video}
                      controls
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {output.normal_video && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Normal Video</h4>
                    <video
                      src={output.normal_video}
                      controls
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {output.gaussian_ply && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Box className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 flex-1">Gaussian PLY</span>
                    <a
                      href={output.gaussian_ply}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Download
                    </a>
                  </div>
                )}

                {output.no_background_images && Array.isArray(output.no_background_images) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">No Background Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {output.no_background_images.map((imgUrl: string, idx: number) => (
                        <div key={idx} className="relative group">
                          <img
                            src={imgUrl}
                            alt={`No background ${idx + 1}`}
                            className="w-full rounded border border-gray-200"
                          />
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDownload(imgUrl, `no-bg-${idx}.png`)}
                              className="p-1.5 bg-white rounded shadow hover:bg-gray-50"
                              title="Download"
                            >
                              <Download className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <div className="space-y-2">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto">
            {JSON.stringify(output, null, 2)}
          </pre>
        </div>
        <button
          onClick={() => handleCopy(JSON.stringify(output, null, 2))}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy JSON
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <Check className="w-6 h-6 text-green-600" />
        Output
      </h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          Files are available for download for 1 hour after generation. After expiry, a preview will be retained in the Student Generations gallery.
        </p>
      </div>
      {renderOutput()}
    </div>
  );
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url) || url.includes('image');
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|avi)$/i.test(url) || url.includes('video');
}

function isAudioUrl(url: string): boolean {
  return /\.(mp3|wav|ogg|m4a)$/i.test(url) || url.includes('audio');
}

function is3DModelUrl(url: string): boolean {
  return /\.(glb|gltf)$/i.test(url);
}
