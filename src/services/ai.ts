import { Provider, ProviderConfig } from '../types';

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'local',
    label: 'آفلاین (Local)',
    description:
      'پاسخ‌گویی با دانش محلی و بدون نیاز به اینترنت یا کلید API.',
    defaultModel: 'faq-keyword-v1',
    models: ['faq-keyword-v1'],
    requiresServerKey: false,
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    description:
      'مدل Gemini با کلید امن سمت سرور.',
    defaultModel: 'gemini-2.5-flash',
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
    ],
    requiresServerKey: true,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description:
      'مدل‌های OpenAI با کلید امن سمت سرور.',
    defaultModel: 'gpt-4o-mini',
    models: [
      'gpt-4o-mini',
      'gpt-4o',
    ],
    requiresServerKey: true,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description:
      'مدل‌های OpenRouter با کلید امن سمت سرور.',
    defaultModel:
      'minimax/minimax-m2.7:free',
    models: [
      'minimax/minimax-m2.7:free',
    ],
    requiresServerKey: true,
  },
];

export function getProviderConfig(
  provider: Provider
): ProviderConfig {
  return (
    PROVIDER_CONFIGS.find(
      (item) => item.id === provider
    ) || PROVIDER_CONFIGS[0]
  );
}

export function getDefaultModel(
  provider: Provider
): string {
  return getProviderConfig(provider).defaultModel;
}
