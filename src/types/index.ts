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

export interface TextModelConfig {
  provider: Provider;
  model: string;
}

export interface TextModelsConfig {
  default: TextModelConfig;
}

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

export interface VoiceModelsConfig {
  default: VoiceConfig;
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


/**
 * ساختار قدیمی برای migration
 */
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
  ai: TextModelConfig;
  voice: VoiceConfig;
  enabled: boolean;
  source?: 'builtin' | 'custom';
}


/**
 * تبدیل Character قدیمی به ساختار جدید
 */
export function normalizeCharacter(
  raw: Character | LegacyCharacter | Record<string, unknown>,
  source: 'builtin' | 'custom' = 'builtin',
): Character {

  const value = raw as Record<string, any>;

  const identity = value.identity ?? value;

  const personality =
    typeof identity.personality === 'string'
      ? {
          description: identity.personality,
          behavior: '',
          tone: '',
          communicationStyle: '',
        }
      : identity.personality ?? {};


  const avatar =
    typeof value.avatar === 'string'
      ? {
          type: 'portrait',
          source: value.avatar,
        }
      : value.avatar ?? {};


  const faq =
    value.knowledge?.faq ?? {
      source: 'shared',
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
        communicationStyle:
          String(personality.communicationStyle ?? ''),
      },

      greeting: String(identity.greeting ?? ''),
      systemInstructions:
        String(identity.systemInstructions ?? ''),
    },


    avatar: {
      type:
        (avatar.type ?? 'portrait') as AvatarType,
      source:
        String(avatar.source ?? ''),
      ...avatar,
    },


    knowledge: {
      faq: {
        source: faq.source,
        entries:
          Array.isArray(faq.entries)
            ? faq.entries
            : undefined,
      },

      raw: {
        content:
          String(value.knowledge?.raw?.content ?? ''),
      },

      sources:
        value.knowledge?.sources &&
        typeof value.knowledge.sources === 'object'
          ? value.knowledge.sources
          : {},
    },


    textModels: {
      default: {
        provider:
          value.textModels?.default?.provider ??
          value.ai?.provider ??
          'local',

        model:
          String(
            value.textModels?.default?.model ??
            value.ai?.model ??
            'faq-keyword-v1',
          ),
      },
    },


    voiceModels: {
      default: {
        provider:
          value.voiceModels?.default?.provider ??
          value.voice?.provider ??
          'browser',

        language:
          String(
            value.voiceModels?.default?.language ??
            value.voice?.language ??
            'fa-IR',
          ),

        enabled:
          value.voiceModels?.default?.enabled ??
          (value.voice?.enabled !== false),

        ...(value.voice ?? {}),
        ...(value.voiceModels?.default ?? {}),
      },
    },


    settings: {
      enabled:
        value.settings?.enabled ??
        (value.enabled !== false),

      source:
        value.settings?.source ??
        value.source ??
        source,
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


export type VoiceEventType =
  | 'start'
  | 'end'
  | 'pause'
  | 'resume';


export type VoiceEventSource =
  | 'browser'
  | 'piper'
  | 'external';


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


export type VoiceEventListener =
  (event: VoiceEvent) => void;


export interface AvatarRenderer {

  render(
    state: AvatarState,
    config: AvatarConfig,
  ): ReactElement;


  preload?(
    config: AvatarConfig,
  ): Promise<void>;
}
