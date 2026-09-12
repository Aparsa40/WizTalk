import { ServerCharacter } from './characters';
import {
  executeProvider,
  HistoryItem,
  Provider,
  providers,
  resolveConfiguredRoute,
} from './ai';

export const DEFAULT_RESPONSE_TIMEOUT_MS = 12000;

export interface ResponseManagerRequest {
  message: string;
  character: ServerCharacter;
  history?: HistoryItem[];
}

export interface ResponseResult {
  response: string;
  source: 'model' | 'local' | 'fallback';
  provider: Provider;
  model: string;
  fallbackUsed: boolean;
}

export type ResponseExecutor = (
  provider: Provider,
  model: string,
  character: ServerCharacter,
  history: HistoryItem[],
  message: string
) => Promise<string>;

export const fallbackOrder: Provider[] = [
  'gemini',
  'openai',
  'openrouter',
  'local',
];

function isValidResponse(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('response provider timeout')),
      timeoutMs
    );

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export class ResponseManager {
  constructor(
    private readonly execute: ResponseExecutor = executeProvider,
    private readonly timeoutMs = DEFAULT_RESPONSE_TIMEOUT_MS
  ) {}

  async generate(
    request: ResponseManagerRequest
  ): Promise<ResponseResult> {
    const message = request.message.trim();
    if (!message) {
      return this.finalFallback();
    }

    const history = (request.history ?? []).filter(
      (item) =>
        (item.sender === 'user' || item.sender === 'character') &&
        typeof item.text === 'string'
    ).slice(-12);

    const configured = resolveConfiguredRoute(request.character);
    const attempts: Array<{ provider: Provider; model: string }> = [
      configured,
      ...fallbackOrder
        .filter((provider) => provider !== configured.provider)
        .map((provider) => ({
          provider,
          model: providers[provider].defaultModel,
        })),
    ];

    for (const [index, attempt] of attempts.entries()) {
      try {
        const response = await withTimeout(
          this.execute(
            attempt.provider,
            attempt.model,
            request.character,
            history,
            message
          ),
          this.timeoutMs
        );

        if (!isValidResponse(response)) {
          throw new Error('provider returned an empty response');
        }

        const isLocal = attempt.provider === 'local';
        return {
          response: response.trim(),
          source: isLocal ? 'local' : 'model',
          provider: attempt.provider,
          model: attempt.model,
          fallbackUsed: index > 0,
        };
      } catch (error) {
        // Provider errors are intentionally contained here. The UI receives
        // neither provider details nor raw exception messages.
        console.warn(
          `Response provider ${attempt.provider} failed`,
          error
        );
      }
    }

    return this.finalFallback();
  }

  private finalFallback(): ResponseResult {
    return {
      response:
        'فعلاً نتوانستم پاسخ مناسبی آماده کنم. لطفاً کمی بعد دوباره تلاش کن.',
      source: 'fallback',
      provider: 'local',
      model: providers.local.defaultModel,
      fallbackUsed: true,
    };
  }
}

export const responseManager = new ResponseManager();
