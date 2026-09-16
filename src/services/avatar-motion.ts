import { AvatarState } from '../types';

export type AvatarMotion =
  | 'idle-float'
  | 'listening-sway'
  | 'thinking-bob'
  | 'speaking-nod'
  | 'error-shake';

const motionByState: Record<AvatarState, AvatarMotion> = {
  idle: 'idle-float',
  listening: 'listening-sway',
  thinking: 'thinking-bob',
  speaking: 'speaking-nod',
  error: 'error-shake',
};

/**
 * Renderer-neutral motion policy.
 * The Avatar component decides how a renderer applies the returned motion.
 */
export function getAvatarMotion(state: AvatarState): AvatarMotion {
  return motionByState[state];
}

export function getAvatarMotionClass(state: AvatarState): string {
  return `avatar-motion avatar-motion--${getAvatarMotion(state)}`;
}
