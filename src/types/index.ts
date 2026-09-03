```ts
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

export interface PersonalityConfig {
  description: string;
  behavior: string;
  tone: string;
  communicationStyle: string;
}

export interface AvatarConfig {
  type:
    | 'portrait'
    | 'illustration'
    | 'svg'
    | 'video';
  source: string;
  idleSource?: string;
  listeningSource?: string;
  thinkingSource?: string;
  speakingSource?: string;
}

export interface VoiceConfig {
  provider: 'browser';
  voiceId?: string;
  language: string;
  enabled: boolean;
}

export interface AIConfig {
  provider: Provider;
  model: string;
}

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
```
