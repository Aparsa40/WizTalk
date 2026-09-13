import { Character, Message } from '../types';

export type ChatMode = 'text' | 'voice';

export interface ChatResponse {
  response: string;
}

async function parseError(response: Response): Promise<Error> {
  try {
    const data = (await response.json()) as { error?: string };
    return new Error(data.error || 'درخواست ناموفق بود.');
  } catch {
    return new Error('ارتباط با سرور ناموفق بود.');
  }
}

export class ApiService {
  static async getCharacters(): Promise<Character[]> {
    const response = await fetch('/api/characters');
    if (!response.ok) throw await parseError(response);
    return (await response.json()) as Character[];
  }

  static async getModels(): Promise<never[]> {
    return [];
  }

  static async sendMessage(
    message: string,
    characterId: string,
    history: Message[] = [],
    mode: ChatMode = 'text'
  ): Promise<ChatResponse> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        characterId,
        history: history.slice(-12),
        mode,
      }),
    });

    if (!response.ok) throw await parseError(response);
    return (await response.json()) as ChatResponse;
  }
}
