import { Character, VoiceEvent } from '../types';
import { AvatarAnimationController } from './avatar-controller';

/**
 * Mouth shapes exposed to the Avatar renderer.
 *
 * These shapes intentionally match Avatar.tsx so the coordinator can drive
 * the rendered mouth directly without an additional mapping layer.
 */
export type MouthShape =
  | 'closed'
  | 'open-small'
  | 'open-medium'
  | 'open-large'
  | 'smile'
  | 'pursed';

export interface LipSyncEvent {
  characterId: string;
  timestamp: number;
  mouthShape: MouthShape;
  amplitude: number;
  phoneme?: string;
  duration: number;
}

export type LipSyncListener = (event: LipSyncEvent) => void;

/**
 * Coordinates voice timing/audio information with Avatar mouth animation.
 *
 * Architecture:
 *
 * VoiceService
 *      ↓
 * VoiceEvent
 *      ↓
 * LipSyncCoordinator
 *      ↓
 * LipSyncEvent
 *      ↓
 * ChatUI / Avatar
 *      ↓
 * mouthShape
 *
 * The coordinator is deliberately independent from the TTS provider.
 * Browser SpeechSynthesis can provide timing information, while a future
 * Piper/Web Audio implementation can provide real audio amplitude and/or
 * phoneme information through the same VoiceEvent interface.
 */
export class LipSyncCoordinator {
  private readonly characterId: string;

  private readonly listeners = new Set<LipSyncListener>();

  private readonly voiceEventBuffer: VoiceEvent[] = [];

  private animationController?: AvatarAnimationController;

  private lastAmplitude = 0;

  private currentMouthShape: MouthShape = 'closed';

  private lastVoiceTimestamp = 0;

  constructor(characterId: string) {
    this.characterId = characterId;
  }

  /**
   * Connect the coordinator to the avatar animation controller.
   *
   * The controller is optional because ChatUI can consume LipSyncEvents
   * directly. Keeping this connection allows future animation systems
   * (Live2D/Canvas/3D) to consume the same lip-sync stream.
   */
  setAnimationController(
    controller: AvatarAnimationController,
  ): void {
    this.animationController = controller;
  }

  /**
   * Process a voice lifecycle/audio event.
   *
   * Events belonging to another character are ignored.
   */
  processVoiceEvent(event: VoiceEvent): void {
    if (event.characterId !== this.characterId) {
      return;
    }

    this.voiceEventBuffer.push(event);

    this.lastVoiceTimestamp = event.timestamp;

    const amplitude = this.normalizeAmplitude(event.amplitude);

    const mouthShape = this.resolveMouthShape(
      event,
      amplitude,
    );

    const lipSyncEvent: LipSyncEvent = {
      characterId: this.characterId,
      timestamp: event.timestamp,
      mouthShape,
      amplitude,
      phoneme: event.phoneme,
      duration: event.duration ?? 100,
    };

    this.currentMouthShape = mouthShape;
    this.lastAmplitude = amplitude;

    this.emitLipSyncEvent(lipSyncEvent);
  }

  /**
   * Convert potentially missing/out-of-range amplitude values into
   * a predictable 0..1 range.
   */
  private normalizeAmplitude(
    amplitude: number | undefined,
  ): number {
    if (typeof amplitude !== 'number' || !Number.isFinite(amplitude)) {
      return 0;
    }

    return Math.min(1, Math.max(0, amplitude));
  }

  /**
   * Resolve the visual mouth shape.
   *
   * Priority:
   * 1. Explicit phoneme information when available.
   * 2. Audio/timing amplitude.
   *
   * This allows the same coordinator to evolve from timing-based
   * SpeechSynthesis events to real Web Audio/Piper amplitude data later.
   */
  private resolveMouthShape(
    event: VoiceEvent,
    amplitude: number,
  ): MouthShape {
    const phoneme = event.phoneme?.trim().toLowerCase();

    if (phoneme) {
      const phonemeShape = this.getPhonemeMouthShape(phoneme);

      if (phonemeShape) {
        return phonemeShape;
      }
    }

    if (event.type === 'end' || event.type === 'pause') {
      return 'closed';
    }

    if (amplitude < 0.12) {
      return 'closed';
    }

    if (amplitude < 0.32) {
      return 'open-small';
    }

    if (amplitude < 0.62) {
      return 'open-medium';
    }

    return 'open-large';
  }

  /**
   * Basic viseme mapping.
   *
   * This is intentionally small and provider-agnostic. A future phoneme
   * detector can send richer phonemes without requiring changes to Avatar.tsx.
   */
  private getPhonemeMouthShape(
    phoneme: string,
  ): MouthShape | undefined {
    if (
      ['a', 'ɑ', 'æ', 'ā', 'á'].includes(phoneme)
    ) {
      return 'open-large';
    }

    if (
      ['e', 'ɛ', 'i', 'ɪ', 'ə', 'əː'].includes(phoneme)
    ) {
      return 'open-medium';
    }

    if (
      ['o', 'ɔ', 'u', 'ʊ'].includes(phoneme)
    ) {
      return 'open-medium';
    }

    if (
      ['m', 'b', 'p'].includes(phoneme)
    ) {
      return 'pursed';
    }

    if (
      ['f', 'v'].includes(phoneme)
    ) {
      return 'pursed';
    }

    if (
      ['s', 'z', 'ʃ', 'ʒ'].includes(phoneme)
    ) {
      return 'open-small';
    }

    if (
      ['l', 'r', 'n', 't', 'd', 'k', 'g'].includes(phoneme)
    ) {
      return 'open-small';
    }

    return undefined;
  }

  /**
   * Emit a normalized lip-sync event to all subscribers.
   */
  private emitLipSyncEvent(
    event: LipSyncEvent,
  ): void {
    this.listeners.forEach((listener) => {
      listener(event);
    });
  }

  /**
   * Subscribe to mouth/viseme changes.
   *
   * Returns an unsubscribe function.
   */
  subscribe(
    listener: LipSyncListener,
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Current mouth shape.
   */
  getCurrentMouthShape(): MouthShape {
    return this.currentMouthShape;
  }

  /**
   * Current normalized amplitude.
   */
  getCurrentAmplitude(): number {
    return this.lastAmplitude;
  }

  /**
   * Timestamp of the latest processed voice event.
   */
  getLastVoiceTimestamp(): number {
    return this.lastVoiceTimestamp;
  }

  /**
   * Return recent voice events for diagnostics/debugging.
   */
  getVoiceEventBuffer(
    limit = 100,
  ): VoiceEvent[] {
    if (limit <= 0) {
      return [];
    }

    return this.voiceEventBuffer.slice(-limit);
  }

  /**
   * Clear buffered voice events without changing the current mouth state.
   */
  clearBuffer(): void {
    this.voiceEventBuffer.length = 0;
  }

  /**
   * Reset the complete lip-sync state and explicitly close the mouth.
   */
  reset(): void {
    this.lastAmplitude = 0;
    this.currentMouthShape = 'closed';
    this.lastVoiceTimestamp = Date.now();
    this.voiceEventBuffer.length = 0;

    this.emitLipSyncEvent({
      characterId: this.characterId,
      timestamp: this.lastVoiceTimestamp,
      mouthShape: 'closed',
      amplitude: 0,
      duration: 0,
    });
  }

  /**
   * Expose the optional animation controller for future renderers.
   *
   * The current SVG Avatar is driven through LipSyncEvent/mouthShape.
   * Live2D/3D renderers can use the controller in a later stage.
   */
  getAnimationController():
    | AvatarAnimationController
    | undefined {
    return this.animationController;
  }
}

/**
 * CSS class names corresponding to the Avatar mouth shapes.
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
 * SVG path generator for diagnostics and future renderer adapters.
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
 * Factory used by ChatUI/character orchestration.
 */
export function createLipSyncCoordinator(
  character: Character,
): LipSyncCoordinator {
  return new LipSyncCoordinator(character.id);
}

