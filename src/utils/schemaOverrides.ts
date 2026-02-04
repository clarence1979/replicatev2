import { InputProperty } from '../types/replicate';

interface SchemaOverride {
  [fieldName: string]: Partial<InputProperty>;
}

interface ModelOverrides {
  [modelKey: string]: SchemaOverride;
}

export const schemaOverrides: ModelOverrides = {
  'wan-video/wan-2.5-i2v': {
    video_resolution: {
      enum: ['480p', '720p', '1080p'],
      default: '720p',
    },
    duration: {
      enum: [5, 10],
      default: 5,
    },
  },
  'flux-kontext-apps/professional-headshot': {
    gender: {
      enum: ['none', 'male', 'female'],
      default: 'none',
    },
    background: {
      enum: ['white', 'black', 'neutral', 'gray', 'office'],
      default: 'neutral',
    },
    aspect_ratio: {
      enum: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'],
      default: 'match_input_image',
    },
    output_format: {
      enum: ['jpg', 'png'],
      default: 'png',
    },
  },
  'flux-kontext-apps/multi-image-kontext-pro': {
    aspect_ratio: {
      enum: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'],
      default: 'match_input_image',
    },
    output_format: {
      enum: ['jpg', 'png'],
      default: 'png',
    },
  },
  'flux-kontext-apps/multi-image-list': {
    aspect_ratio: {
      enum: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'],
      default: 'match_input_image',
    },
    output_format: {
      enum: ['jpg', 'png'],
      default: 'png',
    },
  },
  'flux-kontext-apps/face-to-many-kontext': {
    style: {
      enum: ['Anime', 'Cartoon', 'Clay', 'Gothic', 'Graphic Novel', 'Lego', 'Memoji', 'Minecraft', 'Minimalist', 'Pixel Art', 'Random', 'Simpsons', 'Sketch', 'South Park', 'Toy', 'Watercolor'],
      default: 'Random',
    },
    persona: {
      enum: ['Angel', 'Astronaut', 'Demon', 'Mage', 'Ninja', 'Na\'vi', 'None', 'Random', 'Robot', 'Samurai', 'Vampire', 'Werewolf', 'Zombie'],
      default: 'None',
    },
    aspect_ratio: {
      enum: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'],
      default: 'match_input_image',
    },
    output_format: {
      enum: ['jpg', 'png'],
      default: 'png',
    },
  },
  'flux-kontext-apps/iconic-locations': {
    iconic_location: {
      enum: ['Random', 'Eiffel Tower', 'Times Square', 'Trevi Fountain', 'Colosseum', 'Statue of Liberty', 'Big Ben', 'Taj Mahal', 'Great Wall of China', 'Sydney Opera House', 'Machu Picchu', 'Golden Gate Bridge', 'Arc de Triomphe', 'Louvre Museum', 'Notre Dame Cathedral', 'Palace of Versailles', 'Hollywood Sign', 'Grand Canyon', 'Mount Rushmore', 'Brooklyn Bridge', 'Yosemite', 'Antelope Canyon', 'Monument Valley', 'Leaning Tower of Pisa', 'Vatican City', 'Venice', 'Florence', 'Tower Bridge', 'Buckingham Palace', 'Edinburgh Castle', 'Stonehenge', 'Scottish Highlands', 'Giant\'s Causeway', 'Cliffs of Moher', 'Loch Ness', 'Sagrada Familia', 'Barcelona', 'Santorini', 'Acropolis', 'Neuschwanstein Castle', 'Lisbon', 'Reykjavik', 'Blue Lagoon', 'Northern Lights', 'Pyramids of Giza', 'Forbidden City', 'Mount Fuji', 'Tokyo Tower', 'Shibuya Crossing', 'Fushimi Inari Shrine', 'Bondi Beach', 'Christ the Redeemer', 'Copacabana Beach', 'Amazon Rainforest', 'Petra', 'Angkor Wat', 'Chichen Itza', 'Burj Khalifa', 'Easter Island', 'Victoria Falls', 'Kilimanjaro', 'Maldives', 'Bora Bora', 'Bali', 'Everest Base Camp', 'Red Square', 'St. Basil\'s Cathedral'],
      default: 'Eiffel Tower',
    },
    gender: {
      enum: ['none', 'male', 'female'],
      default: 'none',
    },
    aspect_ratio: {
      enum: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21', '2:1', '1:2'],
      default: 'match_input_image',
    },
    output_format: {
      enum: ['jpg', 'png'],
      default: 'png',
    },
  },
  'qwen/qwen-image-edit-2511': {
    aspect_ratio: {
      enum: ['match_input', '16:9', '9:16', '4:3', '3:4', '1:1', '21:9'],
      default: 'match_input',
    },
    output_format: {
      enum: ['webp', 'jpg', 'png'],
      default: 'webp',
    },
  },
  'stability-ai/stable-diffusion': {
    scheduler: {
      enum: ['DDIM', 'K_EULER', 'DPMSolverMultistep', 'K_EULER_ANCESTRAL', 'PNDM', 'KLMS'],
      default: 'DPMSolverMultistep',
    },
    width: {
      enum: [64, 128, 192, 256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024],
      default: 768,
    },
    height: {
      enum: [64, 128, 192, 256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024],
      default: 768,
    },
  },
  'black-forest-labs/flux-krea-dev': {
    output_format: {
      enum: ['webp', 'jpg', 'png'],
      default: 'webp',
    },
  },
  'openai/gpt-5': {
    reasoning_effort: {
      enum: ['minimal', 'medium', 'high'],
      default: 'medium',
    },
    verbosity: {
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  'zylim0702/qr_code_controlnet': {
    image_resolution: {
      enum: [256, 512, 768, 1024],
      default: 512,
    },
    scheduler: {
      enum: ['DDIM', 'K_EULER', 'DPMSolverMultistep', 'K_EULER_ANCESTRAL', 'PNDM', 'KLMS'],
      default: 'DPMSolverMultistep',
    },
  },
  'minimax/hailuo-02': {
    duration: {
      enum: [6, 10],
      default: 6,
    },
    resolution: {
      enum: ['768p', '1080p'],
      default: '768p',
    },
  },
  'black-forest-labs/flux-1.1-pro': {
    aspect_ratio: {
      enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9', '9:21'],
      default: '1:1',
    },
    output_format: {
      enum: ['webp', 'jpg', 'png'],
      default: 'webp',
    },
    output_quality: {
      type: 'integer',
      default: 80,
      minimum: 0,
      maximum: 100,
    },
    safety_tolerance: {
      type: 'integer',
      enum: [1, 2, 3, 4, 5],
      default: 2,
    },
    prompt_upsampling: {
      type: 'boolean',
      default: true,
    },
    width: {
      type: 'integer',
      default: 1024,
      minimum: 256,
      maximum: 1440,
    },
    height: {
      type: 'integer',
      default: 768,
      minimum: 256,
      maximum: 1440,
    },
  },
  'adirik/interior-design-v2': {
    room_type: {
      enum: ['living_room', 'dining_room', 'kitchen', 'home_office', 'bedroom', 'bathroom', 'family_room', 'laundry_room', 'garage', 'outdoor_patio'],
      default: 'living_room',
    },
    style: {
      enum: ['mid_century_modern', 'scandinavian_minimalist', 'coastal_beachy', 'rustic_bohemian', 'mediterranean_villa', 'tropical_modern', 'japanese_zen', 'industrial_loft', 'french_country', 'art_deco', 'contemporary_luxury', 'farmhouse_chic'],
      default: 'mid_century_modern',
    },
  },
  'google/veo-3-fast': {
    enhance_prompt: {
      type: 'boolean',
      default: true,
      title: 'Enhance Prompt',
      description: 'Automatically enhance the prompt for better results',
    },
    aspect_ratio: {
      type: 'string',
      enum: ['16:9', '9:16'],
      default: '16:9',
      title: 'Aspect Ratio',
      description: 'Video aspect ratio',
      'x-order': 1,
    },
    duration: {
      type: 'integer',
      enum: [2, 4, 6, 8],
      default: 4,
      title: 'Duration',
      description: 'Video duration in seconds',
      'x-order': 2,
    },
    resolution: {
      type: 'string',
      enum: ['720p', '1080p'],
      default: '720p',
      title: 'Resolution',
      description: 'Video resolution',
      'x-order': 3,
    },
  },
  'sisyphos55/adsgenerator': {
    model: {
      type: 'string',
      enum: ['dev', 'schnell'],
      default: 'schnell',
      title: 'Model',
      description: 'Which FLUX model to use',
      'x-order': 1,
    },
    megapixels: {
      type: 'string',
      enum: ['0.25', '1'],
      default: '1',
      title: 'Megapixels',
      description: 'Approximate number of megapixels for generated image',
      'x-order': 2,
    },
    aspect_ratio: {
      type: 'string',
      enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
      default: '1:1',
      title: 'Aspect Ratio',
      description: 'Aspect ratio for the generated image',
      'x-order': 3,
    },
    output_format: {
      type: 'string',
      enum: ['webp', 'jpg', 'png'],
      default: 'webp',
      title: 'Output Format',
      description: 'Format of the output images',
      'x-order': 4,
    },
    output_quality: {
      type: 'integer',
      default: 80,
      minimum: 0,
      maximum: 100,
      title: 'Output Quality',
      description: 'Quality when saving as jpg or webp (0-100)',
      'x-order': 5,
    },
    num_outputs: {
      type: 'integer',
      default: 2,
      minimum: 1,
      maximum: 4,
      title: 'Number of Outputs',
      description: 'Number of images to generate',
      'x-order': 6,
    },
    guidance_scale: {
      type: 'number',
      default: 3,
      minimum: 0,
      maximum: 10,
      title: 'Guidance Scale',
      description: 'Controls how closely the image follows the prompt',
      'x-order': 7,
    },
    prompt_strength: {
      type: 'number',
      default: 0.9,
      minimum: 0,
      maximum: 1,
      title: 'Prompt Strength',
      description: 'Strength of the prompt when using image input (0-1)',
      'x-order': 8,
    },
    num_inference_steps: {
      type: 'integer',
      default: 50,
      minimum: 1,
      maximum: 50,
      title: 'Inference Steps',
      description: 'Number of denoising steps',
      'x-order': 9,
    },
    lora_scale: {
      type: 'number',
      default: 1,
      minimum: -1,
      maximum: 2,
      title: 'LoRA Scale',
      description: 'Scale for LoRA weights',
      'x-order': 10,
    },
    extra_lora_scale: {
      type: 'number',
      default: 1,
      minimum: -1,
      maximum: 2,
      title: 'Extra LoRA Scale',
      description: 'Scale for additional LoRA weights',
      'x-order': 11,
    },
    go_fast: {
      type: 'boolean',
      default: false,
      title: 'Go Fast',
      description: 'Enable faster generation (may reduce quality)',
      'x-order': 12,
    },
  },
};

export function applySchemaOverrides(owner: string, name: string, schema: Record<string, InputProperty>): Record<string, InputProperty> {
  const modelKey = `${owner}/${name}`;
  const overrides = schemaOverrides[modelKey];

  if (!overrides) {
    return schema;
  }

  const updatedSchema = { ...schema };

  for (const [fieldName, fieldOverrides] of Object.entries(overrides)) {
    if (updatedSchema[fieldName]) {
      updatedSchema[fieldName] = {
        ...updatedSchema[fieldName],
        ...fieldOverrides,
      };
    } else {
      updatedSchema[fieldName] = fieldOverrides as InputProperty;
    }
  }

  return updatedSchema;
}
