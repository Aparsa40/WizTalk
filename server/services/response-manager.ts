import { ServerCharacter } from './characters';
import { executeProvider, HistoryItem, Provider, providers, resolveConfiguredRoute } from './ai';
import {
  registerProviderFailure,
  registerProviderSuccess
} from './provider-health';

import { logResponse } from './response-logger';

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
    const timer = setTimeout(() => reject(new Error('response provider timeout')), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
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
      .filter((item) => (item.sender === 'user' || item.sender === 'character') && typeof item.text === 'string')
      .slice(-12);

    const voicePair = request.character.voiceModels;

    if (mode === 'voice') {
      const voiceResult = await this.runModelPair(
        request.character,
        history,
        message,
        voicePair.primary,
        voicePair.secondary,
        'voice',
      );

      if (voiceResult) return voiceResult;
    }

    const textPair = request.character.textModels;

    const textResult = await this.runModelPair(
      request.character,
      history,
      message,
      textPair.primary,
      textPair.secondary,
      mode,
    );

    if (textResult) return textResult;

    try {
      const start = Date.now();

      const localResponse = await withTimeout(
        this.execute(
          'local',
          providers.local.defaultModel,
          request.character,
          history,
          message,
        ),
        this.timeoutMs,
      );

      const latencyMs = Date.now() - start;

      if (isValidResponse(localResponse)) {
        await logResponse({
          characterId: request.character.id,
          provider: 'local',
          model: providers.local.defaultModel,
          success: true,
          latencyMs,
        });

        return {
          response: localResponse.trim(),
          source: 'local',
          provider: 'local',
          model: providers.local.defaultModel,
          fallbackUsed: true,
          mode,
        };
      }
    } catch (error) {
      console.warn('Character-local offline response engine failed', error);
    }

    return this.finalFallback(mode);
  }


  private async runModelPair(
    character: ServerCharacter,
    history: HistoryItem[],
    message: string,
    primary: ServerCharacter['textModels']['primary'],
    secondary: ServerCharacter['textModels']['secondary'],
    mode: ResponseMode,
  ): Promise<ResponseResult | null> {

    const attempts = [primary, secondary]
      .filter((config) => config.enabled !== false)
      .map(resolveConfiguredRoute);


    for (const [index, attempt] of attempts.entries()) {

      const startedAt = Date.now();

      try {

        let response = '';
        let lastError: unknown;


        for (let retry = 0; retry < 2; retry += 1) {

          try {

            response = await withTimeout(
              this.execute(
                attempt.provider,
                attempt.model,
                character,
                history,
                message,
              ),
              this.timeoutMs,
            );


            if (!isValidResponse(response)) {
              throw new Error('provider returned an empty response');
            }


            break;


          } catch (error) {

            lastError = error;


            if (!this.isRetryable(error) || retry === 1) {
              break;
            }

          }
        }


        if (!isValidResponse(response)) {
          throw lastError instanceof Error
            ? lastError
            : new Error('provider request failed');
        }


        const latencyMs = Date.now() - startedAt;


        registerProviderSuccess(attempt.provider);


        await logResponse({
          characterId: character.id,
          provider: attempt.provider,
          model: attempt.model,
          success: true,
          latencyMs,
        });


        return {
          response: response.trim(),
          source: attempt.provider === 'local' ? 'local' : 'model',
          provider: attempt.provider,
          model: attempt.model,
          fallbackUsed: index > 0 || mode === 'voice',
          mode,
        };


      } catch (error) {

        const latencyMs = Date.now() - startedAt;


        registerProviderFailure(attempt.provider);


        await logResponse({
          characterId: character.id,
          provider: attempt.provider,
          model: attempt.model,
          success: false,
          latencyMs,
          errorType: error instanceof Error ? error.message : 'unknown_error',
        });


        console.warn(
          `Response provider ${attempt.provider} failed`,
          error,
        );

      }
    }

    return null;
  }


  private isRetryable(error: unknown): boolean {

    const candidate = error as {
      status?: number;
      code?: string;
      message?: string;
    };


    const status = candidate?.status;


    if (typeof status === 'number') {
      return status === 408 || status === 429 || status >= 500;
    }


    const message = String(
      candidate?.message ?? error ?? '',
    ).toLowerCase();


    return /timeout|timed out|network|fetch failed|econnreset|enotfound|temporar|503|502|429/.test(message);
  }


  private finalFallback(mode: ResponseMode): ResponseResult {

    return {
      response:
        'فعلاً نتوانستم پاسخ مناسبی آماده کنم. لطفاً کمی بعد دوباره تلاش کن.',
      source: 'fallback',
      provider: 'local',
      model: providers.local.defaultModel,
      fallbackUsed: true,
      mode,
    };

  }
}


export const responseManager = new ResponseManager();
