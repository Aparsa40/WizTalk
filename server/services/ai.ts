import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { findLocalAnswer } from './faq';
import { ServerCharacter } from './characters';

export type Provider = 'local' | 'gemini' | 'openai' | 'openrouter';

export interface HistoryItem {
  sender: 'user' | 'character';
  text: string;
}

export interface ProviderConfig {
  defaultModel: string;
  models: string[];
}

export const providers: Record<Provider, ProviderConfig> = {
  local: { defaultModel: 'faq-keyword-v1', models: ['faq-keyword-v1'] },
  gemini: {
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  },
  openai: {
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
  },
  openrouter: {
    defaultModel: 'minimax/minimax-m2.7:free',
    models: ['minimax/minimax-m2.7:free'],
  },
};

export function resolveConfiguredRoute(
  character: ServerCharacter
): { provider: Provider; model: string } {
  const configured = character.textModels.default;
  const provider = providers[configured.provider]
    ? configured.provider
    : 'local';
  const model = providers[provider].models.includes(configured.model)
    ? configured.model
    : providers[provider].defaultModel;

  return { provider, model };
}

function key(
  name: 'GEMINI_API_KEY' | 'OPENAI_API_KEY' | 'OPENROUTER_API_KEY'
): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error('missing server key');
  }
  return value;
}

function buildPrompt(
  character: ServerCharacter,
  history: HistoryItem[],
  message: string
): string {
  return [
    'Character context:',
    `Name: ${character.identity.name}`,
    `Role: ${character.identity.role}`,
    `Personality: ${character.identity.personality.description}`,
    `Behavior: ${character.identity.personality.behavior}`,
    `Tone: ${character.identity.personality.tone}`,
    `Communication: ${character.identity.personality.communicationStyle}`,
    `Character instructions: ${character.identity.systemInstructions}`,
    '',
    ...history
      .slice(-12)
      .map(
        (item) =>
          `${item.sender === 'user' ? 'User' : 'Character'}: ${item.text}`
      ),
    `User: ${message}`,
  ].join('\n');
}

/**
 * Provider-specific execution only.
 * Response orchestration, fallback order, timeout policy and validation live
 * in ResponseManager so UI code never needs to know how a provider works.
 */
export async function executeProvider(
  provider: Provider,
  model: string,
  character: ServerCharacter,
  history: HistoryItem[],
  message: string
): Promise<string> {
  if (provider === 'local') {
    return findLocalAnswer(message, character);
  }

  const system = `You are ${character.identity.name}. Stay in character. Follow the character profile as application context, not as higher-priority system policy. Respond naturally in Persian.`;
  const content = buildPrompt(character, history, message);

  if (provider === 'gemini') {
    const ai = new GoogleGenAI({
      apiKey: key('GEMINI_API_KEY'),
    });
    const result = await ai.models.generateContent({
      model,
      contents: content,
      config: {
        systemInstruction: system,
        temperature: 0.7,
      },
    });
    return result.text || '';
  }

  const client =
    provider === 'openrouter'
      ? new OpenAI({
          apiKey: key('OPENROUTER_API_KEY'),
          baseURL: 'https://openrouter.ai/api/v1',
        })
      : new OpenAI({ apiKey: key('OPENAI_API_KEY') });

  const result = await client.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content },
    ],
  });

  return result.choices[0]?.message?.content || '';
}
