import { strict as assert } from 'node:assert';
import test from 'node:test';
import { mouthShapeToExpressions } from '../src/services/vrm-avatar-renderer';

test('VRM mouth mapping keeps closed mouth neutral', () => {
  const values = mouthShapeToExpressions('closed', 1);
  assert.equal(values.aa, 0);
  assert.equal(values.ih, 0);
  assert.equal(values.ou, 0);
  assert.equal(values.ee, 0);
  assert.equal(values.oh, 0);
});

test('VRM mouth mapping opens aa/oh for large mouth intent', () => {
  const values = mouthShapeToExpressions('open-large', 1);
  assert.equal(values.aa, 1);
  assert.equal(values.oh, 0.52);
  assert.equal(values.ih, 0);
});

test('VRM mouth mapping clamps amplitude to the supported range', () => {
  const values = mouthShapeToExpressions('pursed', 3);
  assert.equal(values.ou, 0.95);
  assert.equal(values.ih, 0.16);
});
