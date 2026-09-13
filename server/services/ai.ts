import OpenAI from 'openai';
import { findLocalAnswer } from './faq';
import { ServerCharacter } from './characters';

export type Provider = 'local' | 'openrouter' | 'huggingface';

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
  openrouter: {
    defaultModel: 'minimax/minimax-m2.7:free',
    models: ['minimax/minimax-m2.7:free'],
  },
  huggingface: {
    defaultModel: 'Qwen/Qwen3.8-27B:fastest',
    models: ['Qwen/Qwen3.8-27B:fastest'],
  },
};

export function resolveConfiguredRoute(
  modelConfig: ServerCharacter['textModels']['primary']
): { provider: Provider; model: string } {
  const provider = providers[modelConfig.provider]
    ? modelConfig.provider
    : 'local';
  const model = providers[provider].models.includes(modelConfig.model)
    ? modelConfig.model
    : providers[provider].defaultModel;

  return { provider, model };
}

function key(name: 'OPENROUTER_API_KEY' | 'HF_TOKEN'): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('missing server key');
  return value;
}

function buildPrompt(
  character: ServerCharacter,
  history: HistoryItem[],
  message: string
): string {
  const rawKnowledge = character.knowledge.raw.content.trim();
  const knowledgeContext = rawKnowledge
    ? rawKnowledge.slice(0, 8000)
    : 'No additional raw knowledge is configured.';

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
    'Character knowledge:',
    knowledgeContext,
    '',
    ...history.slice(-12).map(
      (item) => `${item.sender === 'user' ? 'User' : 'Character'}: ${item.text}`
    ),
    `User: ${message}`,
  ].join('\n');
}

/** Provider execution only. Fallback decisions belong to ResponseManager. */
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

  const client = new OpenAI({
    apiKey: key(provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 'HF_TOKEN'),
    baseURL:
      provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1'
        : 'https://router.huggingface.co/v1',
  });

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
