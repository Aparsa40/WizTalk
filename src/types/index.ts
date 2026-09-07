import type { ReactElement } from 'react';
export type Provider =
  | 'local'
  | 'gemini'
  | 'openai'
  | 'openrouter';

export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error';

export type AvatarType =
  | 'portrait'
  | 'illustration'
  | 'animated-2d'
  | 'svg'
  | 'video'
  | 'live2d'
  | 'canvas-3d';

export type VoiceProvider =
  | 'browser'
  | 'external';

export interface PersonalityConfig {
  description: string;
  behavior: string;
  tone: string;
  communicationStyle: string;
}

/**
 * Character-specific avatar configuration.
 * Each character has its own independent avatar with state-specific assets.
 * Future renderers (SVG, Canvas, Live2D, 3D) can be added without changing core systems.
 */
export interface AvatarConfig {
  type: AvatarType;
  source: string;
  fallbackSource?: string;
  idleSource?: string;
  listeningSource?: string;
  thinkingSource?: string;
  speakingSource?: string;
  errorSource?: string;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  customAnimationData?: Record<string, unknown>;
}

/**
 * Character-specific voice configuration.
 * Each character can have independent voice settings, voiceId, and speech rate.
 * Architecture supports future external voice providers.
 */
export interface VoiceConfig {
  provider: VoiceProvider;
  voiceId?: string;
  language: string;
  enabled: boolean;
  speechRate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
}

export interface AIConfig {
  provider: Provider;
  model: string;
}

/**
 * Character represents an independent AI character with its own:
 * - Avatar rendering and animation
 * - Voice configuration and synthesis
 * - AI model and provider settings
 * - Memory and conversation history
 * - Personality and interaction traits
 */
export interface Character {
  id: string;
  name: string;
  displayName: string;
  description: string;
  role: string;
  personality: PersonalityConfig;
  greeting: string;
  systemInstructions: string;
  avatar: AvatarConfig;
  ai: AIConfig;
  voice: VoiceConfig;
  enabled: boolean;
  source?: 'builtin' | 'custom';
}

export interface Message {
  id: string;
  sender: 'user' | 'character';
  text: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  preferredAddress: string;
  interests: string[];
  notes: string;
}

export interface AppState {
  selectedCharacterId: string | null;
  provider: Provider;
  model: string;
  voiceEnabled: boolean;
  userProfile: UserProfile;
}

export interface ProviderConfig {
  id: Provider;
  label: string;
  description: string;
  defaultModel: string;
  models: string[];
  requiresServerKey: boolean;
}

/**
 * Voice event emitted during speech synthesis for lip-sync synchronization.
 * Provides timing and amplitude data for future animated mouth/facial movement.
 */
export interface VoiceEvent {
  type: 'start' | 'end' | 'pause' | 'resume';
  characterId: string;
  timestamp: number;
  amplitude?: number;
  phoneme?: string;
  duration?: number;
}

/**
 * Avatar renderer interface allows different implementations (2D, SVG, Canvas, Live2D, 3D).
 * Enables swapping renderers without changing Avatar controller or Character systems.
 */
export interface AvatarRenderer {
  render(state: AvatarState, config: AvatarConfig): ReactElement;
  preload?(config: AvatarConfig): Promise<void>;
}

/**
 * Voice event listener for avatar and lip-sync synchronization.
 * Allows avatar to react to voice playback state.
 */
export type VoiceEventListener = (event: VoiceEvent) => void;
