import assert from 'node:assert';
import {
  knowledgeEngine,
  normalizePersianText,
  tokenizePersian,
} from '../server/services/knowledge';
import { aiConnectionManager } from '../server/services/ai';
import { getCharacter, listCharacters } from '../server/services/characters';

async function runTests() {
  console.log('--- Starting WizTalk Knowledge & Fallback Test Suite ---');

  // Test 1: Persian Text Normalization
  console.log('Test 1: Persian Text Normalization');
  const rawText = 'سلام! آيا تو كوييديچ بازي مي‌كني؟';
  const normalized = normalizePersianText(rawText);
  // Arabic Yeh and Kaf converted to Persian, punctuation removed, ZWNJ handled
  assert.ok(!normalized.includes('ك'), 'Kaf should be normalized to Persian ک');
  assert.ok(!normalized.includes('ي'), 'Yeh should be normalized to Persian ی');
  assert.ok(!normalized.includes('؟'), 'Question mark should be stripped');
  const tokens = tokenizePersian(rawText);
  assert.ok(tokens.includes('کوییدیچ'), 'Should contain normalized token کوییدیچ');
  console.log('✓ Normalization & Tokenization passed');

  // Test 2: Character Loading
  console.log('Test 2: Character Loading');
  const characters = await listCharacters();
  assert.ok(characters.length >= 3, 'Should load at least 3 characters');
  const harry = await getCharacter('harry');
  const hermione = await getCharacter('hermione');
  const ron = await getCharacter('ron');
  assert.ok(harry, 'Harry character must exist');
  assert.ok(hermione, 'Hermione character must exist');
  assert.ok(ron, 'Ron character must exist');
  console.log('✓ Character loading passed');

  // Test 3: Local Knowledge Engine - Harry Character Topics
  console.log('Test 3: Local Knowledge Engine - Harry Character Topics');
  const quidditchResponse = knowledgeEngine.generateResponse({
    message: 'درباره ورزش کوییدیچ و اسنیچ طلایی برام بگو',
    character: harry!,
  });
  assert.ok(quidditchResponse.length > 10, 'Should return a substantive response');
  assert.ok(
    quidditchResponse.includes('کوییدیچ') ||
      quidditchResponse.includes('اسنیچ') ||
      quidditchResponse.includes('پرواز'),
    `Expected Quidditch-related response, got: ${quidditchResponse}`,
  );
  console.log('✓ Harry Quidditch topic passed:', quidditchResponse.slice(0, 60) + '...');

  // Test 4: Local Knowledge Engine - Hermione Character Topics
  console.log('Test 4: Local Knowledge Engine - Hermione Character Topics');
  const bookResponse = knowledgeEngine.generateResponse({
    message: 'کدام کتاب‌ها را در کتابخانه هاگوارتز خوانده‌ای؟',
    character: hermione!,
  });
  assert.ok(
    bookResponse.includes('کتاب') ||
      bookResponse.includes('تاریخ هاگوارتز') ||
      bookResponse.includes('کتابخونه'),
    `Expected book-related response, got: ${bookResponse}`,
  );
  console.log('✓ Hermione Book topic passed:', bookResponse.slice(0, 60) + '...');

  // Test 5: Local Knowledge Engine - Ron Character Topics
  console.log('Test 5: Local Knowledge Engine - Ron Character Topics');
  const chessResponse = knowledgeEngine.generateResponse({
    message: 'نظرت درباره بازی شطرنج جادویی چیه؟',
    character: ron!,
  });
  assert.ok(
    chessResponse.includes('شطرنج') ||
      chessResponse.includes('مهره') ||
      chessResponse.includes('بازی'),
    `Expected chess-related response, got: ${chessResponse}`,
  );
  console.log('✓ Ron Chess topic passed:', chessResponse.slice(0, 60) + '...');

  // Test 6: World Knowledge with Character-specific Perspective
  console.log('Test 6: World Knowledge - Spells with Character Perspective');
  const spellResponse = knowledgeEngine.generateResponse({
    message: 'طلسم خلع سلاح یا اکسپلیارموس چطوری کار می‌کنه؟',
    character: harry!,
  });
  assert.ok(
    spellResponse.includes('اکسپلیارموس') ||
      spellResponse.includes('خلع سلاح') ||
      spellResponse.includes('چوبدستی'),
    `Expected spell response, got: ${spellResponse}`,
  );
  console.log('✓ World Spells passed:', spellResponse.slice(0, 60) + '...');

  // Test 7: AI Connection Manager - Automatic Seamless Fallback
  console.log('Test 7: AI Connection Manager - Automatic Seamless Fallback');
  // Ensure no mock key or invalid key causes crash
  const originalKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;

  const aiResult = await aiConnectionManager.generateResponse({
    message: 'پاترونوس یا سپر مدافع تو چیه؟',
    character: harry!,
  });

  assert.ok(aiResult.response, 'Response should not be empty');
  assert.strictEqual(aiResult.source, 'local-fallback', 'Source should indicate local-fallback');
  assert.ok(
    aiResult.response.includes('گوزن') ||
      aiResult.response.includes('پاترونوس') ||
      aiResult.response.includes('سپر مدافع'),
    `Expected Patronus response, got: ${aiResult.response}`,
  );
  console.log('✓ Automatic fallback passed:', aiResult.response.slice(0, 60) + '...');

  // Restore env if any
  if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;

  console.log('--- ALL TEST SUITE CHECKS PASSED SUCCESSFULLY ---');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
