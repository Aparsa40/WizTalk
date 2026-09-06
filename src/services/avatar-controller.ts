import { AvatarState, VoiceEvent, VoiceEventListener } from '../types';

export type AvatarStateListener = (state: AvatarState) => void;

/**
 * Advanced avatar animation controller managing state transitions,
 * animation timing, and voice event synchronization.
 * 
 * Separates animation logic from rendering to allow multiple renderer implementations.
 * Supports future lip-sync through voice event coordination.
 */
export class AvatarAnimationController {
  private state: AvatarState = 'idle';
  private listeners = new Set<AvatarStateListener>();
  private voiceListeners = new Set<VoiceEventListener>();
  private stateHistory: Array<{ state: AvatarState; timestamp: number }> = [];
  private transitionTimings: Record<AvatarState, number> = {
    idle: 300,
    listening: 200,
    thinking: 150,
    speaking: 100,
    error: 250,
  };
  private lastStateChange: number = Date.now();

  /**
   * Get current avatar state
   */
  getState(): AvatarState {
    return this.state;
  }

  /**
   * Set avatar state with smooth transition timing
   */
  setState(nextState: AvatarState): void {
    if (this.state === nextState) return;

    const now = Date.now();
    this.stateHistory.push({ state: nextState, timestamp: now });
    this.lastStateChange = now;
    this.state = nextState;

    // Notify all state listeners
    this.listeners.forEach((listener) => listener(nextState));
  }

  /**
   * Get transition timing for smooth animation
   */
  getTransitionTiming(state: AvatarState): number {
    return this.transitionTimings[state];
  }

  /**
   * Set custom transition timing for a specific state
   */
  setTransitionTiming(state: AvatarState, ms: number): void {
    this.transitionTimings[state] = Math.max(0, ms);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: AvatarStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Subscribe to voice events for lip-sync synchronization
   */
  subscribeToVoiceEvents(listener: VoiceEventListener): () => void {
    this.voiceListeners.add(listener);
    return () => this.voiceListeners.delete(listener);
  }

  /**
   * Emit voice event for lip-sync coordination
   * Called by voice service when speech synthesis events occur
   */
  emitVoiceEvent(event: VoiceEvent): void {
    // Automatically transition to speaking on voice start
    if (event.type === 'start') {
      this.setState('speaking');
    }
    // Return to idle on voice end
    else if (event.type === 'end') {
      // Small delay for natural transition
      setTimeout(() => {
        if (this.state === 'speaking') {
          this.setState('idle');
        }
      }, 300);
    }

    // Notify all voice event listeners
    this.voiceListeners.forEach((listener) => listener(event));
  }

  /**
   * Get state history for debugging
   */
  getStateHistory(limit: number = 50): Array<{ state: AvatarState; timestamp: number }> {
    return this.stateHistory.slice(-limit);
  }

  /**
   * Clear state history
   */
  clearHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Reset to idle state and clear history
   */
  reset(): void {
    this.setState('idle');
    this.stateHistory = [];
    this.lastStateChange = Date.now();
  }

  /**
   * Get time elapsed since last state change
   */
  getTimeSinceLastChange(): number {
    return Date.now() - this.lastStateChange;
  }
}

/**
 * Persian labels for avatar states
 */
export const avatarStateLabels: Record<AvatarState, string> = {
  idle: 'آماده‌ی گفت‌وگو',
  listening: 'در حال گوش دادن',
  thinking: 'در حال فکر کردن',
  speaking: 'در حال صحبت',
  error: 'خطا در تعامل',
};

/**
 * Create a new avatar animation controller
 */
export function createAvatarController(): AvatarAnimationController {
  return new AvatarAnimationController();
}
