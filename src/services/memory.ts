import { AppState, Message, UserProfile } from '../types';

const STORAGE_KEYS = {
  MESSAGES: 'wiztalk_messages',
  USER_PROFILE: 'wiztalk_profile',
  APP_STATE: 'wiztalk_state',
};

const defaultProfile: UserProfile = { name: '', preferredAddress: '', interests: [], notes: '' };
const defaultState: AppState = {
  selectedCharacterId: null,
  provider: 'local',
  model: 'faq-keyword-v1',
  voiceEnabled: true,
  userProfile: defaultProfile,
};

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch (error) {
    console.warn('WizTalk memory read failed for ' + key, error);
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('WizTalk memory write failed for ' + key, error);
  }
}

export interface MemoryStore {
  getMessages(characterId: string): Message[];
  saveMessage(characterId: string, message: Message): void;
  clearMessages(characterId: string): void;
  getUserProfile(): UserProfile;
  saveUserProfile(profile: UserProfile): void;
  getAppState(): AppState;
  saveAppState(state: AppState): void;
}

export class LocalStorageMemory implements MemoryStore {
  getMessages(characterId: string): Message[] {
    return read<Message[]>(STORAGE_KEYS.MESSAGES + '_' + characterId, []);
  }

  saveMessage(characterId: string, message: Message): void {
    const messages = this.getMessages(characterId);
    write(STORAGE_KEYS.MESSAGES + '_' + characterId, [...messages, message]);
  }

  clearMessages(characterId: string): void {
    try { localStorage.removeItem(STORAGE_KEYS.MESSAGES + '_' + characterId); } catch (error) { console.warn('Could not clear messages', error); }
  }

  getUserProfile(): UserProfile { return read(STORAGE_KEYS.USER_PROFILE, defaultProfile); }
  saveUserProfile(profile: UserProfile): void { write(STORAGE_KEYS.USER_PROFILE, profile); }

  getAppState(): AppState {
    const stored = read<Partial<AppState>>(STORAGE_KEYS.APP_STATE, {});
    return { ...defaultState, ...stored, userProfile: { ...defaultProfile, ...stored.userProfile } };
  }

  saveAppState(state: AppState): void { write(STORAGE_KEYS.APP_STATE, state); }
}

export const memoryStore = new LocalStorageMemory();
export const MemoryService = memoryStore;
