import type { ReactElement } from 'react';

export type Provider = 'local' | 'openrouter' | 'huggingface';

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export type AvatarType =
  | 'portrait'
  | 'illustration'
  | 'animated-2d'
  | 'svg'
  | 'video'
  | 'live2d'
  | 'canvas-3d';

export type VoiceProvider = 'browser' | 'external';

export interface PersonalityConfig {
  description: string;
  behavior: string;
  tone: string;
  communicationStyle: string;
}

export interface AvatarPreset {
  id: string;
  name: string;
  avatarSource: string;
  backgroundSource: string;
}

export interface AvatarConfig {
  type: AvatarType;
  source: string;
  fallbackSource?: string;
  idleSource?: string;
  listeningSource?: string;
  thinkingSource?: string;
  speakingSource?: string;
  errorSource?: string;
  backgroundSource?: string;
  presetId?: string;
  presets?: AvatarPreset[];
  animationSpeed?: 'slow' | 'normal' | 'fast';
  customAnimationData?: Record<string, unknown>;
}

export interface ChatModelConfig {
  provider: Provider;
  model: string;
  enabled?: boolean;
}

export interface TextModelsConfig {
  primary: ChatModelConfig;
  secondary: ChatModelConfig;
  /**
   * @deprecated Compatibility alias for legacy code during the model-pair migration.
   * New runtime code should use primary/secondary.
   */
  [key: string]: any;
}

/** TTS/output configuration is intentionally separate from voice response models. */
export interface VoiceConfig {
  provider: VoiceProvider;
  voiceId?: string;
  language: string;
  enabled: boolean;
  speechRate?: number;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string | null;
}

/** Voice Chat has its own model pair; output TTS is the final rendering layer. */
export interface VoiceModelsConfig {
  primary: ChatModelConfig;
  secondary: ChatModelConfig;
  output: VoiceConfig;
  /**
   * @deprecated Compatibility alias for legacy browser TTS/character settings code.
   * New runtime code should use output for TTS and primary/secondary for Voice Chat.
   */
  [key: string]: any;
}

export interface FAQItem {
  question?: string;
  keywords: string[];
  response: string;
  answer?: string;
  category?: string;
}

export interface FAQKnowledge {
  source?: 'shared';
  entries?: FAQItem[];
}

export interface RawKnowledge {
  content: string;
}

export interface KnowledgeSource {
  type: string;
  [key: string]: unknown;
}

export interface CharacterKnowledge {
  faq: FAQKnowledge;
  raw: RawKnowledge;
  sources: Record<string, KnowledgeSource>;
}

export interface CharacterIdentity {
  id: string;
  name: string;
  displayName: string;
  description: string;
  role: string;
  personality: PersonalityConfig;
  greeting: string;
  systemInstructions: string;
}

export interface CharacterSettings {
  enabled: boolean;
  source?: 'builtin' | 'custom';
}

export interface Character {
  identity: CharacterIdentity;
  avatar: AvatarConfig;
  knowledge: CharacterKnowledge;
  textModels: TextModelsConfig;
  voiceModels: VoiceModelsConfig;
  settings: CharacterSettings;
}

export interface LegacyCharacter {
  id: string;
  name: string;
  displayName: string;
  description: string;
  role: string;
  personality: PersonalityConfig;
  greeting: string;
  systemInstructions: string;
  avatar: AvatarConfig;
  ai: ChatModelConfig;
  voice: VoiceConfig;
  enabled: boolean;
  source?: 'builtin' | 'custom';
}

export function normalizeCharacter(
  raw: Character | LegacyCharacter | Record<string, unknown>,
  source: 'builtin' | 'custom' = 'builtin',
): Character {
  const value = raw as Record<string, any>;
  const identity = value.identity ?? value;
  const personality = typeof identity.personality === 'string'
    ? { description: identity.personality, behavior: '', tone: '', communicationStyle: '' }
    : identity.personality ?? {};
  const avatar = typeof value.avatar === 'string'
    ? { type: 'portrait', source: value.avatar }
    : value.avatar ?? {};
  const faq = value.knowledge?.faq ?? { source: 'shared' };

  const legacyText = value.textModels?.default ?? value.ai ?? {};
  const primaryText = value.textModels?.primary ?? legacyText;
  const secondaryText = value.textModels?.secondary ?? {
    provider: primaryText.provider ?? 'local',
    model: primaryText.model ?? 'faq-keyword-v1',
    enabled: false,
  };

  const legacyVoiceOutput = value.voiceModels?.default ?? value.voice ?? {};
  const primaryVoice = value.voiceModels?.primary ?? {
    provider: primaryText.provider ?? 'local',
    model: primaryText.model ?? 'faq-keyword-v1',
    enabled: false,
  };
  const secondaryVoice = value.voiceModels?.secondary ?? {
    provider: primaryVoice.provider ?? 'local',
    model: primaryVoice.model ?? 'faq-keyword-v1',
    enabled: false,
  };

  const outputVoice: VoiceConfig = {
    provider: legacyVoiceOutput.provider ?? 'browser',
    language: String(legacyVoiceOutput.language ?? 'fa-IR'),
    enabled: legacyVoiceOutput.enabled !== false,
    ...legacyVoiceOutput,
  };

  return {
    identity: {
      id: String(identity.id ?? ''),
      name: String(identity.name ?? ''),
      displayName: String(identity.displayName ?? ''),
      description: String(identity.description ?? ''),
      role: String(identity.role ?? ''),
      personality: {
        description: String(personality.description ?? ''),
        behavior: String(personality.behavior ?? ''),
        tone: String(personality.tone ?? ''),
        communicationStyle: String(personality.communicationStyle ?? ''),
      },
      greeting: String(identity.greeting ?? ''),
      systemInstructions: String(identity.systemInstructions ?? ''),
    },
    avatar: {
      type: (avatar.type ?? 'portrait') as AvatarType,
      source: String(avatar.source ?? ''),
      ...avatar,
    },
    knowledge: {
      faq: {
        source: faq.source,
        entries: Array.isArray(faq.entries) ? faq.entries : undefined,
      },
      raw: { content: String(value.knowledge?.raw?.content ?? '') },
      sources: value.knowledge?.sources && typeof value.knowledge.sources === 'object'
        ? value.knowledge.sources
        : {},
    },
    textModels: {
      primary: {
        provider: primaryText.provider ?? 'local',
        model: String(primaryText.model ?? 'faq-keyword-v1'),
        enabled: primaryText.enabled !== false,
      },
      secondary: {
        provider: secondaryText.provider ?? 'local',
        model: String(secondaryText.model ?? 'faq-keyword-v1'),
        enabled: secondaryText.enabled === true,
      },
      // Keep a runtime compatibility alias so legacy CharacterForm and browser
      // TTS code can continue to read the previous `default` shape safely.
      default: {
        provider: primaryText.provider ?? 'local',
        model: String(primaryText.model ?? 'faq-keyword-v1'),
        enabled: primaryText.enabled !== false,
      },
    },
    voiceModels: {
      primary: {
        provider: primaryVoice.provider ?? 'local',
        model: String(primaryVoice.model ?? 'faq-keyword-v1'),
        enabled: primaryVoice.enabled === true,
      },
      secondary: {
        provider: secondaryVoice.provider ?? 'local',
        model: String(secondaryVoice.model ?? 'faq-keyword-v1'),
        enabled: secondaryVoice.enabled === true,
      },
      output: outputVoice,
      // Keep the old TTS alias pointing to the output configuration. This is
      // deliberately a compatibility bridge; new code should use `output`.
      default: outputVoice,
    },
    settings: {
      enabled: value.settings?.enabled ?? (value.enabled !== false),
      source: value.settings?.source ?? value.source ?? source,
    },
  };
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

export type VoiceEventType = 'start' | 'end' | 'pause' | 'resume';
export type VoiceEventSource = 'browser' | 'piper' | 'external';

export interface VoiceEvent {
  type: VoiceEventType;
  characterId: string;
  timestamp: number;
  amplitude?: number;
  phoneme?: string;
  duration?: number;
  source?: VoiceEventSource;
  measured?: boolean;
  audioLevel?: number;
}

export type VoiceEventListener = (event: VoiceEvent) => void;

export interface AvatarRenderer {
  render(state: AvatarState, config: AvatarConfig): ReactElement;
  preload?(config: AvatarConfig): Promise<void>;
}
