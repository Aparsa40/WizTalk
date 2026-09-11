import type {
  AvatarState,
} from '../types';

/**
 * Renderer-neutral mouth shapes.
 *
 * These values describe animation intent only.
 * They do not describe how a renderer draws the mouth.
 */
export type MouthShape =
  | 'closed'
  | 'open-small'
  | 'open-medium'
  | 'open-large'
  | 'smile'
  | 'pursed';

/**
 * Normalized lip-sync state shared by all avatar renderers.
 */
export interface LipSyncState {
  mouthShape: MouthShape;
  amplitude: number;
  timestamp: number;
  duration?: number;
  phoneme?: string;
  measured?: boolean;
}

/**
 * Renderer-neutral animation command.
 */
export type AvatarAnimationCommand =
  | {
      type: 'state';
      state: AvatarState;
    }
  | {
      type: 'lip-sync';
      lipSync: LipSyncState;
    }
  | {
      type: 'reset';
    };

/**
 * Adapter implemented by an avatar animation backend.
 *
 * Possible implementations:
 *
 * - 2D / SVG
 * - Canvas
 * - Live2D
 * - 3D
 * - future renderers
 */
export interface AvatarAnimationAdapter {
  setState(state: AvatarState): void;

  setLipSync(state: LipSyncState): void;

  reset(): void;
}

/**
 * Listener notified when normalized animation data changes.
 */
export type AvatarAnimationListener = (
  command: AvatarAnimationCommand,
) => void;

/**
 * Renderer-neutral animation controller.
 *
 * This class contains animation state but no rendering logic.
 */
export class AvatarAnimationController {
  private state: AvatarState = 'idle';

  private lipSyncState: LipSyncState = {
    mouthShape: 'closed',
    amplitude: 0,
    timestamp: Date.now(),
  };

  private listeners =
    new Set<AvatarAnimationListener>();

  private adapters =
    new Set<AvatarAnimationAdapter>();

  /**
   * Get current avatar state.
   */
  getState(): AvatarState {
    return this.state;
  }

  /**
   * Get current normalized lip-sync state.
   */
  getLipSyncState(): LipSyncState {
    return {
      ...this.lipSyncState,
    };
  }

  /**
   * Attach an animation adapter.
   *
   * Multiple adapters are supported so the same animation
   * stream can be consumed by different renderer backends.
   */
  attachAdapter(
    adapter: AvatarAnimationAdapter,
  ): () => void {
    this.adapters.add(adapter);

    // Synchronize the newly attached adapter immediately.
    adapter.setState(this.state);
    adapter.setLipSync(this.lipSyncState);

    return () => {
      this.adapters.delete(adapter);
    };
  }

  /**
   * Update high-level avatar state.
   */
  setState(
    state: AvatarState,
  ): void {
    if (this.state === state) {
      return;
    }

    this.state = state;

    this.adapters.forEach(
      (adapter) => {
        adapter.setState(state);
      },
    );

    this.emit({
      type: 'state',
      state,
    });
  }

  /**
   * Update normalized lip-sync information.
   */
  setLipSync(
    state: LipSyncState,
  ): void {
    this.lipSyncState = {
      ...state,
      amplitude: Math.min(
        1,
        Math.max(0, state.amplitude),
      ),
    };

    this.adapters.forEach(
      (adapter) => {
        adapter.setLipSync(
          this.lipSyncState,
        );
      },
    );

    this.emit({
      type: 'lip-sync',
      lipSync: {
        ...this.lipSyncState,
      },
    });
  }

  /**
   * Reset animation state.
   */
  reset(): void {
    this.state = 'idle';

    this.lipSyncState = {
      mouthShape: 'closed',
      amplitude: 0,
      timestamp: Date.now(),
    };

    this.adapters.forEach(
      (adapter) => {
        adapter.reset();
      },
    );

    this.emit({
      type: 'reset',
    });
  }

  /**
   * Subscribe to normalized animation commands.
   */
  subscribe(
    listener: AvatarAnimationListener,
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit normalized animation commands.
   */
  private emit(
    command: AvatarAnimationCommand,
  ): void {
    this.listeners.forEach(
      (listener) => {
        listener(command);
      },
    );
  }
}

/**
 * Create renderer-neutral animation controller.
 */
export function createAvatarAnimationController(): AvatarAnimationController {
  return new AvatarAnimationController();
}
