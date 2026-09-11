import type {
  AvatarState,
  VoiceEvent,
  VoiceEventListener,
} from '../types';

import {
  AvatarAnimationController as RendererNeutralAnimationController,
  type LipSyncState,
} from './avatar-animation';

export type AvatarStateListener = (state: AvatarState) => void;

/**
 * AvatarAnimationController
 *
 * This class remains the public animation controller used by the
 * existing Avatar/ChatUI architecture.
 *
 * Internally, normalized animation state is delegated to the
 * renderer-neutral animation controller.
 *
 * This keeps the current application API stable while removing
 * renderer-specific knowledge from the animation pipeline.
 */
export class AvatarAnimationController {
  private readonly animation =
    new RendererNeutralAnimationController();

  private state: AvatarState = 'idle';

  private readonly listeners = new Set<AvatarStateListener>();

  private readonly voiceListeners =
    new Set<VoiceEventListener>();

  private stateHistory: Array<{
    state: AvatarState;
    timestamp: number;
  }> = [];

  private transitionTimings: Record<AvatarState, number> = {
    idle: 300,
    listening: 200,
    thinking: 150,
    speaking: 100,
    error: 250,
  };

  private lastStateChange = Date.now();

  /**
   * Get current avatar state.
   */
  getState(): AvatarState {
    return this.state;
  }

  /**
   * Get the renderer-neutral animation controller.
   *
   * Renderers/adapters can subscribe to this controller without
   * needing to know about VoiceService or ChatUI.
   */
  getAnimationController(): RendererNeutralAnimationController {
    return this.animation;
  }

  /**
   * Set avatar state with smooth transition timing.
   */
  setState(nextState: AvatarState): void {
    if (this.state === nextState) return;

    const now = Date.now();

    this.stateHistory.push({
      state: nextState,
      timestamp: now,
    });

    this.lastStateChange = now;
    this.state = nextState;

    // Forward normalized state to the renderer-neutral layer.
    this.animation.setState(nextState);

    // Preserve the existing application-level listener API.
    this.listeners.forEach((listener) => {
      listener(nextState);
    });
  }

  /**
   * Get transition timing for smooth animation.
   */
  getTransitionTiming(state: AvatarState): number {
    return this.transitionTimings[state];
  }

  /**
   * Set custom transition timing for a specific state.
   */
  setTransitionTiming(
    state: AvatarState,
    ms: number,
  ): void {
    this.transitionTimings[state] = Math.max(0, ms);
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(
    listener: AvatarStateListener,
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to voice events for lip-sync synchronization.
   */
  subscribeToVoiceEvents(
    listener: VoiceEventListener,
  ): () => void {
    this.voiceListeners.add(listener);

    return () => {
      this.voiceListeners.delete(listener);
    };
  }

  /**
   * Emit a voice event.
   *
   * Voice events remain part of the controller's public API for
   * backward compatibility.
   *
   * The controller itself does not interpret phonemes or render
   * mouth shapes.
   */
  emitVoiceEvent(event: VoiceEvent): void {
    if (event.type === 'start') {
      this.setState('speaking');
    } else if (event.type === 'end') {
      setTimeout(() => {
        if (this.state === 'speaking') {
          this.setState('idle');
        }
      }, 300);
    }

    this.voiceListeners.forEach((listener) => {
      listener(event);
    });
  }

  /**
   * Apply normalized lip-sync information.
   *
   * The renderer-neutral controller owns the normalized state.
   */
  setLipSyncState(state: LipSyncState): void {
    this.animation.setLipSync(state);
  }

  /**
   * Get current normalized lip-sync state.
   */
  getLipSyncState(): LipSyncState {
    return this.animation.getLipSyncState();
  }

  /**
   * Get state history for debugging.
   */
  getStateHistory(
    limit: number = 50,
  ): Array<{
    state: AvatarState;
    timestamp: number;
  }> {
    return this.stateHistory.slice(-limit);
  }

  /**
   * Clear state history.
   */
  clearHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Reset avatar animation and history.
   */
  reset(): void {
    this.animation.reset();

    this.state = 'idle';
    this.stateHistory = [];
    this.lastStateChange = Date.now();
  }

  /**
   * Get time elapsed since last state change.
   */
  getTimeSinceLastChange(): number {
    return Date.now() - this.lastStateChange;
  }
}

/**
 * Persian labels for avatar states.
 */
export const avatarStateLabels: Record<
  AvatarState,
  string
> = {
  idle: 'آماده‌ی گفت‌وگو',
  listening: 'در حال گوش دادن',
  thinking: 'در حال فکر کردن',
  speaking: 'در حال صحبت',
  error: 'خطا در تعامل',
};

/**
 * Create a new avatar animation controller.
 */
export function createAvatarController(): AvatarAnimationController {
  return new AvatarAnimationController();
}
