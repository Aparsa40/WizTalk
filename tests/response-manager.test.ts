import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ResponseManager,
  DEFAULT_RESPONSE_TIMEOUT_MS,
} from '../server/services/response-manager';
import type { Provider } from '../server/services/ai';
import { normalizeCharacter } from '../src/types';

function character(overrides: Record<string, unknown> = {}) {
  return normalizeCharacter({
    id: 'harry',
    name: 'Harry',
    displayName: 'هری',
    description: 'test character',
    role: 'assistant',
    personality: { description: 'helpful' },
    greeting: 'سلام',
    systemInstructions: 'stay in character',
    avatar: 'harry.png',
    ai: { provider: 'gemini', model: 'gemini-2.5-flash' },
    voice: { provider: 'browser', language: 'fa-IR', enabled: true },
    ...overrides,
  });
}

test('uses the configured character model when it succeeds', async () => {
  const calls: Array<[Provider, string]> = [];
  const manager = new ResponseManager(async (provider, model) => {
    calls.push([provider, model]);
    return 'پاسخ مدل';
  });

  const result = await manager.generate({
    message: 'سلام',
    character: character(),
  });

  assert.equal(result.response, 'پاسخ مدل');
  assert.equal(result.source, 'model');
  assert.equal(result.fallbackUsed, false);
  assert.deepEqual(calls, [['gemini', 'gemini-2.5-flash']]);
});

test('falls back to the next model after a provider failure', async () => {
  const calls: Provider[] = [];
  const manager = new ResponseManager(async (provider) => {
    calls.push(provider);
    if (provider === 'gemini') throw new Error('provider unavailable');
    return 'پاسخ fallback';
  });

  const result = await manager.generate({
    message: 'کمک',
    character: character(),
  });

  assert.equal(result.response, 'پاسخ fallback');
  assert.equal(result.provider, 'openai');
  assert.equal(result.fallbackUsed, true);
  assert.deepEqual(calls, ['gemini', 'openai']);
});

test('skips empty model responses and continues the fallback chain', async () => {
  const calls: Provider[] = [];
  const manager = new ResponseManager(async (provider) => {
    calls.push(provider);
    if (provider === 'gemini') return '   ';
    return 'پاسخ معتبر';
  });

  const result = await manager.generate({
    message: 'سؤال',
    character: character(),
  });

  assert.equal(result.response, 'پاسخ معتبر');
  assert.equal(result.provider, 'openai');
  assert.deepEqual(calls, ['gemini', 'openai']);
});

test('uses local knowledge when the configured model fails', async () => {
  const calls: Provider[] = [];
  const manager = new ResponseManager(async (provider) => {
    calls.push(provider);
    if (provider !== 'local') throw new Error('model failure');
    return 'پاسخ FAQ';
  });

  const result = await manager.generate({
    message: 'کتاب',
    character: character(),
  });

  assert.equal(result.response, 'پاسخ FAQ');
  assert.equal(result.source, 'local');
  assert.equal(result.provider, 'local');
  assert.equal(result.fallbackUsed, true);
  assert.equal(calls.at(-1), 'local');
});

test('returns a controlled final fallback when every source fails', async () => {
  const manager = new ResponseManager(async () => {
    throw new Error('failure');
  });

  const result = await manager.generate({
    message: 'سلام',
    character: character(),
  });

  assert.equal(result.source, 'fallback');
  assert.equal(result.provider, 'local');
  assert.match(result.response, /نتوانستم پاسخ مناسبی/);
});

test('times out a slow provider and continues to fallback', async () => {
  const manager = new ResponseManager(
    async (provider) => {
      if (provider === 'gemini') {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      return provider === 'openai' ? 'پاسخ سریع' : '';
    },
    10
  );

  const result = await manager.generate({
    message: 'سلام',
    character: character(),
  });

  assert.equal(result.response, 'پاسخ سریع');
  assert.equal(result.provider, 'openai');
});

test('keeps the manager timeout bounded and explicit', () => {
  assert.ok(DEFAULT_RESPONSE_TIMEOUT_MS > 0);
  assert.ok(DEFAULT_RESPONSE_TIMEOUT_MS <= 30000);
});
