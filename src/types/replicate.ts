export interface ModelVersion {
  id: string;
  created_at: string;
  cog_version: string;
  openapi_schema: {
    info: {
      title: string;
      version: string;
    };
    components: {
      schemas: {
        Input: {
          type: string;
          properties: Record<string, InputProperty>;
          required?: string[];
        };
        Output: {
          type: string;
          [key: string]: any;
        };
      };
    };
  };
}

export interface InputProperty {
  type: string;
  title?: string;
  description?: string;
  default?: any;
  enum?: string[] | number[];
  const?: string | number;
  minimum?: number;
  maximum?: number;
  format?: string;
  items?: InputProperty;
  allOf?: Array<{ $ref?: string; enum?: string[] | number[]; const?: string | number }>;
  anyOf?: Array<{ enum?: string[] | number[]; const?: string | number; type?: string }>;
  oneOf?: Array<{ enum?: string[] | number[]; const?: string | number; type?: string }>;
  'x-order'?: number;
}

export interface Model {
  url: string;
  owner: string;
  name: string;
  description: string;
  visibility: string;
  github_url: string;
  paper_url: string;
  license_url: string;
  run_count: number;
  cover_image_url: string;
  default_example: any;
  latest_version: ModelVersion;
}

export interface Prediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  input: Record<string, any>;
  output?: any;
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  urls?: {
    get: string;
    cancel: string;
  };
}

export interface PredictionHistory {
  id: string;
  modelUrl: string;
  timestamp: string;
  status: string;
  cost?: number;
  output?: any;
}
