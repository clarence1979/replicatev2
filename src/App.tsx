import { useState, useEffect } from 'react';
import { Sparkles, Film, Wand2, FileText, Shield } from 'lucide-react';
import { Model, Prediction } from './types/replicate';
import { CuratedModelSelector } from './components/CuratedModelSelector';
import { ModelInfo } from './components/ModelInfo';
import { DynamicForm } from './components/DynamicForm';
import { PredictionRunner } from './components/PredictionRunner';
import { OutputDisplay } from './components/OutputDisplay';
import { CostEstimator } from './components/CostEstimator';
import { ExamplesDisplay } from './components/ExamplesDisplay';
import { GenerationsPreview } from './components/GenerationsPreview';
import { TimelineEditor } from './components/timeline/TimelineEditor';
import { TermsAcceptanceModal } from './components/TermsAcceptanceModal';
import { TermsOfService } from './components/TermsOfService';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { MeshyRunner } from './components/MeshyRunner';
import { refreshModelVersion, clearVersionCache } from './utils/replicateApi';
import { calculateEstimatedCost } from './utils/costEstimator';
import { CuratedModel } from './data/curatedModels';
import { useMobileDetection } from './hooks/useMobileDetection';
import { initIframeListener, isInIframe } from './utils/iframeApiKey';
import { attemptAutoLogin } from './utils/auto-login';

const TERMS_ACCEPTED_KEY = 'terms_accepted_v1';

function App() {
  const { isMobile } = useMobileDetection();
  const [currentView, setCurrentView] = useState<'generator' | 'timeline'>('generator');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showTermsDoc, setShowTermsDoc] = useState(false);
  const [showPrivacyDoc, setShowPrivacyDoc] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [model, setModel] = useState<Model | null>(null);
  const [curatedModel, setCuratedModel] = useState<CuratedModel | null>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [completedPrediction, setCompletedPrediction] = useState<Prediction | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0.0025);
  const [hasVersionError, setHasVersionError] = useState(false);

  useEffect(() => {
    async function init() {
      initIframeListener();

      const accepted = localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true';
      if (accepted) {
        setTermsAccepted(true);
      } else {
        setShowTermsModal(true);
      }

      if (isInIframe()) {
        await attemptAutoLogin();
      }

      setIsLoading(false);
    }

    init();
  }, []);

  useEffect(() => {
    if (model && inputs) {
      const inputSchema = model.latest_version.openapi_schema.components.schemas.Input.properties;
      const cost = calculateEstimatedCost(inputs, inputSchema);
      setEstimatedCost(cost);
    }
  }, [inputs, model]);

  const handleModelLoaded = (loadedModel: Model, loadedCuratedModel?: CuratedModel) => {
    setModel(loadedModel);
    setCuratedModel(loadedCuratedModel || null);
    setCompletedPrediction(null);
    setInputs({});
    setProcessingTime(0);
    setHasVersionError(false);
  };

  const handlePredictionComplete = (prediction: Prediction) => {
    setCompletedPrediction(prediction);
    if (prediction.metrics?.predict_time) {
      setProcessingTime(prediction.metrics.predict_time);
    }
  };

  const handleUseExample = (exampleInputs: Record<string, any>) => {
    setInputs(exampleInputs);
    setCompletedPrediction(null);
  };

  const handleAcceptTerms = () => {
    localStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
    setTermsAccepted(true);
    setShowTermsModal(false);
  };

  const handleRefreshModelVersion = async () => {
    if (!model) return;

    clearVersionCache(model.owner, model.name);

    const { model: updatedModel, wasUpdated } = await refreshModelVersion(
      model.owner,
      model.name
    );

    setHasVersionError(false);

    if (wasUpdated) {
      setModel(updatedModel);
      setCompletedPrediction(null);
      throw new Error('Updated to latest version! Your current input values have been preserved.');
    } else {
      setModel(updatedModel);
      throw new Error('Model schema refreshed! Your current input values have been preserved.');
    }
  };

  const inputSchema = model?.latest_version.openapi_schema.components.schemas.Input.properties || {};
  const requiredFields = model?.latest_version.openapi_schema.components.schemas.Input.required || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (showTermsModal && !termsAccepted) {
    return <TermsAcceptanceModal onAccept={handleAcceptTerms} />;
  }

  if (showTermsDoc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <TermsOfService onClose={() => setShowTermsDoc(false)} />
        </div>
      </div>
    );
  }

  if (showPrivacyDoc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <PrivacyPolicy onClose={() => setShowPrivacyDoc(false)} />
        </div>
      </div>
    );
  }

  if (currentView === 'timeline') {
    return <TimelineEditor onBack={() => setCurrentView('generator')} isMobile={isMobile} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-100">
      <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-4 space-y-4' : 'px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6'}`}>
        <header className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex-1 flex items-center gap-3">
              <a
                href="https://digitalvector.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105 active:scale-95"
                title="Digital Vector"
              >
                <img
                  src="/digivec_logo.png"
                  alt="Digital Vector"
                  className={`${isMobile ? 'h-8' : 'h-10 sm:h-12'} w-auto rounded`}
                />
              </a>
              <a
                href="https://clarence.guru"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105 active:scale-95"
                title="Clarence's Solutions"
              >
                <img
                  src="/cla_sol.png"
                  alt="Clarence's Solutions"
                  className={`${isMobile ? 'h-8' : 'h-10 sm:h-12'} w-auto rounded`}
                />
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <Sparkles className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8 sm:w-10 sm:h-10'} text-blue-600`} />
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl md:text-4xl'} font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent text-center`}>
                Replicate API Interface
              </h1>
            </div>
            <div className="flex-1" />
          </div>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm sm:text-base md:text-lg'} text-center px-2`}>
            Interactive tool for exploring and testing AI models from Replicate.com
          </p>

          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} justify-center ${isMobile ? 'gap-2' : 'gap-3'} mt-4 ${isMobile ? 'px-4' : ''}`}>
            <button
              onClick={() => setCurrentView('generator')}
              className={`flex items-center ${isMobile ? 'justify-center' : ''} gap-2 ${isMobile ? 'px-6 py-3 w-full' : 'px-4 py-2'} rounded-lg font-medium transition-all ${
                currentView === 'generator'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <Wand2 className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
              Media Generator
            </button>
            <button
              onClick={() => setCurrentView('timeline')}
              className={`flex items-center ${isMobile ? 'justify-center' : ''} gap-2 ${isMobile ? 'px-6 py-3 w-full' : 'px-4 py-2'} rounded-lg font-medium transition-all ${
                currentView === 'timeline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <Film className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
              Video Editor
            </button>
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <CuratedModelSelector
                onModelLoaded={handleModelLoaded}
                onMeshyModelSelected={(selectedCuratedModel) => {
                  setCuratedModel(selectedCuratedModel);
                  setModel(null);
                  setCompletedPrediction(null);
                  setInputs({});
                  setProcessingTime(0);
                }}
              />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <GenerationsPreview isAdmin={false} />
              {model && (
                <div className="space-y-4 sm:space-y-6">
                  <ModelInfo
                    model={model}
                    onRefreshVersion={handleRefreshModelVersion}
                    hasVersionError={hasVersionError}
                  />
                  <CostEstimator
                    estimatedCost={estimatedCost}
                    processingTime={processingTime > 0 ? processingTime : undefined}
                    isProcessing={false}
                  />
                </div>
              )}
            </div>
          </div>

          {model && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                    Model Inputs
                  </h2>
                  <DynamicForm
                    key={model.latest_version.id}
                    schema={inputSchema}
                    requiredFields={requiredFields}
                    initialValues={inputs}
                    onInputChange={setInputs}
                    modelContext={`${model.owner}/${model.name} - ${model.description || 'AI model'}`}
                  />
                </div>

                {(model.default_example || curatedModel?.examples) && (
                  <ExamplesDisplay
                    key={`${model.latest_version.id}-${model.default_example ? JSON.stringify(model.default_example).substring(0, 50) : 'no-example'}`}
                    defaultExample={model.default_example}
                    examples={curatedModel?.examples}
                    onUseExample={handleUseExample}
                  />
                )}
              </div>

              <PredictionRunner
                versionId={model.latest_version.id}
                inputs={inputs}
                requiredFields={requiredFields}
                studentName=""
                model={model}
                onPredictionComplete={handlePredictionComplete}
                onProcessingTimeUpdate={setProcessingTime}
                onVersionError={() => setHasVersionError(true)}
              />

              {completedPrediction && (
                <OutputDisplay prediction={completedPrediction} />
              )}
            </>
          )}

          {!model && curatedModel && curatedModel.isMeshy && (
            <MeshyRunner
              curatedModel={curatedModel}
              studentName=""
            />
          )}
        </div>

        <footer className="text-center text-xs sm:text-sm text-gray-500 mt-8 sm:mt-12 pb-4 sm:pb-6 px-2 space-y-3">
          <p>
            Educational tool for learning API integration with Replicate.com
          </p>
          <p>
            Visit{' '}
            <a
              href="https://replicate.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              Replicate.com
            </a>{' '}
            to explore available models
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => setShowTermsDoc(true)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
            >
              <FileText className="w-3 h-3" />
              Terms of Service
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => setShowPrivacyDoc(true)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
            >
              <Shield className="w-3 h-3" />
              Privacy Policy
            </button>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            All media generations are monitored. Use responsibly and obtain permission before using another person's media.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
