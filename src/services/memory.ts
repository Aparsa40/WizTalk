import { Message, UserProfile, AppState } from '../types';

const STORAGE_KEYS = {
  MESSAGES: 'wiztalk_messages',
  USER_PROFILE: 'wiztalk_profile',
  APP_STATE: 'wiztalk_state'
};

export class MemoryService {
  // Messages
  static getMessages(characterId: string): Message[] {
    const data = localStorage.getItem(`${STORAGE_KEYS.MESSAGES}_${characterId}`);
    return data ? JSON.parse(data) : [];
  }

  static saveMessage(characterId: string, message: Message) {
    const messages = this.getMessages(characterId);
    messages.push(message);
    localStorage.setItem(`${STORAGE_KEYS.MESSAGES}_${characterId}`, JSON.stringify(messages));
  }

  static clearMessages(characterId: string) {
    localStorage.removeItem(`${STORAGE_KEYS.MESSAGES}_${characterId}`);
  }

  // User Profile
  static getUserProfile(): UserProfile {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : {
      name: '',
      preferredAddress: '',
      interests: [],
      notes: ''
    };
  }

  static saveUserProfile(profile: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  // App State (Settings, Provider)
  static getAppState(): AppState {
    const data = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    return data ? JSON.parse(data) : {
      selectedCharacterId: null,
      provider: 'local',
      openAiKey: '',
      model: '',
      userProfile: this.getUserProfile()
    };
  }

  static saveAppState(state: AppState) {
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
  }
}
