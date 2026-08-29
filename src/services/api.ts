import { Character, Message, Provider, ProviderConfig } from '../types';

export interface ChatResponse { response: string; provider: Provider; model: string; }

async function parseError(response: Response): Promise<Error> {
  try { const data = await response.json() as { error?: string }; return new Error(data.error || 'درخواست ناموفق بود.'); }
  catch { return new Error('ارتباط با سرور ناموفق بود.'); }
}

export class ApiService {
  static async getCharacters(): Promise<Character[]> {
    const response = await fetch('/api/characters');
    if (!response.ok) throw await parseError(response);
    return await response.json() as Character[];
  }

  static async getModels(): Promise<ProviderConfig[]> {
    const response = await fetch('/api/models');
    if (!response.ok) throw await parseError(response);
    return await response.json() as ProviderConfig[];
  }

  static async sendMessage(message: string, characterId: string, provider: Provider, model: string, history: Message[] = []): Promise<ChatResponse> {
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, characterId, provider, model, history: history.slice(-12) }),
    });
    if (!response.ok) throw await parseError(response);
    return await response.json() as ChatResponse;
  }
}
