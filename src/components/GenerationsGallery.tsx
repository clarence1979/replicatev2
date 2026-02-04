import { useState, useEffect } from 'react';
import { Image, Clock, ChevronLeft, ChevronRight, Box, AlertCircle } from 'lucide-react';
import { StudentGeneration, isGenerationExpired } from '../types/generation';
import { supabase } from '../utils/supabase';
import { GenerationDetailModal } from './GenerationDetailModal';
import { ModelViewer3D } from './ModelViewer3D';
import { cleanupOldStorageFiles } from '../utils/generationStorage';

export function GenerationsGallery() {
  const [generations, setGenerations] = useState<StudentGeneration[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGeneration, setSelectedGeneration] = useState<StudentGeneration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGenerations();
    const interval = setInterval(() => {
      if (generations.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % generations.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [generations.length]);

  const loadGenerations = async () => {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data, error } = await supabase
        .from('student_generations')
        .select('*')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setGenerations(data || []);
    } catch (error) {
      console.error('Error loading generations:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + generations.length) % generations.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % generations.length);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <div className="text-center">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">No Generations Yet</h3>
          <p className="text-sm text-gray-500">Student generations will appear here</p>
        </div>
      </div>
    );
  }

  const currentGeneration = generations[currentIndex];

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              <h2 className="font-semibold">Student Generations</h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{generations.length} generation{generations.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="relative bg-gray-900 aspect-video">
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={() => setSelectedGeneration(currentGeneration)}
          >
            {currentGeneration.generation_type === 'image' ? (
              <img
                src={currentGeneration.content_url}
                alt={`Generation by ${currentGeneration.student_name}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : currentGeneration.generation_type === 'video' ? (
              <video
                src={currentGeneration.content_url}
                className="max-w-full max-h-full object-contain"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : currentGeneration.generation_type === '3d' ? (
              <div className="w-full h-full">
                <ModelViewer3D modelUrl={currentGeneration.content_url} />
              </div>
            ) : (
              <div className="text-white text-center p-4">
                <p className="text-lg font-medium mb-2">{currentGeneration.generation_type}</p>
                <p className="text-sm text-gray-400">Click to view details</p>
              </div>
            )}
          </div>

          {generations.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-white font-medium">{currentGeneration.student_name}</p>
                <p className="text-gray-300 text-sm">
                  {new Date(currentGeneration.created_at).toLocaleString()}
                </p>
              </div>
              {isGenerationExpired(currentGeneration) && (
                <div className="flex items-center gap-1.5 bg-amber-600/90 text-white px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Expired</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {generations.length > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-1 justify-center overflow-x-auto">
              {generations.slice(0, 10).map((gen, idx) => (
                <button
                  key={gen.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to generation ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedGeneration && (
        <GenerationDetailModal
          generation={selectedGeneration}
          onClose={() => setSelectedGeneration(null)}
        />
      )}
    </>
  );
}
