import { Lightbulb, Copy, Check, ChevronLeft, ChevronRight, Music, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ModelViewer3D } from './ModelViewer3D';
import { ModelExample } from '../data/curatedModels';

interface ExamplesDisplayProps {
  defaultExample?: any;
  examples?: ModelExample[];
  onUseExample: (inputs: Record<string, any>) => void;
}

export function ExamplesDisplay({ defaultExample, examples, onUseExample }: ExamplesDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  // Combine API default example with curated examples
  const allExamples = (() => {
    const combined: ModelExample[] = [];

    // Prioritize curated examples if available
    if (examples && examples.length > 0) {
      combined.push(...examples);
    } else if (defaultExample) {
      // Only use API default example if no curated examples exist
      combined.push({
        name: 'Example',
        input: defaultExample.input || {},
        output: defaultExample.output
      });
    }

    return combined;
  })();

  useEffect(() => {
    if (allExamples.length > 0 && currentExampleIndex >= allExamples.length) {
      setCurrentExampleIndex(0);
    }
  }, [allExamples.length, currentExampleIndex]);

  const hasMultipleExamples = allExamples.length > 0;
  const safeIndex = hasMultipleExamples
    ? Math.min(currentExampleIndex, allExamples.length - 1)
    : 0;
  const currentExample = hasMultipleExamples
    ? allExamples[safeIndex]
    : null;

  if (!currentExample && !hasMultipleExamples) {
    return null;
  }

  const handlePrevious = () => {
    if (allExamples.length > 0) {
      setCurrentExampleIndex((prev) => (prev === 0 ? allExamples.length - 1 : prev - 1));
    }
  };

  const handleNext = () => {
    if (allExamples.length > 0) {
      setCurrentExampleIndex((prev) => (prev === allExamples.length - 1 ? 0 : prev + 1));
    }
  };

  const handleUseExample = () => {
    if (currentExample?.input) {
      onUseExample(currentExample.input);
    }
  };

  const handleCopyInput = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const renderValue = (value: any, key: string, isOutput = false) => {
    if (Array.isArray(value)) {
      // Special handling for color arrays
      if (key === 'colors' && value.every(item => typeof item === 'string' && /^#[0-9A-Fa-f]{6}$/i.test(item))) {
        return (
          <div className="space-y-2">
            {value.map((color, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div
                  className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                  title={color}
                />
                <code className="text-sm text-gray-800 font-mono">{color}</code>
                <button
                  onClick={() => handleCopyInput(color)}
                  className="ml-auto flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index}>
              {renderValue(item, `${key}-${index}`, isOutput)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'string') {
      // Check if it's a URL or local path to media
      const isUrl = value.startsWith('http://') || value.startsWith('https://');
      const isLocalPath = value.startsWith('/');

      if (isUrl || isLocalPath) {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(value) ||
                       key === 'logo' ||
                       value.includes('avatars.githubusercontent.com') ||
                       value.includes('avatar');
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(value);
        const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(value) || value.includes('audio');
        const is3DModel = /\.(glb|gltf)$/i.test(value);

        if (isImage) {
          return (
            <div className="mt-2">
              <img
                src={value}
                alt={`Example ${key}`}
                className={key === 'logo' ? 'w-24 h-24 object-contain rounded-lg border border-gray-300 bg-white p-2' : 'max-w-full rounded-lg border border-gray-300'}
              />
            </div>
          );
        }

        if (isVideo) {
          return (
            <div className="mt-2 space-y-2">
              <video
                src={value}
                autoPlay
                loop
                muted
                controls
                className="max-w-full rounded-lg border border-gray-300"
              >
                Your browser does not support the video tag.
              </video>
              {isOutput && (
                <div className="flex items-center gap-2">
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline flex-1 truncate"
                  >
                    {value}
                  </a>
                  <button
                    onClick={() => handleDownload(value, `video-${key}.mp4`)}
                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title="Download video"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        }

        if (isAudio) {
          return (
            <div className="mt-2 space-y-2">
              <audio
                src={value}
                controls
                className="w-full"
              >
                Your browser does not support the audio tag.
              </audio>
              {isOutput && (
                <div className="flex items-center gap-2">
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline flex-1 truncate"
                  >
                    {value}
                  </a>
                  <button
                    onClick={() => handleDownload(value, `audio-${key}.wav`)}
                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title="Download audio"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        }

        if (is3DModel && isOutput) {
          return (
            <div className="mt-2">
              <ModelViewer3D modelUrl={value} />
            </div>
          );
        }

        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline break-all"
          >
            {value}
          </a>
        );
      }

      // Check if it's an audio file placeholder
      if (isOutput && (value.toLowerCase().includes('audio file') || value.toLowerCase().includes('.wav') || value.toLowerCase().includes('.mp3'))) {
        return (
          <div className="flex items-center gap-3 bg-blue-50 p-4 rounded border border-blue-200">
            <Music className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Audio Output</p>
              <p className="text-xs text-blue-700 mt-1">{value}</p>
            </div>
          </div>
        );
      }

      // For text values, show with copy button
      return (
        <div className="flex items-start gap-2 bg-gray-50 p-3 rounded border border-gray-200">
          <code className="text-sm text-gray-800 flex-1 whitespace-pre-wrap break-words">
            {value}
          </code>
          <button
            onClick={() => handleCopyInput(value)}
            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      // Handle objects with 3D model files (e.g., Trellis output)
      if (isOutput && value.model_file && /\.(glb|gltf)$/i.test(value.model_file)) {
        return (
          <div className="space-y-4">
            <div className="mt-2">
              <ModelViewer3D modelUrl={value.model_file} />
            </div>

            {/* Show additional outputs if available */}
            {(value.color_video || value.gaussian_ply || value.normal_video || value.no_background_images) && (
              <div className="grid grid-cols-1 gap-3 mt-3">
                {value.color_video && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Color Video</p>
                    <video
                      src={value.color_video}
                      autoPlay
                      loop
                      muted
                      controls
                      className="w-full rounded border border-gray-300"
                    />
                  </div>
                )}

                {value.normal_video && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Normal Video</p>
                    <video
                      src={value.normal_video}
                      autoPlay
                      loop
                      muted
                      controls
                      className="w-full rounded border border-gray-300"
                    />
                  </div>
                )}

                {value.gaussian_ply && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600">Gaussian PLY:</span>
                    <a
                      href={value.gaussian_ply}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Download
                    </a>
                  </div>
                )}

                {value.no_background_images && Array.isArray(value.no_background_images) && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">No Background Images</p>
                    <div className="grid grid-cols-2 gap-2">
                      {value.no_background_images.map((imgUrl: string, idx: number) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`No background ${idx + 1}`}
                          className="w-full rounded border border-gray-300"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      return (
        <pre className="text-sm bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <span className="text-gray-800">{String(value)}</span>;
  };

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200 shadow-md h-full flex flex-col">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-yellow-100 p-2 rounded-lg">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Example Usage
          </h3>
          <p className="text-sm text-gray-600">
            {hasMultipleExamples
              ? `${safeIndex + 1} of ${allExamples.length} examples`
              : 'Use this example to get started quickly'}
          </p>
        </div>
        {currentExample?.input && (
          <button
            onClick={handleUseExample}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors text-sm whitespace-nowrap"
          >
            Use This Example
          </button>
        )}
      </div>

      {hasMultipleExamples && allExamples.length > 1 && (
        <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-3 border border-yellow-200">
          <button
            onClick={handlePrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous example"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 text-center">
            <h4 className="font-semibold text-gray-800">{currentExample?.name || 'Example'}</h4>
          </div>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next example"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {currentExample?.input && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm">Sample Inputs:</h4>
            <div className="space-y-2">
              {Object.entries(currentExample.input || {}).map(([key, value]) => (
                <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="font-medium text-sm text-gray-700 mb-1">
                    {key}
                  </div>
                  {renderValue(value, key)}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentExample?.output !== undefined && currentExample?.output !== null && (
          <div className="mt-4 space-y-3">
            <h4 className="font-medium text-gray-700 text-sm">Expected Output:</h4>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              {renderValue(currentExample.output, 'output', true)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
