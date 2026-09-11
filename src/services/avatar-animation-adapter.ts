import type {
  AvatarState,
} from '../types';

import type {
  AvatarAnimationAdapter,
  LipSyncState,
  MouthShape,
} from './avatar-animation';

/**
 * Renderer-neutral mouth shape → CSS class mapping.
 *
 * IMPORTANT:
 *
 * This mapping belongs to the 2D renderer adapter.
 * It must NOT live inside LipSyncCoordinator.
 */
export const mouthShapeClasses: Record<
  MouthShape,
  string
> = {
  closed: 'mouth-closed',
  'open-small': 'mouth-open-small',
  'open-medium': 'mouth-open-medium',
  'open-large': 'mouth-open-large',
  smile: 'mouth-smile',
  pursed: 'mouth-pursed',
};

/**
 * SVG path generator for the current 2D renderer.
 *
 * This is intentionally kept outside LipSyncCoordinator because
 * SVG drawing is a renderer concern.
 */
export function getMouthShapeSVG(
  shape: MouthShape,
  width = 40,
  height = 20,
): string {
  const paths: Record<MouthShape, string> = {
    closed: `
      M ${width * 0.2} ${height * 0.5}
      Q ${width * 0.5} ${height * 0.4}
        ${width * 0.8} ${height * 0.5}
    `,

    'open-small': `
      M ${width * 0.2} ${height * 0.5}
      Q ${width * 0.5} ${height * 0.7}
        ${width * 0.8} ${height * 0.5}
    `,

    'open-medium': `
      M ${width * 0.2} ${height * 0.3}
      Q ${width * 0.5} ${height * 0.9}
        ${width * 0.8} ${height * 0.3}
    `,

    'open-large': `
      M ${width * 0.1} ${height * 0.2}
      Q ${width * 0.5} ${height}
        ${width * 0.9} ${height * 0.2}
    `,

    smile: `
      M ${width * 0.2} ${height * 0.4}
      Q ${width * 0.5} ${height * 0.8}
        ${width * 0.8} ${height * 0.4}
    `,

    pursed: `
      M ${width * 0.3} ${height * 0.4}
      Q ${width * 0.5} ${height * 0.6}
        ${width * 0.7} ${height * 0.4}
    `,
  };

  return `
    <svg
      viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="${paths[shape]}"
        stroke="currentColor"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
      />
    </svg>
  `;
}

/**
 * State + lip-sync snapshot consumed by the current 2D renderer.
 *
 * This class does NOT decide which mouth shape should be used.
 * It only translates normalized animation commands into the
 * representation required by the existing 2D renderer.
 */
export class Avatar2DAnimationAdapter
  implements AvatarAnimationAdapter {
  private state: AvatarState = 'idle';

  private lipSync: LipSyncState = {
    mouthShape: 'closed',
    amplitude: 0,
    timestamp: Date.now(),
  };

  setState(state: AvatarState): void {
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

  getState(): AvatarState {
    return this.state;
  }

  getLipSync(): LipSyncState {
    return {
      ...this.lipSync,
    };
  }

  getMouthClass(): string {
    return mouthShapeClasses[
      this.lipSync.mouthShape
    ];
  }
}

/**
 * Factory for the current 2D avatar animation adapter.
 */
export function createAvatar2DAnimationAdapter(): Avatar2DAnimationAdapter {
  return new Avatar2DAnimationAdapter();
}
