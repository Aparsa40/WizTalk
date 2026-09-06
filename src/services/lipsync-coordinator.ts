import { Character, VoiceEvent } from '../types';
import { AvatarAnimationController } from './avatar-controller';

/**
 * Lip-Sync Coordinator Architecture
 * 
 * Prepares framework for future lip-synchronization without requiring complex
 * phoneme analysis. Provides:
 * - Voice event tracking and timing
 * - Mouth shape prediction from speech rate and amplitude
 * - Coordinate system for avatar animation and facial features
 * - Support for future phoneme detection and Live2D/3D integration
 * 
 * Current implementation uses amplitude-based mouth opening.
 * Future enhancements:
 * - Phoneme detection from audio analysis
 * - Viseme (visual phoneme) mapping
 * - Live2D parameter binding
 * - 3D character mouth/face animation
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

/**
 * Voice event listener for lip-sync coordination
 */
export type LipSyncListener = (event: LipSyncEvent) => void;

/**
 * Lip-Sync Coordinator
 * 
 * Analyzes voice events and coordinates avatar mouth/facial animation.
 * Decoupled from rendering to support multiple avatar implementations.
 */
export class LipSyncCoordinator {
  private characterId: string;
  private listeners = new Set<LipSyncListener>();
  private lastAmplitude = 0;
  private voiceEventBuffer: VoiceEvent[] = [];
  private animationController?: AvatarAnimationController;

  constructor(characterId: string) {
    this.characterId = characterId;
  }

  /**
   * Set avatar animation controller for state coordination
   */
  setAnimationController(controller: AvatarAnimationController): void {
    this.animationController = controller;
  }

  /**
   * Process voice event and emit lip-sync events
   */
  processVoiceEvent(event: VoiceEvent): void {
    if (event.characterId !== this.characterId) return;

    this.voiceEventBuffer.push(event);
    
    // Predict mouth shape based on voice event
    const mouthShape = this.predictMouthShape(event);
    const lipSyncEvent: LipSyncEvent = {
      characterId: this.characterId,
      timestamp: event.timestamp,
      mouthShape,
      amplitude: event.amplitude ?? 0.5,
      phoneme: event.phoneme,
      duration: event.duration ?? 100,
    };

    this.emitLipSyncEvent(lipSyncEvent);
  }

  /**
   * Predict mouth shape from voice event
   * 
   * Current implementation uses simple amplitude-based heuristics.
   * Future versions can use:
   * - Phoneme-to-viseme mapping
   * - Audio frequency analysis
   * - Machine learning models
   */
  private predictMouthShape(event: VoiceEvent): MouthShape {
    const amplitude = event.amplitude ?? 0.5;

    // Map amplitude to mouth shape
    if (amplitude < 0.2) return 'closed';
    if (amplitude < 0.4) return 'open-small';
    if (amplitude < 0.7) return 'open-medium';
    if (amplitude < 0.9) return 'open-large';
    
    // High amplitude - special handling for specific phonemes
    if (event.phoneme) {
      // Vowels typically have wider mouth openings
      if (['a', 'e', 'i', 'o', 'u'].includes(event.phoneme.toLowerCase())) {
        return 'open-large';
      }
      // Lip-rounding consonants (f, v, m, b, p)
      if (['f', 'v', 'm', 'b', 'p'].includes(event.phoneme.toLowerCase())) {
        return 'pursed';
      }
    }

    return 'open-large';
  }

  /**
   * Emit lip-sync event to all listeners
   */
  private emitLipSyncEvent(event: LipSyncEvent): void {
    this.lastAmplitude = event.amplitude;
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Subscribe to lip-sync events
   */
  subscribe(listener: LipSyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current mouth shape
   */
  getCurrentMouthShape(): MouthShape {
    return this.lastAmplitude < 0.1 ? 'closed' : 'open-small';
  }

  /**
   * Get voice event buffer for analysis
   */
  getVoiceEventBuffer(limit: number = 100): VoiceEvent[] {
    return this.voiceEventBuffer.slice(-limit);
  }

  /**
   * Clear voice event buffer
   */
  clearBuffer(): void {
    this.voiceEventBuffer = [];
  }

  /**
   * Reset lip-sync state
   */
  reset(): void {
    this.lastAmplitude = 0;
    this.voiceEventBuffer = [];
    this.listeners.forEach((listener) =>
      listener({
        characterId: this.characterId,
        timestamp: Date.now(),
        mouthShape: 'closed',
        amplitude: 0,
        duration: 0,
      })
    );
  }
}

/**
 * Mouth shape CSS classes for rendering
 */
export const mouthShapeClasses: Record<MouthShape, string> = {
  closed: 'mouth-closed',
  'open-small': 'mouth-open-small',
  'open-medium': 'mouth-open-medium',
  'open-large': 'mouth-open-large',
  smile: 'mouth-smile',
  pursed: 'mouth-pursed',
};

/**
 * Mouth shape SVG generator for future 2D/3D avatars
 */
export function getMouthShapeSVG(shape: MouthShape, width: number = 40, height: number = 20): string {
  const paths: Record<MouthShape, string> = {
    closed: `M ${width * 0.2} ${height * 0.5} Q ${width * 0.5} ${height * 0.4} ${width * 0.8} ${height * 0.5}`,
    'open-small': `M ${width * 0.2} ${height * 0.5} Q ${width * 0.5} ${height * 0.7} ${width * 0.8} ${height * 0.5}`,
    'open-medium': `M ${width * 0.2} ${height * 0.3} Q ${width * 0.5} ${height * 0.9} ${width * 0.8} ${height * 0.3}`,
    'open-large': `M ${width * 0.1} ${height * 0.2} Q ${width * 0.5} ${height} ${width * 0.9} ${height * 0.2}`,
    smile: `M ${width * 0.2} ${height * 0.4} Q ${width * 0.5} ${height * 0.8} ${width * 0.8} ${height * 0.4}`,
    pursed: `M ${width * 0.3} ${height * 0.4} Q ${width * 0.5} ${height * 0.6} ${width * 0.7} ${height * 0.4}`,
  };

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <path d="${paths[shape]}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`;
}

/**
 * Create lip-sync coordinator for character
 */
export function createLipSyncCoordinator(character: Character): LipSyncCoordinator {
  return new LipSyncCoordinator(character.id);
}
