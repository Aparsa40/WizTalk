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
*
* Each character owns an independent avatar configuration.
* The renderer can later be implemented with SVG, Canvas, Live2D,
* or a 3D renderer without changing the character model.
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
*
* Browser SpeechSynthesis is currently supported.
* External providers such as Piper can be introduced without
* changing the Character interface.
  */
  export interface VoiceConfig {
  provider: VoiceProvider;
  voiceId?: string;
  language: string;
  enabled: boolean;
  speechRate?: number;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  }

/**

* AI provider and model configuration.
  */
  export interface AIConfig {
  provider: Provider;
  model: string;
  }

/**

* Character represents an independent AI character with its own:
*
* * Avatar rendering and animation
* * Voice configuration and synthesis
* * AI model and provider settings
* * Memory and conversation history
* * Personality and interaction traits
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

* Voice lifecycle event types.
*
* "resume" is also used by the current browser TTS implementation
* for speech-boundary updates because SpeechSynthesis does not expose
* a dedicated phoneme event.
  */
  export type VoiceEventType =
  | 'start'
  | 'end'
  | 'pause'
  | 'resume';

/**

* Source of the audio/timing information represented by a VoiceEvent.
*
* Browser TTS currently provides timing/heuristic information.
* External providers such as Piper can later provide real audio data.
  */
  export type VoiceEventSource =
  | 'browser'
  | 'piper'
  | 'external';

/**

* Voice event emitted during speech playback.
*
* The current browser implementation uses timing and estimated amplitude.
* Future local/external audio providers can populate the additional
* audio-analysis fields without changing the event contract.
  */
  export interface VoiceEvent {
  type: VoiceEventType;
  characterId: string;
  timestamp: number;

/**

* Normalized speech amplitude in the range 0..1 when available.
  */
  amplitude?: number;

/**

* Optional phoneme/viseme hint produced by the voice provider.
  */
  phoneme?: string;

/**

* Duration represented by this event in milliseconds.
  */
  duration?: number;

/**

* Identifies where the event originated.
  */
  source?: VoiceEventSource;

/**

* True when amplitude represents measured audio rather than
* a timing/phonetic estimate.
  */
  measured?: boolean;

/**

* Optional normalized audio level for Web Audio based providers.
*
* This is intentionally separate from amplitude so future
* audio-analysis pipelines can evolve independently.
  */
  audioLevel?: number;
  }

/**

* Voice event listener for avatar and lip-sync synchronization.
  */
  export type VoiceEventListener = (
  event: VoiceEvent
  ) => void;

/**

* Avatar renderer interface allows different implementations
* (2D, SVG, Canvas, Live2D, 3D).
  */
  export interface AvatarRenderer {
  render(
  state: AvatarState,
  config: AvatarConfig
  ): ReactElement;

preload?(
config: AvatarConfig
): Promise<void>;
}
