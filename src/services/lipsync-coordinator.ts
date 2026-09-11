import type { Character, VoiceEvent } from '../types';

import {
  AvatarAnimationController,
} from './avatar-controller';

import type {
  MouthShape,
  LipSyncState,
} from './avatar-animation';

export interface LipSyncEvent {
  characterId: string;
  timestamp: number;
  mouthShape: MouthShape;
  amplitude: number;
  phoneme?: string;
  duration: number;
  measured?: boolean;
}

export type LipSyncListener = (
  event: LipSyncEvent,
) => void;

/**
 * Coordinates voice timing/audio information with normalized
 * avatar animation data.
 *
 * Architecture:
 *
 * VoiceService
 *      ↓
 * VoiceEvent
 *      ↓
 * LipSyncCoordinator
 *      ↓
 * normalized LipSyncEvent
 *      ↓
 * AvatarAnimationController
 *      ↓
 * renderer / animation adapter
 *
 * IMPORTANT:
 *
 * This coordinator does NOT know how a renderer draws a mouth.
 *
 * It only converts voice information into normalized animation
 * intent such as:
 *
 * - closed
 * - open-small
 * - open-medium
 * - open-large
 * - smile
 * - pursed
 *
 * A renderer is responsible for translating those values into
 * SVG, CSS, Canvas, Live2D, 3D morph targets, etc.
 */
export class LipSyncCoordinator {
  private readonly characterId: string;

  private readonly listeners =
    new Set<LipSyncListener>();

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
   * The controller is optional so the coordinator remains useful
   * in isolation and for testing.
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

    const amplitude = this.normalizeAmplitude(
      event.amplitude,
    );

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
      measured: event.measured,
    };

    this.currentMouthShape = mouthShape;
    this.lastAmplitude = amplitude;

    this.emitLipSyncEvent(lipSyncEvent);

    /**
     * Forward normalized animation information to the animation
     * controller when one is connected.
     *
     * No renderer-specific code is involved here.
     */
    if (this.animationController) {
      const animationState: LipSyncState = {
        mouthShape,
        amplitude,
        timestamp: event.timestamp,
        duration: event.duration ?? 100,
        phoneme: event.phoneme,
        measured: event.measured,
      };

      this.animationController.setLipSyncState(
        animationState,
      );
    }
  }

  /**
   * Convert potentially missing/out-of-range amplitude values
   * into a predictable 0..1 range.
   */
  private normalizeAmplitude(
    amplitude: number | undefined,
  ): number {
    if (
      typeof amplitude !== 'number' ||
      !Number.isFinite(amplitude)
    ) {
      return 0;
    }

    return Math.min(
      1,
      Math.max(0, amplitude),
    );
  }

  /**
   * Resolve normalized mouth animation intent.
   *
   * Priority:
   *
   * 1. Explicit phoneme information.
   * 2. Audio/timing amplitude.
   */
  private resolveMouthShape(
    event: VoiceEvent,
    amplitude: number,
  ): MouthShape {
    const phoneme =
      event.phoneme
        ?.trim()
        .toLowerCase();

    if (phoneme) {
      const phonemeShape =
        this.getPhonemeMouthShape(
          phoneme,
        );

      if (phonemeShape) {
        return phonemeShape;
      }
    }

    if (
      event.type === 'end' ||
      event.type === 'pause'
    ) {
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
   * Basic provider-agnostic phoneme → animation mapping.
   *
   * This is an animation-intent mapping, not a renderer mapping.
   */
  private getPhonemeMouthShape(
    phoneme: string,
  ): MouthShape | undefined {
    if (
      [
        'a',
        'ɑ',
        'æ',
        'ā',
        'á',
      ].includes(phoneme)
    ) {
      return 'open-large';
    }

    if (
      [
        'e',
        'ɛ',
        'i',
        'ɪ',
        'ə',
        'əː',
      ].includes(phoneme)
    ) {
      return 'open-medium';
    }

    if (
      [
        'o',
        'ɔ',
        'u',
        'ʊ',
      ].includes(phoneme)
    ) {
      return 'open-medium';
    }

    if (
      [
        'm',
        'b',
        'p',
      ].includes(phoneme)
    ) {
      return 'pursed';
    }

    if (
      [
        'f',
        'v',
      ].includes(phoneme)
    ) {
      return 'pursed';
    }

    if (
      [
        's',
        'z',
        'ʃ',
        'ʒ',
      ].includes(phoneme)
    ) {
      return 'open-small';
    }

    if (
      [
        'l',
        'r',
        'n',
        't',
        'd',
        'k',
        'g',
      ].includes(phoneme)
    ) {
      return 'open-small';
    }

    return undefined;
  }

  /**
   * Emit normalized lip-sync information to subscribers.
   */
  private emitLipSyncEvent(
    event: LipSyncEvent,
  ): void {
    this.listeners.forEach(
      (listener) => {
        listener(event);
      },
    );
  }

  /**
   * Subscribe to normalized lip-sync changes.
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
   * Current normalized mouth animation intent.
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
   * Timestamp of latest processed voice event.
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
   * Clear buffered voice events.
   */
  clearBuffer(): void {
    this.voiceEventBuffer.length = 0;
  }

  /**
   * Reset complete lip-sync state.
   */
  reset(): void {
    this.lastAmplitude = 0;
    this.currentMouthShape = 'closed';
    this.lastVoiceTimestamp = Date.now();

    this.voiceEventBuffer.length = 0;

    const resetEvent: LipSyncEvent = {
      characterId: this.characterId,
      timestamp: this.lastVoiceTimestamp,
      mouthShape: 'closed',
      amplitude: 0,
      duration: 0,
    };

    this.emitLipSyncEvent(resetEvent);

    if (this.animationController) {
      this.animationController.setLipSyncState({
        mouthShape: 'closed',
        amplitude: 0,
        timestamp: this.lastVoiceTimestamp,
        duration: 0,
      });
    }
  }

  /**
   * Expose the optional animation controller.
   */
  getAnimationController():
    | AvatarAnimationController
    | undefined {
    return this.animationController;
  }
}

/**
 * Factory used by character/chat orchestration.
 */
export function createLipSyncCoordinator(
  character: Character,
): LipSyncCoordinator {
  return new LipSyncCoordinator(
    character.id,
  );
}
