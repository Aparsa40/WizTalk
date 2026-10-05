import { db, now } from './database';

export interface ResponseLog {
  userId?: string;
  chatSessionId?: string;
  messageId?: string;
  characterId?: string;
  provider?: string;
  model?: string;
  success: boolean;
  latencyMs?: number;
  errorType?: string;
}

export function logResponse(data: ResponseLog): void {
  db.prepare(`
    INSERT INTO response_logs (
      user_id,
      chat_session_id,
      message_id,
      character_id,
      provider,
      model,
      success,
      latency_ms,
      error_type,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.userId ?? null,
    data.chatSessionId ?? null,
    data.messageId ?? null,
    data.characterId ?? null,
    data.provider ?? null,
    data.model ?? null,
    data.success ? 1 : 0,
    data.latencyMs ?? null,
    data.errorType ?? null,
    now(),
  );
}

export function classifyResponseError(error: unknown): string {
  const candidate = error as { status?: number; code?: string };
  const status = candidate?.status;

  if (status === 408) return 'TIMEOUT';
  if (status === 429) return 'RATE_LIMIT';
  if (typeof status === 'number' && status >= 500) return 'SERVER_ERROR';

  const code = String(candidate?.code ?? '').toUpperCase();
  if (code.includes('ECONNRESET') || code.includes('ENOTFOUND')) return 'NETWORK_ERROR';

  const message = String(error instanceof Error ? error.message : error ?? '').toLowerCase();
  if (/timeout|timed out/.test(message)) return 'TIMEOUT';
  if (/network|fetch failed|econnreset|enotfound/.test(message)) return 'NETWORK_ERROR';
  if (/empty response/.test(message)) return 'EMPTY_RESPONSE';

  return 'PROVIDER_ERROR';
}
