import { db, now } from './database';

export interface ResponseLog {
  userId?: string;
  chatSessionId?: string;
  messageId?: string;
  characterId?: string;
  provider?: string;
  model?: string;
  success: boolean;
  latencyMs: number;
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
    Math.max(0, Math.round(data.latencyMs)),
    data.errorType?.slice(0, 160) ?? null,
    now(),
  );
}
