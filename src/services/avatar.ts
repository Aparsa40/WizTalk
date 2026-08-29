import { AvatarState } from '../types';

export type AvatarStateListener = (state: AvatarState) => void;

export class AvatarAnimationController {
  private state: AvatarState = 'idle';
  private listeners = new Set<AvatarStateListener>();

  getState(): AvatarState { return this.state; }

  setState(nextState: AvatarState): void {
    this.state = nextState;
    this.listeners.forEach((listener) => listener(nextState));
  }

  subscribe(listener: AvatarStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void { this.setState('idle'); }
}

export const avatarStateLabels: Record<AvatarState, string> = {
  idle: 'آماده‌ی گفت‌وگو',
  listening: 'در حال گوش دادن',
  thinking: 'در حال فکر کردن',
  speaking: 'در حال صحبت',
  error: 'خطا در تعامل',
};
