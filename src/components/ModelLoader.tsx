import { useState } from 'react';
import { Search, Loader2, Package, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Model } from '../types/replicate';
import { fetchModel, parseModelUrl, ReplicateAPIError } from '../utils/replicateApi';

interface ModelLoaderProps {
  onModelLoaded: (model: Model) => void;
}

export function ModelLoader({ onModelLoaded }: ModelLoaderProps) {
  const [modelUrl, setModelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useLatestVersion, setUseLatestVersion] = useState(true);
  const [manualVersionId, setManualVersionId] = useState('');

  const handleLoadModel = async () => {
    setError('');
    setLoading(true);

    try {
      const parsed = parseModelUrl(modelUrl);
      if (!parsed) {
        throw new Error('Invalid model URL format. Use: owner/model-name');
      }

      const model = await fetchModel(parsed.owner, parsed.name, true);

      if (!useLatestVersion && manualVersionId.trim()) {
        model.latest_version.id = manualVersionId.trim();
      }

      onModelLoaded(model);
    } catch (err) {
      if (err instanceof ReplicateAPIError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load model');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Load Model</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="modelUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Replicate Model URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="modelUrl"
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadModel()}
              placeholder="stability-ai/sdxl or cjwbw/sadtalker"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <button
              onClick={handleLoadModel}
              disabled={loading || !modelUrl.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Load Model
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Example: <span className="font-mono">stability-ai/sdxl</span> or{' '}
            <span className="font-mono">cjwbw/sadtalker</span>
          </p>
        </div>

        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLatestVersion}
                  onChange={(e) => {
                    setUseLatestVersion(e.target.checked);
                    if (e.target.checked) {
                      setManualVersionId('');
                    }
                  }}
                  className="mt-0.5 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Always use latest version (recommended)
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically fetch and use the newest model version
                  </p>
                </div>
              </label>

              {!useLatestVersion && (
                <div>
                  <label htmlFor="manualVersion" className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Version ID (optional)
                  </label>
                  <input
                    type="text"
                    id="manualVersion"
                    value={manualVersionId}
                    onChange={(e) => setManualVersionId(e.target.value)}
                    placeholder="e.g., 3aa3dac9353cc4d6bd62a35e..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-start gap-2 mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                    <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <p>For reproducibility only. Leave blank to auto-detect latest version.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
