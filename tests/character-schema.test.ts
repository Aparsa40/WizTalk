import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCharacter } from '../src/types';

test('normalizes legacy character data into isolated Character configuration', () => {
  const harry = normalizeCharacter({ id: 'harry', name: 'Harry', displayName: 'هری', description: 'brave', role: 'student', personality: 'loyal', greeting: 'سلام', systemInstructions: 'stay in character', avatar: 'harry.png', ai: { provider: 'local', model: 'faq-keyword-v1' }, voice: { provider: 'browser', language: 'fa-IR', enabled: true } });
  const hermione = normalizeCharacter({ id: 'hermione', name: 'Hermione', displayName: 'هرماینی', description: 'smart', role: 'student', personality: { description: 'precise' }, greeting: 'سلام', systemInstructions: 'be precise', avatar: { type: 'portrait', source: 'hermione.png' }, knowledge: { faq: { entries: [{ keywords: ['کتاب'], response: 'کتاب‌ها عالی‌اند.' }] }, raw: { content: 'library lore' }, sources: { lore: { type: 'lore', collection: 'library' } } }, textModels: { default: { provider: 'gemini', model: 'gemini-2.5-flash' } }, voiceModels: { default: { provider: 'browser', language: 'en-GB', enabled: false } }, settings: { enabled: true } });
  assert.equal(harry.identity.id, 'harry');
  assert.equal(harry.avatar.source, 'harry.png');
  assert.equal(harry.knowledge.faq.source, 'shared');
  assert.equal(harry.knowledge.raw.content, '');
  assert.deepEqual(hermione.knowledge.faq.entries?.[0].keywords, ['کتاب']);
  assert.equal(hermione.knowledge.raw.content, 'library lore');
  assert.equal(hermione.knowledge.sources.lore.type, 'lore');
  assert.equal(hermione.textModels.default.provider, 'gemini');
  assert.equal(hermione.voiceModels.default.language, 'en-GB');
  hermione.knowledge.raw.content = 'changed';
  assert.equal(harry.knowledge.raw.content, '');
  assert.notEqual(harry.avatar.source, hermione.avatar.source);
});
