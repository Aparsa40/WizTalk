import assert from 'node:assert/strict';
import test from 'node:test';
import { ResponseManager, DEFAULT_RESPONSE_TIMEOUT_MS } from '../server/services/response-manager';
import type { Provider } from '../server/services/ai';
import { normalizeCharacter } from '../src/types';

function character() {
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
    textModels: {
      primary: { provider: 'openrouter', model: 'minimax/minimax-m2.7:free', enabled: true },
      secondary: { provider: 'huggingface', model: 'Qwen/Qwen3.8-27B:fastest', enabled: true },
    },
    voiceModels: {
      primary: { provider: 'openrouter', model: 'minimax/minimax-m2.7:free', enabled: true },
      secondary: { provider: 'huggingface', model: 'Qwen/Qwen3.8-27B:fastest', enabled: true },
      output: { provider: 'browser', language: 'fa-IR', enabled: true },
    },
  });
}

test('text primary success stops before secondary and offline', async () => {
  const calls: Array<[Provider, string]> = [];
  const manager = new ResponseManager(async (provider, model) => {
    calls.push([provider, model]);
    return 'پاسخ مدل اول';
  });

  const result = await manager.generate({ message: 'سلام', character: character(), mode: 'text' });
  assert.equal(result.response, 'پاسخ مدل اول');
  assert.equal(result.fallbackUsed, false);
  assert.deepEqual(calls, [['openrouter', 'minimax/minimax-m2.7:free']]);
});

test('text primary failure uses the character secondary model', async () => {
  const calls: Provider[] = [];
  const manager = new ResponseManager(async (provider) => {
    calls.push(provider);
    if (provider === 'openrouter') throw new Error('primary failed');
    return 'پاسخ مدل دوم';
  });

  const result = await manager.generate({ message: 'کمک', character: character(), mode: 'text' });
  assert.equal(result.response, 'پاسخ مدل دوم');
  assert.equal(result.provider, 'huggingface');
  assert.deepEqual(calls, ['openrouter', 'huggingface']);
});

test('text models failing reaches the character local engine before final fallback', async () => {
  const calls: Provider[] = [];
  const localCharacter = normalizeCharacter({
    ...character(),
    knowledge: { faq: { entries: [{ keywords: ['کتاب'], response: 'پاسخ محلی هری' }] }, raw: { content: '' }, sources: {} },
  });
  const manager = new ResponseManager(async (provider) => {
    calls.push(provider);
    if (provider !== 'local') throw new Error('model failed');
    return 'پاسخ محلی هری';
  });

  const result = await manager.generate({ message: 'کتاب', character: localCharacter, mode: 'text' });
  assert.equal(result.response, 'پاسخ محلی هری');
  assert.equal(result.source, 'local');
  assert.equal(calls.at(-1), 'local');
});

test('voice primary success stops the voice chain and does not call text', async () => {
  const calls: Array<[Provider, string]> = [];
  const manager = new ResponseManager(async (provider, model) => {
    calls.push([provider, model]);
    return 'پاسخ ویس اول';
  });

  const result = await manager.generate({ message: 'سلام', character: character(), mode: 'voice' });
  assert.equal(result.response, 'پاسخ ویس اول');
  assert.equal(result.mode, 'voice');
  assert.deepEqual(calls, [['openrouter', 'minimax/minimax-m2.7:free']]);
});

test('voice primary failure falls to voice secondary', async () => {
  const calls: Provider[] = [];
  const manager = new ResponseManager(async (provider) => {
    calls.push(provider);
    if (provider === 'openrouter') throw new Error('voice primary failed');
    return 'پاسخ ویس دوم';
  });

  const result = await manager.generate({ message: 'سلام', character: character(), mode: 'voice' });
  assert.equal(result.response, 'پاسخ ویس دوم');
  assert.equal(result.provider, 'huggingface');
  assert.deepEqual(calls, ['openrouter', 'huggingface']);
});

test('both voice models failing invoke the same character text pipeline', async () => {
  const calls: Array<[Provider, string]> = [];
  const manager = new ResponseManager(async (provider, model) => {
    calls.push([provider, model]);
    if (calls.length <= 2) throw new Error('voice failed');
    return 'پاسخ متنی برای ویس';
  });

  const result = await manager.generate({ message: 'یک سؤال', character: character(), mode: 'voice' });
  assert.equal(result.response, 'پاسخ متنی برای ویس');
  assert.equal(result.mode, 'voice');
  assert.deepEqual(calls, [
    ['openrouter', 'minimax/minimax-m2.7:free'],
    ['huggingface', 'Qwen/Qwen3.8-27B:fastest'],
    ['openrouter', 'minimax/minimax-m2.7:free'],
  ]);
});

test('all voice and text sources failing return a controlled fallback', async () => {
  const manager = new ResponseManager(async () => {
    throw new Error('failure');
  });

  const result = await manager.generate({ message: 'سلام', character: character(), mode: 'voice' });
  assert.equal(result.source, 'fallback');
  assert.equal(result.provider, 'local');
  assert.match(result.response, /نتوانستم پاسخ مناسبی/);
});

test('empty provider responses are invalid and continue the chain', async () => {
  const calls: Provider[] = [];
  const manager = new ResponseManager(async (provider) => {
    calls.push(provider);
    return provider === 'openrouter' ? '   ' : 'پاسخ معتبر';
  });

  const result = await manager.generate({ message: 'سؤال', character: character(), mode: 'text' });
  assert.equal(result.provider, 'huggingface');
  assert.deepEqual(calls, ['openrouter', 'huggingface']);
});

test('manager timeout remains bounded', () => {
  assert.ok(DEFAULT_RESPONSE_TIMEOUT_MS > 0);
  assert.ok(DEFAULT_RESPONSE_TIMEOUT_MS <= 30000);
});
