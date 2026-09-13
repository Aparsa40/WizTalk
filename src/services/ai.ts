import { Provider, ProviderConfig } from '../types';

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'local',
    label: 'آفلاین (Local)',
    description: 'پاسخ‌گویی با دانش محلی همان شخصیت، بدون کلید API.',
    defaultModel: 'faq-keyword-v1',
    models: ['faq-keyword-v1'],
    requiresServerKey: false,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'مدل OpenRouter با کلید امن سمت سرور.',
    defaultModel: 'minimax/minimax-m2.7:free',
    models: ['minimax/minimax-m2.7:free'],
    requiresServerKey: true,
  },
  {
    id: 'huggingface',
    label: 'Hugging Face',
    description: 'مدل Hugging Face Inference Providers با توکن امن سمت سرور.',
    defaultModel: 'Qwen/Qwen3.8-27B:fastest',
    models: ['Qwen/Qwen3.8-27B:fastest'],
    requiresServerKey: true,
  },
];

export function getProviderConfig(provider: Provider): ProviderConfig {
  return PROVIDER_CONFIGS.find((item) => item.id === provider) || PROVIDER_CONFIGS[0];
}

export function getDefaultModel(provider: Provider): string {
  return getProviderConfig(provider).defaultModel;
}
