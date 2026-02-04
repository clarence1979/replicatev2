import { InputProperty } from '../types/replicate';

interface CostFactors {
  baseRate: number;
  multipliers: {
    duration?: number;
    frames?: number;
    steps?: number;
    resolution?: number;
    numOutputs?: number;
  };
}

export function calculateEstimatedCost(
  inputs: Record<string, any>,
  schema: Record<string, InputProperty>
): number {
  const baseCost = 0.0025;
  let costMultiplier = 1;

  const factors: Record<string, number> = {};

  Object.entries(inputs).forEach(([key, value]) => {
    const keyLower = key.toLowerCase();
    const property = schema[key];
    const descLower = property?.description?.toLowerCase() || '';

    if (typeof value === 'number' && value > 0) {
      if (keyLower.includes('duration') || descLower.includes('duration')) {
        factors.duration = value;
      }

      if (keyLower.includes('frames') || keyLower.includes('num_frames') || descLower.includes('frames')) {
        factors.frames = value;
      }

      if (keyLower.includes('steps') || keyLower.includes('num_inference_steps') || descLower.includes('inference steps')) {
        factors.steps = value;
      }

      if (keyLower.includes('outputs') || keyLower.includes('num_outputs') || descLower.includes('number of outputs')) {
        factors.numOutputs = value;
      }

      if (keyLower.includes('width') || keyLower.includes('height') || descLower.includes('resolution')) {
        if (!factors.resolution) factors.resolution = 1;
        factors.resolution *= value;
      }
    }

    if (typeof value === 'string') {
      const valueLower = value.toLowerCase();

      if (keyLower.includes('resolution') || descLower.includes('resolution')) {
        const resolutionMatch = value.match(/(\d+)x(\d+)/);
        if (resolutionMatch) {
          const [, width, height] = resolutionMatch;
          factors.resolution = parseInt(width) * parseInt(height);
        } else if (valueLower.includes('1080p') || valueLower === '1080') {
          factors.resolution = 1920 * 1080;
        } else if (valueLower.includes('720p') || valueLower === '720') {
          factors.resolution = 1280 * 720;
        } else if (valueLower.includes('4k')) {
          factors.resolution = 3840 * 2160;
        }
      }
    }
  });

  if (factors.duration) {
    costMultiplier *= Math.max(1, factors.duration / 3);
  }

  if (factors.frames) {
    costMultiplier *= Math.max(1, factors.frames / 24);
  }

  if (factors.steps) {
    costMultiplier *= Math.max(1, factors.steps / 20);
  }

  if (factors.numOutputs) {
    costMultiplier *= factors.numOutputs;
  }

  if (factors.resolution) {
    const baseResolution = 512 * 512;
    costMultiplier *= Math.max(1, factors.resolution / baseResolution);
  }

  return baseCost * costMultiplier;
}
