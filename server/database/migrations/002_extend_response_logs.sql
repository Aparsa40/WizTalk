ALTER TABLE response_logs ADD COLUMN user_id TEXT;
ALTER TABLE response_logs ADD COLUMN chat_session_id TEXT;
ALTER TABLE response_logs ADD COLUMN message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_response_logs_user
ON response_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_response_logs_session
ON response_logs(chat_session_id);