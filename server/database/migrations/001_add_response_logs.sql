CREATE TABLE IF NOT EXISTS response_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    character_id TEXT,

    provider TEXT,

    model TEXT,

    success INTEGER NOT NULL,

    latency_ms INTEGER,

    error_type TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_response_logs_character
ON response_logs(character_id);


CREATE INDEX IF NOT EXISTS idx_response_logs_provider
ON response_logs(provider);
