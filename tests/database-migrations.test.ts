import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { runMigrations } from '../server/database/migration-runner';

test('database migrations create the durable WizTalk schema', () => {
  const database = new DatabaseSync(':memory:');
  runMigrations(database);

  const tables = database.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  ).all() as Array<{ name: string }>;

  const names = tables.map((row) => row.name);
  assert.ok(names.includes('users'));
  assert.ok(names.includes('sessions'));
  assert.ok(names.includes('chat_sessions'));
  assert.ok(names.includes('chat_messages'));
  assert.ok(names.includes('knowledge_documents'));
  assert.ok(names.includes('response_logs'));
  assert.ok(names.includes('schema_migrations'));
  assert.ok(names.includes('user_profiles'));
  assert.ok(names.includes('user_preferences'));
  assert.ok(names.includes('custom_characters'));
  assert.ok(names.includes('character_settings'));
  assert.ok(names.includes('memories'));

  const responseColumns = database.prepare(
    'PRAGMA table_info(response_logs)',
  ).all() as Array<{ name: string }>;
  const columnNames = responseColumns.map((column) => column.name);

  assert.ok(columnNames.includes('user_id'));
  assert.ok(columnNames.includes('chat_session_id'));
  assert.ok(columnNames.includes('message_id'));

  const migrations = database.prepare(
    'SELECT name FROM schema_migrations ORDER BY name',
  ).all() as Array<{ name: string }>;

  assert.deepEqual(
    migrations.map((row) => row.name),
    [
      '000_initial_schema.sql',
      '001_add_response_logs.sql',
      '002_extend_response_logs.sql',
      '003_user_data.sql',
    ],
  );

  database.close();
});
