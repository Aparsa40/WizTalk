import { ServerCharacter } from './characters';
import { executeProvider, HistoryItem, Provider, providers, resolveConfiguredRoute } from './ai';

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
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); },
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
      const voiceResult = await this.runModelPair(request.character, history, message, voicePair.primary, voicePair.secondary, 'voice');
      if (voiceResult) return voiceResult;
    }

    // Text mode starts here; voice mode reaches the same Character-owned text pipeline
    // only after both voice model slots fail.
    const textPair = request.character.textModels;
    const textResult = await this.runModelPair(request.character, history, message, textPair.primary, textPair.secondary, mode);
    if (textResult) return textResult;

    // The offline engine is the final Character-local answer source before the
    // controlled application fallback. It never reads another Character's data.
    try {
      const localResponse = await withTimeout(
        this.execute('local', providers.local.defaultModel, request.character, history, message),
        this.timeoutMs,
      );
      if (isValidResponse(localResponse)) {
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
      try {
        const response = await withTimeout(
          this.execute(attempt.provider, attempt.model, character, history, message),
          this.timeoutMs,
        );
        if (!isValidResponse(response)) throw new Error('provider returned an empty response');

        return {
          response: response.trim(),
          source: attempt.provider === 'local' ? 'local' : 'model',
          provider: attempt.provider,
          model: attempt.model,
          fallbackUsed: index > 0 || mode === 'voice',
          mode,
        };
      } catch (error) {
        console.warn(`Response provider ${attempt.provider} failed`, error);
      }
    }

    return null;
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
