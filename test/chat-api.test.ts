import assert from 'node:assert';
import express from 'express';
import { generateResponse } from '../server/services/ai';
import { getCharacter } from '../server/services/characters';

async function testHttpChat() {
  console.log('--- Testing Chat API Contract ---');

  // Verify server-side call structure without client provider/model
  const harry = await getCharacter('harry');
  assert.ok(harry);

  // Request 1: Normal query
  const res1 = await generateResponse({
    message: 'سلام هری! خوبی؟',
    character: harry,
  });
  assert.ok(res1.response, 'Should return a response');
  assert.strictEqual(res1.source, 'local-fallback');
  console.log('✓ Greeting response received:', res1.response);

  // Request 2: Harry wand query
  const res2 = await generateResponse({
    message: 'چوبدستی تو از چه چوبی ساخته شده؟',
    character: harry,
  });
  assert.ok(
    res2.response.includes('چوبدستی') ||
      res2.response.includes('فونیکس') ||
      res2.response.includes('ققنوس') ||
      res2.response.includes('هالی') ||
      res2.response.includes('یاس کبود'),
    `Expected wand info, got: ${res2.response}`,
  );
  console.log('✓ Harry wand response received:', res2.response);

  console.log('--- Chat API Contract verification successful ---');
}

testHttpChat().catch((err) => {
  console.error(err);
  process.exit(1);
});
