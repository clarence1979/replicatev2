import { useState } from 'react';
import { Key, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import { validateApiKey } from '../utils/replicateApi';

interface ApiKeyManagerProps {
  onApiKeySet: (apiKey: string, rememberMe: boolean) => void;
  onMeshyKeySet?: (apiKey: string, rememberMe: boolean) => void;
  onForgetKey?: () => void;
  onForgetMeshyKey?: () => void;
  currentApiKey?: string;
  currentMeshyKey?: string;
}

type TabType = 'replicate' | 'meshy';

export function ApiKeyManager({
  onApiKeySet,
  onMeshyKeySet,
  onForgetKey,
  onForgetMeshyKey,
  currentApiKey,
  currentMeshyKey
}: ApiKeyManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('replicate');
  const [apiKey, setApiKey] = useState('');
  const [meshyKey, setMeshyKey] = useState('');
  const [error, setError] = useState('');
  const [meshyError, setMeshyError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [rememberMeshy, setRememberMeshy] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateApiKey(apiKey)) {
      setError('Invalid API key format. Replicate API keys start with "r8_"');
      return;
    }

    onApiKeySet(apiKey, rememberMe);
    setShowInput(false);
    setApiKey('');
  };

  const handleMeshySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMeshyError('');

    if (!meshyKey || meshyKey.trim().length === 0) {
      setMeshyError('Please enter a valid Meshy API key');
      return;
    }

    if (onMeshyKeySet) {
      onMeshyKeySet(meshyKey, rememberMeshy);
      setMeshyKey('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
        <Key className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">API Keys</h2>
      </div>

      <div className="flex border-b border-gray-200 px-6">
        <button
          onClick={() => setActiveTab('replicate')}
          className={`px-4 py-3 font-medium text-sm transition-all relative ${
            activeTab === 'replicate'
              ? 'text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Replicate
          {activeTab === 'replicate' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('meshy')}
          className={`px-4 py-3 font-medium text-sm transition-all relative ${
            activeTab === 'meshy'
              ? 'text-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Meshy
          {activeTab === 'meshy' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
          )}
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'replicate' ? (
          currentApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                <Key className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">API Key Configured</span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>Your API key is stored in browser localStorage. Only use this on trusted devices.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onForgetKey) {
                      onForgetKey();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Forget Key
                </button>
                <a
                  href="https://replicate.com/account/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get New Token
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>Your API key will be stored in browser localStorage. Only use this on trusted devices.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your Replicate API Token
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="r8_..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                    Remember me on this device
                  </label>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <a
                    href="https://replicate.com/account/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Get API Token <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Save API Key
                  </button>
                </div>
              </form>
            </>
          )
        ) : (
          currentMeshyKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                <Key className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">API Key Configured</span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>Your API key is stored in browser localStorage. Only use this on trusted devices.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onForgetMeshyKey) {
                      onForgetMeshyKey();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Forget Key
                </button>
                <a
                  href="https://app.meshy.ai/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get New Token
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Optional</p>
                  <p>Meshy API key is only needed if you want to use Meshy 3D models.</p>
                </div>
              </div>

              <form onSubmit={handleMeshySubmit} className="space-y-4">
                <div>
                  <label htmlFor="meshyKey" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your Meshy API Token
                  </label>
                  <input
                    type="password"
                    id="meshyKey"
                    value={meshyKey}
                    onChange={(e) => setMeshyKey(e.target.value)}
                    placeholder="msy_..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {meshyError && <p className="mt-2 text-sm text-red-600">{meshyError}</p>}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMeshy"
                    checked={rememberMeshy}
                    onChange={(e) => setRememberMeshy(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <label htmlFor="rememberMeshy" className="ml-2 text-sm text-gray-700">
                    Remember me on this device
                  </label>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <a
                    href="https://app.meshy.ai/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    Get API Token <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                  >
                    Save API Key
                  </button>
                </div>
              </form>
            </>
          )
        )}
      </div>
    </div>
  );
}
