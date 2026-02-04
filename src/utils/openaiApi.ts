const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-proxy`;

export class OpenAIAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'OpenAIAPIError';
  }
}

export async function improvePrompt(
  prompt: string,
  modelContext?: string
): Promise<string> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        modelContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new OpenAIAPIError(
        errorData.error || 'Failed to improve prompt',
        response.status
      );
    }

    const data = await response.json();
    return data.improvedPrompt;
  } catch (error) {
    if (error instanceof OpenAIAPIError) {
      throw error;
    }
    throw new OpenAIAPIError('Failed to connect to prompt improvement service');
  }
}
