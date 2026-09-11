import type { AvatarState } from '../types';

/**
 * Renderer-neutral mouth shapes.
 *
 * IMPORTANT:
 * These values describe the animation intent only.
 * They do NOT describe how a renderer should draw the mouth.
 *
 * A 2D renderer may translate these values into SVG/CSS.
 * A Live2D renderer may translate them into parameters.
 * A 3D renderer may translate them into blend shapes / morph targets.
 */
export type MouthShape =
  | 'closed'
  | 'open-small'
  | 'open-medium'
  | 'open-large'
  | 'smile'
  | 'pursed';

/**
 * Normalized lip-sync state.
 *
 * This is the bridge between speech/lip-sync processing
 * and the actual avatar renderer.
 *
 * The renderer should not need to know where this information
 * came from (browser TTS, Piper, external provider, etc.).
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
 * Animation command sent to an avatar animation adapter.
 *
 * This intentionally stays renderer-agnostic.
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
 * Renderer-neutral animation adapter.
 *
 * Every avatar implementation can provide its own adapter:
 *
 * - 2D / SVG
 * - Canvas
 * - Live2D
 * - 3D
 * - future renderer implementations
 *
 * The animation system only talks to this contract.
 */
export interface AvatarAnimationAdapter {
  /**
   * Apply a high-level avatar state.
   */
  setState(state: AvatarState): void;

  /**
   * Apply normalized lip-sync information.
   */
  setLipSync(state: LipSyncState): void;

  /**
   * Reset animation-specific state.
   */
  reset(): void;
}

/**
 * Listener notified whenever the normalized animation state changes.
 *
 * This is useful for React components and renderer adapters that
 * need to observe animation changes without knowing anything
 * about the voice provider or LipSyncCoordinator.
 */
export type AvatarAnimationListener = (
  command: AvatarAnimationCommand,
) => void;

/**
 * Central animation state container.
 *
 * This class intentionally does not render anything.
 *
 * Its responsibility is to maintain normalized animation state
 * and expose it to whichever renderer is currently active.
 */
export class AvatarAnimationController {
  private state: AvatarState = 'idle';

  private lipSyncState: LipSyncState = {
    mouthShape: 'closed',
    amplitude: 0,
    timestamp: Date.now(),
  };

  private listeners = new Set<AvatarAnimationListener>();

  /**
   * Get the current high-level avatar state.
   */
  getState(): AvatarState {
    return this.state;
  }

  /**
   * Get the current normalized lip-sync state.
   */
  getLipSyncState(): LipSyncState {
    return { ...this.lipSyncState };
  }

  /**
   * Update the high-level avatar state.
   */
  setState(state: AvatarState): void {
    if (this.state === state) return;

    this.state = state;

    this.emit({
      type: 'state',
      state,
    });
  }

  /**
   * Update normalized lip-sync information.
   *
   * The controller does not interpret or render the mouth shape.
   * That responsibility belongs to the active animation adapter.
   */
  setLipSync(state: LipSyncState): void {
    this.lipSyncState = {
      ...state,
      amplitude: Math.max(0, Math.min(1, state.amplitude)),
    };

    this.emit({
      type: 'lip-sync',
      lipSync: { ...this.lipSyncState },
    });
  }

  /**
   * Reset animation state back to a neutral state.
   */
  reset(): void {
    this.state = 'idle';

    this.lipSyncState = {
      mouthShape: 'closed',
      amplitude: 0,
      timestamp: Date.now(),
    };

    this.emit({
      type: 'reset',
    });
  }

  /**
   * Subscribe to normalized animation commands.
   */
  subscribe(listener: AvatarAnimationListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Send a normalized animation command to subscribers.
   */
  private emit(command: AvatarAnimationCommand): void {
    this.listeners.forEach((listener) => {
      listener(command);
    });
  }
}

/**
 * Create a renderer-neutral animation controller.
 */
export function createAvatarAnimationController(): AvatarAnimationController {
  return new AvatarAnimationController();
}
