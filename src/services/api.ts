import { Message, Provider } from '../types';

export class ApiService {
  static async getCharacters() {
    const res = await fetch('/api/characters');
    if (!res.ok) throw new Error('Failed to fetch characters');
    return res.json();
  }

  static async sendMessage(
    message: string, 
    characterId: string, 
    provider: Provider, 
    model: string, 
    openAiKey?: string
  ) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        characterId,
        provider,
        model,
        openAiKey
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate response');
    }

    return res.json();
  }
}
