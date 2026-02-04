import { useState } from 'react';
import { AlertCircle, FileText, Shield } from 'lucide-react';
import { TermsOfService } from './TermsOfService';
import { PrivacyPolicy } from './PrivacyPolicy';

interface TermsAcceptanceModalProps {
  onAccept: () => void;
}

export function TermsAcceptanceModal({ onAccept }: TermsAcceptanceModalProps) {
  const [view, setView] = useState<'main' | 'terms' | 'privacy'>('main');
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);

  const handleViewTerms = () => {
    setView('terms');
    setHasReadTerms(true);
  };

  const handleViewPrivacy = () => {
    setView('privacy');
    setHasReadPrivacy(true);
  };

  const canAccept = hasReadTerms && hasReadPrivacy && acceptedCheckbox;

  if (view === 'terms') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="max-w-4xl w-full">
          <TermsOfService onClose={() => setView('main')} />
        </div>
      </div>
    );
  }

  if (view === 'privacy') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="max-w-4xl w-full">
          <PrivacyPolicy onClose={() => setView('main')} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Welcome to Replicate API Interface</h2>
              <p className="text-blue-100 text-sm">Please review and accept our terms before continuing</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-bold text-gray-800">Important Information:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>AI generation may fail when using images of famous people or celebrities</li>
                  <li>You must obtain permission before using another person's photo or likeness</li>
                  <li>All media generations are monitored and logged for safety and educational purposes</li>
                  <li>This tool is for educational use only within our school community</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              Before you can use this service, you must read and accept our Terms of Service and Privacy Policy. These documents explain how we collect, use, and protect your information, as well as the rules for appropriate use of this educational tool.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleViewTerms}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  hasReadTerms
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <FileText className={`w-6 h-6 ${hasReadTerms ? 'text-green-600' : 'text-gray-600'}`} />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-800">Terms of Service</div>
                  <div className="text-xs text-gray-600">Click to read</div>
                </div>
                {hasReadTerms && (
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>

              <button
                onClick={handleViewPrivacy}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  hasReadPrivacy
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <Shield className={`w-6 h-6 ${hasReadPrivacy ? 'text-green-600' : 'text-gray-600'}`} />
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-800">Privacy Policy</div>
                  <div className="text-xs text-gray-600">Click to read</div>
                </div>
                {hasReadPrivacy && (
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>
            </div>

            {!hasReadTerms || !hasReadPrivacy ? (
              <p className="text-sm text-amber-600 font-medium text-center">
                Please read both documents before accepting
              </p>
            ) : null}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedCheckbox}
                onChange={(e) => setAcceptedCheckbox(e.target.checked)}
                disabled={!hasReadTerms || !hasReadPrivacy}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className={`text-sm ${!hasReadTerms || !hasReadPrivacy ? 'text-gray-400' : 'text-gray-700'}`}>
                I have read and agree to the Terms of Service and Privacy Policy. I understand that all my activities are monitored, that I must obtain permission before using another person's media, and that I will use this service responsibly and in accordance with school policies.
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onAccept}
              disabled={!canAccept}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                canAccept
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              I Accept - Continue to Service
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By clicking "I Accept", you confirm that you have read, understood, and agree to be bound by these terms and policies.
          </p>
        </div>
      </div>
    </div>
  );
}
