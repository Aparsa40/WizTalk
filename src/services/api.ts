import { Character, Message } from '../types';

export type ChatMode = 'text' | 'voice';
export interface ChatResponse { response: string; message: Message; sessionId: string; }
export interface AuthUser { id: string; username: string; }
export interface AuthStatus { authenticated: boolean; user: AuthUser | null; }
export interface ChatSession { id: string; characterId: string; title: string; createdAt: number; updatedAt: number; }
export interface KnowledgeDocument { id: string; characterId: string; title: string; content: string; createdAt: number; updatedAt: number; }

async function parseError(response: Response): Promise<Error> {
  try {
    const data = (await response.json()) as { error?: string };
    return new Error(data.error || 'درخواست ناموفق بود.');
  } catch {
    return new Error('ارتباط با سرور ناموفق بود.');
  }
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { credentials: 'same-origin', ...init });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}

export class ApiService {
  static async authStatus(): Promise<AuthStatus> { return request('/api/auth/status'); }

  static async register(username: string, password: string): Promise<{ user: AuthUser }> {
    return request('/api/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username,password}) });
  }

  static async login(username: string, password: string): Promise<{ user: AuthUser }> {
    return request('/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username,password}) });
  }

  static async logout(): Promise<void> {
    await request('/api/auth/logout', { method: 'POST' });
  }

  static async getCharacters(): Promise<Character[]> { return request('/api/characters'); }

  static async createSession(characterId: string): Promise<{ session: ChatSession; messages: Message[] }> {
    return request('/api/sessions', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ characterId }) });
  }

  static async getSession(sessionId: string): Promise<{ session: ChatSession; messages: Message[] }> {
    return request(`/api/sessions/${encodeURIComponent(sessionId)}`);
  }

  static async listSessions(characterId?: string): Promise<ChatSession[]> {
    const query = characterId ? `?characterId=${encodeURIComponent(characterId)}` : '';
    return request(`/api/sessions${query}`);
  }

  static async deleteSession(sessionId: string): Promise<void> {
    await request(`/api/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
  }

  static async sendMessage(message: string, sessionId: string, mode: ChatMode = 'text'): Promise<ChatResponse> {
    return request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, mode }),
    });
  }

  static downloadSessionUrl(sessionId: string): string {
    return `/api/sessions/${encodeURIComponent(sessionId)}/download`;
  }

  static async listKnowledge(characterId: string): Promise<KnowledgeDocument[]> {
    return request(`/api/knowledge/${encodeURIComponent(characterId)}`);
  }

  static async addKnowledge(characterId: string, title: string, content: string): Promise<KnowledgeDocument> {
    return request(`/api/knowledge/${encodeURIComponent(characterId)}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({title, content}),
    });
  }

  static async deleteKnowledge(characterId: string, documentId: string): Promise<void> {
    await request(`/api/knowledge/${encodeURIComponent(characterId)}/${encodeURIComponent(documentId)}`, { method: 'DELETE' });
  }
}
