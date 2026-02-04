import { useState } from 'react';
import { CheckCircle, TrendingUp, RefreshCw, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { Model } from '../types/replicate';
import { clearVersionCache } from '../utils/replicateApi';

interface ModelInfoProps {
  model: Model;
  onRefreshVersion?: () => Promise<void>;
  hasVersionError?: boolean;
}

export function ModelInfo({ model, onRefreshVersion, hasVersionError }: ModelInfoProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const handleRefresh = async () => {
    if (!onRefreshVersion || isRefreshing) return;

    setIsRefreshing(true);
    setRefreshMessage(null);

    try {
      await onRefreshVersion();
    } catch (error) {
      setRefreshMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to check for updates'
      });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshMessage(null), 5000);
    }
  };

  const handleClearCache = () => {
    clearVersionCache(model.owner, model.name);
    setRefreshMessage({
      type: 'success',
      text: '✅ Cache cleared! Click "Check Updates" to reload the model.'
    });
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  const versionDate = model.latest_version.created_at
    ? new Date(model.latest_version.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Unknown';

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 break-words">
              {model.owner}/{model.name}
            </h3>
            {model.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{model.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>{model.run_count.toLocaleString()} runs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-t border-blue-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-700">Model Version</span>
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded font-medium">
                ✓ Latest
              </span>
            </div>
            <div className="text-xs text-gray-600 font-mono truncate">
              {model.latest_version.id.substring(0, 12)}...
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Released: {versionDate}</span>
            </div>
          </div>
          {onRefreshVersion && (
            <div className="flex gap-2">
              <button
                onClick={handleClearCache}
                className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors flex-shrink-0 bg-gray-600 text-white hover:bg-gray-700"
                title="Clear cached version"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors flex-shrink-0 ${
                  hasVersionError
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 animate-pulse'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                } disabled:cursor-not-allowed`}
                title={hasVersionError ? 'Version error detected - Click to refresh' : 'Check for newer version'}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Checking...' : hasVersionError ? 'Refresh Required!' : 'Check Updates'}
              </button>
            </div>
          )}
        </div>

        {refreshMessage && (
          <div className={`mt-3 p-2 rounded text-xs flex items-center gap-2 ${
            refreshMessage.type === 'success' ? 'bg-green-100 text-green-800' :
            refreshMessage.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>{refreshMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
