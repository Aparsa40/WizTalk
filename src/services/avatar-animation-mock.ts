import type {
  AvatarState,
} from '../types';

import type {
  AvatarAnimationAdapter,
  LipSyncState,
} from './avatar-animation';

/**
 * Minimal renderer-independent test adapter.
 *
 * This does NOT render an avatar.
 *
 * Its purpose is architectural validation:
 * a second implementation can consume the exact same
 * animation contract without knowing anything about
 * the current 2D Avatar renderer.
 */
export class MockAvatarAnimationAdapter
  implements AvatarAnimationAdapter {
  private state: AvatarState = 'idle';

  private lipSync: LipSyncState = {
    mouthShape: 'closed',
    amplitude: 0,
    timestamp: Date.now(),
  };

  setState(
    state: AvatarState,
  ): void {
    this.state = state;
  }

  setLipSync(
    state: LipSyncState,
  ): void {
    this.lipSync = {
      ...state,
    };
  }

  reset(): void {
    this.state = 'idle';

    this.lipSync = {
      mouthShape: 'closed',
      amplitude: 0,
      timestamp: Date.now(),
    };
  }

  getSnapshot(): {
    state: AvatarState;
    lipSync: LipSyncState;
  } {
    return {
      state: this.state,
      lipSync: {
        ...this.lipSync,
      },
    };
  }
}

export function createMockAvatarAnimationAdapter(): MockAvatarAnimationAdapter {
  return new MockAvatarAnimationAdapter();
}
