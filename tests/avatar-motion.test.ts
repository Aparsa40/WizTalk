import assert from 'node:assert/strict';
import test from 'node:test';
import { getAvatarMotion, getAvatarMotionClass } from '../src/services/avatar-motion';
import { AvatarState } from '../src/types';

test('maps every avatar state to a deterministic motion', () => {
  const expected: Record<AvatarState, string> = {
    idle: 'idle-float',
    listening: 'listening-sway',
    thinking: 'thinking-bob',
    speaking: 'speaking-nod',
    error: 'error-shake',
  };

  for (const [state, motion] of Object.entries(expected) as Array<[AvatarState, string]>) {
    assert.equal(getAvatarMotion(state), motion);
  }
});

test('returns a stable CSS hook for the renderer', () => {
  assert.equal(getAvatarMotionClass('speaking'), 'avatar-motion avatar-motion--speaking-nod');
});
