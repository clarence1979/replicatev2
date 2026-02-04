import { Model, Prediction } from '../types/replicate';
import { applySchemaOverrides } from './schemaOverrides';
import { getParentApiKey } from './iframeApiKey';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/replicate-proxy`;
const CACHE_DURATION = 60 * 60 * 1000;

export class ReplicateAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ReplicateAPIError';
  }
}

interface VersionCache {
  versionId: string;
  versionCreatedAt: string;
  timestamp: number;
  schema: any;
  description: string;
  runCount: number;
  coverImageUrl: string;
}

export function getCachedVersion(owner: string, modelName: string): VersionCache | null {
  try {
    const cacheKey = `replicate_v2_${owner}_${modelName}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const data = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    if (age > CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function setCachedVersion(
  owner: string,
  modelName: string,
  versionId: string,
  versionCreatedAt: string,
  schema: any,
  description: string,
  runCount: number,
  coverImageUrl: string
): void {
  try {
    const cacheKey = `replicate_v2_${owner}_${modelName}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      versionId,
      versionCreatedAt,
      schema,
      description,
      runCount,
      coverImageUrl,
      timestamp: Date.now()
    }));
  } catch {
  }
}

export function clearVersionCache(owner: string, modelName: string): void {
  try {
    const cacheKey = `replicate_v2_${owner}_${modelName}`;
    localStorage.removeItem(cacheKey);
  } catch {
  }
}

async function proxyFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = `${PROXY_URL}?path=${encodeURIComponent(path)}`;

  // Check if API key is provided from parent window (iframe mode)
  const parentApiKey = getParentApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  // Add X-Replicate-Key header if provided from parent window
  if (parentApiKey) {
    headers['X-Replicate-Key'] = parentApiKey;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function fetchModel(
  owner: string,
  name: string,
  forceRefresh: boolean = false
): Promise<Model> {
  if (!forceRefresh) {
    const cached = getCachedVersion(owner, name);
    if (cached) {
      console.log(`Using cached version for ${owner}/${name}`);
      return {
        owner,
        name,
        description: cached.description,
        run_count: cached.runCount,
        cover_image_url: cached.coverImageUrl,
        url: `https://replicate.com/${owner}/${name}`,
        visibility: 'public',
        github_url: '',
        paper_url: '',
        license_url: '',
        default_example: null,
        latest_version: {
          id: cached.versionId,
          created_at: cached.versionCreatedAt,
          cog_version: '',
          openapi_schema: cached.schema
        }
      } as Model;
    }
  }

  const response = await proxyFetch(`/models/${owner}/${name}`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new ReplicateAPIError('Invalid API token. Please check your API key.', 401);
    }
    if (response.status === 404) {
      throw new ReplicateAPIError('Model not found. Please check the model URL format.', 404);
    }
    throw new ReplicateAPIError(`Failed to fetch model: ${response.statusText}`, response.status);
  }

  const model: Model = await response.json();

  if (model.latest_version?.openapi_schema?.components?.schemas?.Input?.properties) {
    model.latest_version.openapi_schema.components.schemas.Input.properties = applySchemaOverrides(
      owner,
      name,
      model.latest_version.openapi_schema.components.schemas.Input.properties
    );
  }

  setCachedVersion(
    owner,
    name,
    model.latest_version.id,
    model.latest_version.created_at,
    model.latest_version.openapi_schema,
    model.description,
    model.run_count,
    model.cover_image_url
  );

  return model;
}

export async function refreshModelVersion(
  owner: string,
  name: string
): Promise<{ model: Model; wasUpdated: boolean }> {
  const oldVersion = getCachedVersion(owner, name);
  const model = await fetchModel(owner, name, true);

  const wasUpdated = oldVersion ? oldVersion.versionId !== model.latest_version.id : false;

  return { model, wasUpdated };
}

export async function createPrediction(
  versionId: string,
  input: Record<string, any>
): Promise<Prediction> {
  console.log('Creating prediction with version:', versionId);
  console.log('Input data:', input);

  const response = await proxyFetch('/predictions', {
    method: 'POST',
    body: JSON.stringify({
      version: versionId,
      input,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Prediction creation failed:', errorData);
    console.error('Status:', response.status);
    console.error('Version ID used:', versionId);

    if (response.status === 422) {
      throw new ReplicateAPIError(
        `Invalid version or input parameters. ${errorData.detail || 'The model version may have been updated. Click "Check Updates" to refresh.'}`,
        response.status
      );
    }

    throw new ReplicateAPIError(
      errorData.detail || `Failed to create prediction: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export async function getPrediction(
  predictionId: string
): Promise<Prediction> {
  const response = await proxyFetch(`/predictions/${predictionId}`);

  if (!response.ok) {
    throw new ReplicateAPIError(
      `Failed to get prediction: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export function parseModelUrl(url: string): { owner: string; name: string } | null {
  const cleanUrl = url.trim();

  const patterns = [
    /^([^/]+)\/([^/]+)$/,
    /replicate\.com\/([^/]+)\/([^/?]+)/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      return { owner: match[1], name: match[2] };
    }
  }

  return null;
}

export function validateApiKey(apiKey: string): boolean {
  return apiKey.trim().length > 0 && apiKey.startsWith('r8_');
}

export async function getAccountInfo(): Promise<any> {
  const billingResponse = await proxyFetch('/billing/current');

  if (billingResponse.ok) {
    return billingResponse.json();
  }

  const accountResponse = await proxyFetch('/account');

  if (!accountResponse.ok) {
    throw new ReplicateAPIError(
      `Failed to fetch account info: ${accountResponse.statusText}`,
      accountResponse.status
    );
  }

  return accountResponse.json();
}
