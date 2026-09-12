import assert from 'node:assert/strict';
import test from 'node:test';
import { listCharacters, getCharacter } from '../server/services/characters';
import { normalizeCharacter } from '../src/types';
import { VoiceManager } from '../src/services/voice-manager';

function makeCharacter(overrides: Record<string, unknown> = {}) {
  return normalizeCharacter({
    id: 'integration-character',
    name: 'Integration Character',
    displayName: 'شخصیت تست',
    description: 'integration test character',
    role: 'assistant',
    personality: {
      description: 'helpful',
      behavior: 'clear',
      tone: 'friendly',
      communicationStyle: 'concise',
    },
    greeting: 'سلام',
    systemInstructions: 'stay in character',
    avatar: {
      type: 'portrait',
      source: '/avatars/test.png',
    },
    ai: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    },
    voice: {
      provider: 'external',
      language: 'fa-IR',
      enabled: true,
    },
    ...overrides,
  });
}

test('Phase 8 acceptance: all built-in characters load with isolated character data', async () => {
  const characters = await listCharacters();

  assert.equal(characters.length, 3);
  assert.deepEqual(
    characters.map((character) => character.identity.id),
    ['harry', 'hermione', 'ron'],
  );

  const identities = characters.map((character) => character.identity);
  assert.equal(new Set(identities.map((identity) => identity.id)).size, 3);
  assert.equal(new Set(identities.map((identity) => identity.systemInstructions)).size, 3);

  for (const character of characters) {
    assert.ok(character.avatar.source);
    assert.ok(character.textModels.default.model);
    assert.ok(character.voiceModels.default.language);
    assert.equal(character.settings.enabled, true);
  }
});

test('Phase 8 acceptance: server character lookup preserves ID isolation', async () => {
  const harry = await getCharacter('harry');
  const hermione = await getCharacter('hermione');
  const invalid = await getCharacter('../harry');

  assert.ok(harry);
  assert.ok(hermione);
  assert.notEqual(harry.identity.id, hermione.identity.id);
  assert.notEqual(harry.identity.displayName, hermione.identity.displayName);
  assert.equal(invalid, null);
});

test('Phase 8 acceptance: legacy character data still normalizes into all required boundaries', () => {
  const character = makeCharacter();

  assert.equal(character.identity.id, 'integration-character');
  assert.equal(character.avatar.type, 'portrait');
  assert.equal(character.textModels.default.provider, 'gemini');
  assert.equal(character.textModels.default.model, 'gemini-2.5-flash');
  assert.equal(character.voiceModels.default.provider, 'external');
  assert.equal(character.voiceModels.default.language, 'fa-IR');
  assert.equal(character.settings.enabled, true);
});

test('Phase 8 acceptance: configured voice provider falls back without losing text flow', async () => {
  const calls: string[] = [];
  const manager = new VoiceManager([
    {
      provider: 'external',
      speak: async () => {
        calls.push('external');
        throw new Error('external unavailable');
      },
    },
    {
      provider: 'browser',
      speak: async () => {
        calls.push('browser');
      },
    },
  ]);

  const result = await manager.speak('پاسخ شخصیت', makeCharacter());

  assert.equal(result.spoken, true);
  assert.equal(result.provider, 'browser');
  assert.deepEqual(calls, ['external', 'browser']);
});

test('Phase 8 acceptance: disabled character voice remains text-only', async () => {
  const manager = new VoiceManager([
    {
      provider: 'external',
      speak: async () => {
        throw new Error('should not be called');
      },
    },
  ]);

  const result = await manager.speak(
    'پاسخ متنی',
    makeCharacter({
      voice: {
        provider: 'external',
        language: 'fa-IR',
        enabled: false,
      },
    }),
  );

  assert.equal(result.spoken, false);
  assert.equal(result.provider, 'none');
});
