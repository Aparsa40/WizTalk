import { ServerCharacter } from './characters';
import {
  executeProvider,
  HistoryItem,
  Provider,
  providers,
  resolveConfiguredRoute,
} from './ai';

export const DEFAULT_RESPONSE_TIMEOUT_MS = 12000;

export type ResponseMode = 'text' | 'voice';

export interface ResponseManagerRequest {
  message: string;
  character: ServerCharacter;
  history?: HistoryItem[];
  mode?: ResponseMode;
}

export interface ResponseResult {
  response: string;
  source: 'model' | 'local' | 'fallback';
  provider: Provider;
  model: string;
  fallbackUsed: boolean;
  mode: ResponseMode;
}

export type ResponseExecutor = (
  provider: Provider,
  model: string,
  character: ServerCharacter,
  history: HistoryItem[],
  message: string
) => Promise<string>;

function isValidResponse(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
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

  async generate(request: ResponseManagerRequest): Promise<ResponseResult> {
    const message = request.message.trim();
    const mode = request.mode ?? 'text';
    if (!message) return this.finalFallback(mode);

    const history = (request.history ?? [])
      .filter(
        (item) =>
          (item.sender === 'user' || item.sender === 'character') &&
          typeof item.text === 'string'
      )
      .slice(-12);

    const modelPair = mode === 'voice'
      ? request.character.voiceModels
      : request.character.textModels;

    // A Character owns its complete route. No other Character's config is consulted.
    // In voice mode, voice model failure falls through to this same Character's text pair.
    const primary = modelPair.primary;
    const secondary = modelPair.secondary;
    const attempts = [primary, secondary]
      .filter((config) => config.enabled !== false)
      .map(resolveConfiguredRoute);

    for (const [index, attempt] of attempts.entries()) {
      try {
        const response = await withTimeout(
          this.execute(attempt.provider, attempt.model, request.character, history, message),
          this.timeoutMs
        );

        if (!isValidResponse(response)) throw new Error('provider returned an empty response');

        return {
          response: response.trim(),
          source: attempt.provider === 'local' ? 'local' : 'model',
          provider: attempt.provider,
          model: attempt.model,
          fallbackUsed: index > 0,
          mode,
        };
      } catch (error) {
        // Raw provider failures stay inside the manager and never reach the UI.
        console.warn(`Response provider ${attempt.provider} failed`, error);
      }
    }

    if (mode === 'voice') {
      const textResult = await this.runTextPipeline(request.character, history, message);
      return {
        ...textResult,
        fallbackUsed: true,
        mode,
      };
    }

    return this.finalFallback(mode);
  }

  private async runTextPipeline(
    character: ServerCharacter,
    history: HistoryItem[],
    message: string
  ): Promise<ResponseResult> {
    const attempts = [character.textModels.primary, character.textModels.secondary]
      .filter((config) => config.enabled !== false)
      .map(resolveConfiguredRoute);

    for (const [index, attempt] of attempts.entries()) {
      try {
        const response = await withTimeout(
          this.execute(attempt.provider, attempt.model, character, history, message),
          this.timeoutMs
        );
        if (!isValidResponse(response)) throw new Error('provider returned an empty response');

        return {
          response: response.trim(),
          source: attempt.provider === 'local' ? 'local' : 'model',
          provider: attempt.provider,
          model: attempt.model,
          fallbackUsed: index > 0,
          mode: 'text',
        };
      } catch (error) {
        console.warn(`Text response provider ${attempt.provider} failed`, error);
      }
    }

    return this.finalFallback('text');
  }

  private finalFallback(mode: ResponseMode): ResponseResult {
    return {
      response: 'فعلاً نتوانستم پاسخ مناسبی آماده کنم. لطفاً کمی بعد دوباره تلاش کن.',
      source: 'fallback',
      provider: 'local',
      model: providers.local.defaultModel,
      fallbackUsed: true,
      mode,
    };
  }
}

export const responseManager = new ResponseManager();
