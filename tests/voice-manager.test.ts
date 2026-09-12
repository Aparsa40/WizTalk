import assert from 'node:assert/strict';
import test from 'node:test';
import { VoiceManager, VoiceExecutor } from '../src/services/voice-manager';
import { Character } from '../src/types';

function character(provider: 'browser' | 'external' = 'browser'): Character {
  return {
    identity: {
      id: 'test-character',
      name: 'Test Character',
      displayName: 'Test Character',
      description: 'Test',
      role: 'assistant',
      personality: {
        description: 'calm',
        behavior: 'helpful',
        tone: 'warm',
        communicationStyle: 'natural',
      },
      greeting: 'سلام',
      systemInstructions: 'Test instructions',
    },
    avatar: { type: 'portrait', source: '/avatar.png' },
    knowledge: { faq: {}, raw: { content: '' }, sources: {} },
    textModels: { default: { provider: 'local', model: 'faq-keyword-v1' } },
    voiceModels: {
      default: {
        provider,
        language: 'fa-IR',
        enabled: true,
      },
    },
    settings: { enabled: true, source: 'builtin' },
  };
}

function executor(
  provider: 'browser' | 'external',
  speak: VoiceExecutor['speak']
): VoiceExecutor {
  return { provider, speak };
}

test('Voice Manager uses the configured provider first', async () => {
  const calls: string[] = [];
  const manager = new VoiceManager([
    executor('external', async () => {
      calls.push('external');
    }),
  ]);

  const result = await manager.speak('سلام', character('external'));

  assert.equal(result.spoken, true);
  assert.equal(result.provider, 'external');
  assert.deepEqual(calls, ['external']);
});

test('Voice Manager falls back to browser voice when configured provider fails', async () => {
  const calls: string[] = [];
  const manager = new VoiceManager([
    executor('external', async () => {
      calls.push('external');
      throw new Error('external unavailable');
    }),
    executor('browser', async () => {
      calls.push('browser');
    }),
  ]);

  const result = await manager.speak('سلام', character('external'));

  assert.equal(result.spoken, true);
  assert.equal(result.provider, 'browser');
  assert.deepEqual(calls, ['external', 'browser']);
});

test('Voice Manager returns a text-only result when voice is disabled', async () => {
  const manager = new VoiceManager([
    executor('external', async () => {
      throw new Error('should not run');
    }),
  ]);
  const disabled = character('external');
  disabled.voiceModels.default.enabled = false;

  const result = await manager.speak('سلام', disabled);

  assert.equal(result.spoken, false);
  assert.equal(result.provider, 'none');
});

test('Voice Manager preserves text-only behavior when every provider fails', async () => {
  const manager = new VoiceManager([
    executor('external', async () => {
      throw new Error('external unavailable');
    }),
  ]);

  const result = await manager.speak('سلام', character('external'));

  assert.equal(result.spoken, false);
  assert.equal(result.provider, 'none');
  assert.match(result.error ?? '', /external unavailable/);
});
