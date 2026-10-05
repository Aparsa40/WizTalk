import React, { useEffect, useState } from 'react';
import { AppState, Character } from './types';
import { CharacterService } from './services/character';
import { CharacterSelector } from './components/CharacterSelector';
import { ChatUI } from './components/ChatUI';
import { CharacterSettings } from './components/CharacterSettings';
import { Settings } from './components/Settings';
import { AuthScreen } from './components/AuthScreen';
import { ApiService } from './services/api';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [appState, setAppState] = useState<AppState>(() => ({ selectedCharacterId: null, provider: 'local', model: 'faq-keyword-v1', voiceEnabled: true, userProfile: { name: '', preferredAddress: '', interests: [], notes: '' } }));
  const [showSettings, setShowSettings] = useState(false);
  const [showCharacterSettings, setShowCharacterSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setCharacters(await CharacterService.list()); }
    catch (e) { setError(e instanceof Error ? e.message : 'بارگذاری شخصیت‌ها ناموفق بود.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void ApiService.authStatus().then((status) => {
      setAuthenticated(status.authenticated);
      if (status.authenticated) {
        void Promise.all([load(), ApiService.getPreferences(), ApiService.getProfile()])
          .then(([, preferences, profile]) => {
            setAppState((current) => ({
              ...current,
              selectedCharacterId: preferences.selectedCharacterId,
              voiceEnabled: preferences.voiceEnabled,
              userProfile: profile,
            }));
          })
          .catch((error) => setError(error instanceof Error ? error.message : 'بارگذاری اطلاعات حساب ناموفق بود.'));
      } else setLoading(false);
    }).catch(() => { setAuthenticated(false); setLoading(false); });
  }, []);

  const update = (updates: Partial<AppState>) => {
    const next = { ...appState, ...updates };
    setAppState(next);
    void ApiService.savePreferences({
      selectedCharacterId: next.selectedCharacterId,
      voiceEnabled: next.voiceEnabled,
    });
    if (updates.userProfile) void ApiService.saveProfile(next.userProfile);
  };

  const saveCharacterSettings = async (updated: Character) => {
    const saved = await CharacterService.saveUserSettings(updated);
    setCharacters((current) => current.map((item) => item.identity.id === saved.identity.id ? saved : item));
  };

  const selected = characters.find((character) => character.identity.id === appState.selectedCharacterId);

  if (authenticated === null || loading) {
    return <div dir="rtl" className="flex min-h-[100dvh] items-center justify-center bg-[#12091f] text-amber-300">در حال آماده‌سازی WizTalk…</div>;
  }

  if (!authenticated) return <AuthScreen onAuthenticated={() => { setAuthenticated(true); void load(); }} />;

  if (error) {
    return <div dir="rtl" className="flex min-h-[100dvh] items-center justify-center bg-[#12091f] p-6 text-amber-50"><div className="text-center"><p>{error}</p><button type="button" onClick={()=>void load()} className="mt-4 rounded-xl bg-amber-500 px-5 py-3 font-bold text-[#21102e]">تلاش دوباره</button></div></div>;
  }

  return <div dir="rtl" className="font-sans">
    {selected ? (
      <ChatUI character={selected} onBack={() => update({ selectedCharacterId: null })} onOpenSettings={() => setShowCharacterSettings(true)} />
    ) : (
      <CharacterSelector
        characters={characters}
        onSelect={(character) => update({ selectedCharacterId: character.identity.id })}
        onManage={() => setShowSettings(true)}
        onLogout={async () => { await ApiService.logout(); setAuthenticated(false); setAppState((current)=>({...current,selectedCharacterId:null})); }}
      />
    )}

    {showSettings && <Settings appState={appState} characters={characters} onCharactersChange={setCharacters} onUpdateState={update} onClose={() => setShowSettings(false)} />}
    {showCharacterSettings && selected && <CharacterSettings character={selected} onSave={saveCharacterSettings} onClose={() => setShowCharacterSettings(false)} />}
  </div>;
}
