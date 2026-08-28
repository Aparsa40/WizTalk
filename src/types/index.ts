export interface Character {
  id: string;
  name: string;
  displayName: string;
  description: string;
  role: string;
  personality: string;
  greeting: string;
  systemInstructions: string;
  avatar: string;
  enabled: boolean;
}

export type Provider = 'local' | 'gemini' | 'openai';

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
  openAiKey: string;
  model: string;
  userProfile: UserProfile;
}
