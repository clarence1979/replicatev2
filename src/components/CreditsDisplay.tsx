import { useState, useEffect } from 'react';
import { DollarSign, RefreshCw } from 'lucide-react';
import { getAccountInfo } from '../utils/replicateApi';

interface CreditsDisplayProps {
  sessionCost?: number;
  onRefresh?: () => void;
}

export function CreditsDisplay({ sessionCost = 0, onRefresh }: CreditsDisplayProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const accountInfo = await getAccountInfo();

      const balanceValue =
        accountInfo.balance ??
        accountInfo.credits_balance ??
        accountInfo.current_balance ??
        accountInfo.billing?.balance ??
        accountInfo.billing?.current_balance ??
        accountInfo.account_balance;

      if (balanceValue !== undefined && balanceValue !== null) {
        setBalance(balanceValue);
      } else {
        setError('Balance unavailable');
      }
      setLoading(false);
      onRefresh?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed: ${err.message}`);
      } else {
        setError('Failed to load balance');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
        <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <button
        onClick={fetchBalance}
        className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg shadow-sm border border-red-200 hover:bg-red-100 transition-colors"
      >
        <RefreshCw className="w-4 h-4 text-red-600" />
        <span className="text-sm text-red-600">Retry</span>
      </button>
    );
  }

  const balanceColor = balance !== null && balance < 2 ? 'text-red-600' : balance !== null && balance < 5 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        <DollarSign className={`w-4 h-4 ${balanceColor}`} />
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Balance:</span>
            <span className={`font-bold ${balanceColor}`}>
              ${balance !== null ? balance.toFixed(4) : '0.0000'}
            </span>
          </div>
          {sessionCost > 0 && (
            <div className="text-xs text-gray-500 mt-0.5">
              Session: ${sessionCost.toFixed(4)}
            </div>
          )}
        </div>
        <button
          onClick={fetchBalance}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Refresh balance"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  );
}
