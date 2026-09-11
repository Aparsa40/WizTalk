import assert from 'node:assert';
import {
  getCharacter,
  listCharacterPresentations,
  toCharacterPresentation,
} from '../server/services/characters';

async function runTests() {
  console.log('--- Testing Character Runtime Boundary ---');

  const runtime = await getCharacter('harry');
  assert.ok(runtime, 'A server runtime character must be available');
  assert.ok(runtime.systemInstructions, 'Runtime includes system instructions');
  assert.ok(runtime.ai.provider, 'Runtime includes AI routing configuration');

  const presentation = toCharacterPresentation(runtime);
  assert.ok(!('systemInstructions' in presentation));
  assert.ok(!('ai' in presentation));

  const characters = await listCharacterPresentations();
  assert.ok(characters.length >= 3);
  assert.ok(characters.every((character) => !('systemInstructions' in character)));
  assert.ok(characters.every((character) => !('ai' in character)));

  console.log('✓ Public character data excludes server runtime fields');
}

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
