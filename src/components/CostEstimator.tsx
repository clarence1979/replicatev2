import { DollarSign, Clock } from 'lucide-react';

interface CostEstimatorProps {
  estimatedCost?: number;
  processingTime?: number;
  isProcessing?: boolean;
}

export function CostEstimator({ estimatedCost, processingTime, isProcessing }: CostEstimatorProps) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {estimatedCost !== undefined && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Estimated Cost</p>
                <p className="text-lg font-semibold text-gray-800">
                  ${estimatedCost.toFixed(4)}
                </p>
              </div>
            </div>
          )}

          {processingTime !== undefined && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">
                  {isProcessing ? 'Processing Time' : 'Total Time'}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {processingTime.toFixed(2)}s
                </p>
              </div>
            </div>
          )}
        </div>

        {estimatedCost === undefined && processingTime === undefined && (
          <p className="text-sm text-gray-600">
            Costs will be calculated based on model pricing
          </p>
        )}
      </div>
    </div>
  );
}
