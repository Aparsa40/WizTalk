import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { findLocalAnswer } from './faq';
import { ServerCharacter } from './characters';

export type Provider = 'local' | 'gemini' | 'openai';
export interface HistoryItem { sender: 'user' | 'character'; text: string; }
export interface GenerateRequest { message: string; character: ServerCharacter; provider: Provider; model?: string; history?: HistoryItem[]; }
export interface ProviderConfig { id: Provider; label: string; description: string; defaultModel: string; models: string[]; requiresServerKey: boolean; }

export const providerConfigs: ProviderConfig[] = [
  { id: 'local', label: 'آفلاین (Local)', description: 'پاسخ‌گویی با FAQ محلی.', defaultModel: 'faq-keyword-v1', models: ['faq-keyword-v1'], requiresServerKey: false },
  { id: 'gemini', label: 'Google Gemini', description: 'مدل Gemini با کلید سمت سرور.', defaultModel: 'gemini-2.5-flash', models: ['gemini-2.5-flash', 'gemini-2.5-pro'], requiresServerKey: true },
  { id: 'openai', label: 'OpenAI', description: 'مدل OpenAI با کلید سمت سرور.', defaultModel: 'gpt-4o-mini', models: ['gpt-4o-mini', 'gpt-4o'], requiresServerKey: true },
];

function configFor(provider: Provider): ProviderConfig | undefined { return providerConfigs.find((item) => item.id === provider); }
function ensureKey(name: 'GEMINI_API_KEY' | 'OPENAI_API_KEY'): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('کلید ' + name + ' در محیط سرور تنظیم نشده است.');
  return value;
}

function historyText(history: HistoryItem[] = []): string {
  return history.slice(-12).map((item) => (item.sender === 'user' ? 'User: ' : 'Character: ') + item.text).join('\n');
}

export async function generateResponse(request: GenerateRequest): Promise<{ response: string; provider: Provider; model: string }> {
  const config = configFor(request.provider);
  if (!config) throw new Error('ارائه‌دهنده‌ی هوش مصنوعی نامعتبر است.');
  const model = request.model && config.models.includes(request.model) ? request.model : config.defaultModel;
  if (request.provider === 'local') return { response: await findLocalAnswer(request.message), provider: request.provider, model };

  const context = historyText(request.history);
  const prompt = context ? context + '\nUser: ' + request.message : request.message;
  if (request.provider === 'gemini') {
    const genAI = new GoogleGenAI({ apiKey: ensureKey('GEMINI_API_KEY') });
    const response = await genAI.models.generateContent({ model, contents: prompt, config: { systemInstruction: request.character.systemInstructions, temperature: 0.7 } });
    return { response: response.text || 'پاسخی دریافت نشد.', provider: request.provider, model };
  }

  const openai = new OpenAI({ apiKey: ensureKey('OPENAI_API_KEY') });
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: request.character.systemInstructions },
      ...(request.history || []).slice(-12).map((item) => ({ role: item.sender === 'user' ? 'user' as const : 'assistant' as const, content: item.text })),
      { role: 'user', content: request.message },
    ],
    temperature: 0.7,
  });
  return { response: completion.choices[0]?.message?.content || 'پاسخی دریافت نشد.', provider: request.provider, model };
}
