import { useState, useEffect } from 'react';
import { Play, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Prediction, Model } from '../types/replicate';
import { createPrediction, getPrediction, ReplicateAPIError } from '../utils/replicateApi';
import { saveGeneration } from '../utils/generationStorage';

interface PredictionRunnerProps {
  versionId: string;
  inputs: Record<string, any>;
  requiredFields: string[];
  studentName: string;
  model: Model;
  onPredictionComplete: (prediction: Prediction) => void;
  onProcessingTimeUpdate?: (time: number) => void;
  onVersionError?: () => void;
}

export function PredictionRunner({
  versionId,
  inputs,
  requiredFields,
  studentName,
  model,
  onPredictionComplete,
  onProcessingTimeUpdate,
  onVersionError,
}: PredictionRunnerProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const isFormValid = studentName.trim() !== '' && requiredFields.every((field) => {
    const value = inputs[field];
    const isValid = value !== undefined && value !== null && value !== '';
    return isValid;
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && (prediction?.status === 'starting' || prediction?.status === 'processing')) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(elapsed);
        onProcessingTimeUpdate?.(elapsed);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startTime, prediction?.status, onProcessingTimeUpdate]);

  useEffect(() => {
    if (!prediction) return;

    if (prediction.status === 'starting' || prediction.status === 'processing') {
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 3;

      const timeoutDuration = 300000; // 5 minutes
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setStartTime(null);
        setError('Prediction timed out after 5 minutes. The model may be cold-starting or experiencing high demand. Click "Check Status" to refresh.');
      }, timeoutDuration);

      const pollInterval = setInterval(async () => {
        try {
          console.log('Polling prediction:', prediction.id);
          const updated = await getPrediction(prediction.id);
          console.log('Prediction status:', updated.status, updated);

          // Reset error counter on success
          consecutiveErrors = 0;

          setPrediction(updated);

          if (updated.status === 'succeeded' || updated.status === 'failed' || updated.status === 'canceled') {
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            setLoading(false);
            setStartTime(null);
            if (updated.status === 'succeeded') {
              console.log('Prediction succeeded, calling onPredictionComplete');
              onPredictionComplete(updated);
              await saveGeneration(updated, studentName, model, inputs);
            } else if (updated.status === 'failed') {
              setError(updated.error || 'Prediction failed');
            } else if (updated.status === 'canceled') {
              setError('Prediction was canceled');
            }
          }
        } catch (err) {
          consecutiveErrors++;
          console.error('Polling error (attempt ' + consecutiveErrors + '):', err);

          // If too many consecutive errors, stop polling and show error
          if (consecutiveErrors >= maxConsecutiveErrors) {
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            setLoading(false);
            setStartTime(null);
            setError('Failed to poll prediction status after multiple attempts. Click "Check Status" to try again.');
          }
        }
      }, 1000); // Poll every 1 second instead of 1.5 seconds

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeoutId);
      };
    }
  }, [prediction, onPredictionComplete, studentName, model, inputs]);

  const handleRunPrediction = async () => {
    setError('');
    setLoading(true);
    setPrediction(null);
    setElapsedTime(0);
    setStartTime(Date.now());

    try {
      const cleanedInputs = Object.entries(inputs).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          let cleanedValue = value;
          if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) {
            const keyLower = key.toLowerCase();
            const stringFields = ['megapixels', 'resolution', 'aspect_ratio', 'output_format', 'model'];
            if (!stringFields.some(field => keyLower.includes(field))) {
              if (keyLower.includes('duration') || keyLower.includes('length') || keyLower.includes('seconds') ||
                  keyLower.includes('steps') || keyLower.includes('outputs') || keyLower.includes('quality')) {
                cleanedValue = parseInt(value, 10);
              } else if (keyLower.includes('scale') || keyLower.includes('strength') || keyLower.includes('guidance')) {
                cleanedValue = parseFloat(value);
              }
            }
          }
          acc[key] = cleanedValue;
        }
        return acc;
      }, {} as Record<string, any>);

      console.log('Sending inputs to API:', cleanedInputs);
      console.log('Using version ID:', versionId);
      const newPrediction = await createPrediction(versionId, cleanedInputs);
      setPrediction(newPrediction);
    } catch (err) {
      setLoading(false);
      setStartTime(null);
      console.error('Prediction creation error:', err);

      if (err instanceof ReplicateAPIError) {
        const errorMsg = err.message.toLowerCase();

        // Handle 422 errors (invalid version or parameters)
        if (err.statusCode === 422) {
          setError(`${err.message}\n\nVersion ID: ${versionId.substring(0, 12)}...\n\nClick the trash icon and then "Check Updates" to refresh the model.`);
          onVersionError?.();
        } else if (errorMsg.includes('version') && (errorMsg.includes('does not exist') || errorMsg.includes("doesn't exist") || errorMsg.includes('not found'))) {
          setError(`${err.message}. The model version may have been updated. Click "Refresh Model Version" above to get the latest version.`);
          onVersionError?.();
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create prediction');
      }
    }
  };

  const handleCancelPrediction = () => {
    setLoading(false);
    setStartTime(null);
    setPrediction(null);
    setError('Prediction canceled by user');
  };

  const handleCheckStatus = async () => {
    if (!prediction) return;

    try {
      console.log('Manually checking prediction status:', prediction.id);
      const updated = await getPrediction(prediction.id);
      console.log('Updated prediction:', updated);
      setPrediction(updated);

      if (updated.status === 'succeeded') {
        setLoading(false);
        setStartTime(null);
        onPredictionComplete(updated);
        await saveGeneration(updated, studentName, model, inputs);
      } else if (updated.status === 'failed') {
        setLoading(false);
        setStartTime(null);
        setError(updated.error || 'Prediction failed');
      } else if (updated.status === 'canceled') {
        setLoading(false);
        setStartTime(null);
        setError('Prediction was canceled');
      }
    } catch (err) {
      console.error('Check status error:', err);
      if (err instanceof ReplicateAPIError) {
        setError(err.message);
      } else {
        setError('Failed to check prediction status. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={handleRunPrediction}
          disabled={!isFormValid || loading}
          className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Running Prediction...
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              Run Prediction
            </>
          )}
        </button>
        {loading && prediction && (
          <>
            <button
              onClick={handleCheckStatus}
              className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              title="Check current status"
            >
              <CheckCircle className="w-6 h-6" />
              Check Status
            </button>
            <button
              onClick={handleCancelPrediction}
              className="px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              title="Cancel prediction"
            >
              <XCircle className="w-6 h-6" />
              Cancel
            </button>
          </>
        )}
      </div>

      {loading && prediction && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 text-center">
            Tip: Periodically click <span className="font-semibold">Check Status</span> to refresh the prediction status.
            Click <span className="font-semibold">Cancel</span> as soon as you see the output to save on API costs.
          </p>
        </div>
      )}

      {!isFormValid && (
        <p className="text-sm text-amber-600 text-center">
          {!studentName.trim()
            ? 'Please enter your name before running predictions'
            : 'Please fill in all required fields (marked with *)'}
        </p>
      )}

      {prediction && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {prediction.status === 'starting' && (
                <>
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-gray-700">Starting...</span>
                </>
              )}
              {prediction.status === 'processing' && (
                <>
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-gray-700">Processing...</span>
                </>
              )}
              {prediction.status === 'succeeded' && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                </>
              )}
              {prediction.status === 'failed' && (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">Failed</span>
                </>
              )}
            </div>

            {(prediction.status === 'starting' || prediction.status === 'processing') && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{elapsedTime.toFixed(1)}s</span>
              </div>
            )}
          </div>

          {(prediction.status === 'starting' || prediction.status === 'processing') && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              {elapsedTime > 60 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  This is taking longer than usual. The model may be cold-starting or experiencing high demand. Please be patient.
                </div>
              )}
            </>
          )}

          {prediction.logs && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                View Logs
              </summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto text-gray-700">
                {prediction.logs}
              </pre>
            </details>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium whitespace-pre-wrap">Error: {error}</p>
          <button
            onClick={handleRunPrediction}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
