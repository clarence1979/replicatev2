export interface StudentGeneration {
  id: string;
  student_name: string;
  created_at: string;
  model_name: string;
  model_version?: string;
  generation_type: 'image' | 'video' | 'audio' | 'text' | '3d';
  content_url: string;
  thumbnail_url?: string;
  input_data: Record<string, unknown>;
  prediction_id?: string;
  output_data?: unknown;
}

export function isGenerationExpired(generation: StudentGeneration): boolean {
  const createdAt = new Date(generation.created_at);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceCreation > 1;
}

export function getTimeUntilExpiry(generation: StudentGeneration): string {
  const createdAt = new Date(generation.created_at);
  const expiryTime = new Date(createdAt.getTime() + 60 * 60 * 1000); // 1 hour later
  const now = new Date();
  const minutesRemaining = Math.floor((expiryTime.getTime() - now.getTime()) / (1000 * 60));

  if (minutesRemaining <= 0) {
    return 'Expired';
  } else if (minutesRemaining < 60) {
    return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining`;
  } else {
    return 'Less than 1 hour remaining';
  }
}
